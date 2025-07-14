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

  await t.step("should have DirectiveType configuration", () => {
    const directiveType = _defaultConfigTwoParams.params.two.DirectiveType;
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

  await t.step("should have validation configuration", () => {
    const validation = _defaultConfigTwoParams.params.two.validation;
    assertExists(validation);
    assertExists(validation.allowedFlagOptions);
    assertExists(validation.allowedValueOptions);
    assertExists(validation.userVariableOption);
    assertExists(validation.stdinAllowed);
  });

  await t.step("should have correct validation option types", () => {
    const validation = _defaultConfigTwoParams.params.two.validation;
    assertEquals(Array.isArray(validation.allowedFlagOptions), true);
    assertEquals(Array.isArray(validation.allowedValueOptions), true);
    assertEquals(typeof validation.userVariableOption, "boolean");
    assertEquals(typeof validation.stdinAllowed, "boolean");
  });

  await t.step("should have valid regex patterns", () => {
    const directivePattern = _defaultConfigTwoParams.params.two.DirectiveType.pattern;
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
    assertEquals(config.DirectiveType.pattern, "^(to|summary|defect|find)$");

    // Test layerType pattern contains expected values
    assertEquals(config.layerType.pattern, "^(project|issue|task|bugs)$");

    // Test validation configuration
    assertObjectMatch(config.validation, {
      allowedFlagOptions: [],
      allowedValueOptions: ["from", "destination", "input", "config"],
      userVariableOption: true,
      stdinAllowed: true,
    });
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
      _defaultConfigTwoParams.params.two.DirectiveType.pattern = "modified";
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
    const pattern = new RegExp(_defaultConfigTwoParams.params.two.DirectiveType.pattern);

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
 * Test suite for defaultConfigTwoParams validation options
 */
Deno.test("defaultConfigTwoParams - Validation Options", async (t) => {
  await t.step("should have empty allowedFlagOptions", () => {
    const flagOptions = _defaultConfigTwoParams.params.two.validation.allowedFlagOptions;
    assertEquals(Array.isArray(flagOptions), true);
    assertEquals(flagOptions.length, 0);
  });

  await t.step("should have expected allowedValueOptions", () => {
    const valueOptions = _defaultConfigTwoParams.params.two.validation.allowedValueOptions;
    assertEquals(Array.isArray(valueOptions), true);
    assertEquals(valueOptions.length, 4);
    assertEquals(valueOptions.includes("from"), true);
    assertEquals(valueOptions.includes("destination"), true);
    assertEquals(valueOptions.includes("input"), true);
    assertEquals(valueOptions.includes("config"), true);
  });

  await t.step("should have correct boolean options", () => {
    const validation = _defaultConfigTwoParams.params.two.validation;
    assertEquals(validation.userVariableOption, true);
    assertEquals(validation.stdinAllowed, true);
  });
});
