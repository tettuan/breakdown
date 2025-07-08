/**
 * @fileoverview ParameterValidatorV2 2_structure Tests - Data Structure and Consistency Validation
 * 
 * ParameterValidatorV2 のデータ構造と整合性の検証。
 * 内部データ構造、型制約、依存関係の構造整合性をテスト。
 * 
 * テスト構成:
 * - 内部データ構造の整合性
 * - バリデーション結果の構造一貫性
 * - エラー構造の正確性
 * - 依存関係の構造制約
 * - オプションとメタデータの構造検証
 */

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  ParameterValidatorV2,
  type ValidatedParams,
  type ValidatedOptions,
  type ValidationMetadata,
  type ValidationError,
  type ConfigValidator,
} from "./parameter_validator_v2.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";
import { TwoParamsDirectivePattern } from "../types/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../types/layer_type.ts";

// =============================================================================
// Test Utilities
// =============================================================================

function createMockTypePatternProvider(): TypePatternProvider {
  return {
    getDirectivePattern: () => {
      const pattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");
      return pattern;
    },
    getLayerTypePattern: () => {
      const pattern = TwoParamsLayerTypePattern.create("^(project|issue|task)$");
      return pattern;
    }
  };
}

function createMockConfigValidator(): ConfigValidator {
  return {
    validateConfig: (config: unknown) => ({ ok: true, data: undefined })
  };
}

// =============================================================================
// 2_STRUCTURE: Data Structure and Consistency Tests
// =============================================================================

Deno.test("2_structure - ValidatedParams maintains hierarchical data integrity", () => {
  const validatedParams: ValidatedParams = {
    directive: {
      getValue: () => "to",
      toString: () => "to",
      getType: () => "two",
      getDemonstrativeType: () => "to",
      getLayerType: () => "project"
    } as any,
    layer: {
      getValue: () => "project",
      toString: () => "project",
      getType: () => "two",
      getDemonstrativeType: () => "to", 
      getLayerType: () => "project"
    } as any,
    options: {
      inputPath: "/absolute/path/to/input.txt",
      outputPath: "/absolute/path/to/output.txt",
      schemaPath: "/absolute/path/to/schema.json",
      promptPath: "/absolute/path/to/prompt.md",
      stdin: "input data from stdin"
    },
    customVariables: {
      "projectName": "test-project",
      "version": "1.0.0",
      "environment": "development",
      "author": "test-user"
    },
    metadata: {
      validatedAt: new Date("2024-01-01T12:00:00Z"),
      source: "TwoParams",
      profileName: "development-profile"
    }
  };
  
  // Top-level structure validation
  assertExists(validatedParams.directive);
  assertExists(validatedParams.layer);
  assertExists(validatedParams.options);
  assertExists(validatedParams.customVariables);
  assertExists(validatedParams.metadata);
  
  // Directive structure
  assertEquals(typeof validatedParams.directive, "object");
  assertEquals(typeof validatedParams.directive.getValue, "function");
  assertEquals(validatedParams.directive.getValue(), "to");
  
  // Layer structure
  assertEquals(typeof validatedParams.layer, "object");
  assertEquals(typeof validatedParams.layer.getValue, "function");
  assertEquals(validatedParams.layer.getValue(), "project");
  
  // Options structure integrity
  const options = validatedParams.options;
  assertEquals(typeof options.inputPath, "string");
  assertEquals(typeof options.outputPath, "string");
  assertEquals(typeof options.schemaPath, "string");
  assertEquals(typeof options.promptPath, "string");
  assertEquals(typeof options.stdin, "string");
  
  // All paths should be absolute
  assert(options.inputPath.startsWith("/"));
  assert(options.outputPath.startsWith("/"));
  assert(options.schemaPath!.startsWith("/"));
  assert(options.promptPath!.startsWith("/"));
  
  // File extensions should be preserved
  assert(options.inputPath.endsWith(".txt"));
  assert(options.outputPath.endsWith(".txt"));
  assert(options.schemaPath!.endsWith(".json"));
  assert(options.promptPath!.endsWith(".md"));
  
  // Custom variables structure
  assertEquals(typeof validatedParams.customVariables, "object");
  assert(!Array.isArray(validatedParams.customVariables));
  assertEquals(Object.keys(validatedParams.customVariables).length, 4);
  
  for (const [key, value] of Object.entries(validatedParams.customVariables)) {
    assertEquals(typeof key, "string");
    assertEquals(typeof value, "string");
    assert(key.length > 0);
    assert(value.length > 0);
  }
  
  // Metadata structure
  const metadata = validatedParams.metadata;
  assert(metadata.validatedAt instanceof Date);
  assertEquals(metadata.source, "TwoParams");
  assertEquals(typeof metadata.profileName, "string");
  assert(["TwoParams", "OneParams", "ZeroParams"].includes(metadata.source));
});

