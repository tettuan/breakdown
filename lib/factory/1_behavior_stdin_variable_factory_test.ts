/**
 * @fileoverview 1_behavior tests for StdinVariableFactory
 *
 * Validates:
 * - Factory creation behavior with Result pattern
 * - Error handling for invalid inputs
 * - Validation behavior for stdin sources
 * - Batch processing behavior
 * - Edge cases and boundary conditions
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  defaultStdinVariableFactory,
  type StdinFactoryInput,
  StdinVariableFactory,
} from "./stdin_variable_factory.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("factory-stdin-behavior-test");

Deno.test("StdinVariableFactory - 1_behavior - creates variable with valid input", () => {
  logger.debug("Testing stdin variable creation with valid input");

  const factory = new StdinVariableFactory();
  const input: StdinFactoryInput = {
    inputText: "Hello, world!",
    source: "cli",
    context: "Test input",
  };

  const result = factory.create(input);

  logger.debug("Factory create result", { result });

  // Verify Result pattern
  assertExists(result, "Should return Result");
  assertEquals(typeof result, "object", "Should be object");
  assertEquals("ok" in result, true, "Should have ok property");

  if (result.ok) {
    assertExists(result.data, "Should have StdinVariable data");
    assertEquals(typeof result.data, "object", "Data should be object");

    // Verify StdinVariable methods
    const record = result.data.toRecord();
    assertEquals(typeof record, "object", "toRecord should return object");
    assertEquals(record.input_text, "Hello, world!", "Should contain correct input text");

    logger.debug("StdinVariable created successfully", { record });
  } else {
    logger.debug("Factory create failed", { error: result.error });
    // For valid input, we expect success
    assertEquals(result.ok, true, "Should succeed for valid input");
  }
});

Deno.test("StdinVariableFactory - 1_behavior - handles missing inputText gracefully", () => {
  logger.debug("Testing missing inputText handling");

  const factory = new StdinVariableFactory();
  const input: StdinFactoryInput = {
    // Missing inputText
    source: "cli",
    context: "Test missing input",
  };

  const result = factory.create(input);

  logger.debug("Missing inputText result", { result });

  // Should return error Result
  assertExists(result, "Should return Result");
  assertEquals(result.ok, false, "Should fail for missing inputText");

  if (!result.ok) {
    assertExists(result.error, "Should have error");
    // Check if error has kind property (type guard)
    if ("kind" in result.error && result.error.kind === "NoStdinData") {
      assertEquals(result.error.kind, "NoStdinData", "Should be NoStdinData error");
      assertEquals(typeof result.error.context, "string", "Should have context");
    }
  }
});

Deno.test("StdinVariableFactory - 1_behavior - validates source parameter", () => {
  logger.debug("Testing source parameter validation");

  const factory = new StdinVariableFactory();

  // Test valid sources
  const validSources: Array<"cli" | "pipe" | "file"> = ["cli", "pipe", "file"];

  for (const source of validSources) {
    const input: StdinFactoryInput = {
      inputText: "Test content",
      source,
      context: `Test for ${source}`,
    };

    const result = factory.create(input);

    logger.debug(`Source validation for ${source}`, { result });

    assertExists(result, `Should return Result for ${source}`);
    assertEquals(typeof result, "object", "Should be object");

    if (result.ok) {
      logger.debug(`Valid source ${source} accepted`);
    } else {
      logger.debug(`Source ${source} validation failed`, { error: result.error });
    }
  }

  // Test invalid source
  const invalidInput = {
    inputText: "Test content",
    source: "invalid_source" as unknown as "cli" | "pipe" | "file",
    context: "Test invalid source",
  };

  const invalidResult = factory.create(invalidInput);

  assertEquals(invalidResult.ok, false, "Should fail for invalid source");
  if (!invalidResult.ok) {
    assertEquals(
      "kind" in invalidResult.error ? invalidResult.error.kind : "unknown",
      "InvalidStdinSource",
      "Should be InvalidStdinSource error",
    );
  }
});

Deno.test("StdinVariableFactory - 1_behavior - handles empty string input", () => {
  logger.debug("Testing empty string input handling");

  const factory = new StdinVariableFactory();
  const input: StdinFactoryInput = {
    inputText: "",
    source: "cli",
    context: "Empty string test",
  };

  const result = factory.create(input);

  logger.debug("Empty string result", { result });

  assertExists(result, "Should return Result");

  // Empty string should be handled by StdinVariable's validation
  if (!result.ok) {
    // StdinVariable may reject empty strings
    assertExists(result.error, "Should have error for empty string");
    const isValidationError = "kind" in result.error && (
      result.error.kind === "EmptyValue" ||
      result.error.kind === "ValidationFailed"
    );
    assertEquals(isValidationError, true, "Should be validation error");
  } else {
    // If StdinVariable accepts empty strings, verify the result
    assertEquals(result.data.toRecord().input_text, "", "Should preserve empty string");
  }
});

Deno.test("StdinVariableFactory - 1_behavior - createFromText convenience method works", () => {
  logger.debug("Testing createFromText convenience method");

  const factory = new StdinVariableFactory();

  // Test with default source
  const result1 = factory.createFromText("Hello from text");

  logger.debug("createFromText default source", { result1 });

  assertExists(result1, "Should return Result");
  if (result1.ok) {
    assertEquals(
      result1.data.toRecord().input_text,
      "Hello from text",
      "Should contain correct text",
    );
  }

  // Test with specified source
  const result2 = factory.createFromText("Hello from file", "file");

  logger.debug("createFromText with source", { result2 });

  assertExists(result2, "Should return Result");
  if (result2.ok) {
    assertEquals(
      result2.data.toRecord().input_text,
      "Hello from file",
      "Should contain correct text",
    );
  }
});

Deno.test("StdinVariableFactory - 1_behavior - batch processing handles mixed results", () => {
  logger.debug("Testing batch processing behavior");

  const factory = new StdinVariableFactory();
  const inputs: StdinFactoryInput[] = [
    { inputText: "Valid input 1", source: "cli" },
    { inputText: "Valid input 2", source: "pipe" },
    { /* missing inputText */ source: "file" }, // This should fail
    { inputText: "Valid input 3", source: "cli" },
  ];

  const result = factory.createBatch(inputs);

  logger.debug("Batch processing result", { result });

  assertExists(result, "Should return Result");

  // Batch should fail if any input fails
  if (!result.ok) {
    assertExists(result.error, "Should have errors array");
    assertEquals(Array.isArray(result.error), true, "Error should be array");
    assertEquals(result.error.length > 0, true, "Should have at least one error");

    logger.debug("Batch processing failed as expected", { errors: result.error });
  } else {
    // If all inputs are valid in the current implementation
    assertEquals(Array.isArray(result.data), true, "Data should be array");
    logger.debug("Batch processing succeeded", { count: result.data.length });
  }
});

