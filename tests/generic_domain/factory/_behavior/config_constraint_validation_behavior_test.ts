/**
 * Unit tests for Config constraint validation with Totality patterns
 *
 * These tests verify that configuration validation follows Totality principles,
 * ensuring all configuration states are handled explicitly and errors are
 * represented as values rather than exceptions.
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
} from "../types/mod.ts";
import {
  type TotalityPromptCliParams,
  TotalityPromptVariablesFactory,
} from "./prompt_variables_factory.ts";

const logger = new BreakdownLogger("config-constraint-validation");

/**
 * Mock configuration provider for testing various config states
 */
class MockConfigProvider implements TypePatternProvider {
  constructor(
    private directivePattern: string | null = "to|summary|defect|init|find",
    private layerPattern: string | null = "project|issue|task|bugs|temp",
    private validatePatternString = true,
  ) {}

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    if (!this.directivePattern) return null;

    if (!this.validatePatternString) {
      // Return invalid pattern to test error handling
      return null;
    }

    return TwoParamsDirectivePattern.create(this.directivePattern);
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    if (!this.layerPattern) return null;

    if (!this.validatePatternString) {
      // Return invalid pattern to test error handling
      return null;
    }

    return TwoParamsLayerTypePattern.create(this.layerPattern);
  }

  // Test helpers
  setDirectivePattern(pattern: string | null) {
    this.directivePattern = pattern;
  }

  setLayerPattern(pattern: string | null) {
    this.layerPattern = pattern;
  }

  setValidatePatternString(validate: boolean) {
    this.validatePatternString = validate;
  }
}

/**
 * Creates test configuration with various constraint scenarios
 */
function createTestConfig(scenario: {
  hasPromptDir?: boolean;
  hasSchemaDir?: boolean;
  promptDirValue?: string;
  schemaDirValue?: string;
  hasParams?: boolean;
  directivePattern?: string;
  layerPattern?: string;
}): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  if (scenario.hasPromptDir) {
    config.app_prompt = {
      base_dir: scenario.promptDirValue ?? "lib/prompts",
    };
  }

  if (scenario.hasSchemaDir) {
    config.app_schema = {
      base_dir: scenario.schemaDirValue ?? "lib/schemas",
    };
  }

  if (scenario.hasParams) {
    config.params = {
      two: {
        demonstrativeType: {
          pattern: scenario.directivePattern ?? "to|summary|defect",
        },
        layerType: {
          pattern: scenario.layerPattern ?? "project|issue|task",
        },
      },
    };
  }

  return config;
}

