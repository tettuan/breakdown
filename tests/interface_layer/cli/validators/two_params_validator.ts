/**
 * @fileoverview Two params validator
 *
 * This module provides validation for two-parameter input
 *
 * @module interface_layer/cli/validators/two_params_validator
 */

import type { TwoParams_Result } from "../../../../lib/deps.ts";

/**
 * Validates two parameters result
 */
export class TwoParamsValidator {
  /**
   * Validate two params result
   */
  static validate(result: TwoParams_Result): boolean {
    return result.type === "two" && 
           result.params.length === 2 &&
           result.demonstrativeType.length > 0 &&
           result.layerType.length > 0;
  }
}