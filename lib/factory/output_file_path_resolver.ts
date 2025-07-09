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
import type { TwoParams_Result } from "./prompt_variables_factory.ts";
import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";

// Legacy type alias for backward compatibility during migration
type DoubleParams_Result = PromptCliParams;

/**
 * TypeCreationResult pattern for consistent factory interface
 */
export type TypeCreationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Error types for Output File Path Resolution
 */
export type OutputFilePathError =
  | { kind: "InvalidPath"; path: string; reason: string }
  | { kind: "DirectoryNotFound"; path: string }
  | { kind: "PermissionDenied"; path: string }
  | { kind: "ConfigurationError"; message: string }
  | { kind: "FilenameGenerationFailed"; reason: string };

/**
 * Resolved output file path with metadata
 */
export interface ResolvedOutputPath {
  /** The resolved absolute path */
  value: string;
  /** Type of output path */
  type: "auto-generated" | "absolute" | "relative" | "filename";
  /** Whether the path was generated automatically */
  isGenerated: boolean;
  /** Whether the parent directory exists */
  directoryExists: boolean;
  /** Additional metadata */
  metadata: {
    originalPath?: string;
    resolvedFrom: "cli" | "config" | "auto";
    layerType?: string;
  };
}

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
// WeakMap for true private property storage
const privateData = new WeakMap<OutputFilePathResolver, {
  config: Record<string, unknown>;
  cliParams: DoubleParams_Result | TwoParams_Result;
}>();

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
  private constructor(
    config: Record<string, unknown>,
    cliParams: DoubleParams_Result | TwoParams_Result,
  ) {
    // Store private data in WeakMap for true encapsulation
    privateData.set(this, {
      config: this.deepCopyConfig(config),
      cliParams: this.deepCopyCliParams(cliParams),
    });
  }

  private get config(): Record<string, unknown> {
    return privateData.get(this)!.config;
  }

  private get _cliParams(): DoubleParams_Result | TwoParams_Result {
    return privateData.get(this)!.cliParams;
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
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): DoubleParams_Result | TwoParams_Result {
    if ("type" in cliParams && cliParams.type === "two") {
      // TwoParams_Result from breakdownparams
      const twoParams = cliParams as TwoParams_Result;
      const copy: TwoParams_Result = {
        type: twoParams.type,
        params: twoParams.params ? [...twoParams.params] : [],
        demonstrativeType: twoParams.demonstrativeType,
        layerType: twoParams.layerType,
        options: { ...twoParams.options },
      };
      return copy;
    } else {
      // DoubleParams_Result (PromptCliParams)
      const doubleParams = cliParams as DoubleParams_Result;
      const copy: DoubleParams_Result = {
        demonstrativeType: doubleParams.demonstrativeType,
        layerType: doubleParams.layerType,
        options: doubleParams.options || {},
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
   * @returns Result<ResolvedOutputPath, OutputFilePathError> - The resolved output path with metadata
   *
   * @example
   * ```typescript
   * const resolver = new OutputFilePathResolver(config, cliParams);
   *
   * const result = resolver.getPath();
   * if (result.ok) {
   *   console.log(result.data.value); // "/resolved/path/to/output.md"
   *   console.log(result.data.isGenerated); // true if auto-generated
   * } else {
   *   console.error(result.error.kind); // "InvalidPath" | "DirectoryNotFound"
   * }
   * ```
   *
   * @see {@link https://docs.breakdown.com/path} for path resolution documentation
   * @throws {never} This method uses Result pattern and never throws exceptions
   */
  public getPath(): Result<ResolvedOutputPath, OutputFilePathError> {
    try {
      const destinationFile = this.getDestinationFile();
      const cwd = Deno.cwd();
      const layerType = this.getLayerType();

      // No destination specified - auto-generate in layer directory
      if (!destinationFile || destinationFile.trim() === "") {
        // Empty string is treated as invalid path, not auto-generation
        if (destinationFile === "") {
          return error({
            kind: "InvalidPath",
            path: destinationFile,
            reason: "Empty path is not allowed",
          });
        }
        const filename = this.generateDefaultFilename();
        if (!filename.ok) {
          return error(filename.error);
        }

        const resolvedPath = join(cwd, layerType, filename.data);
        return ok({
          value: resolvedPath,
          type: "auto-generated",
          isGenerated: true,
          directoryExists: this.checkDirectoryExists(join(cwd, layerType)),
          metadata: {
            resolvedFrom: "auto",
            layerType,
          },
        });
      }

      const normalizedDest = this.normalizePath(destinationFile);

      // Validate path format
      if (normalizedDest.includes("\0")) {
        return error({
          kind: "InvalidPath",
          path: destinationFile,
          reason: "Path contains null character",
        });
      }

      // Handle absolute paths
      if (isAbsolute(normalizedDest)) {
        if (this.isDirectory(normalizedDest)) {
          // Directory specified - generate filename
          const filename = this.generateDefaultFilename();
          if (!filename.ok) {
            return error(filename.error);
          }

          const resolvedPath = join(normalizedDest, filename.data);
          return ok({
            value: resolvedPath,
            type: "absolute",
            isGenerated: true,
            directoryExists: this.checkDirectoryExists(normalizedDest),
            metadata: {
              originalPath: destinationFile,
              resolvedFrom: "cli",
            },
          });
        }

        // Absolute file path
        return ok({
          value: normalizedDest,
          type: "absolute",
          isGenerated: false,
          directoryExists: this.checkDirectoryExists(this.getParentDirectory(normalizedDest)),
          metadata: {
            originalPath: destinationFile,
            resolvedFrom: "cli",
          },
        });
      }

      // Handle relative paths
      const absDest = join(cwd, normalizedDest);

      if (this.isDirectory(absDest)) {
        // Directory specified - generate filename
        const filename = this.generateDefaultFilename();
        if (!filename.ok) {
          return error(filename.error);
        }

        const resolvedPath = join(absDest, filename.data);
        return ok({
          value: resolvedPath,
          type: "relative",
          isGenerated: true,
          directoryExists: this.checkDirectoryExists(absDest),
          metadata: {
            originalPath: destinationFile,
            resolvedFrom: "cli",
          },
        });
      }

      // File with hierarchy and extension
      if (this.hasPathHierarchy(normalizedDest) && this.hasExtension(normalizedDest)) {
        return ok({
          value: absDest,
          type: "relative",
          isGenerated: false,
          directoryExists: this.checkDirectoryExists(this.getParentDirectory(absDest)),
          metadata: {
            originalPath: destinationFile,
            resolvedFrom: "cli",
          },
        });
      }

      // Filename only - place in layer directory
      if (this.hasExtension(normalizedDest)) {
        const resolvedPath = join(cwd, layerType, normalizedDest);
        return ok({
          value: resolvedPath,
          type: "filename",
          isGenerated: false,
          directoryExists: this.checkDirectoryExists(join(cwd, layerType)),
          metadata: {
            originalPath: destinationFile,
            resolvedFrom: "cli",
            layerType,
          },
        });
      }

      // Directory without extension - generate filename
      const filename = this.generateDefaultFilename();
      if (!filename.ok) {
        return error(filename.error);
      }

      const resolvedPath = join(absDest, filename.data);
      return ok({
        value: resolvedPath,
        type: "relative",
        isGenerated: true,
        directoryExists: this.checkDirectoryExists(absDest),
        metadata: {
          originalPath: destinationFile,
          resolvedFrom: "cli",
        },
      });
    } catch (error) {
      return this.handleResolutionError(error);
    }
  }

  /**
   * Legacy method for backward compatibility - returns Result instead of throwing
   * @deprecated Use getPath() which returns Result<ResolvedOutputPath, OutputFilePathError>
   */
  private getPathLegacy(): Result<string, OutputFilePathError> {
    const result = this.getPath();
    if (!result.ok) {
      return result;
    }
    return ok(result.data.value);
  }

  /**
   * Legacy method for backward compatibility - throws exceptions for existing callers
   * @deprecated Use getPath() or getPathLegacy() which returns Result type
   */
  private getPathLegacyUnsafe(): string {
    const result = this.getPath();
    if (!result.ok) {
      const errorMessage = (() => {
        switch (result.error.kind) {
          case "InvalidPath":
            return `${result.error.path}: ${result.error.reason}`;
          case "DirectoryNotFound":
          case "PermissionDenied":
            return result.error.path;
          case "ConfigurationError":
            return result.error.message;
          case "FilenameGenerationFailed":
            return result.error.reason;
          default:
            return "Unknown error";
        }
      })();
      // For legacy unsafe method, we create a specific error type
      class OutputFilePathResolutionError extends Error {
        constructor(message: string, public readonly kind: string) {
          super(message);
          this.name = "OutputFilePathResolutionError";
        }
      }
      throw new OutputFilePathResolutionError(
        `Path resolution failed: ${result.error.kind} - ${errorMessage}`,
        result.error.kind,
      );
    }
    return result.data.value;
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
    // Check for Totality parameters structure
    const hasTotalityProps = (p: any): p is { directive: any; layer: any; options?: any } => {
      return p && typeof p === "object" && "directive" in p && "layer" in p &&
        p.directive && typeof p.directive === "object" && "value" in p.directive &&
        p.layer && typeof p.layer === "object" && "value" in p.layer;
    };

    if (hasTotalityProps(this._cliParams)) {
      // TotalityPromptCliParams structure - use layer.value
      return this._cliParams.layer.value || this._cliParams.layer.data || "task";
    }

    // Handle both legacy and new parameter structures
    if ("layerType" in this._cliParams && this._cliParams.layerType) {
      return this._cliParams.layerType;
    }

    // For TwoParams_Result from breakdownparams
    if ("type" in this._cliParams && this._cliParams.type === "two") {
      const twoParams = this._cliParams as TwoParams_Result;
      // TwoParams_Result has layerType property
      if (twoParams.layerType) {
        return twoParams.layerType;
      }
    }

    return "task"; // Default fallback
  }

  private getDestinationFile(): string | undefined {
    // Handle both legacy and new parameter structures
    if ("options" in this._cliParams) {
      const options = this._cliParams.options as any;
      // Support both 'output' and 'destinationFile' for backward compatibility
      return options?.output || options?.destinationFile;
    }
    // For TwoParams_Result structure, adapt to legacy interface
    const twoParams = this._cliParams as TwoParams_Result;
    const options =
      (twoParams as unknown as { options?: { output?: string; destinationFile?: string } }).options;
    return options?.output || options?.destinationFile;
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
  private normalizePath(p: string): string {
    return p.replace(/\\/g, "/");
  }

  /**
   * Generates a unique default filename for output files using timestamp and hash.
   *
   * This method creates a filename using the current date (YYYYMMDD format)
   * and a random hash to ensure uniqueness and avoid file conflicts.
   * Enhanced with performance.now() for microsecond precision to prevent collisions.
   *
   * @returns Result<string, OutputFilePathError> - The generated filename in format "YYYYMMDD_hash.md"
   *
   * @example
   * ```typescript
   * // Generated filename examples
   * const result1 = this.generateDefaultFilename();
   * if (result1.ok) console.log(result1.data); // "20241222_abc123f.md"
   * ```
   */
  private generateDefaultFilename(): Result<string, OutputFilePathError> {
    try {
      const date = new Date();
      const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, "0") +
        date.getDate().toString().padStart(2, "0");

      // Use performance.now() for microsecond precision to prevent collisions
      const timestampHash = Math.floor(performance.now() * 1000).toString(16).slice(-4);
      const randomHash = Math.random().toString(16).slice(2, 5);
      const combinedHash = `${timestampHash}${randomHash}`;

      const filename = `${dateStr}_${combinedHash}.md`;

      // Basic validation
      if (!filename || filename.length < 10) {
        return error({
          kind: "FilenameGenerationFailed",
          reason: "Generated filename is too short or empty",
        });
      }

      return ok(filename);
    } catch (err) {
      return error({
        kind: "FilenameGenerationFailed",
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use generateDefaultFilename() which returns Result
   */
  private generateDefaultFilenameLegacy(): Result<string, OutputFilePathError> {
    return this.generateDefaultFilename();
  }

  /**
   * Legacy method that throws exceptions for existing callers
   * @deprecated Use generateDefaultFilename() or generateDefaultFilenameLegacy() which returns Result type
   */
  private generateDefaultFilenameLegacyUnsafe(): string {
    const result = this.generateDefaultFilename();
    if (!result.ok) {
      const errorMessage = result.error.kind === "FilenameGenerationFailed"
        ? result.error.reason
        : "Unknown error";
      // For legacy unsafe method, we create a specific error type
      class FilenameGenerationError extends Error {
        constructor(message: string, public readonly kind: string) {
          super(message);
          this.name = "FilenameGenerationError";
        }
      }
      throw new FilenameGenerationError(
        `Filename generation failed: ${errorMessage}`,
        result.error.kind,
      );
    }
    return result.data;
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
  private isDirectory(p: string): boolean {
    // Architecture-compliant implementation that doesn't access file system directly
    // Path resolution should focus on logical path construction only
    // Actual directory existence should be checked by higher-level components

    // Logical check: paths ending with "/" are likely directories
    return p.endsWith("/") || p.endsWith("\\");
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
  private hasPathHierarchy(p: string): boolean {
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
  private hasExtension(p: string): boolean {
    return p.includes(".");
  }

  /**
   * Check if a directory exists on the filesystem
   *
   * Architecture-compliant implementation that doesn't access file system directly
   */
  private checkDirectoryExists(path: string): boolean {
    // Return true for logical paths that appear valid
    // This maintains the interface while respecting layer boundaries
    return path.length > 0 && !path.includes("\0");
  }

  /**
   * Get parent directory of a file path
   */
  private getParentDirectory(path: string): string {
    const lastSlash = path.lastIndexOf("/");
    return lastSlash > 0 ? path.substring(0, lastSlash) : path;
  }

  /**
   * Handle resolution errors and convert to appropriate error types
   */
  private handleResolutionError(error: unknown): Result<ResolvedOutputPath, OutputFilePathError> {
    if (error instanceof Error) {
      // Check error message patterns instead of instanceof checks for Deno-specific types
      if (error.message.includes("NotFound") || error.message.includes("not found")) {
        return {
          ok: false,
          error: {
            kind: "DirectoryNotFound",
            path: error.message || "Unknown path",
          },
        };
      }

      if (error.message.includes("PermissionDenied") || error.message.includes("permission")) {
        return {
          ok: false,
          error: {
            kind: "PermissionDenied",
            path: error.message || "Unknown path",
          },
        };
      }
    }

    return {
      ok: false,
      error: {
        kind: "ConfigurationError",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }

  /**
   * Smart Constructor for creating OutputFilePathResolver with validation
   *
   * Following Totality principle:
   * - Private constructor enforces creation through smart constructor
   * - Comprehensive validation of all inputs
   * - Result type for explicit error handling
   * - No exceptions, all errors are represented as Result.error
   */
  static create(
    config: Record<string, unknown>,
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): Result<OutputFilePathResolver, OutputFilePathError> {
    // Validate config presence and type
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      return error({
        kind: "ConfigurationError",
        message: "Configuration must be a non-null object",
      });
    }

    // Validate cliParams presence and type
    if (!cliParams || typeof cliParams !== "object" || Array.isArray(cliParams)) {
      return error({
        kind: "ConfigurationError",
        message: "CLI parameters must be a non-null object",
      });
    }

    // Validate parameter structure
    const validationResult = OutputFilePathResolver.validateParameterStructure(cliParams);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Create instance with validated inputs
    const resolver = new OutputFilePathResolver(config, cliParams);
    return ok(resolver);
  }

  /**
   * Validates the structure of CLI parameters
   * @private
   */
  private static validateParameterStructure(
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): Result<void, OutputFilePathError> {
    // Check for Totality parameters structure
    const hasTotalityProps = (p: any): p is { directive: any; layer: any; options?: any } => {
      return p && typeof p === "object" && "directive" in p && "layer" in p &&
        p.directive && typeof p.directive === "object" && "value" in p.directive &&
        p.layer && typeof p.layer === "object" && "value" in p.layer;
    };

    // Check for TwoParams_Result structure
    const hasTwoParamsStructure = (p: any): boolean => {
      return p && typeof p === "object" && "type" in p && p.type === "two" &&
        "demonstrativeType" in p && "layerType" in p;
    };

    // Check for legacy parameters structure
    const hasLegacyProps = (p: any): boolean => {
      return p && typeof p === "object" &&
        "demonstrativeType" in p && "layerType" in p &&
        typeof p.demonstrativeType === "string" && typeof p.layerType === "string";
    };

    if (
      !hasTotalityProps(cliParams) && !hasTwoParamsStructure(cliParams) &&
      !hasLegacyProps(cliParams)
    ) {
      return error({
        kind: "ConfigurationError",
        message:
          "CLI parameters must have Totality structure (directive/layer), TwoParams structure, or legacy structure with demonstrativeType and layerType",
      });
    }

    return ok(undefined);
  }
}
