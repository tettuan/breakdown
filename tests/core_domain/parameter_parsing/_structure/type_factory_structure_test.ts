/**
 * Structure tests for TypeFactory - Component relationship validation
 *
 * These tests verify the structural relationships between TypeFactory components
 * and ensure proper encapsulation and cohesion in the Totality pattern implementation.
 */

import { assertEquals, assertExists, assertInstanceOf } from "../../lib/deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  DirectiveType,
  LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  type TypeCreationResult,
  TypeFactory,
  type TypePatternProvider,
  type ProcessingError,
} from "../../lib/deps.ts";

const logger = new BreakdownLogger("type-factory-structure");

// Minimal provider for structure testing
class StructureTestProvider implements TypePatternProvider {
  constructor(
    private directiveEnabled = true,
    private layerEnabled = true,
  ) {}

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    return this.directiveEnabled ? TwoParamsDirectivePattern.create("to|summary|defect") : null;
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    return this.layerEnabled ? TwoParamsLayerTypePattern.create("project|issue|task") : null;
  }
}

describe("TypeFactory - Component Structure", () => {
  it("should encapsulate pattern provider dependency properly", () => {
    logger.debug("Testing pattern provider encapsulation");

    const provider = new StructureTestProvider();
    const factory = new TypeFactory(provider);

    // Factory should not expose provider directly
    assertEquals(
      (factory as unknown as { patternProvider?: unknown }).patternProvider === undefined,
      false,
    ); // private field exists
    assertEquals(
      typeof (factory as unknown as { getPatternProvider?: unknown }).getPatternProvider,
      "undefined",
    ); // no public accessor

    // Factory should only expose methods for type creation and validation
    assertExists(factory.createDirectiveType);
    assertExists(factory.createLayerType);
    assertExists(factory.createBothTypes);
    assertExists(factory.validateBothValues);
    assertExists(factory.getPatternAvailability);
  });

  it("should maintain cohesive TypeCreationResult structure", () => {
    logger.debug("Testing TypeCreationResult structure cohesion");

    const provider = new StructureTestProvider();
    const factory = new TypeFactory(provider);

    // Success result structure
    const successResult = factory.createDirectiveType("to");
    assertEquals(successResult.ok, true);

    if (successResult.ok) {
      assertExists(successResult.data);
      // Note: DirectiveType constructor is private, cannot use assertInstanceOf
      assertEquals(typeof successResult.data.getValue, "function");
      // success result should not have error property
    }

    // Failure result structure
    const failureResult = factory.createDirectiveType("invalid");
    assertEquals(failureResult.ok, false);

    if (!failureResult.ok) {
      assertExists(failureResult.error);
      // failure result should not have data property
      assertEquals(typeof failureResult.error.kind, "string");
    }
  });

  it("should maintain consistent error structure across all methods", () => {
    logger.debug("Testing consistent error structure");

    const disabledProvider = new StructureTestProvider(false, false);
    const enabledProvider = new StructureTestProvider(true, true);

    const disabledFactory = new TypeFactory(disabledProvider);
    const enabledFactory = new TypeFactory(enabledProvider);

    // Pattern not found errors
    const patternNotFoundDirective = disabledFactory.createDirectiveType("to");
    const patternNotFoundLayer = disabledFactory.createLayerType("project");

    assertEquals(patternNotFoundDirective.ok, false);
    assertEquals(patternNotFoundLayer.ok, false);

    if (!patternNotFoundDirective.ok && !patternNotFoundLayer.ok) {
      assertEquals(patternNotFoundDirective.error.kind, "PatternNotFound");
      assertEquals(patternNotFoundLayer.error.kind, "PatternNotFound");
    }

    // Validation failed errors
    const validationFailedDirective = enabledFactory.createDirectiveType("invalid");
    const validationFailedLayer = enabledFactory.createLayerType("invalid");

    assertEquals(validationFailedDirective.ok, false);
    assertEquals(validationFailedLayer.ok, false);

    if (!validationFailedDirective.ok && !validationFailedLayer.ok) {
      assertEquals(validationFailedDirective.error.kind, "PatternValidationFailed");
      assertEquals(validationFailedLayer.error.kind, "PatternValidationFailed");

      // PatternValidationFailed should include value and pattern
      if (validationFailedDirective.error.kind === "PatternValidationFailed") {
        assertExists(validationFailedDirective.error.value);
        assertExists(validationFailedDirective.error.pattern);
      }
      if (validationFailedLayer.error.kind === "PatternValidationFailed") {
        assertExists(validationFailedLayer.error.value);
        assertExists(validationFailedLayer.error.pattern);
      }
    }
  });

  it("should maintain proper coupling between createBothTypes and individual creators", () => {
    logger.debug("Testing coupling between createBothTypes and individual creators");

    const provider = new StructureTestProvider();
    const factory = new TypeFactory(provider);

    // createBothTypes should behave consistently with individual creators
    const individualDirective = factory.createDirectiveType("summary");
    const individualLayer = factory.createLayerType("project");
    const bothResult = factory.createBothTypes("summary", "project");

    assertEquals(individualDirective.ok, true);
    assertEquals(individualLayer.ok, true);
    assertEquals(bothResult.ok, true);

    if (individualDirective.ok && individualLayer.ok && bothResult.ok) {
      assertEquals(
        individualDirective.data.getValue(),
        bothResult.data.directive.getValue(),
      );
      assertEquals(
        individualLayer.data.getValue(),
        bothResult.data.layer.getValue(),
      );
    }
  });

  it("should maintain loose coupling with TypePatternProvider interface", () => {
    logger.debug("Testing loose coupling with TypePatternProvider");

    // Factory should work with any implementation of TypePatternProvider
    class CustomProvider implements TypePatternProvider {
      getDirectivePattern() {
        return TwoParamsDirectivePattern.create("custom|special");
      }

      getLayerTypePattern() {
        return TwoParamsLayerTypePattern.create("alpha|beta");
      }
    }

    class MinimalProvider implements TypePatternProvider {
      getDirectivePattern() {
        return null;
      }
      getLayerTypePattern() {
        return null;
      }
    }

    // Both providers should work with the same factory interface
    const customFactory = new TypeFactory(new CustomProvider());
    const minimalFactory = new TypeFactory(new MinimalProvider());

    // Custom provider should enable custom types
    const customResult = customFactory.createDirectiveType("custom");
    assertEquals(customResult.ok, true);

    // Minimal provider should gracefully handle absence
    const minimalResult = minimalFactory.createDirectiveType("anything");
    assertEquals(minimalResult.ok, false);
  });
});

