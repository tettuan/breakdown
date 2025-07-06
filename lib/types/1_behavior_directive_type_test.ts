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
import { DirectiveType, TwoParamsDirectivePattern } from "./directive_type.ts";
import type { TwoParams_Result } from "../deps.ts";

// Test helper to create valid TwoParams_Result
const createTwoParamsResult = (
  demonstrativeType: string,
  layerType: string = "project",
  options: Record<string, unknown> = {}
): TwoParams_Result => ({
  type: "two",
  demonstrativeType,
  layerType,
  params: [demonstrativeType, layerType],
  options,
});

Deno.test("1_behavior: DirectiveType correctly extracts demonstrativeType value", () => {
  const testCases = [
    { input: "to", expected: "to" },
    { input: "summary", expected: "summary" },
    { input: "defect", expected: "defect" },
    { input: "analyze", expected: "analyze" },
    { input: "custom_directive", expected: "custom_directive" },
    { input: "with-hyphen", expected: "with-hyphen" },
    { input: "with_underscore", expected: "with_underscore" },
    { input: "123numeric", expected: "123numeric" },
    { input: "", expected: "" }, // Empty string edge case
  ];

  for (const { input, expected } of testCases) {
    const result = createTwoParamsResult(input);
    const directiveType = DirectiveType.create(result);
    
    assertEquals(directiveType.value, expected);
    assertEquals(directiveType.getValue(), expected); // Deprecated method compatibility
  }
});

Deno.test("1_behavior: DirectiveType equality comparison works correctly", () => {
  // Same values should be equal
  const directive1 = DirectiveType.create(createTwoParamsResult("to"));
  const directive2 = DirectiveType.create(createTwoParamsResult("to"));
  assertEquals(directive1.equals(directive2), true);
  assertEquals(directive2.equals(directive1), true);

  // Different values should not be equal
  const directive3 = DirectiveType.create(createTwoParamsResult("summary"));
  assertEquals(directive1.equals(directive3), false);
  assertEquals(directive3.equals(directive1), false);

  // Self equality
  assertEquals(directive1.equals(directive1), true);

  // Edge cases
  const emptyDirective1 = DirectiveType.create(createTwoParamsResult(""));
  const emptyDirective2 = DirectiveType.create(createTwoParamsResult(""));
  assertEquals(emptyDirective1.equals(emptyDirective2), true);
});

Deno.test("1_behavior: DirectiveType preserves original TwoParams_Result data", () => {
  const complexOptions = {
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

  const result = createTwoParamsResult("transform", "module", complexOptions);
  const directiveType = DirectiveType.create(result);

  // Core value extraction
  assertEquals(directiveType.value, "transform");

  // Original result preservation
  const original = directiveType.originalResult;
  assertEquals(original.demonstrativeType, "transform");
  assertEquals(original.layerType, "module");
  assertEquals(original.type, "two");
  assertEquals(original.options.debug, true);
  assertEquals(original.options.profile, "production");
  assertEquals(Array.isArray(original.options.features), true);
  assertEquals((original.options.features as unknown[]).length, 2);
  assertEquals((original.options.metadata as any).nested.deep.value, "deeply nested");
});

Deno.test("1_behavior: DirectiveType toString provides consistent format", () => {
  const testCases = [
    { value: "to", expected: "DirectiveType(to)" },
    { value: "summary", expected: "DirectiveType(summary)" },
    { value: "custom-value", expected: "DirectiveType(custom-value)" },
    { value: "", expected: "DirectiveType()" },
    { value: "very_long_directive_type_name_that_exceeds_normal_length", 
      expected: "DirectiveType(very_long_directive_type_name_that_exceeds_normal_length)" },
  ];

  for (const { value, expected } of testCases) {
    const directiveType = DirectiveType.create(createTwoParamsResult(value));
    assertEquals(directiveType.toString(), expected);
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

Deno.test("1_behavior: DirectiveType handles special characters in demonstrativeType", () => {
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
    const directiveType = DirectiveType.create(result);
    
    // DirectiveType doesn't validate - it trusts TwoParams_Result
    assertEquals(directiveType.value, specialValue);
    assertEquals(directiveType.originalResult.demonstrativeType, specialValue);
  }
});

Deno.test("1_behavior: DirectiveType works with different layerType values", () => {
  const layerTypes = ["project", "issue", "task", "epic", "story", "custom"];
  const demonstrativeType = "analyze";

  for (const layerType of layerTypes) {
    const result = createTwoParamsResult(demonstrativeType, layerType);
    const directiveType = DirectiveType.create(result);
    
    // DirectiveType focuses on demonstrativeType
    assertEquals(directiveType.value, demonstrativeType);
    
    // But preserves the full context
    assertEquals(directiveType.originalResult.layerType, layerType);
  }
});

Deno.test("1_behavior: DirectiveType maintains consistency across multiple accesses", () => {
  const result = createTwoParamsResult("consistent");
  const directiveType = DirectiveType.create(result);

  // Multiple accesses should return the same value
  const value1 = directiveType.value;
  const value2 = directiveType.value;
  const value3 = directiveType.getValue();
  
  assertEquals(value1, "consistent");
  assertEquals(value2, "consistent");
  assertEquals(value3, "consistent");
  assertEquals(value1, value2);
  assertEquals(value2, value3);

  // Original result should remain unchanged
  const original1 = directiveType.originalResult;
  const original2 = directiveType.originalResult;
  
  assertEquals(original1.demonstrativeType, "consistent");
  assertEquals(original2.demonstrativeType, "consistent");
});