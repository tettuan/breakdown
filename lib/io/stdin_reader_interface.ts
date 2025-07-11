/**
 * StdinReader Interface Design
 *
 * Purpose: Provide a mockable, testable interface for stdin operations
 * with proper resource management and AbortSignal support.
 */

import { readAll as _readAll } from "jsr:@std/io@0.224.9/read-all";

/**
 * Core interface for reading from stdin-like sources
 */
export interface StdinReader {
  /**
   * Read all available data from the input source
   * @param signal Optional AbortSignal for cancellation
   * @returns Promise resolving to the read data
   * @throws {DOMException} When aborted via signal
   * @throws {StdinReaderError} For other read errors
   */
  read(signal?: AbortSignal): Promise<Uint8Array>;

  /**
   * Check if the input source is a terminal
   * @returns true if terminal, false if piped/redirected
   */
  isTerminal(): boolean;

  /**
   * Cancel any ongoing read operations and cleanup resources
   * @returns Promise that resolves when cleanup is complete
   */
  cancel(): Promise<void>;

  /**
   * Get reader capabilities and status
   * @returns Reader metadata
   */
  getInfo(): StdinReaderInfo;
}

/**
 * Reader metadata and capabilities
 */
export interface StdinReaderInfo {
  /** Whether the reader supports AbortSignal */
  supportsAbortSignal: boolean;
  /** Whether the reader is currently reading */
  isReading: boolean;
  /** Whether the reader has been cancelled */
  isCancelled: boolean;
  /** Reader implementation type */
  type: "deno" | "mock" | "custom";
}

/**
 * Error types for StdinReader operations
 */
export type StdinReaderError =
  | { kind: "ReadError"; message: string; cause?: unknown }
  | { kind: "TimeoutError"; timeout: number }
  | { kind: "CancelledError"; reason: string }
  | { kind: "NotAvailableError"; environment: string };

/**
 * Default implementation for Deno stdin
 */
export class DenoStdinReader implements StdinReader {
  private isReading = false;
  private isCancelled = false;
  private currentReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private abortController: AbortController | null = null;

  async read(signal?: AbortSignal): Promise<Uint8Array> {
    if (this.isCancelled) {
      throw this.createError({
        kind: "CancelledError",
        reason: "Reader has been cancelled",
      });
    }

    if (this.isReading) {
      throw this.createError({
        kind: "ReadError",
        message: "Another read operation is in progress",
      });
    }

    this.isReading = true;
    this.abortController = new AbortController();

    // Link external signal to internal controller
    if (signal) {
      if (signal.aborted) {
        this.isReading = false;
        throw new DOMException("Aborted", "AbortError");
      }

      const abortHandler = () => {
        this.abortController?.abort();
      };
      signal.addEventListener("abort", abortHandler);

      // Ensure cleanup
      const cleanup = () => {
        signal.removeEventListener("abort", abortHandler);
      };

      try {
        return await this.performRead(cleanup);
      } catch (error) {
        cleanup();
        throw error;
      }
    } else {
      return await this.performRead();
    }
  }

  private async performRead(cleanup?: () => void): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      if (!Deno.stdin.readable) {
        throw this.createError({
          kind: "NotAvailableError",
          environment: "stdin not readable",
        });
      }

      reader = Deno.stdin.readable.getReader();
      this.currentReader = reader;

