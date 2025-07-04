/**
 * @fileoverview Unit Test for Prompt Variables
 *
 * Tests individual function behavior and edge cases for prompt variables:
 * - Variable creation and validation logic
 * - Value handling and edge cases
 * - Name validation specifics
 * - Integration function behavior
 * - Error conditions and messages
 *
 * This test ensures the module follows the Totality principle by:
 * - Testing all possible input combinations
 * - Verifying correct error handling
 * - Ensuring expected behavior for all functions
 *
 * @module lib/types/2_unit_prompt_variables_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  createPromptParams,
  FilePathVariable,
  FilePathVariableName,
  type PromptVariables,
  StandardVariable,
  StandardVariableName,
  StdinVariable,
  StdinVariableName,
  toPromptParamsVariables,
  UserVariable,
} from "./prompt_variables.ts";

Deno.test("Unit: StandardVariable creation and validation", () => {
  // Valid standard variable names
  const validCases = [
    { name: "input_text_file", value: "test.txt" },
    { name: "destination_path", value: "/path/to/output" },
    { name: "input_text_file", value: "very long file path with spaces.txt" },
    { name: "destination_path", value: "stdout" },
  ];

  for (const testCase of validCases) {
    const result = StandardVariable.create(testCase.name, testCase.value);
    assertEquals(result.ok, true, `Should create StandardVariable with ${testCase.name}`);

    if (result.ok) {
      assertEquals(result.data.name.getValue(), testCase.name);
      assertEquals(result.data.value, testCase.value);

      const record = result.data.toRecord();
      assertEquals(record[testCase.name], testCase.value);
    }
  }

  // Invalid standard variable names
  const invalidNames = ["invalid", "custom", "schema_file", "input_text", ""];

  for (const name of invalidNames) {
    const result = StandardVariable.create(name, "value");
    assertEquals(result.ok, false, `Should reject invalid name: ${name}`);

    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidName");
      if (result.error.kind === "InvalidName") {
        assertEquals(result.error.name, name);
        assertExists(result.error.validNames);
      }
    }
  }

  // Invalid values
  const invalidValues = ["", "   ", "\t", "\n"];

  for (const value of invalidValues) {
    const result = StandardVariable.create("input_text_file", value);
    assertEquals(result.ok, false, `Should reject empty/whitespace value: "${value}"`);

    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyValue");
    }
  }
});

Deno.test("Unit: FilePathVariable creation and validation", () => {
  // Valid file path variable
  const validCases = [
    { name: "schema_file", value: "schema.json" },
    { name: "schema_file", value: "/absolute/path/schema.json" },
    { name: "schema_file", value: "./relative/schema.json" },
    { name: "schema_file", value: "schema with spaces.json" },
  ];

  for (const testCase of validCases) {
    const result = FilePathVariable.create(testCase.name, testCase.value);
    assertEquals(result.ok, true, `Should create FilePathVariable with ${testCase.value}`);

    if (result.ok) {
      assertEquals(result.data.name.getValue(), testCase.name);
      assertEquals(result.data.value, testCase.value);

      const record = result.data.toRecord();
      assertEquals(record[testCase.name], testCase.value);
    }
  }

  // Invalid names
  const invalidNames = ["input_text_file", "destination_path", "input_text", "custom"];

  for (const name of invalidNames) {
    const result = FilePathVariable.create(name, "value");
    assertEquals(result.ok, false, `Should reject invalid name: ${name}`);
  }

  // Invalid values
  const invalidValues = ["", "   "];

  for (const value of invalidValues) {
    const result = FilePathVariable.create("schema_file", value);
    assertEquals(result.ok, false, `Should reject empty value: "${value}"`);
  }
});

Deno.test("Unit: StdinVariable creation and validation", () => {
  // Valid stdin variable
  const validCases = [
    { name: "input_text", value: "Simple text content" },
    { name: "input_text", value: "Multi\nline\ncontent" },
    { name: "input_text", value: "Content with special chars: !@#$%^&*()" },
    { name: "input_text", value: "Very long content that could come from stdin input" },
  ];

  for (const testCase of validCases) {
    const result = StdinVariable.create(testCase.name, testCase.value);
    assertEquals(result.ok, true, `Should create StdinVariable`);

    if (result.ok) {
      assertEquals(result.data.name.getValue(), testCase.name);
      assertEquals(result.data.value, testCase.value);

      const record = result.data.toRecord();
      assertEquals(record[testCase.name], testCase.value);
    }
  }

  // Invalid names
  const invalidNames = ["input_text_file", "destination_path", "schema_file"];

  for (const name of invalidNames) {
    const result = StdinVariable.create(name, "value");
    assertEquals(result.ok, false, `Should reject invalid name: ${name}`);
  }

  // Invalid values
  const result = StdinVariable.create("input_text", "");
  assertEquals(result.ok, false, "Should reject empty content");
});

Deno.test("Unit: UserVariable creation and validation", () => {
  // Valid user variables
  const validCases = [
    { name: "custom_var", value: "custom_value" },
    { name: "uv-project", value: "my-project" },
    { name: "uv-version", value: "1.0.0" },
    { name: "any123_name-works", value: "any value works" },
    { name: "a", value: "b" }, // Minimal case
  ];

  for (const testCase of validCases) {
    const result = UserVariable.create(testCase.name, testCase.value);
    assertEquals(result.ok, true, `Should create UserVariable with name: ${testCase.name}`);

    if (result.ok) {
      assertEquals(result.data.name, testCase.name);
      assertEquals(result.data.value, testCase.value);

      const record = result.data.toRecord();
      // UserVariable strips uv- prefix in toRecord()
      const expectedKey = testCase.name.startsWith("uv-")
        ? testCase.name.substring(3)
        : testCase.name;
      assertEquals(record[expectedKey], testCase.value);
    }
  }

  // Invalid names
  const invalidNames = ["", "   ", "\t"];

  for (const name of invalidNames) {
    const result = UserVariable.create(name, "value");
    assertEquals(result.ok, false, `Should reject empty/whitespace name: "${name}"`);

    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyValue");
    }
  }

  // UserVariable allows empty/whitespace values (CLI requirement)
  const validEmptyValues = ["", "   ", "\t"];

  for (const value of validEmptyValues) {
    const result = UserVariable.create("test_name", value);
    assertEquals(result.ok, true, `Should accept empty/whitespace value: "${value}"`);

    if (result.ok) {
      assertEquals(result.data.value, value);
    }
  }
});

Deno.test("Unit: Variable name classes behavior", () => {
  // StandardVariableName
  const stdNames = ["input_text_file", "destination_path"];
  for (const name of stdNames) {
    const result = StandardVariableName.create(name);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.getValue(), name);
      assertEquals(result.data.value, name);
    }
  }

  // FilePathVariableName
  const fileNames = ["schema_file"];
  for (const name of fileNames) {
    const result = FilePathVariableName.create(name);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.getValue(), name);
      assertEquals(result.data.value, name);
    }
  }

  // StdinVariableName
  const stdinNames = ["input_text"];
  for (const name of stdinNames) {
    const result = StdinVariableName.create(name);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.getValue(), name);
      assertEquals(result.data.value, name);
    }
  }
});

Deno.test("Unit: toPromptParamsVariables function", () => {
  // Empty array
  const emptyResult = toPromptParamsVariables([]);
  assertEquals(Object.keys(emptyResult).length, 0);

  // Single variable
  const singleVar = StandardVariable.create("input_text_file", "test.txt");
  if (singleVar.ok) {
    const singleResult = toPromptParamsVariables([singleVar.data]);
    assertEquals(Object.keys(singleResult).length, 1);
    assertEquals(singleResult["input_text_file"], "test.txt");
  }

  // Multiple variables
  const vars = [
    StandardVariable.create("input_text_file", "input.txt"),
    StandardVariable.create("destination_path", "output.txt"),
    FilePathVariable.create("schema_file", "schema.json"),
    StdinVariable.create("input_text", "content"),
    UserVariable.create("custom1", "value1"),
    UserVariable.create("custom2", "value2"),
  ];

  const validVars: PromptVariables = [];
  for (const varResult of vars) {
    if (varResult.ok) {
      validVars.push(varResult.data);
    }
  }

  const result = toPromptParamsVariables(validVars);
  assertEquals(Object.keys(result).length, 6);
  assertEquals(result["input_text_file"], "input.txt");
  assertEquals(result["destination_path"], "output.txt");
  assertEquals(result["schema_file"], "schema.json");
  assertEquals(result["input_text"], "content");
  assertEquals(result["custom1"], "value1");
  assertEquals(result["custom2"], "value2");

  // Variable order should not matter - compare keys and values separately
  const reversed = [...validVars].reverse();
  const reversedResult = toPromptParamsVariables(reversed);

  // Both should have same keys and values
  assertEquals(Object.keys(result).length, Object.keys(reversedResult).length);
  for (const key of Object.keys(result)) {
    assertEquals(result[key], reversedResult[key], `Value for key ${key} should match`);
  }
});

Deno.test("Unit: createPromptParams function", () => {
  // With empty variables
  const emptyParams = createPromptParams("template.md", []);
  assertEquals(emptyParams.template_file, "template.md");
  assertEquals(Object.keys(emptyParams.variables).length, 0);

  // With single variable
  const singleVar = UserVariable.create("test", "value");
  if (singleVar.ok) {
    const params = createPromptParams("single.md", [singleVar.data]);
    assertEquals(params.template_file, "single.md");
    assertEquals(Object.keys(params.variables).length, 1);
    assertEquals(params.variables["test"], "value");
  }

  // With multiple variables
  const vars = [
    StandardVariable.create("input_text_file", "input.txt"),
    UserVariable.create("project", "my-project"),
  ];

  const validVars: PromptVariables = [];
  for (const varResult of vars) {
    if (varResult.ok) {
      validVars.push(varResult.data);
    }
  }

  const multiParams = createPromptParams("multi.md", validVars);
  assertEquals(multiParams.template_file, "multi.md");
  assertEquals(Object.keys(multiParams.variables).length, 2);
  assertEquals(multiParams.variables["input_text_file"], "input.txt");
  assertEquals(multiParams.variables["project"], "my-project");

  // Template file path variations
  const pathVariations = [
    "template.md",
    "/absolute/path/template.md",
    "./relative/template.md",
    "template with spaces.md",
  ];

  for (const path of pathVariations) {
    const params = createPromptParams(path, []);
    assertEquals(params.template_file, path);
  }
});

Deno.test("Unit: Edge cases and special characters", () => {
  // Special characters in values
  const specialChars = [
    "value with spaces",
    "value\nwith\nnewlines",
    "value\twith\ttabs",
    "value with unicode: 日本語",
    'value with "quotes"',
    "value with 'apostrophes'",
    "value with symbols: !@#$%^&*()",
  ];

  for (const value of specialChars) {
    const userResult = UserVariable.create("test", value);
    assertEquals(userResult.ok, true, `Should handle special chars: ${value}`);

    if (userResult.ok) {
      assertEquals(userResult.data.value, value);
      const record = userResult.data.toRecord();
      assertEquals(record["test"], value);
    }
  }

  // Unicode in names (UserVariable)
  const unicodeNames = ["日本語", "español", "français"];
  for (const name of unicodeNames) {
    const result = UserVariable.create(name, "value");
    assertEquals(result.ok, true, `Should handle unicode name: ${name}`);
  }

  // Very long values
  const longValue = "a".repeat(10000);
  const longResult = UserVariable.create("long", longValue);
  assertEquals(longResult.ok, true);
  if (longResult.ok) {
    assertEquals(longResult.data.value.length, 10000);
  }
});

Deno.test("Unit: Variable name trimming behavior", () => {
  // UserVariable should trim names
  const userResult = UserVariable.create("  trimmed  ", "value");
  assertEquals(userResult.ok, true);
  if (userResult.ok) {
    assertEquals(userResult.data.name, "trimmed");
  }

  // But empty after trimming should fail
  const emptyTrimResult = UserVariable.create("   ", "value");
  assertEquals(emptyTrimResult.ok, false);
});

Deno.test("Unit: Duplicate variable handling in collections", () => {
  // Multiple variables with same name should be handled
  const var1 = UserVariable.create("same_name", "value1");
  const var2 = UserVariable.create("same_name", "value2");

  if (var1.ok && var2.ok) {
    const variables: PromptVariables = [var1.data, var2.data];
    const result = toPromptParamsVariables(variables);

    // Later variable should overwrite earlier one
    assertEquals(Object.keys(result).length, 1);
    assertEquals(result["same_name"], "value2");
  }
});

Deno.test("Unit: Error message content validation", () => {
  // Invalid name errors should contain helpful information
  const invalidNameResult = StandardVariableName.create("invalid");
  assertEquals(invalidNameResult.ok, false);

  if (!invalidNameResult.ok && invalidNameResult.error.kind === "InvalidName") {
    assertEquals(invalidNameResult.error.name, "invalid");
    assertExists(invalidNameResult.error.validNames);
    assertEquals(invalidNameResult.error.validNames.length > 0, true);
    assertEquals(invalidNameResult.error.validNames.includes("input_text_file"), true);
  }

  // Empty value errors should contain helpful information
  const emptyValueResult = StandardVariable.create("input_text_file", "");
  assertEquals(emptyValueResult.ok, false);

  if (!emptyValueResult.ok && emptyValueResult.error.kind === "EmptyValue") {
    assertEquals(emptyValueResult.error.variableName, "input_text_file");
    assertExists(emptyValueResult.error.reason);
    assertEquals(typeof emptyValueResult.error.reason, "string");
  }
});
