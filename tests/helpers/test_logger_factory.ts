/**
 * @fileoverview Factory for creating test-scoped BreakdownLogger instances.
 *
 * Provides a standardized way to create loggers with consistent naming
 * conventions across test files, and defines test execution stages for
 * structured log output.
 *
 * @module tests/helpers/test_logger_factory
 */

import { BreakdownLogger } from "@tettuan/breakdownlogger";

/**
 * Test execution stages for structured logging.
 * Each stage represents a phase in the test lifecycle.
 */
export const STAGE = {
  SETUP: "setup",
  CONFIG: "config",
  EXECUTION: "execution",
  VERIFICATION: "verification",
  TEARDOWN: "teardown",
} as const;

/** Union type of all test stage values. */
export type Stage = (typeof STAGE)[keyof typeof STAGE];

/**
 * Factory for creating BreakdownLogger instances scoped to test domains and suites.
 *
 * @example
 * ```ts
 * const logger = TestLoggerFactory.create("core_domain", "prompt_path_resolution");
 * logger.debug(STAGE.SETUP, "Initializing test environment");
 * ```
 */
export class TestLoggerFactory {
  /**
   * Creates a BreakdownLogger with a key following the `tests/{domain}/{suite}` convention.
   *
   * @param domain - The test domain (e.g., "core_domain", "cross_domain")
   * @param suite - The test suite name (e.g., "prompt_path_resolution")
   * @returns A configured BreakdownLogger instance
   */
  static create(domain: string, suite: string): BreakdownLogger {
    return new BreakdownLogger(`tests/${domain}/${suite}`);
  }
}
