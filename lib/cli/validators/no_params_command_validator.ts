/**
 * NoParamsCommandValidator
 *
 * Strategy for validating CLI parameters when no command params are given (help/version).
 * Throws error for any other usage.
 *
 * See docs/breakdown/options.ja.md for details.
 */

import type { CommandOptions } from "../args.ts";
import type { CommandValidatorStrategy } from "./base_validator.ts";
import { CliError, CliErrorCode } from "../errors.ts";

export class NoParamsCommandValidator implements CommandValidatorStrategy {
  validate(params: unknown): CommandOptions {
    // params: { help?: boolean, version?: boolean }
    if (
      params &&
      typeof params === "object" &&
      ("help" in params || "version" in params)
    ) {
      // No validation needed for help/version
      return {};
    }
    throw new CliError(
      CliErrorCode.INVALID_OPTION,
      "No command or invalid parameters provided. Use --help for usage.",
    );
  }
}
