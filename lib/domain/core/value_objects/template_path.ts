/**
 * @fileoverview Template Path Value Object - Unified implementation following Totality design
 *
 * This module provides a unified TemplatePath value object that replaces all existing
 * scattered implementations with a single, comprehensive, type-safe solution.
 *
 * Replaces:
 * - lib/domain/templates/prompt_generation_aggregate.ts::TemplatePath (exception-based)
 * - lib/domain/generic/template_management/value_objects/prompt_path.ts (basic Result)
 *
 * Design Principles:
 * 1. Smart Constructor pattern for type-safe creation
 * 2. Discriminated Union for comprehensive error handling
 * 3. Result type for Totality principle compliance
 * 4. Immutable value object following DDD principles
 * 5. Security validation and path normalization
 *
 * @module domain/core/value_objects/template_path
 */

import type { DirectiveType } from "../../../types/directive_type.ts";
import type { LayerType } from "../../../types/layer_type.ts";
import { error, ok, Result } from "../../../types/result.ts";
import { BasePathValueObject, DEFAULT_PATH_CONFIG, PathValidationConfig } from "./base_path.ts";

/**
 * Template Path specific error types using Discriminated Union
 *
 * Each error type has a unique 'kind' discriminator for type safety
 * and provides specific context for different failure scenarios.
 */
