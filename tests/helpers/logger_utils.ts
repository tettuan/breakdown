/**
 * Logger utilities for consistent LOG_KEY usage in tests
 *
 * Purpose:
 * - Provide standardized key generation for BreakdownLogger
 * - Enable targeted debugging with LOG_KEY environment variable
 * - Ensure consistent logging patterns across test files
 */

import { BreakdownLogger } from "@tettuan/breakdownlogger";

/**
 * Phases for test logging
 */
export enum TestPhase {
  SETUP = "setup",
  TEARDOWN = "teardown",
  VALIDATION = "validation",
  EXECUTION = "execution",
  ERROR = "error",
  DEBUG = "debug",
  ASSERTION = "assertion",
  PREPROCESSING = "preprocessing",
  POSTPROCESSING = "postprocessing",
}

/**
 * Creates a standardized log key for test files
 * Format: {filename}#L{line}#{phase}-{description}
 *
 * @param filename - Name of the test file (e.g., "stdin_handling_test.ts")
 * @param line - Line number where the log is called
 * @param phase - Test phase (setup, execution, etc.)
 * @param description - Brief description of the log point
 * @returns Formatted key string
 */
export function createLogKey(
  filename: string,
  line: number,
  phase: TestPhase | string,
  description: string,
): string {
  // Remove path if included, keep only filename
  const baseFilename = filename.split("/").pop() || filename;
  // Sanitize description to be URL-friendly
  const sanitizedDescription = description
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${baseFilename}#L${line}#${phase}-${sanitizedDescription}`;
}

/**
 * Creates a logger with consistent key generation for a specific test file
 *
 * @param filename - Name of the test file
 * @param category - Optional logger category
 * @returns Logger wrapper with key generation methods
 */
export function createTestLogger(filename: string, category?: string) {
  const logger = new BreakdownLogger(category);
  const baseFilename = filename.split("/").pop() || filename;

  return {
    /**
     * Log debug message with auto-generated key
     */
    debug(
      message: string,
      line: number,
      phase: TestPhase | string,
      data?: Record<string, unknown>,
    ) {
      const description = message.slice(0, 30).toLowerCase().replace(/[^a-z0-9-]/g, "-");
      logger.debug(message, {
        key: createLogKey(baseFilename, line, phase, description),
        ...data,
      });
    },

    /**
     * Log info message with auto-generated key
     */
    info(message: string, line: number, phase: TestPhase | string, data?: Record<string, unknown>) {
      const description = message.slice(0, 30).toLowerCase().replace(/[^a-z0-9-]/g, "-");
      logger.info(message, {
        key: createLogKey(baseFilename, line, phase, description),
        ...data,
      });
    },

    /**
     * Log warning message with auto-generated key
     */
    warn(message: string, line: number, phase: TestPhase | string, data?: Record<string, unknown>) {
      const description = message.slice(0, 30).toLowerCase().replace(/[^a-z0-9-]/g, "-");
      logger.warn(message, {
        key: createLogKey(baseFilename, line, phase, description),
        ...data,
      });
    },

    /**
     * Log error message with auto-generated key
     */
    error(
      message: string,
      line: number,
      phase: TestPhase | string,
      data?: Record<string, unknown>,
    ) {
      const description = message.slice(0, 30).toLowerCase().replace(/[^a-z0-9-]/g, "-");
      logger.error(message, {
        key: createLogKey(baseFilename, line, phase, description),
        ...data,
      });
    },

    /**
     * Get the raw logger instance for custom usage
     */
    raw: logger,
  };
}

/**
 * Example usage patterns for LOG_KEY filtering
 *
 * Filter by test file:
 * LOG_KEY="stdin_handling" deno test --allow-all
 *
 * Filter by test phase:
 * LOG_KEY="setup,teardown" deno test --allow-all
 *
 * Filter by specific line:
 * LOG_KEY="#L33#" deno test --allow-all
 *
 * Filter by description:
 * LOG_KEY="test-env" deno test --allow-all
 *
 * Combine with LOG_LENGTH:
 * LOG_KEY="validation" LOG_LENGTH=L deno test --allow-all
 */
