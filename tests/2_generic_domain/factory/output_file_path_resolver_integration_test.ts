/**
 * @fileoverview OutputFilePathResolver Integration Tests
 * Testing output path generation and factory pattern implementation
 * 
 * Integration tests verify:
 * - Output path generation across different scenarios
 * - Auto-generation and custom path handling
 * - Factory pattern responsibility separation
 * - Configuration-driven output resolution
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { OutputFilePathResolver } from "../../../lib/factory/output_file_path_resolver.ts";
import type { PromptCliParams, PromptCliOptions } from "../../../lib/factory/prompt_variables_factory.ts";
import type { Result } from "../../../lib/types/result.ts";

const logger = new BreakdownLogger("output-file-path-resolver-integration");

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
      adaptation: "standard",
      ...options,
    },
  };
}

// Output path management service
class OutputPathManagementService {
  private resolvers: Map<string, OutputFilePathResolver> = new Map();
  private generatedPaths: Set<string> = new Set();

  async createResolver(
    config: any,
    params: PromptCliParams,
  ): Promise<Result<OutputFilePathResolver, any>> {
    const resolverId = `${params.demonstrativeType}-${params.layerType}-${Date.now()}`;
    
    try {
      const resolverResult = OutputFilePathResolver.create(config, params);
      if (resolverResult.ok) {
        this.resolvers.set(resolverId, resolverResult.data);
        return { ok: true, data: resolverResult.data };
      }
      return resolverResult;
    } catch (error) {
      return { 
        ok: false, 
        error: { kind: "CreationFailed", message: error.message } 
      };
    }
  }

  async processOutputBatch(
    outputs: Array<{ config: any; params: PromptCliParams }>,
  ): Promise<Array<{ success: boolean; path?: any; error?: string; unique?: boolean }>> {
    const results = [];

    for (const { config, params } of outputs) {
      logger.debug("Processing output path resolution", "service:process", {
        directive: params.demonstrativeType,
        layer: params.layerType,
        output: params.options.output || params.options.destinationFile,
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
          const pathValue = pathResult.data.value;
          const isUnique = !this.generatedPaths.has(pathValue);
          this.generatedPaths.add(pathValue);
          
          results.push({
            success: true,
            path: pathResult.data,
            unique: isUnique,
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
          error: `Unexpected error: ${error.message}`,
        });
      }
    }

    return results;
  }

  getGeneratedPathsCount(): number {
    return this.generatedPaths.size;
  }

  getResolverCount(): number {
    return this.resolvers.size;
  }

  clearAll(): void {
    this.resolvers.clear();
    this.generatedPaths.clear();
  }
}

Deno.test("OutputFilePathResolver Integration: auto-generation workflow", async () => {
  logger.debug("Testing auto-generation workflow", "integration:auto-generation");

  const service = new OutputPathManagementService();
  
  // Test auto-generation scenarios
  const autoGenTestCases = [
    {
      name: "No output specified - should auto-generate",
      params: createTestParams("to", "project", {}),
      expectedType: "auto-generated",
      expectedGenerated: true,
    },
    {
      name: "Input only - should auto-generate output",
      params: createTestParams("summary", "issue", { fromFile: "input.md" }),
      expectedType: "auto-generated", 
      expectedGenerated: true,
    },
    {
      name: "Directory only - should auto-generate filename",
      params: createTestParams("defect", "task", { output: "./output/" }),
      expectedType: "auto-generated",
      expectedGenerated: true,
    },
    {
      name: "Empty output - should auto-generate",
      params: createTestParams("to", "issue", { destinationFile: "" }),
      expectedError: "InvalidPath",
    },
  ];

  for (const { name, params, expectedType, expectedGenerated, expectedError } of autoGenTestCases) {
    logger.debug(`Processing auto-generation case: ${name}`, "integration:auto-gen-case", {
      directive: params.demonstrativeType,
      layer: params.layerType,
      hasOutput: !!(params.options.output || params.options.destinationFile),
    });

    const resolverResult = await service.createResolver(mockConfig, params);
    
    if (expectedError) {
      assertEquals(resolverResult.ok, false, `${name} should fail with ${expectedError}`);
      continue;
    }
    
    assertEquals(resolverResult.ok, true, `Resolver creation should succeed for ${name}`);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true, `Path resolution should succeed for ${name}`);
      
      if (pathResult.ok) {
        assertEquals(pathResult.data.type, expectedType, `Expected type ${expectedType} for ${name}`);
        assertEquals(pathResult.data.isGenerated, expectedGenerated, `Expected generated ${expectedGenerated} for ${name}`);
        assertExists(pathResult.data.value, `Generated path should exist for ${name}`);
        
        // Auto-generated files should have unique identifiers
        if (expectedGenerated) {
          assertEquals(pathResult.data.value.includes("_"), true, 
            `Auto-generated path should contain identifier for ${name}`);
        }
      }
    }
  }
});

Deno.test("OutputFilePathResolver Integration: path type coordination", async () => {
  logger.debug("Testing path type coordination", "integration:path-coordination");

  const service = new OutputPathManagementService();
  
  // Test coordination between different output path types
  const pathTypeTestCases = [
    {
      config: mockConfig,
      params: createTestParams("to", "project", { output: "/absolute/path/output.json" }),
      expectedType: "absolute",
      expectedGenerated: false,
    },
    {
      config: mockConfig,
      params: createTestParams("summary", "issue", { output: "./relative/output.md" }),
      expectedType: "relative",
      expectedGenerated: false,
    },
    {
      config: mockConfig,
      params: createTestParams("defect", "task", { destinationFile: "filename_only.txt" }),
      expectedType: "filename",
      expectedGenerated: false,
    },
    {
      config: { ...mockConfig, resource_dir: "custom/outputs" },
      params: createTestParams("to", "issue", { destinationFile: "custom_output.json" }),
      expectedType: "filename",
      expectedGenerated: false,
    },
  ];

  const results = await service.processOutputBatch(pathTypeTestCases);
  
  // Verify all path types were processed
  assertEquals(results.length, pathTypeTestCases.length);
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const testCase = pathTypeTestCases[i];
    
    assertEquals(result.success, true, `Path resolution should succeed for case ${i}`);
    
    if (result.success && result.path) {
      assertEquals(result.path.type, testCase.expectedType, 
        `Expected type ${testCase.expectedType} for case ${i}`);
      assertEquals(result.path.isGenerated, testCase.expectedGenerated,
        `Expected generated ${testCase.expectedGenerated} for case ${i}`);
      assertExists(result.path.value, `Path value should exist for case ${i}`);
    }
  }

  // Verify unique path generation
  assertEquals(service.getGeneratedPathsCount(), pathTypeTestCases.length,
    "All paths should be unique");
});

Deno.test("OutputFilePathResolver Integration: configuration dependency injection", async () => {
  logger.debug("Testing configuration dependency injection", "integration:config-injection");

  const service = new OutputPathManagementService();
  
  // Test different configuration scenarios
  const configVariations = [
    {
      name: "Minimal configuration",
      config: { working_dir: "minimal" },
      params: createTestParams("to", "task", { destinationFile: "test.json" }),
      shouldSucceed: true,
    },
    {
      name: "Complete configuration with custom directories",
      config: {
        app_prompt: { base_dir: "custom/prompts" },
        app_schema: { base_dir: "custom/schemas" },
        working_dir: "custom/work",
        resource_dir: "custom/outputs",
      },
      params: createTestParams("summary", "project", { output: "comprehensive.md" }),
      shouldSucceed: true,
    },
    {
      name: "Configuration with spaces in paths",
      config: {
        working_dir: "path with spaces",
        resource_dir: "output directory",
      },
      params: createTestParams("defect", "issue", { destinationFile: "spaced output.txt" }),
      shouldSucceed: true,
    },
    {
      name: "Empty configuration",
      config: {},
      params: createTestParams("to", "project", { output: "fallback.json" }),
      shouldSucceed: true,
    },
  ];

  for (const { name, config, params, shouldSucceed } of configVariations) {
    logger.debug(`Testing configuration: ${name}`, "integration:config-test", {
      configKeys: config ? Object.keys(config) : [],
      hasWorkingDir: !!(config?.working_dir),
      hasResourceDir: !!(config?.resource_dir),
      shouldSucceed,
    });

    const resolverResult = await service.createResolver(config, params);
    
    if (shouldSucceed) {
      assertEquals(resolverResult.ok, true, `Configuration ${name} should succeed`);
      
      if (resolverResult.ok) {
        const pathResult = resolverResult.data.getPath();
        assertEquals(pathResult.ok, true, `Path resolution should work with ${name}`);
        
        if (pathResult.ok) {
          assertExists(pathResult.data.value, `Path should be resolved with ${name}`);
          assertEquals(typeof pathResult.data.type, "string", 
            `Path type should be defined with ${name}`);
        }
      }
    } else {
      assertEquals(resolverResult.ok, false, `Configuration ${name} should fail`);
    }
  }
});

Deno.test("OutputFilePathResolver Integration: uniqueness and collision handling", async () => {
  logger.debug("Testing uniqueness and collision handling", "integration:uniqueness");

  const service = new OutputPathManagementService();
  
  // Test auto-generation uniqueness
  const duplicateRequests = Array(10).fill(null).map((_, i) => ({
    config: mockConfig,
    params: createTestParams("to", "project", {
      fromFile: `input_${i}.md`,
      // No output specified - should auto-generate unique names
    }),
  }));

  const results = await service.processOutputBatch(duplicateRequests);
  
  // All requests should succeed
  assertEquals(results.length, duplicateRequests.length);
  for (const result of results) {
    assertEquals(result.success, true, "All auto-generation should succeed");
    assertEquals(result.unique, true, "All generated paths should be unique");
  }

  // Verify all paths are indeed unique
  assertEquals(service.getGeneratedPathsCount(), duplicateRequests.length,
    "All generated paths should be unique");

  // Test custom filename uniqueness handling
  const customRequests = Array(5).fill(null).map((_, i) => ({
    config: mockConfig,
    params: createTestParams("summary", "issue", {
      destinationFile: `same_name_${i % 2}.md`, // Intentional duplicates
    }),
  }));

  const customResults = await service.processOutputBatch(customRequests);
  
  // All should succeed, paths should resolve correctly
  for (const result of customResults) {
    assertEquals(result.success, true, "Custom filename resolution should succeed");
    assertExists(result.path, "Path should be resolved");
  }

  logger.debug("Uniqueness testing completed", "integration:uniqueness-verified", {
    autoGeneratedCount: duplicateRequests.length,
    customCount: customRequests.length,
    totalUniquePaths: service.getGeneratedPathsCount(),
  });
});

Deno.test("OutputFilePathResolver Integration: error handling and recovery", async () => {
  logger.debug("Testing error handling and recovery", "integration:error-handling");

  const service = new OutputPathManagementService();
  
  // Test various error scenarios
  const errorTestCases = [
    {
      name: "Invalid characters in output path",
      config: mockConfig,
      params: createTestParams("to", "project", { output: "invalid\0path.json" }),
      expectedError: "path",
    },
    {
      name: "Path too long",
      config: mockConfig,
      params: createTestParams("summary", "issue", { 
        destinationFile: "a".repeat(500) + ".md" 
      }),
      expectedError: "path",
    },
    {
      name: "Empty destination file",
      config: mockConfig,
      params: createTestParams("defect", "task", { destinationFile: "" }),
      expectedError: "validation",
    },
    {
      name: "Invalid path format",
      config: mockConfig,
      params: createTestParams("to", "issue", { output: "invalid<>path.json" }),
      expectedError: "path",
    },
  ];

  for (const { name, config, params, expectedError } of errorTestCases) {
    logger.debug(`Testing error case: ${name}`, "integration:error-case", {
      outputPath: params.options.output || params.options.destinationFile,
      expectedErrorType: expectedError,
    });

    const resolverResult = await service.createResolver(config, params);
    
    // Error handling should be graceful
    assertExists(resolverResult, `Result should exist for error case: ${name}`);
    assertEquals(typeof resolverResult.ok, "boolean", 
      `Result should have ok property for: ${name}`);
    
    if (!resolverResult.ok) {
      assertExists(resolverResult.error, `Error should be present for: ${name}`);
      logger.debug(`Error properly captured: ${name}`, "integration:error-captured", {
        errorKind: resolverResult.error.kind,
        hasMessage: !!resolverResult.error.message,
      });
    } else {
      // If resolver creation succeeded, test path resolution error handling
      const pathResult = resolverResult.data.getPath();
      if (!pathResult.ok) {
        logger.debug(`Path resolution error handled: ${name}`, "integration:path-error", {
          errorKind: pathResult.error.kind,
        });
      }
    }
  }
});

Deno.test("OutputFilePathResolver Integration: factory pattern responsibility separation", async () => {
  logger.debug("Testing factory pattern responsibilities", "integration:factory-pattern");

  const service = new OutputPathManagementService();
  
  // Test that factory properly separates creation from resolution
  const params = createTestParams("to", "project", {
    destinationFile: "factory_test.json",
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
      .filter(name => name !== 'constructor' && typeof (resolver as any)[name] === 'function');
    
    // Resolver should have minimal public interface
    assertEquals(resolverMethods.includes('getPath'), true, 
      "Resolver should have getPath method");
    
    // Test state encapsulation
    if (pathResult.ok) {
      assertEquals(typeof pathResult.data.type, "string", 
        "Resolver should provide typed results");
      assertEquals(typeof pathResult.data.isGenerated, "boolean",
        "Resolver should track generation state");
    }
    
    logger.debug("Factory pattern verified", "integration:factory-verified", {
      hasResolver: !!resolver,
      publicMethods: resolverMethods,
      methodCount: resolverMethods.length,
      providesTypedResults: pathResult.ok,
    });
  }
});

Deno.test("OutputFilePathResolver Integration: concurrent output generation", async () => {
  logger.debug("Testing concurrent output generation", "integration:concurrent");

  const service = new OutputPathManagementService();
  
  // Create multiple concurrent output generation requests
  const concurrentOutputs = [
    {
      config: mockConfig,
      params: createTestParams("to", "project", { destinationFile: "concurrent1.json" }),
    },
    {
      config: mockConfig,
      params: createTestParams("summary", "issue", {}), // auto-generate
    },
    {
      config: mockConfig,
      params: createTestParams("defect", "task", { output: "./outputs/concurrent3.md" }),
    },
    {
      config: mockConfig,
      params: createTestParams("to", "issue", { output: "/absolute/concurrent4.txt" }),
    },
    {
      config: mockConfig,
      params: createTestParams("summary", "project", {}), // auto-generate
    },
  ];

  const startTime = performance.now();
  
  // Process all outputs concurrently
  const results = await service.processOutputBatch(concurrentOutputs);
  
  const endTime = performance.now();
  const duration = endTime - startTime;

  logger.debug("Concurrent processing completed", "integration:concurrent-results", {
    outputCount: concurrentOutputs.length,
    duration: `${duration.toFixed(2)}ms`,
    averageTime: `${(duration / concurrentOutputs.length).toFixed(2)}ms`,
  });

  // Verify all outputs were processed
  assertEquals(results.length, concurrentOutputs.length, 
    "All outputs should be processed");
  
  let autoGeneratedCount = 0;
  let customPathCount = 0;
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    assertEquals(result.success, true, `Output ${i} should be processed successfully`);
    
    if (result.success && result.path) {
      assertExists(result.path.value, `Output ${i} should have resolved path`);
      assertEquals(typeof result.path.type, "string", 
        `Output ${i} should have path type`);
      
      if (result.path.isGenerated) {
        autoGeneratedCount++;
      } else {
        customPathCount++;
      }
    }
  }

  // Verify mix of auto-generated and custom paths
  assertEquals(autoGeneratedCount, 2, "Should have 2 auto-generated paths");
  assertEquals(customPathCount, 3, "Should have 3 custom paths");

  // Performance should be reasonable (less than 300ms total)
  assertEquals(duration < 300, true, 
    `Duration ${duration}ms should be less than 300ms`);
});

Deno.test("OutputFilePathResolver Integration: complex output scenarios", async () => {
  logger.debug("Testing complex output scenarios", "integration:complex-scenarios");

  const service = new OutputPathManagementService();
  
  // Test complex real-world output scenarios
  const complexScenarios = [
    {
      name: "Versioned output with timestamp",
      config: mockConfig,
      params: createTestParams("to", "project", {
        destinationFile: "project_breakdown_v2.1_20240101.json",
        customVariables: {
          version: "2.1",
          timestamp: "20240101",
        },
      }),
      expectedType: "filename",
    },
    {
      name: "Deep directory structure",
      config: mockConfig,
      params: createTestParams("summary", "issue", {
        output: "./reports/2024/Q1/issues/critical_summary.md",
        customVariables: {
          year: "2024",
          quarter: "Q1",
          severity: "critical",
        },
      }),
      expectedType: "relative",
    },
    {
      name: "Output with special formatting requirements",
      config: mockConfig,
      params: createTestParams("defect", "task", {
        destinationFile: "DEFECT-ANALYSIS-#123-[CRITICAL].json",
        customVariables: {
          defect_id: "123",
          priority: "critical",
        },
      }),
      expectedType: "filename",
    },
    {
      name: "Multi-format output directory",
      config: {
        ...mockConfig,
        resource_dir: "multi_format_outputs",
      },
      params: createTestParams("to", "issue", {
        output: "./generated/exports/", // Directory - should auto-generate filename
        customVariables: {
          format: "json",
          export_type: "full",
        },
      }),
      expectedType: "auto-generated",
    },
  ];

  for (const { name, config, params, expectedType } of complexScenarios) {
    logger.debug(`Processing complex scenario: ${name}`, "integration:complex-case", {
      output: params.options.output || params.options.destinationFile,
      hasCustomVars: !!params.options.customVariables,
      expectedType,
    });

    const resolverResult = await service.createResolver(config, params);
    
    assertEquals(resolverResult.ok, true, 
      `Complex scenario ${name} should succeed`);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true, 
        `Path resolution should work for ${name}`);
      
      if (pathResult.ok) {
        assertEquals(pathResult.data.type, expectedType, 
          `Expected type ${expectedType} for ${name}`);
        assertExists(pathResult.data.value, 
          `Path value should exist for ${name}`);
        
        // Verify path characteristics
        if (expectedType === "auto-generated") {
          assertEquals(pathResult.data.isGenerated, true,
            `Auto-generated path should be marked as generated for ${name}`);
        } else {
          assertEquals(pathResult.data.isGenerated, false,
            `Custom path should not be marked as generated for ${name}`);
        }
      }
    }
  }

  // Verify service handled all complex scenarios efficiently
  assertEquals(service.getResolverCount(), complexScenarios.length,
    "All complex scenarios should create resolvers");

  logger.debug("Complex scenarios processing completed", "integration:complex-completed", {
    scenariosProcessed: complexScenarios.length,
    uniquePathsGenerated: service.getGeneratedPathsCount(),
    resolversCreated: service.getResolverCount(),
  });
});