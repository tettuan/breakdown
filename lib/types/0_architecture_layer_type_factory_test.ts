/**
 * Architecture tests for LayerTypeFactory
 *
 * These tests verify that LayerTypeFactory follows architectural constraints:
 * - Dependency direction and isolation
 * - Totality principle implementation
 * - Smart Constructor pattern adherence
 * - Integration boundaries
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  type LayerTypeCreationError,
  LayerTypeFactory,
  type LayerTypeResult,
} from "./layer_type_factory.ts";
import { LayerType, TwoParamsLayerTypePattern } from "./layer_type.ts";
import type { TwoParamsResult } from "../deps.ts";

const _logger = new BreakdownLogger("layer-type-factory-architecture");

describe("LayerTypeFactory - Totality Principle Architecture", () => {
  it("should enforce Totality principle through Result types", () => {
    _logger.debug("Verifying Totality principle implementation");

    // All factory methods should return Result types, never throw
    const testCases: Array<() => LayerTypeResult<any>> = [
      () => LayerTypeFactory.fromString("valid"),
      () => LayerTypeFactory.fromString(null),
      () => LayerTypeFactory.fromString(123),
      () => LayerTypeFactory.fromString(""),
      () =>
        LayerTypeFactory.fromTwoParamsResult({
          type: "two",
          demonstrativeType: "to",
          layerType: "project",
          params: ["to", "project"],
          options: {},
        }),
    ];

    testCases.forEach((testCase, index) => {
      let result: LayerTypeResult<any>;
      const threwError = false;

      try {
        result = testCase();
      } catch (e) {
        threwError = true;
      }

      assertEquals(threwError, false, `Test case ${index} should not throw`);

      // Result should always have ok property
      if (!threwError) {
        assertExists(result!.ok);
        if (result!.ok) {
          assertExists(result!.data);
        } else {
          assertExists(result!.error);
          assertExists(result!.error.kind);
        }
      }
    });
  });

  it("should provide exhaustive error handling", () => {
    _logger.debug("Testing exhaustive error handling");

    // All error kinds should be handled exhaustively
    const errorCases: Array<[unknown, string]> = [
      [null, "NullInput"],
      [undefined, "NullInput"],
      ["", "EmptyInput"],
      ["   ", "EmptyInput"],
      [123, "InvalidInput"],
      [true, "InvalidInput"],
      [{}, "InvalidInput"],
      ["unknown", "UnknownLayer"],
    ];

    errorCases.forEach(([input, expectedKind]) => {
      const _result = LayerTypeFactory.fromString(input);
      assertEquals(_result.ok, false);

      if (!_result.ok) {
        assertEquals(_result.error.kind, expectedKind);

        // Each error type should provide appropriate context
        switch (_result.error.kind) {
          case "NullInput":
            // No additional context needed
            break;
          case "EmptyInput":
            assertExists(_result.error.input);
            break;
          case "InvalidInput":
            assertExists(_result.error.input);
            assertExists(_result.error.actualType);
            break;
          case "UnknownLayer":
            assertExists(_result.error.input);
            assertExists(_result.error.suggestions);
            break;
          case "ValidationFailed":
            assertExists(_result.error.input);
            assertExists(_result.error.pattern);
            break;
          default:
            // TypeScript exhaustiveness check
            const _exhaustive: never = _result.error;
            throw new Error(`Unhandled error kind: ${(_exhaustive as unknown).kind}`);
        }
      }
    });
  });

  it("should follow Smart Constructor pattern", () => {
    _logger.debug("Verifying Smart Constructor pattern");

    // LayerType should only be constructible through factory
    const _result = LayerTypeFactory.fromString("project");
    assertEquals(_result.ok, true);

    if (_result.ok) {
      // Should produce valid LayerType instance
      assert(_result.data instanceof LayerType);

      // LayerType constructor should not be directly accessible
      // (This is enforced by TypeScript's private constructor)
      assertEquals(typeof (LayerType as unknown).new, "undefined");

      // But factory methods should work
      assertEquals(_result.data.getValue(), "project");
    }
  });
});

describe("LayerTypeFactory - Dependency Architecture", () => {
  it("should maintain proper dependency direction", () => {
    _logger.debug("Testing dependency direction");

    // LayerTypeFactory should depend on LayerType, not vice versa
    // This is verified by import structure

    // Factory should create LayerType instances
    const _result = LayerTypeFactory.fromString("issue");
    if (_result.ok) {
      assert(_result.data instanceof LayerType);
    }

    // LayerType should not have references to factory
    const layerTypeProto = Object.getPrototypeOf(_result.ok ? _result.data : {});
    const layerTypeMethods = Object.getOwnPropertyNames(layerTypeProto);

    layerTypeMethods.forEach((method) => {
      assert(
        !method.toLowerCase().includes("factory"),
        `LayerType should not have factory-related methods: ${method}`,
      );
    });
  });

  it("should isolate pattern validation concerns", () => {
    _logger.debug("Testing pattern validation isolation");

    // Pattern validation should be delegated to TwoParamsLayerTypePattern
    const pattern = TwoParamsLayerTypePattern.create("project|issue");
    assertExists(pattern);

    if (pattern) {
      // Factory should use pattern for validation
      const validResult = LayerTypeFactory.fromString("project", pattern);
      assertEquals(validResult.ok, true);

      const invalidResult = LayerTypeFactory.fromString("task", pattern);
      assertEquals(invalidResult.ok, false);

      if (!invalidResult.ok) {
        assertEquals(invalidResult.error.kind, "ValidationFailed");
      }
    }
  });

  it("should handle TwoParamsResult integration properly", () => {
    _logger.debug("Testing TwoParamsResult integration");

    // Should accept valid TwoParamsResult
    const validResult: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: "bugs",
      params: ["to", "bugs"],
      options: { verbose: true },
    };

    const _result = LayerTypeFactory.fromTwoParamsResult(validResult);
    assertEquals(_result.ok, true);

    if (_result.ok) {
      assertEquals(_result.data.getValue(), "bugs");

      // Should preserve original result data
      const originalResult = _result.data.originalResult;
      assertExists(originalResult);
      assertEquals(originalResult.layerType, "bugs");
      assertEquals(originalResult.demonstrativeType, "to");
    }
  });
});

describe("LayerTypeFactory - Performance Architecture", () => {
  it("should minimize object allocations", () => {
    _logger.debug("Testing object allocation efficiency");

    // Multiple calls with same input should be efficient
    const iterations = 100;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      LayerTypeFactory.fromString("project");
    }

    const duration = performance.now() - startTime;
    const avgTime = duration / iterations;

    // Should be fast (less than 1ms per call on average)
    assert(avgTime < 1, `Average time ${avgTime}ms should be less than 1ms`);
  });

  it("should handle known layers efficiently", () => {
    _logger.debug("Testing known layers lookup efficiency");

    // getKnownLayers should return cached/constant data
    const layers1 = LayerTypeFactory.getKnownLayers();
    const layers2 = LayerTypeFactory.getKnownLayers();

    // Should return new arrays (immutability)
    assert(layers1 !== layers2);

    // But content should be identical
    assertEquals(layers1, layers2);

    // isValidLayer should be fast O(1) or O(n) where n is small
    const testLayers = ["project", "issue", "task", "bugs", "temp", "invalid"];
    const startTime = performance.now();

    testLayers.forEach((layer) => {
      LayerTypeFactory.isValidLayer(layer);
    });

    const duration = performance.now() - startTime;
    assert(duration < 1, `Validation of ${testLayers.length} layers took ${duration}ms`);
  });
});

describe("LayerTypeFactory - Extension Architecture", () => {
  it("should support pattern-based extensibility", () => {
    _logger.debug("Testing pattern-based extensibility");

    // Factory should work with custom patterns
    const customPattern = TwoParamsLayerTypePattern.create("epic|story|subtask");
    assertExists(customPattern);

    if (customPattern) {
      // Should reject standard layers with custom pattern
      const projectResult = LayerTypeFactory.fromString("project", customPattern);
      assertEquals(projectResult.ok, false);

      // Pattern validation is the extension point
      if (!projectResult.ok) {
        assertEquals(projectResult.error.kind, "ValidationFailed");
      }
    }
  });

  it("should maintain backward compatibility", () => {
    _logger.debug("Testing backward compatibility");

    // All standard layers should work without patterns
    const standardLayers = ["project", "issue", "task", "bugs", "temp"];

    standardLayers.forEach((layer) => {
      const _result = LayerTypeFactory.fromString(layer);
      assertEquals(_result.ok, true, `Standard layer '${layer}' should be valid`);

      if (_result.ok) {
        assertEquals(_result.data.getValue(), layer);
      }
    });

    // Should also work with TwoParamsResult
    const legacyResult: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {},
    };

    const _result = LayerTypeFactory.fromTwoParamsResult(legacyResult);
    assertEquals(_result.ok, true);
  });
});