describe("Config Constraint Validation - Pattern Validation", () => {
  it("should validate all directive pattern constraint scenarios", () => {
    logger.debug("Testing directive pattern constraint validation");

    const patternScenarios = [
      { pattern: "to|summary|defect", valid: true, description: "Standard patterns" },
      { pattern: "web|api|db", valid: true, description: "Custom patterns" },
      { pattern: "alpha", valid: true, description: "Single pattern" },
      { pattern: "", valid: false, description: "Empty pattern" },
      { pattern: "to|", valid: true, description: "Trailing separator" },
      { pattern: "|to", valid: true, description: "Leading separator" },
      { pattern: "to||summary", valid: true, description: "Double separator" },
      { pattern: "to|summary|to", valid: true, description: "Duplicate values" },
      { pattern: "special-chars_123", valid: true, description: "Special characters" },
      { pattern: "UPPERCASE|lowercase|MiXeD", valid: true, description: "Case variations" },
    ];

    patternScenarios.forEach((scenario) => {
      const provider = new MockConfigProvider(scenario.pattern, "project|issue|task");
      const factory = new TypeFactory(provider);
      const availability = factory.getPatternAvailability();

      // Pattern availability should reflect pattern validity
      if (scenario.valid && scenario.pattern) {
        assertEquals(availability.directive, true, `${scenario.description} should be valid`);
      } else {
        assertEquals(availability.directive, false, `${scenario.description} should be invalid`);
      }
    });
  });

  it("should validate all layer pattern constraint scenarios", () => {
    logger.debug("Testing layer pattern constraint validation");

    const layerScenarios = [
      { pattern: "project|issue|task", valid: true, description: "Standard hierarchy" },
      { pattern: "service|controller|model", valid: true, description: "MVC patterns" },
      { pattern: "dev|staging|prod", valid: true, description: "Environment patterns" },
      { pattern: "unit|integration|e2e", valid: true, description: "Test patterns" },
      { pattern: "", valid: false, description: "Empty pattern" },
      { pattern: "single", valid: true, description: "Single layer" },
      { pattern: "layer-with-dashes", valid: true, description: "Dashes allowed" },
      { pattern: "layer_with_underscores", valid: true, description: "Underscores allowed" },
      { pattern: "layer123", valid: true, description: "Numbers allowed" },
      { pattern: "LAYER|layer|Layer", valid: true, description: "Case variations allowed" },
    ];

    layerScenarios.forEach((scenario) => {
      const provider = new MockConfigProvider("to|summary|defect", scenario.pattern);
      const factory = new TypeFactory(provider);
      const availability = factory.getPatternAvailability();

      // Pattern availability should reflect pattern validity
      if (scenario.valid && scenario.pattern) {
        assertEquals(availability.layer, true, `${scenario.description} should be valid`);
      } else {
        assertEquals(availability.layer, false, `${scenario.description} should be invalid`);
      }
    });
  });

  it("should handle pattern combination constraint scenarios", () => {
    logger.debug("Testing pattern combination constraints");

    const combinationScenarios = [
      {
        directive: "to|summary",
        layer: "project|issue",
        expected: { directive: true, layer: true, both: true },
        description: "Both patterns valid",
      },
      {
        directive: "to|summary",
        layer: null,
        expected: { directive: true, layer: false, both: false },
        description: "Only directive valid",
      },
      {
        directive: null,
        layer: "project|issue",
        expected: { directive: false, layer: true, both: false },
        description: "Only layer valid",
      },
      {
        directive: null,
        layer: null,
        expected: { directive: false, layer: false, both: false },
        description: "Neither pattern valid",
      },
    ];

    combinationScenarios.forEach((scenario) => {
      const provider = new MockConfigProvider(scenario.directive, scenario.layer);
      const factory = new TypeFactory(provider);
      const availability = factory.getPatternAvailability();

      assertEquals(availability.directive, scenario.expected.directive, scenario.description);
      assertEquals(availability.layer, scenario.expected.layer, scenario.description);
      assertEquals(availability.both, scenario.expected.both, scenario.description);
    });
  });
});

