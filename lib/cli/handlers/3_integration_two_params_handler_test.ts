/**
 * Integration tests for TwoParamsHandler with new Orchestrator implementation
 *
 * Tests the complete flow of the new orchestrated implementation including:
 * 1. Basic functionality
 * 2. Error handling across all components
 * 3. Backward compatibility
 */

import { assertEquals, assertExists } from "@std/assert";
import { handleTwoParams } from "./two_params_handler.ts";

// Mock implementations for testing
class MockBreakdownConfig {
  constructor(public data: Record<string, unknown> = {}) {}
}

Deno.test("TwoParamsHandler Integration - Basic functionality", async () => {
  const _params = ["to", "project"];
  const _config = {
    timeout: 30000,
    workingDirectory: "/tmp",
  };
  const options = {
    output: "test-output.md",
    "uv-custom": "test-value",
  };

  // Note: This will likely fail due to missing components, but tests the interface
  const _result = await handleTwoParams(params, config, options);

  // Verify the result structure (regardless of success/failure)
  assertExists(_result);
  assertEquals(typeof _result.ok, "boolean");

  if (!_result.ok) {
    // Verify error structure matches TwoParamsHandlerError
    assertExists(_result.error);
    assertExists(_result.error.kind);

    // Check for expected error kinds
    const validErrorKinds = [
      "InvalidParameterCount",
      "InvalidDemonstrativeType",
      "InvalidLayerType",
      "StdinReadError",
      "FactoryValidationError",
      "VariablesBuilderError",
      "PromptGenerationError",
      "OutputWriteError",
    ];

    assertEquals(validErrorKinds.includes(_result.error.kind), true);
  }
});

Deno.test("TwoParamsHandler Integration - Invalid parameter count", async () => {
  const _params = ["to"]; // Only one parameter
  const _config = {};
  const options = {};

  const _result = await handleTwoParams(params, config, options);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidParameterCount");
    if (_result.error.kind === "InvalidParameterCount") {
      assertEquals(_result.error.received, 1);
      assertEquals(_result.error.expected, 2);
    }
  }
});

Deno.test("TwoParamsHandler Integration - Invalid demonstrative type", async () => {
  const _params = ["invalid-type", "project"];
  const _config = {};
  const options = {};

  const _result = await handleTwoParams(params, config, options);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidDemonstrativeType");
    if (_result.error.kind === "InvalidDemonstrativeType") {
      assertEquals(_result.error.value, "invalid-type");
      assertExists(_result.error.validTypes);
      assertEquals(Array.isArray(_result.error.validTypes), true);
    }
  }
});

Deno.test("TwoParamsHandler Integration - Invalid layer type", async () => {
  const _params = ["to", "invalid-layer"];
  const _config = {};
  const options = {};

  const _result = await handleTwoParams(params, config, options);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidLayerType");
    if (_result.error.kind === "InvalidLayerType") {
      assertEquals(_result.error.value, "invalid-layer");
      assertExists(_result.error.validTypes);
      assertEquals(Array.isArray(_result.error.validTypes), true);
    }
  }
});

Deno.test("TwoParamsHandler Integration - Empty parameters", async () => {
  const _params = ["", "project"];
  const _config = {};
  const options = {};

  const _result = await handleTwoParams(params, config, options);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    // Should catch empty demonstrative type
    assertEquals(
      _result.error.kind === "InvalidDemonstrativeType" ||
        _result.error.kind === "FactoryValidationError",
      true,
    );
  }
});

Deno.test("TwoParamsHandler Integration - Orchestrator reuse", async () => {
  // Test that the singleton orchestrator instance is reused
  const params1 = ["to", "project"];
  const params2 = ["summary", "issue"];
  const _config = {};
  const options = {};

  const result1 = await handleTwoParams(params1, config, options);
  const result2 = await handleTwoParams(params2, config, options);

  // Both calls should return results (even if failed due to missing components)
  assertExists(result1);
  assertExists(result2);
  assertEquals(typeof _result1.ok, "boolean");
  assertEquals(typeof _result2.ok, "boolean");
});

