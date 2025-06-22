/**
 * @fileoverview Input file path resolution for Breakdown CLI operations.
 *
 * This module provides the InputFilePathResolver class that handles the complex
 * logic of resolving input file paths from CLI parameters and configuration.
 * It supports various input scenarios including absolute paths, relative paths,
 * filename-only inputs, and stdin handling.
 *
 * The resolver follows Breakdown's path conventions and ensures consistent
 * file path resolution across different execution contexts and platforms.
 *
 * @module factory/input_file_path_resolver
 */

import { isAbsolute, resolve } from "@std/path";
import type { PromptCliParams } from "./prompt_variables_factory.ts";

type DoubleParamsResult = PromptCliParams;

/**
 * Input file path resolver for Breakdown CLI operations.
 *
 * The InputFilePathResolver class centralizes and standardizes input path
 * resolution logic for maintainability and testability. It handles all cases
 * for input file specification including absolute paths, relative paths,
 * filename-only inputs, and special cases like stdin.
 *
 * Path Resolution Strategy:
 * - Not specified: returns empty string
 * - Stdin ("-"): returns "-" for stdin handling
 * - Absolute path: returns as-is
 * - Relative path: resolves from current working directory
 * - Filename only: resolves within appropriate layer directory
 *
 * @example
 * ```typescript
 * const resolver = new InputFilePathResolver(config, cliParams);
 *
 * // Absolute path
 * const absolutePath = resolver.getPath(); // "/absolute/path/to/file.md"
 *
 * // Relative path
 * const relativePath = resolver.getPath(); // "./relative/path/file.md"
 *
 * // Stdin input
 * const stdinPath = resolver.getPath(); // "-"
 * ```
 */
export class InputFilePathResolver {
  /**
   * Creates a new InputFilePathResolver instance with configuration and CLI parameters.
   *
   * @param config - The configuration object containing workspace and path settings
   * @param cliParams - The parsed CLI parameters containing file specification options
   *
   * @example
   * ```typescript
   * const config = { working_dir: ".agent/breakdown" };
   * const cliParams = {
   *   demonstrativeType: "to",
   *   layerType: "project",
   *   options: { fromFile: "input.md" }
   * };
   * const resolver = new InputFilePathResolver(config, cliParams);
   * ```
   */
  constructor(private config: Record<string, unknown>, private cliParams: DoubleParamsResult) {}

  /**
   * Resolves the input file path according to CLI parameters and configuration.
   *
   * This method implements the complete path resolution strategy for input files,
   * handling various scenarios including stdin, absolute paths, relative paths,
   * and filename-only specifications. The resolution follows Breakdown's
   * documented path conventions.
   *
   * @returns string - The resolved absolute input file path, empty string if not specified,
   *                   or "-" for stdin input
   *
   * @throws {Error} When path resolution fails or invalid paths are provided
   *
   * @example
   * ```typescript
   * const resolver = new InputFilePathResolver(config, cliParams);
   *
   * // No file specified
   * const noFile = resolver.getPath(); // ""
   *
   * // Stdin input
   * const stdinInput = resolver.getPath(); // "-"
   *
   * // Absolute path
   * const absolutePath = resolver.getPath(); // "/absolute/path/to/input.md"
   *
   * // Relative path from cwd
   * const relativePath = resolver.getPath(); // "/current/working/dir/relative/input.md"
   * ```
   *
   * @see {@link https://docs.breakdown.com/path} for path resolution documentation
   */
  public getPath(): string {
    const fromFile = this.getFromFile();
    if (!fromFile) return "";
    if (fromFile === "-") {
      // Handle stdin input by returning "-" to indicate stdin
      return "-";
    }
    const normalizedFromFile = this.normalizePath(fromFile);
    if (this.isAbsolute(normalizedFromFile)) {
      return normalizedFromFile;
    }
    // パス階層の有無にかかわらず、--fromで指定されたパスをそのままcwdからの相対パスとして解決する
    return resolve(Deno.cwd(), normalizedFromFile);
  }

  /**
   * Extracts the fromFile value from CLI parameters.
   *
   * This method safely accesses the fromFile option from the CLI parameters,
   * which specifies the source file for input operations.
   *
   * @returns string | undefined - The fromFile string if specified, undefined otherwise
   *
   * @example
   * ```typescript
   * // With fromFile option
   * const fromFile = this.getFromFile(); // "input.md"
   *
   * // Without fromFile option
   * const noFromFile = this.getFromFile(); // undefined
   * ```
   */
  private getFromFile(): string | undefined {
    return this.cliParams.options?.fromFile;
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
   * const windowsPath = this.normalizePath("folder\\file.md"); // "folder/file.md"
   *
   * // Unix path remains unchanged
   * const unixPath = this.normalizePath("folder/file.md"); // "folder/file.md"
   * ```
   */
  private normalizePath(p: string): string {
    return p.replace(/\\/g, "/");
  }

  /**
   * Checks if a path is absolute using platform-appropriate logic.
   *
   * This method delegates to the standard library's isAbsolute function
   * to determine if a path is absolute on the current platform.
   *
   * @param p - The path string to check
   * @returns boolean - True if the path is absolute, false if relative
   *
   * @example
   * ```typescript
   * // Absolute paths
   * const isAbsUnix = this.isAbsolute("/absolute/path"); // true
   * const isAbsWin = this.isAbsolute("C:\\absolute\\path"); // true
   *
   * // Relative paths
   * const isRelative = this.isAbsolute("./relative/path"); // false
   * const isFilename = this.isAbsolute("filename.md"); // false
   * ```
   */
  private isAbsolute(p: string): boolean {
    return isAbsolute(p);
  }

  /**
   * Determines if a path has a directory hierarchy structure.
   *
   * This method analyzes whether a path contains directory separators that
   * indicate a hierarchical structure, excluding special relative path prefixes
   * like './' and '../' which are treated as simple relative references.
   *
   * @param p - The path string to analyze
   * @returns boolean - True if the path has hierarchy, false for simple filenames
   *
   * @example
   * ```typescript
   * // Paths with hierarchy
   * const hasHier1 = this.hasPathHierarchy("project/file.md"); // true
   * const hasHier2 = this.hasPathHierarchy("foo/bar/baz.md"); // true
   *
   * // Paths without hierarchy (treated as simple)
   * const noHier1 = this.hasPathHierarchy("file.md"); // false
   * const noHier2 = this.hasPathHierarchy("./file.md"); // false
   * const noHier3 = this.hasPathHierarchy("../file.md"); // false
   * ```
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
   * Gets the target directory name from CLI parameters for file organization.
   * 
   * This method determines the appropriate directory name for organizing files
   * within the workspace structure, prioritizing explicit fromLayerType over
   * the general layerType parameter.
   * 
   * @returns string - The directory name for file organization (e.g., "project", "issue", "task")
   * 
   * @example
   * ```typescript
   * // With explicit fromLayerType
   * const dir1 = this.getDirectory(); // "project" (from fromLayerType)
   * 
   * // Fallback to layerType
   * const dir2 = this.getDirectory(); // "issue" (from layerType)
   * ```
   */
  private getDirectory(): string {
    return this.cliParams.options?.fromLayerType || this.cliParams.layerType;
  }
}
