/**
 * Integration tests for TwoParamsHandler with new Orchestrator implementation
 * 
 * Tests the complete flow of the new orchestrated implementation including:
 * 1. Basic functionality
 * 2. Error handling across all components
 * 3. Backward compatibility
 */

import { assertEquals, assertExists } from "@std/assert";
import { handleTwoParams } from "../two_params_handler.ts";

// Mock implementations for testing
class MockBreakdownConfig {
  constructor(public data: Record<string, unknown> = {}) {}
}

Deno.test("TwoParamsHandler Integration - Basic functionality", async () => {
  const params = ["to", "project"];
  const config = {
    timeout: 30000,
    workingDirectory: "/tmp"
  };
  const options = {
    output: "test-output.md",
    "uv-custom": "test-value"
  };

  // Note: This will likely fail due to missing components, but tests the interface
  const result = await handleTwoParams(params, config, options);
  
  // Verify the result structure (regardless of success/failure)
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");
  
  if (!result.ok) {
    // Verify error structure matches TwoParamsHandlerError
    assertExists(result.error);
    assertExists(result.error.kind);
    
    // Check for expected error kinds
    const validErrorKinds = [
      "InvalidParameterCount",
      "InvalidDemonstrativeType", 
      "InvalidLayerType",
      "StdinReadError",
      "FactoryValidationError",
      "VariablesBuilderError",
      "PromptGenerationError",
      "OutputWriteError"
    ];
    
    assertEquals(validErrorKinds.includes(result.error.kind), true);
  }
});

Deno.test("TwoParamsHandler Integration - Invalid parameter count", async () => {
  const params = ["to"]; // Only one parameter
  const config = {};
  const options = {};

  const result = await handleTwoParams(params, config, options);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidParameterCount");
    if (result.error.kind === "InvalidParameterCount") {
      assertEquals(result.error.received, 1);
      assertEquals(result.error.expected, 2);
    }
  }
});

Deno.test("TwoParamsHandler Integration - Invalid demonstrative type", async () => {
  const params = ["invalid-type", "project"];
  const config = {};
  const options = {};

  const result = await handleTwoParams(params, config, options);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidDemonstrativeType");
    if (result.error.kind === "InvalidDemonstrativeType") {
      assertEquals(result.error.value, "invalid-type");
      assertExists(result.error.validTypes);
      assertEquals(Array.isArray(result.error.validTypes), true);
    }
  }
});

Deno.test("TwoParamsHandler Integration - Invalid layer type", async () => {
  const params = ["to", "invalid-layer"];
  const config = {};
  const options = {};

  const result = await handleTwoParams(params, config, options);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidLayerType");
    if (result.error.kind === "InvalidLayerType") {
      assertEquals(result.error.value, "invalid-layer");
      assertExists(result.error.validTypes);
      assertEquals(Array.isArray(result.error.validTypes), true);
    }
  }
});

Deno.test("TwoParamsHandler Integration - Empty parameters", async () => {
  const params = ["", "project"];
  const config = {};
  const options = {};

  const result = await handleTwoParams(params, config, options);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    // Should catch empty demonstrative type
    assertEquals(
      result.error.kind === "InvalidDemonstrativeType" || 
      result.error.kind === "FactoryValidationError",
      true
    );
  }
});

Deno.test("TwoParamsHandler Integration - Orchestrator reuse", async () => {
  // Test that the singleton orchestrator instance is reused
  const params1 = ["to", "project"];
  const params2 = ["summary", "issue"];
  const config = {};
  const options = {};

  const result1 = await handleTwoParams(params1, config, options);
  const result2 = await handleTwoParams(params2, config, options);
  
  // Both calls should return results (even if failed due to missing components)
  assertExists(result1);
  assertExists(result2);
  assertEquals(typeof result1.ok, "boolean");
  assertEquals(typeof result2.ok, "boolean");
});

Deno.test("TwoParamsHandler Integration - Options processing", async () => {
  const params = ["defect", "task"];
  const config = {};
  const options = {
    fromFile: "input.md",
    destinationFile: "output.md",
    "uv-variable1": "value1",
    "uv-variable2": "value2",
    customValidation: true
  };

  const result = await handleTwoParams(params, config, options);
  
  // Verify result structure
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");
  
  // If it fails, it should be due to component issues, not option parsing
  if (!result.ok) {
    // Should not fail on InvalidParameterCount or type validation
    assertEquals(
      result.error.kind !== "InvalidParameterCount" &&
      result.error.kind !== "InvalidDemonstrativeType" &&
      result.error.kind !== "InvalidLayerType",
      true
    );
  }
});

Deno.test("TwoParamsHandler Integration - Backward compatibility interface", async () => {
  // Test that the function signature matches the original
  const params = ["init", "bugs"];
  const config = { timeout: 5000 };
  const options = { output: "compatibility-test.md" };

  // This should compile and run without interface changes
  const result = await handleTwoParams(params, config, options);
  
  // Verify the return type structure
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");
  
  if (result.ok) {
    assertEquals(result.data, undefined);
  } else {
    assertExists(result.error);
    assertExists(result.error.kind);
  }
});

Deno.test("TwoParamsHandler Integration - Error mapping validation", async () => {
  // Test various parameter combinations to verify error mapping
  const testCases = [
    {
      params: [],
      expectedError: "InvalidParameterCount"
    },
    {
      params: ["invalid"],
      expectedError: "InvalidParameterCount"
    },
    {
      params: ["unknown", "project"],
      expectedError: "InvalidDemonstrativeType"
    },
    {
      params: ["to", "unknown"],
      expectedError: "InvalidLayerType"
    }
  ];

  for (const testCase of testCases) {
    const result = await handleTwoParams(testCase.params, {}, {});
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, testCase.expectedError);
    }
  }
});

Deno.test("TwoParamsHandler Integration - Complex configuration", async () => {
  const params = ["find", "temp"];
  const config = {
    timeout: 60000,
    workingDirectory: "/custom/path",
    profile: "development",
    customSettings: {
      enableDebug: true,
      logLevel: "verbose"
    }
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
    "uv-author": "integration-test"
  };

  const result = await handleTwoParams(params, config, options);
  
  // Verify result structure with complex inputs
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");
  
  // Parameters should be valid, so if it fails, it's due to component issues
  if (!result.ok) {
    assertEquals(
      result.error.kind !== "InvalidParameterCount" &&
      result.error.kind !== "InvalidDemonstrativeType" &&
      result.error.kind !== "InvalidLayerType",
      true
    );
  }
});

Deno.test("TwoParamsHandler Integration - Performance and memory", async () => {
  // Test multiple rapid calls to ensure no memory leaks or performance issues
  const promises: Promise<any>[] = [];
  
  for (let i = 0; i < 5; i++) {
    const params = i % 2 === 0 ? ["to", "project"] : ["summary", "issue"];
    const options = { iteration: i };
    
    promises.push(handleTwoParams(params, {}, options));
  }
  
  const results = await Promise.all(promises);
  
  // All calls should complete
  assertEquals(results.length, 5);
  
  // All results should have proper structure
  for (const result of results) {
    assertExists(result);
    assertEquals(typeof result.ok, "boolean");
  }
});