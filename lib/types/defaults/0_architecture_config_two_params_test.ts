/**
 * @fileoverview Architecture tests for defaultConfigTwoParams
 *
 * Tests the architectural constraints and structural integrity of the default
 * configuration object used throughout the type system.
 */

import { assertEquals, assertExists, assertObjectMatch } from "../../../tests/deps.ts";
import { _defaultConfigTwoParams } from "./config_two_params.ts";

/**
 * Test suite for defaultConfigTwoParams architecture validation
 */
Deno.test("defaultConfigTwoParams - Architecture Validation", async (t) => {
  await t.step("should have correct top-level structure", () => {
    assertExists(_defaultConfigTwoParams);
    assertExists(_defaultConfigTwoParams.params);
    assertExists(_defaultConfigTwoParams.params.two);
  });

  await t.step("should have directiveType configuration", () => {
    const directiveType = _defaultConfigTwoParams.params.two.directiveType;
    assertExists(directiveType);
    assertExists(directiveType.pattern);
    assertEquals(typeof directiveType.pattern, "string");
  });

  await t.step("should have layerType configuration", () => {
    const layerType = _defaultConfigTwoParams.params.two.layerType;
    assertExists(layerType);
    assertExists(layerType.pattern);
    assertEquals(typeof layerType.pattern, "string");
  });

  await t.step("should have required param configuration", () => {
    // The configuration now only contains param patterns, not validation properties
    const twoParams = _defaultConfigTwoParams.params.two;
    assertExists(twoParams);
    assertExists(twoParams.directiveType);
    assertExists(twoParams.layerType);
  });

  await t.step("should have correct param types", () => {
    const twoParams = _defaultConfigTwoParams.params.two;
    assertEquals(typeof twoParams.directiveType.pattern, "string");
    assertEquals(typeof twoParams.directiveType.errorMessage, "string");
    assertEquals(typeof twoParams.layerType.pattern, "string");
    assertEquals(typeof twoParams.layerType.errorMessage, "string");
  });

  await t.step("should have valid regex patterns", () => {
    const directivePattern = _defaultConfigTwoParams.params.two.directiveType.pattern;
    const layerPattern = _defaultConfigTwoParams.params.two.layerType.pattern;

    // Test patterns are valid regex - should not throw when creating RegExp
    try {
      new RegExp(directivePattern);
      new RegExp(layerPattern);
    } catch (e) {
      throw new Error(`Invalid regex pattern: ${e}`);
    }

    // Test patterns match expected format
    assertEquals(directivePattern.startsWith("^"), true);
    assertEquals(directivePattern.endsWith("$"), true);
    assertEquals(layerPattern.startsWith("^"), true);
    assertEquals(layerPattern.endsWith("$"), true);
  });

  await t.step("should have specific expected values", () => {
    const config = _defaultConfigTwoParams.params.two;

    // Test directiveType pattern contains expected values
    assertEquals(config.directiveType.pattern, "^(to|summary|defect|find|analyze|extract)$");

    // Test layerType pattern contains expected values
    assertEquals(config.layerType.pattern, "^(project|issue|task|component|module)$");
  });
});

/**
 * Test suite for defaultConfigTwoParams immutability
 */
Deno.test("defaultConfigTwoParams - Immutability Tests", async (t) => {
  await t.step("should maintain structural integrity", () => {
    const original = JSON.stringify(_defaultConfigTwoParams);

    // Try to modify (should not affect the original)
    try {
      // @ts-ignore - intentionally trying to modify
      _defaultConfigTwoParams.params.two.directiveType.pattern = "modified";
    } catch {
      // Expected to fail in strict mode
    }

    // Verify original structure is preserved
    const current = JSON.stringify(_defaultConfigTwoParams);
    assertEquals(original, current);
  });

  await t.step("should provide consistent references", () => {
    const ref1 = _defaultConfigTwoParams;
    const ref2 = _defaultConfigTwoParams;

    assertEquals(ref1 === ref2, true);
    assertEquals(ref1.params === ref2.params, true);
    assertEquals(ref1.params.two === ref2.params.two, true);
  });
});

/**
 * Test suite for defaultConfigTwoParams pattern validation
 */
Deno.test("defaultConfigTwoParams - Pattern Validation", async (t) => {
  await t.step("should validate directiveType pattern", () => {
    const pattern = new RegExp(_defaultConfigTwoParams.params.two.directiveType.pattern);

    // Valid values should match
    assertEquals(pattern.test("to"), true);
    assertEquals(pattern.test("summary"), true);
    assertEquals(pattern.test("defect"), true);

    // Invalid values should not match
    assertEquals(pattern.test("invalid"), false);
    assertEquals(pattern.test("TO"), false);
    assertEquals(pattern.test("summary2"), false);
    assertEquals(pattern.test(""), false);
    assertEquals(pattern.test("to|summary"), false);
  });

  await t.step("should validate layerType pattern", () => {
    const pattern = new RegExp(_defaultConfigTwoParams.params.two.layerType.pattern);

    // Valid values should match
    assertEquals(pattern.test("project"), true);
    assertEquals(pattern.test("issue"), true);
    assertEquals(pattern.test("task"), true);

    // Invalid values should not match
    assertEquals(pattern.test("invalid"), false);
    assertEquals(pattern.test("PROJECT"), false);
    assertEquals(pattern.test("task1"), false);
    assertEquals(pattern.test(""), false);
    assertEquals(pattern.test("project|issue"), false);
  });
});

/**
 * Test suite for defaultConfigTwoParams configuration structure
 */
Deno.test("defaultConfigTwoParams - Configuration Structure", async (t) => {
  await t.step("should have required directiveType configuration", () => {
    const directiveType = _defaultConfigTwoParams.params.two.directiveType;
    assertExists(directiveType);
    assertExists(directiveType.pattern);
    assertExists(directiveType.errorMessage);
    assertEquals(typeof directiveType.pattern, "string");
    assertEquals(typeof directiveType.errorMessage, "string");
  });

  await t.step("should have required layerType configuration", () => {
    const layerType = _defaultConfigTwoParams.params.two.layerType;
    assertExists(layerType);
    assertExists(layerType.pattern);
    assertExists(layerType.errorMessage);
    assertEquals(typeof layerType.pattern, "string");
    assertEquals(typeof layerType.errorMessage, "string");
  });

  await t.step("should have valid configuration structure", () => {
    assertExists(_defaultConfigTwoParams.params);
    assertExists(_defaultConfigTwoParams.params.two);
    assertEquals(typeof _defaultConfigTwoParams, "object");
  });
});
