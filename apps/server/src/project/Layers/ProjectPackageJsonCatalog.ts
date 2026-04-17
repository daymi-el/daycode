import type {
  ProjectListPackageJsonScriptsResult,
  ProjectPackageJsonDescriptor,
  ProjectPackageJsonScript,
  ProjectPackageManager,
} from "@t3tools/contracts";
import { Effect, FileSystem, Layer, Path } from "effect";

import { WorkspaceEntries } from "../../workspace/Services/WorkspaceEntries.ts";
import { WorkspacePaths } from "../../workspace/Services/WorkspacePaths.ts";
import {
  ProjectPackageJsonCatalog,
  type ProjectPackageJsonCatalogShape,
} from "../Services/ProjectPackageJsonCatalog.ts";

const LOCKFILE_PACKAGE_MANAGERS = [
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["package-lock.json", "npm"],
  ["npm-shrinkwrap.json", "npm"],
] as const satisfies ReadonlyArray<readonly [string, ProjectPackageManager]>;

function parsePackageManager(value: unknown): ProjectPackageManager | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "bun" || normalized.startsWith("bun@")) return "bun";
  if (normalized === "npm" || normalized.startsWith("npm@")) return "npm";
  if (normalized === "pnpm" || normalized.startsWith("pnpm@")) return "pnpm";
  if (normalized === "yarn" || normalized.startsWith("yarn@")) return "yarn";
  return null;
}

function comparePackageJsonDescriptors(
  left: ProjectPackageJsonDescriptor,
  right: ProjectPackageJsonDescriptor,
): number {
  const leftIsRoot = left.relativePath === "package.json";
  const rightIsRoot = right.relativePath === "package.json";
  if (leftIsRoot !== rightIsRoot) {
    return leftIsRoot ? -1 : 1;
  }

  const leftDepth = left.relativePath.split("/").length;
  const rightDepth = right.relativePath.split("/").length;
  if (leftDepth !== rightDepth) {
    return leftDepth - rightDepth;
  }

  return left.relativePath.localeCompare(right.relativePath);
}

function toImportableScripts(value: unknown): ProjectPackageJsonScript[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value)
    .flatMap(([name, command]) => {
      const trimmedName = name.trim();
      const trimmedCommand = typeof command === "string" ? command.trim() : "";
      if (trimmedName.length === 0 || trimmedCommand.length === 0) {
        return [];
      }
      return [{ name: trimmedName, command: trimmedCommand }] satisfies ProjectPackageJsonScript[];
    })
    .toSorted((left, right) => left.name.localeCompare(right.name));
}

export const makeProjectPackageJsonCatalog = Effect.gen(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const workspaceEntries = yield* WorkspaceEntries;
  const workspacePaths = yield* WorkspacePaths;

  const hasFile = Effect.fn("ProjectPackageJsonCatalog.hasFile")(function* (
    absolutePath: string,
  ): Effect.fn.Return<boolean> {
    return yield* fileSystem.stat(absolutePath).pipe(
      Effect.map((stat) => stat.type === "File"),
      Effect.catch(() => Effect.succeed(false)),
    );
  });

  const detectPackageManagerFromLockfiles = Effect.fn(
    "ProjectPackageJsonCatalog.detectPackageManagerFromLockfiles",
  )(function* (
    workspaceRoot: string,
    relativePackageJsonPath: string,
  ): Effect.fn.Return<ProjectPackageManager> {
    const parentPath = relativePackageJsonPath.includes("/")
      ? relativePackageJsonPath.slice(0, relativePackageJsonPath.lastIndexOf("/"))
      : "";
    const pathSegments = parentPath.split("/").filter((segment) => segment.length > 0);

    for (let depth = pathSegments.length; depth >= 0; depth -= 1) {
      const currentSegments = pathSegments.slice(0, depth);
      for (const [lockfileName, packageManager] of LOCKFILE_PACKAGE_MANAGERS) {
        const candidatePath = path.join(workspaceRoot, ...currentSegments, lockfileName);
        if (yield* hasFile(candidatePath)) {
          return packageManager;
        }
      }
    }

    return "npm";
  });

  const readPackageJsonDescriptor = Effect.fn(
    "ProjectPackageJsonCatalog.readPackageJsonDescriptor",
  )(function* (
    workspaceRoot: string,
    relativePath: string,
  ): Effect.fn.Return<ProjectPackageJsonDescriptor | null> {
    const resolved = yield* workspacePaths
      .resolveRelativePathWithinRoot({
        workspaceRoot,
        relativePath,
      })
      .pipe(Effect.catch(() => Effect.succeed(null)));
    if (!resolved) {
      return null;
    }

    const raw = yield* fileSystem
      .readFileString(resolved.absolutePath)
      .pipe(Effect.catch(() => Effect.succeed(null)));
    if (raw === null) {
      return null;
    }

    const parsed = yield* Effect.sync(() => JSON.parse(raw) as unknown).pipe(
      Effect.catch(() => Effect.succeed(null)),
    );

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const packageJson = parsed as {
      name?: unknown;
      packageManager?: unknown;
      scripts?: unknown;
    };
    const scripts = toImportableScripts(packageJson.scripts);
    if (scripts.length === 0) {
      return null;
    }

    return {
      relativePath,
      packageName:
        typeof packageJson.name === "string" && packageJson.name.trim().length > 0
          ? packageJson.name.trim()
          : null,
      packageManager:
        parsePackageManager(packageJson.packageManager) ??
        (yield* detectPackageManagerFromLockfiles(workspaceRoot, relativePath)),
      scripts,
    } satisfies ProjectPackageJsonDescriptor;
  });

  const listPackageJsonScripts: ProjectPackageJsonCatalogShape["listPackageJsonScripts"] =
    Effect.fn("ProjectPackageJsonCatalog.listPackageJsonScripts")(function* (input) {
      const workspaceRoot = yield* workspacePaths.normalizeWorkspaceRoot(input.cwd);
      const packageJsonFiles = yield* workspaceEntries.listFilesByBasename({
        cwd: workspaceRoot,
        basename: "package.json",
      });
      const descriptors = yield* Effect.forEach(
        packageJsonFiles,
        (entry) => readPackageJsonDescriptor(workspaceRoot, entry.path),
        { concurrency: 8 },
      );

      return {
        packageJsons: descriptors
          .filter((entry): entry is ProjectPackageJsonDescriptor => entry !== null)
          .toSorted(comparePackageJsonDescriptors),
      } satisfies ProjectListPackageJsonScriptsResult;
    });

  return {
    listPackageJsonScripts,
  } satisfies ProjectPackageJsonCatalogShape;
});

export const ProjectPackageJsonCatalogLive = Layer.effect(
  ProjectPackageJsonCatalog,
  makeProjectPackageJsonCatalog,
);
