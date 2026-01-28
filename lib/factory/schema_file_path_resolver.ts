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
import {
  type _DEFAULT_WORKSPACE_STRUCTURE,
  DEFAULT_SCHEMA_BASE_DIR,
  type DEFAULT_SCHEMA_WORKSPACE_DIR as _DEFAULT_SCHEMA_WORKSPACE_DIR,
} from "../config/constants.ts";
import {
  type BaseResolverConfig,
  PathResolverBase,
  type ResolverCliParams,
} from "./path_resolver_base.ts";

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
 * Configuration for schema file path resolver
 */
interface SchemaResolverConfig extends BaseResolverConfig {
  kind: "WithSchemaConfig" | "NoSchemaConfig";
  schemaBaseDir: string;
}

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
 * Extends PathResolverBase for common functionality
 */
export class SchemaFilePathResolverTotality extends PathResolverBase<SchemaResolverConfig> {
  /**
   * Private constructor following Smart Constructor pattern
   */
  private constructor(
    config: SchemaResolverConfig,
    cliParams: ResolverCliParams,
  ) {
    super(config, cliParams);
  }

  /**
   * Creates a new resolver instance with full validation
   *
   * Validates all inputs and ensures type safety throughout
   */
  static create(
    config: Record<string, unknown>,
    cliParams: PromptCliParams | TwoParams_Result,
  ): Result<SchemaFilePathResolverTotality, PathResolutionError> {
    // Validate config using base class
    const configResult = PathResolverBase.validateBaseConfig(config);
    if (!configResult.ok) {
      return configResult;
    }

    // Validate cliParams using base class
    const paramsResult = PathResolverBase.validateCliParams(cliParams);
    if (!paramsResult.ok) {
      return paramsResult;
    }

    // Validate parameter types using base class
    const typeResult = PathResolverBase.validateParameterTypes(cliParams as ResolverCliParams);
    if (!typeResult.ok) {
      return typeResult;
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
    const workingDir = (config.working_dir as string) || Deno.cwd();

    if (appSchema?.base_dir && typeof appSchema.base_dir === "string") {
      const schemaBaseDir = isAbsolute(appSchema.base_dir)
        ? appSchema.base_dir
        : resolve(workingDir, appSchema.base_dir);
      return {
        kind: "WithSchemaConfig",
        workingDir,
        schemaBaseDir,
      };
    } else {
      return {
        kind: "NoSchemaConfig",
        workingDir,
        schemaBaseDir: resolve(workingDir, DEFAULT_SCHEMA_BASE_DIR),
      };
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
    const baseDir = this.config.schemaBaseDir;

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
    case "AbsolutePathNotAllowed":
      return {
        kind: "ConfigurationError",
        message: error.message,
        setting: error.configKey,
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
