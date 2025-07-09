/**
 * @fileoverview Validator Module 2_structure Tests - Data Structure and Consistency Validation
 *
 * Validator module のデータ構造と整合性の検証。
 * 型構造の一貫性、データの整合性、構造的制約の検証。
 *
 * テスト構成:
 * - データ構造の一貫性検証
 * - 型制約の構造的正確性
 * - オプショナルフィールドの構造整合性
 * - エラー構造の一貫性
 * - モジュール間データ交換の構造検証
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

// =============================================================================
// 2_STRUCTURE: Data Structure and Consistency Tests
// =============================================================================

Deno.test("2_structure - ValidatedOptions maintains structural consistency", () => {
  // Test minimal structure
  const minimalOptions: ValidatedOptions = {
    inputPath: "/path/to/input",
    outputPath: "/path/to/output",
  };

  // Required fields should be present
  assertExists(minimalOptions.inputPath);
  assertExists(minimalOptions.outputPath);
  assertEquals(typeof minimalOptions.inputPath, "string");
  assertEquals(typeof minimalOptions.outputPath, "string");

  // Optional fields should be undefined when not set
  assertEquals(minimalOptions.schemaPath, undefined);
  assertEquals(minimalOptions.promptPath, undefined);
  assertEquals(minimalOptions.stdin, undefined);

  // Test complete structure
  const completeOptions: ValidatedOptions = {
    inputPath: "/path/to/input",
    outputPath: "/path/to/output",
    schemaPath: "/path/to/schema.json",
    promptPath: "/path/to/prompt.md",
    stdin: "input data",
  };

  // All fields should be present and properly typed
  assertExists(completeOptions.inputPath);
  assertExists(completeOptions.outputPath);
  assertExists(completeOptions.schemaPath);
  assertExists(completeOptions.promptPath);
  assertExists(completeOptions.stdin);

  assertEquals(typeof completeOptions.inputPath, "string");
  assertEquals(typeof completeOptions.outputPath, "string");
  assertEquals(typeof completeOptions.schemaPath, "string");
  assertEquals(typeof completeOptions.promptPath, "string");
  assertEquals(typeof completeOptions.stdin, "string");

  // Path fields should not be empty
  assert(completeOptions.inputPath.length > 0);
  assert(completeOptions.outputPath.length > 0);
  assert(completeOptions.schemaPath!.length > 0);
  assert(completeOptions.promptPath!.length > 0);
});

Deno.test("2_structure - ValidatedParams has consistent nested structure", () => {
  const mockDirective = {
    getValue: () => "to",
    toString: () => "to",
  };

  const mockLayer = {
    getValue: () => "project",
    toString: () => "project",
  };

  const validatedParams: ValidatedParams = {
    directive: mockDirective as any,
    layer: mockLayer as any,
    options: {
      inputPath: "/input/file.txt",
      outputPath: "/output/file.txt",
      schemaPath: "/schema/schema.json",
    },
    customVariables: {
      "variable1": "value1",
      "variable2": "value2",
      "variable3": "value3",
    },
    metadata: {
      validatedAt: new Date("2024-01-01T00:00:00Z"),
      source: "TwoParams_Result",
      profileName: "test-profile",
    },
  };

  // Top-level structure
  assertExists(validatedParams.directive);
  assertExists(validatedParams.layer);
  assertExists(validatedParams.options);
  assertExists(validatedParams.customVariables);
  assertExists(validatedParams.metadata);

  // Directive/Layer structure
  assertEquals(typeof validatedParams.directive.getValue, "function");
  assertEquals(typeof validatedParams.layer.getValue, "function");
  assertEquals(validatedParams.directive.getValue(), "to");
  assertEquals(validatedParams.layer.getValue(), "project");

  // Options structure consistency
  assertEquals(typeof validatedParams.options, "object");
  assertEquals(typeof validatedParams.options.inputPath, "string");
  assertEquals(typeof validatedParams.options.outputPath, "string");
  assertEquals(typeof validatedParams.options.schemaPath, "string");

  // Custom variables structure
  assertEquals(typeof validatedParams.customVariables, "object");
  assert(!Array.isArray(validatedParams.customVariables));

  // All custom variables should be strings
  for (const [key, value] of Object.entries(validatedParams.customVariables)) {
    assertEquals(typeof key, "string");
    assertEquals(typeof value, "string");
    assert(key.length > 0);
    assert(value.length > 0);
  }

  // Metadata structure
  assertEquals(typeof validatedParams.metadata, "object");
  assert(validatedParams.metadata.validatedAt instanceof Date);
  assertEquals(typeof validatedParams.metadata.source, "string");
  assertEquals(typeof validatedParams.metadata.profileName, "string");
});

Deno.test("2_structure - ValidationMetadata maintains temporal and source consistency", () => {
  const currentTime = new Date();

  // Test with all fields
  const completeMetadata: ValidationMetadata = {
    validatedAt: currentTime,
    source: "TwoParams_Result",
    profileName: "production",
  };

  // Structure validation
  assertExists(completeMetadata.validatedAt);
  assertExists(completeMetadata.source);
  assertExists(completeMetadata.profileName);

  assert(completeMetadata.validatedAt instanceof Date);
  assertEquals(typeof completeMetadata.source, "string");
  assertEquals(typeof completeMetadata.profileName, "string");

  // Source constraints
  assert(
    ["TwoParams_Result", "OneParamsResult", "ZeroParamsResult"].includes(completeMetadata.source),
  );

  // Test with minimal fields
  const minimalMetadata: ValidationMetadata = {
    validatedAt: currentTime,
    source: "OneParamsResult",
  };

  assertExists(minimalMetadata.validatedAt);
  assertExists(minimalMetadata.source);
  assertEquals(minimalMetadata.profileName, undefined);

  // Temporal consistency
  assert(minimalMetadata.validatedAt <= new Date());

  // Test all source variants
  const sourceVariants: ValidationMetadata["source"][] = [
    "TwoParams_Result",
    "OneParamsResult",
    "ZeroParamsResult",
  ];

  for (const source of sourceVariants) {
    const metadata: ValidationMetadata = {
      validatedAt: new Date(),
      source,
    };

    assertEquals(metadata.source, source);
    assert(sourceVariants.includes(metadata.source));
  }
});

Deno.test("2_structure - ValidationError discriminated union maintains structural integrity", () => {
  // Test all error variants maintain proper structure

  // InvalidParamsType
  const paramsError: ValidationError = {
    kind: "InvalidParamsType",
    expected: "two",
    received: "one",
  };

  assertEquals(paramsError.kind, "InvalidParamsType");
  assertExists(paramsError.expected);
  assertExists(paramsError.received);
  assertEquals(typeof paramsError.expected, "string");
  assertEquals(typeof paramsError.received, "string");
  assertEquals(Object.keys(paramsError).sort(), ["expected", "kind", "received"]);

  // PathValidationFailed
  const pathError: ValidationError = {
    kind: "PathValidationFailed",
    path: "/invalid/path",
    reason: "Path not found",
  };

  assertEquals(pathError.kind, "PathValidationFailed");
  assertExists(pathError.path);
  assertExists(pathError.reason);
  assertEquals(typeof pathError.path, "string");
  assertEquals(typeof pathError.reason, "string");
  assertEquals(Object.keys(pathError).sort(), ["kind", "path", "reason"]);

  // ConfigValidationFailed
  const optionsError: ValidationError = {
    kind: "ConfigValidationFailed",
    errors: ["Option 1 invalid", "Option 2 missing"],
  };

  assertEquals(optionsError.kind, "ConfigValidationFailed");
  assertExists(optionsError.errors);
  assert(Array.isArray(optionsError.errors));
  assertEquals(Object.keys(optionsError).sort(), ["errors", "kind"]);

  // CustomVariableInvalid
  const variableError: ValidationError = {
    kind: "CustomVariableInvalid",
    key: "invalidVar",
    reason: "Variable extraction failed",
  };

  assertEquals(variableError.kind, "CustomVariableInvalid");
  assertExists(variableError.key);
  assertExists(variableError.reason);
  assertEquals(typeof variableError.key, "string");
  assertEquals(typeof variableError.reason, "string");
  assertEquals(Object.keys(variableError).sort(), ["key", "kind", "reason"]);

  // InvalidDirectiveType
  const directiveTypeError: ValidationError = {
    kind: "InvalidDirectiveType",
    value: "invalid_directive",
    validPattern: "^(to|summary|defect)$",
  };

  assertEquals(directiveTypeError.kind, "InvalidDirectiveType");
  assertExists(directiveTypeError.value);
  assertExists(directiveTypeError.validPattern);
  assertEquals(typeof directiveTypeError.value, "string");
  assertEquals(typeof directiveTypeError.validPattern, "string");
  assertEquals(Object.keys(directiveTypeError).sort(), ["kind", "validPattern", "value"]);

  // InvalidLayerType
  const layerTypeError: ValidationError = {
    kind: "InvalidLayerType",
    value: "invalid_layer",
    validPattern: "^(project|issue|task)$",
  };

  assertEquals(layerTypeError.kind, "InvalidLayerType");
  assertExists(layerTypeError.value);
  assertExists(layerTypeError.validPattern);
  assertEquals(typeof layerTypeError.value, "string");
  assertEquals(typeof layerTypeError.validPattern, "string");
});

Deno.test("2_structure - ConfigValidator interface maintains consistent Result structure", () => {
  // Mock implementation maintaining structure
  const configValidator: ConfigValidator = {
    validateConfig: (config: unknown) => {
      if (config === null || config === undefined) {
        return {
          ok: false,
          error: ["Configuration cannot be null or undefined"],
        };
      }

      if (typeof config !== "object") {
        return {
          ok: false,
          error: ["Configuration must be an object"],
        };
      }

      return {
        ok: true,
        data: undefined,
      };
    },
  };

  // Test successful validation structure
  const successResult = configValidator.validateConfig({});
  assertExists(successResult);
  assertExists(successResult.ok);
  assertEquals(successResult.ok, true);

  if (successResult.ok) {
    assert("data" in successResult);
    assertEquals(successResult.data, undefined);
    assertEquals(Object.keys(successResult).sort(), ["data", "ok"]);
  }

  // Test error validation structure
  const errorResult = configValidator.validateConfig(null);
  assertExists(errorResult);
  assertExists(errorResult.ok);
  assertEquals(errorResult.ok, false);

  if (!errorResult.ok) {
    assertExists(errorResult.error);
    assert(Array.isArray(errorResult.error));
    assertEquals(typeof errorResult.error[0], "string");
    assertEquals(Object.keys(errorResult).sort(), ["error", "ok"]);
  }

  // Multiple errors structure
  const multiErrorResult = configValidator.validateConfig("invalid");
  if (!multiErrorResult.ok) {
    assert(Array.isArray(multiErrorResult.error));
    assert(multiErrorResult.error.length > 0);

    for (const error of multiErrorResult.error) {
      assertEquals(typeof error, "string");
      assert(error.length > 0);
    }
  }
});

Deno.test("2_structure - ParameterValidator maintains consistent class structure", () => {
  // Mock dependencies
  const patternProvider = {
    getDirectivePattern: () => null,
    getLayerTypePattern: () => null,
  };

  const configValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined }),
  };

  const validator = new ParameterValidator(patternProvider, configValidator);

  // Class structure validation
  assertExists(validator);
  assert(validator instanceof ParameterValidator);
  assertEquals(validator.constructor, ParameterValidator);

  // Method existence
  assertExists(validator.validateTwoParams);
  assertEquals(typeof validator.validateTwoParams, "function");

  // Should have no public properties (encapsulation)
  const ownKeys = Object.getOwnPropertyNames(validator);
  const publicMethods = ownKeys.filter((key) =>
    typeof (validator as any)[key] === "function" && !key.startsWith("_")
  );

  // Should have validateTwoParams method as primary public interface
  assert(
    publicMethods.includes("validateTwoParams") ||
      Object.getPrototypeOf(validator).validateTwoParams,
  );
});

Deno.test("2_structure - Custom variables maintain Record<string, string> structure", () => {
  // Empty custom variables
  const emptyVariables: Record<string, string> = {};
  assertEquals(typeof emptyVariables, "object");
  assertEquals(Object.keys(emptyVariables).length, 0);

  // Populated custom variables
  const customVariables: Record<string, string> = {
    "var1": "value1",
    "var2": "value2",
    "complex_var_name": "complex_value_123",
    "simple": "test",
  };

  assertEquals(typeof customVariables, "object");
  assert(!Array.isArray(customVariables));
  assertEquals(Object.keys(customVariables).length, 4);

  // All keys and values should be strings
  for (const [key, value] of Object.entries(customVariables)) {
    assertEquals(typeof key, "string");
    assertEquals(typeof value, "string");
    assert(key.length > 0);
    assert(value.length > 0);
  }

  // Structure should be flat (no nested objects)
  for (const value of Object.values(customVariables)) {
    assertEquals(typeof value, "string");
    assert(!value.includes("{") && !value.includes("["));
  }
});

Deno.test("2_structure - Nested options structure maintains path consistency", () => {
  const options: ValidatedOptions = {
    inputPath: "/absolute/path/to/input.txt",
    outputPath: "/absolute/path/to/output.txt",
    schemaPath: "/absolute/path/to/schema.json",
    promptPath: "/absolute/path/to/prompt.md",
    stdin: "multiline\ninput\ndata",
  };

  // All paths should be absolute
  assert(options.inputPath.startsWith("/"));
  assert(options.outputPath.startsWith("/"));
  assert(options.schemaPath!.startsWith("/"));
  assert(options.promptPath!.startsWith("/"));

  // Paths should have proper extensions or be directories
  assert(options.inputPath.includes(".") || options.inputPath.endsWith("/"));
  assert(options.outputPath.includes(".") || options.outputPath.endsWith("/"));
  assert(options.schemaPath!.endsWith(".json"));
  assert(options.promptPath!.endsWith(".md"));

  // stdin can contain any text including newlines
  assert(options.stdin!.includes("\n"));
  assertEquals(typeof options.stdin, "string");

  // Path structure consistency
  const pathFields = ["inputPath", "outputPath", "schemaPath", "promptPath"];
  for (const field of pathFields) {
    const path = (options as any)[field];
    if (path) {
      assertEquals(typeof path, "string");
      assert(path.length > 0);
      assert(path.startsWith("/"));
    }
  }
});

Deno.test("2_structure - Error kind maintains string literal type constraints", () => {
  const validErrorKinds = [
    "InvalidParamsType",
    "PathValidationFailed",
    "InvalidDirectiveType",
    "InvalidLayerType",
    "CustomVariableInvalid",
    "ConfigValidationFailed",
  ];

  // Test each error kind
  const errors: ValidationError[] = [
    { kind: "InvalidParamsType", expected: "two", received: "one", context: {} },
    { kind: "PathValidationFailed", path: "/test", reason: "test error", context: {} },
    { kind: "InvalidDirectiveType", value: "invalid", validPattern: "^(to|summary)$", context: {} },
    { kind: "InvalidLayerType", value: "invalid", validPattern: "^(project|issue)$", context: {} },
    { kind: "CustomVariableInvalid", key: "test", reason: "test error", context: {} },
    { kind: "ConfigValidationFailed", errors: ["test error"], context: {} },
  ];

  // Test each error kind
  for (const error of errors) {
    assertEquals(typeof error.kind, "string");
    assert(validErrorKinds.includes(error.kind));
  }

  // Specific field type constraints
  const directiveError: ValidationError = {
    kind: "InvalidDirectiveType",
    value: "invalid",
    validPattern: "^(to|summary|defect)$",
    context: {},
  };

  const layerError: ValidationError = {
    kind: "InvalidLayerType",
    value: "invalid",
    validPattern: "^(project|issue|task)$",
    context: {},
  };

  assertEquals(directiveError.value, "invalid");
  assertEquals(layerError.value, "invalid");
  assert(directiveError.validPattern.includes("to"));
  assert(layerError.validPattern.includes("project"));
});

Deno.test("2_structure - Module exports maintain consistent type structure", () => {
  // Type structure consistency
  const testStructures = {
    configValidator: null as ConfigValidator | null,
    validatedOptions: null as ValidatedOptions | null,
    validatedParams: null as ValidatedParams | null,
    validationMetadata: null as ValidationMetadata | null,
    validationError: null as ValidationError | null,
  };

  // All types should be properly nullable
  assertEquals(testStructures.configValidator, null);
  assertEquals(testStructures.validatedOptions, null);
  assertEquals(testStructures.validatedParams, null);
  assertEquals(testStructures.validationMetadata, null);
  assertEquals(testStructures.validationError, null);

  // ParameterValidator class should be constructable
  assertEquals(typeof ParameterValidator, "function");
  assertExists(ParameterValidator.prototype);
  assertEquals(ParameterValidator.prototype.constructor, ParameterValidator);
});
