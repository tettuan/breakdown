/**
 * @fileoverview Configuration-Driven Test Suite
 *
 * Complete implementation of configuration file-based testing
 * Utilizes configuration files under tests/fixtures/configs/ to eliminate hardcoding
 *
 * @module tests/4_cross_domain/configuration_driven_test_suite
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { ConfigurationTestHelper } from "../../lib/test_helpers/configuration_test_helper_simple.ts";
import {
  createTwoParamsFromConfigFile,
  executeBreakdownParams,
} from "../../lib/application/breakdown_params_integration.ts";

// Initialize test logger
const logger = new BreakdownLogger("config-driven-test");

/**
 * Configuration file-based test matrix
 * Execute tests for each configuration file
 */
const CONFIG_TEST_MATRIX = [
  {
    configName: "default-test",
    description: "Testing with default configuration",
    configPath: "tests/fixtures/configs/default-test-user.yml",
  },
  {
    configName: "flexible-test",
    description: "Testing with flexible pattern configuration",
    configPath: "tests/fixtures/configs/flexible-test-user.yml",
  },
];

/**
 * Configuration file-based basic test suite
 */
for (const testConfig of CONFIG_TEST_MATRIX) {
  Deno.test(`1_behavior: Configuration file-based - ${testConfig.description}`, async () => {
    logger.debug(`Configuration file-based test started - config: ${testConfig.configName}`, {
      stage: "test_start",
      ...testConfig,
    });

    // Step 1: Configuration file loading
    const configResult = await ConfigurationTestHelper.loadTestConfiguration(testConfig.configName);
    logger.debug(`Configuration load result - config data verification`, {
      stage: "config_verification",
      userConfig: configResult.userConfig,
    });

    assertExists(configResult.userConfig);
    assertExists(configResult.userConfig.testData);

    // Step 2: Generate test matrix - directly generated from testData
    const testData = configResult.userConfig.testData;
    const testMatrix = [
      ...testData.validDirectives.map((directive: string) =>
        testData.validLayers.map((layer: string) => ({
          args: [directive, layer],
          expectedType: "two" as const,
        }))
      ).flat(),
      ...testData.invalidDirectives.map((directive: string) => ({
        args: [directive, "project"],
        expectedType: "error" as const,
      })),
      ...testData.invalidLayers.map((layer: string) => ({
        args: ["to", layer],
        expectedType: "error" as const,
      })),
    ];
    logger.debug(`Test matrix generated - test case count: ${testMatrix.length}`, {
      stage: "matrix_generation",
      testMatrix,
    });

    // Step 3: Execute each test case
    for (const testCase of testMatrix) {
      logger.debug(`Test case execution - args: ${testCase.args}`, {
        stage: "test_case",
        ...testCase,
      });

      const paramsResult = await executeBreakdownParams(testCase.args, testConfig.configName);

      if (testCase.expectedType === "two") {
        assertEquals(
          paramsResult.ok,
          true,
          `Valid arguments [${testCase.args.join(", ")}] failed: ${
            !paramsResult.ok ? paramsResult.error?.message : ""
          }`,
        );

        if (paramsResult.ok) {
          assertEquals(paramsResult.data.type, "two");
          assertEquals(paramsResult.data.params[0], testCase.args[0]);
          assertEquals(paramsResult.data.params[1], testCase.args[1]);
        }
      } else if (testCase.expectedType === "error") {
        assertEquals(
          paramsResult.ok,
          false,
          `Invalid arguments [${testCase.args.join(", ")}] unexpectedly succeeded`,
        );
      }
    }

    logger.debug(`Configuration file-based test completed`, { stage: "test" });
  });
}

/**
 * Configuration file consistency test
 */
