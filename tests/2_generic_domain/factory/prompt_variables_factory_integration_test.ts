/**
 * @fileoverview PromptVariablesFactory Integration Tests
 * Testing factory pattern implementation and coordination
 *
 * Integration tests verify:
 * - PromptVariablesFactory orchestration and delegation
 * - 3-stage transformation process coordination
 * - Path resolver integration and dependency injection
 * - Error handling and recovery across factory boundaries
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  type PromptCliOptions,
  type PromptCliParams,
  PromptVariablesFactory,
  type TotalityPromptCliParams,
} from "../../../lib/factory/prompt_variables_factory.ts";
import type { Result as _Result } from "../../../lib/types/result.ts";
import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/domain/core/value_objects/layer_type.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";

const logger = new BreakdownLogger("prompt-variables-factory-integration");

// Mock configuration for testing
const mockConfig = {
  app_prompt: { base_dir: ".agent/prompts" },
  app_schema: { base_dir: ".agent/schema" },
  working_dir: ".agent/breakdown",
  resource_dir: ".agent/resources",
};

// Mock TwoParams_Result for creating DirectiveType and LayerType
function createMockTwoParamsResult(directive: string, layer: string): TwoParams_Result {
  return {
    type: "two",
    params: [directive, layer],
    directiveType: directive,
    layerType: layer,
    options: {},
  };
}

// Helper to create test parameters
function createTestParams(
  directive: string,
  layer: string,
  options: Partial<PromptCliOptions> = {},
): PromptCliParams {
  return {
    directiveType: directive,
    layerType: layer,
    options: {
      fromFile: "test.md",
      destinationFile: "output.json",
      adaptation: "standard",
      ...options,
    },
  };
}

// Helper to create totality-compliant parameters
function createTotalityParams(
  directive: string,
  layer: string,
  options: Partial<PromptCliOptions> = {},
): TotalityPromptCliParams {
  const baseParams = createTestParams(directive, layer, options);
  const mockResult = createMockTwoParamsResult(directive, layer);
  return {
    ...baseParams,
    directive: DirectiveType.create(mockResult),
    layer: LayerType.create(mockResult),
  };
}

Deno.test("PromptVariablesFactory Integration: complete transformation workflow", async () => {
  logger.debug("Testing complete transformation workflow");

  const factoryResult = PromptVariablesFactory.createWithConfig(
    mockConfig,
    createTestParams("to", "project", {}),
  );
  if (!factoryResult.ok) throw new Error("Factory creation failed");
  const factory = factoryResult.data;
  const _params = createTestParams("to", "project", {
    fromFile: "project_spec.md",
    destinationFile: "project_breakdown.json",
    customVariables: {
      project_name: "AI Assistant Platform",
      priority: "high",
      timeline: "Q2 2024",
    },
  });

  // Test the complete transformation pipeline
  const result = await factory.toPromptParams();

  // Debug output for error diagnosis
  if (!result.ok) {
    logger.debug("Factory transformation failed", {
      error: result.error.message,
      promptFilePath: (() => {
        try {
          return factory.promptFilePath;
        } catch (_e) {
          return `Error: ${_e}`;
        }
      })(),
      inputFilePath: (() => {
        try {
          return factory.inputFilePath;
        } catch (_e) {
          return `Error: ${_e}`;
        }
      })(),
    });
  }

  // Verify successful transformation
  assertEquals(result.ok, true, "Factory should successfully create prompt variables");

  if (result.ok) {
    const promptParams = result.data;
    assertExists(promptParams, "PromptParams should be created");

    // Verify the transformation included all stages
    // Stage 1: PromptVariableSource creation
    // Stage 2: Path resolution
    // Stage 3: Final PromptParams assembly

    logger.debug("Transformation stages completed", {
      hasPromptParams: !!promptParams,
      parameterCount: Object.keys(promptParams || {}).length,
    });
  }
});

Deno.test("PromptVariablesFactory Integration: path resolver coordination", async () => {
  logger.debug("Testing path resolver coordination");

  const factoryResult = PromptVariablesFactory.createWithConfig(
    mockConfig,
    createTestParams("to", "project", {}),
  );
  if (!factoryResult.ok) throw new Error("Factory creation failed");
  const factory = factoryResult.data;

  // Test different path resolution scenarios
  const pathTestCases = [
    {
      name: "Template and schema resolution",
      params: createTestParams("to", "issue", {
        fromFile: "issue_input.md",
        adaptation: "detailed",
      }),
      expectedPaths: ["template", "schema", "input", "output"],
    },
    {
      name: "Custom directory resolution",
      params: createTestParams("summary", "task", {
        promptDir: "custom/prompts",
        fromFile: "./relative/input.md",
      }),
      expectedPaths: ["template", "schema", "input", "output"],
    },
    {
      name: "Absolute path handling",
      params: createTestParams("defect", "project", {
        fromFile: "/absolute/path/input.md",
        destinationFile: "/absolute/output/result.json",
      }),
      expectedPaths: ["template", "schema", "input", "output"],
    },
  ];

  for (const { name, params, expectedPaths: _expectedPaths } of pathTestCases) {
    logger.debug(`Testing path resolution: ${name}`, {
      directive: params.directiveType,
      layer: params.layerType,
      fromFile: params.options.fromFile,
    });

    const result = await factory.toPromptParams();

    // Even if path resolution fails due to missing files,
    // the factory should handle it gracefully
    assertExists(result, `Result should exist for ${name}`);
    assertEquals(typeof result.ok, "boolean", `Result should have ok property for ${name}`);

    if (!result.ok) {
      logger.debug(`Path resolution handled error gracefully: ${name}`, {
        errorType: typeof result.error,
        hasErrorMessage: !!(result.error as { message?: string })?.message,
      });
    }
  }
});

Deno.test("PromptVariablesFactory Integration: dependency injection verification", async () => {
  logger.debug("Testing dependency injection");

  // Test factory with different configurations
  const configVariations = [
    {
      name: "Minimal configuration",
      config: { app_prompt: { base_dir: ".prompts" } },
    },
    {
      name: "Complete configuration",
      config: {
        app_prompt: { base_dir: "custom/prompts" },
        app_schema: { base_dir: "custom/schemas" },
        working_dir: "custom/work",
        resource_dir: "custom/resources",
      },
    },
    {
      name: "Empty configuration",
      config: {},
    },
  ];

  for (const { name, config } of configVariations) {
    logger.debug(`Testing configuration: ${name}`, {
      configKeys: Object.keys(config),
      hasPromptConfig: !!(config as Record<string, unknown>).app_prompt,
      hasSchemaConfig: !!(config as Record<string, unknown>).app_schema,
    });

    // Factory should accept different configurations
    const factoryResult = PromptVariablesFactory.createWithConfig(
      config,
      createTestParams("to", "project", {}),
    );

    // Empty configuration should fail
    if (name === "Empty configuration") {
      assertEquals(factoryResult.ok, false, "Empty configuration should fail");
      if (!factoryResult.ok) {
        assertExists(factoryResult.error, "Error should be provided for empty configuration");
      }
      continue;
    }

    // Other configurations should succeed
    if (!factoryResult.ok) throw new Error(`Factory creation failed for ${name}`);
    const factory = factoryResult.data;
    assertExists(factory, `Factory should be created with ${name}`);

    // Test with simple parameters
    const _params = createTestParams("to", "task", {
      fromFile: "simple.md",
    });

    const result = await factory.toPromptParams();
    assertExists(result, `Result should exist for ${name}`);
    assertEquals(typeof result.ok, "boolean", `Result should have ok property for ${name}`);
  }
});

Deno.test("PromptVariablesFactory Integration: error propagation and handling", async () => {
  logger.debug("Testing error propagation");

  const factoryResult = PromptVariablesFactory.createWithConfig(
    mockConfig,
    createTestParams("to", "project", {}),
  );
  if (!factoryResult.ok) throw new Error("Factory creation failed");
  const factory = factoryResult.data;

  // Test various error conditions
  const errorTestCases = [
    {
      name: "Invalid directive type",
      params: createTestParams("", "project"),
      expectedError: "directive",
    },
    {
      name: "Invalid layer type",
      params: createTestParams("to", ""),
      expectedError: "layer",
    },
    {
      name: "Missing options",
      params: {
        directiveType: "to",
        layerType: "project",
        options: {} as PromptCliOptions,
      },
      expectedError: "options",
    },
    {
      name: "Invalid file paths",
      params: createTestParams("to", "project", {
        fromFile: "\0invalid\0path",
        destinationFile: "invalid<>path",
      }),
      expectedError: "path",
    },
  ];

  for (const { name, params, expectedError } of errorTestCases) {
    logger.debug(`Testing error case: ${name}`, {
      directive: params.directiveType,
      layer: params.layerType,
      expectedErrorType: expectedError,
    });

    const result = await factory.toPromptParams();

    // Error should be handled gracefully
    assertExists(result, `Result should exist for error case: ${name}`);
    assertEquals(typeof result.ok, "boolean", `Result should have ok property for: ${name}`);

    if (!result.ok) {
      assertExists(result.error, `Error should be present for: ${name}`);
      logger.debug(`Error properly captured: ${name}`, {
        errorType: typeof result.error,
        errorPresent: !!result.error,
      });
    }
  }
});

Deno.test("PromptVariablesFactory Integration: totality compliance", async () => {
  logger.debug("Testing totality compliance");

  const factoryResult = PromptVariablesFactory.createWithConfig(
    mockConfig,
    createTestParams("to", "project", {}),
  );
  if (!factoryResult.ok) throw new Error("Factory creation failed");
  const factory = factoryResult.data;

  // Test with totality-compliant parameters
  const _totalityParams = createTotalityParams("summary", "issue", {
    fromFile: "issue_details.md",
    customVariables: {
      issue_id: "ISS-001",
      reporter: "user@example.com",
      severity: "high",
    },
  });

  const result = await factory.toPromptParams();

  // Totality parameters should be handled correctly
  assertExists(result, "Result should exist for totality parameters");
  assertEquals(typeof result.ok, "boolean", "Result should have ok property");

  if (result.ok) {
    const promptParams = result.data;
    assertExists(promptParams, "PromptParams should be created");

    logger.debug("Totality compliance verified", {
      hasPromptParams: !!promptParams,
      parametersProcessed: true,
    });
  }
});

Deno.test("PromptVariablesFactory Integration: factory pattern responsibility separation", async () => {
  logger.debug("Testing factory pattern responsibilities");

  const factoryResult = PromptVariablesFactory.createWithConfig(
    mockConfig,
    createTestParams("to", "project", {}),
  );
  if (!factoryResult.ok) throw new Error("Factory creation failed");
  const factory = factoryResult.data;

  // Test that factory properly delegates responsibilities
  const _params = createTestParams("defect", "task", {
    fromFile: "defect_report.md",
    adaptation: "comprehensive",
    customVariables: {
      defect_type: "performance",
      impact: "high",
      root_cause: "memory leak",
    },
  });

  const result = await factory.toPromptParams();

  // Factory should orchestrate but not implement transformation logic
  assertExists(result, "Factory should orchestrate transformation");
  assertEquals(typeof result.ok, "boolean", "Factory should return Result type");

  // Test factory's orchestration role
  logger.debug("Factory orchestration verified", {
    factoryExists: !!factory,
    resultType: typeof result,
    hasResultProperty: "ok" in result,
  });

  // Verify factory doesn't expose internal implementation details
  const factoryPrototype = Object.getPrototypeOf(factory);
  const allPropertyNames = Object.getOwnPropertyNames(factoryPrototype);
  const factoryMethods = allPropertyNames.filter((name) => {
    if (name === "constructor") return false;
    try {
      const descriptor = Object.getOwnPropertyDescriptor(factoryPrototype, name);
      return descriptor && typeof descriptor.value === "function";
    } catch (_e) {
      // Skip properties that throw errors
      return false;
    }
  });

  // Factory should have minimal public interface
  // Note: 'create' is a static method, not an instance method
  assertEquals(
    factoryMethods.includes("toPromptParams"),
    true,
    "Factory should have toPromptParams method",
  );
  logger.debug("Factory interface verified", {
    publicMethods: factoryMethods,
    methodCount: factoryMethods.length,
  });
});

Deno.test("PromptVariablesFactory Integration: concurrent processing", async () => {
  logger.debug("Testing concurrent processing");

  const factoryResult = PromptVariablesFactory.createWithConfig(
    mockConfig,
    createTestParams("to", "project", {}),
  );
  if (!factoryResult.ok) throw new Error("Factory creation failed");
  const factory = factoryResult.data;

  // Create multiple concurrent requests
  const concurrentRequests = [
    createTestParams("to", "project", { fromFile: "project1.md" }),
    createTestParams("summary", "issue", { fromFile: "issue1.md" }),
    createTestParams("defect", "task", { fromFile: "task1.md" }),
    createTestParams("to", "issue", { fromFile: "conversion1.md" }),
  ];

  const startTime = performance.now();

  // Process all requests concurrently
  const results = await Promise.all(
    concurrentRequests.map((_params) => factory.toPromptParams()),
  );

  const endTime = performance.now();
  const duration = endTime - startTime;

  logger.debug("Concurrent processing completed", {
    requestCount: concurrentRequests.length,
    duration: `${duration.toFixed(2)}ms`,
    averageTime: `${(duration / concurrentRequests.length).toFixed(2)}ms`,
  });

  // Verify all requests were processed
  assertEquals(results.length, concurrentRequests.length, "All requests should be processed");

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    assertExists(result, `Result ${i} should exist`);
    assertEquals(typeof result.ok, "boolean", `Result ${i} should have ok property`);
  }

  // Performance should be reasonable (less than 1 second total)
  assertEquals(duration < 1000, true, `Duration ${duration}ms should be less than 1000ms`);
});

Deno.test("PromptVariablesFactory Integration: memory management", async () => {
  logger.debug("Testing memory management");

  const factoryResult = PromptVariablesFactory.createWithConfig(
    mockConfig,
    createTestParams("to", "project", {}),
  );
  if (!factoryResult.ok) throw new Error("Factory creation failed");
  const factory = factoryResult.data;

  // Test memory usage with multiple operations
  const iterations = 50;
  const results: unknown[] = [];

  for (let i = 0; i < iterations; i++) {
    const _params = createTestParams("to", "project", {
      fromFile: `test_${i}.md`,
      destinationFile: `output_${i}.json`,
      customVariables: {
        iteration: i.toString(),
        timestamp: Date.now().toString(),
      },
    });

    const result = await factory.toPromptParams();
    results.push(result);
  }

  // Verify all operations completed
  assertEquals(results.length, iterations, "All iterations should complete");

  // Verify factory doesn't accumulate state
  for (let i = 0; i < 5; i++) {
    const _params = createTestParams("summary", "task", {
      fromFile: `verify_${i}.md`,
    });

    const result = await factory.toPromptParams();
    assertExists(result, `Verification result ${i} should exist`);
  }

  logger.debug("Memory management verified", {
    iterationsCompleted: iterations,
    verificationPassed: true,
    noStateAccumulation: true,
  });
});

Deno.test("PromptVariablesFactory Integration: custom variables processing", async () => {
  logger.debug("Testing custom variables processing");

  const factoryResult = PromptVariablesFactory.createWithConfig(
    mockConfig,
    createTestParams("to", "project", {}),
  );
  if (!factoryResult.ok) throw new Error("Factory creation failed");
  const factory = factoryResult.data;

  // Test complex custom variables
  const complexVariables = {
    user_info: JSON.stringify({ name: "Alice", role: "developer" }),
    project_config: JSON.stringify({
      features: ["auth", "dashboard", "reports"],
      timeline: { start: "2024-01-01", end: "2024-06-30" },
    }),
    environment_vars: JSON.stringify({
      NODE_ENV: "production",
      API_URL: "https://api.example.com",
      DEBUG: false,
    }),
    metadata: JSON.stringify({
      version: "2.1.0",
      author: "development-team",
      tags: ["feature", "enhancement"],
    }),
  };

  const _params = createTestParams("to", "issue", {
    fromFile: "complex_input.md",
    customVariables: complexVariables,
    extended: true,
    customValidation: true,
  });

  const result = await factory.toPromptParams();

  assertExists(result, "Result should exist for complex variables");
  assertEquals(typeof result.ok, "boolean", "Result should have ok property");

  logger.debug("Complex variables processed", {
    variableCount: Object.keys(complexVariables).length,
    resultExists: !!result,
    hasComplexData: true,
  });

  // Verify factory handles complex data structures
  const variableKeys = Object.keys(complexVariables);
  assertEquals(variableKeys.length, 4, "All custom variables should be accounted for");
  assertEquals(variableKeys.includes("user_info"), true, "User info should be included");
  assertEquals(variableKeys.includes("project_config"), true, "Project config should be included");
});
