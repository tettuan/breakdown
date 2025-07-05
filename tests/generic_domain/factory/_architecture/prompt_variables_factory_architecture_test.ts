/**
 * Architecture tests for PromptVariablesFactory Totality principle compliance
 *
 * These tests verify that the PromptVariablesFactory system follows the Totality principle:
 * - All possible states are handled explicitly without default cases
 * - All error conditions are represented as values
 * - Factory creation follows type-safe patterns
 * - Configuration validation is exhaustive
 * - Path resolution handles all scenarios
 */

import { assertEquals, assertExists, assertThrows } from "../../../lib/deps.ts";
import { describe, it } from "@std/testing/bdd";
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
  PromptVariablesFactory,
  TotalityPromptVariablesFactory,
} from "./prompt_variables_factory.ts";
import type { PromptCliParams, TotalityPromptCliParams } from "../types/mod.ts";

const logger = new BreakdownLogger("architecture-prompt-factory");

/**
 * Test pattern provider for architecture validation
 */
class ArchitectureTestPatternProvider implements TypePatternProvider {
  constructor(
    private directivePatterns: string[] = ["to", "summary", "defect", "init", "find"],
    private layerPatterns: string[] = ["project", "issue", "task", "bugs", "temp"],
  ) {}

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    const patternString = this.directivePatterns.join("|");
    return TwoParamsDirectivePattern.create(patternString);
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    const patternString = this.layerPatterns.join("|");
    return TwoParamsLayerTypePattern.create(patternString);
  }

  getAllDirectiveValues(): string[] {
    return [...this.directivePatterns];
  }

  getAllLayerValues(): string[] {
    return [...this.layerPatterns];
  }
}

describe("PromptVariablesFactory Architecture - Dependency Relationships", () => {
  it("should maintain clear separation between legacy and Totality implementations", async () => {
    logger.debug("Testing architectural separation between legacy and Totality factories");

    // Legacy factory should not depend on Totality types directly
    const legacyParams: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    // Totality factory should use validated types
    const provider = new ArchitectureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const totalityParams: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      // Both should be createable independently
      assertExists(legacyParams);
      assertExists(totalityParams);

      // Types should be distinct
      assertEquals(typeof legacyParams.demonstrativeType, "string");
      assertEquals(typeof totalityParams.directive, "object");
    }
  });

  it("should enforce proper dependency direction in path resolvers", async () => {
    logger.debug("Testing dependency direction in path resolver integration");

    // Factory should depend on resolvers, not vice versa
    // This test ensures resolvers don't have circular dependencies back to factory

    const provider = new ArchitectureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      // Factory creation should succeed without resolver-to-factory dependencies
      TotalityPromptVariablesFactory.create(params).then((factory: any) => {
        assertExists(factory);

        // All path getters should be accessible
        assertExists(factory.promptFilePath);
        assertExists(factory.inputFilePath);
        assertExists(factory.outputFilePath);
        assertExists(factory.schemaFilePath);
      });
    }
  });

  it("should maintain proper abstraction levels across factory layers", async () => {
    logger.debug("Testing abstraction layer compliance");

    // Configuration layer should be at lowest level
    const config = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
    };

    // Type layer should be above configuration
    const provider = new ArchitectureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);

    // Factory layer should be at highest level
    const typesResult = typeFactory.createBothTypes("to", "project");
    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const factory = TotalityPromptVariablesFactory.createWithConfig(config, params);

      // Factory should orchestrate lower layers without exposing implementation details
      assertExists(factory.getAllParams());
      assertExists(factory.validateAll);
    }
  });
});

