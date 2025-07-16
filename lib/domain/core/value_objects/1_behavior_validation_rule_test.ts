/**
 * @fileoverview ValidationRule Behavior Tests - Enhanced Totality Pattern Validation
 *
 * Totality原則に基づくSmart Constructor、Result型、Discriminated Unionパターンの統合テスト。
 * 新しいTotality準拠実装の動作とエラーハンドリングを検証。
 *
 * テスト構成:
 * - Smart Constructor (create) パターンの検証
 * - Result型によるエラーハンドリングの検証
 * - Discriminated Unionエラー型の検証
 * - 型ガード関数の検証
 * - レガシー互換性の検証
 */

import { assert, assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  formatValidationRuleError,
  isEmptyErrorMessageError as _isEmptyErrorMessageError,
  isEmptyNameError,
  isEmptyRuleSetError as _isEmptyRuleSetError,
  isInvalidRangeError as _isInvalidRangeError,
  isInvalidTypeError as _isInvalidTypeError,
  isInvalidValidatorError as _isInvalidValidatorError,
  isNegativeLengthError,
  isNullOrUndefinedError,
  type ValidationFunction,
  ValidationRule,
  ValidationRuleError as _ValidationRuleError,
} from "./validation_rule.ts";
import type { Result as _Result } from "../../../types/result.ts";

// =============================================================================
// TOTALITY PATTERN: Smart Constructor & Result Type & Discriminated Union Tests
// =============================================================================

Deno.test("Totality - ValidationRule implements Smart Constructor pattern with Result type", () => {
  // Smart Constructor: Private constructor, public static factory methods

  // Primary Smart Constructor methods
  assertExists(ValidationRule.create);
  assertExists(ValidationRule.minLength);
  assertExists(ValidationRule.maxLength);
  assertExists(ValidationRule.range);
  assertExists(ValidationRule.combine);

  // Legacy factory methods should still exist
  assertExists(ValidationRule.createUnsafe);
  assertExists(ValidationRule.minLengthUnsafe);
  assertExists(ValidationRule.maxLengthUnsafe);
  assertExists(ValidationRule.rangeUnsafe);
  assertExists(ValidationRule.combineUnsafe);
  assertExists(ValidationRule.required);
  assertExists(ValidationRule.pattern);
  assertExists(ValidationRule.custom);

  // Verify Smart Constructor returns Result type
  const result = ValidationRule.create(
    "test_rule",
    (value: string) => value.length > 0,
    "Value must not be empty",
  );
  assertExists(result);
  assertExists(result.ok);

  if (result.ok) {
    assertExists(result.data);
    assertEquals(result.data.getName(), "test_rule");
  }
});

