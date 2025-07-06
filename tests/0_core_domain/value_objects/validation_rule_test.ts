import { assertEquals, assertThrows } from "@std/assert";
import { ValidationRule } from "../../../lib/domain/core/value_objects/validation_rule.ts";

Deno.test("ValidationRule - create with valid parameters", () => {
  const rule = ValidationRule.create<string>(
    "testRule",
    (value) => value.length > 0,
    "Value must not be empty"
  );
  
  assertEquals(rule.getName(), "testRule");
  assertEquals(rule.getErrorMessage(), "Value must not be empty");
  assertEquals(rule.isOptionalRule(), false);
});

Deno.test("ValidationRule - create validates name", () => {
  assertThrows(
    () => ValidationRule.create<string>("", () => true, "Error"),
    Error,
    "Validation rule name cannot be empty"
  );
  
  assertThrows(
    () => ValidationRule.create<string>("  ", () => true, "Error"),
    Error,
    "Validation rule name cannot be empty"
  );
});

Deno.test("ValidationRule - create validates error message", () => {
  assertThrows(
    () => ValidationRule.create<string>("test", () => true, ""),
    Error,
    "Error message cannot be empty"
  );
});

Deno.test("ValidationRule - required validation", () => {
  const rule = ValidationRule.required<string>("username");
  
  assertEquals(rule.validate("test").isValid, true);
  assertEquals(rule.validate("").isValid, true);
  assertEquals(rule.validate(null).isValid, false);
  assertEquals(rule.validate(undefined).isValid, false);
  
  const result = rule.validate(null);
  assertEquals(result.errorMessage, "username is required");
});

Deno.test("ValidationRule - minLength validation", () => {
  const rule = ValidationRule.minLength(5, "password");
  
  assertEquals(rule.validate("12345").isValid, true);
  assertEquals(rule.validate("123456").isValid, true);
  assertEquals(rule.validate("1234").isValid, false);
  
  const result = rule.validate("abc");
  assertEquals(result.errorMessage, "password must be at least 5 characters long");
});

Deno.test("ValidationRule - minLength validates parameter", () => {
  assertThrows(
    () => ValidationRule.minLength(-1),
    Error,
    "Min length must be non-negative"
  );
});

Deno.test("ValidationRule - maxLength validation", () => {
  const rule = ValidationRule.maxLength(10, "comment");
  
  assertEquals(rule.validate("short").isValid, true);
  assertEquals(rule.validate("1234567890").isValid, true);
  assertEquals(rule.validate("12345678901").isValid, false);
  
  const result = rule.validate("this is too long");
  assertEquals(result.errorMessage, "comment must not exceed 10 characters");
});

Deno.test("ValidationRule - pattern validation", () => {
  const rule = ValidationRule.pattern(/^[A-Z]+$/, "code");
  
  assertEquals(rule.validate("ABC").isValid, true);
  assertEquals(rule.validate("abc").isValid, false);
  
  const result = rule.validate("123");
  assertEquals(result.errorMessage, "code does not match the required pattern");
});

Deno.test("ValidationRule - pattern with custom message", () => {
  const rule = ValidationRule.pattern(
    /^\d{3}-\d{4}$/,
    "zipCode",
    "Zip code must be in format XXX-XXXX"
  );
  
  const result = rule.validate("12345");
  assertEquals(result.errorMessage, "Zip code must be in format XXX-XXXX");
});

Deno.test("ValidationRule - range validation", () => {
  const rule = ValidationRule.range(1, 100, "score");
  
  assertEquals(rule.validate(50).isValid, true);
  assertEquals(rule.validate(1).isValid, true);
  assertEquals(rule.validate(100).isValid, true);
  assertEquals(rule.validate(0).isValid, false);
  assertEquals(rule.validate(101).isValid, false);
  
  const result = rule.validate(150);
  assertEquals(result.errorMessage, "score must be between 1 and 100");
});

Deno.test("ValidationRule - range validates parameters", () => {
  assertThrows(
    () => ValidationRule.range(100, 1),
    Error,
    "Min value cannot be greater than max value"
  );
});

