/**
 * @fileoverview Structure tests for TotalityFactoryHelper
 *
 * Tests class structure, responsibility separation, and design pattern
 * implementation for the TotalityFactoryHelper. Verifies single responsibility
 * principle compliance and proper abstraction levels.
 *
 * @module helpers/1_structure_totality_factory_helper_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  createTotalityFactory,
  createTotalityPromptFactory,
  createValidatedCliParams,
  validateConfigurationPatterns,
} from "./totality_factory_helper.ts";
import type { TotalityFactoryBundle, TotalityFactoryOptions } from "./totality_factory_helper.ts";

Deno.test("TotalityFactoryHelper - Structure: Single Responsibility Principle", async () => {
  // Module should only be responsible for factory creation and configuration
  // It should not handle file I/O, CLI parsing, or other unrelated concerns

  // Core responsibility: Factory creation
  assertEquals(typeof createTotalityFactory, "function", "Must handle factory creation");
  assertEquals(
    typeof createTotalityPromptFactory,
    "function",
    "Must handle prompt factory creation",
  );

  // Helper responsibility: Parameter validation
  assertEquals(typeof createValidatedCliParams, "function", "Must handle parameter validation");
  assertEquals(
    typeof validateConfigurationPatterns,
    "function",
    "Must handle configuration validation",
  );

  // Should NOT have functions that violate SRP
  // (Module does not expose functions for unrelated concerns)
});

Deno.test("TotalityFactoryHelper - Structure: Responsibility separation by function purpose", async () => {
  // Factory creation functions (grouped responsibility)
  const factoryFunctions = [
    createTotalityFactory,
    createTotalityPromptFactory,
  ];

  for (const func of factoryFunctions) {
    assertEquals(typeof func, "function", "Factory function must exist");
    assertEquals(func.constructor.name, "AsyncFunction", "Factory function must be async");
  }

  // Async validation functions (requiring I/O operations)
  const asyncValidationFunctions = [
    validateConfigurationPatterns,
  ];

  for (const func of asyncValidationFunctions) {
    assertEquals(typeof func, "function", "Async validation function must exist");
    assertEquals(func.constructor.name, "AsyncFunction", "I/O validation function must be async");
  }

  // Synchronous validation functions (pure validation logic)
  const syncValidationFunctions = [
    createValidatedCliParams,
  ];

  for (const func of syncValidationFunctions) {
    assertEquals(typeof func, "function", "Sync validation function must exist");
    assertEquals(
      func.constructor.name,
      "Function",
      "Pure validation function should be synchronous",
    );
  }
});

Deno.test("TotalityFactoryHelper - Structure: Configuration abstraction levels", async () => {
  // High-level abstraction: Complete factory creation
  const highLevelResult = await createTotalityFactory();

  if (highLevelResult.ok) {
    const bundle = highLevelResult.data;

    // Should provide abstracted configuration interface
    assertEquals(typeof bundle.config, "object", "Should provide config object");
    assertEquals(typeof bundle.patternProvider, "object", "Should provide pattern provider");
    assertEquals(typeof bundle.typeFactory, "object", "Should provide type factory");

    // Should not expose configuration file details
    assertEquals(
      bundle.hasOwnProperty("configFilePath"),
      false,
      "Should not expose config file paths",
    );
    assertEquals(
      bundle.hasOwnProperty("rawConfigData"),
      false,
      "Should not expose raw config data",
    );
  }
});

Deno.test("TotalityFactoryHelper - Structure: Error handling abstraction", async () => {
  // Different functions should handle errors at appropriate abstraction levels

  // Low-level validation error
  const validationResult = await validateConfigurationPatterns("nonexistent");
  assertEquals(
    typeof validationResult.valid,
    "boolean",
    "Should provide boolean validation result",
  );
  assertEquals(
    Array.isArray(validationResult.details),
    true,
    "Should provide detailed error array",
  );

  // Mid-level factory creation error
  const factoryResult = await createTotalityFactory({
    configSetName: "nonexistent",
    workspacePath: "/invalid",
  });

  if (!factoryResult.ok) {
    assertEquals(typeof factoryResult.error, "string", "Should provide string error message");
    // Details are optional for this level
  }

  // High-level prompt factory error
  const promptResult = await createTotalityPromptFactory(
    "invalid_directive",
    "invalid_layer",
    {},
    { configSetName: "nonexistent" },
  );

  if (!promptResult.ok) {
    assertEquals(typeof promptResult.error, "string", "Should provide high-level error message");
  }
});

Deno.test("TotalityFactoryHelper - Structure: Factory bundle composition", async () => {
  const result = await createTotalityFactory();

  if (result.ok) {
    const bundle = result.data as TotalityFactoryBundle;

    // Bundle should compose related components without tight coupling
    const typeFactory = bundle.typeFactory;
    const patternProvider = bundle.patternProvider;
    const config = bundle.config;
    const createPromptFactory = bundle.createPromptFactory;

    // Components should be independently usable
    assertEquals(
      typeof typeFactory.createBothTypes,
      "function",
      "TypeFactory should be independently usable",
    );
    assertEquals(
      typeof patternProvider.hasValidPatterns,
      "function",
      "PatternProvider should be independently usable",
    );
    assertEquals(typeof config.getConfig, "function", "Config should be independently usable");
    assertEquals(typeof createPromptFactory, "function", "createPromptFactory should be callable");

    // Components should not know about each other's internal structure
    assertEquals(
      typeFactory.hasOwnProperty("patternProvider"),
      false,
      "TypeFactory should not expose patternProvider",
    );
    assertEquals(
      patternProvider.hasOwnProperty("config"),
      false,
      "PatternProvider should not expose config",
    );
  }
});

Deno.test("TotalityFactoryHelper - Structure: Options parameter design", async () => {
  // Options should follow optional parameter pattern

  // No options - should use defaults
  const defaultResult = await createTotalityFactory();
  assertExists(defaultResult, "Should accept no options");

  // Empty options - should use defaults
  const emptyResult = await createTotalityFactory({});
  assertExists(emptyResult, "Should accept empty options");

  // Partial options - should merge with defaults
  const partialResult = await createTotalityFactory({
    configSetName: "test",
  });
  assertExists(partialResult, "Should accept partial options");

  // Full options - should use all provided values
  const fullResult = await createTotalityFactory({
    configSetName: "test",
    workspacePath: "/test",
  });
  assertExists(fullResult, "Should accept full options");
});

Deno.test("TotalityFactoryHelper - Structure: Function composition design", async () => {
  // Functions should be designed for composition

  // Step 1: Create factory bundle
  const bundleResult = await createTotalityFactory();

  if (bundleResult.ok) {
    const bundle = bundleResult.data;

    // Step 2: Use bundle in parameter validation
    const paramsResult = await createValidatedCliParams(
      "test_directive",
      "test_layer",
      {},
      bundle,
    );

    // Should compose without coupling
    assertExists(paramsResult, "Should compose with other functions");

    if (paramsResult.ok) {
      // Step 3: Use parameters in prompt factory creation
      const promptFactory = await bundle.createPromptFactory(paramsResult.data);
      assertExists(promptFactory, "Should continue composition chain");
    }
  }
});

Deno.test("TotalityFactoryHelper - Structure: Abstraction layer separation", async () => {
  // Different abstraction levels should be clearly separated

  // Configuration level abstraction
  const configValidation = await validateConfigurationPatterns();
  assertEquals(typeof configValidation.valid, "boolean", "Config level returns boolean validation");

  // Factory level abstraction
  const factoryResult = await createTotalityFactory();
  if (factoryResult.ok) {
    assertEquals(
      typeof factoryResult.data.typeFactory,
      "object",
      "Factory level returns factory objects",
    );
  }

  // Application level abstraction
  const appResult = await createTotalityPromptFactory("test", "test", {}, {});
  if (appResult.ok) {
    assertEquals(typeof appResult.data, "object", "App level returns application objects");
  }

  // Each level should handle appropriate concerns
  assertEquals(
    configValidation.hasOwnProperty("typeFactory"),
    false,
    "Config level should not expose factories",
  );
  if (factoryResult.ok) {
    assertEquals(
      factoryResult.data.hasOwnProperty("promptFilePath"),
      false,
      "Factory level should not expose file paths",
    );
  }
});

Deno.test("TotalityFactoryHelper - Structure: Validation responsibility distribution", async () => {
  // Validation responsibilities should be distributed appropriately

  // Configuration pattern validation
  const patternValidation = await validateConfigurationPatterns();
  assertEquals(
    Array.isArray(patternValidation.details),
    true,
    "Should validate configuration patterns",
  );

  // CLI parameter validation
  const factoryResult = await createTotalityFactory();
  if (factoryResult.ok) {
    const paramsResult = await createValidatedCliParams(
      "invalid_directive_xyz123",
      "invalid_layer_xyz123",
      {},
      factoryResult.data,
    );

    // Should validate CLI parameters
    if (!paramsResult.ok) {
      assertEquals(
        typeof paramsResult.error,
        "object",
        "Should provide structured parameter errors",
      );
    }
  }

  // Integrated validation in one-step factory
  const integratedResult = await createTotalityPromptFactory(
    "invalid_directive_xyz123",
    "invalid_layer_xyz123",
    {},
    {},
  );

  if (!integratedResult.ok) {
    assertEquals(
      typeof integratedResult.error,
      "string",
      "Should provide integrated validation errors",
    );
  }
});

Deno.test("TotalityFactoryHelper - Structure: Dependency injection design", async () => {
  // Should support dependency injection for testability

  const result = await createTotalityFactory();
  if (result.ok) {
    const bundle = result.data;

    // Bundle components should be injectable
    assertEquals(typeof bundle.config, "object", "Config should be injectable");
    assertEquals(typeof bundle.patternProvider, "object", "PatternProvider should be injectable");
    assertEquals(typeof bundle.typeFactory, "object", "TypeFactory should be injectable");

    // Pre-loaded config should be supported
    const configResult = await createTotalityFactory({
      config: bundle.config,
    });
    assertExists(configResult, "Should accept pre-loaded config");
  }
});

Deno.test("TotalityFactoryHelper - Structure: Helper function granularity", async () => {
  // Helper functions should have appropriate granularity

  // Atomic operations
  assertEquals(
    typeof validateConfigurationPatterns,
    "function",
    "Should provide atomic config validation",
  );
  assertEquals(
    typeof createValidatedCliParams,
    "function",
    "Should provide atomic parameter validation",
  );

  // Composed operations
  assertEquals(
    typeof createTotalityFactory,
    "function",
    "Should provide composed factory creation",
  );
  assertEquals(
    typeof createTotalityPromptFactory,
    "function",
    "Should provide composed application creation",
  );

  // Functions should not be too granular (no excessive decomposition)
  // Functions should not be too coarse (each has clear single purpose)
});
