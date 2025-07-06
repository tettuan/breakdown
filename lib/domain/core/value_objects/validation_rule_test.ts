/**
 * @fileoverview ValidationRule 0_architecture Tests - Smart Constructor Totality Validation
 * 
 * Totality原則に基づくアーキテクチャ制約のテスト。
 * Smart Constructor, Result型, Discriminated Unionパターンの正当性を検証。
 * 
 * テスト構成:
 * - 0_architecture: Smart Constructor, Result型, Discriminated Union制約
 * - 1_behavior: 通常動作とビジネスルールの検証
 * - 2_structure: データ構造と整合性の検証
 */

import { assertEquals, assertExists, assertThrows, assertNotEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  ValidationRule,
  ValidationFunction,
  ValidationResult,
} from "./validation_rule.ts";

// =============================================================================
// 0_ARCHITECTURE: Smart Constructor & Result Type & Discriminated Union Tests
// =============================================================================

Deno.test("0_architecture - ValidationRule implements Smart Constructor pattern correctly", () => {
  // Smart Constructor: Private constructor, public static factory methods
  
  // Public factory methods exist
  assertExists(ValidationRule.create);
  assertExists(ValidationRule.required);
  assertExists(ValidationRule.minLength);
  assertExists(ValidationRule.maxLength);
  assertExists(ValidationRule.pattern);
  assertExists(ValidationRule.range);
  assertExists(ValidationRule.custom);
  assertExists(ValidationRule.combine);
});

Deno.test("0_architecture - ValidationFunction type is properly defined", () => {
  // ValidationFunction should be a type that takes a value and returns boolean
  const testValidator: ValidationFunction<string> = (value: string) => value.length > 0;
  
  // Should work with any type
  const numberValidator: ValidationFunction<number> = (value: number) => value >= 0;
  const objectValidator: ValidationFunction<{ name: string }> = (value) => value.name.length > 0;
  
  // Function signature should be correct
  assertEquals(typeof testValidator, "function");
  assertEquals(testValidator("test"), true);
  assertEquals(testValidator(""), false);
  
  assertEquals(numberValidator(5), true);
  assertEquals(numberValidator(-1), false);
  
  assertEquals(objectValidator({ name: "test" }), true);
  assertEquals(objectValidator({ name: "" }), false);
});

Deno.test("0_architecture - ValidationResult uses structured result pattern", () => {
  // ValidationResult should have consistent structure
  const rule = ValidationRule.create(
    "test_rule",
    (value: string) => value.length > 0,
    "Value cannot be empty"
  );
  
  const validResult = rule.validate("test");
  const invalidResult = rule.validate("");
  
  // Result structure verification
  assertExists(validResult.isValid);
  assertExists(validResult.appliedRules);
  assertEquals(typeof validResult.isValid, "boolean");
  assertEquals(Array.isArray(validResult.appliedRules), true);
  
  // Valid result
  assertEquals(validResult.isValid, true);
  assertEquals(validResult.errorMessage, undefined);
  assertEquals(validResult.appliedRules.length, 1);
  assertEquals(validResult.appliedRules[0], "test_rule");
  
  // Invalid result
  assertEquals(invalidResult.isValid, false);
  assertExists(invalidResult.errorMessage);
  assertEquals(typeof invalidResult.errorMessage, "string");
  assertEquals(invalidResult.appliedRules.length, 1);
  assertEquals(invalidResult.appliedRules[0], "test_rule");
});

Deno.test("0_architecture - ValidationRule.create provides input validation", () => {
  // Smart Constructor should validate inputs
  
  // Valid creation
  const validRule = ValidationRule.create(
    "valid_rule",
    (value: string) => value.length > 0,
    "Valid error message"
  );
  assertExists(validRule);
  
  // Empty name should throw
  assertThrows(
    () => ValidationRule.create(
      "",
      (value: string) => value.length > 0,
      "Error message"
    ),
    Error,
    "Validation rule name cannot be empty"
  );
  
  // Whitespace-only name should throw
  assertThrows(
    () => ValidationRule.create(
      "   ",
      (value: string) => value.length > 0,
      "Error message"
    ),
    Error,
    "Validation rule name cannot be empty"
  );
  
  // Empty error message should throw
  assertThrows(
    () => ValidationRule.create(
      "rule_name",
      (value: string) => value.length > 0,
      ""
    ),
    Error,
    "Error message cannot be empty"
  );
  
  // Whitespace-only error message should throw
  assertThrows(
    () => ValidationRule.create(
      "rule_name",
      (value: string) => value.length > 0,
      "   "
    ),
    Error,
    "Error message cannot be empty"
  );
});

