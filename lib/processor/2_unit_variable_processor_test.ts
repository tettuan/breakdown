/**
 * @fileoverview Unit Test for Variable Processor
 *
 * Tests the functional behavior of TwoParamsVariableProcessor:
 * - Custom variable extraction functionality
 * - Standard variable processing
 * - STDIN content handling
 * - Error handling and validation
 * - Result type compliance
 *
 * @module lib/processor/2_unit_variable_processor_test
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import {
  type ProcessorOptions,
  type ProcessorResult,
  TwoParamsVariableProcessor,
  type VariableProcessorError,
} from "./variable_processor.ts";
import { VariablesBuilder } from "../builder/variables_builder.ts";

/**
 * Unit tests for Variable Processor functionality
 *
 * Tests all public methods and their expected behaviors:
 * 1. extractCustomVariables method
 * 2. process method with various configurations
 * 3. Error handling for different failure scenarios
 * 4. Integration with VariablesBuilder
 */

Deno.test("Unit: extractCustomVariables should extract uv- prefixed variables", async () => {
  const _processor = new TwoParamsVariableProcessor();

  const options = {
    "uv-project": "my-project",
    "uv-version": "1.0.0",
    "uv-author": "test-author",
    "normal-option": "ignored",
    "another": "ignored",
  };

  const _result = _processor.extractCustomVariables(options);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(Object.keys(_result.data).length, 3);
    assertEquals(_result.data["uv-project"], "my-project");
    assertEquals(_result.data["uv-version"], "1.0.0");
    assertEquals(_result.data["uv-author"], "test-author");
    assertEquals(_result.data["normal-option"], undefined);
    assertEquals(_result.data["another"], undefined);
  }
});

Deno.test("Unit: extractCustomVariables should handle empty options", async () => {
  const _processor = new TwoParamsVariableProcessor();

  const _result = _processor.extractCustomVariables({});

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(Object.keys(_result.data).length, 0);
  }
});

Deno.test("Unit: extractCustomVariables should handle null/undefined values", async () => {
  const _processor = new TwoParamsVariableProcessor();

  // Test null value
  const nullResult = _processor.extractCustomVariables({
    "uv-null": null,
    "uv-valid": "value",
  });

  assertEquals(nullResult.ok, false);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "InvalidOption");
    if (nullResult.error.kind === "InvalidOption") {
      assertEquals(nullResult.error.key, "uv-null");
      assertEquals(nullResult.error.value, null);
      assertExists(nullResult.error.reason);
    }
  }

  // Test undefined value
  const undefinedResult = _processor.extractCustomVariables({
    "uv-undefined": undefined,
    "uv-valid": "value",
  });

  assertEquals(undefinedResult.ok, false);
  if (!undefinedResult.ok) {
    assertEquals(undefinedResult.error.kind, "InvalidOption");
    if (undefinedResult.error.kind === "InvalidOption") {
      assertEquals(undefinedResult.error.key, "uv-undefined");
      assertEquals(undefinedResult.error.value, undefined);
      assertExists(undefinedResult.error.reason);
    }
  }
});

Deno.test("Unit: extractCustomVariables should convert values to strings", async () => {
  const _processor = new TwoParamsVariableProcessor();

  const options = {
    "uv-number": 42,
    "uv-boolean": true,
    "uv-string": "hello",
    "uv-object": { nested: "value" },
  };

  const _result = _processor.extractCustomVariables(options);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data["uv-number"], "42");
    assertEquals(_result.data["uv-boolean"], "true");
    assertEquals(_result.data["uv-string"], "hello");
    assertEquals(_result.data["uv-object"], "[object Object]");
  }
});

Deno.test("Unit: process should handle minimal configuration", async () => {
  const _processor = new TwoParamsVariableProcessor();

  const options: ProcessorOptions = {
    options: {},
    promptFile: "test-prompt.md",
  };

  const _result = await _processor.process(options);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertExists(_result.data.variables);
    assertExists(_result.data.customVariables);
    assertExists(_result.data.standardVariables);
    assertExists(_result.data.builder);

    // Standard variables should have defaults
    assertEquals(_result.data.standardVariables.input_text_file, "stdin");
    assertEquals(_result.data.standardVariables.destination_path, "stdout");
    assertEquals(_result.data.standardVariables.input_text, undefined);

    // Custom variables should be empty
    assertEquals(Object.keys(_result.data.customVariables).length, 0);

    // Builder should be properly instantiated
    assertInstanceOf(_result.data.builder, VariablesBuilder);
  }
});

