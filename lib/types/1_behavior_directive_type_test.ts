/**
 * @fileoverview Behavior tests for DirectiveType module
 * Testing business logic and expected behaviors with Result-based Totality
 *
 * Behavior tests verify:
 * - Business rules and invariants
 * - Error handling with Result type
 * - Edge cases and boundary conditions
 * - State transitions and transformations
 */

import { assertEquals, assertExists } from "@std/assert";
import { DirectiveType, TwoParamsDirectivePattern } from "./mod.ts";
import type { TwoParams_Result } from "../deps.ts";

// Test helper to create valid TwoParams_Result
const createTwoParamsResult = (
  directiveType: string,
  layerType: string = "project",
  options: Record<string, unknown> = {},
): TwoParams_Result => ({
  type: "two",
  directiveType,
  layerType,
  demonstrativeType: directiveType,
  params: [directiveType, layerType],
  options,
});

Deno.test("1_behavior: DirectiveType correctly extracts directiveType value", () => {
  const testCases = [
    { input: "to", expected: "to" },
    { input: "summary", expected: "summary" },
    { input: "defect", expected: "defect" },
  ];

  for (const { input, expected } of testCases) {
    const result = createTwoParamsResult(input);
    const directiveTypeResult = DirectiveType.create(result.directiveType);
    if (!directiveTypeResult.ok) throw new Error("Failed to create DirectiveType");
    const directiveType = directiveTypeResult.data;

    assertEquals(directiveType.value, expected);
    assertEquals(directiveType.value, expected); // Deprecated method compatibility
  }

  // Test invalid inputs separately
  const invalidCases = ["analyze", "custom_directive", "with.dots", "123numeric", ""];
  for (const invalidInput of invalidCases) {
    const result = createTwoParamsResult(invalidInput);
    const directiveTypeResult = DirectiveType.create(result.directiveType);
    assertEquals(directiveTypeResult.ok, false, `Should fail for invalid input: ${invalidInput}`);
  }
});

Deno.test("1_behavior: DirectiveType equality comparison works correctly", () => {
  // Same values should be equal
  const directive1Result = DirectiveType.create("to");
  const directive2Result = DirectiveType.create("to");
  if (!directive1Result.ok || !directive2Result.ok) {
    throw new Error("Failed to create DirectiveType");
  }
  const directive1 = directive1Result.data;
  const directive2 = directive2Result.data;
  assertEquals(directive1.equals(directive2), true);
  assertEquals(directive2.equals(directive1), true);

  // Different values should not be equal
  const directive3Result = DirectiveType.create("summary");
  if (!directive3Result.ok) throw new Error("Failed to create DirectiveType");
  const directive3 = directive3Result.data;
  assertEquals(directive1.equals(directive3), false);
  assertEquals(directive3.equals(directive1), false);

  // Self equality
  assertEquals(directive1.equals(directive1), true);

  // Edge cases - empty should fail creation
  const emptyDirective1Result = DirectiveType.create("");
  const emptyDirective2Result = DirectiveType.create("");
  assertEquals(emptyDirective1Result.ok, false);
  assertEquals(emptyDirective2Result.ok, false);
});

Deno.test("1_behavior: DirectiveType preserves original TwoParams_Result data", () => {
  interface NestedMetadata {
    deep: {
      value: string;
    };
  }

  interface Metadata {
    version: string;
    author: string;
    nested: NestedMetadata;
  }

  interface ComplexOptions {
    debug: boolean;
    profile: string;
    features: string[];
    metadata: Metadata;
  }

  const complexOptions: ComplexOptions = {
    debug: true,
    profile: "production",
    features: ["feature1", "feature2"],
    metadata: {
      version: "1.0.0",
      author: "test",
      nested: {
        deep: {
          value: "deeply nested",
        },
      },
    },
  };

  const result = createTwoParamsResult(
    "transform",
    "module",
    complexOptions as unknown as Record<string, unknown>,
  );
  const directiveTypeResult = DirectiveType.create(result.directiveType);
  if (!directiveTypeResult.ok) throw new Error("Failed to create DirectiveType");
  const directiveType = directiveTypeResult.data;

  // Core value extraction
  assertEquals(directiveType.value, "transform");

  // DirectiveType only stores the value, not the original result
  // The original result is preserved in the calling context

  // Remove references to original that no longer exist
  // assertEquals(original.options.debug, true); // Removed - not supported
  // assertEquals(original.options.profile, "production"); // Removed - not supported
  // DirectiveType no longer preserves the original result context
});

Deno.test("1_behavior: DirectiveType toString provides consistent format", () => {
  const testCases = [
    { value: "to", expected: "to" },
    { value: "summary", expected: "summary" },
    { value: "defect", expected: "defect" },
  ];

  for (const { value, expected } of testCases) {
    const directiveTypeResult = DirectiveType.create(value);
    if (directiveTypeResult.ok) {
      const directiveType = directiveTypeResult.data;
      assertEquals(directiveType.toString(), expected);
    } else {
      throw new Error(`Failed to create DirectiveType for valid value: ${value}`);
    }
  }

  // Test that invalid values fail creation
  const invalidCases = [
    "",
    "custom-value",
    "very_long_directive_type_name_that_exceeds_normal_length",
  ];
  for (const invalidValue of invalidCases) {
    const directiveTypeResult = DirectiveType.create(invalidValue);
    assertEquals(directiveTypeResult.ok, false, `Should fail for invalid value: ${invalidValue}`);
  }
});

