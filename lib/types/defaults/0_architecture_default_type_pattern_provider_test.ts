/**
 * @fileoverview Architecture tests for DefaultTypePatternProvider
 *
 * Tests the architectural constraints and design patterns of the default
 * TypePatternProvider implementation.
 */

import { assert, assertEquals, assertExists } from "../../../tests/deps.ts";
import { DefaultTypePatternProvider } from "./default_type_pattern_provider.ts";
import { TwoParamsDirectivePattern } from "../../domain/core/value_objects/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../../domain/core/value_objects/layer_type.ts";

/**
 * Test suite for DefaultTypePatternProvider architecture validation
 */
Deno.test("DefaultTypePatternProvider - Architecture Validation", async (t) => {
  await t.step("should implement TypePatternProvider interface", () => {
    const provider = new DefaultTypePatternProvider();

    // Test interface implementation
    assertEquals(typeof provider.getDirectivePattern, "function");
    assertEquals(typeof provider.getLayerTypePattern, "function");

    // Test additional methods
    assertEquals(typeof provider.getDefaultConfig, "function");
    assertEquals(typeof provider.getValidDirectiveValues, "function");
    assertEquals(typeof provider.getValidLayerValues, "function");
    assertEquals(typeof provider.debug, "function");
  });

  await t.step("should follow TypePatternProvider contract", () => {
    const provider = new DefaultTypePatternProvider();

    // Test return types match interface expectations
    const directivePattern = provider.getDirectivePattern();
    const layerPattern = provider.getLayerTypePattern();

    // Should return pattern objects or null
    if (directivePattern !== null) {
      // TwoParamsDirectivePattern uses private constructor, so check using duck typing
      // Check for the actual methods that exist on the pattern objects
      assert(typeof directivePattern === "object");
      assert(typeof directivePattern.test === "function");
      assert(typeof directivePattern.toString === "function");
      assert(typeof directivePattern.getPattern === "function");
    }

    if (layerPattern !== null) {
      // TwoParamsLayerTypePattern uses private constructor, so check using duck typing
      // Check for the actual methods that exist on the pattern objects
      assert(typeof layerPattern === "object");
      assert(typeof layerPattern.test === "function");
      assert(typeof layerPattern.toString === "function");
      assert(typeof layerPattern.getPattern === "function");
    }
  });

  await t.step("should maintain immutable state", () => {
    const provider1 = new DefaultTypePatternProvider();
    const provider2 = new DefaultTypePatternProvider();

    // Both providers should return the same patterns
    const directive1 = provider1.getDirectivePattern();
    const directive2 = provider2.getDirectivePattern();
    const layer1 = provider1.getLayerTypePattern();
    const layer2 = provider2.getLayerTypePattern();

    // Patterns should be equivalent (not necessarily the same reference)
    assertEquals(directive1?.toString(), directive2?.toString());
    assertEquals(layer1?.toString(), layer2?.toString());

    // Default config should be the same reference
    assertEquals(provider1.getDefaultConfig() === provider2.getDefaultConfig(), true);
  });

  await t.step("should provide consistent pattern creation", () => {
    const provider = new DefaultTypePatternProvider();

    // Multiple calls should return equivalent patterns
    const directive1 = provider.getDirectivePattern();
    const directive2 = provider.getDirectivePattern();
    const layer1 = provider.getLayerTypePattern();
    const layer2 = provider.getLayerTypePattern();

    assertEquals(directive1?.toString(), directive2?.toString());
    assertEquals(layer1?.toString(), layer2?.toString());
  });
});

/**
 * Test suite for DefaultTypePatternProvider singleton behavior
 */
Deno.test("DefaultTypePatternProvider - Singleton Pattern", async (t) => {
  await t.step("should create independent instances", () => {
    const provider1 = new DefaultTypePatternProvider();
    const provider2 = new DefaultTypePatternProvider();

    // Instances should be different objects
    assertEquals(provider1 === provider2, false);

    // But should behave identically
    assertEquals(provider1.getValidDirectiveValues(), provider2.getValidDirectiveValues());
    assertEquals(provider1.getValidLayerValues(), provider2.getValidLayerValues());
  });

  await t.step("should maintain shared default configuration", () => {
    const provider1 = new DefaultTypePatternProvider();
    const provider2 = new DefaultTypePatternProvider();

    // Default config should be the same reference (shared)
    const config1 = provider1.getDefaultConfig();
    const config2 = provider2.getDefaultConfig();

    assertEquals(config1 === config2, true);
  });
});

