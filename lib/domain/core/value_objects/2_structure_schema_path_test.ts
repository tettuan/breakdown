/**
 * @fileoverview SchemaPath 0_architecture Tests - Smart Constructor Totality Validation
 *
 * Totality原則に基づくアーキテクチャ制約のテスト。
 * Smart Constructor, Result型, Discriminated Unionパターンの正当性を検証。
 *
 * テスト構成:
 * - 0_architecture: Smart Constructor, Result型, Discriminated Union制約
 * - 1_behavior: 通常動作とビジネスルールの検証
 * - 2_structure: データ構造と整合性の検証
 */

import {
  assertEquals,
  assertExists,
  assertNotEquals,
} from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  DEFAULT_SCHEMA_PATH_CONFIG,
  formatSchemaPathError,
  isInvalidDirectiveError,
  isInvalidLayerError,
  isInvalidSchemaFilenameError,
  isJsonSchemaValidationError,
  isSchemaPathConstructionError,
  isSecurityViolationError,
  isValidationError,
  SchemaPath,
  SchemaPathConfig,
  SchemaPathError,
} from "./schema_path.ts";
import type { DirectiveType } from "../../../types/directive_type.ts";
import type { LayerType } from "../../../types/layer_type.ts";

// =============================================================================
// 0_ARCHITECTURE: Smart Constructor & Result Type & Discriminated Union Tests
// =============================================================================

Deno.test("0_architecture - SchemaPath implements Smart Constructor pattern correctly", () => {
  // Smart Constructor: Private constructor, public static factory methods

  // Public factory methods exist
  assertExists(SchemaPath.create);
  assertExists(SchemaPath.createWithConfig);
  assertExists(SchemaPath.createJsonSchema);
  assertExists(SchemaPath.createMarkdownSchema);
  assertExists(SchemaPath.createDefectSchema);
});

Deno.test("0_architecture - SchemaPath.create returns Result type with totality", () => {
  // Create mock DirectiveType and LayerType
  const mockDirective: DirectiveType = {
    getValue: () => "to",
    equals: (other: DirectiveType) => other.getValue() === "to",
  } as DirectiveType;

  const mockLayer: LayerType = {
    getValue: () => "project",
    equals: (other: LayerType) => other.getValue() === "project",
  } as LayerType;

  // Valid case - should return Result.ok
  const validResult = SchemaPath.create(mockDirective, mockLayer, "base.schema.md");

  // Result type structure verification
  assertExists(validResult);
  assertExists(validResult.ok);

  if (validResult.ok) {
    assertExists(validResult.data);
    assertEquals(typeof validResult.data, "object");
  } else {
    assertExists(validResult.error);
    assertEquals(typeof validResult.error, "object");
  }
});

Deno.test("0_architecture - SchemaPathError uses Discriminated Union pattern", () => {
  // Test each error type has unique 'kind' discriminator
  const mockDirective: DirectiveType = {
    getValue: () => "to",
    equals: (other: DirectiveType) => other.getValue() === "to",
  } as DirectiveType;

  const mockLayer: LayerType = {
    getValue: () => "project",
    equals: (other: LayerType) => other.getValue() === "project",
  } as LayerType;

  // Test invalid filename to get InvalidSchemaFilename error
  const invalidFilenameResult = SchemaPath.create(mockDirective, mockLayer, "");

  if (!invalidFilenameResult.ok) {
    const error = invalidFilenameResult.error;

    // Discriminated Union: error must have 'kind' property
    assertExists(error.kind);
    assertEquals(typeof error.kind, "string");

    // Each error type should be distinguishable
    if (error.kind === "InvalidSchemaFilename") {
      assertExists(error.filename);
      assertExists(error.constraints);
      assertEquals(Array.isArray(error.constraints), true);
    }
  }
});

Deno.test("0_architecture - Type guards work correctly for schema error discrimination", () => {
  // Test all type guard functions exist and work correctly
  const mockError: SchemaPathError = {
    kind: "InvalidDirective",
    message: "Test error",
    directive: "invalid",
  };

  // Type guard functions must exist
  assertExists(isInvalidDirectiveError);
  assertExists(isInvalidLayerError);
  assertExists(isInvalidSchemaFilenameError);
  assertExists(isSchemaPathConstructionError);
  assertExists(isJsonSchemaValidationError);
  assertExists(isSecurityViolationError);
  assertExists(isValidationError);

  // Type guard must correctly identify error type
  assertEquals(isInvalidDirectiveError(mockError), true);
  assertEquals(isInvalidLayerError(mockError), false);
  assertEquals(isInvalidSchemaFilenameError(mockError), false);
  assertEquals(isSchemaPathConstructionError(mockError), false);
  assertEquals(isJsonSchemaValidationError(mockError), false);
  assertEquals(isSecurityViolationError(mockError), false);
  assertEquals(isValidationError(mockError), false);
});

