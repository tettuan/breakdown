/**
 * @fileoverview Input file path resolution with full Totality principle applied.
 *
 * This is a refactored version of InputFilePathResolver that implements:
 * - Enhanced Result type usage with more specific errors
 * - Discriminated unions for path resolution states
 * - Improved validation and error messages
 * - Path normalization as a first-class concept
 *
 * @module factory/input_file_path_resolver_totality
 */

import { isAbsolute, resolve } from "@std/path";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import type { TwoParams_Result } from "./prompt_variables_factory.ts";
import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";

// Legacy type alias for backward compatibility during migration
type DoubleParamsResult = PromptCliParams;

/**
 * Enhanced error types for Input File Path Resolution
 * More specific error cases for better error handling
 */
export type InputFilePathError =
  | { kind: "InvalidPath"; path: string; reason: string }
  | { kind: "PathNotFound"; path: string; checkedAt: string }
  | { kind: "PermissionDenied"; path: string; operation: string }
  | { kind: "ConfigurationError"; message: string; field?: string }
  | { kind: "PathNormalizationError"; originalPath: string; reason: string }
  | { kind: "InvalidCharacters"; path: string; invalidChars: string[] };

/**
 * Path type as discriminated union for better type safety
 */
export type PathType =
  | { kind: "Stdin" }
  | { kind: "Empty" }
  | { kind: "Absolute"; normalized: string }
  | { kind: "Relative"; normalized: string; hasHierarchy: boolean }
  | { kind: "Filename"; name: string };

/**
 * Configuration with explicit states
 */
export type InputResolverConfig =
  | { kind: "WithWorkingDir"; working_dir: string }
  | { kind: "NoWorkingDir" };

/**
 * CLI options with explicit types
 */
export type InputCliOptions = {
  fromFile: string | undefined;
  fromLayerType: string | undefined;
};

/**
 * Enhanced resolved input file path with richer metadata
 */
export class ResolvedInputPath {
  private constructor(
    readonly value: string,
    readonly pathType: PathType,
    readonly exists: boolean,
    readonly metadata: {
      originalPath?: string;
      resolvedFrom: "cli" | "config" | "default";
      workingDirectory: string;
      normalizedPath?: string;
      validationPerformed: boolean;
    },
  ) {}

  /**
   * Smart constructor for ResolvedInputPath
   */
  static create(
    value: string,
    pathType: PathType,
    exists: boolean,
    metadata: ResolvedInputPath["metadata"],
  ): Result<ResolvedInputPath, Error> {
    // Validate stdin special case
    if (pathType.kind === "Stdin" && value !== "-") {
      return error(new Error("Stdin path type must have value '-'"));
    }

    // Validate empty path
    if (pathType.kind === "Empty" && value !== "") {
      return error(new Error("Empty path type must have empty value"));
    }

    // Validate absolute paths
    if (pathType.kind === "Absolute" && !isAbsolute(value)) {
      return error(new Error("Absolute path type must have absolute value"));
    }

    return ok(new ResolvedInputPath(value, pathType, exists, metadata));
  }

  /**
   * Get a descriptive message about the path resolution
   */
  getDescription(): string {
    switch (this.pathType.kind) {
      case "Stdin":
        return "Reading from standard input";
      case "Empty":
        return "No input file specified";
      case "Absolute":
        return `Absolute path: ${this.value}`;
      case "Relative":
        return `Relative path: ${this.value} (hierarchy: ${this.pathType.hasHierarchy})`;
      case "Filename":
        return `Filename only: ${this.pathType.name}`;
    }
  }

  /**
   * Check if this is a valid input source
   */
  isValidInput(): boolean {
    return this.pathType.kind === "Stdin" || this.exists;
  }
}

/**
 * Input file path resolver with full Totality implementation
 */
export class InputFilePathResolverTotality {
  private readonly config: InputResolverConfig;
  private readonly _cliParams: DoubleParamsResult | TwoParams_Result;
  private readonly cwd: string;

  /**
   * Private constructor following Smart Constructor pattern
   */
  private constructor(
    config: InputResolverConfig,
    cliParams: DoubleParamsResult | TwoParams_Result,
  ) {
    this.config = config;
    this._cliParams = this.deepCopyCliParams(cliParams);
    this.cwd = Deno.cwd();
  }

  /**
   * Creates a new resolver instance with comprehensive validation
   */
  static create(
    config: Record<string, unknown>,
    cliParams: DoubleParamsResult | TwoParams_Result,
  ): Result<InputFilePathResolverTotality, InputFilePathError> {
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
    const validationResult = InputFilePathResolverTotality.validateParameterStructure(cliParams);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Convert config to discriminated union
    const resolverConfig = InputFilePathResolverTotality.normalizeConfig(config);

    return ok(new InputFilePathResolverTotality(resolverConfig, cliParams));
  }

