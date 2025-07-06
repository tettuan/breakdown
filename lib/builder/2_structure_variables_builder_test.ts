/**
 * @fileoverview Structure tests for VariablesBuilder
 * 
 * Testing focus areas:
 * 1. Domain boundaries - PromptVariable value objects encapsulation
 * 2. Result type error handling - Builder pattern with error accumulation
 * 3. Smart Constructor pattern - Type-safe variable creation
 * 
 * @module lib/builder/2_structure_variables_builder_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { 
  VariablesBuilder,
  type FactoryResolvedValues,
  type BuilderVariableError
} from "./variables_builder.ts";
import { isOk, isError } from "../types/result.ts";
import { 
  StandardVariable, 
  FilePathVariable, 
  StdinVariable, 
  UserVariable 
} from "../types/prompt_variables.ts";

Deno.test("2_structure: VariablesBuilder maintains value object boundaries", () => {
  const builder = new VariablesBuilder();
  
  builder
    .addStandardVariable("input_text_file", "file.txt")
    .addFilePathVariable("schema_file", "/path/to/schema.json")
    .addStdinVariable("test content")
    .addUserVariable("uv-custom", "custom value");
  
  const result = builder.build();
  
  if (isOk(result)) {
    const variables = result.data;
    
    // Verify variables are proper value objects
    assertEquals(Array.isArray(variables), true);
    assertEquals(variables.length, 4);
    
    // Check each variable type
    const [standard, filepath, stdin, user] = variables;
    
    assertEquals(standard instanceof StandardVariable, true);
    assertEquals(filepath instanceof FilePathVariable, true); 
    assertEquals(stdin instanceof StdinVariable, true);
    assertEquals(user instanceof UserVariable, true);
    
    // Verify encapsulation - no direct access to internal properties
    assertEquals("_name" in standard, false);
    assertEquals("_value" in standard, false);
  }
});

Deno.test("2_structure: BuilderVariableError accumulation pattern", () => {
  const builder = new VariablesBuilder();
  
  // Accumulate multiple errors
  builder
    .addStandardVariable("input_text_file", "file.txt")
    .addStandardVariable("input_text_file", "duplicate.txt") // Duplicate
    .addUserVariable("no-prefix", "value") // Missing uv- prefix
    .addFilePathVariable("", "/path/to/file"); // Empty name
  
  const result = builder.build();
  
  assertEquals(isError(result), true);
  if (isError(result)) {
    const errors = result.error;
    
    // Verify error accumulation
    assertEquals(Array.isArray(errors), true);
    assertEquals(errors.length >= 2, true); // At least duplicate and prefix errors
    
    // Check error types
    const duplicateError = errors.find(e => e.kind === "DuplicateVariable");
    assertExists(duplicateError);
    if (duplicateError?.kind === "DuplicateVariable") {
      assertEquals(duplicateError.name, "input_text_file");
    }
    
    const prefixError = errors.find(e => e.kind === "InvalidPrefix");
    assertExists(prefixError);
    if (prefixError?.kind === "InvalidPrefix") {
      assertEquals(prefixError.name, "no-prefix");
      assertEquals(prefixError.expectedPrefix, "uv-");
    }
  }
});

Deno.test("2_structure: Variable name uniqueness enforcement", () => {
  const builder = new VariablesBuilder();
  
  // Add initial variable
  builder.addStandardVariable("destination_path", "/output/path");
  assertEquals(builder.hasVariable("destination_path"), true);
  
  // Try to add duplicate
  builder.addStandardVariable("destination_path", "/different/path");
  
  const result = builder.build();
  
  if (isError(result)) {
    const duplicateError = result.error.find(e => e.kind === "DuplicateVariable");
    assertExists(duplicateError);
    if (duplicateError?.kind === "DuplicateVariable") {
      assertEquals(duplicateError.name, "destination_path");
    }
  }
  
  // Verify only one variable was added
  assertEquals(builder.getVariableCount(), 1);
  assertEquals(builder.getErrorCount(), 1);
});

Deno.test("2_structure: FactoryResolvedValues integration structure", () => {
  const factoryValues: FactoryResolvedValues = {
    promptFilePath: "/prompts/template.md",
    inputFilePath: "/data/input.txt",
    outputFilePath: "/output/result.json",
    schemaFilePath: "/schemas/validation.json",
    customVariables: {
      "uv-env": "production",
      "uv-version": "1.0.0"
    },
    inputText: "stdin content"
  };
  
  const builder = VariablesBuilder.fromFactoryValues(factoryValues);
  const result = builder.build();
  
  if (isOk(result)) {
    const variables = result.data;
    assertEquals(variables.length, 6); // input, output, schema, stdin, 2 custom
    
    // Verify toRecord structure
    const record = builder.toRecord();
    assertExists(record["input_text_file"]);
    assertExists(record["destination_path"]);
    assertExists(record["schema_file"]);
    assertExists(record["input_text"]);
    assertExists(record["uv-env"]);
    assertExists(record["uv-version"]);
    
    // Verify values
    assertEquals(record["input_text_file"], "input.txt"); // basename only
    assertEquals(record["destination_path"], "/output/result.json");
    assertEquals(record["schema_file"], "/schemas/validation.json");
    assertEquals(record["input_text"], "stdin content");
    assertEquals(record["uv-env"], "production");
    assertEquals(record["uv-version"], "1.0.0");
  }
});

Deno.test("2_structure: Template record vs standard record distinction", () => {
  const builder = new VariablesBuilder();
  
  builder
    .addStandardVariable("input_text_file", "file.txt")
    .addUserVariable("uv-custom", "value");
  
  const result = builder.build();
  
  if (isOk(result)) {
    // Standard record keeps uv- prefix
    const standardRecord = builder.toRecord();
    assertExists(standardRecord["uv-custom"]);
    assertEquals(standardRecord["uv-custom"], "value");
    
    // Template record removes uv- prefix
    const templateRecord = builder.toTemplateRecord();
    assertExists(templateRecord["custom"]);
    assertEquals(templateRecord["custom"], "value");
    assertEquals("uv-custom" in templateRecord, false);
  }
});

Deno.test("2_structure: Partial factory values handling", () => {
  const builder = new VariablesBuilder();
  
  // Add partial values incrementally
  builder.addFromPartialFactoryValues({
    inputFilePath: "/input/file.md"
  });
  
  builder.addFromPartialFactoryValues({
    outputFilePath: "/output/result.txt",
    customVariables: { "uv-mode": "debug" }
  });
  
  builder.addFromPartialFactoryValues({
    schemaFilePath: "/schema.json"
  });
  
  const result = builder.build();
  
  if (isOk(result)) {
    assertEquals(result.data.length, 4); // input, output, schema, custom
    
    const record = builder.toRecord();
    assertEquals(record["input_text_file"], "file.md");
    assertEquals(record["destination_path"], "/output/result.txt");
    assertEquals(record["schema_file"], "/schema.json");
    assertEquals(record["uv-mode"], "debug");
  }
});

Deno.test("2_structure: Factory values validation", () => {
  const builder = new VariablesBuilder();
  
  // Test missing required fields
  const incompleteValues: FactoryResolvedValues = {
    promptFilePath: "", // Empty
    inputFilePath: "/input.txt",
    outputFilePath: "", // Empty
    schemaFilePath: "/schema.json",
    customVariables: {
      "invalid-var": "no prefix" // Missing uv-
    }
  };
  
  const validationResult = builder.validateFactoryValues(incompleteValues);
  
  assertEquals(isError(validationResult), true);
  if (isError(validationResult)) {
    const errors = validationResult.error;
    
    // Check for missing field errors
    const missingPrompt = errors.find(e => e.kind === "FactoryValueMissing" && e.field === "promptFilePath");
    assertExists(missingPrompt);
    
    const missingOutput = errors.find(e => e.kind === "FactoryValueMissing" && e.field === "outputFilePath");
    assertExists(missingOutput);
    
    // Check for prefix error
    const prefixError = errors.find(e => e.kind === "InvalidPrefix");
    assertExists(prefixError);
    if (prefixError?.kind === "InvalidPrefix") {
      assertEquals(prefixError.name, "invalid-var");
    }
  }
});

Deno.test("2_structure: Stdin variable special handling", () => {
  const builder = new VariablesBuilder();
  
  // First stdin
  builder.addStdinVariable("first content");
  assertEquals(builder.hasVariable("input_text"), true);
  
  // Try to add second stdin (should fail)
  builder.addStdinVariable("second content");
  
  const result = builder.build();
  
  if (isError(result)) {
    const duplicateError = result.error.find(e => e.kind === "DuplicateVariable");
    assertExists(duplicateError);
    if (duplicateError?.kind === "DuplicateVariable") {
      assertEquals(duplicateError.name, "input_text");
    }
  }
});

Deno.test("2_structure: Custom variables without uv- prefix for templates", () => {
  const builder = new VariablesBuilder();
  
  // Add custom variables for templates (no uv- prefix requirement)
  builder.addCustomVariables({
    "template_var": "value1",
    "another_var": "value2",
    "": "empty name", // Should be skipped
    "empty_value": "" // Should be skipped
  });
  
  const result = builder.build();
  
  if (isOk(result)) {
    const variables = result.data;
    assertEquals(variables.length, 2); // Only non-empty name/value pairs
    
    const record = builder.toTemplateRecord();
    assertEquals(record["template_var"], "value1");
    assertEquals(record["another_var"], "value2");
    assertEquals("" in record, false);
    assertEquals("empty_value" in record, false);
  }
});

Deno.test("2_structure: Builder state management", () => {
  const builder = new VariablesBuilder();
  
  // Add some variables
  builder
    .addStandardVariable("input_text_file", "file1.txt")
    .addUserVariable("uv-test", "value");
  
  assertEquals(builder.getVariableCount(), 2);
  assertEquals(builder.getErrorCount(), 0);
  
  // Add error
  builder.addUserVariable("no-prefix", "error");
  assertEquals(builder.getErrorCount(), 1);
  
  // Clear and verify reset
  builder.clear();
  assertEquals(builder.getVariableCount(), 0);
  assertEquals(builder.getErrorCount(), 0);
  
  // Can build successfully after clear
  const result = builder.build();
  assertEquals(isOk(result), true);
  if (isOk(result)) {
    assertEquals(result.data.length, 0);
  }
});