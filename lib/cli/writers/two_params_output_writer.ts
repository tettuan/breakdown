/**
 * @fileoverview TwoParamsOutputWriter - Output writing with Totality principle
 * 
 * This module handles output writing for two-parameter commands,
 * providing consistent output handling.
 * 
 * @module cli/writers/two_params_output_writer
 */

import type { Result } from "../../types/result.ts";
import { ok, error } from "../../types/result.ts";

/**
 * Output writing error types
 */
export type OutputWriterError = {
  kind: "OutputWriteError";
  error: string;
  cause?: unknown;
};

/**
 * TwoParamsOutputWriter - Writes output with single responsibility
 * 
 * Responsibilities:
 * - Write content to stdout
 * - Handle encoding
 * - Provide error handling
 */
export class TwoParamsOutputWriter {
  /**
   * Write content to stdout
   * 
   * @param content - Content to write
   * @returns Result indicating success or failure
   */
  async write(content: string): Promise<Result<void, OutputWriterError>> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      await Deno.stdout.write(data);
      return ok(undefined);
    } catch (err) {
      return error({
        kind: "OutputWriteError",
        error: err instanceof Error ? err.message : String(err),
        cause: err
      });
    }
  }

  /**
   * Write content with newline
   * 
   * @param content - Content to write
   * @returns Result indicating success or failure
   */
  async writeLine(content: string): Promise<Result<void, OutputWriterError>> {
    return this.write(content + "\n");
  }

  /**
   * Write multiple lines
   * 
   * @param lines - Array of lines to write
   * @returns Result indicating success or failure
   */
  async writeLines(lines: string[]): Promise<Result<void, OutputWriterError>> {
    return this.write(lines.join("\n") + "\n");
  }
}