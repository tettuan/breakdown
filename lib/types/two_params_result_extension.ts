/**
 * @fileoverview Type extension for TwoParams_Result to add missing params property
 * 
 * This module extends the TwoParams_Result type from @tettuan/breakdownparams
 * to include the missing params property that is used throughout the codebase.
 * 
 * @module types/two_params_result_extension
 */

import type { TwoParamsResult as BaseTwoParamsResult } from "jsr:@tettuan/breakdownparams@^1.0.7";

/**
 * Extended TwoParams_Result interface with params property
 * 
 * This interface extends the base TwoParamsResult from BreakdownParams
 * to include the params array property that is expected by the codebase.
 */
export interface TwoParams_Result extends BaseTwoParamsResult {
  /** Array of parameter strings */
  params: string[];
}

/**
 * Type guard to check if an object is a TwoParams_Result
 */
export function isTwoParamsResult(obj: unknown): obj is TwoParams_Result {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    'params' in obj &&
    'demonstrativeType' in obj &&
    'layerType' in obj &&
    Array.isArray((obj as any).params)
  );
}

/**
 * Creates a TwoParams_Result from base TwoParamsResult
 * 
 * Ensures the params array is populated from demonstrativeType and layerType
 */
export function createTwoParamsResult(
  demonstrativeType: string,
  layerType: string,
  options?: Record<string, unknown>
): TwoParams_Result {
  return {
    type: "two",
    params: [demonstrativeType, layerType],
    demonstrativeType,
    layerType,
    options: options || {},
  };
}