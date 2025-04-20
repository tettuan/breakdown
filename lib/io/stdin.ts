/**
 * Stdin Handling Module
 *
 * This module provides standardized stdin handling utilities for the Breakdown tool.
 * It handles reading from stdin with proper error handling and validation.
 *
 * @module
 */

import { readAll } from "jsr:@std/io@0.224.9/read-all";

/**
 * Error thrown when stdin reading fails
 */
export class StdinError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StdinError";
  }
}

/**
 * Options for reading from stdin
 */
export interface StdinOptions {
  /** Whether to allow empty input */
  allowEmpty?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Reads content from stdin with proper error handling
 * @param options - Configuration options for stdin reading
 * @returns Promise resolving to the stdin content
 * @throws {StdinError} If reading fails or validation fails
 */
export async function readStdin(options: StdinOptions = {}): Promise<string> {
  const { allowEmpty = false, timeout } = options;

  try {
    let input: Uint8Array;
    if (timeout) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        input = await readAll(Deno.stdin);
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      input = await readAll(Deno.stdin);
    }

    const content = new TextDecoder().decode(input).trim();

    if (!allowEmpty && !content) {
      throw new StdinError("No input provided via stdin");
    }

    return content;
  } catch (error) {
    if (error instanceof StdinError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new StdinError("Stdin reading timed out");
    }
    throw new StdinError(
      `Failed to read from stdin: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Checks if stdin has any content available
 * @returns Promise resolving to true if stdin has content
 */
export async function hasStdinContent(): Promise<boolean> {
  try {
    const input = await readAll(Deno.stdin);
    return input.length > 0;
  } catch {
    return false;
  }
}
