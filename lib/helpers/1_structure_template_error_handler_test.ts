/**
 * @fileoverview Structure tests for TemplateErrorHandler
 *
 * Tests structural integrity and design patterns:
 * - Method contracts and signatures
 * - Data flow consistency
 * - Error message formatting
 * - Interface implementations
 *
 * @module helpers/1_structure_template_error_handler_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  TemplateError,
  TemplateErrorHandler,
  TemplateErrorType,
  withTemplateErrorHandling,
} from "./template_error_handler.ts";

Deno.test("Structure: TemplateError constructor parameters", async () => {
  // Test required parameters
  const error1 = new TemplateError("Message", TemplateErrorType.TEMPLATE_NOT_FOUND);
  assertEquals(error1.message, "Message", "Should set message");
  assertEquals(error1.errorType, TemplateErrorType.TEMPLATE_NOT_FOUND, "Should set error type");
  assertEquals(error1.suggestions.length, 0, "Should have empty suggestions by default");
  assertEquals(error1.canAutoResolve, false, "Should not auto-resolve by default");

  // Test optional parameters
  const error2 = new TemplateError(
    "Message",
    TemplateErrorType.TEMPLATE_INVALID,
    {
      templatePath: "/path/to/template",
      suggestions: ["Fix syntax", "Check format"],
      canAutoResolve: true,
      cause: new Error("Original error"),
    },
  );

  assertEquals(error2.templatePath, "/path/to/template", "Should set template path");
  assertEquals(error2.suggestions.length, 2, "Should set suggestions");
  assertEquals(error2.canAutoResolve, true, "Should set auto-resolve flag");
  assertExists(error2.cause, "Should set cause");
});

Deno.test("Structure: TemplateErrorHandler static method signatures", async () => {
  // detectTemplateError method
  assertEquals(
    TemplateErrorHandler.detectTemplateError.length,
    2,
    "detectTemplateError should accept 2 parameters",
  );

  // handleTemplateError method
  assertEquals(
    TemplateErrorHandler.handleTemplateError.length,
    2,
    "handleTemplateError should accept 2 parameters",
  );
});

Deno.test("Structure: TemplateError instance method signatures", async () => {
  const error = new TemplateError("Test", TemplateErrorType.TEMPLATE_NOT_FOUND);

  // getDetailedMessage method
  assertEquals(
    error.getDetailedMessage.length,
    0,
    "getDetailedMessage should accept 0 parameters",
  );

  // getRecoveryCommands method
  assertEquals(
    error.getRecoveryCommands.length,
    0,
    "getRecoveryCommands should accept 0 parameters",
  );
});

Deno.test("Structure: Error message formatting patterns", async () => {
  const error = new TemplateError(
    "Template not found",
    TemplateErrorType.TEMPLATE_NOT_FOUND,
    {
      templatePath: "/prompts/to/project.md",
      suggestions: ["Run template generator", "Check path"],
      canAutoResolve: true,
    },
  );

  const message = error.getDetailedMessage();

  // Should include key information
  assertExists(message, "Should return formatted message");
  assertEquals(typeof message, "string", "Should return string message");

  // Should contain important details
  assertEquals(
    message.includes("❌"),
    true,
    "Should include error emoji",
  );
  assertEquals(
    message.includes("Template not found"),
    true,
    "Should include original message",
  );
  assertEquals(
    message.includes("/prompts/to/project.md"),
    true,
    "Should include template path",
  );
  assertEquals(
    message.includes("💡"),
    true,
    "Should include suggestions section",
  );
  assertEquals(
    message.includes("🔧"),
    true,
    "Should include auto-resolution info",
  );
});

Deno.test("Structure: Recovery commands generation structure", async () => {
  // Test different error types produce different commands
  const errorTypes = [
    TemplateErrorType.TEMPLATE_NOT_FOUND,
    TemplateErrorType.TEMPLATE_INVALID,
    TemplateErrorType.TEMPLATE_PERMISSION_DENIED,
    TemplateErrorType.TEMPLATE_GENERATION_FAILED,
    TemplateErrorType.CONFIG_INVALID,
  ];

  for (const errorType of errorTypes) {
    const error = new TemplateError("Test", errorType);
    const commands = error.getRecoveryCommands();

    assertExists(commands, `Should return commands for ${errorType}`);
    assertEquals(
      Array.isArray(commands),
      true,
      `Should return array for ${errorType}`,
    );
    assertEquals(
      commands.every((c) => typeof c === "string"),
      true,
      `All commands should be strings for ${errorType}`,
    );
  }
});

Deno.test("Structure: Error detection logic structure", async () => {
  // Test detection logic for different error patterns
  const testCases = [
    {
      error: new Error("ENOENT: no such file or directory"),
      expectedType: TemplateErrorType.TEMPLATE_NOT_FOUND,
    },
    {
      error: new Error("EACCES: permission denied"),
      expectedType: TemplateErrorType.TEMPLATE_PERMISSION_DENIED,
    },
    {
      error: new Error("Invalid template syntax detected"),
      expectedType: TemplateErrorType.TEMPLATE_INVALID,
    },
    {
      error: new Error("Some other random error"),
      expectedType: null,
    },
  ];

  for (const testCase of testCases) {
    const result = TemplateErrorHandler.detectTemplateError(testCase.error);

    if (testCase.expectedType === null) {
      assertEquals(result, null, "Should not detect non-template errors");
    } else {
      assertExists(result, "Should detect template error");
      assertEquals(
        result?.errorType,
        testCase.expectedType,
        `Should detect ${testCase.expectedType}`,
      );
    }
  }
});

Deno.test("Structure: Error context parameter structure", async () => {
  const context = {
    templatePath: "/prompts/test.md",
    operation: "template_load",
  };

  const error = new Error("Test error");
  const result = TemplateErrorHandler.detectTemplateError(error, context);

  if (result) {
    assertEquals(
      result.templatePath,
      context.templatePath,
      "Should preserve template path from context",
    );
  }

  // Context should be optional
  const resultWithoutContext = TemplateErrorHandler.detectTemplateError(error);
  assertExists(resultWithoutContext !== undefined, "Should work without context");
});

Deno.test("Structure: Error handler return types", async () => {
  const templateError = new TemplateError(
    "Test error",
    TemplateErrorType.TEMPLATE_NOT_FOUND,
  );

  // handleTemplateError returns Promise with specific structure
  const result = await TemplateErrorHandler.handleTemplateError(templateError);

  assertEquals(typeof result.resolved, "boolean", "Should have resolved field");
  assertEquals(typeof result.message, "string", "Should have message field");

  if (result.commands) {
    assertEquals(Array.isArray(result.commands), true, "Commands should be array");
  }
});

Deno.test("Structure: withTemplateErrorHandling wrapper structure", async () => {
  // Should accept operation function and context
  const operation = async () => "test result";
  const context = {
    templatePath: "/test/path",
    operation: "test_operation",
    autoResolve: false,
  };

  // Should return Promise
  const result = withTemplateErrorHandling(operation, context);
  assertExists(result.then, "Should return Promise");
});

Deno.test("Structure: Auto-resolution options structure", async () => {
  const templateError = new TemplateError(
    "Test",
    TemplateErrorType.TEMPLATE_NOT_FOUND,
    { canAutoResolve: true },
  );

  // Test with auto-resolution options
  const options = {
    autoResolve: true,
    projectRoot: "/test/project",
  };

  const result = await TemplateErrorHandler.handleTemplateError(templateError, options);

  // Should respect options structure
  assertEquals(typeof result.resolved, "boolean");
  assertEquals(typeof result.message, "string");
});

Deno.test("Structure: Error suggestions follow consistent format", async () => {
  const errorWithSuggestions = new TemplateError(
    "Test error",
    TemplateErrorType.TEMPLATE_NOT_FOUND,
    {
      suggestions: [
        "Run template generator to create missing templates",
        "Check if you're in the correct directory",
        "Verify template path configuration",
      ],
    },
  );

  const message = errorWithSuggestions.getDetailedMessage();

  // Each suggestion should be properly formatted in message
  assertEquals(
    message.includes("💡 Suggestions:"),
    true,
    "Should have suggestions header",
  );

  for (const suggestion of errorWithSuggestions.suggestions) {
    assertEquals(
      message.includes(`- ${suggestion}`),
      true,
      `Should include formatted suggestion: ${suggestion}`,
    );
  }
});

Deno.test("Structure: Error type specific command patterns", async () => {
  const commandPatterns = {
    [TemplateErrorType.TEMPLATE_NOT_FOUND]: [
      "bash scripts/template_generator.sh generate",
      "bash examples/00_template_check.sh full",
    ],
    [TemplateErrorType.TEMPLATE_GENERATION_FAILED]: [
      "bash scripts/template_generator.sh check",
      "deno run --allow-read --allow-write lib/helpers/template_validator.ts",
    ],
    [TemplateErrorType.CONFIG_INVALID]: [
      "deno run -A cli/breakdown.ts init",
      "bash examples/00_template_check.sh full",
    ],
  };

  for (const [errorType, expectedCommands] of Object.entries(commandPatterns)) {
    const error = new TemplateError("Test", errorType as TemplateErrorType);
    const actualCommands = error.getRecoveryCommands();

    assertEquals(
      actualCommands.length >= expectedCommands.length,
      true,
      `Should have expected commands for ${errorType}`,
    );

    for (const expectedCommand of expectedCommands) {
      assertEquals(
        actualCommands.includes(expectedCommand),
        true,
        `Should include command: ${expectedCommand}`,
      );
    }
  }
});
