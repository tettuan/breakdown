/**
 * @fileoverview Two Params Output Processor
 *
 * Handles output writing for two params handler following clean architecture.
 * Encapsulates all infrastructure concerns related to output.
 *
 * @module lib/cli/processors/two_params_output_processor
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";

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
 * Responsible for writing processed output to standard output.
 * Encapsulates infrastructure access (Deno.stdout) within processor layer.
 */
export class TwoParamsOutputProcessor {
  /**
   * Write output data to standard output
   * Following Worker7's Result<T,E> pattern with try-catch elimination
   *
   * @param data - The data to write (string or object)
   * @returns Result with void on success or TwoParamsOutputError on failure
   */
  async writeOutput(data: unknown): Promise<Result<void, TwoParamsOutputError>> {
    // Step 1: Safe stringification
    const stringificationResult = this.safeStringify(data);
    if (!stringificationResult.ok) {
      return error(stringificationResult.error);
    }

    // Step 2: Add newline if not present
    const finalOutput = stringificationResult.data.endsWith("\n")
      ? stringificationResult.data
      : stringificationResult.data + "\n";

    // Step 3: Safe encoding
    const encodingResult = this.safeEncode(finalOutput);
    if (!encodingResult.ok) {
      return error(encodingResult.error);
    }

    // Step 4: Safe write to stdout
    const writeResult = await this.safeWrite(encodingResult.data);
    if (!writeResult.ok) {
      return error(writeResult.error);
    }

    return ok(undefined);
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

  /**
   * Safely encode string to Uint8Array
   */
  private safeEncode(text: string): Result<Uint8Array, TwoParamsOutputError> {
    try {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(text);
      return ok(encodedData);
    } catch (encodingError) {
      return error(TwoParamsOutputErrorFactory.encodingError(
        `Failed to encode text: ${String(encodingError)}`,
        text,
        encodingError,
        {
          textLength: text.length,
          errorType: encodingError instanceof Error ? encodingError.constructor.name : "unknown",
        },
      ));
    }
  }

  /**
   * Safely write to stdout
   */
  private async safeWrite(data: Uint8Array): Promise<Result<void, TwoParamsOutputError>> {
    try {
      await Deno.stdout.write(data);
      return ok(undefined);
    } catch (writeError) {
      return error(TwoParamsOutputErrorFactory.outputWriteError(
        `Failed to write to stdout: ${String(writeError)}`,
        writeError,
        {
          dataLength: data.length,
          errorType: writeError instanceof Error ? writeError.constructor.name : "unknown",
        },
      ));
    }
  }
}