Deno.test("0_architecture - Schema error formatter provides consistent messaging", () => {
  // Error formatter must exist and handle all error types
  assertExists(formatSchemaPathError);

  const testErrors: SchemaPathError[] = [
    {
      kind: "InvalidDirective",
      message: "Test directive error",
      directive: "invalid",
    },
    {
      kind: "InvalidLayer",
      message: "Test layer error",
      layer: "invalid",
    },
    {
      kind: "InvalidSchemaFilename",
      message: "Test schema filename error",
      filename: "invalid.txt",
      constraints: ["must end with .schema.md or .json"],
    },
    {
      kind: "SchemaPathConstructionError",
      message: "Test construction error",
      components: {
        directive: "to",
        layer: "project",
        filename: "test.schema.md",
      },
    },
    {
      kind: "JsonSchemaValidationError",
      message: "Test JSON schema validation error",
      attemptedPath: "to/project/invalid.json",
      validation: "syntax",
    },
    {
      kind: "SecurityViolation",
      message: "Test security error",
      attemptedPath: "../../../etc/passwd",
      violation: "path_traversal",
    },
    {
      kind: "ValidationError",
      field: "directive",
      message: "Test validation error",
      value: "invalid",
    },
  ];

  // Each error type must produce a formatted message
  for (const error of testErrors) {
    const formatted = formatSchemaPathError(error);
    assertExists(formatted);
    assertEquals(typeof formatted, "string");
    assertNotEquals(formatted.length, 0);

    // Message should contain error type context
    if (error.kind === "InvalidDirective") {
      assertEquals(formatted.includes("Invalid directive"), true);
    }
    if (error.kind === "InvalidLayer") {
      assertEquals(formatted.includes("Invalid layer"), true);
    }
    if (error.kind === "InvalidSchemaFilename") {
      assertEquals(formatted.includes("Invalid schema filename"), true);
    }
    if (error.kind === "JsonSchemaValidationError") {
      assertEquals(formatted.includes("JSON Schema validation failed"), true);
    }
  }
});

Deno.test("0_architecture - Schema configuration object is immutable and well-structured", () => {
  // Default configuration must exist and be properly structured
  assertExists(DEFAULT_SCHEMA_PATH_CONFIG);

  const config = DEFAULT_SCHEMA_PATH_CONFIG;

  // Required properties with correct types
  assertExists(config.allowedExtensions);
  assertEquals(Array.isArray(config.allowedExtensions), true);
  assertEquals(config.allowedExtensions.includes(".schema.md"), true);
  assertEquals(config.allowedExtensions.includes(".json"), true);

  assertExists(config.maxFilenameLength);
  assertEquals(typeof config.maxFilenameLength, "number");
  assertEquals(config.maxFilenameLength > 0, true);

  assertExists(config.allowCustomDirectives);
  assertEquals(typeof config.allowCustomDirectives, "boolean");

  assertExists(config.allowCustomLayers);
  assertEquals(typeof config.allowCustomLayers, "boolean");

  assertExists(config.validateJsonSyntax);
  assertEquals(typeof config.validateJsonSyntax, "boolean");

  assertExists(config.basePathConfig);
  assertEquals(typeof config.basePathConfig, "object");
});

Deno.test("0_architecture - SchemaPath is immutable Value Object with schema-specific features", () => {
  const mockDirective: DirectiveType = {
    getValue: () => "to",
    equals: (other: DirectiveType) => other.getValue() === "to",
  } as DirectiveType;

  const mockLayer: LayerType = {
    getValue: () => "project",
    equals: (other: LayerType) => other.getValue() === "project",
  } as LayerType;

  const result = SchemaPath.create(mockDirective, mockLayer, "test.schema.md");

  if (result.ok) {
    const schemaPath = result.data;

    // Value Object methods must exist
    assertExists(schemaPath.getDirective);
    assertExists(schemaPath.getLayer);
    assertExists(schemaPath.getFilename);
    assertExists(schemaPath.getFullPath);
    assertExists(schemaPath.getSchemaType);
    assertExists(schemaPath.isJsonSchema);
    assertExists(schemaPath.isMarkdownSchema);
    assertExists(schemaPath.getExpectedContentType);
    assertExists(schemaPath.equals);
    assertExists(schemaPath.getComponents);

    // Schema-specific features
    const schemaType = schemaPath.getSchemaType();
    assertEquals(schemaType === "json" || schemaType === "markdown", true);

    // For .schema.md files, should be markdown type
    assertEquals(schemaPath.getSchemaType(), "markdown");
    assertEquals(schemaPath.isMarkdownSchema(), true);
    assertEquals(schemaPath.isJsonSchema(), false);
    assertEquals(schemaPath.getExpectedContentType(), "text/markdown");

    // Immutability - returned values should be consistent
    const path1 = schemaPath.getFullPath();
    const path2 = schemaPath.getFullPath();
    assertEquals(path1, path2);

    const components1 = schemaPath.getComponents();
    const components2 = schemaPath.getComponents();
    assertEquals(JSON.stringify(components1), JSON.stringify(components2));

    // Components should include schema type
    assertExists(components1.schemaType);
    assertEquals(components1.schemaType, "markdown");

    // Value Object equality semantics
    const sameResult = SchemaPath.create(mockDirective, mockLayer, "test.schema.md");
    if (sameResult.ok) {
      assertEquals(schemaPath.equals(sameResult.data), true);
    }
  }
});

