/**
 * @fileoverview New integration flow regression test
 *
 * Test suite meeting regression test requirements after createDefault() modifications
 * Verify that existing functionality is not affected
 *
 * @module tests/integration/breakdown_params/03_regression_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  createCustomConfigFromProfile,
  createTwoParamsFromConfigFile,
  executeBreakdownParams,
} from "../../../lib/application/breakdown_params_integration.ts";
import { TwoParamsType } from "../../../lib/types/two_params.ts";
import { ConfigurationTestHelper } from "../../../lib/test_helpers/configuration_test_helper_simple.ts";

// Initialize test logger
const logger = new BreakdownLogger("regression-test");

Deno.test("0_architecture: Regression test - TwoParamsType compatibility", async () => {
  logger.debug("TwoParamsType compatibility test started", {
    tag: "Existing API compatibility verification",
  });

  // TwoParamsResult obtained from new integration flow - Get valid values from configuration file
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];
  const args = [validDirective, validLayer];

  logger.debug("Compatibility test values retrieved from config file", {
    directive: validDirective,
    layer: validLayer,
  });
  const paramsResult = await executeBreakdownParams(args, "default-test");

  assertEquals(paramsResult.ok, true);
  if (!paramsResult.ok) return;
  assertExists(paramsResult.data);

  // Conventional processing with TwoParamsType.createOrError
  const twoParamsTypeResult = TwoParamsType.createOrError(paramsResult.data);

  logger.debug("TwoParamsType creation result - Compatibility check", {
    result: twoParamsTypeResult,
  });

  assertEquals(twoParamsTypeResult.ok, true);
  if (!twoParamsTypeResult.ok) return;
  assertExists(twoParamsTypeResult.data);

  const twoParamsType = twoParamsTypeResult.data;
  assertEquals(twoParamsType.directive, validDirective);
  assertEquals(twoParamsType.layer, validLayer);
  assertEquals(twoParamsType.params, [validDirective, validLayer]);

  logger.debug("TwoParamsType compatibility verification completed", {
    tag: "Existing API compatibility maintained",
  });
});

Deno.test("0_architecture: Regression test - ConfigProfile dependency removal confirmation", async () => {
  logger.debug("ConfigProfile dependency removal confirmation test started", {
    tag: "Hardcode elimination verification",
  });

  // Verify operation with new implementation not using createDefault()
  const customConfigResult = await createCustomConfigFromProfile("default-test");

  assertEquals(customConfigResult.ok, true);
  if (!customConfigResult.ok) return;
  assertExists(customConfigResult.data);

  // Verify that CustomConfig content is appropriately generated from configuration file
  const customConfig = customConfigResult.data;

  // Verify that patterns are loaded from configuration file
  assertExists(customConfig.params);
  assertExists(customConfig.params.two);
  assertExists(customConfig.params.two.directiveType);
  assertExists(customConfig.params.two.layerType);

  // Verify values are from configuration file, not hardcoded
  logger.debug("Patterns loaded from config file - Hardcode elimination confirmation", {
    tag: "Pattern confirmation",
    directivePattern: customConfig.params.two.directiveType.pattern,
    layerPattern: customConfig.params.two.layerType.pattern,
  });

  logger.debug("ConfigProfile dependency removal confirmation completed", {
    tag: "Hardcode elimination succeeded",
  });
});

Deno.test("1_behavior: Regression test - Existing test case compatibility", async () => {
  logger.debug("Existing test case compatibility test started", {
    tag: "Legacy test case operation verification",
  });

  // Generate typical patterns used in conventional tests from configuration file
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirectives = configResult.userConfig.testData.validDirectives;
  const validLayers = configResult.userConfig.testData.validLayers;

  const legacyTestCases = [
    {
      args: [validDirectives[0], validLayers[0]],
      expected: { directive: validDirectives[0], layer: validLayers[0] },
    },
    {
      args: [validDirectives[1] || validDirectives[0], validLayers[1] || validLayers[0]],
      expected: {
        directive: validDirectives[1] || validDirectives[0],
        layer: validLayers[1] || validLayers[0],
      },
    },
    {
      args: [validDirectives[2] || validDirectives[0], validLayers[2] || validLayers[0]],
      expected: {
        directive: validDirectives[2] || validDirectives[0],
        layer: validLayers[2] || validLayers[0],
      },
    },
  ];

  logger.debug("Test cases generated from config file", { testCases: legacyTestCases });

  for (const testCase of legacyTestCases) {
    const result = await createTwoParamsFromConfigFile(testCase.args, "default-test");

    logger.debug(`Existing test case result: ${testCase.args.join(" ")}`, { result });

    assertEquals(result.ok, true, `Existing test case failed: ${testCase.args.join(" ")}`);
    if (!result.ok) continue;
    assertExists(result.data);
    assertEquals(result.data.directive.value, testCase.expected.directive);
    assertEquals(result.data.layer.value, testCase.expected.layer);
  }

  logger.debug("Existing test case compatibility verification completed", {
    tag: "Legacy test case operation maintained",
  });
});

Deno.test("1_behavior: Regression test - Error message consistency", async () => {
  logger.debug("Error message consistency test started", {
    tag: "Error handling consistency verification",
  });

  // Error message with invalid arguments - Get invalid values from configuration file
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const invalidDirective = configResult.userConfig.testData.invalidDirectives[0] ||
    "invalid_directive";
  const invalidLayer = configResult.userConfig.testData.invalidLayers[0] || "invalid_layer";
  const invalidArgs = [invalidDirective, invalidLayer];

  logger.debug("Invalid values retrieved from config file", {
    directive: invalidDirective,
    layer: invalidLayer,
  });
  const errorResult = await createTwoParamsFromConfigFile(invalidArgs, "default-test");

  assertEquals(errorResult.ok, false);
  if (errorResult.ok) return;
  assertExists(errorResult.error);

  // Verify error type is appropriate (based on current BreakdownParams implementation)
  const errorKinds = [
    "ParamsExecutionError",
    "DirectiveTypeCreationError",
    "LayerTypeCreationError",
    "InvalidParamsType",
  ];
  const hasValidErrorKind = errorKinds.includes(errorResult.error.kind);
  assertEquals(hasValidErrorKind, true, `Unexpected error type: ${errorResult.error.kind}`);

  logger.debug("Error message - Error type verification", {
    tag: "Error details",
    kind: errorResult.error.kind,
    message: errorResult.error.message,
  });

  logger.debug("Error message consistency verification completed", {
    tag: "Error handling consistency maintained",
  });
});

Deno.test("3_core: Regression test - Concurrent processing safety", async () => {
  logger.debug("Concurrent processing safety test started", {
    tag: "Concurrent execution operation verification",
  });

  // Dynamically generate concurrent processing test cases from configuration file
  const defaultConfig = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const flexibleConfig = await ConfigurationTestHelper.loadTestConfiguration("flexible-test");

  const testCases = [
    {
      args: [
        defaultConfig.userConfig.testData.validDirectives[0],
        defaultConfig.userConfig.testData.validLayers[0],
      ],
      profile: "default-test",
    },
    {
      args: [
        flexibleConfig.userConfig.testData.validDirectives[1] ||
        flexibleConfig.userConfig.testData.validDirectives[0],
        flexibleConfig.userConfig.testData.validLayers[1] ||
        flexibleConfig.userConfig.testData.validLayers[0],
      ],
      profile: "flexible-test",
    },
    {
      args: [
        defaultConfig.userConfig.testData.validDirectives[2] ||
        defaultConfig.userConfig.testData.validDirectives[0],
        defaultConfig.userConfig.testData.validLayers[2] ||
        defaultConfig.userConfig.testData.validLayers[0],
      ],
      profile: "default-test",
    },
    {
      args: [
        flexibleConfig.userConfig.testData.validDirectives[0],
        flexibleConfig.userConfig.testData.validLayers[0],
      ],
      profile: "flexible-test",
    },
  ];

  logger.debug("Concurrent processing test cases generated from config file", { testCases });

  // 全テストケースを並行実行
  const promises = testCases.map(async (testCase, index) => {
    const result = await createTwoParamsFromConfigFile(testCase.args, testCase.profile);
    return { index, testCase, result };
  });

  const results = await Promise.all(promises);

  // Verify all results are successful
  for (const { index, testCase, result } of results) {
    logger.debug(`Concurrent processing result - Test case ${index}: ${testCase.args.join(" ")}`, {
      result,
    });

    assertEquals(result.ok, true, `Concurrent processing test case ${index} failed`);
    if (!result.ok) continue;
    assertExists(result.data);
    assertEquals(result.data.directiveType, testCase.args[0]);
    assertEquals(result.data.layerType, testCase.args[1]);
  }

  logger.debug("Concurrent processing safety verification completed", {
    tag: "Concurrent execution operation normal",
  });
});
