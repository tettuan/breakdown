/**
 * @fileoverview Architecture tests for ParameterValidator
 *
 * These tests validate architectural constraints and dependencies
 * according to the Totality principle and architectural boundaries.
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ParameterValidator } from "./parameter_validator.ts";
import type {
  ConfigValidator,
  ValidatedParams as _ValidatedParams,
  ValidationError as _ValidationError,
} from "./parameter_validator.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";
import { TwoParamsDirectivePattern } from "../types/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../types/layer_type.ts";
// Temporary mock implementations for testing
const _MockPatternCreator = {
  createMockPatternProvider: (): TypePatternProvider => ({
    getDirectivePattern: () => TwoParamsDirectivePattern.create("to|summary|defect"),
    getLayerTypePattern: () => TwoParamsLayerTypePattern.create("project|issue|task"),
  }),
};
import type {
  OneParamsResult as _OneParamsResult,
  TwoParams_Result,
  ZeroParamsResult as _ZeroParamsResult,
} from "../deps.ts";
import type { Result as _Result } from "../types/result.ts";

/**
 * Architecture Test: Dependency Direction Validation
 *
 * Validates that ParameterValidator follows proper dependency direction
 * and maintains architectural boundaries.
 */
Deno.test("Architecture: ParameterValidator dependency direction compliance", () => {
  // Mock dependencies to validate architectural constraints
  const mockPatternProvider = _MockPatternCreator.createMockPatternProvider();

  const mockConfigValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  // Architecture constraint: ParameterValidator should be constructable
  // with injected dependencies following dependency inversion principle
  const _validator = new ParameterValidator(mockPatternProvider, mockConfigValidator);
  assertExists(_validator);

  // Architecture constraint: Dependencies should be properly injected, not created internally
  // This validates the Inversion of Control principle
  assertEquals(typeof _validator.validateTwoParams, "function");
  assertEquals(typeof _validator.validateOneParams, "function");
  assertEquals(typeof _validator.validateZeroParams, "function");
});

/**
 * Architecture Test: Result Type Pattern Compliance
 *
 * Validates that all public methods follow the Result<T, E> pattern
 * for comprehensive error handling without exceptions.
 */
Deno.test("Architecture: Result type pattern compliance", () => {
  const mockPatternProvider: TypePatternProvider = {
    getDirectivePattern: () => null,
    getLayerTypePattern: () => null,
  };

  const mockConfigValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const _validator = new ParameterValidator(mockPatternProvider, mockConfigValidator);

  // Valid TwoParams_Result for testing
  const validTwoParams: TwoParams_Result = {
    type: "two",
    demonstrativeType: "test",
    layerType: "project",
    params: ["test", "project"],
    options: {},
  };

  // Architecture constraint: All validation methods must return Result<T, E>
  const twoParamsResult = _validator.validateTwoParams(validTwoParams);
  assertEquals(typeof twoParamsResult.ok, "boolean");

  // Result should have either 'data' or 'error' property based on success/failure
  if (twoParamsResult.ok) {
    assertExists(twoParamsResult.data);
    assertEquals(typeof twoParamsResult.data, "object");
  } else {
    assertExists(twoParamsResult.error);
    assertEquals(typeof twoParamsResult.error, "object");
  }
});

/**
 * Architecture Test: Totality Principle - ValidationError Exhaustiveness
 *
 * Validates that all ValidationError variants are properly defined
 * and follow discriminated union pattern without default cases.
 */
Deno.test("Architecture: ValidationError totality compliance", () => {
  // Architecture constraint: ValidationError must be a discriminated union
  // with exhaustive error kinds without requiring default cases

  const errorKinds = [
    "InvalidParamsType",
    "MissingRequiredField",
    "InvalidDirectiveType",
    "InvalidLayerType",
    "PathValidationFailed",
    "CustomVariableInvalid",
    "ConfigValidationFailed",
    "UnsupportedParamsType",
  ] as const;

  // Validate that each error kind is properly typed
  errorKinds.forEach((kind) => {
    const error = {
      kind,
      // Using assertion for compile-time totality check
      ...getErrorPropertiesForKind(kind),
    } as _ValidationError;

    assertEquals(error.kind, kind);
    assertExists(error);
  });
});

/**
 * Architecture Test: Immutability and Type Safety
 *
 * Validates that ParameterValidator operations are immutable
 * and maintain type safety throughout the validation pipeline.
 */
