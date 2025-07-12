/**
 * @fileoverview Schema Path Value Object - Unified implementation following Totality design
 *
 * This module provides a unified SchemaPath value object that replaces all existing
 * scattered implementations with a single, comprehensive, type-safe solution.
 *
 * Replaces:
 * - lib/domain/generic/template_management/value_objects/schema_path.ts (basic Result)
 * - Similar implementations scattered throughout the codebase
 *
 * Design Principles:
 * 1. Smart Constructor pattern for type-safe creation
 * 2. Discriminated Union for comprehensive error handling
 * 3. Result type for Totality principle compliance
 * 4. Immutable value object following DDD principles
 * 5. JSON Schema-specific validation and verification
 *
 * @module domain/core/value_objects/schema_path
 */

import type { DirectiveType } from "./directive_type.ts";
import type { LayerType } from "./layer_type.ts";
import { error, ok, Result } from "../../../types/result.ts";
import { BasePathValueObject, DEFAULT_PATH_CONFIG, PathValidationConfig } from "./base_path.ts";

/**
 * Schema Path specific error types using Discriminated Union
 *
 * Each error type has a unique 'kind' discriminator for type safety
 * and provides specific context for different failure scenarios.
 */
export type SchemaPathError =
  | {
    kind: "InvalidDirective";
    message: string;
    directive?: string;
  }
  | {
    kind: "InvalidLayer";
    message: string;
    layer?: string;
  }
  | {
    kind: "InvalidSchemaFilename";
    message: string;
    filename: string;
    constraints: string[];
  }
  | {
    kind: "SchemaPathConstructionError";
    message: string;
    components: {
      directive?: string;
      layer?: string;
      filename?: string;
    };
  }
  | {
    kind: "JsonSchemaValidationError";
    message: string;
    attemptedPath: string;
    validation: "extension" | "syntax" | "structure";
  }
  | {
    kind: "SecurityViolation";
    message: string;
    attemptedPath: string;
    violation: "path_traversal" | "invalid_characters" | "suspicious_pattern";
  }
  | {
    kind: "ValidationError";
    field: string;
    message: string;
    value?: string;
  };

/**
 * Type guards for SchemaPathError discrimination
 * Enables type-safe error handling throughout the application
 */
export function isInvalidDirectiveError(
  error: SchemaPathError,
): error is Extract<SchemaPathError, { kind: "InvalidDirective" }> {
  return error.kind === "InvalidDirective";
}

export function isInvalidLayerError(
  error: SchemaPathError,
): error is Extract<SchemaPathError, { kind: "InvalidLayer" }> {
  return error.kind === "InvalidLayer";
}

export function isInvalidSchemaFilenameError(
  error: SchemaPathError,
): error is Extract<SchemaPathError, { kind: "InvalidSchemaFilename" }> {
  return error.kind === "InvalidSchemaFilename";
}

export function isSchemaPathConstructionError(
  error: SchemaPathError,
): error is Extract<SchemaPathError, { kind: "SchemaPathConstructionError" }> {
  return error.kind === "SchemaPathConstructionError";
}

export function isJsonSchemaValidationError(
  error: SchemaPathError,
): error is Extract<SchemaPathError, { kind: "JsonSchemaValidationError" }> {
  return error.kind === "JsonSchemaValidationError";
}

export function isSecurityViolationError(
  error: SchemaPathError,
): error is Extract<SchemaPathError, { kind: "SecurityViolation" }> {
  return error.kind === "SecurityViolation";
}

export function isValidationError(
  error: SchemaPathError,
): error is Extract<SchemaPathError, { kind: "ValidationError" }> {
  return error.kind === "ValidationError";
}

/**
 * Format schema path error for display
 * Provides consistent error messaging across the application
 */
