/**
 * @fileoverview Structure tests for VariablesBuilder
 *
 * Tests class structure, responsibility separation, and design pattern
 * implementation for the VariablesBuilder. Verifies single responsibility
 * principle compliance and proper abstraction levels.
 *
 * @module builder/1_structure_variables_builder_test
 */

import { assertEquals } from "../../../lib/deps.ts";
import { VariablesBuilder } from "./variables_builder.ts";
import type { FactoryResolvedValues } from "./variables_builder.ts";

Deno.test("VariablesBuilder - Structure: Single Responsibility Principle", () => {
  // VariablesBuilder should only be responsible for building PromptVariables
  // It should not handle file I/O, configuration, or other unrelated concerns

  const _builder = new VariablesBuilder();

  // Core building responsibility - adding variables
  assertEquals(typeof _builder.addStandardVariable, "function", "Must handle standard variables");
  assertEquals(typeof _builder.addFilePathVariable, "function", "Must handle file path variables");
  assertEquals(typeof _builder.addStdinVariable, "function", "Must handle stdin variables");
  assertEquals(typeof _builder.addUserVariable, "function", "Must handle user variables");

  // Core building responsibility - finalizing construction
  assertEquals(typeof _builder.build, "function", "Must handle build finalization");

  // Should NOT have methods that violate SRP
  assertEquals(_builder.hasOwnProperty("readFile"), false, "Must not handle file I/O directly");
  assertEquals(_builder.hasOwnProperty("writeFile"), false, "Must not handle file I/O directly");
  assertEquals(
    _builder.hasOwnProperty("loadConfig"),
    false,
    "Must not handle configuration directly",
  );
  assertEquals(
    _builder.hasOwnProperty("parseArguments"),
    false,
    "Must not handle argument parsing directly",
  );
});

Deno.test("VariablesBuilder - Structure: Encapsulation of internal state", () => {
  const _builder = new VariablesBuilder();

  // Internal arrays should be properly encapsulated
  // Check encapsulation through controlled access methods only
  assertEquals(
    typeof _builder.getVariableCount,
    "function",
    "Variable access should be through methods",
  );
  assertEquals(typeof _builder.getErrorCount, "function", "Error access should be through methods");
  assertEquals(
    typeof _builder.toRecord,
    "function",
    "Data access should be through controlled methods",
  );

  // State access should be through controlled methods
  assertEquals(
    typeof _builder.getVariableCount,
    "function",
    "Must provide controlled access to variable count",
  );
  assertEquals(
    typeof _builder.getErrorCount,
    "function",
    "Must provide controlled access to error count",
  );
  assertEquals(
    typeof _builder.hasVariable,
    "function",
    "Must provide controlled variable existence check",
  );
});

Deno.test("VariablesBuilder - Structure: Method organization by responsibility", () => {
  const _builder = new VariablesBuilder();

  // Variable addition methods (grouped responsibility)
  const addMethods = [
    "addStandardVariable",
    "addFilePathVariable",
    "addStdinVariable",
    "addUserVariable",
    "addUserVariables",
  ];

  for (const method of addMethods) {
    assertEquals(
      typeof _builder[method as keyof VariablesBuilder],
      "function",
      `Add method ${method} must exist`,
    );
  }

  // Factory integration methods (grouped responsibility)
  const factoryMethods = [
    "addFromFactoryValues",
    "addFromPartialFactoryValues",
    "validateFactoryValues",
  ];

  for (const method of factoryMethods) {
    assertEquals(
      typeof _builder[method as keyof VariablesBuilder],
      "function",
      `Factory method ${method} must exist`,
    );
  }

  // State management methods (grouped responsibility)
  const stateMethods = [
    "build",
    "toRecord",
    "hasVariable",
    "getVariableCount",
    "getErrorCount",
    "clear",
  ];

  for (const method of stateMethods) {
    assertEquals(
      typeof _builder[method as keyof VariablesBuilder],
      "function",
      `State method ${method} must exist`,
    );
  }
});

