/**
 * @fileoverview Unit tests for PromptPath Smart Constructor
 * Testing architecture constraints, behavior verification, and structure integrity
 * Following Totality principle with Result type for explicit error handling
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { PromptPath, type PromptPathResult } from "./prompt_path.ts";
import { DirectiveType } from "../../../../domain/core/value_objects/directive_type.ts";
import { LayerType } from "../../../../domain/core/value_objects/layer_type.ts";
import { ConfigProfile } from "../../../../config/config_profile_name.ts";

// Test fixtures
import type { TwoParams_Result } from "../../../../deps.ts";

const mockTwoParamsResult: TwoParams_Result = {
  type: "two",
  directiveType: "to",
  layerType: "project",
  params: ["to", "project"],
  options: {},
};

const validDirectiveResult = DirectiveType.create(mockTwoParamsResult.directiveType);
const validLayerResult = LayerType.create(mockTwoParamsResult.layerType);

// Extract actual values from Result types
if (!validDirectiveResult.ok || !validLayerResult.ok) {
  throw new Error("Test setup failed: invalid directive or layer");
}
const validDirective = validDirectiveResult.data!;
const validLayer = validLayerResult.data!;

const validFilename = "template.md";
const invalidFilename = "template.txt";
const emptyFilename = "";

// =============================================================================
// 0_architecture: Type Constraint Tests
// =============================================================================

Deno.test("0_architecture: Smart Constructor - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  // @ts-expect-error - Testing that direct instantiation is not allowed
  const _directInstantiation = () => new PromptPath(validDirective, validLayer, validFilename);

  // This test verifies the TypeScript error above
  // The constructor is private and enforces factory pattern
  assertEquals(typeof PromptPath.create, "function");
});

Deno.test("0_architecture: Smart Constructor - returns Result type", () => {
  // Architecture constraint: must return Result type for error handling
  const result = PromptPath.create(validDirective, validLayer, validFilename);

  assertExists(result);
  assertEquals(typeof result.ok, "boolean");

  if (result.ok) {
    assertExists(result.data);
    assertEquals(result.data!.constructor.name, "PromptPath");
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
    const result = PromptPath.create(
      (directive as unknown) as DirectiveType,
      (layer as unknown) as LayerType,
      (filename as unknown) as string,
    );
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
    const result = PromptPath.create(
      (directive as unknown) as DirectiveType,
      (layer as unknown) as LayerType,
      (filename as unknown) as string,
    );
    assertEquals(typeof result.ok, "boolean");
    assertEquals(result.ok, false);
    assertExists(result.error);
  }
});

Deno.test("0_architecture: Result type follows discriminated union pattern", () => {
  const successResult = PromptPath.create(validDirective, validLayer, validFilename);
  const errorResult = PromptPath.create(
    (null as unknown) as DirectiveType,
    (null as unknown) as LayerType,
    (null as unknown) as string,
  );

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

Deno.test("1_behavior: creates PromptPath with valid parameters", () => {
  const result = PromptPath.create(validDirective, validLayer, validFilename);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data!.getDirective(), validDirective);
    assertEquals(result.data!.getLayer(), validLayer);
    assertEquals(result.data!.getFilename(), validFilename);
  }
});

Deno.test("1_behavior: validates required directive parameter", () => {
  const result = PromptPath.create((null as unknown) as DirectiveType, validLayer, validFilename);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive, layer, and filename are required");
  }
});

Deno.test("1_behavior: validates required layer parameter", () => {
  const result = PromptPath.create(
    validDirective,
    (null as unknown) as LayerType,
    validFilename,
  );

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive, layer, and filename are required");
  }
});

Deno.test("1_behavior: validates required filename parameter", () => {
  const result = PromptPath.create(validDirective, validLayer, (null as unknown) as string);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive, layer, and filename are required");
  }
});

Deno.test("1_behavior: validates filename extension", () => {
  const result = PromptPath.create(validDirective, validLayer, invalidFilename);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Prompt filename must end with .md");
  }
});

Deno.test("1_behavior: rejects empty filename", () => {
  const result = PromptPath.create(validDirective, validLayer, emptyFilename);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive, layer, and filename are required");
  }
});

Deno.test("1_behavior: accepts valid .md filename", () => {
  const validMdFilenames = [
    "template.md",
    "prompt.md",
    "test-file.md",
    "file_with_underscores.md",
    "123.md",
  ];

  for (const filename of validMdFilenames) {
    const result = PromptPath.create(validDirective, validLayer, filename);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data!.getFilename(), filename);
    }
  }
});

Deno.test("1_behavior: rejects non-.md extensions", () => {
  const invalidExtensions = [
    "template.txt",
    "prompt.json",
    "file.html",
    "document.pdf",
    "script.js",
  ];

  for (const filename of invalidExtensions) {
    const result = PromptPath.create(validDirective, validLayer, filename);
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error, "Prompt filename must end with .md");
    }
  }
});

Deno.test("1_behavior: generates correct path", () => {
  const result = PromptPath.create(validDirective, validLayer, validFilename);

  if (result.ok) {
    const expectedPath = `${validDirective.value}/${validLayer.value}/${validFilename}`;
    assertEquals(result.data!.getPath(), expectedPath);
  }
});

Deno.test("1_behavior: toString returns path", () => {
  const result = PromptPath.create(validDirective, validLayer, validFilename);

  if (result.ok) {
    assertEquals(result.data!.toString(), result.data!.getPath());
  }
});

// =============================================================================
// 2_structure: Structural Correctness Tests
// =============================================================================

Deno.test("2_structure: PromptPath immutability", () => {
  const result = PromptPath.create(validDirective, validLayer, validFilename);

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
  const result1 = PromptPath.create(validDirective, validLayer, validFilename);
  const result2 = PromptPath.create(validDirective, validLayer, validFilename);
  const result3 = PromptPath.create(validDirective, validLayer, "different.md");

  if (result1.ok && result2.ok && result3.ok) {
    // Type assertion to help TypeScript understand the types are safe
    const data1 = result1.data!;
    const data2 = result2.data!;
    const data3 = result3.data!;

    // Same parameters should be equal
    assertEquals(data1.equals(data2), true);
    assertEquals(data2.equals(data1), true);

    // Different filenames should not be equal
    assertEquals(data1.equals(data3), false);
    assertEquals(data3.equals(data1), false);
  }
});

Deno.test("2_structure: error results have correct structure", () => {
  const invalidResult = PromptPath.create(
    (null as unknown) as DirectiveType,
    (null as unknown) as LayerType,
    (null as unknown) as string,
  );

  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    assertExists(invalidResult.error);
    assertEquals(typeof invalidResult.error, "string");
    assertEquals(invalidResult.data, undefined);
  }
});

Deno.test("2_structure: success results have correct structure", () => {
  const validResult = PromptPath.create(validDirective, validLayer, validFilename);

  assertEquals(validResult.ok, true);
  if (validResult.ok) {
    assertExists(validResult.data);
    assertEquals(validResult.data! instanceof PromptPath, true);
    assertEquals(validResult.error, undefined);
  }
});

Deno.test("2_structure: method return type consistency", () => {
  const result = PromptPath.create(validDirective, validLayer, validFilename);

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
  const result = PromptPath.create(validDirective, validLayer, validFilename);

  if (result.ok) {
    const path = result.data!;
    const fullPath = path.getPath();

    // Path should contain all components
    assertEquals(fullPath.includes(validDirective.value), true);
    assertEquals(fullPath.includes(validLayer.value), true);
    assertEquals(fullPath.includes(validFilename), true);

    // Path should have correct separators
    assertEquals(fullPath.split("/").length, 3);
  }
});

Deno.test("2_structure: multiple instance independence", () => {
  const result1 = PromptPath.create(validDirective, validLayer, "file1.md");
  const result2 = PromptPath.create(validDirective, validLayer, "file2.md");

  if (result1.ok && result2.ok) {
    // Type assertion to help TypeScript understand the types are safe
    const data1 = result1.data!;
    const data2 = result2.data!;

    // Different instances should be independent
    assertEquals(data1 === data2, false);
    assertEquals(data1.equals(data2), false);

    // But they should share same directive and layer
    assertEquals(data1.getDirective(), data2.getDirective());
    assertEquals(data1.getLayer(), data2.getLayer());

    // Filenames should be different
    assertEquals(data1.getFilename() !== data2.getFilename(), true);
  }
});

Deno.test("2_structure: PromptPathResult interface compliance", () => {
  const validResult: PromptPathResult = PromptPath.create(
    validDirective,
    validLayer,
    validFilename,
  );
  const invalidResult: PromptPathResult = PromptPath.create(
    (null as unknown) as DirectiveType,
    (null as unknown) as LayerType,
    (null as unknown) as string,
  );

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
  const result = PromptPath.create(validDirective, validLayer, validFilename);

  if (result.ok) {
    assertEquals(result.data!.toString(), result.data!.getPath());
  }
});

Deno.test("2_structure: path format consistency", () => {
  const testFilenames = ["test.md", "another-file.md", "special_file.md"];

  for (const filename of testFilenames) {
    const result = PromptPath.create(validDirective, validLayer, filename);

    if (result.ok) {
      const path = result.data!.getPath();
      const parts = path.split("/");

      assertEquals(parts.length, 3);
      assertEquals(parts[0], validDirective.value);
      assertEquals(parts[1], validLayer.value);
      assertEquals(parts[2], filename);
    }
  }
});
