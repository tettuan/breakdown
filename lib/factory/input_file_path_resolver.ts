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
import type { TwoParams_Result } from "./prompt_variables_factory.ts";
import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";

// Legacy type alias for backward compatibility during migration
type DoubleParamsResult = PromptCliParams;

/**
 * Error types for Input File Path Resolution
 */
export type InputFilePathError =
  | { kind: "InvalidPath"; path: string; reason: string }
  | { kind: "PathNotFound"; path: string }
  | { kind: "PermissionDenied"; path: string }
  | { kind: "ConfigurationError"; message: string };

/**
 * Resolved input file path with metadata
 */
export interface ResolvedInputPath {
  /** The resolved absolute path */
  value: string;
  /** Type of input path */
  type: "stdin" | "absolute" | "relative" | "filename";
  /** Whether the path exists */
  exists: boolean;
  /** Additional metadata */
  metadata: {
    originalPath?: string;
    resolvedFrom: "cli" | "config" | "default";
  };
}

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
  private constructor(
    private config: Record<string, unknown>,
    private _cliParams: DoubleParamsResult | TwoParams_Result,
  ) {
    // Deep copy to ensure immutability - inputs are already validated
    this.config = this.deepCopyConfig(config);
    this._cliParams = this.deepCopyCliParams(_cliParams);
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
    cliParams: DoubleParamsResult | TwoParams_Result,
  ): DoubleParamsResult | TwoParams_Result {
    // Check if it's TotalityPromptCliParams by checking for directive and layer properties
    // Note: TwoParams_Result from breakdownparams may have different structure
    const hasTotalityProps = (p: any): p is { directive: any; layer: any; options?: any } => {
      return p && typeof p === "object" && "directive" in p && "layer" in p &&
        p.directive && typeof p.directive === "object" && "value" in p.directive &&
        p.layer && typeof p.layer === "object" && "value" in p.layer;
    };

    if (hasTotalityProps(cliParams)) {
      // TotalityPromptCliParams structure
      const copy: any = {
        directive: cliParams.directive,
        layer: cliParams.layer,
        options: { ...cliParams.options },
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
   * Resolves the input file path according to CLI parameters and configuration.
   *
   * This method implements the complete path resolution strategy for input files,
   * handling various scenarios including stdin, absolute paths, relative paths,
   * and filename-only specifications. The resolution follows Breakdown's
   * documented path conventions.
   *
   * @returns Result<ResolvedInputPath, InputFilePathError> - The resolved input path with metadata
   *
   * @example
   * ```typescript
   * const resolver = new InputFilePathResolver(config, cliParams);
   *
   * const result = resolver.getPath();
   * if (result.ok) {
   *   console.log(result.data.value); // "/resolved/path/to/input.md"
   *   console.log(result.data.type);  // "relative" | "absolute" | "stdin"
   * } else {
   *   console.error(result.error.kind); // "InvalidPath" | "PathNotFound"
   * }
   * ```
   *
   * @see {@link https://docs.breakdown.com/path} for path resolution documentation
   */
  public getPath(): Result<ResolvedInputPath, InputFilePathError> {
    try {
      const fromFile = this.getFromFile();

      // No file specified - return empty path
      if (!fromFile) {
        return ok({
          value: "",
          type: "filename",
          exists: false,
          metadata: {
            resolvedFrom: "default",
          },
        });
      }

      // Handle stdin input
      if (fromFile === "-") {
        return ok({
          value: "-",
          type: "stdin",
          exists: true,
          metadata: {
            originalPath: fromFile,
            resolvedFrom: "cli",
          },
        });
      }

      const normalizedFromFile = this.normalizePath(fromFile);

      // Validate path format
      if (normalizedFromFile.includes("\0")) {
        return error({
          kind: "InvalidPath",
          path: fromFile,
          reason: "Path contains null character",
        });
      }

      let resolvedPath: string;
      let pathType: "absolute" | "relative" | "filename";

      if (this.isAbsolute(normalizedFromFile)) {
        resolvedPath = normalizedFromFile;
        pathType = "absolute";
      } else {
        // Resolve relative path from current working directory
        resolvedPath = resolve(Deno.cwd(), normalizedFromFile);
        pathType = this.hasPathHierarchy(normalizedFromFile) ? "relative" : "filename";
      }

      // Check if path exists
      const exists = this.checkPathExists(resolvedPath);

      return ok({
        value: resolvedPath,
        type: pathType,
        exists,
        metadata: {
          originalPath: fromFile,
          resolvedFrom: "cli",
        },
      });
    } catch (error) {
      return this.handleResolutionError(error);
    }
  }

  /**
   * Legacy method for backward compatibility - returns Result instead of throwing
   * @deprecated Use getPath() which returns Result<ResolvedInputPath, InputFilePathError>
   */
  public getPathLegacy(): Result<string, InputFilePathError> {
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
  public getPathLegacyUnsafe(): string {
    const result = this.getPath();
    if (!result.ok) {
      const errorMessage = (() => {
        switch (result.error.kind) {
          case "InvalidPath":
            return `${result.error.path}: ${result.error.reason}`;
          case "PathNotFound":
          case "PermissionDenied":
            return result.error.path;
          case "ConfigurationError":
            return result.error.message;
          default:
            return "Unknown error";
        }
      })();
      throw new Error(`Path resolution failed: ${result.error.kind} - ${errorMessage}`);
    }
    return result.data.value;
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
    // Handle both legacy and new parameter structures
    if ("options" in this._cliParams) {
      return this._cliParams.options?.fromFile as string | undefined;
    }
    // For TwoParams_Result structure, adapt to legacy interface
    const twoParams = this._cliParams as TwoParams_Result;
    return (twoParams as unknown as { options?: { fromFile?: string } }).options?.fromFile;
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
    // Check if it's TotalityPromptCliParams structure
    const hasTotalityProps = (p: any): p is { directive: any; layer: any; options?: any } => {
      return p && typeof p === "object" && "directive" in p && "layer" in p &&
        p.directive && typeof p.directive === "object" && "value" in p.directive &&
        p.layer && typeof p.layer === "object" && "value" in p.layer;
    };

    if (hasTotalityProps(this._cliParams)) {
      // TotalityPromptCliParams structure - use layer.data
      const fromLayerType = this._cliParams.options?.fromLayerType as string | undefined;
      return fromLayerType || this._cliParams.layer.data || "";
    } else {
      // Legacy PromptCliParams structure
      const legacyParams = this._cliParams as DoubleParamsResult;
      return legacyParams.options?.fromLayerType || legacyParams.layerType || "";
    }
  }

  /**
   * Check if a path exists on the filesystem
   */
  private checkPathExists(path: string): boolean {
    if (path === "-" || path === "") return true;
    try {
      Deno.statSync(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Handle resolution errors and convert to appropriate error types
   */
  private handleResolutionError(error: unknown): Result<ResolvedInputPath, InputFilePathError> {
    if (error instanceof Deno.errors.NotFound) {
      return {
        ok: false,
        error: {
          kind: "PathNotFound",
          path: error.message || "Unknown path",
        },
      };
    }

    if (error instanceof Deno.errors.PermissionDenied) {
      return {
        ok: false,
        error: {
          kind: "PermissionDenied",
          path: error.message || "Unknown path",
        },
      };
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
   * Smart Constructor for creating InputFilePathResolver with validation
   * 
   * Following Totality principle:
   * - Private constructor enforces creation through smart constructor
   * - Comprehensive validation of all inputs
   * - Result type for explicit error handling
   * - No exceptions, all errors are represented as Result.error
   */
  static create(
    config: Record<string, unknown>,
    cliParams: DoubleParamsResult | TwoParams_Result,
  ): Result<InputFilePathResolver, InputFilePathError> {
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

    // Validate parameter structure based on type
    const validationResult = InputFilePathResolver.validateParameterStructure(cliParams);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Create instance with validated inputs
    const resolver = new InputFilePathResolver(config, cliParams);
    return ok(resolver);
  }

  /**
   * Validates the structure of CLI parameters
   * @private
   */
  private static validateParameterStructure(
    cliParams: DoubleParamsResult | TwoParams_Result,
  ): Result<void, InputFilePathError> {
    // Check for Totality parameters structure
    const hasTotalityProps = (p: any): p is { directive: any; layer: any; options?: any } => {
      return p && typeof p === "object" && "directive" in p && "layer" in p &&
        p.directive && typeof p.directive === "object" && "value" in p.directive &&
        p.layer && typeof p.layer === "object" && "value" in p.layer;
    };

    // Check for legacy parameters structure
    const hasLegacyProps = (p: any): p is { demonstrativeType: string; layerType: string } => {
      return p && typeof p === "object" && 
        "demonstrativeType" in p && "layerType" in p &&
        typeof p.demonstrativeType === "string" && typeof p.layerType === "string";
    };

    if (!hasTotalityProps(cliParams) && !hasLegacyProps(cliParams)) {
      return error({
        kind: "ConfigurationError",
        message: "CLI parameters must have either Totality structure (directive.data, layer.data) or legacy structure (demonstrativeType, layerType)",
      });
    }

    return ok(undefined);
  }
}
