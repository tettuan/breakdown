/**
 * @fileoverview Unit tests for ParameterValidator
 *
 * These tests validate functional behavior of ParameterValidator methods,
 * covering success cases, error cases, edge cases, and validation logic.
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ParameterValidator } from "./parameter_validator.ts";
import type {
  ConfigValidator,
  ValidatedParams as _ValidatedParams,
  ValidationError as _ValidationError,
} from "./parameter_validator.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";
import type {
  OneParamsResult as _OneParamsResult,
  TwoParamsResult,
  ZeroParamsResult as _ZeroParamsResult,
} from "../deps.ts";
import { TwoParamsDirectivePattern } from "../types/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../types/layer_type.ts";

// Mock implementations for comprehensive testing
class MockPatternProvider implements TypePatternProvider {
  constructor(
    private directivePattern: TwoParamsDirectivePattern | null = null,
    private layerPattern: TwoParamsLayerTypePattern | null = null,
  ) {}

  getDirectivePattern() {
    return this.directivePattern || TwoParamsDirectivePattern.create("^(to|from|summary|init)$");
  }

  getLayerTypePattern() {
    return this.layerPattern || TwoParamsLayerTypePattern.create("^(project|issue|task)$");
  }
}

class MockConfigValidator implements ConfigValidator {
  constructor(private shouldSucceed: boolean = true) {}

  validateConfig(_config: unknown) {
    if (this.shouldSucceed) {
      return { ok: true as const, data: undefined };
    } else {
      return { ok: false as const, error: ["Mock validation failed"] };
    }
  }
}

/**
 * Unit Test: validateTwoParams Success Cases
 *
 * Tests that validateTwoParams correctly validates and transforms
 * valid TwoParamsResult inputs into ValidatedParams.
 */
Deno.test("Unit: validateTwoParams success cases", () => {
  const _validator = new ParameterValidator(
    new MockPatternProvider(),
    new MockConfigValidator(),
  );

  // Test case 1: Complete valid parameters
  const validParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      fromFile: "input.md",
      destinationFile: "output.md",
      "uv-projectName": "TestProject",
      profile: "development",
    },
  };

  const _result = _validator.validateTwoParams(validParams);
  assertEquals(_result.ok, true);

  if (_result.ok) {
    // Validate directive and layer creation
    assertExists(_result.data.directive);
    assertExists(_result.data.layer);

    // Validate options normalization
    assertEquals(_result.data.options.inputPath, "input.md");
    assertEquals(_result.data.options.outputPath, "output.md");

    // Validate custom variables extraction
    assertEquals(_result.data.customVariables["uv-projectName"], "TestProject");

    // Validate metadata
    assertEquals(_result.data.metadata.source, "TwoParamsResult");
    assertEquals(_result.data.metadata.profileName, "development");
    assertExists(_result.data.metadata.validatedAt);
  }

  // Test case 2: Minimal valid parameters
  const minimalParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "task",
    params: ["summary", "task"],
    options: {},
  };

  const minimalResult = _validator.validateTwoParams(minimalParams);
  assertEquals(minimalResult.ok, true);

  if (minimalResult.ok) {
    // Should use defaults for missing options
    assertEquals(minimalResult.data.options.inputPath, "stdin");
    assertEquals(minimalResult.data.options.outputPath, "stdout");
    assertEquals(Object.keys(minimalResult.data.customVariables).length, 0);
  }
});

/**
 * Unit Test: validateTwoParams Error Cases
 *
 * Tests that validateTwoParams correctly identifies and reports
 * various validation errors with appropriate error details.
 */
Deno.test("Unit: validateTwoParams error cases", () => {
  const _validator = new ParameterValidator(
    new MockPatternProvider(),
    new MockConfigValidator(),
  );

  // Error case 1: Wrong type - use proper type construction instead of casting
  const wrongTypeParams: TwoParamsResult = {
    type: "two", // Correct type for TwoParamsResult
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };

  // Simulate wrong type by creating params with wrong type field
  const wrongTypeParamsWithError = { ...wrongTypeParams, type: "one" };

  const wrongTypeResult = _validator.validateTwoParams(
    wrongTypeParamsWithError as unknown as TwoParamsResult,
  );
  assertEquals(wrongTypeResult.ok, false);
  if (!wrongTypeResult.ok) {
    // Type-safe property access with proper discriminated union handling
    if (wrongTypeResult.error.kind === "InvalidParamsType") {
      assertEquals(wrongTypeResult.error.expected, "two");
      assertEquals(wrongTypeResult.error.received, "one");
    } else {
      // Handle case where error structure might be different
      assertEquals(wrongTypeResult.error.kind, "InvalidParamsType");
    }
  }

  // Error case 2: Missing demonstrativeType
  const missingDemoParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "",
    layerType: "project",
    params: ["", "project"],
    options: {},
  };

  const missingDemoResult = _validator.validateTwoParams(missingDemoParams);
  assertEquals(missingDemoResult.ok, false);
  if (!missingDemoResult.ok) {
    // Type-safe property access with proper discriminated union handling
    if (missingDemoResult.error.kind === "MissingRequiredField") {
      assertEquals(missingDemoResult.error.field, "demonstrativeType");
      assertEquals(missingDemoResult.error.source, "TwoParamsResult");
    } else {
      // Handle case where error structure might be different
      assertEquals(missingDemoResult.error.kind, "MissingRequiredField");
    }
  }

  // Error case 3: Invalid directive pattern
  const invalidDemoParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "invalid",
    layerType: "project",
    params: ["invalid", "project"],
    options: {},
  };

  const invalidDemoResult = _validator.validateTwoParams(invalidDemoParams);
  assertEquals(invalidDemoResult.ok, false);
  if (!invalidDemoResult.ok) {
    // Type-safe property access with proper discriminated union handling
    if (invalidDemoResult.error.kind === "InvalidDirectiveType") {
      assertEquals(invalidDemoResult.error.value, "invalid");
      assertExists(invalidDemoResult.error.validPattern);
    } else {
      // Handle case where error structure might be different
      assertEquals(invalidDemoResult.error.kind, "InvalidDirectiveType");
    }
  }
});

