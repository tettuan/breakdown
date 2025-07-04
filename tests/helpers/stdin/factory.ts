/**
 * STDIN Reader Factory Implementation
 *
 * Purpose:
 * - Provides factory pattern for creating StdinReader instances
 * - Simplifies test setup with default configurations
 * - Ensures consistent resource management across tests
 *
 * Design:
 * - Based on tmp/stdin_test_design_proposal.md section 2.2
 * - Integrates with StdinTestResourceManager
 * - Provides sensible defaults for test scenarios
 */

import { BreakdownLogger } from "@tettuan/breakdownlogger";
import type { MockStdinConfig, StdinReader, StdinReaderFactory } from "./interfaces.ts";
import type { StdinTestResourceManager } from "./resource_manager.ts";
import { MockStdinReader } from "./mock_stdin_reader.ts";

const logger = new BreakdownLogger("stdin-reader-factory");

/**
 * Default configuration for mock STDIN readers
 */
const DEFAULT_MOCK_CONFIG: MockStdinConfig = {
  data: "",
  isTerminal: false,
  isAvailable: true,
  delay: 0,
  throwError: false,
  simulateTimeout: false,
};

/**
 * Factory implementation for creating test STDIN readers
 * Manages creation of mock readers with resource tracking
 */
export class TestStdinReaderFactory implements StdinReaderFactory {
  private createdReaders: MockStdinReader[] = [];

  constructor(private resourceManager: StdinTestResourceManager) {
    logger.debug("TestStdinReaderFactory created");
  }

  /**
   * Creates a new mock STDIN reader with the specified configuration
   * @param config Partial configuration to override defaults
   * @returns A configured MockStdinReader instance
   */
  create(config?: Partial<MockStdinConfig>): StdinReader {
    const mergedConfig: MockStdinConfig = {
      ...DEFAULT_MOCK_CONFIG,
      ...config,
    };

    logger.debug("Creating mock STDIN reader", { config: mergedConfig });

    const reader = new MockStdinReader(mergedConfig, this.resourceManager);
    this.createdReaders.push(reader);

    logger.debug("Mock STDIN reader created", {
      totalReaders: this.createdReaders.length,
    });

    return reader;
  }

  /**
   * Creates a reader that simulates successful input
   * @param data The data to return when read
   * @param delay Optional delay in milliseconds
   */
  createSuccessReader(data: string, delay?: number): StdinReader {
    return this.create({
      data,
      delay,
      isAvailable: true,
      isTerminal: false,
    });
  }

  /**
   * Creates a reader that simulates an error
   * @param errorMessage The error message to throw
   */
  createErrorReader(errorMessage: string): StdinReader {
    return this.create({
      throwError: true,
      errorMessage,
    });
  }

  /**
   * Creates a reader that simulates a timeout
   * @param delay How long to wait before timing out
   */
  createTimeoutReader(delay: number = 1000): StdinReader {
    return this.create({
      simulateTimeout: true,
      delay,
    });
  }

  /**
   * Creates a reader that simulates terminal input (no piped data)
   */
  createTerminalReader(): StdinReader {
    return this.create({
      isTerminal: true,
      isAvailable: false,
    });
  }

  /**
   * Creates a reader that simulates empty input
   * @param allowEmpty Whether the reader should allow empty input
   */
  createEmptyReader(_allowEmpty: boolean = false): StdinReader {
    return this.create({
      data: "",
      isAvailable: true,
      isTerminal: false,
    });
  }

  /**
   * Gets statistics about created readers
   * Useful for debugging and assertions
   */
  getStatistics(): {
    totalCreated: number;
    totalReads: number;
  } {
    const totalReads = this.createdReaders.reduce(
      (sum, reader) => sum + reader.getReadCount(),
      0,
    );

    return {
      totalCreated: this.createdReaders.length,
      totalReads,
    };
  }

  /**
   * Resets all reader statistics
   * Useful for test cleanup
   */
  resetStatistics(): void {
    this.createdReaders.forEach((reader) => reader.resetReadCount());
    logger.debug("Reader statistics reset");
  }

  /**
   * Clears the list of created readers
   * Note: This doesn't clean up resources - use ResourceManager for that
   */
  clearReaders(): void {
    this.createdReaders = [];
    logger.debug("Reader list cleared");
  }
}

/**
 * Creates a factory with common test configurations
 * Convenience function for test setup
 */
export function createTestFactory(
  resourceManager: StdinTestResourceManager,
): TestStdinReaderFactory {
  return new TestStdinReaderFactory(resourceManager);
}
