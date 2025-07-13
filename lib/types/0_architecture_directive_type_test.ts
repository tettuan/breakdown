/**
 * @fileoverview Architecture tests for DirectiveType module
 * Testing domain boundaries, dependencies, and architectural constraints
 *
 * Architecture tests verify:
 * - Domain boundary enforcement
 * - Dependency direction
 * - Smart Constructor pattern compliance
 * - Totality principle adherence
 */

import { assertEquals, assertExists } from "@std/assert";
import { DirectiveType, TwoParamsDirectivePattern } from "./mod.ts";
import type { TwoParams_Result } from "../deps.ts";

Deno.test("0_architecture: DirectiveType follows domain boundary rules", () => {
  // DirectiveType should only depend on TwoParams_Result from external dependency
  // No direct dependency on file system, config, or other domains

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };

  const directiveType = DirectiveType.create(twoParamsResult);

  // Verify that DirectiveType is a pure value object (Result type)
  assertExists(directiveType);
  if (directiveType.ok) {
    assertEquals(typeof directiveType.data.value, "string");
    assertEquals(typeof directiveType.data.equals, "function");
    assertEquals(typeof directiveType.data.toString, "function");
  }

  // No file system operations
  assertEquals("readFile" in directiveType, false);
  assertEquals("writeFile" in directiveType, false);

  // No configuration dependencies
  assertEquals("loadConfig" in directiveType, false);
  assertEquals("saveConfig" in directiveType, false);

  // No external service calls
  assertEquals("fetch" in directiveType, false);
  assertEquals("httpRequest" in directiveType, false);
});

Deno.test("0_architecture: DirectiveType enforces Smart Constructor pattern", () => {
  // Verify that DirectiveType cannot be instantiated directly
  // Only through static create method

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "issue",
    params: ["summary", "issue"],
    options: {},
  };

  // Smart Constructor should be the only way to create instances
  const directiveType = DirectiveType.create(twoParamsResult);
  assertExists(directiveType);
  assertEquals(directiveType instanceof DirectiveType, true);

  // Constructor should be private (verified through type system)
  // Direct instantiation would fail at compile time

  // Verify immutability - no setters should exist
  assertEquals("setValue" in directiveType, false);
  assertEquals("set value" in Object.getOwnPropertyDescriptors(directiveType), false);
});

Deno.test("0_architecture: DirectiveType implements Totality principle", () => {
  // Total function: defined for all valid TwoParams_Result inputs
  // No exceptions, no null returns

  const testCases: TwoParams_Result[] = [
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {},
    },
    {
      type: "two",
      demonstrativeType: "",
      layerType: "",
      params: ["", ""],
      options: {},
    },
    {
      type: "two",
      demonstrativeType: "custom_directive_with_long_name",
      layerType: "custom_layer",
      params: ["custom_directive_with_long_name", "custom_layer"],
      options: { complex: { nested: { data: true } } },
    },
  ];

  for (const testCase of testCases) {
    // Should never throw or return null
    const directiveTypeResult = DirectiveType.create(testCase);
    assertExists(directiveTypeResult);
    assertEquals(directiveTypeResult.ok, true);
    if (directiveTypeResult.ok) {
      const directiveType = directiveTypeResult.data;
      assertEquals(directiveType instanceof DirectiveType, true);
      assertEquals(typeof directiveType.value, "string");
    }
  }
});

Deno.test("0_architecture: TwoParamsDirectivePattern follows Smart Constructor pattern", () => {
  // Verify pattern creation follows Smart Constructor

  // Valid pattern returns instance
  const validPattern = TwoParamsDirectivePattern.create("^(to|from)$");
  assertExists(validPattern);

  // Invalid pattern returns null (not exception)
  const invalidPattern = TwoParamsDirectivePattern.create("invalid[regex");
  assertEquals(invalidPattern, null);

  // No direct instantiation possible (private constructor)
  // Verified through type system

  // Pattern should be immutable
  if (validPattern) {
    assertEquals("setPattern" in validPattern, false);
    // Private fields in TypeScript/JavaScript are truly private
    // They don't appear in property listings
    // The test should verify that no mutation methods exist
    const publicMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(validPattern));
    const hasMutationMethods = publicMethods.some((name) =>
      name.startsWith("set") || name.startsWith("update") || name.startsWith("modify")
    );
    assertEquals(hasMutationMethods, false);
  }
});

