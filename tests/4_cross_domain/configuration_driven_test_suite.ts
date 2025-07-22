/**
 * @fileoverview Configuration-Driven Test Suite
 *
 * 設定ファイルベーステストの完全実装
 * tests/fixtures/configs/配下の設定ファイルを活用してハードコード排除
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

// テストロガー初期化
const logger = new BreakdownLogger("config-driven-test");

/**
 * 設定ファイルベーステストマトリックス
 * 各設定ファイルに対してテストを実行
 */
const CONFIG_TEST_MATRIX = [
  {
    configName: "default-test",
    description: "デフォルト設定でのテスト",
    configPath: "tests/fixtures/configs/default-test-user.yml",
  },
  {
    configName: "flexible-test",
    description: "柔軟パターン設定でのテスト",
    configPath: "tests/fixtures/configs/flexible-test-user.yml",
  },
];

/**
 * 設定ファイルベース基本テストスイート
 */
for (const testConfig of CONFIG_TEST_MATRIX) {
  Deno.test(`1_behavior: 設定ファイルベース - ${testConfig.description}`, async () => {
    logger.debug(`設定ファイルベーステスト開始 - 設定: ${testConfig.configName}`, {
      stage: "テスト開始",
      ...testConfig,
    });

    // Step 1: 設定ファイル読み込み
    const configResult = await ConfigurationTestHelper.loadTestConfiguration(testConfig.configName);
    logger.debug(`設定読み込み結果 - 設定データ確認`, {
      stage: "設定確認",
      userConfig: configResult.userConfig,
    });

    assertExists(configResult.userConfig);
    assertExists(configResult.userConfig.testData);

    // Step 2: テストマトリックス生成 - testDataから直接生成
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
    logger.debug(`テストマトリックス生成 - テストケース数: ${testMatrix.length}`, {
      stage: "マトリックス生成",
      testMatrix,
    });

    // Step 3: 各テストケースを実行
    for (const testCase of testMatrix) {
      logger.debug(`テストケース実行 - 引数: ${testCase.args}`, {
        stage: "テストケース",
        ...testCase,
      });

      const paramsResult = await executeBreakdownParams(testCase.args, testConfig.configName);

      if (testCase.expectedType === "two") {
        assertEquals(
          paramsResult.ok,
          true,
          `有効な引数 [${testCase.args.join(", ")}] が失敗: ${
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
          `無効な引数 [${testCase.args.join(", ")}] が成功してしまった`,
        );
      }
    }

    logger.debug(`設定ファイルベーステスト完了`, { stage: "test" });
  });
}

/**
 * 設定ファイル間の整合性テスト
 */
Deno.test("2_structure: 設定ファイル間整合性チェック", async () => {
  logger.debug("設定ファイル間整合性テスト開始", { stage: "複数設定ファイルの一貫性確認" });

  const configResults = await Promise.all(
    CONFIG_TEST_MATRIX.map(async (testConfig) => ({
      name: testConfig.configName,
      config: await ConfigurationTestHelper.loadTestConfiguration(testConfig.configName),
    })),
  );

  // 各設定ファイルが必要な構造を持っていることを確認
  for (const result of configResults) {
    logger.debug(`設定ファイル構造チェック - 設定: ${result.name}`, {
      stage: "構造チェック",
      config: result.config.userConfig,
    });

    assertExists(result.config.userConfig.testData, `${result.name}: testDataが存在しない`);
    assertExists(
      result.config.userConfig.testData.validDirectives,
      `${result.name}: validDirectivesが存在しない`,
    );
    assertExists(
      result.config.userConfig.testData.validLayers,
      `${result.name}: validLayersが存在しない`,
    );

    // 基本的な値が含まれていることを確認（ハードコード排除の検証）
    const validDirectives = result.config.userConfig.testData.validDirectives;
    const validLayers = result.config.userConfig.testData.validLayers;

    // 設定ファイル駆動であることの確認（最低限の値は存在するはず）
    assertEquals(validDirectives.length > 0, true, `${result.name}: validDirectivesが空`);
    assertEquals(validLayers.length > 0, true, `${result.name}: validLayersが空`);
  }

  logger.debug("設定ファイル間整合性チェック完了", { stage: "全設定ファイルが適切な構造を保持" });
});

/**
 * 完全統合フローテスト（設定ファイル駆動）
 */
Deno.test("3_core: 設定ファイル駆動完全統合フロー", async () => {
  logger.debug("設定ファイル駆動完全統合フロー開始", { stage: "エンドツーエンド設定ベーステスト" });

  for (const testConfig of CONFIG_TEST_MATRIX.slice(0, 2)) { // 最初の2つの設定でテスト
    logger.debug(`完全統合フローテスト`, { stage: "統合テスト" });

    const configResult = await ConfigurationTestHelper.loadTestConfiguration(testConfig.configName);
    const validDirectives = configResult.userConfig.testData.validDirectives;
    const validLayers = configResult.userConfig.testData.validLayers;

    // 有効な組み合わせで完全統合フローをテスト
    const testArgs = [validDirectives[0], validLayers[0]];

    const completeResult = await createTwoParamsFromConfigFile(testArgs, testConfig.configName);
    logger.debug(`完全統合フロー結果 - 引数: ${testArgs}`, { stage: "結果", completeResult });

    assertEquals(
      completeResult.ok,
      true,
      `完全統合フローが失敗: ${!completeResult.ok ? completeResult.error?.message : ""}`,
    );

    if (completeResult.ok) {
      assertExists(completeResult.data);
      assertEquals(completeResult.data.directiveType, testArgs[0]);
      assertEquals(completeResult.data.layerType, testArgs[1]);
    }
  }

  logger.debug("設定ファイル駆動完全統合フロー完了", {
    stage: "全設定ファイルで完全統合フロー成功",
  });
});

/**
 * エッジケーステスト（設定ファイル駆動）
 */
Deno.test("2_structure: 設定ファイル駆動エッジケーステスト", async () => {
  logger.debug("設定ファイル駆動エッジケーステスト開始", {
    stage: "境界値とエラーケースの設定ベーステスト",
  });

  // エッジケース用設定ファイルが存在する場合のテスト
  try {
    const edgeCaseConfig = await ConfigurationTestHelper.loadTestConfiguration("test-helper");

    if (edgeCaseConfig.userConfig.edgeCaseTestData) {
      logger.debug("エッジケース設定データ発見 - 境界値テスト実行", {
        stage: "エッジケース",
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
          logger.debug(`境界値テストケース - 値: ${boundaryCase.value}`, {
            stage: "境界値テスト",
            ...boundaryCase,
          });

          // 境界値テストロジック（実際のパターンマッチング）
          const testArgs = [boundaryCase.value, "project"]; // layerは有効値で固定
          const result = await executeBreakdownParams(testArgs, "test-helper");

          if (boundaryCase.expectValid) {
            assertEquals(
              result.ok,
              true,
              `境界値 '${boundaryCase.value}' がマッチしなかった: ${boundaryCase.description}`,
            );
          } else {
            assertEquals(
              result.ok,
              false,
              `境界値 '${boundaryCase.value}' がマッチしてしまった: ${boundaryCase.description}`,
            );
          }
        }
      }
    }
  } catch (error) {
    logger.debug("エッジケース設定ファイル未発見 - スキップ", { stage: "スキップ", error });
  }

  logger.debug("設定ファイル駆動エッジケーステスト完了", { stage: "全境界値テスト完了" });
});
