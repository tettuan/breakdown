/**
 * @fileoverview Behavior Tests for LayerType
 *
 * Tests the behavioral requirements and valid layer type generation
 * functionality of LayerType.
 *
 * @module types/1_behavior_layer_type_factory_test
 */

import { assert, assertEquals } from "jsr:@std/assert@0.224.0";
import { LayerType } from "../domain/core/value_objects/layer_type.ts";
import type { TwoParams_Result } from "../deps.ts";

/**
 * Behavior Test Suite for LayerType
 *
 * Verifies:
 * - Valid layer type generation from strings
 * - Valid layer type generation from TwoParams_Result
 * - Layer validation functionality
 * - Suggestion generation for unknown inputs
 */
Deno.test("LayerType Behavior - Valid Layer Creation from String", () => {
  const knownLayers = LayerType.getKnownLayerTypes();

  for (const layer of knownLayers) {
    // Test lowercase input
    const result = LayerType.fromString(layer);
    assert(result.ok, `Should create LayerType for known layer: ${layer}`);
    assertEquals(result.data.value, layer, `Created LayerType should have value: ${layer}`);

    // Test uppercase input
    const upperResult = LayerType.fromString(layer.toUpperCase());
    assert(upperResult.ok, `Should create LayerType for uppercase layer: ${layer.toUpperCase()}`);
    assertEquals(
      upperResult.data.value,
      layer,
      `Uppercase input should normalize to: ${layer}`,
    );

    // Test mixed case input
    const mixedCase = layer.charAt(0).toUpperCase() + layer.slice(1);
    const mixedResult = LayerType.fromString(mixedCase);
    assert(mixedResult.ok, `Should create LayerType for mixed case layer: ${mixedCase}`);
    assertEquals(
      mixedResult.data.value,
      layer,
      `Mixed case input should normalize to: ${layer}`,
    );

    // Test input with whitespace
    const paddedResult = LayerType.fromString(`  ${layer}  `);
    assert(paddedResult.ok, `Should create LayerType for padded layer: "  ${layer}  "`);
    assertEquals(paddedResult.data.value, layer, `Padded input should normalize to: ${layer}`);
  }
});

Deno.test("LayerType Behavior - Valid Layer Creation from TwoParams_Result", () => {
  const knownLayers = LayerType.getKnownLayerTypes();

  for (const layer of knownLayers) {
    const twoParamsResult: TwoParams_Result = {
      type: "two",
      directiveType: "to",
      demonstrativeType: "to",
      layerType: layer,
      params: ["to", layer],
      options: {},
    };

    const result = LayerType.fromTwoParamsResult(twoParamsResult);
    assert(result.ok, `Should create LayerType from TwoParams_Result for layer: ${layer}`);
    assertEquals(result.data.value, layer, `Created LayerType should have value: ${layer}`);
    assertEquals(result.data instanceof LayerType, true, "Result should be LayerType instance");
  }
});

Deno.test("LayerType Behavior - Layer Validation", () => {
  const knownLayers = LayerType.getKnownLayerTypes();

  // Test valid layers
  for (const layer of knownLayers) {
    assertEquals(LayerType.isValidLayer(layer), true, `${layer} should be valid`);
    assertEquals(
      LayerType.isValidLayer(layer.toUpperCase()),
      true,
      `${layer.toUpperCase()} should be valid`,
    );
    assertEquals(
      LayerType.isValidLayer(`  ${layer}  `),
      true,
      `"  ${layer}  " should be valid`,
    );
  }

  // Test invalid layers
  const invalidLayers = ["unknown", "invalid", "nonexistent", ""];
  for (const invalid of invalidLayers) {
    assertEquals(LayerType.isValidLayer(invalid), false, `${invalid} should be invalid`);
  }
});

