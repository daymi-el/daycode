import { Schema } from "effect";
import { PositiveInt, TrimmedNonEmptyString } from "./baseSchemas";

const PROJECT_SEARCH_ENTRIES_MAX_LIMIT = 200;
const PROJECT_WRITE_FILE_PATH_MAX_LENGTH = 512;

export const ProjectPackageManager = Schema.Literals(["bun", "npm", "pnpm", "yarn"]);
export type ProjectPackageManager = typeof ProjectPackageManager.Type;

export const ProjectPackageJsonScript = Schema.Struct({
  name: TrimmedNonEmptyString,
  command: TrimmedNonEmptyString,
});
export type ProjectPackageJsonScript = typeof ProjectPackageJsonScript.Type;

export const ProjectPackageJsonDescriptor = Schema.Struct({
  relativePath: TrimmedNonEmptyString,
  packageName: Schema.NullOr(TrimmedNonEmptyString),
  packageManager: ProjectPackageManager,
  scripts: Schema.Array(ProjectPackageJsonScript),
});
export type ProjectPackageJsonDescriptor = typeof ProjectPackageJsonDescriptor.Type;

export const ProjectListPackageJsonScriptsInput = Schema.Struct({
  cwd: TrimmedNonEmptyString,
});
export type ProjectListPackageJsonScriptsInput = typeof ProjectListPackageJsonScriptsInput.Type;

export const ProjectListPackageJsonScriptsResult = Schema.Struct({
  packageJsons: Schema.Array(ProjectPackageJsonDescriptor),
});
export type ProjectListPackageJsonScriptsResult = typeof ProjectListPackageJsonScriptsResult.Type;

export const ProjectSearchEntriesInput = Schema.Struct({
  cwd: TrimmedNonEmptyString,
  query: TrimmedNonEmptyString.check(Schema.isMaxLength(256)),
  limit: PositiveInt.check(Schema.isLessThanOrEqualTo(PROJECT_SEARCH_ENTRIES_MAX_LIMIT)),
});
export type ProjectSearchEntriesInput = typeof ProjectSearchEntriesInput.Type;

const ProjectEntryKind = Schema.Literals(["file", "directory"]);

export const ProjectEntry = Schema.Struct({
  path: TrimmedNonEmptyString,
  kind: ProjectEntryKind,
  parentPath: Schema.optional(TrimmedNonEmptyString),
});
export type ProjectEntry = typeof ProjectEntry.Type;

export const ProjectSearchEntriesResult = Schema.Struct({
  entries: Schema.Array(ProjectEntry),
  truncated: Schema.Boolean,
});
export type ProjectSearchEntriesResult = typeof ProjectSearchEntriesResult.Type;

export class ProjectSearchEntriesError extends Schema.TaggedErrorClass<ProjectSearchEntriesError>()(
  "ProjectSearchEntriesError",
  {
    message: TrimmedNonEmptyString,
    cause: Schema.optional(Schema.Defect),
  },
) {}

export class ProjectListPackageJsonScriptsError extends Schema.TaggedErrorClass<ProjectListPackageJsonScriptsError>()(
  "ProjectListPackageJsonScriptsError",
  {
    message: TrimmedNonEmptyString,
    cause: Schema.optional(Schema.Defect),
  },
) {}

export const ProjectWriteFileInput = Schema.Struct({
  cwd: TrimmedNonEmptyString,
  relativePath: TrimmedNonEmptyString.check(Schema.isMaxLength(PROJECT_WRITE_FILE_PATH_MAX_LENGTH)),
  contents: Schema.String,
});
export type ProjectWriteFileInput = typeof ProjectWriteFileInput.Type;

export const ProjectWriteFileResult = Schema.Struct({
  relativePath: TrimmedNonEmptyString,
});
export type ProjectWriteFileResult = typeof ProjectWriteFileResult.Type;

export class ProjectWriteFileError extends Schema.TaggedErrorClass<ProjectWriteFileError>()(
  "ProjectWriteFileError",
  {
    message: TrimmedNonEmptyString,
    cause: Schema.optional(Schema.Defect),
  },
) {}
