/**
 * @fileoverview TimeoutDuration Value Object implementation
 *
 * This module provides a type-safe representation of timeout durations
 * with validation and utility methods for time-based operations.
 *
 * @module domain/core/value_objects/timeout_duration
 */

import type { Result } from "../../../types/result.ts";
import { error as resultError, ok as resultOk } from "../../../types/result.ts";

/**
 * Time unit constants
 */
export const TIME_UNITS = {
  MILLISECONDS: "milliseconds",
  SECONDS: "seconds",
  MINUTES: "minutes",
  HOURS: "hours",
} as const;

export type TimeUnit = typeof TIME_UNITS[keyof typeof TIME_UNITS];

/**
 * Error types for TimeoutDuration validation
 */
export type TimeoutDurationError =
  | { kind: "InvalidDuration"; input: number; reason: string }
  | { kind: "InvalidFormat"; input: unknown; reason: string }
  | { kind: "NegativeDuration"; input: number }
  | { kind: "ExceedsMaximum"; input: number; maximum: number }
  | { kind: "InvalidUnit"; input: string; validUnits: string[] }
  | { kind: "NullOrUndefined"; input: unknown }
  | { kind: "NonIntegerValue"; input: number }
  | { kind: "BelowMinimum"; input: number; minimum: number }
  | { kind: "AboveMaximum"; input: number; maximum: number }
  | { kind: "InvalidType"; input: unknown; expectedType: string }
  | { kind: "InvalidSeconds"; input: number; reason: string }
  | { kind: "InvalidMinutes"; input: number; reason: string }
  | { kind: "InvalidScaleFactor"; input: number; reason: string };

/**
 * Immutable value object representing a timeout duration
 */
export class TimeoutDuration {
  static readonly MIN_MILLISECONDS = 100;
  static readonly MAX_MILLISECONDS = 600000; // 10 minutes

  private readonly _milliseconds: number;
  private readonly _originalValue: number;
  private readonly _originalUnit: TimeUnit;

  private constructor(value: number, unit: TimeUnit) {
    this._originalValue = value;
    this._originalUnit = unit;
    this._milliseconds = this.convertToMilliseconds(value, unit);
    Object.freeze(this);
  }

  /**
   * Smart Constructor: Creates a TimeoutDuration with validation
   */
  static create(
    value: number,
    unit: TimeUnit = TIME_UNITS.MILLISECONDS,
  ): Result<TimeoutDuration, TimeoutDurationError> {
    // Validate input types
    if (typeof value !== "number") {
      return resultError({
        kind: "InvalidFormat",
        input: value,
        reason: "Duration value must be a number",
      });
    }

    if (typeof unit !== "string") {
      return resultError({
        kind: "InvalidFormat",
        input: unit,
        reason: "Time unit must be a string",
      });
    }

    // Validate unit
    const validUnits = Object.values(TIME_UNITS);
    if (!validUnits.includes(unit)) {
      return resultError({
        kind: "InvalidUnit",
        input: unit,
        validUnits,
      });
    }

    // Validate value
    if (!Number.isFinite(value)) {
      return resultError({
        kind: "InvalidDuration",
        input: value,
        reason: "Duration value must be a finite number",
      });
    }

    if (value < 0) {
      return resultError({
        kind: "NegativeDuration",
        input: value,
      });
    }

    // Check maximum duration (24 hours in milliseconds)
    const maxDurationMs = 24 * 60 * 60 * 1000;
    const valueInMs = new TimeoutDuration(value, unit).convertToMilliseconds(value, unit);

    if (valueInMs > maxDurationMs) {
      return resultError({
        kind: "ExceedsMaximum",
        input: value,
        maximum: maxDurationMs,
      });
    }

    return resultOk(new TimeoutDuration(value, unit));
  }

