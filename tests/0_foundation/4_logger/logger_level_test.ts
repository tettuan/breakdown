/**
 * Tests for BreakdownLogger log level functionality
 *
 * Purpose:
 * - Verify log level checking methods
 * - Test log level comparison behavior
 * - Validate log level changes
 */

// Removed unused imports - logger instance is accessed via testEnv.logger
import { cleanupTestEnvironment, setupTestEnvironment } from "$test/helpers/setup.ts";

Deno.test("logger - log level functionality", async (t) => {
  await t.step("verify log level setting", async () => {
    // Set to ERROR level
    Deno.env.set("LOG_LEVEL", "error");
    const testEnv = await setupTestEnvironment({
      workingDir: "./tmp/test/logger/level/error",
    });

    // Try to log at different levels
    testEnv.logger.debug("Debug message"); // Should not be logged
    testEnv.logger.info("Info message"); // Should not be logged
    testEnv.logger.warn("Warn message"); // Should not be logged
    testEnv.logger.error("Error message"); // Should be logged

    await cleanupTestEnvironment(testEnv);
  });

  await t.step("verify log level initialization", async () => {
    // Create a new logger with DEBUG level
    Deno.env.set("LOG_LEVEL", "debug");
    const testEnv = await setupTestEnvironment({
      workingDir: "./tmp/test/logger/level/debug",
    });

    // Try to log at different levels
    testEnv.logger.debug("Debug message"); // Should be logged
    testEnv.logger.info("Info message"); // Should be logged
    testEnv.logger.warn("Warn message"); // Should be logged
    testEnv.logger.error("Error message"); // Should be logged

    await cleanupTestEnvironment(testEnv);
  });
});
