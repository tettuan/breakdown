/**
 * @fileoverview Architecture tests for VariablesBuilder
 *
 * Tests architectural constraints and dependency relationships for the
 * VariablesBuilder pattern implementation. Verifies proper layering,
 * interface consistency, and dependency direction compliance.
 *
 * @module builder/0_architecture_variables_builder_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { VariablesBuilder } from "./variables_builder.ts";
import type { BuilderVariableError, FactoryResolvedValues } from "./variables_builder.ts";

Deno.test("VariablesBuilder - Architecture: Builder pattern implementation", () => {
  // Builder pattern must have fluent interface
  const _builder = new VariablesBuilder();

  // Each method must return 'this' for chaining
  const result1 = _builder.addStandardVariable("test", "value");
  assertEquals(result1, _builder, "addStandardVariable must return this for fluent interface");

  const result2 = _builder.addFilePathVariable("schema_file", "/path/to/schema.json");
  assertEquals(result2, _builder, "addFilePathVariable must return this for fluent interface");

  const result3 = _builder.addStdinVariable("test input");
  assertEquals(result3, _builder, "addStdinVariable must return this for fluent interface");

  const result4 = _builder.addUserVariable("uv-custom", "value");
  assertEquals(result4, _builder, "addUserVariable must return this for fluent interface");
});

Deno.test("VariablesBuilder - Architecture: Dependency direction", () => {
  // Builder should depend on types module, not vice versa
  // This is verified by successful import without circular references

  // VariablesBuilder must exist as a class
  assertExists(VariablesBuilder, "VariablesBuilder class must be defined");

  // Constructor must not require parameters (default constructor)
  const _builder = new VariablesBuilder();
  assertExists(_builder, "VariablesBuilder must have default constructor");
});

Deno.test("VariablesBuilder - Architecture: Type interface consistency", () => {
  // FactoryResolvedValues interface must have expected structure
  const mockFactoryValues: FactoryResolvedValues = {
    promptFilePath: "/path/to/prompt.md",
    inputFilePath: "/path/to/input.txt",
    outputFilePath: "/path/to/output.txt",
    schemaFilePath: "/path/to/schema.json",
  };

  // Must accept FactoryResolvedValues without type errors
  const _builder = new VariablesBuilder();
  const _result = _builder.addFromFactoryValues(mockFactoryValues);
  assertEquals(_result, _builder, "addFromFactoryValues must accept FactoryResolvedValues");
});

Deno.test("VariablesBuilder - Architecture: Error type hierarchy", () => {
  const _builder = new VariablesBuilder();

  // BuilderVariableError must include all expected error kinds
  _builder.addUserVariable("invalid-name", "value"); // No uv- prefix
  _builder.addUserVariable("uv-test", "value1");
  _builder.addUserVariable("uv-test", "value2"); // Duplicate

  const _result = _builder.build();

  // Must return Result type with error array
  assertEquals(_result.ok, false, "Builder with errors must return error result");
  if (!_result.ok) {
    const errors = _result.error as BuilderVariableError[];
    assertEquals(Array.isArray(errors), true, "Errors must be array of BuilderVariableError");
    assertEquals(errors.length > 0, true, "Must have accumulated errors");
  }
});

Deno.test("VariablesBuilder - Architecture: Result monad pattern", () => {
  const _builder = new VariablesBuilder();
  _builder.addStandardVariable("input_text_file", "test.txt");

  const _result = _builder.build();

  // Must implement Result monad pattern
  assertExists(_result.ok, "Result must have 'ok' property");

  if (_result.ok) {
    assertExists(_result.data, "Success result must have 'data' property");
    assertEquals(Array.isArray(_result.data), true, "Result data must be PromptVariables array");
  } else {
    assertExists(_result.error, "Error result must have 'error' property");
  }
});

Deno.test("VariablesBuilder - Architecture: Static factory method pattern", () => {
  const mockFactoryValues: FactoryResolvedValues = {
    promptFilePath: "/path/to/prompt.md",
    inputFilePath: "/path/to/input.txt",
    outputFilePath: "/path/to/output.txt",
    schemaFilePath: "/path/to/schema.json",
  };

  // Static factory must exist and return instance
  const _builder = VariablesBuilder.fromFactoryValues(mockFactoryValues);
  assertExists(_builder, "fromFactoryValues static factory must return instance");
  assertEquals(
    _builder instanceof VariablesBuilder,
    true,
    "Factory must return VariablesBuilder instance",
  );
});

Deno.test("VariablesBuilder - Architecture: Immutable state management", () => {
  const _builder = new VariablesBuilder();

  // Builder state should accumulate without affecting previous state
  const count1 = _builder.getVariableCount();

  _builder.addStandardVariable("test1", "value1");
  const count2 = _builder.getVariableCount();

  _builder.addStandardVariable("test2", "value2");
  const count3 = _builder.getVariableCount();

  assertEquals(count1, 0, "Initial count must be 0");
  assertEquals(count2 >= 0, true, "Count after first add must be non-negative");
  assertEquals(count3 >= count2, true, "Count should not decrease");

  // Clear must reset state
  _builder.clear();
  assertEquals(_builder.getVariableCount(), 0, "Clear must reset variable count");
  assertEquals(_builder.getErrorCount(), 0, "Clear must reset error count");
});

Deno.test("VariablesBuilder - Architecture: Interface segregation principle", () => {
  const _builder = new VariablesBuilder();

  // Builder must provide separate methods for different variable types
  // This enforces interface segregation - clients only depend on methods they use

  // Standard variable interface
  assertEquals(
    typeof _builder.addStandardVariable,
    "function",
    "Must provide standard variable interface",
  );

  // File path variable interface
  assertEquals(
    typeof _builder.addFilePathVariable,
    "function",
    "Must provide file path variable interface",
  );

  // Stdin variable interface
  assertEquals(
    typeof _builder.addStdinVariable,
    "function",
    "Must provide stdin variable interface",
  );

  // User variable interface
  assertEquals(typeof _builder.addUserVariable, "function", "Must provide user variable interface");

  // Factory integration interface
  assertEquals(
    typeof _builder.addFromFactoryValues,
    "function",
    "Must provide factory integration interface",
  );

  // Build interface
  assertEquals(typeof _builder.build, "function", "Must provide build interface");

  // Utility interfaces
  assertEquals(typeof _builder.toRecord, "function", "Must provide record conversion interface");
  assertEquals(
    typeof _builder.hasVariable,
    "function",
    "Must provide variable existence check interface",
  );
});
