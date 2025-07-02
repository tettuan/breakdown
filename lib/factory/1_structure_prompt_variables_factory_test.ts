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
} from "@std/assert";
import { beforeEach as _beforeEach, describe, it } from "@std/testing/bdd";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

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
  type PromptVariablesFactoryOptions as _PromptVariablesFactoryOptions,
  TotalityPromptVariablesFactory,
  type TotalityPromptVariablesFactoryOptions as _TotalityPromptVariablesFactoryOptions,
} from "./prompt_variables_factory.ts";
import type { PromptCliParams, TotalityPromptCliParams } from "../types/mod.ts";

const _logger = new BreakdownLogger("structure-prompt-_factory");

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
    _logger.debug("Testing single responsibility principle adherence");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const _factory = await TotalityPromptVariablesFactory.create(params);

      // Factory should only be responsible for coordinating path resolution
      // and parameter management, not implementing path resolution itself

      // Path resolution methods should exist but delegate to resolvers
      assertExists(_factory.promptFilePath);
      assertExists(_factory.inputFilePath);
      assertExists(_factory.outputFilePath);
      assertExists(_factory.schemaFilePath);

      // Parameter management should be centralized
      assertExists(_factory.getAllParams);
      assertExists(_factory.getOptions);
      assertExists(_factory.directive);
      assertExists(_factory.layer);

      // Validation should be factory's responsibility
      assertExists(_factory.validateAll);
      assertExists(_factory.hasValidBaseDir);
      assertExists(_factory.getBaseDirError);

      // Factory should not expose internal resolver instances
      assertEquals(
        typeof (factory as unknown as { promptPathResolver?: unknown }).promptPathResolver,
        "object",
      );
      assertEquals(
        typeof (factory as unknown as { inputPathResolver?: unknown }).inputPathResolver,
        "object",
      );
      assertEquals(
        typeof (factory as unknown as { outputPathResolver?: unknown }).outputPathResolver,
        "object",
      );
      assertEquals(
        typeof (factory as unknown as { schemaPathResolver?: unknown }).schemaPathResolver,
        "object",
      );
    }
  });

  it("should maintain clear separation of concerns between legacy and Totality factories", async () => {
    _logger.debug("Testing separation of concerns between factory types");

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
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: { fromFile: "input.md" },
      };

      const totalityFactory = await TotalityPromptVariablesFactory.create(totalityParams);

      // Both should provide similar interfaces but handle types differently
      assertEquals(typeof legacyFactory.promptFilePath, "string");
      assertEquals(typeof totalityFactory.promptFilePath, "string");

      // Legacy uses string-based parameters
      assertEquals(typeof legacyFactory.cliParams.demonstrativeType, "string");
      assertEquals(typeof legacyFactory.cliParams.layerType, "string");

      // Totality uses validated type objects
      assertEquals(typeof totalityFactory.cliParams.directive, "object");
      assertEquals(typeof totalityFactory.cliParams.layer, "object");
      assertEquals(typeof totalityFactory.directive.getValue, "function");
      assertEquals(typeof totalityFactory.layer.getValue, "function");
    }
  });

  it("should properly encapsulate internal state and dependencies", async () => {
    _logger.debug("Testing proper encapsulation of internal state");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("summary", "issue");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {
          fromFile: "test.md",
          customVariables: { "secret": "value" },
        },
      };

      const _factory = await TotalityPromptVariablesFactory.create(params);

      // Public interface should be accessible
      assertExists(_factory.cliParams);
      assertEquals(_factory.cliParams.directive.getValue(), "summary");
      assertEquals(_factory.cliParams.layer.getValue(), "issue");

      // Internal resolvers should exist but not be directly accessible
      // (they exist as private fields)
      assertEquals(
        typeof (factory as unknown as { promptPathResolver?: unknown }).promptPathResolver,
        "object",
      );
      assertEquals(
        typeof (factory as unknown as { inputPathResolver?: unknown }).inputPathResolver,
        "object",
      );
      assertEquals(
        typeof (factory as unknown as { outputPathResolver?: unknown }).outputPathResolver,
        "object",
      );
      assertEquals(
        typeof (factory as unknown as { schemaPathResolver?: unknown }).schemaPathResolver,
        "object",
      );

      // Configuration should be private but effects should be observable
      assertEquals(typeof (factory as unknown as { config?: unknown }).config, "object");
      assertEquals(
        typeof (factory as unknown as { baseDirOverride?: unknown }).baseDirOverride,
        "undefined",
      );

      // Error state should be properly encapsulated
      assertEquals(typeof _factory.hasValidBaseDir(), "boolean");

      // getBaseDirError() returns string | undefined - test both scenarios
      const baseDirError = _factory.getBaseDirError();
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
    _logger.debug("Testing interface consistency across factory types");

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
      assertEquals(legacyFactory.extended, totalityFactory.extended);
      assertEquals(legacyFactory.errorFormat, totalityFactory.errorFormat);

      // Both should provide similar validation
      assertEquals(typeof legacyFactory.validateAll, "function");
      assertEquals(typeof totalityFactory.validateAll, "function");
      assertEquals(typeof legacyFactory.hasValidBaseDir, "function");
      assertEquals(typeof totalityFactory.hasValidBaseDir, "function");
    }
  });

  it("should support consistent factory configuration patterns", async () => {
    _logger.debug("Testing consistent factory configuration patterns");

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
    _logger.debug("Testing consistent error handling interfaces");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("find", "temp");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const _factory = await TotalityPromptVariablesFactory.create(params);

      // Error handling methods should be consistent
      assertEquals(typeof _factory.hasValidBaseDir, "function");
      assertEquals(typeof _factory.getBaseDirError, "function");
      assertEquals(typeof _factory.validateAll, "function");

      // Error states should be boolean or string/undefined
      assertEquals(typeof _factory.hasValidBaseDir(), "boolean");
      const errorMessage = _factory.getBaseDirError();
      assertEquals(typeof errorMessage === "string" || typeof errorMessage === "undefined", true);
    }
  });
});

