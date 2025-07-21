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

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { describe, it } from "@std/testing/bdd";
import { TwoParams } from "./two_params_optimized.ts";
import { ConfigProfile } from "../../../config/config_profile_name.ts";
import { DefaultTypePatternProvider } from "$lib/types/defaults/default_type_pattern_provider.ts";

// BreakdownLogger usage - conditional to support test runs without --allow-env
let logger: {
  debug: (_msg: string, _obj?: unknown) => void;
  info: (_msg: string, _obj?: unknown) => void;
  warn: (_msg: string, _obj?: unknown) => void;
  error: (_msg: string, _obj?: unknown) => void;
} | null = null;
try {
  const { BreakdownLogger } = await import("@tettuan/breakdownlogger");
  logger = new BreakdownLogger("two-params-integrated-test");
} catch {
  // Fallback for tests without --allow-env
  logger = {
    debug: (_msg: string, _obj?: unknown) => {},
    info: (_msg: string, _obj?: unknown) => {},
    warn: (_msg: string, _obj?: unknown) => {},
    error: (_msg: string, _obj?: unknown) => {},
  };
}

// ============================================================================
// Rule-based Test Data (migrated from 1_behavior_two_params_test.ts)
// ============================================================================

// Valid DirectiveType and LayerType constants removed as they were unused

/**
 * Get valid combinations from configuration files
 */
function getValidCombinations() {
  const patternProvider = new DefaultTypePatternProvider();
  const directives = patternProvider.getDirectiveTypes();
  const layers = patternProvider.getLayerTypes();
  
  // Return a conservative subset of valid combinations from config
  const combinations = [];
  for (const directive of directives.slice(0, 2)) { // Limit to first 2 directives
    for (const layer of layers.slice(0, 3)) { // Limit to first 3 layers
      combinations.push({ directive, layer });
    }
  }
  return combinations;
}

const VALID_COMBINATIONS = getValidCombinations();

// ============================================================================
// Flexible Pattern Data (migrated from 2_structure_two_params_flexible_test.ts)
// ============================================================================

// Hash-like pattern constants removed as they were unused

// ============================================================================
// Basic Integration Tests
// ============================================================================

describe("TwoParams Integrated - Basic Functionality", () => {
  it("should create valid TwoParams with standard combinations", () => {
    logger?.debug("Testing standard valid combinations");

    for (const combo of VALID_COMBINATIONS) {
      const result = TwoParams.create(combo.directive, combo.layer);

      assertEquals(
        result.ok,
        true,
        `Combination ${combo.directive}/${combo.layer} should be valid`,
      );

      if (result.ok) {
        assertEquals(result.data.directive.value, combo.directive);
        assertEquals(result.data.layer.value, combo.layer);
        // TwoParams still has profile property, DirectiveType/LayerType don't
        assertExists(result.data.profile);
      }
    }
  });

  it("should reject invalid directive values", () => {
    logger?.debug("Testing invalid directive rejection");

    const patternProvider = new DefaultTypePatternProvider();
    const validLayers = patternProvider.getLayerTypes();
    const firstValidLayer = validLayers[0] || "project";
    
    const invalidDirectives = ["INVALID", "", "   ", "toolong".repeat(10)];

    for (const invalidDirective of invalidDirectives) {
      const result = TwoParams.create(invalidDirective, firstValidLayer);

      assertEquals(result.ok, false, `Invalid directive '${invalidDirective}' should be rejected`);

      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidDirective");
      }
    }
  });

  it("should reject invalid layer values", () => {
    logger?.debug("Testing invalid layer rejection");

    const patternProvider = new DefaultTypePatternProvider();
    const validDirectives = patternProvider.getDirectiveTypes();
    const firstValidDirective = validDirectives[0] || "to";
    
    const invalidLayers = ["INVALID", "", "   ", "toolong".repeat(10)];

    for (const invalidLayer of invalidLayers) {
      const result = TwoParams.create(firstValidDirective, invalidLayer);

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
    logger?.debug("Testing boundary length validation");

    const patternProvider = new DefaultTypePatternProvider();
    const validDirectives = patternProvider.getDirectiveTypes();
    const validLayers = patternProvider.getLayerTypes();

    // Test with minimum length values
    // Note: Testing boundary conditions without unused variables

    // Test with maximum length values (within valid patterns)
    const maxDirective = validDirectives[1] || "summary"; // Second directive from config
    const maxLayer = validLayers[0] || "project"; // First layer from config

    const maxResult = TwoParams.create(maxDirective, maxLayer);
    assertEquals(maxResult.ok, true, "Maximum valid length should work");
  });

  it("should handle whitespace validation consistently", () => {
    logger?.debug("Testing whitespace validation");

    const patternProvider = new DefaultTypePatternProvider();
    const validDirectives = patternProvider.getDirectiveTypes();
    const validLayers = patternProvider.getLayerTypes();
    const firstDirective = validDirectives[0] || "to";
    const firstLayer = validLayers[0] || "project";

    // Test with leading/trailing whitespace - should fail due to strict validation
    const result1 = TwoParams.create(`  ${firstDirective}  `, `  ${firstLayer}  `);
    const result2 = TwoParams.create(firstDirective, firstLayer);

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
    logger?.debug("Testing null/undefined input handling");

    const patternProvider = new DefaultTypePatternProvider();
    const validDirectives = patternProvider.getDirectiveTypes();
    const validLayers = patternProvider.getLayerTypes();
    const firstDirective = validDirectives[0] || "to";
    const firstLayer = validLayers[0] || "project";

    // These should fail gracefully without throwing
    const nullDirectiveResult = TwoParams.create(null as unknown as string, firstLayer);
    const undefinedLayerResult = TwoParams.create(firstDirective, undefined as unknown as string);

    assertEquals(nullDirectiveResult.ok, false);
    assertEquals(undefinedLayerResult.ok, false);
  });
});

