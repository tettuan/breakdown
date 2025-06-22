/**
 * @fileoverview Output file path resolution for Breakdown CLI operations.
 *
 * This module provides the OutputFilePathResolver class that handles the complex
 * logic of resolving output file paths from CLI parameters and configuration.
 * It supports various output scenarios including absolute paths, relative paths,
 * directory-only inputs, filename specifications, and automatic file generation.
 *
 * The resolver follows Breakdown's path conventions and ensures consistent
 * output file placement across different execution contexts and platforms.
 *
 * @module factory/output_file_path_resolver
 */

import { isAbsolute, join } from "@std/path";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
// TODO: DoubleParamsResult型の正確な定義が見つからないため、any型で仮置き
type DoubleParamsResult = PromptCliParams;

/**
 * Output file path resolver for Breakdown CLI operations.
 *
 * The OutputFilePathResolver class centralizes and standardizes output path
 * resolution logic for maintainability and testability. It handles all cases
 * for output file specification including absolute paths, relative paths,
 * directory-only inputs, filename specifications, and automatic generation.
 *
 * Path Resolution Strategy:
 * - Not specified: generates unique filename in layer directory
 * - Absolute directory: generates unique filename in specified directory
 * - Absolute file: uses specified file path as-is
 * - Relative directory: resolves from cwd, generates unique filename
 * - Relative file with hierarchy: resolves from cwd as-is
 * - Filename only: places in appropriate layer directory
 *
 * @example
 * ```typescript
 * const resolver = new OutputFilePathResolver(config, cliParams);
 *
 * // Auto-generated in layer directory
 * const autoPath = resolver.getPath(); // "./project/20241222_abc123.md"
 *
 * // Specific directory
 * const dirPath = resolver.getPath(); // "./output/20241222_abc123.md"
 *
 * // Specific file
 * const filePath = resolver.getPath(); // "./output/result.md"
 * ```
 */
export class OutputFilePathResolver {
  /**
   * Creates a new OutputFilePathResolver instance with configuration and CLI parameters.
   *
   * @param config - The configuration object containing workspace and path settings
   * @param cliParams - The parsed CLI parameters containing output file specification options
   *
   * @example
   * ```typescript
   * const config = { working_dir: ".agent/breakdown" };
   * const cliParams = {
   *   demonstrativeType: "to",
   *   layerType: "project",
   *   options: { destinationFile: "output.md" }
   * };
   * const resolver = new OutputFilePathResolver(config, cliParams);
   * ```
   */
  constructor(private config: Record<string, unknown>, private cliParams: DoubleParamsResult) {}

  /**
   * Resolves the output file path according to CLI parameters and configuration.
   *
   * This method implements the complete path resolution strategy for output files,
   * handling various scenarios including auto-generation, directory specification,
   * absolute paths, relative paths, and filename-only inputs. The resolution
   * follows Breakdown's documented output path conventions.
   *
   * @returns string - The resolved absolute output file path
   *
   * @throws {Error} When path resolution fails or invalid paths are provided
   *
   * @example
   * ```typescript
   * const resolver = new OutputFilePathResolver(config, cliParams);
   *
   * // No destination specified - auto-generated in layer directory
   * const autoPath = resolver.getPath(); // "/cwd/project/20241222_abc123.md"
   *
   * // Directory specified - auto-generated filename in directory
   * const dirPath = resolver.getPath(); // "/specified/dir/20241222_abc123.md"
   *
   * // Absolute file path
   * const absolutePath = resolver.getPath(); // "/absolute/path/to/output.md"
   *
   * // Relative file with hierarchy
   * const relativePath = resolver.getPath(); // "/cwd/relative/path/output.md"
   * ```
   *
   * @see {@link https://docs.breakdown.com/path} for path resolution documentation
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
   * Extracts the destination file path from CLI parameters.
   *
   * This method safely accesses the destinationFile option from the CLI parameters,
   * which specifies the target file or directory for output operations.
   *
   * @returns string | undefined - The destination file path if specified, undefined otherwise
   *
   * @example
   * ```typescript
   * // With destinationFile option
   * const destFile = this.getDestinationFile(); // "output.md"
   *
   * // Without destinationFile option
   * const noDestFile = this.getDestinationFile(); // undefined
   * ```
   */
  public getDestinationFile(): string | undefined {
    return this.cliParams.options?.destinationFile;
  }

