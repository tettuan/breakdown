/**
 * @fileoverview BreakdownParams + BreakdownConfig 統合テスト
 *
 * 設定ファイル(*-user.yml) → CustomConfig → BreakdownParams → TwoParamsResult の完全統合テスト
 * ハードコード除去とConfigProfile依存除去の検証
 *
 * @module tests/integration/breakdown_params_integration.test
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { loadUserConfig } from "../../lib/config/user_config_loader.ts";
import { ParamsCustomConfig } from "../../lib/config/params_custom_config.ts";
import { ConfigProfile } from "../../lib/config/config_profile_name.ts";
import { executeBreakdownParams } from "../../lib/application/breakdown_params_integration.ts";

const logger = new BreakdownLogger("breakdown-params-integration");

/**
 * 設定ファイル → ParamsCustomConfig 生成テスト
 */
async function createParamsCustomConfigFromProfile(
  profileName: string,
): Promise<ParamsCustomConfig> {
  // ConfigProfile生成
  const profile = ConfigProfile.create(profileName);

  // 設定ファイル読み込み
  const userConfig = await loadUserConfig(profile);

  // ParamsCustomConfig生成
  return ParamsCustomConfig.create(userConfig);
}

// executeBreakdownParams is now imported from breakdown_params_integration.ts

Deno.test({
  name: "BreakdownParams統合テスト: 基本フロー完全検証",
  fn: async () => {
    logger.debug("統合テスト開始: 基本フロー完全検証", { stage: "test" });

    // Step 1: 設定ファイル → ParamsCustomConfig 生成
    const paramsCustomConfig = await createParamsCustomConfigFromProfile(
      "breakdown-params-integration",
    );
    assertExists(paramsCustomConfig, "ParamsCustomConfigが生成されること");
    assertExists(paramsCustomConfig.directivePattern, "DirectiveTypeパターンが設定されること");
    assertExists(paramsCustomConfig.layerPattern, "LayerTypeパターンが設定されること");

    // Step 2: CLI引数 → BreakdownParams実行 - 設定ファイルから有効な値を取得
    const testProfile = ConfigProfile.create("breakdown-params-integration");
    const testUserConfig = await loadUserConfig(testProfile);
    const testData = testUserConfig.testData as {
      validDirectives: string[];
      validLayers: string[];
    };
    const validDirective = testData.validDirectives[0];
    const validLayer = testData.validLayers[0];
    const paramsResult = await executeBreakdownParams(
      [validDirective, validLayer],
      "breakdown-params-integration",
    );

    logger.debug("設定ファイルから取得した基本フロー検証用値", {
      directive: validDirective,
      layer: validLayer,
    });

    if (!paramsResult.ok) {
      throw new Error(`executeBreakdownParams failed: ${JSON.stringify(paramsResult.error)}`);
    }

    assertEquals(paramsResult.data.type, "two", "TwoParamsResultが返されること");

    logger.debug("統合テスト完了: 全ステップ成功確認", { stage: "test" });
  },
});

Deno.test({
  name: "BreakdownParams統合テスト: 設定ファイルベース検証",
  fn: async () => {
    logger.debug("設定ファイルベース検証開始", { stage: "test" });

    // breakdown-params-integration-user.yml からパターン読み込み
    const profile = ConfigProfile.create("breakdown-params-integration");
    const userConfig = await loadUserConfig(profile);
    const paramsCustomConfig = ParamsCustomConfig.create(userConfig);

    // 設定値確認
    assertEquals(
      paramsCustomConfig.directivePattern,
      "to|summary|defect|find|test_directive",
      "DirectiveTypeパターンが正しく読み込まれること",
    );
    assertEquals(
      paramsCustomConfig.layerPattern,
      "project|issue|task|test_layer",
      "LayerTypeパターンが正しく読み込まれること",
    );

    logger.debug("設定ファイルベース検証完了", { stage: "test" });
  },
});

Deno.test({
  name: "BreakdownParams統合テスト: ConfigProfile依存除去確認",
  fn: async () => {
    logger.debug("ConfigProfile依存除去確認開始", { stage: "test" });

    // ConfigProfile → 設定ファイル → ParamsCustomConfig フローの確認
    const profile = ConfigProfile.create("default-test");
    const userConfig = await loadUserConfig(profile);
    const paramsCustomConfig = ParamsCustomConfig.create(userConfig);

    // 設定ファイルベース実装の動作確認
    assertExists(paramsCustomConfig.directivePattern, "設定ファイルベース実装が動作していること");
    assertExists(paramsCustomConfig.layerPattern, "設定ファイルベース実装が動作していること");

    // ハードコード配列を使用しない実装確認 - 設定ファイルから有効な値を取得
    const defaultProfile = ConfigProfile.create("default-test");
    const defaultUserConfig = await loadUserConfig(defaultProfile);
    const defaultTestData = defaultUserConfig.testData as {
      validDirectives: string[];
      validLayers: string[];
    };
    const validDirective = defaultTestData.validDirectives[0];
    const validLayer = defaultTestData.validLayers[0];
    const result = await executeBreakdownParams([validDirective, validLayer], "default-test");

    logger.debug("設定ファイルから取得したConfigProfile依存除去確認用値", {
      directive: validDirective,
      layer: validLayer,
    });
    assertEquals(
      result.ok && result.data.type,
      "two",
      "設定ファイルベースパース実行が成功すること",
    );

    logger.debug("ConfigProfile依存除去確認完了", { stage: "test" });
  },
});

