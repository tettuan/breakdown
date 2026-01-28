/**
 * @fileoverview DirectiveType Value Object implementation
 *
 * DirectiveType represents the processing direction in the Breakdown application,
 * such as "to" (conversion), "summary" (summarization), "defect" (defect detection).
 * This Value Object follows DDD principles and Totality principle with Smart Constructor pattern.
 *
 * @module domain/core/value_objects/directive_type
 */

import type { Result } from "../../../types/result.ts";
import { error, ok } from "../../../types/result.ts";
import type { ValidationError } from "../../../types/unified_error_types.ts";
import { ErrorFactory } from "../../../types/unified_error_types.ts";
import { DEFAULT_SCHEMA_BASE_DIR } from "../../../config/constants.ts";

/**
 * DirectiveType validation errors following Discriminated Union pattern
 */
export type DirectiveTypeError =
  | { kind: "EmptyInput"; message: string }
  | { kind: "InvalidFormat"; value: string; pattern: string; message: string }
  | {
    kind: "PatternMismatch";
    value: string;
    validDirectives: readonly string[];
    message: string;
  }
  | { kind: "TooLong"; value: string; maxLength: number; message: string };

/**
 * DirectiveType - Value Object representing processing direction
 *
 * Role: Core domain concept that determines "what to do"
 * Examples: "to" (conversion), "summary" (summarization), "defect" (defect detection)
 *
 * Design Principles:
 * - Smart Constructor pattern with Result<T, E>
 * - Pattern-based validation for basic format
 * - Immutable Value Object with type safety
 * - Path resolution domain operations
 *
 * Domain Context:
 * - Used in TwoParams aggregate root
 * - Validates against basic format patterns
 * - Provides path resolution for prompt and schema files
 * - Ensures type-safe comparison and operations
 *
 * @example Basic usage
 * ```typescript
 * const directiveResult = DirectiveType.create("to");
 * if (directiveResult.ok) {
 *   console.log(directiveResult.data.value); // "to"
 * }
 * ```
 *
 * @example Path resolution
 * ```typescript
 * const directive = DirectiveType.create("to").data;
 * const layer = LayerType.create("issue").data;
 * const promptDir = directive.getPromptDirectory("prompts", layer);
 * // Result: "prompts/to/issue"
 * ```
 */
export class DirectiveType {
  /**
   * Basic pattern for DirectiveType format validation
   * Allows lowercase letters, numbers, hyphens, and underscores
   */
  static readonly #BASIC_PATTERN = /^[a-z0-9_-]{1,20}$/;

  /**
   * Maximum length for DirectiveType values
   */
  static readonly #MAX_LENGTH = 20;

  /**
   * Source identifier for BreakdownParams integration
   */
  readonly source = "BREAKDOWN_PARAMS_VALIDATED" as const;

  /**
   * Private constructor following Smart Constructor pattern
   *
   * @param value - Validated directive type value
   * @param validatedByPattern - Indicates if validated against pattern
   */
  private constructor(
    private readonly _value: string,
    private readonly _validatedByPattern: boolean,
  ) {
    Object.freeze(this);
  }

  /**
   * DirectiveType value accessor
   * Always returns a valid, non-null value
   */
  get value(): string {
    return this._value;
  }

  /**
   * Pattern validation status
   */
  get validatedByPattern(): boolean {
    return this._validatedByPattern;
  }

  /**
   * Smart Constructor for DirectiveType creation
   *
   * Validates the input against basic format patterns.
   * Follows Totality principle by handling all possible input cases.
   *
   * @param value - Directive type candidate string
   * @returns Result with DirectiveType or detailed error
   */
  static create(
    value: string | null | undefined,
  ): Result<DirectiveType, DirectiveTypeError> {
    // Type guard for string input
    if (typeof value !== "string") {
      return error({
        kind: "EmptyInput",
        message: "DirectiveType value must be a string",
      });
    }

    // Case 1: Empty/null/undefined input
    if (!value || value.trim() === "") {
      return error({
        kind: "EmptyInput",
        message: "DirectiveType cannot be empty, null, or undefined",
      });
    }

    const trimmedValue = value.trim();

    // Case 1.5: Whitespace validation (input should not have leading/trailing spaces)
    if (value !== trimmedValue) {
      return error({
        kind: "InvalidFormat",
        value: value,
        pattern: "No leading/trailing whitespace allowed",
        message: `DirectiveType "${value}" contains leading or trailing whitespace`,
      });
    }

    // Case 2: Length validation
    if (trimmedValue.length > DirectiveType.#MAX_LENGTH) {
      return error({
        kind: "TooLong",
        value: trimmedValue,
        maxLength: DirectiveType.#MAX_LENGTH,
        message:
          `DirectiveType "${trimmedValue}" exceeds maximum length of ${DirectiveType.#MAX_LENGTH} characters`,
      });
    }

    // Case 3: Basic format validation
    if (!DirectiveType.#BASIC_PATTERN.test(trimmedValue)) {
      return error({
        kind: "InvalidFormat",
        value: trimmedValue,
        pattern: DirectiveType.#BASIC_PATTERN.source,
        message:
          `DirectiveType "${trimmedValue}" contains invalid characters. Only lowercase letters, numbers, hyphens, and underscores are allowed.`,
      });
    }

    // Case 4: Basic validation only - skip profile-based validation
    // Profile-based validation should be handled at application layer with BreakdownConfig
    // This maintains separation of concerns between domain and configuration layers

    // Case 5: Success
    return ok(new DirectiveType(trimmedValue, true));
  }

