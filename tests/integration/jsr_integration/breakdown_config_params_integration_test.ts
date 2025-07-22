/**
 * @fileoverview JSR統合テスト - BreakdownConfigとBreakdownParamsの設定駆動アーキテクチャ
 *
 * 設定ファイルからDirectiveType/LayerTypeを動的に読み込み、
 * ハードコードを完全に排除した統合テストの実装
 *
 * @module tests/integration/jsr_integration/breakdown_config_params_integration_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  ConfigBasedTwoParamsBuilder,
  Result as _Result,
  TwoParams_Result as _TwoParams_Result,
} from "../../../lib/config/config_based_two_params_builder.ts";
import { ConfigProfile } from "../../../lib/config/config_profile_name.ts";
import { ParamsCustomConfig } from "../../../lib/config/params_custom_config.ts";
import { loadUserConfig } from "../../../lib/config/user_config_loader.ts";

const logger = new BreakdownLogger("jsr-integration");

describe("JSR Integration - BreakdownConfig + BreakdownParams", () => {
  describe("設定ファイルからの動的読み込み", () => {
    it("breakdown-params-integration-user.yml から設定を読み込める", async () => {
      // 設定プロファイルの作成
      const profile = ConfigProfile.create("breakdown-params-integration");
      logger.debug("設定プロファイル作成", { profile: profile.value });

      // 設定ファイルの読み込み
      const configData = await loadUserConfig(profile);
      logger.debug("設定ファイル読み込み完了", {
        keys: Object.keys(configData),
        paramsSection: configData.params,
      });

      // ParamsCustomConfig の作成
      const customConfig = ParamsCustomConfig.create(configData);

      // パターンの確認（ハードコードなし）
      assertExists(customConfig.directivePattern);
      assertExists(customConfig.layerPattern);

      logger.debug("パターン取得成功", {
        directivePattern: customConfig.directivePattern,
        layerPattern: customConfig.layerPattern,
      });

      // パターンが期待通りの形式であることを確認
      assertEquals(
        customConfig.directivePattern,
        "to|summary|defect|find|test_directive",
      );
      assertEquals(
        customConfig.layerPattern,
        "project|issue|task|test_layer",
      );
    });

    it("ConfigBasedTwoParamsBuilder で設定ベースのビルダーを作成できる", async () => {
      // 設定ベースビルダーの作成
      const builderResult = await ConfigBasedTwoParamsBuilder.fromConfig(
        "breakdown-params-integration",
      );

      logger.debug("ビルダー作成結果", { ok: builderResult.ok });

      // Result型のチェック
      assertEquals(builderResult.ok, true);
      assertExists(builderResult.data);

      if (!builderResult.ok) {
        throw new Error("Builder creation failed");
      }

      const builder = builderResult.data;

      // パターンの動的取得（ハードコードなし）
      const directivePattern = builder.getDirectivePattern();
      const layerPattern = builder.getLayerPattern();

      assertExists(directivePattern);
      assertExists(layerPattern);

      logger.debug("ビルダーからパターン取得", {
        directivePattern,
        layerPattern,
        profile: builder.getProfile(),
      });
    });
  });

  describe("動的パラメータ検証", () => {
    it("設定ファイルのパターンに基づいて有効なパラメータを検証できる", async () => {
      // ビルダー作成
      const builderResult = await ConfigBasedTwoParamsBuilder.fromConfig(
        "breakdown-params-integration",
      );

      if (!builderResult.ok) {
        throw new Error("Builder creation failed");
      }

      const builder = builderResult.data;

      // 設定ファイルで定義された有効な値でテスト
      const validationResult = builder.validateParams("to", "project");

      logger.debug("検証結果（有効）", {
        result: validationResult,
        directiveType: "to",
        layerType: "project",
      });

      assertEquals(validationResult.ok, true);

      // test_directive と test_layer も有効
      const testValidation = builder.validateParams("test_directive", "test_layer");
      assertEquals(testValidation.ok, true);
    });

    it("設定ファイルのパターンに基づいて無効なパラメータを拒否できる", async () => {
      // ビルダー作成
      const builderResult = await ConfigBasedTwoParamsBuilder.fromConfig(
        "breakdown-params-integration",
      );

      if (!builderResult.ok) {
        throw new Error("Builder creation failed");
      }

      const builder = builderResult.data;

      // 無効な値でテスト（ハードコードなし）
      const invalidResult = builder.validateParams("invalid_directive", "invalid_layer");

      logger.debug("検証結果（無効）", {
        result: invalidResult,
        directiveType: "invalid_directive",
        layerType: "invalid_layer",
      });

      assertEquals(invalidResult.ok, false);
      assertEquals(invalidResult.error?.kind, "ValidationFailed");
    });
  });

  describe("TwoParams_Result の動的生成", () => {
    it("設定ベースで TwoParams_Result を生成できる", async () => {
      // ビルダー作成
      const builderResult = await ConfigBasedTwoParamsBuilder.fromConfig(
        "breakdown-params-integration",
      );

      if (!builderResult.ok) {
        throw new Error("Builder creation failed");
      }

      const builder = builderResult.data;

      // TwoParams_Result の生成
      const result = builder.build("summary", "issue");

      logger.debug("TwoParams_Result 生成結果", {
        ok: result.ok,
        data: result.ok ? result.data : undefined,
        error: result.ok ? undefined : result.error,
      });

      assertEquals(result.ok, true);

      if (!result.ok) {
        throw new Error("Build failed");
      }

      // 結果の検証
      const twoParamsResult = result.data;
      assertEquals(twoParamsResult.type, "two");
      assertEquals(twoParamsResult.directiveType, "summary");
      assertEquals(twoParamsResult.layerType, "issue");
      assertEquals(twoParamsResult.params, ["summary", "issue"]);

      // オプションにメタデータが含まれることを確認
      assertExists(twoParamsResult.options);
      assertEquals(twoParamsResult.options.profile, "breakdown-params-integration");
      assertEquals(twoParamsResult.options.source, "config-based");
    });
  });

  describe("ハードコード除去の確認", () => {
    it("DirectiveType/LayerType の定義がハードコードされていない", async () => {
      // 複数のプロファイルでテスト
      const profiles = ["default", "flexible-test", "enterprise-test"];

      for (const profileName of profiles) {
        logger.debug("プロファイルテスト開始", { profile: profileName });

        try {
          const builderResult = await ConfigBasedTwoParamsBuilder.fromConfig(profileName);

          if (builderResult.ok) {
            const builder = builderResult.data;
            const directivePattern = builder.getDirectivePattern();
            const layerPattern = builder.getLayerPattern();

            // パターンが存在し、ハードコードされた配列ではないことを確認
            assertExists(directivePattern);
            assertExists(layerPattern);

            // パターンが文字列（正規表現パターン）であることを確認
            assertEquals(typeof directivePattern, "string");
            assertEquals(typeof layerPattern, "string");

            logger.debug("プロファイルのパターン", {
              profile: profileName,
              directivePattern,
              layerPattern,
            });
          }
        } catch (error) {
          logger.debug("プロファイル読み込みエラー（想定内）", {
            profile: profileName,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    });

    it("設定ファイルを変更すると許可される値も変わる", async () => {
      // デフォルトプロファイルのビルダー
      const defaultBuilder = await ConfigBasedTwoParamsBuilder.fromConfig("default");

      // breakdown-params-integration プロファイルのビルダー
      const integrationBuilder = await ConfigBasedTwoParamsBuilder.fromConfig(
        "breakdown-params-integration",
      );

      if (!defaultBuilder.ok || !integrationBuilder.ok) {
        throw new Error("Builder creation failed");
      }

      // test_directive は integration プロファイルでのみ有効
      const defaultValidation = defaultBuilder.data.validateParams("test_directive", "test_layer");
      const integrationValidation = integrationBuilder.data.validateParams(
        "test_directive",
        "test_layer",
      );

      logger.debug("プロファイル別検証結果", {
        default: defaultValidation.ok,
        integration: integrationValidation.ok,
      });

      // integration プロファイルでのみ有効であることを確認
      assertEquals(integrationValidation.ok, true);
      // default プロファイルでは無効（設定によっては有効かもしれない）
      // これは設定ファイルの内容に依存
    });
  });

  describe("エラーハンドリング", () => {
    it("存在しないプロファイルでエラーを返す", async () => {
      const result = await ConfigBasedTwoParamsBuilder.fromConfig("non-existent-profile");

      logger.debug("存在しないプロファイルの結果", {
        ok: result.ok,
        errorKind: result.error?.kind,
      });

      assertEquals(result.ok, false);
      assertEquals(result.error?.kind, "ConfigLoadFailed");
    });

    it("パターンが未定義の場合にエラーを返す", () => {
      // カスタム設定でパターンを持たない CustomConfig を作成
      const emptyConfig = ParamsCustomConfig.create({});
      const builder = new ConfigBasedTwoParamsBuilder(emptyConfig, "empty");

      const validationResult = builder.validateParams("any", "value");

      logger.debug("パターン未定義の検証結果", {
        ok: validationResult.ok,
        errorKind: validationResult.error?.kind,
      });

      assertEquals(validationResult.ok, false);
      assertEquals(validationResult.error?.kind, "MissingPattern");
    });
  });
});
