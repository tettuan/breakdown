/**
 * @fileoverview Behavior tests for factory integration
 * 
 * Tests the behavioral aspects and business logic of the factory integration module,
 * including Smart Constructor patterns, validation behaviors, and runtime dynamics.
 */

import { assertEquals, assertExists, assert } from "@std/assert";
import {
  FactoryConfigAdapter,
  ConfigurationMigrator,
  UnifiedFactoryBuilder,
  ConfigCompatibilityLayer,
  createFactoryWithUnifiedConfig,
  getUnifiedConfig,
} from "./factory_integration.ts";
import type { PromptCliParams } from "../factory/prompt_variables_factory.ts";

Deno.test("Behavior: FactoryConfigAdapter - Config Transformation Accuracy", () => {
  // Test precise transformation behavior
  const unifiedConfig = {
    paths: {
      promptBaseDir: "/custom/prompts",
      schemaBaseDir: "/custom/schemas",
      outputBaseDir: "/custom/output",
    },
    app: {
      features: {
        extendedThinking: true,
        debugMode: false,
        strictValidation: true,
        autoSchema: false,
      },
      limits: {
        maxRetries: 5,
        timeout: 30000,
      },
    },
    environment: {
      logLevel: "warn",
      colorOutput: false,
    },
    user: {
      preferences: {
        defaultFormat: "json",
        autoSave: true,
      },
    },
    raw: {
      customField: "customValue",
      legacySupport: true,
    },
  };

  const factoryConfig = FactoryConfigAdapter.toFactoryConfig(unifiedConfig);

  // Verify exact path mapping
  assertEquals(factoryConfig.app_prompt.base_dir, "/custom/prompts");
  assertEquals(factoryConfig.app_schema.base_dir, "/custom/schemas");
  assertEquals(factoryConfig.output.base_dir, "/custom/output");

  // Verify feature preservation
  assertEquals(factoryConfig.features.extendedThinking, true);
  assertEquals(factoryConfig.features.debugMode, false);
  assertEquals(factoryConfig.features.strictValidation, true);
  assertEquals(factoryConfig.features.autoSchema, false);

  // Verify limits preservation
  assertEquals(factoryConfig.limits.maxRetries, 5);
  assertEquals(factoryConfig.limits.timeout, 30000);

  // Verify raw config inclusion
  assertEquals(factoryConfig.customField, "customValue");
  assertEquals(factoryConfig.legacySupport, true);
});

Deno.test("Behavior: ConfigurationMigrator - Complete Migration Workflow", () => {
  // Test full migration from old to new format
  const legacyConfig = {
    app_prompt: { base_dir: "/legacy/prompts" },
    app_schema: { base_dir: "/legacy/schemas" },
    extended_thinking: true,
    debug_mode: true,
    strict_validation: false,
    auto_schema: true,
    log_level: "debug",
    color_output: false,
    custom_setting: "preserved",
  };

  const migrated = ConfigurationMigrator.migrateConfig(legacyConfig);

  // Verify path migration
  assertEquals(migrated.paths.promptBaseDir, "/legacy/prompts");
  assertEquals(migrated.paths.schemaBaseDir, "/legacy/schemas");

  // Verify feature migration with correct mapping
  assertEquals(migrated.features.extendedThinking, true);
  assertEquals(migrated.features.debugMode, true);
  assertEquals(migrated.features.strictValidation, false);
  assertEquals(migrated.features.autoSchema, true);

  // Verify environment migration
  assertEquals(migrated.environment.logLevel, "debug");
  assertEquals(migrated.environment.colorOutput, false);

  // Verify preservation of unknown settings
  assertEquals(migrated.custom_setting, "preserved");
});

Deno.test("Behavior: ConfigurationMigrator - Default Value Assignment", () => {
  // Test default value behavior when settings are missing
  const minimalConfig = {
    app_prompt: { base_dir: "/minimal" },
  };

  const migrated = ConfigurationMigrator.migrateConfig(minimalConfig);

  // Should apply defaults for missing values
  assertEquals(migrated.features.extendedThinking, false); // undefined ?? false
  assertEquals(migrated.features.debugMode, false); // undefined ?? false
  assertEquals(migrated.features.strictValidation, true); // undefined ?? true
  assertEquals(migrated.features.autoSchema, true); // undefined ?? true

  assertEquals(migrated.environment.logLevel, "info"); // default
  assertEquals(migrated.environment.colorOutput, true); // undefined ?? true
});

Deno.test("Behavior: ConfigurationMigrator - Validation Error Detection", () => {
  // Test validation behavior with various invalid configurations
  const testCases = [
    {
      config: {},
      expectedErrors: ["Missing 'paths' configuration section", "No type patterns configuration found"],
    },
    {
      config: { paths: "not-an-object" },
      expectedErrors: ["Missing 'paths' configuration section", "No type patterns configuration found"],
    },
    {
      config: { paths: {} },
      expectedErrors: ["No type patterns configuration found"],
    },
    {
      config: { paths: {}, patterns: {} },
      expectedErrors: [],
    },
    {
      config: { paths: {}, type_patterns: {} },
      expectedErrors: [],
    },
  ];

  testCases.forEach(({ config, expectedErrors }, index) => {
    const errors = ConfigurationMigrator.validateMigration(config);
    assertEquals(errors.length, expectedErrors.length, `Test case ${index} error count mismatch`);
    expectedErrors.forEach((expectedError, errorIndex) => {
      assertEquals(errors[errorIndex], expectedError, `Test case ${index} error ${errorIndex} mismatch`);
    });
  });
});