export function formatSchemaPathError(schemaError: SchemaPathError): string {
  switch (schemaError.kind) {
    case "InvalidDirective":
      return `Invalid directive: ${schemaError.message}`;
    case "InvalidLayer":
      return `Invalid layer: ${schemaError.message}`;
    case "InvalidSchemaFilename":
      return `Invalid schema filename '${schemaError.filename}': ${schemaError.message}. Constraints: ${
        schemaError.constraints.join(", ")
      }`;
    case "SchemaPathConstructionError":
      return `Schema path construction failed: ${schemaError.message}`;
    case "JsonSchemaValidationError":
      return `JSON Schema validation failed for '${schemaError.attemptedPath}': ${schemaError.message}`;
    case "SecurityViolation":
      return `Security violation detected in path '${schemaError.attemptedPath}': ${schemaError.message}`;
    case "ValidationError":
      return `Validation error in ${schemaError.field}: ${schemaError.message}`;
  }
}

/**
 * Schema Path configuration with JSON Schema specific validation rules
 */
export interface SchemaPathConfig {
  /** Allowed file extensions for schema files */
  readonly allowedExtensions: readonly string[];
  /** Maximum filename length */
  readonly maxFilenameLength: number;
  /** Whether to allow custom directive types */
  readonly allowCustomDirectives: boolean;
  /** Whether to allow custom layer types */
  readonly allowCustomLayers: boolean;
  /** Whether to validate JSON schema syntax */
  readonly validateJsonSyntax: boolean;
  /** Base path validation configuration */
  readonly basePathConfig: PathValidationConfig;
}

/**
 * Default schema path configuration
 */
export const DEFAULT_SCHEMA_PATH_CONFIG: SchemaPathConfig = {
  allowedExtensions: [".schema.md", ".json"],
  maxFilenameLength: 120,
  allowCustomDirectives: false,
  allowCustomLayers: false,
  validateJsonSyntax: false, // Can be enabled when actual file content is available
  basePathConfig: {
    ...DEFAULT_PATH_CONFIG,
    allowAbsolute: false, // Schema paths are always relative
    requiredExtensions: [".schema.md", ".json"],
    maxLength: 220, // directive/layer/filename.schema.md
  },
};

/**
 * Schema Path Value Object
 *
 * Represents a validated path to a JSON schema file within the schema directory structure.
 * Follows the pattern: directive/layer/filename.schema.md or directive/layer/filename.json
 *
 * This class unifies all previous schema path implementations and provides:
 * - Type-safe construction through Smart Constructor pattern
 * - JSON Schema-specific validation with specific error types
 * - Immutable design following DDD principles
 * - Security validation to prevent path traversal attacks
 * - Integration with DirectiveType and LayerType domain objects
 *
 * @example Basic usage
 * ```typescript
 * const directiveResult = DirectiveType.create(twoParamsResult);
 * const layerResult = LayerType.create(twoParamsResult);
 *
 * if (directiveResult && layerResult) {
 *   const pathResult = SchemaPath.create(directiveResult, layerResult, "base.schema.md");
 *   if (pathResult.ok) {
 *     console.log(pathResult.data.getFullPath()); // "to/project/base.schema.md"
 *   }
 * }
 * ```
 *
 * @example With JSON file
 * ```typescript
 * const pathResult = SchemaPath.create(directive, layer, "output.json");
 * ```
 *
 * @example With custom configuration
 * ```typescript
 * const config: SchemaPathConfig = {
 *   ...DEFAULT_SCHEMA_PATH_CONFIG,
 *   allowedExtensions: ['.json', '.yaml'],
 *   validateJsonSyntax: true,
 * };
 *
 * const pathResult = SchemaPath.createWithConfig(directive, layer, "custom.json", config);
 * ```
 */
export class SchemaPath extends BasePathValueObject {
  /**
   * Private constructor enforcing Smart Constructor pattern
   *
   * @param directive The validated directive type
   * @param layer The validated layer type
   * @param filename The validated schema filename
   * @param fullPath The complete validated path string
   * @param schemaType The detected schema type (json or markdown)
   */
  private constructor(
    private readonly directive: DirectiveType,
    private readonly layer: LayerType,
    private readonly filename: string,
    fullPath: string,
    private readonly schemaType: "json" | "markdown",
  ) {
    super(fullPath, false); // Don't freeze immediately
    // Freeze after all properties are set
    this.freezeObject();
  }

