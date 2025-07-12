/**
 * @fileoverview Random Integration Tests for TwoParamsValidator
 *
 * Tests parameter validation with random values within and outside rule boundaries:
 * - Random valid combinations should pass validation
 * - Random invalid values should fail validation
 * - Edge cases and boundary conditions
 * - Configuration-based pattern testing
 *
 * @module cli/validators/two_params_validator_random_test
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  TwoParamsValidator,
  type ValidatedParams as _ValidatedParams,
  type ValidationError as _ValidationError,
} from "./two_params_validator_ddd.ts";
import type { BreakdownConfig as _BreakdownConfig } from "@tettuan/breakdownconfig";

const logger = new BreakdownLogger("two-params-validator-random");

// ============================================================================
// Random Test Data Generators
// ============================================================================

/**
 * Generate random valid directive types based on configuration
 */
function getRandomValidDirective(validDirectives: readonly string[]): string {
  const index = Math.floor(Math.random() * validDirectives.length);
  return validDirectives[index];
}

/**
 * Generate random valid layer types based on configuration
 */
function getRandomValidLayer(validLayers: readonly string[]): string {
  const index = Math.floor(Math.random() * validLayers.length);
  return validLayers[index];
}

/**
 * Generate random invalid strings that should not match any valid pattern
 */
function generateInvalidStrings(): string[] {
  return [
    // Empty and whitespace
    "",
    " ",
    "  ",
    "\t",
    "\n",

    // Numbers
    "123",
    "0",
    "999",

    // Special characters
    "!@#$%",
    "***",
    "---",
    "+++=",

    // Mixed invalid patterns
    "to123",
    "123task",
    "to-task",
    "to_task",
    "TO",
    "TASK",

    // Very long strings
    "verylongstringthatshould".repeat(10),

    // Unicode characters
    "これは",
    "🚀🚀",
    "αβγ",

    // Common typos
    "tto",
    "too",
    "taskk",
    "projet",
    "issu",
  ];
}

/**
 * Create mock configuration for testing
 */
function createMockConfig(
  directivePatterns: string[],
  layerPatterns: string[],
): Record<string, unknown> {
  return {
    breakdown: {
      two: {
        directive: {
          patterns: directivePatterns,
        },
        layer: {
          patterns: layerPatterns,
        },
      },
    },
  };
}

// ============================================================================
// Random Test Configurations
// ============================================================================

const DEFAULT_VALID_DIRECTIVES = ["to", "summary", "defect"];
const DEFAULT_VALID_LAYERS = ["project", "issue", "task"];

const EXTENDED_VALID_DIRECTIVES = ["to", "summary", "defect", "init", "find", "analyze"];
const EXTENDED_VALID_LAYERS = ["project", "issue", "task", "bugs", "temp", "docs"];

const CUSTOM_VALID_DIRECTIVES = ["web", "rag", "db", "search"];
const CUSTOM_VALID_LAYERS = ["query", "index", "data", "cache"];

// ============================================================================
// Random Integration Tests
// ============================================================================