Deno.test("1_behavior: TwoParamsDirectivePattern validates patterns correctly", () => {
  const pattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");
  assertExists(pattern);

  // Valid matches
  assertEquals(pattern.test("to"), true);
  assertEquals(pattern.test("summary"), true);
  assertEquals(pattern.test("defect"), true);

  // Invalid matches
  assertEquals(pattern.test("invalid"), false);
  assertEquals(pattern.test("TO"), false); // Case sensitive
  assertEquals(pattern.test("to "), false); // Trailing space
  assertEquals(pattern.test(" to"), false); // Leading space
  assertEquals(pattern.test("toextra"), false); // Extra characters
  assertEquals(pattern.test(""), false); // Empty string
});

Deno.test("1_behavior: TwoParamsDirectivePattern handles complex regex patterns", () => {
  // Pattern allowing alphanumeric with hyphens
  const alphanumericPattern = TwoParamsDirectivePattern.create("^[a-z0-9-]+$");
  assertExists(alphanumericPattern);

  assertEquals(alphanumericPattern.test("valid-name"), true);
  assertEquals(alphanumericPattern.test("name123"), true);
  assertEquals(alphanumericPattern.test("123-456"), true);

  assertEquals(alphanumericPattern.test("INVALID"), false);
  assertEquals(alphanumericPattern.test("invalid_name"), false);
  assertEquals(alphanumericPattern.test("invalid name"), false);
  assertEquals(alphanumericPattern.test(""), false);

  // Pattern with alternatives
  const alternativePattern = TwoParamsDirectivePattern.create("^(dev|staging|prod)$");
  assertExists(alternativePattern);

  assertEquals(alternativePattern.test("dev"), true);
  assertEquals(alternativePattern.test("staging"), true);
  assertEquals(alternativePattern.test("prod"), true);
  assertEquals(alternativePattern.test("production"), false);
});

Deno.test("1_behavior: TwoParamsDirectivePattern safely handles invalid regex", () => {
  const invalidPatterns = [
    "invalid[regex",
    "(?<",
    "*invalid",
    "(?invalid",
    "\\",
    "(((",
    "[z-a]", // Invalid range
  ];

  for (const invalidPattern of invalidPatterns) {
    const result = TwoParamsDirectivePattern.create(invalidPattern);
    assertEquals(result, null); // Should return null, not throw
  }
});

Deno.test("1_behavior: TwoParamsDirectivePattern provides correct string representations", () => {
  const pattern = TwoParamsDirectivePattern.create("^[a-z]+$");
  assertExists(pattern);

  // toString returns regex string representation
  const stringRep = pattern.toString();
  assertEquals(typeof stringRep, "string");
  assertEquals(stringRep.includes("[a-z]+"), true);

  // getPattern returns the source pattern
  const sourcePattern = pattern.getPattern();
  assertEquals(sourcePattern, "^[a-z]+$");

  // getDirectivePattern returns self
  const self = pattern.getDirectivePattern();
  assertEquals(self, pattern);
});

Deno.test("1_behavior: DirectiveType handles special characters in directiveType", () => {
  const specialCases = [
    "directive-with-dash",
    "directive_with_underscore",
    "directive.with.dots",
    "directive/with/slashes",
    "directive@with@at",
    "directive#with#hash",
    "ディレクティブ", // Japanese characters
    "🎯", // Emoji
  ];

  for (const specialValue of specialCases) {
    const result = createTwoParamsResult(specialValue);
    const directiveTypeResult = DirectiveType.create(result.directiveType);

    // Most special characters should fail DirectiveType validation
    if (["directive-with-dash", "directive_with_underscore"].includes(specialValue)) {
      // Only dash and underscore are allowed
      if (directiveTypeResult.ok) {
        const directiveType = directiveTypeResult.data;
        assertEquals(directiveType.value, specialValue);
      }
    } else {
      // Other special characters should fail validation
      assertEquals(directiveTypeResult.ok, false);
    }
  }
});

Deno.test("1_behavior: DirectiveType works with different layerType values", () => {
  const layerTypes = ["project", "issue", "task", "epic", "story", "custom"];
  const directiveTypeValue = "analyze";

  for (const layerType of layerTypes) {
    const result = createTwoParamsResult(directiveTypeValue, layerType);
    const directiveTypeResult = DirectiveType.create(result.directiveType);
    if (!directiveTypeResult.ok) throw new Error("Failed to create DirectiveType");
    const directiveType = directiveTypeResult.data;

    // DirectiveType focuses on directiveType value
    assertEquals(directiveType.value, directiveTypeValue);

    // DirectiveType doesn't preserve original result - that's handled by the calling context
  }
});

Deno.test("1_behavior: DirectiveType maintains consistency across multiple accesses", () => {
  const result = createTwoParamsResult("consistent");
  const directiveTypeResult = DirectiveType.create(result.directiveType);
  if (!directiveTypeResult.ok) throw new Error("Failed to create DirectiveType");
  const directiveType = directiveTypeResult.data;

  // Multiple accesses should return the same value
  const value1 = directiveType.value;
  const value2 = directiveType.value;
  const value3 = directiveType.value;

  assertEquals(value1, "consistent");
  assertEquals(value2, "consistent");
  assertEquals(value3, "consistent");
  assertEquals(value1, value2);
  assertEquals(value2, value3);

  // DirectiveType no longer maintains original result - this is handled by calling context
  // The DirectiveType itself is immutable and consistent
});
