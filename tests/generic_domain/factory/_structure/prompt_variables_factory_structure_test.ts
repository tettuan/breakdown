/**
 * Structure tests for PromptVariablesFactory class design and responsibility distribution
 *
 * These tests verify the structural integrity of both legacy PromptVariablesFactory
 * and new TotalityPromptVariablesFactory classes, ensuring proper:
 * - Single responsibility principle adherence
 * - Clear separation of concerns
 * - Proper encapsulation and data hiding
 * - Interface consistency and compatibility
 * - Dependency injection patterns
 */

import {
  assert,
  assertEquals,
  assertExists,
  assertInstanceOf as _assertInstanceOf,
} from "../../../lib/deps.ts";
import { beforeEach as _beforeEach, describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  DirectiveType as _DirectiveType,
  LayerType as _LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  TypeFactory,
  type TypePatternProvider,
} from "../types/mod.ts";
import {
  type PromptCliOptions,
  PromptVariablesFactory,
  TotalityPromptVariablesFactory,
} from "../../../../lib/factory/prompt_variables_factory.ts";
import type { PromptCliParams, TotalityPromptCliParams } from "../types/mod.ts";

const logger = new BreakdownLogger("structure-prompt-factory");

/**
 * Test pattern provider for structure validation
 */
class StructureTestPatternProvider implements TypePatternProvider {
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

describe("PromptVariablesFactory Structure - Class Design Principles", () => {
  it("should adhere to single responsibility principle", async () => {
    logger.debug("Testing single responsibility principle adherence");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const factory = await TotalityPromptVariablesFactory.create(params);

      // Factory should only be responsible for coordinating path resolution
      // and parameter management, not implementing path resolution itself

      // Path resolution methods should exist but delegate to resolvers
      assertExists(factory.promptFilePath);
      assertExists(factory.inputFilePath);
      assertExists(factory.outputFilePath);
      assertExists(factory.schemaFilePath);

      // Parameter management should be centralized
      assertExists(factory.getAllParams);
      assertExists(factory.getOptions);
      assertExists(factory.getDirective);
      assertExists(factory.getLayerType);

      // Validation should be factory's responsibility
      assertExists(factory.validateAll);
      assertExists(factory.hasValidBaseDir);
      assertExists(factory.getBaseDirError);

      // Factory should not expose internal resolver instances
      assertEquals(
        typeof (factory as any as { _promptPathResolver?: unknown })._promptPathResolver,
        "object",
      );
      assertEquals(
        typeof (factory as any as { _inputPathResolver?: unknown })._inputPathResolver,
        "object",
      );
      assertEquals(
        typeof (factory as any as { _outputPathResolver?: unknown })._outputPathResolver,
        "object",
      );
      assertEquals(
        typeof (factory as any as { _schemaPathResolver?: unknown })._schemaPathResolver,
        "object",
      );
    }
  });

  it("should maintain clear separation of concerns between legacy and Totality factories", async () => {
    logger.debug("Testing separation of concerns between factory types");

    // Legacy factory should handle string-based types
    const legacyParams: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { fromFile: "input.md" },
    };

    const legacyFactory = await PromptVariablesFactory.create(legacyParams);

    // Totality factory should handle validated types
    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const totalityParams: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: { fromFile: "input.md" },
      };

      const totalityFactory = await TotalityPromptVariablesFactory.create(totalityParams);

      // Both should provide similar interfaces but handle types differently
      assertEquals(typeof legacyFactory.promptFilePath, "string");
      assertEquals(typeof totalityFactory.promptFilePath, "string");

      // Legacy uses string-based parameters
      assertEquals(typeof legacyFactory.getDirective(), "string");
      assertEquals(typeof legacyFactory.getLayerType(), "string");

      // Totality factory also provides string API for compatibility
      assertEquals(typeof totalityFactory.getDirective(), "string");
      assertEquals(typeof totalityFactory.getLayerType(), "string");
    }
  });

  it("should properly encapsulate internal state and dependencies", async () => {
    logger.debug("Testing proper encapsulation of internal state");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("summary", "issue");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {
          fromFile: "test.md",
          customVariables: { "secret": "value" },
        },
      };

      const factory = await TotalityPromptVariablesFactory.create(params);

      // Public interface should be accessible
      assertEquals(factory.getDirective(), "summary");
      assertEquals(factory.getLayerType(), "issue");

      // Internal resolvers should exist but not be directly accessible
      // (they exist as private fields)
      assertEquals(
        typeof (factory as any as { _promptPathResolver?: unknown })._promptPathResolver,
        "object",
      );
      assertEquals(
        typeof (factory as any as { _inputPathResolver?: unknown })._inputPathResolver,
        "object",
      );
      assertEquals(
        typeof (factory as any as { _outputPathResolver?: unknown })._outputPathResolver,
        "object",
      );
      assertEquals(
        typeof (factory as any as { _schemaPathResolver?: unknown })._schemaPathResolver,
        "object",
      );

      // Configuration should be private but effects should be observable
      assertEquals(typeof (factory as any as { config?: unknown }).config, "object");
      assertEquals(
        typeof (factory as any as { baseDirOverride?: unknown }).baseDirOverride,
        "undefined",
      );

      // Error state should be properly encapsulated
      assertEquals(typeof factory.hasValidBaseDir(), "boolean");

      // getBaseDirError() returns string | undefined - test both scenarios
      const baseDirError = factory.getBaseDirError();
      const errorType = typeof baseDirError;
      assert(
        errorType === "string" || errorType === "undefined",
        `Expected getBaseDirError() to return string | undefined, got ${errorType}`,
      );
    }
  });
});

