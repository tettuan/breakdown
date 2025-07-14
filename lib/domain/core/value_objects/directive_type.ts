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
import type { ConfigProfileName } from "../../../types/config_profile_name.ts";
import type { ValidationError } from "../../../types/unified_error_types.ts";
import { ErrorFactory } from "../../../types/unified_error_types.ts";

/**
 * DirectiveType validation errors following Discriminated Union pattern
 */
export type DirectiveTypeError =
  | { kind: "EmptyInput"; message: string }
  | { kind: "InvalidFormat"; value: string; pattern: string; message: string }
  | { kind: "PatternMismatch"; value: string; profile: string; validDirectives: readonly string[]; message: string }
  | { kind: "TooLong"; value: string; maxLength: number; message: string };

/**
 * DirectiveType - 処理方向を表すValue Object
 * 
 * 役割: 「何をするか」を決定する核心ドメイン概念
 * 例: "to"(変換), "summary"(要約), "defect"(欠陥検出)
 * 
 * Design Principles:
 * - Smart Constructor pattern with Result<T, E>
 * - Pattern-based validation with ConfigProfileName
 * - Immutable Value Object with type safety
 * - Path resolution domain operations
 * 
 * Domain Context:
 * - Used in TwoParams aggregate root
 * - Validates against ConfigProfileName patterns
 * - Provides path resolution for prompt and schema files
 * - Ensures type-safe comparison and operations
 * 
 * @example Basic usage
 * ```typescript
 * const profile = ConfigProfileName.createDefault();
 * const directiveResult = DirectiveType.create("to", profile);
 * if (directiveResult.ok) {
 *   console.log(directiveResult.data.value); // "to"
 *   console.log(directiveResult.data.isValidForProfile(profile)); // true
 * }
 * ```
 * 
 * @example Path resolution
 * ```typescript
 * const directive = DirectiveType.create("to", profile).data;
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
   * Private constructor following Smart Constructor pattern
   * 
   * @param value - Validated directive type value
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
   * DirectiveType value accessor
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
   * Smart Constructor for DirectiveType creation
   * 
   * Validates the input against basic format and ConfigProfileName patterns.
   * Follows Totality principle by handling all possible input cases.
   * 
   * @param value - Directive type candidate string
   * @param profile - Configuration profile for pattern validation (optional, uses default if not provided)
   * @returns Result with DirectiveType or detailed error
   */
  static create(
    value: string | null | undefined,
    profile?: ConfigProfileName,
  ): Result<DirectiveType, DirectiveTypeError> {
    // Handle missing profile with default configuration
    const actualProfile = profile || (() => {
      try {
        return (globalThis as any).ConfigProfileName?.createDefault?.() || 
               { value: "default", getDirectiveTypes: () => ["to", "summary", "defect"] };
      } catch {
        return { value: "default", getDirectiveTypes: () => ["to", "summary", "defect"] };
      }
    })();

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
        message: `DirectiveType "${trimmedValue}" exceeds maximum length of ${DirectiveType.#MAX_LENGTH} characters`,
      });
    }

    // Case 3: Basic format validation
    if (!DirectiveType.#BASIC_PATTERN.test(trimmedValue)) {
      return error({
        kind: "InvalidFormat",
        value: trimmedValue,
        pattern: DirectiveType.#BASIC_PATTERN.source,
        message: `DirectiveType "${trimmedValue}" contains invalid characters. Only lowercase letters, numbers, hyphens, and underscores are allowed.`,
      });
    }

    // Case 4: Pattern-based validation against ConfigProfileName
    const validDirectives = actualProfile.getDirectiveTypes ? actualProfile.getDirectiveTypes() : ["to", "summary", "defect"];
    const isValidForProfile = validDirectives.includes(trimmedValue);

    if (!isValidForProfile) {
      return error({
        kind: "PatternMismatch",
        value: trimmedValue,
        profile: actualProfile.value || "default",
        validDirectives: [...validDirectives],
        message: `DirectiveType "${trimmedValue}" is not valid for profile "${actualProfile.value || "default"}". Valid options: ${validDirectives.join(", ")}`,
      });
    }

    // Case 5: Success
    return ok(new DirectiveType(trimmedValue, actualProfile as ConfigProfileName, true));
  }

  /**
   * Check if this DirectiveType is valid for a specific profile
   * 
   * @param profile - Configuration profile to check against
   * @returns true if valid for the profile
   */
  isValidForProfile(profile: ConfigProfileName): boolean {
    const validDirectives = profile.getDirectiveTypes();
    return validDirectives.includes(this._value);
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
    return `${baseDir}/${this._value}/${layer.value}`;
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
    return `${baseDir}/${this._value}/${layer.value}`;
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
  getPromptPath(layer: { value: string }, baseDir = "prompts", fromLayerType?: string, adaptation?: string): string {
    const dir = this.getPromptDirectory(baseDir, layer);
    let filename = `${this._value}_${layer.value}.md`;
    
    if (fromLayerType) {
      filename = `${fromLayerType}_${layer.value}.md`;
    }
    
    if (adaptation) {
      filename = `${fromLayerType || this._value}_${layer.value}_${adaptation}.md`;
    }
    
    return `${dir}/${filename}`;
  }

  /**
   * Get schema file path for this directive type
   * 
   * Domain operation for complete path resolution in schema context.
   * 
   * @param layer - LayerType for path construction
   * @param baseDir - Base directory for schemas (default: "schemas")
   * @returns Complete file path string
   */
  getSchemaPath(layer: { value: string }, baseDir = "schemas"): string {
    const dir = this.getSchemaDirectory(baseDir, layer);
    const filename = `${this._value}_${layer.value}.schema.json`;
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
    const dir = `${baseDir}/${this._value}/${layer.value}`;
    const filename = inputPath.split('/').pop() || inputPath;
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
    return this._value === other._value && this._profile.equals(other._profile);
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
    return `DirectiveType(value="${this._value}", profile="${this._profile.value}", validated=${this._validatedByPattern})`;
  }

}

