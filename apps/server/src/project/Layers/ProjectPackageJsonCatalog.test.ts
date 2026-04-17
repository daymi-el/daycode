import * as NodeServices from "@effect/platform-node/NodeServices";
import { describe, expect, it } from "@effect/vitest";
import { Effect, FileSystem, Layer, Path } from "effect";

import { WorkspaceEntriesLive } from "../../workspace/Layers/WorkspaceEntries.ts";
import { WorkspacePathsLive } from "../../workspace/Layers/WorkspacePaths.ts";
import { ProjectPackageJsonCatalog } from "../Services/ProjectPackageJsonCatalog.ts";
import { ProjectPackageJsonCatalogLive } from "./ProjectPackageJsonCatalog.ts";

const workspaceServicesLayer = Layer.mergeAll(
  WorkspacePathsLive,
  WorkspaceEntriesLive.pipe(Layer.provide(WorkspacePathsLive)),
).pipe(Layer.provideMerge(NodeServices.layer));

const TestLayer = ProjectPackageJsonCatalogLive.pipe(Layer.provideMerge(workspaceServicesLayer));

const makeTempDir = Effect.gen(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  return yield* fileSystem.makeTempDirectoryScoped({
    prefix: "t3code-project-package-json-catalog-",
  });
});

const writeTextFile = Effect.fn("ProjectPackageJsonCatalog.test.writeTextFile")(function* (
  cwd: string,
  relativePath: string,
  contents: string,
) {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const absolutePath = path.join(cwd, relativePath);
  yield* fileSystem
    .makeDirectory(path.dirname(absolutePath), { recursive: true })
    .pipe(Effect.orDie);
  yield* fileSystem.writeFileString(absolutePath, contents).pipe(Effect.orDie);
});

it.layer(TestLayer)("ProjectPackageJsonCatalogLive", (it) => {
  describe("listPackageJsonScripts", () => {
    it.effect(
      "returns sorted importable package.json files and skips ignored or malformed entries",
      () =>
        Effect.gen(function* () {
          const catalog = yield* ProjectPackageJsonCatalog;
          const cwd = yield* makeTempDir;

          yield* writeTextFile(
            cwd,
            "package.json",
            JSON.stringify({
              name: "repo-root",
              packageManager: "pnpm@9.0.0",
              scripts: {
                dev: "vite",
                test: "vitest",
                ignored: 42,
              },
            }),
          );
          yield* writeTextFile(
            cwd,
            "apps/web/package.json",
            '{"name":"@repo/web","scripts":{"build":"vite build"}}',
          );
          yield* writeTextFile(cwd, "apps/web/yarn.lock", "");
          yield* writeTextFile(cwd, "apps/api/package.json", "{not-valid-json");
          yield* writeTextFile(cwd, "packages/empty/package.json", JSON.stringify({ scripts: {} }));
          yield* writeTextFile(
            cwd,
            "node_modules/ignored/package.json",
            JSON.stringify({ scripts: { dev: "ignored" } }),
          );
          yield* writeTextFile(
            cwd,
            "dist/ignored/package.json",
            JSON.stringify({ scripts: { build: "ignored" } }),
          );

          const result = yield* catalog.listPackageJsonScripts({ cwd });

          expect(result.packageJsons).toEqual([
            {
              relativePath: "package.json",
              packageName: "repo-root",
              packageManager: "pnpm",
              scripts: [
                { name: "dev", command: "vite" },
                { name: "test", command: "vitest" },
              ],
            },
            {
              relativePath: "apps/web/package.json",
              packageName: "@repo/web",
              packageManager: "yarn",
              scripts: [{ name: "build", command: "vite build" }],
            },
          ]);
        }),
    );

    it.effect("uses the nearest lockfile when packageManager is not declared", () =>
      Effect.gen(function* () {
        const catalog = yield* ProjectPackageJsonCatalog;
        const cwd = yield* makeTempDir;

        yield* writeTextFile(cwd, "bun.lock", "");
        yield* writeTextFile(cwd, "apps/package-lock.json", "");
        yield* writeTextFile(cwd, "packages/yarn.lock", "");
        yield* writeTextFile(
          cwd,
          "apps/web/package.json",
          JSON.stringify({ scripts: { dev: "vite" } }),
        );
        yield* writeTextFile(
          cwd,
          "packages/docs/package.json",
          JSON.stringify({ scripts: { start: "vite preview" } }),
        );

        const result = yield* catalog.listPackageJsonScripts({ cwd });

        expect(result.packageJsons).toEqual([
          {
            relativePath: "apps/web/package.json",
            packageName: null,
            packageManager: "npm",
            scripts: [{ name: "dev", command: "vite" }],
          },
          {
            relativePath: "packages/docs/package.json",
            packageName: null,
            packageManager: "yarn",
            scripts: [{ name: "start", command: "vite preview" }],
          },
        ]);
      }),
    );
  });
});