describe("TypeFactory - Method Cohesion", () => {
  it("should maintain cohesive validation methods", () => {
    logger.debug("Testing validation method cohesion");

    const provider = new StructureTestProvider();
    const factory = new TypeFactory(provider);

    // validateBothValues should be consistent with createBothTypes
    const validationResult = factory.validateBothValues("to", "project");
    const creationResult = factory.createBothTypes("to", "project");

    assertEquals(validationResult, true);
    assertEquals(creationResult.ok, true);

    // Invalid validation should be consistent
    const invalidValidation = factory.validateBothValues("invalid", "invalid");
    const invalidCreation = factory.createBothTypes("invalid", "invalid");

    assertEquals(invalidValidation, false);
    assertEquals(invalidCreation.ok, false);
  });

  it("should maintain cohesive availability reporting", () => {
    logger.debug("Testing availability reporting cohesion");

    // Full availability
    const fullProvider = new StructureTestProvider(true, true);
    const fullFactory = new TypeFactory(fullProvider);
    const fullAvailability = fullFactory.getPatternAvailability();

    assertEquals(fullAvailability.directive, true);
    assertEquals(fullAvailability.layer, true);
    assertEquals(fullAvailability.both, true);

    // Partial availability
    const partialProvider = new StructureTestProvider(true, false);
    const partialFactory = new TypeFactory(partialProvider);
    const partialAvailability = partialFactory.getPatternAvailability();

    assertEquals(partialAvailability.directive, true);
    assertEquals(partialAvailability.layer, false);
    assertEquals(partialAvailability.both, false);

    // No availability
    const noProvider = new StructureTestProvider(false, false);
    const noFactory = new TypeFactory(noProvider);
    const noAvailability = noFactory.getPatternAvailability();

    assertEquals(noAvailability.directive, false);
    assertEquals(noAvailability.layer, false);
    assertEquals(noAvailability.both, false);
  });

  it("should maintain cohesive debug information structure", () => {
    logger.debug("Testing debug information structure cohesion");

    const provider = new StructureTestProvider();
    const factory = new TypeFactory(provider);

    const debugInfo = factory.debug();

    // Debug info should have consistent structure
    assertExists(debugInfo.patternProvider);
    assertExists(debugInfo.availability);
    assertEquals(typeof debugInfo.patternProvider, "string");
    assertEquals(typeof debugInfo.availability, "object");

    // Availability in debug should match getPatternAvailability
    const availability = factory.getPatternAvailability();
    assertEquals(debugInfo.availability.directive, availability.directive);
    assertEquals(debugInfo.availability.layer, availability.layer);
    assertEquals(debugInfo.availability.both, availability.both);
  });
});

