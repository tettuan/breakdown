/**
 * @fileoverview Behavior tests for legacy factory implementations
 *
 * Tests the behavioral correctness of legacy factories including:
 * - String-to-type conversion accuracy
 * - Type guard behavioral correctness
 * - Factory method consistency
 * - Edge case handling
 * - Null handling for invalid inputs
 *
 * @module types/1_behavior_legacy_factories_test
 */

import {
  assert,
  assertEquals,
  assertStrictEquals,
} from "../deps.ts";
import {
  type DemonstrativeType,
  DemonstrativeTypeFactory,
  DemonstrativeTypeGuards,
  DirectiveFactory,
  LayerFactory,
  type LegacyLayerType,
  LegacyLayerTypeFactory,
  LegacyLayerTypeGuards,
  TwoParamsConfigFactory,
  VariableResultFactory,
} from "./legacy_factories.ts";

Deno.test("Legacy Factories Behavior - DemonstrativeTypeFactory string conversion", () => {
  // Test valid string conversions
  const validInputs = [
    { input: "to", expected: "to" },
    { input: "summary", expected: "summary" },
    { input: "defect", expected: "defect" },
    { input: "init", expected: "init" },
    { input: "find", expected: "find" },
  ];

  for (const { input, expected } of validInputs) {
    const result = DemonstrativeTypeFactory.fromString(input);
    assert(result !== null, `Should convert valid input: ${input}`);
    if (result) {
      assertEquals(result.kind, expected, `Kind should match for input: ${input}`);
      assertEquals(result.value, expected, `Value should match for input: ${input}`);
    }
  }

  // Test case insensitive conversion
  const caseVariations = [
    "TO", "To", "tO",
    "SUMMARY", "Summary", "SuMmArY",
    "DEFECT", "Defect", "DeFeCt",
  ];

  for (const input of caseVariations) {
    const result = DemonstrativeTypeFactory.fromString(input);
    assert(result !== null, `Should handle case insensitive input: ${input}`);
    if (result) {
      assertEquals(result.kind.toLowerCase(), input.toLowerCase(), "Should normalize case");
    }
  }

  // Test whitespace handling
  const whitespaceInputs = [
    "  to  ", "\tto\t", "\nto\n", " to", "to ",
  ];

  for (const input of whitespaceInputs) {
    const result = DemonstrativeTypeFactory.fromString(input);
    assert(result !== null, `Should handle whitespace in input: "${input}"`);
    if (result) {
      assertEquals(result.kind, "to", "Should trim whitespace");
    }
  }

  // Test invalid inputs return null
  const invalidInputs = [
    "", "   ", "invalid", "unknown", "123", "to-extra", "to_variant"
  ];

  for (const input of invalidInputs) {
    const result = DemonstrativeTypeFactory.fromString(input);
    assertEquals(result, null, `Should return null for invalid input: "${input}"`);
  }
});

Deno.test("Legacy Factories Behavior - LegacyLayerTypeFactory string conversion", () => {
  // Test valid string conversions
  const validInputs = [
    { input: "project", expected: "project" },
    { input: "issue", expected: "issue" },
    { input: "task", expected: "task" },
    { input: "bugs", expected: "bugs" },
    { input: "temp", expected: "temp" },
  ];

  for (const { input, expected } of validInputs) {
    const result = LegacyLayerTypeFactory.fromString(input);
    assert(result !== null, `Should convert valid input: ${input}`);
    if (result) {
      assertEquals(result.kind, expected, `Kind should match for input: ${input}`);
      assertEquals(result.value, expected, `Value should match for input: ${input}`);
    }
  }

  // Test case insensitive conversion
  const caseVariations = [
    "PROJECT", "Project", "PrOjEcT",
    "ISSUE", "Issue", "IsSuE",
    "TASK", "Task", "TaSk",
  ];

  for (const input of caseVariations) {
    const result = LegacyLayerTypeFactory.fromString(input);
    assert(result !== null, `Should handle case insensitive input: ${input}`);
    if (result) {
      assertEquals(result.kind.toLowerCase(), input.toLowerCase(), "Should normalize case");
    }
  }

  // Test invalid inputs return null
  const invalidInputs = [
    "", "   ", "invalid", "unknown", "layer", "project-extra"
  ];

  for (const input of invalidInputs) {
    const result = LegacyLayerTypeFactory.fromString(input);
    assertEquals(result, null, `Should return null for invalid input: "${input}"`);
  }
});