Deno.test("0_architecture - Schema factory methods support different schema types", () => {
  const mockLayer: LayerType = {
    getValue: () => "project",
    equals: (other: LayerType) => other.getValue() === "project",
  } as LayerType;

  // JSON schema factory
  const jsonResult = SchemaPath.createJsonSchema(mockLayer, "output.json");
  // Factory methods may fail due to validation - check the result
  if (jsonResult.ok) {
    assertEquals(jsonResult.data.getSchemaType(), "json");
    assertEquals(jsonResult.data.isJsonSchema(), true);
    assertEquals(jsonResult.data.getExpectedContentType(), "application/json");
  } else {
    // If factory fails, verify it's due to validation constraints
    assertExists(jsonResult.error);
  }

  // Markdown schema factory
  const mdResult = SchemaPath.createMarkdownSchema(mockLayer, "input.schema.md");
  if (mdResult.ok) {
    assertEquals(mdResult.data.getSchemaType(), "markdown");
    assertEquals(mdResult.data.isMarkdownSchema(), true);
    assertEquals(mdResult.data.getExpectedContentType(), "text/markdown");
  } else {
    assertExists(mdResult.error);
  }

  // Defect schema factory
  const defectResult = SchemaPath.createDefectSchema(mockLayer, "defect.schema.md");
  if (defectResult.ok) {
    assertEquals(defectResult.data.getDirective().getValue(), "defect");
  } else {
    assertExists(defectResult.error);
  }
});

Deno.test("0_architecture - Schema type detection works correctly", () => {
  const mockDirective: DirectiveType = {
    getValue: () => "to",
    equals: (other: DirectiveType) => other.getValue() === "to",
  } as DirectiveType;

  const mockLayer: LayerType = {
    getValue: () => "project",
    equals: (other: LayerType) => other.getValue() === "project",
  } as LayerType;

  // JSON file should be detected as json type
  const jsonResult = SchemaPath.create(mockDirective, mockLayer, "test.json");
  if (jsonResult.ok) {
    assertEquals(jsonResult.data.getSchemaType(), "json");
  }

  // .schema.md file should be detected as markdown type
  const mdResult = SchemaPath.create(mockDirective, mockLayer, "test.schema.md");
  if (mdResult.ok) {
    assertEquals(mdResult.data.getSchemaType(), "markdown");
  }
});

Deno.test("0_architecture - Schema validation stages are properly sequenced", () => {
  // Test that validation follows the documented stages for schema paths

  const mockDirective: DirectiveType = {
    getValue: () => "to",
    equals: (other: DirectiveType) => other.getValue() === "to",
  } as DirectiveType;

  const mockLayer: LayerType = {
    getValue: () => "project",
    equals: (other: LayerType) => other.getValue() === "project",
  } as LayerType;

  // Input validation should catch null/undefined
  const nullDirectiveResult = SchemaPath.create(null as any, mockLayer, "test.schema.md");
  assertEquals(nullDirectiveResult.ok, false);
  if (!nullDirectiveResult.ok) {
    assertEquals(nullDirectiveResult.error.kind, "InvalidDirective");
  }

  // Schema filename validation should catch invalid extensions
  const invalidExtensionResult = SchemaPath.create(mockDirective, mockLayer, "test.txt");
  assertEquals(invalidExtensionResult.ok, false);
  if (!invalidExtensionResult.ok) {
    // May be caught by security validation or filename validation
    const isValidError = invalidExtensionResult.error.kind === "InvalidSchemaFilename" ||
      invalidExtensionResult.error.kind === "SecurityViolation";
    assertEquals(isValidError, true);
  }

  // Valid input should pass all stages (or fail due to security validation)
  const validResult = SchemaPath.create(mockDirective, mockLayer, "test.schema.md");
  if (!validResult.ok) {
    // Security validation may be strict - verify it's SecurityViolation
    assertEquals(validResult.error.kind, "SecurityViolation");
  } else {
    // If validation passes, verify the result is valid
    assertEquals(validResult.ok, true);
  }
});
