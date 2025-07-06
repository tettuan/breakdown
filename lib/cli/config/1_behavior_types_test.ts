/**
 * Behavior tests for Config Types
 *
 * Tests functional behavior and business logic:
 * - Configuration data modeling behavior
 * - Type validation and constraint behavior
 * - Configuration composition behavior
 * - Default value handling
 * - Path validation patterns
 *
 * @module cli/config/types_behavior_test
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import type { BreakdownConfig, ConfigOptions } from "./types.ts";

const logger = new BreakdownLogger("config-types-behavior");

describe("Behavior: Configuration Data Modeling", () => {
  it("should model directory and path configurations correctly", () => {
    logger.debug("Testing directory and path modeling");

    const typicalConfigs: BreakdownConfig[] = [
      {
        working_directory: "/home/user/project",
        output_directory: "/home/user/project/output",
        default_config_path: "/home/user/project/.breakdown.yml"
      },
      {
        working_directory: ".",
        output_directory: "./out",
        default_config_path: "./breakdown.config.yml"
      },
      {
        working_directory: "/var/lib/breakdown",
        output_directory: "/var/lib/breakdown/generated",
        default_config_path: "/etc/breakdown/config.yml"
      }
    ];

    for (const config of typicalConfigs) {
      // Should model working directories
      assertExists(config.working_directory, "Should have working directory");
      assertEquals(
        typeof config.working_directory,
        "string",
        "Working directory should be string"
      );

      // Should model output directories
      assertExists(config.output_directory, "Should have output directory");
      assertEquals(
        typeof config.output_directory,
        "string",
        "Output directory should be string"
      );

      // Should model config file paths
      assertExists(config.default_config_path, "Should have config path");
      assertEquals(
        typeof config.default_config_path,
        "string",
        "Config path should be string"
      );

      // Paths should be non-empty
      assertEquals(
        config.working_directory.length > 0,
        true,
        "Working directory should not be empty"
      );
      assertEquals(
        config.output_directory.length > 0,
        true,
        "Output directory should not be empty"
      );
      assertEquals(
        config.default_config_path.length > 0,
        true,
        "Config path should not be empty"
      );
    }

    logger.debug("Directory and path modeling completed");
  });

  it("should handle different path formats appropriately", () => {
    logger.debug("Testing path format handling");

    const pathFormats = [
      {
        name: "absolute_unix",
        config: {
          working_directory: "/home/user/breakdown",
          output_directory: "/home/user/breakdown/output",
          default_config_path: "/home/user/.breakdown.yml"
        }
      },
      {
        name: "absolute_windows_style",
        config: {
          working_directory: "C:\\Users\\user\\breakdown",
          output_directory: "C:\\Users\\user\\breakdown\\output",
          default_config_path: "C:\\Users\\user\\.breakdown.yml"
        }
      },
      {
        name: "relative_paths",
        config: {
          working_directory: ".",
          output_directory: "./output",
          default_config_path: "./config.yml"
        }
      },
      {
        name: "mixed_formats",
        config: {
          working_directory: "./project",
          output_directory: "/tmp/breakdown-output",
          default_config_path: "~/.breakdown.yml"
        }
      }
    ];

    for (const format of pathFormats) {
      const config: BreakdownConfig = format.config;

      // Should accept various path formats
      assertEquals(
        typeof config.working_directory,
        "string",
        `${format.name}: working_directory should be string`
      );
      assertEquals(
        typeof config.output_directory,
        "string",
        `${format.name}: output_directory should be string`
      );
      assertEquals(
        typeof config.default_config_path,
        "string",
        `${format.name}: default_config_path should be string`
      );

      // Should preserve original path format
      assertEquals(
        config.working_directory,
        format.config.working_directory,
        `${format.name}: should preserve working directory format`
      );
      assertEquals(
        config.output_directory,
        format.config.output_directory,
        `${format.name}: should preserve output directory format`
      );
      assertEquals(
        config.default_config_path,
        format.config.default_config_path,
        `${format.name}: should preserve config path format`
      );
    }

    logger.debug("Path format handling completed");
  });
});

describe("Behavior: Runtime Options Modeling", () => {
  it("should model optional configuration overrides", () => {
    logger.debug("Testing optional override modeling");

    const optionScenarios: Array<{ name: string; options: ConfigOptions; description: string }> = [
      {
        name: "empty_options",
        options: {},
        description: "No overrides specified"
      },
      {
        name: "config_path_only",
        options: { configPath: "/custom/config.yml" },
        description: "Only config path override"
      },
      {
        name: "working_dir_only",
        options: { workingDir: "/custom/workspace" },
        description: "Only working directory override"
      },
      {
        name: "output_dir_only",
        options: { outputDir: "/custom/output" },
        description: "Only output directory override"
      },
      {
        name: "all_overrides",
        options: {
          configPath: "/custom/config.yml",
          workingDir: "/custom/workspace",
          outputDir: "/custom/output"
        },
        description: "All options overridden"
      }
    ];

    for (const scenario of optionScenarios) {
      const options = scenario.options;

      // Should handle optional properties correctly
      if (options.configPath !== undefined) {
        assertEquals(
          typeof options.configPath,
          "string",
          `${scenario.name}: configPath should be string when present`
        );
        assertEquals(
          options.configPath.length > 0,
          true,
          `${scenario.name}: configPath should not be empty when present`
        );
      }

      if (options.workingDir !== undefined) {
        assertEquals(
          typeof options.workingDir,
          "string",
          `${scenario.name}: workingDir should be string when present`
        );
        assertEquals(
          options.workingDir.length > 0,
          true,
          `${scenario.name}: workingDir should not be empty when present`
        );
      }

      if (options.outputDir !== undefined) {
        assertEquals(
          typeof options.outputDir,
          "string",
          `${scenario.name}: outputDir should be string when present`
        );
        assertEquals(
          options.outputDir.length > 0,
          true,
          `${scenario.name}: outputDir should not be empty when present`
        );
      }

      // Should model partial configuration correctly
      assertEquals(
        typeof options,
        "object",
        `${scenario.name}: should be object type`
      );
      assertEquals(
        options !== null,
        true,
        `${scenario.name}: should not be null`
      );
    }

    logger.debug("Optional override modeling completed");
  });

  it("should support incremental configuration building", () => {
    logger.debug("Testing incremental configuration building");

    // Should support building options incrementally
    let options: ConfigOptions = {};

    // Start with empty options
    assertEquals(Object.keys(options).length, 0, "Should start with empty options");

    // Add config path
    options = { ...options, configPath: "/step1/config.yml" };
    assertEquals(options.configPath, "/step1/config.yml", "Should add config path");
    assertEquals(options.workingDir, undefined, "Other options should remain undefined");

    // Add working directory
    options = { ...options, workingDir: "/step2/workspace" };
    assertEquals(options.configPath, "/step1/config.yml", "Should preserve config path");
    assertEquals(options.workingDir, "/step2/workspace", "Should add working directory");
    assertEquals(options.outputDir, undefined, "Output dir should remain undefined");

    // Add output directory
    options = { ...options, outputDir: "/step3/output" };
    assertEquals(options.configPath, "/step1/config.yml", "Should preserve config path");
    assertEquals(options.workingDir, "/step2/workspace", "Should preserve working directory");
    assertEquals(options.outputDir, "/step3/output", "Should add output directory");

    // Should support overriding existing options
    options = { ...options, configPath: "/updated/config.yml" };
    assertEquals(options.configPath, "/updated/config.yml", "Should update config path");
    assertEquals(options.workingDir, "/step2/workspace", "Should preserve other options");

    logger.debug("Incremental configuration building completed");
  });
});

describe("Behavior: Configuration Validation Patterns", () => {
  it("should support common validation patterns", () => {
    logger.debug("Testing validation patterns");

    // Pattern: Required field validation
    function validateRequiredConfig(config: BreakdownConfig): string[] {
      const errors: string[] = [];
      
      if (!config.working_directory) {
        errors.push("working_directory is required");
      }
      if (!config.output_directory) {
        errors.push("output_directory is required");
      }
      if (!config.default_config_path) {
        errors.push("default_config_path is required");
      }
      
      return errors;
    }

    const validConfig: BreakdownConfig = {
      working_directory: "/valid",
      output_directory: "/valid/out",
      default_config_path: "/valid/config.yml"
    };

    const invalidConfig = {
      working_directory: "",
      output_directory: "/out",
      default_config_path: ""
    } as BreakdownConfig;

    assertEquals(
      validateRequiredConfig(validConfig).length,
      0,
      "Valid config should pass validation"
    );
    assertEquals(
      validateRequiredConfig(invalidConfig).length > 0,
      true,
      "Invalid config should fail validation"
    );

    // Pattern: Optional field validation
    function validateOptionalConfig(options: ConfigOptions): string[] {
      const errors: string[] = [];
      
      if (options.configPath !== undefined && !options.configPath) {
        errors.push("configPath cannot be empty string");
      }
      if (options.workingDir !== undefined && !options.workingDir) {
        errors.push("workingDir cannot be empty string");
      }
      if (options.outputDir !== undefined && !options.outputDir) {
        errors.push("outputDir cannot be empty string");
      }
      
      return errors;
    }

    const validOptions: ConfigOptions = {
      configPath: "/valid/config.yml"
    };

    const invalidOptions: ConfigOptions = {
      configPath: "",
      workingDir: "/valid"
    };

    assertEquals(
      validateOptionalConfig(validOptions).length,
      0,
      "Valid options should pass validation"
    );
    assertEquals(
      validateOptionalConfig(invalidOptions).length > 0,
      true,
      "Options with empty strings should fail validation"
    );

    logger.debug("Validation patterns completed");
  });

  it("should support path validation patterns", () => {
    logger.debug("Testing path validation patterns");

    // Pattern: Path format validation
    function validatePathFormat(path: string): boolean {
      // Simple validation: not empty and not just whitespace
      return path.trim().length > 0;
    }

    // Pattern: Path type validation  
    function validatePathType(path: string, expectedType: 'file' | 'directory'): boolean {
      if (expectedType === 'file') {
        // Config files should have extensions
        return path.includes('.') && !path.endsWith('/');
      } else {
        // Directories can end with / or not
        return !path.includes('.') || path.endsWith('/');
      }
    }

    const testPaths = [
      { path: "/valid/directory", type: "directory" as const, valid: true },
      { path: "/valid/config.yml", type: "file" as const, valid: true },
      { path: "", type: "directory" as const, valid: false },
      { path: "   ", type: "file" as const, valid: false },
      { path: "/directory/", type: "directory" as const, valid: true },
      { path: "/file.txt", type: "file" as const, valid: true }
    ];

    for (const test of testPaths) {
      const formatValid = validatePathFormat(test.path);
      const typeValid = validatePathType(test.path, test.type);

      if (test.valid) {
        assertEquals(
          formatValid && typeValid,
          true,
          `Path should be valid: ${test.path} (${test.type})`
        );
      } else {
        assertEquals(
          formatValid,
          false,
          `Path should be invalid: ${test.path} (${test.type})`
        );
      }
    }

    logger.debug("Path validation patterns completed");
  });
});

describe("Behavior: Configuration Composition", () => {
  it("should support configuration merging strategies", () => {
    logger.debug("Testing configuration merging");

    // Strategy: Override non-null options
    function mergeWithOverride(base: BreakdownConfig, options: ConfigOptions): BreakdownConfig {
      return {
        working_directory: options.workingDir ?? base.working_directory,
        output_directory: options.outputDir ?? base.output_directory,
        default_config_path: options.configPath ?? base.default_config_path
      };
    }

    const baseConfig: BreakdownConfig = {
      working_directory: "/base/work",
      output_directory: "/base/output",
      default_config_path: "/base/config.yml"
    };

    const partialOverride: ConfigOptions = {
      workingDir: "/override/work",
      configPath: "/override/config.yml"
      // outputDir intentionally omitted
    };

    const merged = mergeWithOverride(baseConfig, partialOverride);

    assertEquals(merged.working_directory, "/override/work", "Should override working directory");
    assertEquals(merged.output_directory, "/base/output", "Should keep base output directory");
    assertEquals(merged.default_config_path, "/override/config.yml", "Should override config path");

    // Strategy: Conditional merging
    function mergeWithConditions(base: BreakdownConfig, options: ConfigOptions): BreakdownConfig {
      return {
        working_directory: (options.workingDir && options.workingDir.length > 0) 
          ? options.workingDir 
          : base.working_directory,
        output_directory: (options.outputDir && options.outputDir.length > 0)
          ? options.outputDir 
          : base.output_directory,
        default_config_path: (options.configPath && options.configPath.length > 0)
          ? options.configPath 
          : base.default_config_path
      };
    }

    const conditionalOptions: ConfigOptions = {
      workingDir: "", // Empty string should not override
      outputDir: "/valid/output", // Valid string should override
      configPath: undefined // Undefined should not override
    };

    const conditionalMerged = mergeWithConditions(baseConfig, conditionalOptions);

    assertEquals(conditionalMerged.working_directory, "/base/work", "Should not override with empty string");
    assertEquals(conditionalMerged.output_directory, "/valid/output", "Should override with valid string");
    assertEquals(conditionalMerged.default_config_path, "/base/config.yml", "Should not override with undefined");

    logger.debug("Configuration merging completed");
  });

  it("should support configuration transformation patterns", () => {
    logger.debug("Testing configuration transformation");

    // Transform: Normalize paths
    function normalizeConfig(config: BreakdownConfig): BreakdownConfig {
      const normalizePath = (path: string): string => {
        return path.replace(/\\/g, '/').replace(/\/+/g, '/');
      };

      return {
        working_directory: normalizePath(config.working_directory),
        output_directory: normalizePath(config.output_directory),
        default_config_path: normalizePath(config.default_config_path)
      };
    }

    const unnormalizedConfig: BreakdownConfig = {
      working_directory: "C:\\Users\\user\\\\project",
      output_directory: "/home//user///output",
      default_config_path: "..\\..\\config.yml"
    };

    const normalized = normalizeConfig(unnormalizedConfig);

    assertEquals(normalized.working_directory, "C:/Users/user/project", "Should normalize backslashes and duplicates");
    assertEquals(normalized.output_directory, "/home/user/output", "Should normalize duplicate slashes");
    assertEquals(normalized.default_config_path, "../../config.yml", "Should normalize relative path separators");

    // Transform: Resolve relative paths
    function resolveRelativePaths(config: BreakdownConfig, basePath: string): BreakdownConfig {
      const resolvePath = (path: string): string => {
        if (path.startsWith('/') || path.includes(':')) {
          return path; // Absolute path
        }
        return `${basePath}/${path}`.replace(/\/+/g, '/');
      };

      return {
        working_directory: resolvePath(config.working_directory),
        output_directory: resolvePath(config.output_directory),
        default_config_path: resolvePath(config.default_config_path)
      };
    }

    const relativeConfig: BreakdownConfig = {
      working_directory: "./workspace",
      output_directory: "./output",
      default_config_path: "./config.yml"
    };

    const resolved = resolveRelativePaths(relativeConfig, "/home/user/project");

    assertEquals(resolved.working_directory, "/home/user/project/workspace", "Should resolve relative working directory");
    assertEquals(resolved.output_directory, "/home/user/project/output", "Should resolve relative output directory");
    assertEquals(resolved.default_config_path, "/home/user/project/config.yml", "Should resolve relative config path");

    logger.debug("Configuration transformation completed");
  });
});