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

import { assertEquals, assertThrows } from "$std/testing/asserts.ts";
import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";
import { setupTestEnvironment, cleanupTestEnvironment } from "../helpers/setup.ts";

const TEST_ENV = await setupTestEnvironment();

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(TEST_ENV);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Basic logging tests
Deno.test("logger - initialization with different levels", () => {
  const debugLogger = new BreakdownLogger({ initialLevel: LogLevel.DEBUG });
  const infoLogger = new BreakdownLogger({ initialLevel: LogLevel.INFO });
  const warnLogger = new BreakdownLogger({ initialLevel: LogLevel.WARN });
  const errorLogger = new BreakdownLogger({ initialLevel: LogLevel.ERROR });
  
  // Test initial log levels
  debugLogger.debug("Debug message");
  infoLogger.info("Info message");
  warnLogger.warn("Warning message");
  errorLogger.error("Error message");
  
  // Test log level changes
  debugLogger.setLogLevel(LogLevel.INFO);
  infoLogger.setLogLevel(LogLevel.WARN);
  warnLogger.setLogLevel(LogLevel.ERROR);
  errorLogger.setLogLevel(LogLevel.DEBUG);
});

// Environment variable control tests
Deno.test("logger - environment variable control", () => {
  // Set environment variable
  Deno.env.set("LOG_LEVEL", "DEBUG");
  
  const logger = new BreakdownLogger();
  logger.debug("Debug message should be logged");
  
  // Test case insensitive level
  Deno.env.set("LOG_LEVEL", "warn");
  const warnLogger = new BreakdownLogger();
  warnLogger.warn("Warning message should be logged");
  
  // Clean up
  Deno.env.delete("LOG_LEVEL");
});

// Message formatting tests
Deno.test("logger - message formatting", () => {
  const logger = new BreakdownLogger({ initialLevel: LogLevel.DEBUG });
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
  logger.info(testMessage);
  assertEquals(capturedOutput.includes(testMessage), true);
  assertEquals(capturedOutput.includes("[INFO]"), true);
  
  // Test warning message
  logger.warn("Test warning message");
  assertEquals(capturedOutput.includes("Test warning message"), true);
  assertEquals(capturedOutput.includes("[WARN]"), true);
  
  // Test error message with string
  logger.error("Test error message");
  assertEquals(capturedOutput.includes("Test error message"), true);
  assertEquals(capturedOutput.includes("[ERROR]"), true);
  
  // Restore console
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Structured data tests
Deno.test("logger - structured data formatting", () => {
  const logger = new BreakdownLogger({ initialLevel: LogLevel.DEBUG });
  
  // Test nested object
  logger.info("Nested object", {
    user: {
      id: 123,
      profile: {
        name: "Test User",
        settings: {
          theme: "dark",
          notifications: true
        }
      }
    }
  });
  
  // Test array data
  logger.warn("Array data", {
    items: [1, 2, 3],
    tags: ["test", "debug", "development"]
  });
  
  // Test special characters
  logger.error("Special characters", {
    message: "Error: Invalid character 'あいうえお' in input",
    path: "C:\\Program Files\\App\\data.txt",
    symbols: "!@#$%^&*()"
  });
});

// Error handling tests
Deno.test("logger - error handling", () => {
  const logger = new BreakdownLogger({ initialLevel: LogLevel.ERROR });
  
  // Test with string messages
  logger.error("Standard error message");
  logger.error("Another error message");
  
  // Test with structured error message
  logger.error("Error occurred", {
    code: "ERR_001",
    details: "Additional error details"
  });
  
  // No assertions needed as we're just verifying it doesn't throw
}); 