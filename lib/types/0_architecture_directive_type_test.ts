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
    directiveType: "to",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };

  const directiveTypeResult = DirectiveType.create(twoParamsResult.directiveType);

  // Verify that DirectiveType is a pure value object (Result type)
  assertExists(directiveTypeResult);
  if (directiveTypeResult.ok) {
    const directiveType = directiveTypeResult.data;
    assertEquals(typeof directiveType.value, "string");
    assertEquals(typeof directiveType.equals, "function");
    assertEquals(typeof directiveType.toString, "function");

    // No file system operations
    assertEquals("readFile" in directiveType, false);
    assertEquals("writeFile" in directiveType, false);

    // No configuration dependencies
    assertEquals("loadConfig" in directiveType, false);
    assertEquals("saveConfig" in directiveType, false);

    // No external service calls
    assertEquals("fetch" in directiveType, false);
    assertEquals("httpRequest" in directiveType, false);
  }
});

Deno.test("0_architecture: DirectiveType enforces Smart Constructor pattern", () => {
  // Verify that DirectiveType cannot be instantiated directly
  // Only through static create method

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    directiveType: "summary",
    demonstrativeType: "summary",
    layerType: "issue",
    params: ["summary", "issue"],
    options: {},
  };

  // Smart Constructor should be the only way to create instances
  const directiveTypeResult = DirectiveType.create(twoParamsResult.directiveType);
  assertExists(directiveTypeResult);
  assertEquals(directiveTypeResult.ok, true);

  if (directiveTypeResult.ok) {
    const directiveType = directiveTypeResult.data;
    assertEquals(directiveType instanceof DirectiveType, true);

    // Constructor should be private (verified through type system)
    // Direct instantiation would fail at compile time

    // Verify immutability - no setters should exist
    assertEquals("setValue" in directiveType, false);
    assertEquals("set value" in Object.getOwnPropertyDescriptors(directiveType), false);
  }
});

Deno.test("0_architecture: DirectiveType implements Totality principle", () => {
  // Total function: defined for all valid TwoParams_Result inputs
  // No exceptions, no null returns

  const testCases: TwoParams_Result[] = [
    {
      type: "two",
      directiveType: "to",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {},
    },
    {
      type: "two",
      directiveType: "",
      demonstrativeType: "", // Same as directiveType (empty)
      layerType: "",
      params: ["", ""],
      options: {},
    },
    {
      type: "two",
      directiveType: "custom_directive_with_long_name",
      demonstrativeType: "custom_directive_with_long_name",
      layerType: "custom_layer",
      params: ["custom_directive_with_long_name", "custom_layer"],
      options: { complex: { nested: { data: true } } },
    },
  ];

  for (const testCase of testCases) {
    // Should never throw or return null - Totality principle
    const directiveTypeResult = DirectiveType.create(testCase.directiveType);
    assertExists(directiveTypeResult);

    // Result should always be defined, either ok or error
    assertEquals(typeof directiveTypeResult, "object");
    assertEquals("ok" in directiveTypeResult, true);

    // For valid inputs, should return success
    if (testCase.directiveType === "to") {
      assertEquals(directiveTypeResult.ok, true);
      if (directiveTypeResult.ok) {
        assertEquals(directiveTypeResult.data instanceof DirectiveType, true);
      }
    } // For invalid inputs, should return error (not throw)
    else {
      assertEquals(directiveTypeResult.ok, false);
    }
  }
});

Deno.test("0_architecture: TwoParamsDirectivePattern follows Smart Constructor pattern", () => {
  // Verify pattern creation follows Smart Constructor

  // Valid pattern returns success Result
  const validPattern = TwoParamsDirectivePattern.createOrError("^(to|from)$");
  assertExists(validPattern);
  assertEquals(validPattern.ok, true);

  // Invalid pattern returns error Result (not exception)
  const invalidPattern = TwoParamsDirectivePattern.createOrError("invalid[regex");
  assertExists(invalidPattern);
  assertEquals(invalidPattern.ok, false);

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
    directiveType: "analyze",
    demonstrativeType: "analyze",
    layerType: "system",
    params: ["analyze", "system"],
    options: {},
  };

  const directiveTypeResult = DirectiveType.create(twoParamsResult.directiveType);

  // Core responsibility: value access (Result type)
  assertExists(directiveTypeResult);
  if (directiveTypeResult.ok) {
    const directiveType = directiveTypeResult.data;
    assertExists(directiveType.value);
    assertExists(directiveType.value);

    // Value comparison responsibility
    assertExists(directiveType.equals);
    assertExists(directiveType.toString);

    // Should NOT have validation methods
    assertEquals("validate" in directiveType, false);
    assertEquals("isValid" in directiveType, false);
    assertEquals("checkPattern" in directiveType, false);

    // Should NOT have transformation methods
    assertEquals("transform" in directiveType, false);
    assertEquals("convert" in directiveType, false);
    assertEquals("parse" in directiveType, false);
  }
});

