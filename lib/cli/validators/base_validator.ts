/**
 * CommandValidatorStrategy
 *
 * Strategy interface for CLI parameter validation.
 * Each command type (NoParams, Single, Double) should implement this interface.
 *
 * The specification and validation rules are described in docs/breakdown/options.ja.md.
 */

import type { CommandOptions } from "../args.ts";

export interface CommandValidatorStrategy {
  /**
   * Validate CLI parameters for a specific command type.
   * @param params Parsed params (BreakdownParams result or raw args)
   * @returns Validated CommandOptions or throws error
   */
  validate(params: unknown): CommandOptions;
}
