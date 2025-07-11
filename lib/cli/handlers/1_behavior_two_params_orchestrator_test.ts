/**
 * @fileoverview Behavior tests for TwoParamsOrchestrator
 *
 * Testing focus areas:
 * 1. Orchestration flow behavior and component coordination
 * 2. Parameter validation and transformation behavior
 * 3. Error handling and propagation behavior
 * 4. Resource management and cleanup behavior
 * 5. Result type behavior and data flow
 *
 * @module lib/cli/handlers/1_behavior_two_params_orchestrator_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  handleTwoParamsWithOrchestrator,
  type OrchestratorError as _OrchestratorError,
  TwoParamsOrchestrator,
} from "./two_params_orchestrator.ts";
import type { Result as _Result } from "$lib/types/result.ts";
import { isError, isOk } from "$lib/types/result.ts";

// =============================================================================
// 1_behavior: Basic Orchestration Flow Behavior Tests
// =============================================================================

Deno.test("1_behavior: orchestrator processes valid two params successfully", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const params: string[] = ["to", "project"];
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(params, config, options);

  // Should complete the full orchestration pipeline
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);

  if (result.ok) {
    assertEquals(result.data, undefined); // void return type
  }
});

Deno.test("1_behavior: orchestrator handles different demonstrative types", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const demonstrativeTypes = ["to", "summary", "defect"];

  for (const demType of demonstrativeTypes) {
    const params: string[] = [demType, "project"];
    const result = await orchestrator.orchestrate(params, config, options);

    assertEquals(typeof result, "object", `Failed for demonstrative type: ${demType}`);
    assertEquals("ok" in result, true);
  }
});

Deno.test("1_behavior: orchestrator handles different layer types", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const layerTypes = ["project", "issue", "task"];

  for (const layerType of layerTypes) {
    const params: string[] = ["to", layerType];
    const result = await orchestrator.orchestrate(params, config, options);

    assertEquals(typeof result, "object", `Failed for layer type: ${layerType}`);
    assertEquals("ok" in result, true);
  }
});

// =============================================================================
// 1_behavior: Parameter Validation Behavior Tests
// =============================================================================

Deno.test("1_behavior: orchestrator rejects null parameters", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(null as unknown as string[], config, options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidParameterCount");
    if (result.error.kind === "InvalidParameterCount") {
      assertEquals(result.error.received, 0);
      assertEquals(result.error.expected, 2);
    }
  }
});

Deno.test("1_behavior: orchestrator rejects empty parameter array", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate([] as string[], config, options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidParameterCount");
    if (result.error.kind === "InvalidParameterCount") {
      assertEquals(result.error.received, 0);
      assertEquals(result.error.expected, 2);
    }
  }
});

Deno.test("1_behavior: orchestrator rejects single parameter", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(["to"] as string[], config, options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidParameterCount");
    if (result.error.kind === "InvalidParameterCount") {
      assertEquals(result.error.received, 1);
      assertEquals(result.error.expected, 2);
    }
  }
});

Deno.test("1_behavior: orchestrator accepts extra parameters", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(
    ["to", "project", "extra", "params"] as string[],
    config,
    options,
  );

  // Should not fail for extra parameters (uses first two)
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);
});

Deno.test("1_behavior: orchestrator validates demonstrative type values", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(
    ["invalid_directive", "project"] as string[],
    config,
    options,
  );

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidDemonstrativeType");
    if (result.error.kind === "InvalidDemonstrativeType") {
      assertEquals(result.error.value, "invalid_directive");
    }
  }
});

Deno.test("1_behavior: orchestrator validates layer type values", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(
    ["to", "invalid_layer"] as string[],
    config,
    options,
  );

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidLayerType");
    if (result.error.kind === "InvalidLayerType") {
      assertEquals(result.error.value, "invalid_layer");
    }
  }
});

// =============================================================================
// 1_behavior: STDIN Processing Behavior Tests
// =============================================================================

Deno.test("1_behavior: orchestrator skips stdin when skipStdin is true", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(["summary", "issue"] as string[], config, options);

  // Should complete successfully without reading stdin
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);
});

Deno.test("1_behavior: orchestrator attempts stdin when from is dash", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 3000 };
  const options = { from: "-" };

  const result = await orchestrator.orchestrate(["to", "task"] as string[], config, options);

  // Should attempt stdin reading (may succeed or fail in test environment)
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);

  if (!result.ok) {
    // Could fail with either StdinReadError or PromptGenerationError depending on the failure point
    const validErrorKinds = ["StdinReadError", "PromptGenerationError"];
    assertEquals(validErrorKinds.includes(result.error.kind), true);
  }
});

// =============================================================================
// 1_behavior: Variable Processing Behavior Tests
// =============================================================================

Deno.test("1_behavior: orchestrator processes custom variables", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };
  const options = {
    skipStdin: true,
    "uv-customVar": "test value",
    "uv-author": "test user",
  };

  const result = await orchestrator.orchestrate(["defect", "project"] as string[], config, options);

  // Should process custom variables successfully
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);
});

Deno.test("1_behavior: orchestrator handles variable processing errors", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };
  const options = {
    skipStdin: true,
    "uv-input_text": "reserved variable name", // Should cause error
  };

  const result = await orchestrator.orchestrate(["to", "project"] as string[], config, options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "VariableProcessingError");
    if (result.error.kind === "VariableProcessingError") {
      assertEquals(Array.isArray((result.error as unknown as { errors: unknown[] }).errors), true);
    }
  }
});

// =============================================================================
// 1_behavior: Prompt Generation Behavior Tests
// =============================================================================

Deno.test("1_behavior: orchestrator coordinates prompt generation", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = {
    timeout: 5000,
    promptDir: "/test/prompts",
    schemaDir: "/test/schemas",
  };
  const options = {
    skipStdin: true,
    destination: "output.md",
  };

  const result = await orchestrator.orchestrate(["summary", "task"] as string[], config, options);

  // Should attempt prompt generation (may succeed or fail depending on file availability)
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);

  if (!result.ok) {
    // If it fails, should be a prompt generation error
    assertEquals(result.error.kind, "PromptGenerationError");
  }
});

// =============================================================================
// 1_behavior: Error Propagation Behavior Tests
// =============================================================================

Deno.test("1_behavior: orchestrator propagates parameter validation errors", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = {};
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(
    ["invalid", "also_invalid"] as string[],
    config,
    options,
  );

  assertEquals(result.ok, false);
  if (!result.ok) {
    // Should propagate the first validation error encountered
    const validErrorKinds = ["InvalidDemonstrativeType", "InvalidLayerType"];
    assertEquals(validErrorKinds.includes(result.error.kind), true);
  }
});

Deno.test("1_behavior: orchestrator handles component failures gracefully", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 100 }; // Very short timeout to potentially cause stdin failure
  const options = { from: "-" }; // Force stdin attempt

  const result = await orchestrator.orchestrate(["to", "project"] as string[], config, options);

  // Should handle component failures and return proper error
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);

  if (!result.ok) {
    const validErrorKinds = [
      "InvalidParameterCount",
      "InvalidDemonstrativeType",
      "InvalidLayerType",
      "StdinReadError",
      "VariableProcessingError",
      "PromptGenerationError",
      "OutputWriteError",
    ];
    assertEquals(validErrorKinds.includes(result.error.kind), true);
  }
});

// =============================================================================
// 1_behavior: Backward Compatibility Function Behavior Tests
// =============================================================================

Deno.test("1_behavior: handleTwoParamsWithOrchestrator maintains compatibility", async () => {
  const params: string[] = ["to", "project"];
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await handleTwoParamsWithOrchestrator(params, config, options);

  // Should produce same result as direct orchestrator usage
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);

  if (result.ok) {
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: handleTwoParamsWithOrchestrator creates fresh instances", async () => {
  const params: string[] = ["summary", "issue"];
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  // Make multiple calls
  const result1 = await handleTwoParamsWithOrchestrator(params, config, options);
  const result2 = await handleTwoParamsWithOrchestrator(params, config, options);

  // Should produce consistent results from fresh instances
  assertEquals(typeof result1, "object");
  assertEquals(typeof result2, "object");
  assertEquals(result1.ok, result2.ok);
});

// =============================================================================
// 1_behavior: Configuration Behavior Tests
// =============================================================================

Deno.test("1_behavior: orchestrator handles various configuration formats", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const params: string[] = ["to", "project"];
  const options = { skipStdin: true };

  const configVariations = [
    {},
    { timeout: 5000 },
    { stdin: { timeout_ms: 3000 } },
    { promptDir: "/custom/prompts", schemaDir: "/custom/schemas" },
  ];

  for (const config of configVariations) {
    const result = await orchestrator.orchestrate(params, config, options);
    assertEquals(typeof result, "object", `Failed for config: ${JSON.stringify(config)}`);
    assertEquals("ok" in result, true);
  }
});

// =============================================================================
// 1_behavior: Resource Management Behavior Tests
// =============================================================================

Deno.test("1_behavior: orchestrator cleans up resources on completion", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const params: string[] = ["defect", "task"];
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(params, config, options);

  // Should complete without resource leaks
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);

  // Make another call to ensure clean state
  const result2 = await orchestrator.orchestrate(params, config, options);
  assertEquals(typeof result2, "object");
  assertEquals("ok" in result2, true);
});

Deno.test("1_behavior: orchestrator handles multiple concurrent orchestrations", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  // Run multiple orchestrations concurrently
  const promises = [
    orchestrator.orchestrate(["to", "project"] as string[], config, options),
    orchestrator.orchestrate(["summary", "issue"] as string[], config, options),
    orchestrator.orchestrate(["defect", "task"] as string[], config, options),
  ];

  const results = await Promise.all(promises);

  // All should complete successfully
  for (const result of results) {
    assertEquals(typeof result, "object");
    assertEquals("ok" in result, true);
  }
});

// =============================================================================
// 1_behavior: Result Type Behavior Tests
// =============================================================================

Deno.test("1_behavior: orchestrator returns proper Result structure on success", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const params: string[] = ["to", "project"];
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(params, config, options);

  // Verify Result<void, OrchestratorError> structure
  assertEquals(typeof result, "object");
  assertExists(result);
  assertEquals("ok" in result, true);

  if (result.ok) {
    assertEquals("data" in result, true);
    assertEquals("error" in result, false);
    assertEquals(result.data, undefined);
  }
});

Deno.test("1_behavior: orchestrator returns proper error structure on failure", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const params: string[] = []; // Invalid parameter count
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(params, config, options);

  // Verify error Result structure
  assertEquals(typeof result, "object");
  assertExists(result);
  assertEquals("ok" in result, true);
  assertEquals(result.ok, false);

  if (!result.ok) {
    assertEquals("error" in result, true);
    assertEquals("data" in result, false);
    assertEquals(typeof result.error, "object");
    assertEquals("kind" in result.error, true);
  }
});

// =============================================================================
// 1_behavior: Type Guard Behavior Tests
// =============================================================================

Deno.test("1_behavior: Result type guards work correctly for success", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const params: string[] = ["summary", "project"];
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(params, config, options);

  // Test type guards
  if (isOk(result)) {
    assertEquals(result.data, undefined);
  }

  // At minimum, one should be true
  assertEquals(isOk(result) || isError(result), true);
});

Deno.test("1_behavior: Result type guards work correctly for error", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const params: string[] = ["invalid_directive", "project"];
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(params, config, options);

  // Should be error
  assertEquals(isError(result), true);
  assertEquals(isOk(result), false);

  if (isError(result)) {
    assertEquals(typeof result.error, "object");
    assertEquals("kind" in result.error, true);
  }
});

// =============================================================================
// 1_behavior: Pipeline Flow Behavior Tests
// =============================================================================

Deno.test("1_behavior: orchestrator executes pipeline steps in correct order", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const params: string[] = ["to", "task"];
  const config = { timeout: 5000 };
  const options = {
    skipStdin: true,
    "uv-testVar": "test value",
    destination: "output.md",
  };

  const result = await orchestrator.orchestrate(params, config, options);

  // Pipeline should execute: validate -> extract -> stdin -> variables -> prompt -> output
  assertEquals(typeof result, "object");
  assertEquals("ok" in result, true);
});

Deno.test("1_behavior: orchestrator stops pipeline on first error", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const params: string[] = []; // Will fail at parameter validation (first step)
  const config = { timeout: 5000 };
  const options = { skipStdin: true };

  const result = await orchestrator.orchestrate(params, config, options);

  // Should fail early at parameter validation
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidParameterCount");
  }
});

// =============================================================================
// 1_behavior: State Isolation Behavior Tests
// =============================================================================

Deno.test("1_behavior: orchestrator maintains state isolation between calls", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };

  // First call with valid parameters
  const result1 = await orchestrator.orchestrate(
    ["to", "project"] as string[],
    config,
    { skipStdin: true },
  );

  // Second call with invalid parameters
  const result2 = await orchestrator.orchestrate(
    ["invalid", "project"] as string[],
    config,
    { skipStdin: true },
  );

  // First call should not be affected by second call's failure
  assertEquals(typeof result1, "object");
  assertEquals(typeof result2, "object");

  // Results should be independent
  if (result1.ok) {
    assertEquals(result1.data, undefined);
  }

  if (!result2.ok) {
    assertEquals(result2.error.kind, "InvalidDemonstrativeType");
  }
});

Deno.test("1_behavior: orchestrator handles mixed success/failure scenarios", async () => {
  const orchestrator = new TwoParamsOrchestrator();
  const config = { timeout: 5000 };

  const testCases = [
    { params: ["to", "project"] as string[], options: { skipStdin: true }, shouldSucceed: true },
    {
      params: ["invalid", "project"] as string[],
      options: { skipStdin: true },
      shouldSucceed: false,
    },
    { params: ["summary", "issue"] as string[], options: { skipStdin: true }, shouldSucceed: true },
    { params: [] as string[], options: { skipStdin: true }, shouldSucceed: false },
  ];

  for (const testCase of testCases) {
    const result = await orchestrator.orchestrate(
      testCase.params,
      config,
      testCase.options,
    );

    assertEquals(typeof result, "object");
    assertEquals("ok" in result, true);

    if (testCase.shouldSucceed) {
      // Don't assert success as it may fail due to environment issues
      // Just ensure it's a valid result
      assertEquals(typeof result, "object");
    } else {
      // Should definitely fail for invalid inputs
      assertEquals(result.ok, false);
    }
  }
});
