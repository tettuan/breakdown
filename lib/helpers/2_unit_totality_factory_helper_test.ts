/**
 * @fileoverview Unit tests for TotalityFactoryHelper
 *
 * Tests functional behavior of TotalityFactoryHelper functions including
 * factory creation, parameter validation, error handling, and configuration
 * integration. Covers all public functions and edge cases.
 *
 * @module helpers/2_unit_totality_factory_helper_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  createTotalityFactory,
  createTotalityPromptFactory,
  createValidatedCliParams,
  validateConfigurationPatterns,
} from "./totality_factory_helper.ts";
import type {
  FactoryCreationResult,
  TotalityFactoryBundle,
  TotalityFactoryOptions,
} from "./totality_factory_helper.ts";

Deno.test("TotalityFactoryHelper - Unit: createTotalityFactory - default options", async () => {
  const _result = await createTotalityFactory();

  // Should handle default options gracefully
  assertExists(_result, "Should return _result object");
  assertEquals(typeof _result.ok, "boolean", "Should have ok property");

  if (_result.ok) {
    const bundle = _result.data as TotalityFactoryBundle;

    assertEquals(typeof bundle.typeFactory, "object", "Should create typeFactory");
    assertEquals(typeof bundle.patternProvider, "object", "Should create patternProvider");
    assertEquals(typeof bundle.config, "object", "Should create config");
    assertEquals(
      typeof bundle.createPromptFactory,
      "function",
      "Should provide createPromptFactory",
    );
  } else {
    // If config fails, should provide descriptive error
    assertEquals(typeof _result.error, "string", "Should provide error message");
  }
});

Deno.test("TotalityFactoryHelper - Unit: createTotalityFactory - custom options", async () => {
  const options: TotalityFactoryOptions = {
    configSetName: "test",
    workspacePath: Deno.cwd(),
  };

  const _result = await createTotalityFactory(options);

  assertExists(_result, "Should handle custom options");
  assertEquals(typeof _result.ok, "boolean", "Should return _result pattern");

  // Should attempt to use custom configuration
  if (!_result.ok) {
    assertEquals(typeof _result.error, "string", "Should provide error for invalid config");
  }
});

Deno.test("TotalityFactoryHelper - Unit: createTotalityFactory - invalid workspace path", async () => {
  const options: TotalityFactoryOptions = {
    workspacePath: "/nonexistent/path/xyz123",
  };

  const _result = await createTotalityFactory(options);

  // Should handle invalid paths gracefully
  if (!_result.ok) {
    assertEquals(typeof _result.error, "string", "Should provide error message");
    assertEquals(_result.error.length > 0, true, "Error message should not be empty");
  }
});

Deno.test("TotalityFactoryHelper - Unit: createTotalityFactory - pre-loaded config", async () => {
  // First create a config to reuse
  const initialResult = await createTotalityFactory();

  if (initialResult.ok) {
    const existingConfig = initialResult.data.config;

    // Use pre-loaded config
    const _result = await createTotalityFactory({
      config: existingConfig,
    });

    if (_result.ok) {
      assertEquals(_result.data.config, existingConfig, "Should use pre-loaded config");
    }
  }
});

Deno.test("TotalityFactoryHelper - Unit: validateConfigurationPatterns - default config", async () => {
  const _result = await validateConfigurationPatterns();

  assertEquals(typeof _result.valid, "boolean", "Should return validation boolean");
  assertEquals(Array.isArray(_result.details), true, "Should return details array");
  assertEquals(_result.details.length > 0, true, "Should provide validation details");

  // Details should contain meaningful information
  for (const detail of _result.details) {
    assertEquals(typeof detail, "string", "Each detail should be string");
    assertEquals(detail.length > 0, true, "Details should not be empty");
  }
});

Deno.test("TotalityFactoryHelper - Unit: validateConfigurationPatterns - custom config", async () => {
  const _result = await validateConfigurationPatterns("custom_test", "/test/path");

  assertEquals(typeof _result.valid, "boolean", "Should handle custom config name");
  assertEquals(Array.isArray(_result.details), true, "Should return details for custom config");

  // Should handle non-existent config gracefully
  if (!_result.valid) {
    assertEquals(
      _result.details.some((d) => d.includes("failed")),
      true,
      "Should indicate failure in details",
    );
  }
});

Deno.test("TotalityFactoryHelper - Unit: createValidatedCliParams - valid inputs", async () => {
  const factoryResult = await createTotalityFactory();

  if (factoryResult.ok) {
    const bundle = factoryResult.data;

    // Test with potentially valid directive/layer values
    const _result = await createValidatedCliParams(
      "test_directive",
      "test_layer",
      { fromFile: "test.md" },
      bundle,
    );

    assertExists(_result, "Should return _result object");
    assertEquals(typeof _result.ok, "boolean", "Should have ok property");

    if (_result.ok) {
      assertEquals(typeof _result.data, "object", "Should return CLI params object");
      assertEquals(typeof _result.data.directive, "object", "Should include directive");
      assertEquals(typeof _result.data.layer, "object", "Should include layer");
      assertEquals(typeof _result.data.options, "object", "Should include options");
    } else {
      assertEquals(typeof _result.error, "object", "Should provide structured error");
    }
  }
});

Deno.test("TotalityFactoryHelper - Unit: createValidatedCliParams - invalid inputs", async () => {
  const factoryResult = await createTotalityFactory();

  if (factoryResult.ok) {
    const bundle = factoryResult.data;

    // Test with clearly invalid values
    const _result = await createValidatedCliParams(
      "definitely_invalid_directive_xyz123",
      "definitely_invalid_layer_xyz123",
      {},
      bundle,
    );

    // Should fail validation for invalid inputs
    assertEquals(_result.ok, false, "Should fail for invalid inputs");
    if (!_result.ok) {
      assertEquals(typeof _result.error, "object", "Should provide error object");
      assertEquals(typeof _result.error.kind, "string", "Should include error kind");
    }
  }
});

Deno.test("TotalityFactoryHelper - Unit: createTotalityPromptFactory - valid parameters", async () => {
  const _result = await createTotalityPromptFactory(
    "test_directive",
    "test_layer",
    { fromFile: "test.md" },
    { configSetName: "default" },
  );

  assertExists(_result, "Should return _result object");
  assertEquals(typeof _result.ok, "boolean", "Should have ok property");

  if (_result.ok) {
    assertEquals(typeof _result.data, "object", "Should return prompt factory");
    // Prompt factory should have expected methods
    assertEquals(typeof _result.data.getAllParams, "function", "Should have getAllParams method");
  } else {
    assertEquals(typeof _result.error, "string", "Should provide error message");
    assertEquals(_result.error.length > 0, true, "Error should not be empty");
  }
});

Deno.test("TotalityFactoryHelper - Unit: createTotalityPromptFactory - invalid configuration", async () => {
  const _result = await createTotalityPromptFactory(
    "test_directive",
    "test_layer",
    {},
    {
      configSetName: "nonexistent_config_xyz123",
      workspacePath: "/nonexistent/path/xyz123",
    },
  );

  // Should fail gracefully for invalid configuration
  assertEquals(_result.ok, false, "Should fail for invalid configuration");

  // Type-safe property access with proper discriminated union handling
  if (!_result.ok) {
    assertEquals(typeof _result.error, "string", "Should provide error message");
    assertEquals(_result.error.length > 0, true, "Error message should not be empty");
  }
});

Deno.test("TotalityFactoryHelper - Unit: createTotalityPromptFactory - invalid parameters", async () => {
  const _result = await createTotalityPromptFactory(
    "definitely_invalid_directive_xyz123",
    "definitely_invalid_layer_xyz123",
    {},
    {},
  );

  // Should fail parameter validation
  assertEquals(_result.ok, false, "Should fail for invalid parameters");
  if (!_result.ok) {
    assertEquals(typeof _result.error, "string", "Should provide error message");
    assertEquals(
      _result.error.includes("Failed") || _result.error.includes("BreakdownConfig") ||
        _result.error.includes("validation") || _result.error.includes("Invalid"),
      true,
      "Error should mention failure or configuration issue",
    );
  }
});

Deno.test("TotalityFactoryHelper - Unit: createTotalityPromptFactory - empty parameters", async () => {
  const _result = await createTotalityPromptFactory(
    "",
    "",
    {},
    {},
  );

  // Should handle empty parameters
  assertEquals(_result.ok, false, "Should fail for empty parameters");

  // Type-safe property access with proper discriminated union handling
  if (!_result.ok) {
    assertEquals(typeof _result.error, "string", "Should provide error for empty params");
  }
});

Deno.test("TotalityFactoryHelper - Unit: Factory bundle component functionality", async () => {
  const _result = await createTotalityFactory();

  if (_result.ok) {
    const bundle = _result.data;

    // Test typeFactory functionality
    const typesResult = bundle.typeFactory.createBothTypes("test", "test");
    assertExists(typesResult, "TypeFactory should be functional");

    // Test patternProvider functionality
    const hasPatterns = bundle.patternProvider.hasValidPatterns();
    assertEquals(typeof hasPatterns, "boolean", "PatternProvider should be functional");

    // Test config functionality
    const configData = await bundle.config.getConfig();
    assertExists(configData, "Config should be functional");

    // Test createPromptFactory functionality
    if (typesResult.ok) {
      const _params = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const promptFactory = await bundle.createPromptFactory(_params);
      assertExists(promptFactory, "createPromptFactory should be functional");
    }
  }
});

Deno.test("TotalityFactoryHelper - Unit: Error message quality", async () => {
  // Test various error scenarios for message quality

  // Configuration error
  const configError = await createTotalityFactory({
    workspacePath: "/invalid/path",
  });
  if (!configError.ok) {
    assertEquals(configError.error.length > 10, true, "Config error should be descriptive");
  }

  // Parameter validation error
  const factoryResult = await createTotalityFactory();
  if (factoryResult.ok) {
    const paramError = await createValidatedCliParams(
      "invalid",
      "invalid",
      {},
      factoryResult.data,
    );
    if (!paramError.ok) {
      assertEquals(typeof paramError.error.kind, "string", "Param error should have kind");
    }
  }

  // Integrated error
  const integratedError = await createTotalityPromptFactory(
    "invalid",
    "invalid",
    {},
    { configSetName: "invalid" },
  );
  if (!integratedError.ok) {
    assertEquals(integratedError.error.length > 5, true, "Integrated error should be descriptive");
  }
});

Deno.test("TotalityFactoryHelper - Unit: Function parameter edge cases", async () => {
  // Test edge cases for function parameters

  // createTotalityFactory with undefined options
  const result1 = await createTotalityFactory(undefined as unknown);
  assertExists(result1, "Should handle undefined options");

  // createValidatedCliParams with empty strings
  const factoryResult = await createTotalityFactory();
  if (factoryResult.ok) {
    const result2 = await createValidatedCliParams(
      "",
      "",
      {},
      factoryResult.data,
    );
    assertEquals(result2.ok, false, "Should fail for empty strings");
  }

  // validateConfigurationPatterns with empty string
  const result3 = await validateConfigurationPatterns("", "");
  assertEquals(typeof _result3.valid, "boolean", "Should handle empty config name");
});

Deno.test("TotalityFactoryHelper - Unit: Async operation completion", async () => {
  // All async operations should complete without hanging

  const start = Date.now();

  // Run multiple operations
  const operations = [
    createTotalityFactory(),
    validateConfigurationPatterns(),
    createTotalityPromptFactory("test", "test", {}, {}),
  ];

  const results = await Promise.all(operations);

  const duration = Date.now() - start;

  // Should complete within reasonable time (10 seconds)
  assertEquals(duration < 10000, true, "Operations should complete within 10 seconds");

  // All should return _results
  for (const result of results) {
    assertExists(_result, "Each operation should return _result");
  }
});