Deno.test("Legacy Factories Behavior - Type guard accuracy", () => {
  // Test DemonstrativeType guards
  const demonstrativeTypes: Array<{ type: DemonstrativeType; expectedGuard: string }> = [
    { type: DemonstrativeTypeFactory.to(), expectedGuard: "isTo" },
    { type: DemonstrativeTypeFactory.summary(), expectedGuard: "isSummary" },
    { type: DemonstrativeTypeFactory.defect(), expectedGuard: "isDefect" },
    { type: DemonstrativeTypeFactory.init(), expectedGuard: "isInit" },
    { type: DemonstrativeTypeFactory.find(), expectedGuard: "isFind" },
  ];

  for (const { type, expectedGuard } of demonstrativeTypes) {
    // Test correct guard returns true
    const correctResult = (DemonstrativeTypeGuards as any)[expectedGuard](type);
    assertEquals(correctResult, true, `${expectedGuard} should return true for matching type`);

    // Test other guards return false
    const otherGuards = ["isTo", "isSummary", "isDefect", "isInit", "isFind"]
      .filter(guard => guard !== expectedGuard);

    for (const otherGuard of otherGuards) {
      const otherResult = (DemonstrativeTypeGuards as any)[otherGuard](type);
      assertEquals(otherResult, false, `${otherGuard} should return false for ${type.kind} type`);
    }
  }

  // Test LegacyLayerType guards
  const layerTypes: Array<{ type: LegacyLayerType; expectedGuard: string }> = [
    { type: LegacyLayerTypeFactory.project(), expectedGuard: "isProject" },
    { type: LegacyLayerTypeFactory.issue(), expectedGuard: "isIssue" },
    { type: LegacyLayerTypeFactory.task(), expectedGuard: "isTask" },
    { type: LegacyLayerTypeFactory.bugs(), expectedGuard: "isBugs" },
    { type: LegacyLayerTypeFactory.temp(), expectedGuard: "isTemp" },
  ];

  for (const { type, expectedGuard } of layerTypes) {
    // Test correct guard returns true
    const correctResult = (LegacyLayerTypeGuards as any)[expectedGuard](type);
    assertEquals(correctResult, true, `${expectedGuard} should return true for matching type`);

    // Test other guards return false
    const otherGuards = ["isProject", "isIssue", "isTask", "isBugs", "isTemp"]
      .filter(guard => guard !== expectedGuard);

    for (const otherGuard of otherGuards) {
      const otherResult = (LegacyLayerTypeGuards as any)[otherGuard](type);
      assertEquals(otherResult, false, `${otherGuard} should return false for ${type.kind} type`);
    }
  }
});

Deno.test("Legacy Factories Behavior - Factory method consistency", () => {
  // Test that multiple calls to same factory method produce equivalent results
  const demonstrativeTests = [
    () => DemonstrativeTypeFactory.to(),
    () => DemonstrativeTypeFactory.summary(),
    () => DemonstrativeTypeFactory.defect(),
    () => DemonstrativeTypeFactory.init(),
    () => DemonstrativeTypeFactory.find(),
  ];

  for (const factory of demonstrativeTests) {
    const result1 = factory();
    const result2 = factory();
    
    // Should be equivalent but different instances
    assertEquals(result1.kind, result2.kind, "Multiple calls should produce equivalent kinds");
    assertEquals(result1.value, result2.value, "Multiple calls should produce equivalent values");
    // Note: Object identity may or may not be same depending on implementation
  }

  const layerTests = [
    () => LegacyLayerTypeFactory.project(),
    () => LegacyLayerTypeFactory.issue(),
    () => LegacyLayerTypeFactory.task(),
    () => LegacyLayerTypeFactory.bugs(),
    () => LegacyLayerTypeFactory.temp(),
  ];

  for (const factory of layerTests) {
    const result1 = factory();
    const result2 = factory();
    
    assertEquals(result1.kind, result2.kind, "Multiple calls should produce equivalent kinds");
    assertEquals(result1.value, result2.value, "Multiple calls should produce equivalent values");
  }
});

Deno.test("Legacy Factories Behavior - Alias factory equivalence", () => {
  // Test that alias factories produce identical results
  const directiveAliasTests = [
    { method: "to", expected: "to" },
    { method: "summary", expected: "summary" },
    { method: "defect", expected: "defect" },
    { method: "init", expected: "init" },
    { method: "find", expected: "find" },
  ];

  for (const { method, expected } of directiveAliasTests) {
    const originalResult = (DemonstrativeTypeFactory as any)[method]();
    const aliasResult = (DirectiveFactory as any)[method]();
    
    assertEquals(originalResult.kind, aliasResult.kind, `DirectiveFactory.${method} should match original`);
    assertEquals(originalResult.value, aliasResult.value, `DirectiveFactory.${method} should match original`);
    assertEquals(originalResult.kind, expected, `Should produce expected result: ${expected}`);
  }

  const layerAliasTests = [
    { method: "project", expected: "project" },
    { method: "issue", expected: "issue" },
    { method: "task", expected: "task" },
    { method: "bugs", expected: "bugs" },
    { method: "temp", expected: "temp" },
  ];

  for (const { method, expected } of layerAliasTests) {
    const originalResult = (LegacyLayerTypeFactory as any)[method]();
    const aliasResult = (LayerFactory as any)[method]();
    
    assertEquals(originalResult.kind, aliasResult.kind, `LayerFactory.${method} should match original`);
    assertEquals(originalResult.value, aliasResult.value, `LayerFactory.${method} should match original`);
    assertEquals(originalResult.kind, expected, `Should produce expected result: ${expected}`);
  }

  // Test fromString methods also work through aliases
  const directiveFromString = DirectiveFactory.fromString("to");
  const originalFromString = DemonstrativeTypeFactory.fromString("to");
  
  if (directiveFromString && originalFromString) {
    assertEquals(directiveFromString.kind, originalFromString.kind, "fromString should work through alias");
  }
});

