/**
 * STDIN Test Interfaces
 * 
 * Purpose:
 * - Define core interfaces for STDIN testing with dependency injection
 * - Enable testable STDIN operations without environment dependencies
 * - Support flexible mock implementations
 * 
 * Design:
 * - Based on tmp/stdin_test_design_proposal.md section 2.1
 * - Separates interface from implementation for testing
 */

/**
 * Options for reading from STDIN
 */
export interface StdinReadOptions {
  /** Timeout in milliseconds for the read operation */
  timeout?: number;
  /** Whether to allow empty input */
  allowEmpty?: boolean;
  /** AbortSignal for cancelling the read operation */
  signal?: AbortSignal;
}

/**
 * Core interface for STDIN operations
 * Implementations can be real or mock STDIN readers
 */
export interface StdinReader {
  /**
   * Reads input from STDIN
   * @param options Read options including timeout and abort signal
   * @returns The input string
   * @throws Error if read fails or times out
   */
  read(options?: StdinReadOptions): Promise<string>;

  /**
   * Checks if STDIN is available (piped input exists)
   * @returns true if STDIN is available, false otherwise
   */
  isAvailable(): boolean;

  /**
   * Checks if STDIN is a terminal (TTY)
   * @returns true if STDIN is a terminal, false otherwise
   */
  isTerminal(): boolean;
}

/**
 * Configuration for mock STDIN behavior
 */
export interface MockStdinConfig {
  /** The data to return when read() is called */
  data?: string;
  /** Whether isTerminal() should return true */
  isTerminal?: boolean;
  /** Whether isAvailable() should return true */
  isAvailable?: boolean;
  /** Delay in milliseconds before returning data */
  delay?: number;
  /** Whether to throw an error on read */
  throwError?: boolean;
  /** Error message when throwError is true */
  errorMessage?: string;
  /** Whether to simulate a timeout */
  simulateTimeout?: boolean;
}

/**
 * Factory interface for creating StdinReader instances
 */
export interface StdinReaderFactory {
  /**
   * Creates a new StdinReader instance
   * @param config Optional configuration for mock behavior
   * @returns A StdinReader implementation
   */
  create(config?: Partial<MockStdinConfig>): StdinReader;
}