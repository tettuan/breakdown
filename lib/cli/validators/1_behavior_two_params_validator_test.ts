/**
 * Behavior tests for TwoParamsValidator
 *
 * Tests functional behavior and business logic:
 * - Parameter validation behavior
 * - Error message clarity and helpfulness
 * - Edge case handling
 * - Valid type recognition
 * - Invalid type rejection
 *
 * @module cli/validators/two_params_validator_behavior_test
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  TwoParamsValidator,
  type ValidatedParams as _ValidatedParams,
  type ValidationError as _ValidationError,
} from "./two_params_validator_ddd.ts";

const logger = new BreakdownLogger("two-params-validator-behavior");

describe("Behavior: Valid Parameter Recognition", () => {
  it("should accept all valid directive types", () => {
    logger.debug("Testing valid directive type recognition");

    const validator = new TwoParamsValidator();
    const validDirectiveTypes = ["to", "summary", "defect", "init", "find"];

    for (const directiveType of validDirectiveTypes) {
      const result = validator.validate([directiveType, "project"]);
      assertEquals(
        result.ok,
        true,
        `Should accept valid directive type: ${directiveType}`,
      );

      if (result.ok) {
        assertEquals(
          result.data.directiveType,
          directiveType,
          `Should return correct directive type: ${directiveType}`,
        );
      }
    }

    logger.debug("Valid directive type recognition completed");
  });

  it("should accept all valid layer types", () => {
    logger.debug("Testing valid layer type recognition");

    const validator = new TwoParamsValidator();
    const validLayerTypes = ["project", "issue", "task", "bugs", "temp"];

    for (const layerType of validLayerTypes) {
      const result = validator.validate(["to", layerType]);
      assertEquals(
        result.ok,
        true,
        `Should accept valid layer type: ${layerType}`,
      );

      if (result.ok) {
        assertEquals(
          result.data.layerType,
          layerType,
          `Should return correct layer type: ${layerType}`,
        );
      }
    }

    logger.debug("Valid layer type recognition completed");
  });

  it("should accept valid combinations of directive and layer types", () => {
    logger.debug("Testing valid combination recognition");

    const validator = new TwoParamsValidator();
    const validCombinations = [
      ["to", "project"],
      ["summary", "issue"],
      ["defect", "task"],
      ["init", "bugs"],
      ["find", "temp"],
      ["to", "bugs"],
      ["summary", "project"],
    ];

    for (const [directiveType, layerType] of validCombinations) {
      const result = validator.validate([directiveType, layerType]);
      assertEquals(
        result.ok,
        true,
        `Should accept valid combination: ${directiveType} ${layerType}`,
      );

      if (result.ok) {
        assertEquals(
          result.data.directiveType,
          directiveType,
          `Should return correct directive type for combination: ${directiveType} ${layerType}`,
        );
        assertEquals(
          result.data.layerType,
          layerType,
          `Should return correct layer type for combination: ${directiveType} ${layerType}`,
        );
      }
    }

    logger.debug("Valid combination recognition completed");
  });
});

describe("Behavior: Invalid Parameter Rejection", () => {
  it("should reject insufficient parameters", () => {
    logger.debug("Testing insufficient parameter rejection");

    const validator = new TwoParamsValidator();

    // Empty array
    const emptyResult = validator.validate([]);
    assertEquals(emptyResult.ok, false, "Should reject empty parameter array");
    if (!emptyResult.ok) {
      const error = emptyResult.error;
      assertEquals(error.kind, "InvalidParameterCount", "Should identify parameter count error");
      if (error.kind === "InvalidParameterCount") {
        assertEquals(error.received, 0, "Should report received count as 0");
        assertEquals(error.expected, 2, "Should report expected count as 2");
      }
    }

    // Single parameter
    const singleResult = validator.validate(["to"]);
    assertEquals(singleResult.ok, false, "Should reject single parameter");
    if (!singleResult.ok) {
      const error = singleResult.error;
      assertEquals(error.kind, "InvalidParameterCount", "Should identify parameter count error");
      if (error.kind === "InvalidParameterCount") {
        assertEquals(error.received, 1, "Should report received count as 1");
        assertEquals(error.expected, 2, "Should report expected count as 2");
      }
    }

    logger.debug("Insufficient parameter rejection completed");
  });

  it("should reject invalid directive types", () => {
    logger.debug("Testing invalid directive type rejection");

    const validator = new TwoParamsValidator();
    const invalidDirectiveTypes = [
      "invalid",
      "generate",
      "create",
      "build",
      "test",
      "TO",
      "SUMMARY",
      "123",
      "",
      " ",
      "to_project",
    ];

    for (const invalidType of invalidDirectiveTypes) {
      const result = validator.validate([invalidType, "project"]);
      assertEquals(
        result.ok,
        false,
        `Should reject invalid directive type: "${invalidType}"`,
      );

      if (!result.ok) {
        const error = result.error;
        assertEquals(
          error.kind,
          "InvalidDirectiveType",
          `Should identify directive type error for: "${invalidType}"`,
        );
        if (error.kind === "InvalidDirectiveType") {
          assertEquals(
            error.value,
            invalidType,
            `Should report invalid value: "${invalidType}"`,
          );
          assertExists(
            error.validTypes,
            "Should provide valid types list",
          );
          assertEquals(
            error.validTypes.length > 0,
            true,
            "Should provide non-empty valid types list",
          );
        }
      }
    }

    logger.debug("Invalid directive type rejection completed");
  });

  it("should reject invalid layer types", () => {
    logger.debug("Testing invalid layer type rejection");

    const validator = new TwoParamsValidator();
    const invalidLayerTypes = [
      "invalid",
      "component",
      "module",
      "service",
      "controller",
      "PROJECT",
      "ISSUE",
      "456",
      "",
      " ",
      "project_task",
    ];

    for (const invalidType of invalidLayerTypes) {
      const result = validator.validate(["to", invalidType]);
      assertEquals(
        result.ok,
        false,
        `Should reject invalid layer type: "${invalidType}"`,
      );

      if (!result.ok) {
        const error = result.error;
        assertEquals(
          error.kind,
          "InvalidLayerType",
          `Should identify layer type error for: "${invalidType}"`,
        );
        if (error.kind === "InvalidLayerType") {
          assertEquals(
            error.value,
            invalidType,
            `Should report invalid value: "${invalidType}"`,
          );
          assertExists(
            error.validTypes,
            "Should provide valid types list",
          );
          assertEquals(
            error.validTypes.length > 0,
            true,
            "Should provide non-empty valid types list",
          );
        }
      }
    }

    logger.debug("Invalid layer type rejection completed");
  });

  it("should reject when both parameters are invalid", () => {
    logger.debug("Testing both parameters invalid rejection");

    const validator = new TwoParamsValidator();

    // First invalid parameter should be caught first
    const result = validator.validate(["invalid_demo", "invalid_layer"]);
    assertEquals(result.ok, false, "Should reject when both parameters are invalid");

    if (!result.ok) {
      // Should catch the first validation error (directive type)
      const error = result.error;
      assertEquals(
        error.kind,
        "InvalidDirectiveType",
        "Should catch directive type error first",
      );
      if (error.kind === "InvalidDirectiveType") {
        assertEquals(
          error.value,
          "invalid_demo",
          "Should report the invalid directive type",
        );
      }
    }

    logger.debug("Both parameters invalid rejection completed");
  });
});

describe("Behavior: Edge Case Handling", () => {
  it("should handle excess parameters gracefully", () => {
    logger.debug("Testing excess parameter handling");

    const validator = new TwoParamsValidator();

    // Extra parameters should be ignored
    const result = validator.validate(["to", "project", "extra", "more", "params"]);
    assertEquals(
      result.ok,
      true,
      "Should accept valid parameters and ignore extras",
    );

    if (result.ok) {
      assertEquals(
        result.data.directiveType,
        "to",
        "Should use first parameter as directive type",
      );
      assertEquals(
        result.data.layerType,
        "project",
        "Should use second parameter as layer type",
      );
    }

    logger.debug("Excess parameter handling completed");
  });

  it("should handle whitespace and special characters", () => {
    logger.debug("Testing whitespace and special character handling");

    const validator = new TwoParamsValidator();

    // Whitespace variations
    const whitespaceTests = [
      [" to", "project"], // leading space
      ["to ", "project"], // trailing space
      ["to", " project"], // leading space in second param
      ["to", "project "], // trailing space in second param
    ];

    for (const [demoType, layerType] of whitespaceTests) {
      const result = validator.validate([demoType, layerType]);
      assertEquals(
        result.ok,
        false,
        `Should reject parameters with whitespace: "${demoType}", "${layerType}"`,
      );
    }

    // Special characters
    const specialCharTests = [
      ["to-project", "project"],
      ["to_summary", "project"],
      ["to.find", "project"],
      ["to", "project-task"],
    ];

    for (const [demoType, layerType] of specialCharTests) {
      const result = validator.validate([demoType, layerType]);
      assertEquals(
        result.ok,
        false,
        `Should reject parameters with special characters: "${demoType}", "${layerType}"`,
      );
    }

    logger.debug("Whitespace and special character handling completed");
  });

  it("should be case sensitive", () => {
    logger.debug("Testing case sensitivity");

    const validator = new TwoParamsValidator();

    // Uppercase variations should be rejected
    const caseTests = [
      ["TO", "project"],
      ["To", "project"],
      ["tO", "project"],
      ["to", "PROJECT"],
      ["to", "Project"],
      ["SUMMARY", "ISSUE"],
    ];

    for (const [demoType, layerType] of caseTests) {
      const result = validator.validate([demoType, layerType]);
      assertEquals(
        result.ok,
        false,
        `Should be case sensitive and reject: "${demoType}", "${layerType}"`,
      );
    }

    logger.debug("Case sensitivity testing completed");
  });
});

describe("Behavior: Error Message Quality", () => {
  it("should provide helpful error messages for parameter count", () => {
    logger.debug("Testing parameter count error message quality");

    const validator = new TwoParamsValidator();
    const result = validator.validate([]);

    if (!result.ok && result.error.kind === "InvalidParameterCount") {
      assertEquals(
        typeof result.error.received,
        "number",
        "Should provide received count as number",
      );
      assertEquals(
        typeof result.error.expected,
        "number",
        "Should provide expected count as number",
      );
      assertEquals(
        result.error.expected,
        2,
        "Should clearly indicate 2 parameters are expected",
      );
    }

    logger.debug("Parameter count error message quality verified");
  });

  it("should provide helpful error messages for invalid types", () => {
    logger.debug("Testing invalid type error message quality");

    const validator = new TwoParamsValidator();

    // Test directive type error message
    const directiveResult = validator.validate(["invalid", "project"]);
    if (!directiveResult.ok && directiveResult.error.kind === "InvalidDirectiveType") {
      const error = directiveResult.error;
      assertEquals(
        error.validTypes.includes("to"),
        true,
        "Should include 'to' in valid directive types",
      );
      assertEquals(
        error.validTypes.includes("summary"),
        true,
        "Should include 'summary' in valid directive types",
      );
      assertEquals(
        error.validTypes.length >= 3,
        true,
        "Should provide multiple valid directive type options",
      );
    }

    // Test layer type error message
    const layerResult = validator.validate(["to", "invalid"]);
    if (!layerResult.ok && layerResult.error.kind === "InvalidLayerType") {
      const error = layerResult.error;
      assertEquals(
        error.validTypes.includes("project"),
        true,
        "Should include 'project' in valid layer types",
      );
      assertEquals(
        error.validTypes.includes("issue"),
        true,
        "Should include 'issue' in valid layer types",
      );
      assertEquals(
        error.validTypes.length >= 3,
        true,
        "Should provide multiple valid layer type options",
      );
    }

    logger.debug("Invalid type error message quality verified");
  });

  it("should preserve original invalid values in error messages", () => {
    logger.debug("Testing error message value preservation");

    const validator = new TwoParamsValidator();
    const invalidValue = "user_entered_invalid_value";

    const result = validator.validate([invalidValue, "project"]);
    if (!result.ok && result.error.kind === "InvalidDirectiveType") {
      const error = result.error;
      assertEquals(
        error.value,
        invalidValue,
        "Should preserve exact user input in error message",
      );
    }

    logger.debug("Error message value preservation verified");
  });
});
