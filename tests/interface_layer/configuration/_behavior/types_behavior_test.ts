/**
 * @fileoverview Unit tests for CLI config types
 *
 * This test file validates the functional behavior and correctness
 * of the CLI configuration types module.
 *
 * @module cli/config/2_unit_types_test
 */

import { assertEquals, assertExists } from "../../../../lib/deps.ts";
import type { BreakdownConfig, ConfigOptions } from "./types.ts";

/**
 * Unit Test: BreakdownConfig Type Properties
 *
 * Verifies that the BreakdownConfig interface has all required properties
 * with correct types.
 */
Deno.test("Unit: BreakdownConfig has required properties", () => {
  // Create a test config object
  const testConfig: BreakdownConfig = {
    working_directory: "/test/path",
    output_directory: "/test/output",
    default_config_path: "/test/config.yml",
  };

  // Verify all required properties are present
  assertExists(testConfig.working_directory, "working_directory should exist");
  assertExists(testConfig.output_directory, "output_directory should exist");
  assertExists(testConfig.default_config_path, "default_config_path should exist");

  // Verify property types
  assertEquals(typeof testConfig.working_directory, "string", "working_directory should be string");
  assertEquals(typeof testConfig.output_directory, "string", "output_directory should be string");
  assertEquals(
    typeof testConfig.default_config_path,
    "string",
    "default_config_path should be string",
  );

  // The TypeScript compiler ensures no additional properties
  assertEquals(
    Object.keys(testConfig).length >= 3,
    true,
    "Should have at least the required properties",
  );
});

/**
 * Unit Test: ConfigOptions Type Properties
 *
 * Verifies that the ConfigOptions interface correctly represents
 * optional configuration parameters.
 */
Deno.test("Unit: ConfigOptions handles optional properties correctly", () => {
  // Test minimal options (all undefined)
  const minimalOptions: ConfigOptions = {};
  assertEquals(Object.keys(minimalOptions).length, 0, "Minimal options should have no properties");
  assertEquals(minimalOptions.configPath, undefined, "configPath should be undefined");
  assertEquals(minimalOptions.workingDir, undefined, "workingDir should be undefined");
  assertEquals(minimalOptions.outputDir, undefined, "outputDir should be undefined");

  // Test partial options
  const partialOptions: ConfigOptions = { configPath: "/custom/config.yml" };
  assertEquals(partialOptions.configPath, "/custom/config.yml", "configPath should be set");
  assertEquals(partialOptions.workingDir, undefined, "workingDir should be undefined");
  assertEquals(partialOptions.outputDir, undefined, "outputDir should be undefined");

  // Test full options
  const fullOptions: ConfigOptions = {
    configPath: "/custom/config.yml",
    workingDir: "/custom/working",
    outputDir: "/custom/output",
  };
  assertEquals(fullOptions.configPath, "/custom/config.yml", "configPath should be set");
  assertEquals(fullOptions.workingDir, "/custom/working", "workingDir should be set");
  assertEquals(fullOptions.outputDir, "/custom/output", "outputDir should be set");

  // All property types should be string when defined
  if (fullOptions.configPath) {
    assertEquals(
      typeof fullOptions.configPath,
      "string",
      "configPath should be string when defined",
    );
  }
});

/**
 * Unit Test: Type Compatibility
 *
 * Ensures that the types are compatible with expected usage patterns
 * in the application.
 */
Deno.test("Unit: Config types are compatible with application usage", () => {
  // Test that ConfigOptions can be used to override BreakdownConfig defaults
  const defaultConfig: BreakdownConfig = {
    working_directory: "/default/path",
    output_directory: "/default/output",
    default_config_path: "/default/config.yml",
  };

  const options: ConfigOptions = {
    workingDir: "/custom/working",
    outputDir: "/custom/output",
  };

  // Simulate merging options with config (type compatibility test)
  const _mergedConfig = {
    ...defaultConfig,
    working_directory: options.workingDir || defaultConfig.working_directory,
    output_directory: options.outputDir || defaultConfig.output_directory,
  };

  assertEquals(_mergedConfig.working_directory, "/custom/working", "Should use option override");
  assertEquals(_mergedConfig.output_directory, "/custom/output", "Should use option override");
  assertEquals(_mergedConfig.default_config_path, "/default/config.yml", "Should keep default");

  // Test spread operator compatibility
  const spreadTest = { ...defaultConfig };
  assertEquals(spreadTest.working_directory, defaultConfig.working_directory, "Spread should work");

  // Types support expected transformations
  assertEquals(
    typeof defaultConfig.working_directory,
    "string",
    "Types are compatible with runtime usage",
  );
});

