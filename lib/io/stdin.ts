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
 * Error thrown when stdin reading fails.
 */
export class StdinError extends Error {
  /**
   * Creates a new StdinError instance.
   * @param message The error message describing the stdin error.
   */
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
      throw new StdinError("No input provided via stdin or -f/--from option");
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
 * Progress indicator with percentage.
 * Used to display progress for long-running CLI operations.
 */
export class ProgressBar {
  /** Indicates if the progress bar is enabled. */
  public enabled: boolean = true;
  /** The current progress value. */
  public progress: number;
  /** The total value representing 100% progress. */
  public total: number;
  /** The width of the progress bar in characters. */
  public width: number;

  /**
   * Creates a new ProgressBar instance.
   * @param total The total value representing 100% progress.
   * @param width The width of the progress bar in characters.
   * @param options Optional settings (e.g., quiet mode).
   */
  public constructor(total: number, width = 40, options?: { quiet?: boolean }) {
    this.enabled = !(options?.quiet);
    this.progress = 0;
    this.total = total;
    this.width = width;
  }

  /**
   * Updates the progress bar to the current value.
   * @param current The current progress value.
   */
  public update(current: number): void {
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

  /**
   * Disables the progress bar.
   * @private
   */
  private disable(): void {
    this.enabled = false;
  }
}

/**
 * Spinner for indeterminate progress.
 * Used to display a spinner animation for ongoing CLI operations.
 */
export class Spinner {
  /** Indicates if the spinner is enabled. */
  public enabled: boolean = true;
  /** The spinner animation frames. */
  public frames: string[];
  /** The current frame index. */
  public currentFrame: number;
  /** The interval timer for the spinner. */
  public interval: number | null;

  /**
   * Creates a new Spinner instance.
   * @param options Optional settings (e.g., quiet mode).
   */
  public constructor(options?: { quiet?: boolean }) {
    this.enabled = !(options?.quiet);
    this.frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    this.currentFrame = 0;
    this.interval = null;
  }

  /**
   * Starts the spinner animation.
   */
  public start(): void {
    if (!this.enabled) return;

    this.interval = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      writeStdout(`\r${this.frames[this.currentFrame]} Processing...`);
    }, 80);
  }

  /**
   * Stops the spinner animation.
   */
  public stop(): void {
    if (!this.enabled) return;

    if (this.interval) {
      clearInterval(this.interval);
      writeStdout("\n");
    }
  }

  /**
   * Disables the spinner.
   * @private
   */
  private disable(): void {
    this.enabled = false;
  }
}

/**
 * Checks if STDIN is available (i.e., not a TTY, so piped or redirected input exists).
 * @param opts Optional override for isTerminal (for testing/mocking)
 * @returns true if STDIN is available (not a TTY), false otherwise
 */
export function isStdinAvailable(opts?: { isTerminal?: boolean }): boolean {
  // For testability, allow isTerminal to be injected
  const isTerminal = opts?.isTerminal ?? Deno.stdin.isTerminal();
  return !isTerminal;
}
