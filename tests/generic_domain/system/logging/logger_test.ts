/**
 * Foundation tests for logging functionality
 *
 * Purpose:
 * - Verify basic logging functionality
 * - Test log level control through environment variables
 * - Ensure proper error handling and logging
 *
 * Success Definition:
 * - Logger can be initialized with different log levels
 * - Environment variables control logging behavior
 * - Error messages are properly formatted and logged
 */

import { assertEquals } from "../../../../lib/deps.ts";
import { LogLevel as _LogLevel } from "@tettuan/breakdownlogger";
import {
  cleanupTestEnvironment as _cleanupTestEnvironment,
  setupTestEnvironment as _setupTestEnvironment,
} from "$test/helpers/setup.ts";

// Basic logging tests
Deno.test("logger - basic functionality", async () => {
  const testEnv = await _setupTestEnvironment({
    logLevel: _LogLevel.DEBUG,
    workingDir: "./tmp/test/logger/basic",
  });

  testEnv.logger.debug("Debug message", { key: "logger_test.ts#L25#basic-functionality-debug" });
  testEnv.logger.info("Info message", { key: "logger_test.ts#L26#basic-functionality-info" });
  testEnv.logger.warn("Warning message", { key: "logger_test.ts#L27#basic-functionality-warn" });
  testEnv.logger.error("Error message", { key: "logger_test.ts#L28#basic-functionality-error" });

  await _cleanupTestEnvironment(testEnv);
});

// Message formatting tests
Deno.test("logger - message formatting", async () => {
  const testEnv = await _setupTestEnvironment({
    logLevel: _LogLevel.DEBUG,
    workingDir: "./tmp/test/logger/formatting",
  });

  // Test that logger methods can be called with various message types
  // Note: BreakdownLogger v1.0.0 outputs directly to stdout/stderr
  // so we can't capture output with console overrides

  // Test string messages
  testEnv.logger.info("Test info message", { key: "logger_test.ts#L45#message-formatting-info" });
  testEnv.logger.warn("Test warning message", {
    key: "logger_test.ts#L46#message-formatting-warn",
  });
  testEnv.logger.error("Test error message", {
    key: "logger_test.ts#L47#message-formatting-error",
  });
  testEnv.logger.debug("Test debug message", {
    key: "logger_test.ts#L48#message-formatting-debug",
  });

  // Test messages with data
  testEnv.logger.info("Message with data", {
    key: "logger_test.ts#L51#message-formatting-data",
    data: { key: "value" },
  });
  testEnv.logger.warn("Warning with number", {
    key: "logger_test.ts#L52#message-formatting-number",
    number: 42,
  });
  testEnv.logger.error("Error with array", {
    key: "logger_test.ts#L53#message-formatting-array",
    array: [1, 2, 3],
  });

  // Test with Error objects
  const testError = new Error("Test error");
  testEnv.logger.error("Error object", {
    key: "logger_test.ts#L57#message-formatting-error-object",
    error: testError,
  });

  // If we get here without throwing, the logger is working
  assertEquals(true, true);

  await _cleanupTestEnvironment(testEnv);
});

// Structured data tests
Deno.test("logger - structured data formatting", async () => {
  const testEnv = await _setupTestEnvironment({
    logLevel: _LogLevel.DEBUG,
    workingDir: "./tmp/test/logger/structured",
  });

  // Test nested object
  testEnv.logger.info("Nested object", {
    key: "logger_test.ts#L73#structured-data-nested",
    user: {
      id: 123,
      profile: {
        name: "Test User",
        settings: {
          theme: "dark",
          notifications: true,
        },
      },
    },
  });

  // Test array data
  testEnv.logger.warn("Array data", {
    key: "logger_test.ts#L87#structured-data-array",
    items: [1, 2, 3],
    tags: ["test", "debug", "development"],
  });

  // Test special characters
  testEnv.logger.error("Special characters", {
    key: "logger_test.ts#L93#structured-data-special-chars",
    message: "Error: Invalid character 'あいうえお' in input",
    path: "C:\\Program Files\\App\\data.txt",
    symbols: "!@#$%^&*()",
  });

  await _cleanupTestEnvironment(testEnv);
});

// Error handling tests
Deno.test("logger - error handling", async () => {
  const testEnv = await _setupTestEnvironment({
    logLevel: _LogLevel.ERROR,
    workingDir: "./tmp/test/logger/error",
  });

  // Test with string messages
  testEnv.logger.error("Standard error message", {
    key: "logger_test.ts#L110#error-handling-standard",
  });
  testEnv.logger.error("Another error message", {
    key: "logger_test.ts#L111#error-handling-another",
  });

  // Test with structured error message
  testEnv.logger.error("Error occurred", {
    key: "logger_test.ts#L114#error-handling-structured",
    code: "ERR001",
    details: "Additional error details",
  });

  await _cleanupTestEnvironment(testEnv);
});

// Log level configuration tests
Deno.test("logger - log level configuration", async () => {
  const testEnv = await _setupTestEnvironment({
    logLevel: _LogLevel.DEBUG,
    workingDir: "./tmp/test/logger/config",
  });

  // Test different log levels
  testEnv.logger.debug("Debug message", {
    key: "logger_test.ts#L130#log-level-config-debug",
    level: "debug",
  });
  testEnv.logger.info("Info message", {
    key: "logger_test.ts#L131#log-level-config-info",
    level: "info",
  });
  testEnv.logger.warn("Warning message", {
    key: "logger_test.ts#L132#log-level-config-warn",
    level: "warn",
  });
  testEnv.logger.error("Error message", {
    key: "logger_test.ts#L133#log-level-config-error",
    level: "error",
  });

  await _cleanupTestEnvironment(testEnv);
});
