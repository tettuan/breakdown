/**
 * @fileoverview Variables Builder Test Suite
 *
 * Implements comprehensive test cases from an environment preparation perspective.
 * Verifies the normal operation of the Variable.create() method and
 * validates the Smart Constructor pattern behavior based on the Totality Principle.
 *
 * @module builder/variables_builder_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import { type FactoryResolvedValues, VariablesBuilder } from "./variables_builder.ts";
import {
  FilePathVariable,
  StandardVariable,
  StdinVariable,
  UserVariable,
} from "../types/prompt_variables_vo.ts";

// Test environment configuration
Deno.env.set("TEST_MODE", "true");

/**
 * 0_architecture test group - Architecture constraint tests
 * Verifies that the system foundation is correctly built
 */

Deno.test("0_architecture: VariablesBuilder instance creation", () => {
  const builder = new VariablesBuilder();
  assertExists(builder);
  assertEquals(builder.getVariableCount(), 0);
  assertEquals(builder.getErrorCount(), 0);
});

Deno.test("0_architecture: Builder pattern fluent interface", () => {
  const builder = new VariablesBuilder();
  const result = builder
    .addStandardVariable("input_text_file", "test.txt")
    .addFilePathVariable("schema_file", "schema.json");

  assertEquals(result, builder); // Fluent interface verification
  assertEquals(builder.getVariableCount(), 2);
});

Deno.test("0_architecture: Smart Constructor pattern validation - StandardVariable", () => {
  const result = StandardVariable.create("input_text_file", "test.txt");
  assertEquals(result.ok, true);

  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(record["input_text_file"], "test.txt");
  }
});

/**
 * 1_behavior test group - Behavior verification tests
 * Verifies that basic functionality operates correctly
 */

Deno.test("1_behavior: StandardVariable.create() - normal cases", () => {
  // Normal input_text_file variable
  const result1 = StandardVariable.create("input_text_file", "sample.txt");
  assertEquals(result1.ok, true);
  if (result1.ok) {
    assertEquals(result1.data.toRecord()["input_text_file"], "sample.txt");
  }

  // Normal destination_path variable
  const result2 = StandardVariable.create("destination_path", "/output/result.md");
  assertEquals(result2.ok, true);
  if (result2.ok) {
    assertEquals(result2.data.toRecord()["destination_path"], "/output/result.md");
  }
});

Deno.test("1_behavior: FilePathVariable.create() - normal cases", () => {
  const result = FilePathVariable.create("schema_file", "/path/to/schema.json");
  assertEquals(result.ok, true);

  if (result.ok) {
    assertEquals(result.data.toRecord()["schema_file"], "/path/to/schema.json");
    assertEquals(result.data.value, "/path/to/schema.json");
  }
});

Deno.test("1_behavior: StdinVariable.create() - normal cases", () => {
  const result = StdinVariable.create("input_text", "Sample stdin content");
  assertEquals(result.ok, true);

  if (result.ok) {
    assertEquals(result.data.toRecord()["input_text"], "Sample stdin content");
  }
});

Deno.test("1_behavior: UserVariable.create() - normal cases", () => {
  const result = UserVariable.create("uv-custom", "custom value");
  assertEquals(result.ok, true);

  if (result.ok) {
    assertEquals(result.data.toRecord()["uv-custom"], "custom value");
  }
});

Deno.test("1_behavior: VariablesBuilder.addStandardVariable() - success cases", () => {
  const builder = new VariablesBuilder();

  builder.addStandardVariable("input_text_file", "test.txt");
  assertEquals(builder.getVariableCount(), 1);
  assertEquals(builder.getErrorCount(), 0);

  builder.addStandardVariable("destination_path", "/output/result.md");
  assertEquals(builder.getVariableCount(), 2);
  assertEquals(builder.getErrorCount(), 0);
});

