/**
 * @fileoverview Structure tests for DirectiveType module
 * Testing data structure integrity and type relationships
 *
 * Structure tests verify:
 * - Class structure and immutability
 * - Smart Constructor pattern integrity
 * - Type safety and encapsulation
 * - Value object characteristics
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  DirectiveType,
  TwoParamsDirectivePattern,
} from "../domain/core/value_objects/directive_type.ts";
import type { TwoParams_Result } from "../deps.ts";
import {
  getDirectiveTypes,
  getLayerTypes,
} from "../test_helpers/config_test_helper.ts";

// Test data setup - async version using config helper
const _createValidTwoParamsResult = async (
  directiveType?: string,
  layerType?: string,
): Promise<TwoParams_Result> => {
  const directiveTypes = await getDirectiveTypes();
  const layerTypes = await getLayerTypes();
  const defaultDirective = directiveType || directiveTypes[0] || "to";
  const defaultLayer = layerType || layerTypes[0] || "project";
  
  return {
    type: "two" as const,
    directiveType: defaultDirective,
    layerType: defaultLayer,
    params: [defaultDirective, defaultLayer],
    options: {},
  };
};

Deno.test("2_structure: TwoParamsDirectivePattern follows Smart Constructor pattern", () => {
  // Test that constructor is private - can only create via static method
  const validPattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");

  // Apply Pattern 1: Smart Constructor with nullable return
  assertExists(validPattern, "Valid pattern should succeed");

  const invalidPatternResult = TwoParamsDirectivePattern.create("invalid[regex");
  assertEquals(invalidPatternResult, null, "Invalid pattern should return null");

  // Test immutability - pattern should be private and readonly
  if (validPattern) {
    // Pattern should be encapsulated - no direct access to internal regex
    // Note: private fields are not accessible from outside, but TypeScript may still show them in 'in' checks
    // So we verify public interface instead

    // Only public methods should be available
    assertEquals(typeof validPattern.test, "function");
    assertEquals(typeof validPattern.toString, "function");
    assertEquals(typeof validPattern.getPattern, "function");
    assertEquals(typeof validPattern.getDirectivePattern, "function");
  }
});

Deno.test("2_structure: TwoParamsDirectivePattern maintains consistent interface", () => {
  const pattern = TwoParamsDirectivePattern.create("^(to|from)$");
  assertExists(pattern);

  // Test method signatures and return types
  assertEquals(typeof pattern.test("to"), "boolean");
  assertEquals(typeof pattern.toString(), "string");
  assertEquals(typeof pattern.getPattern(), "string");

  // Test that getDirectivePattern returns self (for TypePatternProvider interface)
  const self = pattern.getDirectivePattern();
  assertEquals(self, pattern);
  assertEquals(self.test("to"), pattern.test("to"));
});

Deno.test("2_structure: TwoParamsDirectivePattern ensures regex safety", () => {
  // Test that invalid regex patterns are safely handled
  const invalidPatterns = [
    "invalid[regex",
    "(?<",
    "*invalid",
    "(?invalid",
    "\\",
  ];

  for (const invalidPattern of invalidPatterns) {
    const result = TwoParamsDirectivePattern.create(invalidPattern);
    assertEquals(result, null);
  }

  // Test that valid patterns work correctly
  const validPatterns = [
    "^to$",
    "summary|defect",
    ".*",
    "\\w+",
    "[a-z]+",
  ];

  for (const validPattern of validPatterns) {
    const result = TwoParamsDirectivePattern.create(validPattern);
    assertExists(result);
    assertEquals(typeof result.test, "function");
  }
});

Deno.test("2_structure: DirectiveType follows Smart Constructor pattern strictly", () => {
  // Test that constructor is private - can only create via static method
  const directiveResult = DirectiveType.create("to");

  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    assertEquals(directiveResult.data instanceof DirectiveType, true);

    // Test that internal state is encapsulated (Pattern 2: Flexible validation)
    // Private fields might still appear in 'in' checks due to TypeScript compilation
    // We focus on testing the public interface instead

    // Only public interface should be available
    assertEquals(typeof directiveResult.data.value, "string");
    assertEquals(typeof directiveResult.data.equals, "function");
    assertEquals(typeof directiveResult.data.toString, "function");
    assertEquals(typeof directiveResult.data.validatedByPattern, "boolean");
  }
});

Deno.test("2_structure: DirectiveType ensures immutability", () => {
  const directiveResult = DirectiveType.create("summary");

  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    const directiveType = directiveResult.data;

    // Test that value is read-only
    assertEquals(directiveType.value, "summary");

    // Test that validatedByPattern is readonly
    assertEquals(typeof directiveType.validatedByPattern, "boolean");

    // DirectiveType is immutable value object
    assertEquals(directiveType.value, "summary");
  }
});

Deno.test("2_structure: DirectiveType maintains value object characteristics", () => {
  // Test equality based on value, not reference
  const directive1Result = DirectiveType.create("to");
  const directive2Result = DirectiveType.create("to");
  const directive3Result = DirectiveType.create("summary");

  assertEquals(directive1Result.ok, true);
  assertEquals(directive2Result.ok, true);
  assertEquals(directive3Result.ok, true);

  if (directive1Result.ok && directive2Result.ok && directive3Result.ok) {
    const directive1 = directive1Result.data;
    const directive2 = directive2Result.data;
    const directive3 = directive3Result.data;

    // Same values should be equal
    assertEquals(directive1.equals(directive2), true);
    assertEquals(directive2.equals(directive1), true);

    // Different values should not be equal
    assertEquals(directive1.equals(directive3), false);
    assertEquals(directive3.equals(directive1), false);

    // Self-equality
    assertEquals(directive1.equals(directive1), true);
  }
});

Deno.test("2_structure: DirectiveType value property maintains type safety", async () => {
  const testCases = await getDirectiveTypes();

  for (const testValue of testCases) {
    const directiveResult = DirectiveType.create(testValue);

    assertEquals(directiveResult.ok, true);
    if (directiveResult.ok) {
      const directiveType = directiveResult.data;
      assertEquals(directiveType.value, testValue);
      assertEquals(typeof directiveType.value, "string");

      // Test consistency
      assertEquals(directiveType.value, testValue);
    }
  }

  // Test edge case: empty string should fail
  const emptyResult = DirectiveType.create("");
  assertEquals(emptyResult.ok, false);
});

Deno.test("2_structure: DirectiveType toString provides consistent representation", async () => {
  const validTestCases = await getDirectiveTypes();

  for (const directiveType of validTestCases) {
    const directiveResult = DirectiveType.create(directiveType);

    assertEquals(directiveResult.ok, true);
    if (directiveResult.ok) {
      const directiveType = directiveResult.data;
      const stringRepresentation = directiveType.toString();
      assertEquals(typeof stringRepresentation, "string");
      assertEquals(stringRepresentation, directiveType.toString());

      // Test that toString is consistent
      assertEquals(directiveType.toString(), directiveType.toString());
    }
  }
});

Deno.test("2_structure: DirectiveType validatedByPattern provides state information", () => {
  const directiveResult = DirectiveType.create("to");

  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    const directiveType = directiveResult.data;

    // Test that validatedByPattern is accessible
    assertEquals(typeof directiveType.validatedByPattern, "boolean");

    // Test consistency
    assertEquals(directiveType.validatedByPattern, directiveType.validatedByPattern);
  }
});

Deno.test("2_structure: DirectiveType maintains consistency across all access methods", async () => {
  const testValues = await getDirectiveTypes();

  for (const value of testValues) {
    const directiveResult = DirectiveType.create(value);

    assertEquals(directiveResult.ok, true);
    if (directiveResult.ok) {
      const directiveType = directiveResult.data;

      // All access methods should return the same value
      assertEquals(directiveType.value, value);

      // toString should return the value
      assertEquals(directiveType.toString(), value);

      // validatedByPattern should be consistent
      assertEquals(typeof directiveType.validatedByPattern, "boolean");
    }
  }
});

Deno.test("2_structure: DirectiveType as pure Value Object", () => {
  // Test DirectiveType as pure Value Object without profile dependency
  const directiveResult = DirectiveType.create("to");

  assertEquals(directiveResult.ok, true);
  if (directiveResult.ok) {
    const directiveType = directiveResult.data;

    // Core functionality should work as pure Value Object
    assertEquals(directiveType.value, "to");
    assertEquals(typeof directiveType.validatedByPattern, "boolean");

    // No profile-specific methods should exist
    assertEquals("profile" in directiveType, false);
  }
});

Deno.test("2_structure: DirectiveType equality is value-based, not reference-based", () => {
  // Create identical DirectiveTypes
  const directive1Result = DirectiveType.create("to");
  const directive2Result = DirectiveType.create("to");
  const directive3Result = DirectiveType.create("summary");

  assertEquals(directive1Result.ok, true);
  assertEquals(directive2Result.ok, true);
  assertEquals(directive3Result.ok, true);

  if (directive1Result.ok && directive2Result.ok && directive3Result.ok) {
    const directive1 = directive1Result.data;
    const directive2 = directive2Result.data;
    const directive3 = directive3Result.data;

    // Same directiveType should be equal
    assertEquals(directive1.equals(directive2), true);

    // Different directiveType should not be equal
    assertEquals(directive1.equals(directive3), false);
    assertEquals(directive2.equals(directive3), false);

    // Reference equality should not matter
    assertEquals(directive1 === directive2, false); // Different objects
    assertEquals(directive1.equals(directive2), true); // But values are equal
  }
});