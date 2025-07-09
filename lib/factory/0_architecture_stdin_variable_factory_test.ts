/**
 * @fileoverview 0_architecture tests for StdinVariableFactory
 * Testing architectural constraints and design patterns compliance
 *
 * Architecture tests verify:
 * - Factory pattern implementation
 * - Domain boundary constraints
 * - Result type constraints
 * - Totality pattern compliance
 */

import { assertEquals, assertExists } from "@std/assert";
import { defaultStdinVariableFactory, StdinVariableFactory } from "./stdin_variable_factory.ts";
import type { StdinFactoryInput } from "./stdin_variable_factory.ts";
import type { Result } from "../types/result.ts";

// Architecture Test Fixtures
const validInput: StdinFactoryInput = {
  inputText: "Test stdin content",
  source: "cli",
  context: "Test context",
};

const validMinimalInput: StdinFactoryInput = {
  inputText: "Minimal content",
};

Deno.test("0_architecture: Factory pattern - public constructor allowed for stateless factory", () => {
  // ARCHITECTURE CONSTRAINT: Factory can have public constructor if stateless
  // StdinVariableFactory is stateless, so public constructor is acceptable
  const factory = new StdinVariableFactory();
  assertExists(factory);
  assertEquals(factory instanceof StdinVariableFactory, true);

  // Verify factory methods exist
  assertEquals(typeof factory.create, "function");
  assertEquals(typeof factory.createFromText, "function");
  assertEquals(typeof factory.createBatch, "function");
  assertEquals(typeof factory.validate, "function");
});

Deno.test("0_architecture: Factory methods return Result type", () => {
  // ARCHITECTURE CONSTRAINT: All factory methods must return Result<T, E> type
  const factory = new StdinVariableFactory();

  // Test create method
  const createResult = factory.create(validInput);
  assertExists(createResult);
  assertEquals(typeof createResult.ok, "boolean");

  // Test createFromText method
  const textResult = factory.createFromText("Test text");
  assertExists(textResult);
  assertEquals(typeof textResult.ok, "boolean");

  // Test createBatch method
  const batchResult = factory.createBatch([validInput]);
  assertExists(batchResult);
  assertEquals(typeof batchResult.ok, "boolean");

  // Test validate method
  const validateResult = factory.validate(validInput);
  assertExists(validateResult);
  assertEquals(typeof validateResult.ok, "boolean");
});

Deno.test("0_architecture: Domain boundary constraint - no exceptions across boundary", () => {
  // ARCHITECTURE CONSTRAINT: Domain boundaries must not leak exceptions
  const factory = new StdinVariableFactory();

  const boundaryViolationTests = [
    { desc: "null input", input: null },
    { desc: "undefined input", input: undefined },
    { desc: "string input", input: "string" },
    { desc: "number input", input: 123 },
    { desc: "array input", input: [] },
    { desc: "empty object", input: {} },
    { desc: "invalid source", input: { inputText: "test", source: "invalid" } },
  ];

  for (const { desc, input } of boundaryViolationTests) {
    // Should never throw - all errors must be captured in Result type
    try {
      const result = factory.create(input as any);

      assertEquals(result.ok !== undefined, true, `Result.ok should exist for ${desc}`);
      if (!result.ok) {
        assertExists(result.error, `Error should exist for ${desc}`);
      }
    } catch (error) {
      // If an exception is thrown, it's a boundary violation
      const errorMessage = error instanceof Error ? error.message : String(error);
      assertEquals(
        false,
        true,
        `Boundary violation: exception thrown for ${desc}: ${errorMessage}`,
      );
    }
  }
});

Deno.test("0_architecture: Result type structure compliance", () => {
  // ARCHITECTURE CONSTRAINT: Result must have proper discriminated union structure
  const factory = new StdinVariableFactory();

  // Test success case
  const successResult = factory.create(validInput);
  if (successResult.ok) {
    assertExists(successResult.data);
    assertEquals("error" in successResult, false);
    // Verify data is StdinVariable instance
    assertEquals(typeof successResult.data.toRecord, "function");
  }

  // Test error case
  const errorResult = factory.create({ inputText: "" });
  if (!errorResult.ok) {
    assertExists(errorResult.error);
    assertEquals("data" in errorResult, false);
    assertExists(errorResult.error.kind);
  }
});

