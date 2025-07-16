/**
 * @fileoverview Totality pattern compliance tests for LayerType
 *
 * This test file verifies that LayerType follows the Totality principle:
 * - Complete error handling with Result type
 * - No partial functions
 * - Exhaustive pattern matching
 * - Smart constructor patterns with explicit error cases
 *
 * @module lib/types/1_totality_layer_type_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { LayerType } from "./mod.ts";
import type { TwoParams_Result } from "../deps.ts";

// Test helper to create valid TwoParams_Result
const createTwoParamsResult = (
  layerType: string,
  directiveType: string = "to",
  options: Record<string, unknown> = {},
): TwoParams_Result => ({
  type: "two",
  directiveType,
  layerType,
  demonstrativeType: directiveType,
  params: [directiveType, layerType],
  options,
});

Deno.test("1_totality: LayerType.create handles all input cases exhaustively", () => {
  // Test all valid cases
  const validInputs = [
    "project",
    "issue",
    "task",
    "bugs",
    "feature",
    "epic",
    "temp",
    "a", // minimum length
    "a".repeat(30), // maximum length
    "test-layer",
    "custom_layer",
    "layer123",
  ];

  for (const input of validInputs) {
    const result = LayerType.create(input);
    assertEquals(result.ok, true, `Input "${input}" should be valid`);
    if (result.ok) {
      assertExists(result.data);
      assertEquals(result.data.value, input);
    }
  }

  // Test all invalid cases with proper error discrimination
  const invalidCases = [
    { input: "", expectedError: "EmptyInput" },
    { input: "   ", expectedError: "EmptyInput" },
    { input: null, expectedError: "EmptyInput" },
    { input: undefined, expectedError: "EmptyInput" },
    { input: "a".repeat(31), expectedError: "TooLong" }, // exceeds max length
    { input: "PROJECT", expectedError: "InvalidFormat" }, // uppercase
    { input: "project!", expectedError: "InvalidFormat" }, // special chars
    { input: "project space", expectedError: "InvalidFormat" }, // space
    { input: "プロジェクト", expectedError: "InvalidFormat" }, // non-ASCII
  ];

  for (const testCase of invalidCases) {
    const result = LayerType.create(testCase.input as any);
    assertEquals(result.ok, false, `Input "${testCase.input}" should be invalid`);
    if (!result.ok) {
      assertEquals(result.error.kind, testCase.expectedError);
      assertExists(result.error.message);
      assertEquals(typeof result.error.message, "string");
    }
  }
});

Deno.test("1_totality: LayerType.create with TwoParams_Result compatibility", () => {
  // Test valid TwoParams_Result cases
  const validTwoParamsResults = [
    createTwoParamsResult("project"),
    createTwoParamsResult("issue", "summary"),
    createTwoParamsResult("task", "defect"),
    createTwoParamsResult("bugs"),
    createTwoParamsResult("feature"),
  ];

  for (const twoParamsResult of validTwoParamsResults) {
    const result = LayerType.create(twoParamsResult);
    assertEquals(
      result.ok,
      true,
      `TwoParams_Result with "${twoParamsResult.layerType}" should be valid`,
    );
    if (result.ok) {
      assertEquals(result.data.value, twoParamsResult.layerType);
    }
  }

  // Test invalid TwoParams_Result cases
  const invalidTwoParamsResults = [
    createTwoParamsResult(""), // empty layerType
    createTwoParamsResult("PROJECT"), // uppercase
    createTwoParamsResult("invalid!"), // special chars
    createTwoParamsResult("a".repeat(31)), // too long
  ];

  for (const twoParamsResult of invalidTwoParamsResults) {
    const result = LayerType.create(twoParamsResult);
    assertEquals(
      result.ok,
      false,
      `TwoParams_Result with "${twoParamsResult.layerType}" should be invalid`,
    );
    if (!result.ok) {
      assertExists(result.error.message);
    }
  }
});

Deno.test("1_totality: LayerType.fromString with comprehensive error handling", () => {
  // Test all valid string inputs
  const validStringInputs = [
    "project",
    "issue",
    "task",
    "custom-layer",
    "layer_type",
    "test123",
  ];

  for (const input of validStringInputs) {
    const result = LayerType.fromString(input);
    assertEquals(result.ok, true, `String input "${input}" should be valid`);
    if (result.ok) {
      assertEquals(result.data.value, input);
    }
  }

  // Test invalid inputs with detailed error information
  const invalidInputs = [
    { input: null, expectedKind: "EmptyInput" },
    { input: undefined, expectedKind: "EmptyInput" },
    { input: "", expectedKind: "EmptyInput" },
    { input: "   ", expectedKind: "EmptyInput" },
    { input: 123, expectedKind: "EmptyInput" }, // non-string
    { input: {}, expectedKind: "EmptyInput" }, // object
    { input: [], expectedKind: "EmptyInput" }, // array
  ];

  for (const testCase of invalidInputs) {
    const result = LayerType.fromString(testCase.input as any);
    assertEquals(result.ok, false, `Input "${testCase.input}" should be invalid`);
    if (!result.ok) {
      assertEquals(result.error.kind, testCase.expectedKind);
      assertExists(result.error.message);
    }
  }
});

Deno.test("1_totality: LayerType error types are discriminated unions", () => {
  // Test EmptyInput error structure
  const emptyResult = LayerType.create("");
  assertEquals(emptyResult.ok, false);
  if (!emptyResult.ok) {
    assertEquals(emptyResult.error.kind, "EmptyInput");
    assertEquals(typeof emptyResult.error.message, "string");
    // EmptyInput should not have additional properties
    assertEquals("value" in emptyResult.error, false);
    assertEquals("pattern" in emptyResult.error, false);
  }

  // Test TooLong error structure
  const tooLongResult = LayerType.create("a".repeat(31));
  assertEquals(tooLongResult.ok, false);
  if (!tooLongResult.ok) {
    assertEquals(tooLongResult.error.kind, "TooLong");
    assertEquals(typeof tooLongResult.error.message, "string");
    // TooLong should have value and maxLength
    assertEquals("value" in tooLongResult.error, true);
    assertEquals("maxLength" in tooLongResult.error, true);
    assertEquals(tooLongResult.error.value, "a".repeat(31));
    assertEquals(tooLongResult.error.maxLength, 30);
  }

  // Test InvalidFormat error structure
  const invalidFormatResult = LayerType.create("PROJECT");
  assertEquals(invalidFormatResult.ok, false);
  if (!invalidFormatResult.ok) {
    assertEquals(invalidFormatResult.error.kind, "InvalidFormat");
    assertEquals(typeof invalidFormatResult.error.message, "string");
    // InvalidFormat should have value and pattern
    assertEquals("value" in invalidFormatResult.error, true);
    assertEquals("pattern" in invalidFormatResult.error, true);
    assertEquals(invalidFormatResult.error.value, "PROJECT");
    assertEquals(typeof invalidFormatResult.error.pattern, "string");
  }
});

Deno.test("1_totality: LayerType domain methods have total behavior", () => {
  const layerResult = LayerType.create("project");
  assertEquals(layerResult.ok, true);

  if (layerResult.ok) {
    const layer = layerResult.data;

    // isValidForDirective should handle all directive cases
    assertEquals(typeof layer.isValidForDirective({ value: "to" }), "boolean");
    assertEquals(typeof layer.isValidForDirective({ value: "" }), "boolean");
    assertEquals(typeof layer.isValidForDirective({ value: "invalid" }), "boolean");

    // getPromptFilename should handle all cases
    assertEquals(typeof layer.getPromptFilename("from"), "string");
    assertEquals(typeof layer.getPromptFilename("from", "strict"), "string");
    assertEquals(typeof layer.getPromptFilename(""), "string");

    // getSchemaFilename should be total
    assertEquals(typeof layer.getSchemaFilename(), "string");
    assertEquals(layer.getSchemaFilename(), "base.schema.json");

    // isValidForResourcePath should be total
    assertEquals(typeof layer.isValidForResourcePath(), "boolean");

    // equals should handle all cases
    const otherLayer = LayerType.create("issue");
    assertEquals(otherLayer.ok, true);
    if (otherLayer.ok) {
      assertEquals(typeof layer.equals(otherLayer.data), "boolean");
      assertEquals(typeof layer.equals(layer), "boolean");
    }
  }
});

Deno.test("1_totality: LayerType static methods provide complete coverage", () => {
  // getCommonLayerTypes should return consistent array
  const commonTypes = LayerType.getCommonLayerTypes();
  assertEquals(Array.isArray(commonTypes), true);
  assertEquals(commonTypes.length > 0, true);
  for (const type of commonTypes) {
    assertEquals(typeof type, "string");
    const result = LayerType.create(type);
    assertEquals(result.ok, true);
  }

  // getKnownLayerTypes should include all common types
  const knownTypes = LayerType.getKnownLayerTypes();
  assertEquals(Array.isArray(knownTypes), true);
  for (const commonType of commonTypes) {
    assertEquals(knownTypes.includes(commonType), true);
  }

  // isValidLayer should handle all string inputs
  assertEquals(typeof LayerType.isValidLayer("project"), "boolean");
  assertEquals(typeof LayerType.isValidLayer("invalid"), "boolean");
  assertEquals(typeof LayerType.isValidLayer(""), "boolean");
  assertEquals(LayerType.isValidLayer("project"), true);
  assertEquals(LayerType.isValidLayer("invalid"), false);
});

Deno.test("1_totality: LayerType instance methods provide complete behavior", () => {
  const layerResult = LayerType.create("project");
  assertEquals(layerResult.ok, true);

  if (layerResult.ok) {
    const layer = layerResult.data;

    // isCommonLayerType should be total
    assertEquals(typeof layer.isCommonLayerType(), "boolean");

    // isKnownLayerType should be total
    assertEquals(typeof layer.isKnownLayerType(), "boolean");

    // toString should always return string
    assertEquals(typeof layer.toString(), "string");
    assertEquals(layer.toString(), layer.value);

    // toDebugString should provide comprehensive information
    const debugString = layer.toDebugString();
    assertEquals(typeof debugString, "string");
    assertEquals(debugString.includes("LayerType"), true);
    assertEquals(debugString.includes(layer.value), true);
  }
});

Deno.test("1_totality: LayerType factory methods handle edge cases completely", () => {
  // fromTwoParamsResult should handle all TwoParams_Result cases
  const validTwoParams = createTwoParamsResult("project");
  const result1 = LayerType.fromTwoParamsResult(validTwoParams);
  assertEquals(result1.ok, true);

  const invalidTwoParams = createTwoParamsResult("");
  const result2 = LayerType.fromTwoParamsResult(invalidTwoParams);
  assertEquals(result2.ok, false);

  // fromString should provide suggestions for unknown inputs
  const unknownResult = LayerType.fromString("unknown-layer-type");
  assertEquals(unknownResult.ok, false);
  if (!unknownResult.ok) {
    // Should have suggestions for unknown layer types
    assertEquals("suggestions" in unknownResult.error, true);
    if ("suggestions" in unknownResult.error) {
      assertEquals(Array.isArray(unknownResult.error.suggestions), true);
    }
  }
});