Deno.test("Unit: process should handle complete configuration", async () => {
  const _processor = new TwoParamsVariableProcessor();

  const options: ProcessorOptions = {
    options: {
      "uv-project": "test-project",
      "uv-version": "2.0.0",
      "fromFile": "input.txt",
      "output": "output.md",
    },
    stdinContent: "Hello, world!",
    inputFile: "custom-input.txt",
    outputFile: "custom-output.md",
    schemaFile: "schema.json",
    promptFile: "prompt.md",
  };

  const _result = await _processor.process(options);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    // Custom variables
    assertEquals(_result.data.customVariables["uv-project"], "test-project");
    assertEquals(_result.data.customVariables["uv-version"], "2.0.0");

    // Standard variables
    assertEquals(_result.data.standardVariables.input_text, "Hello, world!");
    assertEquals(_result.data.standardVariables.input_text_file, "input.txt");
    assertEquals(_result.data.standardVariables.destination_path, "output.md");

    // All variables should be combined
    assertEquals(_result.data.variables["uv-project"], "test-project");
    assertEquals(_result.data.variables["uv-version"], "2.0.0");

    // Builder should contain all variables
    const builderRecord = _result.data.builder.toRecord();
    assertExists(builderRecord);
  }
});

Deno.test("Unit: process should resolve input file paths correctly", async () => {
  const _processor = new TwoParamsVariableProcessor();

  // Test fromFile option
  const fromFileResult = await _processor.process({
    options: { fromFile: "from-file.txt" },
  });

  assertEquals(fromFileResult.ok, true);
  if (fromFileResult.ok) {
    assertEquals(fromFileResult.data.standardVariables.input_text_file, "from-file.txt");
  }

  // Test from option
  const fromResult = await _processor.process({
    options: { from: "from.txt" },
  });

  assertEquals(fromResult.ok, true);
  if (fromResult.ok) {
    assertEquals(fromResult.data.standardVariables.input_text_file, "from.txt");
  }

  // Test inputFile parameter
  const inputFileResult = await _processor.process({
    options: {},
    inputFile: "input-param.txt",
  });

  assertEquals(inputFileResult.ok, true);
  if (inputFileResult.ok) {
    assertEquals(inputFileResult.data.standardVariables.input_text_file, "input-param.txt");
  }

  // Test default value
  const defaultResult = await _processor.process({
    options: {},
  });

  assertEquals(defaultResult.ok, true);
  if (defaultResult.ok) {
    assertEquals(defaultResult.data.standardVariables.input_text_file, "stdin");
  }
});

Deno.test("Unit: process should resolve destination paths correctly", async () => {
  const _processor = new TwoParamsVariableProcessor();

  // Test destinationFile option
  const destFileResult = await _processor.process({
    options: { destinationFile: "dest-file.md" },
  });

  assertEquals(destFileResult.ok, true);
  if (destFileResult.ok) {
    assertEquals(destFileResult.data.standardVariables.destination_path, "dest-file.md");
  }

  // Test destination option
  const destResult = await _processor.process({
    options: { destination: "dest.md" },
  });

  assertEquals(destResult.ok, true);
  if (destResult.ok) {
    assertEquals(destResult.data.standardVariables.destination_path, "dest.md");
  }

  // Test output option
  const outputResult = await _processor.process({
    options: { output: "output.md" },
  });

  assertEquals(outputResult.ok, true);
  if (outputResult.ok) {
    assertEquals(outputResult.data.standardVariables.destination_path, "output.md");
  }

  // Test outputFile parameter
  const outputFileResult = await _processor.process({
    options: {},
    outputFile: "output-param.md",
  });

  assertEquals(outputFileResult.ok, true);
  if (outputFileResult.ok) {
    assertEquals(outputFileResult.data.standardVariables.destination_path, "output-param.md");
  }

  // Test default value
  const defaultResult = await _processor.process({
    options: {},
  });

  assertEquals(defaultResult.ok, true);
  if (defaultResult.ok) {
    assertEquals(defaultResult.data.standardVariables.destination_path, "stdout");
  }
});

