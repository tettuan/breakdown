/**
 * @fileoverview Structure tests for ParameterValidator
 * 
 * These tests validate responsibility separation, method boundaries,
 * and appropriate abstraction levels in the ParameterValidator design.
 */

import { assertEquals, assertExists, assertNotEquals as _assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ParameterValidator } from "./parameter_validator.ts";
import type { ValidationError as _ValidationError, ValidatedParams as _ValidatedParams, ConfigValidator, ValidatedOptions as _ValidatedOptions } from "./parameter_validator.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";
import { TwoParamsDirectivePattern } from "../types/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../types/layer_type.ts";
import type { TwoParamsResult, OneParamsResult, ZeroParamsResult } from "../deps.ts";

/**
 * Structure Test: validateTwoParams Method Responsibility Boundary
 * 
 * Validates that validateTwoParams has clear responsibility boundaries
 * and handles only TwoParamsResult-specific validation logic.
 */
Deno.test("Structure: validateTwoParams responsibility boundary", () => {
  const mockPatternProvider: TypePatternProvider = {
    getDirectivePattern: () => null,
    getLayerTypePattern: () => null,
  };

  const mockConfigValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const validator = new ParameterValidator(mockPatternProvider, mockConfigValidator);

  // Responsibility boundary: Should only accept TwoParamsResult
  const validTwoParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "test",
    layerType: "project",
    params: ["test", "project"],
    options: { input: "test.md" },
  };

  // Should handle TwoParamsResult successfully
  const result = validator.validateTwoParams(validTwoParams);
  assertEquals(typeof result.ok, "boolean");

  // Responsibility boundary: Should validate type field specifically
  const invalidTypeParams = {
    ...validTwoParams,
    type: "one" as const, // Wrong type for this method
  };

  const invalidResult = validator.validateTwoParams(invalidTypeParams as unknown as TwoParamsResult);
  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "InvalidParamsType");
    if (invalidResult.error.kind === "InvalidParamsType") {
      assertEquals(invalidResult.error.expected, "two");
      assertEquals(invalidResult.error.received, "one");
    }
  }
});

/**
 * Structure Test: validateOneParams Method Responsibility Boundary
 * 
 * Validates that validateOneParams has distinct responsibility
 * from validateTwoParams and handles one-parameter transformation logic.
 */
Deno.test("Structure: validateOneParams responsibility boundary", () => {
  const mockPatternProvider: TypePatternProvider = {
    getDirectivePattern: () => null,
    getLayerTypePattern: () => null,
  };

  const mockConfigValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const validator = new ParameterValidator(mockPatternProvider, mockConfigValidator);

  // Responsibility boundary: Should only accept OneParamsResult
  const validOneParams: OneParamsResult = {
    type: "one",
    demonstrativeType: "project",
    params: ["project"],
    options: { input: "test.md" },
  };

  const result = validator.validateOneParams(validOneParams);
  assertEquals(typeof result.ok, "boolean");

  // Responsibility boundary: Should transform one param to two params internally
  // This validates the abstraction level - one param validation delegates to two param logic
  if (result.ok) {
    // Should have directive and layer derived from the single parameter
    assertExists(result.data.directive);
    assertExists(result.data.layer);
    assertEquals(result.data.metadata.source, "OneParamsResult");
  }

  // Responsibility boundary: Should validate type field specifically
  const invalidTypeParams = {
    ...validOneParams,
    type: "zero" as const,
  };

  const invalidResult = validator.validateOneParams(invalidTypeParams as unknown as OneParamsResult);
  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "InvalidParamsType");
    if (invalidResult.error.kind === "InvalidParamsType") {
      assertEquals(invalidResult.error.expected, "one");
      assertEquals(invalidResult.error.received, "zero");
    }
  }
});

/**
 * Structure Test: validateZeroParams Method Responsibility Boundary
 * 
 * Validates that validateZeroParams has minimal responsibility
 * and properly delegates to the core validation logic.
 */
