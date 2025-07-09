/**
 * @fileoverview Error Severity Value Object with Smart Constructor and Totality design
 *
 * This module provides a type-safe ErrorSeverity value object following
 * Domain-Driven Design principles and the Totality pattern. All operations
 * return Result types instead of throwing exceptions, ensuring complete
 * type safety and explicit error handling.
 *
 * ## Design Patterns Applied
 * - Smart Constructor: Type-safe creation with validation
 * - Discriminated Union: Explicit error types with type guards
 * - Result Type: No exceptions, all errors as values
 * - Value Object: Immutable with domain logic encapsulation
 *
 * ## Domain Context
 * ErrorSeverity represents the severity level of errors within the
 * Breakdown application error management bounded context.
 * It enforces domain rules for valid severity levels and impact scopes.
 *
 * @module domain/core/value_objects/error_severity
 */

import type { Result } from "../../../types/result.ts";
import { error, ok } from "../../../types/result.ts";

/**
 * エラーの重要度レベル
 */
export enum SeverityLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  CRITICAL = 4,
  FATAL = 5,
}

/**
 * エラーの影響範囲
 */
export enum ImpactScope {
  NONE = "none",
  LOCAL = "local",
  MODULE = "module",
  SYSTEM = "system",
  GLOBAL = "global",
}

/**
 * エラーメタデータ
 */
export interface ErrorMetadata {
  readonly code?: string;
  readonly category?: string;
  readonly timestamp?: Date;
  readonly context?: Record<string, unknown>;
}

/**
 * Discriminated Union for ErrorSeverity-specific errors
 *
 * Each error type has a unique 'kind' discriminator for type safety
 * and follows Domain-Driven Design principles for error handling.
 * The error types reflect domain concepts and constraints.
 */
export type ErrorSeverityError =
  | {
    kind: "InvalidLevel";
    message: string;
    providedLevel: string;
    validLevels: readonly string[];
  }
  | {
    kind: "InvalidImpact";
    message: string;
    providedImpact: string;
    validImpacts: readonly string[];
  }
  | {
    kind: "InvalidMetadata";
    message: string;
    field: string;
    value?: unknown;
  }
  | {
    kind: "NullOrUndefined";
    message: string;
    parameter: string;
  }
  | {
    kind: "InvalidType";
    message: string;
    expected: string;
    actual: string;
  };

/**
 * Type guards for ErrorSeverityError discrimination
 *
 * These type guards enable exhaustive pattern matching over error types
 * and provide type-safe access to error-specific properties.
 */
export function isInvalidLevelError(
  error: ErrorSeverityError,
): error is Extract<ErrorSeverityError, { kind: "InvalidLevel" }> {
  return error.kind === "InvalidLevel";
}

export function isInvalidImpactError(
  error: ErrorSeverityError,
): error is Extract<ErrorSeverityError, { kind: "InvalidImpact" }> {
  return error.kind === "InvalidImpact";
}

export function isInvalidMetadataError(
  error: ErrorSeverityError,
): error is Extract<ErrorSeverityError, { kind: "InvalidMetadata" }> {
  return error.kind === "InvalidMetadata";
}

export function isNullOrUndefinedError(
  error: ErrorSeverityError,
): error is Extract<ErrorSeverityError, { kind: "NullOrUndefined" }> {
  return error.kind === "NullOrUndefined";
}

export function isInvalidTypeError(
  error: ErrorSeverityError,
): error is Extract<ErrorSeverityError, { kind: "InvalidType" }> {
  return error.kind === "InvalidType";
}

/**
 * Format ErrorSeverityError for display
 *
 * Provides human-readable error messages for all error types
 * with contextual information to help users understand and fix issues.
 */
export function formatErrorSeverityError(severityError: ErrorSeverityError): string {
  switch (severityError.kind) {
    case "InvalidLevel":
      return `Invalid severity level "${severityError.providedLevel}": ${severityError.message}. Valid levels: ${
        severityError.validLevels.join(", ")
      }`;
    case "InvalidImpact":
      return `Invalid impact scope "${severityError.providedImpact}": ${severityError.message}. Valid impacts: ${
        severityError.validImpacts.join(", ")
      }`;
    case "InvalidMetadata":
      return `Invalid metadata field "${severityError.field}": ${severityError.message}`;
    case "NullOrUndefined":
      return `Parameter "${severityError.parameter}" cannot be null or undefined: ${severityError.message}`;
    case "InvalidType":
      return `Invalid type for parameter: expected ${severityError.expected}, got ${severityError.actual}. ${severityError.message}`;
  }
}

