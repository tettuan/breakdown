/**
 * Structure tests for TwoParams_Result and comprehensive validation patterns
 *
 * These tests verify the structural integrity of the new TwoParams_Result type
 * and ensure proper integration with the Totality pattern implementation.
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  DirectiveType,
  LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  TypeFactory,
  type TypePatternProvider,
} from "../types/mod.ts";
import {
  type PromptCliOptions,
  type TotalityPromptCliParams,
  TotalityPromptVariablesFactory,
  type TwoParams_Result,
} from "./prompt_variables__factory.ts";

const logger = new BreakdownLogger("two-params-structure");

/**
 * Configurable pattern provider for testing different scenarios
 */
class ConfigurablePatternProvider implements TypePatternProvider {
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

  // For testing pattern modifications
  setDirectivePattern(pattern: string | null) {
    this.directivePattern = pattern;
  }

  setLayerPattern(pattern: string | null) {
    this.layerPattern = pattern;
  }
}

describe("TwoParams_Result - Type Structure Validation", () => {
  let provider: ConfigurablePatternProvider;
  let factory: TypeFactory;

  beforeEach(() => {
    provider = new ConfigurablePatternProvider();
    factory = new TypeFactory(provider);
  });

  it("should maintain strict type structure for TwoParams_Result", async () => {
    logger.debug("Testing TwoParams_Result type structure");

    const typesResult = _factory.createBothTypes("to", "project");
    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      const twoParamsResult: TwoParams_Result = {
        type: "two",
        params: ["to", "project"],
        demonstrativeType: typesResult.data.directive.value,
        layerType: typesResult.data.layer.value,
        options: {
          fromFile: "input.md",
          destinationFile: "output.md",
          adaptation: "strict",
          extended: true,
          customValidation: false,
          errorFormat: "detailed",
        },
      };

      // Verify structure integrity
      assertEquals(twoParamsResult.type, "two");
      assertEquals(twoParamsResult.params, ["to", "project"]);
      assertEquals(twoParamsResult.demonstrativeType, "to");
      assertEquals(twoParamsResult.layerType, "project");
      assertExists(twoParamsResult.options);

      // Verify option types
      assertEquals(typeof twoParamsResult.options.fromFile, "string");
      assertEquals(typeof twoParamsResult.options.destinationFile, "string");
      assertEquals(typeof twoParamsResult.options.adaptation, "string");
      assertEquals(typeof twoParamsResult.options.extended, "boolean");
      assertEquals(typeof twoParamsResult.options.customValidation, "boolean");
      assertEquals(twoParamsResult.options.errorFormat, "detailed");
    }
  });

  it("should enforce type safety for PromptCliOptions", async () => {
    logger.debug("Testing PromptCliOptions type safety");

    const validOptions: PromptCliOptions = {
      fromFile: "test.md",
      destinationFile: "output/",
      adaptation: "strict",
      promptDir: "custom_prompts/",
      fromLayerType: "project",
      input_text: "sample text",
      customVariables: { "var1": "value1", "var2": "value2" },
      extended: true,
      customValidation: false,
      errorFormat: "json",
      config: "production",
    };

    // All properties should be optional
    const minimalOptions: PromptCliOptions = {};

    // Error format should be constrained
    const constrainedFormats: Array<PromptCliOptions["errorFormat"]> = [
      "simple",
      "detailed",
      "json",
      undefined,
    ];

    constrainedFormats.forEach((format) => {
      const options: PromptCliOptions = { errorFormat: format };
      if (format) {
        assertEquals(["simple", "detailed", "json"].includes(format), true);
      }
    });
  });

  it("should maintain type consistency across parameter structures", async () => {
    logger.debug("Testing type consistency across parameter structures");

    const typesResult = _factory.createBothTypes("summary", "issue");
    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {
          fromFile: "input.md",
          destinationFile: "output.md",
        },
      };

      const totalityFactory = await TotalityPromptVariablesFactory.create(params);

      // Verify type preservation
      assertEquals(totalityFactory.directive.getValue(), "summary");
      assertEquals(totalityFactory.layer.getValue(), "issue");
      assertEquals(totalityFactory.directive.equals(params.directive), true);
      assertEquals(totalityFactory.layer.equals(params.layer), true);
    }
  });
});

