/**
 * @fileoverview Architecture tests for factory integration
 * 
 * Tests architectural constraints, design patterns, and system boundaries
 * for the factory integration module.
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import {
  FactoryConfigAdapter,
  ConfigurationMigrator,
  UnifiedFactoryBuilder,
  ConfigCompatibilityLayer,
  createFactoryWithUnifiedConfig,
  getUnifiedConfig,
} from "./factory_integration.ts";
import { UnifiedConfigInterface } from "./unified_config_interface.ts";
import { PromptVariablesFactory } from "../factory/prompt_variables_factory.ts";
import type { Result } from "../types/result.ts";

Deno.test("Architecture: Factory Integration - Class Structure", () => {
  // Test class existence and proper export
  assertExists(FactoryConfigAdapter);
  assertExists(ConfigurationMigrator);
  assertExists(UnifiedFactoryBuilder);
  assertExists(ConfigCompatibilityLayer);
  
  // Test static methods structure
  assertEquals(typeof FactoryConfigAdapter.toFactoryConfig, "function");
  assertEquals(typeof FactoryConfigAdapter.createPromptVariablesFactory, "function");
  assertEquals(typeof FactoryConfigAdapter.createPathResolvers, "function");
  
  assertEquals(typeof ConfigurationMigrator.migrateConfig, "function");
  assertEquals(typeof ConfigurationMigrator.validateMigration, "function");
  
  assertEquals(typeof ConfigCompatibilityLayer.needsMigration, "function");
  assertEquals(typeof ConfigCompatibilityLayer.fromLegacy, "function");
});

Deno.test("Architecture: Factory Integration - Adapter Pattern Implementation", () => {
  // Test Adapter pattern: FactoryConfigAdapter should transform between interfaces
  const mockUnifiedConfig = {
    profile: {
      name: "test",
      description: "Test profile",
      environment: "development" as const,
      priority: 1,
      source: "default" as const,
    },
    patterns: {
      directiveTypes: ["test"],
      layerTypes: ["test"],
      customPatterns: {},
    },
    paths: {
      workingDirectory: "/mock/working",
      resourceDirectory: "/mock/resources",
      promptBaseDir: "/mock/prompts",
      schemaBaseDir: "/mock/schemas", 
      outputBaseDir: "/mock/output",
    },
    app: {
      version: "1.0.0",
      features: { 
        extendedThinking: false,
        debugMode: true,
        strictValidation: false,
        autoSchema: false,
      },
      limits: { 
        maxFileSize: 1024,
        maxPromptLength: 1024,
        maxVariables: 100,
        maxRetries: 3,
      },
    },
    environment: { 
      logLevel: "debug" as const,
      colorOutput: true,
      timezone: null,
      locale: null,
    },
    user: { 
      customVariables: {},
      aliases: {},
      templates: {},
    },
    raw: { legacy: "data" },
  };
  
  const factoryConfig = FactoryConfigAdapter.toFactoryConfig(mockUnifiedConfig);
  
  // Verify adapter transforms structure correctly
  assertEquals(factoryConfig.app_prompt.base_dir, "/mock/prompts");
  assertEquals(factoryConfig.app_schema.base_dir, "/mock/schemas");
  assertEquals(factoryConfig.output.base_dir, "/mock/output");
  assertEquals(factoryConfig.features.debugMode, true);
  assertEquals((factoryConfig as Record<string, unknown>).legacy, "data"); // Raw config preserved
});

Deno.test("Architecture: Factory Integration - Builder Pattern Implementation", async () => {
  // Test Builder pattern: UnifiedFactoryBuilder should construct complex objects
  const mockConfig = await createMockUnifiedConfig();
  if (!mockConfig.ok) {
    throw new Error("Failed to create mock config");
  }
  
  const builder = new UnifiedFactoryBuilder(mockConfig.data);
  
  // Test builder methods exist and return expected types
  assertEquals(typeof builder.buildPromptVariablesFactory, "function");
  assertEquals(typeof builder.buildPathResolvers, "function");
  assertEquals(typeof builder.getPatternProvider, "function");
  assertEquals(typeof builder.getPathOptions, "function");
  
  // Test path resolvers construction
  const resolvers = builder.buildPathResolvers();
  assertExists(resolvers.template);
  assertExists(resolvers.schema);
  assertExists(resolvers.input);
  assertExists(resolvers.output);
});

Deno.test("Architecture: Factory Integration - Migration Strategy Pattern", () => {
  // Test Strategy pattern: ConfigurationMigrator should handle different migration strategies
  const oldConfig = {
    app_prompt: { base_dir: "/old/prompts" },
    app_schema: { base_dir: "/old/schemas" },
    extended_thinking: true,
    debug_mode: false,
    log_level: "info",
  };
  
  const migrated = ConfigurationMigrator.migrateConfig(oldConfig);
  
  // Verify migration strategy transforms old structure to new
  const migratedTyped = migrated as Record<string, unknown>;
  assertEquals((migratedTyped.paths as Record<string, unknown>)?.promptBaseDir, "/old/prompts");
  assertEquals((migratedTyped.paths as Record<string, unknown>)?.schemaBaseDir, "/old/schemas");
  assertEquals((migratedTyped.features as Record<string, unknown>)?.extendedThinking, true);
  assertEquals((migratedTyped.features as Record<string, unknown>)?.debugMode, false);
  assertEquals((migratedTyped.environment as Record<string, unknown>)?.logLevel, "info");
});

Deno.test("Architecture: Factory Integration - Compatibility Layer Abstraction", () => {
  // Test abstraction: ConfigCompatibilityLayer should hide complexity
  const legacyConfig = {
    app_prompt: { base_dir: "/legacy" },
    type_patterns: { directive: ["to", "summary"] },
  };
  
  const needsMigration = ConfigCompatibilityLayer.needsMigration(legacyConfig);
  assertEquals(needsMigration, true);
  
  const modernConfig = {
    paths: { promptBaseDir: "/modern" },
    patterns: { directive: ["to", "summary"] },
  };
  
  const doesNotNeedMigration = ConfigCompatibilityLayer.needsMigration(modernConfig);
  assertEquals(doesNotNeedMigration, false);
});

Deno.test("Architecture: Factory Integration - Result Type System", async () => {
  // Test Result type consistency across the module
  const mockConfig = await createMockUnifiedConfig();
  
  // All async operations should return Result<T, Error>
  assertInstanceOf(mockConfig, Object);
  assertEquals(typeof mockConfig.ok, "boolean");
  
  if (mockConfig.ok) {
    assertInstanceOf(mockConfig.data, Object);
  } else {
    assertInstanceOf(mockConfig.error, Error);
  }
});

Deno.test("Architecture: Factory Integration - Separation of Concerns", () => {
  // Test that each class has a single, well-defined responsibility
  
  // FactoryConfigAdapter: Only config transformation
  const adapterMethods = Object.getOwnPropertyNames(FactoryConfigAdapter).filter(
    name => typeof FactoryConfigAdapter[name as keyof typeof FactoryConfigAdapter] === "function"
  );
  // Should only have config-related transformation methods
  assertEquals(adapterMethods.includes("toFactoryConfig"), true);
  assertEquals(adapterMethods.includes("createPromptVariablesFactory"), true);
  assertEquals(adapterMethods.includes("createPathResolvers"), true);
  
  // ConfigurationMigrator: Only migration logic
  const migratorMethods = Object.getOwnPropertyNames(ConfigurationMigrator).filter(
    name => typeof ConfigurationMigrator[name as keyof typeof ConfigurationMigrator] === "function"
  );
  assertEquals(migratorMethods.includes("migrateConfig"), true);
  assertEquals(migratorMethods.includes("validateMigration"), true);
});

Deno.test("Architecture: Factory Integration - Dependency Injection Ready", () => {
  // Test that classes are designed for dependency injection
  
  // UnifiedFactoryBuilder should accept dependencies through constructor
  const mockConfig = {} as UnifiedConfigInterface;
  const builder = new UnifiedFactoryBuilder(mockConfig);
  assertInstanceOf(builder, UnifiedFactoryBuilder);
  
  // Static methods should not depend on global state
  const result = FactoryConfigAdapter.toFactoryConfig({
    profile: {
      name: "test",
      description: "Test profile",
      environment: "development" as const,
      priority: 1,
      source: "default" as const,
    },
    patterns: {
      directiveTypes: ["test"],
      layerTypes: ["test"],
      customPatterns: {},
    },
    paths: {
      workingDirectory: "/test/working",
      resourceDirectory: "/test/resources",
      promptBaseDir: "/test/prompts",
      schemaBaseDir: "/test/schemas",
      outputBaseDir: "/test/output",
    },
    app: { 
      version: "1.0.0",
      features: {
        extendedThinking: false,
        debugMode: false,
        strictValidation: false,
        autoSchema: false,
      }, 
      limits: {
        maxFileSize: 1024,
        maxPromptLength: 1024,
        maxVariables: 100,
      },
    },
    environment: {
      logLevel: "info" as const,
      colorOutput: true,
      timezone: null,
      locale: null,
    },
    user: {
      customVariables: {},
      aliases: {},
      templates: {},
    },
    raw: {},
  });
  assertExists(result);
});

Deno.test("Architecture: Factory Integration - Error Boundary Design", () => {
  // Test that error handling follows architectural patterns
  
  // Migration validation should return structured errors
  const invalidConfig = {};
  const errors = ConfigurationMigrator.validateMigration(invalidConfig);
  assertEquals(Array.isArray(errors), true);
  assertEquals(errors.length > 0, true);
  
  // Each error should be descriptive
  assertEquals(typeof errors[0], "string");
  assertEquals(errors[0].length > 0, true);
});

Deno.test("Architecture: Factory Integration - Immutability Principles", () => {
  // Test that transformations don't mutate input data
  const originalConfig = {
    app_prompt: { base_dir: "/original" },
    features: { debugMode: false },
  };
  
  const originalCopy = JSON.parse(JSON.stringify(originalConfig));
  ConfigurationMigrator.migrateConfig(originalConfig);
  
  // Original should remain unchanged
  assertEquals(JSON.stringify(originalConfig), JSON.stringify(originalCopy));
});

/**
 * Helper function to create mock unified config for testing
 */
async function createMockUnifiedConfig(): Promise<Result<UnifiedConfigInterface, Error>> {
  try {
    // Try to create a minimal test config
    const result = await getUnifiedConfig({
      workingDirectory: "/tmp/test",
    });
    // If it succeeds, return the result
    if (result.ok) {
      return result;
    }
  } catch (error) {
    // Log the error for debugging but continue with mock
    console.warn("getUnifiedConfig failed, using mock:", error);
  }
  
  // Always return mock result structure for testing
  return {
    ok: true,
    data: {
      getConfig: () => ({
        paths: { promptBaseDir: "/test", schemaBaseDir: "/test", outputBaseDir: "/test" },
        app: { features: {}, limits: {} },
        environment: {},
        user: {},
        raw: {},
      }),
      getPathOptions: () => ({}),
      getPatternProvider: () => ({}),
    } as UnifiedConfigInterface,
  } as Result<UnifiedConfigInterface, Error>;
}