export class ErrorSeverity {
  private readonly level: SeverityLevel;
  private readonly impact: ImpactScope;
  private readonly metadata: ErrorMetadata;

  private constructor(
    level: SeverityLevel,
    impact: ImpactScope,
    metadata: ErrorMetadata = {},
  ) {
    this.level = level;
    this.impact = impact;
    this.metadata = Object.freeze({ ...metadata });
    // Ensure complete immutability
    Object.freeze(this);
  }

  /**
   * デバッグレベルのエラー重要度を生成
   */
  public static debug(
    impact: ImpactScope = ImpactScope.NONE,
    metadata?: ErrorMetadata,
  ): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.DEBUG, impact, metadata);
  }

  /**
   * 情報レベルのエラー重要度を生成
   */
  public static info(
    impact: ImpactScope = ImpactScope.LOCAL,
    metadata?: ErrorMetadata,
  ): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.INFO, impact, metadata);
  }

  /**
   * 警告レベルのエラー重要度を生成
   */
  public static warning(
    impact: ImpactScope = ImpactScope.MODULE,
    metadata?: ErrorMetadata,
  ): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.WARNING, impact, metadata);
  }

  /**
   * エラーレベルのエラー重要度を生成
   */
  public static error(
    impact: ImpactScope = ImpactScope.MODULE,
    metadata?: ErrorMetadata,
  ): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.ERROR, impact, metadata);
  }

  /**
   * 重大レベルのエラー重要度を生成
   */
  public static critical(
    impact: ImpactScope = ImpactScope.SYSTEM,
    metadata?: ErrorMetadata,
  ): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.CRITICAL, impact, metadata);
  }

  /**
   * 致命的レベルのエラー重要度を生成
   */
  public static fatal(
    impact: ImpactScope = ImpactScope.GLOBAL,
    metadata?: ErrorMetadata,
  ): ErrorSeverity {
    return new ErrorSeverity(SeverityLevel.FATAL, impact, metadata);
  }

  /**
   * Smart Constructor for ErrorSeverity with comprehensive validation
   *
   * Validates all domain rules for error severity and returns
   * a Result type containing either a valid ErrorSeverity or specific error.
   *
   * @param level - The severity level
   * @param impact - The impact scope
   * @param metadata - Optional metadata
   * @returns Result containing ErrorSeverity or ErrorSeverityError
   *
   * @example
   * ```typescript
   * const result = ErrorSeverity.create(SeverityLevel.ERROR, ImpactScope.MODULE);
   * if (result.ok) {
   *   console.log(`Valid severity: ${result.data.getLevelName()}`);
   * } else {
   *   console.error(formatErrorSeverityError(result.error));
   * }
   * ```
   */
  static create(
    level: SeverityLevel,
    impact: ImpactScope,
    metadata?: ErrorMetadata,
  ): Result<ErrorSeverity, ErrorSeverityError> {
    // Validate level
    if (level == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Severity level must be provided",
        parameter: "level",
      });
    }

    if (typeof level !== "number") {
      return error({
        kind: "InvalidType",
        message: "Severity level must be a valid SeverityLevel enum value",
        expected: "SeverityLevel (number)",
        actual: typeof level,
      });
    }

    const validLevels = Object.values(SeverityLevel).filter((v) =>
      typeof v === "number"
    ) as number[];
    if (!validLevels.includes(level)) {
      return error({
        kind: "InvalidLevel",
        message: "Provided level is not a valid SeverityLevel",
        providedLevel: String(level),
        validLevels: validLevels.map((l) => `${SeverityLevel[l]}(${l})`),
      });
    }

    // Validate impact
    if (impact == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Impact scope must be provided",
        parameter: "impact",
      });
    }

    if (typeof impact !== "string") {
      return error({
        kind: "InvalidType",
        message: "Impact scope must be a valid ImpactScope enum value",
        expected: "ImpactScope (string)",
        actual: typeof impact,
      });
    }

    const validImpacts = Object.values(ImpactScope);
    if (!validImpacts.includes(impact)) {
      return error({
        kind: "InvalidImpact",
        message: "Provided impact is not a valid ImpactScope",
        providedImpact: impact,
        validImpacts,
      });
    }

    // Validate metadata if provided
    if (metadata != null) {
      if (typeof metadata !== "object" || Array.isArray(metadata)) {
        return error({
          kind: "InvalidMetadata",
          message: "Metadata must be an object",
          field: "metadata",
          value: metadata,
        });
      }

      // Validate specific metadata fields
      if (metadata.code != null && typeof metadata.code !== "string") {
        return error({
          kind: "InvalidMetadata",
          message: "Code must be a string",
          field: "code",
          value: metadata.code,
        });
      }

      if (metadata.category != null && typeof metadata.category !== "string") {
        return error({
          kind: "InvalidMetadata",
          message: "Category must be a string",
          field: "category",
          value: metadata.category,
        });
      }

      if (metadata.timestamp != null && !(metadata.timestamp instanceof Date)) {
        return error({
          kind: "InvalidMetadata",
          message: "Timestamp must be a Date object",
          field: "timestamp",
          value: metadata.timestamp,
        });
      }

      if (
        metadata.context != null &&
        (typeof metadata.context !== "object" || Array.isArray(metadata.context))
      ) {
        return error({
          kind: "InvalidMetadata",
          message: "Context must be an object",
          field: "context",
          value: metadata.context,
        });
      }
    }

    // All validations passed - create immutable ErrorSeverity
    return ok(new ErrorSeverity(level, impact, metadata));
  }

  /**
   * カスタムエラー重要度を生成（レガシー互換性のため）
   * @deprecated Use ErrorSeverity.create() for Result-based error handling
   */
  public static custom(
    level: SeverityLevel,
    impact: ImpactScope,
    metadata?: ErrorMetadata,
  ): ErrorSeverity {
    const result = ErrorSeverity.create(level, impact, metadata);
    if (!result.ok) {
      throw new Error(formatErrorSeverityError(result.error));
    }
    return result.data;
  }

  /**
   * Smart Constructor for creating ErrorSeverity from string with validation
   *
   * @param levelStr - The severity level as string
   * @param impact - Optional impact scope (defaults to appropriate level)
   * @param metadata - Optional metadata
   * @returns Result containing ErrorSeverity or ErrorSeverityError
   */
  static fromString(
    levelStr: string,
    impact?: ImpactScope,
    metadata?: ErrorMetadata,
  ): Result<ErrorSeverity, ErrorSeverityError> {
    // Validate levelStr
    if (levelStr == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Level string must be provided",
        parameter: "levelStr",
      });
    }

    if (typeof levelStr !== "string") {
      return error({
        kind: "InvalidType",
        message: "Level must be a string",
        expected: "string",
        actual: typeof levelStr,
      });
    }

    const trimmedLevel = levelStr.trim();
    if (trimmedLevel.length === 0) {
      return error({
        kind: "InvalidLevel",
        message: "Level string cannot be empty",
        providedLevel: levelStr,
        validLevels: Object.keys(SeverityLevel).filter((k) => isNaN(Number(k))),
      });
    }

    const normalizedLevel = trimmedLevel.toUpperCase();
    const level = SeverityLevel[normalizedLevel as keyof typeof SeverityLevel];

    if (level === undefined) {
      const validLevels = Object.keys(SeverityLevel).filter((k) => isNaN(Number(k)));
      return error({
        kind: "InvalidLevel",
        message: "Provided level string does not match any valid severity level",
        providedLevel: levelStr,
        validLevels,
      });
    }

    const defaultImpact = this.getDefaultImpactForLevel(level);
    return ErrorSeverity.create(level, impact || defaultImpact, metadata);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use ErrorSeverity.fromString() for Result-based error handling
   */
  public static fromStringUnsafe(
    levelStr: string,
    impact?: ImpactScope,
    metadata?: ErrorMetadata,
  ): ErrorSeverity {
    const result = ErrorSeverity.fromString(levelStr, impact, metadata);
    if (!result.ok) {
      throw new Error(formatErrorSeverityError(result.error));
    }
    return result.data;
  }

  /**
   * レベルに応じたデフォルトの影響範囲を取得
   */
  private static getDefaultImpactForLevel(level: SeverityLevel): ImpactScope {
    switch (level) {
      case SeverityLevel.DEBUG:
        return ImpactScope.NONE;
      case SeverityLevel.INFO:
        return ImpactScope.LOCAL;
      case SeverityLevel.WARNING:
      case SeverityLevel.ERROR:
        return ImpactScope.MODULE;
      case SeverityLevel.CRITICAL:
        return ImpactScope.SYSTEM;
      case SeverityLevel.FATAL:
        return ImpactScope.GLOBAL;
      default:
        return ImpactScope.LOCAL;
    }
  }

  /**
   * 重要度レベルを取得
   */
  public getLevel(): SeverityLevel {
    return this.level;
  }

  /**
   * 影響範囲を取得
   */
  public getImpact(): ImpactScope {
    return this.impact;
  }

  /**
   * メタデータを取得
   */
  public getMetadata(): ErrorMetadata {
    return { ...this.metadata };
  }

  /**
   * レベル名を文字列で取得
   */
  public getLevelName(): string {
    return SeverityLevel[this.level];
  }

  /**
   * 数値としてのレベルを取得
   */
  public getNumericLevel(): number {
    return this.level;
  }

  /**
   * 指定されたレベル以上かどうかを判定
   */
  public isAtLeast(threshold: SeverityLevel): boolean {
    return this.level >= threshold;
  }

  /**
   * 指定されたレベルより高いかどうかを判定
   */
  public isHigherThan(other: ErrorSeverity): boolean {
    return this.level > other.level;
  }

  /**
   * 通知が必要かどうかを判定
   */
  public requiresNotification(threshold: SeverityLevel = SeverityLevel.ERROR): boolean {
    return this.isAtLeast(threshold);
  }

  /**
   * 即座の対応が必要かどうかを判定
   */
  public requiresImmediateAction(): boolean {
    return this.level >= SeverityLevel.CRITICAL;
  }

  /**
   * システム停止が必要かどうかを判定
   */
  public requiresSystemHalt(): boolean {
    return this.level === SeverityLevel.FATAL;
  }

  /**
   * ログ出力が必要かどうかを判定
   */
  public shouldLog(logLevel: SeverityLevel): boolean {
    return this.level >= logLevel;
  }

  /**
   * メタデータを追加した新しいインスタンスを生成
   */
  public withMetadata(additionalMetadata: ErrorMetadata): ErrorSeverity {
    const mergedMetadata = {
      ...this.metadata,
      ...additionalMetadata,
      context: {
        ...this.metadata.context,
        ...additionalMetadata.context,
      },
    };

    return new ErrorSeverity(this.level, this.impact, mergedMetadata);
  }

  /**
   * エラーコードを設定した新しいインスタンスを生成
   */
  public withCode(code: string): ErrorSeverity {
    return this.withMetadata({ code });
  }

  /**
   * カテゴリを設定した新しいインスタンスを生成
   */
  public withCategory(category: string): ErrorSeverity {
    return this.withMetadata({ category });
  }

  /**
   * 影響範囲を変更した新しいインスタンスを生成
   */
  public withImpact(impact: ImpactScope): ErrorSeverity {
    return new ErrorSeverity(this.level, impact, this.metadata);
  }

  /**
   * より高い重要度と比較して高い方を返す
   */
  public escalate(other: ErrorSeverity): ErrorSeverity {
    if (other.level > this.level) {
      // より高いレベルの場合、メタデータをマージして返す
      return new ErrorSeverity(other.level, other.impact, {
        ...this.metadata,
        ...other.metadata,
      });
    }

    if (
      other.level === this.level &&
      this.getImpactPriority(other.impact) > this.getImpactPriority(this.impact)
    ) {
      return new ErrorSeverity(this.level, other.impact, {
        ...this.metadata,
        ...other.metadata,
      });
    }

    return this;
  }

  /**
   * 影響範囲の優先度を取得
   */
  private getImpactPriority(impact: ImpactScope): number {
    const priorities: Record<ImpactScope, number> = {
      [ImpactScope.NONE]: 0,
      [ImpactScope.LOCAL]: 1,
      [ImpactScope.MODULE]: 2,
      [ImpactScope.SYSTEM]: 3,
      [ImpactScope.GLOBAL]: 4,
    };

    return priorities[impact] || 0;
  }

  /**
   * 等価性の比較
   */
  public equals(other: ErrorSeverity): boolean {
    return this.level === other.level &&
      this.impact === other.impact &&
      JSON.stringify(this.metadata) === JSON.stringify(other.metadata);
  }

  /**
   * ログ出力用のフォーマット
   */
  public toLogFormat(): string {
    const parts = [
      `[${this.getLevelName()}]`,
      `impact=${this.impact}`,
    ];

    if (this.metadata.code) {
      parts.push(`code=${this.metadata.code}`);
    }

    if (this.metadata.category) {
      parts.push(`category=${this.metadata.category}`);
    }

    return parts.join(" ");
  }

  /**
   * JSON形式への変換
   */
  public toJSON(): Record<string, unknown> {
    return {
      level: this.getLevelName(),
      numericLevel: this.level,
      impact: this.impact,
      metadata: this.metadata,
      requiresNotification: this.requiresNotification(),
      requiresImmediateAction: this.requiresImmediateAction(),
    };
  }

  /**
   * 文字列表現
   */
  public toString(): string {
    return `ErrorSeverity(${this.getLevelName()}, ${this.impact})`;
  }
}