describe("TypeFactory - Error Structure Integrity", () => {
  it("should maintain error type discrimination", () => {
    logger.debug("Testing error type discrimination");

    const noPatternProvider = new StructureTestProvider(false, false);
    const invalidPatternProvider = new StructureTestProvider(true, true);

    const noPatternFactory = new TypeFactory(noPatternProvider);
    const invalidPatternFactory = new TypeFactory(invalidPatternProvider);

    // PatternNotFound error
    const patternNotFoundResult = noPatternFactory.createDirectiveType("to");
    assertEquals(patternNotFoundResult.ok, false);

    if (!patternNotFoundResult.ok) {
      assertEquals(patternNotFoundResult.error.kind, "PatternNotFound");
      // PatternNotFound error has reason property
      if (patternNotFoundResult.error.kind === "PatternNotFound") {
        assertExists(patternNotFoundResult.error.reason);
      }
    }

    // ValidationFailed error
    const validationFailedResult = invalidPatternFactory.createDirectiveType("invalid");
    assertEquals(validationFailedResult.ok, false);

    if (!validationFailedResult.ok) {
      assertEquals(validationFailedResult.error.kind, "PatternValidationFailed");
      if (validationFailedResult.error.kind === "PatternValidationFailed") {
        assertExists(validationFailedResult.error.value);
        assertExists(validationFailedResult.error.pattern);
      }
    }
  });

  it("should maintain error propagation in composite operations", () => {
    logger.debug("Testing error propagation in composite operations");

    const provider = new StructureTestProvider();
    const factory = new TypeFactory(provider);

    // If directive fails, both should fail with directive error
    const bothFailDirective = factory.createBothTypes("invalid", "project");
    assertEquals(bothFailDirective.ok, false);

    if (!bothFailDirective.ok) {
      assertEquals(bothFailDirective.error.kind, "PatternValidationFailed");
      if (bothFailDirective.error.kind === "PatternValidationFailed") {
        assertEquals(bothFailDirective.error.value, "invalid");
      }
    }

    // If layer fails, both should fail with layer error
    const bothFailLayer = factory.createBothTypes("to", "invalid");
    assertEquals(bothFailLayer.ok, false);

    if (!bothFailLayer.ok) {
      assertEquals(bothFailLayer.error.kind, "PatternValidationFailed");
      if (bothFailLayer.error.kind === "PatternValidationFailed") {
        assertEquals(bothFailLayer.error.value, "invalid");
      }
    }
  });
});
