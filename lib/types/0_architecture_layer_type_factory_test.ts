/**
 * @fileoverview Architecture Tests for LayerType
 *
 * Tests the architectural constraints and Smart Constructor pattern
 * implementation of LayerType.
 *
 * @module types/0_architecture_layer_type_factory_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { LayerType } from "../domain/core/value_objects/layer_type.ts";
import type { LayerTypeError } from "../domain/core/value_objects/layer_type.ts";

/**
 * Architecture Test Suite for LayerType
 *
 * Verifies:
 * - Smart Constructor pattern implementation
 * - Factory method presence and signatures
 * - Error type definitions
 * - Result type structure
 */
Deno.test("LayerType Architecture - Smart Constructor Pattern", () => {
  // 1. Factory class should exist and be accessible
  assertExists(LayerType, "LayerType class should exist");

  // 2. Smart Constructor methods should exist with proper signatures
  assertExists(LayerType.fromString, "fromString static method should exist");
  assertExists(
    LayerType.fromTwoParamsResult,
    "fromTwoParamsResult static method should exist",
  );
  assertExists(LayerType.isValidLayer, "isValidLayer static method should exist");
  assertExists(LayerType.getKnownLayerTypes, "getKnownLayerTypes static method should exist");

  // 3. Factory methods should be static (architectural requirement)
  assertEquals(typeof LayerType.fromString, "function", "fromString should be a function");
  assertEquals(
    typeof LayerType.fromTwoParamsResult,
    "function",
    "fromTwoParamsResult should be a function",
  );
  assertEquals(
    typeof LayerType.isValidLayer,
    "function",
    "isValidLayer should be a function",
  );
  assertEquals(
    typeof LayerType.getKnownLayerTypes,
    "function",
    "getKnownLayerTypes should be a function",
  );
});

Deno.test("LayerType Architecture - Result Type Structure", () => {
  // Test that result types follow the totality principle structure
  const validResult = LayerType.fromString("project");

  // Result should have 'ok' property for discrimination
  assertExists(validResult.ok, "Result should have 'ok' property");
  assertEquals(typeof validResult.ok, "boolean", "ok property should be boolean");

  if (validResult.ok) {
    // Success case should have 'data' property
    assertExists(validResult.data, "Success result should have 'data' property");
    assertEquals(validResult.data instanceof LayerType, true, "data should be LayerType instance");
  }

  // Test error result structure
  const errorResult = LayerType.fromString("");
  assertEquals(errorResult.ok, false, "Empty input should return error result");

  if (!errorResult.ok) {
    // Error case should have 'error' property
    assertExists(errorResult.error, "Error result should have 'error' property");
    assertExists(errorResult.error.kind, "Error should have 'kind' property for discrimination");
    assertEquals(typeof errorResult.error.kind, "string", "Error kind should be string");
  }
});

Deno.test("LayerType Architecture - Error Type Coverage", () => {
  // Test that all error types can be produced
  const errorKinds = new Set<LayerTypeError["kind"]>();

  // EmptyInput error
  const emptyResult = LayerType.fromString("");
  if (!emptyResult.ok) errorKinds.add(emptyResult.error.kind);

  // InvalidFormat error
  const invalidResult = LayerType.fromString("@#$%");
  if (!invalidResult.ok) errorKinds.add(invalidResult.error.kind);

  // TooLong error
  const longResult = LayerType.fromString("a".repeat(200));
  if (!longResult.ok) errorKinds.add(longResult.error.kind);

  // Verify comprehensive error coverage
  const expectedErrorKinds: LayerTypeError["kind"][] = [
    "EmptyInput",
    "InvalidFormat",
    "TooLong",
  ];

  for (const expectedKind of expectedErrorKinds) {
    assertEquals(
      errorKinds.has(expectedKind),
      true,
      `Error kind '${expectedKind}' should be producible`,
    );
  }
});

Deno.test("LayerType Architecture - Factory Method Contracts", () => {
  // Test that factory methods honor their contracts

  // 1. fromString should accept unknown input and optional pattern
  const result1 = LayerType.fromString("project");
  assertExists(result1, "fromString should return a result");
  assertEquals(typeof result1.ok, "boolean", "Result should have boolean ok property");

  // 2. isValidLayer should accept string and return boolean
  const isValid = LayerType.isValidLayer("project");
  assertEquals(typeof isValid, "boolean", "isValidLayer should return boolean");

  // 3. getKnownLayerTypes should return readonly array
  const knownLayers = LayerType.getKnownLayerTypes();
  assertEquals(Array.isArray(knownLayers), true, "getKnownLayerTypes should return array");
  assertEquals(knownLayers.length > 0, true, "Should have at least one known layer");
});

Deno.test("LayerType Architecture - Immutability Constraints", () => {
  // Test that known layers cannot be modified
  const knownLayers = LayerType.getKnownLayerTypes();
  const originalLength = knownLayers.length;

  // Attempt to modify the returned array should not affect internal state
  try {
    // @ts-expect-error Testing runtime immutability
    knownLayers.push("new_layer");
  } catch {
    // Expected - readonly arrays should not be modifiable
  }

  // Get fresh copy to verify immutability
  const freshKnownLayers = LayerType.getKnownLayerTypes();
  assertEquals(freshKnownLayers.length, originalLength, "Known layers should remain unchanged");
});

Deno.test("LayerType Architecture - Factory Encapsulation", () => {
  // Test that factory properly encapsulates LayerType creation

  // Factory should not expose internal LayerType constructor directly
  const result = LayerType.fromString("project");

  if (result.ok) {
    // Created instance should be proper LayerType
    assertEquals(
      result.data instanceof LayerType,
      true,
      "Factory should create LayerType instances",
    );

    // Factory should provide the only safe way to create LayerType
    assertExists(result.data.value, "Created LayerType should have value property");
    assertEquals(typeof result.data.value, "string", "value should return string");
  }
});