Deno.test("Structure: validateZeroParams responsibility boundary", () => {
  const mockPatternProvider: TypePatternProvider = {
    getDirectivePattern: () => null,
    getLayerTypePattern: () => null,
  };

  const mockConfigValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const validator = new ParameterValidator(mockPatternProvider, mockConfigValidator);

  // Responsibility boundary: Should only accept ZeroParamsResult
  const validZeroParams: ZeroParamsResult = {
    type: "zero",
    params: [],
    options: {},
  };

  const result = validator.validateZeroParams(validZeroParams);
  assertEquals(typeof result.ok, "boolean");

  // Responsibility boundary: Should use complete defaults
  if (result.ok) {
    // Should have default directive and layer
    assertExists(result.data.directive);
    assertExists(result.data.layer);
    assertEquals(result.data.metadata.source, "ZeroParamsResult");
  }

  // Responsibility boundary: Should validate type field specifically
  const invalidTypeParams = {
    ...validZeroParams,
    type: "two" as const,
  };

  const invalidResult = validator.validateZeroParams(invalidTypeParams as unknown as ZeroParamsResult);
  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "InvalidParamsType");
    if (invalidResult.error.kind === "InvalidParamsType") {
      assertEquals(invalidResult.error.expected, "zero");
      assertEquals(invalidResult.error.received, "two");
    }
  }
});

/**
 * Structure Test: ValidatedParams Type Design Coherence
 * 
 * Validates that ValidatedParams type design maintains proper
 * responsibility separation and semantic coherence.
 */
Deno.test("Structure: ValidatedParams type design coherence", () => {
  const mockPatternProvider: TypePatternProvider = {
    getDirectivePattern: () => null,
    getLayerTypePattern: () => null,
  };

  const mockConfigValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const validator = new ParameterValidator(mockPatternProvider, mockConfigValidator);

  const validParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "test",
    layerType: "project",
    params: ["test", "project"],
    options: { input: "test.md", "uv-custom": "value" },
  };

  const result = validator.validateTwoParams(validParams);
  if (!result.ok) return;

  const validatedParams = result.data;

  // Structure: ValidatedParams should have clear responsibility separation
  
  // Core validation results
  assertExists(validatedParams.directive);
  assertExists(validatedParams.layer);
  assertEquals(typeof validatedParams.directive, "object");
  assertEquals(typeof validatedParams.layer, "object");

  // Options should be normalized and validated
  assertExists(validatedParams.options);
  assertEquals(typeof validatedParams.options, "object");
  assertEquals(typeof validatedParams.options.inputPath, "string");
  assertEquals(typeof validatedParams.options.outputPath, "string");

  // Custom variables should be extracted and processed
  assertExists(validatedParams.customVariables);
  assertEquals(typeof validatedParams.customVariables, "object");

  // Metadata should provide traceability
  assertExists(validatedParams.metadata);
  assertEquals(typeof validatedParams.metadata.validatedAt, "object"); // Date
  assertEquals(validatedParams.metadata.source, "TwoParamsResult");
});

/**
 * Structure Test: ValidationError Type Design Appropriateness
 * 
 * Validates that ValidationError types have appropriate specificity
 * and maintain clear error responsibility boundaries.
 */
