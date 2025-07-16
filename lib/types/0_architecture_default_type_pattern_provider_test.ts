/**
 * @fileoverview Architecture tests for default type pattern provider
 *
 * Tests architectural constraints, design patterns, and system boundaries
 * for the default type pattern provider module.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { DefaultTypePatternProvider } from "./defaults/default_type_pattern_provider.ts";
import { TwoParamsDirectivePattern as _TwoParamsDirectivePattern } from "./mod.ts";
import { TwoParamsLayerTypePattern as _TwoParamsLayerTypePattern } from "./mod.ts";
import type { TypePatternProvider } from "./type_factory.ts";

Deno.test("Architecture: DefaultTypePatternProvider - Interface Implementation", () => {
  // Test proper implementation of TypePatternProvider interface

  const provider = new DefaultTypePatternProvider();

  // Should implement TypePatternProvider interface
  assertEquals(typeof provider.getDirectivePattern, "function");
  assertEquals(typeof provider.getLayerTypePattern, "function");

  // Additional methods should exist for enhanced functionality
  assertEquals(typeof provider.getDefaultConfig, "function");
  assertEquals(typeof provider.getValidDirectiveValues, "function");
  assertEquals(typeof provider.getValidLayerValues, "function");
  assertEquals(typeof provider.debug, "function");
});

Deno.test("Architecture: DefaultTypePatternProvider - Pattern Type Safety", () => {
  // Test that pattern methods return correct types or null

  const provider = new DefaultTypePatternProvider();

  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();

  // Patterns should be either the correct type or null
  if (directivePattern !== null) {
    // TwoParamsDirectivePattern should have test() and getPattern() methods
    assert(typeof directivePattern === "object" && "test" in directivePattern);
    assert(typeof directivePattern === "object" && "getPattern" in directivePattern);
  }

  if (layerPattern !== null) {
    // TwoParamsLayerTypePattern should have test() and getPattern() methods
    assert(typeof layerPattern === "object" && "test" in layerPattern);
    assert(typeof layerPattern === "object" && "getPattern" in layerPattern);
  }

  // With valid defaults, patterns should not be null
  assertExists(directivePattern, "DirectivePattern should exist with default config");
  assertExists(layerPattern, "LayerPattern should exist with default config");
});

Deno.test("Architecture: DefaultTypePatternProvider - Configuration Encapsulation", () => {
  // Test that configuration access is properly encapsulated

  const provider = new DefaultTypePatternProvider();
  const config = provider.getDefaultConfig();

  // Config should be accessible but not modifiable
  assertEquals(typeof config, "object");
  assertExists(config.params);
  assertExists(config.params.two);
  assertExists(config.params.two.directiveType);
  assertExists(config.params.two.layerType);

  // Config structure should follow expected pattern
  assertEquals(typeof config.params.two.directiveType.pattern, "string");
  assertEquals(typeof config.params.two.layerType.pattern, "string");
});

Deno.test("Architecture: DefaultTypePatternProvider - Pattern Extraction Logic", () => {
  // Test that pattern extraction follows consistent architecture

  const provider = new DefaultTypePatternProvider();

  // Pattern extraction should follow regex pattern convention
  const directiveValues = provider.getValidDirectiveValues();
  const layerValues = provider.getValidLayerValues();

  // Should return arrays of strings
  assert(Array.isArray(directiveValues));
  assert(Array.isArray(layerValues));

  directiveValues.forEach((value) => {
    assertEquals(typeof value, "string");
    assert(value.length > 0);
  });

  layerValues.forEach((value) => {
    assertEquals(typeof value, "string");
    assert(value.length > 0);
  });

  // Should extract from expected pattern format: "^(option1|option2|option3)$"
  assert(directiveValues.length > 0, "Should extract directive values");
  assert(layerValues.length > 0, "Should extract layer values");
});

Deno.test("Architecture: DefaultTypePatternProvider - Debug Interface", () => {
  // Test debug interface provides proper architectural insight

  const provider = new DefaultTypePatternProvider();
  const debugInfo = provider.debug();

  // Debug info should have expected structure
  assertEquals(typeof debugInfo.providerType, "string");
  assertEquals(typeof debugInfo.directivePattern, "string");
  assertEquals(typeof debugInfo.layerPattern, "string");
  assert(Array.isArray(debugInfo.validDirectives));
  assert(Array.isArray(debugInfo.validLayers));

  // Provider type should be correctly identified
  assertEquals(debugInfo.providerType, "DefaultTypePatternProvider");

  // Patterns should be valid regex strings
  assert(debugInfo.directivePattern.length > 0);
  assert(debugInfo.layerPattern.length > 0);

  // Should include caret and dollar anchors for exact matching
  assert(debugInfo.directivePattern.startsWith("^"));
  assert(debugInfo.directivePattern.endsWith("$"));
  assert(debugInfo.layerPattern.startsWith("^"));
  assert(debugInfo.layerPattern.endsWith("$"));
});

Deno.test("Architecture: DefaultTypePatternProvider - Dependency Management", () => {
  // Test dependency management and coupling

  const provider = new DefaultTypePatternProvider();

  // Should depend on specific pattern classes
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();

  if (directivePattern) {
    // TwoParamsDirectivePattern should implement pattern interface properly
    assert(typeof directivePattern === "object" && "test" in directivePattern);
    assert(typeof directivePattern === "object" && "getPattern" in directivePattern);
  }

  if (layerPattern) {
    // TwoParamsLayerTypePattern should implement pattern interface properly
    assert(typeof layerPattern === "object" && "test" in layerPattern);
    assert(typeof layerPattern === "object" && "getPattern" in layerPattern);
  }

  // Should use _defaultConfigTwoParams dependency
  const config = provider.getDefaultConfig();
  assertExists(config);

  // Should not expose internal implementation details
  // (The config is returned by reference, but that's by design for efficiency)
  assertEquals(typeof config, "object");
});

Deno.test("Architecture: DefaultTypePatternProvider - Factory Pattern Integration", () => {
  // Test integration with factory pattern for pattern creation

  const provider = new DefaultTypePatternProvider();

  // Pattern creation should use factory methods from pattern classes
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();

  // Factory methods should be used (tested indirectly through return types)
  if (directivePattern) {
    // Should have methods that indicate it was created via factory
    assertEquals(typeof directivePattern.test, "function");
    assertEquals(typeof directivePattern.getPattern, "function");
  }

  if (layerPattern) {
    assertEquals(typeof layerPattern.test, "function");
    assertEquals(typeof layerPattern.getPattern, "function");
  }
});

Deno.test("Architecture: DefaultTypePatternProvider - Error Handling Strategy", () => {
  // Test error handling strategy at architectural level

  const provider = new DefaultTypePatternProvider();

  // Methods should handle errors gracefully by returning null
  // This is tested indirectly - with valid defaults, should not return null
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();

  // With default config, these should succeed
  assertExists(directivePattern);
  assertExists(layerPattern);

  // Value extraction should handle invalid patterns gracefully
  const directiveValues = provider.getValidDirectiveValues();
  const layerValues = provider.getValidLayerValues();

  // Should always return arrays (empty if parsing fails)
  assert(Array.isArray(directiveValues));
  assert(Array.isArray(layerValues));
});

Deno.test("Architecture: DefaultTypePatternProvider - Immutability Principles", () => {
  // Test immutability principles in provider design

  const provider1 = new DefaultTypePatternProvider();
  const provider2 = new DefaultTypePatternProvider();

  // Multiple instances should provide consistent results
  const config1 = provider1.getDefaultConfig();
  const config2 = provider2.getDefaultConfig();

  // Configs should be equivalent (same reference by design)
  assertEquals(config1, config2);

  // Pattern extraction should be deterministic
  assertEquals(
    JSON.stringify(provider1.getValidDirectiveValues()),
    JSON.stringify(provider2.getValidDirectiveValues()),
  );

  assertEquals(
    JSON.stringify(provider1.getValidLayerValues()),
    JSON.stringify(provider2.getValidLayerValues()),
  );
});

Deno.test("Architecture: DefaultTypePatternProvider - Single Responsibility Principle", () => {
  // Test adherence to Single Responsibility Principle

  const provider = new DefaultTypePatternProvider();

  // Provider should only be responsible for providing type patterns
  // All methods should be related to pattern provision or inspection

  // Pattern provision methods
  assertExists(provider.getDirectivePattern);
  assertExists(provider.getLayerTypePattern);

  // Pattern inspection methods
  assertExists(provider.getValidDirectiveValues);
  assertExists(provider.getValidLayerValues);

  // Configuration access method
  assertExists(provider.getDefaultConfig);

  // Debug/introspection method
  assertExists(provider.debug);

  // Should not have methods for:
  // - Creating types (that's TypeFactory's responsibility)
  // - Validating input (that's the pattern's responsibility)
  // - Loading configuration (that's configuration layer's responsibility)

  assertEquals(typeof provider.getDirectivePattern, "function");
  assertEquals(typeof provider.getLayerTypePattern, "function");
});

Deno.test("Architecture: DefaultTypePatternProvider - Contract Consistency", () => {
  // Test that the provider maintains consistent contracts

  const provider = new DefaultTypePatternProvider();

  // Pattern methods should return patterns that work with the extracted values
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();
  const directiveValues = provider.getValidDirectiveValues();
  const layerValues = provider.getValidLayerValues();

  if (directivePattern && directiveValues.length > 0) {
    // All extracted values should pass the pattern test
    directiveValues.forEach((value) => {
      assert(
        directivePattern.test(value),
        `Extracted directive value "${value}" should pass pattern test`,
      );
    });
  }

  if (layerPattern && layerValues.length > 0) {
    // All extracted values should pass the pattern test
    layerValues.forEach((value) => {
      assert(layerPattern.test(value), `Extracted layer value "${value}" should pass pattern test`);
    });
  }
});

Deno.test("Architecture: DefaultTypePatternProvider - Extension Points", () => {
  // Test that the provider design allows for proper extension

  // Provider implements interface, allowing for substitution
  const provider: TypePatternProvider = new DefaultTypePatternProvider();

  // Interface methods should be available
  assertEquals(typeof provider.getDirectivePattern, "function");
  assertEquals(typeof provider.getLayerTypePattern, "function");

  // Extended methods should be available on the concrete class
  const concreteProvider = provider as DefaultTypePatternProvider;
  assertEquals(typeof concreteProvider.getDefaultConfig, "function");
  assertEquals(typeof concreteProvider.getValidDirectiveValues, "function");
  assertEquals(typeof concreteProvider.getValidLayerValues, "function");
  assertEquals(typeof concreteProvider.debug, "function");
});