  /**
   * Smart Constructor for SchemaPath with default configuration
   *
   * Creates a validated SchemaPath instance using standard schema path rules.
   * This is the primary factory method for most use cases.
   *
   * @param directive The directive type (e.g., "to", "summary", "defect")
   * @param layer The layer type (e.g., "project", "issue", "task")
   * @param filename The schema filename (must end with .schema.md or .json)
   * @returns Result containing SchemaPath or specific error
   */
  static create(
    directive: DirectiveType,
    layer: LayerType,
    filename: string,
  ): Result<SchemaPath, SchemaPathError> {
    return SchemaPath.createWithConfig(directive, layer, filename, DEFAULT_SCHEMA_PATH_CONFIG);
  }

  /**
   * Smart Constructor for SchemaPath with custom configuration
   *
   * Provides full control over validation rules and constraints.
   * Useful for testing, custom environments, or special use cases.
   *
   * @param directive The directive type
   * @param layer The layer type
   * @param filename The schema filename
   * @param config Custom validation configuration
   * @returns Result containing SchemaPath or specific error
   */
  static createWithConfig(
    directive: DirectiveType,
    layer: LayerType,
    filename: string,
    config: SchemaPathConfig,
  ): Result<SchemaPath, SchemaPathError> {
    // Stage 1: Validate inputs are present
    const inputValidation = SchemaPath.validateInputs(directive, layer, filename);
    if (!inputValidation.ok) {
      return inputValidation;
    }

    // Stage 2: Validate directive
    const directiveValidation = SchemaPath.validateDirective(directive, config);
    if (!directiveValidation.ok) {
      return directiveValidation;
    }

    // Stage 3: Validate layer
    const layerValidation = SchemaPath.validateLayer(layer, config);
    if (!layerValidation.ok) {
      return layerValidation;
    }

    // Stage 4: Validate schema filename
    const filenameValidation = SchemaPath.validateSchemaFilename(filename, config);
    if (!filenameValidation.ok) {
      return filenameValidation;
    }

    // Stage 5: Detect schema type
    const schemaType = SchemaPath.detectSchemaType(filename);

    // Stage 6: Construct full path
    const pathConstruction = SchemaPath.constructPath(directive, layer, filename);
    if (!pathConstruction.ok) {
      return pathConstruction;
    }

    const fullPath = pathConstruction.data;

    // Stage 7: Security validation using base class
    const baseValidation = super.createPath(
      fullPath,
      config.basePathConfig,
      (normalizedPath) => new SchemaPath(directive, layer, filename, normalizedPath, schemaType),
    );

    if (!baseValidation.ok) {
      // Convert base path errors to schema path errors
      return error({
        kind: "SecurityViolation",
        message: "Path failed security validation",
        attemptedPath: fullPath,
        violation: "suspicious_pattern",
      });
    }

    return baseValidation;
  }

  /**
   * Factory for common schema types
   */
  static createJsonSchema(layer: LayerType, filename: string): Result<SchemaPath, SchemaPathError> {
    const toResult = { getValue: () => "to" } as DirectiveType;
    const jsonFilename = filename.endsWith(".json") ? filename : `${filename}.json`;
    return SchemaPath.create(toResult, layer, jsonFilename);
  }

  static createMarkdownSchema(
    layer: LayerType,
    filename: string,
  ): Result<SchemaPath, SchemaPathError> {
    const toResult = { getValue: () => "to" } as DirectiveType;
    const mdFilename = filename.endsWith(".schema.md") ? filename : `${filename}.schema.md`;
    return SchemaPath.create(toResult, layer, mdFilename);
  }

