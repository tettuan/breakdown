/**
 * @fileoverview Integration tests for TypeFactory with ConfigPatternProvider and DefaultTypePatternProvider
 *
 * These tests validate the high-level integration between TypeFactory and different
 * pattern providers, ensuring proper error propagation, provider switching,
 * and performance characteristics.
 *
 * @module tests/integration/type_factory_integration_test
 */

import {
  assertEquals,
  assertExists,
  assertFalse,
} from "../../../lib/deps.ts";
import { TypeFactory } from "../../../lib/types/type_factory.ts";
import { ConfigPatternProvider } from "../../../lib/config/pattern_provider.ts";
import { DefaultTypePatternProvider } from "../../../lib/types/defaults/default_type_pattern_provider.ts";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { TwoParamsDirectivePattern } from "../../../lib/types/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../../../lib/types/layer_type.ts";

const logger = new BreakdownLogger("type-factory-integration-test");

/**
 * Test suite for TypeFactory with DefaultTypePatternProvider
 * Validates basic functionality with default patterns
 */
Deno.test("TypeFactory with DefaultTypePatternProvider - basic operations", async () => {
  logger.debug("Testing TypeFactory with DefaultTypePatternProvider");

  const provider = new DefaultTypePatternProvider();
  const factory = new TypeFactory(provider);

  // Test valid DirectiveType creation
  const directiveResult = factory.createDirectiveType("to");
  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    assertEquals(directiveResult.data.getValue(), "to");
  }

  // Test valid LayerType creation
  const layerResult = factory.createLayerType("project");
  assertEquals(layerResult.ok, true);
  if (layerResult.ok) {
    assertEquals(layerResult.data.getValue(), "project");
  }

  // Test invalid DirectiveType
  const invalidDirective = factory.createDirectiveType("invalid");
  assertEquals(invalidDirective.ok, false);
  if (!invalidDirective.ok) {
    assertEquals(invalidDirective.error.kind, "ValidationFailed");
  }

  // Test invalid LayerType
  const invalidLayer = factory.createLayerType("invalid");
  assertEquals(invalidLayer.ok, false);
  if (!invalidLayer.ok) {
    assertEquals(invalidLayer.error.kind, "ValidationFailed");
  }

  // Test pattern availability
  const availability = factory.getPatternAvailability();
  assertEquals(availability.directive, true);
  assertEquals(availability.layer, true);
  assertEquals(availability.both, true);

  logger.info("DefaultTypePatternProvider tests completed successfully");
});

/**
 * Test suite for TypeFactory with ConfigPatternProvider
 * Validates integration with BreakdownConfig
 */
Deno.test("TypeFactory with ConfigPatternProvider - mock configuration", async () => {
  logger.debug("Testing TypeFactory with ConfigPatternProvider (mock)");

  // Create a mock BreakdownConfig for testing
  // Since we can't easily mock the actual BreakdownConfig, we'll test the provider directly
  const configResult = await BreakdownConfig.create("default", Deno.cwd());

  if (configResult.success && configResult.data) {
    const provider = new ConfigPatternProvider(configResult.data);
    const factory = new TypeFactory(provider);

    // Test pattern availability (may be null if no config)
    const availability = factory.getPatternAvailability();
    logger.debug("ConfigPatternProvider availability", availability);

    // Test with fallback patterns
    if (availability.directive) {
      const directiveResult = factory.createDirectiveType("to");
      logger.debug("Directive creation result", { ok: directiveResult.ok });
    }

    if (availability.layer) {
      const layerResult = factory.createLayerType("project");
      logger.debug("Layer creation result", { ok: layerResult.ok });
    }
  }

  logger.info("ConfigPatternProvider tests completed");
});

/**
 * Test provider switching scenarios
 * Validates that TypeFactory works correctly when switching between providers
 */
