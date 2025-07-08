import { assertEquals, assertThrows } from "@std/assert";
import { ValidationRule } from "../../../lib/domain/core/value_objects/validation_rule.ts";

Deno.test("ValidationRule - create with valid parameters", () => {
  const result = ValidationRule.create<string>(
    "testRule",
    (value) => value.length > 0,
    "Value must not be empty"
  );
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.getName(), "testRule");
    assertEquals(result.data.getErrorMessage(), "Value must not be empty");
    assertEquals(result.data.isOptionalRule(), false);
  }
});

Deno.test("ValidationRule - create validates name", () => {
  const result1 = ValidationRule.create<string>("", () => true, "Error");
  assertEquals(result1.ok, false);
  if (!result1.ok) {
    assertEquals(result1.error.kind, "EmptyName");
  }
  
  const result2 = ValidationRule.create<string>("  ", () => true, "Error");
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "EmptyName");
  }
});

Deno.test("ValidationRule - create validates error message", () => {
  const result = ValidationRule.create<string>("test", () => true, "");
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "EmptyErrorMessage");
  }
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
  const ruleResult = ValidationRule.minLength(5, "password");
  
  assertEquals(ruleResult.ok, true);
  if (ruleResult.ok) {
    assertEquals(ruleResult.data.validate("12345").isValid, true);
    assertEquals(ruleResult.data.validate("123456").isValid, true);
    assertEquals(ruleResult.data.validate("1234").isValid, false);
    
    const result = ruleResult.data.validate("abc");
    assertEquals(result.errorMessage, "password must be at least 5 characters long");
  }
});

Deno.test("ValidationRule - minLength validates parameter", () => {
  const result = ValidationRule.minLength(-1);
  assertEquals(result.ok, false);
  if (!result.ok && result.error.kind === "NegativeLength") {
    assertEquals(result.error.providedLength, -1);
    assertEquals(result.error.parameter, "minLength");
  }
});

Deno.test("ValidationRule - maxLength validation", () => {
  const ruleResult = ValidationRule.maxLength(10, "comment");
  
  assertEquals(ruleResult.ok, true);
  if (ruleResult.ok) {
    assertEquals(ruleResult.data.validate("short").isValid, true);
    assertEquals(ruleResult.data.validate("1234567890").isValid, true);
    assertEquals(ruleResult.data.validate("12345678901").isValid, false);
    
    const result = ruleResult.data.validate("this is too long");
    assertEquals(result.errorMessage, "comment must not exceed 10 characters");
  }
});

Deno.test("ValidationRule - pattern validation", () => {
  const ruleResult = ValidationRule.create<string>(
    "pattern_code",
    (value) => /^[A-Z]+$/.test(value),
    "code does not match the required pattern"
  );
  
  assertEquals(ruleResult.ok, true);
  if (ruleResult.ok) {
    assertEquals(ruleResult.data.validate("ABC").isValid, true);
    assertEquals(ruleResult.data.validate("abc").isValid, false);
    
    const result = ruleResult.data.validate("123");
    assertEquals(result.errorMessage, "code does not match the required pattern");
  }
});

Deno.test("ValidationRule - pattern with custom message", () => {
  const ruleResult = ValidationRule.create<string>(
    "pattern_zipCode",
    (value) => /^\d{3}-\d{4}$/.test(value),
    "Zip code must be in format XXX-XXXX"
  );
  
  assertEquals(ruleResult.ok, true);
  if (ruleResult.ok) {
    const result = ruleResult.data.validate("12345");
    assertEquals(result.errorMessage, "Zip code must be in format XXX-XXXX");
  }
});

Deno.test("ValidationRule - range validation", () => {
  const ruleResult = ValidationRule.range(1, 100, "score");
  
  assertEquals(ruleResult.ok, true);
  if (ruleResult.ok) {
    assertEquals(ruleResult.data.validate(50).isValid, true);
    assertEquals(ruleResult.data.validate(1).isValid, true);
    assertEquals(ruleResult.data.validate(100).isValid, true);
    assertEquals(ruleResult.data.validate(0).isValid, false);
    assertEquals(ruleResult.data.validate(101).isValid, false);
    
    const result = ruleResult.data.validate(150);
    assertEquals(result.errorMessage, "score must be between 1 and 100");
  }
});

Deno.test("ValidationRule - range validates parameters", () => {
  const result = ValidationRule.range(100, 1);
  assertEquals(result.ok, false);
  if (!result.ok && result.error.kind === "InvalidRange") {
    assertEquals(result.error.min, 100);
    assertEquals(result.error.max, 1);
  }
});

Deno.test("ValidationRule - custom validation", () => {
  const ruleResult = ValidationRule.create<number>(
    "even",
    (value) => value % 2 === 0,
    "Value must be even"
  );
  
  assertEquals(ruleResult.ok, true);
  if (ruleResult.ok) {
    assertEquals(ruleResult.data.validate(4).isValid, true);
    assertEquals(ruleResult.data.validate(3).isValid, false);
  }
});

