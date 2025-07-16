/**
 * @fileoverview Structure tests for ParameterValidator
 *
 * Testing focus areas:
 * 1. Domain boundaries - Value objects (DirectiveType, LayerType) encapsulation
 * 2. Result type error handling - Comprehensive validation error patterns
 * 3. Smart Constructor pattern - Immutability and type safety guarantees
 *
 * @module lib/validator/2_structure_parameter_validator_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  type ConfigValidator,
  ParameterValidatorV2 as ParameterValidator,
  type ValidationError,
} from "./parameter_validator_v2.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";
import type { OneParamsResult, TwoParams_Result, ZeroParamsResult } from "../deps.ts";
import { isError, isOk } from "../types/result.ts";
import {
  DirectiveType,
  TwoParamsDirectivePattern,
} from "../domain/core/value_objects/directive_type.ts";
import { LayerType, TwoParamsLayerTypePattern } from "../domain/core/value_objects/layer_type.ts";

// Mock implementations
class MockPatternProvider implements TypePatternProvider {
  validateDirectiveType(value: string): boolean {
    return ["to", "summary", "defect"].includes(value);
  }

  validateLayerType(value: string): boolean {
    return ["project", "issue", "task"].includes(value);
  }

  getValidDirectiveTypes(): readonly string[] {
    return ["to", "summary", "defect"];
  }

  getValidLayerTypes(): readonly string[] {
    return ["project", "issue", "task"];
  }

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    return TwoParamsDirectivePattern.create("^(to|summary|defect)$");
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    return TwoParamsLayerTypePattern.create("^(project|issue|task)$");
  }
}

class MockConfigValidator implements ConfigValidator {
  validateConfig(_config: unknown) {
    return { ok: true as const, data: undefined };
  }
}

// Test data factory
const createValidTwoParams = (
  directiveType = "to",
  layerType = "project",
  options: Record<string, unknown> = {},
): TwoParams_Result => ({
  type: "two",
  directiveType,
  demonstrativeType: directiveType,
  layerType,
  params: [directiveType, layerType],
  options,
});

Deno.test("2_structure: ParameterValidator maintains domain boundaries with value objects", () => {
  const validator = new ParameterValidator(new MockPatternProvider(), new MockConfigValidator());
  const result = validator.validateTwoParams(createValidTwoParams());

  if (isOk(result)) {
    const validated = result.data;

    // Test that DirectiveType is properly encapsulated
    assertExists(validated.directive);
    assertEquals(validated.directive instanceof DirectiveType, true);
    assertEquals(typeof validated.directive.value, "string");
    assertEquals(validated.directive.value, "to");

    // Test that LayerType is properly encapsulated
    assertExists(validated.layer);
    assertEquals(validated.layer instanceof LayerType, true);
    assertEquals(typeof validated.layer.value, "string");
    assertEquals(validated.layer.value, "project");

    // Verify value objects are immutable (no direct property access)
    assertEquals("directiveType" in validated.directive, false);
    assertEquals("layerType" in validated.layer, false);
  }
});

Deno.test("2_structure: ParameterValidator Result type provides comprehensive error handling", () => {
  const validator = new ParameterValidator(new MockPatternProvider(), new MockConfigValidator());

  // Test missing required field error structure
  const missingFieldResult = validator.validateTwoParams({
    type: "two",
    directiveType: "",
    demonstrativeType: "",
    layerType: "project",
    params: ["", "project"],
    options: {},
  });

  assertEquals(isError(missingFieldResult), true);
  if (isError(missingFieldResult)) {
    const error = missingFieldResult.error;
    assertEquals(error.kind, "ParamsTypeError");
    if (error.kind === "ParamsTypeError") {
      assertExists(error.error);
    }
  }

  // Test invalid directive type error structure
  const invalidDirectiveResult = validator.validateTwoParams(
    createValidTwoParams("invalid", "project"),
  );

  assertEquals(isError(invalidDirectiveResult), true);
  if (isError(invalidDirectiveResult)) {
    const error = invalidDirectiveResult.error;
    assertEquals(error.kind, "TypeCreationError");
    if (error.kind === "TypeCreationError") {
      assertEquals(error.type, "directive");
      assertEquals(error.value, "invalid");
    }
  }

  // Test invalid layer type error structure
  const invalidLayerResult = validator.validateTwoParams(
    createValidTwoParams("to", "invalid"),
  );

  assertEquals(isError(invalidLayerResult), true);
  if (isError(invalidLayerResult)) {
    const error = invalidLayerResult.error;
    assertEquals(error.kind, "TypeCreationError");
    if (error.kind === "TypeCreationError") {
      assertEquals(error.type, "layer");
      assertEquals(error.value, "invalid");
    }
  }
});

Deno.test("2_structure: ValidatedParams structure maintains consistency and completeness", () => {
  const validator = new ParameterValidator(new MockPatternProvider(), new MockConfigValidator());

  const options = {
    fromFile: "input.md",
    destinationFile: "output.json",
    schemaFile: "schema.json",
    promptFile: "template.md",
    input_text: "test content",
    profile: "production",
    "uv-custom": "value",
    "uv-numeric": 42,
    "uv-boolean": true,
  };

  const result = validator.validateTwoParams(createValidTwoParams("summary", "task", options));

  if (isOk(result)) {
    const validated = result.data;

    // Test options structure
    assertExists(validated.options);
    assertEquals(validated.options.inputPath, "input.md");
    assertEquals(validated.options.outputPath, "output.json");
    assertEquals(validated.options.schemaPath, "schema.json");
    assertEquals(validated.options.promptPath, "template.md");
    assertEquals(validated.options.stdin, "test content");

    // Test custom variables extraction
    assertExists(validated.customVariables);
    assertEquals(validated.customVariables["uv-custom"], "value");
    assertEquals(validated.customVariables["uv-numeric"], "42");
    assertEquals(validated.customVariables["uv-boolean"], "true");

    // Test metadata structure
    assertExists(validated.metadata);
    assertEquals(validated.metadata.source, "TwoParams_Result");
    assertEquals(validated.metadata.profileName, "production");
    assertEquals(validated.metadata.validatedAt instanceof Date, true);
  }
});

Deno.test("2_structure: ParameterValidator handles OneParams with proper defaults", () => {
  const validator = new ParameterValidator(new MockPatternProvider(), new MockConfigValidator());

  const oneParamResult: OneParamsResult = {
    type: "one",
    demonstrativeType: "project",
    params: ["project"],
    options: { debug: true },
  };

  const result = validator.validateOneParams(oneParamResult);

  if (isOk(result)) {
    const validated = result.data;

    // Should create default directive
    assertEquals(validated.directive.value, "init");
    // Should use param as layer
    assertEquals(validated.layer.value, "project");
    // Should preserve metadata source
    assertEquals(validated.metadata.source, "OneParamsResult");
    // Should preserve options
    assertEquals(validated.options.inputPath, "stdin");
    assertEquals(validated.options.outputPath, "stdout");
  }
});

Deno.test("2_structure: ParameterValidator handles ZeroParams with complete defaults", () => {
  const validator = new ParameterValidator(new MockPatternProvider(), new MockConfigValidator());

  const zeroParamResult: ZeroParamsResult = {
    type: "zero",
    params: [],
    options: { profile: "test" },
  };

  const result = validator.validateZeroParams(zeroParamResult);

  if (isOk(result)) {
    const validated = result.data;

    // Should use complete defaults
    assertEquals(validated.directive.value, "init");
    assertEquals(validated.layer.value, "project");
    // Should preserve metadata source
    assertEquals(validated.metadata.source, "ZeroParamsResult");
    // Should preserve profile
    assertEquals(validated.metadata.profileName, "test");
  }
});

Deno.test("2_structure: ValidationError discriminated union provides type safety", () => {
  const validator = new ParameterValidator(new MockPatternProvider(), new MockConfigValidator());

  // Test each error kind has proper structure
  const errorTestCases: Array<[TwoParams_Result, ValidationError["kind"]]> = [
    [{ ...createValidTwoParams(), type: "one" as unknown as "two" }, "ParamsTypeError"],
    [createValidTwoParams("", "project"), "ParamsTypeError"],
    [createValidTwoParams("invalid", "project"), "TypeCreationError"],
    [createValidTwoParams("to", "invalid"), "TypeCreationError"],
  ];

  for (const [params, expectedKind] of errorTestCases) {
    const result = validator.validateTwoParams(params);

    if (isError(result)) {
      assertEquals(result.error.kind, expectedKind);

      // Verify discriminated union structure
      switch (result.error.kind) {
        case "ParamsTypeError":
        case "PathValidationError":
        case "OptionsNormalizationError":
        case "CustomVariableError":
          assertExists(result.error.error);
          break;
        case "TypeCreationError":
          assertExists(result.error.type);
          assertExists(result.error.value);
          break;
      }
    }
  }
});

Deno.test("2_structure: Path validation maintains consistent error structures", () => {
  const validator = new ParameterValidator(new MockPatternProvider(), new MockConfigValidator());

  // Test path with null character
  const nullCharResult = validator.validateTwoParams(
    createValidTwoParams("to", "project", { fromFile: "file\0name.txt" }),
  );

  if (isError(nullCharResult)) {
    assertEquals(nullCharResult.error.kind, "PathValidationFailed");
    if (nullCharResult.error.kind === "PathValidationError") {
      assertExists(nullCharResult.error.error);
    }
  }

  // Test empty path
  const emptyPathResult = validator.validateTwoParams(
    createValidTwoParams("to", "project", { fromFile: "   " }),
  );

  if (isError(emptyPathResult)) {
    assertEquals(emptyPathResult.error.kind, "PathValidationFailed");
    if (emptyPathResult.error.kind === "PathValidationError") {
      assertExists(emptyPathResult.error.error);
    }
  }
});

Deno.test("2_structure: Custom variables validation ensures type coercion", () => {
  const validator = new ParameterValidator(new MockPatternProvider(), new MockConfigValidator());

  const complexOptions = {
    "uv-string": "text",
    "uv-number": 123,
    "uv-boolean": false,
    "uv-zero": 0,
    "uv-empty": "",
    "regular-option": "ignored",
    "uvNotPrefixed": "ignored",
  };

  const result = validator.validateTwoParams(
    createValidTwoParams("to", "project", complexOptions),
  );

  if (isOk(result)) {
    const customVars = result.data.customVariables;

    // Test type coercion
    assertEquals(customVars["uv-string"], "text");
    assertEquals(customVars["uv-number"], "123");
    assertEquals(customVars["uv-boolean"], "false");
    assertEquals(customVars["uv-zero"], "0");
    assertEquals(customVars["uv-empty"], "");

    // Test filtering
    assertEquals("regular-option" in customVars, false);
    assertEquals("uvNotPrefixed" in customVars, false);

    // Count extracted variables
    assertEquals(Object.keys(customVars).length, 5);
  }
});

Deno.test("2_structure: ValidatedOptions normalizes multiple path aliases", () => {
  const validator = new ParameterValidator(new MockPatternProvider(), new MockConfigValidator());

  // Test different input aliases
  const inputAliases = [
    { fromFile: "input1.txt" },
    { from: "input2.txt" },
    { input: "input3.txt" },
  ];

  for (const alias of inputAliases) {
    const result = validator.validateTwoParams(
      createValidTwoParams("to", "project", alias),
    );

    if (isOk(result)) {
      assertExists(result.data.options.inputPath);
      assertEquals(result.data.options.inputPath.startsWith("input"), true);
    }
  }

  // Test different output aliases
  const outputAliases = [
    { destinationFile: "output1.txt" },
    { destination: "output2.txt" },
    { output: "output3.txt" },
  ];

  for (const alias of outputAliases) {
    const result = validator.validateTwoParams(
      createValidTwoParams("to", "project", alias),
    );

    if (isOk(result)) {
      assertExists(result.data.options.outputPath);
      assertEquals(result.data.options.outputPath.startsWith("output"), true);
    }
  }
});

Deno.test("2_structure: Metadata structure provides full traceability", () => {
  const validator = new ParameterValidator(new MockPatternProvider(), new MockConfigValidator());

  const beforeValidation = new Date();

  const result = validator.validateTwoParams(
    createValidTwoParams("to", "project", { profile: "staging" }),
  );

  const afterValidation = new Date();

  if (isOk(result)) {
    const metadata = result.data.metadata;

    // Test timestamp
    assertEquals(metadata.validatedAt >= beforeValidation, true);
    assertEquals(metadata.validatedAt <= afterValidation, true);

    // Test source tracking
    assertEquals(metadata.source, "TwoParams");

    // Test profile extraction
    assertEquals(metadata.profileName, "staging");
  }

  // Test different sources
  const oneParamResult = validator.validateOneParams({
    type: "one",
    demonstrativeType: "project",
    params: ["project"],
    options: {},
  });

  if (isOk(oneParamResult)) {
    assertEquals(oneParamResult.data.metadata.source, "OneParams");
  }

  const zeroParamResult = validator.validateZeroParams({
    type: "zero",
    params: [],
    options: {},
  });

  if (isOk(zeroParamResult)) {
    assertEquals(zeroParamResult.data.metadata.source, "ZeroParams");
  }
});
