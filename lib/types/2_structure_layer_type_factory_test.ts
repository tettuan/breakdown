/**
 * @fileoverview Structure Tests for LayerTypeFactory
 *
 * Tests the structural integrity and invalid value rejection
 * functionality of LayerTypeFactory.
 *
 * @module types/2_structure_layer_type_factory_test
 */

import { assertEquals, assert } from "@std/assert";
import { LayerTypeFactory, type LayerTypeCreationError } from "./layer_type_factory.ts";
import type { TwoParams_Result } from "../deps.ts";

/**
 * Structure Test Suite for LayerTypeFactory
 * 
 * Verifies:
 * - Invalid value rejection with proper error types
 * - Null and undefined input handling
 * - Type safety enforcement
 * - Error structure consistency
 */
Deno.test("LayerTypeFactory Structure - Null and Undefined Input Rejection", () => {
  // Test null input
  const nullResult = LayerTypeFactory.fromString(null);
  assert(!nullResult.ok, "Null input should be rejected");
  assertEquals(nullResult.error.kind, "NullInput", "Null input should produce NullInput error");

  // Test undefined input
  const undefinedResult = LayerTypeFactory.fromString(undefined);
  assert(!undefinedResult.ok, "Undefined input should be rejected");
  assertEquals(undefinedResult.error.kind, "NullInput", "Undefined input should produce NullInput error");
});

Deno.test("LayerTypeFactory Structure - Non-String Input Rejection", () => {
  const invalidInputs = [
    { value: 123, type: "number" },
    { value: true, type: "boolean" },
    { value: {}, type: "object" },
    { value: [], type: "object" },
    { value: Symbol("test"), type: "symbol" },
    { value: () => {}, type: "function" }
  ];

  for (const { value, type } of invalidInputs) {
    const result = LayerTypeFactory.fromString(value);
    assert(!result.ok, `${type} input should be rejected: ${value}`);
    assertEquals(result.error.kind, "InvalidInput", `${type} should produce InvalidInput error`);
    
    if (result.error.kind === "InvalidInput") {
      assertEquals(result.error.actualType, type, `Error should report actual type as ${type}`);
      assertEquals(result.error.input, value, "Error should include original input");
    }
  }
});

Deno.test("LayerTypeFactory Structure - Empty String Input Rejection", () => {
  const emptyInputs = ["", "   ", "\t", "\n", "\r\n", "  \t\n  "];

  for (const empty of emptyInputs) {
    const result = LayerTypeFactory.fromString(empty);
    assert(!result.ok, `Empty/whitespace input should be rejected: "${empty}"`);
    assertEquals(result.error.kind, "EmptyInput", "Empty input should produce EmptyInput error");
    
    if (result.error.kind === "EmptyInput") {
      assertEquals(result.error.input, empty, "Error should include original empty input");
    }
  }
});

Deno.test("LayerTypeFactory Structure - Unknown Layer Input Rejection", () => {
  const unknownLayers = [
    "unknown_layer",
    "nonexistent",
    "invalid_value",
    "xyz123",
    "not_a_layer",
    "random_string"
  ];

  for (const unknown of unknownLayers) {
    const result = LayerTypeFactory.fromString(unknown);
    assert(!result.ok, `Unknown layer should be rejected: ${unknown}`);
    assertEquals(result.error.kind, "UnknownLayer", "Unknown layer should produce UnknownLayer error");
    
    if (result.error.kind === "UnknownLayer") {
      assertEquals(result.error.input, unknown.toLowerCase(), "Error should include normalized input");
      assert(Array.isArray(result.error.suggestions), "Error should include suggestions array");
      assert(result.error.suggestions.length > 0, "Suggestions should not be empty");
    }
  }
});

Deno.test("LayerTypeFactory Structure - Error Type Discrimination", () => {
  // Test that each error type has distinct structure

  // NullInput error structure
  const nullResult = LayerTypeFactory.fromString(null);
  assert(!nullResult.ok, "Should produce error result");
  assertEquals(nullResult.error.kind, "NullInput");
  assertEquals(Object.keys(nullResult.error).length, 1, "NullInput should only have 'kind' property");

  // InvalidInput error structure
  const invalidResult = LayerTypeFactory.fromString(123);
  assert(!invalidResult.ok, "Should produce error result");
  assertEquals(invalidResult.error.kind, "InvalidInput");
  if (invalidResult.error.kind === "InvalidInput") {
    assert("input" in invalidResult.error, "InvalidInput should have 'input' property");
    assert("actualType" in invalidResult.error, "InvalidInput should have 'actualType' property");
    assertEquals(Object.keys(invalidResult.error).length, 3, "InvalidInput should have 3 properties");
  }

  // EmptyInput error structure
  const emptyResult = LayerTypeFactory.fromString("");
  assert(!emptyResult.ok, "Should produce error result");
  assertEquals(emptyResult.error.kind, "EmptyInput");
  if (emptyResult.error.kind === "EmptyInput") {
    assert("input" in emptyResult.error, "EmptyInput should have 'input' property");
    assertEquals(Object.keys(emptyResult.error).length, 2, "EmptyInput should have 2 properties");
  }

  // UnknownLayer error structure
  const unknownResult = LayerTypeFactory.fromString("unknown");
  assert(!unknownResult.ok, "Should produce error result");
  assertEquals(unknownResult.error.kind, "UnknownLayer");
  if (unknownResult.error.kind === "UnknownLayer") {
    assert("input" in unknownResult.error, "UnknownLayer should have 'input' property");
    assert("suggestions" in unknownResult.error, "UnknownLayer should have 'suggestions' property");
    assertEquals(Object.keys(unknownResult.error).length, 3, "UnknownLayer should have 3 properties");
  }
});

