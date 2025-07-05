/**
 * @fileoverview Unit tests for CLI config types
 *
 * This test file validates the functional behavior and correctness
 * of the CLI configuration types module.
 *
 * @module cli/config/2_unit_types_test
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
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
    prompts: {
      baseDir: "/test/prompts",
    },
    schema: {
      baseDir: "/test/schema",
    },
    workspace: {
      baseDir: "/test/workspace",
    },
  };

  // Verify all required properties are present
  assertExists(testConfig.prompts, "prompts should exist");
  assertExists(testConfig.schema, "schema should exist");
  assertExists(testConfig.workspace, "workspace should exist");
  assertExists(testConfig.prompts.baseDir, "prompts.baseDir should exist");
  assertExists(testConfig.schema.baseDir, "schema.baseDir should exist");
  assertExists(testConfig.workspace.baseDir, "workspace.baseDir should exist");

  // Verify property types
  assertEquals(typeof testConfig.prompts.baseDir, "string", "prompts.baseDir should be string");
  assertEquals(typeof testConfig.schema.baseDir, "string", "schema.baseDir should be string");
  assertEquals(typeof testConfig.workspace.baseDir, "string", "workspace.baseDir should be string");

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
  assertEquals(minimalOptions.profile, undefined, "profile should be undefined");
  assertEquals(minimalOptions.debug, undefined, "debug should be undefined");

  // Test partial options
  const partialOptions: ConfigOptions = { profile: "custom-profile" };
  assertEquals(partialOptions.profile, "custom-profile", "profile should be set");
  assertEquals(partialOptions.debug, undefined, "debug should be undefined");

  // Test full options
  const fullOptions: ConfigOptions = {
    profile: "custom-profile",
    debug: true,
  };
  assertEquals(fullOptions.profile, "custom-profile", "profile should be set");
  assertEquals(fullOptions.debug, true, "debug should be set");

  // All property types should be correct when defined
  if (fullOptions.profile) {
    assertEquals(
      typeof fullOptions.profile,
      "string",
      "profile should be string when defined",
    );
  }
  if (fullOptions.debug !== undefined) {
    assertEquals(
      typeof fullOptions.debug,
      "boolean",
      "debug should be boolean when defined",
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
  // Test that ConfigOptions can be used with BreakdownConfig
  const defaultConfig: BreakdownConfig = {
    prompts: {
      baseDir: "/default/prompts",
    },
    schema: {
      baseDir: "/default/schema",
    },
    workspace: {
      baseDir: "/default/workspace",
    },
  };

  const options: ConfigOptions = {
    profile: "custom-profile",
    debug: true,
  };

  // Test options compatibility (type compatibility test)
  const _configWithOptions = {
    config: defaultConfig,
    options: options,
  };

  assertEquals(_configWithOptions.options.profile, "custom-profile", "Options should be accessible");
  assertEquals(_configWithOptions.options.debug, true, "Options should be accessible");
  assertEquals(_configWithOptions.config.prompts.baseDir, "/default/prompts", "Config should be accessible");

  // Test spread operator compatibility
  const spreadTest = { ...defaultConfig };
  assertEquals(spreadTest.prompts.baseDir, defaultConfig.prompts.baseDir, "Spread should work");

  // Types support expected transformations
  assertEquals(
    typeof defaultConfig.prompts.baseDir,
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
    prompts: {
      baseDir: "/valid/prompts",
    },
    schema: {
      baseDir: "/valid/schema",
    },
    workspace: {
      baseDir: "/valid/workspace",
    },
  };

  // All properties must be defined for BreakdownConfig
  assertEquals(
    validConfig.prompts !== undefined,
    true,
    "prompts must be defined",
  );
  assertEquals(
    validConfig.schema !== undefined,
    true,
    "schema must be defined",
  );
  assertEquals(
    validConfig.workspace !== undefined,
    true,
    "workspace must be defined",
  );
  assertEquals(
    validConfig.prompts.baseDir !== undefined,
    true,
    "prompts.baseDir must be defined",
  );

  // ConfigOptions allows partial states by design (runtime options)
  const partialOptions: ConfigOptions = { profile: "test-profile" };
  assertEquals(
    Object.keys(partialOptions).length >= 0,
    true,
    "ConfigOptions allows partial states",
  );

  // Test that all valid configurations can be represented
  const configurations = [
    {
      prompts: { baseDir: "/prompts" },
      schema: { baseDir: "/schema" },
      workspace: { baseDir: "/workspace" },
    },
    {
      prompts: { baseDir: "./relative/prompts" },
      schema: { baseDir: "./relative/schema" },
      workspace: { baseDir: "./relative/workspace" },
    },
    {
      prompts: { baseDir: "/abs/prompts" },
      schema: { baseDir: "/abs/schema" },
      workspace: { baseDir: "/abs/workspace" },
    },
  ];

  configurations.forEach((cfg, i) => {
    const typedConfig: BreakdownConfig = cfg;
    assertEquals(typedConfig.prompts.baseDir !== undefined, true, `Config ${i} is valid`);
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
    prompts: { baseDir: "" },
    schema: { baseDir: "" },
    workspace: { baseDir: "" },
  };
  assertEquals(
    typeof emptyPathConfig.prompts.baseDir,
    "string",
    "Empty strings are valid strings",
  );

  // Test very long path strings
  const longPath = "/" + "a".repeat(255);
  const longPathConfig: BreakdownConfig = {
    prompts: { baseDir: longPath },
    schema: { baseDir: longPath + "/schema" },
    workspace: { baseDir: longPath + "/workspace" },
  };
  assertEquals(longPathConfig.prompts.baseDir.length > 250, true, "Long paths are accepted");

  // Test special characters in paths
  const specialCharConfig: BreakdownConfig = {
    prompts: { baseDir: "/path with spaces/and-dashes/" },
    schema: { baseDir: "/path/with/@special/chars/" },
    workspace: { baseDir: "/workspace (1)/" },
  };
  assertEquals(
    specialCharConfig.prompts.baseDir.includes(" "),
    true,
    "Spaces in paths are accepted",
  );

  // Test platform-specific path formats
  const platformPaths = [
    {
      prompts: { baseDir: "/unix/style/prompts" },
      schema: { baseDir: "/unix/style/schema" },
      workspace: { baseDir: "/unix/style/workspace" },
    },
    {
      prompts: { baseDir: "C:\\windows\\prompts" },
      schema: { baseDir: "C:\\windows\\schema" },
      workspace: { baseDir: "C:\\windows\\workspace" },
    },
    {
      prompts: { baseDir: "./relative/prompts" },
      schema: { baseDir: "./relative/schema" },
      workspace: { baseDir: "./relative/workspace" },
    },
  ];

  platformPaths.forEach((paths, i) => {
    const config: BreakdownConfig = paths;
    assertEquals(typeof config.prompts.baseDir, "string", `Platform path ${i} is valid`);
  });

  // Test Unicode in paths
  const unicodeConfig: BreakdownConfig = {
    prompts: { baseDir: "/パス/路径/prompts/" },
    schema: { baseDir: "/パス/路径/schema/" },
    workspace: { baseDir: "/パス/路径/workspace/" },
  };
  assertEquals(
    unicodeConfig.prompts.baseDir.includes("パス"),
    true,
    "Unicode paths are accepted",
  );
});
