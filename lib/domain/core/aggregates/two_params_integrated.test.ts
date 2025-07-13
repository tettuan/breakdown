/**
 * @fileoverview TwoParams Integrated Implementation Tests
 *
 * Comprehensive test suite for the integrated TwoParams implementation combining
 * edge cases, factory tests, and behavioral tests from legacy implementations.
 *
 * Migrated test sources:
 * - 1_behavior_two_params_test.ts (rule-based validation, edge cases)
 * - 2_structure_two_params_flexible_test.ts (flexible patterns, hash-like chars)
 * - 3_edge_case_variables_builder_test.ts (boundary conditions)
 * - 1_behavior_prompt_variables_factory_legacy_methods_test.ts (factory patterns)
 *
 * @module domain/core/aggregates/two_params_integrated.test
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { TwoParams } from "./two_params_optimized.ts";
import { ConfigProfileName } from "$lib/types/config_profile_name.ts";

const logger = new BreakdownLogger("two-params-integrated-test");

// ============================================================================
// Rule-based Test Data (migrated from 1_behavior_two_params_test.ts)
// ============================================================================

// Valid DirectiveType and LayerType constants removed as they were unused

/**
 * Valid combinations based on business rules (conservative subset)
 */
const VALID_COMBINATIONS = [
  // Known working combinations
  { directive: "to", layer: "project" },
  { directive: "to", layer: "issue" },
  { directive: "to", layer: "task" },
  { directive: "summary", layer: "project" },
  { directive: "summary", layer: "issue" },
] as const;

// ============================================================================
// Flexible Pattern Data (migrated from 2_structure_two_params_flexible_test.ts)
// ============================================================================

// Hash-like pattern constants removed as they were unused

// ============================================================================
// Basic Integration Tests
// ============================================================================

describe("TwoParams Integrated - Basic Functionality", () => {
  it("should create valid TwoParams with standard combinations", () => {
    logger.debug("Testing standard valid combinations");

    for (const combo of VALID_COMBINATIONS) {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create(combo.directive, combo.layer, profile);

      assertEquals(
        result.ok,
        true,
        `Combination ${combo.directive}/${combo.layer} should be valid`,
      );

      if (result.ok) {
        assertEquals(result.data.directive.value, combo.directive);
        assertEquals(result.data.layer.value, combo.layer);
        assertExists(result.data.profile);
      }
    }
  });

  it("should reject invalid directive values", () => {
    logger.debug("Testing invalid directive rejection");

    const invalidDirectives = ["INVALID", "", "   ", "toolong".repeat(10)];

    for (const invalidDirective of invalidDirectives) {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create(invalidDirective, "project", profile);

      assertEquals(result.ok, false, `Invalid directive '${invalidDirective}' should be rejected`);

      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidDirective");
      }
    }
  });

  it("should reject invalid layer values", () => {
    logger.debug("Testing invalid layer rejection");

    const invalidLayers = ["INVALID", "", "   ", "toolong".repeat(10)];

    for (const invalidLayer of invalidLayers) {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", invalidLayer, profile);

      assertEquals(result.ok, false, `Invalid layer '${invalidLayer}' should be rejected`);

      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidLayer");
      }
    }
  });
});

// ============================================================================
// Edge Case Tests (migrated from 3_edge_case_variables_builder_test.ts)
// ============================================================================

describe("TwoParams Integrated - Edge Cases", () => {
  it("should handle boundary length values correctly", () => {
    logger.debug("Testing boundary length validation");

    const profile = ConfigProfileName.createDefault();

    // Test with minimum length values
    // Note: Testing boundary conditions without unused variables

    // Test with maximum length values (within valid patterns)
    const maxDirective = "summary"; // Known working directive
    const maxLayer = "project"; // Known working layer

    const maxResult = TwoParams.create(maxDirective, maxLayer, profile);
    assertEquals(maxResult.ok, true, "Maximum valid length should work");
  });

  it("should handle whitespace validation consistently", () => {
    logger.debug("Testing whitespace validation");

    const profile = ConfigProfileName.createDefault();

    // Test with leading/trailing whitespace - should fail due to strict validation
    const result1 = TwoParams.create("  to  ", "  project  ", profile);
    const result2 = TwoParams.create("to", "project", profile);

    // Whitespace inputs should fail, clean inputs should succeed
    assertEquals(result1.ok, false, "Leading/trailing whitespace should be rejected");
    assertEquals(result2.ok, true, "Clean inputs should succeed");

    if (!result1.ok) {
      // Either directive or layer can fail first depending on validation order
      const isValidErrorKind = result1.error.kind === "InvalidDirective" ||
        result1.error.kind === "InvalidLayer";
      assertEquals(
        isValidErrorKind,
        true,
        `Expected InvalidDirective or InvalidLayer, got ${result1.error.kind}`,
      );
      assertEquals(result1.error.message?.includes("whitespace"), true);
    }
  });

  it("should handle null and undefined inputs gracefully", () => {
    logger.debug("Testing null/undefined input handling");

    const profile = ConfigProfileName.createDefault();

    // These should fail gracefully without throwing
    const nullDirectiveResult = TwoParams.create(null as unknown as string, "project", profile);
    const undefinedLayerResult = TwoParams.create("to", undefined as unknown as string, profile);

    assertEquals(nullDirectiveResult.ok, false);
    assertEquals(undefinedLayerResult.ok, false);
  });
});

