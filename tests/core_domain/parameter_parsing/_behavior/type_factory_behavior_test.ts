/**
 * Unit tests for TypeFactory - Functional behavior validation
 *
 * These tests verify the functional behavior of TypeFactory methods
 * and ensure correct operation of the Totality pattern implementation.
 */

import { assertEquals, assertExists } from "../../lib/deps.ts";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  DirectiveType,
  LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  TypeFactory,
  type TypePatternProvider,
} from "../../lib/deps.ts";

const logger = new BreakdownLogger("type-factory-unit");

class UnitTestProvider implements TypePatternProvider {
  constructor(
    private directivePattern: string | null = "to|summary|defect|init|find",
    private layerPattern: string | null = "project|issue|task|bugs|temp",
  ) {}

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    return this.directivePattern ? TwoParamsDirectivePattern.create(this.directivePattern) : null;
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    return this.layerPattern ? TwoParamsLayerTypePattern.create(this.layerPattern) : null;
  }
}

describe("TypeFactory - createDirectiveType Method", () => {
  let provider: UnitTestProvider;
  let factory: TypeFactory;

  beforeEach(() => {
    provider = new UnitTestProvider();
    factory = new TypeFactory(provider);
  });

  it("should create valid DirectiveType for 'to'", () => {
    logger.debug("Testing DirectiveType creation for 'to'");

    const result = factory.createDirectiveType("to");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.getValue(), "to");
      assertEquals(result.data.toString(), "DirectiveType(to)");
    }
  });

  it("should create valid DirectiveType for 'summary'", () => {
    logger.debug("Testing DirectiveType creation for 'summary'");

    const result = factory.createDirectiveType("summary");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.getValue(), "summary");
    }
  });

  it("should create valid DirectiveType for 'defect'", () => {
    logger.debug("Testing DirectiveType creation for 'defect'");

    const result = factory.createDirectiveType("defect");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.getValue(), "defect");
    }
  });

  it("should fail for invalid DirectiveType 'invalid'", () => {
    logger.debug("Testing DirectiveType creation failure for 'invalid'");

    const result = factory.createDirectiveType("invalid");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ValidationFailed");
      if (result.error.kind === "ValidationFailed") {
        assertEquals(result.error.data, "invalid");
        assertExists(result.error.pattern);
      }
    }
  });

  it("should fail when no directive pattern is available", () => {
    logger.debug("Testing DirectiveType creation with no pattern");

    const noPatternProvider = new UnitTestProvider(null, "project|issue|task");
    const noPatternFactory = new TypeFactory(noPatternProvider);

    const result = noPatternFactory.createDirectiveType("to");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "PatternNotFound");
    }
  });

  it("should handle empty string input", () => {
    logger.debug("Testing DirectiveType creation with empty string");

    const result = factory.createDirectiveType("");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ValidationFailed");
      if (result.error.kind === "ValidationFailed") {
        assertEquals(result.error.data, "");
      }
    }
  });

  it("should handle whitespace-only input", () => {
    logger.debug("Testing DirectiveType creation with whitespace");

    const result = factory.createDirectiveType("   ");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ValidationFailed");
      if (result.error.kind === "ValidationFailed") {
        assertEquals(result.error.data, "   ");
      }
    }
  });
});