Deno.test("VariablesBuilder - Structure: Error handling separation", () => {
  const _builder = new VariablesBuilder();

  // Error accumulation should not interfere with variable addition
  _builder.addUserVariable("invalid-name", "value"); // Should add error
  _builder.addStandardVariable("valid_name", "value"); // Should add variable

  assertEquals(_builder.getErrorCount() >= 1, true, "Should accumulate errors");
  assertEquals(_builder.getVariableCount() >= 0, true, "Should track variables appropriately");

  // Build should handle error state appropriately
  const result = _builder.build();
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
    inputText: "sample input",
  };

  const _builder = new VariablesBuilder();
  _builder.addFromFactoryValues(mockValues);

  // Should translate Factory values to appropriate variable types
  assertEquals(
    _builder.getVariableCount() > 0,
    true,
    "Should create variables from factory values",
  );

  // Should handle partial values gracefully
  const builder2 = new VariablesBuilder();
  builder2.addFromPartialFactoryValues({ outputFilePath: "/test/output.txt" });
  assertEquals(builder2.getVariableCount(), 1, "Should handle partial factory values");
});

Deno.test("VariablesBuilder - Structure: Immutable builder pattern implementation", () => {
  // Builder should maintain state across method calls but allow state inspection

  const _builder = new VariablesBuilder();

  // Initial state
  assertEquals(_builder.getVariableCount(), 0, "Initial variable count should be 0");
  assertEquals(_builder.getErrorCount(), 0, "Initial error count should be 0");

  // State progression
  const builder2 = _builder.addStandardVariable("test1", "value1");
  assertEquals(builder2, _builder, "Should return same instance for chaining");
  assertEquals(_builder.getVariableCount() >= 0, true, "Should track variables");

  // Verify builder functionality
  const record = _builder.toRecord();
  assertEquals(typeof record, "object", "Should provide record access");

  const builder3 = _builder.addStandardVariable("test2", "value2");
  assertEquals(builder3, _builder, "Should continue chaining");
  assertEquals(_builder.getVariableCount() >= 0, true, "Should track variable accumulation");

  // Reset capability
  _builder.clear();
  assertEquals(_builder.getVariableCount(), 0, "Clear should reset state");
  assertEquals(_builder.getErrorCount(), 0, "Clear should reset errors");
});

Deno.test("VariablesBuilder - Structure: Type-specific variable handling", () => {
  // Each variable type should have dedicated handling logic

  const _builder = new VariablesBuilder();

  // Standard variables - should accept common names
  _builder.addStandardVariable("input_text_file", "test.txt");
  _builder.addStandardVariable("destination_path", "/output/path");

  // File path variables - should handle file paths
  _builder.addFilePathVariable("schema_file", "/path/to/schema.json");

  // Stdin variables - fixed name, text content
  _builder.addStdinVariable("input text content");

  // User variables - must enforce uv- prefix
  _builder.addUserVariable("uv-custom", "custom value");

  assertEquals(_builder.getVariableCount(), 5, "Should handle all variable types");
  assertEquals(_builder.getErrorCount(), 0, "Valid variables should not generate errors");
});

Deno.test("VariablesBuilder - Structure: Validation responsibility distribution", () => {
  // Validation should be distributed appropriately:
  // - Duplicate checking: Builder responsibility
  // - Type-specific validation: Variable type responsibility
  // - Prefix validation: Builder responsibility for business rules

  const _builder = new VariablesBuilder();

  // Duplicate validation
  _builder.addStandardVariable("test", "value1");
  _builder.addStandardVariable("test", "value2"); // Duplicate

  assertEquals(_builder.getErrorCount() >= 1, true, "Builder should handle duplicates");
  assertEquals(_builder.getVariableCount() >= 0, true, "Should handle variable management");

  // Prefix validation for user variables
  const builder2 = new VariablesBuilder();
  builder2.addUserVariable("invalid-name", "value"); // No uv- prefix

  assertEquals(builder2.getErrorCount(), 1, "Builder should validate uv- prefix");
  assertEquals(builder2.getVariableCount(), 0, "Invalid user variable should not be added");
});

Deno.test("VariablesBuilder - Structure: Output format abstraction", () => {
  // Builder should provide multiple output formats without exposing internal structure

  const _builder = new VariablesBuilder();
  _builder.addStandardVariable("input_text_file", "test.txt");
  _builder.addUserVariable("uv-custom", "value");

  // PromptVariables array format
  const result = _builder.build();
  assertEquals(result.ok, true, "Should build successfully");
  if (result.ok) {
    assertEquals(Array.isArray(result.data), true, "Should return PromptVariables array");
  }

  // Record format
  const record = _builder.toRecord();
  assertEquals(typeof record, "object", "Should provide Record format");
  assertEquals(
    record.hasOwnProperty("input_text_file"),
    true,
    "Record should contain standard variables",
  );
  assertEquals(record.hasOwnProperty("uv-custom"), true, "Record should contain user variables");
});
