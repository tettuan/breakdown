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
import { TwoParamsVariableProcessor, type VariableProcessorError, type ProcessorOptions, type ProcessorResult } from "./variable_processor.ts";
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

Deno.test("Unit: extractCustomVariables should extract uv- prefixed variables", () => {
  const processor = new TwoParamsVariableProcessor();
  
  const options = {
    "uv-project": "my-project",
    "uv-version": "1.0.0",
    "uv-author": "test-author",
    "normal-option": "ignored",
    "another": "ignored"
  };
  
  const result = processor.extractCustomVariables(options);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(Object.keys(result.data).length, 3);
    assertEquals(result.data["uv-project"], "my-project");
    assertEquals(result.data["uv-version"], "1.0.0");
    assertEquals(result.data["uv-author"], "test-author");
    assertEquals(result.data["normal-option"], undefined);
    assertEquals(result.data["another"], undefined);
  }
});

Deno.test("Unit: extractCustomVariables should handle empty options", () => {
  const processor = new TwoParamsVariableProcessor();
  
  const result = processor.extractCustomVariables({});
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(Object.keys(result.data).length, 0);
  }
});

Deno.test("Unit: extractCustomVariables should handle null/undefined values", () => {
  const processor = new TwoParamsVariableProcessor();
  
  // Test null value
  const nullResult = processor.extractCustomVariables({
    "uv-null": null,
    "uv-valid": "value"
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
  const undefinedResult = processor.extractCustomVariables({
    "uv-undefined": undefined,
    "uv-valid": "value"
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

Deno.test("Unit: extractCustomVariables should convert values to strings", () => {
  const processor = new TwoParamsVariableProcessor();
  
  const options = {
    "uv-number": 42,
    "uv-boolean": true,
    "uv-string": "hello",
    "uv-object": { nested: "value" }
  };
  
  const result = processor.extractCustomVariables(options);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data["uv-number"], "42");
    assertEquals(result.data["uv-boolean"], "true");
    assertEquals(result.data["uv-string"], "hello");
    assertEquals(result.data["uv-object"], "[object Object]");
  }
});

Deno.test("Unit: process should handle minimal configuration", async () => {
  const processor = new TwoParamsVariableProcessor();
  
  const options: ProcessorOptions = {
    options: {},
    promptFile: "test-prompt.md"
  };
  
  const result = await processor.process(options);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertExists(result.data.variables);
    assertExists(result.data.customVariables);
    assertExists(result.data.standardVariables);
    assertExists(result.data.builder);
    
    // Standard variables should have defaults
    assertEquals(result.data.standardVariables.input_text_file, "stdin");
    assertEquals(result.data.standardVariables.destination_path, "stdout");
    assertEquals(result.data.standardVariables.input_text, undefined);
    
    // Custom variables should be empty
    assertEquals(Object.keys(result.data.customVariables).length, 0);
    
    // Builder should be properly instantiated
    assertInstanceOf(result.data.builder, VariablesBuilder);
  }
});

Deno.test("Unit: process should handle complete configuration", async () => {
  const processor = new TwoParamsVariableProcessor();
  
  const options: ProcessorOptions = {
    options: {
      "uv-project": "test-project",
      "uv-version": "2.0.0",
      "fromFile": "input.txt",
      "output": "output.md"
    },
    stdinContent: "Hello, world!",
    inputFile: "custom-input.txt",
    outputFile: "custom-output.md",
    schemaFile: "schema.json",
    promptFile: "prompt.md"
  };
  
  const result = await processor.process(options);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    // Custom variables
    assertEquals(result.data.customVariables["uv-project"], "test-project");
    assertEquals(result.data.customVariables["uv-version"], "2.0.0");
    
    // Standard variables
    assertEquals(result.data.standardVariables.input_text, "Hello, world!");
    assertEquals(result.data.standardVariables.input_text_file, "input.txt");
    assertEquals(result.data.standardVariables.destination_path, "output.md");
    
    // All variables should be combined
    assertEquals(result.data.variables["uv-project"], "test-project");
    assertEquals(result.data.variables["uv-version"], "2.0.0");
    
    // Builder should contain all variables
    const builderRecord = result.data.builder.toRecord();
    assertExists(builderRecord);
  }
});

Deno.test("Unit: process should resolve input file paths correctly", async () => {
  const processor = new TwoParamsVariableProcessor();
  
  // Test fromFile option
  const fromFileResult = await processor.process({
    options: { fromFile: "from-file.txt" }
  });
  
  assertEquals(fromFileResult.ok, true);
  if (fromFileResult.ok) {
    assertEquals(fromFileResult.data.standardVariables.input_text_file, "from-file.txt");
  }
  
  // Test from option
  const fromResult = await processor.process({
    options: { from: "from.txt" }
  });
  
  assertEquals(fromResult.ok, true);
  if (fromResult.ok) {
    assertEquals(fromResult.data.standardVariables.input_text_file, "from.txt");
  }
  
  // Test inputFile parameter
  const inputFileResult = await processor.process({
    options: {},
    inputFile: "input-param.txt"
  });
  
  assertEquals(inputFileResult.ok, true);
  if (inputFileResult.ok) {
    assertEquals(inputFileResult.data.standardVariables.input_text_file, "input-param.txt");
  }
  
  // Test default value
  const defaultResult = await processor.process({
    options: {}
  });
  
  assertEquals(defaultResult.ok, true);
  if (defaultResult.ok) {
    assertEquals(defaultResult.data.standardVariables.input_text_file, "stdin");
  }
});

Deno.test("Unit: process should resolve destination paths correctly", async () => {
  const processor = new TwoParamsVariableProcessor();
  
  // Test destinationFile option
  const destFileResult = await processor.process({
    options: { destinationFile: "dest-file.md" }
  });
  
  assertEquals(destFileResult.ok, true);
  if (destFileResult.ok) {
    assertEquals(destFileResult.data.standardVariables.destination_path, "dest-file.md");
  }
  
  // Test destination option
  const destResult = await processor.process({
    options: { destination: "dest.md" }
  });
  
  assertEquals(destResult.ok, true);
  if (destResult.ok) {
    assertEquals(destResult.data.standardVariables.destination_path, "dest.md");
  }
  
  // Test output option
  const outputResult = await processor.process({
    options: { output: "output.md" }
  });
  
  assertEquals(outputResult.ok, true);
  if (outputResult.ok) {
    assertEquals(outputResult.data.standardVariables.destination_path, "output.md");
  }
  
  // Test outputFile parameter
  const outputFileResult = await processor.process({
    options: {},
    outputFile: "output-param.md"
  });
  
  assertEquals(outputFileResult.ok, true);
  if (outputFileResult.ok) {
    assertEquals(outputFileResult.data.standardVariables.destination_path, "output-param.md");
  }
  
  // Test default value
  const defaultResult = await processor.process({
    options: {}
  });
  
  assertEquals(defaultResult.ok, true);
  if (defaultResult.ok) {
    assertEquals(defaultResult.data.standardVariables.destination_path, "stdout");
  }
});

Deno.test("Unit: process should handle STDIN content", async () => {
  const processor = new TwoParamsVariableProcessor();
  
  const stdinContent = "This is STDIN content\nWith multiple lines";
  
  const result = await processor.process({
    options: {},
    stdinContent
  });
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.standardVariables.input_text, stdinContent);
    
    // Variables should include STDIN data
    const variables = result.data.variables;
    assertEquals(variables.input_text, stdinContent);
  }
});

