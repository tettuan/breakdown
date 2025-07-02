/**
 * Unit tests for TypeFactory - Functional behavior validation
 *
 * These tests verify the functional behavior of TypeFactory methods
 * and ensure correct operation of the Totality pattern implementation.
 */

import { assertEquals, assertExists } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  DirectiveType,
  LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  TypeFactory,
  type TypePatternProvider,
} from "./mod.ts";

const _logger = new BreakdownLogger("type-factory-unit");

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
    _logger.debug("Testing DirectiveType creation for 'to'");

    const _result = _factory.createDirectiveType("to");

    assertEquals(_result.ok, true);
    if (_result.ok) {
      assertEquals(_result.data.getValue(), "to");
      assertEquals(_result.data.toString(), "DirectiveType(to)");
    }
  });

  it("should create valid DirectiveType for 'summary'", () => {
    _logger.debug("Testing DirectiveType creation for 'summary'");

    const _result = _factory.createDirectiveType("summary");

    assertEquals(_result.ok, true);
    if (_result.ok) {
      assertEquals(_result.data.getValue(), "summary");
    }
  });

  it("should create valid DirectiveType for 'defect'", () => {
    _logger.debug("Testing DirectiveType creation for 'defect'");

    const _result = _factory.createDirectiveType("defect");

    assertEquals(_result.ok, true);
    if (_result.ok) {
      assertEquals(_result.data.getValue(), "defect");
    }
  });

  it("should fail for invalid DirectiveType 'invalid'", () => {
    _logger.debug("Testing DirectiveType creation failure for 'invalid'");

    const _result = _factory.createDirectiveType("invalid");

    assertEquals(_result.ok, false);
    if (!_result.ok) {
      assertEquals(_result.error.kind, "ValidationFailed");
      assertEquals((_result.error as unknown).value, "invalid");
      assertExists((_result.error as unknown).pattern);
    }
  });

  it("should fail when no directive pattern is available", () => {
    _logger.debug("Testing DirectiveType creation with no pattern");

    const noPatternProvider = new UnitTestProvider(null, "project|issue|task");
    const noPatternFactory = new TypeFactory(noPatternProvider);

    const _result = noPatternFactory.createDirectiveType("to");

    assertEquals(_result.ok, false);
    if (!_result.ok) {
      assertEquals(_result.error.kind, "PatternNotFound");
    }
  });

  it("should handle empty string input", () => {
    _logger.debug("Testing DirectiveType creation with empty string");

    const _result = _factory.createDirectiveType("");

    assertEquals(_result.ok, false);
    if (!_result.ok) {
      assertEquals(_result.error.kind, "ValidationFailed");
      assertEquals((_result.error as unknown).value, "");
    }
  });

  it("should handle whitespace-only input", () => {
    _logger.debug("Testing DirectiveType creation with whitespace");

    const _result = _factory.createDirectiveType("   ");

    assertEquals(_result.ok, false);
    if (!_result.ok) {
      assertEquals(_result.error.kind, "ValidationFailed");
      assertEquals((_result.error as unknown).value, "   ");
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
    _logger.debug("Testing LayerType creation for 'project'");

    const _result = _factory.createLayerType("project");

    assertEquals(_result.ok, true);
    if (_result.ok) {
      assertEquals(_result.data.getValue(), "project");
      assertEquals(_result.data.toString(), "LayerType(project)");
      assertEquals(_result.data.getHierarchyLevel(), 1);
      assertEquals(_result.data.isStandardHierarchy(), true);
    }
  });

  it("should create valid LayerType for 'issue'", () => {
    _logger.debug("Testing LayerType creation for 'issue'");

    const _result = _factory.createLayerType("issue");

    assertEquals(_result.ok, true);
    if (_result.ok) {
      assertEquals(_result.data.getValue(), "issue");
      assertEquals(_result.data.getHierarchyLevel(), 2);
      assertEquals(_result.data.isStandardHierarchy(), true);
    }
  });

  it("should create valid LayerType for 'task'", () => {
    _logger.debug("Testing LayerType creation for 'task'");

    const _result = _factory.createLayerType("task");

    assertEquals(_result.ok, true);
    if (_result.ok) {
      assertEquals(_result.data.getValue(), "task");
      assertEquals(_result.data.getHierarchyLevel(), 3);
      assertEquals(_result.data.isStandardHierarchy(), true);
    }
  });

  it("should create valid LayerType for non-standard 'bugs'", () => {
    _logger.debug("Testing LayerType creation for 'bugs'");

    const _result = _factory.createLayerType("bugs");

    assertEquals(_result.ok, true);
    if (_result.ok) {
      assertEquals(_result.data.getValue(), "bugs");
      assertEquals(_result.data.getHierarchyLevel(), 0); // Non-standard
      assertEquals(_result.data.isStandardHierarchy(), false);
    }
  });

  it("should fail for invalid LayerType", () => {
    _logger.debug("Testing LayerType creation failure");

    const _result = _factory.createLayerType("invalid");

    assertEquals(_result.ok, false);
    if (!_result.ok) {
      assertEquals(_result.error.kind, "ValidationFailed");
      assertEquals((_result.error as unknown).value, "invalid");
    }
  });

  it("should fail when no layer pattern is available", () => {
    _logger.debug("Testing LayerType creation with no pattern");

    const noPatternProvider = new UnitTestProvider("to|summary|defect", null);
    const noPatternFactory = new TypeFactory(noPatternProvider);

    const _result = noPatternFactory.createLayerType("project");

    assertEquals(_result.ok, false);
    if (!_result.ok) {
      assertEquals(_result.error.kind, "PatternNotFound");
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
    _logger.debug("Testing successful createBothTypes");

    const _result = _factory.createBothTypes("summary", "project");

    assertEquals(_result.ok, true);
    if (_result.ok) {
      assertEquals(_result.data.directive.getValue(), "summary");
      assertEquals(_result.data.layer.getValue(), "project");
    }
  });

  it("should fail if directive is invalid", () => {
    _logger.debug("Testing createBothTypes with invalid directive");

    const _result = _factory.createBothTypes("invalid", "project");

    assertEquals(_result.ok, false);
    if (!_result.ok) {
      assertEquals(_result.error.kind, "ValidationFailed");
      assertEquals((_result.error as unknown).value, "invalid");
    }
  });

  it("should fail if layer is invalid", () => {
    _logger.debug("Testing createBothTypes with invalid layer");

    const _result = _factory.createBothTypes("summary", "invalid");

    assertEquals(_result.ok, false);
    if (!_result.ok) {
      assertEquals(_result.error.kind, "ValidationFailed");
      assertEquals((_result.error as unknown).value, "invalid");
    }
  });

  it("should fail if both are invalid", () => {
    _logger.debug("Testing createBothTypes with both invalid");

    const _result = _factory.createBothTypes("invalid1", "invalid2");

    assertEquals(_result.ok, false);
    if (!_result.ok) {
      assertEquals(_result.error.kind, "ValidationFailed");
      // Should fail on directive first
      assertEquals((_result.error as unknown).value, "invalid1");
    }
  });

  it("should create types that are equal to individually created types", () => {
    _logger.debug("Testing equivalence with individual creation");

    const directiveResult = _factory.createDirectiveType("defect");
    const layerResult = _factory.createLayerType("issue");
    const bothResult = _factory.createBothTypes("defect", "issue");

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
    _logger.debug("Testing validateBothValues with correct values");

    assertEquals(_factory.validateBothValues("to", "project"), true);
    assertEquals(_factory.validateBothValues("summary", "issue"), true);
    assertEquals(_factory.validateBothValues("defect", "task"), true);
  });

  it("should reject invalid directive", () => {
    _logger.debug("Testing validateBothValues with invalid directive");

    assertEquals(_factory.validateBothValues("invalid", "project"), false);
  });

  it("should reject invalid layer", () => {
    _logger.debug("Testing validateBothValues with invalid layer");

    assertEquals(_factory.validateBothValues("to", "invalid"), false);
  });

  it("should reject both invalid", () => {
    _logger.debug("Testing validateBothValues with both invalid");

    assertEquals(_factory.validateBothValues("invalid1", "invalid2"), false);
  });

  it("should return false when patterns are not available", () => {
    _logger.debug("Testing validateBothValues with no patterns");

    const noPatternProvider = new UnitTestProvider(null, null);
    const noPatternFactory = new TypeFactory(noPatternProvider);

    assertEquals(noPatternFactory.validateBothValues("to", "project"), false);
  });

  it("should be consistent with createBothTypes success", () => {
    _logger.debug("Testing consistency between validateBothValues and createBothTypes");

    const testCases = [
      ["to", "project"],
      ["summary", "issue"],
      ["defect", "task"],
      ["invalid", "project"],
      ["to", "invalid"],
      ["invalid1", "invalid2"],
    ];

    testCases.forEach(([directive, layer]) => {
      const validationResult = _factory.validateBothValues(directive, layer);
      const creationResult = _factory.createBothTypes(directive, layer);

      assertEquals(validationResult, creationResult.ok);
    });
  });
});

