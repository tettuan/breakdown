/**
 * Structure tests for LayerTypeFactory
 *
 * These tests verify the structural design of LayerTypeFactory including:
 * - Class structure and responsibility separation
 * - Method organization and cohesion
 * - Error type completeness
 * - Result type consistency
 */

import { assert, assertEquals, assertExists } from "../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { describe, it } from "@std/testing/bdd";

import {
  type LayerTypeCreationError,
  LayerTypeFactory,
  type LayerTypeResult,
} from "../../../../lib/types/layer_type_factory.ts";
import { LayerType, TwoParamsLayerTypePattern } from "../../../../lib/types/layer_type.ts";

const logger = new BreakdownLogger("layer-type-factory-structure");

describe("LayerTypeFactory - Class Structure", () => {
  it("should follow Single Responsibility Principle", () => {
    logger.debug("Verifying Single Responsibility Principle");

    // LayerTypeFactory should only be responsible for LayerType creation
    const factoryMethods = Object.getOwnPropertyNames(LayerTypeFactory);
    const publicMethods = [
      "fromString",
      "fromTwoParamsResult",
      "isValidLayer",
      "getKnownLayers",
    ];

    // All methods should be related to LayerType creation/validation
    publicMethods.forEach((method) => {
      assert(
        typeof (LayerTypeFactory as unknown as Record<string, unknown>)[method] === "function",
        `Expected ${method} to be a static method`,
      );
    });

    // No instance methods should exist (pure static factory)
    const instance = Object.create(LayerTypeFactory.prototype);
    assertEquals(Object.getOwnPropertyNames(instance).length, 0);
  });

  it("should maintain cohesive method organization", () => {
    logger.debug("Testing method cohesion");

    // Primary creation methods
    assertExists(LayerTypeFactory.fromString);
    assertExists(LayerTypeFactory.fromTwoParamsResult);

    // Utility methods
    assertExists(LayerTypeFactory.isValidLayer);
    assertExists(LayerTypeFactory.getKnownLayers);

    // Methods should have clear, single purposes
    const knownLayers = LayerTypeFactory.getKnownLayers();
    assert(Array.isArray(knownLayers));
    assert(knownLayers.length > 0);

    // Validation method should be boolean
    assertEquals(typeof LayerTypeFactory.isValidLayer("project"), "boolean");
  });

  it("should have complete error type coverage", () => {
    logger.debug("Verifying error type completeness");

    // All possible error conditions should have corresponding error types
    const errorScenarios = [
      { input: null, expectedKind: "NullInput" },
      { input: "", expectedKind: "EmptyInput" },
      { input: 123, expectedKind: "InvalidInput" },
      { input: "unknown", expectedKind: "UnknownLayer" },
      { input: "PROJECT", expectedKind: "ValidationFailed", withPattern: true },
    ];

    errorScenarios.forEach((scenario) => {
      const patternResult = scenario.withPattern
        ? TwoParamsLayerTypePattern.create("only-lowercase")
        : null;
      const pattern = patternResult || undefined;

      const result = LayerTypeFactory.fromString(scenario.input, pattern);
      assertEquals(result.ok, false);

      if (!result.ok) {
        assertExists(result.error);
        assertExists(result.error.kind);
        logger.debug(`Error scenario covered: ${result.error.kind}`, {
          input: scenario.input,
          error: result.error,
        });
      }
    });
  });

  it("should maintain consistent Result type structure", () => {
    logger.debug("Testing Result type consistency");

    // All factory methods should return consistent Result types
    const stringResult = LayerTypeFactory.fromString("project");
    const twoParamsResult = LayerTypeFactory.fromTwoParamsResult({
      type: "two",
      demonstrativeType: "to",
      layerType: "issue",
      params: ["to", "issue"],
      options: {},
    });

    // Both should have consistent structure
    assertExists(stringResult.ok);
    assertExists(twoParamsResult.ok);

    if (stringResult.ok) {
      assertExists(stringResult.data);
      assert(stringResult.data instanceof LayerType);
    }

    if (twoParamsResult.ok) {
      assertExists(twoParamsResult.data);
      assert(twoParamsResult.data instanceof LayerType);
    }
  });
});

describe("LayerTypeFactory - Error Structure", () => {
  it("should provide exhaustive error information", () => {
    logger.debug("Testing error information completeness");

    // Each error type should contain sufficient context
    const testCases: Array<[unknown, (error: LayerTypeCreationError) => void]> = [
      [null, (error) => {
        assertEquals(error.kind, "NullInput");
        // NullInput needs no additional context
      }],
      ["", (error) => {
        assertEquals(error.kind, "EmptyInput");
        if (error.kind === "EmptyInput") {
          assertExists(error.input);
        }
      }],
      [123, (error) => {
        assertEquals(error.kind, "InvalidInput");
        if (error.kind === "InvalidInput") {
          assertExists(error.input);
          assertExists(error.actualType);
        }
      }],
      ["unknown", (error) => {
        assertEquals(error.kind, "UnknownLayer");
        if (error.kind === "UnknownLayer") {
          assertExists(error.input);
          assertExists(error.suggestions);
          assert(Array.isArray(error.suggestions));
        }
      }],
    ];

    testCases.forEach(([input, assertion]) => {
      const result = LayerTypeFactory.fromString(input);
      assertEquals(result.ok, false);

      if (!result.ok) {
        assertion(result.error);
      }
    });
  });

  it("should handle error propagation consistently", () => {
    logger.debug("Testing error propagation patterns");

    // Errors from dependencies should be wrapped appropriately
    const invalidTwoParams_Result = {
      type: "two" as const,
      demonstrativeType: "invalid",
      layerType: "not-a-layer",
      params: ["invalid", "not-a-layer"],
      options: {},
    };

    // LayerType.create doesn't actually validate layerType values
    // It accepts any string in TwoParams_Result.layerType
    const result = LayerTypeFactory.fromTwoParamsResult(invalidTwoParams_Result);

    // The factory should create a LayerType even with non-standard layer values
    assertEquals(result.ok, true);

    if (result.ok) {
      assertEquals(result.data.getValue(), "not-a-layer");
    }
  });
});

