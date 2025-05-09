/**
 * Tests for BreakdownLogger log level functionality
 *
 * Purpose:
 * - Verify log level checking methods
 * - Test log level comparison behavior
 * - Validate log level changes
 */

import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger();

Deno.test("logger - log level functionality", async (t) => {
  await t.step("verify log level setting", () => {
    // Set to ERROR level
    logger.setLogLevel(LogLevel.ERROR);

    // Try to log at different levels
    logger.debug("Debug message"); // Should not be logged
    logger.info("Info message"); // Should not be logged
    logger.warn("Warn message"); // Should not be logged
    logger.error("Error message"); // Should be logged
  });

  await t.step("verify log level initialization", () => {
    // Create a new logger with DEBUG level
    const debugLogger = new BreakdownLogger({ initialLevel: LogLevel.DEBUG });

    // Try to log at different levels
    debugLogger.debug("Debug message"); // Should be logged
    debugLogger.info("Info message"); // Should be logged
    debugLogger.warn("Warn message"); // Should be logged
    debugLogger.error("Error message"); // Should be logged
  });
});
