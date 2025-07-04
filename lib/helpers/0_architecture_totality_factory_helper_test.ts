/**
 * @fileoverview Architecture tests for TotalityFactoryHelper
 *
 * Tests architectural constraints and dependency relationships for the
 * TotalityFactoryHelper module. Verifies proper layering, interface
 * consistency, and dependency direction compliance.
 *
 * @module helpers/0_architecture_totality_factory_helper_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  createTotalityFactory,
  createTotalityPromptFactory,
  createValidatedCliParams,
  validateConfigurationPatterns,
} from "./totality_factory_helper.ts";
import type {
  FactoryCreation_Result,
  TotalityFactoryBundle,
  TotalityFactoryOptions,
} from "./totality_factory_helper.ts";

Deno.test("TotalityFactoryHelper - Architecture: Module exports structure", async () => {
  // Primary factory creation function must exist
  assertEquals(typeof createTotalityFactory, "function", "createTotalityFactory must be exported");

  // Helper functions must exist
  assertEquals(
    typeof createValidatedCliParams,
    "function",
    "createValidatedCliParams must be exported",
  );
  assertEquals(
    typeof createTotalityPromptFactory,
    "function",
    "createTotalityPromptFactory must be exported",
  );
  assertEquals(
    typeof validateConfigurationPatterns,
    "function",
    "validateConfigurationPatterns must be exported",
  );
});

Deno.test("TotalityFactoryHelper - Architecture: Dependency direction", async () => {
  // Helper should depend on core modules, not vice versa
  // This is verified by successful import without circular references

  // Should successfully import without errors (implies proper dependency direction)
  assertExists(createTotalityFactory, "Core factory function must be available");

  // Should not expose internal implementation details
  // (Private implementation details are not accessible from outside)
});

Deno.test("TotalityFactoryHelper - Architecture: Type interface consistency", async () => {
  // TotalityFactoryOptions interface should have expected structure
  const mockOptions: TotalityFactoryOptions = {
    configSetName: "test",
    workspacePath: "/test/path",
  };

  // Should accept well-formed options without type errors
  assertExists(mockOptions.configSetName, "configSetName should be accessible");
  assertExists(mockOptions.workspacePath, "workspacePath should be accessible");

  // Optional fields should be allowed
  const minimalOptions: TotalityFactoryOptions = {};
  assertEquals(typeof minimalOptions, "object", "Should accept empty options object");
});

Deno.test("TotalityFactoryHelper - Architecture: Result monad pattern", async () => {
  // All async functions should return FactoryCreationResult pattern
  const result = await createTotalityFactory();

  // Must implement Result monad pattern
  assertExists(result.ok, "Result must have 'ok' property");

  if (result.ok) {
    assertExists(result.data, "Success result must have 'data' property");
    assertEquals(typeof result.data, "object", "Success data must be object");
  } else {
    assertExists(result.error, "Error result must have 'error' property");
    assertEquals(typeof result.error, "string", "Error must be string");
  }
});

Deno.test("TotalityFactoryHelper - Architecture: TotalityFactoryBundle interface", async () => {
  const result = await createTotalityFactory();

  if (result.ok) {
    const bundle = result.data as TotalityFactoryBundle;

    // Must have all required components
    assertExists(bundle.typeFactory, "Bundle must include typeFactory");
    assertExists(bundle.patternProvider, "Bundle must include patternProvider");
    assertExists(bundle.config, "Bundle must include config");
    assertExists(bundle.createPromptFactory, "Bundle must include createPromptFactory");

    // createPromptFactory must be function
    assertEquals(
      typeof bundle.createPromptFactory,
      "function",
      "createPromptFactory must be function",
    );
  }
});

Deno.test("TotalityFactoryHelper - Architecture: Error hierarchy consistency", async () => {
  // Test with invalid configuration to trigger error path
  const result = await createTotalityFactory({
    configSetName: "nonexistent_config_set_name_12345",
    workspacePath: "/nonexistent/path/12345",
  });

  // Should handle errors gracefully with consistent structure
  if (!result.ok) {
    assertEquals(typeof result.error, "string", "Error must be string");
    // Optional details field
    if (result.details) {
      assertEquals(typeof result.details, "string", "Details must be string");
    }
  }

  // Should not throw exceptions
  assertEquals(typeof result, "object", "Should return result object, not throw");
});

Deno.test("TotalityFactoryHelper - Architecture: Async function signatures", async () => {
  // Factory creation functions requiring I/O should be async
  assertEquals(
    createTotalityFactory.constructor.name,
    "AsyncFunction",
    "createTotalityFactory must be async",
  );
  assertEquals(
    createTotalityPromptFactory.constructor.name,
    "AsyncFunction",
    "createTotalityPromptFactory must be async",
  );
  assertEquals(
    validateConfigurationPatterns.constructor.name,
    "AsyncFunction",
    "validateConfigurationPatterns must be async",
  );

  // Pure validation functions can be synchronous
  assertEquals(
    createValidatedCliParams.constructor.name,
    "Function",
    "createValidatedCliParams is synchronous validation",
  );
});

Deno.test("TotalityFactoryHelper - Architecture: Factory bundle component isolation", async () => {
  const result = await createTotalityFactory();

  if (result.ok) {
    const bundle = result.data;

    // Each component should be independently accessible
    const typeFactory = bundle.typeFactory;
    const patternProvider = bundle.patternProvider;
    const config = bundle.config;

    // Components should not have circular references to bundle
    assertEquals(
      typeFactory.hasOwnProperty("bundle"),
      false,
      "TypeFactory should not reference bundle",
    );
    assertEquals(
      patternProvider.hasOwnProperty("bundle"),
      false,
      "PatternProvider should not reference bundle",
    );
    assertEquals(config.hasOwnProperty("bundle"), false, "Config should not reference bundle");
  }
});

Deno.test("TotalityFactoryHelper - Architecture: Configuration abstraction layer", async () => {
  // Helper should abstract configuration complexity
  const result = await createTotalityFactory();

  if (result.ok) {
    const bundle = result.data;

    // Should provide high-level configuration interface
    assertEquals(
      typeof bundle.config.getConfig,
      "function",
      "Should provide config access method",
    );
    assertEquals(
      typeof bundle.patternProvider.hasValidPatterns,
      "function",
      "Should provide pattern validation",
    );

    // Should not expose low-level configuration details
    // (Implementation details are encapsulated)
  }
});

Deno.test("TotalityFactoryHelper - Architecture: Functional composition pattern", async () => {
  // Functions should compose well together
  const factoryResult = await createTotalityFactory();

  if (factoryResult.ok) {
    // Should be able to use bundle in other helper functions
    const paramsResult = await createValidatedCliParams(
      "test_directive",
      "test_layer",
      {},
      factoryResult.data,
    );

    // Should maintain consistent Result pattern
    assertExists(paramsResult.ok, "Composed function should return Result pattern");

    if (paramsResult.ok) {
      assertExists(paramsResult.data, "Composed success should have data");
    } else {
      assertExists(paramsResult.error, "Composed error should have error");
    }
  }
});

Deno.test("TotalityFactoryHelper - Architecture: One-step factory pattern", async () => {
  // createTotalityPromptFactory should encapsulate multi-step creation
  const result = await createTotalityPromptFactory(
    "test_directive",
    "test_layer",
    {},
    {},
  );

  // Should return same Result pattern as other functions
  assertExists(result.ok, "One-step factory must use Result pattern");

  if (result.ok) {
    assertExists(result.data, "Success should contain prompt factory");
  } else {
    assertExists(result.error, "Error should contain descriptive message");
    assertEquals(typeof result.error, "string", "Error should be string");
  }
});

Deno.test("TotalityFactoryHelper - Architecture: Validation utility separation", async () => {
  // Configuration validation should be separate utility
  const validation = await validateConfigurationPatterns();

  // Should have different return type than factory creation
  assertExists(validation.valid, "Validation should have 'valid' boolean");
  assertExists(validation.details, "Validation should have 'details' array");
  assertEquals(Array.isArray(validation.details), true, "Details should be array");

  // Should not return FactoryCreationResult pattern
  assertEquals(validation.hasOwnProperty("ok"), false, "Validation should not use Result pattern");
});