Deno.test("1_behavior: VariablesBuilder.addFilePathVariable() - success case", () => {
  const builder = new VariablesBuilder();

  builder.addFilePathVariable("schema_file", "/path/to/schema.json");
  assertEquals(builder.getVariableCount(), 1);
  assertEquals(builder.getErrorCount(), 0);
});

Deno.test("1_behavior: VariablesBuilder.addStdinVariable() - success case", () => {
  const builder = new VariablesBuilder();

  builder.addStdinVariable("Sample stdin content");
  assertEquals(builder.getVariableCount(), 1);
  assertEquals(builder.getErrorCount(), 0);
});

Deno.test("1_behavior: VariablesBuilder.addUserVariable() - success case", () => {
  const builder = new VariablesBuilder();

  builder.addUserVariable("uv-custom", "custom value");
  assertEquals(builder.getVariableCount(), 1);
  assertEquals(builder.getErrorCount(), 0);
});

/**
 * 2_structure test group - Structure integrity tests
 * Verifies data structure integrity
 */

Deno.test("2_structure: Variable.create() - empty value handling", () => {
  // StandardVariable - empty string allowed
  const std = StandardVariable.create("input_text_file", "");
  assertEquals(std.ok, true);
  if (std.ok) {
    assertEquals(std.data.toRecord()["input_text_file"], "");
  }

  // FilePathVariable - empty string allowed
  const file = FilePathVariable.create("schema_file", "");
  assertEquals(file.ok, true);
  if (file.ok) {
    assertEquals(file.data.toRecord()["schema_file"], "");
  }

  // StdinVariable - empty string allowed
  const stdin = StdinVariable.create("input_text", "");
  assertEquals(stdin.ok, true);
  if (stdin.ok) {
    assertEquals(stdin.data.toRecord()["input_text"], "");
  }

  // UserVariable - empty string allowed
  const user = UserVariable.create("uv-custom", "");
  assertEquals(user.ok, true);
  if (user.ok) {
    assertEquals(user.data.toRecord()["uv-custom"], "");
  }
});

Deno.test("2_structure: Variable.create() - empty key validation", () => {
  // Empty key is an error for all variable types
  const stdResult = StandardVariable.create("", "value");
  assertEquals(stdResult.ok, false);

  const fileResult = FilePathVariable.create("", "value");
  assertEquals(fileResult.ok, false);

  const stdinResult = StdinVariable.create("", "value");
  assertEquals(stdinResult.ok, false);

  const userResult = UserVariable.create("", "value");
  assertEquals(userResult.ok, false);
});

Deno.test("2_structure: Variable.create() - whitespace key validation", () => {
  // Whitespace-only key is an error for all variable types
  const stdResult = StandardVariable.create("  ", "value");
  assertEquals(stdResult.ok, false);

  const fileResult = FilePathVariable.create("  ", "value");
  assertEquals(fileResult.ok, false);

  const stdinResult = StdinVariable.create("  ", "value");
  assertEquals(stdinResult.ok, false);

  const userResult = UserVariable.create("  ", "value");
  assertEquals(userResult.ok, false);
});

/**
 * 3_core test group - Core functionality tests
 * Verifies domain integration functionality
 */

Deno.test("3_core: VariablesBuilder.build() - successful build", () => {
  const builder = new VariablesBuilder();

  builder
    .addStandardVariable("input_text_file", "test.txt")
    .addFilePathVariable("schema_file", "schema.json")
    .addStdinVariable("stdin content")
    .addUserVariable("uv-custom", "custom value");

  const result = builder.build();
  assertEquals(result.ok, true);

  if (result.ok) {
    assertEquals(result.data.size(), 4);
    assertEquals(result.data.isEmpty(), false);

    const record = result.data.toRecord();
    assertEquals(record["input_text_file"], "test.txt");
    assertEquals(record["schema_file"], "schema.json");
    assertEquals(record["input_text"], "stdin content");
    assertEquals(record["uv-custom"], "custom value");
  }
});

