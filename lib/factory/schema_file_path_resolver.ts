/**
 * @fileoverview Schema file path resolution for Breakdown CLI operations.
 *
 * This module provides the SchemaFilePathResolver class that handles the
 * resolution of JSON schema file paths based on CLI parameters and configuration.
 * It supports the hierarchical schema organization used by Breakdown's
 * 3-layer architecture (demonstrative type → layer type → schema files).
 *
 * The resolver follows Breakdown's schema conventions and ensures consistent
 * schema file discovery across different execution contexts and configurations.
 *
 * Following Totality principle and DDD:
 * - Smart Constructor pattern for safe instance creation
 * - Result type for explicit error handling
 * - Shared domain types with PromptTemplatePathResolver
 * - 100% deterministic schema path resolution
 *
 * @module factory/schema_file_path_resolver
 */

import { isAbsolute, join, resolve } from "@std/path";
import { existsSync } from "@std/fs";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import type { TwoParams_Result } from "../deps.ts";
import { error as resultError, ok as resultOk, type Result } from "../types/result.ts";
import type { PathResolutionError } from "../types/path_resolution_option.ts";

// Legacy type alias for backward compatibility during migration
type DoubleParams_Result = PromptCliParams;

/**
 * Discriminated Union for schema file path specific errors
 *
 * Each error type has a unique 'kind' discriminator for type safety
 * and follows Domain-Driven Design principles for error handling.
 */
export type SchemaFilePathError =
  | {
    kind: "SchemaNotFound";
    message: string;
    path: string;
  }
  | {
    kind: "InvalidParameters";
    message: string;
    demonstrativeType: string;
    layerType: string;
  }
  | {
    kind: "ConfigurationError";
    message: string;
    setting: string;
  }
  | {
    kind: "FileSystemError";
    message: string;
    operation: string;
    originalError?: Error;
  };

/**
 * Value object representing a resolved schema file path
 */
export class SchemaPath {
  private constructor(
    readonly value: string,
    readonly metadata: {
      baseDir: string;
      demonstrativeType: string;
      layerType: string;
      fileName: string;
    },
  ) {}

  /**
   * Create a SchemaPath instance (Smart Constructor)
   */
  static create(
    path: string,
    metadata: SchemaPath["metadata"],
  ): Result<SchemaPath, Error> {
    if (!path || path.trim() === "") {
      return resultError(new Error("Schema path cannot be empty"));
    }
    if (!isAbsolute(path)) {
      return resultError(new Error("Schema path must be absolute"));
    }
    return resultOk(new SchemaPath(path, metadata));
  }

  /**
   * Get a descriptive message about the schema path
   */
  getDescription(): string {
    return `Schema: ${this.metadata.demonstrativeType}/${this.metadata.layerType}/${this.metadata.fileName}`;
  }
}

/**
 * Schema file path resolver for Breakdown CLI operations.
 *
 * The SchemaFilePathResolver class handles the resolution of JSON schema file
 * paths according to Breakdown's hierarchical organization structure. It resolves
 * schema files based on demonstrative type and layer type, following the pattern:
 * {schema_base_dir}/{demonstrativeType}/{layerType}/base.schema.md
 *
 * Schema File Organization:
 * - Base directory: from configuration or default ".agent/breakdown/schema"
 * - Demonstrative type: "to", "summary", etc.
 * - Layer type: "project", "issue", "task"
 * - Standard filename: "base.schema.md"
 *
 * @example
 * ```typescript
 * const resolver = new SchemaFilePathResolver(config, cliParams);
 *
 * // Schema path for "to project" command
 * const projectSchema = resolver.getPath(); // "/schema/to/project/base.schema.md"
 *
 * // Schema path for "summary issue" command
 * const issueSchema = resolver.getPath(); // "/schema/summary/issue/base.schema.md"
 * ```
 */
export class SchemaFilePathResolver {
  private readonly config: { app_schema?: { base_dir?: string } } & Record<string, unknown>;
  private readonly _cliParams: DoubleParams_Result | TwoParams_Result;

  /**
   * Private constructor following Smart Constructor pattern
   * Inputs are already validated by the smart constructor
   */
  private constructor(
    config: { app_schema?: { base_dir?: string } } & Record<string, unknown>,
    cliParams: DoubleParams_Result | TwoParams_Result,
  ) {
    // Deep copy to ensure immutability - inputs are already validated
    this.config = this.deepCopyConfig(config);
    this._cliParams = this.deepCopyCliParams(cliParams);
  }