export type TemplatePathError =
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
    kind: "InvalidFilename";
    message: string;
    filename: string;
    constraints: string[];
  }
  | {
    kind: "PathConstructionError";
    message: string;
    components: {
      directive?: string;
      layer?: string;
      filename?: string;
    };
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
 * Type guards for TemplatePathError discrimination
 * Enables type-safe error handling throughout the application
 */
export function isInvalidDirectiveError(
  error: TemplatePathError,
): error is Extract<TemplatePathError, { kind: "InvalidDirective" }> {
  return error.kind === "InvalidDirective";
}

export function isInvalidLayerError(
  error: TemplatePathError,
): error is Extract<TemplatePathError, { kind: "InvalidLayer" }> {
  return error.kind === "InvalidLayer";
}

export function isInvalidFilenameError(
  error: TemplatePathError,
): error is Extract<TemplatePathError, { kind: "InvalidFilename" }> {
  return error.kind === "InvalidFilename";
}

export function isPathConstructionError(
  error: TemplatePathError,
): error is Extract<TemplatePathError, { kind: "PathConstructionError" }> {
  return error.kind === "PathConstructionError";
}

export function isSecurityViolationError(
  error: TemplatePathError,
): error is Extract<TemplatePathError, { kind: "SecurityViolation" }> {
  return error.kind === "SecurityViolation";
}

export function isValidationError(
  error: TemplatePathError,
): error is Extract<TemplatePathError, { kind: "ValidationError" }> {
  return error.kind === "ValidationError";
}

/**
 * Format template path error for display
 * Provides consistent error messaging across the application
 */
export function formatTemplatePathError(templateError: TemplatePathError): string {
  switch (templateError.kind) {
    case "InvalidDirective":
      return `Invalid directive: ${templateError.message}`;
    case "InvalidLayer":
      return `Invalid layer: ${templateError.message}`;
    case "InvalidFilename":
      return `Invalid filename '${templateError.filename}': ${templateError.message}. Constraints: ${
        templateError.constraints.join(", ")
      }`;
    case "PathConstructionError":
      return `Path construction failed: ${templateError.message}`;
    case "SecurityViolation":
      return `Security violation detected in path '${templateError.attemptedPath}': ${templateError.message}`;
    case "ValidationError":
      return `Validation error in ${templateError.field}: ${templateError.message}`;
  }
}

/**
 * Template Path configuration with validation rules
 */
export interface TemplatePathConfig {
  /** Allowed file extensions for template files */
  readonly allowedExtensions: readonly string[];
  /** Maximum filename length */
  readonly maxFilenameLength: number;
  /** Whether to allow custom directive types */
  readonly allowCustomDirectives: boolean;
  /** Whether to allow custom layer types */
  readonly allowCustomLayers: boolean;
  /** Base path validation configuration */
  readonly basePathConfig: PathValidationConfig;
}

/**
 * Default template path configuration
 */
export const DEFAULT_TEMPLATE_PATH_CONFIG: TemplatePathConfig = {
  allowedExtensions: [".md"],
  maxFilenameLength: 100,
  allowCustomDirectives: false,
  allowCustomLayers: false,
  basePathConfig: {
    ...DEFAULT_PATH_CONFIG,
    allowAbsolute: false, // Template paths are always relative
    requiredExtensions: [".md"],
    maxLength: 200, // directive/layer/filename.md
  },
};

/**
 * Template Path Value Object
 *
 * Represents a validated path to a prompt template file within the template directory structure.
 * Follows the pattern: directive/layer/filename.md
 *
 * This class unifies all previous template path implementations and provides:
 * - Type-safe construction through Smart Constructor pattern
 * - Comprehensive validation with specific error types
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
 *   const pathResult = TemplatePath.create(directiveResult, layerResult, "base.md");
 *   if (pathResult.ok) {
 *     console.log(pathResult.data.getFullPath()); // "to/project/base.md"
 *   }
 * }
 * ```
 *
 * @example With custom configuration
 * ```typescript
 * const config: TemplatePathConfig = {
 *   ...DEFAULT_TEMPLATE_PATH_CONFIG,
 *   allowedExtensions: ['.md', '.txt'],
 *   allowCustomDirectives: true,
 * };
 *
 * const pathResult = TemplatePath.createWithConfig(directive, layer, "custom.txt", config);
 * ```
 */
export class TemplatePath extends BasePathValueObject {
  /**
   * Private constructor enforcing Smart Constructor pattern
   *
   * @param directive The validated directive type
   * @param layer The validated layer type
   * @param filename The validated filename
   * @param fullPath The complete validated path string
   */
  private constructor(
    private readonly directive: DirectiveType,
    private readonly layer: LayerType,
    private readonly filename: string,
    fullPath: string,
  ) {
    super(fullPath, false); // Don't freeze immediately
    // Freeze after all properties are set
    this.freezeObject();
  }

  /**
   * Smart Constructor for TemplatePath with default configuration
   *
   * Creates a validated TemplatePath instance using standard template path rules.
   * This is the primary factory method for most use cases.
   *
   * @param directive The directive type (e.g., "to", "summary", "defect")
   * @param layer The layer type (e.g., "project", "issue", "task")
   * @param filename The template filename (must end with .md)
   * @returns Result containing TemplatePath or specific error
   */
  static create(
    directive: DirectiveType,
    layer: LayerType,
    filename: string,
  ): Result<TemplatePath, TemplatePathError> {
    return TemplatePath.createWithConfig(directive, layer, filename, DEFAULT_TEMPLATE_PATH_CONFIG);
  }

  /**
   * Smart Constructor for TemplatePath with custom configuration
   *
   * Provides full control over validation rules and constraints.
   * Useful for testing, custom environments, or special use cases.
   *
   * @param directive The directive type
   * @param layer The layer type
   * @param filename The template filename
   * @param config Custom validation configuration
   * @returns Result containing TemplatePath or specific error
   */
  static createWithConfig(
    directive: DirectiveType,
    layer: LayerType,
    filename: string,
    config: TemplatePathConfig,
  ): Result<TemplatePath, TemplatePathError> {
    // Stage 1: Validate inputs are present
    const inputValidation = TemplatePath.validateInputs(directive, layer, filename);
    if (!inputValidation.ok) {
      return inputValidation;
    }

    // Stage 2: Validate directive
    const directiveValidation = TemplatePath.validateDirective(directive, config);
    if (!directiveValidation.ok) {
      return directiveValidation;
    }

    // Stage 3: Validate layer
    const layerValidation = TemplatePath.validateLayer(layer, config);
    if (!layerValidation.ok) {
      return layerValidation;
    }

    // Stage 4: Validate filename
    const filenameValidation = TemplatePath.validateFilename(filename, config);
    if (!filenameValidation.ok) {
      return filenameValidation;
    }

    // Stage 5: Construct full path
    const pathConstruction = TemplatePath.constructPath(directive, layer, filename);
    if (!pathConstruction.ok) {
      return pathConstruction;
    }

    const fullPath = pathConstruction.data;

    // Stage 6: Security validation using base class
    const baseValidation = super.createPath(
      fullPath,
      config.basePathConfig,
      (normalizedPath) => new TemplatePath(directive, layer, filename, normalizedPath),
    );

    if (!baseValidation.ok) {
      // Convert base path errors to template path errors
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
   * Factory for common template types
   */
  static createSummaryTemplate(
    layer: LayerType,
    filename: string,
  ): Result<TemplatePath, TemplatePathError> {
    // This would need DirectiveType.createSummary() method to be implemented
    // For now, we'll simulate it
    const summaryResult = { getValue: () => "summary" } as DirectiveType;
    return TemplatePath.create(summaryResult, layer, filename);
  }

  static createDefectTemplate(
    layer: LayerType,
    filename: string,
  ): Result<TemplatePath, TemplatePathError> {
    const defectResult = { getValue: () => "defect" } as DirectiveType;
    return TemplatePath.create(defectResult, layer, filename);
  }

  static createToTemplate(
    layer: LayerType,
    filename: string,
  ): Result<TemplatePath, TemplatePathError> {
    const toResult = { getValue: () => "to" } as DirectiveType;
    return TemplatePath.create(toResult, layer, filename);
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
   * Get the full template path
   * Format: directive/layer/filename.md
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
   * Check if this template path equals another
   */
  override equals(other: TemplatePath): boolean {
    return super.equals(other) &&
      this.directive.equals(other.directive) &&
      this.layer.equals(other.layer) &&
      this.filename === other.filename;
  }

  /**
   * Get template path components as object
   */
  getComponents(): {
    directive: string;
    layer: string;
    filename: string;
    extension: string;
  } {
    return {
      directive: this.directive.getValue(),
      layer: this.layer.getValue(),
      filename: this.filename,
      extension: this.getExtension(),
    };
  }

  /**
   * Convert to debug string representation
   */
  toDebugString(): string {
    const components = this.getComponents();
    return `TemplatePath{directive=${components.directive}, layer=${components.layer}, filename=${components.filename}}`;
  }

  // Private validation methods

  /**
   * Validate required inputs are present and valid
   */
  private static validateInputs(
    directive: DirectiveType,
    layer: LayerType,
    filename: string,
  ): Result<void, TemplatePathError> {
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
        kind: "InvalidFilename",
        message: "Filename cannot be null, undefined, or non-string",
        filename: String(filename),
        constraints: ["must be non-empty string"],
      });
    }

    const trimmedFilename = filename.trim();
    if (trimmedFilename.length === 0) {
      return error({
        kind: "InvalidFilename",
        message: "Filename cannot be empty or whitespace only",
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
    config: TemplatePathConfig,
  ): Result<void, TemplatePathError> {
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
      // For example, checking against a whitelist if allowCustomDirectives is false

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
    config: TemplatePathConfig,
  ): Result<void, TemplatePathError> {
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
   * Validate filename
   */
  private static validateFilename(
    filename: string,
    config: TemplatePathConfig,
  ): Result<void, TemplatePathError> {
    const trimmedFilename = filename.trim();
    const constraints: string[] = [];

    // Length validation
    if (trimmedFilename.length > config.maxFilenameLength) {
      constraints.push(`max length ${config.maxFilenameLength} characters`);
      return error({
        kind: "InvalidFilename",
        message: `Filename is too long (${trimmedFilename.length} characters)`,
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
        kind: "InvalidFilename",
        message: "Invalid file extension",
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
        kind: "InvalidFilename",
        message: `Contains forbidden characters: ${foundSuspicious.join(", ")}`,
        filename: trimmedFilename,
        constraints,
      });
    }

    return ok(undefined);
  }

  /**
   * Construct the full path from components
   */
  private static constructPath(
    directive: DirectiveType,
    layer: LayerType,
    filename: string,
  ): Result<string, TemplatePathError> {
    try {
      const directiveValue = directive.getValue();
      const layerValue = layer.getValue();
      const trimmedFilename = filename.trim();

      // Construct path with forward slashes for consistency
      const fullPath = `${directiveValue}/${layerValue}/${trimmedFilename}`;

      return ok(fullPath);
    } catch (constructionError) {
      return error({
        kind: "PathConstructionError",
        message: `Failed to construct path: ${
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