  /**
   * Factory methods for common durations
   */
  static fromMilliseconds(ms: number): Result<TimeoutDuration, TimeoutDurationError> {
    // Null/undefined check
    if (ms === null || ms === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: ms,
      });
    }

    // Type check
    if (typeof ms !== "number") {
      return resultError({
        kind: "InvalidType",
        input: ms,
        expectedType: "number",
      });
    }

    // Non-finite check
    if (!Number.isFinite(ms)) {
      return resultError({
        kind: "InvalidType",
        input: ms,
        expectedType: "finite number",
      });
    }

    // Integer check
    if (!Number.isInteger(ms)) {
      return resultError({
        kind: "NonIntegerValue",
        input: ms,
      });
    }

    // Range check
    if (ms < TimeoutDuration.MIN_MILLISECONDS) {
      return resultError({
        kind: "BelowMinimum",
        input: ms,
        minimum: TimeoutDuration.MIN_MILLISECONDS,
      });
    }

    if (ms > TimeoutDuration.MAX_MILLISECONDS) {
      return resultError({
        kind: "AboveMaximum",
        input: ms,
        maximum: TimeoutDuration.MAX_MILLISECONDS,
      });
    }

    return resultOk(new TimeoutDuration(ms, TIME_UNITS.MILLISECONDS));
  }

  static fromSeconds(seconds: number): Result<TimeoutDuration, TimeoutDurationError> {
    // Null/undefined check
    if (seconds === null || seconds === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: seconds,
      });
    }

    // Type check
    if (typeof seconds !== "number") {
      return resultError({
        kind: "InvalidType",
        input: seconds,
        expectedType: "number",
      });
    }

    // Validation
    if (!Number.isFinite(seconds) || seconds < 0) {
      return resultError({
        kind: "InvalidSeconds",
        input: seconds,
        reason: "Seconds must be a non-negative finite number",
      });
    }

    const ms = seconds * 1000;
    return TimeoutDuration.fromMilliseconds(Math.round(ms));
  }

  static fromMinutes(minutes: number): Result<TimeoutDuration, TimeoutDurationError> {
    // Null/undefined check
    if (minutes === null || minutes === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: minutes,
      });
    }

    // Type check
    if (typeof minutes !== "number") {
      return resultError({
        kind: "InvalidType",
        input: minutes,
        expectedType: "number",
      });
    }

    // Validation
    if (!Number.isFinite(minutes) || minutes < 0) {
      return resultError({
        kind: "InvalidMinutes",
        input: minutes,
        reason: "Minutes must be a non-negative finite number",
      });
    }

    const ms = minutes * 60 * 1000;
    return TimeoutDuration.fromMilliseconds(Math.round(ms));
  }

  static fromHours(hours: number): Result<TimeoutDuration, TimeoutDurationError> {
    return TimeoutDuration.create(hours, TIME_UNITS.HOURS);
  }

  /**
   * Factory methods for common timeout values
   */
  static short(): TimeoutDuration {
    return new TimeoutDuration(5000, TIME_UNITS.MILLISECONDS);
  }

  static medium(): TimeoutDuration {
    return new TimeoutDuration(30000, TIME_UNITS.MILLISECONDS);
  }

  static long(): TimeoutDuration {
    return new TimeoutDuration(300000, TIME_UNITS.MILLISECONDS);
  }

  static veryLong(): TimeoutDuration {
    return new TimeoutDuration(TimeoutDuration.MAX_MILLISECONDS, TIME_UNITS.MILLISECONDS);
  }

  static default(): TimeoutDuration {
    return new TimeoutDuration(30000, TIME_UNITS.MILLISECONDS);
  }

  /**
   * Get default timeout duration
   */
  static getDefault(): TimeoutDuration {
    return TimeoutDuration.default();
  }

  static infinite(): TimeoutDuration {
    return new TimeoutDuration(TimeoutDuration.MAX_MILLISECONDS, TIME_UNITS.MILLISECONDS);
  }

  /**
   * Unsafe factory methods for backward compatibility
   */
  static fromMillisecondsUnsafe(ms: number): TimeoutDuration {
    const result = TimeoutDuration.fromMilliseconds(ms);
    if (!result.ok) {
      throw new Error(formatTimeoutDurationError(result.error));
    }
    return result.data;
  }

  static fromSecondsUnsafe(seconds: number): TimeoutDuration {
    const result = TimeoutDuration.fromSeconds(seconds);
    if (!result.ok) {
      throw new Error(formatTimeoutDurationError(result.error));
    }
    return result.data;
  }

  static fromMinutesUnsafe(minutes: number): TimeoutDuration {
    const result = TimeoutDuration.fromMinutes(minutes);
    if (!result.ok) {
      throw new Error(formatTimeoutDurationError(result.error));
    }
    return result.data;
  }

  /**
   * Convert duration to milliseconds
   */
  private convertToMilliseconds(value: number, unit: TimeUnit): number {
    switch (unit) {
      case TIME_UNITS.MILLISECONDS:
        return value;
      case TIME_UNITS.SECONDS:
        return value * 1000;
      case TIME_UNITS.MINUTES:
        return value * 60 * 1000;
      case TIME_UNITS.HOURS:
        return value * 60 * 60 * 1000;
      default:
        return value; // Default to milliseconds
    }
  }

  /**
   * Get duration in milliseconds
   */
  get milliseconds(): number {
    return this._milliseconds;
  }

  /**
   * Backward compatibility method
   */
  toMilliseconds(): number {
    return this.milliseconds;
  }

  /**
   * Get duration in seconds
   */
  get seconds(): number {
    return Math.floor(this._milliseconds / 1000);
  }

  /**
   * Backward compatibility method
   */
  toSeconds(): number {
    return this.seconds;
  }

  /**
   * Get duration in minutes
   */
  get minutes(): number {
    return Math.floor(this._milliseconds / (60 * 1000));
  }

  /**
   * Backward compatibility method
   */
  toMinutes(): number {
    return this.minutes;
  }

  /**
   * Get duration in hours
   */
  toHours(): number {
    return Math.floor(this._milliseconds / (60 * 60 * 1000));
  }

  /**
   * Get the original value and unit
   */
  get originalValue(): number {
    return this._originalValue;
  }

  get originalUnit(): TimeUnit {
    return this._originalUnit;
  }

  /**
   * Check if this is an infinite timeout (0 milliseconds)
   */
  isInfinite(): boolean {
    return this._milliseconds === 0;
  }

  /**
   * Check if this is a very short timeout (< 1 second)
   */
  isVeryShort(): boolean {
    return this._milliseconds > 0 && this._milliseconds < 1000;
  }

  /**
   * Check if this is a short timeout (< 10 seconds)
   */
  isShort(): boolean {
    return this._milliseconds >= 1000 && this._milliseconds < 10000;
  }

  /**
   * Check if this is a long timeout (> 5 minutes)
   */
  isLong(): boolean {
    return this._milliseconds > 5 * 60 * 1000;
  }

  /**
   * Compare with another timeout duration
   */
  isLongerThan(other: TimeoutDuration): boolean {
    return this._milliseconds > other._milliseconds;
  }

  isShorterThan(other: TimeoutDuration): boolean {
    return this._milliseconds < other._milliseconds;
  }

  equals(other: TimeoutDuration): boolean {
    return this._milliseconds === other._milliseconds;
  }

  isGreaterThan(other: TimeoutDuration): boolean {
    return this._milliseconds > other._milliseconds;
  }

  isLessThan(other: TimeoutDuration): boolean {
    return this._milliseconds < other._milliseconds;
  }

  isGreaterThanOrEqualTo(other: TimeoutDuration): boolean {
    return this._milliseconds >= other._milliseconds;
  }

  isLessThanOrEqualTo(other: TimeoutDuration): boolean {
    return this._milliseconds <= other._milliseconds;
  }

  /**
   * Create a new timeout with added duration
   */
  add(other: TimeoutDuration): Result<TimeoutDuration, TimeoutDurationError> {
    const newMs = this._milliseconds + other._milliseconds;
    // Apply max boundary
    const clampedMs = Math.min(newMs, TimeoutDuration.MAX_MILLISECONDS);
    return TimeoutDuration.fromMilliseconds(clampedMs);
  }

  /**
   * Create a new timeout with subtracted duration
   */
  subtract(other: TimeoutDuration): Result<TimeoutDuration, TimeoutDurationError> {
    const newMs = this._milliseconds - other._milliseconds;
    // Apply min boundary
    const clampedMs = Math.max(newMs, TimeoutDuration.MIN_MILLISECONDS);
    return TimeoutDuration.fromMilliseconds(clampedMs);
  }

  /**
   * Create a new timeout with scaled duration
   */
  scale(factor: number): Result<TimeoutDuration, TimeoutDurationError> {
    // Null/undefined check
    if (factor === null || factor === undefined) {
      return resultError({
        kind: "NullOrUndefined",
        input: factor,
      });
    }

    // Type and validation check
    if (typeof factor !== "number" || !Number.isFinite(factor) || factor < 0) {
      return resultError({
        kind: "InvalidScaleFactor",
        input: factor,
        reason: "Scale factor must be a non-negative finite number",
      });
    }

    const newMs = Math.round(this._milliseconds * factor);
    return TimeoutDuration.fromMilliseconds(newMs);
  }

  /**
   * Create a new timeout with multiplied duration
   */
  multiply(factor: number): Result<TimeoutDuration, TimeoutDurationError> {
    return this.scale(factor);
  }

  /**
   * Create a new timeout with divided duration
   */
  divide(divisor: number): Result<TimeoutDuration, TimeoutDurationError> {
    if (typeof divisor !== "number" || !Number.isFinite(divisor) || divisor <= 0) {
      return resultError({
        kind: "InvalidDuration",
        input: divisor,
        reason: "Division factor must be a positive finite number",
      });
    }

    const newMs = this._milliseconds / divisor;
    return TimeoutDuration.fromMilliseconds(Math.round(newMs));
  }

  /**
   * Unsafe arithmetic methods for backward compatibility
   */
  addUnsafe(other: TimeoutDuration): TimeoutDuration {
    const result = this.add(other);
    if (!result.ok) {
      throw new Error(formatTimeoutDurationError(result.error));
    }
    return result.data;
  }

  subtractUnsafe(other: TimeoutDuration): TimeoutDuration {
    const result = this.subtract(other);
    if (!result.ok) {
      throw new Error(formatTimeoutDurationError(result.error));
    }
    return result.data;
  }

  scaleUnsafe(factor: number): TimeoutDuration {
    const result = this.scale(factor);
    if (!result.ok) {
      throw new Error(formatTimeoutDurationError(result.error));
    }
    return result.data;
  }

  /**
   * Format for human-readable display
   */
  toHumanReadable(): string {
    if (this._milliseconds >= TimeoutDuration.MAX_MILLISECONDS) {
      return "10m";
    }

    if (this._milliseconds < 1000) {
      return `${this._milliseconds}ms`;
    }

    const totalSeconds = Math.floor(this._milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
      return `${seconds}s`;
    }

    if (seconds === 0) {
      return `${minutes}m`;
    }

    return `${minutes}m${seconds}s`;
  }

  /**
   * Format with original unit
   */
  toOriginalFormat(): string {
    if (this.isInfinite()) {
      return "infinite";
    }

    return `${this._originalValue} ${this._originalUnit}`;
  }

  /**
   * String representation
   */
  toString(): string {
    return `TimeoutDuration(${this.toHumanReadable()})`;
  }

  /**
   * JSON serialization
   */
  toJSON(): { milliseconds: number; humanReadable: string } {
    return {
      milliseconds: this._milliseconds,
      humanReadable: this.toHumanReadable(),
    };
  }

  /**
   * Primitive value conversion (returns milliseconds)
   */
  valueOf(): number {
    return this._milliseconds;
  }
}

