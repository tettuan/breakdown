/**
 * @fileoverview Behavior tests for TwoParams domain object
 *
 * Tests functional behavior and business logic:
 * - Property-based testing with random values
 * - Rule-based validation behavior
 * - Boundary value analysis
 * - Edge case validation
 * - Error handling consistency
 *
 * @module types/two_params_behavior_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { TwoParams } from "./two_params.ts";
import { ConfigProfileName } from "./config_profile_name.ts";

const logger = new BreakdownLogger("two-params-behavior");

// ============================================================================
// Test Data - Rule-based patterns from config
// ============================================================================

/**
 * Valid DirectiveType values based on default configuration
 * Pattern: "^(to|summary|defect|find)$"
 */
const VALID_DIRECTIVE_TYPES = ["to", "summary", "defect", "find"] as const;

/**
 * Valid LayerType values based on default configuration
 * Pattern: "^(project|issue|task|bugs)$"
 */
const VALID_LAYER_TYPES = ["project", "issue", "task", "bugs"] as const;

/**
 * Valid combinations based on business rules in LayerType.isValidForDirective
 */
const VALID_COMBINATIONS = [
  // "to" directive supports all layers
  { directive: "to", layer: "project" },
  { directive: "to", layer: "issue" },
  { directive: "to", layer: "task" },
  { directive: "to", layer: "bugs" },

  // "summary" directive supports project, issue, task (but not bugs)
  { directive: "summary", layer: "project" },
  { directive: "summary", layer: "issue" },
  { directive: "summary", layer: "task" },

  // "defect" directive supports bugs, issue, task (but not project)
  { directive: "defect", layer: "bugs" },
  { directive: "defect", layer: "issue" },
  { directive: "defect", layer: "task" },

  // "find" directive supports all layers (if implemented)
  { directive: "find", layer: "project" },
  { directive: "find", layer: "issue" },
  { directive: "find", layer: "task" },
  { directive: "find", layer: "bugs" },
] as const;

/**
 * Invalid DirectiveType values (should be rejected)
 */
const INVALID_DIRECTIVE_TYPES = [
  "", // empty
  " ", // whitespace
  "TO", // uppercase
  "to_", // underscore
  "to-summary", // hyphen
  "invalid", // not in pattern
  "to2", // number suffix
  "summary!", // special character
  "very_long_directive_type_name", // too long
] as const;

/**
 * Invalid LayerType values (should be rejected)
 */
const INVALID_LAYER_TYPES = [
  "", // empty
  " ", // whitespace
  "PROJECT", // uppercase
  "task_", // underscore
  "project-issue", // hyphen
  "invalid", // not in pattern
  "task2", // number suffix
  "project!", // special character
  "very_long_layer_type_name", // too long
] as const;

// ============================================================================
// Random Value Generators
// ============================================================================

/**
 * Generate random valid DirectiveType
 */
function randomValidDirectiveType(): string {
  const index = Math.floor(Math.random() * VALID_DIRECTIVE_TYPES.length);
  return VALID_DIRECTIVE_TYPES[index];
}

/**
 * Generate random valid LayerType
 */
function randomValidLayerType(): string {
  const index = Math.floor(Math.random() * VALID_LAYER_TYPES.length);
  return VALID_LAYER_TYPES[index];
}

/**
 * Generate random valid combination
 */
function randomValidCombination(): { directive: string; layer: string } {
  const index = Math.floor(Math.random() * VALID_COMBINATIONS.length);
  return {
    directive: VALID_COMBINATIONS[index].directive,
    layer: VALID_COMBINATIONS[index].layer,
  };
}

/**
 * Generate random invalid DirectiveType
 */
function randomInvalidDirectiveType(): string {
  const index = Math.floor(Math.random() * INVALID_DIRECTIVE_TYPES.length);
  return INVALID_DIRECTIVE_TYPES[index];
}

/**
 * Generate random invalid LayerType
 */
function randomInvalidLayerType(): string {
  const index = Math.floor(Math.random() * INVALID_LAYER_TYPES.length);
  return INVALID_LAYER_TYPES[index];
}

/**
 * Generate completely random string (for chaos testing)
 */
function randomString(length: number = 10): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================================
// Property-based Testing
// ============================================================================

