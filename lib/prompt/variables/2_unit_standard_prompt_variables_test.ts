/**
 * @fileoverview Unit tests for StandardPromptVariables
 *
 * This module tests the StandardPromptVariables class focusing on:
 * - Smart constructor validation
 * - Input parameter validation (empty strings, null, undefined)
 * - Additional _variables handling
 * - Immutability via "with" methods
 * - toRecord() method correctness
 * - Error handling for invalid inputs
 * - Getter methods functionality
 *
 * @module prompt/_variables/2_unit_standard_prompt_variables_test
 */

import { assertEquals } from "@std/assert";
import { StandardPromptVariables } from "./standard_prompt_variables.ts";

// Test helper to verify error messages for Result types
function assertErrorResult<T>(result: { ok: boolean; error?: any }, expectedMessage: string): void {
  assertEquals(result.ok, false, "Expected failed result");
  assertEquals(result.error?.message, expectedMessage);
}

// Helper to get data from result or throw
function getDataOrThrow<T>(result: { ok: boolean; data?: T; error?: any }): T {
  if (!result.ok) {
    throw new Error("Expected successful creation but got error");
  }
  return result.data!;
}

Deno.test("StandardPromptVariables - creates with valid parameters", () => {
  const variables1Result = StandardPromptVariables.create(
    "input.txt",
    "output.md",
  );

  if (!variables1Result.ok) {
    throw new Error("Expected successful creation");
  }
  const variables1 = variables1Result.data;

  assertEquals(variables1.getInputTextFile(), "input.txt");
  assertEquals(variables1.getDestinationPath(), "output.md");

  const record = variables1.toRecord();
  assertEquals(record.input_text_file, "input.txt");
  assertEquals(record.destination_path, "output.md");
  assertEquals(Object.keys(record).length, 2);
});

Deno.test("StandardPromptVariables - creates with additional _variables", () => {
  const additionalVars = {
    layer_type: "project",
    demonstrative_type: "to",
  };

  const variables2Result = StandardPromptVariables.create(
    "stdin",
    "stdout",
    additionalVars,
  );

  if (!variables2Result.ok) {
    throw new Error("Expected successful creation");
  }
  const variables2 = variables2Result.data;

  assertEquals(variables2.getInputTextFile(), "stdin");
  assertEquals(variables2.getDestinationPath(), "stdout");
  assertEquals(variables2.getAdditionalVariable("layer_type"), "project");
  assertEquals(variables2.getAdditionalVariable("demonstrative_type"), "to");
  assertEquals(variables2.getAdditionalVariable("non_existent"), undefined);

  const record = variables2.toRecord();
  assertEquals(record.input_text_file, "stdin");
  assertEquals(record.destination_path, "stdout");
  assertEquals(record.layer_type, "project");
  assertEquals(record.demonstrative_type, "to");
  assertEquals(Object.keys(record).length, 4);
});

Deno.test("StandardPromptVariables - trims whitespace from inputs", () => {
  const variables3Result = StandardPromptVariables.create(
    "  input.txt  ",
    "\toutput.md\n",
  );

  if (!variables3Result.ok) {
    throw new Error("Expected successful creation");
  }
  const variables3 = variables3Result.data;

  assertEquals(variables3.getInputTextFile(), "input.txt");
  assertEquals(variables3.getDestinationPath(), "output.md");
});

Deno.test("StandardPromptVariables - validates empty inputTextFile", () => {
  const emptyResult = StandardPromptVariables.create("", "output.md");
  assertErrorResult(emptyResult, "inputTextFile cannot be empty");

  const whitespaceResult = StandardPromptVariables.create("   ", "output.md");
  assertErrorResult(whitespaceResult, "inputTextFile cannot be empty");
});

Deno.test("StandardPromptVariables - validates empty destinationPath", () => {
  const emptyResult = StandardPromptVariables.create("input.txt", "");
  assertErrorResult(emptyResult, "destinationPath cannot be empty");

  const whitespaceResult = StandardPromptVariables.create("input.txt", "\t\n");
  assertErrorResult(whitespaceResult, "destinationPath cannot be empty");
});

Deno.test("StandardPromptVariables - validates additional variable keys", () => {
  const emptyKeyResult = StandardPromptVariables.create("input.txt", "output.md", {
    "": "value",
  });
  assertErrorResult(emptyKeyResult, "Variable key cannot be empty");

  const whitespaceKeyResult = StandardPromptVariables.create("input.txt", "output.md", {
    "   ": "value",
  });
  assertErrorResult(whitespaceKeyResult, "Variable key cannot be empty");
});

Deno.test("StandardPromptVariables - validates additional variable values", () => {
  const nullValueResult = StandardPromptVariables.create("input.txt", "output.md", {
    "key": null as any,
  });
  assertErrorResult(nullValueResult, "Variable value for 'key' cannot be null or undefined");

  const undefinedValueResult = StandardPromptVariables.create("input.txt", "output.md", {
    "key": undefined as any,
  });
  assertErrorResult(undefinedValueResult, "Variable value for 'key' cannot be null or undefined");
});

