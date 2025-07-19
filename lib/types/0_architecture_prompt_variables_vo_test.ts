/**
 * @fileoverview Architecture tests for PromptVariablesVO module
 * Testing domain boundaries, dependencies, and architectural constraints
 *
 * Architecture tests verify:
 * - Domain boundary enforcement
 * - Dependency direction
 * - Smart Constructor pattern compliance
 * - Totality principle adherence
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { PromptVariablesVO } from "./prompt_variables_vo.ts";
import {
  FilePathVariable,
  StandardVariable,
  StdinVariable,
  UserVariable,
} from "./prompt_variables_vo.ts";
import type { PromptVariable } from "./prompt_variables_vo.ts";

Deno.test("0_architecture: PromptVariablesVO follows domain boundary rules", () => {
  // PromptVariablesVO should only depend on PromptVariable types
  // No direct dependency on file system, config, or other domains

  const standardVar = StandardVariable.create("input_text_file", "/path/to/file");
  const filePathVar = FilePathVariable.create("schema_file", "/path/to/schema");

  if (!standardVar.ok || !filePathVar.ok) {
    throw new Error("Failed to create test variables");
  }

  const variables: PromptVariable[] = [standardVar.data, filePathVar.data];
  const vo = PromptVariablesVO.create(variables);

  // Verify that PromptVariablesVO is a pure value object
  assertExists(vo);
  assertEquals(typeof vo.value, "object");
  assertEquals(typeof vo.equals, "function");
  assertEquals(typeof vo.toString, "function");
  assertEquals(typeof vo.originalVariables, "object");

  // No file system operations
  assertEquals("readFile" in vo, false);
  assertEquals("writeFile" in vo, false);

  // No configuration dependencies
  assertEquals("loadConfig" in vo, false);
  assertEquals("saveConfig" in vo, false);

  // No external service calls
  assertEquals("fetch" in vo, false);
  assertEquals("httpRequest" in vo, false);
});

Deno.test("0_architecture: PromptVariablesVO enforces Smart Constructor pattern", () => {
  // Verify that PromptVariablesVO cannot be instantiated directly
  // Only through static create method

  const stdinVar = StdinVariable.create("input_text", "test content");
  if (!stdinVar.ok) {
    throw new Error("Failed to create test variable");
  }

  // Smart Constructor should be the only way to create instances
  const vo = PromptVariablesVO.create([stdinVar.data]);
  assertExists(vo);
  assertEquals(vo instanceof PromptVariablesVO, true);

  // Constructor should be private (verified through type system)
  // Direct instantiation would fail at compile time

  // Verify immutability - no setters should exist
  assertEquals("setValue" in vo, false);
  assertEquals("set value" in Object.getOwnPropertyDescriptors(vo), false);
  assertEquals("setVariables" in vo, false);
  assertEquals("addVariable" in vo, false);
  assertEquals("removeVariable" in vo, false);
});

Deno.test("0_architecture: PromptVariablesVO implements Totality principle", () => {
  // Total function: defined for all valid PromptVariable array inputs
  // No exceptions, no null returns

  // Create variables safely for test cases
  const var1 = StandardVariable.create("input_text_file", "/path");
  const var2 = StandardVariable.create("input_text_file", "/path1");
  const var3 = FilePathVariable.create("schema_file", "/path2");
  const var4 = FilePathVariable.create("schema_file", "/schema");
  const var5 = StdinVariable.create("input_text", "content");
  const var6 = UserVariable.create("uv-custom", "value");

  if (!var1.ok || !var2.ok || !var3.ok || !var4.ok || !var5.ok || !var6.ok) {
    throw new Error("Failed to create test variables");
  }

  const testCases: PromptVariable[][] = [
    [], // Empty array
    [var1.data],
    [var2.data, var3.data],
    [var1.data, var4.data, var5.data, var6.data],
  ];

  for (const testCase of testCases) {
    // Should never throw or return null
    const vo = PromptVariablesVO.create(testCase);
    assertExists(vo);
    assertEquals(vo instanceof PromptVariablesVO, true);
    assertEquals(Array.isArray(vo.value), true);
  }
});

Deno.test("0_architecture: PromptVariablesVO maintains single responsibility", () => {
  // PromptVariablesVO should only be responsible for holding validated variable collection
  // Validation responsibility is delegated to individual variable types

  const userVar = UserVariable.create("uv-feature", "enabled");
  if (!userVar.ok) {
    throw new Error("Failed to create test variable");
  }

  const vo = PromptVariablesVO.create([userVar.data]);

  // Core responsibility: collection access
  assertExists(vo.value);
  assertExists(vo.originalVariables);
  assertExists(vo.size);
  assertExists(vo.isEmpty);

  // Collection query responsibility
  assertExists(vo.findByName);
  assertExists(vo.hasVariable);
  assertExists(vo.getNames);
  assertExists(vo.toRecord);

  // Value comparison responsibility
  assertExists(vo.equals);
  assertExists(vo.toString);

  // Should NOT have validation methods
  assertEquals("validate" in vo, false);
  assertEquals("isValid" in vo, false);
  assertEquals("checkDuplicates" in vo, false);

  // Should NOT have transformation methods
  assertEquals("transform" in vo, false);
  assertEquals("convert" in vo, false);
  assertEquals("parse" in vo, false);

  // Should NOT have mutation methods
  assertEquals("add" in vo, false);
  assertEquals("remove" in vo, false);
  assertEquals("update" in vo, false);
  assertEquals("merge" in vo, false);
  assertEquals("filter" in vo, false);
});

Deno.test("0_architecture: PromptVariablesVO dependency flow is unidirectional", () => {
  // PromptVariablesVO depends on PromptVariable types
  // No circular dependencies or backward references

  const standardVar = StandardVariable.create("destination_path", "/output");
  if (!standardVar.ok) {
    throw new Error("Failed to create test variable");
  }

  const vo = PromptVariablesVO.create([standardVar.data]);

  // Can access original variables (forward reference)
  assertExists(vo.originalVariables);
  assertEquals(vo.originalVariables.length, 1);

  // But PromptVariablesVO should not modify or influence PromptVariable
  // Immutability ensures this architectural constraint
  const original = vo.originalVariables;
  assertEquals(typeof original, "object");
  assertEquals(Object.isFrozen(original), true); // Array is frozen
});

Deno.test("0_architecture: PromptVariablesVO supports extensibility without modification", () => {
  // Open/Closed Principle: open for extension, closed for modification

  // Can work with any valid PromptVariable implementation
  const customVar = UserVariable.create("uv-future-feature", "future-value");
  if (!customVar.ok) {
    throw new Error("Failed to create custom variable");
  }

  const vo = PromptVariablesVO.create([customVar.data]);
  assertExists(vo);
  assertEquals(vo.size(), 1);

  // Can access all variable data without modification
  const record = vo.toRecord();
  assertEquals(record["uv-future-feature"], "future-value");
});

Deno.test("0_architecture: PromptVariablesVO provides collection abstraction", () => {
  // Should abstract collection complexity and provide safe interface

  const var1 = StandardVariable.create("input_text_file", "/input");
  const var2 = FilePathVariable.create("schema_file", "/schema");

  if (!var1.ok || !var2.ok) {
    throw new Error("Failed to create test variables");
  }

  const vo = PromptVariablesVO.create([var1.data, var2.data]);

  // Public interface should be minimal and safe
  assertEquals(typeof vo.size, "function");
  assertEquals(typeof vo.isEmpty, "function");
  assertEquals(typeof vo.toRecord, "function");
  assertEquals(typeof vo.getNames, "function");
  assertEquals(typeof vo.findByName, "function");
  assertEquals(typeof vo.hasVariable, "function");

  // Should not expose internal array methods directly
  assertEquals("push" in vo, false);
  assertEquals("pop" in vo, false);
  assertEquals("shift" in vo, false);
  assertEquals("unshift" in vo, false);
  assertEquals("splice" in vo, false);
  assertEquals("sort" in vo, false);
  assertEquals("reverse" in vo, false);

  // Safe collection querying
  assertEquals(vo.size(), 2);
  assertEquals(vo.isEmpty(), false);
  assertEquals(vo.hasVariable("input_text_file"), true);
  assertEquals(vo.hasVariable("non_existent"), false);
});

Deno.test("0_architecture: PromptVariablesVO ensures true immutability", () => {
  // Verify that the internal state cannot be modified

  const standardVar = StandardVariable.create("input_text_file", "/path");
  if (!standardVar.ok) {
    throw new Error("Failed to create test variable");
  }

  const variables = [standardVar.data];
  const vo = PromptVariablesVO.create(variables);

  // Original array modification should not affect VO
  variables.push(standardVar.data);
  assertEquals(vo.size(), 1); // Still 1, not 2

  // Retrieved value should be frozen
  const retrievedValue = vo.value;
  assertEquals(Object.isFrozen(retrievedValue), true);

  // Original variables should also be frozen
  const originalVars = vo.originalVariables;
  assertEquals(Object.isFrozen(originalVars), true);

  // toRecord should return a new object each time
  const record1 = vo.toRecord();
  const record2 = vo.toRecord();
  assertEquals(record1 !== record2, true); // Different object references
  assertEquals(JSON.stringify(record1), JSON.stringify(record2)); // But same content
});

Deno.test("0_architecture: PromptVariablesVO has no external dependencies", () => {
  // PromptVariablesVO should be self-contained with minimal dependencies

  const vo = PromptVariablesVO.create([]);

  // Check that it doesn't depend on global state
  assertEquals("window" in vo, false);
  assertEquals("document" in vo, false);
  assertEquals("process" in vo, false);
  assertEquals("global" in vo, false);

  // Check that it doesn't depend on Node.js specific APIs
  assertEquals("require" in vo, false);
  assertEquals("module" in vo, false);
  assertEquals("exports" in vo, false);

  // Check that it doesn't depend on Deno specific APIs
  assertEquals("Deno" in vo, false);
  assertEquals("import" in vo, false);
  assertEquals("export" in vo, false);
});
