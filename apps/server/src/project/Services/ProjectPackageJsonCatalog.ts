import type {
  ProjectListPackageJsonScriptsInput,
  ProjectListPackageJsonScriptsResult,
} from "@t3tools/contracts";
import { Context } from "effect";
import type { Effect } from "effect";

export interface ProjectPackageJsonCatalogShape {
  readonly listPackageJsonScripts: (
    input: ProjectListPackageJsonScriptsInput,
  ) => Effect.Effect<ProjectListPackageJsonScriptsResult, Error>;
}

export class ProjectPackageJsonCatalog extends Context.Service<
  ProjectPackageJsonCatalog,
  ProjectPackageJsonCatalogShape
>()("t3/project/Services/ProjectPackageJsonCatalog") {}
