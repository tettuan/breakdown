/**
 * @fileoverview Behavior tests for default type pattern provider
 *
 * Tests behavioral aspects, business logic, and runtime dynamics of the
 * default type pattern provider, including pattern validation behavior,
 * value extraction logic, and provider functionality.
 */

import { assert, assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { DefaultTypePatternProvider } from "./defaults/default_type_pattern_provider.ts";

Deno.test("Behavior: DefaultTypePatternProvider - Pattern Creation and Validation", () => {
  // Test pattern creation and validation behavior

  const provider = new DefaultTypePatternProvider();

  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();

  assertExists(directivePattern, "Directive pattern should be created");

  // LayerPattern is deprecated and should be null
  assertEquals(layerPattern, null, "Layer pattern should be null (deprecated)");

  // Test pattern validation with expected values from configuration
  const expectedDirectives = provider.getValidDirectiveValues();
  const expectedLayers = provider.getValidLayerValues();

  expectedDirectives.forEach((directive) => {
    assert(directivePattern.test(directive), `"${directive}" should be valid directive`);
  });

  // Test layer validation using validateLayerType method instead of deprecated pattern
  expectedLayers.forEach((layer) => {
    assert(provider.validateLayerType(layer), `"${layer}" should be valid layer`);
  });

  // Test pattern rejection of invalid values
  const invalidDirectives = ["TO", "Summary", "invalid", "to ", " to", "to_something"];
  const invalidLayers = ["PROJECT", "Issue", "invalid", "task ", " task", "task_something"];

  invalidDirectives.forEach((directive) => {
    assert(!directivePattern.test(directive), `"${directive}" should be invalid directive`);
  });

  // Test layer validation rejection using validateLayerType method instead of deprecated pattern
  invalidLayers.forEach((layer) => {
    assert(!provider.validateLayerType(layer), `"${layer}" should be invalid layer`);
  });
});

Deno.test("Behavior: DefaultTypePatternProvider - Value Extraction Logic", () => {
  // Test value extraction behavior from regex patterns

  const provider = new DefaultTypePatternProvider();

  const directiveValues = provider.getValidDirectiveValues();
  const layerValues = provider.getValidLayerValues();

  // Should extract values from configuration (not hardcoded)
  assert(directiveValues.length > 0, "Should extract directive values from configuration");
  assert(layerValues.length > 0, "Should extract layer values from configuration");

  // Verify configuration-based values are valid
  directiveValues.forEach(value => {
    assert(typeof value === "string" && value.length > 0, `Directive value should be non-empty string: ${value}`);
  });
  layerValues.forEach(value => {
    assert(typeof value === "string" && value.length > 0, `Layer value should be non-empty string: ${value}`);
  });

  // Should not contain duplicates
  assertEquals(
    directiveValues.length,
    new Set(directiveValues).size,
    "Directive values should be unique",
  );
  assertEquals(layerValues.length, new Set(layerValues).size, "Layer values should be unique");

  // Should extract in consistent order
  const directiveValues2 = provider.getValidDirectiveValues();
  const layerValues2 = provider.getValidLayerValues();

  assertEquals(JSON.stringify(directiveValues), JSON.stringify(directiveValues2));
  assertEquals(JSON.stringify(layerValues), JSON.stringify(layerValues2));
});

Deno.test("Behavior: DefaultTypePatternProvider - Pattern Consistency", () => {
  // Test consistency between patterns and extracted values

  const provider = new DefaultTypePatternProvider();

  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();
  const directiveValues = provider.getValidDirectiveValues();
  const layerValues = provider.getValidLayerValues();

  assertExists(directivePattern);

  // LayerPattern is deprecated and should be null
  assertEquals(layerPattern, null, "Layer pattern should be null (deprecated)");

  // Every extracted value should be valid according to its pattern
  directiveValues.forEach((value) => {
    assert(
      directivePattern.test(value),
      `Extracted directive "${value}" should pass pattern validation`,
    );
  });

  // Test layer values using validateLayerType method instead of deprecated pattern
  layerValues.forEach((value) => {
    assert(provider.validateLayerType(value), `Extracted layer "${value}" should pass validation`);
  });

  // Pattern should reject other common values
  const commonInvalidValues = ["", " ", "null", "undefined", "1", "test"];

  commonInvalidValues.forEach((value) => {
    if (!directiveValues.includes(value)) {
      assert(
        !directivePattern.test(value),
        `Pattern should reject common invalid value "${value}"`,
      );
    }
    if (!layerValues.includes(value)) {
      assert(
        !provider.validateLayerType(value),
        `LayerType validation should reject common invalid value "${value}"`,
      );
    }
  });
});

Deno.test("Behavior: DefaultTypePatternProvider - Configuration Access", () => {
  // Test configuration access behavior

  const provider = new DefaultTypePatternProvider();
  const config = provider.getDefaultConfig();

  // Config should have expected structure
  assertExists(config.params);
  assertExists(config.params.two);
  assertExists(config.params.two.directiveType);
  assertExists(config.params.two.layerType);

  // Pattern strings should be valid regex
  const directivePatternStr = config.params.two.directiveType.pattern;
  const layerPatternStr = config.params.two.layerType.pattern;

  assertEquals(typeof directivePatternStr, "string");
  assertEquals(typeof layerPatternStr, "string");

  // Should be able to create RegExp from patterns
  const directiveRegex = new RegExp(directivePatternStr);
  const layerRegex = new RegExp(layerPatternStr);

  assertExists(directiveRegex);
  assertExists(layerRegex);

  // Patterns should follow expected format
  assert(directivePatternStr.startsWith("^"), "Directive pattern should start with ^");
  assert(directivePatternStr.endsWith("$"), "Directive pattern should end with $");
  assert(layerPatternStr.startsWith("^"), "Layer pattern should start with ^");
  assert(layerPatternStr.endsWith("$"), "Layer pattern should end with $");
});

Deno.test("Behavior: DefaultTypePatternProvider - Debug Information", () => {
  // Test debug information behavior

  const provider = new DefaultTypePatternProvider();
  const debugInfo = provider.debug();

  // Debug info should be comprehensive
  assertEquals(debugInfo.providerType, "DefaultTypePatternProvider");
  assertEquals(typeof debugInfo.directivePattern, "string");
  assertEquals(typeof debugInfo.layerPattern, "string");
  assert(Array.isArray(debugInfo.validDirectives));
  assert(Array.isArray(debugInfo.validLayers));

  // Debug info should match actual behavior
  const actualDirectiveValues = provider.getValidDirectiveValues();
  const actualLayerValues = provider.getValidLayerValues();

  assertEquals(JSON.stringify(debugInfo.validDirectives), JSON.stringify(actualDirectiveValues));
  assertEquals(JSON.stringify(debugInfo.validLayers), JSON.stringify(actualLayerValues));

  // Pattern strings in debug should match config
  const config = provider.getDefaultConfig();
  assertEquals(debugInfo.directivePattern, config.params.two.directiveType.pattern);
  assertEquals(debugInfo.layerPattern, config.params.two.layerType.pattern);
});

Deno.test("Behavior: DefaultTypePatternProvider - Pattern Format Validation", () => {
  // Test that patterns follow expected regex format for value extraction

  const provider = new DefaultTypePatternProvider();
  const config = provider.getDefaultConfig();

  const directivePattern = config.params.two.directiveType.pattern;
  const layerPattern = config.params.two.layerType.pattern;

  // Patterns should follow the format: "^(value1|value2|value3)$"
  const expectedFormat = /^\^\(([^)]+)\)\$$/;

  assert(
    expectedFormat.test(directivePattern),
    `Directive pattern "${directivePattern}" should follow format ^(option1|option2)$`,
  );
  assert(
    expectedFormat.test(layerPattern),
    `Layer pattern "${layerPattern}" should follow format ^(option1|option2)$`,
  );

  // Extract values using the same logic as the provider
  const directiveMatch = directivePattern.match(expectedFormat);
  const layerMatch = layerPattern.match(expectedFormat);

  assertExists(directiveMatch, "Should extract directive values from pattern");
  assertExists(layerMatch, "Should extract layer values from pattern");

  const extractedDirectives = directiveMatch[1].split("|");
  const extractedLayers = layerMatch[1].split("|");

  // Should match provider's extraction
  assertEquals(
    JSON.stringify(extractedDirectives),
    JSON.stringify(provider.getValidDirectiveValues()),
  );
  assertEquals(JSON.stringify(extractedLayers), JSON.stringify(provider.getValidLayerValues()));
});

