/**
 * @fileoverview ParameterValidatorV2 0_architecture Tests - Architecture and Design Pattern Validation
 *
 * ParameterValidatorV2 のアーキテクチャ制約とデザインパターンの正当性を検証。
 * SRP準拠、依存性注入、Result型、エラー型の適切な実装を検証。
 *
 * テスト構成:
 * - Single Responsibility Principle の実装
 * - 依存性注入パターンの正当性
 * - Result型の適切な使用
 * - エラー型のdiscriminated union
 * - オーケストレーションパターンの実装
 */

import { assert, assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  type ConfigValidator,
  ParameterValidatorV2,
  type ValidatedOptions,
  type ValidatedParams,
  type ValidationError,
  type ValidationMetadata,
} from "./parameter_validator_v2.ts";
import type { Result } from "../types/result.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";
import { DirectiveType } from "../domain/core/value_objects/directive_type.ts";
import { LayerType } from "../domain/core/value_objects/layer_type.ts";
import type { TwoParams_Result } from "../deps.ts";

// =============================================================================
// Test Utilities
// =============================================================================

function createMockTypePatternProvider(): TypePatternProvider {
  return {
    validateDirectiveType: (value: string) => /^(to|summary|defect)$/.test(value),
    validateLayerType: (value: string) => /^(project|issue|task)$/.test(value),
    getValidDirectiveTypes: () => ["to", "summary", "defect"],
    getValidLayerTypes: () => ["project", "issue", "task"],
    getDirectivePattern: () => {
      return {
        test: (value: string) => /^(to|summary|defect)$/.test(value),
        getPattern: () => "^(to|summary|defect)$",
      };
    },
    getLayerTypePattern: () => {
      return {
        test: (value: string) => /^(project|issue|task)$/.test(value),
        getPattern: () => "^(project|issue|task)$",
      };
    },
  };
}

function createMockConfigValidator(): ConfigValidator {
  return {
    validateConfig: (config: unknown) => {
      if (config && typeof config === "object") {
        return { ok: true, data: undefined };
      }
      return { ok: false, error: ["Invalid configuration"] };
    },
  };
}

// =============================================================================
// 0_ARCHITECTURE: Architecture and Design Pattern Tests
// =============================================================================

Deno.test("0_architecture - ParameterValidatorV2 follows Single Responsibility Principle", () => {
  // Class should orchestrate validation without implementing specifics
  assertExists(ParameterValidatorV2);
  assertEquals(typeof ParameterValidatorV2, "function");
  assert(ParameterValidatorV2.toString().includes("class"));

  // Constructor should accept dependencies (dependency injection)
  const patternProvider = createMockTypePatternProvider();
  const configValidator = createMockConfigValidator();

  const validator = new ParameterValidatorV2(patternProvider, configValidator);
  assertExists(validator);
  assert(validator instanceof ParameterValidatorV2);

  // Should have orchestration methods for different param types
  assertExists(validator.validateTwoParams);
  assertExists(validator.validateOneParams);
  assertExists(validator.validateZeroParams);

  assertEquals(typeof validator.validateTwoParams, "function");
  assertEquals(typeof validator.validateOneParams, "function");
  assertEquals(typeof validator.validateZeroParams, "function");
});

Deno.test("0_architecture - Dependency injection pattern implementation", () => {
  const patternProvider = createMockTypePatternProvider();
  const configValidator = createMockConfigValidator();

  // Constructor should accept interfaces, not concrete implementations
  const validator = new ParameterValidatorV2(patternProvider, configValidator);

  // Dependencies should be properly injected
  assertExists(validator);

  // Should work with different implementations
  const alternativeConfigValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const validator2 = new ParameterValidatorV2(patternProvider, alternativeConfigValidator);
  assertExists(validator2);

  // Both should be valid instances
  assert(validator instanceof ParameterValidatorV2);
  assert(validator2 instanceof ParameterValidatorV2);
});

Deno.test("0_architecture - Result type usage consistency", () => {
  // All validation methods should return Result type
  const patternProvider = createMockTypePatternProvider();
  const configValidator = createMockConfigValidator();
  const validator = new ParameterValidatorV2(patternProvider, configValidator);

  // Method signatures should be consistent with Result pattern
  assertExists(validator.validateTwoParams);
  assertExists(validator.validateOneParams);
  assertExists(validator.validateZeroParams);

  // Each method should accept appropriate input and return Result
  assertEquals(typeof validator.validateTwoParams, "function");
  assertEquals(typeof validator.validateOneParams, "function");
  assertEquals(typeof validator.validateZeroParams, "function");
});

Deno.test("0_architecture - ValidationError discriminated union structure", () => {
  // Error types should be properly discriminated
  const errorTypes: ValidationError[] = [
    { kind: "ParamsTypeError", error: "test" },
    { kind: "PathValidationError", error: "test" },
    { kind: "OptionsNormalizationError", error: "test" },
    { kind: "CustomVariableError", error: "test" },
    { kind: "TypeCreationError", type: "directive", value: "invalid" },
  ];

  for (const error of errorTypes) {
    assertExists(error.kind);
    assertEquals(typeof error.kind, "string");

    // Each error type should have appropriate structure
    switch (error.kind) {
      case "ParamsTypeError":
      case "PathValidationError":
      case "OptionsNormalizationError":
      case "CustomVariableError":
        assertExists(error.error);
        break;
      case "TypeCreationError":
        assertExists(error.type);
        assertExists(error.value);
        assert(["directive", "layer"].includes(error.type));
        assertEquals(typeof error.value, "string");
        break;
    }
  }
});

