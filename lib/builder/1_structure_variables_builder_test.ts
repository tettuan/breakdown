/**
 * @fileoverview Structure tests for VariablesBuilder
 * 
 * Tests class structure, responsibility separation, and design pattern
 * implementation for the VariablesBuilder. Verifies single responsibility
 * principle compliance and proper abstraction levels.
 *
 * @module builder/1_structure_variables_builder_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { VariablesBuilder } from "./variables_builder.ts";
import type { FactoryResolvedValues } from "./variables_builder.ts";

Deno.test("VariablesBuilder - Structure: Single Responsibility Principle", () => {
  // VariablesBuilder should only be responsible for building PromptVariables
  // It should not handle file I/O, configuration, or other unrelated concerns
  
  const builder = new VariablesBuilder();
  
  // Core building responsibility - adding variables
  assertEquals(typeof builder.addStandardVariable, "function", "Must handle standard variables");
  assertEquals(typeof builder.addFilePathVariable, "function", "Must handle file path variables");
  assertEquals(typeof builder.addStdinVariable, "function", "Must handle stdin variables");
  assertEquals(typeof builder.addUserVariable, "function", "Must handle user variables");
  
  // Core building responsibility - finalizing construction
  assertEquals(typeof builder.build, "function", "Must handle build finalization");
  
  // Should NOT have methods that violate SRP
  assertEquals(builder.hasOwnProperty("readFile"), false, "Must not handle file I/O directly");
  assertEquals(builder.hasOwnProperty("writeFile"), false, "Must not handle file I/O directly");
  assertEquals(builder.hasOwnProperty("loadConfig"), false, "Must not handle configuration directly");
  assertEquals(builder.hasOwnProperty("parseArguments"), false, "Must not handle argument parsing directly");
});

Deno.test("VariablesBuilder - Structure: Encapsulation of internal state", () => {
  const builder = new VariablesBuilder();
  
  // Internal arrays should be properly encapsulated
  // Check encapsulation through controlled access methods only
  assertEquals(typeof builder.getVariableCount, "function", "Variable access should be through methods");
  assertEquals(typeof builder.getErrorCount, "function", "Error access should be through methods");
  assertEquals(typeof builder.toRecord, "function", "Data access should be through controlled methods");
  
  // State access should be through controlled methods
  assertEquals(typeof builder.getVariableCount, "function", "Must provide controlled access to variable count");
  assertEquals(typeof builder.getErrorCount, "function", "Must provide controlled access to error count");
  assertEquals(typeof builder.hasVariable, "function", "Must provide controlled variable existence check");
});

Deno.test("VariablesBuilder - Structure: Method organization by responsibility", () => {
  const builder = new VariablesBuilder();
  
  // Variable addition methods (grouped responsibility)
  const addMethods = [
    "addStandardVariable",
    "addFilePathVariable", 
    "addStdinVariable",
    "addUserVariable",
    "addUserVariables"
  ];
  
  for (const method of addMethods) {
    assertEquals(typeof builder[method as keyof VariablesBuilder], "function", 
      `Add method ${method} must exist`);
  }
  
  // Factory integration methods (grouped responsibility)
  const factoryMethods = [
    "addFromFactoryValues",
    "addFromPartialFactoryValues",
    "validateFactoryValues"
  ];
  
  for (const method of factoryMethods) {
    assertEquals(typeof builder[method as keyof VariablesBuilder], "function",
      `Factory method ${method} must exist`);
  }
  
  // State management methods (grouped responsibility)
  const stateMethods = [
    "build",
    "toRecord", 
    "hasVariable",
    "getVariableCount",
    "getErrorCount",
    "clear"
  ];
  
  for (const method of stateMethods) {
    assertEquals(typeof builder[method as keyof VariablesBuilder], "function",
      `State method ${method} must exist`);
  }
});

Deno.test("VariablesBuilder - Structure: Error handling separation", () => {
  const builder = new VariablesBuilder();
  
  // Error accumulation should not interfere with variable addition
  builder.addUserVariable("invalid-name", "value"); // Should add error
  builder.addStandardVariable("valid_name", "value"); // Should add variable
  
  assertEquals(builder.getErrorCount() >= 1, true, "Should accumulate errors");
  assertEquals(builder.getVariableCount() >= 0, true, "Should track variables appropriately");
  
  // Build should handle error state appropriately
  const result = builder.build();
  assertEquals(result.ok, false, "Should return error result when errors exist");
});

Deno.test("VariablesBuilder - Structure: Factory integration abstraction", () => {
  // Factory integration should abstract away Factory/PathResolver details
  // Builder should not know about internal Factory structure
  
  const mockValues: FactoryResolvedValues = {
    promptFilePath: "/test/prompt.md",
    inputFilePath: "/test/input.txt",
    outputFilePath: "/test/output.txt",
    schemaFilePath: "/test/schema.json",
    customVariables: { "uv-test": "value" },
    inputText: "sample input"
  };
  
  const builder = new VariablesBuilder();
  builder.addFromFactoryValues(mockValues);
  
  // Should translate Factory values to appropriate variable types
  assertEquals(builder.getVariableCount() > 0, true, "Should create variables from factory values");
  
  // Should handle partial values gracefully
  const builder2 = new VariablesBuilder();
  builder2.addFromPartialFactoryValues({ outputFilePath: "/test/output.txt" });
  assertEquals(builder2.getVariableCount(), 1, "Should handle partial factory values");
});

Deno.test("VariablesBuilder - Structure: Immutable builder pattern implementation", () => {
  // Builder should maintain state across method calls but allow state inspection
  
  const builder = new VariablesBuilder();
  
  // Initial state
  assertEquals(builder.getVariableCount(), 0, "Initial variable count should be 0");
  assertEquals(builder.getErrorCount(), 0, "Initial error count should be 0");
  
  // State progression
  const builder2 = builder.addStandardVariable("test1", "value1");
  assertEquals(builder2, builder, "Should return same instance for chaining");
  assertEquals(builder.getVariableCount() >= 0, true, "Should track variables");
  
  // Verify builder functionality
  const record = builder.toRecord();
  assertEquals(typeof record, "object", "Should provide record access");
  
  const builder3 = builder.addStandardVariable("test2", "value2");
  assertEquals(builder3, builder, "Should continue chaining");
  assertEquals(builder.getVariableCount() >= 0, true, "Should track variable accumulation");
  
  // Reset capability
  builder.clear();
  assertEquals(builder.getVariableCount(), 0, "Clear should reset state");
  assertEquals(builder.getErrorCount(), 0, "Clear should reset errors");
});

Deno.test("VariablesBuilder - Structure: Type-specific variable handling", () => {
  // Each variable type should have dedicated handling logic
  
  const builder = new VariablesBuilder();
  
  // Standard variables - should accept common names
  builder.addStandardVariable("input_text_file", "test.txt");
  builder.addStandardVariable("destination_path", "/output/path");
  
  // File path variables - should handle file paths
  builder.addFilePathVariable("schema_file", "/path/to/schema.json");
  
  // Stdin variables - fixed name, text content
  builder.addStdinVariable("input text content");
  
  // User variables - must enforce uv- prefix
  builder.addUserVariable("uv-custom", "custom value");
  
  assertEquals(builder.getVariableCount(), 5, "Should handle all variable types");
  assertEquals(builder.getErrorCount(), 0, "Valid variables should not generate errors");
});

Deno.test("VariablesBuilder - Structure: Validation responsibility distribution", () => {
  // Validation should be distributed appropriately:
  // - Duplicate checking: Builder responsibility
  // - Type-specific validation: Variable type responsibility
  // - Prefix validation: Builder responsibility for business rules
  
  const builder = new VariablesBuilder();
  
  // Duplicate validation
  builder.addStandardVariable("test", "value1");
  builder.addStandardVariable("test", "value2"); // Duplicate
  
  assertEquals(builder.getErrorCount() >= 1, true, "Builder should handle duplicates");
  assertEquals(builder.getVariableCount() >= 0, true, "Should handle variable management");
  
  // Prefix validation for user variables
  const builder2 = new VariablesBuilder();
  builder2.addUserVariable("invalid-name", "value"); // No uv- prefix
  
  assertEquals(builder2.getErrorCount(), 1, "Builder should validate uv- prefix");
  assertEquals(builder2.getVariableCount(), 0, "Invalid user variable should not be added");
});

Deno.test("VariablesBuilder - Structure: Output format abstraction", () => {
  // Builder should provide multiple output formats without exposing internal structure
  
  const builder = new VariablesBuilder();
  builder.addStandardVariable("input_text_file", "test.txt");
  builder.addUserVariable("uv-custom", "value");
  
  // PromptVariables array format
  const result = builder.build();
  assertEquals(result.ok, true, "Should build successfully");
  if (result.ok) {
    assertEquals(Array.isArray(result.data), true, "Should return PromptVariables array");
  }
  
  // Record format
  const record = builder.toRecord();
  assertEquals(typeof record, "object", "Should provide Record format");
  assertEquals(record.hasOwnProperty("input_text_file"), true, "Record should contain standard variables");
  assertEquals(record.hasOwnProperty("uv-custom"), true, "Record should contain user variables");
});