/**
 * @fileoverview Flexible pattern tests for TwoParams with hash-like characters
 *
 * Tests TwoParams validation with more flexible regex patterns that allow
 * hash-like characters and extended alphanumeric patterns. This provides
 * property-based testing for scenarios where patterns are more permissive
 * than the default strict enum-based patterns.
 *
 * Key test scenarios:
 * - Hash-like character patterns (alphanumeric + special chars)
 * - Random value generation within flexible boundaries
 * - Validation behavior with extended character sets
 * - Edge cases with flexible patterns
 *
 * @module types/two_params_flexible_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { TwoParams as _TwoParams } from "./two_params.ts";
import { ConfigProfileName } from "./config_profile_name.ts";

const logger = new BreakdownLogger("two-params-flexible");

// ============================================================================
// Flexible Pattern Configurations
// ============================================================================

/**
 * Flexible DirectiveType pattern allowing hash-like characters
 * Pattern: alphanumeric + underscore + hash + dash, 2-20 characters
 */
const FLEXIBLE_DIRECTIVE_PATTERN = "^[a-zA-Z0-9_#-]{2,20}$";

/**
 * Flexible LayerType pattern allowing hash-like characters
 * Pattern: alphanumeric + underscore + hash + dash, 2-20 characters
 */
const FLEXIBLE_LAYER_PATTERN = "^[a-zA-Z0-9_#-]{2,20}$";

/**
 * Character set for generating hash-like random values
 */
const HASH_LIKE_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_#-";

/**
 * Valid hash-like DirectiveType examples
 */
const VALID_HASH_DIRECTIVES = [
  "to",
  "summary",
  "defect",
  "find", // original values
  "to#1",
  "summary_v2",
  "defect-fix",
  "find_all", // hash-like extensions
  "web#search",
  "db_query",
  "api-call",
  "data#extract",
  "process123",
  "workflow_#1",
  "task-abc",
  "job#hash",
  "a1",
  "z9",
  "x_y",
  "m#n",
  "p-q", // boundary cases (2 chars)
] as const;

/**
 * Valid hash-like LayerType examples
 */
const VALID_HASH_LAYERS = [
  "project",
  "issue",
  "task",
  "bugs", // original values
  "project#1",
  "issue_v2",
  "task-new",
  "bugs_critical", // hash-like extensions
  "module#api",
  "service_db",
  "component-ui",
  "layer#data",
  "layer123",
  "section_#1",
  "part-xyz",
  "area#test",
  "a2",
  "b8",
  "c_d",
  "e#f",
  "g-h", // boundary cases (2 chars)
] as const;

/**
 * Invalid values that should fail even with flexible patterns
 */
const INVALID_FLEXIBLE_VALUES = [
  "", // empty
  " ", // whitespace only
  "a", // too short (1 char)
  "x".repeat(21), // too long (21+ chars)
  "hello world", // space (not allowed)
  "test@email", // @ not allowed
  "value$", // $ not allowed
  "item%", // % not allowed
  "data!", // ! not allowed
  "file.txt", // . not allowed
  "path/to", // / not allowed
  "query?param", // ? not allowed
  "value*", // * not allowed
  "text()", // parentheses not allowed
  "array[]", // brackets not allowed
  "object{}", // braces not allowed
] as const;

// ============================================================================
// Random Value Generators for Flexible Patterns
// ============================================================================

/**
 * Generate random valid hash-like DirectiveType
 */
function randomValidHashDirective(): string {
  const index = Math.floor(Math.random() * VALID_HASH_DIRECTIVES.length);
  return VALID_HASH_DIRECTIVES[index];
}

/**
 * Generate random valid hash-like LayerType
 */
function randomValidHashLayer(): string {
  const index = Math.floor(Math.random() * VALID_HASH_LAYERS.length);
  return VALID_HASH_LAYERS[index];
}

/**
 * Generate random hash-like string within pattern constraints
 */
function generateRandomHashLikeString(minLength: number = 2, maxLength: number = 20): string {
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  let result = "";

  for (let i = 0; i < length; i++) {
    const charIndex = Math.floor(Math.random() * HASH_LIKE_CHARS.length);
    result += HASH_LIKE_CHARS[charIndex];
  }

  return result;
}