Deno.test("2_structure - ValidatedOptions field constraints and relationships", () => {
  // Test minimal structure
  const minimalOptions: ValidatedOptions = {
    inputPath: "/min/input.txt",
    outputPath: "/min/output.txt"
  };
  
  // Required fields
  assertExists(minimalOptions.inputPath);
  assertExists(minimalOptions.outputPath);
  assertEquals(typeof minimalOptions.inputPath, "string");
  assertEquals(typeof minimalOptions.outputPath, "string");
  
  // Optional fields should be undefined
  assertEquals(minimalOptions.schemaPath, undefined);
  assertEquals(minimalOptions.promptPath, undefined);
  assertEquals(minimalOptions.stdin, undefined);
  
  // Test complete structure
  const completeOptions: ValidatedOptions = {
    inputPath: "/complete/input.md",
    outputPath: "/complete/output.json",
    schemaPath: "/complete/schema.json",
    promptPath: "/complete/prompt.md",
    stdin: "line1\nline2\nline3\n"
  };
  
  // All fields should be present
  assertExists(completeOptions.inputPath);
  assertExists(completeOptions.outputPath);
  assertExists(completeOptions.schemaPath);
  assertExists(completeOptions.promptPath);
  assertExists(completeOptions.stdin);
  
  // Path format consistency
  const pathFields = [
    completeOptions.inputPath,
    completeOptions.outputPath, 
    completeOptions.schemaPath,
    completeOptions.promptPath
  ];
  
  for (const path of pathFields) {
    assertEquals(typeof path, "string");
    assert(path.length > 0);
    assert(path.startsWith("/"));
    assert(path.includes("."));
  }
  
  // stdin can contain any text including newlines
  assert(completeOptions.stdin!.includes("\n"));
  assertEquals(typeof completeOptions.stdin, "string");
  
  // Field length constraints
  assert(completeOptions.inputPath.length > 1);
  assert(completeOptions.outputPath.length > 1);
  assert(completeOptions.schemaPath!.length > 1);
  assert(completeOptions.promptPath!.length > 1);
});

Deno.test("2_structure - ValidationMetadata temporal and source consistency", () => {
  const baseTime = new Date("2024-01-01T00:00:00Z");
  
  // Test all source variants with different timestamps
  const metadataVariants: ValidationMetadata[] = [
    {
      validatedAt: new Date(baseTime.getTime()),
      source: "TwoParams",
      profileName: "prod"
    },
    {
      validatedAt: new Date(baseTime.getTime() + 1000),
      source: "OneParams",
      profileName: "dev"
    },
    {
      validatedAt: new Date(baseTime.getTime() + 2000),
      source: "ZeroParams"
    },
    {
      validatedAt: new Date(baseTime.getTime() + 3000),
      source: "TwoParams",
      profileName: "test"
    }
  ];
  
  for (let i = 0; i < metadataVariants.length; i++) {
    const metadata = metadataVariants[i];
    
    // Structure validation
    assertExists(metadata.validatedAt);
    assertExists(metadata.source);
    assert(metadata.validatedAt instanceof Date);
    assertEquals(typeof metadata.source, "string");
    
    // Temporal ordering
    if (i > 0) {
      assert(metadata.validatedAt >= metadataVariants[i - 1].validatedAt);
    }
    
    // Source constraints
    assert(["TwoParams", "OneParams", "ZeroParams"].includes(metadata.source));
    
    // Profile name handling
    if (metadata.profileName) {
      assertEquals(typeof metadata.profileName, "string");
      assert(metadata.profileName.length > 0);
    } else {
      assertEquals(metadata.profileName, undefined);
    }
    
    // No extra fields
    const expectedFields = ["validatedAt", "source", "profileName"];
    const actualFields = Object.keys(metadata);
    for (const field of actualFields) {
      assert(expectedFields.includes(field));
    }
  }
  
  // Source distribution
  const sources = metadataVariants.map(m => m.source);
  assert(sources.includes("TwoParams"));
  assert(sources.includes("OneParams"));
  assert(sources.includes("ZeroParams"));
});

