/**
 * @fileoverview BreakdownParamsResult implementation with Discriminated Union
 *
 * This module implements a Result type for BreakdownParams operations
 * using Discriminated Unions for type-safe error handling. Following
 * the Totality principle, all operations are total functions that
 * always return a defined result.
 *
 * @module types/breakdown_params_result
 */

import type { TwoParams_Result } from "../deps.ts";

/**
 * Success variant of BreakdownParamsResult
 *
 * Represents a successful operation with the resulting data.
 * Uses 'success' as the discriminator tag for type narrowing.
 */
export interface BreakdownParamsResultSuccess {
  readonly type: "success";
  readonly data: TwoParams_Result;
}

/**
 * Failure variant of BreakdownParamsResult
 *
 * Represents a failed operation with error information.
 * Uses 'failure' as the discriminator tag for type narrowing.
 */
export interface BreakdownParamsResultFailure {
  readonly type: "failure";
  readonly error: Error;
}

/**
 * BreakdownParamsResult - Discriminated Union for operation results
 *
 * Ensures exhaustive handling of success and failure cases through
 * TypeScript's discriminated union feature. The 'type' field acts
 * as the discriminator for type narrowing.
 *
 * @example Basic usage
 * ```typescript
 * const result = parseBreakdownParams(args);
 * if (isSuccess(result)) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export type BreakdownParamsResult =
  | BreakdownParamsResultSuccess
  | BreakdownParamsResultFailure;

/**
 * Type guard for checking if result is success
 *
 * Narrows the type to BreakdownParamsResultSuccess when true.
 *
 * @param result The result to check
 * @returns true if result is success variant
 */
export function isSuccess(
  result: BreakdownParamsResult,
): result is BreakdownParamsResultSuccess {
  return result.type === "success";
}

/**
 * Type guard for checking if result is failure
 *
 * Narrows the type to BreakdownParamsResultFailure when true.
 *
 * @param result The result to check
 * @returns true if result is failure variant
 */
export function isFailure(
  result: BreakdownParamsResult,
): result is BreakdownParamsResultFailure {
  return result.type === "failure";
}

/**
 * Creates a success result
 *
 * Factory function following the Smart Constructor pattern.
 *
 * @param data The successful operation data
 * @returns Success variant of BreakdownParamsResult
 */
export function success(
  data: TwoParams_Result,
): BreakdownParamsResultSuccess {
  return {
    type: "success",
    data,
  };
}

/**
 * Creates a failure result
 *
 * Factory function following the Smart Constructor pattern.
 *
 * @param error The error that occurred
 * @returns Failure variant of BreakdownParamsResult
 */
export function failure(
  error: Error,
): BreakdownParamsResultFailure {
  return {
    type: "failure",
    error,
  };
}

/**
 * Pattern matching for BreakdownParamsResult
 *
 * Ensures exhaustive handling of all variants through TypeScript's
 * exhaustiveness checking. Provides a functional approach to
 * handling different result states.
 *
 * @param result The result to match
 * @param handlers Object with handlers for each variant
 * @returns The value returned by the matching handler
 *
 * @example
 * ```typescript
 * const message = match(result, {
 *   success: (data) => `Success: ${data.demonstrativeType}`,
 *   failure: (error) => `Error: ${error.message}`
 * });
 * ```
 */
export function match<T>(
  result: BreakdownParamsResult,
  handlers: {
    success: (data: TwoParams_Result) => T;
    failure: (error: Error) => T;
  },
): T {
  switch (result.type) {
    case "success":
      return handlers.success(result.data);
    case "failure":
      return handlers.failure(result.error);
    default: {
      // Exhaustiveness check - ensures all cases are handled
      const _exhaustive: never = result;
      throw new Error(`Unhandled case: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
