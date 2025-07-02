/**
 * @fileoverview Unit tests for CLI errors module
 *
 * Tests functional behavior and business logic:
 * - Error creation and instantiation
 * - Message formatting and content
 * - Error code handling and validation
 * - Edge cases and boundary conditions
 * - Error throwing and catching behavior
 *
 * @module cli/2_unit_errors_test
 */

import { assertEquals, assertExists, assertStringIncludes, assertThrows } from "@std/assert";
import { CliError, CliErrorCode } from "./errors.ts";

Deno.test("Unit: CliError creation with all error codes", () => {
  const _testMessage = "Test error message";

  // Test each error code individually
  const testCases = [
    CliErrorCode.INVALID_OPTION,
    CliErrorCode.DUPLICATE_OPTION,
    CliErrorCode.CONFLICTING_OPTIONS,
    CliErrorCode.INVALID_INPUT_TYPE,
    CliErrorCode.MISSING_REQUIRED,
    CliErrorCode.INVALID_PARAMETERS,
  ];

  for (const code of testCases) {
    const error = new CliError(code, testMessage);

    assertEquals(error.code, code, `Should set code to ${code}`);
    assertEquals(error.name, "CliError", "Should set name to CliError");
    assertEquals(
      error.message,
      `[${code}] ${testMessage}`,
      `Should format message with code ${code}`,
    );
    assertExists(error.stack, `Should have stack trace for ${code}`);
  }
});

Deno.test("Unit: CliError message formatting behavior", () => {
  const testCases = [
    {
      code: CliErrorCode.INVALID_OPTION,
      message: "Option --unknown is not recognized",
      expected: "[INVALID_OPTION] Option --unknown is not recognized",
    },
    {
      code: CliErrorCode.DUPLICATE_OPTION,
      message: "Option --output specified multiple times",
      expected: "[DUPLICATE_OPTION] Option --output specified multiple times",
    },
    {
      code: CliErrorCode.CONFLICTING_OPTIONS,
      message: "Cannot use --stdin with --file",
      expected: "[CONFLICTING_OPTIONS] Cannot use --stdin with --file",
    },
    {
      code: CliErrorCode.INVALID_INPUT_TYPE,
      message: "Expected string but got number",
      expected: "[INVALID_INPUT_TYPE] Expected string but got number",
    },
    {
      code: CliErrorCode.MISSING_REQUIRED,
      message: "Required argument <command> is missing",
      expected: "[MISSING_REQUIRED] Required argument <command> is missing",
    },
    {
      code: CliErrorCode.INVALID_PARAMETERS,
      message: "Parameter validation failed for --timeout",
      expected: "[INVALID_PARAMETERS] Parameter validation failed for --timeout",
    },
  ];

  for (const testCase of testCases) {
    const error = new CliError(testCase.code, testCase.message);
    assertEquals(
      error.message,
      testCase.expected,
      `Message formatting should be correct for ${testCase.code}`,
    );
  }
});

Deno.test("Unit: CliError throwing and catching behavior", () => {
  const errorCodes = Object.values(CliErrorCode);

  for (const code of errorCodes) {
    const testMessage = `Throw test for ${code}`;

    // Test throwing and catching as CliError
    try {
      throw new CliError(code, testMessage);
    } catch (error) {
      assertEquals(error instanceof CliError, true, `Should catch as CliError for ${code}`);
      assertEquals(error instanceof Error, true, `Should catch as Error for ${code}`);
      if (error instanceof CliError) {
        assertEquals(error.code, code, `Should preserve code when caught for ${code}`);
        assertEquals(
          error.message.includes(testMessage),
          true,
          `Should preserve message when caught for ${code}`,
        );
      }
    }

    // Test throwing and catching as generic Error
    try {
      throw new CliError(code, testMessage);
    } catch (error) {
      if (error instanceof CliError) {
        assertEquals(
          error.code,
          code,
          `Should have code property when caught as Error for ${code}`,
        );
      }
    }
  }
});

Deno.test("Unit: CliError with empty and special messages", () => {
  const specialMessages = [
    "",
    " ",
    "\n",
    "\t",
    "Message with\nnewlines\nand\ttabs",
    "Message with unicode: 🚀 ✨ 🎯",
    "Message with quotes: 'single' \"double\" `backtick`",
    "Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?",
    "Very long message: " + "x".repeat(1000),
  ];

  for (const message of specialMessages) {
    const error = new CliError(CliErrorCode.INVALID_OPTION, message);

    assertEquals(
      error.code,
      CliErrorCode.INVALID_OPTION,
      "Should preserve code with special message",
    );
    assertEquals(
      error.message,
      `[INVALID_OPTION] ${message}`,
      "Should format special message correctly",
    );
    assertEquals(error.name, "CliError", "Should preserve name with special message");
  }
});

