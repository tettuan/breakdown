/**
 * @fileoverview DirectiveType/LayerType Integration Test - Basic Functionality
 *
 * Completely eliminates hardcode dependencies and migrates to configuration file-based implementation.
 * Achieves dynamic type generation and validation through BreakdownParams integration.
 *
 * @module tests/integration/directive_layer_types/tests/01_basic_integration_test
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { ConfigurationTestHelper } from "../../../../lib/test_helpers/configuration_test_helper_simple.ts";
import {
  createCustomConfigFromProfile,
  createTwoParamsFromConfigFile,
  executeBreakdownParams,
  fromTwoParamsResult,
} from "../../../../lib/application/breakdown_params_integration.ts";
import { DirectiveType } from "../../../../lib/domain/core/value_objects/directive_type.ts";
import { LayerType } from "../../../../lib/domain/core/value_objects/layer_type.ts";

// Test logger initialization
const logger = new BreakdownLogger("directive-layer-integration-test");

/**
 * Helper function to replace assertFalse
 */
function assertFalse(actual: boolean, msg?: string): void {
  assert(actual === false, msg);
}

Deno.test("DirectiveType/LayerType Integration - 1_behavior: Basic type creation and validation", async () => {
  logger.debug("Basic integration test started", { test: "basic_type_creation" });

  // Step 1: Dynamically obtain valid values from configuration file
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default");
  assertExists(configResult, "Configuration should be loaded");

  const validDirectives = configResult.userConfig.testData?.validDirectives;
  const validLayers = configResult.userConfig.testData?.validLayers;

  assertExists(validDirectives, "validDirectives should be defined in test configuration");
  assertExists(validLayers, "validLayers should be defined in test configuration");

  logger.debug("Valid values obtained from configuration file", {
    tag: "valid_values",
    directives: validDirectives,
    layers: validLayers,
  });

  // Step 2: DirectiveType creation and validation
  for (const directive of validDirectives) {
    const directiveResult = DirectiveType.create(directive);
    assertEquals(directiveResult.ok, true, `DirectiveType.create should succeed for ${directive}`);
    if (directiveResult.ok) {
      assertEquals(directiveResult.data.value, directive);
      logger.debug("DirectiveType creation successful", { directive });
    }
  }

  // Step 3: LayerType creation and validation
  for (const layer of validLayers) {
    const layerResult = LayerType.create(layer);
    assertEquals(layerResult.ok, true, `LayerType.create should succeed for ${layer}`);
    if (layerResult.ok) {
      assertEquals(layerResult.data.value, layer);
      logger.debug("LayerType creation successful", { layer });
    }
  }
});

Deno.test("DirectiveType/LayerType Integration - 1_behavior: BreakdownParams integration flow", async () => {
  logger.debug("BreakdownParams integration flow test started", { test: "breakdown_params_flow" });

  // Step 1: Get valid values from configuration file
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default");
  const validDirectives = configResult.userConfig.testData?.validDirectives;
  assertExists(validDirectives, "validDirectives should be defined in test configuration");
  const validDirective = validDirectives[0];

  const validLayers = configResult.userConfig.testData?.validLayers;
  assertExists(validLayers, "validLayers should be defined in test configuration");
  const validLayer = validLayers[0];
  // BreakdownParams accepts only two arguments (directive and layer)
  const args = [validDirective, validLayer];

  logger.debug("Test arguments", { args });

  // Step 2: Execute BreakdownParams
  const paramsResult = await executeBreakdownParams(args, "default");

  assertEquals(paramsResult.ok, true, "BreakdownParams execution should succeed");
  if (paramsResult.ok) {
    assertExists(paramsResult.data);

    // Step 3: Convert from TwoParamsResult to TwoParams
    const twoParamsResult = fromTwoParamsResult(paramsResult.data);
    assertEquals(twoParamsResult.ok, true, "TwoParams conversion should succeed");

    if (twoParamsResult.ok) {
      const twoParams = twoParamsResult.data;
      assertEquals(twoParams.directiveType, validDirective);
      assertEquals(twoParams.layerType, validLayer);

      logger.debug("Integration flow successful", {
        tag: "success",
        directive: twoParams.directiveType,
        layer: twoParams.layerType,
      });
    }
  }
});

Deno.test("DirectiveType/LayerType Integration - 1_behavior: Configuration file based validation", async () => {
  logger.debug("Configuration file based validation test started", {
    test: "config_based_validation",
  });

  // Step 1: Generate CustomConfig from custom configuration
  const customConfigResult = await createCustomConfigFromProfile("default");
  assertEquals(customConfigResult.ok, true, "CustomConfig creation should succeed");

  if (customConfigResult.ok) {
    const customConfig = customConfigResult.data;
    assertExists(customConfig.params?.two?.directiveType?.pattern);
    assertExists(customConfig.params?.two?.layerType?.pattern);

    logger.debug("Custom configuration patterns", {
      tag: "patterns",
      directivePattern: customConfig.params.two.directiveType.pattern,
      layerPattern: customConfig.params.two.layerType.pattern,
    });

    // Step 2: Extract valid values from patterns
    const directivePattern = customConfig.params.two.directiveType.pattern;
    const layerPattern = customConfig.params.two.layerType.pattern;

    // Extract values from pattern (e.g., "^(to|summary|defect)$" -> ["to", "summary", "defect"])
    const directiveMatch = directivePattern.match(/^\^\(([^)]+)\)\$$/);
    const layerMatch = layerPattern.match(/^\^\(([^)]+)\)\$$/);

    if (directiveMatch && layerMatch) {
      const validDirectives = directiveMatch[1].split("|");
      const validLayers = layerMatch[1].split("|");

      // Step 3: Validation with extracted values
      for (const directive of validDirectives) {
        const result = DirectiveType.create(directive);
        assertEquals(result.ok, true, `${directive} should be valid`);
      }

      for (const layer of validLayers) {
        const result = LayerType.create(layer);
        assertEquals(result.ok, true, `${layer} should be valid`);
      }
    }
  }
});

