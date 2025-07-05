/**
 * @fileoverview Structure Test for Prompt Variables
 *
 * Tests the structural design and organization of prompt variables:
 * - Class hierarchy and inheritance patterns
 * - Method organization and responsibility separation
 * - Data encapsulation and immutability
 * - Interface consistency across types
 * - Smart constructor pattern implementation
 *
 * This test ensures the module follows the Totality principle by:
 * - Maintaining consistent structure across variable types
 * - Proper encapsulation of data and behavior
 * - Clear separation of concerns between types
 *
 * @module lib/types/1_structure_prompt_variables_test
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import {
  createPromptParams,
  FilePathVariable,
  FilePathVariableName,
  type PromptVariable,
  type PromptVariableBase,
  type PromptVariables,
  StandardVariable,
  StandardVariableName,
  StdinVariable,
  StdinVariableName,
  toPromptParamsVariables,
  UserVariable,
} from "../../../lib/types/prompt_variables.ts";

Deno.test("Structure: Variable classes follow consistent design pattern", () => {
  // All variable classes should follow the same structural pattern

  const _variables = [
    StandardVariable.create("input_text_file", "test.txt"),
    FilePathVariable.create("schema_file", "schema.json"),
    StdinVariable.create("input_text", "content"),
    UserVariable.create("custom", "value"),
  ];

  for (const result of _variables) {
    if (result.ok) {
      const variable = result.data;

      // Should have name property
      assertExists(variable.name);

      // Should have value property
      assertExists(variable.value);
      assertEquals(typeof variable.value, "string");

      // Should implement toRecord method
      assertEquals(typeof variable.toRecord, "function");

      // toRecord should return object with single key-value pair
      const record = variable.toRecord();
      assertEquals(typeof record, "object");
      assertEquals(Object.keys(record).length, 1);
    }
  }
});

Deno.test("Structure: Name classes maintain consistent structure", () => {
  // All name classes should follow the same pattern

  const nameClasses = [
    { create: StandardVariableName.create, validName: "input_text_file" },
    { create: FilePathVariableName.create, validName: "schema_file" },
    { create: StdinVariableName.create, validName: "input_text" },
  ];

  for (const nameClass of nameClasses) {
    const result = nameClass.create(nameClass.validName);
    if (result.ok) {
      const name = result.data;

      // Should have getValue method
      assertEquals(typeof name.getValue, "function");

      // getValue should return string
      assertEquals(typeof name.getValue(), "string");
      assertEquals(name.getValue(), nameClass.validName);

      // Should have readonly value property
      assertExists(name.value);
      assertEquals(name.value, nameClass.validName);
    }
  }
});

Deno.test("Structure: Smart constructors prevent invalid states", () => {
  // All variable types should prevent creation of invalid instances

  // Test empty names (where applicable)
  const emptyNameResult = UserVariable.create("", "value");
  assertEquals(emptyNameResult.ok, false);

  // Test empty values for most variable types
  const emptyValueTests = [
    { result: StandardVariable.create("input_text_file", ""), shouldFail: true },
    { result: FilePathVariable.create("schema_file", ""), shouldFail: true },
    { result: StdinVariable.create("input_text", ""), shouldFail: true },
    { result: UserVariable.create("name", ""), shouldFail: false }, // UserVariable allows empty strings
  ];

  for (const test of emptyValueTests) {
    assertEquals(test.result.ok, !test.shouldFail, `Empty values handling should be consistent`);
  }

  // Test whitespace-only values
  const whitespaceTests = [
    { result: StandardVariable.create("input_text_file", "   "), shouldFail: true },
    { result: UserVariable.create("name", "   "), shouldFail: false }, // UserVariable allows whitespace
  ];

  for (const test of whitespaceTests) {
    assertEquals(
      test.result.ok,
      !test.shouldFail,
      "Whitespace-only values handling should be consistent",
    );
  }
});

Deno.test("Structure: Variable encapsulation prevents mutation", () => {
  // Variables should be immutable after creation

  const result = StandardVariable.create("input_text_file", "original");
  if (result.ok) {
    const variable = result.data;
    const originalValue = variable.value;
    const originalNameValue = variable.name.getValue();

    // Attempting to modify should not be possible (TypeScript prevents this)
    // But the structure should ensure immutability

    // Verify values remain unchanged
    assertEquals(variable.value, originalValue);
    assertEquals(variable.name.getValue(), originalNameValue);

    // toRecord should return new object each time
    const record1 = variable.toRecord();
    const record2 = variable.toRecord();

    assertEquals(JSON.stringify(record1), JSON.stringify(record2));
    // They should not be the same object reference
    record1.modified = "test";
    assertEquals(record2.modified, undefined);
  }
});

Deno.test("Structure: Duck typing interface consistency", () => {
  // All variables should implement PromptVariableBase consistently

  const variables: PromptVariable[] = [];

  const standardResult = StandardVariable.create("input_text_file", "file.txt");
  if (standardResult.ok) variables.push(standardResult.data);

  const fileResult = FilePathVariable.create("schema_file", "schema.json");
  if (fileResult.ok) variables.push(fileResult.data);

  const stdinResult = StdinVariable.create("input_text", "content");
  if (stdinResult.ok) variables.push(stdinResult.data);

  const userResult = UserVariable.create("custom", "value");
  if (userResult.ok) variables.push(userResult.data);

  for (const variable of variables) {
    // Should satisfy PromptVariableBase interface
    const base: PromptVariableBase = variable;
    assertExists(base.toRecord);

    // toRecord should work consistently
    const record = base.toRecord();
    assertEquals(typeof record, "object");
    assertExists(Object.keys(record)[0]);
    assertExists(Object.values(record)[0]);
  }
});

Deno.test("Structure: Name validation maintains type safety", () => {
  // Name classes should enforce their specific valid names

  // StandardVariableName validation
  const stdValid = ["input_text_file", "destination_path"];
  const stdInvalid = ["invalid", "schema_file", "input_text"];

  for (const name of stdValid) {
    const result = StandardVariableName.create(name);
    assertEquals(result.ok, true, `${name} should be valid for StandardVariableName`);
  }

  for (const name of stdInvalid) {
    const result = StandardVariableName.create(name);
    assertEquals(result.ok, false, `${name} should be invalid for StandardVariableName`);
  }

  // FilePathVariableName validation
  const fileValid = ["schema_file"];
  const fileInvalid = ["input_text_file", "destination_path", "input_text"];

  for (const name of fileValid) {
    const result = FilePathVariableName.create(name);
    assertEquals(result.ok, true, `${name} should be valid for FilePathVariableName`);
  }

  for (const name of fileInvalid) {
    const result = FilePathVariableName.create(name);
    assertEquals(result.ok, false, `${name} should be invalid for FilePathVariableName`);
  }

  // StdinVariableName validation
  const stdinValid = ["input_text"];
  const stdinInvalid = ["input_text_file", "destination_path", "schema_file"];

  for (const name of stdinValid) {
    const result = StdinVariableName.create(name);
    assertEquals(result.ok, true, `${name} should be valid for StdinVariableName`);
  }

  for (const name of stdinInvalid) {
    const result = StdinVariableName.create(name);
    assertEquals(result.ok, false, `${name} should be invalid for StdinVariableName`);
  }
});

Deno.test("Structure: Integration functions maintain separation", () => {
  // Utility functions should be separate from core types

  // toPromptParamsVariables should be pure function
  const var1 = StandardVariable.create("input_text_file", "test.txt");
  const var2 = UserVariable.create("custom", "value");

  if (var1.ok && var2.ok) {
    const variables: PromptVariables = [var1.data, var2.data];

    // Should work with empty array
    const emptyResult = toPromptParamsVariables([]);
    assertEquals(Object.keys(emptyResult).length, 0);

    // Should work with multiple variables
    const result = toPromptParamsVariables(variables);
    assertEquals(Object.keys(result).length, 2);
    assertEquals(result["input_text_file"], "test.txt");
    assertEquals(result["custom"], "value");

    // Should not modify input array
    assertEquals(variables.length, 2);
  }

  // createPromptParams should be pure function
  if (var1.ok) {
    const params = createPromptParams("template.md", [var1.data]);

    assertEquals(params.template_file, "template.md");
    assertEquals(Object.keys(params.variables).length, 1);
    assertEquals(params.variables["input_text_file"], "test.txt");

    // Should work with empty variables
    const emptyParams = createPromptParams("empty.md", []);
    assertEquals(emptyParams.template_file, "empty.md");
    assertEquals(Object.keys(emptyParams.variables).length, 0);
  }
});

Deno.test("Structure: Error handling maintains consistency", () => {
  // All error results should follow the same structure

  const errorTests = [
    StandardVariable.create("invalid", "value"),
    FilePathVariable.create("invalid", "value"),
    StdinVariable.create("invalid", "value"),
    UserVariable.create("", "value"),
    StandardVariable.create("input_text_file", ""),
  ];

  for (const result of errorTests) {
    assertEquals(result.ok, false);
    if (!result.ok) {
      // Error should have kind discriminator
      assertExists(result.error.kind);
      assertEquals(typeof result.error.kind, "string");

      // Error should have additional context based on kind
      switch (result.error.kind) {
        case "InvalidName":
          assertExists(result.error.name);
          assertExists(result.error.validNames);
          assertEquals(Array.isArray(result.error.validNames), true);
          break;
        case "EmptyValue":
          assertExists(result.error.variableName);
          assertExists(result.error.reason);
          break;
      }
    }
  }
});

Deno.test("Structure: Variable composition works correctly", () => {
  // Variables should compose well into collections

  const results = [
    StandardVariable.create("input_text_file", "input.txt"),
    StandardVariable.create("destination_path", "output.txt"),
    FilePathVariable.create("schema_file", "schema.json"),
    StdinVariable.create("input_text", "content"),
    UserVariable.create("custom1", "value1"),
    UserVariable.create("custom2", "value2"),
  ];

  const variables: PromptVariables = [];
  for (const result of results) {
    if (result.ok) {
      variables.push(result.data);
    }
  }

  assertEquals(variables.length, 6);

  // Should convert to unified record
  const unified = toPromptParamsVariables(variables);
  assertEquals(Object.keys(unified).length, 6);

  // Should maintain all values
  assertEquals(unified["input_text_file"], "input.txt");
  assertEquals(unified["destination_path"], "output.txt");
  assertEquals(unified["schema_file"], "schema.json");
  assertEquals(unified["input_text"], "content");
  assertEquals(unified["custom1"], "value1");
  assertEquals(unified["custom2"], "value2");
});

Deno.test("Structure: Type system prevents invalid combinations", () => {
  // The type system should prevent creating invalid combinations

  // StandardVariable should only accept valid standard names
  const standardInvalid = StandardVariable.create("custom_name", "value");
  assertEquals(standardInvalid.ok, false);

  // FilePathVariable should only accept valid file path names
  const fileInvalid = FilePathVariable.create("input_text", "value");
  assertEquals(fileInvalid.ok, false);

  // StdinVariable should only accept valid stdin names
  const stdinInvalid = StdinVariable.create("destination_path", "value");
  assertEquals(stdinInvalid.ok, false);

  // UserVariable should accept any non-empty name
  const userValid = UserVariable.create("any_name_works", "value");
  assertEquals(userValid.ok, true);
});