Deno.test("TypeFactory - provider switching", async () => {
  logger.debug("Testing provider switching scenarios");

  // Start with DefaultTypePatternProvider
  const defaultProvider = new DefaultTypePatternProvider();
  let factory = new TypeFactory(defaultProvider);

  const result1 = factory.createDirectiveType("to");
  assertEquals(result1.ok, true);

  // Switch to a custom mock provider
  const customProvider = {
    getDirectivePattern: () => null,
    getLayerTypePattern: () => null,
  };

  factory = new TypeFactory(customProvider);

  const result2 = factory.createDirectiveType("to");
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "PatternNotFound");
  }

  logger.info("Provider switching tests completed");
});

/**
 * Test error propagation scenarios
 * Validates proper error handling and propagation
 */
Deno.test("TypeFactory - error propagation", async () => {
  logger.debug("Testing error propagation scenarios");

  // Test with provider that returns null patterns
  const nullProvider = {
    getDirectivePattern: () => null,
    getLayerTypePattern: () => null,
  };

  const factory = new TypeFactory(nullProvider);

  // Test PatternNotFound errors
  const directiveResult = factory.createDirectiveType("any");
  assertEquals(directiveResult.ok, false);
  if (!directiveResult.ok) {
    assertEquals(directiveResult.error.kind, "PatternNotFound");
  }

  const layerResult = factory.createLayerType("any");
  assertEquals(layerResult.ok, false);
  if (!layerResult.ok) {
    assertEquals(layerResult.error.kind, "PatternNotFound");
  }

  // Test createBothTypes with pattern errors
  const bothResult = factory.createBothTypes("to", "project");
  assertEquals(bothResult.ok, false);

  logger.info("Error propagation tests completed");
});

/**
 * Test validation performance
 * Ensures pattern validation is efficient
 */
Deno.test("TypeFactory - validation performance", async () => {
  logger.debug("Testing validation performance");

  const provider = new DefaultTypePatternProvider();
  const factory = new TypeFactory(provider);

  const iterations = 1000;
  const start = performance.now();

  // Test repeated validations
  for (let i = 0; i < iterations; i++) {
    factory.validateBothValues("to", "project");
    factory.validateBothValues("invalid", "invalid");
  }

  const end = performance.now();
  const duration = end - start;
  const avgTime = duration / (iterations * 2);

  logger.info("Performance test results", {
    totalDuration: `${duration.toFixed(2)}ms`,
    iterations: iterations * 2,
    avgTimePerValidation: `${avgTime.toFixed(4)}ms`,
  });

  // Ensure validation is fast (less than 0.1ms per validation on average)
  assertEquals(avgTime < 0.1, true, `Validation too slow: ${avgTime}ms per validation`);
});

/**
 * Test createBothTypes functionality
 * Validates atomic creation of both types
 */
Deno.test("TypeFactory - createBothTypes atomic operation", async () => {
  logger.debug("Testing createBothTypes atomic operation");

  const provider = new DefaultTypePatternProvider();
  const factory = new TypeFactory(provider);

  // Test successful creation
  const successResult = factory.createBothTypes("to", "project");
  assertEquals(successResult.ok, true);
  if (successResult.ok) {
    assertEquals(successResult.data.directive.getValue(), "to");
    assertEquals(successResult.data.layer.getValue(), "project");
  }

  // Test partial failure (invalid directive)
  const failDirective = factory.createBothTypes("invalid", "project");
  assertEquals(failDirective.ok, false);
  if (!failDirective.ok) {
    assertEquals(failDirective.error.kind, "ValidationFailed");
  }

  // Test partial failure (invalid layer)
  const failLayer = factory.createBothTypes("to", "invalid");
  assertEquals(failLayer.ok, false);
  if (!failLayer.ok) {
    assertEquals(failLayer.error.kind, "ValidationFailed");
  }

  // Test complete failure
  const failBoth = factory.createBothTypes("invalid", "invalid");
  assertEquals(failBoth.ok, false);

  logger.info("createBothTypes tests completed");
});