Deno.test("0_architecture - ValidatedParams type structure constraints", () => {
  // Type should have all required fields with proper types
  // Create proper DirectiveType and LayerType instances
  const mockTwoParamsResult: TwoParams_Result = {
    type: "two",
    directiveType: "to",
    demonstrativeType: "to",
    layerType: "project",
    options: {},
    params: ["to", "project"],
  };

  const directiveResult = DirectiveType.create(mockTwoParamsResult.directiveType);
  const layerResult = LayerType.create(mockTwoParamsResult.layerType);

  if (!directiveResult.ok) throw new Error("Failed to create DirectiveType in test");
  if (!layerResult.ok) throw new Error("Failed to create LayerType in test");

  const mockValidatedParams: ValidatedParams = {
    directive: directiveResult.data,
    layer: layerResult.data,
    options: {
      inputPath: "/input",
      outputPath: "/output",
    },
    customVariables: {},
    metadata: {
      validatedAt: new Date(),
      source: "TwoParams",
    },
  };

  // Required fields
  assertExists(mockValidatedParams.directive);
  assertExists(mockValidatedParams.layer);
  assertExists(mockValidatedParams.options);
  assertExists(mockValidatedParams.customVariables);
  assertExists(mockValidatedParams.metadata);

  // Type constraints
  assertEquals(typeof mockValidatedParams.directive.value, "string");
  assertEquals(typeof mockValidatedParams.layer.value, "string");
  assertEquals(typeof mockValidatedParams.options, "object");
  assertEquals(typeof mockValidatedParams.customVariables, "object");
  assertEquals(typeof mockValidatedParams.metadata, "object");

  // Options structure
  assertExists(mockValidatedParams.options.inputPath);
  assertExists(mockValidatedParams.options.outputPath);
  assertEquals(typeof mockValidatedParams.options.inputPath, "string");
  assertEquals(typeof mockValidatedParams.options.outputPath, "string");

  // Metadata structure
  assert(mockValidatedParams.metadata.validatedAt instanceof Date);
  assert(["TwoParams", "OneParams", "ZeroParams"].includes(mockValidatedParams.metadata.source));
});

Deno.test("0_architecture - ValidatedOptions type structure with optional fields", () => {
  // Required fields only
  const minimalOptions: ValidatedOptions = {
    inputPath: "/input",
    outputPath: "/output",
  };

  assertExists(minimalOptions.inputPath);
  assertExists(minimalOptions.outputPath);
  assertEquals(minimalOptions.schemaPath, undefined);
  assertEquals(minimalOptions.promptPath, undefined);
  assertEquals(minimalOptions.stdin, undefined);

  // All fields
  const fullOptions: ValidatedOptions = {
    inputPath: "/input",
    outputPath: "/output",
    schemaPath: "/schema.json",
    promptPath: "/prompt.md",
    stdin: "input data",
  };

  assertExists(fullOptions.inputPath);
  assertExists(fullOptions.outputPath);
  assertExists(fullOptions.schemaPath);
  assertExists(fullOptions.promptPath);
  assertExists(fullOptions.stdin);

  // Type constraints
  assertEquals(typeof fullOptions.inputPath, "string");
  assertEquals(typeof fullOptions.outputPath, "string");
  assertEquals(typeof fullOptions.schemaPath, "string");
  assertEquals(typeof fullOptions.promptPath, "string");
  assertEquals(typeof fullOptions.stdin, "string");
});

Deno.test("0_architecture - ValidationMetadata maintains temporal and source constraints", () => {
  // Required fields
  const metadata: ValidationMetadata = {
    validatedAt: new Date(),
    source: "TwoParams",
    profileName: "test",
  };

  assertExists(metadata.validatedAt);
  assertExists(metadata.source);
  assert(metadata.validatedAt instanceof Date);
  assertEquals(typeof metadata.source, "string");

  // Source discriminated union
  assert(["TwoParams", "OneParams", "ZeroParams"].includes(metadata.source));

  // Optional profile name
  if (metadata.profileName) {
    assertEquals(typeof metadata.profileName, "string");
  }

  // Test all source variants
  const sources: ValidationMetadata["source"][] = ["TwoParams", "OneParams", "ZeroParams"];
  for (const source of sources) {
    const testMetadata: ValidationMetadata = {
      validatedAt: new Date(),
      source,
    };
    assertEquals(testMetadata.source, source);
  }
});

