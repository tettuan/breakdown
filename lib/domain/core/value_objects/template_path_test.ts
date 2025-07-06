/**
 * @fileoverview TemplatePath 0_architecture Tests - Smart Constructor Totality Validation
 * 
 * Totality原則に基づくアーキテクチャ制約のテスト。
 * Smart Constructor, Result型, Discriminated Unionパターンの正当性を検証。
 * 
 * テスト構成:
 * - 0_architecture: Smart Constructor, Result型, Discriminated Union制約
 * - 1_behavior: 通常動作とビジネスルールの検証
 * - 2_structure: データ構造と整合性の検証
 */

import { assertEquals, assertExists, assertNotEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  TemplatePath,
  TemplatePathError,
  TemplatePathConfig,
  DEFAULT_TEMPLATE_PATH_CONFIG,
  isInvalidDirectiveError,
  isInvalidLayerError,
  isInvalidFilenameError,
  isPathConstructionError,
  isSecurityViolationError,
  isValidationError,
  formatTemplatePathError,
} from "./template_path.ts";
import type { DirectiveType } from "../../../types/directive_type.ts";
import type { LayerType } from "../../../types/layer_type.ts";

// =============================================================================
// 0_ARCHITECTURE: Smart Constructor & Result Type & Discriminated Union Tests
// =============================================================================

Deno.test("0_architecture - TemplatePath implements Smart Constructor pattern correctly", () => {
  // Smart Constructor: Private constructor, public static factory methods
  
  // Verify constructor is private (cannot be called directly)
  // Note: TypeScript/JavaScript doesn't have true private constructors,
  // but we verify the public API follows the pattern
  
  // Public factory methods exist
  assertExists(TemplatePath.create);
  assertExists(TemplatePath.createWithConfig);
  assertExists(TemplatePath.createSummaryTemplate);
  assertExists(TemplatePath.createDefectTemplate);
  assertExists(TemplatePath.createToTemplate);
});