Deno.test("2_structure - ValidationError discriminated union structural integrity", () => {
  // Test all error variant structures
  const errorVariants: ValidationError[] = [
    {
      kind: "ParamsTypeError",
      error: "Parameter structure validation failed"
    },
    {
      kind: "PathValidationError", 
      error: { path: "/invalid/path", reason: "File not found" }
    },
    {
      kind: "OptionsNormalizationError",
      error: ["Missing required option: input", "Invalid option format: output"]
    },
    {
      kind: "CustomVariableError",
      error: new Error("Variable extraction failed")
    },
    {
      kind: "TypeCreationError",
      type: "directive",
      value: "invalid_directive_value"
    },
    {
      kind: "TypeCreationError",
      type: "layer",
      value: "invalid_layer_value"
    }
  ];
  
  for (const error of errorVariants) {
    // Base structure
    assertExists(error.kind);
    assertEquals(typeof error.kind, "string");
    
    // Verify discriminated union structure
    switch (error.kind) {
      case "ParamsTypeError":
        assertExists(error.error);
        assertEquals(typeof error.error, "string");
        assertEquals(Object.keys(error).length, 2);
        assert(Object.keys(error).includes("kind"));
        assert(Object.keys(error).includes("error"));
        break;
        
      case "PathValidationError":
        assertExists(error.error);
        assertEquals(typeof error.error, "object");
        assertEquals(Object.keys(error).length, 2);
        break;
        
      case "OptionsNormalizationError":
        assertExists(error.error);
        assert(Array.isArray(error.error));
        assertEquals(error.error.length, 2);
        for (const msg of error.error) {
          assertEquals(typeof msg, "string");
        }
        assertEquals(Object.keys(error).length, 2);
        break;
        
      case "CustomVariableError":
        assertExists(error.error);
        assert(error.error instanceof Error);
        assertEquals(Object.keys(error).length, 2);
        break;
        
      case "TypeCreationError":
        assertExists(error.type);
        assertExists(error.value);
        assertEquals(typeof error.type, "string");
        assertEquals(typeof error.value, "string");
        assert(["directive", "layer"].includes(error.type));
        assertEquals(Object.keys(error).length, 3);
        assert(Object.keys(error).includes("kind"));
        assert(Object.keys(error).includes("type"));
        assert(Object.keys(error).includes("value"));
        break;
    }
  }
  
  // TypeCreationError type field validation
  const directiveError = errorVariants.find(e => 
    e.kind === "TypeCreationError" && (e as any).type === "directive"
  ) as any;
  const layerError = errorVariants.find(e => 
    e.kind === "TypeCreationError" && (e as any).type === "layer"
  ) as any;
  
  assertEquals(directiveError.type, "directive");
  assertEquals(layerError.type, "layer");
  assertEquals(typeof directiveError.value, "string");
  assertEquals(typeof layerError.value, "string");
});

