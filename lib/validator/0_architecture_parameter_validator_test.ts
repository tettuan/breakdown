/**
 * @fileoverview Unit tests for ParameterValidator
 *
 * This test file covers comprehensive validation scenarios including:
 * - Smart Constructor pattern validation
 * - Result type error handling
 * - Totality verification (exhaustive case coverage)
 * - Edge cases and error conditions
 *
 * @module validator/parameter_validator_test
 */

import { assertEquals, assertFalse } from "@std/assert";
import { ParameterValidator, type ValidatedParams } from "./parameter_validator.ts";
import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import type { ConfigValidator } from "./parameter_validator.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";
import type { OneParamsResult, TwoParams_Result, ZeroParamsResult } from "../deps.ts";
import type { ValidationError } from "../types/unified_error_types.ts";
import type { FactoryCreation_Result } from "../helpers/totality_factory_helper.ts";

import { TwoParamsDirectivePattern } from "../types/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../types/layer_type.ts";

// Mock TypePatternProvider for testing
class MockTypePatternProvider implements TypePatternProvider {
  private directivePattern = TwoParamsDirectivePattern.create("^(to|summary|defect|init)$");
  private layerTypePattern = TwoParamsLayerTypePattern.create("^(project|issue|task)$");

  getDirectivePattern() {
    return this.directivePattern;
  }

  getLayerTypePattern() {
    return this.layerTypePattern;
  }
}

// Mock ConfigValidator for testing
class MockConfigValidator implements ConfigValidator {
  private shouldFail: boolean;

  constructor(shouldFail = false) {
    this.shouldFail = shouldFail;
  }

  validateConfig(config: unknown): Result<void, string[]> {
    if (this.shouldFail) {
      return error(["Config validation failed"]);
    }
    return ok(undefined);
  }
}

// Test fixtures
const createValidTwoParamsResult = (): TwoParams_Result => ({
  type: "two",
  demonstrativeType: "to",
  layerType: "project",
  params: ["to", "project"],
  options: {
    fromFile: "input.md",
    destinationFile: "output.md",
    schemaFile: "schema.json",
    profile: "test-profile",
    "uv-customVar": "customValue",
  },
});

const createValidOneParamsResult = (): OneParamsResult => ({
  type: "one",
  demonstrativeType: "project",
  params: ["project"],
  options: {
    fromFile: "input.md",
    destinationFile: "output.md",
  },
});

const createValidZeroParamsResult = (): ZeroParamsResult => ({
  type: "zero",
  params: [],
  options: {
    fromFile: "input.md",
    destinationFile: "output.md",
  },
});

// =============================================================================
// ParameterValidator Constructor Tests (Smart Constructor Pattern)
// =============================================================================

Deno.test("ParameterValidator: Smart Constructor - creates instance with valid dependencies", () => {
  const patternProvider = new MockTypePatternProvider();
  const configValidator = new MockConfigValidator();

  const validator = new ParameterValidator(patternProvider, configValidator);

  // Should not throw and be properly initialized
  assertEquals(typeof validator.validateTwoParams, "function");
  assertEquals(typeof validator.validateOneParams, "function");
  assertEquals(typeof validator.validateZeroParams, "function");
});

// =============================================================================
// TwoParams Validation Tests (Totality Verification)
// =============================================================================

Deno.test("ParameterValidator: validateTwoParams - valid parameters return success", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const validResult = createValidTwoParamsResult();
  const result = validator.validateTwoParams(validResult);

  assertEquals(result.ok, true);
  if (result.ok) {
    const validated: ValidatedParams = result.data;
    assertEquals(validated.metadata.source, "TwoParams_Result");
    assertEquals(validated.metadata.profileName, "test-profile");
    assertEquals(validated.options.inputPath, "input.md");
    assertEquals(validated.options.outputPath, "output.md");
    assertEquals(validated.options.schemaPath, "schema.json");
    assertEquals(validated.customVariables["uv-customVar"], "customValue");
  }
});

Deno.test("ParameterValidator: validateTwoParams - invalid params type returns error", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const invalidResult = { ...createValidTwoParamsResult(), type: "invalid" as "two" };
  const result = validator.validateTwoParams(invalidResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    const error: ValidationError = result.error;
    assertEquals(error.kind, "InvalidParamsType");
    // Double Type Guard Pattern
    if (error.kind === "InvalidParamsType") {
      assertEquals(error.expected, "two");
      assertEquals(error.received, "invalid");
    }
  }
});