  /**
   * Creates a new SchemaFilePathResolver instance (Smart Constructor)
   *
   * @param config - The configuration object containing schema base directory settings
   * @param cliParams - The parsed CLI parameters containing demonstrative and layer types
   * @returns Result containing resolver instance or error
   *
   * @example
   * ```typescript
   * const config = {
   *   app_schema: { base_dir: "lib/breakdown/schema" }
   * };
   * const cliParams = {
   *   demonstrativeType: "to",
   *   layerType: "project",
   *   options: {}
   * };
   * const resolverResult = SchemaFilePathResolver.create(config, cliParams);
   * if (resolverResult.ok) {
   *   const resolver = resolverResult.data;
   *   // Use resolver
   * }
   * ```
   */
  static create(
    config: { app_schema?: { base_dir?: string } } & Record<string, unknown>,
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): Result<SchemaFilePathResolver, PathResolutionError> {
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
    const demonstrativeType = SchemaFilePathResolver.extractDemonstrativeType(cliParams);
    const layerType = SchemaFilePathResolver.extractLayerType(cliParams);

    if (!demonstrativeType || !layerType) {
      return resultError({
        kind: "InvalidParameterCombination",
        demonstrativeType: demonstrativeType || "(missing)",
        layerType: layerType || "(missing)",
      });
    }

    // Validate that extracted values are non-empty strings
    if (demonstrativeType.trim() === "" || layerType.trim() === "") {
      return resultError({
        kind: "InvalidParameterCombination",
        demonstrativeType: demonstrativeType || "(empty)",
        layerType: layerType || "(empty)",
      });
    }

    return resultOk(new SchemaFilePathResolver(config, cliParams));
  }

