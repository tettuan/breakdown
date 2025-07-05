/**
 * @fileoverview Two params handler for tests
 *
 * This module provides handler for two-parameter operations in tests
 *
 * @module interface_layer/cli/validators/two_params_handler
 */

import type { TwoParams_Result } from "../../../../lib/deps.ts";

/**
 * Handles two parameters operations
 */
export class TwoParamsHandler {
  /**
   * Handle two params result
   */
  static handle(result: TwoParams_Result): string {
    return `Handled: ${result.demonstrativeType} ${result.layerType}`;
  }

  /**
   * Validate and handle
   */
  static validateAndHandle(result: TwoParams_Result): { valid: boolean; output: string } {
    const valid = result.type === "two" && result.params.length === 2;
    const output = valid ? this.handle(result) : "Invalid input";
    return { valid, output };
  }
}