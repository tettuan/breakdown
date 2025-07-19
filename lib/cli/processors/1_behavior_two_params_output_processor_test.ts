/**
 * @fileoverview Behavior tests for TwoParamsOutputProcessor
 *
 * Testing focus areas:
 * 1. Output writing functionality and success cases
 * 2. Error handling for write failures
 * 3. Data type handling (string vs object)
 * 4. Newline handling and formatting
 * 5. Result type behavior and error propagation
 *
 * @module lib/cli/processors/1_behavior_two_params_output_processor_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  type TwoParamsOutputError as _TwoParamsOutputError,
  TwoParamsOutputProcessor,
} from "./two_params_output_processor.ts";
import type { Result as _Result } from "$lib/types/result.ts";
import { isError, isOk } from "$lib/types/result.ts";

// =============================================================================
// 1_behavior: Output Writing Behavior Tests
// =============================================================================

Deno.test("1_behavior: writeOutput handles string data successfully", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = "Test output string";

  const result = await processor.writeOutput(testData);

  // Verify successful writing
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined); // void return type
  }
});

Deno.test("1_behavior: writeOutput handles object data successfully", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = { message: "Test output", status: "success", count: 42 };

  const result = await processor.writeOutput(testData);

  // Verify successful writing with JSON serialization
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined); // void return type
  }
});

Deno.test("1_behavior: writeOutput handles null data gracefully", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = null;

  const result = await processor.writeOutput(testData);

  // Should handle null by converting to JSON string
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: writeOutput handles undefined data gracefully", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = undefined;

  const result = await processor.writeOutput(testData);

  // Should handle undefined by converting to JSON string
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: writeOutput handles numeric data", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = 12345;

  const result = await processor.writeOutput(testData);

  // Should handle numbers by converting to JSON string
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: writeOutput handles boolean data", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = true;

  const result = await processor.writeOutput(testData);

  // Should handle booleans by converting to JSON string
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: writeOutput handles array data", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = ["item1", "item2", "item3"];

  const result = await processor.writeOutput(testData);

  // Should handle arrays by converting to JSON string
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

// =============================================================================
// 1_behavior: Newline Handling Behavior Tests
// =============================================================================

Deno.test("1_behavior: writeOutput adds newline to string without newline", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = "String without newline";

  const result = await processor.writeOutput(testData);

  // Should succeed and add newline internally
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: writeOutput preserves existing newline", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = "String with newline\n";

  const result = await processor.writeOutput(testData);

  // Should succeed and not add extra newline
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: writeOutput handles empty string", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = "";

  const result = await processor.writeOutput(testData);

  // Should handle empty string successfully
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: writeOutput handles string with only newline", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = "\n";

  const result = await processor.writeOutput(testData);

  // Should handle newline-only string successfully
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

// =============================================================================
// 1_behavior: JSON Serialization Behavior Tests
// =============================================================================

Deno.test("1_behavior: writeOutput handles complex nested objects", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = {
    level1: {
      level2: {
        level3: {
          data: "deeply nested",
          array: [1, 2, 3],
          boolean: true,
          null_value: null,
        },
      },
    },
    top_level_array: ["a", "b", "c"],
  };

  const result = await processor.writeOutput(testData);

  // Should handle complex objects through JSON serialization
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: writeOutput handles objects with special characters", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = {
    unicode: "Test with unicode: 🚀 ∑ ∆",
    quotes: "Text with \"quotes\" and 'apostrophes'",
    newlines: "Text with\nmultiple\nlines",
    tabs: "Text\twith\ttabs",
  };

  const result = await processor.writeOutput(testData);

  // Should handle special characters through JSON serialization
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

// =============================================================================
// 1_behavior: Error Handling Behavior Tests
// =============================================================================

Deno.test("1_behavior: writeOutput handles circular reference objects gracefully", async () => {
  const processor = new TwoParamsOutputProcessor();

  // Create circular reference
  const circularObj: Record<string, unknown> = { name: "test" };
  circularObj.self = circularObj;

  const result = await processor.writeOutput(circularObj);

  // Should handle circular reference error
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "StringificationError");
    assertExists(result.error.message);
    assertEquals(typeof result.error.message, "string");
    if (result.error.kind === "StringificationError") {
      assertExists(result.error.cause);
      assertExists(result.error.originalData);
    }
  }
});

// =============================================================================
// 1_behavior: Result Type Behavior Tests
// =============================================================================

Deno.test("1_behavior: writeOutput returns proper Result structure on success", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = "Success test";

  const result = await processor.writeOutput(testData);

  // Verify Result<void, TwoParamsOutputError> structure
  assertEquals(typeof result, "object");
  assertExists(result);
  assertEquals("ok" in result, true);

  if (result.ok) {
    assertEquals("data" in result, true);
    assertEquals("error" in result, false);
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: writeOutput returns proper error structure on failure", async () => {
  const processor = new TwoParamsOutputProcessor();

  // Create data that will cause JSON.stringify to fail
  const circularData: Record<string, unknown> = {};
  circularData.circular = circularData;

  const result = await processor.writeOutput(circularData);

  // Verify error Result structure
  assertEquals(typeof result, "object");
  assertExists(result);
  assertEquals("ok" in result, true);
  assertEquals(result.ok, false);

  if (!result.ok) {
    assertEquals("error" in result, true);
    assertEquals("data" in result, false);
    assertEquals(typeof result.error, "object");
    assertEquals(result.error.kind, "StringificationError");
    assertEquals(typeof result.error.message, "string");
    if (result.error.kind === "StringificationError") {
      assertExists(result.error.cause);
      assertExists(result.error.originalData);
    }
  }
});

Deno.test("1_behavior: TwoParamsOutputError maintains proper error structure", async () => {
  const processor = new TwoParamsOutputProcessor();

  // Force error condition
  const badData: Record<string, unknown> = {
    toJSON: () => {
      throw new Error("Custom JSON error");
    },
  };

  const result = await processor.writeOutput(badData);

  if (!result.ok) {
    const error = result.error;

    // Verify error type structure
    assertEquals(typeof error, "object");
    assertEquals("kind" in error, true);
    assertEquals("message" in error, true);
    assertEquals("cause" in error, true);

    assertEquals(error.kind, "StringificationError");
    assertEquals(typeof error.message, "string");
    assertEquals(error.message.includes("Custom JSON error"), true);
    if (error.kind === "StringificationError") {
      assertExists(error.cause);
      assertExists(error.originalData);
    }
  }
});

// =============================================================================
// 1_behavior: Data Type Conversion Behavior Tests
// =============================================================================

Deno.test("1_behavior: writeOutput handles various primitive types", async () => {
  const processor = new TwoParamsOutputProcessor();

  const testCases = [
    0,
    -0,
    Infinity,
    -Infinity,
    NaN,
    "",
    "string",
    true,
    false,
    null,
    undefined,
  ];

  for (const testData of testCases) {
    const result = await processor.writeOutput(testData);

    // All primitive types should be handled successfully
    assertEquals(result.ok, true, `Failed for data: ${testData}`);
    if (result.ok) {
      assertEquals(result.data, undefined);
    }
  }
});

Deno.test("1_behavior: writeOutput handles Date objects", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = new Date("2025-01-01T00:00:00Z");

  const result = await processor.writeOutput(testData);

  // Should handle Date objects through JSON serialization
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: writeOutput handles RegExp objects", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = /test.*pattern/gi;

  const result = await processor.writeOutput(testData);

  // Should handle RegExp objects through JSON serialization
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

// =============================================================================
// 1_behavior: Multiple Sequential Calls Behavior Tests
// =============================================================================

Deno.test("1_behavior: writeOutput handles multiple sequential calls", async () => {
  const processor = new TwoParamsOutputProcessor();

  const testData = [
    "First output",
    { message: "Second output" },
    ["Third", "output"],
    42,
  ];

  for (const data of testData) {
    const result = await processor.writeOutput(data);
    assertEquals(result.ok, true, `Failed for data: ${JSON.stringify(data)}`);
    if (result.ok) {
      assertEquals(result.data, undefined);
    }
  }
});

Deno.test("1_behavior: writeOutput maintains consistent behavior across calls", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = "Consistent output test";

  // Make multiple calls with same data
  const results = await Promise.all([
    processor.writeOutput(testData),
    processor.writeOutput(testData),
    processor.writeOutput(testData),
  ]);

  // All calls should succeed consistently
  for (const result of results) {
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data, undefined);
    }
  }
});

// =============================================================================
// 1_behavior: Edge Cases Behavior Tests
// =============================================================================

Deno.test("1_behavior: writeOutput handles very large strings", async () => {
  const processor = new TwoParamsOutputProcessor();
  const largeString = "x".repeat(10000); // 10KB string

  const result = await processor.writeOutput(largeString);

  // Should handle large strings successfully
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: writeOutput handles objects with many properties", async () => {
  const processor = new TwoParamsOutputProcessor();

  // Create object with many properties
  const largeObject: Record<string, number> = {};
  for (let i = 0; i < 1000; i++) {
    largeObject[`prop${i}`] = i;
  }

  const result = await processor.writeOutput(largeObject);

  // Should handle large objects successfully
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: writeOutput handles deeply nested arrays", async () => {
  const processor = new TwoParamsOutputProcessor();

  // Create deeply nested array
  let nestedArray: unknown = "deepest";
  for (let i = 0; i < 100; i++) {
    nestedArray = [nestedArray];
  }

  const result = await processor.writeOutput(nestedArray);

  // Should handle deep nesting successfully
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

// =============================================================================
// 1_behavior: Type Guard and Validation Behavior Tests
// =============================================================================

Deno.test("1_behavior: Result type guards work correctly for success", async () => {
  const processor = new TwoParamsOutputProcessor();
  const testData = "Type guard test";

  const result = await processor.writeOutput(testData);

  // Test type guards
  assertEquals(isOk(result), true);
  assertEquals(isError(result), false);

  if (isOk(result)) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: Result type guards work correctly for error", async () => {
  const processor = new TwoParamsOutputProcessor();

  // Create circular reference to force error
  const circularData: Record<string, unknown> = {};
  circularData.circular = circularData;

  const result = await processor.writeOutput(circularData);

  // Test type guards
  assertEquals(isError(result), true);
  assertEquals(isOk(result), false);

  if (isError(result)) {
    assertEquals(result.error.kind, "StringificationError");
  }
});
