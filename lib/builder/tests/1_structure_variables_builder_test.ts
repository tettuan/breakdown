/**
 * @fileoverview Structure tests for VariablesBuilder
 *
 * Verifies class structure, responsibility separation, and proper abstraction levels.
 * Ensures single responsibility principle and cohesion are maintained.
 *
 * @module builder/tests/1_structure_variables_builder_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { VariablesBuilder } from "../variables_builder.ts";

/**
 * Verify single responsibility - builder only builds, doesn't validate internals
 */
Deno.test("VariablesBuilder - maintains single responsibility", () => {
  const _builder = new VariablesBuilder();

  // Builder delegates validation to variable types' Smart Constructors
  // It only orchestrates the building process
  const _result = builder
    .addStandardVariable("invalid", "value")
    .build();

  // Builder captures the error but doesn't perform validation itself
  assertEquals(_result.ok, false);
});

/**
 * Verify proper separation of concerns
 */
Deno.test("VariablesBuilder - separates building from validation", () => {
  const _builder = new VariablesBuilder();

  // Adding variables doesn't immediately fail
  builder
    .addStandardVariable("wrong", "value")
    .addUserVariable("wrong", "value");

  // Errors are only revealed during build
  const _result = _builder.build();
  assertEquals(_result.ok, false);

  // This separation allows for error accumulation
  if (!_result.ok) {
    assertEquals(_result.error.length, 2);
  }
});

/**
 * Verify error types are well-structured and comprehensive
 */
Deno.test("VariablesBuilder - error types cover all failure modes", () => {
  // Error types should be discriminated unions
  // The following error kinds are supported:
  // - InvalidName
  // - EmptyValue
  // - InvalidValue
  // - FileNotFound
  // - InvalidPattern
  // - DuplicateVariable
  // - InvalidPrefix

  // Each error kind should have appropriate context
  const _builder = new VariablesBuilder();

  // Test InvalidName error structure
  _builder.addStandardVariable("wrong", "value");
  const result1 = _builder.build();
  if (!_result1.ok) {
    const error = result1.error[0];
    assertEquals(error.kind, "InvalidName");
    if (error.kind === "InvalidName") {
      assertExists(error.name);
      assertExists(error.validNames);
    }
  }

  // Test EmptyValue error structure
  _builder.clear().addStandardVariable("input_text_file", "");
  const result2 = _builder.build();
  if (!_result2.ok) {
    const error = result2.error[0];
    assertEquals(error.kind, "EmptyValue");
    if (error.kind === "EmptyValue") {
      assertExists(error.variableName);
    }
  }
});

/**
 * Verify methods have appropriate granularity
 */
Deno.test("VariablesBuilder - methods have single clear purpose", () => {
  const _builder = new VariablesBuilder();

  // Each add method handles one variable type
  // This is good separation - not too fine, not too coarse

  // Standard variables
  assertEquals(typeof _builder.addStandardVariable, "function");

  // File path variables
  assertEquals(typeof _builder.addFilePathVariable, "function");

  // Stdin variables
  assertEquals(typeof _builder.addStdinVariable, "function");

  // User variables
  assertEquals(typeof _builder.addUserVariable, "function");

  // Utility methods also have clear single purposes
  assertEquals(typeof _builder.build, "function");
  assertEquals(typeof _builder.toRecord, "function");
  assertEquals(typeof _builder.clear, "function");
});

/**
 * Verify state management is encapsulated properly
 */
Deno.test("VariablesBuilder - encapsulates internal state", () => {
  const _builder = new VariablesBuilder();

  // TypeScript private fields exist at runtime but shouldn't be accessed
  // The fact that they're private is enforced at compile time
  // deno-lint-ignore no-explicit-any
  const builderAny = builder as unknown;

  // Private fields exist but should not be used directly
  assertExists(builderAny.variables);
  assertExists(builderAny.errors);

  // Verify they are arrays (implementation detail)
  assertEquals(Array.isArray(builderAny.variables), true);
  assertEquals(Array.isArray(builderAny.errors), true);

  // State is only accessible through proper methods
  assertEquals(typeof _builder.getVariableCount(), "number");
  assertEquals(typeof _builder.getErrorCount(), "number");
});

/**
 * Verify builder provides consistent interface for all variable types
 */
Deno.test("VariablesBuilder - consistent interface across variable types", () => {
  const _builder = new VariablesBuilder();

  // All add methods follow same pattern: (name, value) => this
  // Except stdin which only needs value
  const standard = _builder.addStandardVariable("input_text_file", "value");
  assertEquals(standard, builder);

  const filePath = _builder.addFilePathVariable("schema_file", "value");
  assertEquals(filePath, builder);

  const stdin = _builder.addStdinVariable("value");
  assertEquals(stdin, builder);

  const user = _builder.addUserVariable("uv-test", "value");
  assertEquals(user, builder);
});

/**
 * Verify cohesion - all methods work together towards building variables
 */
Deno.test("VariablesBuilder - high cohesion in functionality", () => {
  const _builder = new VariablesBuilder();

  // All methods contribute to the building process
  builder
    .addStandardVariable("input_text_file", "input.txt")
    .addFilePathVariable("schema_file", "schema.json");

  // Intermediate state queries
  assertEquals(_builder.getVariableCount(), 2);
  assertEquals(_builder.getErrorCount(), 0);

  // Final build uses accumulated state
  const _result = _builder.build();
  assertEquals(_result.ok, true);

  // toRecord uses the built variables
  const record = _builder.toRecord();
  assertEquals(Object.keys(record).length, 2);
});

/**
 * Verify no responsibility overlap with variable types
 */
Deno.test("VariablesBuilder - delegates validation to variable types", () => {
  const _builder = new VariablesBuilder();

  // Builder doesn't duplicate validation logic from variable types
  // It only checks for basics like empty values and duplicates

  // Basic validation in builder
  _builder.addStandardVariable("input_text_file", "");
  const result1 = _builder.build();
  if (!_result1.ok) {
    assertEquals(result1.error[0].kind, "EmptyValue");
  }

  // Name validation delegated to variable type
  _builder.clear().addStandardVariable("invalid_name", "value");
  const result2 = _builder.build();
  if (!_result2.ok) {
    assertEquals(result2.error[0].kind, "InvalidName");
  }
});