  /**
   * Deep copy configuration object manually to avoid JSON.parse
   * @param config - The configuration object to copy
   * @returns Deep copy of the configuration
   */
  private deepCopyConfig(
    config: { app_schema?: { base_dir?: string } } & Record<string, unknown>,
  ): { app_schema?: { base_dir?: string } } & Record<string, unknown> {
    const copy: any = {};

    // Copy app_schema
    if (config.app_schema) {
      copy.app_schema = {};
      if (config.app_schema.base_dir !== undefined) {
        copy.app_schema.base_dir = config.app_schema.base_dir;
      }
    }

    // Copy other properties shallowly (should be primitive or immutable)
    for (const [key, value] of Object.entries(config)) {
      if (key !== "app_schema") {
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
        type: "two",
        params: twoParams.params || [],
        demonstrativeType: twoParams.params?.[0] || "",
        layerType: twoParams.params?.[1] || "",
        options: {},
      };
      return copy;
    } else {
      // DoubleParams_Result (PromptCliParams)
      const doubleParams = cliParams as DoubleParams_Result;
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
   * Resolves the complete schema file path according to CLI parameters and configuration.
   *
   * This method implements the schema path resolution strategy by combining
   * the base directory, demonstrative type, layer type, and standard filename
   * to construct the full path to the appropriate schema file.
   *
   * @returns Result containing resolved SchemaPath or error
   *
   * @example
   * ```typescript
   * const resolverResult = SchemaFilePathResolver.create(config, cliParams);
   * if (!resolverResult.ok) {
   *   console.error(resolverResult.error);
   *   return;
   * }
   *
   * const pathResult = resolverResult.data.getPath();
   * if (pathResult.ok) {
   *   const schemaPath = pathResult.data;
   *   console.log("Schema path:", schemaPath.data);
   *   console.log("Description:", schemaPath.getDescription());
   * } else {
   *   console.error("Schema resolution failed:", pathResult.error);
   * }
   * ```
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
    const schemaPath = this.buildSchemaPath(baseDir, fileName);
    const demonstrativeType = this.getDemonstrativeType();
    const layerType = this.getLayerType();

    // Create SchemaPath value object
    const pathResult = SchemaPath.create(schemaPath, {
      baseDir,
      demonstrativeType,
      layerType,
      fileName,
    });

    if (!pathResult.ok) {
      return resultError({
        kind: "InvalidConfiguration",
        details: pathResult.error.message,
      });
    }

    // Check if schema file exists
    if (!existsSync(schemaPath)) {
      return resultError({
        kind: "TemplateNotFound",
        attempted: [schemaPath],
        fallback: "No schema file found at expected location",
      });
    }

    return pathResult;
  }

  /**
   * Resolves the base directory for schema files from configuration.
   * Legacy method maintained for backward compatibility.
   * @deprecated Use resolveBaseDirSafe() for Result-based error handling
   */
  public resolveBaseDir(): string {
    const result = this.resolveBaseDirSafe();
    if (!result.ok) {
      // Maintain backward compatibility by returning default
      return resolve(Deno.cwd(), ".agent/breakdown/schema");
    }
    return result.data;
  }

  /**
   * Safely resolves the base directory with Result type
   *
   * @returns Result containing resolved base directory or error
   */
  private resolveBaseDirSafe(): Result<string, PathResolutionError> {
    let baseDir = this.config.app_schema?.base_dir || ".agent/breakdown/schema";
    if (!isAbsolute(baseDir)) {
      baseDir = resolve(Deno.cwd(), baseDir);
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
   * Builds the standard filename for schema files.
   *
   * This method returns the standardized filename used for all schema files
   * in the Breakdown system. The filename follows the convention of using
   * "base.schema.md" for all schema definitions.
   *
   * @returns string - The standard schema filename "base.schema.md"
   *
   * @example
   * ```typescript
   * const filename = this.buildFileName(); // "base.schema.md"
   * ```
   */
  public buildFileName(): string {
    return "base.schema.md";
  }

  /**
   * Builds the complete schema file path from components.
   *
   * This method constructs the full path to a schema file by combining the
   * base directory, demonstrative type, layer type, and filename according
   * to Breakdown's hierarchical schema organization structure.
   *
   * @param baseDir - The resolved base directory for schema files
   * @param fileName - The schema filename (typically "base.schema.md")
   * @returns string - The complete path to the schema file
   *
   * @example
   * ```typescript
   * const baseDir = "/path/to/schema";
   * const fileName = "base.schema.md";
   *
   * // For "to project" command
   * const path1 = this.buildSchemaPath(baseDir, fileName);
   * // Returns: "/path/to/schema/to/project/base.schema.md"
   *
   * // For "summary issue" command
   * const path2 = this.buildSchemaPath(baseDir, fileName);
   * // Returns: "/path/to/schema/summary/issue/base.schema.md"
   * ```
   */
  public buildSchemaPath(baseDir: string, fileName: string): string {
    const demonstrativeType = this.getDemonstrativeType() || "";
    const layerType = this.getLayerType() || "";
    return join(baseDir, demonstrativeType, layerType, fileName);
  }

  /**
   * Gets the demonstrative type with compatibility handling
   * @returns string - The demonstrative type value
   */
  private getDemonstrativeType(): string {
    return SchemaFilePathResolver.extractDemonstrativeType(this._cliParams);
  }

  /**
   * Static helper to extract demonstrative type from parameters
   */
  private static extractDemonstrativeType(
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): string {
    // Handle both legacy and new parameter structures
    if ("demonstrativeType" in cliParams) {
      return cliParams.demonstrativeType || "";
    }
    // For TwoParams_Result structure from breakdownparams
    const twoParams = cliParams as TwoParams_Result;
    if (twoParams.type === "two" && twoParams.params && twoParams.params.length > 0) {
      return twoParams.params[0] || "";
    }
    return "";
  }

  /**
   * Gets the layer type with compatibility handling
   * @returns string - The layer type value
   */
  private getLayerType(): string {
    return SchemaFilePathResolver.extractLayerType(this._cliParams);
  }

  /**
   * Static helper to extract layer type from parameters
   */
  private static extractLayerType(cliParams: DoubleParams_Result | TwoParams_Result): string {
    // Handle both legacy and new parameter structures
    if ("layerType" in cliParams) {
      return cliParams.layerType || "";
    }
    // For TwoParams_Result structure from breakdownparams
    const twoParams = cliParams as TwoParams_Result;
    if (twoParams.type === "two" && twoParams.params && twoParams.params.length > 1) {
      return twoParams.params[1] || "";
    }
    return "";
  }

  /**
   * Legacy method to get path as Result<string, SchemaFilePathError>
   * @deprecated Use getPath() for Result-based error handling
   */
  public getPathAsString(): Result<string, SchemaFilePathError> {
    const result = this.getPath();
    if (!result.ok) {
      // Convert PathResolutionError to SchemaFilePathError
      return { ok: false, error: this.convertToSchemaFilePathError(result.error) };
    }
    return { ok: true, data: result.data.value };
  }

  /**
   * Convert PathResolutionError to SchemaFilePathError for backward compatibility
   */
  private convertToSchemaFilePathError(error: PathResolutionError): SchemaFilePathError {
    switch (error.kind) {
      case "InvalidConfiguration":
        return {
          kind: "ConfigurationError",
          message: error.details || "Invalid configuration",
          setting: "schema_config",
        };
      case "BaseDirectoryNotFound":
        return {
          kind: "SchemaNotFound",
          message: `Base directory not found: ${error.path}`,
          path: error.path || "",
        };
      case "InvalidParameterCombination":
        return {
          kind: "InvalidParameters",
          message: `Invalid parameter combination: ${error.demonstrativeType} / ${error.layerType}`,
          demonstrativeType: error.demonstrativeType || "",
          layerType: error.layerType || "",
        };
      case "TemplateNotFound":
        return {
          kind: "SchemaNotFound",
          message: `Schema file not found at: ${error.attempted[0]}`,
          path: error.attempted[0] || "",
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
          path: error.path || "",
        };

      case "NoValidFallback":
        return {
          kind: "SchemaNotFound",
          message: `No valid fallback found. Attempts: ${error.attempts.join(", ")}`,
          path: error.attempts[0] || "",
        };

      case "ValidationFailed":
        return {
          kind: "SchemaNotFound",
          message: `Validation failed for path: ${error.path}`,
          path: error.path || "",
        };

      default:
        return {
          kind: "FileSystemError",
          message: "Unknown error occurred",
          operation: "path_resolution",
        };
    }
  }

  /**
   * Legacy method that throws exceptions for existing callers
   * @deprecated Use getPath() or getPathAsString() which returns Result type
   */
  public getPathAsStringUnsafe(): string {
    const result = this.getPath();
    if (!result.ok) {
      throw new Error(`Schema path resolution failed: ${formatSchemaError(result.error)}`);
    }
    return result.data.value;
  }
}

/**
 * Format schema resolution error for user-friendly display
 */
export function formatSchemaError(error: PathResolutionError): string {
  switch (error.kind) {
    case "InvalidConfiguration":
      return `Schema Configuration Error: ${error.details}`;

    case "BaseDirectoryNotFound":
      return `Schema Base Directory Not Found: ${error.path}\n` +
        `Please ensure the schema base directory exists or update your configuration.`;

    case "InvalidParameterCombination":
      return `Invalid Schema Parameters:\n` +
        `  Demonstrative Type: ${error.demonstrativeType}\n` +
        `  Layer Type: ${error.layerType}\n` +
        `Both parameters are required for schema resolution.`;

    case "TemplateNotFound":
      return `Schema file not found: ${error.attempted[0]}\n` +
        `Please ensure the schema file exists at the expected location.`;

    case "InvalidStrategy":
      return `Invalid Strategy: ${error.strategy}`;

    case "EmptyBaseDir":
      return `Base directory is empty`;

    case "InvalidPath":
      return `Invalid Path: ${error.path} - ${error.reason}`;

    case "NoValidFallback":
      return `No valid fallback found. Attempts: ${error.attempts.join(", ")}`;

    case "ValidationFailed":
      return `Validation failed for path: ${error.path}`;

    default:
      return `Unknown schema error occurred`;
  }
}

/**
 * Type guards for SchemaFilePathError discrimination
 * Enables type-safe error handling throughout the application
 */
export function isSchemaNotFoundError(
  error: SchemaFilePathError,
): error is Extract<SchemaFilePathError, { kind: "SchemaNotFound" }> {
  return error.kind === "SchemaNotFound";
}

export function isInvalidParametersError(
  error: SchemaFilePathError,
): error is Extract<SchemaFilePathError, { kind: "InvalidParameters" }> {
  return error.kind === "InvalidParameters";
}

export function isConfigurationError(
  error: SchemaFilePathError,
): error is Extract<SchemaFilePathError, { kind: "ConfigurationError" }> {
  return error.kind === "ConfigurationError";
}

export function isFileSystemError(
  error: SchemaFilePathError,
): error is Extract<SchemaFilePathError, { kind: "FileSystemError" }> {
  return error.kind === "FileSystemError";
}

/**
 * Format SchemaFilePathError for user-friendly display
 */
export function formatSchemaFilePathError(error: SchemaFilePathError): string {
  switch (error.kind) {
    case "SchemaNotFound":
      return `Schema file not found: ${error.path}`;
    case "InvalidParameters":
      return `Invalid parameters - Demonstrative: ${error.demonstrativeType}, Layer: ${error.layerType}`;
    case "ConfigurationError":
      return `Configuration error in ${error.setting}: ${error.message}`;
    case "FileSystemError":
      return `File system error during ${error.operation}: ${error.message}`;
  }
}
