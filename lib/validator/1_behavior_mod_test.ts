/**
 * @fileoverview Validator Module 1_behavior Tests - Module Behavior and Integration Validation
 *
 * Validator module の動作とモジュール統合の検証。
 * エクスポートされた機能の動作、型の実用性、実際の使用パターンの検証。
 *
 * テスト構成:
 * - エクスポートされた機能の動作確認
 * - 型の実用性とインスタンス化
 * - モジュール統合パターンの検証
 * - エラーハンドリングの動作
 * - 実際の使用シナリオの検証
 */

import { assert, assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  type ConfigValidator,
  ParameterValidator,
  type ValidatedOptions,
  type ValidatedParams,
  type ValidationError,
  type ValidationMetadata,
} from "./mod.ts";
import { TwoParamsDirectivePattern } from "../domain/core/value_objects/directive_type.ts";
import { TwoParamsLayerTypePattern } from "$lib/domain/core/value_objects/layer_type.ts";
import type { DirectiveType } from "../domain/core/value_objects/directive_type.ts";
import type { LayerType } from "$lib/domain/core/value_objects/layer_type.ts";

// =============================================================================
// Test Utilities
// =============================================================================

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

function createMockTypePatternProvider() {
  const directivePattern = {
    pattern: /^(to|summary|defect)$/,
    test: (value: string) => /^(to|summary|defect)$/.test(value),
    getPattern: () => "^(to|summary|defect)$",
    toString: () => "/^(to|summary|defect)$/",
    getDirectivePattern: () => "^(to|summary|defect)$",
  };

  const layerPattern = {
    pattern: /^(project|issue|task)$/,
    test: (value: string) => /^(project|issue|task)$/.test(value),
    getPattern: () => "^(project|issue|task)$",
    toString: () => "/^(project|issue|task)$/",
    getLayerTypePattern: () => "^(project|issue|task)$",
  };

  return {
    getDirectivePattern: () => directivePattern as unknown as TwoParamsDirectivePattern,
    getLayerTypePattern: () => layerPattern as unknown as TwoParamsLayerTypePattern,
    validateDirectiveType: (value: string) => /^(to|summary|defect)$/.test(value),
    validateLayerType: (value: string) => /^(project|issue|task)$/.test(value),
    getValidDirectiveTypes: () => ["to", "summary", "defect"] as readonly string[],
    getValidLayerTypes: () => ["project", "issue", "task"] as readonly string[],
  };
}

// =============================================================================
// 1_BEHAVIOR: Module Behavior and Integration Tests
// =============================================================================

Deno.test("1_behavior - ParameterValidator can be instantiated with dependencies", () => {
  const patternProvider = createMockTypePatternProvider();
  const configValidator = createMockConfigValidator();

  // Should be able to create instance
  const validator = new ParameterValidator(patternProvider, configValidator);

  assertExists(validator);
  assert(validator instanceof ParameterValidator);

  // Should have expected methods
  assertExists(validator.validateTwoParams);
  assertEquals(typeof validator.validateTwoParams, "function");
});

Deno.test("1_behavior - ConfigValidator interface works with mock implementation", () => {
  const configValidator = createMockConfigValidator();

  // Should validate valid config
  const validResult = configValidator.validateConfig({ some: "config" });
  assert(validResult.ok);
  assertEquals(validResult.data, undefined);

  // Should reject invalid config
  const invalidResult = configValidator.validateConfig(null);
  assert(!invalidResult.ok);
  assertExists(invalidResult.error);
  assert(Array.isArray(invalidResult.error));
  assert(invalidResult.error.length > 0);
});

