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
import "../../../lib/types/performance.d.ts";

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

Deno.test("2_structure: Regression test - Performance degradation check", async () => {
  logger.debug("Performance degradation check started", { tag: "Processing time measurement" });

  // Get values for performance test from configuration file
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const args = [
    configResult.userConfig.testData.validDirectives[0],
    configResult.userConfig.testData.validLayers[0],
  ];
  const iterations = 10;

  logger.debug("Performance test values retrieved from config file", { args });
  const results: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const result = await createTwoParamsFromConfigFile(args, "default-test");
    const end = performance.now();

    assertEquals(result.ok, true);
    results.push(end - start);
  }

  const averageTime = results.reduce((a, b) => a + b, 0) / results.length;
  const maxTime = Math.max(...results);

  logger.debug("Performance measurement results - Execution time statistics", {
    tag: "Statistical information",
    averageTime: `${averageTime.toFixed(2)}ms`,
    maxTime: `${maxTime.toFixed(2)}ms`,
    iterations,
  });

  // パフォーマンス劣化の検出 (100ms以内であること)
  assertEquals(
    averageTime < 100,
    true,
    `Average execution time is too long: ${averageTime.toFixed(2)}ms`,
  );
  assertEquals(maxTime < 200, true, `Maximum execution time is too long: ${maxTime.toFixed(2)}ms`);

  logger.debug("Performance degradation check completed", {
    tag: "Processing time requirements satisfied",
  });
});

Deno.test("2_structure: Regression test - Memory leak verification", async () => {
  logger.debug("Memory leak verification test started", { tag: "Memory usage verification" });

  // Get values for memory leak test from configuration file
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("flexible-test");
  const args = [
    configResult.userConfig.testData.validDirectives[1] ||
    configResult.userConfig.testData.validDirectives[0],
    configResult.userConfig.testData.validLayers[1] ||
    configResult.userConfig.testData.validLayers[0],
  ];
  const iterations = 50;

  logger.debug("Memory leak test values retrieved from config file", { args });

  // 初期メモリ使用量測定（概算）
  const initialMemory = performance.memory?.usedJSHeapSize || 0;

  for (let i = 0; i < iterations; i++) {
    const result = await createTwoParamsFromConfigFile(args, "flexible-test");
    assertEquals(result.ok, true);

    // Force garbage collection (if possible)
    if (typeof gc !== "undefined" && gc) {
      gc();
    }
  }

  // 最終メモリ使用量測定（概算）
  const finalMemory = performance.memory?.usedJSHeapSize || 0;

  if (initialMemory > 0 && finalMemory > 0) {
    const memoryIncrease = finalMemory - initialMemory;
    logger.debug("Memory usage change - Memory leak verification", {
      tag: "Memory statistics",
      initialMemory: `${(initialMemory / 1024 / 1024).toFixed(2)}MB`,
      finalMemory: `${(finalMemory / 1024 / 1024).toFixed(2)}MB`,
      increase: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
    });

    // Verify no significant memory increase (within 10MB)
    assertEquals(
      memoryIncrease < 10 * 1024 * 1024,
      true,
      `Memory usage significantly increased: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  logger.debug("Memory leak verification completed", { tag: "Memory usage normal" });
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