Deno.test("Legacy Factories Behavior - Placeholder factory functionality", () => {
  // Test TwoParamsConfigFactory
  const configResult = TwoParamsConfigFactory.create();
  assertEquals(typeof configResult, "object", "TwoParamsConfigFactory should return object");
  
  // Multiple calls should work (even if they return empty objects)
  const configResult2 = TwoParamsConfigFactory.create();
  assertEquals(typeof configResult2, "object", "TwoParamsConfigFactory should work consistently");

  // Test VariableResultFactory success cases
  const successCases = [
    "string data",
    42,
    { complex: "object" },
    [1, 2, 3],
    null,
    undefined,
  ];

  for (const data of successCases) {
    const result = VariableResultFactory.createSuccess(data);
    assertEquals(result.ok, true, "createSuccess should create success result");
    assertStrictEquals(result.data, data, "createSuccess should preserve data exactly");
    assert(!("error" in result), "Success result should not have error property");
  }

  // Test VariableResultFactory error cases
  const errorCases = [
    "error message",
    new Error("test error"),
    { error: "object" },
    404,
  ];

  for (const error of errorCases) {
    const result = VariableResultFactory.createError(error);
    assertEquals(result.ok, false, "createError should create error result");
    assertStrictEquals(result.error, error, "createError should preserve error exactly");
    assert(!("data" in result), "Error result should not have data property");
  }
});

Deno.test("Legacy Factories Behavior - Edge case string handling", () => {
  // Test edge cases for string input processing
  const edgeCases = [
    { input: "to\n", expected: "to", description: "newline suffix" },
    { input: "\rto", expected: "to", description: "carriage return prefix" },
    { input: "\tto\t", expected: "to", description: "tab padding" },
    { input: "  to\n  ", expected: "to", description: "mixed whitespace" },
    { input: "TO", expected: "to", description: "uppercase" },
    { input: "To", expected: "to", description: "title case" },
    { input: "tO", expected: "to", description: "mixed case" },
  ];

  for (const { input, expected, description } of edgeCases) {
    const demonstrativeResult = DemonstrativeTypeFactory.fromString(input);
    assert(demonstrativeResult !== null, `Should handle ${description}: "${input}"`);
    if (demonstrativeResult) {
      assertEquals(demonstrativeResult.kind, expected, `Should normalize ${description}`);
    }
  }

  // Test special Unicode whitespace characters
  const unicodeWhitespace = [
    "\u00A0to\u00A0", // non-breaking space
    "\u2000to\u2000", // en quad
    "\u2028to\u2028", // line separator
  ];

  for (const input of unicodeWhitespace) {
    const result = DemonstrativeTypeFactory.fromString(input);
    // Behavior depends on implementation of trim() - some may handle Unicode whitespace
    assert(result === null || result.kind === "to", `Should handle Unicode whitespace predictably: "${input}"`);
  }
});

Deno.test("Legacy Factories Behavior - Type system integration", () => {
  // Test that legacy types integrate properly with type system
  function processDirective(directive: DemonstrativeType): string {
    switch (directive.kind) {
      case "to":
        return "transformation";
      case "summary":
        return "summarization";
      case "defect":
        return "defect analysis";
      case "init":
        return "initialization";
      case "find":
        return "search";
      default: {
        const _exhaustive: never = directive;
        return _exhaustive;
      }
    }
  }

  function processLayer(layer: LegacyLayerType): string {
    switch (layer.kind) {
      case "project":
        return "project level";
      case "issue":
        return "issue level";
      case "task":
        return "task level";
      case "bugs":
        return "bug level";
      case "temp":
        return "temporary level";
      default: {
        const _exhaustive: never = layer;
        return _exhaustive;
      }
    }
  }

  // Test all directive types work with type system
  const directives = [
    { type: DemonstrativeTypeFactory.to(), expected: "transformation" },
    { type: DemonstrativeTypeFactory.summary(), expected: "summarization" },
    { type: DemonstrativeTypeFactory.defect(), expected: "defect analysis" },
    { type: DemonstrativeTypeFactory.init(), expected: "initialization" },
    { type: DemonstrativeTypeFactory.find(), expected: "search" },
  ];

  for (const { type, expected } of directives) {
    const result = processDirective(type);
    assertEquals(result, expected, `Type system integration should work for ${type.kind}`);
  }

  // Test all layer types work with type system
  const layers = [
    { type: LegacyLayerTypeFactory.project(), expected: "project level" },
    { type: LegacyLayerTypeFactory.issue(), expected: "issue level" },
    { type: LegacyLayerTypeFactory.task(), expected: "task level" },
    { type: LegacyLayerTypeFactory.bugs(), expected: "bug level" },
    { type: LegacyLayerTypeFactory.temp(), expected: "temporary level" },
  ];

  for (const { type, expected } of layers) {
    const result = processLayer(type);
    assertEquals(result, expected, `Type system integration should work for ${type.kind}`);
  }
});