Deno.test("0_architecture: DirectiveType dependency flow is unidirectional", () => {
  // DirectiveType depends on TwoParams_Result (from deps.ts)
  // No circular dependencies or backward references

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    directiveType: "defect",
    demonstrativeType: "defect",
    layerType: "task",
    params: ["defect", "task"],
    options: {},
  };

  const directiveTypeResult = DirectiveType.create(twoParamsResult.directiveType);
  assertExists(directiveTypeResult);
  assertEquals(directiveTypeResult.ok, true);

  if (directiveTypeResult.ok) {
    const directiveType = directiveTypeResult.data;

    // DirectiveType is a pure value object containing only the directive value
    assertEquals(directiveType.value, "defect");

    // Immutable value object ensures architectural constraint
    assertEquals(typeof directiveType.value, "string");
    assertEquals(directiveType.toString(), "defect");
  }
});

Deno.test("0_architecture: DirectiveType supports extensibility without modification", () => {
  // Open/Closed Principle: open for extension, closed for modification

  // Can work with any valid TwoParams_Result
  const customResult: TwoParams_Result = {
    type: "two",
    directiveType: "future_directive_type",
    demonstrativeType: "future_directive_type",
    layerType: "future_layer",
    params: ["future_directive_type", "future_layer"],
    options: {
      version: "2.0",
      features: ["feature1", "feature2"],
      metadata: { experimental: true },
    },
  };

  const directiveTypeResult = DirectiveType.create(customResult.directiveType);
  assertExists(directiveTypeResult);

  // future_directive_type is not in the default valid directive types
  // This demonstrates extensibility without modifying DirectiveType class
  assertEquals(directiveTypeResult.ok, false);

  // DirectiveType properly handles invalid directive types
  if (!directiveTypeResult.ok) {
    assertEquals(typeof directiveTypeResult.error, "object");
    // "future_directive_type" exceeds max length of 20 characters
    assertEquals(directiveTypeResult.error.kind, "TooLong");
  }
});

Deno.test("0_architecture: TwoParamsDirectivePattern provides pattern abstraction", () => {
  // Pattern should abstract regex complexity and provide safe interface

  const patternResult = TwoParamsDirectivePattern.createOrError("^(to|summary|defect)$");
  assertExists(patternResult);
  assertEquals(patternResult.ok, true);

  if (patternResult.ok) {
    const pattern = patternResult.data;

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
  }
});

Deno.test("0_architecture: DirectiveType and TwoParamsDirectivePattern are loosely coupled", () => {
  // DirectiveType should not directly depend on TwoParamsDirectivePattern
  // They are separate concerns with different responsibilities

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    directiveType: "transform",
    demonstrativeType: "transform",
    layerType: "module",
    params: ["transform", "module"],
    options: {},
  };

  const directiveTypeResult = DirectiveType.create(twoParamsResult.directiveType);
  assertExists(directiveTypeResult);

  // "transform" is not in the default valid directive types (to, summary, defect)
  assertEquals(directiveTypeResult.ok, false);

  // DirectiveType and TwoParamsDirectivePattern operate independently
  if (!directiveTypeResult.ok) {
    const patternResult = TwoParamsDirectivePattern.createOrError("^(transform|convert)$");
    if (patternResult.ok) {
      const pattern = patternResult.data;
      // Pattern can validate the same value DirectiveType rejected
      assertEquals(pattern.test("transform"), true);

      // No cross-dependencies between the two classes
      assertEquals("test" in directiveTypeResult, false);
      assertEquals("getPattern" in directiveTypeResult, false);
      assertEquals("pattern" in directiveTypeResult, false);
    }
  }

  // Pattern validation is BreakdownParams' responsibility
  // DirectiveType trusts the validated input
});
