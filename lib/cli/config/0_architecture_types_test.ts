/**
 * Architecture tests for Config Types
 *
 * Tests architectural constraints and dependencies:
 * - Type interface design and contracts
 * - Type safety and structure validation
 * - Interface extensibility
 * - Configuration modeling principles
 * - Separation of concerns
 *
 * @module cli/config/types_architecture_test
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import type { BreakdownConfig, ConfigOptions } from "./types.ts";

const logger = new BreakdownLogger("config-types-architecture");

describe("Architecture: Type Interface Design", () => {
  it("should export required type interfaces", () => {
    logger.debug("Testing type interface exports");

    // Verify interfaces can be used as types
    const testConfig: BreakdownConfig = {
      working_directory: "/test",
      output_directory: "/output",
      default_config_path: "/config.yml",
    };

    const testOptions: ConfigOptions = {
      configPath: "/test/config.yml",
    };

    // Type checking ensures interfaces are properly exported
    assertEquals(
      typeof testConfig.working_directory,
      "string",
      "BreakdownConfig should have string working_directory",
    );
    assertEquals(
      typeof testConfig.output_directory,
      "string",
      "BreakdownConfig should have string output_directory",
    );
    assertEquals(
      typeof testConfig.default_config_path,
      "string",
      "BreakdownConfig should have string default_config_path",
    );

    assertEquals(
      typeof testOptions.configPath,
      "string",
      "ConfigOptions should have optional string configPath",
    );

    logger.debug("Type interface exports verification completed");
  });

  it("should maintain proper interface contracts", () => {
    logger.debug("Testing interface contracts");

    // BreakdownConfig should have required properties
    const requiredConfigProps = [
      "working_directory",
      "output_directory",
      "default_config_path",
    ];

    const testConfig: BreakdownConfig = {
      working_directory: "/test",
      output_directory: "/output",
      default_config_path: "/config",
    };

    for (const prop of requiredConfigProps) {
      assertExists(
        testConfig[prop as keyof BreakdownConfig],
        `BreakdownConfig should have required property: ${prop}`,
      );
    }

    // ConfigOptions should have optional properties
    const validConfigOptions: ConfigOptions[] = [
      {},
      { configPath: "/path" },
      { workingDir: "/work" },
      { outputDir: "/out" },
      { configPath: "/path", workingDir: "/work", outputDir: "/out" },
    ];

    for (const options of validConfigOptions) {
      // All should be valid ConfigOptions (TypeScript compilation ensures this)
      assertEquals(
        typeof options === "object",
        true,
        `Should accept valid ConfigOptions: ${JSON.stringify(options)}`,
      );
    }

    logger.debug("Interface contracts verification completed");
  });

  it("should follow TypeScript interface best practices", () => {
    logger.debug("Testing TypeScript interface best practices");

    // Test required vs optional property design
    const minimalConfig: BreakdownConfig = {
      working_directory: "",
      output_directory: "",
      default_config_path: "",
    };

    // Should be able to create minimal config
    assertExists(minimalConfig.working_directory, "Should support minimal required config");

    const minimalOptions: ConfigOptions = {};
    // Should be able to create empty options
    assertEquals(typeof minimalOptions, "object", "Should support empty optional config");

    // Test property naming conventions
    const configPropertyNames = Object.keys(minimalConfig);
    for (const propName of configPropertyNames) {
      assertEquals(
        propName.includes("_") || propName === propName.toLowerCase(),
        true,
        `Property names should follow snake_case or camelCase: ${propName}`,
      );
    }

    logger.debug("TypeScript interface best practices verification completed");
  });

  it("should support type safety and validation", () => {
    logger.debug("Testing type safety support");

    // Type safety should prevent invalid assignments (compile-time)
    const validConfig: BreakdownConfig = {
      working_directory: "/valid/path",
      output_directory: "/valid/output",
      default_config_path: "/valid/config.yml",
    };

    // Should accept valid string values
    assertEquals(
      typeof validConfig.working_directory,
      "string",
      "Should accept string working_directory",
    );
    assertEquals(
      typeof validConfig.output_directory,
      "string",
      "Should accept string output_directory",
    );
    assertEquals(
      typeof validConfig.default_config_path,
      "string",
      "Should accept string default_config_path",
    );

    // Optional properties should be properly typed
    const optionsWithAllProps: ConfigOptions = {
      configPath: "/config",
      workingDir: "/work",
      outputDir: "/output",
    };

    assertEquals(
      typeof optionsWithAllProps.configPath,
      "string",
      "configPath should be string when present",
    );
    assertEquals(
      typeof optionsWithAllProps.workingDir,
      "string",
      "workingDir should be string when present",
    );
    assertEquals(
      typeof optionsWithAllProps.outputDir,
      "string",
      "outputDir should be string when present",
    );

    logger.debug("Type safety support verification completed");
  });
});

describe("Architecture: Configuration Modeling", () => {
  it("should model configuration concerns appropriately", () => {
    logger.debug("Testing configuration concern modeling");

    // BreakdownConfig should model core CLI configuration
    const coreConfig: BreakdownConfig = {
      working_directory: "/project",
      output_directory: "/project/output",
      default_config_path: "/project/.breakdown.yml",
    };

    // Should represent paths and directories
    assertEquals(
      coreConfig.working_directory.startsWith("/"),
      true,
      "Should model directory paths",
    );
    assertEquals(
      coreConfig.output_directory.includes("output"),
      true,
      "Should model output directory",
    );
    assertEquals(
      coreConfig.default_config_path.includes("config") ||
        coreConfig.default_config_path.includes(".yml"),
      true,
      "Should model configuration file path",
    );

    // ConfigOptions should model runtime overrides
    const runtimeOptions: ConfigOptions = {
      configPath: "/custom/config.yml",
      workingDir: "/custom/work",
      outputDir: "/custom/output",
    };

    // Should allow overriding core config values
    assertEquals(typeof runtimeOptions.configPath, "string", "Should allow config path override");
    assertEquals(
      typeof runtimeOptions.workingDir,
      "string",
      "Should allow working directory override",
    );
    assertEquals(
      typeof runtimeOptions.outputDir,
      "string",
      "Should allow output directory override",
    );

    logger.debug("Configuration concern modeling verification completed");
  });

  it("should separate core config from runtime options", () => {
    logger.debug("Testing core config and runtime options separation");

    // BreakdownConfig: Core required configuration
    const coreRequiredFields = ["working_directory", "output_directory", "default_config_path"];
    const testConfig: BreakdownConfig = {
      working_directory: "/test",
      output_directory: "/test/out",
      default_config_path: "/test/config.yml",
    };

    for (const field of coreRequiredFields) {
      assertExists(
        testConfig[field as keyof BreakdownConfig],
        `Core config should require: ${field}`,
      );
    }

    // ConfigOptions: Optional runtime overrides
    const optionalFields = ["configPath", "workingDir", "outputDir"];
    const emptyOptions: ConfigOptions = {};

    for (const field of optionalFields) {
      assertEquals(
        emptyOptions[field as keyof ConfigOptions],
        undefined,
        `Runtime options should be optional: ${field}`,
      );
    }

    // Should have different property naming patterns
    const configKeys = Object.keys(testConfig);
    const hasSnakeCase = configKeys.some((key) => key.includes("_"));
    assertEquals(
      hasSnakeCase,
      true,
      "Core config uses snake_case naming (properties contain underscores)",
    );

    const optionsWithProps: ConfigOptions = { workingDir: "/test" };
    assertEquals(
      "workingDir" in optionsWithProps,
      true,
      "Runtime options use camelCase naming",
    );

    logger.debug("Core config and runtime options separation verification completed");
  });

  it("should support configuration extensibility", () => {
    logger.debug("Testing configuration extensibility");

    // Interfaces should be extensible without breaking existing code
    interface ExtendedBreakdownConfig extends BreakdownConfig {
      new_feature_path?: string;
    }

    const extendedConfig: ExtendedBreakdownConfig = {
      working_directory: "/test",
      output_directory: "/test/out",
      default_config_path: "/test/config.yml",
      new_feature_path: "/test/feature",
    };

    // Should maintain compatibility with base interface
    const baseConfig: BreakdownConfig = extendedConfig;
    assertEquals(
      baseConfig.working_directory,
      extendedConfig.working_directory,
      "Extended interface should be compatible with base",
    );

    // Should support additional optional properties
    interface ExtendedConfigOptions extends ConfigOptions {
      debugMode?: boolean;
      verboseLogging?: boolean;
    }

    const extendedOptions: ExtendedConfigOptions = {
      configPath: "/custom/config.yml",
      debugMode: true,
      verboseLogging: false,
    };

    // Should maintain compatibility
    const baseOptions: ConfigOptions = extendedOptions;
    assertEquals(
      baseOptions.configPath,
      extendedOptions.configPath,
      "Extended options should be compatible with base",
    );

    logger.debug("Configuration extensibility verification completed");
  });
});

describe("Architecture: Type System Integration", () => {
  it("should integrate properly with TypeScript type system", () => {
    logger.debug("Testing TypeScript type system integration");

    // Should support type guards
    function isBreakdownConfig(obj: unknown): obj is BreakdownConfig {
      return typeof obj === "object" && obj !== null &&
        "working_directory" in obj &&
        "output_directory" in obj &&
        "default_config_path" in obj;
    }

    const validConfig = {
      working_directory: "/test",
      output_directory: "/out",
      default_config_path: "/config",
    };

    const invalidConfig = {
      working_directory: "/test",
      // missing required fields
    };

    assertEquals(isBreakdownConfig(validConfig), true, "Should identify valid config");
    assertEquals(isBreakdownConfig(invalidConfig), false, "Should identify invalid config");

    // Should support utility types
    type ConfigKeys = keyof BreakdownConfig;
    const configKeys: ConfigKeys[] = [
      "working_directory",
      "output_directory",
      "default_config_path",
    ];

    assertEquals(configKeys.length, 3, "Should support keyof utility type");

    type PartialConfig = Partial<BreakdownConfig>;
    const partialConfig: PartialConfig = {
      working_directory: "/test",
    };

    assertEquals(
      typeof partialConfig.working_directory,
      "string",
      "Should support Partial utility type",
    );

    logger.debug("TypeScript type system integration verification completed");
  });

  it("should support generic type operations", () => {
    logger.debug("Testing generic type operations");

    // Should work with generic functions
    function processConfig<T extends BreakdownConfig>(config: T): T {
      // Generic function should accept BreakdownConfig and subtypes
      return config;
    }

    const standardConfig: BreakdownConfig = {
      working_directory: "/test",
      output_directory: "/out",
      default_config_path: "/config",
    };

    const processedConfig = processConfig(standardConfig);
    assertEquals(
      processedConfig.working_directory,
      standardConfig.working_directory,
      "Should work with generic functions",
    );

    // Should support mapped types
    type StringKeys<T> = {
      [K in keyof T]: T[K] extends string ? K : never;
    }[keyof T];

    type ConfigStringKeys = StringKeys<BreakdownConfig>;
    // All BreakdownConfig properties are strings, so this should include all keys

    const stringKey: ConfigStringKeys = "working_directory";
    assertEquals(typeof stringKey, "string", "Should support mapped types");

    logger.debug("Generic type operations verification completed");
  });

  it("should maintain type safety at module boundaries", () => {
    logger.debug("Testing module boundary type safety");

    // Should export types that maintain contracts
    function validateConfigStructure(config: BreakdownConfig): boolean {
      const requiredStringProps = [
        "working_directory",
        "output_directory",
        "default_config_path",
      ] as const;

      return requiredStringProps.every((prop) =>
        typeof config[prop] === "string" && config[prop].length > 0
      );
    }

    const validConfig: BreakdownConfig = {
      working_directory: "/valid",
      output_directory: "/valid/out",
      default_config_path: "/valid/config.yml",
    };

    assertEquals(
      validateConfigStructure(validConfig),
      true,
      "Should maintain type contracts at module boundaries",
    );

    // Should support config option validation
    function validateConfigOptions(options: ConfigOptions): boolean {
      const optionalStringProps = ["configPath", "workingDir", "outputDir"] as const;

      return optionalStringProps.every((prop) =>
        options[prop] === undefined || typeof options[prop] === "string"
      );
    }

    const validOptions: ConfigOptions = {
      configPath: "/custom/config.yml",
    };

    assertEquals(
      validateConfigOptions(validOptions),
      true,
      "Should maintain option type contracts",
    );

    logger.debug("Module boundary type safety verification completed");
  });

  it("should support configuration composition patterns", () => {
    logger.debug("Testing configuration composition patterns");

    // Should support merging configurations
    function mergeConfigs(base: BreakdownConfig, options: ConfigOptions): BreakdownConfig {
      return {
        working_directory: options.workingDir || base.working_directory,
        output_directory: options.outputDir || base.output_directory,
        default_config_path: options.configPath || base.default_config_path,
      };
    }

    const baseConfig: BreakdownConfig = {
      working_directory: "/base",
      output_directory: "/base/out",
      default_config_path: "/base/config.yml",
    };

    const overrideOptions: ConfigOptions = {
      workingDir: "/override",
      configPath: "/override/config.yml",
    };

    const mergedConfig = mergeConfigs(baseConfig, overrideOptions);

    assertEquals(mergedConfig.working_directory, "/override", "Should merge working directory");
    assertEquals(mergedConfig.output_directory, "/base/out", "Should keep base output directory");
    assertEquals(
      mergedConfig.default_config_path,
      "/override/config.yml",
      "Should merge config path",
    );

    // Result should still be valid BreakdownConfig
    assertEquals(typeof mergedConfig.working_directory, "string", "Merged config should be valid");
    assertEquals(typeof mergedConfig.output_directory, "string", "Merged config should be valid");
    assertEquals(
      typeof mergedConfig.default_config_path,
      "string",
      "Merged config should be valid",
    );

    logger.debug("Configuration composition patterns verification completed");
  });
});