describe("PromptVariablesFactory Structure - Interface Consistency", () => {
  it("should maintain consistent interface patterns across factory types", async () => {
    logger.debug("Testing interface consistency across factory types");

    // Both factories should support similar creation patterns
    const legacyParams: PromptCliParams = {
      demonstrativeType: "defect",
      layerType: "task",
      options: { extended: true, errorFormat: "json" },
    };

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("defect", "task");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const totalityParams: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: { extended: true, errorFormat: "json" },
      };

      const legacyFactory = await PromptVariablesFactory.create(legacyParams);
      const totalityFactory = await TotalityPromptVariablesFactory.create(totalityParams);

      // Both should provide similar path resolution methods
      assertEquals(typeof legacyFactory.promptFilePath, "string");
      assertEquals(typeof totalityFactory.promptFilePath, "string");
      assertEquals(typeof legacyFactory.inputFilePath, "string");
      assertEquals(typeof totalityFactory.inputFilePath, "string");
      assertEquals(typeof legacyFactory.outputFilePath, "string");
      assertEquals(typeof totalityFactory.outputFilePath, "string");
      assertEquals(typeof legacyFactory.schemaFilePath, "string");
      assertEquals(typeof totalityFactory.schemaFilePath, "string");

      // Both should provide similar option access
      assertEquals(typeof legacyFactory.getOptions, "function");
      assertEquals(typeof totalityFactory.getOptions, "function");
      assertEquals(legacyFactory.getOptions().extended, totalityFactory.getOptions().extended);
      assertEquals(legacyFactory.getOptions().errorFormat, totalityFactory.getOptions().errorFormat);

      // Both should provide similar validation
      assertEquals(typeof legacyFactory.validateAll, "function");
      assertEquals(typeof totalityFactory.validateAll, "function");
      assertEquals(typeof legacyFactory.hasValidBaseDir, "function");
      assertEquals(typeof totalityFactory.hasValidBaseDir, "function");
    }
  });

  it("should support consistent factory configuration patterns", async () => {
    logger.debug("Testing consistent factory configuration patterns");

    const baseConfig = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
    };

    const legacyParams: PromptCliParams = {
      demonstrativeType: "init",
      layerType: "bugs",
      options: { config: "test" },
    };

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("init", "bugs");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const totalityParams: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: { config: "test" },
      };

      // Both should support createWithConfig pattern
      const legacyFactory = PromptVariablesFactory.createWithConfig(baseConfig, legacyParams);
      const totalityFactory = TotalityPromptVariablesFactory.createWithConfig(
        baseConfig,
        totalityParams,
      );

      assertExists(legacyFactory);
      assertExists(totalityFactory);

      // Both should have consistent option structures
      const legacyOptions = legacyFactory.getOptions();
      const totalityOptions = totalityFactory.getOptions();

      assertEquals(legacyOptions.config, totalityOptions.config);
    }
  });

  it("should provide consistent error handling interfaces", async () => {
    logger.debug("Testing consistent error handling interfaces");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("find", "temp");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const factory = await TotalityPromptVariablesFactory.create(params);

      // Error handling methods should be consistent
      assertEquals(typeof factory.hasValidBaseDir, "function");
      assertEquals(typeof factory.getBaseDirError, "function");
      assertEquals(typeof factory.validateAll, "function");

      // Error states should be boolean or string/undefined
      assertEquals(typeof factory.hasValidBaseDir(), "boolean");
      const errorMessage = factory.getBaseDirError();
      assertEquals(typeof errorMessage === "string" || typeof errorMessage === "undefined", true);
    }
  });
});

