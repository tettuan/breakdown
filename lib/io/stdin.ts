/**
 * Stdin Handling Module
 *
 * This module provides standardized stdin handling utilities for the Breakdown tool.
 * It handles reading from stdin with proper error handling and validation following
 * the Totality principle and Domain-Driven Design.
 *
 * @module
 */

import { type EnhancedStdinOptions, readStdinEnhanced } from "./enhanced_stdin.ts";
import { error, ok, type Result } from "../types/result.ts";

/**
 * Discriminated Union for stdin-specific errors
 * 
 * Each error type has a unique 'kind' discriminator for type safety
 * and follows Domain-Driven Design principles for error handling.
 */
export type StdinErrorType =
  | {
    kind: "ReadError";
    message: string;
    originalError?: Error;
  }
  | {
    kind: "TimeoutError";
    timeout: number;
  }
  | {
    kind: "EmptyInputError";
    message: string;
  }
  | {
    kind: "NotAvailableError";
    environment: string;
  }
  | {
    kind: "ValidationError";
    field: string;
    message: string;
  }
  | {
    kind: "ConfigurationError";
    setting: string;
    value?: unknown;
  };

/**
 * Type guards for StdinErrorType discrimination
 */
export function isReadError(error: StdinErrorType): error is Extract<StdinErrorType, { kind: "ReadError" }> {
  return error.kind === "ReadError";
}

export function isTimeoutError(error: StdinErrorType): error is Extract<StdinErrorType, { kind: "TimeoutError" }> {
  return error.kind === "TimeoutError";
}

export function isEmptyInputError(error: StdinErrorType): error is Extract<StdinErrorType, { kind: "EmptyInputError" }> {
  return error.kind === "EmptyInputError";
}

export function isNotAvailableError(error: StdinErrorType): error is Extract<StdinErrorType, { kind: "NotAvailableError" }> {
  return error.kind === "NotAvailableError";
}

export function isValidationError(error: StdinErrorType): error is Extract<StdinErrorType, { kind: "ValidationError" }> {
  return error.kind === "ValidationError";
}

export function isConfigurationError(error: StdinErrorType): error is Extract<StdinErrorType, { kind: "ConfigurationError" }> {
  return error.kind === "ConfigurationError";
}

/**
 * Format stdin error for display
 */
export function formatStdinError(stdinError: StdinErrorType): string {
  switch (stdinError.kind) {
    case "ReadError":
      return `Failed to read from stdin: ${stdinError.message}`;
    case "TimeoutError":
      return `Stdin reading timed out after ${stdinError.timeout}ms`;
    case "EmptyInputError":
      return `Empty input error: ${stdinError.message}`;
    case "NotAvailableError":
      return `Stdin not available in ${stdinError.environment}`;
    case "ValidationError":
      return `Validation error in ${stdinError.field}: ${stdinError.message}`;
    case "ConfigurationError":
      return `Configuration error for ${stdinError.setting}${stdinError.value ? `: ${stdinError.value}` : ""}`;
  }
}

/**
 * StdinError class for backward compatibility and testing
 * Provides traditional Error class interface for stdin-related errors
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
 * Legacy StdinError class for backward compatibility
 * @deprecated Use Result<T, StdinError> instead
 */
export class LegacyStdinError extends Error {
  /**
   * Creates a new LegacyStdinError instance.
   * @param message The error message describing the stdin error.
   */
  constructor(message: string) {
    super(message);
    this.name = "StdinError";
  }
}

/**
 * Value Object for stdin reading configuration
 * Ensures immutability and validation following DDD principles
 */
export class StdinReadingConfiguration {
  private constructor(
    private readonly _allowEmpty: boolean,
    private readonly _timeout: number,
    private readonly _enhancedOptions: EnhancedStdinOptions,
  ) {}