describe("TwoParams_Result - Validation Pattern Integration", () => {
  it("should integrate with all directive validation patterns", async () => {
    logger.debug("Testing directive pattern integration");

    const customPatterns = [
      "web|api|db",
      "read|write|update|delete",
      "create|edit|remove|archive",
      "alpha|beta|gamma|delta",
    ];

    customPatterns.forEach((pattern) => {
      const provider = new ConfigurablePatternProvider(pattern, "project|issue|task");
      const _factory = new TypeFactory(provider);

      const directives = pattern.split("|");
      directives.forEach((directive) => {
        const result = _factory.createDirectiveType(directive);
        assertEquals(result.ok, true);

        if (result.ok) {
          assertEquals(result.data.getValue(), directive);
        }
      });
    });
  });

  it("should integrate with all layer validation patterns", async () => {
    logger.debug("Testing layer pattern integration");

    const customPatterns = [
      "service|controller|model",
      "frontend|backend|database",
      "unit|integration|system",
      "dev|staging|production",
    ];

    customPatterns.forEach((pattern) => {
      const provider = new ConfigurablePatternProvider("to|summary", pattern);
      const _factory = new TypeFactory(provider);

      const layers = pattern.split("|");
      layers.forEach((layer) => {
        const result = _factory.createLayerType(layer);
        assertEquals(result.ok, true);

        if (result.ok) {
          assertEquals(result.data.getValue(), layer);
        }
      });
    });
  });

  it("should handle pattern validation failures gracefully", async () => {
    logger.debug("Testing pattern validation failure handling");

    // Test with restrictive patterns
    const restrictiveProvider = new ConfigurablePatternProvider("only_one", "single");
    const restrictiveFactory = new TypeFactory(restrictiveProvider);

    // Valid values should work
    const validDirective = restrictiveFactory.createDirectiveType("only_one");
    const validLayer = restrictiveFactory.createLayerType("single");

    assertEquals(validDirective.ok, true);
    assertEquals(validLayer.ok, true);

    // Invalid values should fail
    const invalidDirective = restrictiveFactory.createDirectiveType("to");
    const invalidLayer = restrictiveFactory.createLayerType("project");

    assertEquals(invalidDirective.ok, false);
    assertEquals(invalidLayer.ok, false);

    if (!invalidDirective.ok && !invalidLayer.ok) {
      assertEquals(invalidDirective.error.kind, "ValidationFailed");
      assertEquals(invalidLayer.error.kind, "ValidationFailed");
    }
  });
});

