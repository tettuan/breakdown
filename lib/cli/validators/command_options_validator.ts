/**
 * CommandOptionsValidator (Facade)
 *
 * Selects and executes the appropriate parameter validation strategy
 * based on BreakdownParams result type (no-params, single, double).
 *
 * See docs/breakdown/options.ja.md for details.
 */

import type { CommandOptions } from "../args.ts";
import { CommandValidatorStrategy } from "./base_validator.ts";
import { NoParamsCommandValidator } from "./no_params_command_validator.ts";
import { SingleCommandValidator } from "./single_command_validator.ts";
import { DoubleCommandValidator } from "./double_command_validator.ts";

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
   * @returns Validated CommandOptions
   */
  validate(result: { type: string; [key: string]: unknown }): CommandOptions {
    const strategy = this.strategies[result.type];
    if (!strategy) {
      throw new Error(`Unknown command type: ${result.type}`);
    }
    return strategy.validate(result);
  }
}