Deno.test("0_architecture - Built-in validation factories follow consistent patterns", () => {
  // All built-in factories should return ValidationRule instances
  const requiredRule = ValidationRule.required("username");
  const minLengthRule = ValidationRule.minLength(5, "password");
  const maxLengthRule = ValidationRule.maxLength(100, "comment");
  const patternRule = ValidationRule.pattern(/^[a-zA-Z]+$/, "name");
  const rangeRule = ValidationRule.range(0, 100, "score");
  
  assertExists(requiredRule);
  assertExists(minLengthRule);
  assertExists(maxLengthRule);
  assertExists(patternRule);
  assertExists(rangeRule);
  
  // All should have proper names
  assertEquals(typeof requiredRule.getName(), "string");
  assertEquals(typeof minLengthRule.getName(), "string");
  assertEquals(typeof maxLengthRule.getName(), "string");
  assertEquals(typeof patternRule.getName(), "string");
  assertEquals(typeof rangeRule.getName(), "string");
  
  // All should have error messages
  assertEquals(typeof requiredRule.getErrorMessage(), "string");
  assertEquals(typeof minLengthRule.getErrorMessage(), "string");
  assertEquals(typeof maxLengthRule.getErrorMessage(), "string");
  assertEquals(typeof patternRule.getErrorMessage(), "string");
  assertEquals(typeof rangeRule.getErrorMessage(), "string");
});

Deno.test("0_architecture - Validation factories provide input validation", () => {
  // minLength should validate input
  assertThrows(
    () => ValidationRule.minLength(-1, "field"),
    Error,
    "Min length must be non-negative"
  );
  
  // maxLength should validate input
  assertThrows(
    () => ValidationRule.maxLength(-1, "field"),
    Error,
    "Max length must be non-negative"
  );
  
  // range should validate input order
  assertThrows(
    () => ValidationRule.range(10, 5, "field"),
    Error,
    "Min value cannot be greater than max value"
  );
});

Deno.test("0_architecture - ValidationRule is immutable Value Object", () => {
  const rule = ValidationRule.create(
    "test_rule",
    (value: string) => value.length > 0,
    "Value cannot be empty"
  );
  
  // Value Object methods must exist
  assertExists(rule.validate);
  assertExists(rule.getName);
  assertExists(rule.getErrorMessage);
  assertExists(rule.isOptionalRule);
  assertExists(rule.when);
  assertExists(rule.optional);
  assertExists(rule.and);
  assertExists(rule.or);
  assertExists(rule.withMessage);
  assertExists(rule.toString);
  
  // Immutability - repeated calls should return same values
  const name1 = rule.getName();
  const name2 = rule.getName();
  assertEquals(name1, name2);
  
  const message1 = rule.getErrorMessage();
  const message2 = rule.getErrorMessage();
  assertEquals(message1, message2);
  
  const optional1 = rule.isOptionalRule();
  const optional2 = rule.isOptionalRule();
  assertEquals(optional1, optional2);
});

Deno.test("0_architecture - Functional composition methods create new instances", () => {
  const baseRule = ValidationRule.minLength(5, "password");
  
  // Composition methods should exist
  assertExists(baseRule.when);
  assertExists(baseRule.optional);
  assertExists(baseRule.and);
  assertExists(baseRule.or);
  assertExists(baseRule.withMessage);
  
  // Methods should return new instances (immutability)
  const optionalRule = baseRule.optional();
  assertExists(optionalRule);
  assertNotEquals(baseRule, optionalRule);
  assertEquals(baseRule.isOptionalRule(), false);
  assertEquals(optionalRule.isOptionalRule(), true);
  
  const customMessageRule = baseRule.withMessage("Custom error message");
  assertExists(customMessageRule);
  assertNotEquals(baseRule, customMessageRule);
  assertNotEquals(baseRule.getErrorMessage(), customMessageRule.getErrorMessage());
  assertEquals(customMessageRule.getErrorMessage(), "Custom error message");
  
  // Conditional rule
  const conditionalRule = baseRule.when((context: boolean) => context, true);
  assertExists(conditionalRule);
  assertNotEquals(baseRule, conditionalRule);
});

Deno.test("0_architecture - Rule combination follows functional composition patterns", () => {
  const minRule = ValidationRule.minLength(5, "password");
  const maxRule = ValidationRule.maxLength(20, "password");
  const patternRule = ValidationRule.pattern(/^[a-zA-Z0-9]+$/, "password");
  
  // AND combination
  const andRule = minRule.and(maxRule);
  assertExists(andRule);
  assertNotEquals(minRule, andRule);
  assertNotEquals(maxRule, andRule);
  
  // OR combination
  const orRule = minRule.or(patternRule);
  assertExists(orRule);
  assertNotEquals(minRule, orRule);
  assertNotEquals(patternRule, orRule);
  
  // Combined rule names should reflect composition
  const andName = andRule.getName();
  const orName = orRule.getName();
  assertEquals(andName.includes("_and_"), true);
  assertEquals(orName.includes("_or_"), true);
  
  // Combined error messages should reflect composition
  const andMessage = andRule.getErrorMessage();
  const orMessage = orRule.getErrorMessage();
  assertEquals(andMessage.includes(" AND "), true);
  assertEquals(orMessage.includes(" OR "), true);
});

