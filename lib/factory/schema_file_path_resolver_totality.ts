/**
 * @fileoverview Schema file path resolution with full Totality principle applied.
 *
 * This is a refactored version of SchemaFilePathResolver that implements:
 * - Complete Result type usage (no partial functions)
 * - Discriminated unions for optional properties
 * - Exhaustive error handling
 * - No null returns or exceptions
 * - Improved type safety
 *
 * @module factory/schema_file_path_resolver_totality
 */

import { isAbsolute, join, resolve } from "jsr:@std/path@^1.0.9";
import { existsSync } from "jsr:@std/fs@0.224.0";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import type { TwoParams_Result } from "../deps.ts";
import { error as resultError, ok as resultOk, type Result } from "../types/result.ts";
import type { PathResolutionError } from "../types/path_resolution_option.ts";

// Legacy type alias for backward compatibility during migration
type DoubleParams_Result = PromptCliParams;

// Default schema base directory
const DEFAULT_SCHEMA_BASE_DIR = ".agent/breakdown/schema";

/**
 * Schema-specific errors as discriminated union
 */
export type SchemaPathError =
  | { kind: "SchemaNotFound"; path: string; attempted: string[] }
  | { kind: "InvalidSchemaPath"; path: string; reason: string }
  | { kind: "SchemaValidationFailed"; details: string };

export type SchemaFilePathError =
  | { kind: "SchemaNotFound"; message: string; path: string }
  | { kind: "InvalidParameters"; message: string; directiveType: string; layerType: string }
  | { kind: "ConfigurationError"; message: string; setting: string }
  | { kind: "FileSystemError"; message: string; operation: string; originalError?: Error };

/**
 * Type guard for SchemaNotFound errors
 */
export function isSchemaNotFoundError(
  error: SchemaFilePathError,
): error is SchemaFilePathError & { kind: "SchemaNotFound" } {
  return error.kind === "SchemaNotFound";
}

/**
 * Type guard for InvalidParameters errors
 */
export function isInvalidParametersError(
  error: SchemaFilePathError,
): error is SchemaFilePathError & { kind: "InvalidParameters" } {
  return error.kind === "InvalidParameters";
}

/**
 * Type guard for ConfigurationError errors
 */
export function isConfigurationError(
  error: SchemaFilePathError,
): error is SchemaFilePathError & { kind: "ConfigurationError" } {
  return error.kind === "ConfigurationError";
}

/**
 * Type guard for FileSystemError errors
 */
export function isFileSystemError(
  error: SchemaFilePathError,
): error is SchemaFilePathError & { kind: "FileSystemError" } {
  return error.kind === "FileSystemError";
}

/**
 * Configuration with explicit union types instead of optionals
 */
export type SchemaResolverConfig =
  | { kind: "WithSchemaConfig"; app_schema: { base_dir: string } }
  | { kind: "NoSchemaConfig" };

/**
 * Value object representing a resolved schema file path with validation
 */
export class SchemaPath {
  private constructor(
    readonly value: string,
    readonly metadata: {
      baseDir: string;
      directiveType: string;
      layerType: string;
      fileName: string;
      isDefault: boolean;
    },
  ) {}

  /**
   * Create a SchemaPath instance (Smart Constructor)
   * Ensures all schema paths are valid and absolute
   */
  static create(
    path: string,
    metadata: Omit<SchemaPath["metadata"], "isDefault">,
  ): Result<SchemaPath, Error> {
    if (!path || path.trim() === "") {
      return resultError(new Error("Schema path cannot be empty"));
    }
    if (!isAbsolute(path)) {
      return resultError(new Error("Schema path must be absolute"));
    }

    // Validate schema file naming convention
    if (!path.endsWith(".schema.md")) {
      return resultError(new Error("Schema file must end with '.schema.md'"));
    }

    // Check if using default base directory
    const isDefault = metadata.baseDir === resolve(Deno.cwd(), DEFAULT_SCHEMA_BASE_DIR);

    return resultOk(new SchemaPath(path, { ...metadata, isDefault }));
  }

