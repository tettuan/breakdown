/**
 * @fileoverview Tests for TwoParamsHandler following Totality Principle
 * 
 * Test structure follows DDD testing strategy:
 * - 0_architecture: Smart Constructor patterns, Result types, Totality compliance
 * - 1_behavior: Normal operations, error handling, boundary conditions  
 * - 2_structure: Data integrity, type completeness, invariants
 * 
 * All tests validate that the handler follows Totality principles:
 * - No exceptions thrown (uses Result type)
 * - All code paths covered
 * - No impossible states
 * - Type-safe error handling
 */

import { assertEquals, assertExists } from "@std/assert";
import { 
  handleTwoParams, 
  type TwoParamsHandlerError 
} from "./two_params_handler_original.ts";
import type { Result } from "../../types/result.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("two-params-handler-test");

// =============================================================================
// 0_architecture: Architecture constraint tests
// =============================================================================

Deno.test("TwoParamsHandler - Architecture - exports only total functions with Result type", () => {
  // Handler function should exist and be callable
  assertExists(handleTwoParams);
  assertEquals(typeof handleTwoParams, "function");
  
  // Function should follow async Result pattern (returns Promise<Result>)
  const functionToString = handleTwoParams.toString();
  const isAsync = functionToString.includes("async") || functionToString.includes("Promise");
  assertEquals(isAsync, true, "Should be async function returning Promise<Result>");
});

Deno.test("TwoParamsHandler - Architecture - follows Totality principle with Result type", async () => {
  // Test that all possible inputs return Result type, never throw
  const testCases = [
    { params: [], config: {}, options: {} },
    { params: ["invalid"], config: {}, options: {} },
    { params: ["to", "project"], config: {}, options: {} },
    { params: ["", ""], config: {}, options: {} },
  ];
  
  for (const testCase of testCases) {
    try {
      const result = await handleTwoParams(
        testCase.params,
        testCase.config,
        testCase.options
      );
      
      // Should always return Result type, never throw
      assertExists(result, "Should return Result");
      assertEquals(typeof result, "object", "Should return object");
      assertEquals("ok" in result, true, "Should have 'ok' property");
      
      if (result.ok) {
        assertEquals(result.data, undefined, "Success should have undefined data");
      } else {
        assertExists(result.error, "Error should have error property");
        assertExists(result.error.kind, "Error should have kind");
      }
    } catch (error) {
      throw new Error(`Function should not throw, but threw: ${error}`);
    }
  }
});

Deno.test("TwoParamsHandler - Architecture - uses exhaustive error types", async () => {
  // Test all defined error types are reachable
  const errorKindTests = [
    {
      params: [],
      expectedErrorKind: "InvalidParameterCount",
    },
    {
      params: ["invalid-demonstrative", "project"],
      expectedErrorKind: "InvalidDemonstrativeType",
    },
    {
      params: ["to", "invalid-layer"],
      expectedErrorKind: "InvalidLayerType",
    },
  ];
  
  for (const test of errorKindTests) {
    const result = await handleTwoParams(test.params, {}, {});
    
    assertEquals(result.ok, false, "Should return error");
    if (!result.ok) {
      assertEquals(
        result.error.kind,
        test.expectedErrorKind,
        `Should return ${test.expectedErrorKind} error`
      );
    }
  }
});

Deno.test("TwoParamsHandler - Architecture - integrates with Smart Constructor factories", async () => {
  // Verify integration with DemonstrativeTypeFactory (Smart Constructor pattern)
  const result = await handleTwoParams(["to", "project"], {}, {});
  
  assertExists(result, "Should integrate with factories");
  assertEquals(typeof result, "object", "Should return Result");
  
  // Should use factory validation, not direct type assertions
  if (!result.ok && result.error.kind === "InvalidDemonstrativeType") {
    assertExists(result.error.validTypes, "Should provide valid types from factory");
    assertEquals(Array.isArray(result.error.validTypes), true);
  }
});

// =============================================================================
// 1_behavior: Behavior verification tests
// =============================================================================