describe("TypeFactory - createLayerType Method", () => {
  let provider: UnitTestProvider;
  let factory: TypeFactory;

  beforeEach(() => {
    provider = new UnitTestProvider();
    factory = new TypeFactory(provider);
  });

  it("should create valid LayerType for 'project'", () => {
    logger.debug("Testing LayerType creation for 'project'");

    const result = factory.createLayerType("project");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.getValue(), "project");
      assertEquals(result.data.toString(), "LayerType(project)");
      assertEquals(result.data.getHierarchyLevel(), 1);
      assertEquals(result.data.isStandardHierarchy(), true);
    }
  });

  it("should create valid LayerType for 'issue'", () => {
    logger.debug("Testing LayerType creation for 'issue'");

    const result = factory.createLayerType("issue");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.getValue(), "issue");
      assertEquals(result.data.getHierarchyLevel(), 2);
      assertEquals(result.data.isStandardHierarchy(), true);
    }
  });

  it("should create valid LayerType for 'task'", () => {
    logger.debug("Testing LayerType creation for 'task'");

    const result = factory.createLayerType("task");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.getValue(), "task");
      assertEquals(result.data.getHierarchyLevel(), 3);
      assertEquals(result.data.isStandardHierarchy(), true);
    }
  });

  it("should create valid LayerType for non-standard 'bugs'", () => {
    logger.debug("Testing LayerType creation for 'bugs'");

    const result = factory.createLayerType("bugs");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.getValue(), "bugs");
      assertEquals(result.data.getHierarchyLevel(), 0); // Non-standard
      assertEquals(result.data.isStandardHierarchy(), false);
    }
  });

  it("should fail for invalid LayerType", () => {
    logger.debug("Testing LayerType creation failure");

    const result = factory.createLayerType("invalid");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ValidationFailed");
      if (result.error.kind === "ValidationFailed") {
        assertEquals(result.error.data, "invalid");
      }
    }
  });

  it("should fail when no layer pattern is available", () => {
    logger.debug("Testing LayerType creation with no pattern");

    const noPatternProvider = new UnitTestProvider("to|summary|defect", null);
    const noPatternFactory = new TypeFactory(noPatternProvider);

    const result = noPatternFactory.createLayerType("project");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "PatternNotFound");
    }
  });
});

describe("TypeFactory - createBothTypes Method", () => {
  let provider: UnitTestProvider;
  let factory: TypeFactory;

  beforeEach(() => {
    provider = new UnitTestProvider();
    factory = new TypeFactory(provider);
  });

  it("should create both valid types successfully", () => {
    logger.debug("Testing successful createBothTypes");

    const result = factory.createBothTypes("summary", "project");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive.getValue(), "summary");
      assertEquals(result.data.layer.getValue(), "project");
    }
  });

  it("should fail if directive is invalid", () => {
    logger.debug("Testing createBothTypes with invalid directive");

    const result = factory.createBothTypes("invalid", "project");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ValidationFailed");
      if (result.error.kind === "ValidationFailed") {
        assertEquals(result.error.data, "invalid");
      }
    }
  });

  it("should fail if layer is invalid", () => {
    logger.debug("Testing createBothTypes with invalid layer");

    const result = factory.createBothTypes("summary", "invalid");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ValidationFailed");
      if (result.error.kind === "ValidationFailed") {
        assertEquals(result.error.data, "invalid");
      }
    }
  });

  it("should fail if both are invalid", () => {
    logger.debug("Testing createBothTypes with both invalid");

    const result = factory.createBothTypes("invalid1", "invalid2");

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ValidationFailed");
      // Should fail on directive first
      if (result.error.kind === "ValidationFailed") {
        assertEquals(result.error.data, "invalid1");
      }
    }
  });

  it("should create types that are equal to individually created types", () => {
    logger.debug("Testing equivalence with individual creation");

    const directiveResult = factory.createDirectiveType("defect");
    const layerResult = factory.createLayerType("issue");
    const bothResult = factory.createBothTypes("defect", "issue");

    assertEquals(directiveResult.ok, true);
    assertEquals(layerResult.ok, true);
    assertEquals(bothResult.ok, true);

    if (directiveResult.ok && layerResult.ok && bothResult.ok) {
      assertEquals(
        directiveResult.data.equals(bothResult.data.directive),
        true,
      );
      assertEquals(
        layerResult.data.equals(bothResult.data.layer),
        true,
      );
    }
  });
});

