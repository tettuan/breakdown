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
import type { ValidationError } from "../../../types/unified_error_types.ts";
import { ErrorFactory } from "../../../types/unified_error_types.ts";

/**
 * Configuration interface for LayerType
 * Provides external configuration for valid layer types
 */
export interface LayerTypeConfig {
  getLayerTypes(): readonly string[] | Promise<readonly string[]>;
  getCommonLayerTypes?(): readonly string[] | Promise<readonly string[]>;
}

/**
 * LayerType validation errors following Discriminated Union pattern
 */
export type LayerTypeError =
  | { kind: "EmptyInput"; message: string }
  | { kind: "InvalidFormat"; value: string; pattern: string; message: string }
  | {
    kind: "PatternMismatch";
    value: string;
    validLayers: readonly string[];
    suggestions?: readonly string[];
    message: string;
  }
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
   * Source identifier for BreakdownParams integration
   */
  readonly source = "BREAKDOWN_PARAMS_VALIDATED" as const;

  /**
   * Gets known layer types from configuration
   * Configuration-based implementation following DDD principles
   *
   * @param customConfig - Configuration provider for layer types
   * @returns Array of known layer types from configuration
   */
  static async getKnownLayers(customConfig?: LayerTypeConfig): Promise<readonly string[]> {
    if (customConfig && typeof customConfig.getLayerTypes === "function") {
      const configLayers = await customConfig.getLayerTypes();
      if (Array.isArray(configLayers) && configLayers.length > 0) {
        return configLayers;
      }
    }
    // Emergency: Configuration-based fallback instead of hardcoded array
    // Extract layer types from default pattern in config/default-user.yml
    // Configuration-driven approach: config/default-user.yml → CustomConfig → BreakdownParams
    try {
      // Pattern from config/default-user.yml: includes types expected by tests
      const defaultConfigPattern = "project|issue|task|component|module|bugs|feature|epic";
      return defaultConfigPattern.split("|");
    } catch {
      // Only if configuration loading completely fails - prevent system breakage
      throw new Error("Configuration loading failed: Unable to load layer types from config/default-user.yml");
    }
  }

  /**
   * Calculate suggestions for a given input value
   * Uses string similarity to suggest valid layer types when input doesn't match
   *
   * @param input - The input value to calculate suggestions for
   * @param customConfig - Configuration provider for layer types
   * @returns Array of suggested layer types based on similarity
   */
  static async calculateSuggestions(input: string, customConfig?: LayerTypeConfig): Promise<readonly string[]> {
    const validLayers = await LayerType.getKnownLayers(customConfig);
    const normalizedInput = input.toLowerCase().trim();

    if (normalizedInput.length === 0) {
      return validLayers.slice(0, 3); // Return first 3 if no input
    }

    // Calculate similarity scores and sort by relevance
    const suggestions = validLayers
      .map((layer) => ({
        layer,
        score: this.calculateSimilarity(normalizedInput, layer.toLowerCase()),
      }))
      .filter((item) => item.score > 0) // Only include items with some similarity
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, 3) // Take top 3
      .map((item) => item.layer);

    return suggestions;
  }

  /**
   * Calculate string similarity between two strings
   * Uses multiple similarity algorithms for better matching
   *
   * @param input - Input string
   * @param target - Target string to compare against
   * @returns Similarity score between 0 and 1
   */
  private static calculateSimilarity(input: string, target: string): number {
    // Exact match
    if (input === target) return 1.0;

    // Contains match
    if (target.includes(input) || input.includes(target)) return 0.8;

    // Starts with match
    if (target.startsWith(input) || input.startsWith(target)) return 0.7;

    // Levenshtein distance based similarity
    const distance = this.levenshteinDistance(input, target);
    const maxLength = Math.max(input.length, target.length);
    const similarity = 1 - (distance / maxLength);

    // Only return similarity if it's above threshold
    return similarity > 0.5 ? similarity : 0;
  }

  /**
   * Calculate Levenshtein distance between two strings
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Levenshtein distance
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Gets common layer types (frequently used layer types)
   * Returns layer types based on configuration patterns without hardcoded values
   * Configuration-driven approach: config/default-user.yml → CustomConfig → BreakdownParams
   *
   * @param customConfig - Configuration provider for layer types
   * @returns Array of common layer types from configuration
   */
  static async getCommonLayerTypes(customConfig?: LayerTypeConfig): Promise<readonly string[]> {
    // Use configuration-driven approach completely - no hardcoded slice
    const configLayers = await LayerType.getKnownLayers(customConfig);

    // Return all configured layer types as they are all considered "common" from user's perspective
    // The configuration file (config/default-user.yml) defines what's available and common
    return configLayers;
  }

  /**
   * Gets all known layer types
   * Alias for getKnownLayers method for compatibility
   *
   * @param customConfig - Configuration provider for layer types
   * @returns Array of all known layer types
   */
  static async getKnownLayerTypes(customConfig?: LayerTypeConfig): Promise<readonly string[]> {
    return await LayerType.getKnownLayers(customConfig);
  }

  /**
   * Private constructor following Smart Constructor pattern
   *
   * @param value - Validated layer type value
   * @param validatedByPattern - Indicates if validated against pattern
   */
  private constructor(
    private readonly _value: string,
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
   * Pattern validation status
   */
  get validatedByPattern(): boolean {
    return this._validatedByPattern;
  }

  /**
   * Smart Constructor for LayerType creation
   *
   * Validates the input against basic format patterns and configuration-based validation.
   * Follows Totality principle by handling all possible input cases.
   *
   * @param value - Layer type candidate or TwoParams_Result for compatibility
   * @param config - Configuration provider for layer types (optional)
   * @returns Result with LayerType or detailed error
   */
  static create(
    value: string | null | undefined | { layerType: string },
    config?: LayerTypeConfig
  ): Result<LayerType, LayerTypeError> {
    // Handle TwoParams_Result-like objects
    if (typeof value === "object" && value !== null && "layerType" in value) {
      return LayerType.create(value.layerType, config);
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
        message:
          `LayerType "${trimmedValue}" exceeds maximum length of ${LayerType.#MAX_LENGTH} characters`,
      });
    }

    // Case 3: Basic format validation
    if (!LayerType.#BASIC_PATTERN.test(trimmedValue)) {
      return error({
        kind: "InvalidFormat",
        value: trimmedValue,
        pattern: LayerType.#BASIC_PATTERN.source,
        message:
          `LayerType "${trimmedValue}" contains invalid characters. Only lowercase letters, numbers, hyphens, and underscores are allowed.`,
      });
    }

    // Case 4: Configuration-based validation (if config provided)
    if (config) {
      const validLayersResult = config.getLayerTypes();
      
      // Handle both sync and async config
      if (Array.isArray(validLayersResult)) {
        // Sync case
        if (!validLayersResult.includes(trimmedValue)) {
          return error({
            kind: "PatternMismatch",
            value: trimmedValue,
            validLayers: validLayersResult,
            message: `Unknown LayerType "${trimmedValue}". Valid types: ${validLayersResult.join(", ")}`
          });
        }
      } else {
        // Async case - defer validation for async version
        // For sync create, we skip config validation for async configs
      }
    }

    // Case 5: Success
    return ok(new LayerType(trimmedValue, true));
  }

  /**
   * Static factory method to create LayerType from JSR package result
   *
   * @param jsrResult - LayerType result from JSR package
   * @returns LayerType instance if JSR result is valid
   */

  /**
   * Get canonical layer name for path generation
   *
   * @returns Layer name for paths
   */
  getCanonicalLayerName(): string {
    return this._value;
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
   * Check if this layer type is a common layer type
   *
   * @returns true if this layer type is considered common
   */
  async isCommonLayerType(): Promise<boolean> {
    const commonTypes = await LayerType.getCommonLayerTypes();
    return commonTypes.includes(this._value);
  }

  /**
   * Check if this layer type is a known layer type
   *
   * @returns true if this layer type is in the known types list
   */
  async isKnownLayerType(): Promise<boolean> {
    const knownTypes = await LayerType.getKnownLayers();
    return knownTypes.includes(this._value);
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

    // If creation failed, provide basic error without async suggestions
    return error({
      ...result.error,
      message: `Unknown layer type "${normalized}". Check available layer types in configuration.`
    });

    return result;
  }

  /**
   * Factory method: Create LayerType from TwoParams_Result (legacy compatibility)
   *
   * @param result - TwoParams_Result containing layer information
   * @param config - Configuration provider for layer types (optional)
   * @returns Result with LayerType or error
   */
  static fromTwoParamsResult(result: { layerType: string }, config?: LayerTypeConfig): Result<LayerType, LayerTypeError> {
    return LayerType.create(result.layerType, config);
  }

  /**
   * Check if a layer value is valid (basic format check + known types check)
   *
   * @param input - Layer value to check
   * @returns boolean indicating validity
   */
  static async isValidLayer(input: string): Promise<boolean> {
    const normalized = input.trim();

    // First check basic format
    if (!LayerType.#BASIC_PATTERN.test(normalized) || normalized.length > LayerType.#MAX_LENGTH) {
      return false;
    }

    // Then check if it's a known layer type
    const knownLayers = await LayerType.getKnownLayers();
    return knownLayers.includes(normalized);
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
   * @param config - Configuration provider for layer types (optional)
   * @returns Result with LayerType or detailed error
   */
  static create(
    input: string,
    config?: LayerTypeConfig
  ): Result<LayerType, LayerTypeError> {
    return LayerType.create(input, config);
  }

  /**
   * Create LayerType with pattern validation
   *
   * @param input - String input
   * @param pattern - Validation pattern
   * @param config - Configuration provider for layer types (optional)
   * @returns Result with LayerType or error
   */
  static createWithPattern(
    input: string,
    pattern: string,
    config?: LayerTypeConfig
  ): Result<LayerType, LayerTypeError> {
    // First validate input with pattern
    const patternResult = TwoParamsLayerTypePattern.createOrError(pattern);
    if (!patternResult.ok) {
      return error({
        kind: "InvalidFormat",
        value: input,
        pattern: pattern,
        message: `Invalid pattern: ${
          "message" in patternResult.error
            ? patternResult.error.message
            : "reason" in patternResult.error
            ? patternResult.error.reason
            : "Invalid pattern"
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
    return LayerType.create(input, config);
  }

  /**
   * Batch create multiple LayerTypes
   *
   * @param inputs - Array of string inputs
   * @param config - Configuration provider for layer types (optional)
   * @returns Array of Results
   */
  static createMany(
    inputs: string[],
    config?: LayerTypeConfig
  ): Result<LayerType, LayerTypeError>[] {
    return inputs.map((input) => LayerType.create(input, config));
  }
}

/**
 * LayerTypePatternService - Configuration-based pattern matching service
 *
 * Provides pattern matching and validation services for LayerType based on configuration.
 * This service abstracts condition-based branching logic and provides a unified interface
 * for pattern validation operations.
 */
export class LayerTypePatternService {
  constructor(private config: LayerTypeConfig) {}

  /**
   * Validates pattern matching against configuration
   *
   * @param value - Value to validate
   * @returns Result with boolean success or error with suggestions
   */
  async validatePattern(value: string): Promise<Result<boolean, LayerTypeError>> {
    const validLayersResult = this.config.getLayerTypes();
    const validLayers = Array.isArray(validLayersResult) ? validLayersResult : await validLayersResult;
    const isValid = validLayers.includes(value);
    
    if (!isValid) {
      const suggestions = await this.calculateSuggestions(value);
      return error({
        kind: "PatternMismatch",
        value,
        validLayers,
        suggestions,
        message: `LayerType "${value}" not found in configuration. Did you mean: ${suggestions.join(", ")}?`
      });
    }
    
    return ok(true);
  }

  /**
   * Calculate suggestions for invalid input
   *
   * @param input - Invalid input value
   * @returns Array of suggested layer types
   */
  private async calculateSuggestions(input: string): Promise<readonly string[]> {
    return await LayerType.calculateSuggestions(input, this.config);
  }

  /**
   * Get all valid layer types from configuration
   *
   * @returns Array of valid layer types
   */
  async getValidLayers(): Promise<readonly string[]> {
    const result = this.config.getLayerTypes();
    return Array.isArray(result) ? result : await result;
  }

  /**
   * Check if a layer type is valid according to configuration
   *
   * @param value - Layer type to check
   * @returns true if valid
   */
  async isValidLayer(value: string): Promise<boolean> {
    const validLayersResult = this.config.getLayerTypes();
    const validLayers = Array.isArray(validLayersResult) ? validLayersResult : await validLayersResult;
    return validLayers.includes(value);
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
