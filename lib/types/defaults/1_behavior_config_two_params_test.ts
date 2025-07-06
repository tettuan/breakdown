/**
 * @fileoverview Behavior tests for defaultConfigTwoParams
 * 
 * Tests the behavioral aspects of the default configuration object,
 * including pattern matching, validation behavior, and runtime characteristics.
 */

import { assertEquals, assertExists } from "../../../tests/deps.ts";
import { _defaultConfigTwoParams } from "./config_two_params.ts";

/**
 * Test suite for defaultConfigTwoParams runtime behavior
 */
Deno.test("defaultConfigTwoParams - Runtime Behavior", async (t) => {
  await t.step("should support pattern-based validation", () => {
    const config = _defaultConfigTwoParams.params.two;
    
    // Test demonstrativeType pattern behavior
    const demonstrativeRegex = new RegExp(config.demonstrativeType.pattern);
    const validDemonstrative = ["to", "summary", "defect"];
    const invalidDemonstrative = ["invalid", "TO", "summary2", ""];
    
    validDemonstrative.forEach(value => {
      assertEquals(demonstrativeRegex.test(value), true, `${value} should match demonstrativeType pattern`);
    });
    
    invalidDemonstrative.forEach(value => {
      assertEquals(demonstrativeRegex.test(value), false, `${value} should not match demonstrativeType pattern`);
    });
    
    // Test layerType pattern behavior
    const layerRegex = new RegExp(config.layerType.pattern);
    const validLayer = ["project", "issue", "task"];
    const invalidLayer = ["invalid", "PROJECT", "task1", ""];
    
    validLayer.forEach(value => {
      assertEquals(layerRegex.test(value), true, `${value} should match layerType pattern`);
    });
    
    invalidLayer.forEach(value => {
      assertEquals(layerRegex.test(value), false, `${value} should not match layerType pattern`);
    });
  });

  await t.step("should support validation option checking", () => {
    const validation = _defaultConfigTwoParams.params.two.validation;
    
    // Test allowedValueOptions behavior
    const allowedOptions = validation.allowedValueOptions;
    assertEquals(allowedOptions.includes("from"), true);
    assertEquals(allowedOptions.includes("destination"), true);
    assertEquals(allowedOptions.includes("input"), true);
    assertEquals(allowedOptions.includes("config"), true);
    assertEquals(allowedOptions.includes("invalid"), false);
    
    // Test boolean options behavior
    assertEquals(validation.userVariableOption, true);
    assertEquals(validation.stdinAllowed, true);
  });

  await t.step("should maintain pattern extraction capability", () => {
    const config = _defaultConfigTwoParams.params.two;
    
    // Test demonstrativeType pattern extraction
    const demonstrativeMatch = config.demonstrativeType.pattern.match(/^\^\(([^)]+)\)\$$/);
    assertExists(demonstrativeMatch);
    assertEquals(demonstrativeMatch[1], "to|summary|defect");
    
    const demonstrativeValues = demonstrativeMatch[1].split("|");
    assertEquals(demonstrativeValues.length, 3);
    assertEquals(demonstrativeValues, ["to", "summary", "defect"]);
    
    // Test layerType pattern extraction
    const layerMatch = config.layerType.pattern.match(/^\^\(([^)]+)\)\$$/);
    assertExists(layerMatch);
    assertEquals(layerMatch[1], "project|issue|task");
    
    const layerValues = layerMatch[1].split("|");
    assertEquals(layerValues.length, 3);
    assertEquals(layerValues, ["project", "issue", "task"]);
  });

  await t.step("should support deep object traversal", () => {
    // Test nested access patterns
    const paths = [
      ["params", "two", "demonstrativeType", "pattern"],
      ["params", "two", "layerType", "pattern"],
      ["params", "two", "validation", "allowedFlagOptions"],
      ["params", "two", "validation", "allowedValueOptions"],
      ["params", "two", "validation", "userVariableOption"],
      ["params", "two", "validation", "stdinAllowed"],
    ];
    
    paths.forEach(path => {
      let current: any = _defaultConfigTwoParams;
      for (const key of path) {
        assertExists(current[key], `Path ${path.join(".")} should exist`);
        current = current[key];
      }
    });
  });
});