Deno.test("Structure: ValidationError type design appropriateness", () => {
  const mockPatternProvider: TypePatternProvider = {
    getDirectivePattern: () => null, // Simulate pattern failure
    getLayerTypePattern: () => null,
  };

  const mockConfigValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const validator = new ParameterValidator(mockPatternProvider, mockConfigValidator);

  // Test different error types for appropriate specificity

  // 1. MissingRequiredField error should be specific
  const missingFieldParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "", // Missing required field
    layerType: "project",
    params: ["", "project"],
    options: {},
  };

  const missingFieldResult = validator.validateTwoParams(missingFieldParams);
  assertEquals(missingFieldResult.ok, false);
  if (!missingFieldResult.ok) {
    assertEquals(missingFieldResult.error.kind, "MissingRequiredField");
    if (missingFieldResult.error.kind === "MissingRequiredField") {
      assertEquals(missingFieldResult.error.field, "demonstrativeType");
      assertEquals(missingFieldResult.error.source, "TwoParamsResult");
    }
  }

  // 2. InvalidDirectiveType error should provide pattern information
  const invalidDirectiveParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "invalid",
    layerType: "project", 
    params: ["invalid", "project"],
    options: {},
  };

  const invalidDirectiveResult = validator.validateTwoParams(invalidDirectiveParams);
  assertEquals(invalidDirectiveResult.ok, false);
  if (!invalidDirectiveResult.ok) {
    assertEquals(invalidDirectiveResult.error.kind, "InvalidDirectiveType");
    if (invalidDirectiveResult.error.kind === "InvalidDirectiveType") {
      assertEquals(invalidDirectiveResult.error.value, "invalid");
      assertExists(invalidDirectiveResult.error.validPattern);
    }
  }
});

/**
 * Structure Test: Private Methods Abstraction Level Validation
 * 
 * Validates that the abstraction level of internal operations
 * is appropriate and maintains proper separation of concerns.
 */
Deno.test("Structure: Private methods abstraction level appropriateness", () => {
  const mockPatternProvider: TypePatternProvider = {
    getDirectivePattern: () => TwoParamsDirectivePattern.create("test"),
    getLayerTypePattern: () => TwoParamsLayerTypePattern.create("project"),
  };

  const mockConfigValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const validator = new ParameterValidator(mockPatternProvider, mockConfigValidator);

  // Test that different option formats are normalized consistently
  // This validates that private normalization methods maintain appropriate abstraction

  const testCases = [
    // Different input path formats should be normalized consistently
    { options: { fromFile: "input1.md" }, expectedInput: "input1.md" },
    { options: { from: "input2.md" }, expectedInput: "input2.md" },
    { options: { input: "input3.md" }, expectedInput: "input3.md" },
    { options: {}, expectedInput: "stdin" }, // Default case

    // Different output path formats should be normalized consistently  
    { options: { destinationFile: "output1.md" }, expectedOutput: "output1.md" },
    { options: { destination: "output2.md" }, expectedOutput: "output2.md" },
    { options: { output: "output3.md" }, expectedOutput: "output3.md" },
  ];

  testCases.forEach((testCase, index) => {
    const params: TwoParamsResult = {
      type: "two",
      demonstrativeType: "test",
      layerType: "project",
      params: ["test", "project"],
      options: testCase.options,
    };

    const result = validator.validateTwoParams(params);
    if (!result.ok) {
      throw new Error(`Test case ${index} failed validation: ${JSON.stringify(result.error)}`);
    }

    // Validate appropriate abstraction - different input formats normalize to consistent output
    if (testCase.expectedInput) {
      assertEquals(result.data.options.inputPath, testCase.expectedInput, 
        `Input normalization failed for case ${index}`);
    }
    if (testCase.expectedOutput) {
      assertEquals(result.data.options.outputPath, testCase.expectedOutput,
        `Output normalization failed for case ${index}`);
    }
  });
});

/**
 * Structure Test: Custom Variables Processing Responsibility
 * 
 * Validates that custom variable processing maintains clear
 * responsibility boundaries and appropriate validation logic.
 */