  /**
   * Get a descriptive message about the schema path
   */
  getDescription(): string {
    const defaultNote = this.metadata.isDefault ? " (using default)" : "";
    return `Schema: ${this.metadata.directiveType}/${this.metadata.layerType}/${this.metadata.fileName}${defaultNote}`;
  }

  /**
   * Check if this schema path exists on filesystem
   */
  exists(): boolean {
    return existsSync(this.value);
  }

  /**
   * Get the schema directory path
   */
  getDirectory(): string {
    return join(
      this.metadata.baseDir,
      this.metadata.directiveType,
      this.metadata.layerType,
    );
  }
}

/**
 * Schema file path resolver with full Totality implementation
 */
export class SchemaFilePathResolverTotality {
  private readonly config: SchemaResolverConfig;
  private readonly _cliParams: DoubleParams_Result | TwoParams_Result;

  /**
   * Private constructor following Smart Constructor pattern
   */
  private constructor(
    config: SchemaResolverConfig,
    cliParams: DoubleParams_Result | TwoParams_Result,
  ) {
    this.config = config;
    this._cliParams = this.deepCopyCliParams(cliParams);
  }

  /**
   * Creates a new resolver instance with full validation
   *
   * Validates all inputs and ensures type safety throughout
   */
  static create(
    config: Record<string, unknown>,
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): Result<SchemaFilePathResolverTotality, PathResolutionError> {
    // Validate configuration presence and type
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      return resultError({
        kind: "InvalidConfiguration",
        details: "Configuration must be a non-null object",
      });
    }

    // Validate cliParams presence and type
    if (!cliParams || typeof cliParams !== "object" || Array.isArray(cliParams)) {
      return resultError({
        kind: "InvalidConfiguration",
        details: "CLI parameters must be a non-null object",
      });
    }

    // Validate CLI parameters structure and content
    const directiveType = SchemaFilePathResolverTotality.extractDirectiveType(cliParams);
    const layerType = SchemaFilePathResolverTotality.extractLayerType(cliParams);

    if (!directiveType || !layerType) {
      return resultError({
        kind: "InvalidParameterCombination",
        directiveType: directiveType || "(missing)",
        layerType: layerType || "(missing)",
      });
    }

    // Validate that extracted values are non-empty strings
    if (directiveType.trim() === "" || layerType.trim() === "") {
      return resultError({
        kind: "InvalidParameterCombination",
        directiveType: directiveType || "(empty)",
        layerType: layerType || "(empty)",
      });
    }

    // Convert config to discriminated union
    const resolverConfig = SchemaFilePathResolverTotality.normalizeConfig(config);