  /**
   * Smart Constructor for StdinReadingConfiguration
   * Validates all parameters and ensures type safety
   */
  static create(
    allowEmpty: boolean = false,
    timeout: number = 30000,
    enhancedOptions: EnhancedStdinOptions = {},
  ): Result<StdinReadingConfiguration, StdinErrorType> {
    // Validate timeout
    if (timeout <= 0) {
      return error({
        kind: "ValidationError",
        field: "timeout",
        message: "Timeout must be greater than 0",
      });
    }

    if (timeout > 300000) { // 5 minutes max
      return error({
        kind: "ValidationError",
        field: "timeout",
        message: "Timeout cannot exceed 300000ms (5 minutes)",
      });
    }

    // Validate enhanced options compatibility
    if (enhancedOptions.timeout && enhancedOptions.timeout !== timeout) {
      return error({
        kind: "ConfigurationError",
        setting: "timeout",
        value: { provided: timeout, enhanced: enhancedOptions.timeout },
      });
    }

    const mergedOptions: EnhancedStdinOptions = {
      ...enhancedOptions,
      allowEmpty,
      timeout,
    };

    return ok(new StdinReadingConfiguration(allowEmpty, timeout, mergedOptions));
  }

  /**
   * Factory for standard reading configuration
   */
  static standard(): Result<StdinReadingConfiguration, StdinErrorType> {
    return StdinReadingConfiguration.create(false, 30000);
  }

  /**
   * Factory for permissive reading configuration (allows empty input)
   */
  static permissive(timeout: number = 30000): Result<StdinReadingConfiguration, StdinErrorType> {
    return StdinReadingConfiguration.create(true, timeout);
  }

  /**
   * Factory for CI-safe reading configuration
   */
  static ciSafe(): Result<StdinReadingConfiguration, StdinErrorType> {
    return StdinReadingConfiguration.create(true, 5000, { forceRead: false });
  }

  // Getters for immutable access
  get allowEmpty(): boolean {
    return this._allowEmpty;
  }

  get timeout(): number {
    return this._timeout;
  }

  get enhancedOptions(): EnhancedStdinOptions {
    return { ...this._enhancedOptions }; // Return a copy to maintain immutability
  }
}

/**
 * Options for reading from stdin (Legacy interface)
 * @deprecated Use StdinReadingConfiguration instead
 */
export interface StdinOptions {
  /** Whether to allow empty input */
  allowEmpty?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Type-safe stdin reading with Result-based error handling
 * Uses enhanced stdin reader with TimeoutManager support
 * Follows Totality principle - no exceptions thrown
 * 
 * @param config - Type-safe configuration for stdin reading
 * @returns Result containing stdin content or specific error
 */
export async function readStdinSafe(
  config: StdinReadingConfiguration,
): Promise<Result<string, StdinErrorType>> {
  try {
    const content = await readStdinEnhanced(config.enhancedOptions);
    return ok(content);
  } catch (caughtError) {
    // Convert enhanced stdin errors to our Discriminated Union
    if (caughtError instanceof Error) {
      if (caughtError.message.includes("timeout")) {
        return error({
          kind: "TimeoutError",
          timeout: config.timeout,
        });
      }
      
      if (caughtError.message.includes("empty") || caughtError.message.includes("No input")) {
        return error({
          kind: "EmptyInputError",
          message: caughtError.message,
        });
      }
      
      if (caughtError.message.includes("not available") || caughtError.message.includes("CI") || caughtError.message.includes("test")) {
        const environment = caughtError.message.includes("CI") ? "CI" : 
                           caughtError.message.includes("test") ? "test" : "unknown";
        return error({
          kind: "NotAvailableError",
          environment,
        });
      }
    }
    
    return error({
      kind: "ReadError",
      message: caughtError instanceof Error ? caughtError.message : String(caughtError),
      originalError: caughtError instanceof Error ? caughtError : undefined,
    });
  }
}

/**
 * Legacy readStdin function for backward compatibility
 * @deprecated Use readStdinSafe with StdinReadingConfiguration instead
 * @throws {LegacyStdinError} If reading fails or validation fails
 */
export async function readStdin(
  options: StdinOptions & EnhancedStdinOptions = {},
): Promise<string> {
  try {
    // Use enhanced stdin reader with TimeoutManager support
    return await readStdinEnhanced(options);
  } catch (caughtError) {
    // Convert enhanced stdin errors to legacy stdin errors for compatibility
    throw new LegacyStdinError(
      caughtError instanceof Error ? caughtError.message : String(caughtError),
    );
  }
}

/**
 * Value Object representing stdin availability status
 * Immutable and provides type-safe access to stdin state
 */
export class StdinAvailability {
  private constructor(
    private readonly _isAvailable: boolean,
    private readonly _isTerminal: boolean,
    private readonly _reason: string,
  ) {}