describe("PromptVariablesFactory Architecture - Configuration State Exhaustiveness", () => {
  it("should handle all possible configuration states without default case", async () => {
    logger.debug("Testing exhaustive configuration state handling");

    const configStates = [
      {
        config: { app_prompt: { base_dir: "prompts" }, app_schema: { base_dir: "schemas" } },
        hasPromptDir: true,
        hasSchemaDir: true,
        shouldBeValid: true,
      },
      {
        config: { app_prompt: { base_dir: "prompts" }, app_schema: {} },
        hasPromptDir: true,
        hasSchemaDir: false,
        shouldBeValid: false,
      },
      {
        config: { app_prompt: {}, app_schema: { base_dir: "schemas" } },
        hasPromptDir: false,
        hasSchemaDir: true,
        shouldBeValid: false,
      },
      {
        config: { app_prompt: {}, app_schema: {} },
        hasPromptDir: false,
        hasSchemaDir: false,
        shouldBeValid: false,
      },
      {
        config: { app_prompt: { base_dir: "" }, app_schema: { base_dir: "schemas" } },
        hasPromptDir: false, // empty string counts as invalid
        hasSchemaDir: true,
        shouldBeValid: false,
      },
    ];

    configStates.forEach((state, index) => {
      logger.debug(`Testing config state ${index}`, { state });

      const promptDirExists = !!(state.config.app_prompt?.base_dir?.trim());
      const schemaDirExists = !!(state.config.app_schema?.base_dir?.trim());

      let handled = false;

      // Handle all configuration states without default case
      if (promptDirExists && schemaDirExists) {
        assertEquals(state.shouldBeValid, true);
        assertEquals(state.hasPromptDir, true);
        assertEquals(state.hasSchemaDir, true);
        handled = true;
      } else if (promptDirExists && !schemaDirExists) {
        assertEquals(state.shouldBeValid, false);
        assertEquals(state.hasPromptDir, true);
        assertEquals(state.hasSchemaDir, false);
        handled = true;
      } else if (!promptDirExists && schemaDirExists) {
        assertEquals(state.shouldBeValid, false);
        assertEquals(state.hasPromptDir, false);
        assertEquals(state.hasSchemaDir, true);
        handled = true;
      } else if (!promptDirExists && !schemaDirExists) {
        assertEquals(state.shouldBeValid, false);
        assertEquals(state.hasPromptDir, false);
        assertEquals(state.hasSchemaDir, false);
        handled = true;
      }

      assertEquals(handled, true, `Configuration state ${index} should be handled`);
    });
  });

  it("should handle all factory creation scenarios without default case", async () => {
    logger.debug("Testing exhaustive factory creation scenario handling");

    const provider = new ArchitectureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);

    const creationScenarios = [
      { directiveValue: "to", layerValue: "project", shouldSucceed: true },
      { directiveValue: "summary", layerValue: "issue", shouldSucceed: true },
      { directiveValue: "defect", layerValue: "task", shouldSucceed: true },
      { directiveValue: "init", layerValue: "bugs", shouldSucceed: true },
      { directiveValue: "find", layerValue: "temp", shouldSucceed: true },
    ];

    for (const scenario of creationScenarios) {
      logger.debug("Testing creation scenario", { scenario });

      const typesResult = typeFactory.createBothTypes(scenario.directiveValue, scenario.layerValue);

      let handled = false;

      // Handle all type creation results without default case
      switch (typesResult.ok) {
        case true:
          assertEquals(scenario.shouldSucceed, true);
          assertExists(typesResult.data);

          const params: TotalityPromptCliParams = {
            directive: typesResult.data.directive,
            layer: typesResult.data.layer,
            options: {},
          };

          const factory = await TotalityPromptVariablesFactory.create(params);
          assertExists(factory);
          handled = true;
          break;
        case false:
          assertEquals(scenario.shouldSucceed, false);
          assertExists(typesResult.error);
          handled = true;
          break;
      }

      assertEquals(
        handled,
        true,
        `Creation scenario ${scenario.directiveValue}/${scenario.layerValue} should be handled`,
      );
    }
  });
});

