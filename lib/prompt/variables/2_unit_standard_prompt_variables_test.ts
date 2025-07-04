/**
 * @fileoverview Unit tests for StandardPromptVariables
 *
 * This module tests the StandardPromptVariables class focusing on:
 * - Smart constructor validation
 * - Input parameter validation (empty strings, null, undefined)
 * - Additional variables handling
 * - Immutability via "with" methods
 * - toRecord() method correctness
 * - Error handling for invalid inputs
 * - Getter methods functionality
 *
 * @module prompt/variables/2_unit_standard_prompt_variables_test
 */

import { assertEquals, assertThrows } from "@std/assert";
import { StandardPromptVariables } from "./standard_prompt_variables.ts";

// Test helper to verify error messages
function assertErrorMessage(fn: () => void, expectedMessage: string): void {
  const error = assertThrows(fn, Error, expectedMessage);
  assertEquals(error.message, expectedMessage);
}

// Helper to get data from result or throw
function getDataOrThrow<T>(result: { ok: boolean; data?: T; error?: any }): T {
  if (!result.ok) {
    throw new Error("Expected successful creation but got error");
  }
  return result.data!;
}

Deno.test("StandardPromptVariables - creates with valid parameters", () => {
  const varsResult = StandardPromptVariables.create(
    "input.txt",
    "output.md",
  );

  if (!varsResult.ok) {
    throw new Error("Expected successful creation");
  }
  const vars = varsResult.data;

  assertEquals(vars.getInputTextFile(), "input.txt");
  assertEquals(vars.getDestinationPath(), "output.md");

  const record = vars.toRecord();
  assertEquals(record.input_text_file, "input.txt");
  assertEquals(record.destination_path, "output.md");
  assertEquals(Object.keys(record).length, 2);
});

Deno.test("StandardPromptVariables - creates with additional variables", () => {
  const additionalVars = {
    layer_type: "project",
    demonstrative_type: "to",
  };

  const varsResult = StandardPromptVariables.create(
    "stdin",
    "stdout",
    additionalVars,
  );

  if (!varsResult.ok) {
    throw new Error("Expected successful creation");
  }
  const vars = varsResult.data;

  assertEquals(vars.getInputTextFile(), "stdin");
  assertEquals(vars.getDestinationPath(), "stdout");
  assertEquals(vars.getAdditionalVariable("layer_type"), "project");
  assertEquals(vars.getAdditionalVariable("demonstrative_type"), "to");
  assertEquals(vars.getAdditionalVariable("non_existent"), undefined);

  const record = vars.toRecord();
  assertEquals(record.input_text_file, "stdin");
  assertEquals(record.destination_path, "stdout");
  assertEquals(record.layer_type, "project");
  assertEquals(record.demonstrative_type, "to");
  assertEquals(Object.keys(record).length, 4);
});

Deno.test("StandardPromptVariables - trims whitespace from inputs", () => {
  const varsResult = StandardPromptVariables.create(
    "  input.txt  ",
    "\toutput.md\n",
  );

  assertEquals(vars.getInputTextFile(), "input.txt");
  assertEquals(vars.getDestinationPath(), "output.md");
});

Deno.test("StandardPromptVariables - validates empty inputTextFile", () => {
  assertErrorMessage(
    () => StandardPromptVariables.create("", "output.md"),
    "inputTextFile cannot be empty",
  );

  assertErrorMessage(
    () => StandardPromptVariables.create("   ", "output.md"),
    "inputTextFile cannot be empty",
  );
});

Deno.test("StandardPromptVariables - validates empty destinationPath", () => {
  assertErrorMessage(
    () => StandardPromptVariables.create("input.txt", ""),
    "destinationPath cannot be empty",
  );

  assertErrorMessage(
    () => StandardPromptVariables.create("input.txt", "\t\n"),
    "destinationPath cannot be empty",
  );
});

Deno.test("StandardPromptVariables - validates additional variable keys", () => {
  assertErrorMessage(
    () =>
      StandardPromptVariables.create("input.txt", "output.md", {
        "": "value",
      }),
    "Variable key cannot be empty",
  );

  assertErrorMessage(
    () =>
      StandardPromptVariables.create("input.txt", "output.md", {
        "   ": "value",
      }),
    "Variable key cannot be empty",
  );
});

Deno.test("StandardPromptVariables - validates additional variable values", () => {
  assertErrorMessage(
    () =>
      StandardPromptVariables.create("input.txt", "output.md", {
        "key": null as any,
      }),
    "Variable value for 'key' cannot be null or undefined",
  );

  assertErrorMessage(
    () =>
      StandardPromptVariables.create("input.txt", "output.md", {
        "key": undefined as any,
      }),
    "Variable value for 'key' cannot be null or undefined",
  );
});

Deno.test("StandardPromptVariables - allows empty string as variable value", () => {
  const varsResult = StandardPromptVariables.create("input.txt", "output.md", {
    "empty_value": "",
  });

  assertEquals(vars.getAdditionalVariable("empty_value"), "");

  const record = vars.toRecord();
  assertEquals(record.empty_value, "");
});