describe("Behavior: Rule-based Validation", () => {
  const profile = ConfigProfileName.createDefault();

  describe("Valid combinations should always pass", () => {
    it("should accept all valid DirectiveType + LayerType combinations", () => {
      logger.debug("Testing all valid combinations");

      // Test only the business-rule valid combinations
      for (const combination of VALID_COMBINATIONS) {
        const result = TwoParams.create(combination.directive, combination.layer, profile);

        assertEquals(
          result.ok,
          true,
          `Should accept valid combination: ${combination.directive} + ${combination.layer}`,
        );

        if (result.ok) {
          assertEquals(result.data.toString().includes(combination.directive), true);
          assertEquals(result.data.toString().includes(combination.layer), true);
        }
      }

      logger.debug("All valid combinations accepted");
    });

    it("should accept random valid combinations (property-based)", () => {
      logger.debug("Testing random valid combinations");

      // Property-based testing: 100 random valid combinations from business-rule valid list
      for (let i = 0; i < 100; i++) {
        const combination = randomValidCombination();

        const result = TwoParams.create(combination.directive, combination.layer, profile);

        assertEquals(
          result.ok,
          true,
          `Iteration ${i}: Should accept valid random combination: ${combination.directive} + ${combination.layer}`,
        );

        if (result.ok) {
          // Verify domain methods work
          assertExists(result.data.toCommand());
          assertExists(result.data.toString());
          assertEquals(result.data.validate().ok, true);
        }
      }

      logger.debug("Random valid combinations test completed");
    });
  });

  describe("Invalid DirectiveTypes should always fail", () => {
    it("should reject all invalid DirectiveTypes with valid LayerType", () => {
      logger.debug("Testing invalid DirectiveTypes");

      const validLayer = "project";

      for (const invalidDirective of INVALID_DIRECTIVE_TYPES) {
        const result = TwoParams.create(invalidDirective, validLayer, profile);

        assertEquals(
          result.ok,
          false,
          `Should reject invalid DirectiveType: "${invalidDirective}"`,
        );

        if (!result.ok) {
          assertEquals(result.error.kind, "InvalidDirective");
        }
      }

      logger.debug("All invalid DirectiveTypes rejected");
    });

    it("should reject random invalid DirectiveTypes (property-based)", () => {
      logger.debug("Testing random invalid DirectiveTypes");

      const validLayer = randomValidLayerType();

      // Property-based testing: 50 random invalid DirectiveTypes
      for (let i = 0; i < 50; i++) {
        const invalidDirective = randomInvalidDirectiveType();

        const result = TwoParams.create(invalidDirective, validLayer, profile);

        assertEquals(
          result.ok,
          false,
          `Iteration ${i}: Should reject invalid DirectiveType: "${invalidDirective}"`,
        );

        if (!result.ok) {
          assertEquals(result.error.kind, "InvalidDirective");
        }
      }

      logger.debug("Random invalid DirectiveTypes test completed");
    });
  });

  describe("Invalid LayerTypes should always fail", () => {
    it("should reject all invalid LayerTypes with valid DirectiveType", () => {
      logger.debug("Testing invalid LayerTypes");

      const validDirective = "to";

      for (const invalidLayer of INVALID_LAYER_TYPES) {
        const result = TwoParams.create(validDirective, invalidLayer, profile);

        assertEquals(
          result.ok,
          false,
          `Should reject invalid LayerType: "${invalidLayer}"`,
        );

        if (!result.ok) {
          assertEquals(result.error.kind, "InvalidLayer");
        }
      }

      logger.debug("All invalid LayerTypes rejected");
    });

    it("should reject random invalid LayerTypes (property-based)", () => {
      logger.debug("Testing random invalid LayerTypes");

      const validDirective = randomValidDirectiveType();

      // Property-based testing: 50 random invalid LayerTypes
      for (let i = 0; i < 50; i++) {
        const invalidLayer = randomInvalidLayerType();

        const result = TwoParams.create(validDirective, invalidLayer, profile);

        assertEquals(
          result.ok,
          false,
          `Iteration ${i}: Should reject invalid LayerType: "${invalidLayer}"`,
        );

        if (!result.ok) {
          assertEquals(result.error.kind, "InvalidLayer");
        }
      }

      logger.debug("Random invalid LayerTypes test completed");
    });
  });

  describe("Chaos testing with completely random values", () => {
    it("should handle completely random strings gracefully", () => {
      logger.debug("Starting chaos testing");

      // Chaos testing: 100 completely random combinations
      for (let i = 0; i < 100; i++) {
        const randomDirective = randomString(Math.floor(Math.random() * 20) + 1);
        const randomLayer = randomString(Math.floor(Math.random() * 20) + 1);

        const result = TwoParams.create(randomDirective, randomLayer, profile);

        // Should either succeed (if accidentally valid) or fail gracefully
        if (result.ok) {
          // If it succeeded, it must be a valid combination
          assertEquals(
            VALID_DIRECTIVE_TYPES.includes(randomDirective as typeof VALID_DIRECTIVE_TYPES[number]),
            true,
          );
          assertEquals(
            VALID_LAYER_TYPES.includes(randomLayer as typeof VALID_LAYER_TYPES[number]),
            true,
          );
        } else {
          // If it failed, it should have proper error structure
          assertExists(result.error);
          assertExists(result.error.kind);
          assertEquals(
            ["InvalidDirective", "InvalidLayer"].includes(result.error.kind),
            true,
            `Unexpected error kind: ${result.error.kind}`,
          );
        }
      }

      logger.debug("Chaos testing completed");
    });
  });

  describe("CLI option integration with random values", () => {
    it("should handle random valid combinations through CLI option method", () => {
      logger.debug("Testing CLI option integration");

      // Test with various CLI option scenarios
      const cliOptions = [null, undefined, "", "custom", "production", "test"];

      for (let i = 0; i < 50; i++) {
        const combination = randomValidCombination();
        const option = cliOptions[Math.floor(Math.random() * cliOptions.length)];

        const result = TwoParams.createWithCliOption(
          combination.directive,
          combination.layer,
          option,
        );

        assertEquals(
          result.ok,
          true,
          `Should accept valid combination through CLI: ${combination.directive} + ${combination.layer} (option: ${option})`,
        );

        if (result.ok) {
          // Verify profile was set correctly
          if (option === null || option === undefined || option === "") {
            assertEquals(result.data.profile.isDefault, true);
          } else {
            // For valid profile names, profile should match the option
            assertEquals(result.data.profile.value, option);
            assertEquals(result.data.profile.isDefault, false);
          }
        }
      }

      logger.debug("CLI option integration test completed");
    });
  });

  describe("Edge cases and boundary values", () => {
    it("should handle edge cases consistently", () => {
      logger.debug("Testing edge cases");

      const edgeCases = [
        // Empty and whitespace
        { directive: "", layer: "project", expectOk: false },
        { directive: " ", layer: "project", expectOk: false },
        { directive: "to", layer: "", expectOk: false },
        { directive: "to", layer: " ", expectOk: false },

        // Case sensitivity
        { directive: "TO", layer: "project", expectOk: false },
        { directive: "to", layer: "PROJECT", expectOk: false },

        // Boundary valid cases
        { directive: "to", layer: "project", expectOk: true },
        { directive: "find", layer: "bugs", expectOk: true },
      ];

      for (const testCase of edgeCases) {
        const result = TwoParams.create(testCase.directive, testCase.layer, profile);

        assertEquals(
          result.ok,
          testCase.expectOk,
          `Edge case: ${testCase.directive} + ${testCase.layer} should ${
            testCase.expectOk ? "pass" : "fail"
          }`,
        );
      }

      logger.debug("Edge cases test completed");
    });

    it("should provide consistent error messages for similar invalid inputs", () => {
      logger.debug("Testing error message consistency");

      // Test that similar invalid inputs produce consistent error types
      const invalidDirectives = ["", " ", "INVALID", "123"];
      const invalidLayers = ["", " ", "INVALID", "456"];

      for (const invalidDirective of invalidDirectives) {
        const result = TwoParams.create(invalidDirective, "project", profile);
        assertEquals(result.ok, false);
        if (!result.ok) {
          assertEquals(result.error.kind, "InvalidDirective");
        }
      }

      for (const invalidLayer of invalidLayers) {
        const result = TwoParams.create("to", invalidLayer, profile);
        assertEquals(result.ok, false);
        if (!result.ok) {
          assertEquals(result.error.kind, "InvalidLayer");
        }
      }

      logger.debug("Error message consistency test completed");
    });
  });
});