describe("Random Integration: Valid Combinations", () => {
  it("should accept random valid combinations with default patterns", () => {
    logger.debug("Testing random valid combinations with default patterns");

    const config = createMockConfig(DEFAULT_VALID_DIRECTIVES, DEFAULT_VALID_LAYERS);
    const validator = new TwoParamsValidator(config);

    // Test 100 random valid combinations
    for (let i = 0; i < 100; i++) {
      const directive = getRandomValidDirective(DEFAULT_VALID_DIRECTIVES);
      const layer = getRandomValidLayer(DEFAULT_VALID_LAYERS);

      const result = validator.validate([directive, layer]);
      assertEquals(
        result.ok,
        true,
        `Random valid combination should pass: ${directive} ${layer} (iteration ${i + 1})`,
      );

      if (result.ok) {
        assertEquals(result.data.directiveType.getValue(), directive);
        assertEquals(result.data.layerType.getValue(), layer);
      }
    }

    logger.debug("Random valid combinations test completed");
  });

  it("should accept random valid combinations with extended patterns", () => {
    logger.debug("Testing random valid combinations with extended patterns");

    const config = createMockConfig(EXTENDED_VALID_DIRECTIVES, EXTENDED_VALID_LAYERS);
    const validator = new TwoParamsValidator(config);

    // Test 150 random valid combinations
    for (let i = 0; i < 150; i++) {
      const directive = getRandomValidDirective(EXTENDED_VALID_DIRECTIVES);
      const layer = getRandomValidLayer(EXTENDED_VALID_LAYERS);

      const result = validator.validate([directive, layer]);
      assertEquals(
        result.ok,
        true,
        `Random extended combination should pass: ${directive} ${layer} (iteration ${i + 1})`,
      );

      if (result.ok) {
        assertEquals(result.data.directiveType.getValue(), directive);
        assertEquals(result.data.layerType.getValue(), layer);
      }
    }

    logger.debug("Random extended combinations test completed");
  });

  it("should accept random valid combinations with custom patterns", () => {
    logger.debug("Testing random valid combinations with custom patterns");

    const config = createMockConfig(CUSTOM_VALID_DIRECTIVES, CUSTOM_VALID_LAYERS);
    const validator = new TwoParamsValidator(config);

    // Test 80 random valid combinations
    for (let i = 0; i < 80; i++) {
      const directive = getRandomValidDirective(CUSTOM_VALID_DIRECTIVES);
      const layer = getRandomValidLayer(CUSTOM_VALID_LAYERS);

      const result = validator.validate([directive, layer]);
      assertEquals(
        result.ok,
        true,
        `Random custom combination should pass: ${directive} ${layer} (iteration ${i + 1})`,
      );

      if (result.ok) {
        assertEquals(result.data.directiveType.getValue(), directive);
        assertEquals(result.data.layerType.getValue(), layer);
      }
    }

    logger.debug("Random custom combinations test completed");
  });
});

describe("Random Integration: Invalid Values", () => {
  it("should reject random invalid directive types", () => {
    logger.debug("Testing random invalid directive types");

    const config = createMockConfig(DEFAULT_VALID_DIRECTIVES, DEFAULT_VALID_LAYERS);
    const validator = new TwoParamsValidator(config);
    const invalidStrings = generateInvalidStrings();

    for (const invalidDirective of invalidStrings) {
      const validLayer = getRandomValidLayer(DEFAULT_VALID_LAYERS);
      const result = validator.validate([invalidDirective, validLayer]);

      assertEquals(
        result.ok,
        false,
        `Invalid directive should be rejected: ${invalidDirective} ${validLayer}`,
      );

      if (!result.ok) {
        // Verify error contains useful information
        assertExists(result.error, "Error object should exist");
        assertEquals(
          result.error.kind === "InvalidDirectiveType" ||
            result.error.kind === "DirectivePatternMismatch" ||
            result.error.kind === "InvalidConfiguration",
          true,
          "Error should be directive-related",
        );
      }
    }

    logger.debug("Random invalid directive types test completed");
  });

  it("should reject random invalid layer types", () => {
    logger.debug("Testing random invalid layer types");

    const config = createMockConfig(DEFAULT_VALID_DIRECTIVES, DEFAULT_VALID_LAYERS);
    const validator = new TwoParamsValidator(config);
    const invalidStrings = generateInvalidStrings();

    for (const invalidLayer of invalidStrings) {
      const validDirective = getRandomValidDirective(DEFAULT_VALID_DIRECTIVES);
      const result = validator.validate([validDirective, invalidLayer]);

      assertEquals(
        result.ok,
        false,
        `Invalid layer should be rejected: ${validDirective} ${invalidLayer}`,
      );

      if (!result.ok) {
        // Verify error contains useful information
        assertExists(result.error, "Error object should exist");
        assertEquals(
          result.error.kind === "InvalidLayerType" ||
            result.error.kind === "LayerPatternMismatch" ||
            result.error.kind === "InvalidConfiguration",
          true,
          "Error should be layer-related",
        );
      }
    }

    logger.debug("Random invalid layer types test completed");
  });

  it("should reject random invalid combinations", () => {
    logger.debug("Testing random invalid combinations");

    const config = createMockConfig(DEFAULT_VALID_DIRECTIVES, DEFAULT_VALID_LAYERS);
    const validator = new TwoParamsValidator(config);
    const invalidStrings = generateInvalidStrings();

    // Test all invalid combinations
    for (let i = 0; i < Math.min(50, invalidStrings.length); i++) {
      const invalidDirective = invalidStrings[i];
      const invalidLayer = invalidStrings[(i + 1) % invalidStrings.length];

      const result = validator.validate([invalidDirective, invalidLayer]);
      assertEquals(
        result.ok,
        false,
        `Both invalid should be rejected: ${invalidDirective} ${invalidLayer}`,
      );
    }

    logger.debug("Random invalid combinations test completed");
  });
});