      while (true) {
        // Check for cancellation before each read
        if (this.abortController?.signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        const { done, value } = await reader.read();

        if (done) break;
        if (value) chunks.push(value);
      }

      // Combine chunks efficiently
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result;
    } finally {
      // Always cleanup reader
      if (reader) {
        try {
          reader.releaseLock();
        } catch {
          // Ignore release errors
        }
      }

      this.currentReader = null;
      this.isReading = false;
      this.abortController = null;

      if (cleanup) {
        cleanup();
      }
    }
  }

  isTerminal(): boolean {
    try {
      return Deno.stdin.isTerminal();
    } catch {
      // If we can't determine, assume not terminal
      return false;
    }
  }

  async cancel(): Promise<void> {
    this.isCancelled = true;

    // Abort any ongoing read
    if (this.abortController && !this.abortController.signal.aborted) {
      this.abortController.abort();
    }

    // Cancel the underlying stream
    try {
      if (Deno.stdin.readable) {
        await Deno.stdin.readable.cancel();
      }
    } catch {
      // Ignore cancellation errors
    }
  }

  getInfo(): StdinReaderInfo {
    return {
      supportsAbortSignal: true,
      isReading: this.isReading,
      isCancelled: this.isCancelled,
      type: "deno",
    };
  }

  private createError(error: StdinReaderError): Error {
    const message = this.getErrorMessage(error);
    const err = new Error(message);
    err.name = "StdinReaderError";
    (err as Error & { details: StdinReaderError }).details = error;
    return err;
  }

  private getErrorMessage(error: StdinReaderError): string {
    switch (error.kind) {
      case "ReadError":
        return error.message;
      case "TimeoutError":
        return `Read operation timed out after ${error.timeout}ms`;
      case "CancelledError":
        return `Read operation cancelled: ${error.reason}`;
      case "NotAvailableError":
        return `Stdin not available in ${error.environment}`;
    }
  }
}

/**
 * Mock implementation for testing
 */
export class MockStdinReader implements StdinReader {
  private data: Uint8Array;
  private terminal: boolean;
  private delay: number;
  private shouldFail: boolean;
  private failureError?: StdinReaderError;
  private readCount = 0;
  private cancelled = false;

  constructor(options: {
    data: string | Uint8Array;
    terminal?: boolean;
    delay?: number;
    shouldFail?: boolean;
    failureError?: StdinReaderError;
  }) {
    this.data = typeof options.data === "string"
      ? new TextEncoder().encode(options.data)
      : options.data;
    this.terminal = options.terminal ?? false;
    this.delay = options.delay ?? 0;
    this.shouldFail = options.shouldFail ?? false;
    this.failureError = options.failureError;
  }

  async read(signal?: AbortSignal): Promise<Uint8Array> {
    this.readCount++;

    if (this.cancelled) {
      throw new Error("Reader has been cancelled");
    }

    if (this.shouldFail && this.failureError) {
      throw new Error(this.getErrorMessage(this.failureError));
    }

    // Simulate delay
    if (this.delay > 0) {
      await this.simulateDelay(this.delay, signal);
    }

    // Check if aborted after delay
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    return this.data.slice(); // Return a copy
  }

  private simulateDelay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      let timeoutId: number | undefined = undefined;
      let abortHandler: (() => void) | undefined;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (abortHandler && signal) {
          signal.removeEventListener("abort", abortHandler);
        }
      };

      if (signal) {
        abortHandler = () => {
          cleanup();
          reject(new DOMException("Aborted", "AbortError"));
        };
        signal.addEventListener("abort", abortHandler);
      }

      timeoutId = setTimeout(() => {
        cleanup();
        resolve();
      }, ms);
    });
  }

  isTerminal(): boolean {
    return this.terminal;
  }

  async cancel(): Promise<void> {
    this.cancelled = true;
    // Mock implementation - instant cancellation
    await Promise.resolve();
  }

  getInfo(): StdinReaderInfo {
    return {
      supportsAbortSignal: true,
      isReading: false,
      isCancelled: this.cancelled,
      type: "mock",
    };
  }

  // Test helpers
  getReadCount(): number {
    return this.readCount;
  }

  setData(data: string | Uint8Array): void {
    this.data = typeof data === "string" ? new TextEncoder().encode(data) : data;
  }

  setShouldFail(shouldFail: boolean, error?: StdinReaderError): void {
    this.shouldFail = shouldFail;
    this.failureError = error;
  }

  private getErrorMessage(error: StdinReaderError): string {
    switch (error.kind) {
      case "ReadError":
        return error.message;
      case "TimeoutError":
        return `Read operation timed out after ${error.timeout}ms`;
      case "CancelledError":
        return `Read operation cancelled: ${error.reason}`;
      case "NotAvailableError":
        return `Stdin not available in ${error.environment}`;
    }
  }
}

/**
 * Factory function for creating appropriate reader based on environment
 */
export function createStdinReader(options?: {
  type?: "deno" | "mock";
  mockOptions?: ConstructorParameters<typeof MockStdinReader>[0];
}): StdinReader {
  if (options?.type === "mock" && options.mockOptions) {
    return new MockStdinReader(options.mockOptions);
  }

  return new DenoStdinReader();
}