  /**
   * Normalizes a file path to use forward slashes for cross-platform compatibility.
   *
   * This method converts Windows-style backslashes to forward slashes to ensure
   * consistent path handling across different operating systems.
   *
   * @param p - The path string to normalize
   * @returns string - The normalized path with forward slashes
   *
   * @example
   * ```typescript
   * // Windows path normalization
   * const windowsPath = this.normalizePath("output\\file.md"); // "output/file.md"
   *
   * // Unix path remains unchanged
   * const unixPath = this.normalizePath("output/file.md"); // "output/file.md"
   * ```
   */
  public normalizePath(p: string): string {
    return p.replace(/\\/g, "/");
  }

  /**
   * Generates a unique default filename for output files using timestamp and hash.
   *
   * This method creates a filename using the current date (YYYYMMDD format)
   * and a random hash to ensure uniqueness and avoid file conflicts.
   *
   * @returns string - The generated filename in format "YYYYMMDD_hash.md"
   *
   * @example
   * ```typescript
   * // Generated filename examples
   * const filename1 = this.generateDefaultFilename(); // "20241222_abc123f.md"
   * const filename2 = this.generateDefaultFilename(); // "20241222_def456a.md"
   * ```
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
   * Checks if a path points to an existing directory.
   *
   * This method synchronously checks the filesystem to determine if the
   * specified path exists and is a directory. It handles filesystem errors
   * gracefully by returning false for non-existent or inaccessible paths.
   *
   * @param p - The path string to check
   * @returns boolean - True if the path exists and is a directory, false otherwise
   *
   * @example
   * ```typescript
   * // Existing directory
   * const isDir1 = this.isDirectory("/existing/directory"); // true
   *
   * // Non-existent path
   * const isDir2 = this.isDirectory("/non/existent/path"); // false
   *
   * // File (not directory)
   * const isDir3 = this.isDirectory("/path/to/file.md"); // false
   * ```
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
   * Determines if a path has a directory hierarchy structure.
   *
   * This method analyzes whether a path contains directory separators
   * (forward slashes or backslashes) that indicate a hierarchical
   * directory structure rather than a simple filename.
   *
   * @param p - The path string to analyze
   * @returns boolean - True if the path contains directory separators, false for simple filenames
   *
   * @example
   * ```typescript
   * // Paths with hierarchy
   * const hasHier1 = this.hasPathHierarchy("output/file.md"); // true
   * const hasHier2 = this.hasPathHierarchy("dir\\file.md"); // true
   * const hasHier3 = this.hasPathHierarchy("./relative/path.md"); // true
   *
   * // Simple filenames without hierarchy
   * const noHier = this.hasPathHierarchy("file.md"); // false
   * ```
   */
  public hasPathHierarchy(p: string): boolean {
    return p.includes("/") || p.includes("\\");
  }

  /**
   * Checks if a path contains a file extension.
   *
   * This method determines whether a path string contains a file extension
   * by checking for the presence of a dot character, which typically
   * separates the filename from its extension.
   *
   * @param p - The path string to check
   * @returns boolean - True if the path contains a dot (indicating an extension), false otherwise
   *
   * @example
   * ```typescript
   * // Paths with extensions
   * const hasExt1 = this.hasExtension("file.md"); // true
   * const hasExt2 = this.hasExtension("output.txt"); // true
   * const hasExt3 = this.hasExtension("path/to/file.json"); // true
   *
   * // Paths without extensions
   * const noExt1 = this.hasExtension("filename"); // false
   * const noExt2 = this.hasExtension("directory"); // false
   * ```
   */
  public hasExtension(p: string): boolean {
    return p.includes(".");
  }
}
