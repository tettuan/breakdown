/**
 * Mock STDIN Reader Implementation
 *
 * Purpose:
 * - Provides a mock implementation of StdinReader for testing
 * - Simulates various STDIN behaviors including timeouts and errors
 * - Integrates with resource manager for proper cleanup
 *
 * Design:
 * - Based on tmp/stdin_test_design_proposal.md section 2.1
 * - Uses StdinTestResourceManager for lifecycle management
 * - Supports configurable behaviors for different test scenarios
 */

import { BreakdownLogger } from "@tettuan/breakdownlogger";
import type { MockStdinConfig, StdinReader, StdinReadOptions } from "./interfaces.ts";
import type { StdinTestResourceManager } from "./resource_manager.ts";

const logger = new BreakdownLogger("mock-stdin-reader");

/**
 * Mock implementation of StdinReader for testing
 * Provides configurable behavior to simulate various STDIN scenarios
 */
export class MockStdinReader implements StdinReader {
  private readCount = 0;

  constructor(
    private config: MockStdinConfig,
    private resourceManager: StdinTestResourceManager,
  ) {
    logger.debug("MockStdinReader created", { config });
  }

  /**
   * Simulates reading from STDIN with configurable behavior
   */
  async read(options?: StdinReadOptions): Promise<string> {
    this.readCount++;
    const resourceId = `read-${Date.now()}-${this.readCount}`;
    const resource = await this.resourceManager.createResource(resourceId);

    logger.debug("Starting mock read", {
      resourceId,
      options,
      config: this.config,
    });

    try {
      // Merge abort signals if both exist
      const abortController = new AbortController();
      if (options?.signal) {
        options.signal.addEventListener("abort", () => {
          abortController.abort();
        });
      }
      resource.abortController.signal.addEventListener("abort", () => {
        abortController.abort();
      });

      // Handle timeout with consideration for BREAKDOWN_TIMEOUT env var
      let effectiveTimeout = options?.timeout;

      // Check for BREAKDOWN_TIMEOUT environment variable (highest priority)
      const envTimeout = Deno.env.get("BREAKDOWN_TIMEOUT");
      if (envTimeout) {
        const parsed = parseInt(envTimeout, 10);
        if (!isNaN(parsed) && parsed > 0) {
          effectiveTimeout = parsed;
          logger.debug("Using BREAKDOWN_TIMEOUT from environment", { timeout: effectiveTimeout });
        }
      }

      if (effectiveTimeout !== undefined && effectiveTimeout > 0) {
        const timeoutId = setTimeout(() => {
          logger.debug("Timeout triggered", { resourceId, timeout: effectiveTimeout });
          resource.abortController.abort();
        }, effectiveTimeout);

        // Register cleanup for timeout
        this.resourceManager.registerCleanup(resourceId, () => {
          clearTimeout(timeoutId);
          logger.debug("Timeout cleanup executed", { resourceId });
          return Promise.resolve();
        });
      }

      // Simulate read operation
      const result = await this.simulateRead(abortController.signal, resourceId);

      logger.debug("Mock read completed", { resourceId, resultLength: result.length });
      return result;
    } finally {
      // Ensure resource cleanup
      await this.resourceManager.cleanupResource(resourceId);
    }
  }

  /**
   * Returns configured availability status
   */
  isAvailable(): boolean {
    const available = this.config.isAvailable ?? true;
    logger.debug("isAvailable called", { result: available });
    return available;
  }

  /**
   * Returns configured terminal status
   */
  isTerminal(): boolean {
    const terminal = this.config.isTerminal ?? false;
    logger.debug("isTerminal called", { result: terminal });
    return terminal;
  }

  /**
   * Simulates the actual read operation with delays and errors
   */
  private async simulateRead(signal: AbortSignal, resourceId: string): Promise<string> {
    logger.debug("Simulating read", { resourceId, config: this.config });

    // Check if we should throw an error
    if (this.config.throwError) {
      const errorMessage = this.config.errorMessage || "Mock stdin error";
      logger.debug("Throwing configured error", { resourceId, errorMessage });
      throw new Error(errorMessage);
    }

    // Simulate timeout if configured
    if (this.config.simulateTimeout) {
      logger.debug("Simulating timeout", { resourceId });
      // Wait indefinitely until aborted
      return new Promise((_, reject) => {
        signal.addEventListener("abort", () => {
          reject(new Error("Stdin reading timed out"));
        });
      });
    }

    // Handle configured delay
    if (this.config.delay && this.config.delay > 0) {
      logger.debug("Applying delay", { resourceId, delay: this.config.delay });

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          logger.debug("Delay completed", { resourceId });
          resolve();
        }, this.config.delay);

        // Register cleanup for timer
        this.resourceManager.registerCleanup(resourceId, () => {
          clearTimeout(timer);
          return Promise.resolve();
        });

        // Handle abort during delay
        signal.addEventListener("abort", () => {
          logger.debug("Aborted during delay", { resourceId });
          clearTimeout(timer);
          reject(new Error("Operation aborted"));
        });
      });
    }

    // Check for abort before returning data
    if (signal.aborted) {
      logger.debug("Operation aborted before returning data", { resourceId });
      throw new Error("Operation aborted");
    }

    // Return configured data
    const data = this.config.data || "";

    // Validate empty data if not allowed
    if (!data && this.config.data !== "") {
      // Check if empty is allowed (from read options)
      // This would normally be handled by the caller, but we can simulate it
      logger.debug("Returning empty data", { resourceId });
    }

    logger.debug("Returning mock data", { resourceId, dataLength: data.length });
    return data;
  }

  /**
   * Gets the number of times read() has been called
   * Useful for test assertions
   */
  getReadCount(): number {
    return this.readCount;
  }

  /**
   * Resets the read counter
   * Useful for test cleanup
   */
  resetReadCount(): void {
    this.readCount = 0;
    logger.debug("Read count reset");
  }
}
