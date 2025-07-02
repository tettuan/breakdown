/**
 * @fileoverview Structure tests for types module (mod.ts)
 *
 * Tests structural constraints and organization:
 * - Export categorization and grouping
 * - Interface segregation compliance
 * - Type composition patterns
 * - Migration path structure
 * - Module organization principles
 *
 * @module types/mod_structure_test
 */

import { assertEquals, assertExists, assertInstanceOf as _assertInstanceOf } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Import all exports to test structure
import * as TypesModule from "./mod.ts";

const _logger = new BreakdownLogger("types-mod-structure");

describe("Structure: Export categorization", () => {
  it("should organize exports into logical categories", () => {
    _logger.debug("Testing export categorization");

    // Category 1: Totality-compliant types
    const totalityTypes = {
      DirectiveType: TypesModule.DirectiveType,
      TwoParamsDirectivePattern: TypesModule.TwoParamsDirectivePattern,
      LayerType: TypesModule.LayerType,
      TwoParamsLayerTypePattern: TypesModule.TwoParamsLayerTypePattern,
      ConfigProfileName: TypesModule.ConfigProfileName,
      TypeFactory: TypesModule.TypeFactory,
    };

    // Category 2: PromptVariables
    const promptVariableTypes = {
      StandardVariable: TypesModule.StandardVariable,
      FilePathVariable: TypesModule.FilePathVariable,
      StdinVariable: TypesModule.StdinVariable,
      UserVariable: TypesModule.UserVariable,
      StandardVariableName: TypesModule.StandardVariableName,
      FilePathVariableName: TypesModule.FilePathVariableName,
      StdinVariableName: TypesModule.StdinVariableName,
    };

    // Category 3: Result types
    const resultTypes = {
      ResultStatus: TypesModule.ResultStatus,
      ok: TypesModule.ok,
      error: TypesModule.error,
      isOk: TypesModule.isOk,
      isError: TypesModule.isError,
    };

    // Category 4: Configuration types
    const configTypes = {
      ConfigError: TypesModule.ConfigError,
      ParamsCustomConfig: TypesModule.ParamsCustomConfig,
    };

    // Verify all categories are properly exported
    Object.entries(totalityTypes).forEach(([name, value]) => {
      assertExists(value, `Totality type ${name} must be exported`);
    });

    Object.entries(promptVariableTypes).forEach(([name, value]) => {
      assertExists(value, `PromptVariable type ${name} must be exported`);
    });

    Object.entries(resultTypes).forEach(([name, value]) => {
      assertExists(value, `Result type ${name} must be exported`);
    });

    Object.entries(configTypes).forEach(([name, value]) => {
      assertExists(value, `Config type ${name} must be exported`);
    });

    _logger.debug("Export categorization verified");
  });

  it("should maintain clear separation between new and legacy types", () => {
    _logger.debug("Testing new/legacy type separation");

    // New types should be classes with static create methods
    const newTypes = [
      TypesModule.DirectiveType,
      TypesModule.LayerType,
      TypesModule.ConfigProfileName,
    ];

    for (const Type of newTypes) {
      assertExists(Type, "New type must be exported");
      assertEquals(typeof Type, "function", "New type should be a class");
      assertEquals(typeof Type.create, "function", "New type should have static create method");
    }

    // Legacy factories should be separate
    const legacyFactories = [
      TypesModule.DemonstrativeTypeFactory,
      TypesModule.LegacyLayerTypeFactory,
    ];

    for (const Factory of legacyFactories) {
      assertExists(Factory, "Legacy factory must be exported");
      assertEquals(typeof Factory, "object", "Legacy factory should be an object");
    }

    _logger.debug("New/legacy separation verified");
  });
});

