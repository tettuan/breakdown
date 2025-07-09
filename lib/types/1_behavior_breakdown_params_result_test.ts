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

import { assertEquals, assertExists, assertStrictEquals } from "@std/assert";
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

// Test helper to create valid TwoParams_Result
const createTwoParamsResult = (
  demonstrativeType: string,
  layerType: string = "project",
  options: Record<string, unknown> = {},
): TwoParams_Result => ({
  type: "two",
  demonstrativeType,
  layerType,
  params: [demonstrativeType, layerType],
  options,
});

Deno.test("1_behavior: success() creates correct success variant", () => {
  const testCases = [
    {
      input: createTwoParamsResult("to", "project"),
      description: "basic success case",
    },
    {
      input: createTwoParamsResult("summary", "issue", { verbose: true }),
      description: "success with options",
    },
    {
      input: createTwoParamsResult("", "", {}),
      description: "success with empty values",
    },
    {
      input: createTwoParamsResult("custom-directive", "custom-layer", {
        nested: { deep: { value: "test" } },
      }),
      description: "success with complex data",
    },
  ];

  for (const { input, description } of testCases) {
    const result = success(input);

    assertEquals(result.type, "success", `Failed for ${description}`);
    assertEquals(result.data, input, `Data mismatch for ${description}`);
    assertEquals(isSuccess(result), true, `Type guard failed for ${description}`);
    assertEquals(isFailure(result), false, `Wrong type guard for ${description}`);
  }
});

Deno.test("1_behavior: failure() creates correct failure variant", () => {
  const testCases = [
    {
      error: new Error("Simple error"),
      description: "basic error",
    },
    {
      error: new TypeError("Type mismatch"),
      description: "type error",
    },
    {
      error: new RangeError("Out of range"),
      description: "range error",
    },
    {
      error: new Error(""),
      description: "empty error message",
    },
    {
      error: new Error("Very long error message ".repeat(100)),
      description: "long error message",
    },
  ];

  for (const { error, description } of testCases) {
    const result = failure(error);

    assertEquals(result.type, "failure", `Failed for ${description}`);
    assertStrictEquals(result.error, error, `Error mismatch for ${description}`);
    assertEquals(isFailure(result), true, `Type guard failed for ${description}`);
    assertEquals(isSuccess(result), false, `Wrong type guard for ${description}`);
  }
});

Deno.test("1_behavior: Type guards correctly narrow types", () => {
  const successResult = success(createTwoParamsResult("analyze", "module"));
  const failureResult = failure(new Error("Test error"));

  // Success type narrowing
  if (isSuccess(successResult)) {
    // TypeScript should know this is BreakdownParamsResultSuccess
    assertEquals(successResult.data.demonstrativeType, "analyze");
    assertEquals(successResult.data.layerType, "module");
    assertEquals(successResult.data.type, "two");
  } else {
    throw new Error("Success result should be identified as success");
  }

  // Failure type narrowing
  if (isFailure(failureResult)) {
    // TypeScript should know this is BreakdownParamsResultFailure
    assertEquals(failureResult.error.message, "Test error");
    assertEquals(failureResult.error instanceof Error, true);
  } else {
    throw new Error("Failure result should be identified as failure");
  }

  // Negative cases
  assertEquals(isSuccess(failureResult), false);
  assertEquals(isFailure(successResult), false);
});

