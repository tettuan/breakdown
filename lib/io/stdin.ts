/**
 * @fileoverview Stdin Wrapper Module
 *
 * This module provides a backwards compatibility wrapper for stdin operations.
 * It exports the enhanced stdin functionality as the main stdin interface.
 *
 * @module io/stdin
 */

import type { TimeoutManager } from "../config/timeout_manager.ts";

// Re-export the enhanced stdin functionality as the main interface
export {
  createStdinReaderForEnvironment,
  detectEnvironment,
  EnhancedStdinError as StdinError,
  type EnhancedStdinOptions as StdinOptions,
  type EnvironmentDetectionConfig,
  type EnvironmentInfo,
  isStdinAvailableEnhanced as isStdinAvailable,
  safeReadStdin,
  shouldSkipStdinProcessing,
} from "./enhanced_stdin.ts";

/**
 * Default readStdin function with enhanced error handling
 * This function is used by legacy code that expects the old readStdin interface
 */
export async function readStdin(options?: {
  timeoutManager?: unknown;
  forceRead?: boolean;
  allowEmpty?: boolean;
}): Promise<string> {
  const { readStdinEnhanced } = await import("./enhanced_stdin.ts");

  return await readStdinEnhanced({
    timeoutManager: options?.timeoutManager as TimeoutManager | undefined,
    forceRead: options?.forceRead ?? false,
    allowEmpty: options?.allowEmpty ?? true,
  });
}

/**
 * Check if stdin has content available
 */
export function hasStdinContent(): boolean {
  try {
    const { isTerminal } = Deno.stdin;
    return !isTerminal;
  } catch {
    return false;
  }
}

/**
 * Write content to stdout
 */
export function writeStdout(content: string): void {
  const encoder = new TextEncoder();
  Deno.stdout.writeSync(encoder.encode(content));
}

/**
 * Progress bar UI component
 */
export class ProgressBar {
  private current = 0;
  private quiet: boolean;

  constructor(
    private total: number,
    private width: number,
    options?: { quiet?: boolean },
  ) {
    this.quiet = options?.quiet ?? false;
  }

  update(value: number): void {
    this.current = Math.min(value, this.total);
    if (!this.quiet) {
      const percentage = Math.floor((this.current / this.total) * 100);
      const filled = Math.floor((this.current / this.total) * this.width);
      const empty = this.width - filled;
      const bar = "#".repeat(filled) + "-".repeat(empty);
      writeStdout(`\r[${bar}] ${percentage}%`);
    }
  }

  finish(): void {
    if (!this.quiet) {
      writeStdout("\n");
    }
  }
}

/**
 * Spinner UI component
 */
export class Spinner {
  private frames = ["|", "/", "-", "\\"];
  private currentFrame = 0;
  private intervalId?: number;
  private quiet: boolean;

  constructor(options?: { quiet?: boolean }) {
    this.quiet = options?.quiet ?? false;
  }

  start(): void {
    if (!this.quiet) {
      this.intervalId = setInterval(() => {
        writeStdout(`\r${this.frames[this.currentFrame]}`);
        this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      }, 80);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      if (!this.quiet) {
        writeStdout("\r \r");
      }
    }
  }
}