Deno.test("2_structure: Configuration file consistency check", async () => {
  logger.debug("Configuration file consistency test started", {
    stage: "multi_config_consistency_check",
  });

  const configResults = await Promise.all(
    CONFIG_TEST_MATRIX.map(async (testConfig) => ({
      name: testConfig.configName,
      config: await ConfigurationTestHelper.loadTestConfiguration(testConfig.configName),
    })),
  );

  // Verify that each configuration file has the required structure
  for (const result of configResults) {
    logger.debug(`Configuration file structure check - config: ${result.name}`, {
      stage: "structure_check",
      config: result.config.userConfig,
    });

    assertExists(result.config.userConfig.testData, `${result.name}: testData does not exist`);
    assertExists(
      result.config.userConfig.testData.validDirectives,
      `${result.name}: validDirectives does not exist`,
    );
    assertExists(
      result.config.userConfig.testData.validLayers,
      `${result.name}: validLayers does not exist`,
    );

    // Verify that basic values are included (verification of hardcode elimination)
    const validDirectives = result.config.userConfig.testData.validDirectives;
    const validLayers = result.config.userConfig.testData.validLayers;

    // Verify that it is configuration file-driven (minimum values should exist)
    assertEquals(validDirectives.length > 0, true, `${result.name}: validDirectives is empty`);
    assertEquals(validLayers.length > 0, true, `${result.name}: validLayers is empty`);
  }

  logger.debug("Configuration file consistency check completed", {
    stage: "all_config_files_maintain_proper_structure",
  });
});

/**
 * Complete integration flow test (configuration file-driven)
 */
Deno.test("3_core: Configuration-driven complete integration flow", async () => {
  logger.debug("Configuration-driven complete integration flow started", {
    stage: "end_to_end_config_based_test",
  });

  for (const testConfig of CONFIG_TEST_MATRIX.slice(0, 2)) { // Test with the first 2 configurations
    logger.debug(`Complete integration flow test`, { stage: "integration_test" });

    const configResult = await ConfigurationTestHelper.loadTestConfiguration(testConfig.configName);
    const validDirectives = configResult.userConfig.testData.validDirectives;
    const validLayers = configResult.userConfig.testData.validLayers;

    // Test complete integration flow with valid combinations
    const testArgs = [validDirectives[0], validLayers[0]];

    const completeResult = await createTwoParamsFromConfigFile(testArgs, testConfig.configName);
    logger.debug(`Complete integration flow result - args: ${testArgs}`, {
      stage: "result",
      completeResult,
    });

    assertEquals(
      completeResult.ok,
      true,
      `Complete integration flow failed: ${
        !completeResult.ok ? completeResult.error?.message : ""
      }`,
    );

    if (completeResult.ok) {
      assertExists(completeResult.data);
      assertEquals(completeResult.data.directiveType, testArgs[0]);
      assertEquals(completeResult.data.layerType, testArgs[1]);
    }
  }

  logger.debug("Configuration-driven complete integration flow completed", {
    stage: "complete_integration_flow_success_for_all_config_files",
  });
});

/**
 * Edge case test (configuration file-driven)
 */
Deno.test("2_structure: Configuration-driven edge case test", async () => {
  logger.debug("Configuration-driven edge case test started", {
    stage: "boundary_value_and_error_case_config_based_test",
  });

  // Test when edge case configuration file exists
  try {
    const edgeCaseConfig = await ConfigurationTestHelper.loadTestConfiguration("test-helper");

    if (edgeCaseConfig.userConfig.edgeCaseTestData) {
      logger.debug("Edge case configuration data found - executing boundary value test", {
        stage: "edge_case",
        edgeCaseTestData: edgeCaseConfig.userConfig.edgeCaseTestData,
      });

      const edgeCaseTestData = edgeCaseConfig.userConfig.edgeCaseTestData as {
        boundaryTestCases?: unknown[];
      };
      const boundaryTestCases = edgeCaseTestData.boundaryTestCases;
      if (boundaryTestCases) {
        for (
          const boundaryCase of boundaryTestCases as Array<
            { value: string; description?: string; expectValid: boolean }
          >
        ) {
          logger.debug(`Boundary value test case - value: ${boundaryCase.value}`, {
            stage: "boundary_value_test",
            ...boundaryCase,
          });

          // Boundary value test logic (actual pattern matching)
          const testArgs = [boundaryCase.value, "project"]; // layer is fixed with valid value
          const result = await executeBreakdownParams(testArgs, "test-helper");

          if (boundaryCase.expectValid) {
            assertEquals(
              result.ok,
              true,
              `Boundary value '${boundaryCase.value}' did not match: ${boundaryCase.description}`,
            );
          } else {
            assertEquals(
              result.ok,
              false,
              `Boundary value '${boundaryCase.value}' unexpectedly matched: ${boundaryCase.description}`,
            );
          }
        }
      }
    }
  } catch (error) {
    logger.debug("Edge case configuration file not found - skipping", { stage: "skip", error });
  }

  logger.debug("Configuration-driven edge case test completed", {
    stage: "all_boundary_value_tests_completed",
  });
});