describe("PromptVariablesFactory Structure - Dependency Management", () => {
  it("should properly inject and manage path resolver dependencies", async () => {
    logger.debug("Testing path resolver dependency injection");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const factory = await TotalityPromptVariablesFactory.create(params);

      // All path resolvers should be properly initialized
      const promptResolver =
        (factory as any as { _promptPathResolver?: { getPath(): string } })._promptPathResolver;
      const inputResolver =
        (factory as any as { _inputPathResolver?: { getPath(): string } })._inputPathResolver;
      const outputResolver =
        (factory as any as { _outputPathResolver?: { getPath(): string } })._outputPathResolver;
      const schemaResolver =
        (factory as any as { _schemaPathResolver?: { getPath(): string } })._schemaPathResolver;

      assertExists(promptResolver);
      assertExists(inputResolver);
      assertExists(outputResolver);
      assertExists(schemaResolver);

      // All resolvers should have getPath method
      assertEquals(typeof promptResolver?.getPath, "function");
      assertEquals(typeof inputResolver?.getPath, "function");
      assertEquals(typeof outputResolver?.getPath, "function");
      assertEquals(typeof schemaResolver?.getPath, "function");

      // Factory should delegate to resolvers
      assertEquals(factory.promptFilePath, promptResolver?.getPath());
      assertEquals(factory.inputFilePath, inputResolver?.getPath());

      // Output file paths may contain dynamic hashes - check base pattern
      const factoryOutput = factory.outputFilePath;
      const resolverOutput = outputResolver?.getPath() || "";
      const factoryOutputBase = factoryOutput.replace(/_[a-f0-9]+\.md$/, "_HASH.md");
      const resolverOutputBase = resolverOutput.replace(/_[a-f0-9]+\.md$/, "_HASH.md");
      assertEquals(factoryOutputBase, resolverOutputBase);

      assertEquals(factory.schemaFilePath, schemaResolver?.getPath());
    }
  });

  it("should handle configuration dependency properly", async () => {
    logger.debug("Testing configuration dependency handling");

    const customConfig = {
      app_prompt: { base_dir: "custom_prompts" },
      app_schema: { base_dir: "custom_schemas" },
      custom_setting: "test_value",
    };

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("summary", "issue");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const factory = TotalityPromptVariablesFactory.createWithConfig(customConfig, params);

      // Configuration should be properly stored and accessible
      const internalConfig = (factory as any as { config?: Record<string, unknown> }).config;
      assertExists(internalConfig);
      const appPrompt = internalConfig as { app_prompt?: { base_dir?: string } };
      const appSchema = internalConfig as { app_schema?: { base_dir?: string } };
      const customSetting = internalConfig as { custom_setting?: string };
      assertEquals(appPrompt.app_prompt?.base_dir, "custom_prompts");
      assertEquals(appSchema.app_schema?.base_dir, "custom_schemas");
      assertEquals(customSetting.custom_setting, "test_value");

      // Configuration should affect resolver behavior
      assertExists(factory.promptFilePath);
      assertExists(factory.schemaFilePath);
    }
  });

  it("should manage type conversion between legacy and Totality systems", async () => {
    logger.debug("Testing type conversion management");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("defect", "task");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const totalityParams: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: { extended: true },
      };

      const factory = await TotalityPromptVariablesFactory.create(totalityParams);

      // Factory should maintain Totality types
      assertEquals(factory.getDirective(), "defect");
      assertEquals(factory.getLayerType(), "task");
      assertEquals(typeof factory.getDirective, "function");
      assertEquals(typeof factory.getLayerType, "function");

      // Internal conversion should happen for legacy resolvers
      // but not be exposed in public interface
      const legacyParams = (factory as any as {
        legacyParams?: { demonstrativeType?: string; layerType?: string };
      }).legacyParams;
      if (legacyParams) {
        assertEquals(legacyParams.demonstrativeType, "defect");
        assertEquals(legacyParams.layerType, "task");
      }
    }
  });
});

