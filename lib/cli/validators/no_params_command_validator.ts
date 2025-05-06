/**
 * NoParamsCommandValidator
 *
 * Strategy for validating CLI parameters when no command params are given (help/version).
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

export class NoParamsCommandValidator implements CommandValidatorStrategy {
  validate(params: unknown): DoubleParamValidationResult {
    const step = DoubleParamValidationStep.START;
    const values: DoubleParamValidationResult["values"] = {};
    if (
      params &&
      typeof params === "object" &&
      ("help" in params || "version" in params)
    ) {
      return {
        success: true,
        step: DoubleParamValidationStep.COMPLETE,
        values,
      };
    }
    return {
      success: false,
      step,
      errorCode: DoubleParamValidationErrorCode.UNKNOWN,
      errorMessage: "No command or invalid parameters provided. Use --help for usage.",
      values,
    };
  }
}
