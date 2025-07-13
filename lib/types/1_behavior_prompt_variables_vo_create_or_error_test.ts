/**
 * @fileoverview Behavior tests for PromptVariablesVO.createOrError method
 * Testing Result-based error handling and validation
 *
 * Behavior tests verify:
 * - Error handling with Result type
 * - Validation rules
 * - Edge cases and boundary conditions
 * - Options behavior
 */

import { assertEquals, assertExists } from "@std/assert";
import { PromptVariablesVO } from "./prompt_variables_vo.ts";
import { FilePathVariable, StandardVariable, UserVariable } from "./prompt_variables_vo.ts";
import type { PromptVariable } from "./prompt_variables_vo.ts";
import { ErrorGuards } from "./mod.ts";

// Test helper to create test variables
const createValidVariables = (): PromptVariable[] => {
  const var1 = StandardVariable.create("input_text_file", "/path/to/file");
  const var2 = FilePathVariable.create("schema_file", "/path/to/schema");

  if (!var1.ok || !var2.ok) {
    throw new Error("Failed to create test variables");
  }

  return [var1.data, var2.data];
};

Deno.test("1_behavior: createOrError handles null input correctly", () => {
  const result = PromptVariablesVO.createOrError(null);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "MissingRequiredField");
    if (result.error.kind === "MissingRequiredField") {
      assertEquals(result.error.field, "variables");
      assertEquals(result.error.source, "PromptVariablesVO");
      assertExists(result.error.context);
    }
  }
});

Deno.test("1_behavior: createOrError handles undefined input correctly", () => {
  const result = PromptVariablesVO.createOrError(undefined);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "MissingRequiredField");
    if (result.error.kind === "MissingRequiredField") {
      assertEquals(result.error.field, "variables");
      assertEquals(result.error.source, "PromptVariablesVO");
    }
  }
});

Deno.test("1_behavior: createOrError handles non-array input correctly", () => {
  const result = PromptVariablesVO.createOrError("not an array" as unknown as PromptVariable[]);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidFieldType");
    if (result.error.kind === "InvalidFieldType") {
      assertEquals(result.error.field, "variables");
      assertEquals(result.error.expected, "Array<PromptVariable>");
      assertEquals(result.error.received, "string");
      assertExists(result.error.context);
    }
  }
});

Deno.test("1_behavior: createOrError accepts empty array by default", () => {
  const result = PromptVariablesVO.createOrError([]);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.isEmpty(), true);
    assertEquals(result.data.size(), 0);
  }
});

Deno.test("1_behavior: createOrError rejects empty array with requireNonEmpty option", () => {
  const result = PromptVariablesVO.createOrError([], { requireNonEmpty: true });

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidInput");
    if (result.error.kind === "InvalidInput") {
      assertEquals(result.error.field, "variables");
      assertEquals(result.error.reason.includes("cannot be empty"), true);
    }
  }
});

Deno.test("1_behavior: createOrError accepts valid variables", () => {
  const variables = createValidVariables();
  const result = PromptVariablesVO.createOrError(variables);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.size(), 2);
    assertEquals(result.data.hasVariable("input_text_file"), true);
    assertEquals(result.data.hasVariable("schema_file"), true);
  }
});

Deno.test("1_behavior: createOrError enforces maxVariables limit", () => {
  const variables = createValidVariables();

  // Should pass with limit of 2
  const result1 = PromptVariablesVO.createOrError(variables, { maxVariables: 2 });
  assertEquals(result1.ok, true);

  // Should fail with limit of 1
  const result2 = PromptVariablesVO.createOrError(variables, { maxVariables: 1 });
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "InvalidInput");
    if (result2.error.kind === "InvalidInput") {
      assertEquals(result2.error.field, "variables");
      assertEquals(result2.error.value, 2); // actual count
      assertEquals(result2.error.reason.includes("exceeds maximum allowed"), true);
    }
  }
});