/**
 * Test suite for defaultConfigTwoParams integration behavior
 */
Deno.test("defaultConfigTwoParams - Integration Behavior", async (t) => {
  await t.step("should work with TypePatternProvider interface", () => {
    const config = _defaultConfigTwoParams;
    
    // Simulate TypePatternProvider behavior
    const getDirectivePattern = () => config.params.two.demonstrativeType.pattern;
    const getLayerTypePattern = () => config.params.two.layerType.pattern;
    
    assertEquals(typeof getDirectivePattern(), "string");
    assertEquals(typeof getLayerTypePattern(), "string");
    
    // Test patterns are valid for RegExp construction
    const directiveRegex = new RegExp(getDirectivePattern());
    const layerRegex = new RegExp(getLayerTypePattern());
    
    assertEquals(directiveRegex instanceof RegExp, true);
    assertEquals(layerRegex instanceof RegExp, true);
  });

  await t.step("should support configuration merging scenarios", () => {
    const config = _defaultConfigTwoParams;
    
    // Test that the configuration can be used as a base for merging
    const customConfig = {
      ...config,
      params: {
        ...config.params,
        two: {
          ...config.params.two,
          demonstrativeType: {
            ...config.params.two.demonstrativeType,
            pattern: "^(custom|pattern)$"
          }
        }
      }
    };
    
    // Verify original is unchanged
    assertEquals(config.params.two.demonstrativeType.pattern, "^(to|summary|defect)$");
    
    // Verify custom config has new pattern
    assertEquals(customConfig.params.two.demonstrativeType.pattern, "^(custom|pattern)$");
    
    // Verify other properties are preserved
    assertEquals(customConfig.params.two.layerType.pattern, "^(project|issue|task)$");
    assertEquals(customConfig.params.two.validation.userVariableOption, true);
  });

  await t.step("should support validation option filtering", () => {
    const validation = _defaultConfigTwoParams.params.two.validation;
    
    // Test filtering behavior
    const isValidOption = (option: string) => validation.allowedValueOptions.includes(option);
    
    assertEquals(isValidOption("from"), true);
    assertEquals(isValidOption("destination"), true);
    assertEquals(isValidOption("input"), true);
    assertEquals(isValidOption("config"), true);
    assertEquals(isValidOption("invalid"), false);
    assertEquals(isValidOption(""), false);
    
    // Test boolean option checking
    assertEquals(validation.userVariableOption, true);
    assertEquals(validation.stdinAllowed, true);
  });
});

/**
 * Test suite for defaultConfigTwoParams error handling behavior
 */
Deno.test("defaultConfigTwoParams - Error Handling", async (t) => {
  await t.step("should handle invalid pattern access gracefully", () => {
    const config = _defaultConfigTwoParams;
    
    // Test accessing non-existent properties
    // @ts-ignore - intentionally accessing invalid property
    assertEquals(config.params.two.invalidType, undefined);
    
    // @ts-ignore - intentionally accessing invalid property
    assertEquals(config.params.two.validation.invalidOption, undefined);
  });

  await t.step("should handle pattern parsing edge cases", () => {
    const config = _defaultConfigTwoParams;
    
    // Test pattern format validation
    const demonstrativePattern = config.params.two.demonstrativeType.pattern;
    const layerPattern = config.params.two.layerType.pattern;
    
    // Verify patterns are properly formatted
    assertEquals(demonstrativePattern.startsWith("^("), true);
    assertEquals(demonstrativePattern.endsWith(")$"), true);
    assertEquals(layerPattern.startsWith("^("), true);
    assertEquals(layerPattern.endsWith(")$"), true);
    
    // Test that patterns don't have common regex pitfalls
    assertEquals(demonstrativePattern.includes(".*"), false);
    assertEquals(layerPattern.includes(".*"), false);
    assertEquals(demonstrativePattern.includes("\\"), false);
    assertEquals(layerPattern.includes("\\"), false);
  });
});