/**
 * @fileoverview LayerType Value Object implementation
 *
 * LayerType represents the hierarchical level in the Breakdown application,
 * such as "project" (project level), "issue" (issue level), "task" (task level).
 * This Value Object follows DDD principles and Totality principle with Smart Constructor pattern.
 *
 * @module domain/core/value_objects/layer_type
 */

import type { Result } from "../../../types/result.ts";
import { error, ok } from "../../../types/result.ts";
import { ConfigProfileName } from "../../../types/config_profile_name.ts";
import type { ValidationError } from "../../../types/unified_error_types.ts";
import { ErrorFactory } from "../../../types/unified_error_types.ts";


/**
 * LayerType validation errors following Discriminated Union pattern
 */
export type LayerTypeError =
  | { kind: "EmptyInput"; message: string }
  | { kind: "InvalidFormat"; value: string; pattern: string; message: string }
  | { kind: "PatternMismatch"; value: string; profile: string; validLayers: readonly string[]; message: string }
  | { kind: "TooLong"; value: string; maxLength: number; message: string };

/**
 * LayerType - 階層を表すValue Object
 * 
 * 役割: 「どのレベルで」を決定する核心ドメイン概念
 * 例: "project"(プロジェクト), "issue"(課題), "task"(タスク)
 * 
 * Design Principles:
 * - Smart Constructor pattern with Result<T, E>
 * - Pattern-based validation for consistency
 * - Immutable Value Object with type safety
 * - File name generation domain operations
 * 
 * Domain Context:
 * - Used in TwoParams aggregate root
 * - Provides file name generation for prompts and schemas
 * - Validates compatibility with DirectiveType
 * - Ensures type-safe comparison and operations
 * 
 * @example Basic usage
 * ```typescript
 * const layerResult = LayerType.create("issue");
 * if (layerResult.ok) {
 *   console.log(layerResult.data.value); // "issue"
 *   const fileName = layerResult.data.getPromptFilename("project"); // "f_project.md"
 * }
 * ```
 * 
 * @example File name generation
 * ```typescript
 * const layer = LayerType.create("task").data;
 * const promptFile = layer.getPromptFilename("issue", "strict");
 * // Result: "f_issue_strict.md"
 * const schemaFile = layer.getSchemaFilename();
 * // Result: "task.json"
 * ```
 */
export class LayerType {
  /**
   * Basic pattern for LayerType format validation
   * Allows lowercase letters, numbers, hyphens, and underscores
   */
  static readonly #BASIC_PATTERN = /^[a-z0-9_-]{1,30}$/;

  /**
   * Maximum length for LayerType values
   */
  static readonly #MAX_LENGTH = 30;

  /**
   * Private constructor following Smart Constructor pattern
   * 
   * @param value - Validated layer type value
   * @param profile - Configuration profile for pattern validation
   * @param validatedByPattern - Indicates if validated against profile pattern
   */
  private constructor(
    private readonly _value: string,
    private readonly _profile: ConfigProfileName,
    private readonly _validatedByPattern: boolean,
  ) {
    Object.freeze(this);
  }

  /**
   * LayerType value accessor
   * Always returns a valid, non-null value
   */
  get value(): string {
    return this._value;
  }

  /**
   * Configuration profile accessor
   */
  get profile(): ConfigProfileName {
    return this._profile;
  }

  /**
   * Pattern validation status
   */
  get validatedByPattern(): boolean {
    return this._validatedByPattern;
  }

