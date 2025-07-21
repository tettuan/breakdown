/**
 * @fileoverview Structure tests for LayerType module
 * Testing data structure integrity and type relationships
 *
 * Structure tests verify:
 * - Class structure and immutability
 * - Smart Constructor pattern integrity
 * - Type safety and encapsulation
 * - Value object characteristics
 * - LayerType creation with TwoParams_Result compatibility
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { LayerType } from "./mod.ts";
import { ConfigProfile } from "../config/mod.ts";
import type { TwoParams_Result } from "../deps.ts";
import { getLayerTypes } from "../test_helpers/config_test_helper.ts";

// Test data setup
const createValidTwoParamsResult = (
  layerType = "project",
  directiveType = "to",
): TwoParams_Result => ({
  type: "two" as const,
  directiveType,
  layerType,
  params: [directiveType, layerType],
  options: {},
});

Deno.test("2_structure: LayerType follows Smart Constructor pattern", () => {
  // Test that LayerType follows Smart Constructor pattern with Result type
  const validResult = LayerType.create("project");

  // Result should be ok for valid input
  assertEquals(validResult.ok, true);

  if (validResult.ok) {
    // LayerType should be properly encapsulated
    assertEquals(typeof validResult.data.value, "string");
    assertEquals(typeof validResult.data.toString, "function");
    assertEquals(typeof validResult.data.equals, "function");
    assertEquals(typeof validResult.data.isValidForDirective, "function");
  }

  // Test invalid input
  const invalidResult = LayerType.create("");
  assertEquals(invalidResult.ok, false);

  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "EmptyInput");
  }
});

Deno.test("2_structure: LayerType maintains consistent interface", () => {
  const result = LayerType.create("project");
  assertExists(result);
  assertEquals(result.ok, true);

  if (result.ok) {
    const layerType = result.data;

    // Test method signatures and return types
    assertEquals(typeof layerType.value, "string");
    assertEquals(typeof layerType.toString(), "string");
    assertEquals(typeof layerType.equals(layerType), "boolean");
    assertEquals(typeof layerType.isValidForDirective({ value: "to" }), "boolean");

    // Interface consistency
    assertEquals(layerType.toString(), layerType.value);
    assertEquals(layerType.equals(layerType), true);
  }
});

Deno.test("2_structure: LayerType ensures input validation safety", async () => {
  // Test dangerous/invalid inputs
  const invalidInputs = [
    "",
    "   ",
    null,
    undefined,
    "PROJECT", // uppercase
    "project-with-invalid-chars!",
    "a".repeat(50), // too long
  ];

  for (const invalidInput of invalidInputs) {
    const result = LayerType.create(invalidInput);
    assertEquals(result.ok, false, `Input "${invalidInput}" should be rejected`);
  }

  // Test valid inputs - configuration-based approach
  const configLayerTypes = await getLayerTypes();
  const validInputs = [
    ...configLayerTypes,
    "test-layer",
    "custom_layer",
  ];

  for (const validInput of validInputs) {
    const result = LayerType.create(validInput);
    assertEquals(result.ok, true, `Input "${validInput}" should be accepted`);
  }
});

Deno.test("2_structure: LayerType with TwoParams_Result compatibility", () => {
  // Test compatibility with TwoParams_Result
  const twoParamsResult = createValidTwoParamsResult("issue", "to");
  const result = LayerType.create(twoParamsResult);

  assertEquals(result.ok, true);

  if (result.ok) {
    const layerType = result.data;

    // Should extract the layerType from TwoParams_Result
    assertEquals(layerType.value, "issue");
    assertEquals(typeof layerType.value, "string");
    assertEquals(typeof layerType.equals, "function");
    assertEquals(typeof layerType.isValidForDirective, "function");
    assertEquals(typeof layerType.toString, "function");
  }
});

Deno.test("2_structure: LayerType hierarchical validation", async () => {
  // Configuration-based test cases
  const configLayerTypes = await getLayerTypes();
  const testCases = configLayerTypes.map(type => ({
    type,
    isValid: true
  }));

  for (const testCase of testCases) {
    const layerTypeResult = LayerType.create(testCase.type);
    assertEquals(layerTypeResult.ok, testCase.isValid);

    if (layerTypeResult.ok) {
      const layerType = layerTypeResult.data;
      assertEquals(layerType.value, testCase.type);
      assertEquals(typeof layerType.isValidForDirective({ value: "to" }), "boolean");
      assertEquals(typeof layerType.toString(), "string");
    }
  }
});

Deno.test("2_structure: LayerType immutability", () => {
  const result = LayerType.create("project");
  assertEquals(result.ok, true);

  if (result.ok) {
    const layerType = result.data;
    const originalValue = layerType.value;

    // Value should be immutable
    assertEquals(layerType.value, originalValue);

    // Object should be frozen
    assertEquals(Object.isFrozen(layerType), true);
  }
});

Deno.test("2_structure: LayerType creation with TwoParams_Result edge cases", () => {
  // Valid TwoParams_Result variations
  const validResults = [
    createValidTwoParamsResult("project", "to"),
    createValidTwoParamsResult("issue", "summary"),
    createValidTwoParamsResult("task", "defect"),
  ];

  for (const validResult of validResults) {
    const layerResult = LayerType.create(validResult);
    assertEquals(layerResult.ok, true);

    if (layerResult.ok) {
      assertEquals(layerResult.data.value, validResult.layerType);
    }
  }

  // Invalid TwoParams_Result (empty layerType)
  const invalidResult = createValidTwoParamsResult("", "to");
  const layerResult = LayerType.create(invalidResult);
  assertEquals(layerResult.ok, false);
});

Deno.test("2_structure: LayerType error message quality", () => {
  const invalidResult = LayerType.create("");
  assertEquals(invalidResult.ok, false);

  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "EmptyInput");
    assertEquals(typeof invalidResult.error.message, "string");
    assertEquals(invalidResult.error.message.length > 0, true);
  }

  const tooLongResult = LayerType.create("a".repeat(50));
  assertEquals(tooLongResult.ok, false);

  if (!tooLongResult.ok) {
    assertEquals(tooLongResult.error.kind, "TooLong");
    assertEquals(typeof tooLongResult.error.message, "string");
  }
});
