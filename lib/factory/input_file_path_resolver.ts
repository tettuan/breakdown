import { isAbsolute, resolve } from "@std/path";
import type { PromptCliParams } from "./prompt_variables_factory.ts";

type DoubleParamsResult = PromptCliParams;

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
  /**
   * Creates a new InputFilePathResolver instance.
   * @param config The configuration object for the resolver.
   * @param cliParams The CLI parameters used for path resolution.
   */
  constructor(private config: Record<string, unknown>, private cliParams: DoubleParamsResult) {}

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
    if (fromFile === "-") return ""; // Handle stdin input
    const normalizedFromFile = this.normalizePath(fromFile);
    if (this.isAbsolute(normalizedFromFile)) {
      return normalizedFromFile;
    }
    // パス階層の有無にかかわらず、--fromで指定されたパスをそのままcwdからの相対パスとして解決する
    return resolve(Deno.cwd(), normalizedFromFile);
  }

  /**
   * Gets the fromFile value from CLI parameters.
   * @returns The fromFile string or undefined if not specified.
   */
  private getFromFile(): string | undefined {
    return this.cliParams.options?.fromFile;
  }

  /**
   * Normalizes a file path to use forward slashes.
   * @param p The path to normalize.
   * @returns The normalized path string.
   */
  private normalizePath(p: string): string {
    return p.replace(/\\/g, "/");
  }

  /**
   * Checks if a path is absolute.
   * @param p The path to check.
   * @returns True if the path is absolute, false otherwise.
   */
  private isAbsolute(p: string): boolean {
    return isAbsolute(p);
  }

  /**
   * Determines if a path has a hierarchy (contains a slash and is not './' or '../').
   * @param p The path to check.
   * @returns True if the path has a hierarchy, false otherwise.
   */
  private hasPathHierarchy(p: string): boolean {
    // Only treat as hierarchy if path contains a slash and does not start with './' or '../'
    // './file.md' and '../file.md' should NOT be treated as hierarchy
    // 'project/file.md' or 'foo/bar.md' should be treated as hierarchy
    const normalized = p.replace(/\\/g, "/");
    if (normalized.startsWith("./") || normalized.startsWith("../")) {
      return false;
    }
    return normalized.includes("/");
  }

  /**
   * Gets the directory name from CLI parameters.
   * @returns The directory name string.
   */
  private getDirectory(): string {
    return this.cliParams.options?.fromLayerType || this.cliParams.layerType;
  }
}