  static createDefectSchema(
    layer: LayerType,
    filename: string,
  ): Result<SchemaPath, SchemaPathError> {
    const defectResult = { getValue: () => "defect" } as DirectiveType;
    return SchemaPath.create(defectResult, layer, filename);
  }

  /**
   * Get the directive component
   */
  getDirective(): DirectiveType {
    return this.directive;
  }

  /**
   * Get the layer component
   */
  getLayer(): LayerType {
    return this.layer;
  }

  /**
   * Get the filename component
   */
  override getFilename(): string {
    return this.filename;
  }

  /**
   * Get the schema type (json or markdown)
   */
  getSchemaType(): "json" | "markdown" {
    return this.schemaType;
  }

  /**
   * Get the full schema path
   * Format: directive/layer/filename.schema.md or directive/layer/filename.json
   */
  getFullPath(): string {
    return this.getValue();
  }

  /**
   * Get path relative to a base directory
   */
  getRelativePath(baseDir: string): string {
    const cleanBase = baseDir.replace(/[/\\]+$/, ""); // Remove trailing slashes
    return `${cleanBase}/${this.getFullPath()}`;
  }

  /**
   * Check if this schema path equals another
   */
  override equals(other: SchemaPath): boolean {
    return super.equals(other) &&
      this.directive.equals(other.directive) &&
      this.layer.equals(other.layer) &&
      this.filename === other.filename &&
      this.schemaType === other.schemaType;
  }

  /**
   * Get schema path components as object
   */
  getComponents(): {
    directive: string;
    layer: string;
    filename: string;
    extension: string;
    schemaType: "json" | "markdown";
  } {
    return {
      directive: this.directive.getValue(),
      layer: this.layer.getValue(),
      filename: this.filename,
      extension: this.getExtension(),
      schemaType: this.schemaType,
    };
  }

  /**
   * Check if this is a JSON schema file
   */
  isJsonSchema(): boolean {
    return this.schemaType === "json";
  }

  /**
   * Check if this is a Markdown schema file
   */
  isMarkdownSchema(): boolean {
    return this.schemaType === "markdown";
  }

  /**
   * Get expected content type for this schema
   */
  getExpectedContentType(): string {
    switch (this.schemaType) {
      case "json":
        return "application/json";
      case "markdown":
        return "text/markdown";
    }
  }

  /**
   * Convert to debug string representation
   */
  toDebugString(): string {
    const components = this.getComponents();
    return `SchemaPath{directive=${components.directive}, layer=${components.layer}, filename=${components.filename}, type=${components.schemaType}}`;
  }

  // Private validation methods

  /**
   * Validate required inputs are present and valid
   */
  private static validateInputs(
    directive: DirectiveType,
    layer: LayerType,
    filename: string,
  ): Result<void, SchemaPathError> {
    if (!directive) {
      return error({
        kind: "InvalidDirective",
        message: "Directive cannot be null or undefined",
      });
    }

    if (!layer) {
      return error({
        kind: "InvalidLayer",
        message: "Layer cannot be null or undefined",
      });
    }

    if (!filename || typeof filename !== "string") {
      return error({
        kind: "InvalidSchemaFilename",
        message: "Schema filename cannot be null, undefined, or non-string",
        filename: String(filename),
        constraints: ["must be non-empty string"],
      });
    }

    const trimmedFilename = filename.trim();
    if (trimmedFilename.length === 0) {
      return error({
        kind: "InvalidSchemaFilename",
        message: "Schema filename cannot be empty or whitespace only",
        filename: filename,
        constraints: ["must contain non-whitespace characters"],
      });
    }

    return ok(undefined);
  }

  /**
   * Validate directive type
   */
  private static validateDirective(
    directive: DirectiveType,
    _config: SchemaPathConfig,
  ): Result<void, SchemaPathError> {
    try {
      const directiveValue = directive.getValue();

      if (!directiveValue || directiveValue.trim().length === 0) {
        return error({
          kind: "InvalidDirective",
          message: "Directive value cannot be empty",
          directive: directiveValue,
        });
      }

      // Additional directive-specific validation could go here

      return ok(undefined);
    } catch (dirError) {
      return error({
        kind: "InvalidDirective",
        message: `Failed to validate directive: ${
          dirError instanceof Error ? dirError.message : String(dirError)
        }`,
      });
    }
  }

