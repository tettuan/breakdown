import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { ValidationRule } from "./validation_rule.ts";

describe("1_behavior_validation_rule_test", () => {
  it("should handle valid inputs correctly", () => {
    // Test basic validation with valid input
    const rule = ValidationRule.create(
      "test_rule",
      (value: string) => value.length > 0,
      "Value must not be empty",
    );

    const result = rule.validate("valid_input");
    assertEquals(result.isValid, true);
    assertEquals(result.errorMessage, undefined);
    assertEquals(result.appliedRules, ["test_rule"]);

    // Test required field with valid input
    const requiredRule = ValidationRule.required<string>("username");
    const validResult = requiredRule.validate("john_doe");
    assertEquals(validResult.isValid, true);
    assertEquals(validResult.errorMessage, undefined);
    assertEquals(validResult.appliedRules, ["required_username"]);

    // Test minLength with valid input
    const minLengthRule = ValidationRule.minLength(5, "password");
    const validMinResult = minLengthRule.validate("password123");
    assertEquals(validMinResult.isValid, true);
    assertEquals(validMinResult.errorMessage, undefined);
    assertEquals(validMinResult.appliedRules, ["minLength_5_password"]);

    // Test maxLength with valid input
    const maxLengthRule = ValidationRule.maxLength(10, "username");
    const validMaxResult = maxLengthRule.validate("short");
    assertEquals(validMaxResult.isValid, true);
    assertEquals(validMaxResult.errorMessage, undefined);
    assertEquals(validMaxResult.appliedRules, ["maxLength_10_username"]);

    // Test pattern with valid input
    const patternRule = ValidationRule.pattern(/^[a-z]+$/, "fieldName");
    const validPatternResult = patternRule.validate("lowercase");
    assertEquals(validPatternResult.isValid, true);
    assertEquals(validPatternResult.errorMessage, undefined);
    assertEquals(validPatternResult.appliedRules, ["pattern_fieldName"]);

    // Test range with valid input
    const rangeRule = ValidationRule.range(1, 100, "age");
    const validRangeResult = rangeRule.validate(25);
    assertEquals(validRangeResult.isValid, true);
    assertEquals(validRangeResult.errorMessage, undefined);
    assertEquals(validRangeResult.appliedRules, ["range_1_100_age"]);
  });

  it("should handle invalid inputs with proper errors", () => {
    // Test basic validation with invalid input
    const rule = ValidationRule.create(
      "test_rule",
      (value: string) => value.length > 0,
      "Value must not be empty",
    );

    const result = rule.validate("");
    assertEquals(result.isValid, false);
    assertEquals(result.errorMessage, "Value must not be empty");
    assertEquals(result.appliedRules, ["test_rule"]);

    // Test required field with invalid input
    const requiredRule = ValidationRule.required<string>("username");
    const nullResult = requiredRule.validate(null);
    assertEquals(nullResult.isValid, false);
    assertEquals(nullResult.errorMessage, "username is required");
    assertEquals(nullResult.appliedRules, ["required_username"]);

    const undefinedResult = requiredRule.validate(undefined);
    assertEquals(undefinedResult.isValid, false);
    assertEquals(undefinedResult.errorMessage, "username is required");
    assertEquals(undefinedResult.appliedRules, ["required_username"]);

    // Test minLength with invalid input
    const minLengthRule = ValidationRule.minLength(5, "password");
    const invalidMinResult = minLengthRule.validate("abc");
    assertEquals(invalidMinResult.isValid, false);
    assertEquals(invalidMinResult.errorMessage, "password must be at least 5 characters long");
    assertEquals(invalidMinResult.appliedRules, ["minLength_5_password"]);

    // Test maxLength with invalid input
    const maxLengthRule = ValidationRule.maxLength(10, "username");
    const invalidMaxResult = maxLengthRule.validate("very_long_username");
    assertEquals(invalidMaxResult.isValid, false);
    assertEquals(invalidMaxResult.errorMessage, "username must not exceed 10 characters");
    assertEquals(invalidMaxResult.appliedRules, ["maxLength_10_username"]);

    // Test pattern with invalid input
    const patternRule = ValidationRule.pattern(/^[a-z]+$/, "fieldName");
    const invalidPatternResult = patternRule.validate("UPPERCASE");
    assertEquals(invalidPatternResult.isValid, false);
    assertEquals(
      invalidPatternResult.errorMessage,
      "fieldName does not match the required pattern",
    );
    assertEquals(invalidPatternResult.appliedRules, ["pattern_fieldName"]);

    // Test range with invalid input
    const rangeRule = ValidationRule.range(1, 100, "age");
    const invalidRangeResult = rangeRule.validate(150);
    assertEquals(invalidRangeResult.isValid, false);
    assertEquals(invalidRangeResult.errorMessage, "age must be between 1 and 100");
    assertEquals(invalidRangeResult.appliedRules, ["range_1_100_age"]);
  });

  it("should maintain immutability", () => {
    // Test that withMessage returns new instance
    const originalRule = ValidationRule.create("test", (_v: string) => true, "Original");
    const newRule = originalRule.withMessage("New message");

    assertEquals(originalRule.getErrorMessage(), "Original");
    assertEquals(newRule.getErrorMessage(), "New message");

    // Test that combining rules returns new instance
    const rule1 = ValidationRule.minLength(5, "field");
    const rule2 = ValidationRule.maxLength(10, "field");
    const combined = rule1.and(rule2);

    assertEquals(rule1.getName(), "minLength_5_field");
    assertEquals(rule2.getName(), "maxLength_10_field");
    assertEquals(combined.getName(), "minLength_5_field_and_maxLength_10_field");

    // Test that optional returns new instance
    const requiredRule = ValidationRule.required<string>("field");
    const optionalRule = requiredRule.optional();

    assertEquals(requiredRule.isOptionalRule(), false);
    assertEquals(optionalRule.isOptionalRule(), true);
  });

  it("should follow totality principles", () => {
    // Test that all validation methods produce valid outputs
    const rule = ValidationRule.create("test", (v: string) => v.length > 0, "Error");

    // Valid input produces Result
    const validResult = rule.validate("test");
    assertExists(validResult);
    assertEquals(typeof validResult.isValid, "boolean");
    assertEquals(Array.isArray(validResult.appliedRules), true);

    // Invalid input produces Result (not exception)
    const invalidResult = rule.validate("");
    assertExists(invalidResult);
    assertEquals(typeof invalidResult.isValid, "boolean");
    assertEquals(Array.isArray(invalidResult.appliedRules), true);

    // Test complete error handling coverage
    const requiredRule = ValidationRule.required<string>("field");

    // null input
    const nullResult = requiredRule.validate(null);
    assertExists(nullResult);
    assertEquals(typeof nullResult.isValid, "boolean");

    // undefined input
    const undefinedResult = requiredRule.validate(undefined);
    assertExists(undefinedResult);
    assertEquals(typeof undefinedResult.isValid, "boolean");

    // valid input
    const validStringResult = requiredRule.validate("value");
    assertExists(validStringResult);
    assertEquals(typeof validStringResult.isValid, "boolean");
  });

  it("should handle method chaining correctly", () => {
    // Test and() method chaining
    const rule1 = ValidationRule.minLength(5, "field");
    const rule2 = ValidationRule.maxLength(10, "field");
    const combined = rule1.and(rule2);

    // Valid input (satisfies both rules)
    const validResult = combined.validate("hello");
    assertEquals(validResult.isValid, true);

    // Invalid input (violates first rule)
    const invalidResult1 = combined.validate("hi");
    assertEquals(invalidResult1.isValid, false);

    // Invalid input (violates second rule)
    const invalidResult2 = combined.validate("very_long_string");
    assertEquals(invalidResult2.isValid, false);

    // Test or() method chaining
    const orRule = rule1.or(rule2);
    const orValidResult = orRule.validate("hi"); // Short but satisfies maxLength
    assertEquals(orValidResult.isValid, true);
  });

  it("should handle conditional validation correctly", () => {
    // Test when() method
    const baseRule = ValidationRule.minLength(5, "field");
    const conditionalRule = baseRule.when((context: boolean) => context, true);

    // When condition is true, validation applies
    const conditionTrueResult = conditionalRule.validate("abc");
    assertEquals(conditionTrueResult.isValid, false);

    // When condition is false, validation is skipped
    const conditionalRuleFalse = baseRule.when((context: boolean) => context, false);
    const conditionFalseResult = conditionalRuleFalse.validate("abc");
    assertEquals(conditionFalseResult.isValid, true);
  });

  it("should handle optional validation correctly", () => {
    // Test optional() method
    const requiredRule = ValidationRule.minLength(5, "field");
    const optionalRule = requiredRule.optional();

    // null/undefined should be valid for optional
    const nullResult = optionalRule.validate(null);
    assertEquals(nullResult.isValid, true);

    const undefinedResult = optionalRule.validate(undefined);
    assertEquals(undefinedResult.isValid, true);

    // Non-null values should follow original validation
    const validResult = optionalRule.validate("hello");
    assertEquals(validResult.isValid, true);

    const invalidResult = optionalRule.validate("hi");
    assertEquals(invalidResult.isValid, false);
  });

  it("should handle combined rules correctly", () => {
    // Test combine() static method
    const rule1 = ValidationRule.minLength(3, "field");
    const rule2 = ValidationRule.maxLength(10, "field");
    const rule3 = ValidationRule.pattern(/^[a-z]+$/, "field");

    const combinedRule = ValidationRule.combine([rule1, rule2, rule3]);

    // Valid input (satisfies all rules)
    const validResult = combinedRule.validate("hello");
    assertEquals(validResult.isValid, true);

    // Invalid input (violates minLength)
    const invalidResult1 = combinedRule.validate("hi");
    assertEquals(invalidResult1.isValid, false);

    // Invalid input (violates pattern)
    const invalidResult2 = combinedRule.validate("Hello");
    assertEquals(invalidResult2.isValid, false);

    // Test single rule combine
    const singleRule = ValidationRule.combine([rule1]);
    assertEquals(singleRule.getName(), rule1.getName());
  });

  it("should handle custom validation correctly", () => {
    // Test custom() static method
    const customRule = ValidationRule.custom(
      "even_number",
      (value: number) => value % 2 === 0,
      "Value must be even",
    );

    const validResult = customRule.validate(4);
    assertEquals(validResult.isValid, true);

    const invalidResult = customRule.validate(3);
    assertEquals(invalidResult.isValid, false);
    assertEquals(invalidResult.errorMessage, "Value must be even");
  });

  it("should handle pattern with custom message", () => {
    // Test pattern with custom message
    const patternRule = ValidationRule.pattern(/^[0-9]+$/, "fieldName", "Only numbers allowed");

    const validResult = patternRule.validate("123");
    assertEquals(validResult.isValid, true);

    const invalidResult = patternRule.validate("abc");
    assertEquals(invalidResult.isValid, false);
    assertEquals(invalidResult.errorMessage, "Only numbers allowed");
  });

  it("should handle toString method", () => {
    // Test toString representation
    const rule = ValidationRule.create("test_rule", (_v: string) => true, "Error");
    const result = rule.toString();
    assertEquals(result, "ValidationRule(test_rule)");

    // Test optional rule toString
    const optionalRule = rule.optional();
    const optionalResult = optionalRule.toString();
    assertEquals(optionalResult, "ValidationRule(optional_test_rule, optional)");
  });
});