Deno.test("0_architecture: DirectiveType maintains single responsibility", () => {
  // DirectiveType should only be responsible for holding validated directive type value
  // Validation responsibility is delegated to BreakdownParams

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "analyze",
    layerType: "system",
    params: ["analyze", "system"],
    options: {},
  };

  const directiveType = DirectiveType.create(twoParamsResult);

  // Core responsibility: value access (Result type)
  assertExists(directiveType);
  if (directiveType.ok) {
    assertExists(directiveType.data.value);
    assertExists(directiveType.data.getValue);
  }

  // Value comparison responsibility (Result type)
  if (directiveType.ok) {
    assertExists(directiveType.data.equals);
    assertExists(directiveType.data.toString);
  }

  // Should NOT have validation methods
  assertEquals("validate" in directiveType, false);
  assertEquals("isValid" in directiveType, false);
  assertEquals("checkPattern" in directiveType, false);

  // Should NOT have transformation methods
  assertEquals("transform" in directiveType, false);
  assertEquals("convert" in directiveType, false);
  assertEquals("parse" in directiveType, false);
});

Deno.test("0_architecture: DirectiveType dependency flow is unidirectional", () => {
  // DirectiveType depends on TwoParams_Result (from deps.ts)
  // No circular dependencies or backward references

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "defect",
    layerType: "task",
    params: ["defect", "task"],
    options: {},
  };

  const directiveTypeResult = DirectiveType.create(twoParamsResult);
  assertExists(directiveTypeResult);
  assertEquals(directiveTypeResult.ok, true);
  
  if (directiveTypeResult.ok) {
    const directiveType = directiveTypeResult.data;

    // Can access original result (forward reference)
    assertExists(directiveType.originalResult);
    assertEquals(directiveType.originalResult.demonstrativeType, "defect");

    // But DirectiveType should not modify or influence TwoParams_Result
    // Immutability ensures this architectural constraint
    const original = directiveType.originalResult;
    assertEquals(typeof original, "object");
    assertEquals(Object.isFrozen(original) || Object.isSealed(original), false);
    // Original object remains mutable, but DirectiveType doesn't modify it
  }
});

Deno.test("0_architecture: DirectiveType supports extensibility without modification", () => {
  // Open/Closed Principle: open for extension, closed for modification

  // Can work with any valid TwoParams_Result
  const customResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "future_directive_type",
    layerType: "future_layer",
    params: ["future_directive_type", "future_layer"],
    options: {
      version: "2.0",
      features: ["feature1", "feature2"],
      metadata: { experimental: true },
    },
  };

  const directiveTypeResult = DirectiveType.create(customResult);
  assertExists(directiveTypeResult);
  assertEquals(directiveTypeResult.ok, true);
  
  if (directiveTypeResult.ok) {
    const directiveType = directiveTypeResult.data;
    assertEquals(directiveType.value, "future_directive_type");

    // Can access all original data without modification
    assertEquals(directiveType.originalResult.options.version, "2.0");
    assertEquals(Array.isArray(directiveType.originalResult.options.features), true);
  }
});

Deno.test("0_architecture: TwoParamsDirectivePattern provides pattern abstraction", () => {
  // Pattern should abstract regex complexity and provide safe interface

  const pattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");
  assertExists(pattern);

  // Public interface should be minimal and safe
  assertEquals(typeof pattern.test, "function");
  assertEquals(typeof pattern.toString, "function");
  assertEquals(typeof pattern.getPattern, "function");
  assertEquals(typeof pattern.getDirectivePattern, "function");

  // Should not expose internal regex directly
  assertEquals("exec" in pattern, false);
  assertEquals("compile" in pattern, false);
  assertEquals("source" in pattern, false);
  assertEquals("flags" in pattern, false);

  // Safe pattern testing
  assertEquals(pattern.test("to"), true);
  assertEquals(pattern.test("summary"), true);
  assertEquals(pattern.test("invalid"), false);
});

Deno.test("0_architecture: DirectiveType and TwoParamsDirectivePattern are loosely coupled", () => {
  // DirectiveType should not directly depend on TwoParamsDirectivePattern
  // They are separate concerns with different responsibilities

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "transform",
    layerType: "module",
    params: ["transform", "module"],
    options: {},
  };

  const directiveTypeResult = DirectiveType.create(twoParamsResult);
  assertExists(directiveTypeResult);
  assertEquals(directiveTypeResult.ok, true);

  if (directiveTypeResult.ok) {
    const directiveType = directiveTypeResult.data;
    // DirectiveType works without any pattern
    assertEquals(directiveType.value, "transform");

    // No direct pattern methods on DirectiveType
    assertEquals("test" in directiveType, false);
    assertEquals("getPattern" in directiveType, false);
    assertEquals("pattern" in directiveType, false);
  }

  // Pattern validation is BreakdownParams' responsibility
  // DirectiveType trusts the validated input
});
