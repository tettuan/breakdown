/**
 * @fileoverview Behavior tests for DefaultTypePatternProvider
 *
 * Tests the behavioral aspects of the DefaultTypePatternProvider,
 * including pattern validation, value extraction, and runtime behavior.
 */

import { assert, assertEquals, assertExists } from "../../../tests/deps.ts";
import { DefaultTypePatternProvider } from "./default_type_pattern_provider.ts";

/**
 * Test suite for DefaultTypePatternProvider runtime behavior
 */
Deno.test("DefaultTypePatternProvider - Pattern Creation Behavior", async (t) => {
  await t.step("should create valid DirectiveType patterns", () => {
    const provider = new DefaultTypePatternProvider();
    const pattern = provider.getDirectivePattern();

    assertExists(pattern);
    // TwoParamsDirectivePattern uses private constructor, so check using duck typing
    assert(typeof pattern === "object" && "test" in pattern && "getPattern" in pattern);

    // Test pattern validation behavior
    assertEquals(pattern.test("to"), true);
    assertEquals(pattern.test("summary"), true);
    assertEquals(pattern.test("defect"), true);

    // Test pattern rejection behavior
    assertEquals(pattern.test("invalid"), false);
    assertEquals(pattern.test("TO"), false);
    assertEquals(pattern.test(""), false);
    assertEquals(pattern.test("to|summary"), false);
  });

  await t.step("should create valid LayerType patterns", () => {
    const provider = new DefaultTypePatternProvider();
    const pattern = provider.getLayerTypePattern();

    assertExists(pattern);
    // TwoParamsLayerTypePattern uses private constructor, so check using duck typing
    assert(typeof pattern === "object" && "test" in pattern && "getPattern" in pattern);

    // Test pattern validation behavior
    assertEquals(pattern.test("project"), true);
    assertEquals(pattern.test("issue"), true);
    assertEquals(pattern.test("task"), true);

    // Test pattern rejection behavior
    assertEquals(pattern.test("invalid"), false);
    assertEquals(pattern.test("PROJECT"), false);
    assertEquals(pattern.test(""), false);
    assertEquals(pattern.test("project|issue"), false);
  });

  await t.step("should maintain pattern consistency across calls", () => {
    const provider = new DefaultTypePatternProvider();

    // Multiple calls should return equivalent patterns
    const directive1 = provider.getDirectivePattern();
    const directive2 = provider.getDirectivePattern();
    const layer1 = provider.getLayerTypePattern();
    const layer2 = provider.getLayerTypePattern();

    assertExists(directive1);
    assertExists(directive2);
    assertExists(layer1);
    assertExists(layer2);

    // Test equivalent behavior
    assertEquals(directive1.test("to"), directive2.test("to"));
    assertEquals(directive1.test("invalid"), directive2.test("invalid"));
    assertEquals(layer1.test("project"), layer2.test("project"));
    assertEquals(layer1.test("invalid"), layer2.test("invalid"));
  });
});

/**
 * Test suite for DefaultTypePatternProvider value extraction behavior
 */