Deno.test("Totality - ValidationRule.create validates all parameters comprehensively", () => {
  // Valid creation should succeed
  const validResult = ValidationRule.create(
    "username_required",
    (value: string) => value != null && value.trim().length > 0,
    "Username is required and cannot be empty",
  );

  assert(validResult.ok);
  if (validResult.ok) {
    assertEquals(validResult.data.getName(), "username_required");
    assertEquals(validResult.data.getErrorMessage(), "Username is required and cannot be empty");
  }

  // Invalid name (null) should return error
  const nullNameResult = ValidationRule.create(
    null as unknown as string,
    (_value: string) => true,
    "Error message",
  );
  assert(!nullNameResult.ok);
  if (!nullNameResult.ok) {
    assertEquals(nullNameResult.error.kind, "NullOrUndefined");
  }

  // Invalid name (empty) should return error
  const emptyNameResult = ValidationRule.create(
    "   ",
    (_value: string) => true,
    "Error message",
  );
  assert(!emptyNameResult.ok);
  if (!emptyNameResult.ok) {
    assertEquals(emptyNameResult.error.kind, "EmptyName");
  }

  // Invalid validator (null) should return error
  const nullValidatorResult = ValidationRule.create(
    "test_rule",
    null as unknown as ValidationFunction<unknown>,
    "Error message",
  );
  assert(!nullValidatorResult.ok);
  if (!nullValidatorResult.ok) {
    assertEquals(nullValidatorResult.error.kind, "NullOrUndefined");
  }

  // Invalid validator (not function) should return error
  const invalidValidatorResult = ValidationRule.create(
    "test_rule",
    "not a function" as unknown as (value: string) => boolean,
    "Error message",
  );
  assert(!invalidValidatorResult.ok);
  if (!invalidValidatorResult.ok) {
    assertEquals(invalidValidatorResult.error.kind, "InvalidValidator");
  }

  // Invalid error message (null) should return error
  const nullMessageResult = ValidationRule.create(
    "test_rule",
    (_value: string) => true,
    null as unknown as string,
  );
  assert(!nullMessageResult.ok);
  if (!nullMessageResult.ok) {
    assertEquals(nullMessageResult.error.kind, "NullOrUndefined");
  }

  // Invalid error message (empty) should return error
  const emptyMessageResult = ValidationRule.create(
    "test_rule",
    (_value: string) => true,
    "   ",
  );
  assert(!emptyMessageResult.ok);
  if (!emptyMessageResult.ok) {
    assertEquals(emptyMessageResult.error.kind, "EmptyErrorMessage");
  }
});

Deno.test("Totality - ValidationRule.minLength returns Result type with comprehensive validation", () => {
  // Valid minLength creation should return success Result
  const validResult = ValidationRule.minLength(5, "password");
  assert(validResult.ok);
  if (validResult.ok) {
    assertEquals(validResult.data.getName(), "minLength_5_password");
  }

  // Negative length should return error Result (Totality pattern)
  const negativeResult = ValidationRule.minLength(-1, "field");
  assert(!negativeResult.ok);
  if (!negativeResult.ok) {
    assertEquals(negativeResult.error.kind, "NegativeLength");
  }

  // Null length should return error Result
  const nullResult = ValidationRule.minLength(null as unknown as number, "field");
  assert(!nullResult.ok);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "NullOrUndefined");
  }

  // Non-number length should return error Result
  const invalidTypeResult = ValidationRule.minLength("5" as unknown as number, "field");
  assert(!invalidTypeResult.ok);
  if (!invalidTypeResult.ok) {
    assertEquals(invalidTypeResult.error.kind, "InvalidType");
  }
});

Deno.test("Totality - ValidationRule.maxLength returns Result type with comprehensive validation", () => {
  // Valid maxLength creation should return success Result
  const validResult = ValidationRule.maxLength(10, "username");
  assert(validResult.ok);
  if (validResult.ok) {
    assertEquals(validResult.data.getName(), "maxLength_10_username");
  }

  // Negative length should return error Result (Totality pattern)
  const negativeResult = ValidationRule.maxLength(-1, "field");
  assert(!negativeResult.ok);
  if (!negativeResult.ok) {
    assertEquals(negativeResult.error.kind, "NegativeLength");
  }
});

Deno.test("Totality - ValidationRule.range returns Result type with comprehensive validation", () => {
  // Valid range creation should return success Result
  const validResult = ValidationRule.range(1, 100, "age");
  assert(validResult.ok);
  if (validResult.ok) {
    assertEquals(validResult.data.getName(), "range_1_100_age");
  }

  // Invalid range (min > max) should return error Result
  const invalidRangeResult = ValidationRule.range(100, 1, "age");
  assert(!invalidRangeResult.ok);
  if (!invalidRangeResult.ok) {
    assertEquals(invalidRangeResult.error.kind, "InvalidRange");
  }

  // Null min should return error Result
  const nullMinResult = ValidationRule.range(null as unknown as number, 100, "age");
  assert(!nullMinResult.ok);
  if (!nullMinResult.ok) {
    assertEquals(nullMinResult.error.kind, "NullOrUndefined");
  }
});