Deno.test("0_architecture: Error type consistency", () => {
  // ARCHITECTURE CONSTRAINT: Errors must follow defined error types
  const factory = new StdinVariableFactory();

  const errorCases = [
    { input: {}, expectedKind: "NoStdinData" },
    { input: { inputText: "" }, expectedKind: "EmptyValue" },
    { input: { inputText: "test", source: "invalid" as any }, expectedKind: "InvalidStdinSource" },
  ];

  for (const { input, expectedKind } of errorCases) {
    const result = factory.create(input);

    if (!result.ok) {
      assertExists(result.error.kind);
      assertEquals(typeof result.error.kind, "string");

      // Verify error kinds are from defined set
      const validErrorKinds = [
        "EmptyValue",
        "InvalidKey",
        "TypeMismatch",
        "NoStdinData",
        "InvalidStdinSource",
      ];
      assertEquals(validErrorKinds.includes(result.error.kind), true);
    }
  }
});

Deno.test("0_architecture: Default instance pattern", () => {
  // ARCHITECTURE CONSTRAINT: Default instance should be exported for convenience
  assertExists(defaultStdinVariableFactory);
  assertEquals(defaultStdinVariableFactory instanceof StdinVariableFactory, true);

  // Default instance should work same as new instance
  const customFactory = new StdinVariableFactory();
  const defaultResult = defaultStdinVariableFactory.create(validInput);
  const customResult = customFactory.create(validInput);

  assertEquals(defaultResult.ok, customResult.ok);
});

Deno.test("0_architecture: Integration with core types", () => {
  // ARCHITECTURE CONSTRAINT: Factory must integrate with core domain types
  const factory = new StdinVariableFactory();
  const result = factory.create(validInput);

  if (result.ok) {
    // Should create StdinVariable from domain
    const stdinVar = result.data;

    // Verify StdinVariable interface
    assertEquals(typeof stdinVar.toRecord, "function");

    // Verify toRecord returns expected structure
    const record = stdinVar.toRecord();
    assertExists(record);
    assertEquals(typeof record, "object");
    assertExists(record.input_text);
  }
});

Deno.test("0_architecture: Batch operations maintain Result pattern", () => {
  // ARCHITECTURE CONSTRAINT: Batch operations must follow Result pattern
  const factory = new StdinVariableFactory();

  // Test all success
  const allValidInputs = [
    { inputText: "Test 1" },
    { inputText: "Test 2" },
    { inputText: "Test 3" },
  ];
  const successBatch = factory.createBatch(allValidInputs);
  assertEquals(successBatch.ok, true);
  if (successBatch.ok) {
    assertEquals(Array.isArray(successBatch.data), true);
    assertEquals(successBatch.data.length, 3);
  }

  // Test with errors
  const mixedInputs = [
    { inputText: "Valid" },
    { inputText: "" }, // Will cause error
    { inputText: "Another valid" },
  ];
  const errorBatch = factory.createBatch(mixedInputs);
  assertEquals(errorBatch.ok, false);
  if (!errorBatch.ok) {
    assertEquals(Array.isArray(errorBatch.error), true);
    assertEquals(errorBatch.error.length > 0, true);
  }
});

Deno.test("0_architecture: Validate method follows command/query separation", () => {
  // ARCHITECTURE CONSTRAINT: Validate should be query (no side effects)
  const factory = new StdinVariableFactory();

  const input = { inputText: "Test validation" };

  // Multiple validate calls should not affect each other
  const result1 = factory.validate(input);
  const result2 = factory.validate(input);
  const result3 = factory.validate(input);

  assertEquals(result1.ok, result2.ok);
  assertEquals(result2.ok, result3.ok);

  // Validate should not modify input
  const inputBefore = JSON.stringify(input);
  factory.validate(input);
  const inputAfter = JSON.stringify(input);
  assertEquals(inputBefore, inputAfter);
});

Deno.test("0_architecture: Factory methods are composable", () => {
  // ARCHITECTURE CONSTRAINT: Factory methods should support composition
  const factory = new StdinVariableFactory();

  // createFromText should compose with create
  const directResult = factory.create({
    inputText: "Test text",
    source: "pipe",
    context: "Direct text input from pipe",
  });

  const fromTextResult = factory.createFromText("Test text", "pipe");

  assertEquals(directResult.ok, fromTextResult.ok);
  if (directResult.ok && fromTextResult.ok) {
    // Both should produce equivalent StdinVariable
    const directRecord = directResult.data.toRecord();
    const fromTextRecord = fromTextResult.data.toRecord();
    assertEquals(directRecord.input_text, fromTextRecord.input_text);
  }
});
