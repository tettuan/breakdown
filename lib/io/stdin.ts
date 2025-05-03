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
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new StdinError(
      `Failed to read from stdin: ${errorMessage}`,
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

/**
 * Write output to stdout
 */
export function writeStdout(content: string): void {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    Deno.stdout.writeSync(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write to stdout: ${errorMessage}`);
  }
}

/**
 * Progress indicator with percentage
 */
export class ProgressBar {
  private enabled: boolean = true;
  private progress: number;
  private total: number;
  private width: number;

  constructor(total: number, width = 40, options?: { quiet?: boolean }) {
    this.enabled = !(options?.quiet);
    this.progress = 0;
    this.total = total;
    this.width = width;
  }

  update(current: number): void {
    if (!this.enabled) return;

    this.progress = current;
    const percentage = Math.round((current / this.total) * 100);
    const filled = Math.round((current / this.total) * this.width);
    const bar = "=".repeat(filled) + "-".repeat(this.width - filled);

    writeStdout(`\r[${bar}] ${percentage}%`);

    if (current === this.total) {
      writeStdout("\n");
    }
  }

  private disable(): void {
    this.enabled = false;
  }
}

/**
 * Spinner for indeterminate progress
 */
export class Spinner {
  private enabled: boolean = true;
  private frames: string[];
  private currentFrame: number;
  private interval: number | null;

  constructor(options?: { quiet?: boolean }) {
    this.enabled = !(options?.quiet);
    this.frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    this.currentFrame = 0;
    this.interval = null;
  }

  start(): void {
    if (!this.enabled) return;

    this.interval = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      writeStdout(`\r${this.frames[this.currentFrame]} Processing...`);
    }, 80);
  }

  stop(): void {
    if (!this.enabled) return;

    if (this.interval) {
      clearInterval(this.interval);
      writeStdout("\n");
    }
  }

  private disable(): void {
    this.enabled = false;
  }
}
