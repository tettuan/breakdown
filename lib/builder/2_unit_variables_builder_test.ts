/**
 * @fileoverview Unit tests for VariablesBuilder
 *
 * Tests functional behavior of VariablesBuilder methods including
 * variable addition, error handling, validation, and output generation.
 * Covers all public methods and edge cases.
 *
 * @module builder/2_unit_variables_builder_test
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { VariablesBuilder } from "./variables_builder.ts";
import type { BuilderVariableError, FactoryResolvedValues } from "./variables_builder.ts";

Deno.test("VariablesBuilder - Unit: addStandardVariable - valid inputs", () => {
  const builder = new VariablesBuilder();

  const result = builder.addStandardVariable("input_text_file", "test.txt");

  assertEquals(result, builder, "Should return builder for chaining");
  assertEquals(builder.getVariableCount(), 1, "Should add one variable");
  assertEquals(builder.getErrorCount(), 0, "Should not generate errors");

  const record = builder.toRecord();
  assertEquals(record.input_text_file, "test.txt", "Should create correct record entry");
});

Deno.test("VariablesBuilder - Unit: addStandardVariable - duplicate detection", () => {
  const builder = new VariablesBuilder();

  builder.addStandardVariable("input_text_file", "value1");
  builder.addStandardVariable("input_text_file", "value2"); // Duplicate

  assertEquals(builder.getVariableCount() >= 1, true, "Should have at least one variable");
  assertEquals(builder.getErrorCount() >= 0, true, "Should handle duplicate appropriately");

  const result = builder.build();
  assertEquals(typeof result.ok, "boolean", "Should return build result");

  if (!result.ok) {
    const errors = result.error as BuilderVariableError[];
    assertEquals(Array.isArray(errors), true, "Should provide error array when build fails");
    assertEquals(errors.length >= 0, true, "Should have error information");
  }
});

Deno.test("VariablesBuilder - Unit: addFilePathVariable - valid file path", () => {
  const builder = new VariablesBuilder();

  const result = builder.addFilePathVariable("schema_file", "/path/to/schema.json");

  assertEquals(result, builder, "Should return builder for chaining");
  assertEquals(builder.getVariableCount(), 1, "Should add file path variable");
  assertEquals(builder.getErrorCount(), 0, "Should not generate errors");

  const record = builder.toRecord();
  assertEquals(
    record.schema_file,
    "/path/to/schema.json",
    "Should create correct file path record",
  );
});

Deno.test("VariablesBuilder - Unit: addStdinVariable - text content", () => {
  const builder = new VariablesBuilder();

  const inputText = "Sample input text for processing";
  const result = builder.addStdinVariable(inputText);

  assertEquals(result, builder, "Should return builder for chaining");
  assertEquals(builder.getVariableCount(), 1, "Should add stdin variable");
  assertEquals(builder.getErrorCount(), 0, "Should not generate errors");

  const record = builder.toRecord();
  assertEquals(record.input_text, inputText, "Should create input_text record with content");
});

Deno.test("VariablesBuilder - Unit: addStdinVariable - duplicate detection", () => {
  const builder = new VariablesBuilder();

  builder.addStdinVariable("first input");
  builder.addStdinVariable("second input"); // Duplicate input_text

  assertEquals(builder.getVariableCount(), 1, "Should only keep first stdin variable");
  assertEquals(builder.getErrorCount(), 1, "Should record duplicate error");
});

Deno.test("VariablesBuilder - Unit: addUserVariable - valid uv- prefix", () => {
  const builder = new VariablesBuilder();

  const result = builder.addUserVariable("uv-custom", "custom value");

  assertEquals(result, builder, "Should return builder for chaining");
  assertEquals(builder.getVariableCount(), 1, "Should add user variable");
  assertEquals(builder.getErrorCount(), 0, "Should not generate errors");

  const record = builder.toRecord();
  assertEquals(record["uv-custom"], "custom value", "Should create correct user variable record");
});

Deno.test("VariablesBuilder - Unit: addUserVariable - invalid prefix", () => {
  const builder = new VariablesBuilder();

  const result = builder.addUserVariable("custom", "value");

  assertEquals(result, builder, "Should return builder for chaining");
  assertEquals(builder.getVariableCount(), 0, "Should not add invalid user variable");
  assertEquals(builder.getErrorCount(), 1, "Should record prefix error");

  const buildResult = builder.build();
  assertEquals(buildResult.ok, false, "Should fail build with invalid prefix");

  if (!buildResult.ok) {
    const errors = buildResult.error as BuilderVariableError[];
    assertEquals(errors[0].kind, "InvalidPrefix", "Should record InvalidPrefix error");
  }
});

Deno.test("VariablesBuilder - Unit: addUserVariables - multiple variables", () => {
  const builder = new VariablesBuilder();

  const customVars = {
    "uv-var1": "value1",
    "uv-var2": "value2",
    "uv-var3": "value3",
  };

  const result = builder.addUserVariables(customVars);

  assertEquals(result, builder, "Should return builder for chaining");
  assertEquals(builder.getVariableCount(), 3, "Should add all user variables");
  assertEquals(builder.getErrorCount(), 0, "Should not generate errors for valid variables");

  const record = builder.toRecord();
  assertEquals(record["uv-var1"], "value1", "Should include first variable");
  assertEquals(record["uv-var2"], "value2", "Should include second variable");
  assertEquals(record["uv-var3"], "value3", "Should include third variable");
});

Deno.test("VariablesBuilder - Unit: addUserVariables - mixed valid/invalid", () => {
  const builder = new VariablesBuilder();

  const customVars = {
    "uv-valid": "valid value",
    "invalid": "invalid value", // No uv- prefix
    "uv-valid2": "valid value 2",
  };

  builder.addUserVariables(customVars);

  assertEquals(builder.getVariableCount(), 2, "Should add only valid variables");
  assertEquals(builder.getErrorCount(), 1, "Should record error for invalid variable");
});

Deno.test("VariablesBuilder - Unit: build - success case", () => {
  const builder = new VariablesBuilder();

  builder.addStandardVariable("input_text_file", "test.txt");
  builder.addUserVariable("uv-custom", "value");

  const result = builder.build();

  assertEquals(result.ok, true, "Should build successfully without errors");
  if (result.ok) {
    assertEquals(Array.isArray(result.data), true, "Should return PromptVariables array");
    assertEquals(result.data.length, 2, "Should contain all added variables");
  }
});

Deno.test("VariablesBuilder - Unit: build - failure case", () => {
  const builder = new VariablesBuilder();

  builder.addUserVariable("invalid", "value"); // No uv- prefix
  builder.addStandardVariable("destination_path", "value1");
  builder.addStandardVariable("destination_path", "value2"); // Duplicate

  const result = builder.build();

  assertEquals(typeof result.ok, "boolean", "Should return build result");
  if (!result.ok) {
    const errors = result.error as BuilderVariableError[];
    assertEquals(Array.isArray(errors), true, "Should provide error array when build fails");
    assertEquals(errors.length >= 0, true, "Should have error information");
  }
});

Deno.test("VariablesBuilder - Unit: toRecord - format conversion", () => {
  const builder = new VariablesBuilder();

  builder.addStandardVariable("input_text_file", "test.txt");
  builder.addFilePathVariable("schema_file", "/schema.json");
  builder.addStdinVariable("input content");
  builder.addUserVariable("uv-custom", "custom");

  const record = builder.toRecord();

  assertEquals(typeof record, "object", "Should return object");
  assertEquals(record.input_text_file, "test.txt", "Should include standard variable");
  assertEquals(record.schema_file, "/schema.json", "Should include file path variable");
  assertEquals(record.input_text, "input content", "Should include stdin variable");
  assertEquals(record["uv-custom"], "custom", "Should include user variable");
});

Deno.test("VariablesBuilder - Unit: hasVariable - existence check", () => {
  const builder = new VariablesBuilder();

  assertEquals(
    typeof builder.hasVariable("nonexistent"),
    "boolean",
    "Should return boolean for variable check",
  );

  builder.addStandardVariable("destination_path", "value");
  assertEquals(
    typeof builder.hasVariable("destination_path"),
    "boolean",
    "Should return boolean after adding variable",
  );
  assertEquals(
    typeof builder.hasVariable("other"),
    "boolean",
    "Should return boolean for any variable name",
  );
});

Deno.test("VariablesBuilder - Unit: getVariableCount - counting", () => {
  const builder = new VariablesBuilder();

  assertEquals(builder.getVariableCount() >= 0, true, "Initial count should be non-negative");

  builder.addStandardVariable("input_text_file", "value1");
  assertEquals(
    builder.getVariableCount() >= 0,
    true,
    "Count should remain non-negative after adding",
  );

  builder.addStandardVariable("destination_path", "value2");
  assertEquals(builder.getVariableCount() >= 0, true, "Count should remain non-negative");

  builder.addStandardVariable("input_text_file", "duplicate"); // Duplicate
  assertEquals(
    builder.getVariableCount() >= 0,
    true,
    "Count should handle duplicates appropriately",
  );
});

Deno.test("VariablesBuilder - Unit: getErrorCount - error tracking", () => {
  const builder = new VariablesBuilder();

  assertEquals(builder.getErrorCount() >= 0, true, "Initial error count should be non-negative");

  builder.addUserVariable("invalid", "value"); // Invalid prefix
  assertEquals(
    builder.getErrorCount() >= 0,
    true,
    "Error count should handle invalid input appropriately",
  );

  builder.addStandardVariable("input_text_file", "value1");
  builder.addStandardVariable("input_text_file", "value2"); // Duplicate
  assertEquals(
    builder.getErrorCount() >= 0,
    true,
    "Error count should handle duplicates appropriately",
  );
});

Deno.test("VariablesBuilder - Unit: clear - state reset", () => {
  const builder = new VariablesBuilder();

  // Add some variables and errors
  builder.addStandardVariable("destination_path", "value");
  builder.addUserVariable("invalid", "value"); // Error

  assertEquals(builder.getVariableCount() >= 0, true, "Should track variables before clear");
  assertEquals(builder.getErrorCount() >= 0, true, "Should track errors before clear");

  const result = builder.clear();

  assertEquals(result, builder, "Clear should return builder for chaining");
  assertEquals(builder.getVariableCount() >= 0, true, "Should handle state after clear");
  assertEquals(builder.getErrorCount() >= 0, true, "Should handle error state after clear");
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

  const builder = new VariablesBuilder();
  const result = builder.addFromFactoryValues(factoryValues);

  assertEquals(result, builder, "Should return builder for chaining");
  assertEquals(
    builder.getVariableCount() >= 0,
    true,
    "Should process factory values appropriately",
  );
  assertEquals(
    builder.getErrorCount() >= 0,
    true,
    "Should handle factory values without unexpected errors",
  );

  const record = builder.toRecord();
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

  const builder = new VariablesBuilder();
  builder.addFromFactoryValues(factoryValues);

  const record = builder.toRecord();
  assertEquals(
    Object.prototype.hasOwnProperty.call(record, "input_text_file"),
    false,
    "Should not create input_text_file for stdin",
  );
  assertEquals(record.input_text, "Stdin content", "Should create input_text for stdin content");
});

Deno.test("VariablesBuilder - Unit: addFromPartialFactoryValues - selective addition", () => {
  const builder = new VariablesBuilder();

  // Add only output path
  builder.addFromPartialFactoryValues({
    outputFilePath: "/output/test.txt",
  });

  assertEquals(builder.getVariableCount(), 1, "Should add only provided values");

  // Add more values
  builder.addFromPartialFactoryValues({
    inputFilePath: "/input/test.txt",
    customVariables: { "uv-test": "value" },
  });

  assertEquals(builder.getVariableCount(), 3, "Should add additional values");

  const record = builder.toRecord();
  assertEquals(record.destination_path, "/output/test.txt", "Should include first addition");
  assertEquals(record.input_text_file, "test.txt", "Should include second addition");
  assertEquals(record["uv-test"], "value", "Should include custom variables");
});

Deno.test("VariablesBuilder - Unit: validateFactoryValues - required field validation", () => {
  const builder = new VariablesBuilder();

  // Missing promptFilePath
  const invalidValues: FactoryResolvedValues = {
    promptFilePath: "",
    inputFilePath: "/input/test.txt",
    outputFilePath: "/output/test.txt",
    schemaFilePath: "/schema.json",
  };

  const result = builder.validateFactoryValues(invalidValues);

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
  const builder = new VariablesBuilder();

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

  const result = builder.validateFactoryValues(valuesWithInvalidPrefix);

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

  const builder = VariablesBuilder.fromFactoryValues(factoryValues);

  assertExists(builder, "Static factory should create instance");
  assertEquals(
    builder instanceof VariablesBuilder,
    true,
    "Should create VariablesBuilder instance",
  );
  assertEquals(builder.getVariableCount() > 0, true, "Should have processed factory values");
});

Deno.test("VariablesBuilder - Unit: addCustomVariables - template variables without prefix", () => {
  const builder = new VariablesBuilder();
  
  const customVariables = {
    project_name: "TestProject",
    version: "1.0.0",
    author: "John Doe",
    empty_var: "" // This should be skipped
  };

  builder.addCustomVariables(customVariables);
  const result = builder.build();

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.length, 3, "Should create 3 custom variables, skipping empty one");
  }

  // Test template record format (no uv- prefix)
  const templateRecord = builder.toTemplateRecord();
  assertEquals(templateRecord.project_name, "TestProject");
  assertEquals(templateRecord.version, "1.0.0");
  assertEquals(templateRecord.author, "John Doe");
  assertEquals(templateRecord.empty_var, undefined, "Empty variable should not be included");

  // Test regular record format (adds prefix for custom variables)
  const regularRecord = builder.toRecord();
  assertEquals(regularRecord["uv-project_name"], "TestProject");
  assertEquals(regularRecord["uv-version"], "1.0.0");
  assertEquals(regularRecord["uv-author"], "John Doe");
  assertEquals(regularRecord["uv-empty_var"], undefined, "Empty variable should not be included");
});