Deno.test("3_core: VariablesBuilder.toRecord() - variable collection conversion", () => {
  const builder = new VariablesBuilder();

  builder
    .addStandardVariable("input_text_file", "test.txt")
    .addFilePathVariable("schema_file", "schema.json");

  const record = builder.toRecord();
  assertEquals(record["input_text_file"], "test.txt");
  assertEquals(record["schema_file"], "schema.json");
});

Deno.test("3_core: VariablesBuilder.toTemplateRecord() - template format conversion", () => {
  const builder = new VariablesBuilder();

  builder
    .addStandardVariable("input_text_file", "test.txt")
    .addUserVariable("uv-custom", "custom value");

  const templateRecord = builder.toTemplateRecord();
  assertEquals(templateRecord["input_text_file"], "test.txt");
  assertEquals(templateRecord["custom"], "custom value"); // uv- prefix removed
});

Deno.test("3_core: VariablesBuilder duplicate detection", () => {
  const builder = new VariablesBuilder();

  builder.addStandardVariable("input_text_file", "first.txt");
  builder.addStandardVariable("input_text_file", "second.txt"); // duplicate

  assertEquals(builder.getErrorCount(), 1);
  assertEquals(builder.getVariableCount(), 1); // only the first variable
});

Deno.test("3_core: VariablesBuilder hasVariable() check", () => {
  const builder = new VariablesBuilder();

  assertEquals(builder.hasVariable("input_text_file"), false);

  builder.addStandardVariable("input_text_file", "test.txt");
  assertEquals(builder.hasVariable("input_text_file"), true);

  builder.addUserVariable("uv-custom", "value");
  assertEquals(builder.hasVariable("uv-custom"), true);
});

/**
 * Error cases - Comprehensive error handling tests
 */

Deno.test("error_cases: VariablesBuilder validation errors", () => {
  const builder = new VariablesBuilder();

  // Invalid standard variable name
  builder.addStandardVariable("invalid_name", "value");
  assertEquals(builder.getErrorCount(), 1);

  // Invalid file path variable name
  builder.addFilePathVariable("invalid_name", "path");
  assertEquals(builder.getErrorCount(), 2);

  // User variable without uv- prefix
  builder.addUserVariable("custom", "value");
  assertEquals(builder.getErrorCount(), 3);
});

Deno.test("error_cases: VariablesBuilder.build() with errors", () => {
  const builder = new VariablesBuilder();

  builder.addStandardVariable("invalid_name", "value"); // error case

  const result = builder.build();
  assertEquals(result.ok, false);

  if (!result.ok) {
    assertEquals(Array.isArray(result.error), true);
    assertEquals(result.error.length, 1);
    assertEquals(result.error[0].kind, "invalid");
  }
});

/**
 * Factory Values Integration tests
 */

Deno.test("3_core: VariablesBuilder.addFromFactoryValues() - comprehensive test", () => {
  const builder = new VariablesBuilder();

  const factoryValues = {
    promptFilePath: "/prompts/template.md",
    inputFilePath: "/input/sample.txt",
    outputFilePath: "/output/result.md",
    schemaFilePath: "/schemas/schema.json",
    userVariables: {
      "uv-project": "MyProject",
      "uv-author": "Developer",
    },
    inputText: "Sample stdin input",
  };

  builder.addFromFactoryValues(factoryValues);

  assertEquals(builder.getErrorCount(), 0);
  assertEquals(builder.getVariableCount(), 6); // input_text_file, destination_path, schema_file, input_text, 2 custom vars

  const record = builder.toRecord();
  assertEquals(record["input_text_file"], "/input/sample.txt"); // full path
  assertEquals(record["destination_path"], "/output/result.md");
  assertEquals(record["schema_file"], "/schemas/schema.json");
  assertEquals(record["input_text"], "Sample stdin input");
  assertEquals(record["uv-project"], "MyProject");
  assertEquals(record["uv-author"], "Developer");
});

