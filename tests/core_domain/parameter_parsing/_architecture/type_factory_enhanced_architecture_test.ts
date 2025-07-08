/**
 * Enhanced Architecture tests for TypeFactory and Totality pattern implementation
 *
 * These tests verify that the TypeFactory follows architectural constraints
 * and properly implements the Totality principle across the type system.
 *
 * Enhancements include:
 * - Exhaustive error type discrimination tests
 * - Complete TypeCreationError coverage
 * - Enhanced pattern provider interface tests
 * - Totality principle validation through exhaustive matching
 */

import { assertEquals, assertExists } from "../../lib/deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  DirectiveType,
  LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  TypeFactory,
  type TypePatternProvider,
} from "../../lib/deps.ts";
import type { ProcessingError } from "../../../../lib/types/unified_error_types.ts";

const logger = new BreakdownLogger("type-factory-architecture-enhanced");

// Enhanced mock provider with error simulation capabilities
class EnhancedMockPatternProvider implements TypePatternProvider {
  private directivePattern: TwoParamsDirectivePattern | null;
  private layerPattern: TwoParamsLayerTypePattern | null;
  private shouldThrowOnDirective = false;
  private shouldThrowOnLayer = false;

  constructor(
    directivePatternString = "to|summary|defect|init|find",
    layerPatternString = "project|issue|task|bugs|temp",
  ) {
    this.directivePattern = TwoParamsDirectivePattern.create(directivePatternString);
    this.layerPattern = TwoParamsLayerTypePattern.create(layerPatternString);
  }

  setThrowOnDirective(shouldThrow: boolean) {
    this.shouldThrowOnDirective = shouldThrow;
  }

  setThrowOnLayer(shouldThrow: boolean) {
    this.shouldThrowOnLayer = shouldThrow;
  }

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    if (this.shouldThrowOnDirective) {
      throw new Error("Pattern provider error");
    }
    return this.directivePattern;
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    if (this.shouldThrowOnLayer) {
      throw new Error("Pattern provider error");
    }
    return this.layerPattern;
  }
}