Deno.test("ParameterValidator: validateTwoParams - missing demonstrativeType returns error", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const invalidResult = { ...createValidTwoParamsResult(), demonstrativeType: "" };
  const result = validator.validateTwoParams(invalidResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    const error: ValidationError = result.error;
    assertEquals(error.kind, "MissingRequiredField");
    // Double Type Guard Pattern
    if (error.kind === "MissingRequiredField") {
      assertEquals(error.field, "demonstrativeType");
      assertEquals(error.source, "TwoParams_Result");
    }
  }
});

Deno.test("ParameterValidator: validateTwoParams - missing layerType returns error", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const invalidResult = { ...createValidTwoParamsResult(), layerType: "" };
  const result = validator.validateTwoParams(invalidResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    const error: ValidationError = result.error;
    assertEquals(error.kind, "MissingRequiredField");
    if (error.kind === "MissingRequiredField") {
      assertEquals(error.field, "layerType");
      assertEquals(error.source, "TwoParams_Result");
    }
  }
});

Deno.test("ParameterValidator: validateTwoParams - invalid directive type returns error", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const invalidResult = { ...createValidTwoParamsResult(), demonstrativeType: "invalid" };
  const result = validator.validateTwoParams(invalidResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    const error: ValidationError = result.error;
    assertEquals(error.kind, "InvalidDirectiveType");
    if (error.kind === "InvalidDirectiveType") {
      assertEquals(error.value, "invalid");
    }
  }
});

Deno.test("ParameterValidator: validateTwoParams - invalid layer type returns error", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const invalidResult = { ...createValidTwoParamsResult(), layerType: "invalid" };
  const result = validator.validateTwoParams(invalidResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    const error: ValidationError = result.error;
    assertEquals(error.kind, "InvalidLayerType");
    if (error.kind === "InvalidLayerType") {
      assertEquals(error.value, "invalid");
    }
  }
});

// =============================================================================
// OneParams Validation Tests
// =============================================================================

Deno.test("ParameterValidator: validateOneParams - valid parameters return success", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const validResult = createValidOneParamsResult();
  const result = validator.validateOneParams(validResult);

  assertEquals(result.ok, true);
  if (result.ok) {
    const validated: ValidatedParams = result.data;
    assertEquals(validated.metadata.source, "OneParamsResult");
    assertEquals(validated.options.inputPath, "input.md");
    assertEquals(validated.options.outputPath, "output.md");
  }
});

Deno.test("ParameterValidator: validateOneParams - invalid params type returns error", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const invalidResult = { ...createValidOneParamsResult(), type: "invalid" as "one" };
  const result = validator.validateOneParams(invalidResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    const error: ValidationError = result.error;
    assertEquals(error.kind, "InvalidParamsType");
    if (error.kind === "InvalidParamsType") {
      assertEquals(error.expected, "one");
      assertEquals(error.received, "invalid");
    }
  }
});

Deno.test("ParameterValidator: validateOneParams - missing params returns error", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const invalidResult = { ...createValidOneParamsResult(), params: [] };
  const result = validator.validateOneParams(invalidResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    const error: ValidationError = result.error;
    assertEquals(error.kind, "MissingRequiredField");
    if (error.kind === "MissingRequiredField") {
      assertEquals(error.field, "params");
      assertEquals(error.source, "OneParamsResult");
    }
  }
});

// =============================================================================
// ZeroParams Validation Tests
// =============================================================================

Deno.test("ParameterValidator: validateZeroParams - valid parameters return success", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const validResult = createValidZeroParamsResult();
  const result = validator.validateZeroParams(validResult);

  assertEquals(result.ok, true);
  if (result.ok) {
    const validated: ValidatedParams = result.data;
    assertEquals(validated.metadata.source, "ZeroParamsResult");
    assertEquals(validated.options.inputPath, "input.md");
    assertEquals(validated.options.outputPath, "output.md");
  }
});

Deno.test("ParameterValidator: validateZeroParams - invalid params type returns error", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const invalidResult = { ...createValidZeroParamsResult(), type: "invalid" as "zero" };
  const result = validator.validateZeroParams(invalidResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    const error: ValidationError = result.error;
    assertEquals(error.kind, "InvalidParamsType");
    if (error.kind === "InvalidParamsType") {
      assertEquals(error.expected, "zero");
      assertEquals(error.received, "invalid");
    }
  }
});

// =============================================================================
// Path Validation Tests (Edge Cases)
// =============================================================================

Deno.test("ParameterValidator: path validation - stdin/stdout are valid", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const result = createValidTwoParamsResult();
  result.options = {}; // No paths specified, should default to stdin/stdout

  const validationResult = validator.validateTwoParams(result);

  assertEquals(validationResult.ok, true);
  if (validationResult.ok) {
    assertEquals(validationResult.data.options.inputPath, "stdin");
    assertEquals(validationResult.data.options.outputPath, "stdout");
  }
});

