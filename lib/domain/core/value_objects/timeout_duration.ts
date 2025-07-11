/**
 * @fileoverview Timeout Duration Value Object with Smart Constructor and Totality design
 *
 * This module provides a type-safe TimeoutDuration value object following
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
 * TimeoutDuration represents timeout intervals within the
 * Breakdown application timeout management bounded context.
 * It enforces domain rules for valid timeout duration specifications.
 *
 * @module domain/core/value_objects/timeout_duration
 */

import type { Result } from "../../../types/result.ts";
import { error, ok } from "../../../types/result.ts";

/**
 * Discriminated Union for TimeoutDuration-specific errors
 *
 * Each error type has a unique 'kind' discriminator for type safety
 * and follows Domain-Driven Design principles for error handling.
 * The error types reflect domain concepts and timeout constraints.
 */
export type TimeoutDurationError =
  | {
    kind: "NonIntegerValue";
    message: string;
    providedValue: number;
  }
  | {
    kind: "BelowMinimum";
    message: string;
    providedValue: number;
    minimumValue: number;
  }
  | {
    kind: "AboveMaximum";
    message: string;
    providedValue: number;
    maximumValue: number;
  }
  | {
    kind: "InvalidSeconds";
    message: string;
    providedValue: number;
  }
  | {
    kind: "InvalidMinutes";
    message: string;
    providedValue: number;
  }
  | {
    kind: "InvalidScaleFactor";
    message: string;
    providedFactor: number;
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
 * Type guards for TimeoutDurationError discrimination
 *
 * These type guards enable exhaustive pattern matching over error types
 * and provide type-safe access to error-specific properties.
 */
export function isNonIntegerValueError(
  error: TimeoutDurationError,
): error is Extract<TimeoutDurationError, { kind: "NonIntegerValue" }> {
  return error.kind === "NonIntegerValue";
}

export function isBelowMinimumError(
  error: TimeoutDurationError,
): error is Extract<TimeoutDurationError, { kind: "BelowMinimum" }> {
  return error.kind === "BelowMinimum";
}

export function isAboveMaximumError(
  error: TimeoutDurationError,
): error is Extract<TimeoutDurationError, { kind: "AboveMaximum" }> {
  return error.kind === "AboveMaximum";
}

export function isInvalidSecondsError(
  error: TimeoutDurationError,
): error is Extract<TimeoutDurationError, { kind: "InvalidSeconds" }> {
  return error.kind === "InvalidSeconds";
}

export function isInvalidMinutesError(
  error: TimeoutDurationError,
): error is Extract<TimeoutDurationError, { kind: "InvalidMinutes" }> {
  return error.kind === "InvalidMinutes";
}

export function isInvalidScaleFactorError(
  error: TimeoutDurationError,
): error is Extract<TimeoutDurationError, { kind: "InvalidScaleFactor" }> {
  return error.kind === "InvalidScaleFactor";
}

export function isNullOrUndefinedError(
  error: TimeoutDurationError,
): error is Extract<TimeoutDurationError, { kind: "NullOrUndefined" }> {
  return error.kind === "NullOrUndefined";
}

export function isInvalidTypeError(
  error: TimeoutDurationError,
): error is Extract<TimeoutDurationError, { kind: "InvalidType" }> {
  return error.kind === "InvalidType";
}

/**
 * Format TimeoutDurationError for display
 *
 * Provides human-readable error messages for all error types
 * with contextual information to help users understand and fix issues.
 */
export function formatTimeoutDurationError(timeoutError: TimeoutDurationError): string {
  switch (timeoutError.kind) {
    case "NonIntegerValue":
      return `Timeout duration must be an integer: ${timeoutError.providedValue}. ${timeoutError.message}`;
    case "BelowMinimum":
      return `Timeout duration ${timeoutError.providedValue}ms is below minimum ${timeoutError.minimumValue}ms. ${timeoutError.message}`;
    case "AboveMaximum":
      return `Timeout duration ${timeoutError.providedValue}ms is above maximum ${timeoutError.maximumValue}ms. ${timeoutError.message}`;
    case "InvalidSeconds":
      return `Invalid seconds value: ${timeoutError.providedValue}. ${timeoutError.message}`;
    case "InvalidMinutes":
      return `Invalid minutes value: ${timeoutError.providedValue}. ${timeoutError.message}`;
    case "InvalidScaleFactor":
      return `Invalid scale factor: ${timeoutError.providedFactor}. ${timeoutError.message}`;
    case "NullOrUndefined":
      return `Parameter "${timeoutError.parameter}" cannot be null or undefined: ${timeoutError.message}`;
    case "InvalidType":
      return `Invalid type for parameter: expected ${timeoutError.expected}, got ${timeoutError.actual}. ${timeoutError.message}`;
  }
}

export class TimeoutDuration {
  private readonly milliseconds: number;

  /**
   * 最小タイムアウト時間（100ミリ秒）
   */
  public static readonly MIN_MILLISECONDS = 100;

  /**
   * 最大タイムアウト時間（10分）
   */
  public static readonly MAX_MILLISECONDS = 600_000;

  /**
   * デフォルトタイムアウト時間（30秒）
   */
  public static readonly DEFAULT_MILLISECONDS = 30_000;

  private constructor(milliseconds: number) {
    this.milliseconds = milliseconds;
    // Ensure complete immutability
    Object.freeze(this);
  }

  /**
   * Smart Constructor for TimeoutDuration from milliseconds with comprehensive validation
   *
   * Validates all domain rules for timeout duration and returns
   * a Result type containing either a valid TimeoutDuration or specific error.
   *
   * @param milliseconds - The timeout duration in milliseconds
   * @returns Result containing TimeoutDuration or TimeoutDurationError
   *
   * @example
   * ```typescript
   * const timeoutResult = TimeoutDuration.fromMilliseconds(5000);
   * if (timeoutResult.ok) {
   *   console.log(`Valid timeout: ${timeoutResult.data.toHumanReadable()}`);
   * } else {
   *   console.error(formatTimeoutDurationError(timeoutResult.error));
   * }
   * ```
   */
  static fromMilliseconds(milliseconds: number): Result<TimeoutDuration, TimeoutDurationError> {
    // Validate milliseconds
    if (milliseconds == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Milliseconds value must be provided",
        parameter: "milliseconds",
      });
    }

    if (typeof milliseconds !== "number") {
      return error({
        kind: "InvalidType",
        message: "Milliseconds must be a number",
        expected: "number",
        actual: typeof milliseconds,
      });
    }

    if (!Number.isFinite(milliseconds)) {
      return error({
        kind: "InvalidType",
        message: "Milliseconds must be a finite number",
        expected: "finite number",
        actual: milliseconds.toString(),
      });
    }

    if (!Number.isInteger(milliseconds)) {
      return error({
        kind: "NonIntegerValue",
        message: "TimeoutDuration must be an integer value",
        providedValue: milliseconds,
      });
    }

    if (milliseconds < this.MIN_MILLISECONDS) {
      return error({
        kind: "BelowMinimum",
        message: "TimeoutDuration value is too small for practical use",
        providedValue: milliseconds,
        minimumValue: this.MIN_MILLISECONDS,
      });
    }

    if (milliseconds > this.MAX_MILLISECONDS) {
      return error({
        kind: "AboveMaximum",
        message: "TimeoutDuration value exceeds maximum allowed limit",
        providedValue: milliseconds,
        maximumValue: this.MAX_MILLISECONDS,
      });
    }

    // All validations passed - create immutable TimeoutDuration
    return ok(new TimeoutDuration(milliseconds));
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use TimeoutDuration.fromMilliseconds() for Result-based error handling
   */
  public static fromMillisecondsUnsafe(milliseconds: number): TimeoutDuration {
    const result = TimeoutDuration.fromMilliseconds(milliseconds);
    if (!result.ok) {
      throw new Error(formatTimeoutDurationError(result.error));
    }
    return result.data;
  }

  /**
   * Smart Constructor for TimeoutDuration from seconds with comprehensive validation
   */
  static fromSeconds(seconds: number): Result<TimeoutDuration, TimeoutDurationError> {
    if (seconds == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Seconds value must be provided",
        parameter: "seconds",
      });
    }

    if (typeof seconds !== "number") {
      return error({
        kind: "InvalidType",
        message: "Seconds must be a number",
        expected: "number",
        actual: typeof seconds,
      });
    }

    if (!Number.isFinite(seconds) || seconds < 0) {
      return error({
        kind: "InvalidSeconds",
        message: "Seconds must be a finite non-negative number",
        providedValue: seconds,
      });
    }

    const milliseconds = Math.floor(seconds * 1000);
    return TimeoutDuration.fromMilliseconds(milliseconds);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use TimeoutDuration.fromSeconds() for Result-based error handling
   */
  public static fromSecondsUnsafe(seconds: number): TimeoutDuration {
    const result = TimeoutDuration.fromSeconds(seconds);
    if (!result.ok) {
      throw new Error(formatTimeoutDurationError(result.error));
    }
    return result.data;
  }

  /**
   * Smart Constructor for TimeoutDuration from minutes with comprehensive validation
   */
  static fromMinutes(minutes: number): Result<TimeoutDuration, TimeoutDurationError> {
    if (minutes == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Minutes value must be provided",
        parameter: "minutes",
      });
    }

    if (typeof minutes !== "number") {
      return error({
        kind: "InvalidType",
        message: "Minutes must be a number",
        expected: "number",
        actual: typeof minutes,
      });
    }

    if (!Number.isFinite(minutes) || minutes < 0) {
      return error({
        kind: "InvalidMinutes",
        message: "Minutes must be a finite non-negative number",
        providedValue: minutes,
      });
    }

    const milliseconds = Math.floor(minutes * 60 * 1000);
    return TimeoutDuration.fromMilliseconds(milliseconds);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use TimeoutDuration.fromMinutes() for Result-based error handling
   */
  public static fromMinutesUnsafe(minutes: number): TimeoutDuration {
    const result = TimeoutDuration.fromMinutes(minutes);
    if (!result.ok) {
      throw new Error(formatTimeoutDurationError(result.error));
    }
    return result.data;
  }

  /**
   * デフォルトのTimeoutDurationを生成
   */
  public static default(): TimeoutDuration {
    return new TimeoutDuration(this.DEFAULT_MILLISECONDS);
  }

  /**
   * 無限タイムアウト（実際には最大値）を生成
   */
  public static infinite(): TimeoutDuration {
    return new TimeoutDuration(this.MAX_MILLISECONDS);
  }

  /**
   * ミリ秒単位の値を取得
   */
  public toMilliseconds(): number {
    return this.milliseconds;
  }

  /**
   * 秒単位の値を取得
   */
  public toSeconds(): number {
    return Math.floor(this.milliseconds / 1000);
  }

  /**
   * 分単位の値を取得
   */
  public toMinutes(): number {
    return Math.floor(this.milliseconds / 60_000);
  }

  /**
   * 人間が読みやすい形式で文字列化
   */
  public toHumanReadable(): string {
    if (this.milliseconds < 1000) {
      return `${this.milliseconds}ms`;
    }

    const seconds = this.toSeconds();
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }

    return `${minutes}m${remainingSeconds}s`;
  }

  /**
   * 等価性の比較
   */
  public equals(other: TimeoutDuration): boolean {
    return this.milliseconds === other.milliseconds;
  }

  /**
   * 大小比較
   */
  public isGreaterThan(other: TimeoutDuration): boolean {
    return this.milliseconds > other.milliseconds;
  }

  public isLessThan(other: TimeoutDuration): boolean {
    return this.milliseconds < other.milliseconds;
  }

  public isGreaterThanOrEqualTo(other: TimeoutDuration): boolean {
    return this.milliseconds >= other.milliseconds;
  }

  public isLessThanOrEqualTo(other: TimeoutDuration): boolean {
    return this.milliseconds <= other.milliseconds;
  }

  /**
   * 加算 (Result type for overflow handling)
   */
  public add(other: TimeoutDuration): Result<TimeoutDuration, TimeoutDurationError> {
    const sum = this.milliseconds + other.milliseconds;
    if (sum > TimeoutDuration.MAX_MILLISECONDS) {
      return ok(TimeoutDuration.infinite());
    }
    return TimeoutDuration.fromMilliseconds(sum);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use add() for Result-based error handling
   */
  public addUnsafe(other: TimeoutDuration): TimeoutDuration {
    const result = this.add(other);
    if (!result.ok) {
      throw new Error(formatTimeoutDurationError(result.error));
    }
    return result.data;
  }

  /**
   * 減算 (Result type for underflow handling)
   */
  public subtract(other: TimeoutDuration): Result<TimeoutDuration, TimeoutDurationError> {
    const diff = this.milliseconds - other.milliseconds;
    if (diff < TimeoutDuration.MIN_MILLISECONDS) {
      return TimeoutDuration.fromMilliseconds(TimeoutDuration.MIN_MILLISECONDS);
    }
    return TimeoutDuration.fromMilliseconds(diff);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use subtract() for Result-based error handling
   */
  public subtractUnsafe(other: TimeoutDuration): TimeoutDuration {
    const result = this.subtract(other);
    if (!result.ok) {
      throw new Error(formatTimeoutDurationError(result.error));
    }
    return result.data;
  }

  /**
   * スケーリング (Result type for validation)
   */
  public scale(factor: number): Result<TimeoutDuration, TimeoutDurationError> {
    if (factor == null) {
      return error({
        kind: "NullOrUndefined",
        message: "Scale factor must be provided",
        parameter: "factor",
      });
    }

    if (typeof factor !== "number") {
      return error({
        kind: "InvalidType",
        message: "Scale factor must be a number",
        expected: "number",
        actual: typeof factor,
      });
    }

    if (!Number.isFinite(factor) || factor < 0) {
      return error({
        kind: "InvalidScaleFactor",
        message: "Scale factor must be a finite non-negative number",
        providedFactor: factor,
      });
    }

    const scaled = Math.floor(this.milliseconds * factor);

    if (scaled < TimeoutDuration.MIN_MILLISECONDS) {
      return TimeoutDuration.fromMilliseconds(TimeoutDuration.MIN_MILLISECONDS);
    }

    if (scaled > TimeoutDuration.MAX_MILLISECONDS) {
      return ok(TimeoutDuration.infinite());
    }

    return TimeoutDuration.fromMilliseconds(scaled);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use scale() for Result-based error handling
   */
  public scaleUnsafe(factor: number): TimeoutDuration {
    const result = this.scale(factor);
    if (!result.ok) {
      throw new Error(formatTimeoutDurationError(result.error));
    }
    return result.data;
  }

  /**
   * JSON形式への変換
   */
  public toJSON(): { milliseconds: number; humanReadable: string } {
    return {
      milliseconds: this.milliseconds,
      humanReadable: this.toHumanReadable(),
    };
  }

  /**
   * 文字列表現
   */
  public toString(): string {
    return `TimeoutDuration(${this.toHumanReadable()})`;
  }
}