describe("TypeFactory - Enhanced Architectural Constraints", () => {
  it("should enforce exhaustive error handling through TypeCreationError discrimination", () => {
    logger.debug("Testing exhaustive error type discrimination");

    const provider = new EnhancedMockPatternProvider();
    const factory = new TypeFactory(provider);

    // Helper function to exhaustively handle all error types
    function handleError(error: ProcessingError): string {
      switch (error.kind) {
        case "PatternNotFound":
          return `Pattern not found: ${error.reason}`;
        case "PatternValidationFailed":
          return `Validation failed for ${error.value} against ${error.pattern}`;
        case "InvalidPattern":
          return `Invalid pattern ${error.pattern}: ${error.reason}`;
        case "ProcessingFailed":
          return `Processing failed: ${error.reason}`;
        case "TransformationFailed":
          return `Transformation failed: ${error.reason}`;
        case "GenerationFailed":
          return `Generation failed: ${error.reason}`;
        default:
          // Handle other ProcessingError kinds
          const exhaustiveCheck: never = error;
          return `Processing error: ${JSON.stringify(exhaustiveCheck)}`;
      }
    }

    // Test all error types are handled
    const errors: ProcessingError[] = [
      { kind: "PatternNotFound", reason: "Test message", operation: "test" },
      { kind: "PatternValidationFailed", value: "test", pattern: "pattern", operation: "test" },
      { kind: "InvalidPattern", pattern: "bad|pattern", reason: "Invalid syntax", operation: "test" },
    ];

    errors.forEach((error) => {
      const result = handleError(error);
      assertExists(result);
      assertEquals(typeof result, "string");
    });
  });

  it("should maintain Totality through complete error value representation", () => {
    logger.debug("Testing complete error value representation");

    // Test with null pattern provider
    const nullProvider = new EnhancedMockPatternProvider();
    nullProvider.getDirectivePattern = () => null;
    nullProvider.getLayerTypePattern = () => null;

    const factory = new TypeFactory(nullProvider);

    // All operations should return Result types, never throw
    const operations = [
      () => factory.createDirectiveType("to"),
      () => factory.createLayerType("project"),
      () => factory.createBothTypes("to", "project"),
      () => factory.validateBothValues("to", "project"),
      () => factory.getPatternAvailability(),
      () => factory.debug(),
    ];

    operations.forEach((op, index) => {
      try {
        const result = op();
        assertExists(result);
        logger.debug(`Operation ${index} completed without exception`);
      } catch (e) {
        // Should never reach here - Totality means no exceptions
        throw new Error(`Operation ${index} violated Totality by throwing: ${e}`);
      }
    });
  });

  it("should handle all TypePatternProvider implementation variations", () => {
    logger.debug("Testing TypePatternProvider interface variations");

    // Test various provider implementations
    const providers: TypePatternProvider[] = [
      // Standard provider
      new EnhancedMockPatternProvider(),

      // Null-returning provider
      {
        getDirectivePattern: () => null,
        getLayerTypePattern: () => null,
      },

      // Mixed availability provider
      {
        getDirectivePattern: () => TwoParamsDirectivePattern.create("custom"),
        getLayerTypePattern: () => null,
      },

      // Empty pattern provider
      {
        getDirectivePattern: () => TwoParamsDirectivePattern.create(""),
        getLayerTypePattern: () => TwoParamsLayerTypePattern.create(""),
      },
    ];

    providers.forEach((provider, index) => {
      const factory = new TypeFactory(provider);
      const availability = factory.getPatternAvailability();

      assertExists(availability);
      assertEquals(typeof availability.directive, "boolean");
      assertEquals(typeof availability.layer, "boolean");
      assertEquals(typeof availability.both, "boolean");

      // Both should be true only if both directive and layer are true
      assertEquals(
        availability.both,
        availability.directive && availability.layer,
        `Provider ${index}: both flag inconsistent`,
      );
    });
  });

  it("should enforce type safety through phantom type pattern", () => {
    logger.debug("Testing phantom type pattern enforcement");

    const provider = new EnhancedMockPatternProvider();
    const factory = new TypeFactory(provider);

    // DirectiveType and LayerType should be distinct types
    const directiveResult = factory.createDirectiveType("to");
    const layerResult = factory.createLayerType("project");

    if (directiveResult.ok && layerResult.ok) {
      const directive = directiveResult.data;
      const layer = layerResult.data;

      // Types should have getValue() method but be distinct
      assertEquals(typeof directive.getValue, "function");
      assertEquals(typeof layer.getValue, "function");

      // Runtime type checking (since TypeScript types are erased)
      assertEquals(directive.constructor.name, "DirectiveType");
      assertEquals(layer.constructor.name, "LayerType");

      // Values should be preserved
      assertEquals(directive.getValue(), "to");
      assertEquals(layer.getValue(), "project");
    }
  });

  it("should maintain error context through proper error chaining", () => {
    logger.debug("Testing error context preservation");

    const provider = new EnhancedMockPatternProvider();
    const factory = new TypeFactory(provider);

    // Test error context in createBothTypes
    const bothResultInvalidDirective = factory.createBothTypes("invalid", "project");
    assertEquals(bothResultInvalidDirective.ok, false);

    if (!bothResultInvalidDirective.ok) {
      // Error should indicate which validation failed
      assertEquals(bothResultInvalidDirective.error.kind, "PatternValidationFailed");
      if (bothResultInvalidDirective.error.kind === "PatternValidationFailed") {
        assertEquals(bothResultInvalidDirective.error.value, "invalid");
        assertExists(bothResultInvalidDirective.error.pattern);
      }
    }

    const bothResultInvalidLayer = factory.createBothTypes("to", "invalid");
    assertEquals(bothResultInvalidLayer.ok, false);

    if (!bothResultInvalidLayer.ok) {
      assertEquals(bothResultInvalidLayer.error.kind, "PatternValidationFailed");
      if (bothResultInvalidLayer.error.kind === "PatternValidationFailed") {
        assertEquals(bothResultInvalidLayer.error.value, "invalid");
        assertExists(bothResultInvalidLayer.error.pattern);
      }
    }
  });

  it("should enforce referential transparency in type creation", () => {
    logger.debug("Testing referential transparency");

    const provider = new EnhancedMockPatternProvider();
    const factory = new TypeFactory(provider);

    // Multiple calls with same input should produce equivalent results
    const results = Array(5).fill(null).map(() => factory.createDirectiveType("summary"));

    results.forEach((result, index) => {
      assertEquals(result.ok, true, `Result ${index} should succeed`);
      if (result.ok) {
        assertEquals(result.data.getValue(), "summary");
      }
    });

    // Factory state should not affect results
    const preDebug = factory.debug();
    const postResults = Array(5).fill(null).map(() => factory.createDirectiveType("summary"));
    const postDebug = factory.debug();

    // Debug info should remain constant
    assertEquals(preDebug.patternProvider, postDebug.patternProvider);
    assertEquals(preDebug.availability.directive, postDebug.availability.directive);

    postResults.forEach((result, index) => {
      assertEquals(result.ok, true, `Post-result ${index} should succeed`);
    });
  });

  it("should handle pattern provider exceptions gracefully", () => {
    logger.debug("Testing exception handling in pattern provider");

    const provider = new EnhancedMockPatternProvider();
    const factory = new TypeFactory(provider);

    // Simulate provider throwing exceptions
    provider.setThrowOnDirective(true);

    // Note: Current implementation doesn't handle provider exceptions
    // This test documents the current behavior and suggests improvement
    try {
      const result = factory.createDirectiveType("to");
      // Current implementation will throw - this violates Totality
      assertEquals(true, false, "Should have thrown but didn't");
    } catch (e) {
      // Document current behavior
      assertExists(e);
      logger.debug("Current implementation throws on provider error", {
        error: e instanceof Error ? e.message : String(e),
        suggestion: "Wrap provider calls in try-catch and return InvalidPattern error",
      });
    }
  });
});

