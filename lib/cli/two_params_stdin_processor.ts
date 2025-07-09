/**
 * @fileoverview Two params stdin processor for CLI
 *
 * This module provides stdin processing for two-parameter CLI operations
 *
 * @module cli/two_params_stdin_processor
 */

/**
 * Processes stdin for two parameters in CLI
 */
export class TwoParamsStdinProcessor {
  /**
   * Process stdin input for CLI
   */
  static process(input: string): string {
    return input.trim().replace(/\n/g, " ");
  }

  /**
   * Check if stdin input is valid
   */
  static isValid(input: string): boolean {
    return input.trim().length > 0;
  }
}
