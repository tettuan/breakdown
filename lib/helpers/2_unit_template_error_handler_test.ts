/**
 * @fileoverview Unit tests for TemplateErrorHandler
 *
 * Tests functional behavior and business logic:
 * - Error creation and handling
 * - Detection algorithms
 * - Auto-resolution logic
 * - Message formatting
 * - Edge cases and error scenarios
 *
 * @module helpers/2_unit_template_error_handler_test
 */

import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import {
  TemplateError,
  TemplateErrorHandler,
  TemplateErrorType,
  withTemplateErrorHandling,
} from "./template_error_handler.ts";

Deno.test("Unit: TemplateError creation with all options", async () => {
  const _cause = new Error("Original file system error");
  const error = new TemplateError(
    "Failed to load template",
    TemplateErrorType.TEMPLATE_NOT_FOUND,
    {
      templatePath: "/prompts/to/project.md",
      suggestions: [
        "Check if the file exists",
        "Verify the path is correct",
        "Run 'breakdown init' to create templates",
      ],
      canAutoResolve: true,
      cause,
    },
  );

  assertEquals(error.message, "Failed to load template");
  assertEquals(error.errorType, TemplateErrorType.TEMPLATE_NOT_FOUND);
  assertEquals(error.name, "TemplateError");
  assertEquals(error.templatePath, "/prompts/to/project.md");
  assertEquals(error.suggestions.length, 3);
  assertEquals(error.suggestions[0], "Check if the file exists");
  assertEquals(error.canAutoResolve, true);
  assertEquals(error.cause, cause);
});

Deno.test("Unit: TemplateErrorHandler detects file not found errors", async () => {
  const testCases = [
    {
      error: new Error("ENOENT: no such file or directory"),
      context: { templatePath: "/prompts/missing.md" },
    },
    {
      error: new Error("file not found: /path/to/template"),
      context: { templatePath: "/path/to/template" },
    },
    {
      error: new Error("Template not found in search paths"),
      context: undefined,
    },
  ];

  for (const testCase of testCases) {
    const _result = TemplateErrorHandler.detectTemplateError(testCase.error, testCase.context);

    assertExists(_result, "Should detect file not found error");
    assertEquals(result?.errorType, TemplateErrorType.TEMPLATE_NOT_FOUND);
    assertEquals(result?.canAutoResolve, true, "File not found should be auto-resolvable");
    assertExists(result?.suggestions, "Should have suggestions");
    assertEquals(result?.suggestions.length > 0, true, "Should have at least one suggestion");
    assertEquals(result?.cause, testCase.error, "Should preserve original error");

    if (testCase.context?.templatePath) {
      assertEquals(
        result?.templatePath,
        testCase.context.templatePath,
        "Should preserve template path",
      );
    }
  }
});

Deno.test("Unit: TemplateErrorHandler detects permission errors", async () => {
  const testCases = [
    new Error("EACCES: permission denied"),
    new Error("Permission denied accessing file"),
    new Error("EACCES: Operation not permitted"),
  ];

  for (const testError of testCases) {
    const _result = TemplateErrorHandler.detectTemplateError(testError, {
      templatePath: "/restricted/template.md",
    });

    assertExists(_result, "Should detect permission error");
    assertEquals(result?.errorType, TemplateErrorType.TEMPLATE_PERMISSION_DENIED);
    assertEquals(result?.canAutoResolve, false, "Permission errors should not be auto-resolvable");
    assertEquals(result?.templatePath, "/restricted/template.md");

    // Should suggest permission-related fixes
    const suggestionsText = result?.suggestions.join(" ");
    assertEquals(
      suggestionsText?.includes("permission") || suggestionsText?.includes("privileges"),
      true,
      "Should suggest permission fixes",
    );
  }
});

Deno.test("Unit: TemplateErrorHandler detects invalid template errors", async () => {
  const testCases = [
    new Error("Invalid template format detected"),
    new Error("Malformed template structure"),
    new Error("Template validation failed: invalid syntax"),
  ];

  for (const testError of testCases) {
    const _result = TemplateErrorHandler.detectTemplateError(testError, {
      templatePath: "/templates/broken.md",
    });

    assertExists(_result, "Should detect invalid template error");
    assertEquals(result?.errorType, TemplateErrorType.TEMPLATE_INVALID);
    assertEquals(result?.canAutoResolve, true, "Invalid templates should be auto-resolvable");

    // Should suggest template fixes
    const suggestionsText = result?.suggestions.join(" ");
    assertEquals(
      suggestionsText?.includes("syntax") ||
        suggestionsText?.includes("template") ||
        suggestionsText?.includes("validate"),
      true,
      "Should suggest template validation fixes",
    );
  }
});

