import * as path from "@std/path";
// TODO: DoubleParamsResult型の正確な定義が見つからないため、any型で仮置き
type DoubleParamsResult = any;

/**
 * SchemaFilePathResolver
 *
 * Purpose:
 *   - Resolves the schema file path for Breakdown according to CLI parameters and config.
 *   - Handles all cases for config, default, and path normalization.
 *   - Ensures schema path is consistent with project conventions and user intent.
 *
 * Intent:
 *   - To centralize and standardize schema file path resolution logic for maintainability and testability.
 *   - To avoid path confusion and ensure correct file placement for all CLI/script/test scenarios.
 *
 * Expected Results:
 *   - If config.app_schema.base_dir is specified, it is used; otherwise, default is used.
 *   - Returns absolute path to the resolved schema file.
 *   - Windows path separators are normalized.
 *
 * References:
 *   - docs/breakdown/path.ja.md
 *   - docs/breakdown/usage.ja.md
 *   - docs/breakdown/cli.ja.md
 *   - docs/index.ja.md
 */
export class SchemaFilePathResolver {
  constructor(private config: any, private cliParams: DoubleParamsResult) {}

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

  private resolveBaseDir(): string {
    let baseDir = this.config.app_schema?.base_dir || ".agent/breakdown/schemas";
    if (!path.isAbsolute(baseDir)) {
      baseDir = path.resolve(Deno.cwd(), baseDir);
    }
    return baseDir;
  }

  private buildFileName(): string {
    return "base.schema.md";
  }

  private buildSchemaPath(baseDir: string, fileName: string): string {
    const { demonstrativeType, layerType } = this.cliParams;
    return path.join(baseDir, demonstrativeType, layerType, fileName);
  }
} 