describe("Random Integration: Edge Cases", () => {
  it("should handle mixed case and whitespace variations", () => {
    logger.debug("Testing case and whitespace variations");

    const config = createMockConfig(DEFAULT_VALID_DIRECTIVES, DEFAULT_VALID_LAYERS);
    const validator = new TwoParamsValidator(config);

    const variations = [
      "TO",
      "To",
      "tO",
      " to",
      "to ",
      " to ",
      "PROJECT",
      "Project",
      "pROJECT",
      " project",
      "project ",
      " project ",
    ];

    for (const variation of variations) {
      const result = validator.validate([variation, "project"]);
      // These should fail because patterns are case-sensitive and whitespace-sensitive
      assertEquals(
        result.ok,
        false,
        `Case/whitespace variation should be rejected: ${variation}`,
      );
    }

    logger.debug("Case and whitespace variations test completed");
  });

  it("should handle parameter count edge cases with random values", () => {
    logger.debug("Testing parameter count edge cases");

    const config = createMockConfig(DEFAULT_VALID_DIRECTIVES, DEFAULT_VALID_LAYERS);
    const validator = new TwoParamsValidator(config);

    // No parameters
    let result = validator.validate([]);
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidParameterCount");
    }

    // One parameter
    const validDirective = getRandomValidDirective(DEFAULT_VALID_DIRECTIVES);
    result = validator.validate([validDirective]);
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidParameterCount");
    }

    // Too many parameters
    const validLayer = getRandomValidLayer(DEFAULT_VALID_LAYERS);
    result = validator.validate([validDirective, validLayer, "extra", "params"]);
    // Should still work (extra params ignored)
    assertEquals(result.ok, true);

    logger.debug("Parameter count edge cases test completed");
  });

  it("should maintain consistency across multiple random test runs", () => {
    logger.debug("Testing consistency across multiple runs");

    const config = createMockConfig(DEFAULT_VALID_DIRECTIVES, DEFAULT_VALID_LAYERS);
    const validator = new TwoParamsValidator(config);

    // Same input should always produce same result
    const testCases = [
      ["to", "project"],
      ["summary", "issue"],
      ["invalid", "task"],
      ["to", "invalid"],
    ];

    for (const [directive, layer] of testCases) {
      const results = [];

      // Run same test 10 times
      for (let i = 0; i < 10; i++) {
        results.push(validator.validate([directive, layer]));
      }

      // All results should be identical
      const firstResult = results[0];
      for (let i = 1; i < results.length; i++) {
        assertEquals(
          results[i].ok,
          firstResult.ok,
          `Result consistency check failed for: ${directive} ${layer}`,
        );
      }
    }

    logger.debug("Consistency test completed");
  });
});

describe("Random Integration: Performance", () => {
  it("should handle large numbers of random validations efficiently", () => {
    logger.debug("Testing performance with large number of validations");

    const config = createMockConfig(EXTENDED_VALID_DIRECTIVES, EXTENDED_VALID_LAYERS);
    const validator = new TwoParamsValidator(config);

    const startTime = Date.now();
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const directive = getRandomValidDirective(EXTENDED_VALID_DIRECTIVES);
      const layer = getRandomValidLayer(EXTENDED_VALID_LAYERS);

      const result = validator.validate([directive, layer]);
      // Don't fail the test on validation results, just check it runs
      assertExists(result, "Result should exist");
    }

    const duration = Date.now() - startTime;
    logger.debug(`Completed ${iterations} validations in ${duration}ms`);

    // Performance assertion - should complete within reasonable time
    // Allow for 5 seconds for 1000 iterations (5ms per validation)
    assertEquals(
      duration < 5000,
      true,
      `Performance test should complete within 5 seconds, took ${duration}ms`,
    );

    logger.debug("Performance test completed");
  });
});
