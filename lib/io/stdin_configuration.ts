/**
 * @fileoverview Stdin Configuration Types
 *
 * This module provides configuration types for stdin operations
 * with Result-based validation.
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import type { StdinErrorType } from "./stdin_error_types.ts";
import type { EnhancedStdinOptions } from "./enhanced_stdin.ts";

/**
 * Configuration for stdin reading operations
 */
export class StdinReadingConfiguration {
  private constructor(
    public readonly allowEmpty: boolean,
    public readonly timeout: number,
  ) {}

  /**
   * Create a new configuration with validation
   */
  static create(
    allowEmpty: boolean,
    timeout: number,
  ): Result<StdinReadingConfiguration, StdinErrorType> {
    // Validate timeout
    if (timeout <= 0) {
      return error({
        kind: "ValidationError",
        field: "timeout",
        message: "Timeout must be positive",
      });
    }

    if (timeout > 300000) { // 5 minutes max
      return error({
        kind: "ValidationError",
        field: "timeout",
        message: "Timeout too large",
      });
    }

    return ok(new StdinReadingConfiguration(allowEmpty, timeout));
  }

  /**
   * Standard configuration for most use cases
   */
  static standard(): Result<StdinReadingConfiguration, StdinErrorType> {
    return StdinReadingConfiguration.create(false, 30000);
  }

  /**
   * Permissive configuration that allows empty input
   */
  static permissive(timeout: number = 30000): Result<StdinReadingConfiguration, StdinErrorType> {
    return StdinReadingConfiguration.create(true, timeout);
  }

  /**
   * CI-safe configuration with short timeout
   */
  static ciSafe(): Result<StdinReadingConfiguration, StdinErrorType> {
    return StdinReadingConfiguration.create(true, 5000);
  }

  /**
   * Get enhanced options for this configuration
   */
  get enhancedOptions(): EnhancedStdinOptions {
    return {
      allowEmpty: this.allowEmpty,
      timeout: this.timeout,
      forceRead: false,
    };
  }
}

/**
 * Stdin availability detection
 */
export class StdinAvailability {
  private constructor(
    public readonly isTerminal: boolean,
    public readonly isCI: boolean,
    public readonly isTest: boolean,
  ) {}

  /**
   * Detect stdin availability
   */
  static detect(): Result<StdinAvailability, StdinErrorType> {
    try {
      const isTerminal = Deno.stdin.isTerminal();
      const isCI = !!Deno.env.get("CI");
      const isTest = !!Deno.env.get("DENO_TEST");

      return ok(new StdinAvailability(isTerminal, isCI, isTest));
    } catch (e) {
      return error({
        kind: "ReadError",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  /**
   * Check if stdin should be read
   */
  shouldAttemptRead(): boolean {
    // Don't read in terminal unless explicitly piped
    if (this.isTerminal) {
      return false;
    }

    // In test environments, stdin is usually not available
    if (this.isTest) {
      return false;
    }

    // In CI, only read if not a terminal
    if (this.isCI) {
      return !this.isTerminal;
    }

    return true;
  }
}

/**
 * Safe stdin reading function that returns Result
 */
export async function readStdinSafe(
  config: StdinReadingConfiguration,
): Promise<Result<string, StdinErrorType>> {
  const availability = StdinAvailability.detect();

  if (!availability.ok) {
    return error(availability.error);
  }

  if (!availability.data.shouldAttemptRead()) {
    return error({
      kind: "NotAvailableError",
      environment: availability.data.isCI ? "CI" : availability.data.isTest ? "test" : "terminal",
    });
  }

  try {
    const decoder = new TextDecoder();
    const chunks: Uint8Array[] = [];
    let timeoutId: number | undefined;

    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Timeout")), config.timeout);
    });

    // Read stdin
    const readPromise = (async () => {
      try {
        // Check if stdin is available first
        if (!Deno.stdin.readable) {
          throw new Error("Stdin not readable");
        }

        const reader = Deno.stdin.readable.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
          }
        } finally {
          reader.releaseLock();
        }
      } catch (err) {
        // If stdin is not available, return empty
        if (config.allowEmpty) {
          return;
        }
        throw err;
      }
    })();

    // Race between reading and timeout
    await Promise.race([readPromise, timeoutPromise]);

    // Clear timeout if read completed
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    const content = decoder.decode(concatenateUint8Arrays(chunks));

    if (!config.allowEmpty && !content.trim()) {
      return error({
        kind: "EmptyInputError",
        message: "No input provided",
      });
    }

    return ok(content);
  } catch (e) {
    if (e instanceof Error && e.message === "Timeout") {
      return error({
        kind: "TimeoutError",
        timeout: config.timeout,
      });
    }

    return error({
      kind: "ReadError",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * Helper to concatenate Uint8Arrays
 */
function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}