    return resultOk(new SchemaFilePathResolverTotality(resolverConfig, cliParams));
  }

  /**
   * Convert raw config to discriminated union
   * Eliminates optional properties in favor of explicit states
   */
  private static normalizeConfig(config: Record<string, unknown>): SchemaResolverConfig {
    const appSchema = config.app_schema as { base_dir?: string } | undefined;

    if (appSchema?.base_dir && typeof appSchema.base_dir === "string") {
      return {
        kind: "WithSchemaConfig",
        app_schema: { base_dir: appSchema.base_dir },
      };
    } else {
      return { kind: "NoSchemaConfig" };
    }
  }

  /**
   * Deep copy CLI parameters for immutability
   */
  private deepCopyCliParams(
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): DoubleParams_Result | TwoParams_Result {
    if ("type" in cliParams && cliParams.type === "two") {
      // TwoParams_Result from breakdownparams
      const twoParams = cliParams as TwoParams_Result;
      const copy: TwoParams_Result = {
        type: "two",
        params: twoParams.params ? [...twoParams.params] : [],
        layerType: twoParams.params?.[1] || "",
        directiveType: twoParams.params?.[0] || "",
        options: { ...twoParams.options },
      } as TwoParams_Result;
      return copy;
    } else {
      // DoubleParams_Result (PromptCliParams)
      const doubleParams = cliParams as DoubleParams_Result;
      const copy: DoubleParams_Result = {
        layerType: doubleParams.layerType || "",
        directiveType: doubleParams.directiveType || "",
        options: doubleParams.options ? { ...doubleParams.options } : {},
      } as DoubleParams_Result;
      return copy;
    }
  }

  /**
   * Resolves the complete schema file path with comprehensive error handling
   *
   * Always returns a Result type - never throws exceptions
   */
  public getPath(): Result<SchemaPath, PathResolutionError> {
    // Resolve base directory
    const baseDirResult = this.resolveBaseDirSafe();
    if (!baseDirResult.ok) {
      return baseDirResult;
    }
    const baseDir = baseDirResult.data;

    // Build components
    const fileName = this.buildFileName();
    const directiveType = this.getDirectiveType();
    const layerType = this.getLayerType();
    const schemaPath = this.buildSchemaPath(baseDir, fileName);

    // Create SchemaPath value object
    const pathResult = SchemaPath.create(schemaPath, {
      baseDir,
      directiveType,
      layerType,
      fileName,
    });

    if (!pathResult.ok) {
      return resultError({
        kind: "InvalidConfiguration",
        details: pathResult.error.message,
      });
    }

    const schemaPathObj = pathResult.data;

    // Check if schema file exists
    if (!schemaPathObj.exists()) {
      // Provide helpful error with directory structure hint
      const directory = schemaPathObj.getDirectory();
      return resultError({
        kind: "TemplateNotFound",
        attempted: [schemaPath],
        fallback: `Schema file not found. Expected location: ${schemaPath}\n` +
          `Ensure the schema directory exists: ${directory}`,
      });
    }

    return pathResult;
  }

  /**
   * Safely resolves the base directory with Result type
   * Never returns null or throws exceptions
   */
  private resolveBaseDirSafe(): Result<string, PathResolutionError> {
    let baseDir: string;

    switch (this.config.kind) {
      case "WithSchemaConfig":
        baseDir = this.config.app_schema.base_dir;
        break;
      case "NoSchemaConfig":
        baseDir = DEFAULT_SCHEMA_BASE_DIR;
        break;
      // Exhaustive check - TypeScript ensures all cases are handled
      default: {
        const _exhaustive: never = this.config;
        return _exhaustive;
      }
    }

    // Ensure absolute path
    if (!isAbsolute(baseDir)) {
      baseDir = resolve(Deno.cwd(), baseDir);
    }

    // Validate base directory format
    if (baseDir.includes("\0")) {
      return resultError({
        kind: "InvalidPath",
        path: baseDir,
        reason: "Path contains null character",
      });
    }

    // Verify base directory exists
    if (!existsSync(baseDir)) {
      return resultError({
        kind: "BaseDirectoryNotFound",
        path: baseDir,
      });
    }

    return resultOk(baseDir);
  }

  /**
   * Builds the standard filename for schema files
   * Schema files always use the same standardized name
   */
  public buildFileName(): string {
    return "base.schema.md";
  }

  /**
   * Builds the complete schema file path from components
   * Ensures consistent path structure across the system
   */
  public buildSchemaPath(baseDir: string, fileName: string): string {
    const directiveType = this.getDirectiveType();
    const layerType = this.getLayerType();

    // Validate path components
    if (!directiveType || !layerType) {
      // This should never happen due to constructor validation
      // but provides defense in depth
      return join(baseDir, "unknown", "unknown", fileName);
    }

    return join(baseDir, directiveType, layerType, fileName);
  }

  /**
   * Gets the directive type with validation
   */
  private getDirectiveType(): string {
    const type: string = SchemaFilePathResolverTotality.extractDirectiveType(this._cliParams);
    return type || "unknown";
  }

  /**
   * Static helper to extract directive type
   * Handles multiple parameter formats safely
   */
  private static extractDirectiveType(
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): string {
    // Handle both legacy and new parameter structures
    if ("directiveType" in cliParams && cliParams.directiveType) {
      return cliParams.directiveType;
    }
    // For TwoParams_Result structure from breakdownparams
    const twoParams = cliParams as TwoParams_Result;
    if (twoParams.type === "two" && twoParams.params && twoParams.params.length > 0) {
      return twoParams.params[0] || "";
    }
    return "";
  }

  /**
   * Gets the layer type with validation
   */
  private getLayerType(): string {
    const type: string = SchemaFilePathResolverTotality.extractLayerType(this._cliParams);
    return type || "unknown";
  }

  /**
   * Static helper to extract layer type
   * Handles multiple parameter formats safely
   */
  private static extractLayerType(cliParams: DoubleParams_Result | TwoParams_Result): string {
    // Handle both legacy and new parameter structures
    if ("layerType" in cliParams && cliParams.layerType) {
      return cliParams.layerType;
    }
    // For TwoParams_Result structure from breakdownparams
    const twoParams = cliParams as TwoParams_Result;
    if (twoParams.type === "two" && twoParams.params && twoParams.params.length > 1) {
      return twoParams.params[1] || "";
    }
    return "";
  }

  /**
   * Get all possible schema paths for debugging
   * Useful for error messages and troubleshooting
   */
  public getPossiblePaths(): Result<string[], PathResolutionError> {
    const baseDirResult = this.resolveBaseDirSafe();
    if (!baseDirResult.ok) {
      return baseDirResult;
    }

    const baseDir = baseDirResult.data;
    const fileName = this.buildFileName();
    const directiveType = this.getDirectiveType();
    const layerType = this.getLayerType();

    const paths = [
      join(baseDir, directiveType, layerType, fileName),
      join(baseDir, directiveType, fileName), // Fallback without layer
      join(baseDir, fileName), // Root fallback
    ];

    return resultOk(paths);
  }

  /**
   * Validate schema file content structure
   * Ensures schema files meet expected format
   */
  public validateSchemaContent(content: string): Result<void, SchemaPathError> {
    if (!content || content.trim() === "") {
      return resultError({
        kind: "SchemaValidationFailed",
        details: "Schema content is empty",
      });
    }

    // Basic validation - ensure it looks like a schema
    if (!content.includes("# Schema") && !content.includes("## Schema")) {
      return resultError({
        kind: "SchemaValidationFailed",
        details: "Schema file missing schema header",
      });
    }

    return resultOk(undefined);
  }
}