describe("Structure: Interface segregation", () => {
  it("should provide focused interfaces for different use cases", () => {
    _logger.debug("Testing interface segregation");

    // Type creation interface
    assertExists(TypesModule.TypeFactory, "TypeFactory for type creation");
    // TypePatternProvider, TypeCreationResult, TypeCreationError are type interfaces, not runtime values
    // They exist at compile-time only

    // PromptVariables interface
    // PromptVariable and PromptVariables are type interfaces, not runtime values
    assertExists(TypesModule.toPromptParamsVariables, "Conversion function");
    assertExists(TypesModule.createPromptParams, "Factory function");

    // Result handling interface
    const resultInterface = [
      TypesModule.ok,
      TypesModule.error,
      TypesModule.isOk,
      TypesModule.isError,
      TypesModule.map,
      TypesModule.chain,
      TypesModule.getOrElse,
      TypesModule.all,
    ];

    resultInterface.forEach((fn) => {
      assertEquals(typeof fn, "function", "Result interface should export functions");
    });

    _logger.debug("Interface segregation verified");
  });

  it("should not mix concerns between different type categories", () => {
    _logger.debug("Testing concern separation");

    // DirectiveType should not know about LayerType internals
    const directive = TypesModule.DirectiveType.create({
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      options: {},
      params: ["to", "project"],
    });

    // LayerType should not know about DirectiveType internals
    const layer = TypesModule.LayerType.create({
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      options: {},
      params: ["to", "project"],
    });

    // ConfigProfileName should be independent
    const profile = TypesModule.ConfigProfileName.create("production");

    // Each type should be self-contained
    assertExists(directive.value, "DirectiveType should have value property");
    assertExists(layer.value, "LayerType should have value property");
    assertExists(profile.value, "ConfigProfileName should have value property");

    _logger.debug("Concern separation verified");
  });
});

describe("Structure: Type composition patterns", () => {
  it("should support type composition through TypeFactory", () => {
    _logger.debug("Testing type composition");

    // TypeFactory should compose multiple types
    const patternProvider = {
      getDirectivePattern: () => TypesModule.TwoParamsDirectivePattern.create("to|summary|defect"),
      getLayerTypePattern: () => TypesModule.TwoParamsLayerTypePattern.create("project|issue|task"),
    };

    const _factory = new TypesModule.TypeFactory(patternProvider);

    // Should support creating individual types
    assertExists(_factory.createDirectiveType, "Factory should create DirectiveType");
    assertExists(_factory.createLayerType, "Factory should create LayerType");

    // Should support creating composite types
    assertExists(_factory.createBothTypes, "Factory should create both types");

    _logger.debug("Type composition verified");
  });

  it("should enable variable composition for prompts", () => {
    _logger.debug("Testing variable composition");

    // Different variable types should compose into PromptVariables
    const standardVarResult = TypesModule.StandardVariable.create(
      "destination_path",
      "output.md",
    );
    const standardVar = standardVarResult.ok ? standardVarResult.data : null;
    assertExists(standardVar);

    const filePathVarResult = TypesModule.FilePathVariable.create(
      "schema_file",
      "/path/to/schema.json",
    );
    const filePathVar = filePathVarResult.ok ? filePathVarResult.data : null;
    assertExists(filePathVar);

    const stdinVarResult = TypesModule.StdinVariable.create(
      "input_text",
      "stdin content",
    );
    const stdinVar = stdinVarResult.ok ? stdinVarResult.data : null;
    assertExists(stdinVar);

    const userVarResult = TypesModule.UserVariable.create(
      "custom-key",
      "custom-value",
    );
    const userVar = userVarResult.ok ? userVarResult.data : null;
    assertExists(userVar);

    // All should implement PromptVariableBase interface
    const variables = [standardVar, filePathVar, stdinVar, userVar];

    variables.forEach((v) => {
      if (v) {
        assertExists(v.toRecord, "Variable should have toRecord method");
        assertEquals(typeof v.toRecord, "function", "toRecord should be a function");
      }
    });

    _logger.debug("Variable composition verified");
  });
});

describe("Structure: Migration path structure", () => {
  it("should provide clear migration path from legacy to new types", () => {
    _logger.debug("Testing migration path structure");

    // Legacy type (object with kind and value)
    type OldDemonstrativeType = TypesModule.DemonstrativeType;

    // Migration path through factory
    const legacyFactory = TypesModule.DemonstrativeTypeFactory;
    const created = legacyFactory.fromString("to");
    assertExists(created, "Legacy factory should create type from string");
    assertEquals(created?.value, "to", "Should preserve value");
    assertEquals(created?.kind, "to", "Should have correct kind");

    // New type (class with validation)
    const newType = TypesModule.DirectiveType.create({
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["param1", "param2"],
      options: {},
    });

    assertExists(newType, "Should create new type from old value");
    assertEquals(newType.value, "to", "Should preserve value during migration");

    _logger.debug("Migration path verified");
  });

  it("should maintain compatibility through type guards", () => {
    _logger.debug("Testing type guard compatibility");

    // Legacy guards for runtime checks
    const demonstrativeGuards = TypesModule.DemonstrativeTypeGuards;
    const layerGuards = TypesModule.LegacyLayerTypeGuards;

    // Should work with valid type objects
    const toType = { kind: "to" as const, value: "to" as const };
    const summaryType = { kind: "summary" as const, value: "summary" as const };
    const defectType = { kind: "defect" as const, value: "defect" as const };

    assertEquals(demonstrativeGuards.isTo(toType), true);
    assertEquals(demonstrativeGuards.isSummary(summaryType), true);
    assertEquals(demonstrativeGuards.isDefect(defectType), true);

    const projectType = { kind: "project" as const, value: "project" as const };
    const issueType = { kind: "issue" as const, value: "issue" as const };
    const taskType = { kind: "task" as const, value: "task" as const };

    assertEquals(layerGuards.isProject(projectType), true);
    assertEquals(layerGuards.isIssue(issueType), true);
    assertEquals(layerGuards.isTask(taskType), true);

    // Should reject invalid values
    const invalidDemo = { kind: "invalid", value: "invalid" } as unknown;
    const invalidLayer = { kind: "invalid", value: "invalid" } as unknown;
    assertEquals(demonstrativeGuards.isTo(invalidDemo), false);
    assertEquals(layerGuards.isProject(invalidLayer), false);

    _logger.debug("Type guard compatibility verified");
  });
});