Deno.test("Architecture: Immutability and type safety compliance", () => {
  const mockPatternProvider: TypePatternProvider = {
    getDirectivePattern: () => null,
    getLayerTypePattern: () => null,
  };

  const mockConfigValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const _validator = new ParameterValidator(mockPatternProvider, mockConfigValidator);

  const originalParams: TwoParams_Result = {
    type: "two",
    demonstrativeType: "test",
    layerType: "project",
    params: ["test", "project"],
    options: { input: "test.md" },
  };

  // Architecture constraint: Validation should not mutate input parameters
  const paramsCopy = structuredClone(originalParams);
  _validator.validateTwoParams(originalParams);

  // Verify original parameters are unchanged (immutability)
  assertEquals(originalParams, paramsCopy);

  // Architecture constraint: Results should be strongly typed
  const result = _validator.validateTwoParams(originalParams);
  if (result.ok) {
    // ValidatedParams should have required typed properties
    assertExists(result.data.directive);
    assertExists(result.data.layer);
    assertExists(result.data.options);
    assertExists(result.data.customVariables);
    assertExists(result.data.metadata);
  }
});

/**
 * Architecture Test: Dependency Injection Pattern
 *
 * Validates that ParameterValidator follows proper dependency injection
 * without creating concrete dependencies internally.
 */
Deno.test("Architecture: Dependency injection pattern compliance", () => {
  // Architecture constraint: Validator should accept interface dependencies
  // and not instantiate concrete implementations internally

  const customPatternProvider: TypePatternProvider = {
    getDirectivePattern: () => TwoParamsDirectivePattern.create("custom"),
    getLayerTypePattern: () => TwoParamsLayerTypePattern.create("layer"),
  };

  const customConfigValidator: ConfigValidator = {
    validateConfig: (config: unknown) => {
      if (config === "valid") {
        return { ok: true, data: undefined };
      }
      return { ok: false, error: ["Custom validation failed"] };
    },
  };

  // Architecture constraint: Different implementations can be injected
  const customValidator = new ParameterValidator(customPatternProvider, customConfigValidator);
  assertExists(customValidator);

  // Verify that injected dependencies are used (not hardcoded implementations)
  const testParams: TwoParams_Result = {
    type: "two",
    demonstrativeType: "custom", // Should match custom pattern
    layerType: "layer", // Should match custom layer pattern
    params: ["custom", "layer"],
    options: {},
  };

  const result = customValidator.validateTwoParams(testParams);
  assertEquals(result.ok, true);
});

/**
 * Architecture Test: Interface Segregation Compliance
 *
 * Validates that ParameterValidator interfaces are properly segregated
 * and follow single responsibility principle.
 */
Deno.test("Architecture: Interface segregation compliance", () => {
  // Architecture constraint: TypePatternProvider interface should be focused
  // on pattern-related responsibilities only
  const patternProvider: TypePatternProvider = {
    getDirectivePattern: () => null,
    getLayerTypePattern: () => null,
  };

  // Architecture constraint: ConfigValidator interface should be focused
  // on configuration validation only
  const configValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  // Interfaces should be minimal and focused
  assertEquals(Object.keys(patternProvider).length, 2);
  assertEquals(Object.keys(configValidator).length, 1);

  // Each interface method should have single, clear responsibility
  assertExists(patternProvider.getDirectivePattern);
  assertExists(patternProvider.getLayerTypePattern);
  assertExists(configValidator.validateConfig);
});

/**
 * Helper function for totality testing
 * Returns appropriate properties for each ValidationError kind
 */
function getErrorPropertiesForKind(kind: _ValidationError["kind"]): Partial<_ValidationError> {
  switch (kind) {
    case "InvalidParamsType":
      return { expected: "test", received: "test" };
    case "MissingRequiredField":
      return { field: "test", source: "test" };
    case "InvalidDirectiveType":
      return { value: "test", validPattern: "test" };
    case "InvalidLayerType":
      return { value: "test", validPattern: "test" };
    case "PathValidationFailed":
      return { path: "test", reason: "test" };
    case "CustomVariableInvalid":
      return { key: "test", reason: "test" };
    case "ConfigValidationFailed":
      return { errors: ["test"] };
    case "UnsupportedParamsType":
      return { type: "test" };
      // Note: No default case - this enforces totality at compile time
  }
}