/**
 * Alias for backward compatibility
 */
export const SchemaFilePathResolver = SchemaFilePathResolverTotality;
export type SchemaFilePathResolver = SchemaFilePathResolverTotality;

/**
 * Convert PathResolutionError to SchemaFilePathError for schema-specific error handling
 */
export function pathResolutionErrorToSchemaFilePathError(
  error: PathResolutionError,
): SchemaFilePathError {
  switch (error.kind) {
    case "InvalidConfiguration":
      return {
        kind: "ConfigurationError",
        message: error.details,
        setting: "schema_config",
      };
    case "BaseDirectoryNotFound":
      return {
        kind: "SchemaNotFound",
        message: `Base directory not found: ${error.path}`,
        path: error.path,
      };
    case "InvalidParameterCombination":
      return {
        kind: "InvalidParameters",
        message: `Invalid parameter combination: ${error.directiveType}/${error.layerType}`,
        directiveType: error.directiveType,
        layerType: error.layerType,
      };
    case "TemplateNotFound":
      return {
        kind: "SchemaNotFound",
        message: `Template not found at ${error.attempted[0]}`,
        path: error.attempted[0],
      };
    case "InvalidStrategy":
      return {
        kind: "ConfigurationError",
        message: `Invalid strategy: ${error.strategy}`,
        setting: "path_strategy",
      };
    case "EmptyBaseDir":
      return {
        kind: "ConfigurationError",
        message: "Base directory is empty",
        setting: "base_directory",
      };
    case "InvalidPath":
      return {
        kind: "SchemaNotFound",
        message: `Invalid path: ${error.path} - ${error.reason}`,
        path: error.path,
      };
    case "NoValidFallback":
      return {
        kind: "SchemaNotFound",
        message: `No valid fallback found. Attempted: ${error.attempts.join(", ")}`,
        path: error.attempts[0],
      };
    case "PathValidationFailed":
      return {
        kind: "SchemaNotFound",
        message: `Path validation failed: ${error.path}`,
        path: error.path,
      };
    // Handle PathError types
    case "PathNotFound":
      return {
        kind: "SchemaNotFound",
        message: `Path not found: ${error.path}`,
        path: error.path,
      };
    case "DirectoryNotFound":
      return {
        kind: "SchemaNotFound",
        message: `Directory not found: ${error.path}`,
        path: error.path,
      };
    case "PermissionDenied":
      return {
        kind: "FileSystemError",
        message: `Permission denied: ${error.path}`,
        operation: "access",
      };
    case "PathTooLong":
      return {
        kind: "SchemaNotFound",
        message: `Path too long: ${error.path} (max: ${error.maxLength})`,
        path: error.path,
      };
    // Handle ConfigurationError types
    case "ConfigurationError":
      return {
        kind: "ConfigurationError",
        message: error.message,
        setting: error.source || "unknown",
      };
    case "ProfileNotFound":
      return {
        kind: "ConfigurationError",
        message: `Profile not found: ${error.profile}`,
        setting: "profile",
      };
    case "ConfigLoadError":
      return {
        kind: "ConfigurationError",
        message: error.message,
        setting: "config_load",
      };
    default: {
      // Exhaustive check - TypeScript ensures all cases are handled
      const _exhaustive: never = error;
      return _exhaustive;
    }
  }
}