Deno.test("1_behavior: createOrError allows duplicates by default", () => {
  const var1 = StandardVariable.create("input_text_file", "/path1");
  const var2 = StandardVariable.create("input_text_file", "/path2");

  if (!var1.ok || !var2.ok) {
    throw new Error("Failed to create test variables");
  }

  const result = PromptVariablesVO.createOrError([var1.data, var2.data]);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.size(), 2);
  }
});

Deno.test("1_behavior: createOrError rejects duplicates with allowDuplicates false", () => {
  const var1 = StandardVariable.create("input_text_file", "/path1");
  const var2 = StandardVariable.create("input_text_file", "/path2");

  if (!var1.ok || !var2.ok) {
    throw new Error("Failed to create test variables");
  }

  const result = PromptVariablesVO.createOrError(
    [var1.data, var2.data],
    { allowDuplicates: false },
  );

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidInput");
    if (result.error.kind === "InvalidInput") {
      assertEquals(result.error.field, "variables[1]");
      assertEquals(result.error.value, "input_text_file");
      assertEquals(result.error.reason.includes("Duplicate variable name"), true);
      assertEquals(result.error.reason.includes("first occurrence at index 0"), true);
    }
  }
});

Deno.test("1_behavior: createOrError combines multiple validation options", () => {
  const var1 = StandardVariable.create("input_text_file", "/path");
  const var2 = StandardVariable.create("destination_path", "/output");
  const var3 = FilePathVariable.create("schema_file", "/schema");

  if (!var1.ok || !var2.ok || !var3.ok) {
    throw new Error("Failed to create test variables");
  }

  const variables = [var1.data, var2.data, var3.data];

  // Should pass all validations
  const result1 = PromptVariablesVO.createOrError(variables, {
    requireNonEmpty: true,
    maxVariables: 5,
    allowDuplicates: false,
  });
  assertEquals(result1.ok, true);

  // Should fail maxVariables
  const result2 = PromptVariablesVO.createOrError(variables, {
    requireNonEmpty: true,
    maxVariables: 2,
    allowDuplicates: false,
  });
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "InvalidInput");
    if (result2.error.kind === "InvalidInput") {
      assertEquals(result2.error.reason.includes("exceeds maximum"), true);
    }
  }
});

Deno.test("1_behavior: createOrError detects duplicates across different variable types", () => {
  // UserVariable with "uv-input_text_file" will create "input_text_file" in the record
  const standardVar = StandardVariable.create("input_text_file", "/standard");
  const userVar = UserVariable.create("uv-input_text_file", "/user");

  if (!standardVar.ok || !userVar.ok) {
    throw new Error("Failed to create test variables");
  }

  const result = PromptVariablesVO.createOrError(
    [standardVar.data, userVar.data],
    { allowDuplicates: false },
  );

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidInput");
    if (result.error.kind === "InvalidInput") {
      assertEquals(result.error.value, "input_text_file");
      assertEquals(result.error.reason.includes("Duplicate"), true);
    }
  }
});

Deno.test("1_behavior: createOrError provides detailed error context", () => {
  const result = PromptVariablesVO.createOrError(
    { notAnArray: true } as unknown as PromptVariable[],
    { requireNonEmpty: true },
  );

  assertEquals(result.ok, false);
  if (!result.ok) {
    // Verify error has proper structure
    assertExists(result.error);
    assertExists(result.error.kind);

    // Verify it's a ValidationError
    assertEquals(ErrorGuards.isValidationError(result.error), true);

    // Check specific error details
    if (result.error.kind === "InvalidFieldType") {
      assertExists(result.error.context);
      assertEquals(result.error.context.value, { notAnArray: true });
    }
  }
});

Deno.test("1_behavior: createOrError maintains backward compatibility with create", () => {
  const variables = createValidVariables();

  // Traditional create always succeeds
  const vo1 = PromptVariablesVO.create(variables);

  // createOrError with no options should produce same result
  const result = PromptVariablesVO.createOrError(variables);
  assertEquals(result.ok, true);

  if (result.ok) {
    const vo2 = result.data;

    // Should be functionally equivalent
    assertEquals(vo1.size(), vo2.size());
    assertEquals(vo1.toRecord(), vo2.toRecord());
    assertEquals(vo1.equals(vo2), true);
  }
});