/**
 * Type guard functions for TimeoutDurationError
 */
export function isNullOrUndefinedError(
  error: TimeoutDurationError,
): error is { kind: "NullOrUndefined"; input: unknown } {
  return error.kind === "NullOrUndefined";
}

export function isNonIntegerValueError(
  error: TimeoutDurationError,
): error is { kind: "NonIntegerValue"; input: number } {
  return error.kind === "NonIntegerValue";
}

export function isBelowMinimumError(
  error: TimeoutDurationError,
): error is { kind: "BelowMinimum"; input: number; minimum: number } {
  return error.kind === "BelowMinimum";
}

export function isAboveMaximumError(
  error: TimeoutDurationError,
): error is { kind: "AboveMaximum"; input: number; maximum: number } {
  return error.kind === "AboveMaximum";
}

export function isInvalidTypeError(
  error: TimeoutDurationError,
): error is { kind: "InvalidType"; input: unknown; expectedType: string } {
  return error.kind === "InvalidType";
}

export function isInvalidSecondsError(
  error: TimeoutDurationError,
): error is { kind: "InvalidSeconds"; input: number; reason: string } {
  return error.kind === "InvalidSeconds";
}

export function isInvalidMinutesError(
  error: TimeoutDurationError,
): error is { kind: "InvalidMinutes"; input: number; reason: string } {
  return error.kind === "InvalidMinutes";
}

