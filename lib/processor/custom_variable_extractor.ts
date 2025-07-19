/**
 * @fileoverview Custom Variable Extractor
 *
 * This module is responsible for extracting custom variables (uv- prefixed)
 * from CLI options, following the Single Responsibility Principle.
 *
 * @module lib/processor/custom_variable_extractor
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";

/**
 * Error types for custom variable extraction
 */
export type CustomVariableError =
  | { kind: "InvalidVariablePrefix"; key: string; message: string }
  | { kind: "InvalidVariableValue"; key: string; value: unknown; reason: string; message: string }
  | { kind: "ReservedVariableName"; key: string; message: string };

/**
 * Custom Variable Extractor class
 *
 * Responsible for extracting and validating custom variables from CLI options.
 * Custom variables are identified by the "uv-" prefix.
 */
export class CustomVariableExtractor {
  private static readonly CUSTOM_VARIABLE_PREFIX = "uv-";
  private static readonly RESERVED_NAMES = new Set([
    "uv-help",
    "uv-version",
    "uv-config",
  ]);

  /**
   * Extract custom variables from options
   *
   * @param options - CLI options object
   * @returns Result containing extracted custom variables or error
   */
  extract(options: Record<string, unknown>): Result<Record<string, string>, CustomVariableError> {
    const customVariables: Record<string, string> = {};

    for (const [key, value] of Object.entries(options)) {
      if (!this.isCustomVariable(key)) {
        continue;
      }

      // Validate the custom variable
      const validationResult = this.validateCustomVariable(key, value);
      if (!validationResult.ok) {
        return error(validationResult.error);
      }

      customVariables[key] = String(value);
    }

    return ok(customVariables);
  }

  /**
   * Check if a key represents a custom variable
   */
  private isCustomVariable(key: string): boolean {
    return key.startsWith(CustomVariableExtractor.CUSTOM_VARIABLE_PREFIX);
  }

  /**
   * Validate a custom variable
   */
  private validateCustomVariable(
    key: string,
    value: unknown,
  ): Result<void, CustomVariableError> {
    // Check for reserved names
    if (CustomVariableExtractor.RESERVED_NAMES.has(key)) {
      return error({
        kind: "ReservedVariableName",
        key,
        message: `Custom variable name '${key}' is reserved and cannot be used`,
      });
    }

    // Validate value
    if (value === null || value === undefined) {
      return error({
        kind: "InvalidVariableValue",
        key,
        value,
        reason: "Custom variable value cannot be null or undefined",
        message: `Custom variable '${key}' has invalid value: cannot be null or undefined`,
      });
    }

    if (typeof value === "object") {
      return error({
        kind: "InvalidVariableValue",
        key,
        value,
        reason: "Custom variable value cannot be an object",
        message: `Custom variable '${key}' has invalid value: cannot be an object`,
      });
    }

    return ok(undefined);
  }

  /**
   * Get all custom variable keys from options
   */
  getCustomVariableKeys(options: Record<string, unknown>): string[] {
    return Object.keys(options).filter((key) => this.isCustomVariable(key));
  }
}
