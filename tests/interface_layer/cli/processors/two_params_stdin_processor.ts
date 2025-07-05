/**
 * @fileoverview Two params stdin processor
 *
 * This module provides stdin processing for two-parameter operations
 *
 * @module interface_layer/cli/processors/two_params_stdin_processor
 */

/**
 * Processes stdin for two parameters
 */
export class TwoParamsStdinProcessor {
  /**
   * Process stdin input
   */
  static async process(input: string): Promise<string> {
    return input.trim();
  }
}