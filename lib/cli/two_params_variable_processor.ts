/**
 * @fileoverview Two params variable processor for CLI
 *
 * This module provides variable processing for two-parameter CLI operations
 *
 * @module cli/two_params_variable_processor
 */

import type { TwoParams_Result } from "../deps.ts";

/**
 * Processes variables for two parameters in CLI
 */
export class TwoParamsVariableProcessor {
  /**
   * Process variables from two params result for CLI operations
   */
  static process(result: TwoParams_Result): Record<string, string> {
    return {
      directive: result.demonstrativeType,
      layer: result.layerType,
      param1: result.params[0],
      param2: result.params[1],
      type: result.type,
    };
  }

  /**
   * Extract options from result
   */
  static extractOptions(result: TwoParams_Result): Record<string, unknown> {
    return result.options || {};
  }

  /**
   * Validate result for variable processing
   */
  static isValid(result: TwoParams_Result): boolean {
    return result.type === "two" &&
      result.params.length === 2 &&
      result.demonstrativeType.length > 0 &&
      result.layerType.length > 0;
  }
}