Deno.test("Behavior: DefaultTypePatternProvider - Multiple Instance Consistency", () => {
  // Test that multiple provider instances behave consistently

  const provider1 = new DefaultTypePatternProvider();
  const provider2 = new DefaultTypePatternProvider();

  // All methods should return equivalent results
  assertEquals(
    JSON.stringify(provider1.getValidDirectiveValues()),
    JSON.stringify(provider2.getValidDirectiveValues()),
  );

  assertEquals(
    JSON.stringify(provider1.getValidLayerValues()),
    JSON.stringify(provider2.getValidLayerValues()),
  );

  assertEquals(
    JSON.stringify(provider1.debug()),
    JSON.stringify(provider2.debug()),
  );

  // Patterns should behave identically
  const pattern1 = provider1.getDirectivePattern();
  const pattern2 = provider2.getDirectivePattern();

  if (pattern1 && pattern2) {
    const testValues = ["to", "summary", "defect", "invalid", "TO"];
    testValues.forEach((value) => {
      assertEquals(
        pattern1.test(value),
        pattern2.test(value),
        `Pattern test for "${value}" should be consistent across instances`,
      );
    });
  }
});

Deno.test("Behavior: DefaultTypePatternProvider - Edge Case Handling", () => {
  // Test edge case handling in value extraction

  const provider = new DefaultTypePatternProvider();

  // Normal case should work
  const directiveValues = provider.getValidDirectiveValues();
  const layerValues = provider.getValidLayerValues();

  assert(directiveValues.length > 0, "Should extract directive values");
  assert(layerValues.length > 0, "Should extract layer values");

  // Values should not contain pipe characters (would indicate parsing issue)
  directiveValues.forEach((value) => {
    assert(!value.includes("|"), `Directive value "${value}" should not contain pipe character`);
  });

  layerValues.forEach((value) => {
    assert(!value.includes("|"), `Layer value "${value}" should not contain pipe character`);
  });

  // Values should not be empty strings
  directiveValues.forEach((value) => {
    assert(value.length > 0, "Directive values should not be empty");
  });

  layerValues.forEach((value) => {
    assert(value.length > 0, "Layer values should not be empty");
  });
});

