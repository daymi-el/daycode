import type { ProjectPackageManager, ProjectScriptIcon } from "@t3tools/contracts";

const PACKAGE_JSON_SUFFIX = "/package.json";

export function importedProjectScriptDirectory(relativePath: string): string | null {
  const normalizedPath = relativePath.trim();
  if (normalizedPath === "package.json") {
    return null;
  }
  return normalizedPath.endsWith(PACKAGE_JSON_SUFFIX)
    ? normalizedPath.slice(0, -PACKAGE_JSON_SUFFIX.length)
    : normalizedPath;
}

export function buildImportedProjectScriptName(input: {
  relativePath: string;
  scriptName: string;
}): string {
  const packageDir = importedProjectScriptDirectory(input.relativePath);
  return packageDir ? `${packageDir}:${input.scriptName}` : input.scriptName;
}

export function buildImportedProjectScriptCommand(input: {
  relativePath: string;
  packageManager: ProjectPackageManager;
  scriptName: string;
}): string {
  const packageDir = importedProjectScriptDirectory(input.relativePath);
  if (!packageDir) {
    if (input.packageManager === "bun") return `bun run ${input.scriptName}`;
    if (input.packageManager === "pnpm") return `pnpm run ${input.scriptName}`;
    if (input.packageManager === "yarn") return `yarn run ${input.scriptName}`;
    return `npm run ${input.scriptName}`;
  }

  if (input.packageManager === "bun") {
    return `bun --cwd "${packageDir}" run ${input.scriptName}`;
  }
  if (input.packageManager === "pnpm") {
    return `pnpm --dir "${packageDir}" run ${input.scriptName}`;
  }
  if (input.packageManager === "yarn") {
    return `yarn --cwd "${packageDir}" run ${input.scriptName}`;
  }
  return `npm --prefix "${packageDir}" run ${input.scriptName}`;
}

export function inferImportedProjectScriptIcon(scriptName: string): ProjectScriptIcon {
  const normalizedName = scriptName.trim().toLowerCase();
  if (normalizedName.includes("test")) return "test";
  if (normalizedName.includes("lint") || normalizedName.includes("check")) return "lint";
  if (normalizedName.includes("build")) return "build";
  if (normalizedName.includes("debug")) return "debug";
  if (
    normalizedName.includes("prepare") ||
    normalizedName.includes("setup") ||
    normalizedName.includes("config")
  ) {
    return "configure";
  }
  return "play";
}