  /**
   * Get prompt directory path for this directive type
   *
   * Domain operation for path resolution in prompt generation context.
   *
   * @param baseDir - Base directory for prompts
   * @param layer - LayerType for complete path construction
   * @returns Directory path string
   */
  getPromptDirectory(baseDir: string, layer: { value: string }): string {
    const canonicalLayer = typeof layer === "object" && "getCanonicalLayerName" in layer
      ? (layer as { getCanonicalLayerName(): string }).getCanonicalLayerName()
      : layer.value;
    return `${baseDir}/${this._value}/${canonicalLayer}`;
  }

  /**
   * Get schema directory path for this directive type
   *
   * Domain operation for path resolution in schema file context.
   *
   * @param baseDir - Base directory for schemas
   * @param layer - LayerType for complete path construction
   * @returns Directory path string
   */
  getSchemaDirectory(baseDir: string, layer: { value: string }): string {
    const canonicalLayer = typeof layer === "object" && "getCanonicalLayerName" in layer
      ? (layer as { getCanonicalLayerName(): string }).getCanonicalLayerName()
      : layer.value;
    return `${baseDir}/${this._value}/${canonicalLayer}`;
  }

  /**
   * Get prompt file path for this directive type
   *
   * Domain operation for complete path resolution in prompt generation context.
   *
   * @param layer - LayerType for path construction
   * @param baseDir - Base directory for prompts (default: "prompts")
   * @param fromLayerType - Source layer type for adaptation
   * @param adaptation - Adaptation type for specialized paths
   * @returns Complete file path string
   */
  getPromptPath(
    layer: { value: string },
    baseDir: string,
    fromLayerType?: string,
    adaptation?: string,
  ): string {
    const dir = this.getPromptDirectory(baseDir, layer);
    const canonicalLayer = typeof layer === "object" && "getCanonicalLayerName" in layer
      ? (layer as { getCanonicalLayerName(): string }).getCanonicalLayerName()
      : layer.value;

    let filename = `${this._value}_${canonicalLayer}.md`;

    if (fromLayerType) {
      filename = `${fromLayerType}_${canonicalLayer}.md`;
    }

    if (adaptation) {
      filename = `${fromLayerType || this._value}_${canonicalLayer}_${adaptation}.md`;
    }

    return `${dir}/${filename}`;
  }

  /**
   * Get schema file path for this directive type
   *
   * Domain operation for complete path resolution in schema context.
   *
   * @param layer - LayerType for path construction
   * @param baseDir - Base directory for schemas (default: DEFAULT_SCHEMA_BASE_DIR)
   * @returns Complete file path string
   */
  getSchemaPath(layer: { value: string }, baseDir = DEFAULT_SCHEMA_BASE_DIR): string {
    const dir = this.getSchemaDirectory(baseDir, layer);
    const canonicalLayer = typeof layer === "object" && "getCanonicalLayerName" in layer
      ? (layer as { getCanonicalLayerName(): string }).getCanonicalLayerName()
      : layer.value;
    const filename = `${this._value}_${canonicalLayer}.schema.json`;
    return `${dir}/${filename}`;
  }

  /**
   * Resolve output path for this directive type
   *
   * Domain operation for output file path resolution.
   *
   * @param inputPath - Input file path to resolve
   * @param layer - LayerType for path construction
   * @param baseDir - Base directory for output (default: "output")
   * @returns Resolved output file path string
   */
  resolveOutputPath(inputPath: string, layer: { value: string }, baseDir = "output"): string {
    const canonicalLayer = typeof layer === "object" && "getCanonicalLayerName" in layer
      ? (layer as { getCanonicalLayerName(): string }).getCanonicalLayerName()
      : layer.value;
    const dir = `${baseDir}/${this._value}/${canonicalLayer}`;
    const filename = inputPath.split("/").pop() || inputPath;
    return `${dir}/${filename}`;
  }

  /**
   * Check if this DirectiveType is valid for resource path generation
   *
   * @returns true if can be used for path resolution
   */
  isValidForResourcePath(): boolean {
    return this._validatedByPattern && this._value.length > 0;
  }