  /**
   * Convert raw config to discriminated union
   */
  private static normalizeConfig(config: Record<string, unknown>): InputResolverConfig {
    const workingDir = config.working_dir;

    if (workingDir && typeof workingDir === "string") {
      return {
        kind: "WithWorkingDir",
        working_dir: workingDir,
      };
    } else {
      return { kind: "NoWorkingDir" };
    }
  }

  /**
   * Validates the structure of CLI parameters
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

    // Check for TwoParams_Result structure
    const hasTwoParamsProps = (p: any): p is TwoParams_Result => {
      return p && typeof p === "object" && "type" in p && p.type === "two";
    };

    if (
      !hasTotalityProps(cliParams) && !hasLegacyProps(cliParams) && !hasTwoParamsProps(cliParams)
    ) {
      return error({
        kind: "ConfigurationError",
        message: "CLI parameters must have valid structure",
        field: "cliParams",
      });
    }

    return ok(undefined);
  }

  /**
   * Deep copy CLI parameters for immutability
   */
  private deepCopyCliParams(
    cliParams: DoubleParamsResult | TwoParams_Result,
  ): DoubleParamsResult | TwoParams_Result {
    // Check if it's TotalityPromptCliParams by checking for directive and layer properties
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
    } else if ("type" in cliParams && cliParams.type === "two") {
      // TwoParams_Result structure
      const twoParams = cliParams as TwoParams_Result;
      const copy: TwoParams_Result = {
        type: "two",
        params: twoParams.params ? [...twoParams.params] : [],
        demonstrativeType: twoParams.demonstrativeType || "",
        layerType: twoParams.layerType || "",
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
   * Resolves the input file path with comprehensive validation and error handling
   */
  public getPath(): Result<ResolvedInputPath, InputFilePathError> {
    try {
      const options = this.extractOptions();
      const fromFile = options.fromFile;

      // No file specified - return empty path
      if (!fromFile) {
        const pathResult = ResolvedInputPath.create(
          "",
          { kind: "Empty" },
          false,
          {
            resolvedFrom: "default",
            workingDirectory: this.cwd,
            validationPerformed: true,
          },
        );

        if (!pathResult.ok) {
          return error({
            kind: "ConfigurationError",
            message: pathResult.error.message,
          });
        }
        return pathResult;
      }

      // Handle stdin input
      if (fromFile === "-") {
        const pathResult = ResolvedInputPath.create(
          "-",
          { kind: "Stdin" },
          true,
          {
            originalPath: fromFile,
            resolvedFrom: "cli",
            workingDirectory: this.cwd,
            validationPerformed: true,
          },
        );

        if (!pathResult.ok) {
          return error({
            kind: "ConfigurationError",
            message: pathResult.error.message,
          });
        }
        return pathResult;
      }

      // Validate and normalize path
      const validationResult = this.validatePath(fromFile);
      if (!validationResult.ok) {
        return validationResult;
      }

      const normalizedFromFile = this.normalizePath(fromFile);

      // Determine path type and resolve
      const pathTypeResult = this.determinePathType(normalizedFromFile);
      if (!pathTypeResult.ok) {
        return pathTypeResult;
      }

      const pathType = pathTypeResult.data;
      let resolvedPath: string;

      switch (pathType.kind) {
        case "Absolute":
          resolvedPath = normalizedFromFile;
          break;
        case "Relative":
        case "Filename":
          resolvedPath = resolve(this.cwd, normalizedFromFile);
          break;
        default:
          return error({
            kind: "ConfigurationError",
            message: "Unexpected path type",
          });
      }

      // Check if path exists
      const exists = this.checkPathExists(resolvedPath);

      // Create resolved path object
      const pathResult = ResolvedInputPath.create(
        resolvedPath,
        pathType,
        exists,
        {
          originalPath: fromFile,
          resolvedFrom: "cli",
          workingDirectory: this.cwd,
          normalizedPath: normalizedFromFile,
          validationPerformed: true,
        },
      );

      if (!pathResult.ok) {
        return error({
          kind: "ConfigurationError",
          message: pathResult.error.message,
        });
      }

      return pathResult;
    } catch (err) {
      return this.handleResolutionError(err);
    }
  }

  /**
   * Extract options with proper type handling
   */
  private extractOptions(): InputCliOptions {
    if ("options" in this._cliParams) {
      const opts = this._cliParams.options as Record<string, unknown>;
      return {
        fromFile: opts?.fromFile as string | undefined,
        fromLayerType: opts?.fromLayerType as string | undefined,
      };
    }

    // For TwoParams_Result structure
    const twoParams = this._cliParams as TwoParams_Result;
    const opts = (twoParams as unknown as { options?: Record<string, unknown> }).options || {};
    return {
      fromFile: opts.fromFile as string | undefined,
      fromLayerType: opts.fromLayerType as string | undefined,
    };
  }

  /**
   * Validate path for invalid characters and patterns
   */
  private validatePath(path: string): Result<void, InputFilePathError> {
    // Check for null character
    if (path.includes("\0")) {
      return error({
        kind: "InvalidCharacters",
        path,
        invalidChars: ["\\0"],
      });
    }

    // Check for other invalid characters (platform-specific)
    const invalidChars: string[] = [];
    if (Deno.build.os === "windows") {
      const windowsInvalid = ["<", ">", ":", '"', "|", "?", "*"];
      for (const char of windowsInvalid) {
        if (path.includes(char) && char !== ":") { // Allow : for drive letters
          invalidChars.push(char);
        }
      }
    }

    if (invalidChars.length > 0) {
      return error({
        kind: "InvalidCharacters",
        path,
        invalidChars,
      });
    }

    return ok(undefined);
  }

  /**
   * Normalize path for cross-platform compatibility
   */
  private normalizePath(p: string): string {
    return p.replace(/\\/g, "/");
  }

  /**
   * Determine the type of path with detailed classification
   */
  private determinePathType(path: string): Result<PathType, InputFilePathError> {
    try {
      if (isAbsolute(path)) {
        return ok({ kind: "Absolute", normalized: path });
      }

      const hasHierarchy = this.hasPathHierarchy(path);

      if (hasHierarchy) {
        return ok({ kind: "Relative", normalized: path, hasHierarchy: true });
      }

      // Simple filename or relative path without hierarchy
      if (path.startsWith("./") || path.startsWith("../")) {
        return ok({ kind: "Relative", normalized: path, hasHierarchy: false });
      }

      // Just a filename
      return ok({ kind: "Filename", name: path });
    } catch (err) {
      return error({
        kind: "PathNormalizationError",
        originalPath: path,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Check if path has directory hierarchy
   */
  private hasPathHierarchy(p: string): boolean {
    const normalized = p.replace(/\\/g, "/");
    if (normalized.startsWith("./") || normalized.startsWith("../")) {
      return false;
    }
    return normalized.includes("/");
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
  private handleResolutionError(err: unknown): Result<ResolvedInputPath, InputFilePathError> {
    if (err instanceof Deno.errors.NotFound) {
      return error({
        kind: "PathNotFound",
        path: err.message || "Unknown path",
        checkedAt: new Date().toISOString(),
      });
    }

    if (err instanceof Deno.errors.PermissionDenied) {
      return error({
        kind: "PermissionDenied",
        path: err.message || "Unknown path",
        operation: "read",
      });
    }

    return error({
      kind: "ConfigurationError",
      message: err instanceof Error ? err.message : String(err),
    });
  }

  /**
   * Get the target directory for file organization
   */
  public getTargetDirectory(): Result<string, InputFilePathError> {
    const options = this.extractOptions();

    // Check if it's TotalityPromptCliParams structure
    const hasTotalityProps = (p: any): p is { directive: any; layer: any; options?: any } => {
      return p && typeof p === "object" && "directive" in p && "layer" in p &&
        p.directive && typeof p.directive === "object" && "value" in p.directive &&
        p.layer && typeof p.layer === "object" && "value" in p.layer;
    };

    let directory: string;

    if (hasTotalityProps(this._cliParams)) {
      // TotalityPromptCliParams structure - use layer.value
      const fromLayerType = options.fromLayerType;
      directory = fromLayerType || this._cliParams.layer.value || "";
    } else if ("layerType" in this._cliParams) {
      // Legacy PromptCliParams structure
      const legacyParams = this._cliParams as DoubleParamsResult;
      directory = options.fromLayerType || legacyParams.layerType || "";
    } else {
      // TwoParams_Result structure
      const twoParams = this._cliParams as TwoParams_Result;
      directory = options.fromLayerType || twoParams.layerType || "";
    }

    if (!directory) {
      return error({
        kind: "ConfigurationError",
        message: "Unable to determine target directory",
        field: "layerType",
      });
    }

    return ok(directory);
  }
}

/**
 * Format input file path error for user-friendly display
 */
export function formatInputFilePathError(error: InputFilePathError): string {
  switch (error.kind) {
    case "InvalidPath":
      return `Invalid path: ${error.path}\nReason: ${error.reason}`;

    case "PathNotFound":
      return `Path not found: ${error.path}\nChecked at: ${error.checkedAt}`;

    case "PermissionDenied":
      return `Permission denied: ${error.path}\nOperation: ${error.operation}`;

    case "ConfigurationError":
      return error.field
        ? `Configuration error in field '${error.field}': ${error.message}`
        : `Configuration error: ${error.message}`;

    case "PathNormalizationError":
      return `Failed to normalize path: ${error.originalPath}\nReason: ${error.reason}`;

    case "InvalidCharacters":
      return `Invalid characters in path: ${error.path}\nInvalid characters: ${
        error.invalidChars.join(", ")
      }`;

    default:
      return "Unknown input file path error";
  }
}
