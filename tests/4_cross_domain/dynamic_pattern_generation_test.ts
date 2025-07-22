/**
 * @fileoverview Dynamic Pattern Generation Test
 *
 * ConfigurationPatternGeneratorとConfigurationTestHelperの動的生成機能をテスト
 * ハードコード配列排除の検証
 *
 * @module tests/4_cross_domain/dynamic_pattern_generation_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { ConfigurationTestHelper } from "../../lib/test_helpers/configuration_test_helper_simple.ts";
import { ConfigurationPatternGenerator } from "../../lib/test_helpers/configuration_pattern_generator.ts";

// テストロガー初期化
const logger = new BreakdownLogger("dynamic-pattern-test");

Deno.test("3_core: 動的パターン生成 - ConfigurationPatternGenerator基本機能", () => {
  logger.debug("ConfigurationPatternGenerator基本機能テスト開始", {
    tag: "パターンから動的生成テスト",
  });

  // 厳格パターンのテスト
  const strictConfig = {
    directiveType: { pattern: "^(to|summary|defect)$" },
    layerType: { pattern: "^(project|issue|task)$" },
  };

  const strictData = ConfigurationPatternGenerator.generateTestData(strictConfig);

  logger.debug("厳格パターン生成結果", { tag: "パターンテスト", data: strictData });

  // 期待される値が含まれていることを確認
  assertEquals(strictData.validDirectives.includes("to"), true);
  assertEquals(strictData.validDirectives.includes("summary"), true);
  assertEquals(strictData.validDirectives.includes("defect"), true);
  assertEquals(strictData.validLayers.includes("project"), true);
  assertEquals(strictData.validLayers.includes("issue"), true);
  assertEquals(strictData.validLayers.includes("task"), true);

  // 無効な値も生成されていることを確認
  assertEquals(strictData.invalidDirectives.length > 0, true);
  assertEquals(strictData.invalidLayers.length > 0, true);

  logger.debug("ConfigurationPatternGenerator基本機能確認完了", { tag: "厳格パターン生成成功" });
});

Deno.test("3_core: 動的パターン生成 - 柔軟パターン生成", () => {
  logger.debug("柔軟パターン生成テスト開始", { tag: "ハッシュ記号を含むパターンテスト" });

  // 柔軟パターンのテスト
  const flexibleConfig = {
    directiveType: { pattern: "^[a-z0-9_#-]{2,20}$" },
    layerType: { pattern: "^[a-z0-9_#-]{2,20}$" },
  };

  const flexibleData = ConfigurationPatternGenerator.generateTestData(flexibleConfig);

  logger.debug("柔軟パターン生成結果", { tag: "パターンテスト", data: flexibleData });

  // 基本値が含まれていることを確認
  assertEquals(flexibleData.validDirectives.length > 0, true);
  assertEquals(flexibleData.validLayers.length > 0, true);

  // ハッシュ記号を含む値が含まれていることを確認（パターンが対応している場合）
  const hasHashValue = flexibleData.validDirectives.some((d) => d.includes("#")) ||
    flexibleData.validLayers.some((l) => l.includes("#"));
  assertEquals(hasHashValue, true, "ハッシュ記号を含む値が生成されるべき");

  logger.debug("柔軟パターン生成確認完了", { tag: "ハッシュ記号を含むパターン生成成功" });
});

Deno.test("2_structure: 動的パターン生成 - ConfigurationTestHelper統合", async () => {
  logger.debug("ConfigurationTestHelper統合テスト開始", { tag: "動的生成とヘルパー統合" });

  // flexible-test-user.yml（動的生成に変更済み）を使用
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("flexible-test");

  logger.debug("動的生成設定ロード結果", { tag: "設定ロード", config: configResult.userConfig });

  assertExists(configResult.userConfig);
  assertExists(configResult.userConfig.testData);

  // 動的生成されたデータが含まれていることを確認
  const testData = configResult.userConfig.testData;
  assertEquals(Array.isArray(testData.validDirectives), true);
  assertEquals(Array.isArray(testData.validLayers), true);
  assertEquals(Array.isArray(testData.invalidDirectives), true);
  assertEquals(Array.isArray(testData.invalidLayers), true);

  // 動的生成されたデータに値があることを確認
  assertEquals(testData.validDirectives.length > 0, true);
  assertEquals(testData.validLayers.length > 0, true);
  assertEquals(testData.invalidDirectives.length > 0, true);
  assertEquals(testData.invalidLayers.length > 0, true);

  logger.debug("動的生成データ確認", {
    tag: "データ確認",
    validDirectives: testData.validDirectives,
    validLayers: testData.validLayers,
  });

  logger.debug("ConfigurationTestHelper統合確認完了", { tag: "動的生成統合成功" });
});

// TODO: パス設定修正後に有効化
Deno.test.ignore("1_behavior: ハードコード排除検証 - パターンファイル動的化", async () => {
  logger.debug("ハードコード排除検証開始", { tag: "全パターンファイルの動的化確認" });

  const patternConfigs = [
    { name: "basic", configName: "basic" },
    { name: "strict", configName: "strict" },
    { name: "liberal", configName: "liberal" },
    { name: "flexible-test", configName: "flexible-test" },
    { name: "default-matching", configName: "default-matching" },
    { name: "edge-case", configName: "edge-case" },
  ];

  for (const config of patternConfigs) {
    logger.debug(`パターンファイル動的化確認: ${config.name}`, { stage: "test" });

    try {
      const result = await ConfigurationTestHelper.loadTestConfiguration(config.configName);

      // 動的生成されたデータが正しく読み込まれていることを確認
      assertExists(result.userConfig.testData);
      assertEquals(Array.isArray(result.userConfig.testData.validDirectives), true);
      assertEquals(Array.isArray(result.userConfig.testData.validLayers), true);

      // 空でないことを確認（動的生成が成功している）
      assertEquals(
        result.userConfig.testData.validDirectives.length > 0,
        true,
        `${config.name}: validDirectivesが空`,
      );
      assertEquals(
        result.userConfig.testData.validLayers.length > 0,
        true,
        `${config.name}: validLayersが空`,
      );

      logger.debug(`${config.name} 動的化確認完了`, {
        tag: "確認完了",
        validDirectivesCount: result.userConfig.testData.validDirectives.length,
        validLayersCount: result.userConfig.testData.validLayers.length,
      });
    } catch (error) {
      logger.debug(`${config.name} 動的化失敗`, { tag: "失敗", error });
      throw error;
    }
  }

  logger.debug("ハードコード排除検証完了", { tag: "全パターンファイルの動的化成功" });
});