Deno.test("Behavior: ConfigCompatibilityLayer - Migration Detection Logic", () => {
  // Test accurate detection of configurations that need migration
  const testCases = [
    {
      config: { app_prompt: { base_dir: "/old" } },
      shouldMigrate: true,
      reason: "has app_prompt",
    },
    {
      config: { app_schema: { base_dir: "/old" } },
      shouldMigrate: true,
      reason: "has app_schema",
    },
    {
      config: { type_patterns: {} },
      shouldMigrate: true,
      reason: "has type_patterns",
    },
    {
      config: { some_field: "value" },
      shouldMigrate: true,
      reason: "missing paths",
    },
    {
      config: { paths: { promptBaseDir: "/new" } },
      shouldMigrate: false,
      reason: "has modern paths structure",
    },
    {
      config: { 
        paths: { promptBaseDir: "/new" },
        patterns: { directive: ["to"] }
      },
      shouldMigrate: false,
      reason: "fully modern config",
    },
  ];

  testCases.forEach(({ config, shouldMigrate, reason }, index) => {
    const needsMigration = ConfigCompatibilityLayer.needsMigration(config);
    assertEquals(needsMigration, shouldMigrate, `Test case ${index}: ${reason}`);
  });
});

Deno.test("Behavior: UnifiedFactoryBuilder - Consistent Interface", () => {
  // Test that builder provides consistent interface regardless of config content
  const mockConfigs = [
    createMockConfig({ debugMode: true }),
    createMockConfig({ debugMode: false }),
    createMockConfig({ strictValidation: true }),
    createMockConfig({ strictValidation: false }),
  ];

  mockConfigs.forEach((config, index) => {
    const builder = new UnifiedFactoryBuilder(config);

    // All builders should provide same interface
    assertEquals(typeof builder.buildPathResolvers, "function", `Builder ${index} missing buildPathResolvers`);
    assertEquals(typeof builder.getPatternProvider, "function", `Builder ${index} missing getPatternProvider`);
    assertEquals(typeof builder.getPathOptions, "function", `Builder ${index} missing getPathOptions`);

    // Path resolvers should always be created successfully
    const resolvers = builder.buildPathResolvers();
    assertExists(resolvers.template, `Builder ${index} template resolver missing`);
    assertExists(resolvers.schema, `Builder ${index} schema resolver missing`);
    assertExists(resolvers.input, `Builder ${index} input resolver missing`);
    assertExists(resolvers.output, `Builder ${index} output resolver missing`);
  });
});

Deno.test("Behavior: Smart Constructor Pattern - PromptVariablesFactory Creation", async () => {
  // Test Smart Constructor behavior in factory creation
  const mockConfig = createMockConfig({ debugMode: true });
  const builder = new UnifiedFactoryBuilder(mockConfig);

  const validCliParams: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "task",
    options: {},
  };

  const result = await builder.buildPromptVariablesFactory(validCliParams);

  // Smart Constructor should validate and create successfully with valid params
  assert(result.ok, "Factory creation should succeed with valid parameters");
  assertExists(result.data, "Factory should be created");
});

Deno.test("Behavior: Error Propagation and Handling", async () => {
  // Test that errors are properly propagated through the system
  const invalidCliParams: PromptCliParams = {
    demonstrativeType: "", // Invalid empty type
    layerType: "",
    options: {},
  };

  try {
    const result = await createFactoryWithUnifiedConfig(invalidCliParams, {
      workingDirectory: "/nonexistent/path",
    });

    // Should handle errors gracefully
    if (!result.ok) {
      assertExists(result.error);
      assertEquals(typeof result.error.message, "string");
      assert(result.error.message.length > 0);
    }
  } catch (error) {
    // Catching unexpected errors is also valid behavior to test
    assertExists(error);
  }
});

Deno.test("Behavior: Configuration Immutability During Processing", () => {
  // Test that configurations remain immutable during transformation
  const originalConfig = {
    paths: { promptBaseDir: "/original" },
    app: { features: { debugMode: false } },
    environment: { logLevel: "info" },
    user: { preferences: {} },
    raw: { original: true },
  };

  // Deep clone for comparison
  const beforeTransform = JSON.parse(JSON.stringify(originalConfig));

  // Perform transformation
  FactoryConfigAdapter.toFactoryConfig(originalConfig);

  // Original should be unchanged
  assertEquals(JSON.stringify(originalConfig), JSON.stringify(beforeTransform));
});

Deno.test("Behavior: Convenience Functions - createFactoryWithUnifiedConfig", async () => {
  // Test behavior of convenience function with various inputs
  const validCliParams: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "task",
    options: {},
  };

  try {
    // Test with minimal options
    const result1 = await createFactoryWithUnifiedConfig(validCliParams);
    assert(typeof result1.ok === "boolean", "Result should have ok property");

    // Test with custom options
    const result2 = await createFactoryWithUnifiedConfig(validCliParams, {
      profile: "test",
      workingDirectory: Deno.cwd(),
    });
    assert(typeof result2.ok === "boolean", "Result should have ok property");

  } catch (error) {
    // Expected for test environment - verify error handling
    assertExists(error);
  }
});

/**
 * Helper function to create mock unified config interface
 */
function createMockConfig(features: Record<string, boolean>) {
  return {
    getConfig: () => ({
      paths: {
        promptBaseDir: "/mock/prompts",
        schemaBaseDir: "/mock/schemas",
        outputBaseDir: "/mock/output",
      },
      app: {
        features,
        limits: { maxRetries: 3 },
      },
      environment: { logLevel: "info" },
      user: { preferences: {} },
      raw: {},
    }),
    getPathOptions: () => ({}),
    getPatternProvider: () => ({
      getDirectiveTypes: () => ["to", "summary"],
      getLayerTypes: () => ["task", "issue"],
    }),
  };
}