Deno.test("Structure: Custom variables processing responsibility boundary", () => {
  const mockPatternProvider: TypePatternProvider = {
    getDirectivePattern: () => TwoParamsDirectivePattern.create("test"),
    getLayerTypePattern: () => TwoParamsLayerTypePattern.create("project"),
  };

  const mockConfigValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const validator = new ParameterValidator(mockPatternProvider, mockConfigValidator);

  // Test custom variable extraction and validation responsibility
  const paramsWithCustomVars: TwoParamsResult = {
    type: "two",
    demonstrativeType: "test",
    layerType: "project",
    params: ["test", "project"],
    options: {
      "uv-stringVar": "stringValue",
      "uv-numberVar": 42,
      "uv-boolVar": true,
      "regularOption": "notCustom", // Should not be extracted
      "uv-invalidVar": { object: "invalid" }, // Should cause validation error
    },
  };

  const result = validator.validateTwoParams(paramsWithCustomVars);
  
  // Should fail due to invalid custom variable type
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "CustomVariableInvalid");
    if (result.error.kind === "CustomVariableInvalid") {
      assertEquals(result.error.key, "uv-invalidVar");
      assertEquals(result.error.reason, "Value must be string, number, or boolean");
    }
  }

  // Test with valid custom variables only
  const validCustomVarsParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "test",
    layerType: "project",
    params: ["test", "project"],
    options: {
      "uv-stringVar": "stringValue",
      "uv-numberVar": 42,
      "uv-boolVar": true,
      "regularOption": "notCustom", // Should not be extracted
    },
  };

  const validResult = validator.validateTwoParams(validCustomVarsParams);
  assertEquals(validResult.ok, true);
  if (validResult.ok) {
    // Custom variables should be extracted and converted to strings
    assertEquals(validResult.data.customVariables["uv-stringVar"], "stringValue");
    assertEquals(validResult.data.customVariables["uv-numberVar"], "42");
    assertEquals(validResult.data.customVariables["uv-boolVar"], "true");
    
    // Regular options should not be in custom variables
    assertEquals(validResult.data.customVariables["regularOption"], undefined);
  }
});

/**
 * Structure Test: Metadata Generation Responsibility
 * 
 * Validates that metadata generation maintains appropriate
 * responsibility and provides necessary traceability information.
 */
Deno.test("Structure: Metadata generation responsibility appropriateness", () => {
  const mockPatternProvider: TypePatternProvider = {
    getDirectivePattern: () => TwoParamsDirectivePattern.create("(test|project|init)"),
    getLayerTypePattern: () => TwoParamsLayerTypePattern.create("project"),
  };

  const mockConfigValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const validator = new ParameterValidator(mockPatternProvider, mockConfigValidator);

  // Test metadata generation for different parameter types
  const testCases = [
    {
      params: {
        type: "two" as const,
        demonstrativeType: "test",
        layerType: "project",
        params: ["test", "project"],
        options: { profile: "testProfile" },
      },
      expectedSource: "TwoParamsResult",
      hasProfile: true,
    },
    {
      params: {
        type: "one" as const,
        demonstrativeType: "project",
        params: ["project"],
        options: {},
      },
      expectedSource: "OneParamsResult",
      hasProfile: false,
    },
    {
      params: {
        type: "zero" as const,
        params: [],
        options: { configProfile: "zeroProfile" },
      },
      expectedSource: "ZeroParamsResult", 
      hasProfile: true,
    },
  ];

  testCases.forEach((testCase, index) => {
    let result;
    if (testCase.params.type === "two") {
      result = validator.validateTwoParams(testCase.params as TwoParamsResult);
    } else if (testCase.params.type === "one") {
      result = validator.validateOneParams(testCase.params as OneParamsResult);
    } else {
      result = validator.validateZeroParams(testCase.params as ZeroParamsResult);
    }

    if (!result.ok) {
      throw new Error(`Test case ${index} failed: ${JSON.stringify(result.error)}`);
    }

    // Metadata should provide appropriate traceability
    assertEquals(result.data.metadata.source, testCase.expectedSource,
      `Source metadata incorrect for case ${index}`);
    
    assertExists(result.data.metadata.validatedAt);
    assertEquals(result.data.metadata.validatedAt instanceof Date, true,
      `Validation timestamp should be a Date for case ${index}`);

    // Profile extraction should work appropriately
    if (testCase.hasProfile) {
      assertExists(result.data.metadata.profileName,
        `Profile should be extracted for case ${index}`);
    }
  });
});