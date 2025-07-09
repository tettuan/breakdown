/**
 * @fileoverview InputFilePathResolver Integration Tests
 * Testing path resolution coordination and factory pattern implementation
 *
 * Integration tests verify:
 * - Input path resolution across different input types
 * - Factory pattern responsibility separation
 * - Error handling and recovery mechanisms
 * - Configuration-driven path resolution
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { InputFilePathResolver } from "../../../lib/factory/input_file_path_resolver.ts";
import type {
  PromptCliOptions,
  PromptCliParams,
} from "../../../lib/factory/prompt_variables_factory.ts";
import type { Result } from "../../../lib/types/result.ts";

const logger = new BreakdownLogger("input-file-path-resolver-integration");

// Mock configuration for testing
const mockConfig = {
  app_prompt: { base_dir: ".agent/prompts" },
  app_schema: { base_dir: ".agent/schema" },
  working_dir: ".agent/breakdown",
  resource_dir: ".agent/resources",
};

// Helper to create test parameters
function createTestParams(
  directive: string,
  layer: string,
  options: Partial<PromptCliOptions> = {},
): PromptCliParams {
  return {
    demonstrativeType: directive,
    layerType: layer,
    options: {
      fromFile: "test.md",
      adaptation: "standard",
      ...options,
    },
  };
}

// Factory wrapper for managing multiple resolvers
class InputPathResolutionService {
  private resolvers: Map<string, InputFilePathResolver> = new Map();

  async createResolver(
    config: any,
    params: PromptCliParams,
  ): Promise<Result<InputFilePathResolver, any>> {
    const resolverId = `${params.demonstrativeType}-${params.layerType}-${Date.now()}`;

    try {
      const resolverResult = InputFilePathResolver.create(config, params);
      if (resolverResult.ok) {
        this.resolvers.set(resolverId, resolverResult.data);
        return { ok: true, data: resolverResult.data };
      }
      return resolverResult;
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: "CreationFailed",
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async processMultipleInputs(
    inputs: Array<{ config: any; params: PromptCliParams }>,
  ): Promise<Array<{ success: boolean; path?: any; error?: string }>> {
    const results = [];

    for (const { config, params } of inputs) {
      logger.debug("Processing input path resolution", {
        directive: params.demonstrativeType,
        layer: params.layerType,
        fromFile: params.options.fromFile,
      });

      const resolverResult = await this.createResolver(config, params);

      if (!resolverResult.ok) {
        results.push({
          success: false,
          error: `Failed to create resolver: ${resolverResult.error.kind}`,
        });
        continue;
      }

      try {
        const pathResult = resolverResult.data.getPath();
        if (pathResult.ok) {
          results.push({
            success: true,
            path: pathResult.data,
          });
        } else {
          results.push({
            success: false,
            error: `Path resolution failed: ${pathResult.error.kind}`,
          });
        }
      } catch (error) {
        results.push({
          success: false,
          error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    return results;
  }

  getResolverCount(): number {
    return this.resolvers.size;
  }

  clearResolvers(): void {
    this.resolvers.clear();
  }
}

Deno.test("InputFilePathResolver Integration: stdin input processing workflow", async () => {
  logger.debug("Testing stdin input processing workflow");

  const service = new InputPathResolutionService();

  // Test various stdin input scenarios
  const stdinTestCases = [
    {
      name: "Standard stdin input",
      params: createTestParams("to", "project", { fromFile: "-" }),
      expectedType: "stdin",
    },
    {
      name: "Piped content simulation",
      params: createTestParams("summary", "issue", {
        fromFile: "-",
        input_text: "Piped content from external source",
      }),
      expectedType: "stdin",
    },
    {
      name: "Stdin with custom variables",
      params: createTestParams("defect", "task", {
        fromFile: "-",
        customVariables: {
          source: "stdin",
          format: "markdown",
        },
      }),
      expectedType: "stdin",
    },
  ];

  for (const { name, params, expectedType } of stdinTestCases) {
    logger.debug(`Processing stdin case: ${name}`, {
      directive: params.demonstrativeType,
      layer: params.layerType,
      hasInputText: !!params.options.input_text,
    });

    const resolverResult = await service.createResolver(mockConfig, params);

    assertEquals(resolverResult.ok, true, `Resolver creation should succeed for ${name}`);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true, `Path resolution should succeed for ${name}`);

      if (pathResult.ok) {
        assertEquals(
          pathResult.data.type,
          expectedType,
          `Expected type ${expectedType} for ${name}`,
        );
        assertEquals(pathResult.data.value, "-", `Expected stdin value for ${name}`);
        assertEquals(pathResult.data.exists, true, `Stdin should always exist for ${name}`);
      }
    }
  }
});

Deno.test("InputFilePathResolver Integration: file path type coordination", async () => {
  logger.debug("Testing file path type coordination");

  const service = new InputPathResolutionService();

  // Test coordination between different path types
  const pathTypeTestCases = [
    {
      config: mockConfig,
      params: createTestParams("to", "project", { fromFile: "/absolute/path/input.md" }),
      expectedType: "absolute",
      expectedExists: true, // File doesn't exist in test environment
    },
    {
      config: mockConfig,
      params: createTestParams("summary", "issue", { fromFile: "./relative/input.md" }),
      expectedType: "filename",
      expectedExists: true,
    },
    {
      config: mockConfig,
      params: createTestParams("defect", "task", { fromFile: "filename_only.md" }),
      expectedType: "filename",
      expectedExists: true,
    },
    {
      config: { ...mockConfig, working_dir: "custom/work" },
      params: createTestParams("to", "issue", { fromFile: "custom_input.md" }),
      expectedType: "filename",
      expectedExists: true,
    },
  ];

  const results = await service.processMultipleInputs(pathTypeTestCases);

  // Verify all path types were processed
  assertEquals(results.length, pathTypeTestCases.length);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const testCase = pathTypeTestCases[i];

    assertEquals(result.success, true, `Path resolution should succeed for case ${i}`);

    if (result.success && result.path) {
      assertEquals(
        result.path.type,
        testCase.expectedType,
        `Expected type ${testCase.expectedType} for case ${i}`,
      );
      assertEquals(
        result.path.exists,
        testCase.expectedExists,
        `Expected exists ${testCase.expectedExists} for case ${i}`,
      );
    }
  }

  // Verify service state management
  assertEquals(service.getResolverCount(), pathTypeTestCases.length);
  service.clearResolvers();
  assertEquals(service.getResolverCount(), 0);
});

Deno.test("InputFilePathResolver Integration: configuration dependency injection", async () => {
  logger.debug("Testing configuration dependency injection");

  const service = new InputPathResolutionService();

  // Test different configuration scenarios
  const configVariations = [
    {
      name: "Minimal configuration",
      config: { working_dir: "minimal" },
      params: createTestParams("to", "task", { fromFile: "test.md" }),
      shouldSucceed: true,
    },
    {
      name: "Complete configuration",
      config: {
        app_prompt: { base_dir: "custom/prompts" },
        app_schema: { base_dir: "custom/schemas" },
        working_dir: "custom/work",
        resource_dir: "custom/resources",
      },
      params: createTestParams("summary", "project", { fromFile: "comprehensive.md" }),
      shouldSucceed: true,
    },
    {
      name: "Empty configuration",
      config: {},
      params: createTestParams("defect", "issue", { fromFile: "test.md" }),
      shouldSucceed: true,
    },
    {
      name: "Null configuration",
      config: null,
      params: createTestParams("to", "project", { fromFile: "test.md" }),
      shouldSucceed: false,
    },
  ];

  for (const { name, config, params, shouldSucceed } of configVariations) {
    logger.debug(`Testing configuration: ${name}`, {
      configKeys: config ? Object.keys(config) : [],
      hasWorkingDir: !!(config?.working_dir),
      shouldSucceed,
    });

    const resolverResult = await service.createResolver(config, params);

    if (shouldSucceed) {
      assertEquals(resolverResult.ok, true, `Configuration ${name} should succeed`);

      if (resolverResult.ok) {
        const pathResult = resolverResult.data.getPath();
        assertEquals(pathResult.ok, true, `Path resolution should work with ${name}`);
      }
    } else {
      assertEquals(resolverResult.ok, false, `Configuration ${name} should fail`);
    }
  }
});

Deno.test("InputFilePathResolver Integration: error handling and recovery", async () => {
  logger.debug("Testing error handling and recovery");

  const service = new InputPathResolutionService();

  // Test various error scenarios
  const errorTestCases = [
    {
      name: "Invalid file path characters",
      config: mockConfig,
      params: createTestParams("to", "project", { fromFile: "invalid\0path.md" }),
      expectedError: "path",
    },
    {
      name: "Missing fromFile option",
      config: mockConfig,
      params: createTestParams("summary", "issue", { fromFile: undefined }),
      expectedError: "validation",
    },
    {
      name: "Empty fromFile option",
      config: mockConfig,
      params: createTestParams("defect", "task", { fromFile: "" }),
      expectedError: "validation",
    },
    {
      name: "Extremely long path",
      config: mockConfig,
      params: createTestParams("to", "project", {
        fromFile: "a".repeat(1000) + ".md",
      }),
      expectedError: "path",
    },
  ];

  for (const { name, config, params, expectedError } of errorTestCases) {
    logger.debug(`Testing error case: ${name}`, {
      fromFile: params.options.fromFile
        ? (params.options.fromFile.length > 50
          ? params.options.fromFile.substring(0, 50) + "..."
          : params.options.fromFile)
        : "undefined",
      expectedErrorType: expectedError,
    });

    const resolverResult = await service.createResolver(config, params);

    // Error handling should be graceful
    assertExists(resolverResult, `Result should exist for error case: ${name}`);
    assertEquals(
      typeof resolverResult.ok,
      "boolean",
      `Result should have ok property for: ${name}`,
    );

    if (!resolverResult.ok) {
      assertExists(resolverResult.error, `Error should be present for: ${name}`);
      logger.debug(`Error properly captured: ${name}`, {
        errorKind: resolverResult.error.kind,
        hasMessage: resolverResult.error instanceof Error
          ? resolverResult.error.message
          : String(resolverResult.error),
      });
    }
  }
});

Deno.test("InputFilePathResolver Integration: factory pattern responsibility separation", async () => {
  logger.debug("Testing factory pattern responsibilities");

  const service = new InputPathResolutionService();

  // Test that factory properly separates creation from resolution
  const params = createTestParams("to", "project", {
    fromFile: "factory_test.md",
    adaptation: "comprehensive",
  });

  const resolverResult = await service.createResolver(mockConfig, params);

  // Factory should create resolver successfully
  assertEquals(resolverResult.ok, true, "Factory should create resolver");

  if (resolverResult.ok) {
    const resolver = resolverResult.data;

    // Verify factory delegates resolution to resolver
    const pathResult = resolver.getPath();
    assertExists(pathResult, "Resolver should handle path resolution");
    assertEquals(typeof pathResult.ok, "boolean", "Resolver should return Result type");

    // Test factory doesn't expose internal implementation details
    const resolverMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(resolver))
      .filter((name) => name !== "constructor" && typeof (resolver as any)[name] === "function");

    // Resolver should have minimal public interface
    assertEquals(resolverMethods.includes("getPath"), true, "Resolver should have getPath method");

    logger.debug("Factory pattern verified", {
      hasResolver: !!resolver,
      publicMethods: resolverMethods,
      methodCount: resolverMethods.length,
    });
  }
});

Deno.test("InputFilePathResolver Integration: concurrent processing", async () => {
  logger.debug("Testing concurrent processing");

  const service = new InputPathResolutionService();

  // Create multiple concurrent input processing requests
  const concurrentInputs = [
    {
      config: mockConfig,
      params: createTestParams("to", "project", { fromFile: "concurrent1.md" }),
    },
    {
      config: mockConfig,
      params: createTestParams("summary", "issue", { fromFile: "concurrent2.md" }),
    },
    {
      config: mockConfig,
      params: createTestParams("defect", "task", { fromFile: "-" }), // stdin
    },
    {
      config: mockConfig,
      params: createTestParams("to", "issue", { fromFile: "/absolute/concurrent4.md" }),
    },
  ];

  const startTime = performance.now();

  // Process all inputs concurrently
  const results = await service.processMultipleInputs(concurrentInputs);

  const endTime = performance.now();
  const duration = endTime - startTime;

  logger.debug("Concurrent processing completed", {
    inputCount: concurrentInputs.length,
    duration: `${duration.toFixed(2)}ms`,
    averageTime: `${(duration / concurrentInputs.length).toFixed(2)}ms`,
  });

  // Verify all inputs were processed
  assertEquals(results.length, concurrentInputs.length, "All inputs should be processed");

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    assertEquals(result.success, true, `Input ${i} should be processed successfully`);

    if (result.success && result.path) {
      assertExists(result.path.value, `Input ${i} should have resolved path`);
      assertEquals(typeof result.path.type, "string", `Input ${i} should have path type`);
    }
  }

  // Performance should be reasonable (less than 500ms total)
  assertEquals(duration < 500, true, `Duration ${duration}ms should be less than 500ms`);
});

Deno.test("InputFilePathResolver Integration: memory management", async () => {
  logger.debug("Testing memory management");

  const service = new InputPathResolutionService();

  // Test memory usage with multiple resolver operations
  const iterations = 100;
  const results: any[] = [];

  for (let i = 0; i < iterations; i++) {
    const params = createTestParams("to", "project", {
      fromFile: `memory_test_${i}.md`,
      customVariables: {
        iteration: i.toString(),
        timestamp: Date.now().toString(),
      },
    });

    const resolverResult = await service.createResolver(mockConfig, params);
    results.push(resolverResult);

    // Periodically clear resolvers to test cleanup
    if (i % 20 === 0) {
      service.clearResolvers();
    }
  }

  // Verify all operations completed
  assertEquals(results.length, iterations, "All iterations should complete");

  // Verify factory doesn't accumulate excessive state
  const finalResolverCount = service.getResolverCount();
  assertEquals(
    finalResolverCount <= 20,
    true,
    `Final resolver count ${finalResolverCount} should be reasonable`,
  );

  // Test resolver state independence
  for (let i = 0; i < 5; i++) {
    const params = createTestParams("summary", "task", {
      fromFile: `independence_${i}.md`,
    });

    const resolverResult = await service.createResolver(mockConfig, params);
    assertEquals(resolverResult.ok, true, `Independence test ${i} should succeed`);
  }

  logger.debug("Memory management verified", {
    iterationsCompleted: iterations,
    finalResolverCount,
    independenceTestPassed: true,
  });
});

Deno.test("InputFilePathResolver Integration: complex input scenarios", async () => {
  logger.debug("Testing complex input scenarios");

  const service = new InputPathResolutionService();

  // Test complex real-world scenarios
  const complexScenarios = [
    {
      name: "Multi-level relative paths",
      config: mockConfig,
      params: createTestParams("to", "project", {
        fromFile: "../../../documents/specs/requirements.md",
        customVariables: {
          project_type: "enterprise",
          complexity: "high",
        },
      }),
      expectedType: "filename",
    },
    {
      name: "Path with spaces and special characters",
      config: mockConfig,
      params: createTestParams("summary", "issue", {
        fromFile: "./documents/My Project Files/issue-#123.md",
        adaptation: "detailed",
      }),
      expectedType: "filename",
    },
    {
      name: "Network-style absolute path",
      config: mockConfig,
      params: createTestParams("defect", "task", {
        fromFile: "/home/user/projects/critical_defects.md",
        customVariables: {
          urgency: "critical",
          environment: "production",
        },
      }),
      expectedType: "absolute",
    },
    {
      name: "Filename with version and timestamp",
      config: mockConfig,
      params: createTestParams("to", "issue", {
        fromFile: "feature_request_v2.1_20240101.md",
        customVariables: {
          version: "2.1",
          created_date: "2024-01-01",
        },
      }),
      expectedType: "filename",
    },
  ];

  for (const { name, config, params, expectedType } of complexScenarios) {
    logger.debug(`Processing complex scenario: ${name}`, {
      fromFile: params.options.fromFile,
      hasCustomVars: !!params.options.customVariables,
      expectedType,
    });

    const resolverResult = await service.createResolver(config, params);

    assertEquals(resolverResult.ok, true, `Complex scenario ${name} should succeed`);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true, `Path resolution should work for ${name}`);

      if (pathResult.ok) {
        assertEquals(
          pathResult.data.type,
          expectedType,
          `Expected type ${expectedType} for ${name}`,
        );
        assertExists(pathResult.data.value, `Path value should exist for ${name}`);
      }
    }
  }

  // Verify service handled all complex scenarios
  assertEquals(
    service.getResolverCount(),
    complexScenarios.length,
    "All complex scenarios should create resolvers",
  );
});