Deno.test("ParameterValidator: path validation - null character in path returns error", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const result = createValidTwoParamsResult();
  result.options = { fromFile: "test\0file.md" };

  const validationResult = validator.validateTwoParams(result);

  assertEquals(validationResult.ok, false);
  if (!validationResult.ok) {
    assertEquals(validationResult.error.kind, "PathValidationFailed");
    if (validationResult.error.kind === "PathValidationFailed") {
      assertEquals(validationResult.error.reason, "Path contains null character");
    }
  }
});

Deno.test("ParameterValidator: path validation - empty path returns error", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const result = createValidTwoParamsResult();
  result.options = { fromFile: "   " }; // Empty/whitespace path

  const validationResult = validator.validateTwoParams(result);

  assertEquals(validationResult.ok, false);
  if (!validationResult.ok) {
    assertEquals(validationResult.error.kind, "PathValidationFailed");
    if (validationResult.error.kind === "PathValidationFailed") {
      assertEquals(validationResult.error.reason, "input path cannot be empty");
    }
  }
});

// =============================================================================
// Custom Variables Validation Tests
// =============================================================================

Deno.test("ParameterValidator: custom variables - valid uv- prefixed variables", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const result = createValidTwoParamsResult();
  result.options = {
    "uv-stringVar": "text",
    "uv-numberVar": 42,
    "uv-boolVar": true,
    "normalVar": "ignored",
  };

  const validationResult = validator.validateTwoParams(result);

  assertEquals(validationResult.ok, true);
  if (validationResult.ok) {
    const customVars = validationResult.data.customVariables;
    assertEquals(customVars["uv-stringVar"], "text");
    assertEquals(customVars["uv-numberVar"], "42");
    assertEquals(customVars["uv-boolVar"], "true");
    assertEquals(customVars["normalVar"], undefined);
  }
});

Deno.test("ParameterValidator: custom variables - invalid variable type returns error", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const result = createValidTwoParamsResult();
  result.options = {
    "uv-invalidVar": { nested: "object" },
  };

  const validationResult = validator.validateTwoParams(result);

  assertEquals(validationResult.ok, false);
  if (!validationResult.ok) {
    assertEquals(validationResult.error.kind, "CustomVariableInvalid");
    if (validationResult.error.kind === "CustomVariableInvalid") {
      assertEquals(validationResult.error.key, "uv-invalidVar");
      assertEquals(validationResult.error.reason, "Value must be string, number, or boolean");
    }
  }
});

// =============================================================================
// Options Extraction Tests (Totality Verification)
// =============================================================================

Deno.test("ParameterValidator: options extraction - multiple input path keys", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  // Test priority: fromFile > from > input
  const testCases = [
    { options: { fromFile: "file1", from: "file2", input: "file3" }, expected: "file1" },
    { options: { from: "file2", input: "file3" }, expected: "file2" },
    { options: { input: "file3" }, expected: "file3" },
    { options: {}, expected: "stdin" },
  ];

  for (const testCase of testCases) {
    const result = createValidTwoParamsResult();
    result.options = testCase.options;

    const validationResult = validator.validateTwoParams(result);

    assertEquals(validationResult.ok, true);
    if (validationResult.ok) {
      assertEquals(validationResult.data.options.inputPath, testCase.expected);
    }
  }
});

Deno.test("ParameterValidator: options extraction - multiple output path keys", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  // Test priority: destinationFile > destination > output
  const testCases = [
    {
      options: { destinationFile: "file1", destination: "file2", output: "file3" },
      expected: "file1",
    },
    { options: { destination: "file2", output: "file3" }, expected: "file2" },
    { options: { output: "file3" }, expected: "file3" },
    { options: {}, expected: "stdout" },
  ];

  for (const testCase of testCases) {
    const result = createValidTwoParamsResult();
    result.options = testCase.options;

    const validationResult = validator.validateTwoParams(result);

    assertEquals(validationResult.ok, true);
    if (validationResult.ok) {
      assertEquals(validationResult.data.options.outputPath, testCase.expected);
    }
  }
});

Deno.test("ParameterValidator: options extraction - optional paths with multiple keys", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const result = createValidTwoParamsResult();
  result.options = {
    schemaFile: "schema1.json",
    schema: "schema2.json", // Should be ignored due to priority
    promptFile: "prompt1.md",
    prompt: "prompt2.md", // Should be ignored due to priority
    template: "template.md", // Should be ignored due to priority
  };

  const validationResult = validator.validateTwoParams(result);

  assertEquals(validationResult.ok, true);
  if (validationResult.ok) {
    assertEquals(validationResult.data.options.schemaPath, "schema1.json");
    assertEquals(validationResult.data.options.promptPath, "prompt1.md");
  }
});

