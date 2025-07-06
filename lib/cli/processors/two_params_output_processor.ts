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
 * Output error type for Two Params Output Processor
 */
export type TwoParamsOutputError = {
  kind: "OutputWriteError";
  error: string;
  cause?: unknown;
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
   *
   * @param data - The data to write (string or object)
   * @returns Result with void on success or TwoParamsOutputError on failure
   */
  async writeOutput(data: unknown): Promise<Result<void, TwoParamsOutputError>> {
    try {
      // Ensure the data is properly stringified
      const outputText = typeof data === "string"
        ? data
        : JSON.stringify(data);

      // Add newline if not present
      const finalOutput = outputText.endsWith("\n") ? outputText : outputText + "\n";

      // Encode and write to stdout (infrastructure access contained within processor)
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(finalOutput);
      await Deno.stdout.write(encodedData);

      return ok(undefined);
    } catch (err) {
      return error({
        kind: "OutputWriteError",
        error: err instanceof Error ? err.message : String(err),
        cause: err,
      });
    }
  }
}