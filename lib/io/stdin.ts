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
        // Create a promise that rejects when aborted
        const abortPromise = new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });

        // In CI environments, add additional safeguards
        const isCI = Deno.env.get("CI") === "true" || Deno.env.get("GITHUB_ACTIONS") === "true";

        if (isCI && Deno.stdin.isTerminal()) {
          // In CI terminal mode, don't wait for stdin input that won't come
          throw new DOMException("Aborted", "AbortError");
        }

        // Race between reading stdin and the abort signal
        input = await Promise.race([
          readAll(Deno.stdin),
          abortPromise,
        ]);
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      // Add timeout protection even when no explicit timeout is set
      const defaultTimeout = parseInt(Deno.env.get("BREAKDOWN_TIMEOUT") || "100", 10);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), defaultTimeout);

      try {
        const abortPromise = new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });

        input = await Promise.race([
          readAll(Deno.stdin),
          abortPromise,
        ]);
      } finally {
        clearTimeout(timeoutId);
      }
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
export function hasStdinContent(): boolean {
  try {
    // Check if stdin is a terminal (TTY)
    // If it's a terminal, there's no piped input
    if (Deno.stdin.isTerminal()) {
      return false;
    }

    // For non-TTY (piped input), we can't check without consuming
    // So we return true if stdin is available (piped)
    return true;
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
  /** AbortController for managing spinner lifecycle. */
  private abortController: AbortController | null;

  /**
   * Creates a new Spinner instance.
   * @param options Optional settings (e.g., quiet mode).
   */
  public constructor(options?: { quiet?: boolean }) {
    this.enabled = !(options?.quiet);
    this.frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    this.currentFrame = 0;
    this.interval = null;
    this.abortController = null;
  }

  /**
   * Starts the spinner animation.
   */
  public start(): void {
    if (!this.enabled) return;

    // Stop any existing spinner first
    this.stop();

    // Create new AbortController for this spinner session
    this.abortController = new AbortController();

    if (this.abortController.signal.aborted) return;

    this.interval = setInterval(() => {
      if (this.abortController?.signal.aborted) {
        this.stop();
        return;
      }
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      writeStdout(`\r${this.frames[this.currentFrame]} Processing...`);
    }, 80);
  }

  /**
   * Stops the spinner animation.
   */
  public stop(): void {
    if (!this.enabled) return;

    // Abort the controller to signal stopping
    if (this.abortController && !this.abortController.signal.aborted) {
      this.abortController.abort();
    }

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
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