Deno.test("DefaultTypePatternProvider - Value Extraction Behavior", async (t) => {
  await t.step("should extract valid directive values", () => {
    const provider = new DefaultTypePatternProvider();
    const values = provider.getValidDirectiveValues();

    assertEquals(Array.isArray(values), true);
    assertEquals(values.length, 3);
    assertEquals(values.includes("to"), true);
    assertEquals(values.includes("summary"), true);
    assertEquals(values.includes("defect"), true);

    // Test order consistency
    assertEquals(values, ["to", "summary", "defect"]);
  });

  await t.step("should extract valid layer values", () => {
    const provider = new DefaultTypePatternProvider();
    const values = provider.getValidLayerValues();

    assertEquals(Array.isArray(values), true);
    assertEquals(values.length, 3);
    assertEquals(values.includes("project"), true);
    assertEquals(values.includes("issue"), true);
    assertEquals(values.includes("task"), true);

    // Test order consistency
    assertEquals(values, ["project", "issue", "task"]);
  });

  await t.step("should maintain value extraction consistency", () => {
    const provider = new DefaultTypePatternProvider();

    // Multiple calls should return same values
    const directive1 = provider.getValidDirectiveValues();
    const directive2 = provider.getValidDirectiveValues();
    const layer1 = provider.getValidLayerValues();
    const layer2 = provider.getValidLayerValues();

    assertEquals(directive1, directive2);
    assertEquals(layer1, layer2);

    // Test deep equality
    assertEquals(JSON.stringify(directive1), JSON.stringify(directive2));
    assertEquals(JSON.stringify(layer1), JSON.stringify(layer2));
  });

  await t.step("should support value validation", () => {
    const provider = new DefaultTypePatternProvider();
    const directiveValues = provider.getValidDirectiveValues();
    const layerValues = provider.getValidLayerValues();

    // Create validation functions
    const isValidDirective = (value: string) => directiveValues.includes(value);
    const isValidLayer = (value: string) => layerValues.includes(value);

    // Test validation behavior
    assertEquals(isValidDirective("to"), true);
    assertEquals(isValidDirective("summary"), true);
    assertEquals(isValidDirective("defect"), true);
    assertEquals(isValidDirective("invalid"), false);

    assertEquals(isValidLayer("project"), true);
    assertEquals(isValidLayer("issue"), true);
    assertEquals(isValidLayer("task"), true);
    assertEquals(isValidLayer("invalid"), false);
  });
});

/**
 * Test suite for DefaultTypePatternProvider configuration behavior
 */
Deno.test("DefaultTypePatternProvider - Configuration Behavior", async (t) => {
  await t.step("should provide access to default configuration", () => {
    const provider = new DefaultTypePatternProvider();
    const config = provider.getDefaultConfig();

    assertExists(config);
    assertExists(config.params);
    assertExists(config.params.two);
    assertExists(config.params.two.directiveType);
    assertExists(config.params.two.layerType);
    assertExists(config.params.two.validation);
  });

  await t.step("should maintain configuration immutability", () => {
    const provider = new DefaultTypePatternProvider();
    const config1 = provider.getDefaultConfig();
    const config2 = provider.getDefaultConfig();

    // Should return the same reference
    assertEquals(config1 === config2, true);

    // Test that modifications don't affect subsequent calls
    const originalPattern = config1.params.two.directiveType.pattern;

    // Attempt modification (should not affect the provider)
    try {
      // @ts-ignore - intentionally trying to modify
      config1.params.two.directiveType.pattern = "modified";
    } catch {
      // Expected to fail in some environments
    }

    // Get fresh reference and verify
    const config3 = provider.getDefaultConfig();
    assertEquals(config3.params.two.directiveType.pattern, originalPattern);
  });

  await t.step("should integrate with pattern creation", () => {
    const provider = new DefaultTypePatternProvider();
    const config = provider.getDefaultConfig();

    // Test that patterns created match config patterns
    const directivePattern = provider.getDirectivePattern();
    const layerPattern = provider.getLayerTypePattern();

    assertExists(directivePattern);
    assertExists(layerPattern);

    // Test that pattern behavior matches config expectations
    const configDirectivePattern = config.params.two.directiveType.pattern;
    const configLayerPattern = config.params.two.layerType.pattern;

    const directiveRegex = new RegExp(configDirectivePattern);
    const layerRegex = new RegExp(configLayerPattern);

    // Test consistency between provider patterns and config patterns
    assertEquals(directivePattern.test("to"), directiveRegex.test("to"));
    assertEquals(directivePattern.test("invalid"), directiveRegex.test("invalid"));
    assertEquals(layerPattern.test("project"), layerRegex.test("project"));
    assertEquals(layerPattern.test("invalid"), layerRegex.test("invalid"));
  });
});