Deno.test("3_core: VariablesBuilder.fromFactoryValues() - static factory method", () => {
  const factoryValues = {
    promptFilePath: "/prompts/template.md",
    inputFilePath: "/input/sample.txt",
    outputFilePath: "/output/result.md",
    schemaFilePath: "/schemas/schema.json",
  };

  const builder = VariablesBuilder.fromFactoryValues(factoryValues);

  assertEquals(builder.getErrorCount(), 0);
  assertEquals(builder.getVariableCount(), 3); // input_text_file, destination_path, schema_file
});

/**
 * Environment Integration tests
 */

Deno.test("3_core: VariablesBuilder empty values handling", () => {
  const builder = new VariablesBuilder();

  const factoryValues = {
    promptFilePath: "/prompts/template.md",
    inputFilePath: "", // empty string - not added to variables
    outputFilePath: "",
    schemaFilePath: "",
    inputText: "", // empty string - TEST_MODE fallback used
  };

  builder.addFromFactoryValues(factoryValues);

  // No errors should occur
  assertEquals(builder.getErrorCount(), 0);

  const record = builder.toRecord();
  // Empty file paths are NOT added to variables
  assertEquals("input_text_file" in record, false);
  assertEquals("destination_path" in record, false);
  assertEquals("schema_file" in record, false);

  // Only input_text has TEST_MODE fallback
  assertEquals("input_text" in record, true);
  assertEquals(record["input_text"], "# Default input text for testing");
});

/**
 * Method Chain Tests - Comprehensive method chain tests
 */

Deno.test("3_core: VariablesBuilder comprehensive method chain", () => {
  const builder = new VariablesBuilder()
    .addStandardVariable("input_text_file", "input.txt")
    .addStandardVariable("destination_path", "/output/result.md")
    .addFilePathVariable("schema_file", "/schemas/schema.json")
    .addStdinVariable("Comprehensive stdin content")
    .addUserVariable("uv-project", "TestProject")
    .addUserVariable("uv-version", "1.0.0");

  assertEquals(builder.getErrorCount(), 0);
  assertEquals(builder.getVariableCount(), 6);

  const buildResult = builder.build();
  assertEquals(buildResult.ok, true);

  if (buildResult.ok) {
    const variables = buildResult.data;
    assertEquals(variables.size(), 6);
    assertEquals(variables.hasVariable("input_text_file"), true);
    assertEquals(variables.hasVariable("uv-project"), true);

    const names = variables.getNames();
    assertEquals(names.includes("input_text_file"), true);
    assertEquals(names.includes("uv-project"), true);
  }
});

/**
 * Edge Cases - Additional boundary value tests (ensuring technical perfection)
 */

Deno.test("edge_cases: VariablesBuilder clear() method", () => {
  const builder = new VariablesBuilder();

  // Add variables and errors
  builder.addStandardVariable("input_text_file", "test.txt");
  builder.addStandardVariable("invalid_name", "error_case"); // error occurs

  assertEquals(builder.getVariableCount(), 1);
  assertEquals(builder.getErrorCount(), 1);

  // Execute clear
  builder.clear();

  assertEquals(builder.getVariableCount(), 0);
  assertEquals(builder.getErrorCount(), 0);
});

Deno.test("edge_cases: VariablesBuilder addUserVariables() batch processing", () => {
  const builder = new VariablesBuilder();

  const userVars = {
    "uv-project": "TestProject",
    "uv-version": "1.0.0",
    "uv-author": "Developer",
  };

  builder.addUserVariables(userVars);

  assertEquals(builder.getVariableCount(), 3);
  assertEquals(builder.getErrorCount(), 0);

  const record = builder.toRecord();
  assertEquals(record["uv-project"], "TestProject");
  assertEquals(record["uv-version"], "1.0.0");
  assertEquals(record["uv-author"], "Developer");
});

