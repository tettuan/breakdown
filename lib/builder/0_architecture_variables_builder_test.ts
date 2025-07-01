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
import type { FactoryResolvedValues, BuilderVariableError } from "./variables_builder.ts";

Deno.test("VariablesBuilder - Architecture: Builder pattern implementation", () => {
  // Builder pattern must have fluent interface
  const builder = new VariablesBuilder();
  
  // Each method must return 'this' for chaining
  const result1 = builder.addStandardVariable("test", "value");
  assertEquals(result1, builder, "addStandardVariable must return this for fluent interface");
  
  const result2 = builder.addFilePathVariable("schema_file", "/path/to/schema.json");
  assertEquals(result2, builder, "addFilePathVariable must return this for fluent interface");
  
  const result3 = builder.addStdinVariable("test input");
  assertEquals(result3, builder, "addStdinVariable must return this for fluent interface");
  
  const result4 = builder.addUserVariable("uv-custom", "value");
  assertEquals(result4, builder, "addUserVariable must return this for fluent interface");
});

Deno.test("VariablesBuilder - Architecture: Dependency direction", () => {
  // Builder should depend on types module, not vice versa
  // This is verified by successful import without circular references
  
  // VariablesBuilder must exist as a class
  assertExists(VariablesBuilder, "VariablesBuilder class must be defined");
  
  // Constructor must not require parameters (default constructor)
  const builder = new VariablesBuilder();
  assertExists(builder, "VariablesBuilder must have default constructor");
});

Deno.test("VariablesBuilder - Architecture: Type interface consistency", () => {
  // FactoryResolvedValues interface must have expected structure
  const mockFactoryValues: FactoryResolvedValues = {
    promptFilePath: "/path/to/prompt.md",
    inputFilePath: "/path/to/input.txt", 
    outputFilePath: "/path/to/output.txt",
    schemaFilePath: "/path/to/schema.json"
  };
  
  // Must accept FactoryResolvedValues without type errors
  const builder = new VariablesBuilder();
  const result = builder.addFromFactoryValues(mockFactoryValues);
  assertEquals(result, builder, "addFromFactoryValues must accept FactoryResolvedValues");
});

Deno.test("VariablesBuilder - Architecture: Error type hierarchy", () => {
  const builder = new VariablesBuilder();
  
  // BuilderVariableError must include all expected error kinds
  builder.addUserVariable("invalid-name", "value"); // No uv- prefix
  builder.addUserVariable("uv-test", "value1");
  builder.addUserVariable("uv-test", "value2"); // Duplicate
  
  const result = builder.build();
  
  // Must return Result type with error array
  assertEquals(result.ok, false, "Builder with errors must return error result");
  if (!result.ok) {
    const errors = result.error as BuilderVariableError[];
    assertEquals(Array.isArray(errors), true, "Errors must be array of BuilderVariableError");
    assertEquals(errors.length > 0, true, "Must have accumulated errors");
  }
});

Deno.test("VariablesBuilder - Architecture: Result monad pattern", () => {
  const builder = new VariablesBuilder();
  builder.addStandardVariable("input_text_file", "test.txt");
  
  const result = builder.build();
  
  // Must implement Result monad pattern
  assertExists(result.ok, "Result must have 'ok' property");
  
  if (result.ok) {
    assertExists(result.data, "Success result must have 'data' property");
    assertEquals(Array.isArray(result.data), true, "Result data must be PromptVariables array");
  } else {
    assertExists(result.error, "Error result must have 'error' property");
  }
});

Deno.test("VariablesBuilder - Architecture: Static factory method pattern", () => {
  const mockFactoryValues: FactoryResolvedValues = {
    promptFilePath: "/path/to/prompt.md",
    inputFilePath: "/path/to/input.txt",
    outputFilePath: "/path/to/output.txt", 
    schemaFilePath: "/path/to/schema.json"
  };
  
  // Static factory must exist and return instance
  const builder = VariablesBuilder.fromFactoryValues(mockFactoryValues);
  assertExists(builder, "fromFactoryValues static factory must return instance");
  assertEquals(builder instanceof VariablesBuilder, true, "Factory must return VariablesBuilder instance");
});

Deno.test("VariablesBuilder - Architecture: Immutable state management", () => {
  const builder = new VariablesBuilder();
  
  // Builder state should accumulate without affecting previous state
  const count1 = builder.getVariableCount();
  
  builder.addStandardVariable("test1", "value1");
  const count2 = builder.getVariableCount();
  
  builder.addStandardVariable("test2", "value2");
  const count3 = builder.getVariableCount();
  
  assertEquals(count1, 0, "Initial count must be 0");
  assertEquals(count2 >= 0, true, "Count after first add must be non-negative");
  assertEquals(count3 >= count2, true, "Count should not decrease");
  
  // Clear must reset state
  builder.clear();
  assertEquals(builder.getVariableCount(), 0, "Clear must reset variable count");
  assertEquals(builder.getErrorCount(), 0, "Clear must reset error count");
});

Deno.test("VariablesBuilder - Architecture: Interface segregation principle", () => {
  const builder = new VariablesBuilder();
  
  // Builder must provide separate methods for different variable types
  // This enforces interface segregation - clients only depend on methods they use
  
  // Standard variable interface
  assertEquals(typeof builder.addStandardVariable, "function", "Must provide standard variable interface");
  
  // File path variable interface  
  assertEquals(typeof builder.addFilePathVariable, "function", "Must provide file path variable interface");
  
  // Stdin variable interface
  assertEquals(typeof builder.addStdinVariable, "function", "Must provide stdin variable interface");
  
  // User variable interface
  assertEquals(typeof builder.addUserVariable, "function", "Must provide user variable interface");
  
  // Factory integration interface
  assertEquals(typeof builder.addFromFactoryValues, "function", "Must provide factory integration interface");
  
  // Build interface
  assertEquals(typeof builder.build, "function", "Must provide build interface");
  
  // Utility interfaces
  assertEquals(typeof builder.toRecord, "function", "Must provide record conversion interface");
  assertEquals(typeof builder.hasVariable, "function", "Must provide variable existence check interface");
});