describe("LayerTypeFactory - Internal Structure", () => {
  it("should maintain proper encapsulation", () => {
    logger.debug("Testing encapsulation boundaries");

    // Private methods and properties are accessible at runtime in JavaScript/TypeScript
    // but the TypeScript compiler prevents access at compile time
    // This test verifies the intended encapsulation design

    // calculateSuggestions is marked private but accessible at runtime
    const hasSuggestionMethod =
      typeof (LayerTypeFactory as unknown as Record<string, unknown>).calculateSuggestions ===
        "function";
    assertEquals(hasSuggestionMethod, true, "Private methods exist at runtime");

    // KNOWN_LAYERS is marked private but accessible at runtime
    const hasKnownLayers =
      (LayerTypeFactory as unknown as Record<string, unknown>).KNOWN_LAYERS !== undefined;
    assertEquals(hasKnownLayers, true, "Private constants exist at runtime");

    // But functionality should be exposed through public API
    const knownLayers = LayerTypeFactory.getKnownLayers();
    assert(knownLayers.includes("project"));
    assert(knownLayers.includes("issue"));
  });

  it("should follow immutability principles", () => {
    logger.debug("Testing immutability of returned data");

    // getKnownLayers should return a copy, not the original
    const layers1 = LayerTypeFactory.getKnownLayers();
    const layers2 = LayerTypeFactory.getKnownLayers();

    assert(layers1 !== layers2, "Should return new array instances");
    assertEquals(layers1, layers2, "But with same content");

    // Modifying returned array should not affect internal state
    const layersCopy = LayerTypeFactory.getKnownLayers() as string[];
    layersCopy.push("modified");

    const layersAgain = LayerTypeFactory.getKnownLayers();
    assert(!layersAgain.includes("modified"), "Internal state should not be modified");
  });

  it("should organize methods by access patterns", () => {
    logger.debug("Testing method organization patterns");

    // Public factory methods
    const factoryMethods = ["fromString", "fromTwoParamsResult"];

    // Public query methods
    const queryMethods = ["isValidLayer", "getKnownLayers"];

    // All should be static (no instance required)
    [...factoryMethods, ...queryMethods].forEach((method) => {
      assert(
        typeof (LayerTypeFactory as unknown as Record<string, unknown>)[method] === "function",
        `${method} should be a static method`,
      );
    });

    // Factory methods should return Result types
    const projectResult = LayerTypeFactory.fromString("project");
    assertExists(projectResult.ok);

    // Query methods should return simple types
    assertEquals(typeof LayerTypeFactory.isValidLayer("project"), "boolean");
    assert(Array.isArray(LayerTypeFactory.getKnownLayers()));
  });
});

describe("LayerTypeFactory - Composition Structure", () => {
  it("should properly compose with LayerType", () => {
    logger.debug("Testing LayerType composition");

    // Factory should produce valid LayerType instances
    const result = LayerTypeFactory.fromString("task");
    assertEquals(result.ok, true);

    if (result.ok) {
      const layerType = result.data;

      // Should be proper LayerType instance
      assert(layerType instanceof LayerType);

      // Should have LayerType methods
      assertExists(layerType.getValue);
      assertExists(layerType.value); // LayerType has a value getter
      assertExists(layerType.equals); // LayerType has equals method
      assertExists(layerType.toString); // LayerType has toString method

      // Should maintain LayerType invariants
      assertEquals(layerType.getValue(), "task");
      assertEquals(layerType.value, "task");
    }
  });

  it("should handle pattern validation delegation", () => {
    logger.debug("Testing pattern validation delegation");

    // When pattern is provided, should delegate validation
    const strictPatternResult = TwoParamsLayerTypePattern.create("project|issue");
    const strictPattern = strictPatternResult || undefined;

    // Valid according to pattern
    const validResult = LayerTypeFactory.fromString("project", strictPattern);
    assertEquals(validResult.ok, true);

    // Valid layer but not in pattern
    const invalidResult = LayerTypeFactory.fromString("task", strictPattern);
    assertEquals(invalidResult.ok, false);

    if (!invalidResult.ok) {
      assertEquals(invalidResult.error.kind, "ValidationFailed");
      if (invalidResult.error.kind === "ValidationFailed") {
        assertExists(invalidResult.error.pattern);
      }
    }
  });
});
