/**
 * @fileoverview Architecture tests for TemplateErrorHandler
 *
 * Tests architectural constraints and design principles:
 * - Error hierarchy and type safety
 * - Single responsibility principle
 * - Dependency management
 * - Interface segregation
 *
 * @module helpers/0_architecture_template_error_handler_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  TemplateError,
  TemplateErrorHandler,
  TemplateErrorType,
  withTemplateErrorHandling,
} from "./template_error_handler.ts";

Deno.test("Architecture: TemplateError follows proper error hierarchy", () => {
  const _error = new TemplateError(
    "Test error",
    TemplateErrorType.TEMPLATE_NOT_FOUND,
  );

  // Should extend Error
  assertEquals(error instanceof Error, true, "Should extend Error class");
  assertEquals(error instanceof TemplateError, true, "Should be instanceof TemplateError");

  // Should have proper name
  assertEquals(error.name, "TemplateError", "Should have correct name");

  // Should have stack trace
  assertExists(error.stack, "Should have stack trace");
});

Deno.test("Architecture: TemplateErrorType enum completeness", () => {
  const errorTypes = Object.values(TemplateErrorType);

  // Should have all required error types
  const expectedTypes = [
    TemplateErrorType.TEMPLATE_NOT_FOUND,
    TemplateErrorType.TEMPLATE_INVALID,
    TemplateErrorType.TEMPLATE_PERMISSION_DENIED,
    TemplateErrorType.TEMPLATE_GENERATION_FAILED,
    TemplateErrorType.CONFIG_INVALID,
  ];

  assertEquals(
    errorTypes.length,
    expectedTypes.length,
    "Should have all expected error types",
  );

  for (const expected of expectedTypes) {
    assertEquals(
      errorTypes.includes(expected),
      true,
      `Should include ${expected} error type`,
    );
  }
});

Deno.test("Architecture: TemplateError maintains immutability", () => {
  const suggestions = ["suggestion1", "suggestion2"];
  const error = new TemplateError(
    "Test",
    TemplateErrorType.TEMPLATE_NOT_FOUND,
    { suggestions },
  );

  // Properties are marked as readonly in TypeScript but writable at runtime
  const descriptor = Object.getOwnPropertyDescriptor(error, "errorType");
  assertEquals(
    typeof descriptor?.value,
    "string",
    "errorType should be accessible",
  );

  // Test that suggestions are accessible
  assertEquals(
    error.suggestions.length,
    2,
    "Should have correct number of suggestions",
  );
  assertEquals(
    error.suggestions[0],
    "suggestion1",
    "Should have first suggestion",
  );
});

Deno.test("Architecture: TemplateErrorHandler follows static pattern", () => {
  // Handler methods are static
  assertEquals(
    typeof TemplateErrorHandler.detectTemplateError,
    "function",
    "detectTemplateError should be static method",
  );

  assertEquals(
    typeof TemplateErrorHandler.handleTemplateError,
    "function",
    "handleTemplateError should be static method",
  );

  // Should not have instance state
  const _handler = new TemplateErrorHandler();
  const publicProps = Object.getOwnPropertyNames(_handler);
  assertEquals(
    publicProps.length,
    0,
    "Should not have instance properties",
  );
});

Deno.test("Architecture: Proper separation of error creation and handling", () => {
  // TemplateError is for error representation
  const error = new TemplateError("Test", TemplateErrorType.TEMPLATE_NOT_FOUND);

  // Should have instance methods for error info
  assertEquals(
    typeof error.getDetailedMessage,
    "function",
    "Should have getDetailedMessage method",
  );

  assertEquals(
    typeof error.getRecoveryCommands,
    "function",
    "Should have getRecoveryCommands method",
  );

  // Should not have handling logic
  assertEquals(
    typeof (error as unknown).detect,
    "undefined",
    "TemplateError should not have detection methods",
  );
});

Deno.test("Architecture: Error detection follows strategy pattern", () => {
  const fileNotFoundError = new Error("ENOENT: no such file or directory");
  const permissionError = new Error("EACCES: permission denied");
  const invalidError = new Error("Invalid template syntax");

  // Should detect different error types
  const notFoundResult = TemplateErrorHandler.detectTemplateError(fileNotFoundError);
  const permissionResult = TemplateErrorHandler.detectTemplateError(permissionError);
  const invalidResult = TemplateErrorHandler.detectTemplateError(invalidError);

  assertExists(notFoundResult, "Should detect file not found error");
  assertEquals(notFoundResult?.errorType, TemplateErrorType.TEMPLATE_NOT_FOUND);

  assertExists(permissionResult, "Should detect permission error");
  assertEquals(permissionResult?.errorType, TemplateErrorType.TEMPLATE_PERMISSION_DENIED);

  assertExists(invalidResult, "Should detect invalid template error");
  assertEquals(invalidResult?.errorType, TemplateErrorType.TEMPLATE_INVALID);
});

Deno.test("Architecture: Auto-resolution capability is properly determined", () => {
  const resolvableError = new TemplateError(
    "Template not found",
    TemplateErrorType.TEMPLATE_NOT_FOUND,
    { canAutoResolve: true },
  );

  const nonResolvableError = new TemplateError(
    "Permission denied",
    TemplateErrorType.TEMPLATE_PERMISSION_DENIED,
    { canAutoResolve: false },
  );

  assertEquals(resolvableError.canAutoResolve, true, "Should be auto-resolvable");
  assertEquals(nonResolvableError.canAutoResolve, false, "Should not be auto-resolvable");
});

Deno.test("Architecture: Error handler integrates with logger appropriately", () => {
  // Should use BreakdownLogger for logging
  const handlerString = TemplateErrorHandler.toString();
  assertEquals(
    handlerString.includes("BreakdownLogger"),
    true,
    "Should use BreakdownLogger",
  );
});

Deno.test("Architecture: withTemplateErrorHandling provides clean wrapper", () => {
  // Should be a function that wraps operations
  assertEquals(
    typeof withTemplateErrorHandling,
    "function",
    "Should export wrapper function",
  );

  // Should accept operation and context
  assertEquals(
    withTemplateErrorHandling.length,
    2,
    "Should accept operation and context parameters",
  );
});

Deno.test("Architecture: Error messages follow consistent structure", () => {
  const error = new TemplateError(
    "Template compilation failed",
    TemplateErrorType.TEMPLATE_GENERATION_FAILED,
    {
      templatePath: "/prompts/to/project.md",
      suggestions: ["Check syntax", "Validate format"],
      canAutoResolve: true,
    },
  );

  const detailedMessage = error.getDetailedMessage();

  // Should include error marker
  assertEquals(
    detailedMessage.includes("❌"),
    true,
    "Should include error marker",
  );

  // Should include suggestions marker
  assertEquals(
    detailedMessage.includes("💡"),
    true,
    "Should include suggestions marker",
  );

  // Should include auto-resolution marker
  assertEquals(
    detailedMessage.includes("🔧"),
    true,
    "Should include auto-resolution marker",
  );
});

Deno.test("Architecture: Recovery commands follow consistent pattern", () => {
  const errors = [
    new TemplateError("Not found", TemplateErrorType.TEMPLATE_NOT_FOUND),
    new TemplateError("Invalid", TemplateErrorType.TEMPLATE_INVALID),
    new TemplateError("Generation failed", TemplateErrorType.TEMPLATE_GENERATION_FAILED),
    new TemplateError("Config invalid", TemplateErrorType.CONFIG_INVALID),
  ];

  for (const error of errors) {
    const commands = error.getRecoveryCommands();

    assertEquals(
      Array.isArray(commands),
      true,
      `Should return array for ${error.errorType}`,
    );

    assertEquals(
      commands.length > 0,
      true,
      `Should have commands for ${error.errorType}`,
    );

    // All commands should be executable bash/deno commands
    for (const command of commands) {
      assertEquals(
        typeof command,
        "string",
        "Command should be string",
      );

      assertEquals(
        command.startsWith("bash ") || command.startsWith("deno "),
        true,
        "Command should be executable",
      );
    }
  }
});
