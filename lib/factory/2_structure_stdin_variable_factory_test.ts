/**
 * @fileoverview 2_structure tests for StdinVariableFactory
 * Testing structural integrity and design consistency
 *
 * Structure tests verify:
 * - Class cohesion and responsibility separation
 * - Method signatures and return type consistency
 * - No duplication of responsibilities
 * - Proper abstraction levels
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { StdinVariableFactory } from "./stdin_variable_factory.ts";
import type { StdinFactoryInput } from "./stdin_variable_factory.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("structure-stdin-variable-factory");

// Test fixtures
const validInput: StdinFactoryInput = {
  inputText: "Test stdin content",
  source: "cli",
  context: "Test context",
};

Deno.test("2_structure: class has single responsibility", () => {
  logger.debug("Testing single responsibility principle");

  // StdinVariableFactory should only be responsible for creating StdinVariable instances
  // It should not:
  // - Read stdin directly
  // - Parse or transform stdin content
  // - Manage stdin state
  // - Handle I/O operations
  // - Validate business logic beyond variable creation

  const factory = new StdinVariableFactory();

  // Verify only factory methods exist
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(factory))
    .filter((name) => typeof (factory as unknown as Record<string, unknown>)[name] === "function")
    .filter((name) => name !== "constructor");

  // Should have exactly these factory methods
  const expectedMethods = ["create", "createFromText", "createBatch", "validate"];
  assertEquals(methods.sort(), expectedMethods.sort());

  // Each method should have clear factory responsibility
  for (const method of methods) {
    assertEquals(typeof (factory as unknown as Record<string, unknown>)[method], "function");
  }
});

Deno.test("2_structure: method signature consistency", () => {
  logger.debug("Testing method signature consistency");

  const factory = new StdinVariableFactory();

  // Verify method signatures
  assertEquals(factory.create.length, 1); // Takes 1 parameter
  assertEquals(factory.createFromText.length, 1); // Takes 1 parameter (source has default)
  assertEquals(factory.createBatch.length, 1); // Takes 1 parameter
  assertEquals(factory.validate.length, 1); // Takes 1 parameter

  // All methods should return Result type
  const methods = [
    { name: "create", result: factory.create(validInput) },
    { name: "createFromText", result: factory.createFromText("test") },
    { name: "createBatch", result: factory.createBatch([validInput]) },
    { name: "validate", result: factory.validate(validInput) },
  ];

  for (const { name, result } of methods) {
    assertExists(result);
    assertEquals(typeof result.ok, "boolean", `${name} should return Result type`);
  }
});

Deno.test("2_structure: stateless factory behavior", () => {
  logger.debug("Testing stateless factory");

  // Factory should be stateless - no instance variables
  const factory1 = new StdinVariableFactory();
  const factory2 = new StdinVariableFactory();

  // Both factories should produce identical results
  const result1 = factory1.create(validInput);
  const result2 = factory2.create(validInput);

  assertEquals(result1.ok, result2.ok);

  // Factory should have no instance properties
  const instanceProps = Object.keys(factory1);
  assertEquals(instanceProps.length, 0, "Factory should have no instance properties");
});

Deno.test("2_structure: proper abstraction level", () => {
  logger.debug("Testing abstraction level");

  // The factory should work at the right level of abstraction
  // It should handle StdinVariable creation, not low-level stdin operations

  const factory = new StdinVariableFactory();

  // Input should be structured data, not raw streams
  const input: StdinFactoryInput = {
    inputText: "Content",
    source: "pipe",
    context: "From pipe",
  };

  const result = factory.create(input);
  assertEquals(result.ok, true);

  if (result.ok) {
    // Should return domain object, not raw data
    const stdinVar = result.data;
    assertEquals(typeof stdinVar.toRecord, "function");

    // Should not expose stdin internals
    assertEquals("read" in stdinVar, false);
    assertEquals("pipe" in stdinVar, false);
    assertEquals("stream" in stdinVar, false);
  }
});

Deno.test("2_structure: separation of concerns", () => {
  logger.debug("Testing separation of concerns");

  const factory = new StdinVariableFactory();

  // Factory methods should have distinct responsibilities

  // create: Main factory method for structured input
  const createResult = factory.create(validInput);
  assertEquals(createResult.ok, true);

  // createFromText: Convenience method for simple text
  const textResult = factory.createFromText("Simple text");
  assertEquals(textResult.ok, true);

  // createBatch: Bulk operations
  const batchResult = factory.createBatch([validInput, validInput]);
  assertEquals(batchResult.ok, true);
  if (batchResult.ok) {
    assertEquals(Array.isArray(batchResult.data), true);
  }

  // validate: Query without creation
  const validateResult = factory.validate(validInput);
  assertEquals(validateResult.ok, true);
  if (validateResult.ok) {
    assertEquals(validateResult.data, undefined); // Should not create object
  }
});

Deno.test("2_structure: consistent error handling", () => {
  logger.debug("Testing error handling consistency");

  const factory = new StdinVariableFactory();

  // All methods should handle errors consistently
  const errorCases = [
    { method: "create", input: {} },
    { method: "create", input: { inputText: "" } },
    { method: "createFromText", input: "" },
    { method: "createBatch", input: [{}] },
    { method: "validate", input: {} },
  ];

  for (const { method, input } of errorCases) {
    let result: { ok: boolean; data?: unknown; error?: unknown };
    switch (method) {
      case "create":
        result = factory.create(input as StdinFactoryInput);
        break;
      case "validate":
        result = factory.validate(input as StdinFactoryInput);
        break;
      case "createFromText":
        result = factory.createFromText(input as string);
        break;
      case "createBatch":
        result = factory.createBatch(input as unknown as StdinFactoryInput[]);
        break;
      default:
        result = { ok: false, error: new Error("Unknown method") };
        break;
    }

    assertEquals(result.ok !== undefined, true);
    if (!result.ok) {
      assertExists(result.error);
      if (method !== "createBatch") {
        if (result.error && typeof result.error === "object" && "kind" in result.error) {
          assertExists((result.error as { kind: string }).kind);
        }
      } else {
        // Batch returns array of errors
        assertEquals(Array.isArray(result.error), true);
      }
    }
  }
});

Deno.test("2_structure: method composition and delegation", () => {
  logger.debug("Testing method composition");

  const factory = new StdinVariableFactory();

  // createFromText should delegate to create
  const text = "Test content";
  const source = "pipe";

  const directResult = factory.create({
    inputText: text,
    source: source,
    context: `Direct text input from ${source}`,
  });

  const fromTextResult = factory.createFromText(text, source);

  // Both should produce same outcome
  assertEquals(directResult.ok, fromTextResult.ok);

  // validate should use create internally but return different result
  const validateResult = factory.validate({ inputText: text });
  assertEquals(validateResult.ok, true);
  if (validateResult.ok) {
    assertEquals(validateResult.data, undefined); // No data returned
  }
});

Deno.test("2_structure: no side effects in factory methods", () => {
  logger.debug("Testing pure function behavior");

  const factory = new StdinVariableFactory();
  const input = { inputText: "Test", source: "cli" as const };

  // Factory methods should not modify input
  const inputBefore = JSON.stringify(input);

  factory.create(input);
  factory.createFromText(input.inputText, input.source);
  factory.createBatch([input]);
  factory.validate(input);

  const inputAfter = JSON.stringify(input);
  assertEquals(inputBefore, inputAfter);
});

Deno.test("2_structure: batch operations maintain structure", () => {
  logger.debug("Testing batch operation structure");

  const factory = new StdinVariableFactory();

  // Batch should maintain all-or-none semantics
  const validInputs = [
    { inputText: "Text 1" },
    { inputText: "Text 2" },
  ];

  const mixedInputs = [
    { inputText: "Valid" },
    { inputText: "" }, // Invalid
  ];

  // All valid: returns array of results
  const allValidResult = factory.createBatch(validInputs);
  assertEquals(allValidResult.ok, true);
  if (allValidResult.ok) {
    assertEquals(Array.isArray(allValidResult.data), true);
    assertEquals(allValidResult.data.length, validInputs.length);
  }

  // Mixed: returns array of errors
  const mixedResult = factory.createBatch(mixedInputs);
  assertEquals(mixedResult.ok, false);
  if (!mixedResult.ok) {
    assertEquals(Array.isArray(mixedResult.error), true);
  }
});

Deno.test("2_structure: encapsulation of variable creation logic", () => {
  logger.debug("Testing encapsulation");

  const factory = new StdinVariableFactory();

  // Factory should encapsulate StdinVariable creation
  // Users shouldn't need to know about StdinVariable constructor
  const result = factory.create({ inputText: "Content" });

  assertEquals(result.ok, true);
  if (result.ok) {
    // Should return fully formed StdinVariable
    const stdinVar = result.data;

    // Verify it's a proper StdinVariable without accessing internals
    const record = stdinVar.toRecord();
    assertExists(record);
    assertExists(record.input_text);
    assertEquals(record.input_text, "Content");
  }

  // Factory hides complexity of error handling
  const errorResult = factory.create({});
  assertEquals(errorResult.ok, false);
  if (!errorResult.ok) {
    // Error is structured and meaningful
    if ("kind" in errorResult.error) {
      assertExists(errorResult.error.kind);
      assertEquals(errorResult.error.kind, "NoStdinData");
    }
  }
});