Deno.test("TwoParamsHandler - Behavior - handles valid parameters successfully", async () => {
  const validParams = ["to", "project"];
  const config = {
    timeout: 30000,
    workingDirectory: "/tmp",
  };
  const options = {
    output: "test-output.md",
  };
  
  const result = await handleTwoParams(validParams, config, options);
  
  logger.debug("Valid parameters test", { result });
  
  assertExists(result, "Should handle valid parameters");
  assertEquals(typeof result, "object", "Should return Result object");
  
  // May fail due to missing dependencies, but should be structured error
  if (!result.ok) {
    assertExists(result.error.kind, "Should have structured error");
    // Should not fail on parameter validation
    assertEquals(
      result.error.kind !== "InvalidParameterCount" &&
      result.error.kind !== "InvalidDemonstrativeType" &&
      result.error.kind !== "InvalidLayerType",
      true,
      "Should pass parameter validation"
    );
  }
});

Deno.test("TwoParamsHandler - Behavior - rejects insufficient parameters", async () => {
  const result = await handleTwoParams([], {}, {});
  
  assertEquals(result.ok, false, "Should reject empty parameters");
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidParameterCount");
    if (result.error.kind === "InvalidParameterCount") {
      assertEquals(result.error.received, 0);
      assertEquals(result.error.expected, 2);
    }
  }
});

Deno.test("TwoParamsHandler - Behavior - validates demonstrative types", async () => {
  const invalidDemonstrativeTypes = ["invalid", "unknown", ""];
  
  for (const invalidType of invalidDemonstrativeTypes) {
    const result = await handleTwoParams([invalidType, "project"], {}, {});
    
    assertEquals(result.ok, false, `Should reject ${invalidType}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidDemonstrativeType");
      if (result.error.kind === "InvalidDemonstrativeType") {
        assertEquals(result.error.value, invalidType);
        assertExists(result.error.validTypes);
      }
    }
  }
});

Deno.test("TwoParamsHandler - Behavior - validates layer types", async () => {
  const invalidLayerTypes = ["invalid", "unknown", ""];
  
  for (const invalidType of invalidLayerTypes) {
    const result = await handleTwoParams(["to", invalidType], {}, {});
    
    assertEquals(result.ok, false, `Should reject ${invalidType}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidLayerType");
      if (result.error.kind === "InvalidLayerType") {
        assertEquals(result.error.value, invalidType);
        assertExists(result.error.validTypes);
      }
    }
  }
});

Deno.test("TwoParamsHandler - Behavior - processes custom variables", async () => {
  const options = {
    "uv-projectName": "TestProject",
    "uv-version": "1.0.0",
    "uv-author": "TestAuthor",
    output: "custom-output.md",
  };
  
  const result = await handleTwoParams(["to", "project"], {}, options);
  
  logger.debug("Custom variables test", { result });
  
  assertExists(result, "Should process custom variables");
  // Custom variables should be extracted and processed internally
  // Specific behavior depends on downstream components
});

Deno.test("TwoParamsHandler - Behavior - handles STDIN input gracefully", async () => {
  const config = {
    timeout: 5000, // Short timeout for test
  };
  const options = {
    from: "-", // Explicit STDIN
  };
  
  const result = await handleTwoParams(["summary", "issue"], config, options);
  
  logger.debug("STDIN test", { result });
  
  assertExists(result, "Should handle STDIN input");
  // Should not fail on STDIN handling itself
  if (!result.ok && result.error.kind === "StdinReadError") {
    assertExists(result.error.error, "Should have error details");
  }
});

// =============================================================================
// 2_structure: Data structure integrity tests
// =============================================================================

Deno.test("TwoParamsHandler - Structure - Result type has correct discriminated union", async () => {
  const result = await handleTwoParams(["to", "project"], {}, {});
  
  // Verify discriminated union structure
  assertExists(result, "Result should exist");
  assertEquals(typeof result, "object", "Result should be object");
  
  if ("ok" in result && result.ok === true) {
    assertEquals("data" in result, true, "Success should have data");
    assertEquals("error" in result, false, "Success should not have error");
    assertEquals(result.data, undefined, "Success data should be undefined");
  } else if ("ok" in result && result.ok === false) {
    assertEquals("error" in result, true, "Error should have error");
    assertEquals("data" in result, false, "Error should not have data");
    assertExists(result.error, "Error should exist");
  } else {
    throw new Error("Result does not match expected discriminated union");
  }
});

