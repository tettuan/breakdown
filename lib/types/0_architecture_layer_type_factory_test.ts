/**
 * @fileoverview Architecture Tests for LayerTypeFactory
 *
 * Tests the architectural constraints and Smart Constructor pattern
 * implementation of LayerTypeFactory.
 *
 * @module types/0_architecture_layer_type_factory_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { type LayerTypeCreationError, LayerTypeFactory } from "./layer_type_factory.ts";
import { LayerType } from "./mod.ts";

/**
 * Architecture Test Suite for LayerTypeFactory
 *
 * Verifies:
 * - Smart Constructor pattern implementation
 * - Factory method presence and signatures
 * - Error type definitions
 * - Result type structure
 */
Deno.test("LayerTypeFactory Architecture - Smart Constructor Pattern", () => {
  // 1. Factory class should exist and be accessible
  assertExists(LayerTypeFactory, "LayerTypeFactory class should exist");

  // 2. Smart Constructor methods should exist with proper signatures
  assertExists(LayerTypeFactory.fromString, "fromString static method should exist");
  assertExists(
    LayerTypeFactory.fromTwoParamsResult,
    "fromTwoParamsResult static method should exist",
  );
  assertExists(LayerTypeFactory.isValidLayer, "isValidLayer static method should exist");
  assertExists(LayerTypeFactory.getKnownLayers, "getKnownLayers static method should exist");

  // 3. Factory methods should be static (architectural requirement)
  assertEquals(typeof LayerTypeFactory.fromString, "function", "fromString should be a function");
  assertEquals(
    typeof LayerTypeFactory.fromTwoParamsResult,
    "function",
    "fromTwoParamsResult should be a function",
  );
  assertEquals(
    typeof LayerTypeFactory.isValidLayer,
    "function",
    "isValidLayer should be a function",
  );
  assertEquals(
    typeof LayerTypeFactory.getKnownLayers,
    "function",
    "getKnownLayers should be a function",
  );
});

Deno.test("LayerTypeFactory Architecture - Result Type Structure", () => {
  // Test that result types follow the totality principle structure
  const validResult = LayerTypeFactory.fromString("project");

  // Result should have 'ok' property for discrimination
  assertExists(validResult.ok, "Result should have 'ok' property");
  assertEquals(typeof validResult.ok, "boolean", "ok property should be boolean");

  if (validResult.ok) {
    // Success case should have 'data' property
    assertExists(validResult.data, "Success result should have 'data' property");
    assertEquals(validResult.data instanceof LayerType, true, "data should be LayerType instance");
  }

  // Test error result structure
  const errorResult = LayerTypeFactory.fromString("");
  assertEquals(errorResult.ok, false, "Empty input should return error result");

  if (!errorResult.ok) {
    // Error case should have 'error' property
    assertExists(errorResult.error, "Error result should have 'error' property");
    assertExists(errorResult.error.kind, "Error should have 'kind' property for discrimination");
    assertEquals(typeof errorResult.error.kind, "string", "Error kind should be string");
  }
});

Deno.test("LayerTypeFactory Architecture - Error Type Coverage", () => {
  // Test that all error types can be produced
  const errorKinds = new Set<LayerTypeCreationError["kind"]>();

  // NullInput error
  const nullResult = LayerTypeFactory.fromString(null);
  if (!nullResult.ok) errorKinds.add(nullResult.error.kind);

  // InvalidInput error
  const invalidResult = LayerTypeFactory.fromString(123);
  if (!invalidResult.ok) errorKinds.add(invalidResult.error.kind);

  // EmptyInput error
  const emptyResult = LayerTypeFactory.fromString("");
  if (!emptyResult.ok) errorKinds.add(emptyResult.error.kind);

  // UnknownLayer error
  const unknownResult = LayerTypeFactory.fromString("invalid_layer");
  if (!unknownResult.ok) errorKinds.add(unknownResult.error.kind);

  // Verify comprehensive error coverage
  const expectedErrorKinds: LayerTypeCreationError["kind"][] = [
    "NullInput",
    "InvalidInput",
    "EmptyInput",
    "UnknownLayer",
  ];

  for (const expectedKind of expectedErrorKinds) {
    assertEquals(
      errorKinds.has(expectedKind),
      true,
      `Error kind '${expectedKind}' should be producible`,
    );
  }
});

Deno.test("LayerTypeFactory Architecture - Factory Method Contracts", () => {
  // Test that factory methods honor their contracts

  // 1. fromString should accept unknown input and optional pattern
  const result1 = LayerTypeFactory.fromString("project");
  assertExists(result1, "fromString should return a result");
  assertEquals(typeof result1.ok, "boolean", "Result should have boolean ok property");

  // 2. isValidLayer should accept string and return boolean
  const isValid = LayerTypeFactory.isValidLayer("project");
  assertEquals(typeof isValid, "boolean", "isValidLayer should return boolean");

  // 3. getKnownLayers should return readonly array
  const knownLayers = LayerTypeFactory.getKnownLayers();
  assertEquals(Array.isArray(knownLayers), true, "getKnownLayers should return array");
  assertEquals(knownLayers.length > 0, true, "Should have at least one known layer");
});

Deno.test("LayerTypeFactory Architecture - Immutability Constraints", () => {
  // Test that known layers cannot be modified
  const knownLayers = LayerTypeFactory.getKnownLayers();
  const originalLength = knownLayers.length;

  // Attempt to modify the returned array should not affect internal state
  try {
    // @ts-expect-error Testing runtime immutability
    knownLayers.push("new_layer");
  } catch {
    // Expected - readonly arrays should not be modifiable
  }

  // Get fresh copy to verify immutability
  const freshKnownLayers = LayerTypeFactory.getKnownLayers();
  assertEquals(freshKnownLayers.length, originalLength, "Known layers should remain unchanged");
});

Deno.test("LayerTypeFactory Architecture - Factory Encapsulation", () => {
  // Test that factory properly encapsulates LayerType creation

  // Factory should not expose internal LayerType constructor directly
  const result = LayerTypeFactory.fromString("project");

  if (result.ok) {
    // Created instance should be proper LayerType
    assertEquals(
      result.data instanceof LayerType,
      true,
      "Factory should create LayerType instances",
    );

    // Factory should provide the only safe way to create LayerType
    assertExists(result.data.getValue, "Created LayerType should have getValue method");
    assertEquals(typeof result.data.value, "string", "getValue should return string");
  }
});