export function isInvalidScaleFactorError(
  error: TimeoutDurationError,
): error is { kind: "InvalidScaleFactor"; input: number; reason: string } {
  return error.kind === "InvalidScaleFactor";
}

/**
 * Format timeout duration validation error for user-friendly display
 */
export function formatTimeoutDurationError(error: TimeoutDurationError): string {
  switch (error.kind) {
    case "InvalidDuration":
      return `Invalid timeout duration: ${error.input}. ${error.reason}`;

    case "InvalidFormat":
      return `Invalid format for timeout duration: ${error.reason}`;

    case "NegativeDuration":
      return `Timeout duration cannot be negative: ${error.input}. ` +
        `Please provide a positive duration value.`;

    case "ExceedsMaximum":
      return `Timeout duration ${error.input} exceeds maximum allowed duration of ${error.maximum}ms (24 hours). ` +
        `Please use a shorter timeout duration.`;

    case "InvalidUnit":
      return `Invalid time unit: "${error.input}". ` +
        `Valid units are: ${error.validUnits.join(", ")}`;

    case "NullOrUndefined":
      return `Timeout duration cannot be null or undefined. Received: ${error.input}`;

    case "NonIntegerValue":
      return `Timeout duration must be an integer value. Received: ${error.input}`;

    case "BelowMinimum":
      return `Timeout duration ${error.input}ms is below minimum allowed duration of ${error.minimum}ms`;

    case "AboveMaximum":
      return `Timeout duration ${error.input}ms is above maximum allowed duration of ${error.maximum}ms`;

    case "InvalidType":
      return `Invalid type for timeout duration. Expected ${error.expectedType}, received: ${typeof error
        .input}`;

    case "InvalidSeconds":
      return `Invalid seconds value: ${error.input}. ${error.reason}`;

    case "InvalidMinutes":
      return `Invalid minutes value: ${error.input}. ${error.reason}`;

    case "InvalidScaleFactor":
      return `Invalid scale factor: ${error.input}. ${error.reason}`;

    default:
      return "Unknown timeout duration validation error occurred.";
  }
}
