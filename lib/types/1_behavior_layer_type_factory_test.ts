/**
 * @fileoverview Behavior Tests for LayerTypeFactory
 *
 * Tests the behavioral requirements and valid layer type generation
 * functionality of LayerTypeFactory.
 *
 * @module types/1_behavior_layer_type_factory_test
 */

import { assertEquals, assert } from "@std/assert";
import { LayerTypeFactory } from "./layer_type_factory.ts";
import { LayerType } from "./mod.ts";
import type { TwoParams_Result } from "../deps.ts";

/**
 * Behavior Test Suite for LayerTypeFactory
 * 
 * Verifies:
 * - Valid layer type generation from strings
 * - Valid layer type generation from TwoParams_Result
 * - Layer validation functionality
 * - Suggestion generation for unknown inputs
 */
Deno.test("LayerTypeFactory Behavior - Valid Layer Creation from String", () => {
  const knownLayers = LayerTypeFactory.getKnownLayers();

  for (const layer of knownLayers) {
    // Test lowercase input
    const result = LayerTypeFactory.fromString(layer);
    assert(result.ok, `Should create LayerType for known layer: ${layer}`);
    assertEquals(result.data.getValue(), layer, `Created LayerType should have value: ${layer}`);

    // Test uppercase input
    const upperResult = LayerTypeFactory.fromString(layer.toUpperCase());
    assert(upperResult.ok, `Should create LayerType for uppercase layer: ${layer.toUpperCase()}`);
    assertEquals(upperResult.data.getValue(), layer, `Uppercase input should normalize to: ${layer}`);

    // Test mixed case input
    const mixedCase = layer.charAt(0).toUpperCase() + layer.slice(1);
    const mixedResult = LayerTypeFactory.fromString(mixedCase);
    assert(mixedResult.ok, `Should create LayerType for mixed case layer: ${mixedCase}`);
    assertEquals(mixedResult.data.getValue(), layer, `Mixed case input should normalize to: ${layer}`);

    // Test input with whitespace
    const paddedResult = LayerTypeFactory.fromString(`  ${layer}  `);
    assert(paddedResult.ok, `Should create LayerType for padded layer: "  ${layer}  "`);
    assertEquals(paddedResult.data.getValue(), layer, `Padded input should normalize to: ${layer}`);
  }
});

Deno.test("LayerTypeFactory Behavior - Valid Layer Creation from TwoParams_Result", () => {
  const knownLayers = LayerTypeFactory.getKnownLayers();

  for (const layer of knownLayers) {
    const twoParamsResult: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: layer,
      params: ["to", layer],
      options: {}
    };

    const result = LayerTypeFactory.fromTwoParamsResult(twoParamsResult);
    assert(result.ok, `Should create LayerType from TwoParams_Result for layer: ${layer}`);
    assertEquals(result.data.getValue(), layer, `Created LayerType should have value: ${layer}`);
    assertEquals(result.data instanceof LayerType, true, "Result should be LayerType instance");
  }
});

Deno.test("LayerTypeFactory Behavior - Layer Validation", () => {
  const knownLayers = LayerTypeFactory.getKnownLayers();

  // Test valid layers
  for (const layer of knownLayers) {
    assertEquals(LayerTypeFactory.isValidLayer(layer), true, `${layer} should be valid`);
    assertEquals(LayerTypeFactory.isValidLayer(layer.toUpperCase()), true, `${layer.toUpperCase()} should be valid`);
    assertEquals(LayerTypeFactory.isValidLayer(`  ${layer}  `), true, `"  ${layer}  " should be valid`);
  }

  // Test invalid layers
  const invalidLayers = ["unknown", "invalid", "nonexistent", ""];
  for (const invalid of invalidLayers) {
    assertEquals(LayerTypeFactory.isValidLayer(invalid), false, `${invalid} should be invalid`);
  }
});

Deno.test("LayerTypeFactory Behavior - Known Layers Consistency", () => {
  const knownLayers = LayerTypeFactory.getKnownLayers();

  // Should have expected minimum layers
  assert(knownLayers.length >= 4, "Should have at least 4 known layers");

  // Should contain core layers
  const expectedLayers = ["project", "issue", "task"];
  for (const expected of expectedLayers) {
    assert(knownLayers.includes(expected), `Should include core layer: ${expected}`);
  }

  // All layers should be lowercase
  for (const layer of knownLayers) {
    assertEquals(layer, layer.toLowerCase(), `Layer ${layer} should be lowercase`);
  }

  // All layers should be non-empty strings
  for (const layer of knownLayers) {
    assertEquals(typeof layer, "string", `Layer should be string: ${layer}`);
    assert(layer.length > 0, `Layer should not be empty: ${layer}`);
    assert(layer.trim() === layer, `Layer should not have whitespace: "${layer}"`);
  }
});

