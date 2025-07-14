/**
 * @fileoverview Behavior tests for defaultConfigTwoParams
 *
 * Tests the behavioral aspects of the default configuration object,
 * including pattern matching, validation behavior, and runtime characteristics.
 */

import { assertEquals, assertExists } from "../../../tests/deps.ts";
import { _defaultConfigTwoParams } from "./config_two_params.ts";
import { error, ok, type Result } from "../result.ts";
import { DirectiveType, LayerType } from "../mod.ts";
import type { TwoParams_Result } from "../../deps.ts";

/**
 * Test suite for defaultConfigTwoParams runtime behavior
 */
Deno.test("defaultConfigTwoParams - Runtime Behavior", async (t) => {
  await t.step("should support pattern-based validation", () => {
    const config = _defaultConfigTwoParams.params.two;

    // Test directiveType pattern behavior
    const directiveRegex = new RegExp(config.DirectiveType.pattern);
    const validDirective = ["to", "summary", "defect", "find"];
    const invalidDirective = ["invalid", "TO", "summary2", ""];

    validDirective.forEach((value) => {
      assertEquals(directiveRegex.test(value), true, `${value} should match directiveType pattern`);
    });

    invalidDirective.forEach((value) => {
      assertEquals(
        directiveRegex.test(value),
        false,
        `${value} should not match directiveType pattern`,
      );
    });

    // Test layerType pattern behavior
    const layerRegex = new RegExp(config.layerType.pattern);
    const validLayer = ["project", "issue", "task", "bugs"];
    const invalidLayer = ["invalid", "PROJECT", "task1", ""];

    validLayer.forEach((value) => {
      assertEquals(layerRegex.test(value), true, `${value} should match layerType pattern`);
    });

    invalidLayer.forEach((value) => {
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

    // Test directiveType pattern extraction
    const directiveMatch = config.DirectiveType.pattern.match(/^\^\(([^)]+)\)\$$/);
    assertExists(directiveMatch);
    assertEquals(directiveMatch[1], "to|summary|defect|find");

    const directiveValues = directiveMatch[1].split("|");
    assertEquals(directiveValues.length, 4);
    assertEquals(directiveValues, ["to", "summary", "defect", "find"]);

    // Test layerType pattern extraction
    const layerMatch = config.layerType.pattern.match(/^\^\(([^)]+)\)\$$/);
    assertExists(layerMatch);
    assertEquals(layerMatch[1], "project|issue|task|bugs");

    const layerValues = layerMatch[1].split("|");
    assertEquals(layerValues.length, 4);
    assertEquals(layerValues, ["project", "issue", "task", "bugs"]);
  });

  await t.step("should support deep object traversal", () => {
    // Test nested access patterns
    const paths = [
      ["params", "two", "directiveType", "pattern"],
      ["params", "two", "layerType", "pattern"],
      ["params", "two", "validation", "allowedFlagOptions"],
      ["params", "two", "validation", "allowedValueOptions"],
      ["params", "two", "validation", "userVariableOption"],
      ["params", "two", "validation", "stdinAllowed"],
    ];

    paths.forEach((path) => {
      let current: Record<string, unknown> = _defaultConfigTwoParams;
      for (const key of path) {
        assertExists(current[key], `Path ${path.join(".")} should exist`);
        current = current[key] as Record<string, unknown>;
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
    const getDirectivePattern = () => config.params.two.DirectiveType.pattern;
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
          DirectiveType: {
            ...config.params.two.DirectiveType,
            pattern: "^(custom|pattern)$",
          },
        },
      },
    };

    // Verify original is unchanged
    assertEquals(config.params.two.DirectiveType.pattern, "^(to|summary|defect|find)$");

    // Verify custom config has new pattern
    assertEquals(customConfig.params.two.DirectiveType.pattern, "^(custom|pattern)$");

    // Verify other properties are preserved
    assertEquals(customConfig.params.two.layerType.pattern, "^(project|issue|task|bugs)$");
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
    const directivePattern = config.params.two.DirectiveType.pattern;
    const layerPattern = config.params.two.layerType.pattern;

    // Verify patterns are properly formatted
    assertEquals(directivePattern.startsWith("^("), true);
    assertEquals(directivePattern.endsWith(")$"), true);
    assertEquals(layerPattern.startsWith("^("), true);
    assertEquals(layerPattern.endsWith(")$"), true);

    // Test that patterns don't have common regex pitfalls
    assertEquals(directivePattern.includes(".*"), false);
    assertEquals(layerPattern.includes(".*"), false);
    assertEquals(directivePattern.includes("\\"), false);
    assertEquals(layerPattern.includes("\\"), false);
  });
});