describe("TypeFactory - validateBothValues Method", () => {
  let provider: UnitTestProvider;
  let factory: TypeFactory;

  beforeEach(() => {
    provider = new UnitTestProvider();
    factory = new TypeFactory(provider);
  });

  it("should validate correct values", () => {
    logger.debug("Testing validateBothValues with correct values");

    assertEquals(factory.validateBothValues("to", "project"), true);
    assertEquals(factory.validateBothValues("summary", "issue"), true);
    assertEquals(factory.validateBothValues("defect", "task"), true);
  });

  it("should reject invalid directive", () => {
    logger.debug("Testing validateBothValues with invalid directive");

    assertEquals(factory.validateBothValues("invalid", "project"), false);
  });

  it("should reject invalid layer", () => {
    logger.debug("Testing validateBothValues with invalid layer");

    assertEquals(factory.validateBothValues("to", "invalid"), false);
  });

  it("should reject both invalid", () => {
    logger.debug("Testing validateBothValues with both invalid");

    assertEquals(factory.validateBothValues("invalid1", "invalid2"), false);
  });

  it("should return false when patterns are not available", () => {
    logger.debug("Testing validateBothValues with no patterns");

    const noPatternProvider = new UnitTestProvider(null, null);
    const noPatternFactory = new TypeFactory(noPatternProvider);

    assertEquals(noPatternFactory.validateBothValues("to", "project"), false);
  });

  it("should be consistent with createBothTypes success", () => {
    logger.debug("Testing consistency between validateBothValues and createBothTypes");

    const testCases = [
      ["to", "project"],
      ["summary", "issue"],
      ["defect", "task"],
      ["invalid", "project"],
      ["to", "invalid"],
      ["invalid1", "invalid2"],
    ];

    testCases.forEach(([directive, layer]) => {
      const validationResult = factory.validateBothValues(directive, layer);
      const creationResult = factory.createBothTypes(directive, layer);

      assertEquals(validationResult, creationResult.ok);
    });
  });
});

describe("TypeFactory - getPatternAvailability Method", () => {
  it("should report full availability with both patterns", () => {
    logger.debug("Testing full pattern availability");

    const provider = new UnitTestProvider();
    const factory = new TypeFactory(provider);

    const availability = factory.getPatternAvailability();

    assertEquals(availability.directive, true);
    assertEquals(availability.layer, true);
    assertEquals(availability.both, true);
  });

  it("should report partial availability with directive only", () => {
    logger.debug("Testing directive-only pattern availability");

    const provider = new UnitTestProvider("to|summary|defect", null);
    const factory = new TypeFactory(provider);

    const availability = factory.getPatternAvailability();

    assertEquals(availability.directive, true);
    assertEquals(availability.layer, false);
    assertEquals(availability.both, false);
  });

  it("should report partial availability with layer only", () => {
    logger.debug("Testing layer-only pattern availability");

    const provider = new UnitTestProvider(null, "project|issue|task");
    const factory = new TypeFactory(provider);

    const availability = factory.getPatternAvailability();

    assertEquals(availability.directive, false);
    assertEquals(availability.layer, true);
    assertEquals(availability.both, false);
  });

  it("should report no availability with no patterns", () => {
    logger.debug("Testing no pattern availability");

    const provider = new UnitTestProvider(null, null);
    const factory = new TypeFactory(provider);

    const availability = factory.getPatternAvailability();

    assertEquals(availability.directive, false);
    assertEquals(availability.layer, false);
    assertEquals(availability.both, false);
  });
});

describe("TypeFactory - debug Method", () => {
  it("should provide comprehensive debug information", () => {
    logger.debug("Testing debug information provision");

    const provider = new UnitTestProvider();
    const factory = new TypeFactory(provider);

    const debugInfo = factory.debug();

    assertExists(debugInfo.patternProvider);
    assertExists(debugInfo.availability);
    assertEquals(typeof debugInfo.patternProvider, "string");
    assertEquals(debugInfo.patternProvider, "UnitTestProvider");

    // Availability should match getPatternAvailability
    const availability = factory.getPatternAvailability();
    assertEquals(debugInfo.availability.directive, availability.directive);
    assertEquals(debugInfo.availability.layer, availability.layer);
    assertEquals(debugInfo.availability.both, availability.both);
  });

  it("should reflect current state accurately", () => {
    logger.debug("Testing debug information accuracy");

    const noPatternProvider = new UnitTestProvider(null, null);
    const noPatternFactory = new TypeFactory(noPatternProvider);

    const debugInfo = noPatternFactory.debug();

    assertEquals(debugInfo.availability.directive, false);
    assertEquals(debugInfo.availability.layer, false);
    assertEquals(debugInfo.availability.both, false);
  });
});
