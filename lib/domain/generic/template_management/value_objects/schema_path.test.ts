/**
 * @fileoverview Unit tests for SchemaPath Smart Constructor
 * Testing architecture constraints, behavior verification, and structure integrity
 * Following Totality principle with Result type for explicit error handling
 */

import { assertEquals, assertExists } from "@std/assert";
import { SchemaPath, type SchemaPathResult } from "./schema_path.ts";
import { DirectiveType } from "../../../../types/directive_type.ts";
import { LayerType } from "../../../../types/layer_type.ts";

// Test fixtures
const mockTwoParamsResult = {
  type: "two",
  params: ["to", "project"],
  demonstrativeType: "to",
  layerType: "project",
  options: {},
} as any;

const validDirective = DirectiveType.create(mockTwoParamsResult);
const validLayer = LayerType.create(mockTwoParamsResult);

const validFilename = "schema.json";
const invalidFilename = "schema.md";
const emptyFilename = "";

// =============================================================================
// 0_architecture: Type Constraint Tests
// =============================================================================

Deno.test("0_architecture: Smart Constructor - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  // @ts-expect-error - Testing that direct instantiation is not allowed
  const directInstantiation = () => new SchemaPath(validDirective, validLayer, validFilename);
  
  // This test verifies the TypeScript error above
  // The constructor is private and enforces factory pattern
  assertEquals(typeof SchemaPath.create, "function");
});

Deno.test("0_architecture: Smart Constructor - returns Result type", () => {
  // Architecture constraint: must return Result type for error handling
  const result = SchemaPath.create(validDirective, validLayer, validFilename);
  
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");
  
  if (result.ok) {
    assertExists(result.data);
    assertEquals(result.data!.constructor.name, "SchemaPath");
  } else {
    assertExists(result.error);
    assertEquals(typeof result.error, "string");
  }
});

Deno.test("0_architecture: Smart Constructor - no exceptions thrown", () => {
  // Architecture constraint: must not throw exceptions (Totality principle)
  const testCases = [
    { directive: null, layer: null, filename: null },
    { directive: undefined, layer: undefined, filename: undefined },
    { directive: validDirective, layer: null, filename: validFilename },
    { directive: null, layer: validLayer, filename: validFilename },
    { directive: validDirective, layer: validLayer, filename: null },
    { directive: "invalid", layer: "invalid", filename: "invalid" },
  ];

  for (const { directive, layer, filename } of testCases) {
    // Should not throw - all errors handled via Result type
    const result = SchemaPath.create(directive as any, layer as any, filename as any);
    assertExists(result);
    assertEquals(typeof result.ok, "boolean");
  }
});

Deno.test("0_architecture: Totality principle - handles all input types", () => {
  // Architecture constraint: should handle any input without throwing
  const extremeTestCases = [
    [null, null, null],
    [undefined, undefined, undefined],
    [0, 0, 0],
    ["", "", ""],
    [[], [], []],
    [{}, {}, {}],
    [Symbol("test"), Symbol("test"), Symbol("test")],
  ];

  for (const [directive, layer, filename] of extremeTestCases) {
    const result = SchemaPath.create(directive as any, layer as any, filename as any);
    assertEquals(typeof result.ok, "boolean");
    assertEquals(result.ok, false);
    assertExists(result.error);
  }
});

Deno.test("0_architecture: Result type follows discriminated union pattern", () => {
  const successResult = SchemaPath.create(validDirective, validLayer, validFilename);
  const errorResult = SchemaPath.create(null as any, null as any, null as any);
  
  // Success case
  if (successResult.ok) {
    assertExists(successResult.data);
    assertEquals("error" in successResult, false);
  }
  
  // Error case
  if (!errorResult.ok) {
    assertExists(errorResult.error);
    assertEquals("data" in errorResult, false);
  }
});

// =============================================================================
// 1_behavior: Runtime Behavior Tests
// =============================================================================

Deno.test("1_behavior: creates SchemaPath with valid parameters", () => {
  const result = SchemaPath.create(validDirective, validLayer, validFilename);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data!.getDirective(), validDirective);
    assertEquals(result.data!.getLayer(), validLayer);
    assertEquals(result.data!.getFilename(), validFilename);
  }
});

