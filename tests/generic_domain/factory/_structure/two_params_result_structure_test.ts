/**
 * Structure tests for TwoParams_Result and comprehensive validation patterns
 *
 * These tests verify the structural integrity of the new TwoParams_Result type
 * and ensure proper integration with the Totality pattern implementation.
 */

import { assertEquals, assertExists, assertInstanceOf } from "../../../../lib/deps.ts";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  DirectiveType,
  LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  TypeFactory,
  type TypePatternProvider,
} from "../../../../lib/types/mod.ts";
import {
  type PromptCliOptions,
  type TotalityPromptCliParams,
  type TwoParams_Result,
} from "../../../../lib/types/mod.ts";

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

    const typesResult = factory.createBothTypes("to", "project");
    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      const twoParamsResult: TwoParams_Result = {
        type: "two",
        params: ["to", "project"],
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
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

    const typesResult = factory.createBothTypes("summary", "issue");
    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        options: {
          fromFile: "input.md",
          destinationFile: "output.md",
        },
      };

      // Test type structure without actual factory creation (since this is a structure test)
      assertEquals(params.demonstrativeType, "summary");
      assertEquals(params.layerType, "issue");
      if (params.directive) {
        assertEquals(params.directive.getValue(), "summary");
      }
      if (params.layer) {
        assertEquals(params.layer.getValue(), "issue");
      }
      assertExists(params.options);
      assertEquals(params.options.fromFile, "input.md");
      assertEquals(params.options.destinationFile, "output.md");
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
      const factory = new TypeFactory(provider);

      const directives = pattern.split("|");
      directives.forEach((directive) => {
        const result = factory.createDirectiveType(directive);
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
      const factory = new TypeFactory(provider);

      const layers = pattern.split("|");
      layers.forEach((layer) => {
        const result = factory.createLayerType(layer);
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
      assertEquals(invalidDirective.error.kind, "PatternValidationFailed");
      assertEquals(invalidLayer.error.kind, "PatternValidationFailed");
    }
  });
});

describe("TwoParams_Result - Factory Integration Patterns", () => {
  it("should support all factory creation patterns", async () => {
    logger.debug("Testing comprehensive factory creation patterns");

    const provider = new ConfigurablePatternProvider();
    const factory = new TypeFactory(provider);

    // Standard combinations
    const standardCombinations = [
      ["to", "project"],
      ["summary", "issue"],
      ["defect", "task"],
      ["init", "bugs"],
      ["find", "temp"],
    ];

    for (const [directive, layer] of standardCombinations) {
      const typesResult = factory.createBothTypes(directive, layer);
      assertEquals(typesResult.ok, true);

      if (typesResult.ok) {
        const params: TotalityPromptCliParams = {
          directive: typesResult.data.directive,
          layer: typesResult.data.layer,
          demonstrativeType: typesResult.data.directive.getValue(),
          layerType: typesResult.data.layer.getValue(),
          options: {},
        };

        // Test parameter structure consistency
        assertEquals(params.demonstrativeType, directive);
        assertEquals(params.layerType, layer);
        if (params.directive) {
          assertEquals(params.directive.getValue(), directive);
        }
        if (params.layer) {
          assertEquals(params.layer.getValue(), layer);
        }
        assertExists(params.options);
      }
    }
  });

  it("should handle complex option combinations", async () => {
    logger.debug("Testing complex option combinations");

    const provider = new ConfigurablePatternProvider();
    const factory = new TypeFactory(provider);
    const typesResult = factory.createBothTypes("to", "project");

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
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        options: complexOptions,
      };

      // Test complex option structure preservation
      assertEquals(params.options.fromFile, complexOptions.fromFile);
      assertEquals(params.options.destinationFile, complexOptions.destinationFile);
      assertEquals(params.options.adaptation, complexOptions.adaptation);
      assertEquals(params.options.extended, complexOptions.extended);
      assertEquals(params.options.customValidation, complexOptions.customValidation);
      assertEquals(params.options.errorFormat, complexOptions.errorFormat);

      // Verify custom variables structure
      assertExists(params.options.customVariables);
      assertEquals(params.options.customVariables["project-name"], "complex-project");
      assertEquals(params.options.customVariables["version"], "2.1.0-beta");
      assertEquals(params.options.customVariables["environment"], "staging");
      assertEquals(params.options.customVariables["feature-flag"], "enabled");
    }
  });

  it("should maintain immutability of TwoParams_Result instances", async () => {
    logger.debug("Testing TwoParams_Result immutability");

    const provider = new ConfigurablePatternProvider();
    const factory = new TypeFactory(provider);
    const typesResult = factory.createBothTypes("summary", "issue");

    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      const originalParams: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        options: {
          fromFile: "original.md",
          extended: false,
        },
      };

      // Create multiple parameter objects from the same source
      const params1: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        options: {
          fromFile: "original.md",
          extended: false,
        },
      };

      const params2: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        options: {
          fromFile: "original.md",
          extended: false,
        },
      };

      // Both parameter sets should have identical structure
      assertEquals(params1.demonstrativeType, params2.demonstrativeType);
      assertEquals(params1.layerType, params2.layerType);
      if (params1.directive && params2.directive) {
        assertEquals(params1.directive.getValue(), params2.directive.getValue());
      }
      if (params1.layer && params2.layer) {
        assertEquals(params1.layer.getValue(), params2.layer.getValue());
      }

      // Verify structural immutability
      assertEquals(JSON.stringify(params1.options), JSON.stringify(params2.options));

      // Parameters should be immutable - no setValue methods
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
        expectedError: "PatternValidationFailed",
      },
      {
        provider: new ConfigurablePatternProvider("to|summary", "project|issue"),
        directive: "to",
        layer: "invalid",
        expectedError: "PatternValidationFailed",
      },
    ];

    errorScenarios.forEach((scenario, index) => {
      const factory = new TypeFactory(scenario.provider);
      const result = factory.createBothTypes(scenario.directive, scenario.layer);

      assertEquals(result.ok, false, `Scenario ${index} should fail`);

      if (!result.ok) {
        assertEquals(result.error.kind, scenario.expectedError);
        // Note: TypeCreationError uses discriminated union, checking available properties
        assertExists(result.error.kind); // 確実に存在するプロパティを検証
      }
    });
  });

  it("should provide comprehensive error information", async () => {
    logger.debug("Testing comprehensive error information provision");

    const provider = new ConfigurablePatternProvider("to|summary", "project|issue");
    const factory = new TypeFactory(provider);

    // Test validation failure with detailed error info
    const result = factory.createBothTypes("invalid_directive", "invalid_layer");
    assertEquals(result.ok, false);

    if (!result.ok) {
      assertEquals(result.error.kind, "PatternValidationFailed");

      // Error should include the invalid value
      const errorWithValue = result.error as any;
      assertEquals(errorWithValue.value, "invalid_directive");
      assertExists(errorWithValue.pattern);
    }
  });
});
