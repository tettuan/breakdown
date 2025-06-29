/**
 * Tests for PromptVariables types following Totality Principle
 * Updated to use Duck Typing instead of Discriminated Union
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  StandardVariable,
  FilePathVariable,
  StdinVariable,
  UserVariable,
  StandardVariableName,
  type PromptVariables,
  toPromptParamsVariables,
  createPromptParams
} from "../prompt_variables.ts";

Deno.test("StandardVariableName - valid names", () => {
  const inputTextFile = StandardVariableName.create("input_text_file");
  assertExists(inputTextFile);
  if (inputTextFile.ok) {
    assertEquals(inputTextFile.data.getValue(), "input_text_file");
  }

  const destinationPath = StandardVariableName.create("destination_path");
  assertExists(destinationPath);
  if (destinationPath.ok) {
    assertEquals(destinationPath.data.getValue(), "destination_path");
  }
});

Deno.test("StandardVariableName - invalid names", () => {
  const invalid = StandardVariableName.create("invalid_name");
  assertEquals(invalid.ok, false);
});

Deno.test("StandardVariable - creation and conversion", () => {
  const variable = StandardVariable.create("input_text_file", "/path/to/file.txt");
  assertExists(variable);
  
  if (variable.ok) {
    const record = variable.data.toRecord();
    assertEquals(record, { "input_text_file": "/path/to/file.txt" });
  }
});

Deno.test("toPromptParamsVariables - Duck Typing integration", () => {
  const standardVar = StandardVariable.create("input_text_file", "/path/to/input.txt");
  const filePathVar = FilePathVariable.create("schema_file", "/path/to/schema.json");
  const stdinVar = StdinVariable.create("input_text", "Hello world");
  const userVar = UserVariable.create("custom_option", "custom_value");

  if (!standardVar.ok || !filePathVar.ok || !stdinVar.ok || !userVar.ok) {
    throw new Error("Variable creation failed");
  }
  assertExists(stdinVar);
  assertExists(userVar);

  // Use the actual data from successful Results
  const variables: PromptVariables = [
    standardVar.data,
    filePathVar.data,
    stdinVar.data,
    userVar.data
  ];

  const result = toPromptParamsVariables(variables);
  
  assertEquals(result, {
    "input_text_file": "/path/to/input.txt",
    "schema_file": "/path/to/schema.json", 
    "input_text": "Hello world",
    "custom_option": "custom_value"
  });
});

Deno.test("createPromptParams - simplified interface", () => {
  const standardVar = StandardVariable.create("input_text_file", "/path/to/input.txt");
  const stdinVar = StdinVariable.create("input_text", "Sample input");
  
  if (!standardVar.ok || !stdinVar.ok) {
    throw new Error("Variable creation failed");
  }

  const variables: PromptVariables = [
    standardVar.data,
    stdinVar.data
  ];

  const promptParams = createPromptParams("/path/to/template.md", variables);
  
  assertEquals(promptParams, {
    template_file: "/path/to/template.md",
    variables: {
      "input_text_file": "/path/to/input.txt",
      "input_text": "Sample input"
    }
  });
});