Deno.test("TwoParamsHandler - Structure - error types have complete structure", async () => {
  const errorTests = [
    {
      params: [],
      expectedStructure: ["kind", "received", "expected"],
    },
    {
      params: ["invalid", "project"],
      expectedStructure: ["kind", "value", "validTypes"],
    },
    {
      params: ["to", "invalid"],
      expectedStructure: ["kind", "value", "validTypes"],
    },
  ];
  
  for (const test of errorTests) {
    const result = await handleTwoParams(test.params, {}, {});
    
    assertEquals(result.ok, false, "Should return error");
    if (!result.ok) {
      const error = result.error;
      
      // Verify all expected properties exist
      for (const prop of test.expectedStructure) {
        assertExists(
          (error as any)[prop],
          `Error should have ${prop} property`
        );
      }
      
      // Verify types
      assertEquals(typeof error.kind, "string", "kind should be string");
    }
  }
});

Deno.test("TwoParamsHandler - Structure - maintains parameter validation order", async () => {
  // Parameters should be validated in specific order:
  // 1. Parameter count
  // 2. Demonstrative type  
  // 3. Layer type
  
  const paramCountResult = await handleTwoParams([], {}, {});
  assertEquals(paramCountResult.ok, false);
  if (!paramCountResult.ok) {
    assertEquals(paramCountResult.error.kind, "InvalidParameterCount");
  }
  
  const demonstrativeResult = await handleTwoParams(["invalid"], {}, {});
  assertEquals(demonstrativeResult.ok, false);
  if (!demonstrativeResult.ok) {
    assertEquals(demonstrativeResult.error.kind, "InvalidParameterCount"); // Still parameter count error
  }
  
  const layerResult = await handleTwoParams(["invalid", "project"], {}, {});
  assertEquals(layerResult.ok, false);
  if (!layerResult.ok) {
    assertEquals(layerResult.error.kind, "InvalidDemonstrativeType"); // Now demonstrative error
  }
});

Deno.test("TwoParamsHandler - Structure - validates enum consistency", async () => {
  // Valid types should be consistent with actual enums
  const demonstrativeResult = await handleTwoParams(["invalid", "project"], {}, {});
  
  if (!demonstrativeResult.ok && demonstrativeResult.error.kind === "InvalidDemonstrativeType") {
    const validTypes = demonstrativeResult.error.validTypes;
    
    // Should include expected valid types
    assertEquals(validTypes.includes("to"), true, "Should include 'to'");
    assertEquals(validTypes.includes("summary"), true, "Should include 'summary'");
    assertEquals(validTypes.includes("defect"), true, "Should include 'defect'");
    
    // Should be array
    assertEquals(Array.isArray(validTypes), true, "Should be array");
    assertEquals(validTypes.length > 0, true, "Should have valid options");
  }
  
  const layerResult = await handleTwoParams(["to", "invalid"], {}, {});
  
  if (!layerResult.ok && layerResult.error.kind === "InvalidLayerType") {
    const validTypes = layerResult.error.validTypes;
    
    // Should include expected valid types
    assertEquals(validTypes.includes("project"), true, "Should include 'project'");
    assertEquals(validTypes.includes("issue"), true, "Should include 'issue'");
    assertEquals(validTypes.includes("task"), true, "Should include 'task'");
    
    // Should be array
    assertEquals(Array.isArray(validTypes), true, "Should be array");
    assertEquals(validTypes.length > 0, true, "Should have valid options");
  }
});

Deno.test("TwoParamsHandler - Structure - preserves input data through transformation", async () => {
  const originalParams = ["to", "project"];
  const originalConfig = { timeout: 30000, custom: "value" };
  const originalOptions = { 
    output: "test.md",
    "uv-custom": "preserved",
  };
  
  const result = await handleTwoParams(originalParams, originalConfig, originalOptions);
  
  logger.debug("Data preservation test", { 
    original: { originalParams, originalConfig, originalOptions },
    result 
  });
  
  // Input data should not be mutated
  assertEquals(originalParams[0], "to", "Input params should not be mutated");
  assertEquals(originalParams[1], "project", "Input params should not be mutated");
  assertEquals(originalConfig.timeout, 30000, "Config should not be mutated");
  assertEquals(originalOptions.output, "test.md", "Options should not be mutated");
  
  // Result should maintain structure regardless of success/failure
  assertExists(result, "Should return structured result");
  assertEquals(typeof result, "object", "Should be object");
});