  /**
   * Type-safe equality comparison
   *
   * @param other - Another DirectiveType to compare
   * @returns true if values are equal
   */
  equals(other: DirectiveType): boolean {
    return this._value === other._value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this._value;
  }

  /**
   * Get detailed information for debugging
   */
  toDebugString(): string {
    return `DirectiveType(value="${this._value}", validated=${this._validatedByPattern})`;
  }

  /**
   * Create DirectiveType from TwoParamsResult (JSR package integration)
   *
   * This factory method creates a DirectiveType instance from the result
   * of BreakdownParams JSR package, marking it as validated.
   *
   * @param result - Object containing directiveType from BreakdownParams
   * @returns Result containing DirectiveType or validation error
   */
  static fromTwoParamsResult(
    result: { directiveType: string },
  ): Result<DirectiveType, DirectiveTypeError> {
    if (!result || typeof result.directiveType !== "string") {
      return error({
        kind: "EmptyInput",
        message: "Invalid TwoParamsResult: directiveType must be a string",
      });
    }

    // Create DirectiveType with JSR validation marker
    // Since this comes from BreakdownParams, it's already validated
    return ok(new DirectiveType(result.directiveType, true));
  }

  /**
   * Create DirectiveType from BreakdownParams JSR package (simplified JSR integration)
   *
   * This static factory method directly creates a DirectiveType instance from
   * a validated directiveType string that comes from BreakdownParams JSR package.
   * The value is marked as JSR-validated, bypassing internal validation.
   *
   * @param jsrValidatedValue - Pre-validated directiveType string from BreakdownParams
   * @returns Result containing DirectiveType or validation error
   */
  static fromJSR(
    jsrValidatedValue: string,
  ): Result<DirectiveType, DirectiveTypeError> {
    if (typeof jsrValidatedValue !== "string") {
      return error({
        kind: "EmptyInput",
        message: "Invalid JSR value: directiveType must be a string",
      });
    }

    // Create DirectiveType with JSR validation marker
    // Since this comes directly from BreakdownParams JSR, it's already validated
    return ok(new DirectiveType(jsrValidatedValue, true));
  }
}

/**
 * TwoParamsDirectivePattern - Validation pattern for DirectiveType
 *
 * Safely wraps regex patterns and uses them for DirectiveType validation.
 * Adopts the Smart Constructor pattern to prevent creation of invalid patterns.
 *
 * Provided for migration from legacy implementation to integrate with the new DirectiveType class.
 * For new code, using DirectiveType.create() directly is recommended.
 */
export class TwoParamsDirectivePattern {
  private constructor(private readonly pattern: RegExp) {}

  /**
   * Create TwoParamsDirectivePattern from a string pattern (Result type version)
   *
   * Compliant with Totality principle, explicitly returns errors.
   * Uses unified error type system to return ValidationError.
   *
   * @param pattern - Regex pattern string
   * @returns Result<TwoParamsDirectivePattern> on success, ValidationError on failure
   */
  static createOrError(pattern: string): Result<TwoParamsDirectivePattern, ValidationError> {
    if (typeof pattern !== "string") {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "pattern",
        value: pattern,
        reason: "Pattern must be a string",
      }));
    }

    if (!pattern || pattern.trim().length === 0) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "pattern",
        value: pattern,
        reason: "Pattern cannot be empty",
      }));
    }

    try {
      const regex = new RegExp(pattern);
      return ok(new TwoParamsDirectivePattern(regex));
    } catch (e) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "pattern",
        value: pattern,
        reason: `Invalid regex pattern: ${e instanceof Error ? e.message : "Unknown error"}`,
      }));
    }
  }

  /**
   * Test if a value matches the pattern
   * @param value - Value to test
   * @returns true if matches
   */
  test(value: string): boolean {
    return this.pattern.test(value);
  }

  /**
   * Get string representation of the pattern
   * @returns Regex string
   */
  toString(): string {
    return this.pattern.toString();
  }

  /**
   * Get string representation of the pattern (getPattern method)
   * @returns Regex source string
   */
  getPattern(): string {
    return this.pattern.source;
  }

  /**
   * Method for TypePatternProvider interface compliance
   * @returns Returns itself (for TypePatternProvider.getDirectivePattern)
   */
  getDirectivePattern(): TwoParamsDirectivePattern {
    return this;
  }

  /**
   * Create TwoParamsDirectivePattern from a string pattern (legacy version)
   *
   * @param pattern - Regex pattern string
   * @returns TwoParamsDirectivePattern or null
   */
  static create(pattern: string): TwoParamsDirectivePattern | null {
    const result = TwoParamsDirectivePattern.createOrError(pattern);
    return result.ok ? result.data : null;
  }
}