Deno.test("Unit: process should handle STDIN content", async () => {
  const _processor = new TwoParamsVariableProcessor();

  const stdinContent = "This is STDIN content\nWith multiple lines";

  const _result = await _processor.process({
    options: {},
    stdinContent,
  });

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data.standardVariables.input_text, stdinContent);

    // Variables should include STDIN data
    const variables = _result.data.variables;
    assertEquals(variables.input_text, stdinContent);
  }
});

Deno.test("Unit: process should handle option precedence correctly", async () => {
  const _processor = new TwoParamsVariableProcessor();

  // fromFile should take precedence over inputFile parameter
  const precedenceResult = await _processor.process({
    options: {
      fromFile: "option-file.txt",
      from: "from-option.txt",
    },
    inputFile: "param-file.txt",
  });

  assertEquals(precedenceResult.ok, true);
  if (precedenceResult.ok) {
    assertEquals(precedenceResult.data.standardVariables.input_text_file, "option-file.txt");
  }

  // Test that "-" is ignored for fromFile
  const dashResult = await _processor.process({
    options: {
      fromFile: "-",
      from: "from-option.txt",
    },
  });

  assertEquals(dashResult.ok, true);
  if (dashResult.ok) {
    assertEquals(dashResult.data.standardVariables.input_text_file, "from-option.txt");
  }
});

Deno.test("Unit: static extractCustomVariables should work correctly", async () => {
  const options = {
    "uv-test": "value",
    "uv-another": "another-value",
    "normal": "ignored",
  };

  const _result = TwoParamsVariableProcessor.extractCustomVariables(options);

  assertEquals(typeof _result, "object");
  assertEquals(result["uv-test"], "value");
  assertEquals(result["uv-another"], "another-value");
  assertEquals(result["normal"], undefined);
});

Deno.test("Unit: static extractCustomVariables should handle errors gracefully", async () => {
  const options = {
    "uv-null": null,
    "uv-valid": "value",
  };

  // Static method should return empty object on error (backward compatibility)
  const _result = TwoParamsVariableProcessor.extractCustomVariables(options);

  assertEquals(typeof _result, "object");
  assertEquals(Object.keys(_result).length, 0);
});

Deno.test("Unit: createVariableProcessor factory should work", async () => {
  const { createVariableProcessor } = await import("./variable_processor.ts");

  const _processor = createVariableProcessor();
  assertInstanceOf(processor, TwoParamsVariableProcessor);

  // Should be functional
  const _result = _processor.extractCustomVariables({ "uv-test": "value" });
  assertEquals(_result.ok, true);
});

Deno.test("Unit: extractCustomVariables export function should work", async () => {
  const { extractCustomVariables } = await import("./variable_processor.ts");

  const _result = extractCustomVariables({
    "uv-export": "test",
    "normal": "ignored",
  });

  assertEquals(typeof _result, "object");
  assertEquals(result["uv-export"], "test");
  assertEquals(result["normal"], undefined);
});

Deno.test("Unit: process should handle complex scenarios", async () => {
  const _processor = new TwoParamsVariableProcessor();

  const complexOptions: ProcessorOptions = {
    options: {
      "uv-complex": "value",
      "uv-scenario": "test",
      "fromFile": "complex-input.txt",
      "output": "complex-output.md",
      "extraOption": "ignored",
    },
    stdinContent: "Complex STDIN content",
    inputFile: "fallback-input.txt",
    outputFile: "fallback-output.md",
    schemaFile: "complex-schema.json",
    promptFile: "complex-prompt.md",
  };

  const _result = await _processor.process(complexOptions);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    // Verify all components are integrated correctly
    assertEquals(_result.data.customVariables["uv-complex"], "value");
    assertEquals(_result.data.customVariables["uv-scenario"], "test");

    assertEquals(_result.data.standardVariables.input_text, "Complex STDIN content");
    assertEquals(_result.data.standardVariables.input_text_file, "complex-input.txt");
    assertEquals(_result.data.standardVariables.destination_path, "complex-output.md");

    // Variables should contain all data
    const variables = _result.data.variables;
    assertEquals(variables["uv-complex"], "value");
    assertEquals(variables["uv-scenario"], "test");
    assertEquals(variables.input_text, "Complex STDIN content");

    // Builder should be properly configured
    assertInstanceOf(_result.data.builder, VariablesBuilder);
    const builderVars = _result.data.builder.toRecord();
    assertExists(builderVars);
  }
});