Deno.test("edge_cases: VariablesBuilder addUserVariables() with empty values", () => {
  const builder = new VariablesBuilder();

  const userVars = {
    "uv-custom1": "value1",
    "uv-custom2": "", // empty value - will be skipped
    "uv-custom3": "value3",
  };

  builder.addUserVariables(userVars);

  assertEquals(builder.getVariableCount(), 2); // uv-custom2 is skipped
  assertEquals(builder.getErrorCount(), 0);

  const record = builder.toRecord();
  assertEquals("uv-custom1" in record, true);
  assertEquals("uv-custom2" in record, false); // empty values are skipped
  assertEquals("uv-custom3" in record, true);
});

Deno.test("edge_cases: VariablesBuilder validateFactoryValues() validation", () => {
  const builder = new VariablesBuilder();

  // Incomplete FactoryValues
  const invalidFactoryValues = {
    promptFilePath: "", // required field is empty
    inputFilePath: "/input/test.txt",
    outputFilePath: "", // required field is empty
    schemaFilePath: "/schema/test.json",
    userVariables: {
      "invalid-prefix": "value", // missing uv- prefix
    },
  };

  const result = builder.validateFactoryValues(invalidFactoryValues as FactoryResolvedValues);
  assertEquals(result.ok, false);

  if (!result.ok) {
    assertEquals(result.error.length > 0, true);
    // Errors for promptFilePath, outputFilePath, userVariables prefix
    assertEquals(result.error.some((e) => e.kind === "missing"), true);
    assertEquals(result.error.some((e) => e.kind === "prefix"), true);
  }
});

/**
 * Performance & Memory Tests - Performance tests
 */

Deno.test("performance: VariablesBuilder large dataset handling", () => {
  const builder = new VariablesBuilder();

  // Add large number of user variables
  const userVars: Record<string, string> = {};
  for (let i = 0; i < 100; i++) {
    userVars[`uv-test${i}`] = `value${i}`;
  }

  const startTime = performance.now();
  builder.addUserVariables(userVars);
  const endTime = performance.now();

  assertEquals(builder.getVariableCount(), 100);
  assertEquals(builder.getErrorCount(), 0);

  // Performance check (processing 100 variables under 100ms)
  const processingTime = endTime - startTime;
  assertEquals(processingTime < 100, true);
});

/**
 * base_prompt_dir variable tests
 * Verifies that base_prompt_dir can be added as a standard variable
 */

Deno.test("1_behavior: addStandardVariable accepts base_prompt_dir", () => {
  const builder = new VariablesBuilder();
  builder.addStandardVariable("base_prompt_dir", "/workspace/prompts/to/task");

  assertEquals(builder.getErrorCount(), 0);
  assertEquals(builder.getVariableCount(), 1);

  const record = builder.toRecord();
  assertEquals(record.base_prompt_dir, "/workspace/prompts/to/task");
});

Deno.test("1_behavior: base_prompt_dir included in build output", () => {
  const builder = new VariablesBuilder();
  builder.addStandardVariable("base_prompt_dir", "/prompts/summary/project");
  builder.addStandardVariable("input_text_file", "input.md");

  const result = builder.build();
  assertEquals(result.ok, true);

  const record = builder.toRecord();
  assertEquals(record.base_prompt_dir, "/prompts/summary/project");
  assertEquals(record.input_text_file, "input.md");
});

Deno.test("2_structure: base_prompt_dir is independent of other variables", () => {
  const builder = new VariablesBuilder();

  // Add base_prompt_dir without other variables
  builder.addStandardVariable("base_prompt_dir", "/workspace/prompts/to/issue");

  const result = builder.build();
  assertEquals(result.ok, true);
  assertEquals(builder.getErrorCount(), 0);

  const record = builder.toRecord();
  assertEquals(Object.keys(record).includes("base_prompt_dir"), true);
});
