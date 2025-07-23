/**
 * @fileoverview StdinProvider abstraction for test-safe stdin operations
 *
 * This module provides an abstraction layer for stdin operations that prevents
 * resource leaks in test environments by using mock providers instead of
 * actual Deno.stdin operations when testing.
 *
 * @module io/stdin_provider
 */

import { readAll } from "jsr:@std/io@0.224.9/read-all";

/**
 * Interface for stdin provider implementations
 */
export interface StdinProvider {
  /** Read all available data from stdin */
  readAll(): Promise<Uint8Array>;
  /** Check if stdin is connected to a terminal */
  isTerminal(): boolean;
  /** Get the readable stream for stdin */
  readonly readable: ReadableStream<Uint8Array>;
  /** Cleanup any active resources */
  cleanup?(): Promise<void>;
}

/**
 * Configuration for mock stdin behavior
 */
export interface MockStdinConfig {
  /** Mock data to return */
  data?: string;
  /** Whether to simulate terminal mode */
  isTerminal?: boolean;
  /** Delay before returning data (ms) */
  delay?: number;
  /** Whether the operation should fail */
  shouldFail?: boolean;
  /** Error message if shouldFail is true */
  errorMessage?: string;
}

/**
 * Mock stdin provider for test environments
 * Provides predictable behavior without actual I/O operations
 */
export class MockStdinProvider implements StdinProvider {
  constructor(private config: MockStdinConfig = {}) {}

  async readAll(): Promise<Uint8Array> {
    if (this.config.shouldFail) {
      throw new Error(this.config.errorMessage || "Mock stdin error");
    }

    if (this.config.delay && this.config.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delay));
    }

    return new TextEncoder().encode(this.config.data || "");
  }

  isTerminal(): boolean {
    return this.config.isTerminal ?? false;
  }

  get readable(): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: (controller) => {
        if (this.config.data) {
          controller.enqueue(new TextEncoder().encode(this.config.data));
        }
        controller.close();
      },
    });
  }
}

/**
 * Production stdin provider using actual Deno.stdin
 * Includes resource management to prevent leaks
 */
export class ProductionStdinProvider implements StdinProvider {
  private activeReads = new Set<Promise<Uint8Array>>();

  async readAll(): Promise<Uint8Array> {
    const readPromise = readAll(Deno.stdin);
    this.activeReads.add(readPromise);

    try {
      const result = await readPromise;
      return result;
    } finally {
      this.activeReads.delete(readPromise);
    }
  }

  isTerminal(): boolean {
    return Deno.stdin.isTerminal();
  }

  get readable(): ReadableStream<Uint8Array> {
    return Deno.stdin.readable;
  }

  /**
   * Cleanup method for resource management
   * Cancels any active reads to prevent resource leaks
   */
  async cleanup(): Promise<void> {
    // Cancel any active reads
    const cleanup = Array.from(this.activeReads).map(async () => {
      try {
        await Deno.stdin.readable.cancel();
      } catch {
        // Ignore cleanup errors - stream might already be cancelled
      }
    });
    await Promise.allSettled(cleanup);
    this.activeReads.clear();
  }
}

/**
 * Environment-aware factory for creating appropriate stdin providers
 */
export class StdinProviderFactory {
  /**
   * Create a stdin provider appropriate for the current environment
   * @param mockConfig Configuration for mock provider (used in test environments)
   * @returns StdinProvider instance
   */
  static create(mockConfig?: MockStdinConfig): StdinProvider {
    if (this.isTestEnvironment()) {
      return new MockStdinProvider(mockConfig);
    }
    return new ProductionStdinProvider();
  }

  /**
   * Detect if we're running in a test environment
   * @returns true if in test environment
   */
  private static isTestEnvironment(): boolean {
    return !!(
      Deno.env.get("DENO_TEST") === "true" ||
      Deno.env.get("TEST") === "true" ||
      globalThis.Deno?.test
    );
  }

  /**
   * Detect if we're running in a CI environment
   * @returns true if in CI environment
   */
  static isCIEnvironment(): boolean {
    return !!(
      Deno.env.get("CI") === "true" ||
      Deno.env.get("GITHUB_ACTIONS") === "true" ||
      Deno.env.get("GITLAB_CI") === "true" ||
      Deno.env.get("JENKINS_URL") ||
      Deno.env.get("BUILDKITE") === "true"
    );
  }
}

/**
 * Extended options that include mock configuration
 */
export interface ExtendedStdinOptions {
  /** Whether to allow empty input */
  allowEmpty?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Force reading stdin regardless of environment */
  forceRead?: boolean;
  /** Mock configuration for test environments */
  mockConfig?: MockStdinConfig;
}