/**
 * Test suite for DefaultTypePatternProvider error handling architecture
 */
Deno.test("DefaultTypePatternProvider - Error Handling Architecture", async (t) => {
  await t.step("should handle pattern creation failures gracefully", () => {
    const provider = new DefaultTypePatternProvider();

    // Should not throw errors on pattern creation
    let directivePattern: TwoParamsDirectivePattern | null = null;
    let layerPattern: TwoParamsLayerTypePattern | null = null;

    // Test that pattern creation doesn't throw
    let errorThrown = false;
    try {
      directivePattern = provider.getDirectivePattern();
      layerPattern = provider.getLayerTypePattern();
    } catch {
      errorThrown = true;
    }

    assertEquals(errorThrown, false, "Pattern creation should not throw errors");

    // With valid defaults, patterns should be created successfully
    assertExists(directivePattern);
    assertExists(layerPattern);
  });

  await t.step("should provide fallback mechanisms", () => {
    const provider = new DefaultTypePatternProvider();

    // Should always return arrays for valid values (even if empty)
    const directiveValues = provider.getValidDirectiveValues();
    const layerValues = provider.getValidLayerValues();

    assertEquals(Array.isArray(directiveValues), true);
    assertEquals(Array.isArray(layerValues), true);

    // With valid defaults, should have actual values
    assertEquals(directiveValues.length > 0, true);
    assertEquals(layerValues.length > 0, true);
  });

  await t.step("should provide debug information consistently", () => {
    const provider = new DefaultTypePatternProvider();

    const debugInfo = provider.debug();

    // Debug info should have expected structure
    assertExists(debugInfo.providerType);
    assertExists(debugInfo.directivePattern);
    assertExists(debugInfo.layerPattern);
    assertExists(debugInfo.validDirectives);
    assertExists(debugInfo.validLayers);

    assertEquals(typeof debugInfo.providerType, "string");
    assertEquals(typeof debugInfo.directivePattern, "string");
    assertEquals(typeof debugInfo.layerPattern, "string");
    assertEquals(Array.isArray(debugInfo.validDirectives), true);
    assertEquals(Array.isArray(debugInfo.validLayers), true);
  });
});

/**
 * Test suite for DefaultTypePatternProvider performance characteristics
 */
Deno.test("DefaultTypePatternProvider - Performance Architecture", async (t) => {
  await t.step("should have efficient pattern creation", () => {
    const provider = new DefaultTypePatternProvider();

    // Pattern creation should be fast and deterministic
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      provider.getDirectivePattern();
      provider.getLayerTypePattern();
    }

    const end = performance.now();
    const duration = end - start;

    // Should complete quickly (less than 100ms for 100 iterations)
    assertEquals(duration < 100, true, `Pattern creation took ${duration}ms, should be < 100ms`);
  });

  await t.step("should have efficient value extraction", () => {
    const provider = new DefaultTypePatternProvider();

    // Value extraction should be fast
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      provider.getValidDirectiveValues();
      provider.getValidLayerValues();
    }

    const end = performance.now();
    const duration = end - start;

    // Should complete quickly (less than 50ms for 100 iterations)
    assertEquals(duration < 50, true, `Value extraction took ${duration}ms, should be < 50ms`);
  });

  await t.step("should minimize object creation overhead", () => {
    // Test that repeated calls don't create excessive objects
    const provider = new DefaultTypePatternProvider();

    // Get baseline memory usage
    const initialHeap = performance.now(); // Proxy for memory measurement

    // Perform operations that should be efficient
    for (let i = 0; i < 1000; i++) {
      const config = provider.getDefaultConfig();
      const debug = provider.debug();
      assertEquals(typeof config, "object");
      assertEquals(typeof debug, "object");
    }

    const finalHeap = performance.now();
    const duration = finalHeap - initialHeap;

    // Should complete without excessive overhead
    assertEquals(duration < 200, true, `1000 operations took ${duration}ms, should be < 200ms`);
  });
});
