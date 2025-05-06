/**
 * CommandOptionsValidator (Facade)
 *
 * Selects and executes the appropriate parameter validation strategy
 * based on BreakdownParams result type (no-params, single, double).
 *
 * See docs/breakdown/options.ja.md for details.
 */

import { CommandValidatorStrategy } from "./base_validator.ts";
import { NoParamsCommandValidator } from "./no_params_command_validator.ts";
import { SingleCommandValidator } from "./single_command_validator.ts";
import { DoubleCommandValidator } from "./double_command_validator.ts";
import type { DoubleParamValidationResult } from "./double_command_validator.ts";
import {
  DoubleParamValidationErrorCode,
  DoubleParamValidationStep,
} from "./double_command_validator.ts";

export class CommandOptionsValidator {
  private readonly strategies: Record<string, CommandValidatorStrategy>;

  constructor() {
    this.strategies = {
      "no-params": new NoParamsCommandValidator(),
      "single": new SingleCommandValidator(),
      "double": new DoubleCommandValidator(),
    };
  }

  /**
   * Validate CLI parameters using the appropriate strategy.
   * @param result BreakdownParams parse result (must have .type)
   * @returns DoubleParamValidationResult (step, error, values)
   */
  validate(result: { type: string; [key: string]: unknown }): DoubleParamValidationResult {
    const strategy = this.strategies[result.type];
    if (!strategy) {
      return {
        success: false,
        step: DoubleParamValidationStep.START,
        errorCode: DoubleParamValidationErrorCode.UNKNOWN,
        errorMessage: `Unknown command type: ${result.type}`,
        values: {},
      };
    }
    return strategy.validate(result);
  }
}