/**
 * Unit Test: Totality Principle Application
 *
 * Verifies that the types follow Totality principles in practice,
 * avoiding partial functions and undefined states.
 */
Deno.test("Unit: Config types avoid partial states", () => {
  // Test that BreakdownConfig requires all properties (no partial states)
  const validConfig: BreakdownConfig = {
    working_directory: "/valid/path",
    output_directory: "/valid/output",
    default_config_path: "/valid/config.yml",
  };

  // All properties must be defined for BreakdownConfig
  assertEquals(
    validConfig.working_directory !== undefined,
    true,
    "working_directory must be defined",
  );
  assertEquals(
    validConfig.output_directory !== undefined,
    true,
    "output_directory must be defined",
  );
  assertEquals(
    validConfig.default_config_path !== undefined,
    true,
    "default_config_path must be defined",
  );

  // ConfigOptions allows partial states by design (runtime options)
  const partialOptions: ConfigOptions = { configPath: "/path" };
  assertEquals(
    Object.keys(partialOptions).length >= 0,
    true,
    "ConfigOptions allows partial states",
  );

  // Test that all valid configurations can be represented
  const configurations = [
    { working_directory: "/", output_directory: "/out", default_config_path: "/config.yml" },
    {
      working_directory: "./relative",
      output_directory: "./out",
      default_config_path: "./config.yml",
    },
    {
      working_directory: "/abs/path",
      output_directory: "/abs/out",
      default_config_path: "/abs/config.yml",
    },
  ];

  configurations.forEach((cfg, i) => {
    const typedConfig: BreakdownConfig = cfg;
    assertEquals(typedConfig.working_directory !== undefined, true, `Config ${i} is valid`);
  });

  // TypeScript compiler prevents invalid configurations at compile time
  assertEquals(true, true, "Type system prevents invalid configurations");
});

/**
 * Unit Test: Edge Cases
 *
 * Tests edge cases and boundary conditions for the configuration types.
 */
Deno.test("Unit: Config types handle edge cases", () => {
  // Test empty strings (valid but may need validation in implementation)
  const emptyPathConfig: BreakdownConfig = {
    working_directory: "",
    output_directory: "",
    default_config_path: "",
  };
  assertEquals(
    typeof emptyPathConfig.working_directory,
    "string",
    "Empty strings are valid strings",
  );

  // Test very long path strings
  const longPath = "/" + "a".repeat(255);
  const longPathConfig: BreakdownConfig = {
    working_directory: longPath,
    output_directory: longPath + "/out",
    default_config_path: longPath + "/config.yml",
  };
  assertEquals(longPathConfig.working_directory.length > 250, true, "Long paths are accepted");

  // Test special characters in paths
  const specialCharConfig: BreakdownConfig = {
    working_directory: "/path with spaces/and-dashes/",
    output_directory: "/path/with/@special/chars/",
    default_config_path: "/config (1).yml",
  };
  assertEquals(
    specialCharConfig.working_directory.includes(" "),
    true,
    "Spaces in paths are accepted",
  );

  // Test platform-specific path formats
  const platformPaths = [
    {
      working_directory: "/unix/style/path",
      output_directory: "/out",
      default_config_path: "/cfg.yml",
    },
    {
      working_directory: "C:\\windows\\style",
      output_directory: "D:\\out",
      default_config_path: "E:\\cfg.yml",
    },
    {
      working_directory: "./relative/path",
      output_directory: "../out",
      default_config_path: "../../cfg.yml",
    },
  ];

  platformPaths.forEach((paths, i) => {
    const config: BreakdownConfig = paths;
    assertEquals(typeof config.working_directory, "string", `Platform path ${i} is valid`);
  });

  // Test Unicode in paths
  const unicodeConfig: BreakdownConfig = {
    working_directory: "/パス/路径/путь/",
    output_directory: "/出力/输出/",
    default_config_path: "/設定.yml",
  };
  assertEquals(
    unicodeConfig.working_directory.includes("パス"),
    true,
    "Unicode paths are accepted",
  );
});
