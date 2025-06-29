/**
 * @fileoverview TwoParamsStdinProcessor - STDIN processing with Totality principle
 * 
 * This module handles STDIN reading and processing,
 * extracting the logic from the original handler.
 * 
 * @module cli/processors/two_params_stdin_processor
 */

import type { Result } from "../../types/result.ts";
import { ok, error } from "../../types/result.ts";
import { isStdinAvailable, readStdin } from "../../io/stdin.ts";
import {
  type BreakdownConfigCompatible,
  createTimeoutManagerFromConfig,
} from "../../config/timeout_manager.ts";

/**
 * STDIN processing error types
 */
export type StdinProcessorError = {
  kind: "StdinReadError";
  message: string;
  cause?: unknown;
};

/**
 * TwoParamsStdinProcessor - Processes STDIN input
 * 
 * Responsibilities:
 * - Check STDIN availability
 * - Read STDIN content with timeout
 * - Handle stdin option flags (-f -, --from -)
 * - Return content or empty string
 */
export class TwoParamsStdinProcessor {
  /**
   * Check if stdin should be read based on options
   */
  private shouldReadStdin(options: Record<string, unknown>): boolean {
    // Check explicit stdin flags
    if (options.from === "-" || options.fromFile === "-") {
      return true;
    }
    
    // Check if stdin is available
    return isStdinAvailable();
  }

  /**
   * Process STDIN input
   * 
   * @param config - Configuration for timeout management
   * @param options - Command line options
   * @returns Result with STDIN content or error
   */
  async process(
    config: BreakdownConfigCompatible,
    options: Record<string, unknown>
  ): Promise<Result<string, StdinProcessorError>> {
    try {
      // Check if we should read stdin
      if (!this.shouldReadStdin(options)) {
        return ok(""); // No stdin to read
      }

      // Create timeout manager
      const timeoutManager = createTimeoutManagerFromConfig(config);
      
      // Read stdin
      const inputText = await readStdin({ timeoutManager });
      return ok(inputText);
      
    } catch (err) {
      return error({
        kind: "StdinReadError",
        message: err instanceof Error ? err.message : String(err),
        cause: err
      });
    }
  }

  /**
   * Process STDIN with default timeout
   * Convenience method for simple cases
   */
  async processWithDefaultTimeout(
    options: Record<string, unknown>
  ): Promise<Result<string, StdinProcessorError>> {
    const defaultConfig: BreakdownConfigCompatible = {
      stdin: {
        timeout_ms: 5000 // 5 seconds default
      }
    };
    
    return this.process(defaultConfig, options);
  }
}