Deno.test("LayerTypeFactory Structure - TwoParams_Result Validation", () => {
  // Test invalid TwoParams_Result handling
  const invalidTwoParamsResults = [
    // Missing required properties
    {} as TwoParams_Result,
    { type: "two" } as TwoParams_Result,
    { type: "two", demonstrativeType: "to" } as TwoParams_Result,
    // Invalid layer type
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "invalid_layer",
      params: ["to", "invalid_layer"],
      options: {}
    } as TwoParams_Result
  ];

  for (const invalidResult of invalidTwoParamsResults) {
    const result = LayerTypeFactory.fromTwoParamsResult(invalidResult);
    assert(!result.ok, "Invalid TwoParams_Result should be rejected");
    assertEquals(result.error.kind, "ValidationFailed", "Should produce ValidationFailed error");
  }
});

Deno.test("LayerTypeFactory Structure - Result Type Consistency", () => {
  // Test that all methods return consistent result structure

  const testMethods = [
    () => LayerTypeFactory.fromString("project"),
    () => LayerTypeFactory.fromString("invalid"),
    () => LayerTypeFactory.fromString(null),
    () => LayerTypeFactory.fromTwoParamsResult({
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {}
    })
  ];

  for (const method of testMethods) {
    const result = method();
    
    // All results should have 'ok' property
    assert("ok" in result, "Result should have 'ok' property");
    assertEquals(typeof result.ok, "boolean", "ok property should be boolean");

    if (result.ok) {
      // Success results should have 'data' property
      assert("data" in result, "Success result should have 'data' property");
      assert(!("error" in result), "Success result should not have 'error' property");
    } else {
      // Error results should have 'error' property
      assert("error" in result, "Error result should have 'error' property");
      assert(!("data" in result), "Error result should not have 'data' property");
      
      // Error should have 'kind' property for discrimination
      assert("kind" in result.error, "Error should have 'kind' property");
      assertEquals(typeof result.error.kind, "string", "Error kind should be string");
    }
  }
});

Deno.test("LayerTypeFactory Structure - Error Message Immutability", () => {
  // Test that error objects are not modifiable
  const result = LayerTypeFactory.fromString("unknown");
  assert(!result.ok, "Should produce error result");

  if (result.error.kind === "UnknownLayer") {
    const originalSuggestions = result.error.suggestions;
    const originalLength = originalSuggestions.length;

    // Attempt to modify suggestions should not affect original
    try {
      // @ts-expect-error Testing runtime immutability
      originalSuggestions.push("new_suggestion");
    } catch {
      // Expected - readonly arrays should not be modifiable
    }

    // Error should maintain original structure
    assertEquals(result.error.suggestions.length, originalLength, "Suggestions should remain unchanged");
  }
});

Deno.test("LayerTypeFactory Structure - Layer Validation Edge Cases", () => {
  // Test edge cases for layer validation
  const edgeCases = [
    { input: "PROJECT", expected: true, description: "uppercase known layer" },
    { input: "project ", expected: true, description: "known layer with trailing space" },
    { input: " project", expected: true, description: "known layer with leading space" },
    { input: "Project", expected: true, description: "mixed case known layer" },
    { input: "", expected: false, description: "empty string" },
    { input: " ", expected: false, description: "whitespace only" },
    { input: "unknown", expected: false, description: "unknown layer" },
    { input: "proj", expected: false, description: "partial known layer" }
  ];

  for (const { input, expected, description } of edgeCases) {
    const result = LayerTypeFactory.isValidLayer(input);
    assertEquals(result, expected, `${description}: "${input}" should be ${expected}`);
  }
});

Deno.test("LayerTypeFactory Structure - Known Layers Immutability", () => {
  // Test that known layers array cannot be modified
  const knownLayers1 = LayerTypeFactory.getKnownLayers();
  const knownLayers2 = LayerTypeFactory.getKnownLayers();

  // Should return new array each time (defensive copy)
  assert(knownLayers1 !== knownLayers2, "Should return new array instance each time");
  assertEquals(knownLayers1.length, knownLayers2.length, "Array contents should be identical");

  // Verify contents are identical
  for (let i = 0; i < knownLayers1.length; i++) {
    assertEquals(knownLayers1[i], knownLayers2[i], `Element ${i} should be identical`);
  }
});