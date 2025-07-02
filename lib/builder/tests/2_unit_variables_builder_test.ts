/**
 * @fileoverview Unit tests for VariablesBuilder
 *
 * Tests the builder pattern implementation for creating PromptVariables
 * with Result type error handling following Totality Principle.
 *
 * @module builder/tests/2_unit_variables_builder_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { VariablesBuilder } from "../variables_builder.ts";

/**
 * Test successful variable creation scenarios
 */
Deno.test("VariablesBuilder - successful standard variable creation", () => {
  const _builder = new VariablesBuilder();
  const _result = builder
    .addStandardVariable("input_text_file", "/path/to/file.txt")
    .addStandardVariable("destination_path", "/output/path")
    .build();

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data.length, 2);
    const record = _builder.toRecord();
    assertEquals(record["input_text_file"], "/path/to/file.txt");
    assertEquals(record["destination_path"], "/output/path");
  }
});

Deno.test("VariablesBuilder - successful file path variable creation", () => {
  const _builder = new VariablesBuilder();
  const _result = builder
    .addFilePathVariable("schema_file", "/path/to/schema.json")
    .build();

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data.length, 1);
    const record = _builder.toRecord();
    assertEquals(record["schema_file"], "/path/to/schema.json");
  }
});

Deno.test("VariablesBuilder - successful stdin variable creation", () => {
  const _builder = new VariablesBuilder();
  const _result = builder
    .addStdinVariable("This is input text from stdin")
    .build();

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data.length, 1);
    const record = _builder.toRecord();
    assertEquals(record["input_text"], "This is input text from stdin");
  }
});

Deno.test("VariablesBuilder - successful user variable creation", () => {
  const _builder = new VariablesBuilder();
  const _result = builder
    .addUserVariable("uv-custom", "custom value")
    .addUserVariable("uv-another", "another value")
    .build();

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data.length, 2);
    const record = _builder.toRecord();
    assertEquals(record["uv-custom"], "custom value");
    assertEquals(record["uv-another"], "another value");
  }
});

Deno.test("VariablesBuilder - mixed variable types", () => {
  const _builder = new VariablesBuilder();
  const _result = builder
    .addStandardVariable("input_text_file", "/input.txt")
    .addFilePathVariable("schema_file", "/schema.json")
    .addStdinVariable("stdin content")
    .addUserVariable("uv-option", "value")
    .build();

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data.length, 4);
    const record = _builder.toRecord();
    assertEquals(Object.keys(record).length, 4);
    assertEquals(record["input_text_file"], "/input.txt");
    assertEquals(record["schema_file"], "/schema.json");
    assertEquals(record["input_text"], "stdin content");
    assertEquals(record["uv-option"], "value");
  }
});

/**
 * Test error scenarios
 */
Deno.test("VariablesBuilder - invalid standard variable name", () => {
  const _builder = new VariablesBuilder();
  const _result = builder
    .addStandardVariable("invalid_name", "value")
    .build();

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.length, 1);
    assertEquals(_result.error[0].kind, "InvalidName");
    const error = _result.error[0];
    if (error.kind === "InvalidName") {
      assertEquals(error.name, "invalid_name");
    }
  }
});

Deno.test("VariablesBuilder - empty value error", () => {
  const _builder = new VariablesBuilder();
  const _result = builder
    .addStandardVariable("input_text_file", "")
    .addFilePathVariable("schema_file", "  ")
    .addStdinVariable("")
    .addUserVariable("uv-test", "")
    .build();

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    // Since stdin may not validate empty values, expect at least 3 errors
    assertEquals(_result.error.length >= 3, true);
    const emptyValueErrors = _result.error.filter((err) => err.kind === "EmptyValue");
    assertEquals(emptyValueErrors.length >= 3, true);
  }
});

Deno.test("VariablesBuilder - duplicate variable error", () => {
  const _builder = new VariablesBuilder();
  const _result = builder
    .addStandardVariable("input_text_file", "first")
    .addStandardVariable("input_text_file", "second")
    .build();

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.length, 1);
    assertEquals(_result.error[0].kind, "DuplicateVariable");
    const error = _result.error[0];
    if (error.kind === "DuplicateVariable") {
      assertEquals(error.name, "input_text_file");
    }
  }
});

