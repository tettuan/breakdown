import { isAbsolute, join, resolve } from "@std/path";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
// TODO: DoubleParamsResult型の正確な定義が見つからないため、any型で仮置き
type DoubleParamsResult = PromptCliParams;

/**
 * Resolves the schema file path for Breakdown according to CLI parameters and config.
 * Handles all cases for config, default, and path normalization.
 * Ensures schema path is consistent with project conventions and user intent.
 */
export class SchemaFilePathResolver {
  /**
   * Creates a new SchemaFilePathResolver instance.
   * @param config The configuration object for the resolver.
   * @param cliParams The CLI parameters used for path resolution.
   */
  constructor(
    private config: { app_schema?: { base_dir?: string } } & Record<string, unknown>,
    private cliParams: DoubleParamsResult,
  ) {}

  /**
   * Resolves the schema file path according to CLI parameters and config.
   *
   * See: docs/breakdown/path.ja.md, usage.ja.md, cli.ja.md
   *
   * @returns {string} The resolved absolute schema file path.
   */
  public getPath(): string {
    const baseDir = this.resolveBaseDir();
    const fileName = this.buildFileName();
    return this.buildSchemaPath(baseDir, fileName);
  }

  /**
   * Resolves the base directory for schema files.
   * @returns The resolved base directory path.
   */
  public resolveBaseDir(): string {
    let baseDir = this.config.app_schema?.base_dir || ".agent/breakdown/schemas";
    if (!isAbsolute(baseDir)) {
      baseDir = resolve(Deno.cwd(), baseDir);
    }
    return baseDir;
  }

  /**
   * Builds the filename for the schema file.
   * @returns The constructed filename string.
   */
  public buildFileName(): string {
    return "base.schema.md";
  }

  /**
   * Builds the full schema file path from base directory and filename.
   * @param baseDir The base directory for schema files.
   * @param fileName The filename to use.
   * @returns The constructed schema file path.
   */
  public buildSchemaPath(baseDir: string, fileName: string): string {
    const { demonstrativeType, layerType } = this.cliParams;
    return join(baseDir, demonstrativeType, layerType, fileName);
  }
}
