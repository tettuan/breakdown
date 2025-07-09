/**
 * @fileoverview Unit tests for PromptContent Smart Constructor
 * Testing architecture constraints, behavior verification, and structure integrity
 * Following Totality principle with Result type for explicit error handling
 */

import { assertEquals, assertExists } from "@std/assert";
import { PromptContent, type PromptContentResult } from "./prompt_content.ts";

// Test fixtures
const validContent = "This is a {{variable}} prompt with {{another}} placeholder.";
const emptyContent = "";
const whitespaceContent = "   \n\t  ";
const noVariableContent = "This is a simple prompt without variables.";
const multilineContent = `Line 1: {{var1}}
Line 2: Some text
Line 3: {{var2}} and {{var3}}`;

// =============================================================================
// 0_architecture: Type Constraint Tests
// =============================================================================

Deno.test("0_architecture: Smart Constructor - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  // @ts-expect-error - Testing that direct instantiation is not allowed
  const directInstantiation = () => new PromptContent(validContent);

  // This test verifies the TypeScript error above
  // The constructor is private and enforces factory pattern
  assertEquals(typeof PromptContent.create, "function");
});

Deno.test("0_architecture: Smart Constructor - returns Result type", () => {
  // Architecture constraint: must return Result type for error handling
  const result = PromptContent.create(validContent);

  assertExists(result);
  assertEquals(typeof result.ok, "boolean");

  if (result.ok) {
    assertExists(result.data);
    assertEquals(result.data!.constructor.name, "PromptContent");
  } else {
    assertExists(result.error);
    assertEquals(typeof result.error, "string");
  }
});

Deno.test("0_architecture: Smart Constructor - no exceptions thrown", () => {
  // Architecture constraint: must not throw exceptions (Totality principle)
  const testCases = [
    null,
    undefined,
    "",
    "   ",
    0,
    [],
    {},
    Symbol("test"),
    () => {},
  ];

  for (const testCase of testCases) {
    // Should not throw - all errors handled via Result type
    const result = PromptContent.create(testCase as any);
    assertExists(result);
    assertEquals(typeof result.ok, "boolean");
  }
});

Deno.test("0_architecture: Totality principle - handles all input types", () => {
  // Architecture constraint: should handle any input without throwing
  const extremeTestCases = [
    null,
    undefined,
    0,
    false,
    [],
    {},
    Symbol("test"),
    () => {},
    new Date(),
    /regex/,
    BigInt(123),
  ];

  for (const testCase of extremeTestCases) {
    const result = PromptContent.create(testCase as any);
    assertEquals(typeof result.ok, "boolean");

    if (testCase === null || testCase === undefined || testCase === 0 || testCase === false) {
      assertEquals(result.ok, false);
    }
  }
});

Deno.test("0_architecture: Result type follows discriminated union pattern", () => {
  const successResult = PromptContent.create(validContent);
  const errorResult = PromptContent.create("");

  // Success case
  if (successResult.ok) {
    assertExists(successResult.data);
    assertEquals("error" in successResult, false);
  }

  // Error case
  if (!errorResult.ok) {
    assertExists(errorResult.error);
    assertEquals("data" in errorResult, false);
  }
});

// =============================================================================
// 1_behavior: Runtime Behavior Tests
// =============================================================================

Deno.test("1_behavior: creates PromptContent with valid content", () => {
  const result = PromptContent.create(validContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data!.getValue(), validContent);
  }
});

Deno.test("1_behavior: rejects empty content", () => {
  const result = PromptContent.create(emptyContent);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Prompt content cannot be empty");
  }
});

Deno.test("1_behavior: rejects whitespace-only content", () => {
  const result = PromptContent.create(whitespaceContent);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Prompt content cannot be empty");
  }
});

Deno.test("1_behavior: extracts variables from content", () => {
  const result = PromptContent.create(validContent);

  if (result.ok) {
    const variables = result.data!.getVariables();
    assertEquals(variables.length, 2);
    assertEquals(variables.includes("variable"), true);
    assertEquals(variables.includes("another"), true);
  }
});

Deno.test("1_behavior: handles content without variables", () => {
  const result = PromptContent.create(noVariableContent);

  if (result.ok) {
    const variables = result.data!.getVariables();
    assertEquals(variables.length, 0);
    assertEquals(result.data!.hasVariables(), false);
  }
});

Deno.test("1_behavior: detects presence of variables", () => {
  const withVariables = PromptContent.create(validContent);
  const withoutVariables = PromptContent.create(noVariableContent);

  if (withVariables.ok) {
    assertEquals(withVariables.data!.hasVariables(), true);
  }

  if (withoutVariables.ok) {
    assertEquals(withoutVariables.data!.hasVariables(), false);
  }
});

Deno.test("1_behavior: provides content length", () => {
  const result = PromptContent.create(validContent);

  if (result.ok) {
    assertEquals(result.data!.getLength(), validContent.length);
    assertEquals(result.data!.isEmpty(), false);
  }
});

Deno.test("1_behavior: generates consistent hash", () => {
  const result1 = PromptContent.create(validContent);
  const result2 = PromptContent.create(validContent);

  if (result1.ok && result2.ok) {
    assertEquals(result1.data!.getHash(), result2.data!.getHash());
  }
});