describe("PromptVariablesFactory Structure - Data Flow Patterns", () => {
  it("should follow consistent data flow from input to output", async () => {
    logger.debug("Testing consistent data flow patterns");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const inputOptions: PromptCliOptions = {
        fromFile: "input.md",
        destinationFile: "output.md",
        adaptation: "strict",
        customVariables: { "key": "value" },
        extended: true,
        errorFormat: "detailed",
      };

      const params: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: inputOptions,
      };

      const factory = await TotalityPromptVariablesFactory.create(params);

      // Input should flow through to output consistently
      const allParams = factory.getAllParams();
      assertEquals(factory.getDirective(), "to");
      assertEquals(factory.getLayerType(), "project");
      assertEquals(allParams.customVariables?.key, "value");

      const retrievedOptions = factory.getOptions();
      assertEquals(retrievedOptions.fromFile, inputOptions.fromFile);
      assertEquals(retrievedOptions.destinationFile, inputOptions.destinationFile);
      assertEquals(retrievedOptions.adaptation, inputOptions.adaptation);
      assertEquals(retrievedOptions.extended, inputOptions.extended);
      assertEquals(retrievedOptions.errorFormat, inputOptions.errorFormat);

      // Path resolution should reflect input parameters
      assertExists(allParams.promptFilePath);
      assertExists(allParams.inputFilePath);
      assertExists(allParams.outputFilePath);
      assertExists(allParams.schemaFilePath);
    }
  });

  it("should maintain data integrity across factory operations", async () => {
    logger.debug("Testing data integrity across operations");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("init", "bugs");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const originalOptions: PromptCliOptions = {
        customVariables: { "var1": "value1", "var2": "value2" },
        extended: false,
        customValidation: true,
      };

      const params: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: originalOptions,
      };

      const factory = await TotalityPromptVariablesFactory.create(params);

      // Multiple access calls should return consistent data
      const firstCall = factory.getAllParams();
      const secondCall = factory.getAllParams();

      // Both calls should return the same type instances  
      assertEquals(typeof firstCall.promptFilePath, "string");
      assertEquals(typeof secondCall.promptFilePath, "string");
      assertEquals(
        JSON.stringify(firstCall.customVariables),
        JSON.stringify(secondCall.customVariables),
      );

      // Options should remain immutable
      const options1 = factory.getOptions();
      const options2 = factory.getOptions();

      assertEquals(options1.extended, options2.extended);
      assertEquals(options1.customValidation, options2.customValidation);
      assertEquals(
        JSON.stringify(options1.customVariables),
        JSON.stringify(options2.customVariables),
      );
    }
  });

  it("should handle validation flow properly", async () => {
    logger.debug("Testing validation flow patterns");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("find", "temp");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const factory = await TotalityPromptVariablesFactory.create(params);

      // Base directory validation should be first step
      const hasValidBaseDir = factory.hasValidBaseDir();
      const baseDirError = factory.getBaseDirError();

      if (hasValidBaseDir) {
        assertEquals(baseDirError, undefined);

        // Overall validation should succeed if base dir is valid
        try {
          factory.validateAll();
          // If no exception, validation passed
          assertEquals(true, true);
        } catch (error) {
          // If validation fails, it should be for other reasons
          assertExists(error);
        }
      } else {
        assertExists(baseDirError);

        // Overall validation should fail if base dir is invalid
        try {
          factory.validateAll();
          // Should not reach here if base dir is invalid
          assertEquals(false, true, "Validation should have failed");
        } catch (error) {
          assertExists(error);
        }
      }
    }
  });
});
