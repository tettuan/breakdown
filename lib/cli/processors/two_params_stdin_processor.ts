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
  type TimeoutManager,
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
   * 🎖️ DEPLOYED: shouldReadStdin() pattern for consistency across processors
   */
  private shouldReadStdin(options: Record<string, unknown>): boolean {
    // Skip in test environments to prevent resource leaks
    if (options.skipStdin === true) {
      return false;
    }
    
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
    let timeoutManager: TimeoutManager | null = null;
    let abortController: AbortController | null = null;
    let timeoutId: number | null = null;
    let stdinPromise: Promise<string> | null = null;
    
    try {
      // Check if we should read stdin
      if (!this.shouldReadStdin(options)) {
        return ok(""); // No stdin to read
      }

      // Skip stdin reading in test environments to prevent resource leaks
      if (options.skipStdin === true) {
        return ok(""); // Test mode - skip stdin
      }

      // Create AbortController for comprehensive resource management
      abortController = new AbortController();
      timeoutManager = createTimeoutManagerFromConfig(config);
      
      // Create timeout promise with proper cleanup
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          if (abortController && !abortController.signal.aborted) {
            abortController.abort();
          }
          reject(new Error("Stdin read timeout"));
        }, 5000); // 5 second timeout
        
        // Handle abort signal
        abortController?.signal.addEventListener('abort', () => {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          reject(new Error("Stdin read aborted"));
        });
      });

      // Create stdin read promise with abort handling
      stdinPromise = readStdin({ 
        timeoutManager,
        forceRead: false,
        allowEmpty: true
      });
      
      // Race between stdin reading and timeout with proper abort handling
      const inputText = await Promise.race([
        stdinPromise,
        timeoutPromise
      ]);
      
      return ok(inputText);
      
    } catch (err) {
      return error({
        kind: "StdinReadError",
        message: err instanceof Error ? err.message : String(err),
        cause: err
      });
    } finally {
      // 🎖️ COMPREHENSIVE CLEANUP: AbortController + finally + null GC
      // Clear timeout first
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // Abort controller if not already aborted
      if (abortController && !abortController.signal.aborted) {
        abortController.abort();
      }
      
      // Null out all references for GC
      timeoutManager = null;
      abortController = null;
      stdinPromise = null;
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
    
    return await this.process(defaultConfig, options);
  }
}