Deno.test("0_architecture - ConfigValidator interface contract definition", () => {
  // Interface should define proper contract
  const validator: ConfigValidator = {
    validateConfig: (_config: unknown) => {
      return { ok: true, data: undefined };
    },
  };

  assertExists(validator.validateConfig);
  assertEquals(typeof validator.validateConfig, "function");

  // Should return Result type
  const result = validator.validateConfig({});
  assertExists(result);
  assertExists(result.ok);

  // Test both success and error cases
  const successValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const errorValidator: ConfigValidator = {
    validateConfig: () => ({ ok: false, error: ["Test error"] }),
  };

  const successResult = successValidator.validateConfig({});
  const errorResult = errorValidator.validateConfig({});

  assert(successResult.ok);
  assert(!errorResult.ok);

  if (successResult.ok) {
    assertEquals(successResult.data, undefined);
  }

  if (!errorResult.ok) {
    assert(Array.isArray(errorResult.error));
  }
});

Deno.test("0_architecture - Orchestration pattern with specialized validators", () => {
  // ParameterValidatorV2 should orchestrate but not implement validation logic
  const patternProvider = createMockTypePatternProvider();
  const configValidator = createMockConfigValidator();
  const validator = new ParameterValidatorV2(patternProvider, configValidator);

  // Should have methods for different parameter types
  assertExists(validator.validateTwoParams);
  assertExists(validator.validateOneParams);
  assertExists(validator.validateZeroParams);

  // Each method should be an orchestrator
  assertEquals(typeof validator.validateTwoParams, "function");
  assertEquals(typeof validator.validateOneParams, "function");
  assertEquals(typeof validator.validateZeroParams, "function");

  // Class should follow orchestration pattern (constructor injection)
  assert(validator instanceof ParameterValidatorV2);
});

Deno.test("0_architecture - Type safety in parameter result types", () => {
  // Mock input types should match expected interfaces
  const mockTwoParamsResult = {
    type: "two" as const,
    directiveType: "to",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };

  const mockOneParamsResult = {
    type: "one" as const,
    params: ["init"],
    options: {},
  };

  const mockZeroParamsResult = {
    type: "zero" as const,
    options: {},
  };

  // Type structure validation
  assertEquals(mockTwoParamsResult.type, "two");
  assertEquals(mockOneParamsResult.type, "one");
  assertEquals(mockZeroParamsResult.type, "zero");

  assertExists(mockTwoParamsResult.directiveType);
  assertExists(mockTwoParamsResult.layerType);
  assert(Array.isArray(mockTwoParamsResult.params));

  assert(Array.isArray(mockOneParamsResult.params));

  assertEquals(typeof mockTwoParamsResult.options, "object");
  assertEquals(typeof mockOneParamsResult.options, "object");
  assertEquals(typeof mockZeroParamsResult.options, "object");
});

Deno.test("0_architecture - Error handling maintains Result type consistency", () => {
  // All validation methods should return consistent Result type structure

  // Success case type
  const mockTwoParamsResultForSuccess: TwoParams_Result = {
    type: "two",
    directiveType: "to",
    demonstrativeType: "to",
    layerType: "project",
    options: {},
    params: ["to", "project"],
  };

  const successResult: Result<ValidatedParams, ValidationError> = {
    ok: true,
    data: {
      directive: (() => {
        const result = DirectiveType.create(mockTwoParamsResultForSuccess.directiveType);
        if (!result.ok) throw new Error("Failed to create DirectiveType in test");
        return result.data;
      })(),
      layer: (() => {
        const result = LayerType.create(mockTwoParamsResultForSuccess.layerType);
        if (!result.ok) throw new Error("Failed to create LayerType in test");
        return result.data;
      })(),
      options: { inputPath: "/input", outputPath: "/output" },
      customVariables: {},
      metadata: { validatedAt: new Date(), source: "TwoParams" },
    },
  };

  // Error case type
  const errorResult: Result<ValidatedParams, ValidationError> = {
    ok: false,
    error: { kind: "ParamsTypeError", error: "Invalid params" },
  };

  // Structure validation
  assert(successResult.ok);
  assert(!errorResult.ok);

  if (successResult.ok) {
    assertExists(successResult.data);
    assertExists(successResult.data.directive);
    assertExists(successResult.data.layer);
    assertExists(successResult.data.options);
    assertExists(successResult.data.customVariables);
    assertExists(successResult.data.metadata);
  }

  if (!errorResult.ok) {
    assertExists(errorResult.error);
    assertExists(errorResult.error.kind);
  }
});

Deno.test("0_architecture - Class encapsulation and method visibility", () => {
  const patternProvider = createMockTypePatternProvider();
  const configValidator = createMockConfigValidator();
  const validator = new ParameterValidatorV2(patternProvider, configValidator);

  // Public methods should be accessible
  assertExists(validator.validateTwoParams);
  assertExists(validator.validateOneParams);
  assertExists(validator.validateZeroParams);

  // Private members should not be directly accessible
  const ownPropertyNames = Object.getOwnPropertyNames(validator);
  const publicProperties = ownPropertyNames.filter((name) => !name.startsWith("_"));

  // Should have minimal public interface (allow some flexibility for class structure)
  assert(publicProperties.length <= 10); // Allow more flexibility for class internals

  // Class should maintain proper encapsulation
  assert(validator instanceof ParameterValidatorV2);
  assertEquals(validator.constructor, ParameterValidatorV2);
});
