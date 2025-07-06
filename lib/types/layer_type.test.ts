/**
 * @fileoverview Unit tests for LayerType with Totality principle
 * Testing architecture constraints, behavior verification, and structure integrity
 */

import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { LayerType, TwoParamsLayerTypePattern } from "./layer_type.ts";
import type { TwoParams_Result } from "../deps.ts";

// Test fixtures
const validTwoParamsResult: TwoParams_Result = {
  type: "two",
  demonstrativeType: "to",
  layerType: "project",
  options: {},
  params: ["to", "project"],
};

const createTwoParamsResult = (layerType: string): TwoParams_Result => ({
  type: "two",
  demonstrativeType: "to",
  layerType,
  options: {},
  params: ["to", layerType],
});

// === 0_architecture: 型制約検証 ===

Deno.test("0_architecture: LayerType - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  // @ts-expect-error - Testing that direct instantiation is not allowed
  const directInstantiation = () => new LayerType(validTwoParamsResult);
  
  // This test verifies the TypeScript error above
  // The constructor is private and enforces Smart Constructor pattern
  assertEquals(typeof LayerType.create, "function");
});

Deno.test("0_architecture: LayerType - Smart Constructor always returns instance", () => {
  // Architecture constraint: create method always returns LayerType instance
  const layerType = LayerType.create(validTwoParamsResult);
  
  assertExists(layerType);
  assertEquals(layerType instanceof LayerType, true);
  assertEquals(layerType.constructor.name, "LayerType");
});

Deno.test("0_architecture: LayerType - immutability guarantee", () => {
  // Architecture constraint: LayerType must be immutable
  const layerType = LayerType.create(validTwoParamsResult);
  
  // value property should be readonly
  // @ts-expect-error - Testing that value cannot be modified
  const attemptModification = () => { layerType.value = "modified"; };
  
  // originalResult should be readonly
  const original = layerType.originalResult;
  assertExists(original);
  // @ts-expect-error - Testing that originalResult cannot be modified
  const attemptOriginalModification = () => { original.layerType = "modified"; };
});

Deno.test("0_architecture: TwoParamsLayerTypePattern - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  // @ts-expect-error - Testing that direct instantiation is not allowed
  const directInstantiation = () => new TwoParamsLayerTypePattern(/test/);
  
  // This test verifies the TypeScript error above
  assertEquals(typeof TwoParamsLayerTypePattern.create, "function");
});

Deno.test("0_architecture: TwoParamsLayerTypePattern - Smart Constructor returns null for invalid pattern", () => {
  // Architecture constraint: create method returns null for invalid patterns
  const invalidPattern = TwoParamsLayerTypePattern.create("[");
  assertEquals(invalidPattern, null);
  
  const validPattern = TwoParamsLayerTypePattern.create("project|issue|task");
  assertExists(validPattern);
  assertEquals(validPattern instanceof TwoParamsLayerTypePattern, true);
});

// === 1_behavior: 動作検証 ===

Deno.test("1_behavior: LayerType - preserves layerType value from TwoParams_Result", () => {
  const testCases = [
    "project",
    "issue",
    "task",
    "bugs",
    "temp",
    "epic",    // extended types
    "system",
    "todos",
    "comments",
    "notes",
  ];

  for (const expectedValue of testCases) {
    const result = createTwoParamsResult(expectedValue);
    const layerType = LayerType.create(result);
    
    assertEquals(layerType.value, expectedValue);
    assertEquals(layerType.getValue(), expectedValue); // deprecated method
  }
});

Deno.test("1_behavior: LayerType - equals method comparison", () => {
  const project1 = LayerType.create(createTwoParamsResult("project"));
  const project2 = LayerType.create(createTwoParamsResult("project"));
  const issue = LayerType.create(createTwoParamsResult("issue"));
  
  // Same values should be equal
  assertEquals(project1.equals(project2), true);
  assertEquals(project2.equals(project1), true);
  
  // Different values should not be equal
  assertEquals(project1.equals(issue), false);
  assertEquals(issue.equals(project1), false);
});

Deno.test("1_behavior: LayerType - toString representation", () => {
  const layerType = LayerType.create(createTwoParamsResult("project"));
  assertEquals(layerType.toString(), "LayerType(project)");
  
  const issueType = LayerType.create(createTwoParamsResult("issue"));
  assertEquals(issueType.toString(), "LayerType(issue)");
});

Deno.test("1_behavior: LayerType - hierarchy level mapping", () => {
  const testCases = [
    { value: "project", level: 1 },
    { value: "issue", level: 2 },
    { value: "task", level: 3 },
    { value: "bugs", level: 0 },
    { value: "temp", level: 0 },
    { value: "unknown", level: 0 }, // default case
  ];

  for (const { value, level } of testCases) {
    const layerType = LayerType.create(createTwoParamsResult(value));
    assertEquals(layerType.getHierarchyLevel(), level);
  }
});

Deno.test("1_behavior: LayerType - standard hierarchy identification", () => {
  const standardTypes = ["project", "issue", "task"];
  const nonStandardTypes = ["bugs", "temp", "epic", "system"];

  for (const type of standardTypes) {
    const layerType = LayerType.create(createTwoParamsResult(type));
    assertEquals(layerType.isStandardHierarchy(), true);
  }

  for (const type of nonStandardTypes) {
    const layerType = LayerType.create(createTwoParamsResult(type));
    assertEquals(layerType.isStandardHierarchy(), false);
  }
});