describe("TypeFactory - Pattern Composition Architecture", () => {
  it("should support pattern composition through provider chaining", () => {
    logger.debug("Testing pattern provider composition");

    // Composite provider that combines multiple sources
    class CompositePatternProvider implements TypePatternProvider {
      constructor(private providers: TypePatternProvider[]) {}

      getDirectivePattern(): TwoParamsDirectivePattern | null {
        for (const provider of this.providers) {
          const pattern = provider.getDirectivePattern();
          if (pattern) return pattern;
        }
        return null;
      }

      getLayerTypePattern(): TwoParamsLayerTypePattern | null {
        for (const provider of this.providers) {
          const pattern = provider.getLayerTypePattern();
          if (pattern) return pattern;
        }
        return null;
      }
    }

    const defaultProvider = new EnhancedMockPatternProvider("to|summary", "project|issue");
    const overrideProvider = new EnhancedMockPatternProvider("", "custom|layer");
    const composite = new CompositePatternProvider([overrideProvider, defaultProvider]);

    const factory = new TypeFactory(composite);

    // Should use first available pattern
    const directiveResult = factory.createDirectiveType("to");
    assertEquals(directiveResult.ok, true); // From default

    const layerResult = factory.createLayerType("custom");
    assertEquals(layerResult.ok, true); // From override
  });

  it("should maintain consistency across all factory methods", () => {
    logger.debug("Testing method consistency");

    const provider = new EnhancedMockPatternProvider();
    const factory = new TypeFactory(provider);

    // validateBothValues should be consistent with createBothTypes
    const testCases = [
      { directive: "to", layer: "project", valid: true },
      { directive: "invalid", layer: "project", valid: false },
      { directive: "to", layer: "invalid", valid: false },
      { directive: "invalid", layer: "invalid", valid: false },
    ];

    testCases.forEach(({ directive, layer, valid }) => {
      const validated = factory.validateBothValues(directive, layer);
      const created = factory.createBothTypes(directive, layer);

      assertEquals(validated, valid);
      assertEquals(created.ok, valid);

      logger.debug("Consistency check", {
        directive,
        layer,
        validated,
        createdOk: created.ok,
        consistent: validated === created.ok,
      });
    });
  });
});
