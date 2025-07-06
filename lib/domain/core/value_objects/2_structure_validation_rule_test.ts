import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { ValidationResult, ValidationRule } from "./validation_rule.ts";

describe("2_structure_validation_rule_test", () => {
  it("should have correct data structure integrity", () => {
    // Test ValidationRule internal data consistency
    const rule = ValidationRule.create("test_rule", (v: string) => v.length > 0, "Error message");

    // Verify name consistency
    assertEquals(rule.getName(), "test_rule");
    assertEquals(rule.getErrorMessage(), "Error message");
    assertEquals(rule.isOptionalRule(), false);

    // Test that internal state is maintained correctly
    const result = rule.validate("test");
    assertEquals(result.appliedRules[0], "test_rule");

    // Test invariant: rule name should be trimmed
    const ruleWithSpaces = ValidationRule.create(
      "  spaced_rule  ",
      (_v: string) => true,
      "  Error  ",
    );
    assertEquals(ruleWithSpaces.getName(), "spaced_rule");
    assertEquals(ruleWithSpaces.getErrorMessage(), "Error");
  });

  it("should validate discriminated union types", () => {
    // Test ValidationResult discriminated union
    const validRule = ValidationRule.create("valid_rule", (_v: string) => true, "Never fails");
    const invalidRule = ValidationRule.create("invalid_rule", (_v: string) => false, "Always fails");

    // Test valid result structure
    const validResult = validRule.validate("test");
    assertEquals(validResult.isValid, true);
    assertEquals(validResult.errorMessage, undefined);
    assertEquals(Array.isArray(validResult.appliedRules), true);
    assertEquals(validResult.appliedRules.length, 1);

    // Test invalid result structure
    const invalidResult = invalidRule.validate("test");
    assertEquals(invalidResult.isValid, false);
    assertEquals(typeof invalidResult.errorMessage, "string");
    assertEquals(Array.isArray(invalidResult.appliedRules), true);
    assertEquals(invalidResult.appliedRules.length, 1);

    // Test exhaustive ValidationResult handling
    function handleValidationResult(result: ValidationResult): string {
      if (result.isValid) {
        return "Success";
      } else {
        return result.errorMessage || "Unknown error";
      }
    }

    assertEquals(handleValidationResult(validResult), "Success");
    assertEquals(handleValidationResult(invalidResult), "Always fails");
  });

  it("should maintain Result type structure", () => {
    // ValidationRule doesn't use Result<T, E> pattern but ValidationResult
    // Test that ValidationResult maintains consistent structure
    const rule = ValidationRule.create("test", (v: string) => v.length > 0, "Error");

    // Test structure consistency across different scenarios
    const validResult = rule.validate("valid");
    const invalidResult = rule.validate("");

    // Both results should have same structure
    assertExists(validResult.isValid);
    assertExists(validResult.appliedRules);
    assertExists(invalidResult.isValid);
    assertExists(invalidResult.appliedRules);

    // Test that errorMessage is properly typed
    assertEquals(typeof validResult.isValid, "boolean");
    assertEquals(typeof invalidResult.isValid, "boolean");
    assertEquals(Array.isArray(validResult.appliedRules), true);
    assertEquals(Array.isArray(invalidResult.appliedRules), true);

    // Test errorMessage optional property
    if (validResult.errorMessage !== undefined) {
      assertEquals(typeof validResult.errorMessage, "string");
    }
    if (invalidResult.errorMessage !== undefined) {
      assertEquals(typeof invalidResult.errorMessage, "string");
    }
  });

  it("should validate value object constraints", () => {
    // Test business rule enforcement in ValidationRule

    // Constraint: Names must be non-empty and trimmed
    assertThrows(
      () => {
        ValidationRule.create("", (_v: string) => true, "Error");
      },
      Error,
      "Validation rule name cannot be empty",
    );

    assertThrows(
      () => {
        ValidationRule.create("   ", (_v: string) => true, "Error");
      },
      Error,
      "Validation rule name cannot be empty",
    );

    // Constraint: Error messages must be non-empty and trimmed
    assertThrows(
      () => {
        ValidationRule.create("test", (_v: string) => true, "");
      },
      Error,
      "Error message cannot be empty",
    );

    assertThrows(
      () => {
        ValidationRule.create("test", (_v: string) => true, "   ");
      },
      Error,
      "Error message cannot be empty",
    );

    // Constraint: MinLength must be non-negative
    assertThrows(
      () => {
        ValidationRule.minLength(-1, "field");
      },
      Error,
      "Min length must be non-negative",
    );

    // Constraint: MaxLength must be non-negative
    assertThrows(
      () => {
        ValidationRule.maxLength(-1, "field");
      },
      Error,
      "Max length must be non-negative",
    );

    // Constraint: Range min <= max
    assertThrows(
      () => {
        ValidationRule.range(10, 5, "field");
      },
      Error,
      "Min value cannot be greater than max value",
    );

    // Constraint: Combine requires at least one rule
    assertThrows(
      () => {
        ValidationRule.combine([]);
      },
      Error,
      "At least one rule must be provided",
    );
  });

  it("should validate factory method data structures", () => {
    // Test required() factory structure
    const requiredRule = ValidationRule.required<string>("username");
    assertEquals(requiredRule.getName(), "required_username");
    assertEquals(requiredRule.getErrorMessage(), "username is required");
    assertEquals(requiredRule.isOptionalRule(), false);

    // Test minLength() factory structure
    const minLengthRule = ValidationRule.minLength(5, "password");
    assertEquals(minLengthRule.getName(), "minLength_5_password");
    assertEquals(minLengthRule.getErrorMessage(), "password must be at least 5 characters long");
    assertEquals(minLengthRule.isOptionalRule(), false);

    // Test maxLength() factory structure
    const maxLengthRule = ValidationRule.maxLength(10, "username");
    assertEquals(maxLengthRule.getName(), "maxLength_10_username");
    assertEquals(maxLengthRule.getErrorMessage(), "username must not exceed 10 characters");
    assertEquals(maxLengthRule.isOptionalRule(), false);

    // Test pattern() factory structure
    const patternRule = ValidationRule.pattern(/^[a-z]+$/, "fieldName");
    assertEquals(patternRule.getName(), "pattern_fieldName");
    assertEquals(patternRule.getErrorMessage(), "fieldName does not match the required pattern");
    assertEquals(patternRule.isOptionalRule(), false);

    // Test range() factory structure
    const rangeRule = ValidationRule.range(1, 100, "age");
    assertEquals(rangeRule.getName(), "range_1_100_age");
    assertEquals(rangeRule.getErrorMessage(), "age must be between 1 and 100");
    assertEquals(rangeRule.isOptionalRule(), false);

    // Test custom() factory structure
    const customRule = ValidationRule.custom("even", (v: number) => v % 2 === 0, "Must be even");
    assertEquals(customRule.getName(), "even");
    assertEquals(customRule.getErrorMessage(), "Must be even");
    assertEquals(customRule.isOptionalRule(), false);
  });

  it("should validate combination rule structures", () => {
    // Test and() combination structure
    const rule1 = ValidationRule.minLength(5, "field");
    const rule2 = ValidationRule.maxLength(10, "field");
    const andRule = rule1.and(rule2);

    assertEquals(andRule.getName(), "minLength_5_field_and_maxLength_10_field");
    assertEquals(
      andRule.getErrorMessage(),
      "field must be at least 5 characters long AND field must not exceed 10 characters",
    );
    assertEquals(andRule.isOptionalRule(), false);

    // Test or() combination structure
    const orRule = rule1.or(rule2);
    assertEquals(orRule.getName(), "minLength_5_field_or_maxLength_10_field");
    assertEquals(
      orRule.getErrorMessage(),
      "field must be at least 5 characters long OR field must not exceed 10 characters",
    );
    assertEquals(orRule.isOptionalRule(), false);

    // Test combine() static method structure
    const combinedRule = ValidationRule.combine([rule1, rule2]);
    assertEquals(combinedRule.getName(), "combined_minLength_5_field_maxLength_10_field");
    assertEquals(
      combinedRule.getErrorMessage(),
      "field must be at least 5 characters long; field must not exceed 10 characters",
    );
    assertEquals(combinedRule.isOptionalRule(), false);

    // Test single rule combine maintains structure
    const singleCombined = ValidationRule.combine([rule1]);
    assertEquals(singleCombined.getName(), rule1.getName());
    assertEquals(singleCombined.getErrorMessage(), rule1.getErrorMessage());
    assertEquals(singleCombined.isOptionalRule(), rule1.isOptionalRule());
  });

  it("should validate transformation rule structures", () => {
    // Test optional() transformation structure
    const baseRule = ValidationRule.minLength(5, "field");
    const optionalRule = baseRule.optional();

    assertEquals(optionalRule.getName(), "optional_minLength_5_field");
    assertEquals(optionalRule.getErrorMessage(), "field must be at least 5 characters long");
    assertEquals(optionalRule.isOptionalRule(), true);

    // Test when() transformation structure
    const conditionalRule = baseRule.when((context: boolean) => context, true);
    assertEquals(conditionalRule.getName(), "conditional_minLength_5_field");
    assertEquals(conditionalRule.getErrorMessage(), "field must be at least 5 characters long");
    assertEquals(conditionalRule.isOptionalRule(), false);

    // Test withMessage() transformation structure
    const customMessageRule = baseRule.withMessage("Custom error message");
    assertEquals(customMessageRule.getName(), "minLength_5_field");
    assertEquals(customMessageRule.getErrorMessage(), "Custom error message");
    assertEquals(customMessageRule.isOptionalRule(), false);
  });

  it("should validate ValidationResult appliedRules structure", () => {
    // Test single rule appliedRules
    const singleRule = ValidationRule.create("single", (_v: string) => true, "Error");
    const singleResult = singleRule.validate("test");
    assertEquals(singleResult.appliedRules.length, 1);
    assertEquals(singleResult.appliedRules[0], "single");

    // Test combined rule appliedRules structure
    const rule1 = ValidationRule.create("rule1", (_v: string) => true, "Error1");
    const rule2 = ValidationRule.create("rule2", (_v: string) => true, "Error2");
    const combinedRule = ValidationRule.combine([rule1, rule2]);
    const combinedResult = combinedRule.validate("test");
    assertEquals(combinedResult.appliedRules.length, 1);
    assertEquals(combinedResult.appliedRules[0], "combined_rule1_rule2");

    // Test and() rule appliedRules structure
    const andRule = rule1.and(rule2);
    const andResult = andRule.validate("test");
    assertEquals(andResult.appliedRules.length, 1);
    assertEquals(andResult.appliedRules[0], "rule1_and_rule2");

    // Test or() rule appliedRules structure
    const orRule = rule1.or(rule2);
    const orResult = orRule.validate("test");
    assertEquals(orResult.appliedRules.length, 1);
    assertEquals(orResult.appliedRules[0], "rule1_or_rule2");
  });

  it("should validate immutable structure integrity", () => {
    // Test that ValidationRule maintains immutable structure
    const originalRule = ValidationRule.create("original", (_v: string) => true, "Original message");

    // Test withMessage doesn't mutate original
    const messageRule = originalRule.withMessage("New message");
    assertEquals(originalRule.getErrorMessage(), "Original message");
    assertEquals(messageRule.getErrorMessage(), "New message");

    // Test optional doesn't mutate original
    const optionalRule = originalRule.optional();
    assertEquals(originalRule.isOptionalRule(), false);
    assertEquals(optionalRule.isOptionalRule(), true);

    // Test and doesn't mutate original
    const otherRule = ValidationRule.create("other", (_v: string) => true, "Other message");
    const andRule = originalRule.and(otherRule);
    assertEquals(originalRule.getName(), "original");
    assertEquals(otherRule.getName(), "other");
    assertEquals(andRule.getName(), "original_and_other");

    // Test or doesn't mutate original
    const orRule = originalRule.or(otherRule);
    assertEquals(originalRule.getName(), "original");
    assertEquals(otherRule.getName(), "other");
    assertEquals(orRule.getName(), "original_or_other");

    // Test when doesn't mutate original
    const whenRule = originalRule.when((context: boolean) => context, true);
    assertEquals(originalRule.getName(), "original");
    assertEquals(whenRule.getName(), "conditional_original");
  });

  it("should validate optional property propagation", () => {
    // Test optional property in combinations
    const requiredRule = ValidationRule.create("required", (_v: string) => true, "Error");
    const optionalRule = requiredRule.optional();

    assertEquals(requiredRule.isOptionalRule(), false);
    assertEquals(optionalRule.isOptionalRule(), true);

    // Test and() with optional rules
    const andRequiredOptional = requiredRule.and(optionalRule);
    assertEquals(andRequiredOptional.isOptionalRule(), false); // false AND true = false

    const andOptionalOptional = optionalRule.and(optionalRule);
    assertEquals(andOptionalOptional.isOptionalRule(), true); // true AND true = true

    // Test or() with optional rules
    const orRequiredOptional = requiredRule.or(optionalRule);
    assertEquals(orRequiredOptional.isOptionalRule(), true); // false OR true = true

    const orRequiredRequired = requiredRule.or(requiredRule);
    assertEquals(orRequiredRequired.isOptionalRule(), false); // false OR false = false

    // Test combine() with optional rules
    const combinedAllOptional = ValidationRule.combine([optionalRule, optionalRule]);
    assertEquals(combinedAllOptional.isOptionalRule(), true);

    const combinedMixed = ValidationRule.combine([requiredRule, optionalRule]);
    assertEquals(combinedMixed.isOptionalRule(), false);
  });
});
