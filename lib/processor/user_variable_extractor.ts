/**
 * @fileoverview User Variable Extractor
 *
 * This module is responsible for extracting user variables (uv- prefixed)
 * from CLI options, following the Single Responsibility Principle.
 *
 * @module lib/processor/user_variable_extractor
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";

/**
 * Error types for user variable extraction
 */
export type UserVariableError =
  | { kind: "InvalidVariablePrefix"; key: string; message: string }
  | { kind: "InvalidVariableValue"; key: string; value: unknown; reason: string; message: string }
  | { kind: "ReservedVariableName"; key: string; message: string };

/**
 * User Variable Extractor class
 *
 * Responsible for extracting and validating user variables from CLI options.
 * User variables are identified by the "uv-" prefix.
 */
export class UserVariableExtractor {
  private static readonly USER_VARIABLE_PREFIX = "uv-";
  private static readonly RESERVED_NAMES = new Set([
    "uv-help",
    "uv-version",
    "uv-config",
  ]);

  /**
   * Extract user variables from options
   *
   * @param options - CLI options object
   * @returns Result containing extracted user variables or error
   */
  extract(options: Record<string, unknown>): Result<Record<string, string>, UserVariableError> {
    const userVariables: Record<string, string> = {};

    for (const [key, value] of Object.entries(options)) {
      if (!this.isUserVariable(key)) {
        continue;
      }

      // Validate the user variable
      const validationResult = this.validateUserVariable(key, value);
      if (!validationResult.ok) {
        return error(validationResult.error);
      }

      userVariables[key] = String(value);
    }

    return ok(userVariables);
  }

  /**
   * Check if a key represents a user variable
   */
  private isUserVariable(key: string): boolean {
    return key.startsWith(UserVariableExtractor.USER_VARIABLE_PREFIX);
  }

  /**
   * Validate a user variable
   */
  private validateUserVariable(
    key: string,
    value: unknown,
  ): Result<void, UserVariableError> {
    // Check for reserved names
    if (UserVariableExtractor.RESERVED_NAMES.has(key)) {
      return error({
        kind: "ReservedVariableName",
        key,
        message: `User variable name '${key}' is reserved and cannot be used`,
      });
    }

    // Validate value
    if (value === null || value === undefined) {
      return error({
        kind: "InvalidVariableValue",
        key,
        value,
        reason: "User variable value cannot be null or undefined",
        message: `User variable '${key}' has invalid value: cannot be null or undefined`,
      });
    }

    if (typeof value === "object") {
      return error({
        kind: "InvalidVariableValue",
        key,
        value,
        reason: "User variable value cannot be an object",
        message: `User variable '${key}' has invalid value: cannot be an object`,
      });
    }

    return ok(undefined);
  }

  /**
   * Get all user variable keys from options
   */
  getUserVariableKeys(options: Record<string, unknown>): string[] {
    return Object.keys(options).filter((key) => this.isUserVariable(key));
  }
}