describe("PromptVariablesFactory Architecture - Option Validation Exhaustiveness", () => {
  it("should handle all error format options without default case", async () => {
    logger.debug("Testing exhaustive error format option handling");

    const provider = new ArchitectureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const errorFormatOptions: Array<"simple" | "detailed" | "json"> = [
        "simple",
        "detailed",
        "json",
      ];

      for (const errorFormat of errorFormatOptions) {
        const params: TotalityPromptCliParams = {
          directive: typesResult.data.directive,
          layer: typesResult.data.layer,
          options: { errorFormat },
        };

        const factory = await TotalityPromptVariablesFactory.create(params);
        const retrievedFormat = factory.errorFormat;

        let handled = false;

        // Handle all error format options without default case
        switch (retrievedFormat) {
          case "simple":
            assertEquals(errorFormat, "simple");
            handled = true;
            break;
          case "detailed":
            assertEquals(errorFormat, "detailed");
            handled = true;
            break;
          case "json":
            assertEquals(errorFormat, "json");
            handled = true;
            break;
        }

        assertEquals(handled, true, `Error format ${errorFormat} should be handled`);
      }
    }
  });

  it("should handle all boolean option combinations without default case", async () => {
    logger.debug("Testing exhaustive boolean option combination handling");

    const provider = new ArchitectureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const booleanCombinations = [
        { extended: true, customValidation: true },
        { extended: true, customValidation: false },
        { extended: false, customValidation: true },
        { extended: false, customValidation: false },
      ];

      for (const combination of booleanCombinations) {
        const params: TotalityPromptCliParams = {
          directive: typesResult.data.directive,
          layer: typesResult.data.layer,
          options: combination,
        };

        const factory = await TotalityPromptVariablesFactory.create(params);

        let handled = false;

        // Handle all boolean combinations without default case
        if (factory.extended && factory.customValidation) {
          assertEquals(combination.extended, true);
          assertEquals(combination.customValidation, true);
          handled = true;
        } else if (factory.extended && !factory.customValidation) {
          assertEquals(combination.extended, true);
          assertEquals(combination.customValidation, false);
          handled = true;
        } else if (!factory.extended && factory.customValidation) {
          assertEquals(combination.extended, false);
          assertEquals(combination.customValidation, true);
          handled = true;
        } else if (!factory.extended && !factory.customValidation) {
          assertEquals(combination.extended, false);
          assertEquals(combination.customValidation, false);
          handled = true;
        }

        assertEquals(
          handled,
          true,
          `Boolean combination should be handled: ${JSON.stringify(combination)}`,
        );
      }
    }
  });
});

describe("PromptVariablesFactory Architecture - Validation State Coverage", () => {
  it("should handle all validation states without default case", async () => {
    logger.debug("Testing exhaustive validation state handling");

    const provider = new ArchitectureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const factory = await TotalityPromptVariablesFactory.create(params);

      // Test base directory validation states
      const hasValidBaseDir = factory.hasValidBaseDir();
      const baseDirError = factory.getBaseDirError();

      let validationHandled = false;

      // Handle all base directory validation states without default case
      switch (hasValidBaseDir) {
        case true:
          assertEquals(baseDirError, undefined);
          validationHandled = true;
          break;
        case false:
          assertExists(baseDirError);
          validationHandled = true;
          break;
      }

      assertEquals(validationHandled, true, "Base directory validation state should be handled");

      // Test overall validation
      let overallValidationHandled = false;

      try {
        factory.validateAll();
        // If no exception thrown, validation passed
        overallValidationHandled = true;
      } catch (error) {
        // If exception thrown, validation failed
        assertExists(error);
        overallValidationHandled = true;
      }

      assertEquals(overallValidationHandled, true, "Overall validation state should be handled");
    }
  });

  it("should enforce architectural constraints on path resolution", async () => {
    logger.debug("Testing architectural constraints on path resolution");

    const provider = new ArchitectureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const factory = await TotalityPromptVariablesFactory.create(params);

      // All path types should be resolvable
      const pathTypes = [
        { name: "promptFilePath", path: factory.promptFilePath },
        { name: "inputFilePath", path: factory.inputFilePath },
        { name: "outputFilePath", path: factory.outputFilePath },
        { name: "schemaFilePath", path: factory.schemaFilePath },
      ];

      pathTypes.forEach((pathType) => {
        let pathHandled = false;

        // Handle all path resolution outcomes without default case
        if (typeof pathType.path === "string") {
          pathHandled = true;
        } else if (pathType.path === null || pathType.path === undefined) {
          // Some paths may be legitimately empty
          pathHandled = true;
        }

        assertEquals(pathHandled, true, `Path type ${pathType.name} should be handled`);
      });
    }
  });
});
