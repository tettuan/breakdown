/**
 * @fileoverview 新統合フロー統合テスト - 基本機能
 *
 * 設定ファイル → CustomConfig → TwoParamsResult → TwoParams フローの基本動作をテスト
 * createDefault()修正後のテスト要件に対応
 *
 * @module tests/integration/breakdown_params/01_basic_integration_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  createCustomConfigFromProfile,
  createTwoParamsFromConfigFile,
  executeBreakdownParams,
  fromTwoParamsResult,
} from "../../../lib/application/breakdown_params_integration.ts";
import { ConfigurationTestHelper } from "../../../lib/test_helpers/configuration_test_helper_simple.ts";

// Test logger initialization
const logger = new BreakdownLogger("integration-test");

Deno.test("1_behavior: New integration flow - Basic configuration file loading", async () => {
  logger.debug("New integration flow basic test started", {
    tag: "CustomConfig generation from config file",
  });

  // Step 1: Generate CustomConfig from configuration file
  const customConfigResult = await createCustomConfigFromProfile("default-test");

  logger.debug("CustomConfig generation result - Result check", { result: customConfigResult });

  assertEquals(customConfigResult.ok, true);
  if (customConfigResult.ok) {
    assertExists(customConfigResult.data);

    // Verify basic structure of CustomConfig
    const customConfig = customConfigResult.data;
    assertExists(customConfig.params);
    assertExists(customConfig.params.two);
    assertExists(customConfig.params.two.directiveType);
    assertExists(customConfig.params.two.layerType);

    logger.debug("CustomConfig structure verification completed - Basic flow succeeded", {
      params: customConfig.params.two,
    });
  }
});

Deno.test("1_behavior: New integration flow - BreakdownParams execution", async () => {
  logger.debug("BreakdownParams execution test started", { tag: "CLI argument parsing test" });

  // Step 2: Execute BreakdownParams - Get valid values from configuration file
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];
  const args = [validDirective, validLayer];

  logger.debug("Valid values retrieved from config file", {
    directive: validDirective,
    layer: validLayer,
  });
  const paramsResult = await executeBreakdownParams(args, "default-test");

  logger.debug("BreakdownParams execution result - Result check", { result: paramsResult });

  assertEquals(paramsResult.ok, true);
  if (paramsResult.ok) {
    assertExists(paramsResult.data);

    // Verify basic structure of TwoParamsResult
    const twoParamsResult = paramsResult.data;
    assertEquals(twoParamsResult.type, "two");
    if (twoParamsResult.type === "two") {
      // ParamsResult structure: Get values from params array
      assertEquals(twoParamsResult.params[0], validDirective);
      assertEquals(twoParamsResult.params[1], validLayer);
      assertEquals(twoParamsResult.params, [validDirective, validLayer]);
    }

    logger.debug(
      "BreakdownParams execution verification completed - CLI argument parsing succeeded",
      { result: twoParamsResult },
    );
  }
});

Deno.test("1_behavior: New integration flow - TwoParams conversion", async () => {
  logger.debug("TwoParams conversion test started", { tag: "Domain object conversion" });

  // Step 1: Execute BreakdownParams - Get valid values from configuration file
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("flexible-test");
  const validDirectives = configResult.userConfig.testData.validDirectives;
  const validLayers = configResult.userConfig.testData.validLayers;
  const args = [validDirectives[1] || "summary", validLayers[1] || "task"];

  logger.debug("Conversion test values retrieved from config file", {
    directive: args[0],
    layer: args[1],
  });
  const paramsResult = await executeBreakdownParams(args, "flexible-test");

  assertEquals(paramsResult.ok, true);
  if (paramsResult.ok) {
    assertExists(paramsResult.data);

    // Step 2: TwoParams conversion
    const twoParamsResult = fromTwoParamsResult(paramsResult.data);

    logger.debug("TwoParams conversion result - Conversion check", { result: twoParamsResult });

    assertEquals(twoParamsResult.ok, true);
    if (twoParamsResult.ok) {
      assertExists(twoParamsResult.data);

      // Verify basic structure of TwoParams
      const twoParams = twoParamsResult.data;
      assertExists(twoParams.directiveType);
      assertExists(twoParams.layerType);
      assertEquals(twoParams.directiveType, args[0]);
      assertEquals(twoParams.layerType, args[1]);

      logger.debug(
        "TwoParams conversion verification completed - Domain object conversion succeeded",
        { params: twoParams },
      );
    }
  }
});

Deno.test("1_behavior: New integration flow - Complete integration flow", async () => {
  logger.debug("Complete integration flow test started", { tag: "End-to-end integration" });

  // Step: Execute complete integration flow - Get valid values from configuration file
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirectives = configResult.userConfig.testData.validDirectives;
  const validLayers = configResult.userConfig.testData.validLayers;
  const args = [validDirectives[2] || "defect", validLayers[1] || "issue"];

  logger.debug("Complete integration flow values retrieved from config file", {
    directive: args[0],
    layer: args[1],
  });
  const completeResult = await createTwoParamsFromConfigFile(args, "default-test");

  logger.debug("Complete integration flow result - Final result check", { result: completeResult });

  assertEquals(completeResult.ok, true);
  if (completeResult.ok) {
    assertExists(completeResult.data);

    // Verify final TwoParams
    const finalTwoParams = completeResult.data;
    assertExists(finalTwoParams.directiveType);
    assertExists(finalTwoParams.layerType);
    assertEquals(finalTwoParams.directiveType, args[0]);
    assertEquals(finalTwoParams.layerType, args[1]);

    logger.debug(
      "Complete integration flow verification completed - End-to-end integration succeeded",
      { params: finalTwoParams },
    );
  }
});

Deno.test("2_structure: New integration flow - Configuration pattern validation", async () => {
  logger.debug("Config pattern validation test started", { tag: "Regex pattern verification" });

  // Valid pattern test - Get valid values from configuration file
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("flexible-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];
  const validArgs = [validDirective, validLayer];

  logger.debug("Valid validation values retrieved from config file", {
    directive: validDirective,
    layer: validLayer,
  });
  const validResult = await executeBreakdownParams(validArgs, "flexible-test");

  logger.debug("Valid pattern result - Validity check", { result: validResult });
  assertEquals(validResult.ok, true);

  // Invalid pattern test - Get invalid values from configuration file
  const invalidDirective = configResult.userConfig.testData.invalidDirectives[0] ||
    "invalid_directive";
  const invalidLayer = configResult.userConfig.testData.invalidLayers[0] || "invalid_layer";
  const invalidArgs = [invalidDirective, invalidLayer];

  logger.debug("Invalid validation values retrieved from config file", {
    directive: invalidDirective,
    layer: invalidLayer,
  });
  const invalidResult = await executeBreakdownParams(invalidArgs, "default-test");

  logger.debug("Invalid pattern result - Invalidity check", { result: invalidResult });
  assertEquals(invalidResult.ok, false);

  logger.debug("Config pattern validation verification completed", {
    tag: "Regex pattern verification succeeded",
  });
});

Deno.test("2_structure: New integration flow - Error handling", async () => {
  logger.debug("Error handling test started", { tag: "Exception handling verification" });

  // Non-existent profile test
  const nonExistentProfileResult = await createCustomConfigFromProfile("non-existent-profile");

  logger.debug("Non-existent profile result - Error handling", {
    result: nonExistentProfileResult,
  });
  assertEquals(nonExistentProfileResult.ok, false);
  if (!nonExistentProfileResult.ok) {
    assertEquals(nonExistentProfileResult.error.kind, "ConfigLoadError");
  }

  // Invalid argument count test
  const wrongArgsResult = await executeBreakdownParams(["only-one-arg"], "default-test");

  logger.debug("Incorrect argument count result - Argument error handling", {
    result: wrongArgsResult,
  });
  assertEquals(wrongArgsResult.ok, false);

  logger.debug("Error handling verification completed", {
    tag: "Exception handling verification succeeded",
  });
});