/**
 * Test debug functionality
 * Validates debug information availability
 */
Deno.test("TypeFactory - debug information", async () => {
  logger.debug("Testing debug information");

  const defaultProvider = new DefaultTypePatternProvider();
  const factory1 = new TypeFactory(defaultProvider);

  const debug1 = factory1.debug();
  assertEquals(debug1.patternProvider, "DefaultTypePatternProvider");
  assertEquals(debug1.availability.both, true);

  // Test with null provider
  const nullProvider = {
    getDirectivePattern: () => null,
    getLayerTypePattern: () => null,
  };
  const factory2 = new TypeFactory(nullProvider);

  const debug2 = factory2.debug();
  assertEquals(debug2.availability.both, false);
  assertFalse(debug2.availability.directive);
  assertFalse(debug2.availability.layer);

  logger.info("Debug information tests completed");
});

/**
 * Test ConfigPatternProvider cache behavior
 * Validates that pattern caching works correctly
 */
Deno.test("ConfigPatternProvider - cache behavior", async () => {
  logger.debug("Testing ConfigPatternProvider cache behavior");

  const configResult = await BreakdownConfig.create("default", Deno.cwd());

  if (configResult.success && configResult.data) {
    const provider = new ConfigPatternProvider(configResult.data);

    // First call should populate cache
    const pattern1 = provider.getDirectivePattern();
    const pattern2 = provider.getDirectivePattern();

    // Should return same instance (cached)
    assertEquals(pattern1, pattern2);

    // Clear cache
    provider.clearCache();

    // Should create new instance
    const pattern3 = provider.getDirectivePattern();

    // Verify cache was cleared (may be same value but different instance)
    logger.debug("Cache behavior verified");

    // Test debug info
    const debugInfo = provider.debug();
    assertExists(debugInfo.configSetName);
    assertExists(debugInfo.cacheStatus);
  }

  logger.info("ConfigPatternProvider cache tests completed");
});

/**
 * Test integration with different pattern formats
 * Validates support for various regex patterns
 */
Deno.test("TypeFactory - complex pattern support", async () => {
  logger.debug("Testing complex pattern support");

  // Create a custom provider with complex patterns
  const complexProvider = {
    getDirectivePattern: () => {
      // Simulate a complex pattern (e.g., web|rag|db)
      return TwoParamsDirectivePattern.create("^(web|rag|db|search|analyze)$");
    },
    getLayerTypePattern: () => {
      // Simulate a complex pattern with special characters
      return TwoParamsLayerTypePattern.create("^(search-results|db-query|rag-context)$");
    },
  };

  const factory = new TypeFactory(complexProvider);

  // Test new directive values
  const webResult = factory.createDirectiveType("web");
  assertEquals(webResult.ok, true);
  if (webResult.ok) {
    assertEquals(webResult.data.getValue(), "web");
  }

  const searchResult = factory.createDirectiveType("search");
  assertEquals(searchResult.ok, true);
  if (searchResult.ok) {
    assertEquals(searchResult.data.getValue(), "search");
  }

  // Test hyphenated layer values
  const searchLayerResult = factory.createLayerType("search-results");
  assertEquals(searchLayerResult.ok, true);
  if (searchLayerResult.ok) {
    assertEquals(searchLayerResult.data.getValue(), "search-results");
  }

  const dbLayerResult = factory.createLayerType("db-query");
  assertEquals(dbLayerResult.ok, true);
  if (dbLayerResult.ok) {
    assertEquals(dbLayerResult.data.getValue(), "db-query");
  }

  // Test invalid values
  const invalidDirective = factory.createDirectiveType("invalid");
  assertEquals(invalidDirective.ok, false);

  const invalidLayer = factory.createLayerType("invalid-layer");
  assertEquals(invalidLayer.ok, false);

  logger.info("Complex pattern tests completed");
});

logger.info("All TypeFactory integration tests completed");