/**
 * Test suite for DefaultTypePatternProvider debug behavior
 */
Deno.test("DefaultTypePatternProvider - Debug Behavior", async (t) => {
  await t.step("should provide comprehensive debug information", () => {
    const provider = new DefaultTypePatternProvider();
    const debugInfo = provider.debug();

    // Test debug info structure
    assertEquals(debugInfo.providerType, "DefaultTypePatternProvider");
    assertEquals(debugInfo.directivePattern, "^(to|summary|defect)$");
    assertEquals(debugInfo.layerPattern, "^(project|issue|task)$");
    assertEquals(debugInfo.validDirectives, ["to", "summary", "defect"]);
    assertEquals(debugInfo.validLayers, ["project", "issue", "task"]);
  });

  await t.step("should maintain debug consistency", () => {
    const provider = new DefaultTypePatternProvider();

    // Multiple debug calls should return equivalent info
    const debug1 = provider.debug();
    const debug2 = provider.debug();

    assertEquals(debug1.providerType, debug2.providerType);
    assertEquals(debug1.directivePattern, debug2.directivePattern);
    assertEquals(debug1.layerPattern, debug2.layerPattern);
    assertEquals(debug1.validDirectives, debug2.validDirectives);
    assertEquals(debug1.validLayers, debug2.validLayers);
  });

  await t.step("should support debug-based validation", () => {
    const provider = new DefaultTypePatternProvider();
    const debugInfo = provider.debug();

    // Use debug info for validation
    const directiveRegex = new RegExp(debugInfo.directivePattern);
    const layerRegex = new RegExp(debugInfo.layerPattern);

    // Test that debug patterns work correctly
    debugInfo.validDirectives.forEach((value) => {
      assertEquals(directiveRegex.test(value), true, `${value} should match directive pattern`);
    });

    debugInfo.validLayers.forEach((value) => {
      assertEquals(layerRegex.test(value), true, `${value} should match layer pattern`);
    });

    // Test that invalid values are rejected
    assertEquals(directiveRegex.test("invalid"), false);
    assertEquals(layerRegex.test("invalid"), false);
  });
});

/**
 * Test suite for DefaultTypePatternProvider integration behavior
 */
Deno.test("DefaultTypePatternProvider - Integration Behavior", async (t) => {
  await t.step("should work with TypeFactory", () => {
    const provider = new DefaultTypePatternProvider();

    // Simulate TypeFactory usage
    const directivePattern = provider.getDirectivePattern();
    const layerPattern = provider.getLayerTypePattern();

    assertExists(directivePattern);
    assertExists(layerPattern);

    // Test factory-like behavior
    const createDirectiveType = (value: string) => {
      return directivePattern.test(value) ? value : null;
    };

    const createLayerType = (value: string) => {
      return layerPattern.test(value) ? value : null;
    };

    // Test successful creation
    assertEquals(createDirectiveType("to"), "to");
    assertEquals(createLayerType("project"), "project");

    // Test failed creation
    assertEquals(createDirectiveType("invalid"), null);
    assertEquals(createLayerType("invalid"), null);
  });

  await t.step("should support configuration-based workflows", () => {
    const provider = new DefaultTypePatternProvider();
    const validDirectives = provider.getValidDirectiveValues();
    const validLayers = provider.getValidLayerValues();

    // Test configuration-driven validation workflow
    const validatePair = (directive: string, layer: string) => {
      return validDirectives.includes(directive) && validLayers.includes(layer);
    };

    // Test valid combinations
    assertEquals(validatePair("to", "project"), true);
    assertEquals(validatePair("summary", "issue"), true);
    assertEquals(validatePair("defect", "task"), true);

    // Test invalid combinations
    assertEquals(validatePair("invalid", "project"), false);
    assertEquals(validatePair("to", "invalid"), false);
    assertEquals(validatePair("invalid", "invalid"), false);
  });
});
