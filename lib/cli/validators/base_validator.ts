import type { DoubleParamValidationResult } from "./double_command_validator.ts";

/**
 * Strategy interface for validating CLI command parameters.
 * Implemented by all command validator classes to provide a common validation contract.
 */
export interface CommandValidatorStrategy {
  /**
   * Validate CLI parameters for a specific command type.
   * @param params Parsed params (BreakdownParams result or raw args)
   * @returns DoubleParamValidationResult (step, error, values)
   */
  validate(params: unknown): DoubleParamValidationResult;
}