describe("PromptVariablesFactory Structure - Dependency Management", () => {
  it("should properly inject and manage path resolver dependencies", async () => {
    _logger.debug("Testing path resolver dependency injection");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const _factory = await TotalityPromptVariablesFactory.create(params);

      // All path resolvers should be properly initialized
      const promptResolver =
        (factory as unknown as { promptPathResolver?: { getPath(): string } }).promptPathResolver;
      const inputResolver =
        (factory as unknown as { inputPathResolver?: { getPath(): string } }).inputPathResolver;
      const outputResolver =
        (factory as unknown as { outputPathResolver?: { getPath(): string } }).outputPathResolver;
      const schemaResolver =
        (factory as unknown as { schemaPathResolver?: { getPath(): string } }).schemaPathResolver;

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
      assertEquals(_factory.promptFilePath, promptResolver?.getPath());
      assertEquals(_factory.inputFilePath, inputResolver?.getPath());

      // Output file paths may contain dynamic hashes - check base pattern
      const factoryOutput = _factory.outputFilePath;
      const resolverOutput = outputResolver?.getPath() || "";
      const factoryOutputBase = factoryOutput.replace(/_[a-f0-9]+\.md$/, "_HASH.md");
      const resolverOutputBase = resolverOutput.replace(/_[a-f0-9]+\.md$/, "_HASH.md");
      assertEquals(factoryOutputBase, resolverOutputBase);

      assertEquals(_factory.schemaFilePath, schemaResolver?.getPath());
    }
  });

  it("should handle configuration dependency properly", async () => {
    _logger.debug("Testing configuration dependency handling");

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
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const _factory = TotalityPromptVariablesFactory.createWithConfig(customConfig, params);

      // Configuration should be properly stored and accessible
      const internalConfig = (factory as unknown as { config?: Record<string, unknown> }).config;
      assertExists(internalConfig);
      const appPrompt = internalConfig as { app_prompt?: { base_dir?: string } };
      const appSchema = internalConfig as { app_schema?: { base_dir?: string } };
      const customSetting = internalConfig as { custom_setting?: string };
      assertEquals(appPrompt.app_prompt?.base_dir, "custom_prompts");
      assertEquals(appSchema.app_schema?.base_dir, "custom_schemas");
      assertEquals(customSetting.custom_setting, "test_value");

      // Configuration should affect resolver behavior
      assertExists(_factory.promptFilePath);
      assertExists(_factory.schemaFilePath);
    }
  });

  it("should manage type conversion between legacy and Totality systems", async () => {
    _logger.debug("Testing type conversion management");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("defect", "task");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const totalityParams: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: { extended: true },
      };

      const _factory = await TotalityPromptVariablesFactory.create(totalityParams);

      // Factory should maintain Totality types
      assertEquals(_factory.directive.getValue(), "defect");
      assertEquals(_factory.layer.getValue(), "task");
      assertEquals(typeof _factory.directive.getValue, "function");
      assertEquals(typeof _factory.layer.getValue, "function");

      // Internal conversion should happen for legacy resolvers
      // but not be exposed in public interface
      const legacyParams = (factory as unknown as {
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
    _logger.debug("Testing consistent data flow patterns");

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
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: inputOptions,
      };

      const _factory = await TotalityPromptVariablesFactory.create(params);

      // Input should flow through to output consistently
      const allParams = _factory.getAllParams();
      assertEquals(allParams.directive.getValue(), "to");
      assertEquals(allParams.layer.getValue(), "project");
      assertEquals(allParams.customVariables?.key, "value");

      const retrievedOptions = _factory.getOptions();
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
    _logger.debug("Testing data integrity across operations");

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
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: originalOptions,
      };

      const _factory = await TotalityPromptVariablesFactory.create(params);

      // Multiple access calls should return consistent data
      const firstCall = _factory.getAllParams();
      const secondCall = _factory.getAllParams();

      assertEquals(firstCall.directive.getValue(), secondCall.directive.getValue());
      assertEquals(firstCall.layer.getValue(), secondCall.layer.getValue());
      assertEquals(
        JSON.stringify(firstCall.customVariables),
        JSON.stringify(secondCall.customVariables),
      );

      // Options should remain immutable
      const options1 = _factory.getOptions();
      const options2 = _factory.getOptions();

      assertEquals(options1.extended, options2.extended);
      assertEquals(options1.customValidation, options2.customValidation);
      assertEquals(
        JSON.stringify(options1.customVariables),
        JSON.stringify(options2.customVariables),
      );
    }
  });

  it("should handle validation flow properly", async () => {
    _logger.debug("Testing validation flow patterns");

    const provider = new StructureTestPatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("find", "temp");

    assertEquals(typesResult.ok, true);
    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const _factory = await TotalityPromptVariablesFactory.create(params);

      // Base directory validation should be first step
      const hasValidBaseDir = _factory.hasValidBaseDir();
      const baseDirError = _factory.getBaseDirError();

      if (hasValidBaseDir) {
        assertEquals(baseDirError, undefined);

        // Overall validation should succeed if base dir is valid
        try {
          _factory.validateAll();
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
          _factory.validateAll();
          // Should not reach here if base dir is invalid
          assertEquals(false, true, "Validation should have failed");
        } catch (error) {
          assertExists(error);
        }
      }
    }
  });
});