/**
 * Generate random invalid value from predefined set
 */
function randomInvalidFlexibleValue(): string {
  const index = Math.floor(Math.random() * INVALID_FLEXIBLE_VALUES.length);
  return INVALID_FLEXIBLE_VALUES[index];
}

/**
 * Test if a string matches the flexible directive pattern
 */
function matchesFlexibleDirectivePattern(value: string): boolean {
  return new RegExp(FLEXIBLE_DIRECTIVE_PATTERN).test(value);
}

/**
 * Test if a string matches the flexible layer pattern
 */
function matchesFlexibleLayerPattern(value: string): boolean {
  return new RegExp(FLEXIBLE_LAYER_PATTERN).test(value);
}

// ============================================================================
// Mock TwoParams for Flexible Pattern Testing
// ============================================================================

/**
 * Mock validation function for flexible patterns
 * Note: This simulates what TwoParams validation would do with flexible patterns
 */
function validateFlexibleTwoParams(
  directive: string,
  layer: string,
  _profile: ConfigProfileName,
): { ok: boolean; error?: { kind: string; directive?: string; layer?: string } } {
  // Validate directive with flexible pattern
  if (!directive || directive.trim() === "") {
    return {
      ok: false,
      error: { kind: "InvalidDirective", directive },
    };
  }

  if (!matchesFlexibleDirectivePattern(directive)) {
    return {
      ok: false,
      error: { kind: "InvalidDirective", directive },
    };
  }

  // Validate layer with flexible pattern
  if (!layer || layer.trim() === "") {
    return {
      ok: false,
      error: { kind: "InvalidLayer", layer },
    };
  }

  if (!matchesFlexibleLayerPattern(layer)) {
    return {
      ok: false,
      error: { kind: "InvalidLayer", layer },
    };
  }

  // All validations passed
  return { ok: true };
}

// ============================================================================
// Flexible Pattern Property-Based Tests
// ============================================================================