Deno.test("StandardPromptVariables - allows empty string as variable value", () => {
  const variables4Result = StandardPromptVariables.create("input.txt", "output.md", {
    "empty_value": "",
  });

  if (!variables4Result.ok) {
    throw new Error("Expected successful creation");
  }
  const variables4 = variables4Result.data;

  assertEquals(variables4.getAdditionalVariable("empty_value"), "");

  const record = variables4.toRecord();
  assertEquals(record.empty_value, "");
});

Deno.test("StandardPromptVariables - withAdditionalVariables creates new instance", () => {
  const originalResult = StandardPromptVariables.create(
    "input.txt",
    "output.md",
    { existing: "value" },
  );

  if (!originalResult.ok) {
    throw new Error("Expected successful creation");
  }
  const original = originalResult.data;

  const updatedResult = original.withAdditionalVariables({
    new_var: "new_value",
    another: "another_value",
  });

  if (!updatedResult.ok) {
    throw new Error("Expected successful update");
  }
  const updated = updatedResult.data;

  // Original should be unchanged
  assertEquals(original.getAdditionalVariable("new_var"), undefined);
  assertEquals(original.getAdditionalVariable("another"), undefined);

  // Updated should have all _variables
  assertEquals(updated.getAdditionalVariable("existing"), "value");
  assertEquals(updated.getAdditionalVariable("new_var"), "new_value");
  assertEquals(updated.getAdditionalVariable("another"), "another_value");

  // Core properties should remain the same
  assertEquals(updated.getInputTextFile(), "input.txt");
  assertEquals(updated.getDestinationPath(), "output.md");
});

Deno.test("StandardPromptVariables - withAdditionalVariables overwrites existing", () => {
  const originalResult = StandardPromptVariables.create(
    "input.txt",
    "output.md",
    { key: "original_value" },
  );

  if (!originalResult.ok) {
    throw new Error("Expected successful creation");
  }
  const original = originalResult.data;

  const updatedResult = original.withAdditionalVariables({
    key: "updated_value",
  });

  if (!updatedResult.ok) {
    throw new Error("Expected successful update");
  }
  const updated = updatedResult.data;

  assertEquals(original.getAdditionalVariable("key"), "original_value");
  assertEquals(updated.getAdditionalVariable("key"), "updated_value");
});

Deno.test("StandardPromptVariables - withInputTextFile creates new instance", () => {
  const originalResult = StandardPromptVariables.create(
    "input.txt",
    "output.md",
    { var: "value" },
  );

  if (!originalResult.ok) {
    throw new Error("Expected successful creation");
  }
  const original = originalResult.data;

  const updatedResult = original.withInputTextFile("new_input.txt");

  if (!updatedResult.ok) {
    throw new Error("Expected successful update");
  }
  const updated = updatedResult.data;

  // Original should be unchanged
  assertEquals(original.getInputTextFile(), "input.txt");

  // Updated should have new input file
  assertEquals(updated.getInputTextFile(), "new_input.txt");

  // Other properties should remain the same
  assertEquals(updated.getDestinationPath(), "output.md");
  assertEquals(updated.getAdditionalVariable("var"), "value");
});

Deno.test("StandardPromptVariables - withDestinationPath creates new instance", () => {
  const originalResult = StandardPromptVariables.create(
    "input.txt",
    "output.md",
    { var: "value" },
  );

  if (!originalResult.ok) {
    throw new Error("Expected successful creation");
  }
  const original = originalResult.data;

  const updatedResult = original.withDestinationPath("new_output.md");

  if (!updatedResult.ok) {
    throw new Error("Expected successful update");
  }
  const updated = updatedResult.data;

  // Original should be unchanged
  assertEquals(original.getDestinationPath(), "output.md");

  // Updated should have new destination
  assertEquals(updated.getDestinationPath(), "new_output.md");

  // Other properties should remain the same
  assertEquals(updated.getInputTextFile(), "input.txt");
  assertEquals(updated.getAdditionalVariable("var"), "value");
});

Deno.test("StandardPromptVariables - with methods validate input", () => {
  const variablesResult = StandardPromptVariables.create("input.txt", "output.md");
  if (!variablesResult.ok) throw new Error("Expected successful creation");
  const variables = variablesResult.data;

  const emptyInputResult = variables.withInputTextFile("");
  assertErrorResult(emptyInputResult, "inputTextFile cannot be empty");

  const emptyDestResult = variables.withDestinationPath("   ");
  assertErrorResult(emptyDestResult, "destinationPath cannot be empty");

  const emptyKeyResult = variables.withAdditionalVariables({ "": "value" });
  assertErrorResult(emptyKeyResult, "Variable key cannot be empty");

  const nullValueResult = variables.withAdditionalVariables({ "key": null as any });
  assertErrorResult(nullValueResult, "Variable value for 'key' cannot be null or undefined");
});