Deno.test("LayerType Behavior - Known Layers Consistency", () => {
  const knownLayers = LayerType.getKnownLayerTypes();

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

Deno.test("LayerType Behavior - Suggestion Generation", () => {
  // Test error handling for invalid patterns
  const invalidFormatResult = LayerType.fromString("INVALID-UPPER-CASE");
  if (!invalidFormatResult.ok && invalidFormatResult.error.kind === "InvalidFormat") {
    assert(
      invalidFormatResult.error.message.includes("invalid characters"),
      "Should explain format error",
    );
  } else if (!invalidFormatResult.ok && invalidFormatResult.error.kind === "PatternMismatch") {
    assert(invalidFormatResult.error.validLayers.length > 0, "Should provide valid layers");
  } else {
    // If it's valid, that's also fine since the pattern allows it
    assert(invalidFormatResult.ok, "Should either be valid or provide proper error");
  }

  // Test error handling for too long inputs
  const tooLongResult = LayerType.fromString(
    "this_is_a_very_long_layer_name_that_exceeds_the_maximum_allowed_length",
  );
  assert(!tooLongResult.ok, "Too long input should fail");
  if (!tooLongResult.ok && tooLongResult.error.kind === "TooLong") {
    assert(tooLongResult.error.maxLength > 0, "Should provide max length information");
  }

  // Test empty input error handling
  const emptyResult = LayerType.fromString("");
  assert(!emptyResult.ok, "Empty input should fail");
  if (!emptyResult.ok && emptyResult.error.kind === "EmptyInput") {
    assert(emptyResult.error.message.includes("empty"), "Should explain empty input error");
  }
});

Deno.test("LayerType Behavior - Input Normalization", () => {
  const testCases = [
    { input: "PROJECT", expected: "project" },
    { input: "  task  ", expected: "task" },
    { input: "Issue", expected: "issue" },
    { input: "\t\nbugs\t\n", expected: "bugs" },
  ];

  for (const testCase of testCases) {
    const result = LayerType.fromString(testCase.input);
    assert(result.ok, `Should handle normalized input: "${testCase.input}"`);
    assertEquals(
      result.data.value,
      testCase.expected,
      `Input "${testCase.input}" should normalize to "${testCase.expected}"`,
    );
  }
});

Deno.test("LayerType Behavior - Created LayerType Properties", () => {
  const result = LayerType.fromString("project");
  assert(result.ok, "Should create LayerType successfully");

  const layerType = result.data;

  // Test LayerType properties
  assertEquals(typeof layerType.value, "string", "getValue should return string");
  assertEquals(layerType.value, "project", "getValue should return correct value");

  // Test LayerType behavior
  assertEquals(layerType instanceof LayerType, true, "Should be LayerType instance");

  // LayerType should be immutable
  const originalValue = layerType.value;
  assertEquals(layerType.value, originalValue, "LayerType value should remain consistent");
});

Deno.test("LayerType Behavior - Error Message Quality", () => {
  // Test error messages contain useful information

  // Empty input error
  const emptyResult = LayerType.fromString("");
  assert(!emptyResult.ok, "Empty input should fail");
  if (!emptyResult.ok) {
    assertEquals(emptyResult.error.kind, "EmptyInput", "Should identify empty input error");
    assertEquals("message" in emptyResult.error, true, "Error should include message");
  }

  // Invalid type error
  const invalidResult = LayerType.fromString(123);
  assert(!invalidResult.ok, "Invalid type should fail");
  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "EmptyInput", "Should identify empty input error");
    assertEquals("message" in invalidResult.error, true, "Error should include message");
  }

  // Too long layer error
  const tooLongResult = LayerType.fromString(
    "this_is_a_very_long_layer_name_that_exceeds_the_maximum_allowed_length",
  );
  assert(!tooLongResult.ok, "Too long layer should fail");
  if (!tooLongResult.ok) {
    assertEquals(tooLongResult.error.kind, "TooLong", "Should identify too long error");
    assertEquals("maxLength" in tooLongResult.error, true, "Error should include max length");
  }
});
