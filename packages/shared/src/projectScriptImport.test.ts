import { describe, expect, it } from "vitest";

import {
  buildImportedProjectScriptCommand,
  buildImportedProjectScriptName,
  importedProjectScriptDirectory,
  inferImportedProjectScriptIcon,
} from "./projectScriptImport.ts";

describe("projectScriptImport helpers", () => {
  it("derives action names for root and nested package.json files", () => {
    expect(
      buildImportedProjectScriptName({
        relativePath: "package.json",
        scriptName: "dev",
      }),
    ).toBe("dev");
    expect(
      buildImportedProjectScriptName({
        relativePath: "apps/web/package.json",
        scriptName: "dev",
      }),
    ).toBe("apps/web:dev");
  });

  it("builds package-manager-aware commands for root and nested packages", () => {
    expect(
      buildImportedProjectScriptCommand({
        relativePath: "package.json",
        packageManager: "bun",
        scriptName: "lint",
      }),
    ).toBe("bun run lint");
    expect(
      buildImportedProjectScriptCommand({
        relativePath: "apps/web/package.json",
        packageManager: "npm",
        scriptName: "build",
      }),
    ).toBe('npm --prefix "apps/web" run build');
    expect(
      buildImportedProjectScriptCommand({
        relativePath: "packages/shared/package.json",
        packageManager: "pnpm",
        scriptName: "typecheck",
      }),
    ).toBe('pnpm --dir "packages/shared" run typecheck');
    expect(
      buildImportedProjectScriptCommand({
        relativePath: "apps/server/package.json",
        packageManager: "yarn",
        scriptName: "test",
      }),
    ).toBe('yarn --cwd "apps/server" run test');
  });

  it("infers icons from common script names", () => {
    expect(inferImportedProjectScriptIcon("test")).toBe("test");
    expect(inferImportedProjectScriptIcon("lint")).toBe("lint");
    expect(inferImportedProjectScriptIcon("build")).toBe("build");
    expect(inferImportedProjectScriptIcon("debug:watch")).toBe("debug");
    expect(inferImportedProjectScriptIcon("prepare")).toBe("configure");
    expect(inferImportedProjectScriptIcon("dev")).toBe("play");
  });

  it("extracts the package directory from a package.json path", () => {
    expect(importedProjectScriptDirectory("package.json")).toBeNull();
    expect(importedProjectScriptDirectory("apps/web/package.json")).toBe("apps/web");
  });
});