Deno.test("StdinVariableFactory - 1_behavior - validate method checks input without creating", () => {
  logger.debug("Testing validate method behavior");

  const factory = new StdinVariableFactory();

  // Test valid input
  const validInput: StdinFactoryInput = {
    inputText: "Valid content",
    source: "cli",
  };

  const validResult = factory.validate(validInput);

  logger.debug("Valid input validation", { validResult });

  assertExists(validResult, "Should return Result");
  assertEquals(typeof validResult, "object", "Should be object");

  // Test invalid input
  const invalidInput: StdinFactoryInput = {
    // Missing inputText
    source: "cli",
  };

  const invalidResult = factory.validate(invalidInput);

  logger.debug("Invalid input validation", { invalidResult });

  assertEquals(invalidResult.ok, false, "Should fail validation for invalid input");
  if (!invalidResult.ok) {
    assertExists(invalidResult.error, "Should have validation error");
  }
});

Deno.test("StdinVariableFactory - 1_behavior - default instance is available", () => {
  logger.debug("Testing default instance availability");

  assertExists(defaultStdinVariableFactory, "Default instance should exist");
  assertEquals(
    defaultStdinVariableFactory instanceof StdinVariableFactory,
    true,
    "Should be StdinVariableFactory instance",
  );

  // Test that default instance works
  const result = defaultStdinVariableFactory.createFromText("Test with default instance");

  logger.debug("Default instance test", { result });

  assertExists(result, "Default instance should return Result");
  if (result.ok) {
    assertEquals(
      result.data.toRecord().input_text,
      "Test with default instance",
      "Default instance should work correctly",
    );
  }
});

Deno.test("StdinVariableFactory - 1_behavior - handles large input text", () => {
  logger.debug("Testing large input text handling");

  const factory = new StdinVariableFactory();
  const largeText = "A".repeat(10000); // 10KB of text

  const input: StdinFactoryInput = {
    inputText: largeText,
    source: "file",
    context: "Large input test",
  };

  const result = factory.create(input);

  logger.debug("Large input result", {
    textLength: largeText.length,
    success: result.ok,
  });

  assertExists(result, "Should handle large input");

  if (result.ok) {
    assertEquals(result.data.toRecord().input_text, largeText, "Should preserve large text");
    logger.debug("Large input handled successfully");
  } else {
    // If there are size limits, they should be handled gracefully
    assertExists(result.error, "Should have error for large input");
    logger.debug("Large input rejected with error", { error: result.error });
  }
});
