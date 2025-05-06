/**
 * SingleCommandValidator
 *
 * Strategy for validating CLI parameters for single commands (e.g. init).
 * Throws error for any other usage.
 *
 * See docs/breakdown/options.ja.md for details.
 */

import type { CommandValidatorStrategy } from "./base_validator.ts";
import {
  DoubleParamValidationErrorCode,
  DoubleParamValidationResult,
  DoubleParamValidationStep,
} from "./double_command_validator.ts";

export class SingleCommandValidator implements CommandValidatorStrategy {
  validate(params: unknown): DoubleParamValidationResult {
    const step = DoubleParamValidationStep.START;
    const values: DoubleParamValidationResult["values"] = {};
    if (
      params &&
      typeof params === "object" &&
      "command" in params &&
      (params as { command?: string }).command === "init"
    ) {
      values.command = "init";
      return {
        success: true,
        step: DoubleParamValidationStep.COMPLETE,
        values,
      };
    }
    return {
      success: false,
      step,
      errorCode: DoubleParamValidationErrorCode.INVALID_INPUT_TYPE,
      errorMessage: "Invalid single command. Only 'init' is supported.",
      values,
    };
  }
}
