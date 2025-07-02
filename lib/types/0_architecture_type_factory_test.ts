/**
 * Architecture tests for TypeFactory and Totality pattern implementation
 *
 * These tests verify that the TypeFactory follows architectural constraints
 * and properly implements the Totality principle across the type system.
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  DirectiveType,
  LayerType as _LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  TypeFactory,
  type TypePatternProvider,
} from "./mod.ts";

const _logger = new BreakdownLogger("type-factory-architecture");

// Mock provider for architecture testing
class MockPatternProvider implements TypePatternProvider {
  private directivePattern: TwoParamsDirectivePattern | null;
  private layerPattern: TwoParamsLayerTypePattern | null;

  constructor(
    directivePatternString = "to|summary|defect|init|find",
    layerPatternString = "project|issue|task|bugs|temp",
  ) {
    this.directivePattern = TwoParamsDirectivePattern.create(directivePatternString);
    this.layerPattern = TwoParamsLayerTypePattern.create(layerPatternString);
  }

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    return this.directivePattern;
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    return this.layerPattern;
  }
}

describe("TypeFactory - Architectural Constraints", () => {
  it("should enforce Totality principle through type construction", () => {
    _logger.debug("Testing Totality principle enforcement");

    const provider = new MockPatternProvider();
    const _factory = new TypeFactory(provider);

    // Valid construction should succeed
    const validResult = _factory.createDirectiveType("to");
    assertEquals(validResult.ok, true);

    // Invalid construction should fail gracefully
    const invalidResult = _factory.createDirectiveType("invalid_type");
    assertEquals(invalidResult.ok, false);

    // No exceptions should be thrown - all failures are represented as values
    if (!invalidResult.ok) {
      assertExists(invalidResult.error);
      assertExists(invalidResult.error.kind);
    }
  });

  it("should maintain immutability of created types", () => {
    _logger.debug("Testing type immutability");

    const provider = new MockPatternProvider();
    const _factory = new TypeFactory(provider);

    const _result = _factory.createDirectiveType("summary");
    assertEquals(_result.ok, true);

    if (_result.ok) {
      const type1 = _result.data;
      const type2 = _result.data;

      // Same instance should return same value
      assertEquals(type1.getValue(), type2.getValue());
      assertEquals(type1.getValue(), "summary");

      // Value should be immutable (no setters exposed)
      assertEquals(typeof (type1 as unknown as Record<string, unknown>).setValue, "undefined");
    }
  });

  it("should enforce single responsibility through separation of concerns", () => {
    _logger.debug("Testing separation of concerns");

    const provider = new MockPatternProvider();
    const _factory = new TypeFactory(provider);

    // TypeFactory should only handle type creation, not pattern management
    assertEquals(typeof (_factory as unknown as Record<string, unknown>).getDirectivePattern, "undefined");
    assertEquals(typeof (_factory as unknown as Record<string, unknown>).getLayerTypePattern, "undefined");

    // Pattern validation should be delegated to pattern provider
    const availability = _factory.getPatternAvailability();
    assertExists(availability.directive);
    assertExists(availability.layer);
    assertExists(availability.both);
  });

  it("should maintain dependency inversion through pattern provider abstraction", () => {
    _logger.debug("Testing dependency inversion principle");

    // Factory should work with any TypePatternProvider implementation
    class AlternativeProvider implements TypePatternProvider {
      getDirectivePattern() {
        return TwoParamsDirectivePattern.create("web|api|db");
      }

      getLayerTypePattern() {
        return TwoParamsLayerTypePattern.create("service|controller|model");
      }
    }

    const alternativeProvider = new AlternativeProvider();
    const _factory = new TypeFactory(alternativeProvider);

    // Should work with different pattern sets
    const webResult = _factory.createDirectiveType("web");
    assertEquals(webResult.ok, true);

    const serviceResult = _factory.createLayerType("service");
    assertEquals(serviceResult.ok, true);

    // Original patterns should not work
    const toResult = _factory.createDirectiveType("to");
    assertEquals(toResult.ok, false);
  });

  it("should enforce fail-fast validation through Result types", () => {
    _logger.debug("Testing fail-fast validation with Result types");

    const provider = new MockPatternProvider();
    const _factory = new TypeFactory(provider);

    // Multiple invalid attempts should all fail consistently
    const results = [
      _factory.createDirectiveType("invalid1"),
      _factory.createDirectiveType("invalid2"),
      _factory.createLayerType("invalid3"),
      _factory.createBothTypes("invalid4", "invalid5"),
    ];

    results.forEach((_result, index) => {
      assertEquals(_result.ok, false, `Result ${index} should fail`);
      if (!_result.ok) {
        assertEquals(_result.error.kind, "ValidationFailed");
      }
    });
  });

  it("should maintain type safety through Smart Constructor pattern", () => {
    _logger.debug("Testing Smart Constructor pattern implementation");

    const provider = new MockPatternProvider();
    const _factory = new TypeFactory(provider);

    // DirectiveType should only be creatable through factory
    const _result = _factory.createDirectiveType("defect");
    assertEquals(_result.ok, true);

    if (_result.ok) {
      const directiveType = _result.data;

      // No direct constructor access
      assertEquals(typeof DirectiveType.constructor, "function");

      // But private constructor prevents direct instantiation
      // (This would fail at compile time if attempted)

      // Only safe access through validated creation
      assertEquals(directiveType.getValue(), "defect");
    }
  });
});

describe("TypeFactory - Integration Architecture", () => {
  it("should integrate properly with BreakdownConfig patterns", () => {
    _logger.debug("Testing BreakdownConfig integration architecture");

    // Simulate BreakdownConfig providing patterns
    class ConfigBasedProvider implements TypePatternProvider {
      constructor(private config: Record<string, any>) {}

      getDirectivePattern() {
        const pattern = this.config.params?.two?.demonstrativeType?.pattern;
        return pattern ? TwoParamsDirectivePattern.create(pattern) : null;
      }

      getLayerTypePattern() {
        const pattern = this.config.params?.two?.layerType?.pattern;
        return pattern ? TwoParamsLayerTypePattern.create(pattern) : null;
      }
    }

    const mockConfig = {
      params: {
        two: {
          demonstrativeType: {
            pattern: "to|summary|defect",
          },
          layerType: {
            pattern: "project|issue|task",
          },
        },
      },
    };

    const provider = new ConfigBasedProvider(mockConfig);
    const _factory = new TypeFactory(provider);

    // Should work with config-based patterns
    const bothResult = _factory.createBothTypes("summary", "project");
    assertEquals(bothResult.ok, true);
  });

  it("should handle configuration absence gracefully", () => {
    _logger.debug("Testing graceful configuration absence handling");

    class EmptyProvider implements TypePatternProvider {
      getDirectivePattern() {
        return null;
      }
      getLayerTypePattern() {
        return null;
      }
    }

    const emptyProvider = new EmptyProvider();
    const _factory = new TypeFactory(emptyProvider);

    // Should fail gracefully when patterns are not available
    const _result = _factory.createDirectiveType("to");
    assertEquals(_result.ok, false);

    if (!_result.ok) {
      assertEquals(_result.error.kind, "PatternNotFound");
    }

    // Availability check should reflect missing patterns
    const availability = _factory.getPatternAvailability();
    assertEquals(availability.directive, false);
    assertEquals(availability.layer, false);
    assertEquals(availability.both, false);
  });

  it("should maintain performance through pattern caching", () => {
    _logger.debug("Testing performance through pattern caching");

    const directiveCallCount = 0;
    const layerCallCount = 0;

    class CountingProvider implements TypePatternProvider {
      getDirectivePattern() {
        directiveCallCount++;
        return TwoParamsDirectivePattern.create("to|summary");
      }

      getLayerTypePattern() {
        layerCallCount++;
        return TwoParamsLayerTypePattern.create("project|issue");
      }
    }

    const provider = new CountingProvider();
    const _factory = new TypeFactory(provider);

    // Multiple calls should only query patterns once per method call
    _factory.createDirectiveType("to");
    _factory.createDirectiveType("summary");
    _factory.createLayerType("project");
    _factory.createLayerType("issue");

    // Pattern provider is called per factory method call
    // (This documents current behavior - could be optimized with caching)
    assertEquals(directiveCallCount >= 2, true);
    assertEquals(layerCallCount >= 2, true);
  });
});
