/**
 * @fileoverview Dynamic Pattern Generation Test
 *
 * Tests the dynamic generation functionality of ConfigurationPatternGenerator and ConfigurationTestHelper
 * Verification of hardcoded array elimination
 *
 * @module tests/4_cross_domain/dynamic_pattern_generation_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { ConfigurationTestHelper } from "../../lib/test_helpers/configuration_test_helper_simple.ts";
import { ConfigurationPatternGenerator } from "../../lib/test_helpers/configuration_pattern_generator.ts";

// Test logger initialization
const logger = new BreakdownLogger("dynamic-pattern-test");

Deno.test("3_core: Dynamic pattern generation - ConfigurationPatternGenerator basic functionality", () => {
  logger.debug("ConfigurationPatternGenerator basic functionality test started", {
    tag: "dynamic-generation-from-pattern-test",
  });

  // Strict pattern test
  const strictConfig = {
    directiveType: { pattern: "^(to|summary|defect)$" },
    layerType: { pattern: "^(project|issue|task)$" },
  };

  const strictData = ConfigurationPatternGenerator.generateTestData(strictConfig);

  logger.debug("Strict pattern generation result", { tag: "pattern-test", data: strictData });

  // Verify that expected values are included
  assertEquals(strictData.validDirectives.includes("to"), true);
  assertEquals(strictData.validDirectives.includes("summary"), true);
  assertEquals(strictData.validDirectives.includes("defect"), true);
  assertEquals(strictData.validLayers.includes("project"), true);
  assertEquals(strictData.validLayers.includes("issue"), true);
  assertEquals(strictData.validLayers.includes("task"), true);

  // Verify that invalid values are also generated
  assertEquals(strictData.invalidDirectives.length > 0, true);
  assertEquals(strictData.invalidLayers.length > 0, true);

  logger.debug("ConfigurationPatternGenerator basic functionality verification completed", {
    tag: "strict-pattern-generation-success",
  });
});

Deno.test("3_core: Dynamic pattern generation - Flexible pattern generation", () => {
  logger.debug("Flexible pattern generation test started", {
    tag: "pattern-test-with-hash-symbols",
  });

  // Flexible pattern test
  const flexibleConfig = {
    directiveType: { pattern: "^[a-z0-9_#-]{2,20}$" },
    layerType: { pattern: "^[a-z0-9_#-]{2,20}$" },
  };

  const flexibleData = ConfigurationPatternGenerator.generateTestData(flexibleConfig);

  logger.debug("Flexible pattern generation result", { tag: "pattern-test", data: flexibleData });

  // Verify that basic values are included
  assertEquals(flexibleData.validDirectives.length > 0, true);
  assertEquals(flexibleData.validLayers.length > 0, true);

  // Verify that values containing hash symbols are included (when pattern supports them)
  const hasHashValue = flexibleData.validDirectives.some((d) => d.includes("#")) ||
    flexibleData.validLayers.some((l) => l.includes("#"));
  assertEquals(hasHashValue, true, "Values containing hash symbols should be generated");

  logger.debug("Flexible pattern generation verification completed", {
    tag: "pattern-generation-with-hash-symbols-success",
  });
});

Deno.test("2_structure: Dynamic pattern generation - ConfigurationTestHelper integration", async () => {
  logger.debug("ConfigurationTestHelper integration test started", {
    tag: "dynamic-generation-and-helper-integration",
  });

  // Use flexible-test-user.yml (already changed to dynamic generation)
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("flexible-test");

  logger.debug("Dynamic generation configuration load result", {
    tag: "config-load",
    config: configResult.userConfig,
  });

  assertExists(configResult.userConfig);
  assertExists(configResult.userConfig.testData);

  // Verify that dynamically generated data is included
  const testData = configResult.userConfig.testData;
  assertEquals(Array.isArray(testData.validDirectives), true);
  assertEquals(Array.isArray(testData.validLayers), true);
  assertEquals(Array.isArray(testData.invalidDirectives), true);
  assertEquals(Array.isArray(testData.invalidLayers), true);

  // Verify that dynamically generated data has values
  assertEquals(testData.validDirectives.length > 0, true);
  assertEquals(testData.validLayers.length > 0, true);
  assertEquals(testData.invalidDirectives.length > 0, true);
  assertEquals(testData.invalidLayers.length > 0, true);

  logger.debug("Dynamic generation data verification", {
    tag: "data-verification",
    validDirectives: testData.validDirectives,
    validLayers: testData.validLayers,
  });

  logger.debug("ConfigurationTestHelper integration verification completed", {
    tag: "dynamic-generation-integration-success",
  });
});

Deno.test(
  "1_behavior: Hardcode elimination verification - Pattern file dynamization",
  async () => {
    logger.debug("Hardcode elimination verification started", {
      tag: "all-pattern-files-dynamization-verification",
    });

    const patternConfigs = [
      { name: "basic", configName: "basic" },
      { name: "strict", configName: "strict" },
      { name: "liberal", configName: "liberal" },
      { name: "flexible-test", configName: "flexible-test" },
      { name: "default-matching", configName: "default-matching" },
      { name: "edge-case", configName: "edge-case" },
    ];

    for (const config of patternConfigs) {
      logger.debug(`Pattern file dynamization verification: ${config.name}`, { stage: "test" });

      try {
        const result = await ConfigurationTestHelper.loadTestConfiguration(config.configName);

        // Verify that dynamically generated data is loaded correctly
        assertExists(result.userConfig.testData);
        assertEquals(Array.isArray(result.userConfig.testData.validDirectives), true);
        assertEquals(Array.isArray(result.userConfig.testData.validLayers), true);

        // Verify that it's not empty (dynamic generation succeeded)
        assertEquals(
          result.userConfig.testData.validDirectives.length > 0,
          true,
          `${config.name}: validDirectives is empty`,
        );
        assertEquals(
          result.userConfig.testData.validLayers.length > 0,
          true,
          `${config.name}: validLayers is empty`,
        );

        logger.debug(`${config.name} dynamization verification completed`, {
          tag: "verification-completed",
          validDirectivesCount: result.userConfig.testData.validDirectives.length,
          validLayersCount: result.userConfig.testData.validLayers.length,
        });
      } catch (error) {
        logger.debug(`${config.name} dynamization failed`, { tag: "failed", error });
        throw error;
      }
    }

    logger.debug("Hardcode elimination verification completed", {
      tag: "all-pattern-files-dynamization-success",
    });
  },
);