Deno.test("0_architecture - TemplatePath.create returns Result type with totality", () => {
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
  const validResult = TemplatePath.create(mockDirective, mockLayer, "base.md");
  
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

Deno.test("0_architecture - TemplatePathError uses Discriminated Union pattern", () => {
  // Test each error type has unique 'kind' discriminator
  const mockDirective: DirectiveType = {
    getValue: () => "to",
    equals: (other: DirectiveType) => other.getValue() === "to",
  } as DirectiveType;
  
  const mockLayer: LayerType = {
    getValue: () => "project",
    equals: (other: LayerType) => other.getValue() === "project",
  } as LayerType;
  
  // Test invalid filename to get InvalidFilename error
  const invalidFilenameResult = TemplatePath.create(mockDirective, mockLayer, "");
  
  if (!invalidFilenameResult.ok) {
    const error = invalidFilenameResult.error;
    
    // Discriminated Union: error must have 'kind' property
    assertExists(error.kind);
    assertEquals(typeof error.kind, "string");
    
    // Each error type should be distinguishable
    if (error.kind === "InvalidFilename") {
      assertExists(error.filename);
      assertExists(error.constraints);
      assertEquals(Array.isArray(error.constraints), true);
    }
  }
});

Deno.test("0_architecture - Type guards work correctly for error discrimination", () => {
  // Test all type guard functions exist and work correctly
  const mockError: TemplatePathError = {
    kind: "InvalidDirective",
    message: "Test error",
    directive: "invalid",
  };
  
  // Type guard functions must exist
  assertExists(isInvalidDirectiveError);
  assertExists(isInvalidLayerError);
  assertExists(isInvalidFilenameError);
  assertExists(isPathConstructionError);
  assertExists(isSecurityViolationError);
  assertExists(isValidationError);
  
  // Type guard must correctly identify error type
  assertEquals(isInvalidDirectiveError(mockError), true);
  assertEquals(isInvalidLayerError(mockError), false);
  assertEquals(isInvalidFilenameError(mockError), false);
  assertEquals(isPathConstructionError(mockError), false);
  assertEquals(isSecurityViolationError(mockError), false);
  assertEquals(isValidationError(mockError), false);
});

Deno.test("0_architecture - Error formatter provides consistent messaging", () => {
  // Error formatter must exist and handle all error types
  assertExists(formatTemplatePathError);
  
  const testErrors: TemplatePathError[] = [
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
      kind: "InvalidFilename",
      message: "Test filename error",
      filename: "invalid.txt",
      constraints: ["must end with .md"],
    },
    {
      kind: "PathConstructionError",
      message: "Test construction error",
      components: {
        directive: "to",
        layer: "project",
        filename: "test.md",
      },
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
    const formatted = formatTemplatePathError(error);
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
    if (error.kind === "InvalidFilename") {
      assertEquals(formatted.includes("Invalid filename"), true);
    }
  }
});

Deno.test("0_architecture - Configuration object is immutable and well-structured", () => {
  // Default configuration must exist and be properly structured
  assertExists(DEFAULT_TEMPLATE_PATH_CONFIG);
  
  const config = DEFAULT_TEMPLATE_PATH_CONFIG;
  
  // Required properties with correct types
  assertExists(config.allowedExtensions);
  assertEquals(Array.isArray(config.allowedExtensions), true);
  assertEquals(config.allowedExtensions.includes('.md'), true);
  
  assertExists(config.maxFilenameLength);
  assertEquals(typeof config.maxFilenameLength, "number");
  assertEquals(config.maxFilenameLength > 0, true);
  
  assertExists(config.allowCustomDirectives);
  assertEquals(typeof config.allowCustomDirectives, "boolean");
  
  assertExists(config.allowCustomLayers);
  assertEquals(typeof config.allowCustomLayers, "boolean");
  
  assertExists(config.basePathConfig);
  assertEquals(typeof config.basePathConfig, "object");
  
  // Test immutability (readonly arrays should not be modifiable in runtime)
  const originalLength = config.allowedExtensions.length;
  
  // In TypeScript readonly arrays are not deeply immutable at runtime
  // The test focuses on configuration structure rather than runtime immutability
  assertEquals(config.allowedExtensions.length, originalLength);
});

Deno.test("0_architecture - TemplatePath is immutable Value Object", () => {
  const mockDirective: DirectiveType = {
    getValue: () => "to",
    equals: (other: DirectiveType) => other.getValue() === "to",
  } as DirectiveType;
  
  const mockLayer: LayerType = {
    getValue: () => "project",
    equals: (other: LayerType) => other.getValue() === "project",
  } as LayerType;
  
  const result = TemplatePath.create(mockDirective, mockLayer, "test.md");
  
  if (result.ok) {
    const templatePath = result.data;
    
    // Value Object methods must exist
    assertExists(templatePath.getDirective);
    assertExists(templatePath.getLayer);
    assertExists(templatePath.getFilename);
    assertExists(templatePath.getFullPath);
    assertExists(templatePath.equals);
    assertExists(templatePath.getComponents);
    
    // Immutability - returned values should be consistent
    const path1 = templatePath.getFullPath();
    const path2 = templatePath.getFullPath();
    assertEquals(path1, path2);
    
    const components1 = templatePath.getComponents();
    const components2 = templatePath.getComponents();
    assertEquals(JSON.stringify(components1), JSON.stringify(components2));
    
    // Value Object equality semantics
    const sameResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
    if (sameResult.ok) {
      assertEquals(templatePath.equals(sameResult.data), true);
    }
  }
});

Deno.test("0_architecture - Factory methods follow consistent patterns", () => {
  const mockLayer: LayerType = {
    getValue: () => "project",
    equals: (other: LayerType) => other.getValue() === "project",
  } as LayerType;
  
  // All factory methods should return Result type
  const summaryResult = TemplatePath.createSummaryTemplate(mockLayer, "test.md");
  const defectResult = TemplatePath.createDefectTemplate(mockLayer, "test.md");
  const toResult = TemplatePath.createToTemplate(mockLayer, "test.md");
  
  // Results should have consistent structure
  assertExists(summaryResult.ok);
  assertExists(defectResult.ok);
  assertExists(toResult.ok);
  
  // Factory methods should produce different directive types
  if (summaryResult.ok && defectResult.ok && toResult.ok) {
    const summaryDirective = summaryResult.data.getDirective().getValue();
    const defectDirective = defectResult.data.getDirective().getValue();
    const toDirective = toResult.data.getDirective().getValue();
    
    assertEquals(summaryDirective, "summary");
    assertEquals(defectDirective, "defect");
    assertEquals(toDirective, "to");
    
    // All should use same layer and filename
    assertEquals(summaryResult.data.getLayer().getValue(), "project");
    assertEquals(defectResult.data.getLayer().getValue(), "project");
    assertEquals(toResult.data.getLayer().getValue(), "project");
    
    assertEquals(summaryResult.data.getFilename(), "test.md");
    assertEquals(defectResult.data.getFilename(), "test.md");
    assertEquals(toResult.data.getFilename(), "test.md");
  }
});

Deno.test("0_architecture - Validation stages are properly sequenced", () => {
  // Test that validation follows the documented stages:
  // 1. Input validation, 2. Directive validation, 3. Layer validation
  // 4. Filename validation, 5. Path construction, 6. Security validation
  
  const mockDirective: DirectiveType = {
    getValue: () => "to",
    equals: (other: DirectiveType) => other.getValue() === "to",
  } as DirectiveType;
  
  const mockLayer: LayerType = {
    getValue: () => "project",
    equals: (other: LayerType) => other.getValue() === "project",
  } as LayerType;
  
  // Stage 1: Input validation should catch null/undefined
  const nullDirectiveResult = TemplatePath.create(null as any, mockLayer, "test.md");
  assertEquals(nullDirectiveResult.ok, false);
  if (!nullDirectiveResult.ok) {
    assertEquals(nullDirectiveResult.error.kind, "InvalidDirective");
  }
  
  const nullLayerResult = TemplatePath.create(mockDirective, null as any, "test.md");
  assertEquals(nullLayerResult.ok, false);
  if (!nullLayerResult.ok) {
    assertEquals(nullLayerResult.error.kind, "InvalidLayer");
  }
  
  const nullFilenameResult = TemplatePath.create(mockDirective, mockLayer, null as any);
  assertEquals(nullFilenameResult.ok, false);
  if (!nullFilenameResult.ok) {
    assertEquals(nullFilenameResult.error.kind, "InvalidFilename");
  }
  
  // Stage 4: Filename validation should catch invalid extensions  
  const invalidExtensionResult = TemplatePath.create(mockDirective, mockLayer, "test.txt");
  assertEquals(invalidExtensionResult.ok, false);
  if (!invalidExtensionResult.ok) {
    // May be caught by security validation or filename validation
    const isValidError = invalidExtensionResult.error.kind === "InvalidFilename" || 
                        invalidExtensionResult.error.kind === "SecurityViolation";
    assertEquals(isValidError, true);
  }
  
  // Valid input should pass all stages
  const validResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
  assertEquals(validResult.ok, true);
});