describe("TypeFactory - getPatternAvailability Method", () => {
  it("should report full availability with both patterns", () => {
    _logger.debug("Testing full pattern availability");

    const provider = new UnitTestProvider();
    const _factory = new TypeFactory(provider);

    const availability = _factory.getPatternAvailability();

    assertEquals(availability.directive, true);
    assertEquals(availability.layer, true);
    assertEquals(availability.both, true);
  });

  it("should report partial availability with directive only", () => {
    _logger.debug("Testing directive-only pattern availability");

    const provider = new UnitTestProvider("to|summary|defect", null);
    const _factory = new TypeFactory(provider);

    const availability = _factory.getPatternAvailability();

    assertEquals(availability.directive, true);
    assertEquals(availability.layer, false);
    assertEquals(availability.both, false);
  });

  it("should report partial availability with layer only", () => {
    _logger.debug("Testing layer-only pattern availability");

    const provider = new UnitTestProvider(null, "project|issue|task");
    const _factory = new TypeFactory(provider);

    const availability = _factory.getPatternAvailability();

    assertEquals(availability.directive, false);
    assertEquals(availability.layer, true);
    assertEquals(availability.both, false);
  });

  it("should report no availability with no patterns", () => {
    _logger.debug("Testing no pattern availability");

    const provider = new UnitTestProvider(null, null);
    const _factory = new TypeFactory(provider);

    const availability = _factory.getPatternAvailability();

    assertEquals(availability.directive, false);
    assertEquals(availability.layer, false);
    assertEquals(availability.both, false);
  });
});

describe("TypeFactory - debug Method", () => {
  it("should provide comprehensive debug information", () => {
    _logger.debug("Testing debug information provision");

    const provider = new UnitTestProvider();
    const _factory = new TypeFactory(provider);

    const debugInfo = _factory.debug();

    assertExists(debugInfo.patternProvider);
    assertExists(debugInfo.availability);
    assertEquals(typeof debugInfo.patternProvider, "string");
    assertEquals(debugInfo.patternProvider, "UnitTestProvider");

    // Availability should match getPatternAvailability
    const availability = _factory.getPatternAvailability();
    assertEquals(debugInfo.availability.directive, availability.directive);
    assertEquals(debugInfo.availability.layer, availability.layer);
    assertEquals(debugInfo.availability.both, availability.both);
  });

  it("should reflect current state accurately", () => {
    _logger.debug("Testing debug information accuracy");

    const noPatternProvider = new UnitTestProvider(null, null);
    const noPatternFactory = new TypeFactory(noPatternProvider);

    const debugInfo = noPatternFactory.debug();

    assertEquals(debugInfo.availability.directive, false);
    assertEquals(debugInfo.availability.layer, false);
    assertEquals(debugInfo.availability.both, false);
  });
});