  /**
   * Smart Constructor for LayerType creation
   * 
   * Validates the input against basic format patterns.
   * Follows Totality principle by handling all possible input cases.
   * 
   * @param value - Layer type candidate or TwoParams_Result for compatibility
   * @param profile - Configuration profile (optional for compatibility)
   * @returns Result with LayerType or detailed error
   */
  static create(
    value: string | null | undefined | { layerType: string },
    profile?: ConfigProfileName,
  ): Result<LayerType, LayerTypeError> {
    // Handle TwoParams_Result-like objects
    if (typeof value === "object" && value !== null && "layerType" in value) {
      return LayerType.create(value.layerType);
    }
    // Case 1: Empty/null/undefined input
    if (!value || typeof value !== "string" || value.trim() === "") {
      return error({
        kind: "EmptyInput",
        message: "LayerType cannot be empty, null, or undefined",
      });
    }

    const trimmedValue = value.trim();

    // Case 1.5: Whitespace validation (input should not have leading/trailing spaces)
    if (value !== trimmedValue) {
      return error({
        kind: "InvalidFormat",
        value: value,
        pattern: "No leading/trailing whitespace allowed",
        message: `LayerType "${value}" contains leading or trailing whitespace`,
      });
    }

    // Case 2: Length validation
    if (trimmedValue.length > LayerType.#MAX_LENGTH) {
      return error({
        kind: "TooLong",
        value: trimmedValue,
        maxLength: LayerType.#MAX_LENGTH,
        message: `LayerType "${trimmedValue}" exceeds maximum length of ${LayerType.#MAX_LENGTH} characters`,
      });
    }

    // Case 3: Basic format validation
    if (!LayerType.#BASIC_PATTERN.test(trimmedValue)) {
      return error({
        kind: "InvalidFormat",
        value: trimmedValue,
        pattern: LayerType.#BASIC_PATTERN.source,
        message: `LayerType "${trimmedValue}" contains invalid characters. Only lowercase letters, numbers, hyphens, and underscores are allowed.`,
      });
    }

    // Case 4: Profile validation (only if profile explicitly provided)
    const actualProfile = profile || ConfigProfileName.createDefault();
    
    if (profile) {
      // Only validate against profile if explicitly provided
      const validLayers = actualProfile.getLayerTypes();
      const isValidForProfile = validLayers.includes(trimmedValue);

      if (!isValidForProfile) {
        return error({
          kind: "PatternMismatch",
          value: trimmedValue,
          profile: actualProfile.value,
          validLayers,
          message: `LayerType "${trimmedValue}" is not valid for profile "${actualProfile.value}". Valid layers: [${validLayers.join(", ")}]`,
        });
      }
    }

    // Case 5: Success
    return ok(new LayerType(trimmedValue, actualProfile, true));
  }


  /**
   * Check if this LayerType is valid for a specific profile
   * 
   * @param profile - Configuration profile to check against
   * @returns true if valid for the profile
   */
  isValidForProfile(profile: ConfigProfileName): boolean {
    const validLayers = profile.getLayerTypes();
    return validLayers.includes(this._value);
  }

  /**
   * Check if this LayerType is valid for a specific DirectiveType
   * 
   * Domain validation to ensure compatibility between directive and layer.
   * Currently allows all combinations, but can be extended with business rules.
   * 
   * @param directive - DirectiveType to check compatibility
   * @returns true if compatible
   */
  isValidForDirective(directive: { value: string }): boolean {
    // Currently, all layer types are compatible with all directive types
    // This can be extended with business rules if needed
    return directive.value.length > 0 && this._value.length > 0;
  }

  /**
   * Generate prompt filename for this layer type
   * 
   * Domain operation for prompt file naming convention.
   * Pattern: f_{layerType}[_{adaptation}].md
   * 
   * @param fromLayerType - Source layer type for context
   * @param adaptation - Optional adaptation modifier
   * @returns Prompt filename string
   */
  getPromptFilename(fromLayerType: string, adaptation?: string): string {
    const baseFilename = `f_${fromLayerType}`;
    const adaptationSuffix = adaptation ? `_${adaptation}` : "";
    return `${baseFilename}${adaptationSuffix}.md`;
  }

  /**
   * Generate schema filename for this layer type
   * 
   * Domain operation for schema file naming convention.
   * Pattern: {layerType}.json
   * 
   * @returns Schema filename string
   */
  getSchemaFilename(): string {
    // Schema filename pattern using layer value
    return `${this._value}.json`;
  }

  /**
   * Check if this LayerType is valid for resource path generation
   * 
   * @returns true if can be used for path resolution
   */
  isValidForResourcePath(): boolean {
    return this._validatedByPattern && this._value.length > 0;
  }

