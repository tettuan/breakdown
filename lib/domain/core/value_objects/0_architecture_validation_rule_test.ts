import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { ValidationRule } from "./validation_rule.ts";

describe("0_architecture_validation_rule_test", () => {
  it("should follow Smart Constructor pattern", () => {
    // Verify private constructor pattern by checking create method exists
    assertExists(ValidationRule.create);

    // Verify static create method returns ValidationRule instance
    const rule = ValidationRule.create(
      "test_rule",
      (value: string) => value.length > 0,
      "Value must not be empty",
    );
    assertExists(rule);
    assertEquals(rule.constructor.name, "ValidationRule");

    // Verify factory methods exist
    assertExists(ValidationRule.required);
    assertExists(ValidationRule.minLength);
    assertExists(ValidationRule.maxLength);
    assertExists(ValidationRule.pattern);
    assertExists(ValidationRule.range);
    assertExists(ValidationRule.custom);
    assertExists(ValidationRule.combine);
  });

  it("should have proper type safety boundaries", () => {
    // Verify proper generic constraints work
    const stringRule = ValidationRule.minLength(5, "testField");
    assertExists(stringRule);

    const numberRule = ValidationRule.range(1, 100, "numberField");
    assertExists(numberRule);

    // Verify immutability patterns - methods return new instances
    const rule1 = ValidationRule.create("rule1", (v: string) => v.length > 0, "Error1");
    const rule2 = rule1.withMessage("Error2");

    // Should be different instances
    assertEquals(rule1.getErrorMessage(), "Error1");
    assertEquals(rule2.getErrorMessage(), "Error2");
  });

  it("should integrate with domain boundaries", () => {
    // Verify proper domain interfaces - ValidationResult structure
    const rule = ValidationRule.create("test", (v: string) => v.length > 0, "Error");
    const result = rule.validate("test");

    // Verify ValidationResult interface compliance
    assertExists(result.isValid);
    assertExists(result.appliedRules);
    assertEquals(typeof result.isValid, "boolean");
    assertEquals(Array.isArray(result.appliedRules), true);

    // Verify proper error propagation
    assertThrows(
      () => {
        ValidationRule.create("", (_v: string) => true, "Error");
      },
      Error,
      "Validation rule name cannot be empty",
    );

    assertThrows(
      () => {
        ValidationRule.create("test", (_v: string) => true, "");
      },
      Error,
      "Error message cannot be empty",
    );
  });

  it("should validate constructor parameter constraints", () => {
    // Test empty name validation
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

    // Test empty error message validation
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
  });

  it("should validate factory method constraints", () => {
    // Test minLength constraints
    assertThrows(
      () => {
        ValidationRule.minLength(-1, "field");
      },
      Error,
      "Min length must be non-negative",
    );

    // Test maxLength constraints
    assertThrows(
      () => {
        ValidationRule.maxLength(-1, "field");
      },
      Error,
      "Max length must be non-negative",
    );

    // Test range constraints
    assertThrows(
      () => {
        ValidationRule.range(10, 5, "field");
      },
      Error,
      "Min value cannot be greater than max value",
    );

    // Test combine constraints
    assertThrows(
      () => {
        ValidationRule.combine([]);
      },
      Error,
      "At least one rule must be provided",
    );
  });

  it("should validate method parameter constraints", () => {
    const rule = ValidationRule.create("test", (_v: string) => true, "Error");

    // Test withMessage constraints
    assertThrows(
      () => {
        rule.withMessage("");
      },
      Error,
      "Error message cannot be empty",
    );

    assertThrows(
      () => {
        rule.withMessage("   ");
      },
      Error,
      "Error message cannot be empty",
    );
  });

  it("should follow naming conventions", () => {
    // Test consistent naming patterns
    const requiredRule = ValidationRule.required("testField");
    assertEquals(requiredRule.getName(), "required_testField");

    const minLengthRule = ValidationRule.minLength(5, "testField");
    assertEquals(minLengthRule.getName(), "minLength_5_testField");

    const maxLengthRule = ValidationRule.maxLength(10, "testField");
    assertEquals(maxLengthRule.getName(), "maxLength_10_testField");

    const rangeRule = ValidationRule.range(1, 100, "testField");
    assertEquals(rangeRule.getName(), "range_1_100_testField");

    const patternRule = ValidationRule.pattern(/^[a-z]+$/, "testField");
    assertEquals(patternRule.getName(), "pattern_testField");
  });
});
