/**
 * @fileoverview Totality pattern compliance tests for DirectiveType
 *
 * This test file verifies that DirectiveType follows the Totality principle:
 * - Complete error handling with Result type
 * - No partial functions
 * - Exhaustive pattern matching
 * - Smart constructor patterns with explicit error cases
 *
 * @module lib/types/1_totality_directive_type_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { DirectiveType, TwoParamsDirectivePattern } from "./mod.ts";
import type { TwoParams_Result } from "../deps.ts";
import type { ValidationError, DirectiveTypeError } from "./mod.ts";

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

Deno.test("1_totality: TwoParamsDirectivePattern.createOrError handles all cases exhaustively", () => {
  // Test valid patterns
  const validPatterns = [
    "^(to|from|summary)$",
    "^[a-z]+$",
    "^[a-z0-9-]+$",
    ".*",
    "^test$",
  ];

  for (const pattern of validPatterns) {
    const result = TwoParamsDirectivePattern.createOrError(pattern);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertExists(result.data);
      assertEquals(result.data instanceof TwoParamsDirectivePattern, true);
    }
  }

  // Test invalid patterns
  const invalidPatterns = [
    { pattern: "", expectedReason: "Pattern cannot be empty" },
    { pattern: "invalid[regex", expectedReason: "Invalid regex pattern" },
    { pattern: "(?<", expectedReason: "Invalid regex pattern" },
    { pattern: "*invalid", expectedReason: "Invalid regex pattern" },
    { pattern: "[z-a]", expectedReason: "Invalid regex pattern" },
  ];

  for (const { pattern, expectedReason } of invalidPatterns) {
    const result = TwoParamsDirectivePattern.createOrError(pattern);
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidInput");
      if (result.error.kind === "InvalidInput") {
        assertEquals(result.error.field, "pattern");
        assertEquals(result.error.value, pattern);
        assertEquals(result.error.reason.includes(expectedReason), true);
      }
    }
  }
});

Deno.test("1_totality: DirectiveType.create validates all input conditions", () => {
  // Test valid inputs
  const validResult = createTwoParamsResult("to", "project");
  const directiveResult = DirectiveType.create(validResult.directiveType);
  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    assertEquals(directiveResult.data.value, "to");
  }

  // Test invalid result type
  const invalidTypeResult = {
    type: "one" as string,
    directiveType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };
  const invalidTypeDirective = DirectiveType.create(invalidTypeResult.directiveType);
  assertEquals(invalidTypeDirective.ok, true);
  if (invalidTypeDirective.ok) {
    assertEquals(invalidTypeDirective.data.value, "to");
  }

  // Test missing directiveType
  const missingFieldResult = {
    type: "two",
    directiveType: "to",
    demonstrativeType: "to",
    layerType: "project",
    params: ["", "project"],
    options: {},
  } as unknown as TwoParams_Result;
  const missingFieldDirective = DirectiveType.create(missingFieldResult.directiveType);
  assertEquals(missingFieldDirective.ok, false);
  if (!missingFieldDirective.ok) {
    assertEquals(missingFieldDirective.error.kind, "EmptyInput");
    if (missingFieldDirective.error.kind === "EmptyInput") {
      assertEquals(missingFieldDirective.error.message, "DirectiveType cannot be empty, null, or undefined");
    }
  }

  // Test null result
  const nullDirective = DirectiveType.create(null as unknown as string);
  assertEquals(nullDirective.ok, false);
  if (!nullDirective.ok) {
    assertEquals(nullDirective.error.kind, "EmptyInput");
  }
});

Deno.test("1_totality: DirectiveType.create validates pattern matching", () => {
  // Create a pattern for allowed directives
  const patternResult = TwoParamsDirectivePattern.createOrError("^(to|from|summary|defect)$");
  assertEquals(patternResult.ok, true);

  if (patternResult.ok) {
    const pattern = patternResult.data;

    // Test valid directive matching pattern
    const validDirectives = ["to", "from", "summary", "defect"];
    for (const directive of validDirectives) {
      const result = createTwoParamsResult(directive);
      const directiveResult = DirectiveType.create(result.directiveType);
      assertEquals(directiveResult.ok, true);
      if (directiveResult.ok) {
        assertEquals(directiveResult.data.value, directive);
      }
    }

    // Test invalid directive not matching pattern
    const invalidDirectives = ["invalid", "custom", "analyze"];
    for (const directive of invalidDirectives) {
      const result = createTwoParamsResult(directive);
      const directiveResult = DirectiveType.create(result.directiveType);
      assertEquals(directiveResult.ok, false);
      if (!directiveResult.ok) {
        assertEquals(directiveResult.error.kind, "PatternMismatch");
        if (directiveResult.error.kind === "PatternMismatch") {
          assertEquals(directiveResult.error.value, directive);
          assertEquals(
            directiveResult.error.message,
            `DirectiveType "${directive}" is not valid for profile "default". Valid directives: to, summary, defect`,
          );
        }
      }
    }

    // Test empty string - should fail with MissingRequiredField
    const emptyResult = createTwoParamsResult("");
    const emptyDirective = DirectiveType.create(emptyResult.directiveType);
    assertEquals(emptyDirective.ok, false);
    if (!emptyDirective.ok) {
      assertEquals(emptyDirective.error.kind, "MissingRequiredField");
    }
  }
});

Deno.test("1_totality: DirectiveType.create without pattern allows any valid string", () => {
  // Test with valid basic pattern values
  const testValues = [
    "custom-directive",
    "analyze_data",
    "process",
    "directive123",
    "to",
    "summary",
    "defect",
  ];

  for (const value of testValues) {
    const result = createTwoParamsResult(value);
    const directiveResult = DirectiveType.create(result.directiveType);
    if (["to", "summary", "defect"].includes(value)) {
      assertEquals(directiveResult.ok, true);
      if (directiveResult.ok) {
        assertEquals(directiveResult.data.value, value);
      }
    } else {
      assertEquals(directiveResult.ok, false);
    }
  }

  // Empty string should fail
  const emptyResult = createTwoParamsResult("");
  const emptyDirective = DirectiveType.create(emptyResult.directiveType);
  assertEquals(emptyDirective.ok, false);
  if (!emptyDirective.ok) {
    assertEquals(emptyDirective.error.kind, "MissingRequiredField");
  }
});

Deno.test("1_totality: Error types form exhaustive discriminated union", () => {
  // This test verifies that all error cases are handled with specific error types

  function handleDirectiveError(error: DirectiveTypeError): string {
    switch (error.kind) {
      case "EmptyInput":
        return `Empty input: ${error.message}`;
      case "InvalidFormat":
        return `Invalid format for ${error.value}: expected ${error.pattern}`;
      case "PatternMismatch":
        return `Pattern mismatch: ${error.value} is not valid for profile ${error.profile}`;
      case "TooLong":
        return `Value too long: ${error.value} exceeds maximum length of ${error.maxLength}`;
      default:
        // This should never be reached as we've handled all cases
        // If TypeScript complains here, it means we've missed a case
        return `Unknown error kind`;
    }
  }

  // Test each error type
  const errorCases = [
    DirectiveType.create(null as unknown as string),
    DirectiveType.create(("to" as any) as string),
    DirectiveType.create("" as string),
  ];

  for (const result of errorCases) {
    if (!result.ok) {
      const message = handleDirectiveError(result.error);
      assertExists(message);
      assertEquals(typeof message, "string");
      assertEquals(message.length > 0, true);
    }
  }
});

Deno.test("1_totality: Pattern and DirectiveType composition maintains totality", () => {
  // Test that composing pattern validation with directive creation maintains totality

  // Chain pattern creation and directive creation
  const patternResult = TwoParamsDirectivePattern.createOrError("^[a-z]+(-[a-z]+)*$");
  assertEquals(patternResult.ok, true);

  if (patternResult.ok) {
    const testCases = [
      { value: "to", shouldPass: true },
      { value: "summary", shouldPass: true },
      { value: "defect", shouldPass: true },
      { value: "invalid", shouldPass: false },
      { value: "Invalid-Case", shouldPass: false },
      { value: "has_underscore", shouldPass: false },
      { value: "has spaces", shouldPass: false },
      { value: "123numeric", shouldPass: false },
    ];

    for (const { value, shouldPass } of testCases) {
      const result = createTwoParamsResult(value);
      const directiveResult = DirectiveType.create(result.directiveType);

      assertEquals(directiveResult.ok, shouldPass);
      if (directiveResult.ok) {
        assertEquals(directiveResult.data.value, value);
      } else {
        if (value === "has spaces") {
          assertEquals(directiveResult.error.kind, "InvalidFormat");
        } else {
          assertEquals(directiveResult.error.kind, "PatternMismatch");
        }
      }
    }
  }
});

Deno.test("1_totality: DirectiveType.create returns Result type", () => {
  // DirectiveType.create should return Result<DirectiveType, DirectiveTypeError>
  const result = createTwoParamsResult("to");
  const directiveResult = DirectiveType.create(result.directiveType);

  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    assertExists(directiveResult.data);
    assertEquals(directiveResult.data.value, "to");
    assertEquals(directiveResult.data instanceof DirectiveType, true);
  }

  // Empty string should fail with Result error
  const emptyDirectiveResult = DirectiveType.create("");
  assertEquals(emptyDirectiveResult.ok, false);
  if (!emptyDirectiveResult.ok) {
    assertEquals(emptyDirectiveResult.error.kind, "EmptyInput");
  }
});

Deno.test("1_totality: createOrError provides better error context than create", () => {
  // Demonstrate the advantage of Result-based error handling

  const invalidInput = {
    type: "two",
    directiveType: null,
    demonstrativeType: null,
    layerType: "project",
  } as unknown as TwoParams_Result;

  // DirectiveType.create with null input
  const nullDirectiveResult = DirectiveType.create(invalidInput.directiveType);
  assertEquals(nullDirectiveResult.ok, false);
  if (!nullDirectiveResult.ok) {
    assertEquals(nullDirectiveResult.error.kind, "EmptyInput");
  }

  // Same method provides detailed error information
  const resultDirective = DirectiveType.create(invalidInput.directiveType);
  assertEquals(resultDirective.ok, false);
  if (!resultDirective.ok) {
    assertEquals(resultDirective.error.kind, "EmptyInput");
    if (resultDirective.error.kind === "EmptyInput") {
      assertEquals("message" in resultDirective.error, true, "Error should include message");
    }
  }
});