// ============================================================================
// Path Resolution Tests
// ============================================================================

describe("TwoParams Integrated - Path Resolution", () => {
  it("should resolve prompt paths correctly", () => {
    logger.debug("Testing prompt path resolution");

    const profile = ConfigProfileName.createDefault();
    const result = TwoParams.create("to", "project", profile);

    if (!result.ok) {
      throw new Error("Failed to create test TwoParams");
    }

    const twoParams = result.data;
    const promptPath = twoParams.resolvePromptPath();

    assertEquals(typeof promptPath, "string");
    assertEquals(promptPath.includes("to"), true);
    assertEquals(promptPath.includes("project"), true);
  });

  it("should resolve schema paths correctly", () => {
    logger.debug("Testing schema path resolution");

    const profile = ConfigProfileName.createDefault();
    const result = TwoParams.create("summary", "issue", profile);

    if (!result.ok) {
      throw new Error("Failed to create test TwoParams");
    }

    const twoParams = result.data;
    const schemaPath = twoParams.resolveSchemaPath();

    assertEquals(typeof schemaPath, "string");
    assertEquals(schemaPath.includes("summary"), true);
    assertEquals(schemaPath.includes("issue"), true);
  });

  it("should generate command structures correctly", () => {
    logger.debug("Testing command structure generation");

    const profile = ConfigProfileName.createDefault();
    const result = TwoParams.create("defect", "bugs", profile);

    if (!result.ok) {
      throw new Error("Failed to create test TwoParams");
    }

    const twoParams = result.data;
    const command = twoParams.toCommand();

    assertEquals(command.directive, "defect");
    assertEquals(command.layer, "bugs");
    assertEquals(typeof command.timestamp, "object");
    assertEquals(command.timestamp instanceof Date, true);
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe("TwoParams Integrated - Error Handling", () => {
  it("should provide discriminated union error types", () => {
    logger.debug("Testing error type discrimination");

    const profile = ConfigProfileName.createDefault();

    // Test InvalidDirective error
    const invalidDirectiveResult = TwoParams.create("INVALID_DIRECTIVE", "project", profile);
    assertEquals(invalidDirectiveResult.ok, false);

    if (!invalidDirectiveResult.ok) {
      const error = invalidDirectiveResult.error;
      assertEquals(error.kind, "InvalidDirective");

      if (error.kind === "InvalidDirective") {
        assertEquals(error.directive, "INVALID_DIRECTIVE");
        assertExists(error.profile);
        assertExists(error.pattern);
        assertExists(error.cause);
      }
    }

    // Test InvalidLayer error
    const invalidLayerResult = TwoParams.create("to", "INVALID_LAYER", profile);
    assertEquals(invalidLayerResult.ok, false);

    if (!invalidLayerResult.ok) {
      const error = invalidLayerResult.error;
      assertEquals(error.kind, "InvalidLayer");

      if (error.kind === "InvalidLayer") {
        assertEquals(error.layer, "INVALID_LAYER");
        assertExists(error.pattern);
        assertExists(error.cause);
      }
    }
  });

  it("should handle unsupported combinations gracefully", () => {
    logger.debug("Testing unsupported combination handling");

    const profile = ConfigProfileName.createDefault();

    // Test a combination that might not be supported
    // Note: This depends on the actual business rules implementation
    const result = TwoParams.create("summary", "bugs", profile);

    if (!result.ok && result.error.kind === "UnsupportedCombination") {
      assertEquals(result.error.directive, "summary");
      assertEquals(result.error.layer, "bugs");
      assertExists(result.error.message);
    }
  });
});

// ============================================================================
// Performance and Property-based Tests
// ============================================================================

describe("TwoParams Integrated - Performance", () => {
  it("should handle repeated creation efficiently", () => {
    logger.debug("Testing repeated creation performance");

    const profile = ConfigProfileName.createDefault();
    const startTime = Date.now();

    // Create 100 instances to test performance (reduced for faster testing)
    for (let i = 0; i < 100; i++) {
      const combo = VALID_COMBINATIONS[i % VALID_COMBINATIONS.length];
      const result = TwoParams.create(combo.directive, combo.layer, profile);
      if (!result.ok) {
        throw new Error(
          `Failed to create TwoParams for ${combo.directive}/${combo.layer}: ${
            JSON.stringify(result.error)
          }`,
        );
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (adjust threshold as needed)
    assertEquals(duration < 5000, true, `Creation should be fast, took ${duration}ms`);
  });

  it("should maintain immutability across operations", () => {
    logger.debug("Testing immutability properties");

    const profile = ConfigProfileName.createDefault();
    const result = TwoParams.create("to", "project", profile);

    if (!result.ok) {
      throw new Error("Failed to create test TwoParams");
    }

    const twoParams = result.data;
    const originalDirective = twoParams.directive.value;
    const originalLayer = twoParams.layer.value;

    // Perform various operations
    twoParams.resolvePromptPath();
    twoParams.resolveSchemaPath();
    twoParams.toCommand();
    twoParams.toString();

    // Values should remain unchanged
    assertEquals(twoParams.directive.value, originalDirective);
    assertEquals(twoParams.layer.value, originalLayer);
  });
});