/**
 * Convert SchemaFilePathError to PathResolutionError for unified error handling
 */
export function schemaFilePathErrorToPathResolutionError(
  error: SchemaFilePathError,
): PathResolutionError {
  switch (error.kind) {
    case "SchemaNotFound":
      return {
        kind: "TemplateNotFound",
        attempted: [error.path],
        fallback: error.message,
      };
    case "InvalidParameters":
      return {
        kind: "InvalidParameterCombination",
        directiveType: error.directiveType,
        layerType: error.layerType,
      };
    case "ConfigurationError":
      return {
        kind: "InvalidConfiguration",
        details: `${error.message} (setting: ${error.setting})`,
      };
    case "FileSystemError":
      return {
        kind: "InvalidPath",
        path: "schema",
        reason: `${error.message} (operation: ${error.operation})`,
      };
  }
}

/**
 * Format schema resolution error for user-friendly display
 * Provides actionable error messages
 */
export function formatSchemaError(error: PathResolutionError): string {
  switch (error.kind) {
    case "InvalidConfiguration":
      return `Schema Configuration Error: ${error.details}`;

    case "BaseDirectoryNotFound":
      return `Schema Base Directory Not Found: ${error.path}\n` +
        `Please ensure the schema base directory exists or update your configuration.\n` +
        `Expected location: ${error.path}`;

    case "InvalidParameterCombination":
      return `Invalid Schema Parameters:\n` +
        `  Demonstrative Type: ${error.directiveType}\n` +
        `  Layer Type: ${error.layerType}\n` +
        `Both parameters are required for schema resolution.`;

    case "TemplateNotFound":
      return `Schema file not found at expected location:\n` +
        `  ${error.attempted[0]}\n\n` +
        `Please ensure the schema file exists with the standard name 'base.schema.md'\n` +
        `${error.fallback || ""}`;

    case "InvalidStrategy":
      return `Invalid Strategy: ${error.strategy}`;

    case "EmptyBaseDir":
      return `Base directory is empty`;

    case "InvalidPath":
      return `Invalid Path: ${error.path}\n` +
        `Reason: ${error.reason}`;

    case "NoValidFallback":
      return `No valid schema fallback found.\n` +
        `Attempted paths: ${error.attempts.join(", ")}`;

    case "PathValidationFailed":
      return `Schema path validation failed: ${error.path} (rule: ${error.rule})`;

    default:
      return `Unknown schema error occurred`;
  }
}
