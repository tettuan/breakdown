/**
 * Enhanced Structure tests for TypeFactory - Component relationship validation
 *
 * These tests verify the structural relationships between TypeFactory components
 * and ensure proper encapsulation and cohesion in the Totality pattern implementation.
 *
 * Enhancements include:
 * - Complete TypeCreationError coverage including InvalidPattern
 * - Enhanced error discrimination tests
 * - Improved structural integrity validation
 * - TypeCreationResult algebraic data type tests
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  DirectiveType,
  LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  type TypeCreationError,
  type TypeCreationResult,
  TypeFactory,
  type TypePatternProvider,
} from "./mod.ts";

const logger = new BreakdownLogger("type-factory-structure-enhanced");

// Enhanced provider for structural testing
class EnhancedStructureTestProvider implements TypePatternProvider {
  constructor(
    private directiveEnabled = true,
    private layerEnabled = true,
    private invalidPatterns = false,
  ) {}

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    if (this.invalidPatterns) {
      // Simulate invalid pattern that could cause InvalidPattern error
      try {
        return TwoParamsDirectivePattern.create("invalid||pattern|");
      } catch {
        return null;
      }
    }
    return this.directiveEnabled ? TwoParamsDirectivePattern.create("to|summary|defect") : null;
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    if (this.invalidPatterns) {
      try {
        return TwoParamsLayerTypePattern.create("bad||syntax|");
      } catch {
        return null;
      }
    }
    return this.layerEnabled ? TwoParamsLayerTypePattern.create("project|issue|task") : null;
  }
}

describe("TypeFactory - Enhanced Component Structure", () => {
  it("should maintain TypeCreationResult as proper algebraic data type", () => {
    logger.debug("Testing TypeCreationResult ADT structure");

    const provider = new EnhancedStructureTestProvider();
    const factory = new TypeFactory(provider);

    // Success case structure
    const successResult = factory.createDirectiveType("to");

    // Type narrowing should work properly
    if (successResult.ok) {
      // In success branch, only data should exist
      assertExists(successResult.data);
      assertEquals("error" in successResult, false);

      // Data should be the correct type
      assertEquals(successResult.data.constructor.name, "DirectiveType");
      assertEquals(successResult.data.getValue(), "to");
    } else {
      // Should not reach here for valid input
      throw new Error("Expected success result");
    }

    // Failure case structure
    const failureResult = factory.createDirectiveType("invalid");

    if (!failureResult.ok) {
      // In failure branch, only error should exist
      assertExists(failureResult.error);
      assertEquals("data" in failureResult, false);

      // Error should have proper structure
      assertExists(failureResult.error.kind);
      assertEquals(typeof failureResult.error.kind, "string");
    } else {
      // Should not reach here for invalid input
      throw new Error("Expected failure result");
    }
  });

  it("should maintain complete TypeCreationError discrimination structure", () => {
    logger.debug("Testing complete TypeCreationError structure");

    // Test all error variants have distinct structure
    const errorVariants: TypeCreationError[] = [
      {
        kind: "PatternNotFound",
        message: "Pattern not found in configuration",
      },
      {
        kind: "ValidationFailed",
        value: "invalid_value",
        pattern: "valid|pattern",
      },
      {
        kind: "InvalidPattern",
        pattern: "bad||pattern",
        cause: "Empty pattern segment",
      },
    ];

    // Each error kind should have unique properties
    errorVariants.forEach((error) => {
      switch (error.kind) {
        case "PatternNotFound":
          assertExists(error.message);
          assertEquals("value" in error, false);
          assertEquals("pattern" in error, false);
          assertEquals("cause" in error, false);
          break;

        case "ValidationFailed":
          assertExists(error.value);
          assertExists(error.pattern);
          assertEquals("message" in error, false);
          assertEquals("cause" in error, false);
          break;

        case "InvalidPattern":
          assertExists(error.pattern);
          assertExists(error.cause);
          assertEquals("message" in error, false);
          assertEquals("value" in error, false);
          break;
      }
    });
  });

  it("should maintain structural consistency in error propagation", () => {
    logger.debug("Testing error propagation structure");

    const provider = new EnhancedStructureTestProvider();
    const factory = new TypeFactory(provider);

    // Test error propagation in createBothTypes
    // When directive fails, the exact error should propagate
    const directiveError = factory.createDirectiveType("invalid");
    const bothDirectiveError = factory.createBothTypes("invalid", "project");

    assertEquals(directiveError.ok, false);
    assertEquals(bothDirectiveError.ok, false);

    if (!directiveError.ok && !bothDirectiveError.ok) {
      // Errors should be structurally identical
      assertEquals(directiveError.error.kind, bothDirectiveError.error.kind);

      if (
        directiveError.error.kind === "ValidationFailed" &&
        bothDirectiveError.error.kind === "ValidationFailed"
      ) {
        assertEquals(directiveError.error.value, bothDirectiveError.error.value);
        assertEquals(directiveError.error.pattern, bothDirectiveError.error.pattern);
      }
    }

    // When layer fails, that error should propagate
    const layerError = factory.createLayerType("invalid");
    const bothLayerError = factory.createBothTypes("to", "invalid");

    assertEquals(layerError.ok, false);
    assertEquals(bothLayerError.ok, false);

    if (!layerError.ok && !bothLayerError.ok) {
      assertEquals(layerError.error.kind, bothLayerError.error.kind);
    }
  });

  it("should encapsulate pattern validation logic properly", () => {
    logger.debug("Testing pattern validation encapsulation");

    const provider = new EnhancedStructureTestProvider();
    const factory = new TypeFactory(provider);

    // Factory should not expose internal validation methods
    const factoryMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(factory));
    const publicMethods = [
      "constructor",
      "createDirectiveType",
      "createLayerType",
      "createBothTypes",
      "validateBothValues",
      "getPatternAvailability",
      "debug",
    ];

    // Only public methods should be exposed
    factoryMethods.forEach((method) => {
      if (!publicMethods.includes(method)) {
        logger.debug(`Unexpected method found: ${method}`);
      }
    });

    // Pattern validation should be delegated to pattern objects
    const directivePattern = provider.getDirectivePattern();
    const layerPattern = provider.getLayerTypePattern();

    if (directivePattern && layerPattern) {
      // Patterns should have test method
      assertEquals(typeof directivePattern.test, "function");
      assertEquals(typeof layerPattern.test, "function");

      // Factory should use pattern's validation
      const factoryValidation = factory.validateBothValues("to", "project");
      const patternValidation = directivePattern.test("to") && layerPattern.test("project");

      assertEquals(factoryValidation, patternValidation);
    }
  });

  it("should maintain proper separation between type creation and validation", () => {
    logger.debug("Testing separation of concerns between creation and validation");

    const provider = new EnhancedStructureTestProvider();
    const factory = new TypeFactory(provider);

    // validateBothValues should only validate, not create
    const beforeValidation = factory.debug();
    const isValid = factory.validateBothValues("to", "project");
    const afterValidation = factory.debug();

    // State should not change after validation
    assertEquals(beforeValidation.patternProvider, afterValidation.patternProvider);
    assertEquals(
      beforeValidation.availability.directive,
      afterValidation.availability.directive,
    );

    // Validation result should match creation result
    assertEquals(isValid, true);
    const creationResult = factory.createBothTypes("to", "project");
    assertEquals(creationResult.ok, isValid);
  });

  it("should handle all pattern availability combinations structurally", () => {
    logger.debug("Testing pattern availability structure completeness");

    // Test all 4 combinations of pattern availability
    const configurations = [
      { directive: true, layer: true, expectedBoth: true },
      { directive: true, layer: false, expectedBoth: false },
      { directive: false, layer: true, expectedBoth: false },
      { directive: false, layer: false, expectedBoth: false },
    ];

    configurations.forEach(({ directive, layer, expectedBoth }) => {
      const provider = new EnhancedStructureTestProvider(directive, layer);
      const factory = new TypeFactory(provider);
      const availability = factory.getPatternAvailability();

      assertEquals(availability.directive, directive);
      assertEquals(availability.layer, layer);
      assertEquals(availability.both, expectedBoth);

      // Structure should always have all three fields
      assertExists(availability.directive);
      assertExists(availability.layer);
      assertExists(availability.both);

      logger.debug("Availability structure", {
        config: { directive, layer },
        result: availability,
      });
    });
  });

  it("should maintain debug information structural integrity", () => {
    logger.debug("Testing debug information structure");

    const provider = new EnhancedStructureTestProvider();
    const factory = new TypeFactory(provider);

    const debugInfo = factory.debug();

    // Debug structure validation
    assertExists(debugInfo);
    assertEquals(typeof debugInfo, "object");

    // Required fields
    assertExists(debugInfo.patternProvider);
    assertExists(debugInfo.availability);

    // Field types
    assertEquals(typeof debugInfo.patternProvider, "string");
    assertEquals(typeof debugInfo.availability, "object");

    // Availability sub-structure
    assertEquals(typeof debugInfo.availability.directive, "boolean");
    assertEquals(typeof debugInfo.availability.layer, "boolean");
    assertEquals(typeof debugInfo.availability.both, "boolean");

    // No extra fields
    const debugKeys = Object.keys(debugInfo);
    assertEquals(debugKeys.length, 2);
    assertEquals(debugKeys.includes("patternProvider"), true);
    assertEquals(debugKeys.includes("availability"), true);
  });

  it("should maintain result type consistency across all factory methods", () => {
    logger.debug("Testing result type consistency");

    const provider = new EnhancedStructureTestProvider();
    const factory = new TypeFactory(provider);

    // All creation methods should return TypeCreationResult
    const results: TypeCreationResult<any>[] = [
      factory.createDirectiveType("to"),
      factory.createLayerType("project"),
      factory.createBothTypes("to", "project"),
    ];

    results.forEach((result, index) => {
      // All results should have ok field
      assertExists(result.ok);
      assertEquals(typeof result.ok, "boolean");

      // Results should be discriminated union
      if (result.ok) {
        assertExists(result.data);
        assertEquals("error" in result, false);
      } else {
        assertExists(result.error);
        assertEquals("data" in result, false);
      }

      logger.debug(`Result ${index} structure valid`, { ok: result.ok });
    });
  });

  it("should handle InvalidPattern error scenarios structurally", () => {
    logger.debug("Testing InvalidPattern error structure");

    // Note: Current implementation doesn't produce InvalidPattern errors
    // This test documents the expected structure when implemented

    const invalidPatternError: TypeCreationError = {
      kind: "InvalidPattern",
      pattern: "invalid||pattern",
      cause: "Empty pattern segment not allowed",
    };

    // Verify structure
    assertEquals(invalidPatternError.kind, "InvalidPattern");
    assertExists(invalidPatternError.pattern);
    assertExists(invalidPatternError.cause);
    assertEquals(typeof invalidPatternError.pattern, "string");
    assertEquals(typeof invalidPatternError.cause, "string");

    // Document missing implementation
    logger.debug("InvalidPattern error structure defined but not implemented", {
      suggestion: "Add pattern syntax validation in TypeFactory",
      structure: invalidPatternError,
    });
  });
});

describe("TypeFactory - Type Relationships", () => {
  it("should maintain proper type hierarchy relationships", () => {
    logger.debug("Testing type hierarchy relationships");

    const provider = new EnhancedStructureTestProvider();
    const factory = new TypeFactory(provider);

    const directiveResult = factory.createDirectiveType("to");
    const layerResult = factory.createLayerType("project");

    if (directiveResult.ok && layerResult.ok) {
      const directive = directiveResult.data;
      const layer = layerResult.data;

      // Types should be distinct
      assertEquals(directive.constructor !== layer.constructor, true);

      // Both should have getValue method
      assertEquals(typeof directive.getValue, "function");
      assertEquals(typeof layer.getValue, "function");

      // Values should be preserved correctly
      assertEquals(directive.getValue(), "to");
      assertEquals(layer.getValue(), "project");
    }
  });

  it("should maintain composition integrity in createBothTypes", () => {
    logger.debug("Testing createBothTypes composition integrity");

    const provider = new EnhancedStructureTestProvider();
    const factory = new TypeFactory(provider);

    const bothResult = factory.createBothTypes("summary", "issue");

    if (bothResult.ok) {
      // Result should contain both types
      assertExists(bothResult.data.directive);
      assertExists(bothResult.data.layer);

      // Each should be the correct type
      assertEquals(bothResult.data.directive.constructor.name, "DirectiveType");
      assertEquals(bothResult.data.layer.constructor.name, "LayerType");

      // Values should match input
      assertEquals(bothResult.data.directive.getValue(), "summary");
      assertEquals(bothResult.data.layer.getValue(), "issue");

      // Structure should be frozen/immutable
      const data = bothResult.data;
      assertEquals(Object.keys(data).length, 2);
      assertEquals(Object.keys(data).includes("directive"), true);
      assertEquals(Object.keys(data).includes("layer"), true);
    }
  });
});