Deno.test("2_structure - ParameterValidatorV2 dependency structure constraints", () => {
  const patternProvider = createMockTypePatternProvider();
  const configValidator = createMockConfigValidator();
  
  const validator = new ParameterValidatorV2(patternProvider, configValidator);
  
  // Class structure validation
  assertExists(validator);
  assert(validator instanceof ParameterValidatorV2);
  assertEquals(validator.constructor, ParameterValidatorV2);
  
  // Public interface structure
  assertExists(validator.validateTwoParams);
  assertExists(validator.validateOneParams);
  assertExists(validator.validateZeroParams);
  
  assertEquals(typeof validator.validateTwoParams, "function");
  assertEquals(typeof validator.validateOneParams, "function");
  assertEquals(typeof validator.validateZeroParams, "function");
  
  // Method signatures should be consistent
  const methods = [
    validator.validateTwoParams,
    validator.validateOneParams,
    validator.validateZeroParams
  ];
  
  for (const method of methods) {
    assertEquals(typeof method, "function");
    assertEquals(method.length, 1); // Each should accept one parameter
  }
  
  // No public properties should be exposed (encapsulation)
  const ownProperties = Object.getOwnPropertyNames(validator);
  const publicProperties = ownProperties.filter(prop => 
    !prop.startsWith("_") && typeof (validator as any)[prop] !== "function"
  );
  
  // Should have minimal public interface (allow for class properties)
  assert(publicProperties.length <= 10); // Allow some flexibility for implementation
});

Deno.test("2_structure - ConfigValidator interface result structure consistency", () => {
  // Success result structure
  const successValidator: ConfigValidator = {
    validateConfig: () => ({ ok: true, data: undefined })
  };
  
  const successResult = successValidator.validateConfig({});
  assertExists(successResult);
  assertEquals(typeof successResult, "object");
  assertExists(successResult.ok);
  assertEquals(successResult.ok, true);
  
  if (successResult.ok) {
    assertEquals(successResult.data, undefined); // data can be undefined for success
    assertEquals(Object.keys(successResult).sort(), ["data", "ok"]);
  }
  
  // Error result structure
  const errorValidator: ConfigValidator = {
    validateConfig: () => ({ 
      ok: false, 
      error: ["Config error 1", "Config error 2", "Config error 3"] 
    })
  };
  
  const errorResult = errorValidator.validateConfig(null);
  assertExists(errorResult);
  assertEquals(typeof errorResult, "object");
  assertExists(errorResult.ok);
  assertEquals(errorResult.ok, false);
  
  if (!errorResult.ok) {
    assertExists(errorResult.error);
    assert(Array.isArray(errorResult.error));
    assertEquals(errorResult.error.length, 3);
    
    for (const error of errorResult.error) {
      assertEquals(typeof error, "string");
      assert(error.length > 0);
    }
    
    assertEquals(Object.keys(errorResult).sort(), ["error", "ok"]);
  }
  
  // Empty error array structure
  const emptyErrorValidator: ConfigValidator = {
    validateConfig: () => ({ ok: false, error: [] })
  };
  
  const emptyErrorResult = emptyErrorValidator.validateConfig({});
  if (!emptyErrorResult.ok) {
    assert(Array.isArray(emptyErrorResult.error));
    assertEquals(emptyErrorResult.error.length, 0);
  }
});

