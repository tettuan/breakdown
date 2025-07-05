/**
 * @fileoverview Two params variable processor
 *
 * This module provides variable processing for two-parameter operations
 *
 * @module interface_layer/cli/processors/two_params_variable_processor
 */

import type { TwoParams_Result } from "../../../../lib/deps.ts";

/**
 * Processes variables for two parameters
 */
export class TwoParamsVariableProcessor {
  /**
   * Process variables from two params result
   */
  static process(result: TwoParams_Result): Record<string, string> {
    return {
      directive: result.demonstrativeType,
      layer: result.layerType,
      param1: result.params[0],
      param2: result.params[1],
    };
  }
}