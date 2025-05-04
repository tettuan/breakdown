import * as path from "@std/path";
// TODO: DoubleParamsResult型の正確な定義が見つからないため、any型で仮置き
type DoubleParamsResult = any;

/**
 * InputFilePathResolver
 *
 * Purpose:
 *   - Resolves the input file path for Breakdown's input according to CLI parameters and config.
 *   - Handles all cases for fromFile: absolute/relative path, filename only, or not specified.
 *   - Ensures input path is consistent with project conventions and user intent.
 *
 * Intent:
 *   - To centralize and standardize input path resolution logic for maintainability and testability.
 *   - To avoid path confusion and ensure correct file placement for all CLI/script/test scenarios.
 *
 * Expected Results:
 *   - If fromFile is not specified: returns empty string
 *   - If fromFile is absolute path: returns as-is
 *   - If fromFile has path hierarchy: returns absolute path resolved from cwd
 *   - If fromFile is filename only: returns <cwd>/{fromLayerType or layerType}/{fromFile}
 *   - Windows path separators are normalized.
 *
 * References:
 *   - docs/breakdown/path.ja.md
 *   - docs/breakdown/usage.ja.md
 *   - docs/breakdown/cli.ja.md
 *   - docs/index.ja.md
 */
export class InputFilePathResolver {
  constructor(private config: any, private cliParams: DoubleParamsResult) {}

  /**
   * Resolves the input file path according to CLI parameters and config.
   *
   * See: docs/breakdown/path.ja.md, usage.ja.md, cli.ja.md
   *
   * @returns {string} The resolved absolute input file path, or empty string if not specified.
   */
  public getPath(): string {
    const fromFile = this.getFromFile();
    if (!fromFile) return "";
    const normalizedFromFile = this.normalizePath(fromFile);
    if (this.isAbsolute(normalizedFromFile)) {
      return normalizedFromFile;
    }
    if (this.hasPathHierarchy(normalizedFromFile)) {
      return path.resolve(Deno.cwd(), normalizedFromFile);
    }
    const dir = this.getDirectory();
    return path.resolve(Deno.cwd(), dir, normalizedFromFile);
  }

  private getFromFile(): string | undefined {
    return this.cliParams.options?.fromFile;
  }

  private normalizePath(p: string): string {
    return p.replace(/\\/g, "/");
  }

  private isAbsolute(p: string): boolean {
    return path.isAbsolute(p);
  }

  private hasPathHierarchy(p: string): boolean {
    return p.includes("/");
  }

  private getDirectory(): string {
    return this.cliParams.options?.fromLayerType || this.cliParams.layerType;
  }
} 