// =============================================================================
// Metadata Validation Tests
// =============================================================================

Deno.test("ParameterValidator: metadata - includes validation timestamp", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const before = new Date();
  const result = validator.validateTwoParams(createValidTwoParamsResult());
  const after = new Date();

  assertEquals(result.ok, true);
  if (result.ok) {
    const validatedAt = result.data.metadata.validatedAt;
    assertEquals(validatedAt >= before, true);
    assertEquals(validatedAt <= after, true);
  }
});

Deno.test("ParameterValidator: metadata - profile name extraction", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(),
  );

  const testCases = [
    { options: { profile: "test-profile" }, expected: "test-profile" },
    { options: { configProfile: "config-profile" }, expected: "config-profile" },
    { options: { profile: "prof1", configProfile: "prof2" }, expected: "prof1" }, // Priority test
    { options: {}, expected: undefined },
  ];

  for (const testCase of testCases) {
    const result = createValidTwoParamsResult();
    result.options = testCase.options;

    const validationResult = validator.validateTwoParams(result);

    assertEquals(validationResult.ok, true);
    if (validationResult.ok) {
      assertEquals(validationResult.data.metadata.profileName, testCase.expected);
    }
  }
});

// =============================================================================
// Error Totality Tests (All ValidationError kinds covered)
// =============================================================================

Deno.test("ParameterValidator: error totality - all ValidationError kinds testable", () => {
  // This test ensures we can create all possible ValidationError types
  // This serves as a compile-time check for totality

  const errorKinds: ValidationError["kind"][] = [
    "InvalidParamsType",
    "MissingRequiredField",
    "InvalidDirectiveType",
    "InvalidLayerType",
    "PathValidationFailed",
    "CustomVariableInvalid",
    "ConfigValidationFailed",
    "UnsupportedParamsType",
  ];

  // Verify we can create each error type
  for (const kind of errorKinds) {
    let errorCreated = false;

    switch (kind) {
      case "InvalidParamsType":
        const error1: ValidationError = { kind, expected: "test", received: "test" };
        errorCreated = true;
        break;
      case "MissingRequiredField":
        const error2: ValidationError = { kind, field: "test", source: "test" };
        errorCreated = true;
        break;
      case "InvalidDirectiveType":
        const error3: ValidationError = { kind, value: "test", validPattern: "test" };
        errorCreated = true;
        break;
      case "InvalidLayerType":
        const error4: ValidationError = { kind, value: "test", validPattern: "test" };
        errorCreated = true;
        break;
      case "PathValidationFailed":
        const error5: ValidationError = { kind, path: "test", reason: "test" };
        errorCreated = true;
        break;
      case "CustomVariableInvalid":
        const error6: ValidationError = { kind, key: "test", reason: "test" };
        errorCreated = true;
        break;
      case "ConfigValidationFailed":
        const error7: ValidationError = { kind, errors: ["test"] };
        errorCreated = true;
        break;
      case "UnsupportedParamsType":
        const error8: ValidationError = { kind, type: "test" };
        errorCreated = true;
        break;
    }

    assertEquals(errorCreated, true, `Failed to create error of kind: ${kind}`);
  }
});

// =============================================================================
// Integration Tests with Mock Dependencies
// =============================================================================

Deno.test("ParameterValidator: integration - pattern provider without patterns", () => {
  class EmptyPatternProvider implements TypePatternProvider {
    getDirectivePattern() {
      return null;
    }

    getLayerTypePattern() {
      return null;
    }
  }

  const validator = new ParameterValidator(
    new EmptyPatternProvider(),
    new MockConfigValidator(),
  );

  const result = validator.validateTwoParams(createValidTwoParamsResult());

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidDirectiveType");
    if (result.error.kind === "InvalidDirectiveType") {
      assertEquals(result.error.validPattern, "undefined");
    }
  }
});

Deno.test("ParameterValidator: integration - failing config validator", () => {
  const validator = new ParameterValidator(
    new MockTypePatternProvider(),
    new MockConfigValidator(true), // Configure to fail
  );

  // Note: Current implementation doesn't use configValidator in validation flow
  // This test ensures the dependency injection works correctly
  const result = validator.validateTwoParams(createValidTwoParamsResult());

  // Should still succeed since configValidator isn't called in current implementation
  assertEquals(result.ok, true);
});