describe("Config Constraint Validation - Directory Validation", () => {
  it("should validate all directory configuration constraint scenarios", () => {
    logger.debug("Testing directory configuration constraints");

    const directoryScenarios = [
      {
        config: createTestConfig({
          hasPromptDir: true,
          hasSchemaDir: true,
          promptDirValue: "lib/prompts",
          schemaDirValue: "lib/schemas",
        }),
        expectValid: true,
        description: "Both directories configured",
      },
      {
        config: createTestConfig({
          hasPromptDir: true,
          hasSchemaDir: false,
          promptDirValue: "lib/prompts",
        }),
        expectValid: true, // PromptVariablesFactory may still work
        description: "Only prompt directory configured",
      },
      {
        config: createTestConfig({
          hasPromptDir: false,
          hasSchemaDir: true,
          schemaDirValue: "lib/schemas",
        }),
        expectValid: false, // Prompt directory required
        description: "Only schema directory configured",
      },
      {
        config: createTestConfig({
          hasPromptDir: false,
          hasSchemaDir: false,
        }),
        expectValid: false,
        description: "No directories configured",
      },
      {
        config: createTestConfig({
          hasPromptDir: true,
          hasSchemaDir: true,
          promptDirValue: "",
          schemaDirValue: "lib/schemas",
        }),
        expectValid: false, // Empty prompt directory
        description: "Empty prompt directory",
      },
      {
        config: createTestConfig({
          hasPromptDir: true,
          hasSchemaDir: true,
          promptDirValue: "   ", // Whitespace only
          schemaDirValue: "lib/schemas",
        }),
        expectValid: false, // Whitespace-only prompt directory
        description: "Whitespace-only prompt directory",
      },
    ];

    for (const scenario of directoryScenarios) {
      const provider = new MockConfigProvider();
      const factory = new TypeFactory(provider);
      const typesResult = factory.createBothTypes("to", "project");

      assertEquals(typesResult.ok, true);

      if (typesResult.ok) {
        const params: TotalityPromptCliParams = {
          directive: typesResult.data.directive,
          layer: typesResult.data.layer,
          options: {},
        };

        // Create factory with custom config
        const totalityFactory = TotalityPromptVariablesFactory.createWithConfig(
          scenario.config,
          params,
        );

        const hasValidBaseDir = totalityFactory.hasValidBaseDir();
        const baseDirError = totalityFactory.getBaseDirError();

        if (scenario.expectValid) {
          assertEquals(hasValidBaseDir, true, `${scenario.description} should be valid`);
          assertEquals(baseDirError, undefined, `${scenario.description} should not have error`);
        } else {
          assertEquals(hasValidBaseDir, false, `${scenario.description} should be invalid`);
          assertExists(baseDirError, `${scenario.description} should have error`);
        }
      }
    }
  });

  it("should validate directory path constraint patterns", () => {
    logger.debug("Testing directory path constraint patterns");

    const pathScenarios = [
      { path: "lib/prompts", valid: true, description: "Relative path" },
      { path: "/absolute/path/prompts", valid: true, description: "Absolute path" },
      { path: "./relative/prompts", valid: true, description: "Explicit relative path" },
      { path: "../parent/prompts", valid: true, description: "Parent directory path" },
      { path: "prompts", valid: true, description: "Simple directory name" },
      { path: "prompts/sub/deep", valid: true, description: "Deep directory structure" },
      { path: "prompts-with-dashes", valid: true, description: "Dashes in path" },
      { path: "prompts_with_underscores", valid: true, description: "Underscores in path" },
      { path: "prompts123", valid: true, description: "Numbers in path" },
      // Note: Empty and whitespace paths tested in previous test
    ];

    for (const scenario of pathScenarios) {
      const config = createTestConfig({
        hasPromptDir: true,
        hasSchemaDir: true,
        promptDirValue: scenario.path,
        schemaDirValue: "lib/schemas",
      });

      const provider = new MockConfigProvider();
      const factory = new TypeFactory(provider);
      const typesResult = factory.createBothTypes("to", "project");

      assertEquals(typesResult.ok, true);

      if (typesResult.ok) {
        const params: TotalityPromptCliParams = {
          directive: typesResult.data.directive,
          layer: typesResult.data.layer,
          options: {},
        };

        const totalityFactory = TotalityPromptVariablesFactory.createWithConfig(config, params);
        const hasValidBaseDir = totalityFactory.hasValidBaseDir();

        assertEquals(hasValidBaseDir, scenario.valid, `${scenario.description} validity`);
      }
    }
  });
});