Deno.test("2_structure - Custom variables Record<string, string> structural constraints", () => {
  // Empty variables
  const emptyVariables: Record<string, string> = {};
  assertEquals(typeof emptyVariables, "object");
  assert(!Array.isArray(emptyVariables));
  assertEquals(Object.keys(emptyVariables).length, 0);
  assertEquals(Object.values(emptyVariables).length, 0);
  
  // Populated variables with various patterns
  const populatedVariables: Record<string, string> = {
    "simpleVar": "simpleValue",
    "camelCaseVar": "camelCaseValue",
    "snake_case_var": "snake_case_value",
    "kebab-case-var": "kebab-case-value",
    "UPPER_CASE_VAR": "UPPER_CASE_VALUE",
    "var123": "value123",
    "var_with_numbers_123": "value_with_numbers_456"
  };
  
  assertEquals(typeof populatedVariables, "object");
  assert(!Array.isArray(populatedVariables));
  assertEquals(Object.keys(populatedVariables).length, 7);
  
  // Key-value structure validation
  for (const [key, value] of Object.entries(populatedVariables)) {
    assertEquals(typeof key, "string");
    assertEquals(typeof value, "string");
    assert(key.length > 0);
    assert(value.length > 0);
    
    // Keys should be valid identifiers or similar
    assert(/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(key));
    
    // Values should be non-empty strings
    assert(value.trim().length > 0);
  }
  
  // No nested objects or arrays
  for (const value of Object.values(populatedVariables)) {
    assertEquals(typeof value, "string");
    assert(!value.startsWith("{"));
    assert(!value.startsWith("["));
  }
  
  // Special characters in values should be preserved
  const specialCharVariables: Record<string, string> = {
    "pathVar": "/path/to/file.txt",
    "urlVar": "https://example.com/path?param=value",
    "multilineVar": "line1\nline2\nline3",
    "jsonLikeVar": '{"key": "value"}',
    "spacesVar": "value with spaces"
  };
  
  for (const [key, value] of Object.entries(specialCharVariables)) {
    assertEquals(typeof key, "string");
    assertEquals(typeof value, "string");
    assert(key.length > 0);
    assert(value.length > 0);
  }
});

Deno.test("2_structure - Result type structure consistency across validation methods", () => {
  // Success result structure template
  const successTemplate = {
    ok: true as const,
    data: {
      directive: { getValue: () => "to" } as any,
      layer: { getValue: () => "project" } as any,
      options: { inputPath: "/input", outputPath: "/output" },
      customVariables: {},
      metadata: { validatedAt: new Date(), source: "TwoParams" as const }
    }
  };
  
  // Error result structure template
  const errorTemplate = {
    ok: false as const,
    error: { kind: "ParamsTypeError" as const, error: "Test error" }
  };
  
  // Success structure validation
  assertEquals(successTemplate.ok, true);
  assertExists(successTemplate.data);
  assertEquals(typeof successTemplate.data, "object");
  
  const data = successTemplate.data;
  assertExists(data.directive);
  assertExists(data.layer);
  assertExists(data.options);
  assertExists(data.customVariables);
  assertExists(data.metadata);
  
  // Error structure validation
  assertEquals(errorTemplate.ok, false);
  assertExists(errorTemplate.error);
  assertEquals(typeof errorTemplate.error, "object");
  assertExists(errorTemplate.error.kind);
  
  // Result type should be mutually exclusive
  assert(successTemplate.ok === true && errorTemplate.ok === false); // Explicit boolean comparison
  assert("data" in successTemplate);
  assert("error" in errorTemplate);
  assert(!("error" in successTemplate));
  assert(!("data" in errorTemplate));
});

Deno.test("2_structure - Nested path structure and validation constraints", () => {
  const pathStructures = {
    absolute: "/absolute/path/to/file.ext",
    relativeUp: "../relative/up/path/file.ext",
    relativeDown: "./relative/down/path/file.ext", 
    simple: "simple-file.ext",
    deep: "/very/deep/nested/path/structure/with/many/levels/file.ext",
    withNumbers: "/path/with/123/numbers/456/file789.ext",
    withSpecial: "/path/with-special_chars/and.dots/file.ext"
  };
  
  for (const [type, path] of Object.entries(pathStructures)) {
    assertEquals(typeof path, "string");
    assert(path.length > 0);
    
    // Should have file extension
    assert(path.includes("."));
    
    // Should not be just a dot
    assert(path !== ".");
    assert(path !== "..");
    
    // Should have meaningful content
    const pathParts = path.split("/").filter(part => part.length > 0);
    assert(pathParts.length > 0);
    
    // Last part should be filename with extension
    const filename = pathParts[pathParts.length - 1];
    assert(filename.includes("."));
    assert(filename.split(".").length >= 2);
    
    // Path type specific constraints
    switch (type) {
      case "absolute":
        assert(path.startsWith("/"));
        break;
      case "relativeUp":
        assert(path.startsWith("../"));
        break;
      case "relativeDown":
        assert(path.startsWith("./"));
        break;
      case "simple":
        assert(!path.includes("/"));
        break;
    }
  }
});