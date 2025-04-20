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

import { assertEquals } from "jsr:@std/assert";
import { LogLevel } from "@tettuan/breakdownlogger";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironment,
} from "$test/helpers/setup.ts";

let env: TestEnvironment;

// Setup before tests
Deno.test({
  name: "setup",
  fn: async () => {
    env = await setupTestEnvironment({
      workingDir: "./tmp/test/logger",
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Basic logging tests
Deno.test("logger - basic functionality", () => {
  env.logger.setLogLevel(LogLevel.DEBUG);
  env.logger.debug("Debug message");
  env.logger.info("Info message");
  env.logger.warn("Warning message");
  env.logger.error("Error message");
});

// Message formatting tests
Deno.test("logger - message formatting", () => {
  env.logger.setLogLevel(LogLevel.DEBUG);
  const testMessage = "Test message";

  // Capture console output
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  let capturedOutput = "";

  console.log = (message: string) => {
    capturedOutput = message;
  };
  console.error = (message: string) => {
    capturedOutput = message;
  };

  // Test info message
  env.logger.info(testMessage);
  assertEquals(capturedOutput.includes(testMessage), true);
  assertEquals(capturedOutput.includes("[INFO]"), true);

  // Test warning message
  env.logger.warn("Test warning message");
  assertEquals(capturedOutput.includes("Test warning message"), true);
  assertEquals(capturedOutput.includes("[WARN]"), true);

  // Test error message with string
  env.logger.error("Test error message");
  assertEquals(capturedOutput.includes("Test error message"), true);
  assertEquals(capturedOutput.includes("[ERROR]"), true);

  // Restore console
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Structured data tests
Deno.test("logger - structured data formatting", () => {
  env.logger.setLogLevel(LogLevel.DEBUG);

  // Test nested object
  env.logger.info("Nested object", {
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
  env.logger.warn("Array data", {
    items: [1, 2, 3],
    tags: ["test", "debug", "development"],
  });

  // Test special characters
  env.logger.error("Special characters", {
    message: "Error: Invalid character 'あいうえお' in input",
    path: "C:\\Program Files\\App\\data.txt",
    symbols: "!@#$%^&*()",
  });
});

// Error handling tests
Deno.test("logger - error handling", () => {
  env.logger.setLogLevel(LogLevel.ERROR);

  // Test with string messages
  env.logger.error("Standard error message");
  env.logger.error("Another error message");

  // Test with structured error message
  env.logger.error("Error occurred", {
    code: "ERR_001",
    details: "Additional error details",
  });
});

// Log level configuration tests
Deno.test("logger - log level configuration", () => {
  env.logger.setLogLevel(LogLevel.DEBUG);

  // Test different log levels
  env.logger.debug("Debug message", { level: "debug" });
  env.logger.info("Info message", { level: "info" });
  env.logger.warn("Warning message", { level: "warn" });
  env.logger.error("Error message", { level: "error" });
});

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(env);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