Deno.test("StandardPromptVariables - withAdditionalVariables creates new instance", () => {
  const originalResult = StandardPromptVariables.create(
    "input.txt",
    "output.md",
    { existing: "value" },
  );

  const updated = original.withAdditionalVariables({
    new_var: "new_value",
    another: "another_value",
  });

  // Original should be unchanged
  assertEquals(original.getAdditionalVariable("new_var"), undefined);
  assertEquals(original.getAdditionalVariable("another"), undefined);

  // Updated should have all variables
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

  const updated = original.withAdditionalVariables({
    key: "updated_value",
  });

  assertEquals(original.getAdditionalVariable("key"), "original_value");
  assertEquals(updated.getAdditionalVariable("key"), "updated_value");
});

Deno.test("StandardPromptVariables - withInputTextFile creates new instance", () => {
  const originalResult = StandardPromptVariables.create(
    "input.txt",
    "output.md",
    { var: "value" },
  );

  const updated = original.withInputTextFile("new_input.txt");

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

  const updated = original.withDestinationPath("new_output.md");

  // Original should be unchanged
  assertEquals(original.getDestinationPath(), "output.md");

  // Updated should have new destination
  assertEquals(updated.getDestinationPath(), "new_output.md");

  // Other properties should remain the same
  assertEquals(updated.getInputTextFile(), "input.txt");
  assertEquals(updated.getAdditionalVariable("var"), "value");
});

Deno.test("StandardPromptVariables - with methods validate input", () => {
  const varsResult = StandardPromptVariables.create("input.txt", "output.md");

  assertErrorMessage(
    () => vars.withInputTextFile(""),
    "inputTextFile cannot be empty",
  );

  assertErrorMessage(
    () => vars.withDestinationPath("   "),
    "destinationPath cannot be empty",
  );

  assertErrorMessage(
    () => vars.withAdditionalVariables({ "": "value" }),
    "Variable key cannot be empty",
  );

  assertErrorMessage(
    () => vars.withAdditionalVariables({ "key": null as any }),
    "Variable value for 'key' cannot be null or undefined",
  );
});

Deno.test("StandardPromptVariables - chain multiple with methods", () => {
  const originalResult = StandardPromptVariables.create("input.txt", "output.md");

  const updated = original
    .withInputTextFile("new_input.txt")
    .withDestinationPath("new_output.md")
    .withAdditionalVariables({ layer: "project" })
    .withAdditionalVariables({ directive: "to" });

  assertEquals(updated.getInputTextFile(), "new_input.txt");
  assertEquals(updated.getDestinationPath(), "new_output.md");
  assertEquals(updated.getAdditionalVariable("layer"), "project");
  assertEquals(updated.getAdditionalVariable("directive"), "to");

  // Original should be unchanged
  assertEquals(original.getInputTextFile(), "input.txt");
  assertEquals(original.getDestinationPath(), "output.md");
  assertEquals(original.getAdditionalVariable("layer"), undefined);
});

Deno.test("StandardPromptVariables - toRecord includes all variables", () => {
  const varsResult = StandardPromptVariables.create(
    "data.csv",
    "report.pdf",
    {
      format: "csv",
      delimiter: ",",
      encoding: "utf-8",
    },
  );

  const record = vars.toRecord();

  // Should include standard variables
  assertEquals(record.input_text_file, "data.csv");
  assertEquals(record.destination_path, "report.pdf");

  // Should include additional variables
  assertEquals(record.format, "csv");
  assertEquals(record.delimiter, ",");
  assertEquals(record.encoding, "utf-8");

  // Should have exactly 5 properties
  assertEquals(Object.keys(record).length, 5);
});

Deno.test("StandardPromptVariables - implements PromptVariables interface", () => {
  const varsResult = StandardPromptVariables.create("input.txt", "output.md");

  // Check that toRecord returns proper type
  const record = vars.toRecord();
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
  const varsResult = StandardPromptVariables.create(
    "/path/with spaces/file.txt",
    "C:\\Windows\\Path\\With\\Backslashes.md",
  );

  assertEquals(vars.getInputTextFile(), "/path/with spaces/file.txt");
  assertEquals(vars.getDestinationPath(), "C:\\Windows\\Path\\With\\Backslashes.md");
});

Deno.test("StandardPromptVariables - handles Unicode in variables", () => {
  const varsResult = StandardPromptVariables.create(
    "入力.txt",
    "出力.md",
    {
      "日本語": "テスト",
      "emoji": "🎉",
    },
  );

  assertEquals(vars.getInputTextFile(), "入力.txt");
  assertEquals(vars.getDestinationPath(), "出力.md");
  assertEquals(vars.getAdditionalVariable("日本語"), "テスト");
  assertEquals(vars.getAdditionalVariable("emoji"), "🎉");
});

Deno.test("StandardPromptVariables - accepts string values only", () => {
  // Since StandardPromptVariables expects Record<string, string>,
  // we should pass strings explicitly
  const varsResult = StandardPromptVariables.create(
    "input.txt",
    "output.md",
    {
      count: "42",
      ratio: "3.14",
      flag: "true",
    },
  );

  assertEquals(vars.getAdditionalVariable("count"), "42");
  assertEquals(vars.getAdditionalVariable("ratio"), "3.14");
  assertEquals(vars.getAdditionalVariable("flag"), "true");
});