Deno.test("Totality - ValidationRule.combine returns Result type with comprehensive validation", () => {
  // Valid combination should return success Result
  const rule1Result = ValidationRule.minLength(3, "field");
  const rule2Result = ValidationRule.maxLength(10, "field");

  assert(rule1Result.ok && rule2Result.ok);
  if (rule1Result.ok && rule2Result.ok) {
    const combinedResult = ValidationRule.combine([rule1Result.data, rule2Result.data]);
    assert(combinedResult.ok);
    if (combinedResult.ok) {
      assertEquals(combinedResult.data.getName().includes("combined"), true);
    }
  }

  // Empty rules array should return error Result
  const emptyResult = ValidationRule.combine([]);
  assert(!emptyResult.ok);
  if (!emptyResult.ok) {
    assertEquals(emptyResult.error.kind, "EmptyRuleSet");
  }

  // Null rules should return error Result
  const nullResult = ValidationRule.combine(null as unknown as ValidationRule<unknown>[]);
  assert(!nullResult.ok);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "NullOrUndefined");
  }

  // Non-array rules should return error Result
  const invalidTypeResult = ValidationRule.combine(
    "not an array" as unknown as ValidationRule<unknown>[],
  );
  assert(!invalidTypeResult.ok);
  if (!invalidTypeResult.ok) {
    assertEquals(invalidTypeResult.error.kind, "InvalidType");
  }
});

Deno.test("Totality - ValidationRule.withMessage returns Result type with validation", () => {
  // Create a base rule first
  const baseRuleResult = ValidationRule.create(
    "test_rule",
    (value: string) => value.length > 0,
    "Original message",
  );

  assert(baseRuleResult.ok);
  if (baseRuleResult.ok) {
    const baseRule = baseRuleResult.data;

    // Valid message change should return success Result
    const validResult = baseRule.withMessage("New error message");
    assert(validResult.ok);
    if (validResult.ok) {
      assertEquals(validResult.data.getErrorMessage(), "New error message");
      // Original should remain unchanged (immutability)
      assertEquals(baseRule.getErrorMessage(), "Original message");
    }

    // Empty message should return error Result
    const emptyResult = baseRule.withMessage("   ");
    assert(!emptyResult.ok);
    if (!emptyResult.ok) {
      assertEquals(emptyResult.error.kind, "EmptyErrorMessage");
    }

    // Null message should return error Result
    const nullResult = baseRule.withMessage(null as unknown as string);
    assert(!nullResult.ok);
    if (!nullResult.ok) {
      assertEquals(nullResult.error.kind, "NullOrUndefined");
    }
  }
});

// =============================================================================
// DISCRIMINATED UNION ERROR TYPE TESTS
// =============================================================================

Deno.test("Totality - ValidationRuleError type guards work correctly", () => {
  // Test different error types and their type guards
  const emptyNameResult = ValidationRule.create("", (_v: string) => true, "Error");
  assert(!emptyNameResult.ok);
  if (!emptyNameResult.ok) {
    const emptyNameError = emptyNameResult.error;

    const negativeResult = ValidationRule.minLength(-1, "field");
    assert(!negativeResult.ok);
    if (!negativeResult.ok) {
      const negativeError = negativeResult.error;

      const nullResult = ValidationRule.create(
        null as unknown as string,
        (_v: string) => true,
        "Error",
      );
      assert(!nullResult.ok);
      if (!nullResult.ok) {
        const nullError = nullResult.error;

        // Test type guards
        assert(isEmptyNameError(emptyNameError));
        assert(!isNegativeLengthError(emptyNameError));
        assert(!isNullOrUndefinedError(emptyNameError));

        assert(isNegativeLengthError(negativeError));
        assert(!isEmptyNameError(negativeError));

        assert(isNullOrUndefinedError(nullError));
        assert(!isEmptyNameError(nullError));
      }
    }
  }
});

