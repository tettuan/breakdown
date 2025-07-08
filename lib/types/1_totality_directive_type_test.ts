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
import type { ValidationError } from "./mod.ts";

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

Deno.test("1_totality: DirectiveType.createOrError validates all input conditions", () => {
  // Test valid inputs
  const validResult = createTwoParamsResult("to", "project");
  const directiveResult = DirectiveType.createOrError(validResult);
  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    assertEquals(directiveResult.data.value, "to");
  }

  // Test invalid result type
  const invalidTypeResult = {
    type: "one" as any,
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };
  const invalidTypeDirective = DirectiveType.createOrError(invalidTypeResult as TwoParams_Result);
  assertEquals(invalidTypeDirective.ok, false);
  if (!invalidTypeDirective.ok) {
    assertEquals(invalidTypeDirective.error.kind, "InvalidInput");
    if (invalidTypeDirective.error.kind === "InvalidInput") {
      assertEquals(invalidTypeDirective.error.reason, "Invalid TwoParams_Result: must have type 'two'");
    }
  }

  // Test missing demonstrativeType
  const missingFieldResult = {
    type: "two",
    layerType: "project",
    params: ["", "project"],
    options: {},
  } as any;
  const missingFieldDirective = DirectiveType.createOrError(missingFieldResult);
  assertEquals(missingFieldDirective.ok, false);
  if (!missingFieldDirective.ok) {
    assertEquals(missingFieldDirective.error.kind, "MissingRequiredField");
    if (missingFieldDirective.error.kind === "MissingRequiredField") {
      assertEquals(missingFieldDirective.error.field, "demonstrativeType");
      assertEquals(missingFieldDirective.error.source, "TwoParams_Result");
    }
  }

  // Test null result
  const nullDirective = DirectiveType.createOrError(null as any);
  assertEquals(nullDirective.ok, false);
  if (!nullDirective.ok) {
    assertEquals(nullDirective.error.kind, "InvalidInput");
  }
});

Deno.test("1_totality: DirectiveType.createOrError validates pattern matching", () => {
  // Create a pattern for allowed directives
  const patternResult = TwoParamsDirectivePattern.createOrError("^(to|from|summary|defect)$");
  assertEquals(patternResult.ok, true);
  
  if (patternResult.ok) {
    const pattern = patternResult.data;

    // Test valid directive matching pattern
    const validDirectives = ["to", "from", "summary", "defect"];
    for (const directive of validDirectives) {
      const result = createTwoParamsResult(directive);
      const directiveResult = DirectiveType.createOrError(result, pattern);
      assertEquals(directiveResult.ok, true);
      if (directiveResult.ok) {
        assertEquals(directiveResult.data.value, directive);
      }
    }

    // Test invalid directive not matching pattern
    const invalidDirectives = ["invalid", "custom", "analyze"];
    for (const directive of invalidDirectives) {
      const result = createTwoParamsResult(directive);
      const directiveResult = DirectiveType.createOrError(result, pattern);
      assertEquals(directiveResult.ok, false);
      if (!directiveResult.ok) {
        assertEquals(directiveResult.error.kind, "InvalidInput");
        if (directiveResult.error.kind === "InvalidInput") {
          assertEquals(directiveResult.error.field, "demonstrativeType");
          assertEquals(directiveResult.error.value, directive);
          assertEquals(
            directiveResult.error.reason,
            `Value does not match required pattern: ^(to|from|summary|defect)$`
          );
        }
      }
    }

    // Test empty string - should fail with MissingRequiredField
    const emptyResult = createTwoParamsResult("");
    const emptyDirective = DirectiveType.createOrError(emptyResult, pattern);
    assertEquals(emptyDirective.ok, false);
    if (!emptyDirective.ok) {
      assertEquals(emptyDirective.error.kind, "MissingRequiredField");
    }
  }
});

Deno.test("1_totality: DirectiveType.createOrError without pattern allows any valid string", () => {
  // Without pattern, any non-empty string should be valid
  const testValues = [
    "custom-directive",
    "analyze_data",
    "process.files",
    "directive@special",
    "123numeric",
    "ディレクティブ", // Japanese
    "🎯", // Emoji
  ];

  for (const value of testValues) {
    const result = createTwoParamsResult(value);
    const directiveResult = DirectiveType.createOrError(result);
    assertEquals(directiveResult.ok, true);
    if (directiveResult.ok) {
      assertEquals(directiveResult.data.value, value);
    }
  }

  // Empty string should fail
  const emptyResult = createTwoParamsResult("");
  const emptyDirective = DirectiveType.createOrError(emptyResult);
  assertEquals(emptyDirective.ok, false);
  if (!emptyDirective.ok) {
    assertEquals(emptyDirective.error.kind, "MissingRequiredField");
  }
});