  /**
   * Smart Constructor for StdinAvailability
   * Performs actual detection and validation
   */
  static detect(): Result<StdinAvailability, StdinErrorType> {
    try {
      // Check if stdin is a terminal (TTY)
      const isTerminal = Deno.stdin.isTerminal();
      
      if (isTerminal) {
        return ok(new StdinAvailability(
          false, 
          true, 
          "stdin is connected to a terminal"
        ));
      }

      // For non-TTY (piped input), we can't check without consuming
      // So we return true if stdin is available (piped)
      return ok(new StdinAvailability(
        true, 
        false, 
        "stdin is piped or redirected"
      ));
    } catch (caughtError) {
      return error({
        kind: "ReadError",
        message: "Failed to detect stdin availability",
        originalError: caughtError instanceof Error ? caughtError : undefined,
      });
    }
  }

  /**
   * Factory for testing scenarios
   */
  static mock(isAvailable: boolean, isTerminal: boolean): StdinAvailability {
    const reason = isAvailable ? "mocked as available" : "mocked as unavailable";
    return new StdinAvailability(isAvailable, isTerminal, reason);
  }

  // Immutable getters
  get isAvailable(): boolean {
    return this._isAvailable;
  }

  get isTerminal(): boolean {
    return this._isTerminal;
  }

  get reason(): string {
    return this._reason;
  }

  /**
   * Check if stdin should be attempted to be read
   */
  shouldAttemptRead(): boolean {
    return this._isAvailable && !this._isTerminal;
  }
}

/**
 * Type-safe stdin availability checking with Result-based error handling
 * Follows Totality principle - no exceptions thrown
 * 
 * @returns Result containing availability status or specific error
 */
export function checkStdinAvailability(): Result<StdinAvailability, StdinErrorType> {
  return StdinAvailability.detect();
}

/**
 * Legacy hasStdinContent function for backward compatibility
 * @deprecated Use checkStdinAvailability instead
 * @returns boolean indicating if stdin has content
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
 * Value Object for stdout writing configuration
 * Ensures immutability and validation following DDD principles
 */
export class StdoutWriteConfiguration {
  private constructor(
    private readonly _encoding: "utf-8" | "utf-16le" | "utf-16be",
    private readonly _flushImmediate: boolean,
  ) {}

  /**
   * Smart Constructor for StdoutWriteConfiguration
   * Validates encoding and flush options
   */
  static create(
    encoding: "utf-8" | "utf-16le" | "utf-16be" = "utf-8",
    flushImmediate: boolean = false,
  ): Result<StdoutWriteConfiguration, StdinErrorType> {
    const validEncodings = ["utf-8", "utf-16le", "utf-16be"];
    if (!validEncodings.includes(encoding)) {
      return error({
        kind: "ValidationError",
        field: "encoding",
        message: `Invalid encoding: ${encoding}. Must be one of: ${validEncodings.join(", ")}`,
      });
    }

    return ok(new StdoutWriteConfiguration(encoding, flushImmediate));
  }

  /**
   * Factory for standard configuration
   */
  static standard(): Result<StdoutWriteConfiguration, StdinErrorType> {
    return StdoutWriteConfiguration.create("utf-8", false);
  }

  /**
   * Factory for immediate flush configuration
   */
  static immediate(): Result<StdoutWriteConfiguration, StdinErrorType> {
    return StdoutWriteConfiguration.create("utf-8", true);
  }

  get encoding(): "utf-8" | "utf-16le" | "utf-16be" {
    return this._encoding;
  }

  get flushImmediate(): boolean {
    return this._flushImmediate;
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
): Result<void, StdinErrorType> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    Deno.stdout.writeSync(data);
    
    if (config.flushImmediate) {
      // Note: Deno doesn't have explicit flush for stdout, 
      // but writeSync is synchronous and effectively flushes
    }
    