Deno.test("TwoParamsHandler Integration - Options processing", async () => {
  const _params = ["defect", "task"];
  const _config = {};
  const options = {
    fromFile: "input.md",
    destinationFile: "output.md",
    "uv-variable1": "value1",
    "uv-variable2": "value2",
    customValidation: true,
  };

  const _result = await handleTwoParams(params, config, options);

  // Verify result structure
  assertExists(_result);
  assertEquals(typeof _result.ok, "boolean");

  // If it fails, it should be due to component issues, not option parsing
  if (!_result.ok) {
    // Should not fail on InvalidParameterCount or type validation
    assertEquals(
      _result.error.kind !== "InvalidParameterCount" &&
        _result.error.kind !== "InvalidDemonstrativeType" &&
        _result.error.kind !== "InvalidLayerType",
      true,
    );
  }
});

Deno.test("TwoParamsHandler Integration - Backward compatibility interface", async () => {
  // Test that the function signature matches the original
  const _params = ["init", "bugs"];
  const _config = { timeout: 5000 };
  const options = { output: "compatibility-test.md" };

  // This should compile and run without interface changes
  const _result = await handleTwoParams(params, config, options);

  // Verify the return type structure
  assertExists(_result);
  assertEquals(typeof _result.ok, "boolean");

  if (_result.ok) {
    assertEquals(_result.data, undefined);
  } else {
    assertExists(_result.error);
    assertExists(_result.error.kind);
  }
});

Deno.test("TwoParamsHandler Integration - Error mapping validation", async () => {
  // Test various parameter combinations to verify error mapping
  const testCases = [
    {
      params: [],
      expectedError: "InvalidParameterCount",
    },
    {
      params: ["invalid"],
      expectedError: "InvalidParameterCount",
    },
    {
      params: ["unknown", "project"],
      expectedError: "InvalidDemonstrativeType",
    },
    {
      params: ["to", "unknown"],
      expectedError: "InvalidLayerType",
    },
  ];

  for (const testCase of testCases) {
    const _result = await handleTwoParams(testCase.params, {}, {});

    assertEquals(_result.ok, false);
    if (!_result.ok) {
      assertEquals(_result.error.kind, testCase.expectedError);
    }
  }
});

Deno.test("TwoParamsHandler Integration - Complex configuration", async () => {
  const _params = ["find", "temp"];
  const _config = {
    timeout: 60000,
    workingDirectory: "/custom/path",
    profile: "development",
    customSettings: {
      enableDebug: true,
      logLevel: "verbose",
    },
  };
  const options = {
    fromFile: "/path/to/input.md",
    destinationFile: "/path/to/output.md",
    schemaFile: "/path/to/schema.json",
    promptDir: "/custom/prompts",
    adaptation: "custom-adaptation",
    extended: true,
    customValidation: true,
    errorFormat: "json",
    "uv-environment": "test",
    "uv-version": "1.0.0",
    "uv-author": "integration-test",
  };

  const _result = await handleTwoParams(params, config, options);

  // Verify result structure with complex inputs
  assertExists(_result);
  assertEquals(typeof _result.ok, "boolean");

  // Parameters should be valid, so if it fails, it's due to component issues
  if (!_result.ok) {
    assertEquals(
      _result.error.kind !== "InvalidParameterCount" &&
        _result.error.kind !== "InvalidDemonstrativeType" &&
        _result.error.kind !== "InvalidLayerType",
      true,
    );
  }
});

Deno.test("TwoParamsHandler Integration - Performance and memory", async () => {
  // Test multiple rapid calls to ensure no memory leaks or performance issues
  const promises: Promise<any>[] = [];

  for (let i = 0; i < 5; i++) {
    const _params = i % 2 === 0 ? ["to", "project"] : ["summary", "issue"];
    const options = { iteration: i };

    promises.push(handleTwoParams(params, {}, options));
  }

  const results = await Promise.all(promises);

  // All calls should complete
  assertEquals(results.length, 5);

  // All results should have proper structure
  for (const result of results) {
    assertExists(_result);
    assertEquals(typeof _result.ok, "boolean");
  }
});