Deno.test("Totality - formatValidationRuleError provides comprehensive error messages", () => {
  // Test EmptyName error formatting
  const emptyNameResult = ValidationRule.create("", (_v: string) => true, "Error");
  assert(!emptyNameResult.ok);
  if (!emptyNameResult.ok) {
    const emptyNameMessage = formatValidationRuleError(emptyNameResult.error);
    assert(emptyNameMessage.includes("name cannot be empty"));
  }

  // Test NegativeLength error formatting
  const negativeResult = ValidationRule.minLength(-5, "field");
  assert(!negativeResult.ok);
  if (!negativeResult.ok) {
    const negativeMessage = formatValidationRuleError(negativeResult.error);
    assert(negativeMessage.includes("cannot be negative"));
    assert(negativeMessage.includes("-5"));
  }

  // Test InvalidRange error formatting
  const rangeResult = ValidationRule.range(10, 5, "field");
  assert(!rangeResult.ok);
  if (!rangeResult.ok) {
    const rangeMessage = formatValidationRuleError(rangeResult.error);
    assert(rangeMessage.includes("Invalid range"));
    assert(rangeMessage.includes("10"));
    assert(rangeMessage.includes("5"));
  }
});

// =============================================================================
// LEGACY COMPATIBILITY TESTS
// =============================================================================

Deno.test("Totality - Legacy methods maintain backward compatibility", () => {
  // Legacy factory methods should still work
  const requiredRule = ValidationRule.required("username");
  assertEquals(requiredRule.getName(), "required_username");

  // Legacy unsafe methods should work but are deprecated
  const unsafeRule = ValidationRule.createUnsafe(
    "test_rule",
    (value: string) => value.length > 0,
    "Error message",
  );
  assertEquals(unsafeRule.getName(), "test_rule");

  // Legacy unsafe methods should throw on error
  try {
    ValidationRule.createUnsafe("", (_value: string) => true, "Error");
    assert(false, "Should have thrown");
  } catch (error) {
    assert(error instanceof Error);
    if (error instanceof Error) {
      assert(error.message.includes("name cannot be empty"));
    }
  }

  // Legacy withMessageUnsafe should work
  const withMessageUnsafe = unsafeRule.withMessageUnsafe("New message");
  assertEquals(withMessageUnsafe.getErrorMessage(), "New message");

  // Should throw on invalid message
  try {
    unsafeRule.withMessageUnsafe("");
    assert(false, "Should have thrown");
  } catch (error) {
    assert(error instanceof Error);
  }
});

// =============================================================================
// IMMUTABILITY AND VALUE OBJECT TESTS
// =============================================================================

Deno.test("Totality - ValidationRule instances are completely immutable", () => {
  const result = ValidationRule.create(
    "test_rule",
    (value: string) => value.length > 0,
    "Error message",
  );
  assert(result.ok);
  if (result.ok) {
    const rule = result.data;

    // Object should be frozen
    assert(Object.isFrozen(rule));

    // Repeated calls should return identical values
    assertEquals(rule.getName(), rule.getName());
    assertEquals(rule.getErrorMessage(), rule.getErrorMessage());
    assertEquals(rule.isOptionalRule(), rule.isOptionalRule());

    // Method chaining should create new instances
    const withMessageResult = rule.withMessage("New message");
    assert(withMessageResult.ok);
    if (withMessageResult.ok) {
      const newRule = withMessageResult.data;
      assertEquals(rule.getErrorMessage(), "Error message"); // Original unchanged
      assertEquals(newRule.getErrorMessage(), "New message"); // New instance changed
    }
  }
});

