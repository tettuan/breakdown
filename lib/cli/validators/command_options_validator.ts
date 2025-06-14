import { CommandValidatorStrategy } from "./base_validator.ts";
import { NoParamsCommandValidator } from "./no_params_command_validator.ts";
import { SingleCommandValidator } from "./single_command_validator.ts";
import { DoubleCommandValidator } from "./double_command_validator.ts";
import { ThreeCommandValidator } from "./three_command_validator.ts";
import type { DoubleParamValidationResult } from "./double_command_validator.ts";
import {
  DoubleParamValidationErrorCode,
  DoubleParamValidationStep,
} from "./double_command_validator.ts";

/**
 * Provides validation for CLI command options using different strategies.
 * Selects and executes the appropriate validator for no-params, single, double, or three-word command types.
 */
export class CommandOptionsValidator {
  private readonly strategies: Record<string, CommandValidatorStrategy>;

  /**
   * Creates a new CommandOptionsValidator instance.
   */
  constructor() {
    this.strategies = {
      "no-params": new NoParamsCommandValidator(),
      "single": new SingleCommandValidator(),
      "double": new DoubleCommandValidator(),
      "three": new ThreeCommandValidator(),
      "zero": new NoParamsCommandValidator(),
      "one": new SingleCommandValidator(),
      "two": new DoubleCommandValidator(),
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
