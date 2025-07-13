/**
 * @fileoverview Structure tests for ParamsTypeValidator
 *
 * Testing focus areas:
 * 1. Domain boundaries - ValidatedParamsType encapsulation
 * 2. Result type error handling - Discriminated union error patterns
 * 3. Smart Constructor pattern - Type safety through validation
 *
 * @module lib/validator/2_structure_params_type_validator_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { type ParamsResult, ParamsTypeValidator } from "./params_type_validator.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";
import { isError, isOk } from "../types/result.ts";
import { TwoParamsDirectivePattern } from "../domain/core/value_objects/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../domain/core/value_objects/layer_type.ts";

// Mock pattern provider
class MockPatternProvider implements TypePatternProvider {
  validateDirectiveType(value: string): boolean {
    return ["to", "summary", "defect", "init"].includes(value);
  }

  validateLayerType(value: string): boolean {
    return ["project", "issue", "task"].includes(value);
  }

  getValidDirectiveTypes(): readonly string[] {
    return ["to", "summary", "defect", "init"];
  }

  getValidLayerTypes(): readonly string[] {
    return ["project", "issue", "task"];
  }

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    return TwoParamsDirectivePattern.create("^(to|summary|defect|init)$");
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    return TwoParamsLayerTypePattern.create("^(project|issue|task)$");
  }
}

Deno.test("2_structure: ParamsTypeValidator enforces ValidatedParamsType structure", () => {
  const validator = new ParamsTypeValidator(new MockPatternProvider());

  // Test two params validation
  const twoParamsResult = validator.validate({
    type: "two",
    directiveType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: { debug: true },
  });

  if (isOk(twoParamsResult)) {
    const validated = twoParamsResult.data;

    // Verify structure integrity
    assertEquals(validated.type, "two");
    assertEquals(validated.directiveType, "to");
    assertEquals(validated.layerType, "project");
    assertEquals(Array.isArray(validated.params), true);
    assertEquals(validated.params.length, 2);
    assertExists(validated.options);

    // Verify type constraint
    assertEquals(["zero", "one", "two"].includes(validated.type), true);
  }
});

Deno.test("2_structure: ParamsTypeError discriminated union provides type safety", () => {
  const validator = new ParamsTypeValidator(new MockPatternProvider());

  // Test InvalidParamsType error
  const invalidTypeResult = validator.validate({
    type: "three",
    params: ["a", "b", "c"],
  });

  if (isError(invalidTypeResult)) {
    assertEquals(invalidTypeResult.error.kind, "InvalidParamsType");
    if (invalidTypeResult.error.kind === "InvalidParamsType") {
      assertExists(invalidTypeResult.error.expected);
      assertExists(invalidTypeResult.error.received);
      assertEquals(invalidTypeResult.error.expected, "zero, one, or two");
      assertEquals(invalidTypeResult.error.received, "three");
    }
  }

  // Test MissingRequiredField error
  const missingFieldResult = validator.validate({
    type: "two",
    layerType: "project",
    params: ["to", "project"],
  });

  if (isError(missingFieldResult)) {
    assertEquals(missingFieldResult.error.kind, "MissingRequiredField");
    if (missingFieldResult.error.kind === "MissingRequiredField") {
      assertEquals(missingFieldResult.error.field, "directiveType");
      assertEquals(missingFieldResult.error.source, "TwoParams");
    }
  }

  // Test InvalidFieldValue error
  const invalidValueResult = validator.validate({
    type: "two",
    directiveType: "invalid",
    layerType: "project",
    params: ["invalid", "project"],
  });

  if (isError(invalidValueResult)) {
    assertEquals(invalidValueResult.error.kind, "InvalidFieldValue");
    if (invalidValueResult.error.kind === "InvalidFieldValue") {
      assertEquals(invalidValueResult.error.field, "directiveType");
      assertEquals(invalidValueResult.error.value, "invalid");
      assertExists(invalidValueResult.error.pattern);
    }
  }
});

Deno.test("2_structure: Two params validation enforces structural integrity", () => {
  const validator = new ParamsTypeValidator(new MockPatternProvider());

  // Test params array validation
  const wrongParamsCountResult = validator.validate({
    type: "two",
    directiveType: "to",
    layerType: "project",
    params: ["to"], // Wrong count
  });

  if (isError(wrongParamsCountResult)) {
    assertEquals(wrongParamsCountResult.error.kind, "InvalidFieldType");
    if (wrongParamsCountResult.error.kind === "InvalidFieldType") {
      assertEquals(wrongParamsCountResult.error.field, "params");
      assertEquals(wrongParamsCountResult.error.expected, "array of 2 strings");
      assertEquals(wrongParamsCountResult.error.received, "array of 1");
    }
  }

  // Test missing params array
  const missingParamsResult = validator.validate({
    type: "two",
    directiveType: "to",
    layerType: "project",
  });

  if (isError(missingParamsResult)) {
    assertEquals(missingParamsResult.error.kind, "InvalidFieldType");
    if (missingParamsResult.error.kind === "InvalidFieldType") {
      assertEquals(missingParamsResult.error.field, "params");
      assertEquals(missingParamsResult.error.received, "undefined");
    }
  }
});

Deno.test("2_structure: One param validation with inference logic", () => {
  const validator = new ParamsTypeValidator(new MockPatternProvider());

  // Test layer type inference
  const layerParamResult = validator.validate({
    type: "one",
    params: ["project"],
  });

  if (isOk(layerParamResult)) {
    const validated = layerParamResult.data;
    assertEquals(validated.type, "one");
    assertEquals(validated.directiveType, "init"); // Default directive
    assertEquals(validated.layerType, "project");
    assertEquals(validated.params.length, 1);
  }

  // Test directive type inference
  const directiveParamResult = validator.validate({
    type: "one",
    params: ["summary"],
  });

  if (isOk(directiveParamResult)) {
    const validated = directiveParamResult.data;
    assertEquals(validated.type, "one");
    assertEquals(validated.directiveType, "summary");
    assertEquals(validated.layerType, "project"); // Default layer
  }

  // Test unrecognized param
  const unknownParamResult = validator.validate({
    type: "one",
    params: ["unknown"],
  });

  if (isError(unknownParamResult)) {
    assertEquals(unknownParamResult.error.kind, "IncompatibleParams");
    if (unknownParamResult.error.kind === "IncompatibleParams") {
      assertExists(unknownParamResult.error.reason);
      assertEquals(unknownParamResult.error.reason.includes("unknown"), true);
    }
  }
});

Deno.test("2_structure: Zero params validation applies defaults consistently", () => {
  const validator = new ParamsTypeValidator(new MockPatternProvider());

  const zeroParamsResult = validator.validate({
    type: "zero",
    options: { profile: "test" },
  });

  if (isOk(zeroParamsResult)) {
    const validated = zeroParamsResult.data;

    // Verify defaults are applied
    assertEquals(validated.type, "zero");
    assertEquals(validated.directiveType, "init");
    assertEquals(validated.layerType, "project");
    assertEquals(validated.params.length, 0);

    // Verify options are preserved
    assertExists(validated.options);
    assertEquals(validated.options.profile, "test");
  }
});

Deno.test("2_structure: Pattern validation maintains consistency", () => {
  const validator = new ParamsTypeValidator(new MockPatternProvider());

  const validPatterns = [
    { directive: "to", layer: "project" },
    { directive: "summary", layer: "issue" },
    { directive: "defect", layer: "task" },
    { directive: "init", layer: "project" },
  ];

  for (const { directive, layer } of validPatterns) {
    const result = validator.validate({
      type: "two",
      directiveType: directive,
      layerType: layer,
      params: [directive, layer],
    });

    assertEquals(isOk(result), true);
    if (isOk(result)) {
      assertEquals(result.data.directiveType, directive);
      assertEquals(result.data.layerType, layer);
    }
  }

  const invalidPatterns = [
    { directive: "invalid", layer: "project" },
    { directive: "to", layer: "invalid" },
    { directive: "", layer: "project" },
    { directive: "to", layer: "" },
  ];

  for (const { directive, layer } of invalidPatterns) {
    const result = validator.validate({
      type: "two",
      directiveType: directive,
      layerType: layer,
      params: [directive, layer],
    });

    assertEquals(isError(result), true);
  }
});

Deno.test("2_structure: Options handling preserves original data", () => {
  const validator = new ParamsTypeValidator(new MockPatternProvider());

  const complexOptions = {
    debug: true,
    profile: "production",
    nested: {
      deep: "value",
      array: [1, 2, 3],
    },
    "special-key": "special-value",
  };

  const result = validator.validate({
    type: "two",
    directiveType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: complexOptions,
  });

  if (isOk(result)) {
    const validated = result.data;

    // Verify options are preserved exactly
    assertEquals(validated.options.debug, true);
    assertEquals(validated.options.profile, "production");
    assertExists(validated.options.nested);
    assertEquals((validated.options.nested as Record<string, unknown>).deep, "value");
    assertEquals(Array.isArray((validated.options.nested as Record<string, unknown>).array), true);
    assertEquals(validated.options["special-key"], "special-value");
  }
});

Deno.test("2_structure: ParamsResult interface compatibility", () => {
  const validator = new ParamsTypeValidator(new MockPatternProvider());

  // Test minimal ParamsResult
  const minimalResult: ParamsResult = {
    type: "zero",
  };

  const minimalValidation = validator.validate(minimalResult);
  assertEquals(isOk(minimalValidation), true);

  // Test full ParamsResult
  const fullResult: ParamsResult = {
    type: "two",
    directiveType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: { key: "value" },
  };

  const fullValidation = validator.validate(fullResult);
  assertEquals(isOk(fullValidation), true);

  // Test partial ParamsResult
  const partialResult: ParamsResult = {
    type: "one",
    params: ["project"],
  };

  const partialValidation = validator.validate(partialResult);
  assertEquals(isOk(partialValidation), true);
});

Deno.test("2_structure: Error pattern consistency across validation methods", () => {
  // Test with null pattern provider
  class NullPatternProvider implements TypePatternProvider {
    validateDirectiveType(value: string): boolean {
      return false;
    }

    validateLayerType(value: string): boolean {
      return false;
    }

    getValidDirectiveTypes(): readonly string[] {
      return [];
    }

    getValidLayerTypes(): readonly string[] {
      return [];
    }

    getDirectivePattern(): TwoParamsDirectivePattern | null {
      return null;
    }

    getLayerTypePattern(): TwoParamsLayerTypePattern | null {
      return null;
    }
  }

  const validator = new ParamsTypeValidator(new NullPatternProvider());

  const result = validator.validate({
    type: "two",
    directiveType: "any",
    layerType: "any",
    params: ["any", "any"],
  });

  if (isError(result)) {
    assertEquals(result.error.kind, "InvalidFieldValue");
    if (result.error.kind === "InvalidFieldValue") {
      assertEquals(result.error.pattern, "no pattern available");
    }
  }
});

Deno.test("2_structure: ValidatedParamsType guarantees complete data", () => {
  const validator = new ParamsTypeValidator(new MockPatternProvider());

  const testCases: ParamsResult[] = [
    { type: "zero" },
    { type: "one", params: ["project"] },
    { type: "two", directiveType: "to", layerType: "project", params: ["to", "project"] },
  ];

  for (const testCase of testCases) {
    const result = validator.validate(testCase);

    if (isOk(result)) {
      const validated = result.data;

      // All validated results must have these fields
      assertExists(validated.type);
      assertExists(validated.directiveType);
      assertExists(validated.layerType);
      assertExists(validated.params);
      assertExists(validated.options);

      // Verify types
      assertEquals(typeof validated.type, "string");
      assertEquals(typeof validated.directiveType, "string");
      assertEquals(typeof validated.layerType, "string");
      assertEquals(Array.isArray(validated.params), true);
      assertEquals(typeof validated.options, "object");
    }
  }
});
