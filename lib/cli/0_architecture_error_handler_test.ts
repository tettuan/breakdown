/**
 * Architecture tests for Error Handler
 *
 * Tests architectural constraints and dependencies:
 * - Function structure and responsibility boundaries
 * - Error handling architecture
 * - Dependency management
 * - Separation of concerns
 * - Single responsibility principle
 *
 * @module cli/error_handler_architecture_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  analyzeErrorSeverity,
  ErrorSeverity,
  extractErrorMessage,
  formatError,
  handleTwoParamsError,
  isTestingErrorHandling,
} from "./error_handler.ts";

const logger = new BreakdownLogger("error-handler-architecture");

describe("Architecture: Error Handler Module Structure", () => {
  it("should export required public interfaces", () => {
    logger.debug("Testing module exports");

    // Required enum export
    assertExists(ErrorSeverity, "ErrorSeverity enum must be exported");
    assertEquals(typeof ErrorSeverity, "object", "ErrorSeverity must be an enum object");
    assertExists(ErrorSeverity.CRITICAL, "CRITICAL severity must exist");
    assertExists(ErrorSeverity.WARNING, "WARNING severity must exist");
    assertEquals(ErrorSeverity.CRITICAL, "critical", "CRITICAL should have string value");
    assertEquals(ErrorSeverity.WARNING, "warning", "WARNING should have string value");

    // Required function exports
    assertExists(analyzeErrorSeverity, "analyzeErrorSeverity function must be exported");
    assertExists(extractErrorMessage, "extractErrorMessage function must be exported");
    assertExists(formatError, "formatError function must be exported");
    assertExists(isTestingErrorHandling, "isTestingErrorHandling function must be exported");
    assertExists(handleTwoParamsError, "handleTwoParamsError function must be exported");

    // Function types
    assertEquals(
      typeof analyzeErrorSeverity,
      "function",
      "analyzeErrorSeverity must be a function",
    );
    assertEquals(typeof extractErrorMessage, "function", "extractErrorMessage must be a function");
    assertEquals(typeof formatError, "function", "formatError must be a function");
    assertEquals(
      typeof isTestingErrorHandling,
      "function",
      "isTestingErrorHandling must be a function",
    );
    assertEquals(
      typeof handleTwoParamsError,
      "function",
      "handleTwoParamsError must be a function",
    );

    logger.debug("Module exports verification completed");
  });

  it("should maintain proper function signatures", () => {
    logger.debug("Testing function signatures");

    // analyzeErrorSeverity signature
    assertEquals(
      analyzeErrorSeverity.length,
      1,
      "analyzeErrorSeverity should take exactly 1 parameter",
    );

    // extractErrorMessage signature
    assertEquals(
      extractErrorMessage.length,
      1,
      "extractErrorMessage should take exactly 1 parameter",
    );

    // formatError signature
    assertEquals(
      formatError.length,
      2,
      "formatError should take exactly 2 parameters (second is optional)",
    );

    // isTestingErrorHandling signature
    assertEquals(
      isTestingErrorHandling.length,
      1,
      "isTestingErrorHandling should take exactly 1 parameter",
    );

    // handleTwoParamsError signature
    assertEquals(
      handleTwoParamsError.length,
      2,
      "handleTwoParamsError should take exactly 2 parameters",
    );

    logger.debug("Function signatures verification completed");
  });

  it("should follow single responsibility principle", () => {
    logger.debug("Testing single responsibility principle");

    // Each function should have a focused responsibility
    const analyzeString = analyzeErrorSeverity.toString();
    assertEquals(
      analyzeString.includes("severity") || analyzeString.includes("CRITICAL") ||
        analyzeString.includes("WARNING") ||
        analyzeString.includes("critical") || analyzeString.includes("warning"),
      true,
      "analyzeErrorSeverity should focus on severity analysis",
    );
    assertEquals(
      analyzeString.includes("console.log") || analyzeString.includes("console.warn"),
      false,
      "analyzeErrorSeverity should not handle output/logging",
    );

    const extractString = extractErrorMessage.toString();
    assertEquals(
      extractString.includes("message") || extractString.includes("string"),
      true,
      "extractErrorMessage should focus on message extraction",
    );
    assertEquals(
      extractString.includes("severity") || extractString.includes("console"),
      false,
      "extractErrorMessage should not handle severity or logging",
    );

    const formatString = formatError.toString();
    assertEquals(
      formatString.includes("format") || formatString.includes("String"),
      true,
      "formatError should focus on formatting",
    );
    assertEquals(
      formatString.includes("severity") || formatString.includes("console"),
      false,
      "formatError should not handle severity or logging",
    );

    logger.debug("Single responsibility principle verification completed");
  });

  it("should manage external dependencies properly", () => {
    logger.debug("Testing external dependency management");

    // Check for expected imports in function implementations
    const analyzeString = analyzeErrorSeverity.toString();
    const extractString = extractErrorMessage.toString();
    const handleString = handleTwoParamsError.toString();

    // Should reference unified error types
    assertEquals(
      extractString.includes("extractUnifiedErrorMessage") ||
        extractString.includes("UnifiedError"),
      true,
      "extractErrorMessage should integrate with unified error types",
    );

    // Should not directly import heavy dependencies
    assertEquals(
      analyzeString.includes("import(") || analyzeString.includes("require("),
      false,
      "Functions should not perform dynamic imports",
    );

    // Should handle type imports properly (check if types are used)
    assertEquals(
      handleString.includes("TwoParamsHandlerError") || handleString.includes("kind"),
      true,
      "handleTwoParamsError should work with typed errors",
    );

    logger.debug("External dependency management verification completed");
  });
});

describe("Architecture: Error Processing Design", () => {
  it("should separate error analysis from error handling", () => {
    logger.debug("Testing error analysis/handling separation");

    // analyzeErrorSeverity should only analyze, not handle
    const analyzeString = analyzeErrorSeverity.toString();
    assertEquals(
      analyzeString.includes("return") && analyzeString.includes("ErrorSeverity"),
      true,
      "analyzeErrorSeverity should return severity analysis",
    );
    assertEquals(
      analyzeString.includes("console.") || analyzeString.includes("process.exit"),
      false,
      "analyzeErrorSeverity should not perform handling actions",
    );

    // handleTwoParamsError should orchestrate analysis and handling
    const handleString = handleTwoParamsError.toString();
    assertEquals(
      handleString.includes("analyzeErrorSeverity") || handleString.includes("severity"),
      true,
      "handleTwoParamsError should use error analysis",
    );
    assertEquals(
      handleString.includes("console.") || handleString.includes("warn") ||
        handleString.includes("log"),
      true,
      "handleTwoParamsError should perform actual handling",
    );

    logger.debug("Error analysis/handling separation verified");
  });

  it("should use consistent error type patterns", () => {
    logger.debug("Testing error type pattern consistency");

    // Functions should handle unknown error types consistently
    const analyzeString = analyzeErrorSeverity.toString();
    const extractString = extractErrorMessage.toString();
    const handleString = handleTwoParamsError.toString();

    // Should check for object type and "kind" property
    assertEquals(
      analyzeString.includes("typeof") && analyzeString.includes("object"),
      true,
      "analyzeErrorSeverity should check object type",
    );
    assertEquals(
      analyzeString.includes("kind"),
      true,
      "analyzeErrorSeverity should check for kind property",
    );

    // Should have fallback for non-standard errors
    assertEquals(
      extractString.includes("String(") || extractString.includes("string"),
      true,
      "extractErrorMessage should have string fallback",
    );

    // Should validate error structure before processing
    assertEquals(
      handleString.includes("typeof") && handleString.includes("object") &&
        handleString.includes("kind"),
      true,
      "handleTwoParamsError should validate error structure",
    );

    logger.debug("Error type pattern consistency verified");
  });

  it("should maintain immutable error processing", () => {
    logger.debug("Testing immutable error processing");

    const testError = {
      kind: "WorkspaceError",
      type: "workspace_error",
      code: "TEST_ERROR",
      message: "test message",
    } as const;
    const originalError = JSON.stringify(testError);

    // Functions should not modify input errors
    const severity = analyzeErrorSeverity(testError as any);
    assertEquals(
      JSON.stringify(testError),
      originalError,
      "analyzeErrorSeverity should not modify input error",
    );

    const messageResult = extractErrorMessage(testError);
    assertEquals(
      JSON.stringify(testError),
      originalError,
      "extractErrorMessage should not modify input error",
    );

    const formattedResult = formatError(testError);
    assertEquals(
      JSON.stringify(testError),
      originalError,
      "formatError should not modify input error",
    );

    // Verify processing results
    assertExists(severity, "Should return severity analysis");
    assertEquals(
      severity.kind === "critical" || severity.kind === "warning",
      true,
      "Should return valid severity",
    );

    assertEquals(messageResult.ok, true, "Should successfully extract message");
    if (messageResult.ok) {
      assertExists(messageResult.data, "Should return extracted message");
    }

    assertEquals(formattedResult.ok, true, "Should successfully format error");
    if (formattedResult.ok) {
      assertExists(formattedResult.data, "Should return formatted error");
    }

    logger.debug("Immutable error processing verified");
  });
});

describe("Architecture: Configuration Integration", () => {
  it("should integrate with configuration system properly", () => {
    logger.debug("Testing configuration integration");

    // isTestingErrorHandling should analyze config structure
    const testingString = isTestingErrorHandling.toString();
    assertEquals(
      testingString.includes("config") && testingString.includes("object"),
      true,
      "isTestingErrorHandling should validate config object",
    );
    assertEquals(
      testingString.includes("app_prompt") && testingString.includes("base_dir"),
      true,
      "isTestingErrorHandling should check specific config structure",
    );

    // handleTwoParamsError should use config for context
    const handleString = handleTwoParamsError.toString();
    assertEquals(
      handleString.includes("config") && handleString.includes("isTestingErrorHandling"),
      true,
      "handleTwoParamsError should use config context",
    );

    // Should not modify configuration
    interface ArchitectureTestConfig {
      readonly app_prompt: { readonly base_dir: string };
    }

    const testConfig: ArchitectureTestConfig = { app_prompt: { base_dir: "/test" } };
    const originalConfig = JSON.stringify(testConfig);

    const testingResult = isTestingErrorHandling(testConfig);
    assertEquals(
      JSON.stringify(testConfig),
      originalConfig,
      "isTestingErrorHandling should not modify config",
    );

    // Verify result structure
    assertEquals(testingResult.ok, true, "Should return valid result");
    assertEquals(typeof testingResult.isValid, "boolean", "Should have isValid property");
    assertEquals(
      typeof testingResult.isTestScenario,
      "boolean",
      "Should have isTestScenario property",
    );

    logger.debug("Configuration integration verified");
  });

  it("should handle configuration edge cases", () => {
    logger.debug("Testing configuration edge case handling");

    // Should handle null/undefined config
    const nullResult = isTestingErrorHandling(null as any);
    assertEquals(nullResult.ok, true, "Should handle null config");
    assertEquals(nullResult.isValid, false, "Null config should be invalid");
    assertEquals(nullResult.isTestScenario, false, "Null config should not be test scenario");

    const undefinedResult = isTestingErrorHandling(undefined as any);
    assertEquals(undefinedResult.ok, true, "Should handle undefined config");
    assertEquals(undefinedResult.isValid, false, "Undefined config should be invalid");
    assertEquals(
      undefinedResult.isTestScenario,
      false,
      "Undefined config should not be test scenario",
    );

    // Should handle malformed config
    const emptyResult = isTestingErrorHandling({} as any);
    assertEquals(emptyResult.ok, true, "Should handle empty config");
    assertEquals(emptyResult.isValid, false, "Empty config should be invalid");
    assertEquals(emptyResult.isTestScenario, false, "Empty config should not be test scenario");

    const malformedResult = isTestingErrorHandling({ app_prompt: null } as any);
    assertEquals(malformedResult.ok, true, "Should handle malformed config");
    assertEquals(malformedResult.isValid, false, "Malformed config should be invalid");
    assertEquals(
      malformedResult.isTestScenario,
      false,
      "Malformed config should not be test scenario",
    );

    // Should handle non-object config
    const invalidResult = isTestingErrorHandling("invalid" as any);
    assertEquals(invalidResult.ok, true, "Should handle non-object config");
    assertEquals(invalidResult.isValid, false, "Non-object config should be invalid");
    assertEquals(
      invalidResult.isTestScenario,
      false,
      "Non-object config should not be test scenario",
    );

    logger.debug("Configuration edge case handling verified");
  });
});

describe("Architecture: Error Severity Classification", () => {
  it("should maintain consistent severity classification logic", () => {
    logger.debug("Testing severity classification consistency");

    const analyzeString = analyzeErrorSeverity.toString();

    // Should have clear classification criteria
    assertEquals(
      (analyzeString.includes("CRITICAL") && analyzeString.includes("WARNING")) ||
        (analyzeString.includes("critical") && analyzeString.includes("warning")),
      true,
      "Should classify errors into CRITICAL and WARNING",
    );

    // Should have specific patterns for critical errors
    assertEquals(
      analyzeString.includes("nonexistent") || analyzeString.includes("permission") ||
        analyzeString.includes("critical"),
      true,
      "Should have specific patterns for critical errors",
    );

    // Should default to appropriate severity
    assertEquals(
      analyzeString.includes("return ErrorSeverity.CRITICAL") ||
        analyzeString.includes('kind: "critical"'),
      true,
      "Should have appropriate default severity",
    );

    // Should handle PromptGenerationError specifically
    assertEquals(
      analyzeString.includes("PromptGenerationError"),
      true,
      "Should handle PromptGenerationError classification",
    );

    logger.debug("Severity classification consistency verified");
  });

  it("should maintain classification stability", () => {
    logger.debug("Testing classification stability");

    // Same error should always produce same severity
    const testError = { kind: "PromptGenerationError", error: "test error" } as const;

    const severity1 = analyzeErrorSeverity(testError as any);
    const severity2 = analyzeErrorSeverity(testError as any);

    assertEquals(
      severity1.kind,
      severity2.kind,
      "Same error should produce consistent severity classification",
    );

    // Unknown errors should have predictable classification
    const unknownError = { kind: "PromptGenerationError", error: "unknown error" } as const;
    const unknownSeverity = analyzeErrorSeverity(unknownError as any);

    assertEquals(
      ["critical", "warning"].includes(unknownSeverity.kind),
      true,
      "Unknown errors should map to valid severity level",
    );

    logger.debug("Classification stability verified");
  });
});
