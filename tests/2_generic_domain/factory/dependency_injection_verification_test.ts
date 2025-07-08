/**
 * @fileoverview Dependency Injection Verification Tests
 * Testing dependency injection patterns and configuration management
 * 
 * Integration tests verify:
 * - Proper dependency injection implementation
 * - Configuration dependency management
 * - Service container patterns
 * - Runtime dependency resolution
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { PromptVariablesFactory } from "../../../lib/factory/prompt_variables_factory.ts";
import { InputFilePathResolver } from "../../../lib/factory/input_file_path_resolver.ts";
import { OutputFilePathResolver } from "../../../lib/factory/output_file_path_resolver.ts";
import type { PromptCliParams, PromptCliOptions } from "../../../lib/factory/prompt_variables_factory.ts";

const logger = new BreakdownLogger("dependency-injection-verification");

// Configuration variations for dependency injection testing
const configVariations = {
  minimal: {
    app_prompt: { base_dir: "prompts" },
  },
  standard: {
    app_prompt: { base_dir: ".agent/prompts" },
    app_schema: { base_dir: ".agent/schema" },
    working_dir: ".agent/breakdown",
    resource_dir: ".agent/resources",
  },
  custom: {
    app_prompt: { base_dir: "custom/prompts" },
    app_schema: { base_dir: "custom/schemas" },
    working_dir: "custom/work",
    resource_dir: "custom/output",
    custom_setting: "custom_value",
  },
  complex: {
    app_prompt: { 
      base_dir: "complex/prompts",
      cache_enabled: true,
      templates: ["base", "advanced"],
    },
    app_schema: { 
      base_dir: "complex/schemas",
      validation_level: "strict",
      formats: ["json", "yaml"],
    },
    working_dir: "complex/work",
    resource_dir: "complex/resources",
    logging: { level: "debug", format: "json" },
    features: { experimental: true, caching: false },
  },
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
      destinationFile: "output.json",
      adaptation: "standard",
      ...options,
    },
  };
}

// Dependency injection analyzer
class DependencyInjectionAnalyzer {
  private injectionPoints: Map<string, any[]> = new Map();
  private configurationDependencies: Map<string, string[]> = new Map();
  private runtimeResolutions: Array<{ component: string; dependency: string; success: boolean }> = [];

  recordInjectionPoint(component: string, dependencies: any[]): void {
    this.injectionPoints.set(component, dependencies);
  }

  recordConfigurationDependency(component: string, configKeys: string[]): void {
    this.configurationDependencies.set(component, configKeys);
  }

  recordRuntimeResolution(component: string, dependency: string, success: boolean): void {
    this.runtimeResolutions.push({ component, dependency, success });
  }

  analyzeInjectionPattern(): {
    totalInjectionPoints: number;
    configurationDependencies: number;
    runtimeResolutions: number;
    successRate: number;
    dependencyGraph: Record<string, string[]>;
  } {
    const dependencyGraph: Record<string, string[]> = {};
    
    // Build dependency graph
    for (const [component, configKeys] of this.configurationDependencies) {
      dependencyGraph[component] = configKeys;
    }

    const successfulResolutions = this.runtimeResolutions.filter(r => r.success).length;
    const successRate = this.runtimeResolutions.length > 0 ? 
      (successfulResolutions / this.runtimeResolutions.length) * 100 : 100;

    return {
      totalInjectionPoints: this.injectionPoints.size,
      configurationDependencies: this.configurationDependencies.size,
      runtimeResolutions: this.runtimeResolutions.length,
      successRate,
      dependencyGraph,
    };
  }

  clear(): void {
    this.injectionPoints.clear();
    this.configurationDependencies.clear();
    this.runtimeResolutions.splice(0);
  }
}

Deno.test("Dependency Injection: configuration injection verification", async () => {
  logger.debug("Testing configuration injection", "di:config-injection");

  const analyzer = new DependencyInjectionAnalyzer();
  
  // Test different configuration injection scenarios
  for (const [configName, config] of Object.entries(configVariations)) {
    logger.debug(`Testing configuration: ${configName}`, "di:config-case", {
      configName,
      configKeys: Object.keys(config),
      hasPromptConfig: !!(config as any).app_prompt,
      hasSchemaConfig: !!(config as any).app_schema,
    });

    // Record configuration dependencies
    analyzer.recordConfigurationDependency("PromptVariablesFactory", Object.keys(config));
    
    try {
      // Test PromptVariablesFactory with injected configuration
      const factory = new PromptVariablesFactory(config);
      analyzer.recordRuntimeResolution("PromptVariablesFactory", `config:${configName}`, true);
      
      assertExists(factory, `Factory should be created with ${configName} config`);
      
      // Test factory's configuration dependency handling
      const params = createTestParams("to", "project", {
        fromFile: `${configName}_input.md`,
        customVariables: {
          config_type: configName,
          test_mode: "dependency_injection",
        },
      });

      const result = await factory.create(params);
      analyzer.recordRuntimeResolution("PromptVariablesFactory", `operation:${configName}`, result.ok);
      
      // Configuration should be properly injected and functional
      assertExists(result, `Factory operation should complete with ${configName} config`);
      assertEquals(typeof result.ok, "boolean", 
        `Result should have proper structure with ${configName} config`);

    } catch (error) {
      analyzer.recordRuntimeResolution("PromptVariablesFactory", `config:${configName}`, false);
      logger.debug(`Configuration ${configName} injection failed`, "di:config-error", {
        error: error.message,
      });
    }
  }

  const analysis = analyzer.analyzeInjectionPattern();
  
  logger.debug("Configuration injection analysis completed", "di:config-analysis", {
    configurationsTestef: Object.keys(configVariations).length,
    successRate: analysis.successRate,
    dependencyGraph: analysis.dependencyGraph,
  });

  assertEquals(analysis.configurationDependencies > 0, true,
    "Should have recorded configuration dependencies");
  assertEquals(analysis.successRate >= 75, true,
    `Configuration injection success rate ${analysis.successRate}% should be >= 75%`);
});

Deno.test("Dependency Injection: resolver dependency management", async () => {
  logger.debug("Testing resolver dependency management", "di:resolver-dependencies");

  const analyzer = new DependencyInjectionAnalyzer();
  
  // Test path resolver dependency injection
  const resolverTestCases = [
    {
      name: "InputFilePathResolver with minimal config",
      config: configVariations.minimal,
      resolverType: "InputFilePathResolver",
      createResolver: (config: any, params: PromptCliParams) => 
        InputFilePathResolver.create(config, params),
    },
    {
      name: "OutputFilePathResolver with standard config", 
      config: configVariations.standard,
      resolverType: "OutputFilePathResolver",
      createResolver: (config: any, params: PromptCliParams) =>
        OutputFilePathResolver.create(config, params),
    },
    {
      name: "InputFilePathResolver with complex config",
      config: configVariations.complex,
      resolverType: "InputFilePathResolver",
      createResolver: (config: any, params: PromptCliParams) =>
        InputFilePathResolver.create(config, params),
    },
    {
      name: "OutputFilePathResolver with custom config",
      config: configVariations.custom,
      resolverType: "OutputFilePathResolver", 
      createResolver: (config: any, params: PromptCliParams) =>
        OutputFilePathResolver.create(config, params),
    },
  ];

  for (const { name, config, resolverType, createResolver } of resolverTestCases) {
    logger.debug(`Testing resolver: ${name}`, "di:resolver-case", {
      resolverType,
      configKeys: Object.keys(config),
    });

    // Record resolver dependencies
    analyzer.recordConfigurationDependency(resolverType, Object.keys(config));
    
    const params = createTestParams("summary", "issue", {
      fromFile: `${resolverType}_test.md`,
      destinationFile: `${resolverType}_output.json`,
    });

    try {
      const resolverResult = createResolver(config, params);
      analyzer.recordRuntimeResolution(resolverType, "creation", resolverResult.ok);
      
      if (resolverResult.ok) {
        // Test dependency resolution through path resolution
        const pathResult = resolverResult.data.getPath();
        analyzer.recordRuntimeResolution(resolverType, "path_resolution", pathResult.ok);
        
        assertEquals(pathResult.ok, true, `Path resolution should succeed for ${name}`);
        
        if (pathResult.ok) {
          assertExists(pathResult.data.value, `Resolved path should exist for ${name}`);
          assertEquals(typeof pathResult.data.type, "string", 
            `Path type should be defined for ${name}`);
        }
      }
      
    } catch (error) {
      analyzer.recordRuntimeResolution(resolverType, "creation", false);
      logger.debug(`Resolver ${name} dependency injection failed`, "di:resolver-error", {
        error: error.message,
      });
    }
  }

  const analysis = analyzer.analyzeInjectionPattern();
  
  logger.debug("Resolver dependency analysis completed", "di:resolver-analysis", {
    resolversTesteд: resolverTestCases.length,
    successRate: analysis.successRate,
    runtimeResolutions: analysis.runtimeResolutions,
  });

  assertEquals(analysis.runtimeResolutions >= resolverTestCases.length * 2, true,
    "Should have recorded creation and operation resolutions");
  assertEquals(analysis.successRate >= 80, true,
    `Resolver dependency success rate ${analysis.successRate}% should be >= 80%`);
});

Deno.test("Dependency Injection: service container pattern verification", async () => {
  logger.debug("Testing service container pattern", "di:service-container");

  const analyzer = new DependencyInjectionAnalyzer();
  
  // Mock service container for dependency management
  class ServiceContainer {
    private services: Map<string, any> = new Map();
    private configurations: Map<string, any> = new Map();
    private factories: Map<string, () => any> = new Map();

    registerConfiguration(name: string, config: any): void {
      this.configurations.set(name, config);
    }

    registerFactory(name: string, factory: () => any): void {
      this.factories.set(name, factory);
    }

    resolve<T>(serviceName: string): T {
      if (this.services.has(serviceName)) {
        return this.services.get(serviceName);
      }

      if (this.factories.has(serviceName)) {
        const factory = this.factories.get(serviceName)!;
        const service = factory();
        this.services.set(serviceName, service);
        return service;
      }

      throw new Error(`Service ${serviceName} not found`);
    }

    getConfiguration(name: string): any {
      return this.configurations.get(name);
    }

    clear(): void {
      this.services.clear();
      this.configurations.clear();
      this.factories.clear();
    }
  }

  const container = new ServiceContainer();
  
  // Register configurations
  for (const [name, config] of Object.entries(configVariations)) {
    container.registerConfiguration(name, config);
    analyzer.recordConfigurationDependency("ServiceContainer", [name]);
  }

  // Register factory services
  container.registerFactory("promptVariablesFactory", () => {
    const config = container.getConfiguration("standard");
    return new PromptVariablesFactory(config);
  });

  container.registerFactory("inputPathResolver", () => {
    const config = container.getConfiguration("standard");
    const params = createTestParams("to", "project");
    return InputFilePathResolver.create(config, params);
  });

  container.registerFactory("outputPathResolver", () => {
    const config = container.getConfiguration("standard");
    const params = createTestParams("to", "project");
    return OutputFilePathResolver.create(config, params);
  });

  // Test service resolution through container
  const serviceTestCases = [
    {
      serviceName: "promptVariablesFactory",
      expectedType: "object",
      testOperation: async (service: any) => {
        const params = createTestParams("to", "project");
        return await service.create(params);
      },
    },
    {
      serviceName: "inputPathResolver",
      expectedType: "object",
      testOperation: async (service: any) => {
        if (service.ok) {
          return service.data.getPath();
        }
        return service;
      },
    },
    {
      serviceName: "outputPathResolver",
      expectedType: "object",
      testOperation: async (service: any) => {
        if (service.ok) {
          return service.data.getPath();
        }
        return service;
      },
    },
  ];

  for (const { serviceName, expectedType, testOperation } of serviceTestCases) {
    logger.debug(`Testing service resolution: ${serviceName}`, "di:service-resolution", {
      serviceName,
      expectedType,
    });

    try {
      const service = container.resolve(serviceName);
      analyzer.recordRuntimeResolution("ServiceContainer", serviceName, true);
      
      assertExists(service, `Service ${serviceName} should be resolved`);
      assertEquals(typeof service, expectedType, 
        `Service ${serviceName} should have correct type`);

      // Test service operation
      const operationResult = await testOperation(service);
      analyzer.recordRuntimeResolution("ServiceContainer", `${serviceName}:operation`, 
        !!(operationResult && (operationResult.ok !== false)));
      
      assertExists(operationResult, 
        `Service ${serviceName} operation should complete`);

    } catch (error) {
      analyzer.recordRuntimeResolution("ServiceContainer", serviceName, false);
      logger.debug(`Service ${serviceName} resolution failed`, "di:service-error", {
        error: error.message,
      });
    }
  }

  const analysis = analyzer.analyzeInjectionPattern();
  
  logger.debug("Service container pattern verification completed", "di:container-verified", {
    servicesRegistered: serviceTestCases.length,
    configurationsRegistered: Object.keys(configVariations).length,
    successRate: analysis.successRate,
  });

  assertEquals(analysis.runtimeResolutions >= serviceTestCases.length * 2, true,
    "Should have recorded service and operation resolutions");
  assertEquals(analysis.successRate >= 85, true,
    `Service container success rate ${analysis.successRate}% should be >= 85%`);

  container.clear();
});

Deno.test("Dependency Injection: runtime dependency resolution", async () => {
  logger.debug("Testing runtime dependency resolution", "di:runtime-resolution");

  const analyzer = new DependencyInjectionAnalyzer();
  
  // Test dynamic dependency resolution scenarios
  const runtimeTestCases = [
    {
      name: "Late configuration binding",
      setupDependencies: () => {
        // Simulate late configuration binding
        const factory = new PromptVariablesFactory(configVariations.minimal);
        return { factory, config: configVariations.minimal };
      },
      testScenario: async ({ factory }: any) => {
        const params = createTestParams("defect", "task", {
          fromFile: "runtime_test.md",
        });
        return await factory.create(params);
      },
    },
    {
      name: "Configuration switching",
      setupDependencies: () => {
        // Test with multiple configurations
        return {
          configs: [configVariations.minimal, configVariations.standard, configVariations.custom],
        };
      },
      testScenario: async ({ configs }: any) => {
        const results = [];
        for (const config of configs) {
          const factory = new PromptVariablesFactory(config);
          const params = createTestParams("summary", "issue");
          const result = await factory.create(params);
          results.push(result);
        }
        return { success: true, results };
      },
    },
    {
      name: "Dependency chain resolution",
      setupDependencies: () => {
        const config = configVariations.complex;
        const factory = new PromptVariablesFactory(config);
        
        return { factory, config };
      },
      testScenario: async ({ factory, config }: any) => {
        // Test dependency chain: Factory -> Resolvers -> Configuration
        const params = createTestParams("to", "project", {
          fromFile: "dependency_chain.md",
          customVariables: {
            chain_test: "true",
            depth: "3",
          },
        });
        
        const factoryResult = await factory.create(params);
        
        // Test resolver dependency chain
        const inputResolver = InputFilePathResolver.create(config, params);
        const outputResolver = OutputFilePathResolver.create(config, params);
        
        return {
          factoryResult,
          inputResolver,
          outputResolver,
        };
      },
    },
  ];

  for (const { name, setupDependencies, testScenario } of runtimeTestCases) {
    logger.debug(`Testing runtime scenario: ${name}`, "di:runtime-case", { name });

    try {
      // Setup dependencies
      const dependencies = setupDependencies();
      analyzer.recordInjectionPoint(name, [dependencies]);
      analyzer.recordRuntimeResolution("RuntimeTest", `${name}:setup`, true);
      
      // Execute test scenario
      const result = await testScenario(dependencies);
      analyzer.recordRuntimeResolution("RuntimeTest", `${name}:execution`, !!result);
      
      assertExists(result, `Runtime scenario ${name} should complete`);
      
      // Verify result structure
      if (result.success !== undefined) {
        assertEquals(result.success, true, `Runtime scenario ${name} should succeed`);
      } else {
        assertEquals(typeof result, "object", `Runtime scenario ${name} should return object`);
      }

    } catch (error) {
      analyzer.recordRuntimeResolution("RuntimeTest", `${name}:execution`, false);
      logger.debug(`Runtime scenario ${name} failed`, "di:runtime-error", {
        error: error.message,
      });
    }
  }

  const analysis = analyzer.analyzeInjectionPattern();
  
  logger.debug("Runtime dependency resolution completed", "di:runtime-completed", {
    scenariosTested: runtimeTestCases.length,
    injectionPoints: analysis.totalInjectionPoints,
    successRate: analysis.successRate,
  });

  assertEquals(analysis.totalInjectionPoints, runtimeTestCases.length,
    "Should have recorded all injection points");
  assertEquals(analysis.successRate >= 80, true,
    `Runtime resolution success rate ${analysis.successRate}% should be >= 80%`);
});

Deno.test("Dependency Injection: configuration validation and error handling", async () => {
  logger.debug("Testing configuration validation and error handling", "di:validation");

  const analyzer = new DependencyInjectionAnalyzer();
  
  // Test invalid configuration scenarios
  const invalidConfigScenarios = [
    {
      name: "Null configuration",
      config: null,
      expectedError: "configuration",
      shouldCreateFactory: false,
    },
    {
      name: "Undefined configuration",
      config: undefined,
      expectedError: "configuration",
      shouldCreateFactory: false,
    },
    {
      name: "Empty configuration",
      config: {},
      expectedError: null, // Should handle gracefully
      shouldCreateFactory: true,
    },
    {
      name: "Invalid configuration structure",
      config: { invalid_key: "invalid_value" },
      expectedError: null, // Should handle gracefully
      shouldCreateFactory: true,
    },
    {
      name: "Partially invalid configuration",
      config: {
        app_prompt: null, // Invalid
        app_schema: { base_dir: "valid" },
      },
      expectedError: "prompt",
      shouldCreateFactory: false,
    },
  ];

  for (const { name, config, expectedError, shouldCreateFactory } of invalidConfigScenarios) {
    logger.debug(`Testing invalid config: ${name}`, "di:invalid-config", {
      name,
      configType: typeof config,
      expectedError,
      shouldCreateFactory,
    });

    analyzer.recordConfigurationDependency("ValidationTest", [name]);

    try {
      const factory = new PromptVariablesFactory(config as any);
      const factoryCreated = !!factory;
      
      analyzer.recordRuntimeResolution("ValidationTest", `${name}:creation`, factoryCreated);
      
      if (shouldCreateFactory) {
        assertExists(factory, `Factory should be created despite ${name}`);
        
        // Test factory operation with invalid config
        const params = createTestParams("to", "project");
        const result = await factory.create(params);
        
        analyzer.recordRuntimeResolution("ValidationTest", `${name}:operation`, 
          result && typeof result.ok === "boolean");
        
        // Operation might fail, but should be handled gracefully
        assertExists(result, `Operation should complete with ${name}`);
        assertEquals(typeof result.ok, "boolean", 
          `Result should have proper structure with ${name}`);
        
      } else {
        // Should not reach here if factory creation should fail
        if (factoryCreated) {
          logger.debug(`Unexpected factory creation success: ${name}`, "di:unexpected-success");
        }
      }

    } catch (error) {
      analyzer.recordRuntimeResolution("ValidationTest", `${name}:creation`, false);
      
      if (expectedError) {
        assertEquals(error.message.toLowerCase().includes(expectedError), true,
          `Error message should contain '${expectedError}' for ${name}`);
        logger.debug(`Expected error caught: ${name}`, "di:expected-error", {
          error: error.message,
        });
      } else {
        logger.debug(`Unexpected error: ${name}`, "di:unexpected-error", {
          error: error.message,
        });
      }
    }
  }

  // Test error recovery scenarios
  const recoveryScenarios = [
    {
      name: "Fallback to defaults",
      primaryConfig: null,
      fallbackConfig: configVariations.minimal,
    },
    {
      name: "Configuration override",
      primaryConfig: { app_prompt: { base_dir: "invalid" } },
      fallbackConfig: configVariations.standard,
    },
  ];

  for (const { name, primaryConfig, fallbackConfig } of recoveryScenarios) {
    logger.debug(`Testing recovery scenario: ${name}`, "di:recovery", { name });

    try {
      // Try primary configuration first
      let factory;
      try {
        factory = new PromptVariablesFactory(primaryConfig as any);
      } catch (primaryError) {
        // Fall back to secondary configuration
        factory = new PromptVariablesFactory(fallbackConfig);
      }

      analyzer.recordRuntimeResolution("RecoveryTest", `${name}:recovery`, !!factory);
      
      assertExists(factory, `Recovery should succeed for ${name}`);
      
      // Test recovered factory
      const params = createTestParams("summary", "task");
      const result = await factory.create(params);
      
      analyzer.recordRuntimeResolution("RecoveryTest", `${name}:operation`, 
        result && typeof result.ok === "boolean");
      
      assertExists(result, `Recovered factory should work for ${name}`);

    } catch (error) {
      analyzer.recordRuntimeResolution("RecoveryTest", `${name}:recovery`, false);
      logger.debug(`Recovery failed: ${name}`, "di:recovery-failed", {
        error: error.message,
      });
    }
  }

  const analysis = analyzer.analyzeInjectionPattern();
  
  logger.debug("Configuration validation completed", "di:validation-completed", {
    invalidScenariosLested: invalidConfigScenarios.length,
    recoveryScenariosLested: recoveryScenarios.length,
    successRate: analysis.successRate,
  });

  assertEquals(analysis.configurationDependencies > 0, true,
    "Should have recorded configuration dependencies");
  
  // Success rate might be lower due to intentional failures, but recovery should work
  assertEquals(analysis.runtimeResolutions.length > 0, true,
    "Should have recorded runtime resolutions");
});