Deno.test("1_behavior - ValidatedOptions type supports all validation scenarios", () => {
  // Minimal valid options
  const minimalOptions: ValidatedOptions = {
    inputPath: "/path/to/input",
    outputPath: "/path/to/output",
  };

  assertEquals(minimalOptions.inputPath, "/path/to/input");
  assertEquals(minimalOptions.outputPath, "/path/to/output");
  assertEquals(minimalOptions.schemaPath, undefined);
  assertEquals(minimalOptions.promptPath, undefined);
  assertEquals(minimalOptions.stdin, undefined);

  // Full options with all fields
  const fullOptions: ValidatedOptions = {
    inputPath: "/path/to/input",
    outputPath: "/path/to/output",
    schemaPath: "/path/to/schema.json",
    promptPath: "/path/to/prompt.md",
    stdin: "input data from stdin",
  };

  assertEquals(fullOptions.inputPath, "/path/to/input");
  assertEquals(fullOptions.outputPath, "/path/to/output");
  assertEquals(fullOptions.schemaPath, "/path/to/schema.json");
  assertEquals(fullOptions.promptPath, "/path/to/prompt.md");
  assertEquals(fullOptions.stdin, "input data from stdin");
});

Deno.test("1_behavior - ValidatedParams type integrates all validation components", () => {
  const mockDirective = { value: "to", getValue: () => "to" };
  const mockLayer = { value: "project", getValue: () => "project" };

  const validatedParams: ValidatedParams = {
    directive: mockDirective as unknown as DirectiveType,
    layer: mockLayer as unknown as LayerType,
    options: {
      inputPath: "/input",
      outputPath: "/output",
      schemaPath: "/schema.json",
    },
    customVariables: {
      "var1": "value1",
      "var2": "value2",
    },
    metadata: {
      validatedAt: new Date(),
      source: "TwoParams_Result",
      profileName: "test-profile",
    },
  };

  // Should maintain all components
  assertEquals(validatedParams.directive.value, "to");
  assertEquals(validatedParams.layer.value, "project");
  assertEquals(validatedParams.options.inputPath, "/input");
  assertEquals(validatedParams.customVariables.var1, "value1");
  assertEquals(validatedParams.metadata.source, "TwoParams_Result");
  assertEquals(validatedParams.metadata.profileName, "test-profile");
});

Deno.test("1_behavior - ValidationMetadata tracks validation lifecycle", () => {
  const startTime = new Date();

  // Create metadata for different sources
  const twoParamsMetadata: ValidationMetadata = {
    validatedAt: new Date(),
    source: "TwoParams_Result",
    profileName: "prod",
  };

  const oneParamsMetadata: ValidationMetadata = {
    validatedAt: new Date(),
    source: "OneParamsResult",
  };

  const zeroParamsMetadata: ValidationMetadata = {
    validatedAt: new Date(),
    source: "ZeroParamsResult",
    profileName: "dev",
  };

  // Should track timing
  assert(twoParamsMetadata.validatedAt >= startTime);
  assert(oneParamsMetadata.validatedAt >= startTime);
  assert(zeroParamsMetadata.validatedAt >= startTime);

  // Should distinguish sources
  assertEquals(twoParamsMetadata.source, "TwoParams_Result");
  assertEquals(oneParamsMetadata.source, "OneParamsResult");
  assertEquals(zeroParamsMetadata.source, "ZeroParamsResult");

  // Should handle optional profile
  assertEquals(twoParamsMetadata.profileName, "prod");
  assertEquals(oneParamsMetadata.profileName, undefined);
  assertEquals(zeroParamsMetadata.profileName, "dev");
});