  /**
   * Type-safe equality comparison
   * 
   * @param other - Another LayerType to compare
   * @returns true if values are equal
   */
  equals(other: LayerType): boolean {
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
    return `LayerType(value="${this._value}", validated=${this._validatedByPattern})`;
  }

  /**
   * Known LayerType values including both common and specialized types
   */
  private static readonly KNOWN_LAYERS = ["project", "issue", "task", "bugs", "feature", "epic", "temp"] as const;

  /**
   * Get all common layer types for reference
   * 
   * @returns Array of common layer type values
   */
  static getCommonLayerTypes(): readonly string[] {
    return ["project", "issue", "task", "bugs", "feature", "epic"] as const;
  }

  /**
   * Get all known layer types including specialized ones
   * 
   * @returns Array of all known layer type values
   */
  static getKnownLayerTypes(): readonly string[] {
    return [...LayerType.KNOWN_LAYERS];
  }

  /**
   * Check if the value is a common layer type
   * 
   * @returns true if this is a common layer type
   */
  isCommonLayerType(): boolean {
    return LayerType.getCommonLayerTypes().includes(this._value);
  }

  /**
   * Check if the value is a known layer type
   * 
   * @returns true if this is a known layer type
   */
  isKnownLayerType(): boolean {
    return LayerType.KNOWN_LAYERS.includes(this._value as typeof LayerType.KNOWN_LAYERS[number]);
  }

  /**
   * Factory method: Create LayerType from string input with enhanced validation
   * 
   * Integrates LayerTypeFactory functionality with suggestions for unknown layers.
   * 
   * @param input - String input to convert to LayerType
   * @returns Result with LayerType or enhanced error with suggestions
   */
  static fromString(
    input: unknown,
  ): Result<LayerType, LayerTypeError & { suggestions?: readonly string[] }> {
    // Handle null/undefined
    if (input === null || input === undefined) {
      return error({
        kind: "EmptyInput",
        message: "LayerType input cannot be null or undefined",
      });
    }

    // Handle non-string input
    if (typeof input !== "string") {
      return error({
        kind: "EmptyInput",
        message: `LayerType input must be a string, got ${typeof input}`,
      });
    }

    // Handle empty string
    if (input.trim() === "") {
      return error({
        kind: "EmptyInput",
        message: "LayerType cannot be empty or whitespace-only",
      });
    }

    const normalized = input.trim().toLowerCase();

    // Try to create LayerType using standard create method
    const result = LayerType.create(normalized);
    
    if (result.ok) {
      return result;
    }

    // If creation failed and input is not a known layer, provide suggestions
    if (!LayerType.KNOWN_LAYERS.includes(normalized as typeof LayerType.KNOWN_LAYERS[number])) {
      const suggestions = LayerType.calculateSuggestions(normalized);
      return error({
        ...result.error,
        suggestions,
        message: `Unknown layer type "${normalized}". Did you mean: ${suggestions.join(", ")}?`,
      });
    }

    return result;
  }

  /**
   * Factory method: Create LayerType from TwoParams_Result (legacy compatibility)
   * 
   * @param result - TwoParams_Result containing layer information
   * @returns Result with LayerType or error
   */
  static fromTwoParamsResult(result: { layerType: string }): Result<LayerType, LayerTypeError> {
    return LayerType.create(result.layerType);
  }

  /**
   * Check if a layer value is valid (known layer type)
   * 
   * @param input - Layer value to check
   * @returns boolean indicating validity
   */
  static isValidLayer(input: string): boolean {
    const normalized = input.trim().toLowerCase();
    return LayerType.KNOWN_LAYERS.includes(normalized as typeof LayerType.KNOWN_LAYERS[number]);
  }

  /**
   * Calculate suggestions for unknown layer inputs
   * 
   * @param input - Unknown layer input
   * @returns Array of suggested layer names
   */
  private static calculateSuggestions(input: string): readonly string[] {
    const suggestions: string[] = [];

    for (const known of LayerType.KNOWN_LAYERS) {
      // Simple similarity: starts with or contains
      if (known.startsWith(input) || input.startsWith(known) || known.includes(input)) {
        suggestions.push(known);
      }
    }

    // If no close matches, return all common options
    if (suggestions.length === 0) {
      return LayerType.getCommonLayerTypes();
    }

    return suggestions;
  }
}

