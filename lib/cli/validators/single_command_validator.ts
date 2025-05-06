/**
 * SingleCommandValidator
 *
 * Strategy for validating CLI parameters for single commands (e.g. init).
 * Throws error for any other usage.
 *
 * See docs/breakdown/options.ja.md for details.
 */

import type { CommandOptions } from "../args.ts";
import type { CommandValidatorStrategy } from "./base_validator.ts";
import { CliError, CliErrorCode } from "../errors.ts";

export class SingleCommandValidator implements CommandValidatorStrategy {
  validate(params: unknown): CommandOptions {
    // params: { command: string }
    if (
      params &&
      typeof params === "object" &&
      "command" in params &&
      (params as { command?: string }).command === "init"
    ) {
      return { demonstrative: "init" };
    }
    throw new CliError(
      CliErrorCode.INVALID_OPTION,
      "Invalid single command. Only 'init' is supported.",
    );
  }
}