Deno.test("Unit: CliError error code validation scenarios", () => {
  // Test specific error scenarios that each code represents
  const scenarios = [
    {
      code: CliErrorCode.INVALID_OPTION,
      scenario: "User provides unrecognized command line option",
      message: "Unknown option --invalid-flag",
    },
    {
      code: CliErrorCode.DUPLICATE_OPTION,
      scenario: "User provides same option multiple times",
      message: "Option --verbose specified multiple times",
    },
    {
      code: CliErrorCode.CONFLICTING_OPTIONS,
      scenario: "User provides mutually exclusive options",
      message: "Cannot use --quiet and --verbose together",
    },
    {
      code: CliErrorCode.INVALID_INPUT_TYPE,
      scenario: "User provides wrong data type for parameter",
      message: "Expected number for --port but got 'invalid'",
    },
    {
      code: CliErrorCode.MISSING_REQUIRED,
      scenario: "User omits required argument",
      message: "Missing required argument: input file",
    },
    {
      code: CliErrorCode.INVALID_PARAMETERS,
      scenario: "User provides invalid parameter values",
      message: "Invalid value 'maybe' for boolean flag --force",
    },
  ];

  for (const { code, scenario, message } of scenarios) {
    const error = new CliError(code, message);

    assertEquals(error.code, code, `Should use ${code} for scenario: ${scenario}`);
    assertStringIncludes(error.message, message, `Should include message for: ${scenario}`);
    assertStringIncludes(error.message, `[${code}]`, `Should include code for: ${scenario}`);
  }
});

Deno.test("Unit: CliError property immutability and access", () => {
  const error = new CliError(CliErrorCode.INVALID_OPTION, "Immutability test");

  // Test property access
  assertEquals(error.code, CliErrorCode.INVALID_OPTION, "Should access code property");
  assertEquals(typeof error.message, "string", "Should access message property");
  assertEquals(error.name, "CliError", "Should access name property");

  // Test property enumeration
  const keys = Object.keys(error);
  assertEquals(keys.includes("code"), true, "Code should be enumerable");

  // Test property descriptors
  const codeDescriptor = Object.getOwnPropertyDescriptor(error, "code");
  assertExists(codeDescriptor, "Code property should have descriptor");
  assertEquals(typeof codeDescriptor.value, "string", "Code value should be string");

  const messageDescriptor = Object.getOwnPropertyDescriptor(error, "message");
  assertExists(messageDescriptor, "Message property should have descriptor");
  assertEquals(typeof messageDescriptor.value, "string", "Message value should be string");
});

Deno.test("Unit: CliError comparison and equality", () => {
  const error1 = new CliError(CliErrorCode.INVALID_OPTION, "Test message");
  const error2 = new CliError(CliErrorCode.INVALID_OPTION, "Test message");
  const error3 = new CliError(CliErrorCode.MISSING_REQUIRED, "Test message");
  const error4 = new CliError(CliErrorCode.INVALID_OPTION, "Different message");

  // Errors with same code and message should have same properties
  assertEquals(error1.code, error2.code, "Should have same code");
  assertEquals(error1.message, error2.message, "Should have same formatted message");
  assertEquals(error1.name, error2.name, "Should have same name");

  // Errors with different codes should differ
  assertEquals(error1.code === error3.code, false, "Should have different codes");
  assertEquals(error1.message === error3.message, false, "Should have different messages");

  // Errors with different messages should differ
  assertEquals(
    error1.message === error4.message,
    false,
    "Should have different messages with different input",
  );
  assertEquals(error1.code, error4.code, "Should have same code with different message");
});

Deno.test("Unit: CliError integration with error handling patterns", () => {
  // Test common error handling patterns

  // Pattern 1: Switch on error code
  const switchTest = (error: CliError): string => {
    switch (error.code) {
      case CliErrorCode.INVALID_OPTION:
        return "option-error";
      case CliErrorCode.MISSING_REQUIRED:
        return "missing-error";
      case CliErrorCode.CONFLICTING_OPTIONS:
        return "conflict-error";
      default:
        return "other-error";
    }
  };

  assertEquals(
    switchTest(new CliError(CliErrorCode.INVALID_OPTION, "test")),
    "option-error",
    "Should work with switch pattern",
  );

  // Pattern 2: Error filtering
  const errors = [
    new CliError(CliErrorCode.INVALID_OPTION, "test1"),
    new CliError(CliErrorCode.MISSING_REQUIRED, "test2"),
    new CliError(CliErrorCode.INVALID_OPTION, "test3"),
  ];

  const optionErrors = errors.filter((e) => e.code === CliErrorCode.INVALID_OPTION);
  assertEquals(optionErrors.length, 2, "Should filter by error code");

  // Pattern 3: Error mapping
  const errorMessages = errors.map((e) => e.message);
  assertEquals(errorMessages.length, 3, "Should map error messages");
  assertEquals(
    errorMessages.every((msg) => msg.includes("[")),
    true,
    "All mapped messages should include code",
  );
});