describe("Behavior: Domain Operations with Random Valid Data", () => {
  const profile = ConfigProfileName.createDefault();

  it("should generate consistent commands from random valid inputs", () => {
    logger.debug("Testing command generation consistency");

    for (let i = 0; i < 50; i++) {
      const combination = randomValidCombination();

      const result = TwoParams.create(combination.directive, combination.layer, profile);
      assertEquals(result.ok, true);

      if (result.ok) {
        const command = result.data.toCommand();

        // Verify command structure
        assertEquals(command.directive, combination.directive);
        assertEquals(command.layer, combination.layer);
        assertEquals(command.profile, "default");
        assertExists(command.timestamp);
        assertEquals(command.timestamp instanceof Date, true);
      }
    }

    logger.debug("Command generation consistency test completed");
  });

  it("should resolve paths consistently for random valid inputs", () => {
    logger.debug("Testing path resolution consistency");

    for (let i = 0; i < 30; i++) {
      const combination = randomValidCombination();

      const result = TwoParams.create(combination.directive, combination.layer, profile);
      assertEquals(result.ok, true);

      if (result.ok) {
        const twoParams = result.data;

        // Test prompt path resolution
        const promptPathResult = twoParams.getPromptPath();
        assertEquals(promptPathResult.ok, true);

        // Test schema path resolution
        const schemaPathResult = twoParams.getSchemaPath();
        assertEquals(schemaPathResult.ok, true);

        // Test file path resolution
        const promptFileResult = twoParams.resolvePromptFilePath("prompts", combination.layer);
        assertEquals(promptFileResult.ok, true);

        const schemaFileResult = twoParams.resolveSchemaFilePath("schemas");
        assertEquals(schemaFileResult.ok, true);

        if (promptFileResult.ok && schemaFileResult.ok) {
          // Verify paths contain expected components
          assertEquals(promptFileResult.data.includes(combination.directive), true);
          assertEquals(promptFileResult.data.includes(combination.layer), true);
          assertEquals(schemaFileResult.data.includes(combination.directive), true);
          assertEquals(schemaFileResult.data.includes(combination.layer), true);
        }
      }
    }

    logger.debug("Path resolution consistency test completed");
  });
});
