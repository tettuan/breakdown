/**
 * @fileoverview Totality pattern compliance tests for LayerType
 *
 * This test file verifies that LayerType follows the Totality principle:
 * - Complete error handling with Result type
 * - No partial functions
 * - Exhaustive pattern matching
 * - Smart constructor patterns with explicit error cases
 *
 * @module lib/types/1_totality_layer_type_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { LayerType, TwoParamsLayerTypePattern } from "./mod.ts";
import type { TwoParams_Result } from "../deps.ts";
import type { ValidationError } from "./mod.ts";

// Test helper to create valid TwoParams_Result
const createTwoParamsResult = (
  layerType: string,
  demonstrativeType: string = "to",
  options: Record<string, unknown> = {},
): TwoParams_Result => ({
  type: "two",
  demonstrativeType,
  layerType,
  params: [demonstrativeType, layerType],
  options,
});

Deno.test("1_totality: TwoParamsLayerTypePattern.createOrError handles all cases exhaustively", () => {
  // Test valid patterns
  const validPatterns = [
    "^(project|issue|task|bugs)$",
    "^[a-z]+$",
    "^[a-z0-9-]+$",
    ".*",
    "^layer$",
  ];

  for (const pattern of validPatterns) {
    const result = TwoParamsLayerTypePattern.createOrError(pattern);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertExists(result.data);
      assertEquals(result.data instanceof TwoParamsLayerTypePattern, true);
    }
  }

  // Test invalid patterns
  const invalidPatterns = [
    { pattern: "", expectedReason: "Pattern cannot be empty" },
    { pattern: "invalid[regex", expectedReason: "Invalid regex pattern" },
    { pattern: "(?<", expectedReason: "Invalid regex pattern" },
    { pattern: "*invalid", expectedReason: "Invalid regex pattern" },
    { pattern: "[z-a]", expectedReason: "Invalid regex pattern" },
  ];

  for (const { pattern, expectedReason } of invalidPatterns) {
    const result = TwoParamsLayerTypePattern.createOrError(pattern);
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidInput");
      if (result.error.kind === "InvalidInput") {
        assertEquals(result.error.field, "pattern");
        assertEquals(result.error.value, pattern);
        assertEquals(result.error.reason.includes(expectedReason), true);
      }
    }
  }
});

Deno.test("1_totality: LayerType.createOrError validates all input conditions", () => {
  // Test valid inputs
  const validResult = createTwoParamsResult("project", "to");
  const layerResult = LayerType.createOrError(validResult);
  assertEquals(layerResult.ok, true);
  if (layerResult.ok) {
    assertEquals(layerResult.data.value, "project");
  }

  // Test invalid result type
  const invalidTypeResult = {
    type: "one" as unknown,
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };
  const invalidTypeLayer = LayerType.createOrError(invalidTypeResult as TwoParams_Result);
  assertEquals(invalidTypeLayer.ok, false);
  if (!invalidTypeLayer.ok) {
    assertEquals(invalidTypeLayer.error.kind, "InvalidInput");
    if (invalidTypeLayer.error.kind === "InvalidInput") {
      assertEquals(invalidTypeLayer.error.reason, "Invalid TwoParams_Result: must have type 'two'");
    }
  }

  // Test missing layerType
  const missingFieldResult = {
    type: "two",
    demonstrativeType: "to",
    params: ["to", ""],
    options: {},
  } as unknown as TwoParams_Result;
  const missingFieldLayer = LayerType.createOrError(missingFieldResult);
  assertEquals(missingFieldLayer.ok, false);
  if (!missingFieldLayer.ok) {
    assertEquals(missingFieldLayer.error.kind, "MissingRequiredField");
    if (missingFieldLayer.error.kind === "MissingRequiredField") {
      assertEquals(missingFieldLayer.error.field, "layerType");
      assertEquals(missingFieldLayer.error.source, "TwoParams_Result");
    }
  }

  // Test null result
  const nullLayer = LayerType.createOrError(null as unknown as TwoParams_Result);
  assertEquals(nullLayer.ok, false);
  if (!nullLayer.ok) {
    assertEquals(nullLayer.error.kind, "InvalidInput");
  }
});

Deno.test("1_totality: LayerType.createOrError validates pattern matching", () => {
  // Create a pattern for allowed layers
  const patternResult = TwoParamsLayerTypePattern.createOrError("^(project|issue|task|bugs|temp)$");
  assertEquals(patternResult.ok, true);

  if (patternResult.ok) {
    const pattern = patternResult.data;

    // Test valid layers matching pattern
    const validLayers = ["project", "issue", "task", "bugs", "temp"];
    for (const layer of validLayers) {
      const result = createTwoParamsResult(layer);
      const layerResult = LayerType.createOrError(result, pattern);
      assertEquals(layerResult.ok, true);
      if (layerResult.ok) {
        assertEquals(layerResult.data.value, layer);
      }
    }

    // Test invalid layers not matching pattern
    const invalidLayers = ["invalid", "custom", "epic"];
    for (const layer of invalidLayers) {
      const result = createTwoParamsResult(layer);
      const layerResult = LayerType.createOrError(result, pattern);
      assertEquals(layerResult.ok, false);
      if (!layerResult.ok) {
        assertEquals(layerResult.error.kind, "InvalidInput");
        if (layerResult.error.kind === "InvalidInput") {
          assertEquals(layerResult.error.field, "layerType");
          assertEquals(layerResult.error.value, layer);
          assertEquals(
            layerResult.error.reason,
            `Value does not match required pattern: ^(project|issue|task|bugs|temp)$`,
          );
        }
      }
    }

    // Test empty string - should fail with MissingRequiredField
    const emptyResult = createTwoParamsResult("");
    const emptyLayer = LayerType.createOrError(emptyResult, pattern);
    assertEquals(emptyLayer.ok, false);
    if (!emptyLayer.ok) {
      assertEquals(emptyLayer.error.kind, "MissingRequiredField");
    }
  }
});

Deno.test("1_totality: LayerType.createOrError without pattern allows any valid string", () => {
  // Without pattern, any non-empty string should be valid
  const testValues = [
    "custom-layer",
    "analyze_data",
    "process.files",
    "layer@special",
    "123numeric",
    "レイヤー", // Japanese
    "🎯", // Emoji
  ];

  for (const value of testValues) {
    const result = createTwoParamsResult(value);
    const layerResult = LayerType.createOrError(result);
    assertEquals(layerResult.ok, true);
    if (layerResult.ok) {
      assertEquals(layerResult.data.value, value);
    }
  }

  // Empty string should fail
  const emptyResult = createTwoParamsResult("");
  const emptyLayer = LayerType.createOrError(emptyResult);
  assertEquals(emptyLayer.ok, false);
  if (!emptyLayer.ok) {
    assertEquals(emptyLayer.error.kind, "MissingRequiredField");
  }
});

Deno.test("1_totality: Error types form exhaustive discriminated union", () => {
  // This test verifies that all error cases are handled with specific error types

  function handleLayerError(error: ValidationError): string {
    switch (error.kind) {
      case "InvalidInput":
        return `Invalid input in field ${error.field}: ${error.reason}`;
      case "MissingRequiredField":
        return `Missing required field ${error.field} in ${error.source}`;
      case "InvalidFieldType":
        return `Invalid type for ${error.field}: expected ${error.expected}, got ${error.received}`;
      case "ValidationFailed":
        return `Validation failed: ${error.errors.join(", ")}`;
      case "InvalidParamsType":
        return `Invalid params type: expected ${error.expected}, received ${error.received}`;
      case "InvalidDirectiveType":
        return `Invalid directive type: ${error.value} does not match pattern ${error.validPattern}`;
      case "InvalidLayerType":
        return `Invalid layer type: ${error.value} does not match pattern ${error.validPattern}`;
      case "PathValidationFailed":
        return `Path validation failed: ${error.path} - ${error.reason}`;
      case "CustomVariableInvalid":
        return `Invalid custom variable ${error.key}: ${error.reason}`;
      case "ConfigValidationFailed":
        return `Config validation failed: ${error.errors.join(", ")}`;
      case "UnsupportedParamsType":
        return `Unsupported params type: ${error.type}`;
      default: {
        const _exhaustive: never = error;
        throw new Error(`Unhandled error kind: ${_exhaustive}`);
      }
    }
  }

  // Test each error type
  const errorCases = [
    LayerType.createOrError(null as unknown as TwoParams_Result),
    LayerType.createOrError({ type: "one" } as unknown as TwoParams_Result),
    LayerType.createOrError(
      { type: "two", demonstrativeType: "to" } as unknown as TwoParams_Result,
    ),
  ];

  for (const result of errorCases) {
    if (!result.ok) {
      const message = handleLayerError(result.error);
      assertExists(message);
      assertEquals(typeof message, "string");
      assertEquals(message.length > 0, true);
    }
  }
});

Deno.test("1_totality: Pattern and LayerType composition maintains totality", () => {
  // Test that composing pattern validation with layer creation maintains totality

  // Chain pattern creation and layer creation
  const patternResult = TwoParamsLayerTypePattern.createOrError("^[a-z]+(-[a-z]+)*$");
  assertEquals(patternResult.ok, true);

  if (patternResult.ok) {
    const testCases = [
      { value: "valid-layer", shouldPass: true },
      { value: "another-valid", shouldPass: true },
      { value: "simple", shouldPass: true },
      { value: "Invalid-Case", shouldPass: false },
      { value: "has_underscore", shouldPass: false },
      { value: "has spaces", shouldPass: false },
      { value: "123numeric", shouldPass: false },
    ];

    for (const { value, shouldPass } of testCases) {
      const result = createTwoParamsResult(value);
      const layerResult = LayerType.createOrError(result, patternResult.data);

      assertEquals(layerResult.ok, shouldPass);
      if (layerResult.ok) {
        assertEquals(layerResult.data.value, value);
      } else {
        assertEquals(layerResult.error.kind, "InvalidInput");
        if (layerResult.error.kind === "InvalidInput") {
          assertEquals(layerResult.error.field, "layerType");
          assertEquals(layerResult.error.value, value);
        }
      }
    }
  }
});

Deno.test("1_totality: Legacy create method maintains backward compatibility", () => {
  // The original create method should still work without Result type
  const result = createTwoParamsResult("legacy");
  const layer = LayerType.create(result);

  assertExists(layer);
  assertEquals(layer.value, "legacy");
  assertEquals(layer instanceof LayerType, true);

  // It should accept any valid TwoParams_Result without validation
  const emptyLayer = LayerType.create(createTwoParamsResult(""));
  assertEquals(emptyLayer.value, "");
});

Deno.test("1_totality: createOrError provides better error context than create", () => {
  // Demonstrate the advantage of Result-based error handling

  const invalidInput = {
    type: "two",
    demonstrativeType: "to",
    layerType: null,
  } as unknown as TwoParams_Result;

  // Legacy create would just return an object with null value
  const legacyLayer = LayerType.create(invalidInput);
  assertEquals(legacyLayer.value, null);

  // createOrError provides detailed error information
  const resultLayer = LayerType.createOrError(invalidInput);
  assertEquals(resultLayer.ok, false);
  if (!resultLayer.ok) {
    assertEquals(resultLayer.error.kind, "MissingRequiredField");
    if (resultLayer.error.kind === "MissingRequiredField") {
      assertEquals(resultLayer.error.field, "layerType");
      assertEquals(resultLayer.error.source, "TwoParams_Result");
    }
  }
});

Deno.test("1_totality: LayerType hierarchy methods work with createOrError", () => {
  // Test that additional LayerType methods work correctly with createOrError

  const standardLayers = ["project", "issue", "task"];
  const nonStandardLayers = ["bugs", "temp", "custom"];

  // Test standard hierarchy layers
  for (const layer of standardLayers) {
    const result = createTwoParamsResult(layer);
    const layerResult = LayerType.createOrError(result);
    assertEquals(layerResult.ok, true);
    if (layerResult.ok) {
      assertEquals(layerResult.data.isStandardHierarchy(), true);
      assertEquals(layerResult.data.getHierarchyLevel() > 0, true);
    }
  }

  // Test non-standard layers
  for (const layer of nonStandardLayers) {
    const result = createTwoParamsResult(layer);
    const layerResult = LayerType.createOrError(result);
    assertEquals(layerResult.ok, true);
    if (layerResult.ok) {
      if (layer === "bugs" || layer === "temp") {
        assertEquals(layerResult.data.isStandardHierarchy(), false);
        assertEquals(layerResult.data.getHierarchyLevel(), 0);
      } else {
        // Custom layers not in hierarchy map
        assertEquals(layerResult.data.isStandardHierarchy(), false);
        assertEquals(layerResult.data.getHierarchyLevel(), 0);
      }
    }
  }
});

// === Original Totality Tests (kept for compatibility) ===

Deno.test("1_totality: LayerType - handles all valid TwoParams_Result without exceptions", () => {
  // Totality principle: All valid inputs must be handled without throwing
  const testCases: TwoParams_Result[] = [
    // Standard hierarchy types
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      options: {},
      params: ["to", "project"],
    },
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "issue",
      options: {},
      params: ["to", "issue"],
    },
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "task",
      options: {},
      params: ["to", "task"],
    },

    // Special types
    {
      type: "two",
      demonstrativeType: "summary",
      layerType: "bugs",
      options: {},
      params: ["summary", "bugs"],
    },
    {
      type: "two",
      demonstrativeType: "defect",
      layerType: "temp",
      options: {},
      params: ["defect", "temp"],
    },

    // Extended types (environment-specific)
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "epic",
      options: {},
      params: ["to", "epic"],
    },
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "system",
      options: {},
      params: ["to", "system"],
    },
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "todos",
      options: {},
      params: ["to", "todos"],
    },
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "comments",
      options: {},
      params: ["to", "comments"],
    },
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "notes",
      options: {},
      params: ["to", "notes"],
    },

    // Edge cases that must be handled
    { type: "two", demonstrativeType: "to", layerType: "", options: {}, params: ["to", ""] }, // Empty string
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "unknown_type",
      options: {},
      params: ["to", "unknown_type"],
    }, // Unknown type
    { type: "two", demonstrativeType: "to", layerType: "123", options: {}, params: ["to", "123"] }, // Numeric string
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "with-dash",
      options: {},
      params: ["to", "with-dash"],
    }, // Special characters
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "with_underscore",
      options: {},
      params: ["to", "with_underscore"],
    },
    {
      type: "two",
      demonstrativeType: "to",
      layerType: "UPPERCASE",
      options: {},
      params: ["to", "UPPERCASE"],
    },
  ];

  // Totality: Every input produces a valid output without throwing
  for (const testCase of testCases) {
    const layerType = LayerType.create(testCase);
    assertExists(layerType);
    assertEquals(layerType instanceof LayerType, true);
    assertEquals(layerType.value, testCase.layerType);
  }
});

Deno.test("1_totality: TwoParamsLayerTypePattern - total function for pattern creation", () => {
  // Totality: All string inputs are handled - either valid pattern or null
  const testCases = [
    // Valid patterns
    { input: "project|issue|task", expected: true },
    { input: "^(project|issue|task)$", expected: true },
    { input: ".*", expected: true },
    { input: "bugs?", expected: true },
    { input: "(temp|tmp)", expected: true },
    { input: "[a-z]+", expected: true },

    // Invalid patterns
    { input: "[", expected: false }, // Unclosed bracket
    { input: "(", expected: false }, // Unclosed parenthesis
    { input: "(?<", expected: false }, // Invalid group
    { input: "\\", expected: false }, // Trailing backslash
    { input: "*", expected: false }, // Invalid quantifier
    { input: "(?P<name>)", expected: false }, // Python-style named group
  ];

  for (const { input, expected } of testCases) {
    const pattern = TwoParamsLayerTypePattern.create(input);

    if (expected) {
      assertExists(pattern);
      assertEquals(pattern instanceof TwoParamsLayerTypePattern, true);
    } else {
      assertEquals(pattern, null);
    }
  }
});