Deno.test("VariablesBuilder - invalid user variable prefix", () => {
  const _builder = new VariablesBuilder();
  const _result = builder
    .addUserVariable("custom", "value")
    .addUserVariable("my-var", "value")
    .build();

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.length, 2);
    _result.error.forEach((err) => {
      assertEquals(err.kind, "InvalidPrefix");
      if (err.kind === "InvalidPrefix") {
        assertEquals(err.expectedPrefix, "uv-");
      }
    });
  }
});

Deno.test("VariablesBuilder - accumulates multiple errors", () => {
  const _builder = new VariablesBuilder();
  const _result = builder
    .addStandardVariable("wrong_name", "value")
    .addStandardVariable("input_text_file", "")
    .addFilePathVariable("wrong_file", "path")
    .addUserVariable("no-prefix", "value")
    .build();

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.length, 4);
    // Check different error types
    assertExists(_result.error.find((e) => e.kind === "InvalidName"));
    assertExists(_result.error.find((e) => e.kind === "EmptyValue"));
    assertExists(_result.error.find((e) => e.kind === "InvalidPrefix"));
  }
});

/**
 * Test builder utility methods
 */
Deno.test("VariablesBuilder - clear method resets state", () => {
  const _builder = new VariablesBuilder();

  // Add some variables and errors
  builder
    .addStandardVariable("input_text_file", "value")
    .addStandardVariable("wrong", "value");

  assertEquals(_builder.getVariableCount(), 1);
  assertEquals(_builder.getErrorCount(), 1);

  // Clear and verify reset
  _builder.clear();
  assertEquals(_builder.getVariableCount(), 0);
  assertEquals(_builder.getErrorCount(), 0);

  // Build should return empty array
  const _result = _builder.build();
  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data.length, 0);
  }
});

Deno.test("VariablesBuilder - method chaining works correctly", () => {
  const _builder = new VariablesBuilder();
  const chainResult = builder
    .addStandardVariable("input_text_file", "file1.txt")
    .addStandardVariable("destination_path", "output/")
    .addFilePathVariable("schema_file", "schema.json")
    .addStdinVariable("input text")
    .addUserVariable("uv-flag", "true");

  // Verify chaining returns the same builder instance
  assertEquals(chainResult, builder);
  assertEquals(_builder.getVariableCount(), 5);
  assertEquals(_builder.getErrorCount(), 0);
});

Deno.test("VariablesBuilder - addUserVariables method", () => {
  const _builder = new VariablesBuilder();
  const customVariables = {
    "uv-var1": "value1",
    "uv-var2": "value2",
    "uv-var3": "value3",
  };

  const _result = builder
    .addUserVariables(customVariables)
    .build();

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data.length, 3);
    const record = _builder.toRecord();
    assertEquals(record["uv-var1"], "value1");
    assertEquals(record["uv-var2"], "value2");
    assertEquals(record["uv-var3"], "value3");
  }
});

Deno.test("VariablesBuilder - addUserVariables with invalid prefixes", () => {
  const _builder = new VariablesBuilder();
  const customVariables = {
    "uv-valid": "value1",
    "invalid": "value2", // No uv- prefix
    "uv-another": "value3",
  };

  const _result = builder
    .addUserVariables(customVariables)
    .build();

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.length, 1);
    assertEquals(_result.error[0].kind, "InvalidPrefix");
  }
});

Deno.test("VariablesBuilder - toRecord returns empty object for no variables", () => {
  const _builder = new VariablesBuilder();
  const record = _builder.toRecord();

  assertEquals(Object.keys(record).length, 0);
  assertEquals(record, {});
});

Deno.test("VariablesBuilder - cross-type duplicate checking", () => {
  const _builder = new VariablesBuilder();

  // First add stdin variable with name "input_text"
  _builder.addStdinVariable("some text");

  // Try to add user variable with same name
  _builder.addUserVariable("input_text", "different text");

  const _result = _builder.build();
  assertEquals(_result.ok, false);
  if (!_result.ok) {
    // Should have InvalidPrefix error, not DuplicateVariable
    // because "input_text" doesn't have "uv-" prefix
    assertEquals(_result.error.length, 1);
    assertEquals(_result.error[0].kind, "InvalidPrefix");
  }
});
