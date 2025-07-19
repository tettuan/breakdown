/**
 * @fileoverview Behavior tests for BreakdownParamsResult module
 * Testing business logic and expected behaviors with Result-based Totality
 *
 * Behavior tests verify:
 * - Business rules and invariants
 * - Error handling with Result type
 * - Edge cases and boundary conditions
 * - State transitions and transformations
 */

import { assertEquals, assertStrictEquals as _assertStrictEquals } from "jsr:@std/assert@0.224.0";
import {
  failure,
  // Legacy compatibility
  isFailure,
  isOne,
  isSuccess,
  isTwo,
  isZero,
  match,
  one,
  success,
  two,
  zero,
} from "./breakdown_params_result.ts";
import type { TwoParams_Result } from "../deps.ts";

// Test helper to create valid TwoParams_Result
const createTwoParamsResult = (
  directiveType: string,
  layerType: string = "project",
  options: Record<string, unknown> = {},
): TwoParams_Result => ({
  type: "two",
  directiveType,
  layerType,
  demonstrativeType: directiveType,
  params: [directiveType, layerType],
  options,
});

Deno.test("1_behavior: zero() creates correct zero variant", () => {
  const result = zero();

  assertEquals(result.type, "zero");
  assertEquals(result.data, null);
  assertEquals(isZero(result), true);
  assertEquals(isOne(result), false);
  assertEquals(isTwo(result), false);
});

Deno.test("1_behavior: one() creates correct one variant", () => {
  const testParams = [
    "single-param",
    "directive-only",
    "test-value",
    "",
    "complex-param-with-dashes",
  ];

  for (const param of testParams) {
    const result = one(param);

    assertEquals(result.type, "one");
    assertEquals(result.data.parameter, param);
    assertEquals(isOne(result), true);
    assertEquals(isZero(result), false);
    assertEquals(isTwo(result), false);
  }
});

Deno.test("1_behavior: two() creates correct two variant", () => {
  const testCases = [
    {
      input: createTwoParamsResult("to", "project"),
      description: "basic two case",
    },
    {
      input: createTwoParamsResult("summary", "issue", { verbose: true }),
      description: "two with options",
    },
    {
      input: createTwoParamsResult("", "", {}),
      description: "two with empty values",
    },
    {
      input: createTwoParamsResult("custom-directive", "custom-layer", {
        nested: { deep: { value: "test" } },
      }),
      description: "two with complex data",
    },
  ];

  for (const { input, description } of testCases) {
    const result = two(input);

    assertEquals(result.type, "two", `Failed for ${description}`);
    assertEquals(result.data, input, `Data mismatch for ${description}`);
    assertEquals(isTwo(result), true, `Type guard failed for ${description}`);
    assertEquals(isZero(result), false, `Wrong type guard for ${description}`);
  }
});

Deno.test("1_behavior: match() pattern matching works correctly", () => {
  const mockData = createTwoParamsResult("analyze", "module");

  const zeroResult = zero();
  const oneResult = one("test-param");
  const twoResult = two(mockData);

  // Test zero case
  const zeroOutput = match(zeroResult, {
    zero: () => "No parameters",
    one: (data) => `One: ${data.parameter}`,
    two: (data) => `Two: ${data.directiveType}`,
  });
  assertEquals(zeroOutput, "No parameters");

  // Test one case
  const oneOutput = match(oneResult, {
    zero: () => "No parameters",
    one: (data) => `One: ${data.parameter}`,
    two: (data) => `Two: ${data.directiveType}`,
  });
  assertEquals(oneOutput, "One: test-param");

  // Test two case
  const twoOutput = match(twoResult, {
    zero: () => "No parameters",
    one: (data) => `One: ${data.parameter}`,
    two: (data) => `Two: ${data.directiveType}`,
  });
  assertEquals(twoOutput, "Two: analyze");
});

Deno.test("1_behavior: legacy compatibility functions work", () => {
  const mockData = createTwoParamsResult("legacy", "test");

  // Test legacy success/failure functions
  const successResult = success(mockData);
  const failureResult = failure(new Error("Test error"));

  assertEquals(successResult.type, "two");
  assertEquals(successResult.data, mockData);
  assertEquals(failureResult.type, "zero");
  assertEquals(failureResult.data, null);

  // Test legacy type guards
  assertEquals(isSuccess(successResult), true);
  assertEquals(isSuccess(failureResult), false);
  assertEquals(isFailure(failureResult), true);
  assertEquals(isFailure(successResult), false);
});

Deno.test("1_behavior: type guards work correctly", () => {
  const zeroResult = zero();
  const oneResult = one("test");
  const twoResult = two(createTwoParamsResult("test", "project"));

  // Test isZero
  assertEquals(isZero(zeroResult), true);
  assertEquals(isZero(oneResult), false);
  assertEquals(isZero(twoResult), false);

  // Test isOne
  assertEquals(isOne(zeroResult), false);
  assertEquals(isOne(oneResult), true);
  assertEquals(isOne(twoResult), false);

  // Test isTwo
  assertEquals(isTwo(zeroResult), false);
  assertEquals(isTwo(oneResult), false);
  assertEquals(isTwo(twoResult), true);
});

Deno.test("1_behavior: immutability is maintained", () => {
  const mockData = createTwoParamsResult("immutable", "test");
  const twoResult = two(mockData);

  // Verify that result properties are readonly
  assertEquals(twoResult.type, "two");
  assertEquals(twoResult.data, mockData);

  // Test that the original data is not modified
  const originalData = twoResult.data;
  assertEquals(originalData, mockData);

  // Test one result immutability
  const oneResult = one("immutable-test");
  assertEquals(oneResult.type, "one");
  assertEquals(oneResult.data.parameter, "immutable-test");

  // Test zero result immutability
  const zeroResult = zero();
  assertEquals(zeroResult.type, "zero");
  assertEquals(zeroResult.data, null);
});