Deno.test("1_behavior: TwoParamsLayerTypePattern - pattern matching", () => {
  const pattern = TwoParamsLayerTypePattern.create("project|issue|task");
  assertExists(pattern);

  // Valid matches
  assertEquals(pattern.test("project"), true);
  assertEquals(pattern.test("issue"), true);
  assertEquals(pattern.test("task"), true);

  // Invalid matches
  assertEquals(pattern.test("bugs"), false);
  assertEquals(pattern.test("temp"), false);
  assertEquals(pattern.test(""), false);
});

Deno.test("1_behavior: TwoParamsLayerTypePattern - complex pattern support", () => {
  // Pattern with special regex characters
  const complexPattern = TwoParamsLayerTypePattern.create("^(project|issue|task)$");
  assertExists(complexPattern);

  assertEquals(complexPattern.test("project"), true);
  assertEquals(complexPattern.test("issue"), true);
  assertEquals(complexPattern.test("task"), true);
  assertEquals(complexPattern.test("projectX"), false); // $ ensures exact match
  assertEquals(complexPattern.test("Xproject"), false); // ^ ensures start match
});

Deno.test("1_behavior: TwoParamsLayerTypePattern - string representations", () => {
  const pattern = TwoParamsLayerTypePattern.create("project|issue|task");
  assertExists(pattern);

  assertEquals(pattern.toString(), "project|issue|task");
  assertEquals(pattern.getPattern(), "project|issue|task");
});

Deno.test("1_behavior: TwoParamsLayerTypePattern - self-reference for interface", () => {
  const pattern = TwoParamsLayerTypePattern.create("project|issue|task");
  assertExists(pattern);

  const layerTypePattern = pattern.getLayerTypePattern();
  assertEquals(layerTypePattern, pattern);
  assertEquals(layerTypePattern instanceof TwoParamsLayerTypePattern, true);
});

// === 2_structure: 構造検証 ===

Deno.test("2_structure: LayerType - preserves original TwoParams_Result", () => {
  const originalResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    options: {
      fromFile: "input.md",
      verbose: true,
    },
    params: ["to", "project"],
  };

  const layerType = LayerType.create(originalResult);
  const preserved = layerType.originalResult;

  // Structure should be preserved
  assertEquals(preserved.type, originalResult.type);
  assertEquals(preserved.demonstrativeType, originalResult.demonstrativeType);
  assertEquals(preserved.layerType, originalResult.layerType);
  assertEquals(preserved.options, originalResult.options);
});

Deno.test("2_structure: LayerType - reference semantics for TwoParams_Result", () => {
  const mutableResult = createTwoParamsResult("project");
  const layerType = LayerType.create(mutableResult);

  // LayerType holds a reference to the original object
  // This is by design - LayerType is a lightweight wrapper
  const originalLayerType = layerType.value;
  const originalDemonstrativeType = layerType.originalResult.demonstrativeType;

  // Modify the original input
  mutableResult.layerType = "modified";
  mutableResult.demonstrativeType = "modified";

  // value getter returns the current value from the referenced object
  assertEquals(layerType.value, "modified");
  
  // originalResult reflects the current state of the referenced object
  // This is expected behavior as LayerType holds a reference
  assertEquals(layerType.originalResult.layerType, "modified");
  assertEquals(layerType.originalResult.demonstrativeType, "modified");
});

Deno.test("2_structure: LayerType - handles various TwoParams_Result structures", () => {
  // Minimal structure
  const minimalResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "task",
    options: {},
    params: ["to", "task"],
  };
  const minimalLayer = LayerType.create(minimalResult);
  assertEquals(minimalLayer.value, "task");

  // With rich options
  const richResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "issue",
    options: {
      fromFile: "input.md",
      toFile: "output.md",
      verbose: true,
      debug: false,
      customField: "value",
    },
    params: ["summary", "issue"],
  };
  const richLayer = LayerType.create(richResult);
  assertEquals(richLayer.value, "issue");
  assertEquals(richLayer.originalResult.options.customField, "value");
});

Deno.test("2_structure: TwoParamsLayerTypePattern - encapsulation of RegExp", () => {
  const pattern = TwoParamsLayerTypePattern.create("test|pattern");
  assertExists(pattern);

  // Pattern should not expose internal RegExp directly
  // Only string representations should be available
  assertEquals(typeof pattern.toString(), "string");
  assertEquals(typeof pattern.getPattern(), "string");
  assertEquals(typeof pattern.test, "function");

  // No direct access to internal pattern
  // @ts-expect-error - Testing that pattern property is private
  const attemptAccess = () => pattern.pattern;
});

Deno.test("2_structure: LayerType - type consistency across methods", () => {
  const layerType = LayerType.create(createTwoParamsResult("project"));

  // All string-returning methods should return consistent type
  assertEquals(typeof layerType.value, "string");
  assertEquals(typeof layerType.getValue(), "string");
  assertEquals(typeof layerType.toString(), "string");

  // All number-returning methods should return consistent type
  assertEquals(typeof layerType.getHierarchyLevel(), "number");

  // All boolean-returning methods should return consistent type
  assertEquals(typeof layerType.isStandardHierarchy(), "boolean");
  assertEquals(typeof layerType.equals(layerType), "boolean");
});