describe("Structure: Module organization principles", () => {
  it("should follow single responsibility principle", () => {
    _logger.debug("Testing single responsibility");

    // Each exported type should have a single, clear responsibility
    const responsibilities = {
      DirectiveType: "Represents validated directive/demonstrative type",
      LayerType: "Represents validated layer type",
      ConfigProfileName: "Represents validated config profile name",
      TypeFactory: "Creates and validates types",
      StandardVariable: "Represents standard prompt variable",
      FilePathVariable: "Represents file path variable",
      StdinVariable: "Represents stdin variable",
      UserVariable: "Represents user-defined variable",
      ResultStatus: "Enumerates result states",
      ConfigError: "Represents configuration errors",
      ParamsCustomConfig: "Manages custom parameter configuration",
    };

    Object.entries(responsibilities).forEach(([type, responsibility]) => {
      assertExists(
        (TypesModule as Record<string, unknown>)[type],
        `${type} should exist for responsibility: ${responsibility}`,
      );
    });

    _logger.debug("Single responsibility verified");
  });

  it("should minimize coupling between exported types", () => {
    _logger.debug("Testing loose coupling");

    // Types should be usable independently

    // DirectiveType without LayerType
    const directive = TypesModule.DirectiveType.create({
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      options: {},
      params: ["to", "project"],
    });
    assertExists(directive, "DirectiveType should work independently");

    // LayerType without DirectiveType
    const layer = TypesModule.LayerType.create({
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      options: {},
      params: ["to", "project"],
    });
    assertExists(layer, "LayerType should work independently");

    // ConfigProfileName without other types
    const profile = TypesModule.ConfigProfileName.create("test");
    assertExists(profile, "ConfigProfileName should work independently");

    // PromptVariables without other types
    const variableResult = TypesModule.StandardVariable.create(
      "destination_path",
      "test.md",
    );
    const variable = variableResult.ok ? variableResult.data : null;
    assertExists(variable, "Variables should work independently");

    _logger.debug("Loose coupling verified");
  });

  it("should provide cohesive type system", () => {
    _logger.debug("Testing type system cohesion");

    // All type creation should follow similar patterns
    const typeCreators = [
      TypesModule.DirectiveType,
      TypesModule.LayerType,
      TypesModule.ConfigProfileName,
    ];

    typeCreators.forEach((Type) => {
      // All should have static create method
      assertEquals(typeof Type.create, "function", `${Type.name} should have create method`);

      // All should return instances with value property
      // Test with appropriate parameters for each type
      let instance;
      if (Type === TypesModule.DirectiveType || Type === TypesModule.LayerType) {
        instance = Type.create({
          type: "two",
          demonstrativeType: "to",
          layerType: "project",
          options: {},
          params: ["to", "project"],
        });
      } else if (Type === TypesModule.ConfigProfileName) {
        instance = Type.create("test");
      }
      if (instance) {
        assertExists(instance.value, `${Type.name} instance should have value property`);
      }
    });

    // All Result utilities should follow functional patterns
    const resultUtils = [
      TypesModule.map,
      TypesModule.chain,
      TypesModule.getOrElse,
    ];

    resultUtils.forEach((util) => {
      assertEquals(typeof util, "function", "Result utilities should be functions");
    });

    _logger.debug("Type system cohesion verified");
  });
});