/**
 * TwoParamsDirectivePattern - DirectiveType用のバリデーションパターン
 *
 * 正規表現パターンを安全にラップし、DirectiveTypeのバリデーションに使用する。
 * Smart Constructorパターンを採用して、無効なパターンの作成を防ぐ。
 * 
 * 新しいDirectiveTypeクラスと統合するため、旧実装からのマイグレーション用として提供。
 * 新しいコードでは DirectiveType.create() を直接使用することを推奨。
 */
export class TwoParamsDirectivePattern {
  private constructor(private readonly pattern: RegExp) {}


  /**
   * 文字列パターンから TwoParamsDirectivePattern を作成（Result型版）
   *
   * Totality原則に準拠し、エラーを明示的に返す。
   * 統一エラー型システムを使用してValidationErrorを返す。
   *
   * @param pattern 正規表現文字列
   * @returns 成功時は Result<TwoParamsDirectivePattern>、失敗時はValidationError
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
   * 値がパターンにマッチするかテスト
   * @param value テスト対象の値
   * @returns マッチする場合 true
   */
  test(value: string): boolean {
    return this.pattern.test(value);
  }

  /**
   * パターンの文字列表現を取得
   * @returns 正規表現の文字列
   */
  toString(): string {
    return this.pattern.toString();
  }

  /**
   * パターンの文字列表現を取得（getPatternメソッド）
   * @returns 正規表現の文字列
   */
  getPattern(): string {
    return this.pattern.source;
  }

  /**
   * TypePatternProvider インターフェース準拠のためのメソッド
   * @returns 自身を返す（TypePatternProvider.getDirectivePattern用）
   */
  getDirectivePattern(): TwoParamsDirectivePattern {
    return this;
  }

  /**
   * 文字列パターンから TwoParamsDirectivePattern を作成（従来版）
   * 
   * @param pattern 正規表現文字列
   * @returns TwoParamsDirectivePattern または null
   */
  static create(pattern: string): TwoParamsDirectivePattern | null {
    const result = TwoParamsDirectivePattern.createOrError(pattern);
    return result.ok ? result.data : null;
  }
}