Deno.test("ValidationRule - when conditional validation", () => {
  const baseRuleResult = ValidationRule.minLength(5);
  
  if (baseRuleResult.ok) {
    const conditionalRule = baseRuleResult.data.when(
      (isRequired: boolean) => isRequired,
      true
    );
    
    assertEquals(conditionalRule.validate("12345").isValid, true);
    assertEquals(conditionalRule.validate("123").isValid, false);
    
    const alwaysSkipRule = baseRuleResult.data.when(
      (isRequired: boolean) => isRequired,
      false
    );
    
    assertEquals(alwaysSkipRule.validate("123").isValid, true);
  }
});

Deno.test("ValidationRule - optional validation", () => {
  const baseRuleResult = ValidationRule.minLength(5);
  
  if (baseRuleResult.ok) {
    const optionalRule = baseRuleResult.data.optional();
    
    assertEquals(optionalRule.validate("12345").isValid, true);
    assertEquals(optionalRule.validate("123").isValid, false);
    assertEquals(optionalRule.validate(null).isValid, true);
    assertEquals(optionalRule.validate(undefined).isValid, true);
    assertEquals(optionalRule.isOptionalRule(), true);
  }
});

Deno.test("ValidationRule - and combination", () => {
  const minRuleResult = ValidationRule.minLength(3);
  const maxRuleResult = ValidationRule.maxLength(10);
  
  if (minRuleResult.ok && maxRuleResult.ok) {
    const combined = minRuleResult.data.and(maxRuleResult.data);
    
    assertEquals(combined.validate("hello").isValid, true);
    assertEquals(combined.validate("ab").isValid, false);
    assertEquals(combined.validate("this is too long").isValid, false);
  }
});

Deno.test("ValidationRule - or combination", () => {
  const emailRuleResult = ValidationRule.create<string>(
    "pattern_contact_email",
    (value) => /@/.test(value),
    "Must contain @"
  );
  const phoneRuleResult = ValidationRule.create<string>(
    "pattern_contact_phone",
    (value) => /^\d+$/.test(value),
    "Must be digits"
  );
  
  if (emailRuleResult.ok && phoneRuleResult.ok) {
    const combined = emailRuleResult.data.or(phoneRuleResult.data);
    
    assertEquals(combined.validate("user@example.com").isValid, true);
    assertEquals(combined.validate("1234567890").isValid, true);
    assertEquals(combined.validate("invalid").isValid, false);
  }
});

Deno.test("ValidationRule - withMessage customization", () => {
  const ruleResult = ValidationRule.minLength(5);
  
  if (ruleResult.ok) {
    const customizedResult = ruleResult.data.withMessage("Too short!");
    
    if (customizedResult.ok) {
      const result = customizedResult.data.validate("abc");
      assertEquals(result.errorMessage, "Too short!");
    }
  }
});

Deno.test("ValidationRule - withMessage validates message", () => {
  const ruleResult = ValidationRule.minLength(5);
  
  if (ruleResult.ok) {
    const result = ruleResult.data.withMessage("");
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyErrorMessage");
    }
  }
});

Deno.test("ValidationRule - combine multiple rules", () => {
  const minLengthResult = ValidationRule.minLength(3);
  const maxLengthResult = ValidationRule.maxLength(10);
  
  if (minLengthResult.ok && maxLengthResult.ok) {
    const rules = [
      ValidationRule.required<string>("value"),
      minLengthResult.data,
      maxLengthResult.data,
    ];
    
    const combinedResult = ValidationRule.combine(rules);
    
    if (combinedResult.ok) {
      assertEquals(combinedResult.data.validate("hello").isValid, true);
      assertEquals(combinedResult.data.validate(null as any).isValid, false);
      assertEquals(combinedResult.data.validate("ab").isValid, false);
      assertEquals(combinedResult.data.validate("this is too long").isValid, false);
    }
  }
});

Deno.test("ValidationRule - combine validates rules array", () => {
  const result = ValidationRule.combine([]);
  assertEquals(result.ok, false);
  if (!result.ok && result.error.kind === "EmptyRuleSet") {
    assertEquals(result.error.operation, "combine");
  }
});

Deno.test("ValidationRule - combine single rule", () => {
  const ruleResult = ValidationRule.minLength(5);
  
  if (ruleResult.ok) {
    const combinedResult = ValidationRule.combine([ruleResult.data]);
    
    if (combinedResult.ok) {
      assertEquals(combinedResult.data.getName(), ruleResult.data.getName());
      assertEquals(combinedResult.data.validate("hello").isValid, true);
    }
  }
});

Deno.test("ValidationRule - validation result includes applied rules", () => {
  const ruleResult = ValidationRule.minLength(5, "test");
  
  if (ruleResult.ok) {
    const result = ruleResult.data.validate("hello");
    
    assertEquals(result.appliedRules.length, 1);
    assertEquals(result.appliedRules[0], "minLength_5_test");
  }
});

Deno.test("ValidationRule - toString returns correct format", () => {
  const ruleResult = ValidationRule.minLength(5);
  
  if (ruleResult.ok) {
    assertEquals(ruleResult.data.toString(), "ValidationRule(minLength_5_value)");
    
    const optionalRule = ruleResult.data.optional();
    assertEquals(optionalRule.toString(), "ValidationRule(optional_minLength_5_value, optional)");
  }
});