Deno.test("1_behavior: validates required directive parameter", () => {
  const result = SchemaPath.create(null as any, validLayer, validFilename);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive, layer, and filename are required");
  }
});

Deno.test("1_behavior: validates required layer parameter", () => {
  const result = SchemaPath.create(validDirective, null as any, validFilename);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive, layer, and filename are required");
  }
});

Deno.test("1_behavior: validates required filename parameter", () => {
  const result = SchemaPath.create(validDirective, validLayer, null as any);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive, layer, and filename are required");
  }
});

Deno.test("1_behavior: validates filename extension", () => {
  const result = SchemaPath.create(validDirective, validLayer, invalidFilename);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Schema filename must end with .json");
  }
});

Deno.test("1_behavior: rejects empty filename", () => {
  const result = SchemaPath.create(validDirective, validLayer, emptyFilename);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive, layer, and filename are required");
  }
});

Deno.test("1_behavior: accepts valid .json filename", () => {
  const validJsonFilenames = [
    "schema.json",
    "response.json",
    "test-schema.json",
    "file_with_underscores.json",
    "123.json",
  ];
  
  for (const filename of validJsonFilenames) {
    const result = SchemaPath.create(validDirective, validLayer, filename);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data!.getFilename(), filename);
    }
  }
});

Deno.test("1_behavior: rejects non-.json extensions", () => {
  const invalidExtensions = [
    "schema.md",
    "response.txt",
    "file.html",
    "document.pdf",
    "script.js",
    "data.xml",
  ];
  
  for (const filename of invalidExtensions) {
    const result = SchemaPath.create(validDirective, validLayer, filename);
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error, "Schema filename must end with .json");
    }
  }
});

Deno.test("1_behavior: generates correct path", () => {
  const result = SchemaPath.create(validDirective, validLayer, validFilename);
  
  if (result.ok) {
    const expectedPath = `${validDirective.getValue()}/${validLayer.getValue()}/${validFilename}`;
    assertEquals(result.data!.getPath(), expectedPath);
  }
});

Deno.test("1_behavior: toString returns path", () => {
  const result = SchemaPath.create(validDirective, validLayer, validFilename);
  
  if (result.ok) {
    assertEquals(result.data!.toString(), result.data!.getPath());
  }
});

// =============================================================================
// 2_structure: Structural Correctness Tests
// =============================================================================

Deno.test("2_structure: SchemaPath immutability", () => {
  const result = SchemaPath.create(validDirective, validLayer, validFilename);
  
  if (result.ok) {
    const path = result.data!;
    
    // Properties should remain constant
    const originalDirective = path.getDirective();
    const originalLayer = path.getLayer();
    const originalFilename = path.getFilename();
    const originalPath = path.getPath();
    
    // Multiple calls should return same values
    assertEquals(path.getDirective(), originalDirective);
    assertEquals(path.getLayer(), originalLayer);
    assertEquals(path.getFilename(), originalFilename);
    assertEquals(path.getPath(), originalPath);
  }
});

Deno.test("2_structure: equals method correctness", () => {
  const result1 = SchemaPath.create(validDirective, validLayer, validFilename);
  const result2 = SchemaPath.create(validDirective, validLayer, validFilename);
  const result3 = SchemaPath.create(validDirective, validLayer, "different.json");
  
  if (result1.ok && result2.ok && result3.ok) {
    // Same parameters should be equal
    assertEquals(result1.data!.equals(result2.data!), true);
    assertEquals(result2.data!.equals(result1.data!), true);
    
    // Different filenames should not be equal
    assertEquals(result1.data!.equals(result3.data!), false);
    assertEquals(result3.data!.equals(result1.data!), false);
  }
});

Deno.test("2_structure: error results have correct structure", () => {
  const invalidResult = SchemaPath.create(null as any, null as any, null as any);
  
  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    assertExists(invalidResult.error);
    assertEquals(typeof invalidResult.error, "string");
    assertEquals(invalidResult.data, undefined);
  }
});