describe("TwoParams_Result - Factory Integration Patterns", () => {
  it("should support all _factory creation patterns", async () => {
    logger.debug("Testing comprehensive _factory creation patterns");

    const provider = new ConfigurablePatternProvider();
    const _factory = new TypeFactory(provider);

    // Standard combinations
    const standardCombinations = [
      ["to", "project"],
      ["summary", "issue"],
      ["defect", "task"],
      ["init", "bugs"],
      ["find", "temp"],
    ];

    for (const [directive, layer] of standardCombinations) {
      const typesResult = _factory.createBothTypes(directive, layer);
      assertEquals(typesResult.ok, true);

      if (typesResult.ok) {
        const params: TotalityPromptCliParams = {
          directive: typesResult.data.directive,
          layer: typesResult.data.layer,
          options: {},
        };

        const totalityFactory = await TotalityPromptVariablesFactory.create(params);

        // Verify factory creation success
        assertExists(totalityFactory);
        assertEquals(totalityFactory.directive.getValue(), directive);
        assertEquals(totalityFactory.layer.getValue(), layer);
      }
    }
  });

  it("should handle complex option combinations", async () => {
    logger.debug("Testing complex option combinations");

    const provider = new ConfigurablePatternProvider();
    const _factory = new TypeFactory(provider);
    const typesResult = _factory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      const complexOptions: PromptCliOptions = {
        fromFile: "complex_input.md",
        destinationFile: "complex/output/path.md",
        adaptation: "complex_adaptation",
        promptDir: "custom/prompts/",
        fromLayerType: "epic",
        input_text: "Complex input text with special characters: äöü",
        customVariables: {
          "project-name": "complex-project",
          "version": "2.1.0-beta",
          "environment": "staging",
          "feature-flag": "enabled",
        },
        extended: true,
        customValidation: true,
        errorFormat: "json",
        config: "complex-production",
      };

      const params: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: complexOptions,
      };

      const totalityFactory = await TotalityPromptVariablesFactory.create(params);

      // Verify complex options preservation
      const retrievedOptions = totalityFactory.getOptions();
      assertEquals(retrievedOptions.fromFile, complexOptions.fromFile);
      assertEquals(retrievedOptions.destinationFile, complexOptions.destinationFile);
      assertEquals(retrievedOptions.adaptation, complexOptions.adaptation);
      assertEquals(retrievedOptions.extended, complexOptions.extended);
      assertEquals(retrievedOptions.customValidation, complexOptions.customValidation);
      assertEquals(retrievedOptions.errorFormat, complexOptions.errorFormat);

      // Verify custom variables
      const customVars = totalityFactory.customVariables;
      assertEquals(customVars["project-name"], "complex-project");
      assertEquals(customVars["version"], "2.1.0-beta");
      assertEquals(customVars["environment"], "staging");
      assertEquals(customVars["feature-flag"], "enabled");
    }
  });

  it("should maintain immutability of TwoParams_Result instances", async () => {
    logger.debug("Testing TwoParams_Result immutability");

    const provider = new ConfigurablePatternProvider();
    const _factory = new TypeFactory(provider);
    const typesResult = _factory.createBothTypes("summary", "issue");

    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      const originalParams: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {
          fromFile: "original.md",
          extended: false,
        },
      };

      const factory1 = await TotalityPromptVariablesFactory.create(originalParams);
      const factory2 = await TotalityPromptVariablesFactory.create(originalParams);

      // Both factories should have identical but independent parameter sets
      assertEquals(factory1.directive.equals(factory2.directive), true);
      assertEquals(factory1.layer.equals(factory2.layer), true);
      assertEquals(factory1.extended, factory2.extended);

      // Verify deep equality of options
      assertEquals(
        JSON.stringify(factory1.getOptions()),
        JSON.stringify(factory2.getOptions()),
      );

      // Parameters should be immutable
      assertEquals(typeof (originalParams.directive as any).setValue, "undefined");
      assertEquals(typeof (originalParams.layer as any).setValue, "undefined");
    }
  });
});

describe("TwoParams_Result - Error Boundary Testing", () => {
  it("should handle all error scenarios without exceptions", async () => {
    logger.debug("Testing comprehensive error boundary handling");

    // Test all possible error conditions
    const errorScenarios = [
      {
        provider: new ConfigurablePatternProvider(null, "project|issue"),
        directive: "to",
        layer: "project",
        expectedError: "PatternNotFound",
      },
      {
        provider: new ConfigurablePatternProvider("to|summary", null),
        directive: "to",
        layer: "project",
        expectedError: "PatternNotFound",
      },
      {
        provider: new ConfigurablePatternProvider("to|summary", "project|issue"),
        directive: "invalid",
        layer: "project",
        expectedError: "ValidationFailed",
      },
      {
        provider: new ConfigurablePatternProvider("to|summary", "project|issue"),
        directive: "to",
        layer: "invalid",
        expectedError: "ValidationFailed",
      },
    ];

    errorScenarios.forEach((scenario, index) => {
      const _factory = new TypeFactory(scenario.provider);
      const result = _factory.createBothTypes(scenario.directive, scenario.layer);

      assertEquals(result.ok, false, `Scenario ${index} should fail`);

      if (!result.ok) {
        assertEquals(result.error.kind, scenario.expectedError);
        // Note: TypeCreationError uses discriminated union, checking available properties
        assertExists((result.error as any).value || (result.error as any).message);
      }
    });
  });

  it("should provide comprehensive error information", async () => {
    logger.debug("Testing comprehensive error information provision");

    const provider = new ConfigurablePatternProvider("to|summary", "project|issue");
    const _factory = new TypeFactory(provider);

    // Test validation failure with detailed error info
    const result = _factory.createBothTypes("invalid_directive", "invalid_layer");
    assertEquals(result.ok, false);

    if (!result.ok) {
      assertEquals(result.error.kind, "ValidationFailed");

      // Error should include the invalid value
      const errorWithValue = result.error as any;
      assertEquals(errorWithValue.value, "invalid_directive");
      assertExists(errorWithValue.pattern);
    }
  });
});