Deno.test("Architecture - ValidationRule validation behavior works correctly", () => {
  // Test that validation still works with the new implementation
  const ruleResult = ValidationRule.create(
    "length_check",
    (value: string) => value.length >= 3,
    "Value must be at least 3 characters",
  );

  assert(ruleResult.ok);
  if (ruleResult.ok) {
    const rule = ruleResult.data;

    // Valid input
    const validResult = rule.validate("hello");
    assertEquals(validResult.isValid, true);
    assertEquals(validResult.errorMessage, undefined);
    assertEquals(validResult.appliedRules, ["length_check"]);

    // Invalid input
    const invalidResult = rule.validate("hi");
    assertEquals(invalidResult.isValid, false);
    assertEquals(invalidResult.errorMessage, "Value must be at least 3 characters");
    assertEquals(invalidResult.appliedRules, ["length_check"]);
  }
});

Deno.test("Architecture - ValidationRule composition methods still work", () => {
  // Test that rule composition still works after Totality refactoring
  const minResult = ValidationRule.minLength(3, "field");
  const maxResult = ValidationRule.maxLength(10, "field");

  assert(minResult.ok && maxResult.ok);
  if (minResult.ok && maxResult.ok) {
    const minRule = minResult.data;
    const maxRule = maxResult.data;

    // Test and() composition
    const andRule = minRule.and(maxRule);

    const validAndResult = andRule.validate("hello");
    assertEquals(validAndResult.isValid, true);

    const invalidAndResult = andRule.validate("hi");
    assertEquals(invalidAndResult.isValid, false);

    // Test or() composition
    const orRule = minRule.or(maxRule);

    const validOrResult = orRule.validate("hi"); // Satisfies maxLength
    assertEquals(validOrResult.isValid, true);

    // Test optional() composition
    const optionalRule = minRule.optional();
    assertEquals(optionalRule.isOptionalRule(), true);

    const nullResult = optionalRule.validate(null);
    assertEquals(nullResult.isValid, true);
  }
});

Deno.test("Architecture - ValidationRule supports functional composition patterns", () => {
  // Test various factory methods still work - use Result-based factory
  const patternRule = ValidationRule.pattern(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    "email",
  );
  const customRule = ValidationRule.custom(
    "not_disposable",
    (email: string) => !email.includes("tempmail"),
    "Disposable email addresses not allowed",
  );
  const lengthRule = ValidationRule.custom(
    "email_length",
    (email: string) => email.length >= 5 && email.length <= 100,
    "Email must be between 5 and 100 characters",
  );

  // All should be ValidationRule instances
  assertExists(patternRule);
  assertExists(customRule);
  assertExists(lengthRule);

  // Test composition with compatible types
  const emailValidation = patternRule.and(customRule).and(lengthRule);

  // Valid email
  const validEmail = emailValidation.validate("user@example.com");
  assertEquals(validEmail.isValid, true);

  // Invalid email (missing @)
  const invalidEmail1 = emailValidation.validate("invalid-email");
  assertEquals(invalidEmail1.isValid, false);

  // Invalid email (disposable)
  const invalidEmail2 = emailValidation.validate("user@tempmail.com");
  assertEquals(invalidEmail2.isValid, false);

  // Test required field separately (different type)
  const requiredRule = ValidationRule.required("email");
  assertExists(requiredRule);

  const nullResult = requiredRule.validate(null);
  assertEquals(nullResult.isValid, false);

  const validRequiredResult = requiredRule.validate("test@example.com");
  assertEquals(validRequiredResult.isValid, true);
});

Deno.test("Architecture - ValidationRule toString representation is consistent", () => {
  const ruleResult = ValidationRule.create("test_rule", (_v: string) => true, "Error");
  assert(ruleResult.ok);
  if (ruleResult.ok) {
    const rule = ruleResult.data;

    // String representation
    const stringRepr = rule.toString();
    assertExists(stringRepr);
    assertEquals(typeof stringRepr, "string");
    assertEquals(stringRepr.includes("ValidationRule"), true);
    assertEquals(stringRepr.includes("test_rule"), true);

    // Optional rule toString
    const optionalRule = rule.optional();
    const optionalRepr = optionalRule.toString();
    assertEquals(optionalRepr.includes("optional"), true);
  }
});