Deno.test("Unit: TemplateErrorHandler ignores non-template errors", async () => {
  const nonTemplateErrors = [
    new Error("Network connection failed"),
    new Error("Invalid JSON syntax"),
    new Error("Memory allocation failed"),
    new Error("Unexpected token in expression"),
  ];

  for (const error of nonTemplateErrors) {
    const _result = TemplateErrorHandler.detectTemplateError(error);
    assertEquals(_result, null, "Should not detect non-template errors");
  }
});

Deno.test("Unit: TemplateError generates detailed messages correctly", async () => {
  const error = new TemplateError(
    "Template compilation failed",
    TemplateErrorType.TEMPLATE_GENERATION_FAILED,
    {
      templatePath: "/prompts/complex/template.md",
      suggestions: [
        "Check Handlebars syntax",
        "Validate variable references",
        "Test with simple content",
      ],
      canAutoResolve: true,
    },
  );

  const message = error.getDetailedMessage();

  // Should include all components
  assertStringIncludes(message, "❌ Template compilation failed", "Should include error message");
  assertStringIncludes(
    message,
    "Template: /prompts/complex/template.md",
    "Should include template path",
  );
  assertStringIncludes(message, "💡 Suggestions:", "Should include suggestions header");
  assertStringIncludes(message, "- Check Handlebars syntax", "Should include first suggestion");
  assertStringIncludes(
    message,
    "- Validate variable references",
    "Should include second suggestion",
  );
  assertStringIncludes(message, "- Test with simple content", "Should include third suggestion");
  assertStringIncludes(
    message,
    "🔧 Auto-resolution available",
    "Should include auto-resolution info",
  );
});

Deno.test("Unit: TemplateError generates recovery commands by type", async () => {
  const testCases = [
    {
      errorType: TemplateErrorType.TEMPLATE_NOT_FOUND,
      expectedCommands: [
        "bash scripts/template_generator.sh generate",
        "bash examples/00_template_check.sh full",
      ],
    },
    {
      errorType: TemplateErrorType.TEMPLATE_GENERATION_FAILED,
      expectedCommands: [
        "bash scripts/template_generator.sh check",
        "deno run --allow-read --allow-write lib/helpers/template_validator.ts",
      ],
    },
    {
      errorType: TemplateErrorType.CONFIG_INVALID,
      expectedCommands: [
        "deno run -A cli/breakdown.ts init",
        "bash examples/00_template_check.sh full",
      ],
    },
  ];

  for (const testCase of testCases) {
    const error = new TemplateError("Test", testCase.errorType);
    const commands = error.getRecoveryCommands();

    for (const expectedCommand of testCase.expectedCommands) {
      assertEquals(
        commands.includes(expectedCommand),
        true,
        `Should include command for ${testCase.errorType}: ${expectedCommand}`,
      );
    }
  }
});

Deno.test("Unit: TemplateErrorHandler handles auto-resolution attempts", async () => {
  const templateError = new TemplateError(
    "Template not found",
    TemplateErrorType.TEMPLATE_NOT_FOUND,
    { canAutoResolve: true },
  );

  // Test without auto-resolution
  const resultNoAuto = await TemplateErrorHandler.handleTemplateError(templateError, {
    autoResolve: false,
  });

  assertEquals(resultNoAuto.resolved, false, "Should not resolve when auto-resolve disabled");
  assertEquals(resultNoAuto.message, "Manual intervention required");
  assertExists(resultNoAuto.commands, "Should provide recovery commands");

  // Test with non-resolvable error
  const nonResolvableError = new TemplateError(
    "Permission denied",
    TemplateErrorType.TEMPLATE_PERMISSION_DENIED,
    { canAutoResolve: false },
  );

  const resultNonResolvable = await TemplateErrorHandler.handleTemplateError(nonResolvableError, {
    autoResolve: true,
  });

  assertEquals(resultNonResolvable.resolved, false, "Should not resolve non-resolvable errors");
});

