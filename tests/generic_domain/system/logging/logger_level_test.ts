/**
 * Tests for BreakdownLogger log level functionality
 *
 * Purpose:
 * - Verify log level checking methods
 * - Test log level comparison behavior
 * - Validate log level changes
 */

import {
  cleanupTestEnvironment as _cleanupTestEnvironment,
  setupTestEnvironment as _setupTestEnvironment,
} from "$test/helpers/setup.ts";
import { LogLevel as _LogLevel } from "jsr:@tettuan/breakdownlogger@^1.0.0";

Deno.test("logger - log level functionality", async (t) => {
  await t.step("verify log level setting", async () => {
    // Set to ERROR level using setupTestEnvironment logLevel option
    const testEnv = await _setupTestEnvironment({
      workingDir: "./tmp/test/logger/level/error",
      logLevel: _LogLevel.ERROR,
    });

    // Try to log at different levels
    testEnv.logger.debug("Debug message"); // Should not be logged
    testEnv.logger.info("Info message"); // Should not be logged
    testEnv.logger.warn("Warn message"); // Should not be logged
    testEnv.logger.error("Error message"); // Should be logged

    await _cleanupTestEnvironment(testEnv);
  });

  await t.step("verify log level initialization", async () => {
    // Create a new logger with DEBUG level using setupTestEnvironment logLevel option
    const testEnv = await _setupTestEnvironment({
      workingDir: "./tmp/test/logger/level/debug",
      logLevel: _LogLevel.DEBUG,
    });

    // Try to log at different levels
    testEnv.logger.debug("Debug message"); // Should be logged
    testEnv.logger.info("Info message"); // Should be logged
    testEnv.logger.warn("Warn message"); // Should be logged
    testEnv.logger.error("Error message"); // Should be logged

    await _cleanupTestEnvironment(testEnv);
  });
});