Deno.test("1_behavior - ValidationError discriminated union enables proper error handling", () => {
  // Test different error types
  const paramsError: ValidationError = {
    kind: "InvalidParamsType",
    expected: "two",
    received: "one",
    context: { error: "Invalid parameters structure" },
  };

  const pathError: ValidationError = {
    kind: "PathValidationFailed",
    path: "/some/path",
    reason: "Path does not exist",
    context: {},
  };

  const directiveError: ValidationError = {
    kind: "InvalidDirectiveType",
    value: "invalid",
    validPattern: "^(to|summary|defect)$",
    context: { error: "Cannot normalize options" },
  };

  const variableError: ValidationError = {
    kind: "CustomVariableInvalid",
    key: "var1",
    reason: "Invalid custom variable",
    context: {},
  };

  const configError: ValidationError = {
    kind: "ConfigValidationFailed",
    errors: ["Invalid configuration"],
    context: {},
  };

  // Error handling function
  function handleValidationError(error: ValidationError): string {
    switch (error.kind) {
      case "InvalidParamsType":
        return `Params error: ${error.context?.error || "Invalid params type"}`;
      case "PathValidationFailed":
        return `Path error: ${error.reason}`;
      case "InvalidDirectiveType":
        return `Options error: ${error.context?.error || "Invalid directive"}`;
      case "CustomVariableInvalid":
        return `Variable error: ${error.reason}`;
      case "ConfigValidationFailed":
        return `Config error: ${error.errors.join(", ")}`;
      default:
        return `Unknown error`;
    }
  }

  // Should handle all error types properly
  assertEquals(handleValidationError(paramsError), "Params error: Invalid parameters structure");
  assertEquals(handleValidationError(pathError), "Path error: Path does not exist");
  assertEquals(handleValidationError(directiveError), "Options error: Cannot normalize options");
  assertEquals(handleValidationError(variableError), "Variable error: Invalid custom variable");
  assertEquals(handleValidationError(configError), "Config error: Invalid configuration");
});

Deno.test("1_behavior - Module exports enable comprehensive validation workflow", () => {
  // Simulate a complete validation workflow
  const patternProvider = createMockTypePatternProvider();
  const configValidator = createMockConfigValidator();

  // 1. Create validator instance
  const validator = new ParameterValidator(patternProvider, configValidator);
  assertExists(validator);

  // 2. Prepare validation input
  const _mockTwoParamsResult = {
    type: "two" as const,
    directiveType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      input: "/input/file.txt",
      output: "/output/file.txt",
    },
  };

  // 3. Validate (would typically call validator.validate)
  // Note: This is a mock test of the workflow structure

  // 4. Create expected result structure
  const expectedValidatedParams: ValidatedParams = {
    directive: { value: "to" } as unknown as DirectiveType,
    layer: { value: "project" } as unknown as LayerType,
    options: {
      inputPath: "/input/file.txt",
      outputPath: "/output/file.txt",
    },
    customVariables: {},
    metadata: {
      validatedAt: new Date(),
      source: "TwoParams_Result",
    },
  };

  // Should have proper structure for workflow
  assertExists(expectedValidatedParams.directive);
  assertExists(expectedValidatedParams.layer);
  assertExists(expectedValidatedParams.options);
  assertExists(expectedValidatedParams.customVariables);
  assertExists(expectedValidatedParams.metadata);
});

Deno.test("1_behavior - Type exports support runtime type checking patterns", () => {
  // Runtime type guards
  function isValidatedOptions(obj: unknown): obj is ValidatedOptions {
    return obj !== null &&
      typeof obj === "object" &&
      "inputPath" in obj &&
      "outputPath" in obj &&
      typeof (obj as Record<string, unknown>).inputPath === "string" &&
      typeof (obj as Record<string, unknown>).outputPath === "string";
  }

  function isValidationMetadata(obj: unknown): obj is ValidationMetadata {
    return obj !== null &&
      typeof obj === "object" &&
      "validatedAt" in obj &&
      "source" in obj &&
      (obj as Record<string, unknown>).validatedAt instanceof Date &&
      ["TwoParams_Result", "OneParamsResult", "ZeroParamsResult"].includes(
        (obj as Record<string, unknown>).source as string,
      );
  }

  // Test valid objects
  const validOptions = {
    inputPath: "/input",
    outputPath: "/output",
  };

  const validMetadata = {
    validatedAt: new Date(),
    source: "TwoParams_Result" as const,
  };

  assert(isValidatedOptions(validOptions));
  assert(isValidationMetadata(validMetadata));

  // Test invalid objects
  const invalidOptions = {
    inputPath: "/input",
    // Missing outputPath
  };

  const invalidMetadata = {
    validatedAt: new Date(),
    source: "InvalidSource",
  };

  assert(!isValidatedOptions(invalidOptions));
  assert(!isValidationMetadata(invalidMetadata));
});

