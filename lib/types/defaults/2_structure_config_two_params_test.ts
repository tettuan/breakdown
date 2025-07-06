/**
 * @fileoverview Structure tests for defaultConfigTwoParams
 * 
 * Tests the structural integrity and consistency of the default configuration
 * object, including cross-domain validation and system-wide consistency.
 */

import { assertEquals, assertExists, assertObjectMatch } from "../../../tests/deps.ts";
import { _defaultConfigTwoParams } from "./config_two_params.ts";

/**
 * Test suite for defaultConfigTwoParams structural integrity
 */
Deno.test("defaultConfigTwoParams - Structural Integrity", async (t) => {
  await t.step("should maintain consistent structure hierarchy", () => {
    const config = _defaultConfigTwoParams;
    
    // Test structure depth and consistency
    assertEquals(typeof config, "object");
    assertEquals(typeof config.params, "object");
    assertEquals(typeof config.params.two, "object");
    assertEquals(typeof config.params.two.demonstrativeType, "object");
    assertEquals(typeof config.params.two.layerType, "object");
    assertEquals(typeof config.params.two.validation, "object");
    
    // Test leaf node types
    assertEquals(typeof config.params.two.demonstrativeType.pattern, "string");
    assertEquals(typeof config.params.two.layerType.pattern, "string");
    assertEquals(Array.isArray(config.params.two.validation.allowedFlagOptions), true);
    assertEquals(Array.isArray(config.params.two.validation.allowedValueOptions), true);
    assertEquals(typeof config.params.two.validation.userVariableOption, "boolean");
    assertEquals(typeof config.params.two.validation.stdinAllowed, "boolean");
  });

  await t.step("should have symmetric pattern structure", () => {
    const demonstrativeType = _defaultConfigTwoParams.params.two.demonstrativeType;
    const layerType = _defaultConfigTwoParams.params.two.layerType;
    
    // Both types should have the same structure
    assertEquals(Object.keys(demonstrativeType), Object.keys(layerType));
    assertEquals(Object.keys(demonstrativeType), ["pattern"]);
    
    // Both patterns should follow the same format
    assertEquals(demonstrativeType.pattern.startsWith("^("), true);
    assertEquals(demonstrativeType.pattern.endsWith(")$"), true);
    assertEquals(layerType.pattern.startsWith("^("), true);
    assertEquals(layerType.pattern.endsWith(")$"), true);
  });

  await t.step("should maintain validation option structure consistency", () => {
    const validation = _defaultConfigTwoParams.params.two.validation;
    
    // Test required properties exist
    const requiredProperties = [
      "allowedFlagOptions",
      "allowedValueOptions", 
      "userVariableOption",
      "stdinAllowed"
    ];
    
    requiredProperties.forEach(prop => {
      assertExists(validation[prop as keyof typeof validation], `Property ${prop} should exist`);
    });
    
    // Test property types are consistent
    assertEquals(Array.isArray(validation.allowedFlagOptions), true);
    assertEquals(Array.isArray(validation.allowedValueOptions), true);
    assertEquals(typeof validation.userVariableOption, "boolean");
    assertEquals(typeof validation.stdinAllowed, "boolean");
  });
});

/**
 * Test suite for defaultConfigTwoParams cross-domain consistency
 */
Deno.test("defaultConfigTwoParams - Cross-Domain Consistency", async (t) => {
  await t.step("should be consistent with DirectiveType expectations", () => {
    const pattern = _defaultConfigTwoParams.params.two.demonstrativeType.pattern;
    
    // Extract values from pattern
    const match = pattern.match(/^\^\(([^)]+)\)\$$/);
    assertExists(match);
    const values = match[1].split("|");
    
    // Test that values match expected DirectiveType values
    assertEquals(values.includes("to"), true, "Should include 'to' directive");
    assertEquals(values.includes("summary"), true, "Should include 'summary' directive");
    assertEquals(values.includes("defect"), true, "Should include 'defect' directive");
    assertEquals(values.length, 3, "Should have exactly 3 directive types");
  });

  await t.step("should be consistent with LayerType expectations", () => {
    const pattern = _defaultConfigTwoParams.params.two.layerType.pattern;
    
    // Extract values from pattern
    const match = pattern.match(/^\^\(([^)]+)\)\$$/);
    assertExists(match);
    const values = match[1].split("|");
    
    // Test that values match expected LayerType values
    assertEquals(values.includes("project"), true, "Should include 'project' layer");
    assertEquals(values.includes("issue"), true, "Should include 'issue' layer");
    assertEquals(values.includes("task"), true, "Should include 'task' layer");
    assertEquals(values.length, 3, "Should have exactly 3 layer types");
  });

  await t.step("should be consistent with validation system expectations", () => {
    const validation = _defaultConfigTwoParams.params.two.validation;
    
    // Test expected value options for prompt generation system
    const expectedValueOptions = ["from", "destination", "input", "config"];
    expectedValueOptions.forEach(option => {
      assertEquals(validation.allowedValueOptions.includes(option), true, 
        `Should include ${option} in allowedValueOptions`);
    });
    
    // Test boolean options match system expectations
    assertEquals(validation.userVariableOption, true, "Should allow user variables");
    assertEquals(validation.stdinAllowed, true, "Should allow stdin input");
    assertEquals(validation.allowedFlagOptions.length, 0, "Should not have flag options by default");
  });
});