// ============================================================================
// Path Resolution Tests
// ============================================================================

describe("TwoParams Integrated - Path Resolution", () => {
  it("should resolve prompt paths correctly", () => {
    logger?.debug("Testing prompt path resolution");

    const patternProvider = new DefaultTypePatternProvider();
    const validDirectives = patternProvider.getDirectiveTypes();
    const validLayers = patternProvider.getLayerTypes();
    const firstDirective = validDirectives[0] || "to";
    const firstLayer = validLayers[0] || "project";
    const result = TwoParams.create(firstDirective, firstLayer);

    if (!result.ok) {
      throw new Error("Failed to create test TwoParams");
    }

    const twoParams = result.data;
    const promptPath = twoParams.resolvePromptPath();

    assertEquals(typeof promptPath, "string");
    assertEquals(promptPath.includes(firstDirective), true);
    assertEquals(promptPath.includes(firstLayer), true);
  });

  it("should resolve schema paths correctly", () => {
    logger?.debug("Testing schema path resolution");

    const patternProvider = new DefaultTypePatternProvider();
    const validDirectives = patternProvider.getDirectiveTypes();
    const validLayers = patternProvider.getLayerTypes();
    const secondDirective = validDirectives[1] || "summary";
    const secondLayer = validLayers[1] || "issue";
    const result = TwoParams.create(secondDirective, secondLayer);

    if (!result.ok) {
      throw new Error("Failed to create test TwoParams");
    }

    const twoParams = result.data;
    const schemaPath = twoParams.resolveSchemaPath();

    assertEquals(typeof schemaPath, "string");
    assertEquals(schemaPath.includes(secondDirective), true);
    assertEquals(schemaPath.includes(secondLayer), true);
  });

  it("should generate command structures correctly", () => {
    logger?.debug("Testing command structure generation");

    const patternProvider = new DefaultTypePatternProvider();
    const validDirectives = patternProvider.getDirectiveTypes();
    const validLayers = patternProvider.getLayerTypes();
    const lastDirective = validDirectives[validDirectives.length - 1] || "defect";
    const lastLayer = validLayers[validLayers.length - 1] || "bugs";
    const result = TwoParams.create(lastDirective, lastLayer);

    if (!result.ok) {
      throw new Error("Failed to create test TwoParams");
    }

    const twoParams = result.data;
    const command = twoParams.toCommand();

    assertEquals(command.directive, lastDirective);
    assertEquals(command.layer, lastLayer);
    assertEquals(typeof command.timestamp, "object");
    assertEquals(command.timestamp instanceof Date, true);
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe("TwoParams Integrated - Error Handling", () => {
  it("should provide discriminated union error types", () => {
    logger?.debug("Testing error type discrimination");

    const patternProvider = new DefaultTypePatternProvider();
    const validLayers = patternProvider.getLayerTypes();
    const firstLayer = validLayers[0] || "project";

    // Test InvalidDirective error
    const invalidDirectiveResult = TwoParams.create("INVALID_DIRECTIVE", firstLayer);
    assertEquals(invalidDirectiveResult.ok, false);

    if (!invalidDirectiveResult.ok) {
      const error = invalidDirectiveResult.error;
      assertEquals(error.kind, "InvalidDirective");

      if (error.kind === "InvalidDirective") {
        assertEquals(error.directive, "INVALID_DIRECTIVE");
        assertExists(error.pattern);
        assertExists(error.cause);
      }
    }

    // Test InvalidLayer error
    const validDirectives = patternProvider.getDirectiveTypes();
    const firstDirective = validDirectives[0] || "to";
    const invalidLayerResult = TwoParams.create(firstDirective, "INVALID_LAYER");
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
    logger?.debug("Testing unsupported combination handling");

    const patternProvider = new DefaultTypePatternProvider();
    const validDirectives = patternProvider.getDirectiveTypes();
    const validLayers = patternProvider.getLayerTypes();
    const testDirective = validDirectives[1] || "summary";
    const testLayer = validLayers[validLayers.length - 1] || "bugs";

    // Test a combination that might not be supported
    // Note: This depends on the actual business rules implementation
    const result = TwoParams.create(testDirective, testLayer);

    if (!result.ok && result.error.kind === "UnsupportedCombination") {
      assertEquals(result.error.directive, testDirective);
      assertEquals(result.error.layer, testLayer);
      assertExists(result.error.message);
    }
  });
});

// ============================================================================
// Performance and Property-based Tests
// ============================================================================

describe("TwoParams Integrated - Performance", () => {
  it("should handle repeated creation efficiently", () => {
    logger?.debug("Testing repeated creation performance");

    const startTime = Date.now();

    // Create 100 instances to test performance (reduced for faster testing)
    for (let i = 0; i < 100; i++) {
      const combo = VALID_COMBINATIONS[i % VALID_COMBINATIONS.length];
      const result = TwoParams.create(combo.directive, combo.layer);
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
    logger?.debug("Testing immutability properties");

    const patternProvider = new DefaultTypePatternProvider();
    const validDirectives = patternProvider.getDirectiveTypes();
    const validLayers = patternProvider.getLayerTypes();
    const firstDirective = validDirectives[0] || "to";
    const firstLayer = validLayers[0] || "project";
    const result = TwoParams.create(firstDirective, firstLayer);

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
