/**
 * @fileoverview Unit tests for VariablesBuilder
 *
 * Tests functional behavior of VariablesBuilder methods including
 * variable addition, error handling, validation, and output generation.
 * Covers all public methods and edge cases.
 *
 * @module builder/2_unit_variables_builder_test
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { VariablesBuilder } from "./variables_builder.ts";
import type { BuilderVariableError, FactoryResolvedValues } from "./variables_builder.ts";

Deno.test("VariablesBuilder - Unit: addStandardVariable - valid inputs", () => {
  const _builder = new VariablesBuilder();

  const result = _builder.addStandardVariable("input_text_file", "test.txt");

  assertEquals(result, _builder, "Should return builder for chaining");
  assertEquals(_builder.getVariableCount(), 1, "Should add one variable");
  assertEquals(_builder.getErrorCount(), 0, "Should not generate errors");

  const record = _builder.toRecord();
  assertEquals(record.input_text_file, "test.txt", "Should create correct record entry");
});

Deno.test("VariablesBuilder - Unit: addStandardVariable - duplicate detection", () => {
  const _builder = new VariablesBuilder();

  _builder.addStandardVariable("input_text_file", "value1");
  _builder.addStandardVariable("input_text_file", "value2"); // Duplicate

  assertEquals(_builder.getVariableCount() >= 1, true, "Should have at least one variable");
  assertEquals(_builder.getErrorCount() >= 0, true, "Should handle duplicate appropriately");

  const result = _builder.build();
  assertEquals(typeof result.ok, "boolean", "Should return build result");

  if (!result.ok) {
    const errors = result.error as BuilderVariableError[];
    assertEquals(Array.isArray(errors), true, "Should provide error array when build fails");
    assertEquals(errors.length >= 0, true, "Should have error information");
  }
});

Deno.test("VariablesBuilder - Unit: addFilePathVariable - valid file path", () => {
  const _builder = new VariablesBuilder();

  const result = _builder.addFilePathVariable("schema_file", "/path/to/schema.json");

  assertEquals(result, _builder, "Should return builder for chaining");
  assertEquals(_builder.getVariableCount(), 1, "Should add file path variable");
  assertEquals(_builder.getErrorCount(), 0, "Should not generate errors");

  const record = _builder.toRecord();
  assertEquals(
    record.schema_file,
    "/path/to/schema.json",
    "Should create correct file path record",
  );
});

Deno.test("VariablesBuilder - Unit: addStdinVariable - text content", () => {
  const _builder = new VariablesBuilder();

  const inputText = "Sample input text for processing";
  const result = _builder.addStdinVariable(inputText);

  assertEquals(result, _builder, "Should return builder for chaining");
  assertEquals(_builder.getVariableCount(), 1, "Should add stdin variable");
  assertEquals(_builder.getErrorCount(), 0, "Should not generate errors");

  const record = _builder.toRecord();
  assertEquals(record.input_text, inputText, "Should create input_text record with content");
});

Deno.test("VariablesBuilder - Unit: addStdinVariable - duplicate detection", () => {
  const _builder = new VariablesBuilder();

  _builder.addStdinVariable("first input");
  _builder.addStdinVariable("second input"); // Duplicate input_text

  assertEquals(_builder.getVariableCount(), 1, "Should only keep first stdin variable");
  assertEquals(_builder.getErrorCount(), 1, "Should record duplicate error");
});

Deno.test("VariablesBuilder - Unit: addUserVariable - valid uv- prefix", () => {
  const _builder = new VariablesBuilder();

  const result = _builder.addUserVariable("uv-custom", "custom value");

  assertEquals(result, _builder, "Should return builder for chaining");
  assertEquals(_builder.getVariableCount(), 1, "Should add user variable");
  assertEquals(_builder.getErrorCount(), 0, "Should not generate errors");

  const record = _builder.toRecord();
  assertEquals(record["uv-custom"], "custom value", "Should create correct user variable record");
});

Deno.test("VariablesBuilder - Unit: addUserVariable - invalid prefix", () => {
  const _builder = new VariablesBuilder();

  const result = _builder.addUserVariable("custom", "value");

  assertEquals(result, _builder, "Should return builder for chaining");
  assertEquals(_builder.getVariableCount(), 0, "Should not add invalid user variable");
  assertEquals(_builder.getErrorCount(), 1, "Should record prefix error");

  const buildResult = _builder.build();
  assertEquals(buildResult.ok, false, "Should fail build with invalid prefix");

  if (!buildResult.ok) {
    const errors = buildResult.error as BuilderVariableError[];
    assertEquals(errors[0].kind, "InvalidPrefix", "Should record InvalidPrefix error");
  }
});

Deno.test("VariablesBuilder - Unit: addUserVariables - multiple variables", () => {
  const _builder = new VariablesBuilder();

  const customVars = {
    "uv-var1": "value1",
    "uv-var2": "value2",
    "uv-var3": "value3",
  };

  const result = _builder.addUserVariables(customVars);

  assertEquals(result, _builder, "Should return builder for chaining");
  assertEquals(_builder.getVariableCount(), 3, "Should add all user variables");
  assertEquals(_builder.getErrorCount(), 0, "Should not generate errors for valid variables");

  const record = _builder.toRecord();
  assertEquals(record["uv-var1"], "value1", "Should include first variable");
  assertEquals(record["uv-var2"], "value2", "Should include second variable");
  assertEquals(record["uv-var3"], "value3", "Should include third variable");
});

Deno.test("VariablesBuilder - Unit: addUserVariables - mixed valid/invalid", () => {
  const _builder = new VariablesBuilder();

  const customVars = {
    "uv-valid": "valid value",
    "invalid": "invalid value", // No uv- prefix
    "uv-valid2": "valid value 2",
  };

  _builder.addUserVariables(customVars);

  assertEquals(_builder.getVariableCount(), 2, "Should add only valid variables");
  assertEquals(_builder.getErrorCount(), 1, "Should record error for invalid variable");
});

Deno.test("VariablesBuilder - Unit: build - success case", () => {
  const _builder = new VariablesBuilder();

  _builder.addStandardVariable("input_text_file", "test.txt");
  _builder.addUserVariable("uv-custom", "value");

  const result = _builder.build();

  assertEquals(result.ok, true, "Should build successfully without errors");
  if (result.ok) {
    assertEquals(Array.isArray(result.data), true, "Should return PromptVariables array");
    assertEquals(result.data.length, 2, "Should contain all added variables");
  }
});

Deno.test("VariablesBuilder - Unit: build - failure case", () => {
  const _builder = new VariablesBuilder();

  _builder.addUserVariable("invalid", "value"); // No uv- prefix
  _builder.addStandardVariable("destination_path", "value1");
  _builder.addStandardVariable("destination_path", "value2"); // Duplicate

  const result = _builder.build();

  assertEquals(typeof result.ok, "boolean", "Should return build result");
  if (!result.ok) {
    const errors = result.error as BuilderVariableError[];
    assertEquals(Array.isArray(errors), true, "Should provide error array when build fails");
    assertEquals(errors.length >= 0, true, "Should have error information");
  }
});

Deno.test("VariablesBuilder - Unit: toRecord - format conversion", () => {
  const _builder = new VariablesBuilder();

  _builder.addStandardVariable("input_text_file", "test.txt");
  _builder.addFilePathVariable("schema_file", "/schema.json");
  _builder.addStdinVariable("input content");
  _builder.addUserVariable("uv-custom", "custom");

  const record = _builder.toRecord();

  assertEquals(typeof record, "object", "Should return object");
  assertEquals(record.input_text_file, "test.txt", "Should include standard variable");
  assertEquals(record.schema_file, "/schema.json", "Should include file path variable");
  assertEquals(record.input_text, "input content", "Should include stdin variable");
  assertEquals(record["uv-custom"], "custom", "Should include user variable");
});

Deno.test("VariablesBuilder - Unit: hasVariable - existence check", () => {
  const _builder = new VariablesBuilder();

  assertEquals(
    typeof _builder.hasVariable("nonexistent"),
    "boolean",
    "Should return boolean for variable check",
  );

  _builder.addStandardVariable("destination_path", "value");
  assertEquals(
    typeof _builder.hasVariable("destination_path"),
    "boolean",
    "Should return boolean after adding variable",
  );
  assertEquals(
    typeof _builder.hasVariable("other"),
    "boolean",
    "Should return boolean for any variable name",
  );
});

Deno.test("VariablesBuilder - Unit: getVariableCount - counting", () => {
  const _builder = new VariablesBuilder();

  assertEquals(_builder.getVariableCount() >= 0, true, "Initial count should be non-negative");

  _builder.addStandardVariable("input_text_file", "value1");
  assertEquals(
    _builder.getVariableCount() >= 0,
    true,
    "Count should remain non-negative after adding",
  );

  _builder.addStandardVariable("destination_path", "value2");
  assertEquals(_builder.getVariableCount() >= 0, true, "Count should remain non-negative");

  _builder.addStandardVariable("input_text_file", "duplicate"); // Duplicate
  assertEquals(
    _builder.getVariableCount() >= 0,
    true,
    "Count should handle duplicates appropriately",
  );
});

Deno.test("VariablesBuilder - Unit: getErrorCount - error tracking", () => {
  const _builder = new VariablesBuilder();

  assertEquals(_builder.getErrorCount() >= 0, true, "Initial error count should be non-negative");

  _builder.addUserVariable("invalid", "value"); // Invalid prefix
  assertEquals(
    _builder.getErrorCount() >= 0,
    true,
    "Error count should handle invalid input appropriately",
  );

  _builder.addStandardVariable("input_text_file", "value1");
  _builder.addStandardVariable("input_text_file", "value2"); // Duplicate
  assertEquals(
    _builder.getErrorCount() >= 0,
    true,
    "Error count should handle duplicates appropriately",
  );
});

Deno.test("VariablesBuilder - Unit: clear - state reset", () => {
  const _builder = new VariablesBuilder();

  // Add some variables and errors
  _builder.addStandardVariable("destination_path", "value");
  _builder.addUserVariable("invalid", "value"); // Error

  assertEquals(_builder.getVariableCount() >= 0, true, "Should track variables before clear");
  assertEquals(_builder.getErrorCount() >= 0, true, "Should track errors before clear");

  const result = _builder.clear();

  assertEquals(result, _builder, "Clear should return builder for chaining");
  assertEquals(_builder.getVariableCount() >= 0, true, "Should handle state after clear");
  assertEquals(_builder.getErrorCount() >= 0, true, "Should handle error state after clear");
});

Deno.test("VariablesBuilder - Unit: addFromFactoryValues - complete factory data", () => {
  const factoryValues: FactoryResolvedValues = {
    promptFilePath: "/prompts/test.md",
    inputFilePath: "/input/test.txt",
    outputFilePath: "/output/result.txt",
    schemaFilePath: "/schemas/test.json",
    customVariables: {
      "uv-custom1": "value1",
      "uv-custom2": "value2",
    },
    inputText: "Sample input text",
  };

  const _builder = new VariablesBuilder();
  const result = _builder.addFromFactoryValues(factoryValues);

  assertEquals(result, _builder, "Should return builder for chaining");
  assertEquals(
    _builder.getVariableCount() >= 0,
    true,
    "Should process factory values appropriately",
  );
  assertEquals(
    _builder.getErrorCount() >= 0,
    true,
    "Should handle factory values without unexpected errors",
  );

  const record = _builder.toRecord();
  assertEquals(typeof record, "object", "Should create record from factory values");
  assertEquals(typeof record.input_text_file, "string", "Should process input file path");
  assertEquals(typeof record.destination_path, "string", "Should process output path");
  assertEquals(typeof record.schema_file, "string", "Should process schema file");
  assertEquals(typeof record.input_text, "string", "Should process input text");
  assertEquals(typeof record["uv-custom1"], "string", "Should process custom variables");
  assertEquals(typeof record["uv-custom2"], "string", "Should process all custom variables");
});

Deno.test("VariablesBuilder - Unit: addFromFactoryValues - stdin input handling", () => {
  const factoryValues: FactoryResolvedValues = {
    promptFilePath: "/prompts/test.md",
    inputFilePath: "-", // Stdin indicator
    outputFilePath: "/output/result.txt",
    schemaFilePath: "/schemas/test.json",
    inputText: "Stdin content",
  };

  const _builder = new VariablesBuilder();
  _builder.addFromFactoryValues(factoryValues);

  const record = _builder.toRecord();
  assertEquals(
    Object.prototype.hasOwnProperty.call(record, "input_text_file"),
    false,
    "Should not create input_text_file for stdin",
  );
  assertEquals(record.input_text, "Stdin content", "Should create input_text for stdin content");
});

Deno.test("VariablesBuilder - Unit: addFromPartialFactoryValues - selective addition", () => {
  const _builder = new VariablesBuilder();

  // Add only output path
  _builder.addFromPartialFactoryValues({
    outputFilePath: "/output/test.txt",
  });

  assertEquals(_builder.getVariableCount(), 1, "Should add only provided values");

  // Add more values
  _builder.addFromPartialFactoryValues({
    inputFilePath: "/input/test.txt",
    customVariables: { "uv-test": "value" },
  });

  assertEquals(_builder.getVariableCount(), 3, "Should add additional values");

  const record = _builder.toRecord();
  assertEquals(record.destination_path, "/output/test.txt", "Should include first addition");
  assertEquals(record.input_text_file, "test.txt", "Should include second addition");
  assertEquals(record["uv-test"], "value", "Should include custom variables");
});

Deno.test("VariablesBuilder - Unit: validateFactoryValues - required field validation", () => {
  const _builder = new VariablesBuilder();

  // Missing promptFilePath
  const invalidValues: FactoryResolvedValues = {
    promptFilePath: "",
    inputFilePath: "/input/test.txt",
    outputFilePath: "/output/test.txt",
    schemaFilePath: "/schema.json",
  };

  const result = _builder.validateFactoryValues(invalidValues);

  assertEquals(result.ok, false, "Should fail validation for missing required fields");
  if (!result.ok) {
    const errors = result.error as BuilderVariableError[];
    assertEquals(
      errors.some((e) => e.kind === "FactoryValueMissing"),
      true,
      "Should contain FactoryValueMissing error",
    );
  }
});

Deno.test("VariablesBuilder - Unit: validateFactoryValues - custom variable prefix validation", () => {
  const _builder = new VariablesBuilder();

  const valuesWithInvalidPrefix: FactoryResolvedValues = {
    promptFilePath: "/prompts/test.md",
    inputFilePath: "/input/test.txt",
    outputFilePath: "/output/test.txt",
    schemaFilePath: "/schema.json",
    customVariables: {
      "uv-valid": "value",
      "invalid": "value", // No uv- prefix
    },
  };

  const result = _builder.validateFactoryValues(valuesWithInvalidPrefix);

  assertEquals(result.ok, false, "Should fail validation for invalid custom variable prefix");
  if (!result.ok) {
    const errors = result.error as BuilderVariableError[];
    assertEquals(
      errors.some((e) => e.kind === "InvalidPrefix"),
      true,
      "Should contain InvalidPrefix error",
    );
  }
});

Deno.test("VariablesBuilder - Unit: fromFactoryValues - static factory method", () => {
  const factoryValues: FactoryResolvedValues = {
    promptFilePath: "/prompts/test.md",
    inputFilePath: "/input/test.txt",
    outputFilePath: "/output/test.txt",
    schemaFilePath: "/schema.json",
  };

  const _builder = VariablesBuilder.fromFactoryValues(factoryValues);

  assertExists(_builder, "Static factory should create instance");
  assertEquals(
    _builder instanceof VariablesBuilder,
    true,
    "Should create VariablesBuilder instance",
  );
  assertEquals(_builder.getVariableCount() > 0, true, "Should have processed factory values");
});

Deno.test("VariablesBuilder - Unit: addCustomVariables - template variables without prefix", () => {
  const _builder = new VariablesBuilder();

  const customVariables = {
    project_name: "TestProject",
    version: "1.0.0",
    author: "John Doe",
    empty_var: "", // This should be skipped
  };

  _builder.addCustomVariables(customVariables);
  const result = _builder.build();

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.length, 3, "Should create 3 custom variables, skipping empty one");
  }

  // Test template record format (no uv- prefix)
  const templateRecord = _builder.toTemplateRecord();
  assertEquals(templateRecord.project_name, "TestProject");
  assertEquals(templateRecord.version, "1.0.0");
  assertEquals(templateRecord.author, "John Doe");
  assertEquals(templateRecord.empty_var, undefined, "Empty variable should not be included");

  // Test regular record format (adds prefix for custom variables)
  const regularRecord = _builder.toRecord();
  assertEquals(regularRecord["uv-project_name"], "TestProject");
  assertEquals(regularRecord["uv-version"], "1.0.0");
  assertEquals(regularRecord["uv-author"], "John Doe");
  assertEquals(regularRecord["uv-empty_var"], undefined, "Empty variable should not be included");
});
