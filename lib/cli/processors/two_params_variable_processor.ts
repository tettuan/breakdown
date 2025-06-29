/**
 * @fileoverview TwoParamsVariableProcessor - Custom variable processing with Totality principle
 * 
 * This module handles the extraction of custom variables and addition of standard variables
 * following the single responsibility principle. It processes both user-defined variables
 * (with uv- prefix) and standard variables (input_text, input_text_file, destination_path).
 * 
 * @module cli/processors/two_params_variable_processor
 */

import type { Result } from "../../types/result.ts";
import { ok, error } from "../../types/result.ts";

/**
 * Processed variables structure
 */
export interface ProcessedVariables {
  /** Custom variables with uv- prefix */
  customVariables: Record<string, string>;
  /** Standard variables for prompt processing */
  standardVariables: Record<string, string>;
  /** All variables combined */
  allVariables: Record<string, string>;
}

/**
 * Variable processing error types
 */
export type VariableProcessorError =
  | { kind: "InvalidVariablePrefix"; key: string; expectedPrefix: string }
  | { kind: "ReservedVariableName"; key: string }
  | { kind: "EmptyVariableValue"; key: string }
  | { kind: "InvalidOptions"; message: string };

/**
 * Reserved variable names that cannot be used as custom variables
 */
const RESERVED_VARIABLE_NAMES = new Set([
  "input_text",
  "input_text_file",
  "destination_path",
  "schema_file",
]);

/**
 * TwoParamsVariableProcessor - Processes variables with single responsibility
 * 
 * Responsibilities:
 * - Extract custom variables from options (uv- prefix)
 * - Add standard variables (input_text, input_text_file, destination_path)
 * - Validate variable names and values
 * - Combine all variables for downstream processing
 */
export class TwoParamsVariableProcessor {
  /**
   * Extract custom variables from options
   * Only processes keys with "uv-" prefix
   */
  private extractCustomVariables(
    options: Record<string, unknown>
  ): Result<Record<string, string>, VariableProcessorError[]> {
    const customVariables: Record<string, string> = {};
    const errors: VariableProcessorError[] = [];

    for (const [key, value] of Object.entries(options)) {
      if (key.startsWith("uv-")) {
        // Validate against reserved names
        const varName = key.substring(3); // Remove "uv-" prefix
        if (RESERVED_VARIABLE_NAMES.has(varName)) {
          errors.push({
            kind: "ReservedVariableName",
            key,
          });
          continue;
        }

        // Ensure value is not empty
        const stringValue = String(value);
        if (!stringValue || stringValue.trim() === "") {
          errors.push({
            kind: "EmptyVariableValue",
            key,
          });
          continue;
        }

        customVariables[key] = stringValue;
      }
    }

    if (errors.length > 0) {
      return error(errors);
    }

    return ok(customVariables);
  }

  /**
   * Build standard variables from options and stdin content
   */
  private buildStandardVariables(
    options: Record<string, unknown>,
    stdinContent: string
  ): Record<string, string> {
    const standardVariables: Record<string, string> = {};

    // Add stdin content if available
    if (stdinContent) {
      standardVariables.input_text = stdinContent;
    }

    // Add input file name (from -f/--from option)
    const inputFile = (options.from as string) || (options.fromFile as string);
    standardVariables.input_text_file = inputFile || "stdin";

    // Add destination path (from -o/--destination option)
    const destinationPath = 
      (options.destination as string) || 
      (options.destinationFile as string) || 
      (options.output as string);
    standardVariables.destination_path = destinationPath || "stdout";

    return standardVariables;
  }

  /**
   * Process all variables (custom + standard)
   * 
   * @param options - Command line options
   * @param stdinContent - Content from stdin (if available)
   * @returns Result with processed variables or errors
   */
  processVariables(
    options: Record<string, unknown>,
    stdinContent: string
  ): Result<ProcessedVariables, VariableProcessorError[]> {
    if (!options || typeof options !== "object") {
      return error([{
        kind: "InvalidOptions",
        message: "Options must be a valid object",
      }]);
    }

    // Extract custom variables
    const customResult = this.extractCustomVariables(options);
    if (!customResult.ok) {
      return error(customResult.error);
    }

    // Build standard variables
    const standardVariables = this.buildStandardVariables(options, stdinContent);

    // Combine all variables
    const allVariables = {
      ...customResult.data,
      ...standardVariables,
    };

    return ok({
      customVariables: customResult.data,
      standardVariables,
      allVariables,
    });
  }

  /**
   * Process variables with options only (no stdin)
   * Convenience method for cases where stdin is not yet available
   */
  processVariablesWithoutStdin(
    options: Record<string, unknown>
  ): Result<ProcessedVariables, VariableProcessorError[]> {
    return this.processVariables(options, "");
  }
}