Deno.test("1_behavior: replaces variables correctly", () => {
  const result = PromptContent.create(validContent);

  if (result.ok) {
    const replacements = {
      "variable": "test",
      "another": "value",
    };

    const replaced = result.data!.replaceVariables(replacements);
    assertEquals(replaced, "This is a test prompt with value placeholder.");
  }
});

Deno.test("1_behavior: provides content preview", () => {
  const longContent = "a".repeat(150);
  const result = PromptContent.create(longContent);

  if (result.ok) {
    const preview = result.data!.getPreview();
    assertEquals(preview.length, 103); // 100 chars + "..."
    assertEquals(preview.endsWith("..."), true);
  }
});

Deno.test("1_behavior: counts lines correctly", () => {
  const result = PromptContent.create(multilineContent);

  if (result.ok) {
    assertEquals(result.data!.getLineCount(), 3);
  }
});

// =============================================================================
// 2_structure: Structural Correctness Tests
// =============================================================================

Deno.test("2_structure: PromptContent immutability", () => {
  const result = PromptContent.create(validContent);

  if (result.ok) {
    const content = result.data!;

    // getValue should always return the same content
    assertEquals(content.getValue(), validContent);
    assertEquals(content.getValue(), content.getValue());
  }
});

Deno.test("2_structure: variable extraction immutability", () => {
  const result = PromptContent.create(validContent);

  if (result.ok) {
    const variables1 = result.data!.getVariables();
    const variables2 = result.data!.getVariables();

    // Should return arrays with same content but potentially different instances
    assertEquals(variables1.length, variables2.length);
    for (let i = 0; i < variables1.length; i++) {
      assertEquals(variables1[i], variables2[i]);
    }
  }
});

Deno.test("2_structure: error results have correct structure", () => {
  const invalidResult = PromptContent.create("");

  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    assertExists(invalidResult.error);
    assertEquals(typeof invalidResult.error, "string");
    assertEquals(invalidResult.data, undefined);
  }
});

Deno.test("2_structure: success results have correct structure", () => {
  const validResult = PromptContent.create(validContent);

  assertEquals(validResult.ok, true);
  if (validResult.ok) {
    assertExists(validResult.data);
    assertEquals(validResult.data instanceof PromptContent, true);
    assertEquals(validResult.error, undefined);
  }
});

Deno.test("2_structure: method return type consistency", () => {
  const result = PromptContent.create(validContent);

  if (result.ok) {
    const content = result.data!;

    // Verify return types
    assertEquals(typeof content.getValue(), "string");
    assertEquals(Array.isArray(content.getVariables()), true);
    assertEquals(typeof content.hasVariables(), "boolean");
    assertEquals(typeof content.getLength(), "number");
    assertEquals(typeof content.isEmpty(), "boolean");
    assertEquals(typeof content.getHash(), "string");
    assertEquals(typeof content.getPreview(), "string");
    assertEquals(typeof content.getLineCount(), "number");
    assertEquals(typeof content.toString(), "string");
  }
});

Deno.test("2_structure: equals method correctness", () => {
  const result1 = PromptContent.create(validContent);
  const result2 = PromptContent.create(validContent);
  const result3 = PromptContent.create(noVariableContent);

  if (result1.ok && result2.ok && result3.ok) {
    // Type assertion to help TypeScript understand the types are safe
    const data1 = result1.data!;
    const data2 = result2.data!;
    const data3 = result3.data!;

    // Same content should be equal
    assertEquals(data1.equals(data2), true);
    assertEquals(data2.equals(data1), true);

    // Different content should not be equal
    assertEquals(data1.equals(data3), false);
    assertEquals(data3.equals(data1), false);
  }
});

Deno.test("2_structure: toString implementation", () => {
  const result = PromptContent.create(validContent);

  if (result.ok) {
    assertEquals(result.data!.toString(), validContent);
    assertEquals(result.data!.toString(), result.data!.getValue());
  }
});

Deno.test("2_structure: variable replacement preserves original", () => {
  const result = PromptContent.create(validContent);

  if (result.ok) {
    const original = result.data!.getValue();
    const replaced = result.data!.replaceVariables({ "variable": "test" });

    // Original should be unchanged
    assertEquals(result.data!.getValue(), original);
    // Replaced should be different
    assertEquals(replaced !== original, true);
  }
});

Deno.test("2_structure: multiple instance independence", () => {
  const result1 = PromptContent.create("Content 1 with {{var}}");
  const result2 = PromptContent.create("Content 2 with {{var}}");

  if (result1.ok && result2.ok) {
    // Type assertion to help TypeScript understand the types are safe
    const data1 = result1.data!;
    const data2 = result2.data!;

    // Different instances should be independent
    assertEquals(data1 === data2, false);
    assertEquals(data1.equals(data2), false);

    // But they should have same variable
    assertEquals(data1.getVariables()[0], data2.getVariables()[0]);
  }
});

Deno.test("2_structure: PromptContentResult interface compliance", () => {
  const validResult: PromptContentResult = PromptContent.create(validContent);
  const invalidResult: PromptContentResult = PromptContent.create("");

  // Valid result structure
  assertEquals(typeof validResult.ok, "boolean");
  if (validResult.ok) {
    assertExists(validResult.data);
    assertEquals(validResult.error, undefined);
  }

  // Invalid result structure
  assertEquals(typeof invalidResult.ok, "boolean");
  if (!invalidResult.ok) {
    assertEquals(invalidResult.data, undefined);
    assertExists(invalidResult.error);
  }
});