/**
 * Unit Test: validateOneParams Functional Behavior
 *
 * Tests that validateOneParams correctly transforms one parameter
 * input into valid two-parameter format with appropriate defaults.
 */
Deno.test("Unit: validateOneParams functional behavior", () => {
  // Create proper TwoParamsDirectivePattern for init
  const initDirectivePattern = TwoParamsDirectivePattern.create("init");
  const initOnlyPattern = new MockPatternProvider(
    initDirectivePattern,
    null,
  );

  const _validator = new ParameterValidator(
    initOnlyPattern,
    new MockConfigValidator(),
  );

  // Success case: Valid one parameter
  const validOneParams: _OneParamsResult = {
    type: "one",
    demonstrativeType: "init", // Required field for _OneParamsResult
    params: ["project"],
    options: { input: "test.md" },
  };

  const _result = _validator.validateOneParams(validOneParams);
  assertEquals(_result.ok, true);

  if (_result.ok) {
    // Should use "init" as default directive
    assertExists(_result.data.directive);
    assertExists(_result.data.layer);
    assertEquals(_result.data.options.inputPath, "test.md");
    assertEquals(_result.data.metadata.source, "OneParamsResult");
  }
});

/**
 * Unit Test: Custom Variables Validation Logic
 *
 * Tests the complete custom variables extraction and validation logic
 * including edge cases and type conversions.
 */
Deno.test("Unit: Custom variables validation logic", () => {
  const _validator = new ParameterValidator(
    new MockPatternProvider(),
    new MockConfigValidator(),
  );

  // Success case: Various custom variable types
  const validCustomVarsParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      "uv-stringVar": "hello",
      "uv-numberVar": 123,
      "uv-booleanVar": true,
      "uv-zeroNumber": 0,
      "uv-falseBool": false,
      "uv-emptyString": "",
      "regularOption": "ignored",
      "uv": "prefixOnly", // Should not match (exact prefix)
      "uv-": "emptyName", // Should match
    },
  };

  const _result = _validator.validateTwoParams(validCustomVarsParams);
  assertEquals(_result.ok, true);

  if (_result.ok) {
    const customVars = _result.data.customVariables;

    // String conversion tests
    assertEquals(customVars["uv-stringVar"], "hello");
    assertEquals(customVars["uv-numberVar"], "123");
    assertEquals(customVars["uv-booleanVar"], "true");
    assertEquals(customVars["uv-zeroNumber"], "0");
    assertEquals(customVars["uv-falseBool"], "false");
    assertEquals(customVars["uv-emptyString"], "");
    assertEquals(customVars["uv-"], "emptyName");

    // Should not include non-uv- prefixed options
    assertEquals(customVars["regularOption"], undefined);
    assertEquals(customVars["uv"], undefined);
  }

  // Error case: Invalid custom variable type (object)
  const invalidObjectVarParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      "uv-invalidObject": { key: "value" },
    },
  };

  const objectResult = _validator.validateTwoParams(invalidObjectVarParams);
  assertEquals(objectResult.ok, false);
  if (!objectResult.ok) {
    // Type-safe property access with proper discriminated union handling
    if (objectResult.error.kind === "CustomVariableInvalid") {
      assertEquals(objectResult.error.key, "uv-invalidObject");
      assertEquals(objectResult.error.reason, "Value must be string, number, or boolean");
    } else {
      // Handle case where error structure might be different
      assertEquals(objectResult.error.kind, "CustomVariableInvalid");
    }
  }
});

/**
 * Unit Test: Path Validation Logic
 *
 * Tests the path validation functionality including edge cases
 * and special path values like "stdin" and "stdout".
 */
Deno.test("Unit: Path validation logic", () => {
  const _validator = new ParameterValidator(
    new MockPatternProvider(),
    new MockConfigValidator(),
  );

  // Success case: Valid paths including special values
  const validPathsParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      fromFile: "input.md",
      destinationFile: "output.md",
    },
  };

  const validResult = _validator.validateTwoParams(validPathsParams);
  assertEquals(validResult.ok, true);

  // Error case: Path with null character
  const nullPathParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      fromFile: "invalid\0path.md",
    },
  };

  const nullResult = _validator.validateTwoParams(nullPathParams);
  assertEquals(nullResult.ok, false);
  if (!nullResult.ok) {
    // Type-safe property access with proper discriminated union handling
    if (nullResult.error.kind === "PathValidationFailed") {
      assertEquals(nullResult.error.path, "invalid\0path.md");
      assertEquals(nullResult.error.reason, "Path contains null character");
    } else {
      // Handle case where error structure might be different
      assertEquals(nullResult.error.kind, "PathValidationFailed");
    }
  }

  // Error case: Empty path
  const emptyPathParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      fromFile: "   ", // Whitespace only
    },
  };

  const emptyResult = _validator.validateTwoParams(emptyPathParams);
  assertEquals(emptyResult.ok, false);
  if (!emptyResult.ok) {
    // Type-safe property access with proper discriminated union handling
    if (emptyResult.error.kind === "PathValidationFailed") {
      assertEquals(emptyResult.error.path, "   ");
      assertEquals(emptyResult.error.reason, "input path cannot be empty");
    } else {
      // Handle case where error structure might be different
      assertEquals(emptyResult.error.kind, "PathValidationFailed");
    }
  }
});
