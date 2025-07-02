/**
 * @fileoverview Architecture tests for CLI errors module
 *
 * Tests architectural constraints and design principles:
 * - Error hierarchy and inheritance
 * - Enum completeness and consistency
 * - Interface segregation
 * - Single responsibility principle
 * - Type safety and discriminated unions
 *
 * @module cli/0_architecture_errors_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { CliError, CliErrorCode } from "./errors.ts";

Deno.test("Architecture: CliError follows proper error hierarchy", () => {
  const _error = new CliError(CliErrorCode.INVALID_OPTION, "Test error");

  // Should extend Error class
  assertEquals(error instanceof Error, true, "Should extend Error class");
  assertEquals(error instanceof CliError, true, "Should be instanceof CliError");

  // Should have proper name and error hierarchy
  assertEquals(error.name, "CliError", "Should have correct name");
  assertEquals(error.constructor.name, "CliError", "Should have correct constructor name");

  // Should have stack trace
  assertExists(error.stack, "Should have stack trace");

  // Should be throwable
  try {
    throw error;
  } catch (caught) {
    assertEquals(caught instanceof CliError, true, "Should be catchable as CliError");
    assertEquals(caught instanceof Error, true, "Should be catchable as Error");
  }
});

Deno.test("Architecture: CliErrorCode enum completeness and consistency", () => {
  const errorCodes = Object.values(CliErrorCode);

  // Should have all expected CLI error scenarios
  const expectedCodes = [
    "INVALID_OPTION",
    "DUPLICATE_OPTION",
    "CONFLICTING_OPTIONS",
    "INVALID_INPUT_TYPE",
    "MISSING_REQUIRED",
    "INVALID_PARAMETERS",
  ];

  assertEquals(
    errorCodes.length,
    expectedCodes.length,
    "Should have all expected error codes",
  );

  // Each enum value should match its key
  for (const expectedCode of expectedCodes) {
    assertEquals(
      errorCodes.includes(expectedCode as CliErrorCode),
      true,
      `Should include ${expectedCode} error code`,
    );

    // Enum value should equal its key (string enum pattern)
    assertEquals(
      CliErrorCode[expectedCode as keyof typeof CliErrorCode],
      expectedCode,
      `Enum value should equal key for ${expectedCode}`,
    );
  }

  // All enum values should be unique
  const uniqueCodes = new Set(errorCodes);
  assertEquals(
    uniqueCodes.size,
    errorCodes.length,
    "All error codes should be unique",
  );
});

Deno.test("Architecture: CliError maintains single responsibility", () => {
  const error = new CliError(CliErrorCode.MISSING_REQUIRED, "Test");

  // Should only have properties related to CLI error handling
  const expectedProperties = ["code", "message", "name", "stack"];
  const actualProperties = Object.getOwnPropertyNames(error);

  for (const prop of expectedProperties) {
    assertEquals(
      actualProperties.includes(prop),
      true,
      `Should have ${prop} property`,
    );
  }

  // Should not have unrelated properties
  const unexpectedProperties = actualProperties.filter((prop) =>
    !expectedProperties.includes(prop) && prop !== "cause"
  );
  assertEquals(
    unexpectedProperties.length,
    0,
    `Should not have unexpected properties: ${unexpectedProperties.join(", ")}`,
  );
});

Deno.test("Architecture: CliError constructor follows consistent pattern", () => {
  // Constructor should accept exactly 2 parameters
  assertEquals(
    CliError.length,
    2, // Constructor takes 2 parameters: code and message
    "Constructor should accept 2 parameters",
  );

  // Test constructor signature through instantiation
  const error = new CliError(CliErrorCode.INVALID_OPTION, "Test message");

  assertEquals(typeof error.code, "string", "Code should be string type");
  assertEquals(typeof error.message, "string", "Message should be string type");

  // Code should be from CliErrorCode enum
  const validCodes = Object.values(CliErrorCode);
  assertEquals(
    validCodes.includes(error.code),
    true,
    "Code should be valid CliErrorCode",
  );
});

Deno.test("Architecture: Error message formatting follows consistent pattern", () => {
  const testCases = [
    {
      code: CliErrorCode.INVALID_OPTION,
      message: "Option --invalid is not recognized",
      expectedFormat: "[INVALID_OPTION] Option --invalid is not recognized",
    },
    {
      code: CliErrorCode.MISSING_REQUIRED,
      message: "Required argument missing",
      expectedFormat: "[MISSING_REQUIRED] Required argument missing",
    },
    {
      code: CliErrorCode.CONFLICTING_OPTIONS,
      message: "Options --a and --b cannot be used together",
      expectedFormat: "[CONFLICTING_OPTIONS] Options --a and --b cannot be used together",
    },
  ];

  for (const testCase of testCases) {
    const error = new CliError(testCase.code, testCase.message);

    assertEquals(
      error.message,
      testCase.expectedFormat,
      `Message should follow pattern for ${testCase.code}`,
    );

    // Should include error code in square brackets
    assertEquals(
      error.message.startsWith(`[${testCase.code}]`),
      true,
      `Message should start with [${testCase.code}]`,
    );
  }
});

Deno.test("Architecture: CliErrorCode covers all CLI error scenarios", () => {
  // Should cover input validation errors
  assertEquals(
    Object.values(CliErrorCode).includes(CliErrorCode.INVALID_INPUT_TYPE),
    true,
    "Should cover input validation",
  );

  // Should cover option parsing errors
  assertEquals(
    Object.values(CliErrorCode).includes(CliErrorCode.INVALID_OPTION),
    true,
    "Should cover option parsing",
  );
  assertEquals(
    Object.values(CliErrorCode).includes(CliErrorCode.DUPLICATE_OPTION),
    true,
    "Should cover duplicate options",
  );

  // Should cover requirement validation errors
  assertEquals(
    Object.values(CliErrorCode).includes(CliErrorCode.MISSING_REQUIRED),
    true,
    "Should cover missing requirements",
  );

  // Should cover logical validation errors
  assertEquals(
    Object.values(CliErrorCode).includes(CliErrorCode.CONFLICTING_OPTIONS),
    true,
    "Should cover option conflicts",
  );

  // Should cover parameter validation errors
  assertEquals(
    Object.values(CliErrorCode).includes(CliErrorCode.INVALID_PARAMETERS),
    true,
    "Should cover parameter validation",
  );
});

Deno.test("Architecture: Module exports follow clean interface pattern", () => {
  // Should export exactly what's needed
  assertExists(CliError, "Should export CliError class");
  assertExists(CliErrorCode, "Should export CliErrorCode enum");

  // CliError should be constructable
  assertEquals(typeof CliError, "function", "CliError should be a constructor");

  // CliErrorCode should be an object with string values
  assertEquals(typeof CliErrorCode, "object", "CliErrorCode should be an object");

  for (const value of Object.values(CliErrorCode)) {
    assertEquals(typeof value, "string", "All enum values should be strings");
  }
});

Deno.test("Architecture: Error categorization follows CLI domain logic", () => {
  // Option-related errors
  const optionErrors = [
    CliErrorCode.INVALID_OPTION,
    CliErrorCode.DUPLICATE_OPTION,
    CliErrorCode.CONFLICTING_OPTIONS,
  ];

  // Input-related errors
  const inputErrors = [
    CliErrorCode.INVALID_INPUT_TYPE,
    CliErrorCode.INVALID_PARAMETERS,
  ];

  // Requirement-related errors
  const requirementErrors = [
    CliErrorCode.MISSING_REQUIRED,
  ];

  // All categories should be represented
  const allCategories = [...optionErrors, ...inputErrors, ...requirementErrors];
  const allCodes = Object.values(CliErrorCode);

  assertEquals(
    allCategories.length,
    allCodes.length,
    "All error codes should be categorized",
  );

  // Each category should have meaningful grouping
  assertEquals(optionErrors.length >= 2, true, "Should have multiple option errors");
  assertEquals(inputErrors.length >= 1, true, "Should have input validation errors");
  assertEquals(requirementErrors.length >= 1, true, "Should have requirement errors");
});

Deno.test("Architecture: CliError supports error discrimination", () => {
  const errors = [
    new CliError(CliErrorCode.INVALID_OPTION, "Test 1"),
    new CliError(CliErrorCode.MISSING_REQUIRED, "Test 2"),
    new CliError(CliErrorCode.CONFLICTING_OPTIONS, "Test 3"),
  ];

  // Should be able to discriminate by error code
  for (const error of errors) {
    assertEquals(typeof error.code, "string", "Code should be string for discrimination");
    assertEquals(
      Object.values(CliErrorCode).includes(error.code),
      true,
      "Code should be valid for discrimination",
    );
  }

  // Should support switch-case discrimination
  const errorTypes = errors.map((error) => {
    switch (error.code) {
      case CliErrorCode.INVALID_OPTION:
        return "option";
      case CliErrorCode.MISSING_REQUIRED:
        return "requirement";
      case CliErrorCode.CONFLICTING_OPTIONS:
        return "conflict";
      default:
        return "unknown";
    }
  });

  assertEquals(errorTypes, ["option", "requirement", "conflict"], "Should support discrimination");
});
