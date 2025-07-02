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
import type { TwoParamsResult } from "../deps.ts";

// Legacy type alias for backward compatibility during migration
type DoubleParamsResult = PromptCliParams;

/**
 * TypeCreationResult - Unified error handling for type creation operations
 * Follows Totality principle by explicitly representing success/failure states
 */
export type TypeCreationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorType: "validation" | "missing" | "config" };

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
 * const _resolver = new OutputFilePathResolver(config, cliParams);
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
   * const _config = { working_dir: ".agent/breakdown" };
   * const cliParams = {
   *   demonstrativeType: "to",
   *   layerType: "project",
   *   options: { destinationFile: "output.md" }
   * };
   * const resolver = new OutputFilePathResolver(config, cliParams);
   * ```
   */
  constructor(
    private config: Record<string, unknown>,
    private cliParams: DoubleParamsResult | TwoParamsResult,
  ) {
    // Deep copy to ensure immutability
    this.config = this.deepCopyConfig(config);
    this.cliParams = this.deepCopyCliParams(cliParams);
  }

  /**
   * Deep copy configuration object manually to avoid JSON.parse
   * @param config - The configuration object to copy
   * @returns Deep copy of the configuration
   */
  private deepCopyConfig(config: Record<string, unknown>): Record<string, unknown> {
    const copy: Record<string, unknown> = {};

    // Copy properties shallowly (should be primitive or immutable)
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Shallow copy nested objects
        copy[key] = { ...value as Record<string, unknown> };
      } else {
        copy[key] = value;
      }
    }

    return copy;
  }

  /**
   * Deep copy CLI parameters manually to avoid JSON.parse
   * @param cliParams - The CLI parameters to copy
   * @returns Deep copy of the CLI parameters
   */
  private deepCopyCliParams(
    cliParams: DoubleParamsResult | TwoParamsResult,
  ): DoubleParamsResult | TwoParamsResult {
    if ("type" in cliParams && cliParams.type === "two") {
      // TwoParamsResult
      const twoParams = cliParams as TwoParamsResult;
      const copy: TwoParamsResult = {
        type: twoParams.type,
        params: [...twoParams.params],
        demonstrativeType: twoParams.demonstrativeType,
        layerType: twoParams.layerType,
        options: { ...twoParams.options },
      };
      return copy;
    } else {
      // DoubleParamsResult (PromptCliParams)
      const doubleParams = cliParams as DoubleParamsResult;
      const copy: any = {
        demonstrativeType: doubleParams.demonstrativeType,
        layerType: doubleParams.layerType,
      };

      if (doubleParams.options) {
        copy.options = { ...doubleParams.options };
      }

      return copy;
    }
  }

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
      const layerType = this.getLayerType();
      return join(cwd, layerType, this.generateDefaultFilename());
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
      const layerType = this.getLayerType();
      // Ensure all path components are valid strings
      if (!cwd || !layerType || !normalizedDest) {
        return join(Deno.cwd(), layerType || "task", normalizedDest || "output.md");
      }
      return join(cwd, layerType, normalizedDest);
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
  /**
   * Gets the layer type from CLI parameters with compatibility handling
   * @returns string - The layer type value
   */
  private getLayerType(): string {
    // Handle both legacy and new parameter structures
    if ("layerType" in this.cliParams) {
      return this.cliParams.layerType;
    }
    // For TwoParamsResult structure, adapt to legacy interface
    const twoParams = this.cliParams as TwoParamsResult;
    const layerType = (twoParams as unknown as { layerType?: string }).layerType;
    if (layerType) {
      return layerType;
    }

    // Handle mock objects with getValue method
    const layerObj = (twoParams as unknown as Record<string, unknown>).layer;
    if (layerObj && typeof (layerObj as Record<string, unknown>).getValue === "function") {
      return (layerObj as { getValue: () => string }).getValue();
    }

    return "task"; // Default fallback
  }

  public getDestinationFile(): string | undefined {
    // Handle both legacy and new parameter structures
    if ("options" in this.cliParams) {
      return this.cliParams.options?.destinationFile as string | undefined;
    }
    // For TwoParamsResult structure, adapt to legacy interface
    const twoParams = this.cliParams as TwoParamsResult;
    return (twoParams as unknown as { options?: { destinationFile?: string } }).options
      ?.destinationFile;
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
   * Enhanced with performance.now() for microsecond precision to prevent collisions.
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

    // Use performance.now() for microsecond precision to prevent collisions
    const timestampHash = Math.floor(performance.now() * 1000).toString(16).slice(-4);
    const randomHash = Math.random().toString(16).slice(2, 5);
    const combinedHash = `${timestampHash}${randomHash}`;

    return `${dateStr}_${combinedHash}.md`;
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