Deno.test("LayerTypeFactory Behavior - Suggestion Generation", () => {
  // Test suggestions for partial matches
  const partialResult = LayerTypeFactory.fromString("pro");
  assert(!partialResult.ok, "Partial match should fail");
  if (!partialResult.ok && partialResult.error.kind === "UnknownLayer") {
    assert(partialResult.error.suggestions.length > 0, "Should provide suggestions for partial match");
    assert(partialResult.error.suggestions.includes("project"), "Should suggest 'project' for 'pro'");
  }

  // Test suggestions for similar inputs
  const similarResult = LayerTypeFactory.fromString("proj");
  assert(!similarResult.ok, "Similar input should fail");
  if (!similarResult.ok && similarResult.error.kind === "UnknownLayer") {
    assert(similarResult.error.suggestions.length > 0, "Should provide suggestions for similar input");
  }

  // Test suggestions for completely unknown inputs
  const unknownResult = LayerTypeFactory.fromString("completely_unknown_xyz");
  assert(!unknownResult.ok, "Unknown input should fail");
  if (!unknownResult.ok && unknownResult.error.kind === "UnknownLayer") {
    assert(unknownResult.error.suggestions.length > 0, "Should provide fallback suggestions");
    // Should provide all known layers as fallback
    const knownLayers = LayerTypeFactory.getKnownLayers();
    assert(unknownResult.error.suggestions.length >= knownLayers.length, "Should include all known layers as fallback");
  }
});

Deno.test("LayerTypeFactory Behavior - Input Normalization", () => {
  const testCases = [
    { input: "PROJECT", expected: "project" },
    { input: "  task  ", expected: "task" },
    { input: "Issue", expected: "issue" },
    { input: "\t\nbugs\t\n", expected: "bugs" }
  ];

  for (const testCase of testCases) {
    const result = LayerTypeFactory.fromString(testCase.input);
    assert(result.ok, `Should handle normalized input: "${testCase.input}"`);
    assertEquals(result.data.getValue(), testCase.expected, 
      `Input "${testCase.input}" should normalize to "${testCase.expected}"`);
  }
});

Deno.test("LayerTypeFactory Behavior - Created LayerType Properties", () => {
  const result = LayerTypeFactory.fromString("project");
  assert(result.ok, "Should create LayerType successfully");

  const layerType = result.data;

  // Test LayerType properties
  assertEquals(typeof layerType.getValue(), "string", "getValue should return string");
  assertEquals(layerType.getValue(), "project", "getValue should return correct value");

  // Test LayerType behavior
  assertEquals(layerType instanceof LayerType, true, "Should be LayerType instance");

  // LayerType should be immutable
  const originalValue = layerType.getValue();
  assertEquals(layerType.getValue(), originalValue, "LayerType value should remain consistent");
});

Deno.test("LayerTypeFactory Behavior - Error Message Quality", () => {
  // Test error messages contain useful information

  // Empty input error
  const emptyResult = LayerTypeFactory.fromString("");
  assert(!emptyResult.ok, "Empty input should fail");
  if (!emptyResult.ok) {
    assertEquals(emptyResult.error.kind, "EmptyInput", "Should identify empty input error");
    assertEquals("input" in emptyResult.error, true, "Error should include input value");
  }

  // Invalid type error
  const invalidResult = LayerTypeFactory.fromString(123);
  assert(!invalidResult.ok, "Invalid type should fail");
  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "InvalidInput", "Should identify invalid input error");
    assertEquals("actualType" in invalidResult.error, true, "Error should include actual type");
  }

  // Unknown layer error
  const unknownResult = LayerTypeFactory.fromString("unknown");
  assert(!unknownResult.ok, "Unknown layer should fail");
  if (!unknownResult.ok) {
    assertEquals(unknownResult.error.kind, "UnknownLayer", "Should identify unknown layer error");
    assertEquals("suggestions" in unknownResult.error, true, "Error should include suggestions");
  }
});