/**
 * Behavior tests for Error Handler
 *
 * Tests functional behavior and business logic:
 * - Error severity analysis behavior
 * - Error message extraction behavior
 * - Error formatting behavior
 * - Configuration-based error handling
 * - Edge case handling
 *
 * @module cli/error_handler_behavior_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { 
  ErrorSeverity,
  analyzeErrorSeverity,
  extractErrorMessage,
  formatError,
  isTestingErrorHandling,
  handleTwoParamsError
} from "./error_handler.ts";

const logger = new BreakdownLogger("error-handler-behavior");

describe("Behavior: Error Severity Analysis", () => {
  it("should classify critical path errors as CRITICAL", () => {
    logger.debug("Testing critical error classification");

    const criticalErrors = [
      { kind: "PromptGenerationError", error: "Path /nonexistent/dir not found" },
      { kind: "PromptGenerationError", error: "nonexistent file access" },
      { kind: "PromptGenerationError", error: "absolute path required" },
      { kind: "PromptGenerationError", error: "permission denied on file" },
      { kind: "PromptGenerationError", error: "access denied to directory" },
      { kind: "PromptGenerationError", error: "Invalid configuration detected" },
      { kind: "PromptGenerationError", error: "critical system failure" },
      { kind: "PromptGenerationError", error: "fatal error occurred" },
    ];

    for (const error of criticalErrors) {
      const severity = analyzeErrorSeverity(error);
      assertEquals(
        severity,
        ErrorSeverity.CRITICAL,
        `Should classify as CRITICAL: ${error.error}`,
      );
    }

    logger.debug("Critical error classification completed");
  });

  it("should classify non-critical PromptGenerationError as WARNING", () => {
    logger.debug("Testing warning error classification");

    const warningErrors = [
      { kind: "PromptGenerationError", error: "Template not found, using default" },
      { kind: "PromptGenerationError", error: "Minor parsing issue in config" },
      { kind: "PromptGenerationError", error: "Optional parameter missing" },
      { kind: "PromptGenerationError", error: "Deprecated feature used" },
    ];

    for (const error of warningErrors) {
      const severity = analyzeErrorSeverity(error);
      assertEquals(
        severity,
        ErrorSeverity.WARNING,
        `Should classify as WARNING: ${error.error}`,
      );
    }

    logger.debug("Warning error classification completed");
  });

  it("should classify unknown error types as CRITICAL", () => {
    logger.debug("Testing unknown error classification");

    const unknownErrors = [
      null,
      undefined,
      "string error",
      123,
      { message: "no kind property" },
      { kind: "UnknownErrorType", error: "unknown error" },
      { kind: "", error: "empty kind" },
    ];

    for (const error of unknownErrors) {
      const severity = analyzeErrorSeverity(error);
      assertEquals(
        severity,
        ErrorSeverity.CRITICAL,
        `Should classify unknown error as CRITICAL: ${JSON.stringify(error)}`,
      );
    }

    logger.debug("Unknown error classification completed");
  });

  it("should handle nested error structures", () => {
    logger.debug("Testing nested error structure handling");

    const nestedError = {
      kind: "PromptGenerationError",
      error: {
        message: "permission denied on critical file",
        details: { path: "/nonexistent/path", code: "ENOENT" }
      }
    };

    const severity = analyzeErrorSeverity(nestedError);
    assertEquals(
      severity,
      ErrorSeverity.CRITICAL,
      "Should handle nested error structures and extract critical indicators",
    );

    logger.debug("Nested error structure handling completed");
  });
});

describe("Behavior: Error Message Extraction", () => {
  it("should extract messages from string errors", () => {
    logger.debug("Testing string error message extraction");

    const stringError = "Simple error message";
    const message = extractErrorMessage(stringError);
    
    assertEquals(
      message,
      stringError,
      "Should return string errors as-is",
    );

    logger.debug("String error message extraction completed");
  });

  it("should extract messages from object errors", () => {
    logger.debug("Testing object error message extraction");

    const objectErrors = [
      { message: "Error message from message property" },
      { error: "Error message from error property" },
      { msg: "Message from non-standard property" },
      { kind: "TestError", message: "Structured error message" },
    ];

    const expectedMessages = [
      "Error message from message property",
      "Error message from error property",
      '{"msg":"Message from non-standard property"}', // JSON fallback
      "Structured error message",
    ];

    for (let i = 0; i < objectErrors.length; i++) {
      const message = extractErrorMessage(objectErrors[i]);
      assertEquals(
        message,
        expectedMessages[i],
        `Should extract correct message from object error ${i}`,
      );
    }

    logger.debug("Object error message extraction completed");
  });

  it("should handle unified error types", () => {
    logger.debug("Testing unified error type message extraction");

    // Mock unified error (structure should match UnifiedError interface)
    const unifiedError = {
      kind: "ValidationError",
      message: "Unified error message",
      details: { field: "param1", value: "invalid" }
    };

    const message = extractErrorMessage(unifiedError);
    assertExists(message, "Should extract message from unified error");
    assertEquals(typeof message, "string", "Should return string message");

    // Should handle gracefully if unified error extraction fails
    const malformedUnified = {
      kind: "MalformedError"
      // Missing required properties
    };

    const fallbackMessage = extractErrorMessage(malformedUnified);
    assertExists(fallbackMessage, "Should provide fallback for malformed unified errors");

    logger.debug("Unified error type message extraction completed");
  });

  it("should handle null and undefined errors", () => {
    logger.debug("Testing null/undefined error handling");

    const nullMessage = extractErrorMessage(null);
    assertEquals(nullMessage, "null", "Should handle null error");

    const undefinedMessage = extractErrorMessage(undefined);
    assertEquals(undefinedMessage, "undefined", "Should handle undefined error");

    logger.debug("Null/undefined error handling completed");
  });

  it("should handle primitive type errors", () => {
    logger.debug("Testing primitive type error handling");

    const primitiveErrors = [
      42,
      true,
      false,
      Symbol("test"),
    ];

    for (const error of primitiveErrors) {
      const message = extractErrorMessage(error);
      assertEquals(typeof message, "string", `Should convert ${typeof error} to string`);
      assertExists(message, `Should provide message for ${typeof error}`);
    }

    logger.debug("Primitive type error handling completed");
  });
});

describe("Behavior: Error Formatting", () => {
  it("should format errors without kind prefix", () => {
    logger.debug("Testing error formatting without kind");

    const testErrors = [
      "Simple string error",
      { message: "Object error message" },
      { kind: "TestError", data: "test data" },
    ];

    for (const error of testErrors) {
      const formatted = formatError(error);
      assertExists(formatted, "Should return formatted error");
      assertEquals(typeof formatted, "string", "Should return string format");
      
      if (typeof error === "object" && error !== null && "kind" in error) {
        assertEquals(
          formatted.includes((error as any).kind),
          true,
          "Should include error kind in format for object errors",
        );
      }
    }

    logger.debug("Error formatting without kind completed");
  });

  it("should format errors with kind prefix", () => {
    logger.debug("Testing error formatting with kind prefix");

    const error = { message: "Test error message" };
    const kind = "ValidationError";
    
    const formatted = formatError(error, kind);
    
    assertEquals(
      formatted.startsWith(kind),
      true,
      "Should prefix with provided kind",
    );
    assertEquals(
      formatted.includes(":"),
      true,
      "Should separate kind and message with colon",
    );

    logger.debug("Error formatting with kind prefix completed");
  });

  it("should truncate long error objects", () => {
    logger.debug("Testing long error object truncation");

    const longError = {
      kind: "LongError",
      data: "a".repeat(300), // Very long data
      additionalInfo: "b".repeat(200)
    };

    const formatted = formatError(longError);
    
    assertEquals(
      formatted.length <= 250, // Should be truncated (200 char limit + kind info)
      true,
      "Should truncate long error objects",
    );
    assertEquals(
      formatted.includes("LongError"),
      true,
      "Should preserve error kind even after truncation",
    );

    logger.debug("Long error object truncation completed");
  });
});

describe("Behavior: Configuration Testing Detection", () => {
  it("should detect test error handling configuration", () => {
    logger.debug("Testing test configuration detection");

    interface ErrorTestConfig {
      readonly app_prompt: {
        readonly base_dir: string;
        readonly other_setting?: string;
      };
      readonly other_config?: string;
    }

    const testConfigs: ErrorTestConfig[] = [
      {
        app_prompt: {
          base_dir: "/nonexistent/path"
        }
      },
      {
        app_prompt: {
          base_dir: "/nonexistent/path",
          other_setting: "value"
        },
        other_config: "data"
      }
    ];

    for (const config of testConfigs) {
      const isTesting = isTestingErrorHandling(config);
      assertEquals(
        isTesting,
        true,
        `Should detect test configuration: ${JSON.stringify(config)}`,
      );
    }

    logger.debug("Test configuration detection completed");
  });

  it("should not detect non-test configurations", () => {
    logger.debug("Testing non-test configuration detection");

    const nonTestConfigs = [
      {
        app_prompt: {
          base_dir: "/real/path"
        }
      },
      {
        app_prompt: {
          base_dir: "/usr/local/lib"
        }
      },
      {
        other_config: "value"
      },
      {},
      null,
      undefined,
      "string config"
    ];

    for (const config of nonTestConfigs) {
      const isTesting = isTestingErrorHandling(config);
      assertEquals(
        isTesting,
        false,
        `Should not detect as test configuration: ${JSON.stringify(config)}`,
      );
    }

    logger.debug("Non-test configuration detection completed");
  });
});

describe("Behavior: Two Params Error Handling", () => {
  it("should handle PromptGenerationError with warning severity", () => {
    logger.debug("Testing PromptGenerationError warning handling");

    const warningError = {
      kind: "PromptGenerationError",
      error: "Template not found, using default"
    };

    const config = {
      app_prompt: { base_dir: "/real/path" }
    };

    // Capture console output
    let warnOutput = "";
    let logOutput = "";
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    console.warn = (msg: string) => { warnOutput += msg; };
    console.log = (msg: string) => { logOutput += msg; };

    try {
      const handled = handleTwoParamsError(warningError, config);
      
      assertEquals(handled, true, "Should handle warning-level PromptGenerationError");
      assertEquals(
        warnOutput.includes("⚠️"),
        true,
        "Should output warning icon",
      );
      assertEquals(
        logOutput.includes("✅"),
        true,
        "Should output success message with warnings",
      );
    } finally {
      console.warn = originalWarn;
      console.log = originalLog;
    }

    logger.debug("PromptGenerationError warning handling completed");
  });

  it("should not handle critical errors", () => {
    logger.debug("Testing critical error non-handling");

    const criticalError = {
      kind: "PromptGenerationError",
      error: "nonexistent path access denied"
    };

    const config = {
      app_prompt: { base_dir: "/real/path" }
    };

    const handled = handleTwoParamsError(criticalError, config);
    
    assertEquals(
      handled,
      false,
      "Should not handle critical errors - they should be thrown",
    );

    logger.debug("Critical error non-handling completed");
  });

  it("should not handle non-PromptGenerationError types", () => {
    logger.debug("Testing non-PromptGenerationError handling");

    const otherErrors = [
      { kind: "ValidationError", message: "validation failed" },
      { kind: "NetworkError", message: "connection failed" },
      "string error",
      null,
      { message: "no kind property" }
    ];

    const config = { app_prompt: { base_dir: "/real/path" } };

    for (const error of otherErrors) {
      const handled = handleTwoParamsError(error, config);
      assertEquals(
        handled,
        false,
        `Should not handle non-PromptGenerationError: ${JSON.stringify(error)}`,
      );
    }

    logger.debug("Non-PromptGenerationError handling completed");
  });

  it("should not handle errors in test configuration", () => {
    logger.debug("Testing test configuration error handling");

    const error = {
      kind: "PromptGenerationError",
      error: "Template not found"
    };

    const testConfig = {
      app_prompt: {
        base_dir: "/nonexistent/path"
      }
    };

    const handled = handleTwoParamsError(error, testConfig);
    
    assertEquals(
      handled,
      false,
      "Should not handle errors when in test configuration",
    );

    logger.debug("Test configuration error handling completed");
  });
});