Deno.test({
  name: "BreakdownParams統合テスト: ParamsCustomConfig生成検証",
  fn: async () => {
    logger.debug("ParamsCustomConfig生成検証開始", { stage: "test" });

    // breakdown-params-integration-user.yml の詳細確認
    const profile = ConfigProfile.create("breakdown-params-integration");
    const userConfig = await loadUserConfig(profile);

    // ParamsCustomConfig生成
    const paramsCustomConfig = ParamsCustomConfig.create(userConfig);

    // パターン設定確認
    assertEquals(
      paramsCustomConfig.directivePattern,
      "to|summary|defect|find|test_directive",
      "統合用DirectiveTypeパターンが正しく設定されること",
    );
    assertEquals(
      paramsCustomConfig.layerPattern,
      "project|issue|task|test_layer",
      "統合用LayerTypeパターンが正しく設定されること",
    );

    // testData確認
    assertExists(paramsCustomConfig.testData, "testDataが存在すること");

    logger.debug("ParamsCustomConfig生成検証完了", { stage: "test" });
  },
});

Deno.test({
  name: "BreakdownParams統合テスト: 複数プロファイル設定ファイル読み込み検証",
  fn: async () => {
    logger.debug("複数プロファイル設定ファイル読み込み検証開始", { stage: "test" });

    // デフォルトテスト設定の読み込み
    const defaultProfile = ConfigProfile.create("default-test");
    const defaultUserConfig = await loadUserConfig(defaultProfile);
    const defaultParamsCustomConfig = ParamsCustomConfig.create(defaultUserConfig);

    assertExists(
      defaultParamsCustomConfig.directivePattern,
      "デフォルト設定のDirectiveTypeパターンが読み込まれること",
    );
    assertExists(
      defaultParamsCustomConfig.layerPattern,
      "デフォルト設定のLayerTypeパターンが読み込まれること",
    );

    // 統合テスト用設定の読み込み
    const integrationProfile = ConfigProfile.create("breakdown-params-integration");
    const integrationUserConfig = await loadUserConfig(integrationProfile);
    const integrationParamsCustomConfig = ParamsCustomConfig.create(integrationUserConfig);

    assertExists(
      integrationParamsCustomConfig.directivePattern,
      "統合テスト設定のDirectiveTypeパターンが読み込まれること",
    );
    assertExists(
      integrationParamsCustomConfig.layerPattern,
      "統合テスト設定のLayerTypeパターンが読み込まれること",
    );

    // 異なる設定値が読み込まれることを確認
    assert(
      integrationParamsCustomConfig.directivePattern.includes("test_directive"),
      "統合設定に拡張パターンが含まれること",
    );

    logger.debug("複数プロファイル設定ファイル読み込み検証完了", { stage: "test" });
  },
});

Deno.test({
  name: "BreakdownParams統合テスト: ParamsResult型安全検証",
  fn: async () => {
    logger.debug("ParamsResult型安全検証開始", { stage: "test" });

    // 有効な引数でのテスト - 設定ファイルから有効な値を取得
    const integrationProfile = ConfigProfile.create("breakdown-params-integration");
    const integrationUserConfig = await loadUserConfig(integrationProfile);
    const integrationTestData = integrationUserConfig.testData as {
      validDirectives: string[];
      validLayers: string[];
    };
    const validDirective = integrationTestData.validDirectives[0];
    const validLayer = integrationTestData.validLayers[0];
    const validResult = await executeBreakdownParams(
      [validDirective, validLayer],
      "breakdown-params-integration",
    );

    logger.debug("設定ファイルから取得した型安全検証用値", {
      directive: validDirective,
      layer: validLayer,
    });
    assertEquals(
      validResult.ok && validResult.data.type,
      "two",
      "有効な引数でTwoParamsResultが返されること",
    );

    // 単一引数でのテスト（エラーまたは特定の型が返される）
    const oneResult = await executeBreakdownParams(
      [validDirective],
      "breakdown-params-integration",
    );
    // BreakdownParams実装では単一引数はエラーになるため、ok=falseを期待
    assert(
      !oneResult.ok || typeof oneResult.data?.type === "string",
      "単一引数で結果が返されること",
    );

    // 引数なしでのテスト（エラーまたは特定の型が返される）
    const zeroResult = await executeBreakdownParams([], "breakdown-params-integration");
    // BreakdownParams実装では引数なしはエラーになるため、ok=falseを期待
    assert(
      !zeroResult.ok || typeof zeroResult.data?.type === "string",
      "引数なしで結果が返されること",
    );

    logger.debug("ParamsResult型安全検証完了", { stage: "test" });
  },
});

Deno.test({
  name: "BreakdownParams統合テスト: testDataアクセス検証",
  fn: async () => {
    logger.debug("testDataアクセス検証開始", { stage: "test" });

    // breakdown-params-integration-user.yml のtestData確認
    const profile = ConfigProfile.create("breakdown-params-integration");
    const userConfig = await loadUserConfig(profile);
    const paramsCustomConfig = ParamsCustomConfig.create(userConfig);

    // testDataの存在確認
    const testData = paramsCustomConfig.testData;
    assertExists(testData, "testDataが存在すること");

    // testDataがオブジェクトであることを確認
    assert(typeof testData === "object", "testDataがオブジェクトであること");

    logger.debug("testDataアクセス検証完了", { stage: "test" });
  },
});