describe("Config Constraint Validation - Parameter Integration", () => {
  it("should validate parameter constraint integration scenarios", () => {
    logger.debug("Testing parameter constraint integration");

    const integrationScenarios = [
      {
        config: createTestConfig({
          hasParams: true,
          directivePattern: "to|summary|defect",
          layerPattern: "project|issue|task",
        }),
        testValues: { directive: "to", layer: "project" },
        expectValid: true,
        description: "Standard parameter integration",
      },
      {
        config: createTestConfig({
          hasParams: true,
          directivePattern: "custom|special",
          layerPattern: "alpha|beta",
        }),
        testValues: { directive: "custom", layer: "alpha" },
        expectValid: true,
        description: "Custom parameter integration",
      },
      {
        config: createTestConfig({
          hasParams: true,
          directivePattern: "to|summary",
          layerPattern: "project|issue",
        }),
        testValues: { directive: "defect", layer: "project" },
        expectValid: false, // defect not in pattern
        description: "Directive outside pattern",
      },
      {
        config: createTestConfig({
          hasParams: true,
          directivePattern: "to|summary",
          layerPattern: "project|issue",
        }),
        testValues: { directive: "to", layer: "task" },
        expectValid: false, // task not in pattern
        description: "Layer outside pattern",
      },
      {
        config: createTestConfig({
          hasParams: false,
        }),
        testValues: { directive: "to", layer: "project" },
        expectValid: true, // Should use defaults
        description: "No parameter configuration (use defaults)",
      },
    ];

    integrationScenarios.forEach((scenario) => {
      // Create provider that uses config patterns
      class ConfigBasedProvider implements TypePatternProvider {
        constructor(private config: Record<string, unknown>) {}

        getDirectivePattern() {
          const pattern = (this.config.params as any)?.two?.demonstrativeType
            ?.pattern as string;
          return pattern
            ? TwoParamsDirectivePattern.create(pattern)
            : TwoParamsDirectivePattern.create("to|summary|defect|init|find");
        }

        getLayerTypePattern() {
          const pattern = (this.config.params as any)?.two?.layerType?.pattern as string;
          return pattern
            ? TwoParamsLayerTypePattern.create(pattern)
            : TwoParamsLayerTypePattern.create("project|issue|task|bugs|temp");
        }
      }

      const provider = new ConfigBasedProvider(scenario.config);
      const factory = new TypeFactory(provider);

      const result = factory.createBothTypes(
        scenario.testValues.directive,
        scenario.testValues.layer,
      );

      assertEquals(result.ok, scenario.expectValid, scenario.description);

      if (scenario.expectValid && result.ok) {
        assertEquals(result.data.directive.getValue(), scenario.testValues.directive);
        assertEquals(result.data.layer.getValue(), scenario.testValues.layer);
      } else if (!scenario.expectValid && !result.ok) {
        assertEquals(result.error.kind, "ValidationFailed");
      }
    });
  });

  it("should handle configuration constraint edge cases", () => {
    logger.debug("Testing configuration constraint edge cases");

    const edgeCases = [
      {
        config: createTestConfig({
          hasParams: true,
          directivePattern: "", // Empty pattern
          layerPattern: "project|issue",
        }),
        description: "Empty directive pattern",
        expectDirectiveAvailable: false,
        expectLayerAvailable: true,
      },
      {
        config: createTestConfig({
          hasParams: true,
          directivePattern: "to|summary",
          layerPattern: "", // Empty pattern
        }),
        description: "Empty layer pattern",
        expectDirectiveAvailable: true,
        expectLayerAvailable: false,
      },
      {
        config: {
          params: {
            two: {
              // Missing demonstrativeType
              layerType: {
                pattern: "project|issue",
              },
            },
          },
        },
        description: "Missing directive type configuration",
        expectDirectiveAvailable: true, // Should use default
        expectLayerAvailable: true,
      },
      {
        config: {
          params: {
            two: {
              demonstrativeType: {
                pattern: "to|summary",
              },
              // Missing layerType
            },
          },
        },
        description: "Missing layer type configuration",
        expectDirectiveAvailable: true,
        expectLayerAvailable: true, // Should use default
      },
    ];

    edgeCases.forEach((edgeCase) => {
      class EdgeCaseProvider implements TypePatternProvider {
        constructor(private config: Record<string, unknown>) {}

        getDirectivePattern() {
          const pattern = (this.config.params as any)?.two?.demonstrativeType
            ?.pattern as string;
          if (pattern === "") return null; // Empty pattern
          return pattern
            ? TwoParamsDirectivePattern.create(pattern)
            : TwoParamsDirectivePattern.create("to|summary|defect|init|find");
        }

        getLayerTypePattern() {
          const pattern = (this.config.params as any)?.two?.layerType?.pattern as string;
          if (pattern === "") return null; // Empty pattern
          return pattern
            ? TwoParamsLayerTypePattern.create(pattern)
            : TwoParamsLayerTypePattern.create("project|issue|task|bugs|temp");
        }
      }

      const provider = new EdgeCaseProvider(edgeCase.config);
      const factory = new TypeFactory(provider);
      const availability = factory.getPatternAvailability();

      assertEquals(
        availability.directive,
        edgeCase.expectDirectiveAvailable,
        `${edgeCase.description} - directive availability`,
      );
      assertEquals(
        availability.layer,
        edgeCase.expectLayerAvailable,
        `${edgeCase.description} - layer availability`,
      );
    });
  });
});