/**
 * LayerTypeFactory - Factory for creating LayerType instances
 * 
 * 統一されたLayerType作成インターフェースを提供。
 * バリデーション、エラーハンドリング、ファクトリーパターンを統合。
 */
export class LayerTypeFactory {
  /**
   * Create LayerType from string with comprehensive validation
   * 
   * @param input - String input to convert to LayerType
   * @param profile - Optional configuration profile
   * @returns Result with LayerType or detailed error
   */
  static create(
    input: string,
    profile?: ConfigProfileName,
  ): Result<LayerType, LayerTypeError> {
    return LayerType.create(input, profile);
  }

  /**
   * Create LayerType with pattern validation
   * 
   * @param input - String input
   * @param pattern - Validation pattern
   * @returns Result with LayerType or error
   */
  static createWithPattern(
    input: string,
    pattern: string,
    profile?: ConfigProfileName,
  ): Result<LayerType, LayerTypeError> {
    // First validate input with pattern
    const patternResult = TwoParamsLayerTypePattern.createOrError(pattern);
    if (!patternResult.ok) {
      return error({
        kind: "InvalidFormat",
        value: input,
        pattern: pattern,
        message: `Invalid pattern: ${
          'message' in patternResult.error ? patternResult.error.message : 
          'reason' in patternResult.error ? patternResult.error.reason : 
          'Invalid pattern'
        }`,
      });
    }

    if (!patternResult.data.test(input)) {
      return error({
        kind: "InvalidFormat",
        value: input,
        pattern: pattern,
        message: `Value "${input}" does not match pattern "${pattern}"`,
      });
    }

    // Then create LayerType normally
    return LayerType.create(input, profile);
  }

  /**
   * Batch create multiple LayerTypes
   * 
   * @param inputs - Array of string inputs
   * @param profile - Optional configuration profile
   * @returns Array of Results
   */
  static createMany(
    inputs: string[],
    profile?: ConfigProfileName,
  ): Result<LayerType, LayerTypeError>[] {
    return inputs.map(input => LayerType.create(input, profile));
  }
}

/**
 * TwoParamsLayerTypePattern - LayerType pattern matching utility
 * 
 * 従来のpattern-based validationとの互換性を保つためのユーティリティクラス。
 * 新しいLayerTypeクラスと統合するため、旧実装からのマイグレーション用として提供。
 * 新しいコードでは LayerType.create() を直接使用することを推奨。
 */
export class TwoParamsLayerTypePattern {
  private constructor(private readonly pattern: RegExp) {}

  /**
   * 文字列パターンから TwoParamsLayerTypePattern を作成（Result型版）
   *
   * Totality原則に準拠し、エラーを明示的に返す。
   * 統一エラー型システムを使用してValidationErrorを返す。
   *
   * @param pattern 正規表現文字列
   * @returns 成功時は Result<TwoParamsLayerTypePattern>、失敗時はValidationError
   */
  static createOrError(pattern: string): Result<TwoParamsLayerTypePattern, ValidationError> {
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
      return ok(new TwoParamsLayerTypePattern(regex));
    } catch (e) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "pattern",
        value: pattern,
        reason: `Invalid regex pattern: ${e instanceof Error ? e.message : "Unknown error"}`,
      }));
    }
  }

  /**
   * 値がパターンにマッチするかテスト
   * @param value テスト対象の値
   * @returns マッチする場合 true
   */
  test(value: string): boolean {
    return this.pattern.test(value);
  }

  /**
   * パターン文字列を取得
   * @returns 正規表現のソース文字列
   */
  getPattern(): string {
    return this.pattern.source;
  }

  /**
   * 文字列パターンから TwoParamsLayerTypePattern を作成（従来版）
   * 
   * @param pattern 正規表現文字列
   * @returns TwoParamsLayerTypePattern または null
   */
  static create(pattern: string): TwoParamsLayerTypePattern | null {
    const result = TwoParamsLayerTypePattern.createOrError(pattern);
    return result.ok ? result.data : null;
  }
}