Deno.test("StandardPromptVariables - chain multiple with methods", () => {
  const originalResult = StandardPromptVariables.create("input.txt", "output.md");
  if (!originalResult.ok) throw new Error("Expected successful creation");
  const original = originalResult.data;

  const step1 = original.withInputTextFile("new_input.txt");
  if (!step1.ok) throw new Error("Expected successful step1");
  const step2 = step1.data.withDestinationPath("new_output.md");
  if (!step2.ok) throw new Error("Expected successful step2");
  const step3 = step2.data.withAdditionalVariables({ layer: "project" });
  if (!step3.ok) throw new Error("Expected successful step3");
  const updatedResult = step3.data.withAdditionalVariables({ directive: "to" });

  if (!updatedResult.ok) throw new Error("Expected successful update");
  const updated = updatedResult.data;

  assertEquals(updated.getInputTextFile(), "new_input.txt");
  assertEquals(updated.getDestinationPath(), "new_output.md");
  assertEquals(updated.getAdditionalVariable("layer"), "project");
  assertEquals(updated.getAdditionalVariable("directive"), "to");

  // Original should be unchanged
  assertEquals(original.getInputTextFile(), "input.txt");
  assertEquals(original.getDestinationPath(), "output.md");
  assertEquals(original.getAdditionalVariable("layer"), undefined);
});

Deno.test("StandardPromptVariables - toRecord includes all _variables", () => {
  const variables5Result = StandardPromptVariables.create(
    "data.csv",
    "report.pdf",
    {
      format: "csv",
      delimiter: ",",
      encoding: "utf-8",
    },
  );

  if (!variables5Result.ok) throw new Error("Expected successful creation");
  const variables5 = variables5Result.data;

  const record = variables5.toRecord();

  // Should include standard _variables
  assertEquals(record.input_text_file, "data.csv");
  assertEquals(record.destination_path, "report.pdf");

  // Should include additional _variables
  assertEquals(record.format, "csv");
  assertEquals(record.delimiter, ",");
  assertEquals(record.encoding, "utf-8");

  // Should have exactly 5 properties
  assertEquals(Object.keys(record).length, 5);
});

Deno.test("StandardPromptVariables - implements PromptVariables interface", () => {
  const variables6Result = StandardPromptVariables.create("input.txt", "output.md");

  if (!variables6Result.ok) throw new Error("Expected successful creation");
  const variables6 = variables6Result.data;

  // Check that toRecord returns proper type
  const record = variables6.toRecord();
  assertEquals(typeof record, "object");

  // All values should be strings
  for (const value of Object.values(record)) {
    assertEquals(typeof value, "string");
  }

  // Required keys should exist
  assertEquals("input_text_file" in record, true);
  assertEquals("destination_path" in record, true);
});

Deno.test("StandardPromptVariables - handles special characters in paths", () => {
  const variables7Result = StandardPromptVariables.create(
    "/path/with spaces/file.txt",
    "C:\\Windows\\Path\\With\\Backslashes.md",
  );

  if (!variables7Result.ok) {
    throw new Error("Expected successful creation");
  }
  const variables7 = variables7Result.data;

  assertEquals(variables7.getInputTextFile(), "/path/with spaces/file.txt");
  assertEquals(variables7.getDestinationPath(), "C:\\Windows\\Path\\With\\Backslashes.md");
});

Deno.test("StandardPromptVariables - handles Unicode in _variables", () => {
  const variables8Result = StandardPromptVariables.create(
    "入力.txt",
    "出力.md",
    {
      "日本語": "テスト",
      "emoji": "🎉",
    },
  );

  if (!variables8Result.ok) {
    throw new Error("Expected successful creation");
  }
  const variables8 = variables8Result.data;

  assertEquals(variables8.getInputTextFile(), "入力.txt");
  assertEquals(variables8.getDestinationPath(), "出力.md");
  assertEquals(variables8.getAdditionalVariable("日本語"), "テスト");
  assertEquals(variables8.getAdditionalVariable("emoji"), "🎉");
});

Deno.test("StandardPromptVariables - accepts string values only", () => {
  // Since StandardPromptVariables expects Record<string, string>,
  // we should pass strings explicitly
  const variables9Result = StandardPromptVariables.create(
    "input.txt",
    "output.md",
    {
      count: "42",
      ratio: "3.14",
      flag: "true",
    },
  );

  if (!variables9Result.ok) {
    throw new Error("Expected successful creation");
  }
  const variables9 = variables9Result.data;

  assertEquals(variables9.getAdditionalVariable("count"), "42");
  assertEquals(variables9.getAdditionalVariable("ratio"), "3.14");
  assertEquals(variables9.getAdditionalVariable("flag"), "true");
});