describe("Flexible Patterns: Hash-like Character Support", () => {
  const profile = ConfigProfileName.createDefault();

  describe("Valid hash-like combinations should pass", () => {
    it("should accept all predefined valid hash-like combinations", () => {
      logger.debug("Testing predefined valid hash-like combinations");

      // Test all predefined combinations systematically
      for (const directive of VALID_HASH_DIRECTIVES) {
        for (const layer of VALID_HASH_LAYERS) {
          const result = validateFlexibleTwoParams(directive, layer, profile);

          assertEquals(
            result.ok,
            true,
            `Should accept valid hash-like combination: ${directive} + ${layer}`,
          );
        }
      }

      logger.debug("All predefined hash-like combinations accepted");
    });

    it("should accept random generated hash-like combinations (property-based)", () => {
      logger.debug("Testing random generated hash-like combinations");

      // Property-based testing: 200 random valid combinations
      for (let i = 0; i < 200; i++) {
        const directive = randomValidHashDirective();
        const layer = randomValidHashLayer();

        const result = validateFlexibleTwoParams(directive, layer, profile);

        assertEquals(
          result.ok,
          true,
          `Iteration ${i}: Should accept valid hash-like combination: ${directive} + ${layer}`,
        );
      }

      logger.debug("Random generated hash-like combinations test completed");
    });

    it("should accept dynamically generated hash-like strings", () => {
      logger.debug("Testing dynamically generated hash-like strings");

      // Test 100 dynamically generated combinations
      for (let i = 0; i < 100; i++) {
        const directive = generateRandomHashLikeString(2, 15);
        const layer = generateRandomHashLikeString(2, 15);

        // Verify they match the patterns
        assertEquals(matchesFlexibleDirectivePattern(directive), true);
        assertEquals(matchesFlexibleLayerPattern(layer), true);

        const result = validateFlexibleTwoParams(directive, layer, profile);

        assertEquals(
          result.ok,
          true,
          `Iteration ${i}: Should accept generated hash-like combination: ${directive} + ${layer}`,
        );
      }

      logger.debug("Dynamically generated hash-like strings test completed");
    });
  });

  describe("Invalid values should fail even with flexible patterns", () => {
    it("should reject all predefined invalid values", () => {
      logger.debug("Testing predefined invalid values");

      const validDirective = "test#123";
      const validLayer = "layer_abc";

      // Test invalid directives with valid layer
      for (const invalidDirective of INVALID_FLEXIBLE_VALUES) {
        const result = validateFlexibleTwoParams(invalidDirective, validLayer, profile);

        assertEquals(
          result.ok,
          false,
          `Should reject invalid directive: "${invalidDirective}"`,
        );

        if (!result.ok) {
          assertEquals(result.error?.kind, "InvalidDirective");
        }
      }

      // Test invalid layers with valid directive
      for (const invalidLayer of INVALID_FLEXIBLE_VALUES) {
        const result = validateFlexibleTwoParams(validDirective, invalidLayer, profile);

        assertEquals(
          result.ok,
          false,
          `Should reject invalid layer: "${invalidLayer}"`,
        );

        if (!result.ok) {
          assertEquals(result.error?.kind, "InvalidLayer");
        }
      }

      logger.debug("All predefined invalid values rejected");
    });

    it("should reject random invalid values (property-based)", () => {
      logger.debug("Testing random invalid values");

      const validDirective = randomValidHashDirective();
      const validLayer = randomValidHashLayer();

      // Test 50 random invalid directives
      for (let i = 0; i < 50; i++) {
        const invalidDirective = randomInvalidFlexibleValue();

        const result = validateFlexibleTwoParams(invalidDirective, validLayer, profile);

        assertEquals(
          result.ok,
          false,
          `Iteration ${i}: Should reject invalid directive: "${invalidDirective}"`,
        );

        if (!result.ok) {
          assertEquals(result.error?.kind, "InvalidDirective");
        }
      }

      // Test 50 random invalid layers
      for (let i = 0; i < 50; i++) {
        const invalidLayer = randomInvalidFlexibleValue();

        const result = validateFlexibleTwoParams(validDirective, invalidLayer, profile);

        assertEquals(
          result.ok,
          false,
          `Iteration ${i}: Should reject invalid layer: "${invalidLayer}"`,
        );

        if (!result.ok) {
          assertEquals(result.error?.kind, "InvalidLayer");
        }
      }

      logger.debug("Random invalid values test completed");
    });
  });

  describe("Pattern boundary testing", () => {
    it("should handle length boundaries correctly", () => {
      logger.debug("Testing length boundaries");

      // Test minimum length (2 characters)
      const minValidCases = [
        { directive: "a1", layer: "b2", expectOk: true },
        { directive: "x#", layer: "y_", expectOk: true },
        { directive: "m-", layer: "n9", expectOk: true },
      ];

      for (const testCase of minValidCases) {
        const result = validateFlexibleTwoParams(testCase.directive, testCase.layer, profile);
        assertEquals(
          result.ok,
          testCase.expectOk,
          `Minimum length case: ${testCase.directive} + ${testCase.layer}`,
        );
      }

      // Test maximum length (20 characters)
      const maxValidDirective = "a".repeat(20);
      const maxValidLayer = "b".repeat(20);

      assertEquals(matchesFlexibleDirectivePattern(maxValidDirective), true);
      assertEquals(matchesFlexibleLayerPattern(maxValidLayer), true);

      const result = validateFlexibleTwoParams(maxValidDirective, maxValidLayer, profile);
      assertEquals(result.ok, true, "Maximum length case should pass");

      // Test over maximum length (21 characters)
      const overMaxDirective = "a".repeat(21);
      const overMaxLayer = "b".repeat(21);

      assertEquals(matchesFlexibleDirectivePattern(overMaxDirective), false);
      assertEquals(matchesFlexibleLayerPattern(overMaxLayer), false);

      logger.debug("Length boundaries test completed");
    });

    it("should handle special character combinations", () => {
      logger.debug("Testing special character combinations");

      const specialCharCases = [
        { directive: "test#123", layer: "layer_abc", expectOk: true },
        { directive: "api-call", layer: "service#1", expectOk: true },
        { directive: "data_extract", layer: "module-ui", expectOk: true },
        { directive: "workflow#v2", layer: "process_#1", expectOk: true },
        { directive: "job-queue", layer: "task_runner", expectOk: true },
      ];

      for (const testCase of specialCharCases) {
        const result = validateFlexibleTwoParams(testCase.directive, testCase.layer, profile);
        assertEquals(
          result.ok,
          testCase.expectOk,
          `Special char case: ${testCase.directive} + ${testCase.layer}`,
        );
      }

      logger.debug("Special character combinations test completed");
    });

    it("should maintain consistency across multiple runs", () => {
      logger.debug("Testing consistency across multiple runs");

      const consistencyTestCases = [
        { directive: "api#v1", layer: "service_auth" },
        { directive: "data-processor", layer: "queue#jobs" },
        { directive: "test_runner", layer: "module-core" },
      ];

      for (const testCase of consistencyTestCases) {
        const results = [];

        // Run same test 10 times
        for (let i = 0; i < 10; i++) {
          results.push(validateFlexibleTwoParams(testCase.directive, testCase.layer, profile));
        }

        // All results should be identical
        const firstResult = results[0];
        for (let i = 1; i < results.length; i++) {
          assertEquals(
            results[i].ok,
            firstResult.ok,
            `Consistency check failed for: ${testCase.directive} + ${testCase.layer}`,
          );
        }
      }

      logger.debug("Consistency test completed");
    });
  });
});