Deno.test("ValidationRule - custom validation", () => {
  const rule = ValidationRule.custom<number>(
    "even",
    (value) => value % 2 === 0,
    "Value must be even"
  );
  
  assertEquals(rule.validate(4).isValid, true);
  assertEquals(rule.validate(3).isValid, false);
});

Deno.test("ValidationRule - when conditional validation", () => {
  const baseRule = ValidationRule.minLength(5);
  const conditionalRule = baseRule.when(
    (isRequired: boolean) => isRequired,
    true
  );
  
  assertEquals(conditionalRule.validate("12345").isValid, true);
  assertEquals(conditionalRule.validate("123").isValid, false);
  
  const alwaysSkipRule = baseRule.when(
    (isRequired: boolean) => isRequired,
    false
  );
  
  assertEquals(alwaysSkipRule.validate("123").isValid, true);
});

Deno.test("ValidationRule - optional validation", () => {
  const baseRule = ValidationRule.minLength(5);
  const optionalRule = baseRule.optional();
  
  assertEquals(optionalRule.validate("12345").isValid, true);
  assertEquals(optionalRule.validate("123").isValid, false);
  assertEquals(optionalRule.validate(null).isValid, true);
  assertEquals(optionalRule.validate(undefined).isValid, true);
  assertEquals(optionalRule.isOptionalRule(), true);
});

Deno.test("ValidationRule - and combination", () => {
  const minRule = ValidationRule.minLength(3);
  const maxRule = ValidationRule.maxLength(10);
  const combined = minRule.and(maxRule);
  
  assertEquals(combined.validate("hello").isValid, true);
  assertEquals(combined.validate("ab").isValid, false);
  assertEquals(combined.validate("this is too long").isValid, false);
});

Deno.test("ValidationRule - or combination", () => {
  const emailRule = ValidationRule.pattern(/@/, "contact", "Must contain @");
  const phoneRule = ValidationRule.pattern(/^\d+$/, "contact", "Must be digits");
  const combined = emailRule.or(phoneRule);
  
  assertEquals(combined.validate("user@example.com").isValid, true);
  assertEquals(combined.validate("1234567890").isValid, true);
  assertEquals(combined.validate("invalid").isValid, false);
});

Deno.test("ValidationRule - withMessage customization", () => {
  const rule = ValidationRule.minLength(5);
  const customized = rule.withMessage("Too short!");
  
  const result = customized.validate("abc");
  assertEquals(result.errorMessage, "Too short!");
});

Deno.test("ValidationRule - withMessage validates message", () => {
  const rule = ValidationRule.minLength(5);
  
  assertThrows(
    () => rule.withMessage(""),
    Error,
    "Error message cannot be empty"
  );
});

Deno.test("ValidationRule - combine multiple rules", () => {
  const rules = [
    ValidationRule.required<string>("value"),
    ValidationRule.minLength(3),
    ValidationRule.maxLength(10),
  ];
  
  const combined = ValidationRule.combine(rules);
  
  assertEquals(combined.validate("hello").isValid, true);
  assertEquals(combined.validate(null as any).isValid, false);
  assertEquals(combined.validate("ab").isValid, false);
  assertEquals(combined.validate("this is too long").isValid, false);
});

Deno.test("ValidationRule - combine validates rules array", () => {
  assertThrows(
    () => ValidationRule.combine([]),
    Error,
    "At least one rule must be provided"
  );
});

Deno.test("ValidationRule - combine single rule", () => {
  const rule = ValidationRule.minLength(5);
  const combined = ValidationRule.combine([rule]);
  
  assertEquals(combined.getName(), rule.getName());
  assertEquals(combined.validate("hello").isValid, true);
});

Deno.test("ValidationRule - validation result includes applied rules", () => {
  const rule = ValidationRule.minLength(5, "test");
  const result = rule.validate("hello");
  
  assertEquals(result.appliedRules.length, 1);
  assertEquals(result.appliedRules[0], "minLength_5_test");
});

Deno.test("ValidationRule - toString returns correct format", () => {
  const rule = ValidationRule.minLength(5);
  assertEquals(rule.toString(), "ValidationRule(minLength_5_value)");
  
  const optionalRule = rule.optional();
  assertEquals(optionalRule.toString(), "ValidationRule(optional_minLength_5_value, optional)");
});