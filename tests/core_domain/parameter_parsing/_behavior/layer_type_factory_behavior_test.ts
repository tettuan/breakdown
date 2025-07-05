/**
 * Unit tests for LayerTypeFactory
 *
 * These tests verify the functional behavior of LayerTypeFactory methods
 * with comprehensive test cases covering all execution paths.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { describe, it } from "@std/testing/bdd";

import {
  type LayerTypeCreationError,
  LayerTypeFactory,
  type LayerTypeResult,
} from "./layer_type_factory.ts";
import { LayerType, TwoParamsLayerTypePattern } from "./mod.ts";
import type { TwoParamsResult } from "../../deps.ts";

const logger = new BreakdownLogger("layer-type-factory-unit");

describe("LayerTypeFactory.fromString - Valid Inputs", () => {
  it("should create LayerType for all known layers", () => {
    logger.debug("Testing creation of all known layer types");

    const knownLayers = ["project", "issue", "task", "bugs", "temp"];

    knownLayers.forEach((layer) => {
      const result = LayerTypeFactory.fromString(layer);
      assertEquals(result.ok, true, `Should create LayerType for ${layer}`);

      if (result.ok) {
        assertEquals(result.data.getValue(), layer);
      }
    });
  });

  it("should handle case-insensitive input", () => {
    logger.debug("Testing case-insensitive layer creation");

    const testCases = [
      { input: "PROJECT", expected: "project" },
      { input: "Issue", expected: "issue" },
      { input: "TASK", expected: "task" },
      { input: "BuGs", expected: "bugs" },
      { input: "TeMp", expected: "temp" },
    ];

    testCases.forEach(({ input, expected }) => {
      const result = LayerTypeFactory.fromString(input);
      assertEquals(result.ok, true);

      if (result.ok) {
        assertEquals(result.data.getValue(), expected);
      }
    });
  });

  it("should trim whitespace from input", () => {
    logger.debug("Testing whitespace trimming");

    const testCases = [
      "  project  ",
      "\ttask\t",
      "\nbugs\n",
      " issue ",
      "   temp   ",
    ];

    testCases.forEach((input) => {
      const result = LayerTypeFactory.fromString(input);
      assertEquals(result.ok, true);

      if (result.ok) {
        const expected = input.trim().toLowerCase();
        assertEquals(result.data.getValue(), expected);
      }
    });
  });
});

describe("LayerTypeFactory.fromString - Invalid Inputs", () => {
  it("should reject null and undefined", () => {
    logger.debug("Testing null/undefined rejection");

    const nullResult = LayerTypeFactory.fromString(null);
    assertEquals(nullResult.ok, false);
    if (!nullResult.ok) {
      assertEquals(nullResult.error.kind, "NullInput");
    }

    const undefinedResult = LayerTypeFactory.fromString(undefined);
    assertEquals(undefinedResult.ok, false);
    if (!undefinedResult.ok) {
      assertEquals(undefinedResult.error.kind, "NullInput");
    }
  });

  it("should reject non-string inputs with proper error", () => {
    logger.debug("Testing non-string input rejection");

    const testCases: Array<[unknown, string]> = [
      [123, "number"],
      [true, "boolean"],
      [{}, "object"],
      [[], "object"],
      [Symbol("test"), "symbol"],
      [() => {}, "function"],
    ];

    testCases.forEach(([input, expectedType]) => {
      const result = LayerTypeFactory.fromString(input);
      assertEquals(result.ok, false);

      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidInput");
        if (result.error.kind === "InvalidInput") {
          assertEquals(result.error.input, input);
          assertEquals(result.error.actualType, expectedType);
        }
      }
    });
  });

  it("should reject empty strings", () => {
    logger.debug("Testing empty string rejection");

    const testCases = ["", "   ", "\t", "\n", "\r\n", "    \t\n  "];

    testCases.forEach((input) => {
      const result = LayerTypeFactory.fromString(input);
      assertEquals(result.ok, false);

      if (!result.ok) {
        assertEquals(result.error.kind, "EmptyInput");
        if (result.error.kind === "EmptyInput") {
          assertEquals(result.error.input, input);
        }
      }
    });
  });

  it("should reject unknown layers with suggestions", () => {
    logger.debug("Testing unknown layer rejection with suggestions");

    const testCases = [
      { input: "proj", expectedSuggestions: ["project"] },
      { input: "iss", expectedSuggestions: ["issue"] },
      { input: "tas", expectedSuggestions: ["task"] },
      { input: "bug", expectedSuggestions: ["bugs"] },
      { input: "xyz", expectedSuggestions: ["project", "issue", "task", "bugs", "temp"] },
    ];

    testCases.forEach(({ input, expectedSuggestions }) => {
      const result = LayerTypeFactory.fromString(input);
      assertEquals(result.ok, false);

      if (!result.ok) {
        assertEquals(result.error.kind, "UnknownLayer");
        if (result.error.kind === "UnknownLayer") {
          assertEquals(result.error.input, input);
          assert(Array.isArray(result.error.suggestions));
          expectedSuggestions.forEach((suggestion) => {
            if (result.error.kind === "UnknownLayer") {
              assert(result.error.suggestions.includes(suggestion));
            }
          });
        }
      }
    });
  });
});

describe("LayerTypeFactory.fromString - Pattern Validation", () => {
  it("should validate against provided pattern", () => {
    logger.debug("Testing pattern validation");

    const restrictivePatternResult = TwoParamsLayerTypePattern.create("project|issue");
    const restrictivePattern = restrictivePatternResult || undefined;

    // Should pass for allowed layers
    const projectResult = LayerTypeFactory.fromString("project", restrictivePattern);
    assertEquals(projectResult.ok, true);

    const issueResult = LayerTypeFactory.fromString("issue", restrictivePattern);
    assertEquals(issueResult.ok, true);

    // Should fail for disallowed layers
    const taskResult = LayerTypeFactory.fromString("task", restrictivePattern);
    assertEquals(taskResult.ok, false);
    if (!taskResult.ok) {
      assertEquals(taskResult.error.kind, "ValidationFailed");
      if (taskResult.error.kind === "ValidationFailed") {
        assertEquals(taskResult.error.input, "task");
        assertExists(taskResult.error.pattern);
      }
    }
  });

  it("should work without pattern validation", () => {
    logger.debug("Testing without pattern validation");

    // All known layers should work without pattern
    const knownLayers = LayerTypeFactory.getKnownLayers();

    knownLayers.forEach((layer) => {
      const result = LayerTypeFactory.fromString(layer);
      assertEquals(result.ok, true);
    });
  });
});

describe("LayerTypeFactory.fromTwoParamsResult", () => {
  it("should create LayerType from valid TwoParamsResult", () => {
    logger.debug("Testing LayerType creation from TwoParamsResult");

    const validResults: TwoParamsResult[] = [
      {
        type: "two",
        demonstrativeType: "to",
        layerType: "project",
        params: ["to", "project"],
        options: {},
      },
      {
        type: "two",
        demonstrativeType: "summary",
        layerType: "issue",
        params: ["summary", "issue"],
        options: { verbose: true },
      },
    ];

    validResults.forEach((twoParamsResult) => {
      const result = LayerTypeFactory.fromTwoParamsResult(twoParamsResult);
      assertEquals(result.ok, true);

      if (result.ok) {
        assertEquals(result.data.getValue(), twoParamsResult.layerType);
      }
    });
  });

  it("should handle invalid TwoParamsResult", () => {
    logger.debug("Testing invalid TwoParamsResult handling");

    const invalidResult: TwoParamsResult = {
      type: "two",
      demonstrativeType: "invalid",
      layerType: "not-a-real-layer",
      params: ["invalid", "not-a-real-layer"],
      options: {},
    };

    // LayerType.create doesn't validate the layerType value
    // It accepts any TwoParamsResult, so the factory will succeed
    const result = LayerTypeFactory.fromTwoParamsResult(invalidResult);
    assertEquals(result.ok, true);

    if (result.ok) {
      // The LayerType is created with the non-standard layer value
      assertEquals(result.data.getValue(), "not-a-real-layer");
    }
  });
});

describe("LayerTypeFactory.isValidLayer", () => {
  it("should correctly validate known layers", () => {
    logger.debug("Testing layer validation");

    // All known layers should be valid
    const knownLayers = ["project", "issue", "task", "bugs", "temp"];
    knownLayers.forEach((layer) => {
      assertEquals(
        LayerTypeFactory.isValidLayer(layer),
        true,
        `${layer} should be valid`,
      );
    });

    // Unknown layers should be invalid
    const unknownLayers = ["unknown", "test", "example", ""];
    unknownLayers.forEach((layer) => {
      assertEquals(
        LayerTypeFactory.isValidLayer(layer),
        false,
        `${layer} should be invalid`,
      );
    });
  });

  it("should handle case and whitespace in validation", () => {
    logger.debug("Testing validation with case and whitespace");

    // Should normalize input
    assertEquals(LayerTypeFactory.isValidLayer("PROJECT"), true);
    assertEquals(LayerTypeFactory.isValidLayer("  task  "), true);
    assertEquals(LayerTypeFactory.isValidLayer("\tBUGS\t"), true);

    // Empty or whitespace-only should be invalid
    assertEquals(LayerTypeFactory.isValidLayer(""), false);
    assertEquals(LayerTypeFactory.isValidLayer("   "), false);
  });
});

describe("LayerTypeFactory.getKnownLayers", () => {
  it("should return all known layer types", () => {
    logger.debug("Testing known layers retrieval");

    const knownLayers = LayerTypeFactory.getKnownLayers();

    // Should be an array
    assert(Array.isArray(knownLayers));

    // Should contain all expected layers
    const expectedLayers = ["project", "issue", "task", "bugs", "temp"];
    assertEquals(knownLayers.length, expectedLayers.length);

    expectedLayers.forEach((expected) => {
      assert(knownLayers.includes(expected), `Should include ${expected}`);
    });
  });

  it("should return immutable copy", () => {
    logger.debug("Testing immutability of returned layers");

    const layers1 = LayerTypeFactory.getKnownLayers();
    const layers2 = LayerTypeFactory.getKnownLayers();

    // Should be different instances
    assert(layers1 !== layers2);

    // But same content
    assertEquals(layers1, layers2);

    // Modification should not affect factory
    (layers1 as string[]).push("modified");

    const layers3 = LayerTypeFactory.getKnownLayers();
    assert(!layers3.includes("modified"));
  });
});

describe("LayerTypeFactory - Edge Cases", () => {
  it("should handle suggestion calculation edge cases", () => {
    logger.debug("Testing suggestion calculation edge cases");

    // Exact match should still fail but suggest itself
    const exactResult = LayerTypeFactory.fromString("projects"); // plural
    assertEquals(exactResult.ok, false);
    if (!exactResult.ok && exactResult.error.kind === "UnknownLayer") {
      assert(exactResult.error.suggestions.includes("project"));
    }

    // Partial matches should get suggestions
    const partialResult = LayerTypeFactory.fromString("proj");
    assertEquals(partialResult.ok, false);
    if (!partialResult.ok && partialResult.error.kind === "UnknownLayer") {
      assert(partialResult.error.suggestions.includes("project"));
    }

    // No match should get all options
    const noMatchResult = LayerTypeFactory.fromString("xyz123");
    assertEquals(noMatchResult.ok, false);
    if (!noMatchResult.ok && noMatchResult.error.kind === "UnknownLayer") {
      assertEquals(noMatchResult.error.suggestions.length, 5); // All known layers
    }
  });

  it("should maintain consistency across different creation methods", () => {
    logger.debug("Testing consistency across creation methods");

    // fromString and fromTwoParamsResult should produce equivalent results
    const stringResult = LayerTypeFactory.fromString("task");
    const twoParamsResult = LayerTypeFactory.fromTwoParamsResult({
      type: "two",
      demonstrativeType: "to",
      layerType: "task",
      params: ["to", "task"],
      options: {},
    });

    assertEquals(stringResult.ok, true);
    assertEquals(twoParamsResult.ok, true);

    if (stringResult.ok && twoParamsResult.ok) {
      assertEquals(
        stringResult.data.getValue(),
        twoParamsResult.data.getValue(),
      );
    }
  });

  it("should handle unicode and special characters", () => {
    logger.debug("Testing unicode and special character handling");

    const specialInputs = [
      "project™",
      "🚀task",
      "issue©",
      "bugs®",
      "temp✓",
    ];

    specialInputs.forEach((input) => {
      const result = LayerTypeFactory.fromString(input);
      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "UnknownLayer");
      }
    });
  });
});