Deno.test("1_behavior - Error types enable comprehensive error categorization", () => {
  // Collect different types of errors
  const errors: ValidationError[] = [];

  // Simulate various error scenarios
  errors.push({
    kind: "InvalidParamsType",
    expected: "two",
    received: "one",
    context: { message: "Params validation failed" },
  });

  errors.push({
    kind: "PathValidationFailed",
    path: "/some/file",
    reason: "File not found",
    context: {},
  });

  errors.push({
    kind: "InvalidDirectiveType",
    value: "unknown_directive",
    validPattern: "^(to|summary|defect)$",
    context: {},
  });

  // Should categorize errors properly
  assertEquals(errors.length, 3);
  assertEquals(errors[0].kind, "InvalidParamsType");
  assertEquals(errors[1].kind, "PathValidationFailed");
  assertEquals(errors[2].kind, "InvalidDirectiveType");

  // Should enable error-specific handling
  const errorMessages = errors.map((error) => {
    switch (error.kind) {
      case "InvalidParamsType":
        return `${error.kind}: ${error.context?.message || "Invalid params type"}`;
      case "PathValidationFailed":
        return `${error.kind}: ${error.reason}`;
      case "InvalidDirectiveType":
        return `${error.kind}: directive = ${error.value}`;
      default:
        return `Unknown error`;
    }
  });

  assertEquals(errorMessages[0], "InvalidParamsType: Params validation failed");
  assertEquals(errorMessages[1], "PathValidationFailed: File not found");
  assertEquals(errorMessages[2], "InvalidDirectiveType: directive = unknown_directive");
});

Deno.test("1_behavior - Module supports dependency injection patterns", () => {
  // Different implementations of ConfigValidator
  const strictValidator: ConfigValidator = {
    validateConfig: (config: unknown) => {
      if (!config || typeof config !== "object") {
        return { ok: false, error: ["Config must be an object"] };
      }
      return { ok: true, data: undefined };
    },
  };

  const lenientValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const patternProvider = createMockTypePatternProvider();

  // Should work with different validator implementations
  const strictValidatorInstance = new ParameterValidator(patternProvider, strictValidator);
  const lenientValidatorInstance = new ParameterValidator(patternProvider, lenientValidator);

  assertExists(strictValidatorInstance);
  assertExists(lenientValidatorInstance);

  // Both should be valid ParameterValidator instances
  assert(strictValidatorInstance instanceof ParameterValidator);
  assert(lenientValidatorInstance instanceof ParameterValidator);
});

Deno.test("1_behavior - Validation metadata enables audit trails", () => {
  const validations: ValidationMetadata[] = [];

  // Simulate multiple validations
  for (let i = 0; i < 3; i++) {
    validations.push({
      validatedAt: new Date(Date.now() + i * 1000),
      source: i === 0 ? "TwoParams_Result" : i === 1 ? "OneParamsResult" : "ZeroParamsResult",
      profileName: `profile-${i}`,
    });
  }

  // Should track validation history
  assertEquals(validations.length, 3);

  // Should have chronological ordering
  assert(validations[0].validatedAt < validations[1].validatedAt);
  assert(validations[1].validatedAt < validations[2].validatedAt);

  // Should distinguish validation sources
  assertEquals(validations[0].source, "TwoParams_Result");
  assertEquals(validations[1].source, "OneParamsResult");
  assertEquals(validations[2].source, "ZeroParamsResult");

  // Should track profile context
  assertEquals(validations[0].profileName, "profile-0");
  assertEquals(validations[1].profileName, "profile-1");
  assertEquals(validations[2].profileName, "profile-2");
});
