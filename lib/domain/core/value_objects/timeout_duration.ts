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
  | { kind: "InvalidUnit"; input: string; validUnits: string[] };

/**
 * Immutable value object representing a timeout duration
 */
export class TimeoutDuration {
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
    unit: TimeUnit = TIME_UNITS.MILLISECONDS
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
    return TimeoutDuration.create(ms, TIME_UNITS.MILLISECONDS);
  }

  static fromSeconds(seconds: number): Result<TimeoutDuration, TimeoutDurationError> {
    return TimeoutDuration.create(seconds, TIME_UNITS.SECONDS);
  }

  static fromMinutes(minutes: number): Result<TimeoutDuration, TimeoutDurationError> {
    return TimeoutDuration.create(minutes, TIME_UNITS.MINUTES);
  }

  static fromHours(hours: number): Result<TimeoutDuration, TimeoutDurationError> {
    return TimeoutDuration.create(hours, TIME_UNITS.HOURS);
  }

  /**
   * Factory methods for common timeout values
   */
  static short(): TimeoutDuration {
    return new TimeoutDuration(5, TIME_UNITS.SECONDS);
  }

  static medium(): TimeoutDuration {
    return new TimeoutDuration(30, TIME_UNITS.SECONDS);
  }

  static long(): TimeoutDuration {
    return new TimeoutDuration(5, TIME_UNITS.MINUTES);
  }

  static veryLong(): TimeoutDuration {
    return new TimeoutDuration(30, TIME_UNITS.MINUTES);
  }

  static infinite(): TimeoutDuration {
    return new TimeoutDuration(0, TIME_UNITS.MILLISECONDS);
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
   * Get duration in seconds
   */
  get seconds(): number {
    return this._milliseconds / 1000;
  }

  /**
   * Get duration in minutes
   */
  get minutes(): number {
    return this._milliseconds / (60 * 1000);
  }

  /**
   * Get duration in hours
   */
  get hours(): number {
    return this._milliseconds / (60 * 60 * 1000);
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

  /**
   * Create a new timeout with added duration
   */
  add(other: TimeoutDuration): Result<TimeoutDuration, TimeoutDurationError> {
    const newMs = this._milliseconds + other._milliseconds;
    return TimeoutDuration.fromMilliseconds(newMs);
  }

  /**
   * Create a new timeout with subtracted duration
   */
  subtract(other: TimeoutDuration): Result<TimeoutDuration, TimeoutDurationError> {
    const newMs = this._milliseconds - other._milliseconds;
    return TimeoutDuration.fromMilliseconds(newMs);
  }

  /**
   * Create a new timeout with multiplied duration
   */
  multiply(factor: number): Result<TimeoutDuration, TimeoutDurationError> {
    if (typeof factor !== "number" || !Number.isFinite(factor) || factor < 0) {
      return resultError({
        kind: "InvalidDuration",
        input: factor,
        reason: "Multiplication factor must be a non-negative finite number",
      });
    }

    const newMs = this._milliseconds * factor;
    return TimeoutDuration.fromMilliseconds(newMs);
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
    return TimeoutDuration.fromMilliseconds(newMs);
  }

  /**
   * Format for human-readable display
   */
  toHumanReadable(): string {
    if (this.isInfinite()) {
      return "infinite";
    }

    if (this._milliseconds < 1000) {
      return `${this._milliseconds}ms`;
    }

    if (this._milliseconds < 60 * 1000) {
      const seconds = Math.round(this.seconds * 10) / 10;
      return `${seconds}s`;
    }

    if (this._milliseconds < 60 * 60 * 1000) {
      const minutes = Math.round(this.minutes * 10) / 10;
      return `${minutes}m`;
    }

    const hours = Math.round(this.hours * 10) / 10;
    return `${hours}h`;
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
    return this.toHumanReadable();
  }

  /**
   * JSON serialization
   */
  toJSON(): { value: number; unit: TimeUnit; milliseconds: number } {
    return {
      value: this._originalValue,
      unit: this._originalUnit,
      milliseconds: this._milliseconds,
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

    default:
      return "Unknown timeout duration validation error occurred.";
  }
}