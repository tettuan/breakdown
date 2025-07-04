/**
 * CustomConfig Integration Tests
 *
 * Tests for CustomConfig functionality including:
 * - Loading custom configurations from YAML files
 * - Validating find-bugs functionality
 * - Testing CLI parameter integration
 * - Verifying BreakdownParams custom validation
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";
import { BreakdownConfig } from "@tettuan/breakdownconfig";

// Test logger for debugging
const _logger = new _BreakdownLogger("custom-config-test");

// CustomConfig interface matching production configuration
interface CustomConfigStructure {
  customConfig: {
    enabled: boolean;
    find: {
      twoParams: string[];
    };
    findBugs: {
      enabled: boolean;
      sensitivity: string;
      patterns: string[];
      includeExtensions: string[];
      excludeDirectories: string[];
      maxResults: number;
      detailedReports: boolean;
    };
  };
  breakdownParams: {
    version: string;
    customConfig: {
      params: {
        two: {
          demonstrativeType: {
            pattern: string;
            errorMessage: string;
          };
          layerType: {
            pattern: string;
            errorMessage: string;
          };
        };
      };
      validation: {
        zero: {
          allowedOptions: string[];
          valueOptions: string[];
          allowCustomVariables: boolean;
        };
        one: {
          allowedOptions: string[];
          valueOptions: string[];
          allowCustomVariables: boolean;
        };
        two: {
          allowedOptions: string[];
          valueOptions: string[];
          allowCustomVariables: boolean;
        };
      };
      options: {
        values: Record<string, unknown>;
        flags: Record<string, unknown>;
        customVariables: {
          pattern: string;
          description: string;
        };
      };
      errorHandling: {
        unknownOption: string;
        duplicateOption: string;
        emptyValue: string;
      };
    };
    customParams: Record<string, unknown>;
  };
}

// Utility function to load configuration using BreakdownConfig
async function loadCustomConfig(configPath: string): Promise<CustomConfigStructure> {
  try {
    // For production-user.yml, we need to use the production prefix
    const workingDir = Deno.cwd();
    const configPrefix = "production-user";

    // Create BreakdownConfig instance with production prefix
    const breakdownConfigResult = BreakdownConfig.create(workingDir, configPrefix);
    if (!breakdownConfigResult.success) {
      throw new Error(`Failed to create BreakdownConfig: ${breakdownConfigResult.error}`);
    }
    const breakdownConfig = breakdownConfigResult.data;
    await breakdownConfig.loadConfig();
    const _config = await breakdownConfig.getConfig();

    _logger.debug("Loaded custom config", {
      path: configPath,
      hasCustomConfig: !!_config.customConfig,
    });

    // Explicitly cast through unknown first to avoid type overlap issues
    return _config as any as CustomConfigStructure;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    _logger.error("Failed to load custom config", { path: configPath, error: message });
    throw new Error(`Failed to load config from ${configPath}: ${message}`);
  }
}

Deno.test({
  name: "CustomConfig - Core Functionality",
  ignore: true, // TODO: Enable when production-user.yml config is properly set up
  fn: async (t) => {
    const configPath = resolve(Deno.cwd(), ".agent/breakdown/config/production-user.yml");

    await t.step("should load CustomConfig from production-user.yml", async () => {
      const _config = await loadCustomConfig(configPath);

      assertExists(_config.customConfig);
      assertEquals(_config.customConfig.enabled, true);

      _logger.debug("CustomConfig loaded successfully", {
        enabled: _config.customConfig.enabled,
        hasFindBugs: !!_config.customConfig.findBugs,
      });
    });

    await t.step("should validate findBugs configuration", async () => {
      const _config = await loadCustomConfig(configPath);
      const findBugs = _config.customConfig.findBugs;

      assertExists(findBugs);
      assertEquals(findBugs.enabled, true);
      assertEquals(findBugs.sensitivity, "medium");
      assertEquals(findBugs.maxResults, 100);
      assertEquals(findBugs.detailedReports, true);

      // Validate patterns array
      assertExists(findBugs.patterns);
      assertEquals(Array.isArray(findBugs.patterns), true);
      assertEquals(findBugs.patterns.length > 0, true);

      // Check for expected patterns
      const expectedPatterns = ["TODO", "FIXME", "BUG", "HACK"];
      for (const pattern of expectedPatterns) {
        assertEquals(
          findBugs.patterns.includes(pattern),
          true,
          `Pattern ${pattern} should be included`,
        );
      }

      _logger.debug("FindBugs config validated", {
        patterns: findBugs.patterns.length,
        extensions: findBugs.includeExtensions.length,
        excludes: findBugs.excludeDirectories.length,
      });
    });

    await t.step("should validate file extensions and exclusions", async () => {
      const _config = await loadCustomConfig(configPath);
      const findBugs = _config.customConfig.findBugs;

      // Check file extensions
      assertExists(findBugs.includeExtensions);
      assertEquals(Array.isArray(findBugs.includeExtensions), true);
      assertEquals(findBugs.includeExtensions.includes(".ts"), true);
      assertEquals(findBugs.includeExtensions.includes(".js"), true);

      // Check excluded directories
      assertExists(findBugs.excludeDirectories);
      assertEquals(Array.isArray(findBugs.excludeDirectories), true);
      assertEquals(findBugs.excludeDirectories.includes("node_modules"), true);
      assertEquals(findBugs.excludeDirectories.includes(".git"), true);
    });
  },
});

Deno.test({
  name: "CustomConfig - BreakdownParams Integration",
  ignore: true, // TODO: Enable when production-user.yml config is properly set up
  fn: async (t) => {
    const configPath = resolve(Deno.cwd(), ".agent/breakdown/config/production-user.yml");

    await t.step("should validate BreakdownParams customConfig structure", async () => {
      const _config = await loadCustomConfig(configPath);

      assertExists(_config.breakdownParams);
      assertExists(_config.breakdownParams.customConfig);
      assertEquals(_config.breakdownParams.version, "latest");

      _logger.debug("BreakdownParams structure validated", {
        version: _config.breakdownParams.version,
        hasCustomConfig: !!_config.breakdownParams.customConfig,
      });
    });

    await t.step("should validate two-parameter command patterns", async () => {
      const _config = await loadCustomConfig(configPath);
      const _params = _config.breakdownParams.customConfig.params.two;

      assertExists(_params.demonstrativeType);
      assertExists(_params.layerType);

      // Validate demonstrative type pattern (should include "find")
      assertEquals(_params.demonstrativeType.pattern.includes("find"), true);
      assertExists(_params.demonstrativeType.errorMessage);

      // Validate layer type pattern (should include "bugs")
      assertEquals(_params.layerType.pattern.includes("bugs"), true);
      assertExists(_params.layerType.errorMessage);

      _logger.debug("Two-parameter patterns validated", {
        demonstrative: _params.demonstrativeType.pattern,
        layer: _params.layerType.pattern,
      });
    });

    await t.step("should validate command validation rules", async () => {
      const _config = await loadCustomConfig(configPath);
      const validation = _config.breakdownParams.customConfig.validation;

      // Test all command types
      for (const commandType of ["zero", "one", "two"]) {
        const typeConfig = validation[commandType as keyof typeof validation];
        assertExists(typeConfig, `${commandType} validation should exist`);
        assertExists(typeConfig.allowedOptions);
        assertExists(typeConfig.valueOptions);
        assertEquals(typeof typeConfig.allowCustomVariables, "boolean");

        _logger.debug(`${commandType} validation checked`, {
          allowedOptions: typeConfig.allowedOptions.length,
          valueOptions: typeConfig.valueOptions.length,
          allowCustomVars: typeConfig.allowCustomVariables,
        });
      }
    });

    await t.step("should validate option definitions", async () => {
      const _config = await loadCustomConfig(configPath);
      const options = _config.breakdownParams.customConfig.options;

      assertExists(options.values);
      assertExists(options.flags);
      assertExists(options.customVariables);

      // Check custom variables pattern
      assertEquals(options.customVariables.pattern, "^--uv-[a-zA-Z-]+$");
      assertExists(options.customVariables.description);

      _logger.debug("Option definitions validated", {
        values: Object.keys(options.values).length,
        flags: Object.keys(options.flags).length,
        customPattern: options.customVariables.pattern,
      });
    });
  },
});

Deno.test({
  name: "CustomConfig - Find Command Integration",
  ignore: true, // TODO: Enable when production-user.yml config is properly set up
  fn: async (t) => {
    const configPath = resolve(Deno.cwd(), ".agent/breakdown/config/production-user.yml");

    await t.step("should support find command with bugs parameter", async () => {
      const _config = await loadCustomConfig(configPath);

      assertExists(_config.customConfig.find);
      assertExists(_config.customConfig.find.twoParams);
      assertEquals(Array.isArray(_config.customConfig.find.twoParams), true);
      assertEquals(_config.customConfig.find.twoParams.includes("bugs"), true);

      _logger.debug("Find command support validated", {
        twoParams: _config.customConfig.find.twoParams,
      });
    });

    await t.step("should validate find-bugs end-to-end configuration", async () => {
      const _config = await loadCustomConfig(configPath);

      // Verify find command supports bugs
      assertEquals(_config.customConfig.find.twoParams.includes("bugs"), true);

      // Verify findBugs configuration is complete
      assertEquals(_config.customConfig.findBugs.enabled, true);
      assertEquals(_config.customConfig.findBugs.patterns.length > 0, true);
      assertEquals(_config.customConfig.findBugs.includeExtensions.length > 0, true);

      // Verify BreakdownParams supports find and bugs patterns
      const _params = _config.breakdownParams.customConfig.params.two;
      assertEquals(_params.demonstrativeType.pattern.includes("find"), true);
      assertEquals(_params.layerType.pattern.includes("bugs"), true);

      _logger.debug("End-to-end find-bugs configuration validated");
    });
  },
});

Deno.test({
  name: "CustomConfig - Error Handling",
  ignore: true, // TODO: Enable when production-user.yml config is properly set up
  fn: async (t) => {
    await t.step("should handle missing config file gracefully", async () => {
      const nonExistentPath = resolve(Deno.cwd(), "config/non-existent.yml");

      await assertRejects(
        async () => await loadCustomConfig(nonExistentPath),
        Error,
        "Failed to load config",
      );
    });

    await t.step("should validate error handling configuration", async () => {
      const _config = await loadCustomConfig(resolve(Deno.cwd(), "config/production-user.yml"));
      const errorHandling = _config.breakdownParams.customConfig.errorHandling;

      assertExists(errorHandling);
      assertEquals(errorHandling.unknownOption, "error");
      assertEquals(errorHandling.duplicateOption, "warn");
      assertEquals(errorHandling.emptyValue, "error");

      _logger.debug("Error handling configuration validated", errorHandling);
    });
  },
});

Deno.test({
  name: "CustomConfig - Performance and Validation",
  ignore: true, // TODO: Enable when production-user.yml config is properly set up
  fn: async (t) => {
    const configPath = resolve(Deno.cwd(), ".agent/breakdown/config/production-user.yml");

    await t.step("should load configuration efficiently", async () => {
      const startTime = performance.now();
      const _config = await loadCustomConfig(configPath);
      const loadTime = performance.now() - startTime;

      assertExists(_config);
      assertEquals(loadTime < 100, true, "Config loading should be fast (<100ms)");

      _logger.debug("Configuration loading performance", { loadTime });
    });

    await t.step("should validate all required fields exist", async () => {
      const _config = await loadCustomConfig(configPath);

      // Check top-level structure
      assertExists(_config.customConfig);
      assertExists(_config.breakdownParams);

      // Check customConfig required fields
      assertExists(_config.customConfig.enabled);
      assertExists(_config.customConfig.find);
      assertExists(_config.customConfig.findBugs);

      // Check breakdownParams required fields
      assertExists(_config.breakdownParams.version);
      assertExists(_config.breakdownParams.customConfig);
      assertExists(_config.breakdownParams.customParams);

      _logger.debug("All required fields validated");
    });
  },
});
