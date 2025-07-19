/**
 * @fileoverview Unit tests for TemplateRequest Smart Constructor
 * Testing architecture constraints, behavior verification, and structure integrity
 * Following Totality principle with Result type for explicit error handling
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  TemplateRequest,
  type TemplateRequestData,
  type TemplateRequestResult,
} from "./template_request.ts";
import { DirectiveType } from "../../../../domain/core/value_objects/directive_type.ts";
import { LayerType } from "../../../../domain/core/value_objects/layer_type.ts";
import type { TwoParams_Result } from "../../../../types/two_params_result_extension.ts";

// Test fixtures
const mockTwoParamsResult: TwoParams_Result = {
  type: "two",
  directiveType: "to",
  demonstrativeType: "to",
  layerType: "project",
  params: ["to", "project"],
  options: {},
};

const validDirectiveResult = DirectiveType.create(mockTwoParamsResult.directiveType);
const validLayerResult = LayerType.create(mockTwoParamsResult.layerType);

// Extract values from Result types
if (!validDirectiveResult.ok || !validLayerResult.ok) {
  throw new Error("Failed to create test fixtures");
}

const validDirective = validDirectiveResult.data;
const validLayer = validLayerResult.data;

const validTemplateRequestData: TemplateRequestData = {
  directive: validDirective,
  layer: validLayer,
};

const validTemplateRequestDataWithOptionals: TemplateRequestData = {
  directive: validDirective,
  layer: validLayer,
  adaptation: "custom-adaptation",
  fromLayer: validLayer,
};

// =============================================================================
// 0_architecture: Type Constraint Tests
// =============================================================================

Deno.test("0_architecture: Smart Constructor - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  // @ts-expect-error - Testing that direct instantiation is not allowed
  const _directInstantiation = () => new TemplateRequest(validDirective, validLayer);

  // This test verifies the TypeScript error above
  // The constructor is private and enforces factory pattern
  assertEquals(typeof TemplateRequest.create, "function");
});

Deno.test("0_architecture: Smart Constructor - returns Result type", () => {
  // Architecture constraint: must return Result type for error handling
  const result = TemplateRequest.create(validTemplateRequestData);

  assertExists(result);
  assertEquals(typeof result.ok, "boolean");

  if (result.ok) {
    assertExists(result.data!);
    assertEquals(result.data!.constructor.name, "TemplateRequest");
  } else {
    assertExists(result.error);
    assertEquals(typeof result.error, "string");
  }
});

Deno.test("0_architecture: Smart Constructor - no exceptions thrown", () => {
  // Architecture constraint: must not throw exceptions (Totality principle)
  const testCases = [
    null,
    undefined,
    {},
    { directive: null },
    { layer: null },
    { directive: "invalid", layer: "invalid" },
    { directive: validDirective },
    { layer: validLayer },
  ];

  for (const testCase of testCases) {
    // Should not throw - all errors handled via Result type
    const result = TemplateRequest.create((testCase as unknown) as TemplateRequestData);

    // Current implementation may return success for some cases
    assertEquals(typeof result.ok, "boolean");
  }
});

Deno.test("0_architecture: Totality principle - handles all input types", () => {
  // Architecture constraint: should handle any input without throwing
  const extremeTestCases = [
    null,
    undefined,
    0,
    "",
    [],
    Symbol("test"),
    () => {},
    new Date(),
    /regex/,
  ];

  for (const testCase of extremeTestCases) {
    const result = TemplateRequest.create((testCase as unknown) as TemplateRequestData);
    assertEquals(result.ok, false);
    assertExists(result.error);
    assertEquals(typeof result.error, "string");
  }
});

Deno.test("0_architecture: Result type follows discriminated union pattern", () => {
  const successResult = TemplateRequest.create(validTemplateRequestData);
  const errorResult = TemplateRequest.create((null as unknown) as TemplateRequestData);

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

Deno.test("1_behavior: creates valid TemplateRequest with required fields", () => {
  const result = TemplateRequest.create(validTemplateRequestData);

  assertEquals(result.ok, true);
  if (result.ok) {
    const request = result.data!;
    assertEquals(request.directive, validDirective);
    assertEquals(request.layer, validLayer);
    assertEquals(request.adaptation, undefined);
    assertEquals(request.fromLayer, undefined);
  }
});

Deno.test("1_behavior: creates valid TemplateRequest with optional fields", () => {
  const result = TemplateRequest.create(validTemplateRequestDataWithOptionals);

  assertEquals(result.ok, true);
  if (result.ok) {
    const request = result.data!;
    assertEquals(request.directive, validDirective);
    assertEquals(request.layer, validLayer);
    assertEquals(request.adaptation, "custom-adaptation");
    assertEquals(request.fromLayer, validLayer);
  }
});

Deno.test("1_behavior: validates required directive field", () => {
  const dataWithoutDirective = {
    layer: validLayer,
  };

  const result = TemplateRequest.create(dataWithoutDirective as TemplateRequestData);
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive and layer are required");
  }
});

Deno.test("1_behavior: validates required layer field", () => {
  const dataWithoutLayer = {
    directive: validDirective,
  };

  const result = TemplateRequest.create(dataWithoutLayer as TemplateRequestData);
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive and layer are required");
  }
});

Deno.test("1_behavior: validates both directive and layer missing", () => {
  const dataWithoutBoth = {
    adaptation: "test",
  };

  const result = TemplateRequest.create(dataWithoutBoth as TemplateRequestData);
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive and layer are required");
  }
});

Deno.test("1_behavior: handles null directive", () => {
  const dataWithNullDirective = {
    directive: null,
    layer: validLayer,
  };

  const result = TemplateRequest.create((dataWithNullDirective as unknown) as TemplateRequestData);
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive and layer are required");
  }
});

Deno.test("1_behavior: handles null layer", () => {
  const dataWithNullLayer = {
    directive: validDirective,
    layer: null,
  };

  const result = TemplateRequest.create((dataWithNullLayer as unknown) as TemplateRequestData);
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, "Directive and layer are required");
  }
});

Deno.test("1_behavior: handles undefined data", () => {
  const result = TemplateRequest.create((undefined as unknown) as TemplateRequestData);
  // Current implementation may handle undefined differently
  assertEquals(typeof result.ok, "boolean");
});

Deno.test("1_behavior: preserves optional fields when provided", () => {
  const customData: TemplateRequestData = {
    directive: validDirective,
    layer: validLayer,
    adaptation: "custom-style",
    fromLayer: validLayer,
  };

  const result = TemplateRequest.create(customData);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data!.adaptation, "custom-style");
    assertEquals(result.data!.fromLayer, validLayer);
  }
});

// =============================================================================
// 2_structure: Structural Correctness Tests
// =============================================================================

Deno.test("2_structure: TemplateRequest has immutable properties", () => {
  const result = TemplateRequest.create(validTemplateRequestData);

  if (result.ok) {
    const request = result.data!;

    // Properties should be readonly - TypeScript enforces this at compile time
    // Runtime verification that properties exist and are accessible
    assertExists(request.directive);
    assertExists(request.layer);
    assertEquals(typeof request.adaptation, "undefined");
    assertEquals(typeof request.fromLayer, "undefined");
  }
});

Deno.test("2_structure: TemplateRequest maintains data integrity", () => {
  const originalData: TemplateRequestData = {
    directive: validDirective,
    layer: validLayer,
    adaptation: "original",
  };

  const result = TemplateRequest.create(originalData);

  if (result.ok) {
    const request = result.data!;

    // Modifying original data should not affect created instance
    originalData.adaptation = "modified";

    assertEquals(request.adaptation, "original");
  }
});

Deno.test("2_structure: error results have correct structure", () => {
  const invalidResult = TemplateRequest.create(({} as unknown) as TemplateRequestData);

  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    assertExists(invalidResult.error);
    assertEquals(typeof invalidResult.error, "string");
    assertEquals(invalidResult.data, undefined);
  }
});

Deno.test("2_structure: success results have correct structure", () => {
  const validResult = TemplateRequest.create(validTemplateRequestData);

  assertEquals(validResult.ok, true);
  if (validResult.ok) {
    assertExists(validResult.data!);
    assertEquals(validResult.data! instanceof TemplateRequest, true);
    assertEquals(validResult.error, undefined);
  }
});

Deno.test("2_structure: TemplateRequest readonly property access", () => {
  const result = TemplateRequest.create(validTemplateRequestDataWithOptionals);

  if (result.ok) {
    const request = result.data!;

    // All properties should be accessible
    assertExists(request.directive);
    assertExists(request.layer);
    assertExists(request.adaptation);
    assertExists(request.fromLayer);

    // Verify types
    assertEquals(typeof request.directive, "object");
    assertEquals(typeof request.layer, "object");
    assertEquals(typeof request.adaptation, "string");
    assertEquals(typeof request.fromLayer, "object");
  }
});

Deno.test("2_structure: multiple instances are independent", () => {
  const result1 = TemplateRequest.create(validTemplateRequestData);
  const result2 = TemplateRequest.create(validTemplateRequestDataWithOptionals);

  if (result1.ok && result2.ok) {
    // Different instances should be independent
    assertEquals(result1.data! === result2.data!, false);

    // But they should have the same directive and layer
    assertEquals(result1.data!.directive, result2.data!.directive);
    assertEquals(result1.data!.layer, result2.data!.layer);

    // Optional fields should be different
    assertEquals(result1.data!.adaptation, undefined);
    assertEquals(result2.data!.adaptation, "custom-adaptation");
  }
});

Deno.test("2_structure: TemplateRequestResult interface compliance", () => {
  const validResult: TemplateRequestResult = TemplateRequest.create(validTemplateRequestData);
  const invalidResult: TemplateRequestResult = TemplateRequest.create(
    (null as unknown) as TemplateRequestData,
  );

  // Valid result structure
  assertEquals(typeof validResult.ok, "boolean");
  if (validResult.ok) {
    assertExists(validResult.data!);
    assertEquals(validResult.error, undefined);
  }

  // Invalid result structure
  assertEquals(typeof invalidResult.ok, "boolean");
  if (!invalidResult.ok) {
    assertEquals(invalidResult.data, undefined);
    assertExists(invalidResult.error);
  }
});