Deno.test("0_architecture - ValidationRule.combine provides safe aggregation", () => {
  const rules = [
    ValidationRule.required("field"),
    ValidationRule.minLength(5, "field"),
    ValidationRule.maxLength(20, "field"),
  ];
  
  const combined = ValidationRule.combine(rules);
  assertExists(combined);
  
  // Empty array should throw error (fail-fast principle)
  assertThrows(
    () => ValidationRule.combine([]),
    Error,
    "At least one rule must be provided"
  );
  
  // Single rule should return itself
  const singleRule = ValidationRule.required("field");
  const combinedSingle = ValidationRule.combine([singleRule]);
  assertEquals(combinedSingle, singleRule);
  
  // Combined rule should have aggregated name and message
  const combinedName = combined.getName();
  const combinedMessage = combined.getErrorMessage();
  assertEquals(combinedName.includes("combined_"), true);
  assertEquals(combinedMessage.includes(";"), true); // Multiple messages separated by semicolon
});

Deno.test("0_architecture - Custom validation supports arbitrary types and logic", () => {
  // String validation
  const emailRule = ValidationRule.custom(
    "email_format",
    (value: string) => value.includes("@") && value.includes("."),
    "Must be a valid email format"
  );
  
  assertExists(emailRule);
  assertEquals(emailRule.validate("test@example.com").isValid, true);
  assertEquals(emailRule.validate("invalid-email").isValid, false);
  
  // Number validation
  const positiveRule = ValidationRule.custom(
    "positive_number",
    (value: number) => value > 0,
    "Must be a positive number"
  );
  
  assertExists(positiveRule);
  assertEquals(positiveRule.validate(5).isValid, true);
  assertEquals(positiveRule.validate(-1).isValid, false);
  
  // Object validation
  const objectRule = ValidationRule.custom(
    "valid_user",
    (value: { name: string; age: number }) => value.name.length > 0 && value.age >= 0,
    "User must have valid name and age"
  );
  
  assertExists(objectRule);
  assertEquals(objectRule.validate({ name: "John", age: 25 }).isValid, true);
  assertEquals(objectRule.validate({ name: "", age: 25 }).isValid, false);
  assertEquals(objectRule.validate({ name: "John", age: -1 }).isValid, false);
});

Deno.test("0_architecture - String representation provides useful debugging information", () => {
  const rule = ValidationRule.create(
    "test_rule",
    (value: string) => value.length > 0,
    "Value cannot be empty"
  );
  
  const optionalRule = rule.optional();
  
  // String representation should exist and be informative
  const ruleString = rule.toString();
  const optionalString = optionalRule.toString();
  
  assertExists(ruleString);
  assertExists(optionalString);
  assertEquals(typeof ruleString, "string");
  assertEquals(typeof optionalString, "string");
  
  // Should contain class name and rule name
  assertEquals(ruleString.includes("ValidationRule"), true);
  assertEquals(ruleString.includes("test_rule"), true);
  
  // Optional rule should indicate optional status
  assertEquals(optionalString.includes("optional"), true);
  assertEquals(ruleString.includes("optional"), false);
});

Deno.test("0_architecture - Optional rule transformation preserves type safety", () => {
  // Required rule for non-null string
  const stringRule = ValidationRule.minLength(5, "password");
  
  // Transform to optional (accepts null/undefined)
  const optionalRule = stringRule.optional();
  
  assertExists(optionalRule);
  assertEquals(optionalRule.isOptionalRule(), true);
  
  // Optional rule should accept null/undefined as valid
  const nullResult = optionalRule.validate(null);
  const undefinedResult = optionalRule.validate(undefined);
  
  assertEquals(nullResult.isValid, true);
  assertEquals(undefinedResult.isValid, true);
  
  // But still validate non-null values
  const validResult = optionalRule.validate("valid_password");
  const invalidResult = optionalRule.validate("abc");
  
  assertEquals(validResult.isValid, true);
  assertEquals(invalidResult.isValid, false);
});

Deno.test("0_architecture - Conditional validation supports context-dependent rules", () => {
  const passwordRule = ValidationRule.minLength(8, "password");
  
  // Conditional rule: password length requirement only applies for admin users
  const conditionalRule = passwordRule.when(
    (context: { isAdmin: boolean }) => context.isAdmin,
    { isAdmin: true }
  );
  
  assertExists(conditionalRule);
  
  // Rule should be applied when condition is met
  const shortPassword = conditionalRule.validate("abc");
  assertEquals(shortPassword.isValid, false); // Admin context, so rule applies
  
  // Create rule with different context
  const nonAdminRule = passwordRule.when(
    (context: { isAdmin: boolean }) => context.isAdmin,
    { isAdmin: false }
  );
  
  const shortPasswordNonAdmin = nonAdminRule.validate("abc");
  assertEquals(shortPasswordNonAdmin.isValid, true); // Non-admin context, so rule doesn't apply
});
