/**
 * @fileoverview Two Params Output Processor
 *
 * Handles output processing for two params handler following clean architecture.
 * This processor is a pure function layer - it transforms data without side effects.
 *
 * ## Design Principle: I/O Boundary Separation
 *
 * This processor does NOT write to stdout. It only processes and returns strings.
 * The actual output (stdout or return value) is handled by the I/O boundary layer (runBreakdown).
 *
 * @module lib/cli/processors/two_params_output_processor
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import { removeYamlFrontmatter } from "$lib/utils/markdown_utils.ts";

/**
 * Output error types for Two Params Output Processor
 * Following Worker7's Discriminated Union pattern
 */
export type TwoParamsOutputError =
  | {
    kind: "OutputWriteError";
    message: string;
    cause?: unknown;
    context?: Record<string, unknown>;
  }
  | {
    kind: "StringificationError";
    message: string;
    originalData: unknown;
    cause?: unknown;
    context?: Record<string, unknown>;
  }
  | {
    kind: "EncodingError";
    message: string;
    text: string;
    cause?: unknown;
    context?: Record<string, unknown>;
  };

/**
 * Factory for creating TwoParamsOutputError instances with proper type safety
 */
export const TwoParamsOutputErrorFactory = {
  /**
   * Creates an OutputWriteError
   */
  outputWriteError(
    message: string,
    cause?: unknown,
    context?: Record<string, unknown>,
  ): Extract<TwoParamsOutputError, { kind: "OutputWriteError" }> {
    return {
      kind: "OutputWriteError",
      message,
      cause,
      context,
    };
  },

  /**
   * Creates a StringificationError
   */
  stringificationError(
    message: string,
    originalData: unknown,
    cause?: unknown,
    context?: Record<string, unknown>,
  ): Extract<TwoParamsOutputError, { kind: "StringificationError" }> {
    return {
      kind: "StringificationError",
      message,
      originalData,
      cause,
      context,
    };
  },

  /**
   * Creates an EncodingError
   */
  encodingError(
    message: string,
    text: string,
    cause?: unknown,
    context?: Record<string, unknown>,
  ): Extract<TwoParamsOutputError, { kind: "EncodingError" }> {
    return {
      kind: "EncodingError",
      message,
      text,
      cause,
      context,
    };
  },
};

/**
 * Two Params Output Processor
 *
 * Responsible for processing output data (stringification, cleanup).
 * This is a pure function layer - no side effects (no stdout writing).
 *
 * The actual I/O (stdout writing) is handled by runBreakdown (I/O boundary layer).
 */
export class TwoParamsOutputProcessor {
  /**
   * Process output data and return as string
   * Following Worker7's Result<T,E> pattern with try-catch elimination
   *
   * This method is a pure function - it only transforms data, no I/O side effects.
   *
   * @param data - The data to process (string or object)
   * @returns Result with processed string on success or TwoParamsOutputError on failure
   */
  processOutput(data: unknown): Result<string, TwoParamsOutputError> {
    // Step 1: Safe stringification
    const stringificationResult = this.safeStringify(data);
    if (!stringificationResult.ok) {
      return error(stringificationResult.error);
    }

    // Step 2: Remove YAML frontmatter from the output
    const cleanedOutput = removeYamlFrontmatter(stringificationResult.data);

    // Step 3: Add newline if not present
    const finalOutput = cleanedOutput.endsWith("\n") ? cleanedOutput : cleanedOutput + "\n";

    return ok(finalOutput);
  }

  /**
   * Safely stringify data without throwing exceptions
   */
  private safeStringify(data: unknown): Result<string, TwoParamsOutputError> {
    if (typeof data === "string") {
      return ok(data);
    }

    if (data === undefined) {
      return ok("undefined");
    }

    // Safe JSON.stringify with error handling
    try {
      const result = JSON.stringify(data);
      return ok(result);
    } catch (stringifyError) {
      return error(TwoParamsOutputErrorFactory.stringificationError(
        `Failed to stringify data: ${String(stringifyError)}`,
        data,
        stringifyError,
        {
          dataType: typeof data,
          errorType: stringifyError instanceof Error ? stringifyError.constructor.name : "unknown",
        },
      ));
    }
  }

}
