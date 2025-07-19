/**
 * @fileoverview BreakdownParamsResult implementation with Discriminated Union
 *
 * This module implements a Result type for BreakdownParams operations
 * using Discriminated Unions for type-safe error handling. Following
 * the Totality principle, all operations are total functions that
 * always return a defined result.
 *
 * Now supports zero, one, and two parameter scenarios as per domain specification.
 *
 * @module types/breakdown_params_result
 */

import type { TwoParams_Result } from "../deps.ts";

/**
 * Zero parameters variant of BreakdownParamsResult
 *
 * Represents a scenario where no parameters are provided.
 * Uses 'zero' as the discriminator tag for type narrowing.
 */
export interface BreakdownParamsResultZero {
  readonly type: "zero";
  readonly data: null;
}

/**
 * One parameter variant of BreakdownParamsResult
 *
 * Represents a scenario where one parameter is provided.
 * Uses 'one' as the discriminator tag for type narrowing.
 */
export interface BreakdownParamsResultOne {
  readonly type: "one";
  readonly data: {
    readonly parameter: string;
  };
}

/**
 * Two parameters variant of BreakdownParamsResult
 *
 * Represents a scenario where two parameters are provided.
 * Uses 'two' as the discriminator tag for type narrowing.
 */
export interface BreakdownParamsResultTwo {
  readonly type: "two";
  readonly data: TwoParams_Result;
}

/**
 * BreakdownParamsResult - Discriminated Union for parameter scenarios
 *
 * Ensures exhaustive handling of zero, one, and two parameter cases through
 * TypeScript's discriminated union feature. The 'type' field acts
 * as the discriminator for type narrowing.
 *
 * @example Basic usage
 * ```typescript
 * const result = parseBreakdownParams(args);
 * switch (result.type) {
 *   case "zero":
 *     console.log("No parameters provided");
 *     break;
 *   case "one":
 *     console.log(`One parameter: ${result.data.parameter}`);
 *     break;
 *   case "two":
 *     console.log(`Two parameters: ${result.data.DirectiveType}, ${result.data.LayerType}`);
 *     break;
 * }
 * ```
 */
export type BreakdownParamsResult =
  | BreakdownParamsResultZero
  | BreakdownParamsResultOne
  | BreakdownParamsResultTwo;

/**
 * Type guard for checking if result is zero parameters
 *
 * Narrows the type to BreakdownParamsResultZero when true.
 *
 * @param result The result to check
 * @returns true if result is zero variant
 */
export function isZero(
  result: BreakdownParamsResult,
): result is BreakdownParamsResultZero {
  return result.type === "zero";
}

/**
 * Type guard for checking if result is one parameter
 *
 * Narrows the type to BreakdownParamsResultOne when true.
 *
 * @param result The result to check
 * @returns true if result is one variant
 */
export function isOne(
  result: BreakdownParamsResult,
): result is BreakdownParamsResultOne {
  return result.type === "one";
}

/**
 * Type guard for checking if result is two parameters
 *
 * Narrows the type to BreakdownParamsResultTwo when true.
 *
 * @param result The result to check
 * @returns true if result is two variant
 */
export function isTwo(
  result: BreakdownParamsResult,
): result is BreakdownParamsResultTwo {
  return result.type === "two";
}

/**
 * Creates a zero parameters result
 *
 * Factory function following the Smart Constructor pattern.
 *
 * @returns Zero variant of BreakdownParamsResult
 */
export function zero(): BreakdownParamsResultZero {
  return {
    type: "zero",
    data: null,
  };
}

/**
 * Creates a one parameter result
 *
 * Factory function following the Smart Constructor pattern.
 *
 * @param parameter The single parameter provided
 * @returns One variant of BreakdownParamsResult
 */
export function one(parameter: string): BreakdownParamsResultOne {
  return {
    type: "one",
    data: { parameter },
  };
}

/**
 * Creates a two parameters result
 *
 * Factory function following the Smart Constructor pattern.
 *
 * @param data The two parameters data
 * @returns Two variant of BreakdownParamsResult
 */
export function two(data: TwoParams_Result): BreakdownParamsResultTwo {
  return {
    type: "two",
    data,
  };
}

/**
 * Pattern matching for BreakdownParamsResult
 *
 * Ensures exhaustive handling of all variants through TypeScript's
 * exhaustiveness checking. Provides a functional approach to
 * handling different parameter scenarios.
 *
 * @param result The result to match
 * @param handlers Object with handlers for each variant
 * @returns The value returned by the matching handler
 *
 * @example
 * ```typescript
 * const message = match(result, {
 *   zero: () => "No parameters provided",
 *   one: (data) => `One parameter: ${data.parameter}`,
 *   two: (data) => `Two parameters: ${data.DirectiveType}, ${data.LayerType}`
 * });
 * ```
 */
export function match<T>(
  result: BreakdownParamsResult,
  handlers: {
    zero: () => T;
    one: (data: { readonly parameter: string }) => T;
    two: (data: TwoParams_Result) => T;
  },
): T {
  switch (result.type) {
    case "zero":
      return handlers.zero();
    case "one":
      return handlers.one(result.data);
    case "two":
      return handlers.two(result.data);
    default: {
      // Exhaustiveness check - ensures all cases are handled
      const _exhaustive: never = result;
      throw new Error(`Unhandled case: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

// Legacy compatibility functions for backward compatibility
/**
 * @deprecated Use isTwo() instead
 */
export function isSuccess(
  result: BreakdownParamsResult,
): result is BreakdownParamsResultTwo {
  return result.type === "two";
}

/**
 * @deprecated Use isZero() or isOne() instead
 */
export function isFailure(
  result: BreakdownParamsResult,
): result is BreakdownParamsResultZero | BreakdownParamsResultOne {
  return result.type === "zero" || result.type === "one";
}

/**
 * @deprecated Use two() instead
 */
export function success(
  data: TwoParams_Result,
): BreakdownParamsResultTwo {
  return two(data);
}

/**
 * @deprecated Use zero() instead
 */
export function failure(
  _error: Error,
): BreakdownParamsResultZero {
  return zero();
}
