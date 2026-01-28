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

import { isAbsolute, resolve } from "jsr:@std/path@^1.0.9";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import type { TwoParams_Result } from "../deps.ts";
import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import {
  type BaseResolverConfig,
  PathResolverBase,
  type ResolverCliParams,
} from "./path_resolver_base.ts";

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
 * Configuration for input file path resolver
 */
interface InputResolverConfig extends BaseResolverConfig {
  kind: "WithWorkingDir" | "NoWorkingDir";
}

/**
 * CLI options with explicit types
 */
export type InputCliOptions = {
  fromFile: string | undefined;
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
 * Extends PathResolverBase for common functionality
 */
export class InputFilePathResolverTotality extends PathResolverBase<InputResolverConfig> {
  /**
   * Private constructor following Smart Constructor pattern
   */
  private constructor(
    config: InputResolverConfig,
    cliParams: ResolverCliParams,
  ) {
    super(config, cliParams);
  }

  /**
   * Creates a new resolver instance with comprehensive validation
   */
  static create(
    config: Record<string, unknown>,
    cliParams: PromptCliParams | TwoParams_Result,
  ): Result<InputFilePathResolverTotality, InputFilePathError> {
    // Validate config using base class
    const configResult = PathResolverBase.validateBaseConfig(config);
    if (!configResult.ok) {
      return error({
        kind: "ConfigurationError",
        message: configResult.error.kind === "InvalidConfiguration"
          ? configResult.error.details
          : "Configuration must be a non-null object",
      });
    }

    // Validate cliParams using base class
    const paramsResult = PathResolverBase.validateCliParams(cliParams);
    if (!paramsResult.ok) {
      return error({
        kind: "ConfigurationError",
        message: "CLI parameters must be a non-null object",
      });
    }

    // Validate parameter structure
    const validationResult = InputFilePathResolverTotality.validateParameterStructure(
      cliParams,
    );
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
        workingDir: workingDir,
      };
    } else {
      return {
        kind: "NoWorkingDir",
        workingDir: Deno.cwd(),
      };
    }
  }

  /**
   * Validates the structure of CLI parameters
   */
  private static validateParameterStructure(
    cliParams: PromptCliParams | TwoParams_Result,
  ): Result<void, InputFilePathError> {
    // Check for TwoParams_Result structure
    const hasTwoParamsProps = (p: unknown): p is TwoParams_Result => {
      if (!p || typeof p !== "object" || Array.isArray(p)) return false;
      const obj = p as Record<string, unknown>;
      return "type" in obj && obj.type === "two";
    };

    // Check for legacy parameters structure (PromptCliParams)
    const hasLegacyProps = (p: unknown): boolean => {
      if (!p || typeof p !== "object" || Array.isArray(p)) return false;
      const obj = p as Record<string, unknown>;
      return "directiveType" in obj && "layerType" in obj &&
        typeof obj.directiveType === "string" && typeof obj.layerType === "string";
    };

    if (!hasTwoParamsProps(cliParams) && !hasLegacyProps(cliParams)) {
      return error({
        kind: "ConfigurationError",
        message: "CLI parameters must have valid structure",
        field: "cliParams",
      });
    }

    return ok(undefined);
  }

  /**
   * Resolves the input file path with comprehensive validation and error handling
   * Following Totality principle - no exceptions thrown, all errors as Result values
   */
  public getPath(): Result<ResolvedInputPath, InputFilePathError> {
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
    const resolveResult = this.resolvePath(normalizedFromFile, pathType);
    if (!resolveResult.ok) {
      return resolveResult;
    }

    const resolvedPath = resolveResult.data;

    // Check if path exists (safe operation that never throws)
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
  }

  /**
   * Extract options with proper type handling
   */
  private extractOptions(): InputCliOptions {
    const opts = this.getOptions<Record<string, unknown>>();
    return {
      fromFile: opts?.fromFile as string | undefined,
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
   * Following Totality principle - no exceptions thrown
   */
  private determinePathType(path: string): Result<PathType, InputFilePathError> {
    // Validate path input
    if (typeof path !== "string") {
      return error({
        kind: "PathNormalizationError",
        originalPath: String(path),
        reason: "Path must be a string",
      });
    }

    if (path.length === 0) {
      return error({
        kind: "PathNormalizationError",
        originalPath: path,
        reason: "Path cannot be empty",
      });
    }

    // Safe absolute path check (isAbsolute function is safe and never throws)
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
  }

  /**
   * Resolve path based on path type
   * Following Totality principle - no exceptions thrown
   */
  private resolvePath(
    normalizedPath: string,
    pathType: PathType,
  ): Result<string, InputFilePathError> {
    switch (pathType.kind) {
      case "Absolute":
        return ok(normalizedPath);
      case "Relative":
      case "Filename": {
        // Use safe path resolution - resolve function is safe
        const resolved = resolve(this.cwd, normalizedPath);
        return ok(resolved);
      }
      default:
        return error({
          kind: "ConfigurationError",
          message: "Unexpected path type during resolution",
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
   * Following Totality principle - returns explicit Result for all filesystem operations
   */
  private checkPathExistsResult(path: string): Result<boolean, InputFilePathError> {
    // Special cases that are always considered "existing"
    if (path === "-" || path === "") return ok(true);

    // Validate input path
    if (typeof path !== "string" || path.length === 0) {
      return error({
        kind: "InvalidPath",
        path: String(path),
        reason: "Path must be a non-empty string",
      });
    }

    // NOTE: This is the ONE remaining try-catch in the file, required because
    // Deno's filesystem APIs are inherently exception-based. The Totality principle
    // is preserved by:
    // 1. Explicitly handling ALL possible error cases
    // 2. Converting ALL exceptions to Result<T, E> values
    // 3. Never letting exceptions bubble up to callers
    // 4. Treating "file not found" as a normal non-error case (ok(false))

    // Attempt filesystem stat - convert OS exceptions to explicit Result values
    try {
      const _statResult = Deno.statSync(path);
      // If we reach here, file exists and is accessible
      return ok(true);
    } catch (err) {
      // Convert ALL possible filesystem exceptions to explicit Result values
      if (err instanceof Deno.errors.NotFound) {
        return ok(false); // File doesn't exist - normal case, not an error
      } else if (err instanceof Deno.errors.PermissionDenied) {
        return error({
          kind: "PermissionDenied",
          path,
          operation: "stat",
        });
      } else {
        // Handle any other filesystem error (BadResource, Busy, etc.)
        return error({
          kind: "InvalidPath",
          path,
          reason: err instanceof Error ? err.message : "Unknown filesystem error",
        });
      }
    }
  }

  /**
   * Simple boolean wrapper for checkPathExistsResult for cases where errors should be treated as false
   * This maintains backward compatibility while keeping the Result version available
   */
  private checkPathExists(path: string): boolean {
    const result = this.checkPathExistsResult(path);
    // If there's an error (like permission denied), treat as non-existent for this simple boolean check
    return result.ok ? result.data : false;
  }

  /**
   * Get the target directory for file organization
   */
  public getTargetDirectory(): Result<string, InputFilePathError> {
    const layerType = this.getLayerType();

    if (!layerType) {
      return error({
        kind: "ConfigurationError",
        message: "Unable to determine target directory",
        field: "layerType",
      });
    }

    return ok(layerType);
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
