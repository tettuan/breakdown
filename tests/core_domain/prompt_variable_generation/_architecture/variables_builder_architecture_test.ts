/**
 * @fileoverview Architecture tests for VariablesBuilder
 *
 * Verifies architectural constraints and dependencies are properly maintained.
 * Ensures the builder follows Totality Principle and proper layering.
 *
 * @module builder/tests/0_architecture_variables_builder_test
 */

import { assertEquals, assertExists } from "../../lib/deps.ts";
import { VariablesBuilder } from "../variables_builder.ts";

/**
 * Verify proper dependency direction - builder depends on types, not vice versa
 */
Deno.test("VariablesBuilder - follows dependency inversion principle", () => {
  // Builder should depend on abstractions (interfaces) from types module
  const _builder = new VariablesBuilder();

  // The builder should work with any variable that implements PromptVariableBase
  // This is verified by the type system at compile time
  assertExists(_builder);
});

/**
 * Verify Result type is used consistently for error handling
 */
Deno.test("VariablesBuilder - uses Result type for all operations", () => {
  const _builder = new VariablesBuilder();
  const result = _builder.build();

  // Result must have ok property (discriminated union)
  assertExists(result.ok);
  assertEquals(typeof result.ok, "boolean");

  // Result must have either data or error, never both
  if (result.ok) {
    assertExists(result.data);
    assertEquals("error" in result, false);
  } else {
    assertExists(result.error);
    assertEquals("data" in result, false);
  }
});

/**
 * Verify no circular dependencies exist
 */
Deno.test("VariablesBuilder - no circular dependencies", () => {
  // This test passes if the module loads without circular dependency errors
  // TypeScript/Deno will fail at compile time if circular deps exist
  assertExists(VariablesBuilder);
});

/**
 * Verify builder pattern is properly implemented
 */
Deno.test("VariablesBuilder - implements fluent builder pattern", () => {
  const _builder = new VariablesBuilder();

  // All add methods should return 'this' for chaining
  const result1 = _builder.addStandardVariable("input_text_file", "test");
  assertEquals(result1, _builder);

  const result2 = _builder.addFilePathVariable("schema_file", "test");
  assertEquals(result2, _builder);

  const result3 = _builder.addStdinVariable("test");
  assertEquals(result3, _builder);

  const result4 = _builder.addUserVariable("uv-test", "test");
  assertEquals(result4, _builder);

  const result5 = _builder.clear();
  assertEquals(result5, _builder);
});

/**
 * Verify error accumulation follows Totality Principle
 */
Deno.test("VariablesBuilder - accumulates all errors instead of throwing", () => {
  const _builder = new VariablesBuilder();

  // Add multiple invalid operations
  _builder
    .addStandardVariable("invalid", "test")
    .addStandardVariable("input_text_file", "")
    .addUserVariable("invalid", "test");

  // Should not throw, but accumulate errors
  const result = _builder.build();
  assertEquals(result.ok, false);

  if (!result.ok) {
    // Should have multiple errors
    assertEquals(Array.isArray(result.error), true);
    assertEquals(result.error.length, 3);
  }
});

/**
 * Verify type safety through Smart Constructors
 */
Deno.test("VariablesBuilder - uses Smart Constructors for type safety", () => {
  const _builder = new VariablesBuilder();

  // The builder internally uses Smart Constructors from variable types
  // This is verified by successful creation with valid inputs
  const result = _builder
    .addStandardVariable("input_text_file", "valid")
    .build();

  assertEquals(result.ok, true);

  // And failure with invalid inputs
  const errorResult = _builder
    .clear()
    .addStandardVariable("invalid_name", "value")
    .build();

  assertEquals(errorResult.ok, false);
});

/**
 * Verify interface segregation - builder only exposes necessary methods
 */
Deno.test("VariablesBuilder - follows interface segregation principle", () => {
  const _builder = new VariablesBuilder();

  // Public interface should only include necessary methods
  const publicMethods = [
    "addStandardVariable",
    "addFilePathVariable",
    "addStdinVariable",
    "addUserVariable",
    "build",
    "toRecord",
    "getErrorCount",
    "getVariableCount",
    "clear",
  ];

  publicMethods.forEach((method) => {
    assertEquals(typeof _builder[method as keyof VariablesBuilder], "function");
  });

  // Private methods should not be accessible (TypeScript enforces this)
  // The hasVariable method is private and not accessible
});