Deno.test("Unit: withTemplateErrorHandling wrapper functionality", async () => {
  // Test successful operation
  const successfulOperation = async () => "success result";
  const result1 = await withTemplateErrorHandling(successfulOperation);
  assertEquals(result1, "success result", "Should return result for successful operation");

  // Test with non-template error
  const nonTemplateErrorOperation = async () => {
    throw new Error("Network error");
  };

  try {
    await withTemplateErrorHandling(nonTemplateErrorOperation);
    assertEquals(false, true, "Should throw non-template errors");
  } catch (error) {
    assertEquals((error as Error).message, "Network error", "Should preserve non-template errors");
  }

  // Test with template error (would attempt auto-resolution)
  const templateErrorOperation = async () => {
    throw new Error("ENOENT: no such file or directory");
  };

  try {
    await withTemplateErrorHandling(templateErrorOperation, {
      templatePath: "/test/template.md",
      autoResolve: false, // Disable auto-resolve for test
    });
    assertEquals(false, true, "Should throw template errors when not resolved");
  } catch (error) {
    assertEquals(error instanceof TemplateError, true, "Should throw TemplateError");
  }
});

Deno.test("Unit: TemplateError handles edge cases", async () => {
  // Empty message
  const error1 = new TemplateError("", TemplateErrorType.TEMPLATE_NOT_FOUND);
  assertEquals(error1.message, "", "Should accept empty message");

  // Very long message
  const longMessage = "A".repeat(1000);
  const error2 = new TemplateError(longMessage, TemplateErrorType.TEMPLATE_INVALID);
  assertEquals(error2.message.length, 1000, "Should accept long message");

  // Empty suggestions array
  const error3 = new TemplateError(
    "Test",
    TemplateErrorType.CONFIG_INVALID,
    { suggestions: [] },
  );
  assertEquals(error3.suggestions.length, 0, "Should accept empty suggestions");

  // Null/undefined in options
  const error4 = new TemplateError(
    "Test",
    TemplateErrorType.TEMPLATE_NOT_FOUND,
    {
      templatePath: undefined,
      suggestions: undefined,
      canAutoResolve: undefined,
      cause: undefined,
    },
  );
  assertEquals(error4.templatePath, undefined, "Should handle undefined templatePath");
  assertEquals(error4.suggestions.length, 0, "Should default to empty suggestions");
  assertEquals(error4.canAutoResolve, false, "Should default to false");
  assertEquals(error4.cause, undefined, "Should handle undefined cause");
});

Deno.test("Unit: TemplateErrorHandler handles detection edge cases", async () => {
  // Case-insensitive detection
  const upperCaseError = new Error("PERMISSION DENIED");
  const result1 = TemplateErrorHandler.detectTemplateError(upperCaseError);
  assertExists(result1, "Should detect uppercase error messages");

  // Partial message matching
  const partialError = new Error("Failed to access file: ENOENT");
  const result2 = TemplateErrorHandler.detectTemplateError(partialError);
  assertExists(result2, "Should detect partial message matches");

  // Empty error message
  const emptyError = new Error("");
  const result3 = TemplateErrorHandler.detectTemplateError(emptyError);
  assertEquals(result3, null, "Should handle empty error messages");

  // Context without templatePath
  const contextWithoutPath = { operation: "template_load" };
  const result4 = TemplateErrorHandler.detectTemplateError(
    new Error("ENOENT: file not found"),
    contextWithoutPath,
  );
  assertExists(result4, "Should work with incomplete context");
  assertEquals(result4?.templatePath, undefined, "Should handle missing template path");
});

Deno.test("Unit: TemplateError message formatting without optional fields", async () => {
  const minimalError = new TemplateError(
    "Basic error",
    TemplateErrorType.TEMPLATE_INVALID,
  );

  const message = minimalError.getDetailedMessage();

  assertStringIncludes(message, "❌ Basic error", "Should include basic message");
  assertEquals(message.includes("Template:"), false, "Should not include template section");
  assertEquals(message.includes("💡"), false, "Should not include suggestions section");
  assertEquals(message.includes("🔧"), false, "Should not include auto-resolution section");
});

Deno.test("Unit: Recovery commands for unknown error types", async () => {
  // Create custom error type (simulating future extension)
  const customError = new TemplateError("Custom", "CUSTOM_ERROR" as TemplateErrorType);
  const commands = customError.getRecoveryCommands();

  assertExists(commands, "Should return commands for unknown types");
  assertEquals(commands.length > 0, true, "Should have fallback commands");
  assertEquals(
    commands.includes("bash examples/00_template_check.sh check"),
    true,
    "Should include default check command",
  );
});
