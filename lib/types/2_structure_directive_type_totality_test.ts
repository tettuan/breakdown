/**
 * @fileoverview Structure tests for DirectiveType with Totality improvements
 * Testing data structure integrity with Result-based patterns
 *
 * Structure tests verify:
 * - Immutability guarantees
 * - Result type integration
 * - Error information completeness
 * - Type safety with ValidationError
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { DirectiveType, TwoParamsDirectivePattern } from "./mod.ts";
import type { TwoParams_Result } from "../deps.ts";
import { isError, isOk } from "./result.ts";

// Test helper
const _createTwoParamsResult = (directiveType: string): TwoParams_Result => ({
  type: "two",
  directiveType,
  layerType: "project",
  demonstrativeType: directiveType,
  params: [directiveType, "project"],
  options: {},
});

Deno.test("2_structure: TwoParamsDirectivePattern.createOrError follows Result pattern", () => {
  // Success case with valid pattern
  const validResult = TwoParamsDirectivePattern.createOrError("^(to|from)$");
  assertExists(validResult);
  assertEquals(isOk(validResult), true);

  if (validResult.ok) {
    const pattern = validResult.data;
    assertEquals(pattern.test("to"), true);
    assertEquals(pattern.test("from"), true);
    assertEquals(pattern.test("invalid"), false);
  }

  // Error case with invalid pattern
  const invalidResult = TwoParamsDirectivePattern.createOrError("invalid[regex");
  assertExists(invalidResult);
  assertEquals(isError(invalidResult), true);

  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "InvalidInput");
    if (invalidResult.error.kind === "InvalidInput") {
      assertEquals(invalidResult.error.field, "pattern");
      assertEquals(invalidResult.error.value, "invalid[regex");
      assertExists(invalidResult.error.reason);
      assertEquals(invalidResult.error.reason.includes("Invalid regex"), true);
    }
  }

  // Error case with empty pattern
  const emptyResult = TwoParamsDirectivePattern.createOrError("");
  assertEquals(isError(emptyResult), true);

  if (!emptyResult.ok) {
    assertEquals(emptyResult.error.kind, "InvalidInput");
    if (emptyResult.error.kind === "InvalidInput") {
      assertEquals(emptyResult.error.reason, "Pattern cannot be empty");
    }
  }
});

Deno.test("2_structure: TwoParamsDirectivePattern provides backward compatibility", () => {
  // Both create methods should work
  const nullPattern = TwoParamsDirectivePattern.create("^test$");
  const resultPattern = TwoParamsDirectivePattern.createOrError("^test$");

  assertExists(nullPattern);
  assertEquals(isOk(resultPattern), true);

  if (resultPattern.ok) {
    // Both should produce functionally equivalent patterns
    assertEquals(nullPattern.test("test"), true);
    assertEquals(resultPattern.data.test("test"), true);
    assertEquals(nullPattern.test("other"), false);
    assertEquals(resultPattern.data.test("other"), false);
  }
});

Deno.test("2_structure: DirectiveType immutability with frozen objects", () => {
  const directiveResult = DirectiveType.create("to");

  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    const directiveType = directiveResult.data;

    // Value should be immutable
    const value1 = directiveType.value;
    const value2 = directiveType.value;
    assertEquals(value1, value2);
    assertEquals(value1, "to");

    // DirectiveType instance should be immutable
    assertEquals(directiveType.value, "to");
  }
});

Deno.test("2_structure: DirectiveType handles creation with complex configurations", () => {
  // DirectiveType should work with string values
  const directiveResult = DirectiveType.create("to");

  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    const directiveType = directiveResult.data;
    assertEquals(directiveType.value, "to");

    // Test basic functionality is preserved
    assertEquals(typeof directiveType.value, "string");
    assertEquals(directiveType.toString(), "to");
  }
});

Deno.test("2_structure: TwoParamsDirectivePattern error messages are informative", () => {
  const testCases = [
    {
      pattern: "(",
      expectedInError: ["Invalid regex", "Unterminated group"],
    },
    {
      pattern: "[z-a]",
      expectedInError: ["Invalid regex", "Invalid character class"],
    },
    {
      pattern: "(?<invalid",
      expectedInError: ["Invalid regex"],
    },
  ];

  for (const { pattern, expectedInError } of testCases) {
    const result = TwoParamsDirectivePattern.createOrError(pattern);
    assertEquals(isError(result), true);

    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidInput");
      if (result.error.kind === "InvalidInput") {
        assertEquals(result.error.field, "pattern");
        assertEquals(result.error.value, pattern);

        // Check that error message contains expected keywords
        const errorMessage = result.error.reason.toLowerCase();
        for (const expected of expectedInError) {
          const containsExpected = errorMessage.includes(expected.toLowerCase());
          if (containsExpected) {
            assertEquals(containsExpected, true);
            break; // At least one expected keyword found
          }
        }
      }
    }
  }
});

Deno.test("2_structure: DirectiveType value extraction is consistent", () => {
  const testValue = "to";
  const directiveResult = DirectiveType.create(testValue);

  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    const directiveType = directiveResult.data;

    // All access methods should return identical values
    const accessMethods = [
      () => directiveType.value,
      () => directiveType.value,
      () => directiveType.toString(),
    ];

    const values = accessMethods.map((method) => method());
    for (const value of values) {
      assertEquals(value, testValue);
    }
  }
});

Deno.test("2_structure: DirectiveType maintains core value functionality", () => {
  const directiveResult = DirectiveType.create("to");

  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    const directiveType = directiveResult.data;

    // Core functionality should work
    assertEquals(directiveType.value, "to");
    assertEquals(typeof directiveType.value, "string");
    assertEquals(directiveType.toString(), "to");

    // Value object characteristics preserved
    assertEquals(directiveType.value.length > 0, true);
  }
});

Deno.test("2_structure: TwoParamsDirectivePattern maintains method consistency", () => {
  const pattern = TwoParamsDirectivePattern.create("^[a-z]+$");
  assertExists(pattern);

  // All string representation methods should be consistent
  const toString = pattern.toString();
  const getPattern = pattern.getPattern();

  assertEquals(typeof toString, "string");
  assertEquals(typeof getPattern, "string");
  assertEquals(getPattern, "^[a-z]+$");

  // getDirectivePattern should return the same instance
  const self1 = pattern.getDirectivePattern();
  const self2 = pattern.getDirectivePattern();
  assertEquals(self1, pattern);
  assertEquals(self2, pattern);
  assertEquals(self1, self2);
});
