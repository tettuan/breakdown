/**
 * @fileoverview Standard Variable Resolver
 *
 * This module is responsible for resolving standard variables
 * (input_text_file, destination_path) from various option formats,
 * following the Single Responsibility Principle.
 *
 * @module lib/processor/standard_variable_resolver
 */

import type { Result } from "../types/result.ts";
import { ok } from "../types/result.ts";

/**
 * Standard variables structure
 */
export interface StandardVariables {
  input_text?: string;
  input_text_file: string;
  destination_path: string;
}

/**
 * Options for resolving standard variables
 */
export interface ResolverOptions {
  /** Raw CLI options */
  options: Record<string, unknown>;
  /** STDIN content if available */
  stdinContent?: string;
  /** Fallback input file path */
  inputFile?: string;
  /** Fallback output file path */
  outputFile?: string;
}

/**
 * Standard Variable Resolver class
 *
 * Responsible for resolving standard variables from various option formats
 * and providing consistent values for the system.
 */
export class StandardVariableResolver {
  private static readonly INPUT_OPTION_KEYS = ["fromFile", "from", "input", "i", "f"];
  private static readonly OUTPUT_OPTION_KEYS = [
    "destinationFile",
    "destination",
    "output",
    "o",
    "d",
  ];
  private static readonly STDIN_INDICATOR = "-";
  private static readonly DEFAULT_INPUT = "stdin";
  private static readonly DEFAULT_OUTPUT = "stdout";

  /**
   * Resolve all standard variables
   */
  resolve(params: ResolverOptions): Result<StandardVariables, never> {
    const standardVariables: StandardVariables = {
      input_text: params.stdinContent,
      input_text_file: this.resolveInputTextFile(params),
      destination_path: this.resolveDestinationPath(params),
    };

    return ok(standardVariables);
  }

  /**
   * Resolve input_text_file value from options
   * Checks multiple option keys in priority order
   */
  resolveInputTextFile(params: ResolverOptions): string {
    const { options } = params;

    // Check each possible input option key
    for (const key of StandardVariableResolver.INPUT_OPTION_KEYS) {
      if (key in options && options[key] !== StandardVariableResolver.STDIN_INDICATOR) {
        const value = options[key];
        if (value && typeof value === "string") {
          return value;
        }
      }
    }

    // Use fallback if provided
    if (params.inputFile) {
      return params.inputFile;
    }

    return StandardVariableResolver.DEFAULT_INPUT;
  }

  /**
   * Resolve destination_path value from options
   * Checks multiple option keys in priority order
   */
  resolveDestinationPath(params: ResolverOptions): string {
    const { options } = params;

    // Check each possible output option key
    for (const key of StandardVariableResolver.OUTPUT_OPTION_KEYS) {
      if (key in options) {
        const value = options[key];
        if (value && typeof value === "string") {
          return value;
        }
      }
    }

    // Use fallback if provided
    if (params.outputFile) {
      return params.outputFile;
    }

    return StandardVariableResolver.DEFAULT_OUTPUT;
  }

  /**
   * Check if input is from STDIN
   */
  isStdinInput(params: ResolverOptions): boolean {
    const inputFile = this.resolveInputTextFile(params);
    return inputFile === StandardVariableResolver.DEFAULT_INPUT ||
      inputFile === StandardVariableResolver.STDIN_INDICATOR;
  }

  /**
   * Check if output is to STDOUT
   */
  isStdoutOutput(params: ResolverOptions): boolean {
    const outputFile = this.resolveDestinationPath(params);
    return outputFile === StandardVariableResolver.DEFAULT_OUTPUT ||
      outputFile === StandardVariableResolver.STDIN_INDICATOR;
  }
}
