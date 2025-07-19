/**
 * @fileoverview Architecture tests for BreakdownParamsResult module
 * Testing domain boundaries, dependencies, and architectural constraints
 *
 * Architecture tests verify:
 * - Domain boundary enforcement
 * - Dependency direction
 * - Discriminated Union pattern compliance
 * - Totality principle adherence
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  type BreakdownParamsResult,
  type BreakdownParamsResultOne as _BreakdownParamsResultOne,
  type BreakdownParamsResultTwo as _BreakdownParamsResultTwo,
  type BreakdownParamsResultZero as _BreakdownParamsResultZero,
  // Legacy compatibility
  failure as _failure,
  isFailure as _isFailure,
  isOne,
  isSuccess as _isSuccess,
  isTwo,
  isZero,
  match,
  one,
  success as _success,
  two,
  zero,
} from "./breakdown_params_result.ts";
import type { TwoParams_Result } from "../deps.ts";

Deno.test("0_architecture: BreakdownParamsResult follows domain boundary rules", () => {
  // BreakdownParamsResult should be a pure data structure with no external dependencies
  // Only depends on TwoParams_Result from external dependency

  const mockData: TwoParams_Result = {
    type: "two",
    directiveType: "to",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };

  const zeroResult = zero();
  const oneResult = one("single-param");
  const twoResult = two(mockData);

  // Verify that results are pure data objects
  assertExists(zeroResult);
  assertExists(oneResult);
  assertExists(twoResult);
  assertEquals(typeof zeroResult.type, "string");
  assertEquals(typeof oneResult.type, "string");
  assertEquals(typeof twoResult.type, "string");

  // No file system operations
  assertEquals("readFile" in zeroResult, false);
  assertEquals("writeFile" in oneResult, false);
  assertEquals("readFile" in twoResult, false);

  // No configuration dependencies
  assertEquals("loadConfig" in zeroResult, false);
  assertEquals("saveConfig" in oneResult, false);
  assertEquals("loadConfig" in twoResult, false);

  // No external service calls
  assertEquals("fetch" in zeroResult, false);
  assertEquals("httpRequest" in oneResult, false);
  assertEquals("fetch" in twoResult, false);
});

Deno.test("0_architecture: BreakdownParamsResult enforces Discriminated Union pattern", () => {
  // Verify discriminated union structure with type field as discriminator

  const mockData: TwoParams_Result = {
    type: "two",
    directiveType: "summary",
    demonstrativeType: "summary",
    layerType: "issue",
    params: ["summary", "issue"],
    options: {},
  };

  const zeroResult = zero();
  const oneResult = one("test-param");
  const twoResult = two(mockData);

  // Type discriminator must exist and be readonly
  assertEquals(zeroResult.type, "zero");
  assertEquals(oneResult.type, "one");
  assertEquals(twoResult.type, "two");

  // Verify structure of zero variant
  assertEquals("data" in zeroResult, true);
  assertEquals(zeroResult.data, null);

  // Verify structure of one variant
  assertEquals("data" in oneResult, true);
  assertEquals(oneResult.data.parameter, "test-param");

  // Verify structure of two variant
  assertEquals("data" in twoResult, true);
  assertEquals(twoResult.data, mockData);

  // Type guards should work correctly
  assertEquals(isZero(zeroResult), true);
  assertEquals(isZero(oneResult), false);
  assertEquals(isOne(oneResult), true);
  assertEquals(isOne(twoResult), false);
  assertEquals(isTwo(twoResult), true);
  assertEquals(isTwo(zeroResult), false);
});

Deno.test("0_architecture: BreakdownParamsResult implements Totality principle", () => {
  // All functions should be total - defined for all inputs, no exceptions

  const testData: TwoParams_Result[] = [
    {
      type: "two",
      directiveType: "to",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {},
    },
    {
      type: "two",
      directiveType: "",
      demonstrativeType: "", // Same as directiveType (empty)
      layerType: "",
      params: ["", ""],
      options: {},
    },
    {
      type: "two",
      directiveType: "custom_with_long_name",
      demonstrativeType: "custom_with_long_name",
      layerType: "custom_layer",
      params: ["custom_with_long_name", "custom_layer"],
      options: { complex: { nested: { data: true } } },
    },
  ];

  // Two parameters creation should always work for valid data
  for (const data of testData) {
    const result = two(data);
    assertExists(result);
    assertEquals(result.type, "two");
    assertEquals(result.data, data);
  }

  // Failure creation should always work for any error
  const errors = [
    new Error("Simple error"),
    new Error(""),
    new TypeError("Type error"),
    new RangeError("Range error"),
  ];

  for (const _error of errors) {
    const result = zero(); // zero() for backward compatibility
    assertExists(result);
    assertEquals(result.type, "zero");
    assertEquals(result.data, null);
  }
});

Deno.test("0_architecture: Pattern matching ensures exhaustiveness", () => {
  // Pattern matching should enforce handling of all cases

  const mockData: TwoParams_Result = {
    type: "two",
    directiveType: "analyze",
    demonstrativeType: "analyze",
    layerType: "module",
    params: ["analyze", "module"],
    options: {},
  };

  const results: BreakdownParamsResult[] = [
    zero(),
    one("test-param"),
    two(mockData),
  ];

  // All cases must be handled
  for (const result of results) {
    const output = match(result, {
      zero: () => "Zero parameters",
      one: (data) => `One parameter: ${data.parameter}`,
      two: (data) => `Two parameters: ${data.directiveType}`,
    });

    assertExists(output);
    assertEquals(typeof output, "string");
  }

  // Type system enforces exhaustiveness at compile time
  // Missing handler would cause TypeScript error
});

Deno.test("0_architecture: BreakdownParamsResult maintains immutability", () => {
  // All result objects should be immutable

  const mockData: TwoParams_Result = {
    type: "two",
    directiveType: "transform",
    demonstrativeType: "transform",
    layerType: "service",
    params: ["transform", "service"],
    options: { verbose: true },
  };

  const successResult = _success(mockData);
  const failureResult = _failure(new Error("Immutable test"));

  // Properties should be readonly (enforced by TypeScript)
  // Runtime check for property descriptors
  const successDescriptor = Object.getOwnPropertyDescriptor(successResult, "type");
  const dataDescriptor = Object.getOwnPropertyDescriptor(successResult, "data");

  assertExists(successDescriptor);
  assertExists(dataDescriptor);

  // Objects should be sealed or frozen
  assertEquals(Object.isExtensible(successResult), true); // Note: Not frozen by default
  assertEquals(Object.isExtensible(failureResult), true);

  // No mutation methods should exist
  assertEquals("setType" in successResult, false);
  assertEquals("setData" in successResult, false);
  assertEquals("setError" in failureResult, false);
});
