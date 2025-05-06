import { isAbsolute, join } from "@std/path";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
// TODO: DoubleParamsResult型の正確な定義が見つからないため、any型で仮置き
type DoubleParamsResult = PromptCliParams;

/**
 * OutputFilePathResolver
 *
 * Purpose:
 *   - Resolves the output file path for Breakdown's output according to CLI parameters and config.
 *   - Handles all cases for destinationFile: absolute/relative path, directory, filename only, or not specified.
 *   - Ensures output path is consistent with project conventions and user intent.
 *
 * Intent:
 *   - To centralize and standardize output path resolution logic for maintainability and testability.
 *   - To avoid path confusion and ensure correct file placement for all CLI/script/test scenarios.
 *
 * Expected Results:
 *   - If destinationFile is not specified: output to <cwd>/{layerType}/<generated>.md
 *   - If destinationFile is an absolute path:
 *       - If directory: output to <absDir>/<generated>.md
 *       - If file: output to <absFile>
 *   - If destinationFile is a relative path:
 *       - If directory: output to <absDir>/<generated>.md
 *       - If path hierarchy + extension: output to <cwd>/<relPath>
 *       - If filename only + extension: output to <cwd>/{layerType}/<filename>
 *       - If filename only + no extension: output to <absDir>/<generated>.md
 *   - Windows path separators are normalized.
 *
 * References:
 *   - docs/breakdown/path.ja.md
 *   - docs/breakdown/usage.ja.md
 *   - docs/breakdown/cli.ja.md
 *   - docs/index.ja.md
 */
export class OutputFilePathResolver {
  /**
   * Creates a new OutputFilePathResolver instance.
   * @param config The configuration object for the resolver.
   * @param cliParams The CLI parameters used for path resolution.
   */
  constructor(private config: Record<string, unknown>, private cliParams: DoubleParamsResult) {}

  /**
   * Resolves the output file path according to CLI parameters and config.
   *
   * See: docs/breakdown/path.ja.md, usage.ja.md, cli.ja.md
   *
   * @returns {string} The resolved absolute output file path.
   */
  public getPath(): string {
    const destinationFile = this.getDestinationFile();
    const cwd = Deno.cwd();
    if (!destinationFile) {
      return join(cwd, this.cliParams.layerType, this.generateDefaultFilename());
    }
    const normalizedDest = this.normalizePath(destinationFile);
    if (isAbsolute(normalizedDest)) {
      if (this.isDirectory(normalizedDest)) {
        return join(normalizedDest, this.generateDefaultFilename());
      }
      return normalizedDest;
    }
    const absDest = join(cwd, normalizedDest);
    if (this.isDirectory(absDest)) {
      return join(absDest, this.generateDefaultFilename());
    }
    if (this.hasPathHierarchy(normalizedDest) && this.hasExtension(normalizedDest)) {
      return absDest;
    }
    if (this.hasExtension(normalizedDest)) {
      return join(cwd, this.cliParams.layerType, normalizedDest);
    }
    return join(absDest, this.generateDefaultFilename());
  }

  /**
   * Gets the destination file path from CLI parameters.
   * @returns The destination file path or undefined if not specified.
   */
  public getDestinationFile(): string | undefined {
    return this.cliParams.options?.destinationFile;
  }

  /**
   * Normalizes a file path to use forward slashes.
   * @param p The path to normalize.
   * @returns The normalized path string.
   */
  public normalizePath(p: string): string {
    return p.replace(/\\/g, "/");
  }

  /**
   * Generates a default filename for output files.
   * @returns The generated filename string.
   */
  public generateDefaultFilename(): string {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      date.getDate().toString().padStart(2, "0");
    const hash = Math.random().toString(16).slice(2, 9);
    return `${dateStr}_${hash}.md`;
  }

  /**
   * Checks if a path is a directory.
   * @param p The path to check.
   * @returns True if the path is a directory, false otherwise.
   */
  public isDirectory(p: string): boolean {
    try {
      const stat = Deno.statSync(p);
      return stat.isDirectory;
    } catch (_) {
      return false;
    }
  }

  /**
   * Determines if a path has a hierarchy (contains a slash or backslash).
   * @param p The path to check.
   * @returns True if the path has a hierarchy, false otherwise.
   */
  public hasPathHierarchy(p: string): boolean {
    return p.includes("/") || p.includes("\\");
  }

  /**
   * Checks if a path has a file extension.
   * @param p The path to check.
   * @returns True if the path has an extension, false otherwise.
   */
  public hasExtension(p: string): boolean {
    return p.includes(".");
  }
}