Deno.test("Unit: CliError with complex real-world scenarios", () => {
  // Scenario 1: CLI argument parsing error
  const parseError = new CliError(
    CliErrorCode.INVALID_OPTION,
    "Unknown option '--output-format'. Did you mean '--output'?",
  );

  assertStringIncludes(parseError.message, "Unknown option", "Should handle parse errors");
  assertStringIncludes(parseError.message, "Did you mean", "Should include suggestions");

  // Scenario 2: Validation error with details
  const validationError = new CliError(
    CliErrorCode.INVALID_PARAMETERS,
    "Invalid timeout value '30s'. Expected number of milliseconds (e.g., 3000)",
  );

  assertStringIncludes(
    validationError.message,
    "Invalid timeout",
    "Should handle validation errors",
  );
  assertStringIncludes(validationError.message, "Expected", "Should include expected format");

  // Scenario 3: Missing required with context
  const missingError = new CliError(
    CliErrorCode.MISSING_REQUIRED,
    "Missing required argument 'input-file'. Use --help for usage information",
  );

  assertStringIncludes(missingError.message, "Missing required", "Should handle missing arguments");
  assertStringIncludes(missingError.message, "Use --help", "Should include help suggestion");

  // Scenario 4: Conflicting options with explanation
  const conflictError = new CliError(
    CliErrorCode.CONFLICTING_OPTIONS,
    "Cannot use --stdin and --file together. Choose one input method",
  );

  assertStringIncludes(conflictError.message, "Cannot use", "Should handle conflicts");
  assertStringIncludes(conflictError.message, "Choose one", "Should suggest resolution");
});

Deno.test("Unit: CliError edge cases and boundary conditions", () => {
  // Edge case 1: Very long error message
  const longMessage = "Error: " + "very long description ".repeat(100);
  const longError = new CliError(CliErrorCode.INVALID_PARAMETERS, longMessage);

  assertEquals(longError.code, CliErrorCode.INVALID_PARAMETERS, "Should handle long messages");
  assertStringIncludes(longError.message, longMessage, "Should preserve long message");

  // Edge case 2: Message with special formatting
  const formattedMessage = "Error:\n  - Item 1\n  - Item 2\n  - Item 3";
  const formatError = new CliError(CliErrorCode.INVALID_INPUT_TYPE, formattedMessage);

  assertStringIncludes(formatError.message, formattedMessage, "Should preserve formatting");
  assertStringIncludes(
    formatError.message,
    "[INVALID_INPUT_TYPE]",
    "Should include code with formatting",
  );

  // Edge case 3: Message with only whitespace
  const whitespaceMessage = "   \t\n   ";
  const whitespaceError = new CliError(CliErrorCode.MISSING_REQUIRED, whitespaceMessage);

  assertEquals(
    whitespaceError.message,
    `[MISSING_REQUIRED] ${whitespaceMessage}`,
    "Should preserve whitespace message",
  );

  // Edge case 4: Error in error handling (meta-error)
  const metaError = new CliError(
    CliErrorCode.INVALID_PARAMETERS,
    "Failed to process error: original error was malformed",
  );

  assertStringIncludes(metaError.message, "Failed to process error", "Should handle meta-errors");
});

Deno.test("Unit: CliError toString and serialization behavior", () => {
  const error = new CliError(CliErrorCode.DUPLICATE_OPTION, "Serialization test");

  // Test toString
  const stringified = error.toString();
  assertStringIncludes(stringified, "CliError", "toString should include error type");
  assertStringIncludes(stringified, "DUPLICATE_OPTION", "toString should include code");
  assertStringIncludes(stringified, "Serialization test", "toString should include message");

  // Test JSON serialization
  const jsonString = JSON.stringify(error);
  const parsed = JSON.parse(jsonString);

  assertEquals(parsed.name, "CliError", "Should serialize name");
  assertEquals(parsed.code, "DUPLICATE_OPTION", "Should serialize code");
  // Note: message property may not serialize depending on Error implementation

  // Test custom serialization (if needed for logging)
  const customSerialized = {
    type: error.name,
    code: error.code,
    message: error.message,
    timestamp: new Date().toISOString(),
  };

  assertEquals(customSerialized.type, "CliError", "Should support custom serialization");
  assertEquals(
    customSerialized.code,
    CliErrorCode.DUPLICATE_OPTION,
    "Should preserve code in custom format",
  );
});