Deno.test("Behavior: DefaultTypePatternProvider - Case Sensitivity", () => {
  // Test case sensitivity behavior

  const provider = new DefaultTypePatternProvider();
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();

  assertExists(directivePattern);

  // LayerPattern is deprecated and should be null
  assertEquals(layerPattern, null, "Layer pattern should be null (deprecated)");

  // Test exact case matching with configuration-based values
  const validDirectives = provider.getValidDirectiveValues();
  const validLayers = provider.getValidLayerValues();
  
  if (validDirectives.length > 0) {
    const firstDirective = validDirectives[0];
    assert(directivePattern.test(firstDirective), `Should accept valid directive '${firstDirective}'`);
    assert(!directivePattern.test(firstDirective.toUpperCase()), `Should reject uppercase '${firstDirective.toUpperCase()}'`);
    assert(!directivePattern.test(firstDirective.charAt(0).toUpperCase() + firstDirective.slice(1)), `Should reject titlecase`);
  }

  // Test layer case sensitivity using validateLayerType method
  if (validLayers.length > 0) {
    const firstLayer = validLayers[0];
    assert(provider.validateLayerType(firstLayer), `Should accept valid layer '${firstLayer}'`);
    assert(!provider.validateLayerType(firstLayer.toUpperCase()), `Should reject uppercase '${firstLayer.toUpperCase()}'`);
    assert(!provider.validateLayerType(firstLayer.charAt(0).toUpperCase() + firstLayer.slice(1)), `Should reject titlecase`);
  }

  // Test mixed case
  assert(!directivePattern.test("Summary"), "Should reject mixed case 'Summary'");
  assert(!provider.validateLayerType("Issue"), "Should reject mixed case 'Issue'");
});

Deno.test("Behavior: DefaultTypePatternProvider - Whitespace Handling", () => {
  // Test whitespace handling behavior

  const provider = new DefaultTypePatternProvider();
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();

  assertExists(directivePattern);

  // LayerPattern is deprecated and should be null
  assertEquals(layerPattern, null, "Layer pattern should be null (deprecated)");

  // Should reject values with leading/trailing whitespace using configuration-based values
  const validDirectives = provider.getValidDirectiveValues();
  const validLayers = provider.getValidLayerValues();
  
  if (validDirectives.length > 0) {
    const firstDirective = validDirectives[0];
    assert(!directivePattern.test(` ${firstDirective}`), "Should reject leading space");
    assert(!directivePattern.test(`${firstDirective} `), "Should reject trailing space");
    assert(!directivePattern.test(` ${firstDirective} `), "Should reject surrounding spaces");
  }

  // Test layer whitespace handling using validateLayerType method
  if (validLayers.length > 0) {
    const firstLayer = validLayers[0];
    assert(!provider.validateLayerType(` ${firstLayer}`), "Should reject leading space");
    assert(!provider.validateLayerType(`${firstLayer} `), "Should reject trailing space");
    assert(!provider.validateLayerType(` ${firstLayer} `), "Should reject surrounding spaces");
  }

  // Should reject values with internal whitespace
  if (validDirectives.length >= 2) {
    assert(!directivePattern.test(`${validDirectives[0]} ${validDirectives[1]}`), "Should reject internal space");
  }
  if (validLayers.length >= 2) {
    assert(!provider.validateLayerType(`${validLayers[0]} ${validLayers[1]}`), "Should reject internal space");
  }
});

Deno.test("Behavior: DefaultTypePatternProvider - Provider State Independence", () => {
  // Test that provider methods don't depend on internal state

  const provider = new DefaultTypePatternProvider();

  // Multiple calls should return consistent results
  const directives1 = provider.getValidDirectiveValues();
  const directives2 = provider.getValidDirectiveValues();
  const directives3 = provider.getValidDirectiveValues();

  assertEquals(JSON.stringify(directives1), JSON.stringify(directives2));
  assertEquals(JSON.stringify(directives2), JSON.stringify(directives3));

  // Pattern creation should be consistent
  const pattern1 = provider.getDirectivePattern();
  const pattern2 = provider.getDirectivePattern();

  if (pattern1 && pattern2) {
    assertEquals(pattern1.getPattern(), pattern2.getPattern());
  }

  // Debug info should be consistent
  const debug1 = provider.debug();
  const debug2 = provider.debug();

  assertEquals(JSON.stringify(debug1), JSON.stringify(debug2));
});