Deno.test("2_structure: success results have correct structure", () => {
  const validResult = SchemaPath.create(validDirective, validLayer, validFilename);
  
  assertEquals(validResult.ok, true);
  if (validResult.ok) {
    assertExists(validResult.data);
    assertEquals(validResult.data! instanceof SchemaPath, true);
    assertEquals(validResult.error, undefined);
  }
});

Deno.test("2_structure: method return type consistency", () => {
  const result = SchemaPath.create(validDirective, validLayer, validFilename);
  
  if (result.ok) {
    const path = result.data!;
    
    // Verify return types
    assertEquals(typeof path.getPath(), "string");
    assertEquals(typeof path.getDirective(), "object");
    assertEquals(typeof path.getLayer(), "object");
    assertEquals(typeof path.getFilename(), "string");
    assertEquals(typeof path.toString(), "string");
  }
});

Deno.test("2_structure: path composition correctness", () => {
  const result = SchemaPath.create(validDirective, validLayer, validFilename);
  
  if (result.ok) {
    const path = result.data!;
    const fullPath = path.getPath();
    
    // Path should contain all components
    assertEquals(fullPath.includes(validDirective.getValue()), true);
    assertEquals(fullPath.includes(validLayer.getValue()), true);
    assertEquals(fullPath.includes(validFilename), true);
    
    // Path should have correct separators
    assertEquals(fullPath.split("/").length, 3);
  }
});

Deno.test("2_structure: multiple instance independence", () => {
  const result1 = SchemaPath.create(validDirective, validLayer, "file1.json");
  const result2 = SchemaPath.create(validDirective, validLayer, "file2.json");
  
  if (result1.ok && result2.ok) {
    // Different instances should be independent
    assertEquals(result1.data! === result2.data!, false);
    assertEquals(result1.data!.equals(result2.data!), false);
    
    // But they should share same directive and layer
    assertEquals(result1.data!.getDirective(), result2.data!.getDirective());
    assertEquals(result1.data!.getLayer(), result2.data!.getLayer());
    
    // Filenames should be different
    assertEquals(result1.data!.getFilename() !== result2.data!.getFilename(), true);
  }
});

Deno.test("2_structure: SchemaPathResult interface compliance", () => {
  const validResult: SchemaPathResult = SchemaPath.create(validDirective, validLayer, validFilename);
  const invalidResult: SchemaPathResult = SchemaPath.create(null as any, null as any, null as any);
  
  // Valid result structure
  assertEquals(typeof validResult.ok, "boolean");
  if (validResult.ok) {
    assertExists(validResult.data);
    assertEquals(validResult.error, undefined);
  }
  
  // Invalid result structure
  assertEquals(typeof invalidResult.ok, "boolean");
  if (!invalidResult.ok) {
    assertEquals(invalidResult.data, undefined);
    assertExists(invalidResult.error);
  }
});

Deno.test("2_structure: toString equals getPath", () => {
  const result = SchemaPath.create(validDirective, validLayer, validFilename);
  
  if (result.ok) {
    assertEquals(result.data!.toString(), result.data!.getPath());
  }
});

Deno.test("2_structure: path format consistency", () => {
  const testFilenames = ["test.json", "another-file.json", "special_file.json"];
  
  for (const filename of testFilenames) {
    const result = SchemaPath.create(validDirective, validLayer, filename);
    
    if (result.ok) {
      const path = result.data!.getPath();
      const parts = path.split("/");
      
      assertEquals(parts.length, 3);
      assertEquals(parts[0], validDirective.getValue());
      assertEquals(parts[1], validLayer.getValue());
      assertEquals(parts[2], filename);
    }
  }
});

Deno.test("2_structure: schema vs prompt path distinction", () => {
  // Schema paths should use .json extension
  const schemaResult = SchemaPath.create(validDirective, validLayer, "test.json");
  assertEquals(schemaResult.ok, true);
  
  // Should reject .md extension (that's for prompts)
  const promptLikeResult = SchemaPath.create(validDirective, validLayer, "test.md");
  assertEquals(promptLikeResult.ok, false);
  if (!promptLikeResult.ok) {
    assertEquals(promptLikeResult.error, "Schema filename must end with .json");
  }
});