/**
 * Test suite for Result type usage with configuration
 */
Deno.test("defaultConfigTwoParams - Result Type Integration", async (t) => {
  await t.step("should validate directive string values with Result", () => {
    const config = _defaultConfigTwoParams;
    const pattern = config.params.two.DirectiveType.pattern;

    // Helper function to simulate directive validation
    const validateDirectiveString = (value: string): Result<string, string> => {
      const regex = new RegExp(pattern);
      if (regex.test(value)) {
        return ok(value);
      }
      return error(`Invalid directive type: ${value}`);
    };

    // Test valid values
    const validResult1 = validateDirectiveString("to");
    assertEquals(validResult1.ok, true);
    if (validResult1.ok) {
      assertEquals(validResult1.data, "to");
    }

    const validResult2 = validateDirectiveString("summary");
    assertEquals(validResult2.ok, true);
    if (validResult2.ok) {
      assertEquals(validResult2.data, "summary");
    }

    // Test invalid values
    const invalidResult = validateDirectiveString("invalid");
    assertEquals(invalidResult.ok, false);
    if (!invalidResult.ok) {
      assertEquals(invalidResult.error, "Invalid directive type: invalid");
    }
  });

  await t.step("should validate layer string values with Result", () => {
    const config = _defaultConfigTwoParams;
    const pattern = config.params.two.layerType.pattern;

    // Helper function to simulate layer validation
    const validateLayerString = (value: string): Result<string, string> => {
      const regex = new RegExp(pattern);
      if (regex.test(value)) {
        return ok(value);
      }
      return error(`Invalid layer type: ${value}`);
    };

    // Test valid values
    const validResult1 = validateLayerString("project");
    assertEquals(validResult1.ok, true);
    if (validResult1.ok) {
      assertEquals(validResult1.data, "project");
    }

    const validResult2 = validateLayerString("task");
    assertEquals(validResult2.ok, true);
    if (validResult2.ok) {
      assertEquals(validResult2.data, "task");
    }

    // Test invalid values
    const invalidResult = validateLayerString("TASK");
    assertEquals(invalidResult.ok, false);
    if (!invalidResult.ok) {
      assertEquals(invalidResult.error, "Invalid layer type: TASK");
    }
  });

  await t.step("should validate DirectiveType and LayerType with TwoParams_Result", () => {
    const config = _defaultConfigTwoParams;

    // Helper function to validate both types and create domain objects
    const validateAndCreateTypes = (
      directive: string,
      layer: string,
    ): Result<{ directive: DirectiveType; layer: LayerType }, string> => {
      const directiveRegex = new RegExp(config.params.two.DirectiveType.pattern);
      const layerRegex = new RegExp(config.params.two.layerType.pattern);

      if (!directiveRegex.test(directive)) {
        return error(`Invalid directive type: ${directive}`);
      }

      if (!layerRegex.test(layer)) {
        return error(`Invalid layer type: ${layer}`);
      }

      // Create TwoParams_Result for DirectiveType and LayerType creation
      const twoParamsResult: TwoParams_Result = {
        type: "two",
    directiveType: "to",
        directiveType: directive,
        layerType: layer,
        params: [directive, layer],
        options: {},
      };

      const directiveType = DirectiveType.create(twoParamsResult.directiveType);
      const layerType = LayerType.create(twoParamsResult.layerType);

      // Check if both types were created successfully
      if (!directiveType.ok) {
        return error(`Failed to create DirectiveType: ${JSON.stringify(directiveType.error)}`);
      }

      if (!layerType.ok) {
        return error(`Failed to create LayerType: ${JSON.stringify(layerType.error)}`);
      }

      return ok({
        directive: directiveType.data,
        layer: layerType.data,
      });
    };

    // Test valid combination
    const validResult = validateAndCreateTypes("to", "project");
    assertEquals(validResult.ok, true);
    if (validResult.ok) {
      assertEquals(validResult.data.directive.value, "to");
      assertEquals(validResult.data.layer.value, "project");
    }

    // Test invalid directive
    const invalidDirective = validateAndCreateTypes("invalid", "project");
    assertEquals(invalidDirective.ok, false);
    if (!invalidDirective.ok) {
      assertEquals(invalidDirective.error, "Invalid directive type: invalid");
    }

    // Test invalid layer
    const invalidLayer = validateAndCreateTypes("to", "invalid");
    assertEquals(invalidLayer.ok, false);
    if (!invalidLayer.ok) {
      assertEquals(invalidLayer.error, "Invalid layer type: invalid");
    }
  });
});
