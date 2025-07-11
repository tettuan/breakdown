/**
 * @fileoverview Type-safe stdout operations with Result-based error handling
 *
 * This module provides unified stdout writing functionality following
 * the Totality principle and Domain-Driven Design.
 *
 * @module io/stdout
 */

import { error, ok, Result } from "../types/result.ts";

/**
 * Error types for stdout operations
 * Using Discriminated Union for exhaustive error handling
 */
export type StdoutErrorType =
  | { kind: "WriteError"; message: string; originalError?: Error }
  | { kind: "EncodingError"; encoding: string; message: string }
  | { kind: "ConfigurationError"; setting: string; value?: unknown }
  | { kind: "FlushError"; message: string };

/**
 * Format StdoutErrorType to human-readable string
 */
export function formatStdoutError(err: StdoutErrorType): string {
  switch (err.kind) {
    case "WriteError":
      return `Write error: ${err.message}`;
    case "EncodingError":
      return `Encoding error (${err.encoding}): ${err.message}`;
    case "ConfigurationError":
      return `Configuration error for ${err.setting}: ${
        err.value !== undefined ? String(err.value) : "invalid value"
      }`;
    case "FlushError":
      return `Flush error: ${err.message}`;
  }
}

/**
 * Configuration for stdout writing operations
 * Immutable value object with Smart Constructor
 */
export class StdoutWriteConfiguration {
  private constructor(
    private readonly _flushImmediate: boolean,
    private readonly _appendNewline: boolean,
  ) {}

  /**
   * Creates standard configuration
   * - No automatic newline
   * - No immediate flush
   */
  static standard(): Result<StdoutWriteConfiguration, StdoutErrorType> {
    return ok(new StdoutWriteConfiguration(false, false));
  }

  /**
   * Creates configuration for immediate output
   * - No automatic newline
   * - Immediate flush
   */
  static immediate(): Result<StdoutWriteConfiguration, StdoutErrorType> {
    return ok(new StdoutWriteConfiguration(true, false));
  }

  /**
   * Creates configuration for line-based output
   * - Automatic newline
   * - Immediate flush
   */
  static line(): Result<StdoutWriteConfiguration, StdoutErrorType> {
    return ok(new StdoutWriteConfiguration(true, true));
  }

  get flushImmediate(): boolean {
    return this._flushImmediate;
  }

  get appendNewline(): boolean {
    return this._appendNewline;
  }
}

/**
 * Type-safe stdout writing with Result-based error handling
 * Follows Totality principle - no exceptions thrown
 *
 * @param content - Content to write to stdout
 * @param config - Configuration for writing
 * @returns Result indicating success or specific error
 */
export function writeStdoutSafe(
  content: string,
  config: StdoutWriteConfiguration,
): Result<void, StdoutErrorType> {
  try {
    const outputContent = config.appendNewline ? content + "\n" : content;
    const encoder = new TextEncoder();
    const data = encoder.encode(outputContent);
    Deno.stdout.writeSync(data);

    // Note: Deno doesn't have explicit flush for stdout,
    // but writeSync is synchronous and effectively flushes

    return ok(undefined);
  } catch (caughtError) {
    return error({
      kind: "WriteError",
      message: caughtError instanceof Error ? caughtError.message : String(caughtError),
      originalError: caughtError instanceof Error ? caughtError : undefined,
    });
  }
}

/**
 * Write a line to stdout (adds newline automatically)
 *
 * @param content - Content to write (newline will be appended)
 * @returns Result indicating success or specific error
 */
export function writeLineSafe(content: string): Result<void, StdoutErrorType> {
  const configResult = StdoutWriteConfiguration.line();
  if (!configResult.ok) {
    return configResult;
  }
  return writeStdoutSafe(content, configResult.data);
}

/**
 * Unified output writer interface
 * Provides consistent API for all output operations
 */
export interface OutputWriter {
  /**
   * Write content without newline
   */
  write(content: string): Result<void, StdoutErrorType>;

  /**
   * Write content with newline
   */
  writeLine(content: string): Promise<Result<void, StdoutErrorType>>;

  /**
   * Write error message to stderr
   */
  writeError(content: string): Result<void, StdoutErrorType>;
}

/**
 * Standard output writer implementation
 * Uses stdout for normal output and stderr for errors
 */
export class StandardOutputWriter implements OutputWriter {
  private readonly config: StdoutWriteConfiguration;

  private constructor(config: StdoutWriteConfiguration) {
    this.config = config;
  }

  /**
   * Create a standard output writer
   */
  static create(): Result<StandardOutputWriter, StdoutErrorType> {
    const configResult = StdoutWriteConfiguration.standard();
    if (!configResult.ok) {
      return configResult;
    }
    return ok(new StandardOutputWriter(configResult.data));
  }

  write(content: string): Result<void, StdoutErrorType> {
    return writeStdoutSafe(content, this.config);
  }

  writeLine(content: string): Promise<Result<void, StdoutErrorType>> {
    return Promise.resolve(writeLineSafe(content));
  }

  writeError(content: string): Result<void, StdoutErrorType> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content + "\n");
      Deno.stderr.writeSync(data);
      return ok(undefined);
    } catch (caughtError) {
      return error({
        kind: "WriteError",
        message: `Failed to write to stderr: ${
          caughtError instanceof Error ? caughtError.message : String(caughtError)
        }`,
        originalError: caughtError instanceof Error ? caughtError : undefined,
      });
    }
  }
}

/**
 * Helper function to create and use an output writer
 *
 * @example
 * ```typescript
 * const result = await withOutputWriter(async (writer) => {
 *   writer.writeLine("Hello, World!");
 *   writer.write("Processing... ");
 *   writer.writeLine("Done!");
 * });
 * ```
 */
export async function withOutputWriter<T>(
  fn: (writer: OutputWriter) => Promise<T> | T,
): Promise<Result<T, StdoutErrorType>> {
  const writerResult = StandardOutputWriter.create();
  if (!writerResult.ok) {
    return writerResult;
  }

  try {
    const result = await fn(writerResult.data);
    return ok(result);
  } catch (caughtError) {
    return error({
      kind: "WriteError",
      message: caughtError instanceof Error ? caughtError.message : String(caughtError),
      originalError: caughtError instanceof Error ? caughtError : undefined,
    });
  }
}
