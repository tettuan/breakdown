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

// テストロガー初期化
const logger = new BreakdownLogger("integration-test");

Deno.test("1_behavior: 新統合フロー - 基本設定ファイル読み込み", async () => {
  logger.debug("新統合フロー基本テスト開始", { tag: "設定ファイルからCustomConfig生成" });

  // Step 1: 設定ファイルからCustomConfig生成
  const customConfigResult = await createCustomConfigFromProfile("default-test");

  logger.debug("CustomConfig生成結果 - 結果チェック", { result: customConfigResult });

  assertEquals(customConfigResult.ok, true);
  if (customConfigResult.ok) {
    assertExists(customConfigResult.data);

    // CustomConfigの基本構造確認
    const customConfig = customConfigResult.data;
    assertExists(customConfig.params);
    assertExists(customConfig.params.two);
    assertExists(customConfig.params.two.directiveType);
    assertExists(customConfig.params.two.layerType);

    logger.debug("CustomConfig構造確認完了 - 基本フロー成功", { params: customConfig.params.two });
  }
});

Deno.test("1_behavior: 新統合フロー - BreakdownParams実行", async () => {
  logger.debug("BreakdownParams実行テスト開始", { tag: "CLI引数解析テスト" });

  // Step 2: BreakdownParams実行 - 設定ファイルから有効な値を取得
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];
  const args = [validDirective, validLayer];

  logger.debug("設定ファイルから取得した有効な値", {
    directive: validDirective,
    layer: validLayer,
  });
  const paramsResult = await executeBreakdownParams(args, "default-test");

  logger.debug("BreakdownParams実行結果 - 結果チェック", { result: paramsResult });

  assertEquals(paramsResult.ok, true);
  if (paramsResult.ok) {
    assertExists(paramsResult.data);

    // TwoParamsResultの基本構造確認
    const twoParamsResult = paramsResult.data;
    assertEquals(twoParamsResult.type, "two");
    if (twoParamsResult.type === "two") {
      // ParamsResult構造: params配列から値を取得
      assertEquals(twoParamsResult.params[0], validDirective);
      assertEquals(twoParamsResult.params[1], validLayer);
      assertEquals(twoParamsResult.params, [validDirective, validLayer]);
    }

    logger.debug("BreakdownParams実行確認完了 - CLI引数解析成功", { result: twoParamsResult });
  }
});

Deno.test("1_behavior: 新統合フロー - TwoParams変換", async () => {
  logger.debug("TwoParams変換テスト開始", { tag: "ドメインオブジェクト変換" });

  // Step 1: BreakdownParams実行 - 設定ファイルから有効な値を取得
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("flexible-test");
  const validDirectives = configResult.userConfig.testData.validDirectives;
  const validLayers = configResult.userConfig.testData.validLayers;
  const args = [validDirectives[1] || "summary", validLayers[1] || "task"];

  logger.debug("設定ファイルから取得した変換テスト用値", { directive: args[0], layer: args[1] });
  const paramsResult = await executeBreakdownParams(args, "flexible-test");

  assertEquals(paramsResult.ok, true);
  if (paramsResult.ok) {
    assertExists(paramsResult.data);

    // Step 2: TwoParams変換
    const twoParamsResult = fromTwoParamsResult(paramsResult.data);

    logger.debug("TwoParams変換結果 - 変換チェック", { result: twoParamsResult });

    assertEquals(twoParamsResult.ok, true);
    if (twoParamsResult.ok) {
      assertExists(twoParamsResult.data);

      // TwoParamsの基本構造確認
      const twoParams = twoParamsResult.data;
      assertExists(twoParams.directiveType);
      assertExists(twoParams.layerType);
      assertEquals(twoParams.directiveType, args[0]);
      assertEquals(twoParams.layerType, args[1]);

      logger.debug("TwoParams変換確認完了 - ドメインオブジェクト変換成功", { params: twoParams });
    }
  }
});

Deno.test("1_behavior: 新統合フロー - 完全統合フロー", async () => {
  logger.debug("完全統合フローテスト開始", { tag: "エンドトゥエンド統合" });

  // Step: 完全統合フロー実行 - 設定ファイルから有効な値を取得
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirectives = configResult.userConfig.testData.validDirectives;
  const validLayers = configResult.userConfig.testData.validLayers;
  const args = [validDirectives[2] || "defect", validLayers[1] || "issue"];

  logger.debug("設定ファイルから取得した完全統合フロー用値", {
    directive: args[0],
    layer: args[1],
  });
  const completeResult = await createTwoParamsFromConfigFile(args, "default-test");

  logger.debug("完全統合フロー結果 - 最終結果チェック", { result: completeResult });

  assertEquals(completeResult.ok, true);
  if (completeResult.ok) {
    assertExists(completeResult.data);

    // 最終TwoParamsの確認
    const finalTwoParams = completeResult.data;
    assertExists(finalTwoParams.directiveType);
    assertExists(finalTwoParams.layerType);
    assertEquals(finalTwoParams.directiveType, args[0]);
    assertEquals(finalTwoParams.layerType, args[1]);

    logger.debug("完全統合フロー確認完了 - エンドトゥエンド統合成功", { params: finalTwoParams });
  }
});

Deno.test("2_structure: 新統合フロー - 設定パターンバリデーション", async () => {
  logger.debug("設定パターンバリデーションテスト開始", { tag: "正規表現パターン検証" });

  // 有効なパターンテスト - 設定ファイルから有効な値を取得
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("flexible-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];
  const validArgs = [validDirective, validLayer];

  logger.debug("設定ファイルから取得したバリデーション用有効値", {
    directive: validDirective,
    layer: validLayer,
  });
  const validResult = await executeBreakdownParams(validArgs, "flexible-test");

  logger.debug("有効パターン結果 - 有効性チェック", { result: validResult });
  assertEquals(validResult.ok, true);

  // 無効なパターンテスト - 設定ファイルから無効な値を取得
  const invalidDirective = configResult.userConfig.testData.invalidDirectives[0] ||
    "invalid_directive";
  const invalidLayer = configResult.userConfig.testData.invalidLayers[0] || "invalid_layer";
  const invalidArgs = [invalidDirective, invalidLayer];

  logger.debug("設定ファイルから取得したバリデーション用無効値", {
    directive: invalidDirective,
    layer: invalidLayer,
  });
  const invalidResult = await executeBreakdownParams(invalidArgs, "default-test");

  logger.debug("無効パターン結果 - 無効性チェック", { result: invalidResult });
  assertEquals(invalidResult.ok, false);

  logger.debug("設定パターンバリデーション確認完了", { tag: "正規表現パターン検証成功" });
});

Deno.test("2_structure: 新統合フロー - エラーハンドリング", async () => {
  logger.debug("エラーハンドリングテスト開始", { tag: "例外処理検証" });

  // 存在しないプロファイルテスト
  const nonExistentProfileResult = await createCustomConfigFromProfile("non-existent-profile");

  logger.debug("存在しないプロファイル結果 - エラーハンドリング", {
    result: nonExistentProfileResult,
  });
  assertEquals(nonExistentProfileResult.ok, false);
  if (!nonExistentProfileResult.ok) {
    assertEquals(nonExistentProfileResult.error.kind, "ConfigLoadError");
  }

  // 不正な引数数テスト
  const wrongArgsResult = await executeBreakdownParams(["only-one-arg"], "default-test");

  logger.debug("不正引数数結果 - 引数エラー処理", { result: wrongArgsResult });
  assertEquals(wrongArgsResult.ok, false);

  logger.debug("エラーハンドリング確認完了", { tag: "例外処理検証成功" });
});