Deno.test("Unit: process should handle option precedence correctly", async () => {
  const processor = new TwoParamsVariableProcessor();
  
  // fromFile should take precedence over inputFile parameter
  const precedenceResult = await processor.process({
    options: { 
      fromFile: "option-file.txt",
      from: "from-option.txt" 
    },
    inputFile: "param-file.txt"
  });
  
  assertEquals(precedenceResult.ok, true);
  if (precedenceResult.ok) {
    assertEquals(precedenceResult.data.standardVariables.input_text_file, "option-file.txt");
  }
  
  // Test that "-" is ignored for fromFile
  const dashResult = await processor.process({
    options: { 
      fromFile: "-",
      from: "from-option.txt"
    }
  });
  
  assertEquals(dashResult.ok, true);
  if (dashResult.ok) {
    assertEquals(dashResult.data.standardVariables.input_text_file, "from-option.txt");
  }
});

Deno.test("Unit: static extractCustomVariables should work correctly", () => {
  const options = {
    "uv-test": "value",
    "uv-another": "another-value",
    "normal": "ignored"
  };
  
  const result = TwoParamsVariableProcessor.extractCustomVariables(options);
  
  assertEquals(typeof result, "object");
  assertEquals(result["uv-test"], "value");
  assertEquals(result["uv-another"], "another-value");
  assertEquals(result["normal"], undefined);
});

Deno.test("Unit: static extractCustomVariables should handle errors gracefully", () => {
  const options = {
    "uv-null": null,
    "uv-valid": "value"
  };
  
  // Static method should return empty object on error (backward compatibility)
  const result = TwoParamsVariableProcessor.extractCustomVariables(options);
  
  assertEquals(typeof result, "object");
  assertEquals(Object.keys(result).length, 0);
});

Deno.test("Unit: createVariableProcessor factory should work", async () => {
  const { createVariableProcessor } = await import("./variable_processor.ts");
  
  const processor = createVariableProcessor();
  assertInstanceOf(processor, TwoParamsVariableProcessor);
  
  // Should be functional
  const result = processor.extractCustomVariables({ "uv-test": "value" });
  assertEquals(result.ok, true);
});

Deno.test("Unit: extractCustomVariables export function should work", async () => {
  const { extractCustomVariables } = await import("./variable_processor.ts");
  
  const result = extractCustomVariables({
    "uv-export": "test",
    "normal": "ignored"
  });
  
  assertEquals(typeof result, "object");
  assertEquals(result["uv-export"], "test");
  assertEquals(result["normal"], undefined);
});

Deno.test("Unit: process should handle complex scenarios", async () => {
  const processor = new TwoParamsVariableProcessor();
  
  const complexOptions: ProcessorOptions = {
    options: {
      "uv-complex": "value",
      "uv-scenario": "test",
      "fromFile": "complex-input.txt",
      "output": "complex-output.md",
      "extraOption": "ignored"
    },
    stdinContent: "Complex STDIN content",
    inputFile: "fallback-input.txt",
    outputFile: "fallback-output.md",
    schemaFile: "complex-schema.json",
    promptFile: "complex-prompt.md"
  };
  
  const result = await processor.process(complexOptions);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    // Verify all components are integrated correctly
    assertEquals(result.data.customVariables["uv-complex"], "value");
    assertEquals(result.data.customVariables["uv-scenario"], "test");
    
    assertEquals(result.data.standardVariables.input_text, "Complex STDIN content");
    assertEquals(result.data.standardVariables.input_text_file, "complex-input.txt");
    assertEquals(result.data.standardVariables.destination_path, "complex-output.md");
    
    // Variables should contain all data
    const variables = result.data.variables;
    assertEquals(variables["uv-complex"], "value");
    assertEquals(variables["uv-scenario"], "test");
    assertEquals(variables.input_text, "Complex STDIN content");
    
    // Builder should be properly configured
    assertInstanceOf(result.data.builder, VariablesBuilder);
    const builderVars = result.data.builder.toRecord();
    assertExists(builderVars);
  }
});