Deno.test("1_behavior: match() handles all variants correctly", () => {
  const successData = createTwoParamsResult("transform", "service", {
    debug: true,
    profile: "test",
  });
  const errorObj = new Error("Processing failed");

  const successResult = success(successData);
  const failureResult = failure(errorObj);

  // Match success case
  const successOutput = match(successResult, {
    success: (data) => `Success: ${data.demonstrativeType}/${data.layerType}`,
    failure: (error) => `Error: ${error.message}`,
  });
  assertEquals(successOutput, "Success: transform/service");

  // Match failure case
  const failureOutput = match(failureResult, {
    success: (data) => `Success: ${data.demonstrativeType}/${data.layerType}`,
    failure: (error) => `Error: ${error.message}`,
  });
  assertEquals(failureOutput, "Error: Processing failed");

  // Match with different return types
  const numericMatch = match(successResult, {
    success: (data) => data.params.length,
    failure: (_) => -1,
  });
  assertEquals(numericMatch, 2);

  // Match with complex transformations
  type ComplexResult = {
    type: "processed";
    original: TwoParams_Result;
    processed: true;
  } | {
    type: "error";
    message: string;
    processed: false;
  };

  const complexMatch: ComplexResult = match(successResult, {
    success: (data): ComplexResult => ({
      type: "processed",
      original: data,
      processed: true,
    }),
    failure: (error): ComplexResult => ({
      type: "error",
      message: error.message,
      processed: false,
    }),
  });
  assertEquals(complexMatch.type, "processed");
  assertEquals(complexMatch.processed, true);
  if (complexMatch.type === "processed") {
    assertEquals(complexMatch.original, successData);
  }
});

Deno.test("1_behavior: Results preserve original data integrity", () => {
  // Complex data structure
  const complexData: TwoParams_Result = {
    type: "two",
    demonstrativeType: "analyze",
    layerType: "system",
    params: ["analyze", "system"],
    options: {
      verbose: true,
      config: {
        timeout: 5000,
        retries: 3,
        features: ["feature1", "feature2", "feature3"],
        metadata: {
          version: "1.0.0",
          author: "test",
          tags: ["tag1", "tag2"],
          settings: {
            deep: {
              nested: {
                value: "preserved",
              },
            },
          },
        },
      },
    },
  };

  const result = success(complexData);

  // Verify all data is preserved
  assertEquals(result.data.type, "two");
  assertEquals(result.data.demonstrativeType, "analyze");
  assertEquals(result.data.layerType, "system");
  assertEquals(result.data.params.length, 2);
  assertEquals(result.data.options.verbose, true);
  const config = result.data.options.config as any;
  assertEquals(config.timeout, 5000);
  assertEquals(config.features.length, 3);
  assertEquals(
    config.metadata.settings.deep.nested.value,
    "preserved",
  );

  // Original object reference check
  assertStrictEquals(result.data, complexData);
});

Deno.test("1_behavior: Error information is fully preserved", () => {
  // Custom error with additional properties
  class CustomError extends Error {
    constructor(
      message: string,
      public code: string,
      public details: Record<string, unknown>,
    ) {
      super(message);
      this.name = "CustomError";
    }
  }

  const customError = new CustomError(
    "Custom error occurred",
    "ERR_CUSTOM",
    {
      timestamp: new Date().toISOString(),
      context: "test",
      data: { foo: "bar" },
    },
  );

  const result = failure(customError);

  // Verify error is preserved with all properties
  assertStrictEquals(result.error, customError);
  assertEquals(result.error.message, "Custom error occurred");
  assertEquals(result.error.name, "CustomError");
  assertEquals((result.error as CustomError).code, "ERR_CUSTOM");
  assertEquals((result.error as CustomError).details.context, "test");
});

Deno.test("1_behavior: Pattern matching with edge cases", () => {
  // Test with minimal data
  const minimalResult = success(createTwoParamsResult("", ""));
  const minimalOutput = match(minimalResult, {
    success: (data) => data.demonstrativeType || "empty",
    failure: (_) => "error",
  });
  assertEquals(minimalOutput, "empty");

  // Test with error without message
  const emptyError = new Error();
  const emptyErrorResult = failure(emptyError);
  const emptyErrorOutput = match(emptyErrorResult, {
    success: (_) => "success",
    failure: (error) => error.message || "no message",
  });
  assertEquals(emptyErrorOutput, "no message");

  // Test with chained matching
  const chainResult = success(createTwoParamsResult("chain", "test"));
  const chainedOutput = match(chainResult, {
    success: (data) =>
      match(success(data), {
        success: (inner) => `Double success: ${inner.demonstrativeType}`,
        failure: (_) => "Should not happen",
      }),
    failure: (_) => "Outer failure",
  });
  assertEquals(chainedOutput, "Double success: chain");
});