/**
 * Test suite for defaultConfigTwoParams serialization consistency
 */
Deno.test("defaultConfigTwoParams - Serialization Consistency", async (t) => {
  await t.step("should serialize and deserialize consistently", () => {
    const original = _defaultConfigTwoParams;
    
    // Test JSON serialization
    const serialized = JSON.stringify(original);
    const deserialized = JSON.parse(serialized);
    
    // Test structural equality
    assertEquals(deserialized.params.two.demonstrativeType.pattern, original.params.two.demonstrativeType.pattern);
    assertEquals(deserialized.params.two.layerType.pattern, original.params.two.layerType.pattern);
    assertEquals(deserialized.params.two.validation.allowedFlagOptions, original.params.two.validation.allowedFlagOptions);
    assertEquals(deserialized.params.two.validation.allowedValueOptions, original.params.two.validation.allowedValueOptions);
    assertEquals(deserialized.params.two.validation.userVariableOption, original.params.two.validation.userVariableOption);
    assertEquals(deserialized.params.two.validation.stdinAllowed, original.params.two.validation.stdinAllowed);
  });

  await t.step("should maintain object reference consistency", () => {
    const ref1 = _defaultConfigTwoParams;
    const ref2 = _defaultConfigTwoParams;
    
    // Test reference equality
    assertEquals(ref1 === ref2, true);
    assertEquals(ref1.params === ref2.params, true);
    assertEquals(ref1.params.two === ref2.params.two, true);
    assertEquals(ref1.params.two.validation === ref2.params.two.validation, true);
  });
});

/**
 * Test suite for defaultConfigTwoParams schema validation
 */
Deno.test("defaultConfigTwoParams - Schema Validation", async (t) => {
  await t.step("should conform to expected configuration schema", () => {
    const config = _defaultConfigTwoParams;
    
    // Test top-level schema
    assertObjectMatch(config, {
      params: {
        two: {
          demonstrativeType: { pattern: "^(to|summary|defect)$" },
          layerType: { pattern: "^(project|issue|task)$" },
          validation: {
            allowedFlagOptions: [],
            allowedValueOptions: ["from", "destination", "input", "config"],
            userVariableOption: true,
            stdinAllowed: true,
          }
        }
      }
    });
  });

  await t.step("should validate pattern format consistency", () => {
    const config = _defaultConfigTwoParams.params.two;
    
    // Test pattern format validation function
    const validatePatternFormat = (pattern: string): boolean => {
      const formatRegex = /^\^\([^)]+\)\$$/;
      return formatRegex.test(pattern);
    };
    
    assertEquals(validatePatternFormat(config.demonstrativeType.pattern), true);
    assertEquals(validatePatternFormat(config.layerType.pattern), true);
    
    // Test pattern content validation
    const extractValues = (pattern: string): string[] => {
      const match = pattern.match(/^\^\(([^)]+)\)\$$/);
      return match ? match[1].split("|") : [];
    };
    
    const demonstrativeValues = extractValues(config.demonstrativeType.pattern);
    const layerValues = extractValues(config.layerType.pattern);
    
    assertEquals(demonstrativeValues.length > 0, true);
    assertEquals(layerValues.length > 0, true);
    assertEquals(demonstrativeValues.every(v => v.length > 0), true);
    assertEquals(layerValues.every(v => v.length > 0), true);
  });

  await t.step("should validate array option consistency", () => {
    const validation = _defaultConfigTwoParams.params.two.validation;
    
    // Test array options don't contain duplicates
    const flagOptions = validation.allowedFlagOptions as string[];
    const valueOptions = validation.allowedValueOptions as string[];
    
    assertEquals(flagOptions.length, new Set(flagOptions).size, "allowedFlagOptions should not have duplicates");
    assertEquals(valueOptions.length, new Set(valueOptions).size, "allowedValueOptions should not have duplicates");
    
    // Test array options don't contain empty strings
    if (flagOptions.length > 0) {
      assertEquals(flagOptions.every(opt => opt.length > 0), true, "allowedFlagOptions should not contain empty strings");
    }
    assertEquals(valueOptions.every(opt => opt.length > 0), true, "allowedValueOptions should not contain empty strings");
  });
});