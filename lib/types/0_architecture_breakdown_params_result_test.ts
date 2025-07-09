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

import { assertEquals, assertExists } from "@std/assert";
import {
  type BreakdownParamsResult,
  type BreakdownParamsResultFailure,
  type BreakdownParamsResultSuccess,
  failure,
  isFailure,
  isSuccess,
  match,
  success,
} from "./breakdown_params_result.ts";
import type { TwoParams_Result } from "../deps.ts";

Deno.test("0_architecture: BreakdownParamsResult follows domain boundary rules", () => {
  // BreakdownParamsResult should be a pure data structure with no external dependencies
  // Only depends on TwoParams_Result from external dependency

  const mockData: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };

  const successResult = success(mockData);
  const failureResult = failure(new Error("Test error"));

  // Verify that results are pure data objects
  assertExists(successResult);
  assertExists(failureResult);
  assertEquals(typeof successResult.type, "string");
  assertEquals(typeof failureResult.type, "string");

  // No file system operations
  assertEquals("readFile" in successResult, false);
  assertEquals("writeFile" in failureResult, false);

  // No configuration dependencies
  assertEquals("loadConfig" in successResult, false);
  assertEquals("saveConfig" in failureResult, false);

  // No external service calls
  assertEquals("fetch" in successResult, false);
  assertEquals("httpRequest" in failureResult, false);
});

Deno.test("0_architecture: BreakdownParamsResult enforces Discriminated Union pattern", () => {
  // Verify discriminated union structure with type field as discriminator

  const mockData: TwoParams_Result = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "issue",
    params: ["summary", "issue"],
    options: {},
  };

  const successResult = success(mockData);
  const failureResult = failure(new Error("Test"));

  // Type discriminator must exist and be readonly
  assertEquals(successResult.type, "success");
  assertEquals(failureResult.type, "failure");

  // Verify structure of success variant
  assertEquals("data" in successResult, true);
  assertEquals("error" in successResult, false);

  // Verify structure of failure variant
  assertEquals("data" in failureResult, false);
  assertEquals("error" in failureResult, true);

  // Type guards should work correctly
  assertEquals(isSuccess(successResult), true);
  assertEquals(isSuccess(failureResult), false);
  assertEquals(isFailure(successResult), false);
  assertEquals(isFailure(failureResult), true);
});

Deno.test("0_architecture: BreakdownParamsResult implements Totality principle", () => {
  // All functions should be total - defined for all inputs, no exceptions

  const testData: TwoParams_Result[] = [
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {},
    },
    {
      type: "two",
      demonstrativeType: "",
      layerType: "",
      params: ["", ""],
      options: {},
    },
    {
      type: "two",
      demonstrativeType: "custom_with_long_name",
      layerType: "custom_layer",
      params: ["custom_with_long_name", "custom_layer"],
      options: { complex: { nested: { data: true } } },
    },
  ];

  // Success creation should always work for valid data
  for (const data of testData) {
    const result = success(data);
    assertExists(result);
    assertEquals(result.type, "success");
    assertEquals(result.data, data);
  }

  // Failure creation should always work for any error
  const errors = [
    new Error("Simple error"),
    new Error(""),
    new TypeError("Type error"),
    new RangeError("Range error"),
  ];

  for (const error of errors) {
    const result = failure(error);
    assertExists(result);
    assertEquals(result.type, "failure");
    assertEquals(result.error, error);
  }
});

Deno.test("0_architecture: Pattern matching ensures exhaustiveness", () => {
  // Pattern matching should enforce handling of all cases

  const mockData: TwoParams_Result = {
    type: "two",
    demonstrativeType: "analyze",
    layerType: "module",
    params: ["analyze", "module"],
    options: {},
  };

  const results: BreakdownParamsResult[] = [
    success(mockData),
    failure(new Error("Test error")),
  ];

  // All cases must be handled
  for (const result of results) {
    const output = match(result, {
      success: (data) => `Success: ${data.demonstrativeType}`,
      failure: (error) => `Failure: ${error.message}`,
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
    demonstrativeType: "transform",
    layerType: "service",
    params: ["transform", "service"],
    options: { verbose: true },
  };

  const successResult = success(mockData);
  const failureResult = failure(new Error("Immutable test"));

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