Deno.test("1_totality: Error types form exhaustive discriminated union", () => {
  // This test verifies that all error cases are handled with specific error types
  
  function handleDirectiveError(error: ValidationError): string {
    switch (error.kind) {
      case "InvalidInput":
        return `Invalid input in field ${error.field}: ${error.reason}`;
      case "MissingRequiredField":
        return `Missing required field ${error.field} in ${error.source}`;
      case "InvalidFieldType":
        return `Invalid type for ${error.field}: expected ${error.expected}, got ${error.received}`;
      case "ValidationFailed":
        return `Validation failed: ${error.errors.join(", ")}`;
      case "InvalidParamsType":
        return `Invalid params type: expected ${error.expected}, got ${error.received}`;
      case "InvalidDirectiveType":
        return `Invalid directive type: ${error.value} does not match ${error.validPattern}`;
      case "InvalidLayerType":
        return `Invalid layer type: ${error.value} does not match ${error.validPattern}`;
      case "PathValidationFailed":
        return `Path validation failed for ${error.path}: ${error.reason}`;
      case "CustomVariableInvalid":
        return `Custom variable ${error.key} is invalid: ${error.reason}`;
      case "ConfigValidationFailed":
        return `Config validation failed: ${error.errors.join(", ")}`;
      case "UnsupportedParamsType":
        return `Unsupported params type: ${error.type}`;
      default:
        // This should never be reached as we've handled all cases
        // If TypeScript complains here, it means we've missed a case
        return `Unknown error kind`;
    }
  }

  // Test each error type
  const errorCases = [
    DirectiveType.createOrError(null as any),
    DirectiveType.createOrError({ type: "one" } as any),
    DirectiveType.createOrError({ type: "two", layerType: "project" } as any),
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
      { value: "valid-directive", shouldPass: true },
      { value: "another-valid", shouldPass: true },
      { value: "simple", shouldPass: true },
      { value: "Invalid-Case", shouldPass: false },
      { value: "has_underscore", shouldPass: false },
      { value: "has spaces", shouldPass: false },
      { value: "123numeric", shouldPass: false },
    ];

    for (const { value, shouldPass } of testCases) {
      const result = createTwoParamsResult(value);
      const directiveResult = DirectiveType.createOrError(result, patternResult.data);
      
      assertEquals(directiveResult.ok, shouldPass);
      if (directiveResult.ok) {
        assertEquals(directiveResult.data.value, value);
      } else {
        assertEquals(directiveResult.error.kind, "InvalidInput");
        if (directiveResult.error.kind === "InvalidInput") {
          assertEquals(directiveResult.error.field, "demonstrativeType");
          assertEquals(directiveResult.error.value, value);
        }
      }
    }
  }
});

Deno.test("1_totality: Legacy create method maintains backward compatibility", () => {
  // The original create method should still work without Result type
  const result = createTwoParamsResult("legacy");
  const directive = DirectiveType.create(result);
  
  assertExists(directive);
  assertEquals(directive.value, "legacy");
  assertEquals(directive instanceof DirectiveType, true);
  
  // It should accept any valid TwoParams_Result without validation
  const emptyDirective = DirectiveType.create(createTwoParamsResult(""));
  assertEquals(emptyDirective.value, "");
});

Deno.test("1_totality: createOrError provides better error context than create", () => {
  // Demonstrate the advantage of Result-based error handling
  
  const invalidInput = {
    type: "two",
    demonstrativeType: null,
    layerType: "project",
  } as any;
  
  // Legacy create would just return an object with null value
  const legacyDirective = DirectiveType.create(invalidInput);
  assertEquals(legacyDirective.value, null);
  
  // createOrError provides detailed error information
  const resultDirective = DirectiveType.createOrError(invalidInput);
  assertEquals(resultDirective.ok, false);
  if (!resultDirective.ok) {
    assertEquals(resultDirective.error.kind, "MissingRequiredField");
    if (resultDirective.error.kind === "MissingRequiredField") {
      assertEquals(resultDirective.error.field, "demonstrativeType");
      assertEquals(resultDirective.error.source, "TwoParams_Result");
    }
  }
});