Deno.test(
  "DirectiveType/LayerType Integration - 2_structure: Error handling",
  async () => {
    logger.debug("Error handling test started", { test: "error_handling" });

    // Step 1: Get invalid values from configuration file
    const configResult = await ConfigurationTestHelper.loadTestConfiguration("default");
    const invalidDirectives = configResult.userConfig.testData?.invalidDirectives;
    const invalidLayers = configResult.userConfig.testData?.invalidLayers;

    assertExists(invalidDirectives, "invalidDirectives should be defined in test configuration");
    assertExists(invalidLayers, "invalidLayers should be defined in test configuration");

    // Step 2: DirectiveType エラーケース
    for (const invalid of invalidDirectives) {
      const result = DirectiveType.create(invalid);
      assertFalse(result.ok, `DirectiveType.create should fail for ${invalid}`);
      if (!result.ok) {
        // DirectiveTypeは独自のエラー型を使用（EmptyInput, InvalidFormat, etc）
        // ValidationErrorではなく、具体的なエラー種別を持つ
        logger.debug("DirectiveType error validation successful", {
          tag: "error_validation",
          input: invalid,
          error: result.error.kind,
        });
      }
    }

    // Step 3: LayerType エラーケース
    for (const invalid of invalidLayers) {
      const result = LayerType.create(invalid);
      assertFalse(result.ok, `LayerType.create should fail for ${invalid}`);
      if (!result.ok) {
        // DirectiveTypeは独自のエラー型を使用（EmptyInput, InvalidFormat, etc）
        // ValidationErrorではなく、具体的なエラー種別を持つ
        logger.debug("LayerType error validation successful", {
          tag: "error_validation",
          input: invalid,
          error: result.error.kind,
        });
      }
    }
  },
);

Deno.test("DirectiveType/LayerType Integration - 2_structure: Complete integration flow", async () => {
  logger.debug("Complete integration flow test started", { test: "complete_integration" });

  // Step 1: 設定ファイルから複数の組み合わせを取得
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default");
  const directives = configResult.userConfig.testData?.validDirectives;
  const layers = configResult.userConfig.testData?.validLayers;

  assertExists(directives, "validDirectives should be defined in test configuration");
  assertExists(layers, "validLayers should be defined in test configuration");

  // Step 2: 全組み合わせテスト
  for (const directive of directives.slice(0, 2)) { // 最初の2つのみ使用
    for (const layer of layers.slice(0, 2)) { // 最初の2つのみ使用
      const args = [directive, layer];

      logger.debug("Combination test execution", { directive, layer });

      // 完全統合フロー実行
      const result = await createTwoParamsFromConfigFile(args, "default");

      assertEquals(result.ok, true, `Should succeed for ${directive}/${layer}`);
      if (result.ok) {
        const twoParams = result.data;
        assertEquals(twoParams.directiveType, directive);
        assertEquals(twoParams.layerType, layer);

        // DirectiveType と LayerType オブジェクトの生成確認
        const directiveTypeResult = DirectiveType.create(twoParams.directiveType);
        const layerTypeResult = LayerType.create(twoParams.layerType);

        assertEquals(directiveTypeResult.ok, true);
        assertEquals(layerTypeResult.ok, true);
      }
    }
  }

  logger.debug("Complete integration flow all patterns successful", "success");
});

Deno.test("DirectiveType/LayerType Integration - 3_performance: Performance test", async () => {
  logger.debug("Performance test started", { test: "performance" });

  const iterations = 100;
  const startTime = performance.now();

  // 設定ファイルから値を取得
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default");
  const validDirectives = configResult.userConfig.testData?.validDirectives;
  assertExists(validDirectives, "validDirectives should be defined in test configuration");
  const directive = validDirectives[0];

  const validLayers = configResult.userConfig.testData?.validLayers;
  assertExists(validLayers, "validLayers should be defined in test configuration");
  const layer = validLayers[0];

  for (let i = 0; i < iterations; i++) {
    const directiveResult = DirectiveType.create(directive);
    const layerResult = LayerType.create(layer);

    assertEquals(directiveResult.ok, true);
    assertEquals(layerResult.ok, true);
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / iterations;

  logger.debug("Performance test results", {
    tag: "results",
    iterations,
    totalTime: `${totalTime.toFixed(2)}ms`,
    avgTime: `${avgTime.toFixed(2)}ms`,
  });

  // 平均処理時間が1ms未満であることを確認
  assert(avgTime < 1, `Average time should be less than 1ms, but was ${avgTime.toFixed(2)}ms`);
});