    return ok(undefined);
  } catch (caughtError) {
    return error({
      kind: "ReadError", // Actually a write error, but we use ReadError for I/O operations
      message: `Failed to write to stdout: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`,
      originalError: caughtError instanceof Error ? caughtError : undefined,
    });
  }
}

/**
 * Legacy writeStdout function for backward compatibility
 * @deprecated Use writeStdoutSafe with StdoutWriteConfiguration instead
 * @throws {Error} If writing fails
 */
export function writeStdout(content: string): void {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    Deno.stdout.writeSync(data);
  } catch (caughtError) {
    const errorMessage = caughtError instanceof Error ? caughtError.message : String(caughtError);
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

    // Ensure cleanup on process exit
    if (globalThis.addEventListener) {
      globalThis.addEventListener("unload", () => this.stop());
    }
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

    // Clear interval first to prevent further updates
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // Abort the controller to signal stopping
    if (this.abortController && !this.abortController.signal.aborted) {
      this.abortController.abort();
    }
    this.abortController = null;

    // Write newline only once
    if (this.interval !== null || this.currentFrame > 0) {
      try {
        writeStdout("\n");
      } catch {
        // Ignore write errors during cleanup
      }
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
 * Value Object for stdin availability check options
 * Ensures immutability and validation following DDD principles
 */
export class StdinAvailabilityCheckOptions {
  private constructor(
    private readonly _isTerminalOverride?: boolean,
    private readonly _forTesting: boolean = false,
  ) {}

  /**
   * Smart Constructor for StdinAvailabilityCheckOptions
   */
  static create(
    isTerminalOverride?: boolean,
    forTesting: boolean = false,
  ): Result<StdinAvailabilityCheckOptions, StdinErrorType> {
    // Validate that if isTerminalOverride is provided, forTesting should be true
    if (isTerminalOverride !== undefined && !forTesting) {
      return error({
        kind: "ValidationError",
        field: "isTerminalOverride",
        message: "isTerminalOverride can only be used when forTesting is true",
      });
    }

    return ok(new StdinAvailabilityCheckOptions(isTerminalOverride, forTesting));
  }

  /**
   * Factory for production use
   */
  static production(): Result<StdinAvailabilityCheckOptions, StdinErrorType> {
    return StdinAvailabilityCheckOptions.create();
  }

  /**
   * Factory for testing with terminal override
   */
  static testing(isTerminal: boolean): Result<StdinAvailabilityCheckOptions, StdinErrorType> {
    return StdinAvailabilityCheckOptions.create(isTerminal, true);
  }

  get isTerminalOverride(): boolean | undefined {
    return this._isTerminalOverride;
  }

  get forTesting(): boolean {
    return this._forTesting;
  }
}

/**
 * Type-safe stdin availability checking with Result-based error handling
 * Follows Totality principle - no exceptions thrown
 * 
 * @param options - Configuration for availability checking
 * @returns Result containing boolean availability status or specific error
 */
export function isStdinAvailableSafe(
  options: StdinAvailabilityCheckOptions,
): Result<boolean, StdinError> {
  try {
    // For testability, allow isTerminal to be injected
    let isTerminal: boolean;
    
    if (options.isTerminalOverride !== undefined) {
      isTerminal = options.isTerminalOverride;
    } else {
      isTerminal = Deno.stdin.isTerminal();
    }
    
    return ok(!isTerminal);
  } catch (caughtError) {
    return error(new StdinError("Failed to check stdin availability"));
  }
}

/**
 * Legacy isStdinAvailable function for backward compatibility
 * @deprecated Use isStdinAvailableSafe with StdinAvailabilityCheckOptions instead
 * @param opts Optional override for isTerminal (for testing/mocking)
 * @returns true if STDIN is available (not a TTY), false otherwise
 */
export function isStdinAvailable(opts?: { isTerminal?: boolean }): boolean {
  // For testability, allow isTerminal to be injected
  const isTerminal = opts?.isTerminal ?? Deno.stdin.isTerminal();
  return !isTerminal;
}

// Re-export StdinProvider types and factory for enhanced integration
export {
  type ExtendedStdinOptions,
  type MockStdinConfig,
  MockStdinProvider,
  ProductionStdinProvider,
  type StdinProvider,
  StdinProviderFactory,
} from "./stdin_provider.ts";