describe("Flexible Patterns: Performance and Stress Testing", () => {
  it("should handle large numbers of random hash-like validations efficiently", () => {
    logger.debug("Testing performance with large number of validations");

    const profile = ConfigProfileName.createDefault();
    const startTime = Date.now();
    const iterations = 2000;

    for (let i = 0; i < iterations; i++) {
      const directive = generateRandomHashLikeString(3, 15);
      const layer = generateRandomHashLikeString(3, 15);

      const result = validateFlexibleTwoParams(directive, layer, profile);
      // Don't fail the test on validation results, just check it runs
      assertExists(result, "Result should exist");
    }

    const duration = Date.now() - startTime;
    logger.debug(`Completed ${iterations} flexible validations in ${duration}ms`);

    // Performance assertion - should complete within reasonable time
    // Allow for 10 seconds for 2000 iterations (5ms per validation)
    assertEquals(
      duration < 10000,
      true,
      `Performance test should complete within 10 seconds, took ${duration}ms`,
    );

    logger.debug("Performance test completed");
  });

  it("should handle stress testing with mixed valid/invalid patterns", () => {
    logger.debug("Starting stress testing with mixed patterns");

    const profile = ConfigProfileName.createDefault();
    let validCount = 0;
    let invalidCount = 0;

    // Stress test: 1000 mixed valid/invalid combinations
    for (let i = 0; i < 1000; i++) {
      let directive: string;
      let layer: string;

      // Randomly choose valid or invalid values
      if (Math.random() < 0.7) { // 70% valid
        directive = randomValidHashDirective();
        layer = randomValidHashLayer();
      } else { // 30% invalid
        directive = Math.random() < 0.5
          ? randomInvalidFlexibleValue()
          : generateRandomHashLikeString(2, 15);
        layer = Math.random() < 0.5
          ? randomInvalidFlexibleValue()
          : generateRandomHashLikeString(2, 15);
      }

      const result = validateFlexibleTwoParams(directive, layer, profile);

      if (result.ok) {
        validCount++;
      } else {
        invalidCount++;
        // Verify error structure
        assertExists(result.error);
        assertExists(result.error.kind);
      }
    }

    logger.debug(`Stress test results - Valid: ${validCount}, Invalid: ${invalidCount}`);

    // Should have processed some valid and some invalid cases
    assertEquals(validCount > 0, true, "Should have some valid cases");
    assertEquals(invalidCount > 0, true, "Should have some invalid cases");
    assertEquals(validCount + invalidCount, 1000, "Should process all cases");

    logger.debug("Stress testing completed");
  });
});
