/**
 * @fileoverview Result type for Totality principle implementation
 *
 * This module provides the Result type for explicit error handling
 * following the Totality principle. All operations that can fail
 * return Result instead of throwing exceptions or returning null.
 *
 * @module parameter_parsing/types/result
 */

/**
 * Result type for explicit error handling
 *
 * Represents either success with data or failure with error.
 * This follows the Totality principle by making all possible
 * outcomes explicit in the type system.
 *
 * @template T Success data type
 * @template E Error type
 *
 * @example Basic usage
 * ```typescript
 * function parseNumber(input: string): Result<number, string> {
 *   const num = parseInt(input);
 *   if (isNaN(num)) {
 *     return { ok: false, error: "Invalid number format" };
 *   }
 *   return { ok: true, data: num };
 * }
 *
 * const result = parseNumber("42");
 * if (result.ok) {
 *   console.log(result.data); // 42
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/**
 * Create a successful result
 */
export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

/**
 * Create an error result
 */
export function error<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Check if result is successful
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; data: T } {
  return result.ok;
}

/**
 * Check if result is error
 */
export function isError<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

/**
 * Map successful result to new value
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U,
): Result<U, E> {
  if (result.ok) {
    return { ok: true, data: fn(result.data) };
  }
  return result;
}

/**
 * Chain result operations (flatMap)
 */
export function chain<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>,
): Result<U, E> {
  if (result.ok) {
    return fn(result.data);
  }
  return result;
}

/**
 * Get data from result or provide default
 */
export function getOrElse<T, E>(
  result: Result<T, E>,
  defaultValue: T,
): T {
  return result.ok ? result.data : defaultValue;
}

/**
 * Convert all results to single result
 * Fails if any result fails
 */
export function all<T, E>(
  results: Result<T, E>[],
): Result<T[], E> {
  const data: T[] = [];
  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    data.push(result.data);
  }
  return { ok: true, data };
}