  /**
   * Validate layer type
   */
  private static validateLayer(
    layer: LayerType,
    _config: SchemaPathConfig,
  ): Result<void, SchemaPathError> {
    try {
      const layerValue = layer.getValue();

      if (!layerValue || layerValue.trim().length === 0) {
        return error({
          kind: "InvalidLayer",
          message: "Layer value cannot be empty",
          layer: layerValue,
        });
      }

      // Additional layer-specific validation could go here

      return ok(undefined);
    } catch (layerError) {
      return error({
        kind: "InvalidLayer",
        message: `Failed to validate layer: ${
          layerError instanceof Error ? layerError.message : String(layerError)
        }`,
      });
    }
  }

  /**
   * Validate schema filename with JSON Schema specific rules
   */
  private static validateSchemaFilename(
    filename: string,
    config: SchemaPathConfig,
  ): Result<void, SchemaPathError> {
    const trimmedFilename = filename.trim();
    const constraints: string[] = [];

    // Length validation
    if (trimmedFilename.length > config.maxFilenameLength) {
      constraints.push(`max length ${config.maxFilenameLength} characters`);
      return error({
        kind: "InvalidSchemaFilename",
        message: `Schema filename is too long (${trimmedFilename.length} characters)`,
        filename: trimmedFilename,
        constraints,
      });
    }

    // Extension validation
    const hasValidExtension = config.allowedExtensions.some((ext) =>
      trimmedFilename.toLowerCase().endsWith(ext.toLowerCase())
    );

    if (!hasValidExtension) {
      constraints.push(`must end with: ${config.allowedExtensions.join(", ")}`);
      return error({
        kind: "InvalidSchemaFilename",
        message: "Invalid schema file extension",
        filename: trimmedFilename,
        constraints,
      });
    }

    // Character validation (basic security)
    const suspiciousChars = ["\0", "\r", "\n", "..", "<", ">", "|", "*", "?", '"'];
    const foundSuspicious = suspiciousChars.filter((char) => trimmedFilename.includes(char));

    if (foundSuspicious.length > 0) {
      constraints.push("no suspicious characters");
      return error({
        kind: "InvalidSchemaFilename",
        message: `Contains forbidden characters: ${foundSuspicious.join(", ")}`,
        filename: trimmedFilename,
        constraints,
      });
    }

    return ok(undefined);
  }

  /**
   * Detect schema type from filename
   */
  private static detectSchemaType(filename: string): "json" | "markdown" {
    const trimmedFilename = filename.trim().toLowerCase();

    if (trimmedFilename.endsWith(".json")) {
      return "json";
    }

    if (trimmedFilename.endsWith(".schema.md")) {
      return "markdown";
    }

    // Default to markdown for backward compatibility
    return "markdown";
  }

  /**
   * Construct the full path from components
   */
  private static constructPath(
    directive: DirectiveType,
    layer: LayerType,
    filename: string,
  ): Result<string, SchemaPathError> {
    try {
      const directiveValue = directive.getValue();
      const layerValue = layer.getValue();
      const trimmedFilename = filename.trim();

      // Construct path with forward slashes for consistency
      const fullPath = `${directiveValue}/${layerValue}/${trimmedFilename}`;

      return ok(fullPath);
    } catch (constructionError) {
      return error({
        kind: "SchemaPathConstructionError",
        message: `Failed to construct schema path: ${
          constructionError instanceof Error ? constructionError.message : String(constructionError)
        }`,
        components: {
          directive: directive?.getValue(),
          layer: layer?.getValue(),
          filename: filename,
        },
      });
    }
  }
}
