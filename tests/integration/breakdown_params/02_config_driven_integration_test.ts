/**
 * @fileoverview 新統合フロー統合テスト - 設定ドリブンテスト
 *
 * 様々な設定ファイルパターンでの統合フロー動作をテスト
 * createDefault()依存排除後の設定ファイルベーステストを実現
 *
 * @module tests/integration/breakdown_params/02_config_driven_integration_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  createTwoParamsFromConfigFile,
  executeBreakdownParams,
} from "../../../lib/application/breakdown_params_integration.ts";

// テストロガー初期化
const logger = new BreakdownLogger("config-driven-test");

// 設定ファイルベーステストのテストケース
interface ConfigTestCase {
  profileName: string;
  description: string;
  validArgs: string[][];
  invalidArgs: string[][];
  expectedPatterns: {
    directivePattern: string;
    layerPattern: string;
  };
}

const configTestCases: ConfigTestCase[] = [
  {
    profileName: "default-test",
    description: "基本設定パターン",
    validArgs: [
      ["to", "project"],
      ["summary", "issue"],
      ["defect", "task"],
    ],
    invalidArgs: [
      ["invalid", "project"],
      ["to", "invalid"],
      ["", "project"],
      ["to", ""],
    ],
    expectedPatterns: {
      directivePattern: "^(to|summary|defect)$",
      layerPattern: "^(project|issue|task)$",
    },
  },
  {
    profileName: "flexible-test",
    description: "拡張パターン設定",
    validArgs: [
      ["to", "project"],
      ["summary", "issue"],
      ["defect", "task"],
    ],
    invalidArgs: [
      ["invalid@email", "project"],
      ["to", "INVALID@LAYER"],
      ["a123456789012345678901", "project"], // too long
      ["a", "project"], // too short
    ],
    expectedPatterns: {
      directivePattern: "^(to|summary|defect)$",
      layerPattern: "^(project|issue|task)$",
    },
  },
];

// 各設定パターンでのテスト実行
for (const testCase of configTestCases) {
  Deno.test(`1_behavior: 設定ドリブン統合 - ${testCase.description}`, async () => {
    logger.debug(`設定ドリブンテスト開始: ${testCase.description} - 設定パターン`, {
      profileName: testCase.profileName,
    });

    // 有効な引数のテスト
    for (const validArgs of testCase.validArgs) {
      const result = await createTwoParamsFromConfigFile(validArgs, testCase.profileName);

      logger.debug(`有効引数テスト: ${validArgs.join(" ")} (profile: ${testCase.profileName})`, {
        result,
      });

      assertEquals(
        result.ok,
        true,
        `有効な引数 [${validArgs.join(", ")}] が失敗: ${testCase.profileName}`,
      );
      if (result.ok) {
        assertExists(result.data);
        assertEquals(result.data.directiveType, validArgs[0]);
        assertEquals(result.data.layerType, validArgs[1]);
      }
    }

    logger.debug(`設定ドリブン有効引数テスト完了: ${testCase.description}`, { stage: "test" });
  });

  Deno.test(`2_structure: 設定ドリブンバリデーション - ${testCase.description}`, async () => {
    logger.debug(
      `設定ドリブンバリデーションテスト開始: ${testCase.description} - バリデーション検証`,
      { profileName: testCase.profileName },
    );

    // 無効な引数のテスト
    for (const invalidArgs of testCase.invalidArgs) {
      const result = await createTwoParamsFromConfigFile(invalidArgs, testCase.profileName);

      logger.debug(`無効引数テスト: ${invalidArgs.join(" ")} (profile: ${testCase.profileName})`, {
        result,
      });

      assertEquals(
        result.ok,
        false,
        `無効な引数 [${invalidArgs.join(", ")}] が成功してしまった: ${testCase.profileName}`,
      );
    }

    logger.debug(`設定ドリブンバリデーションテスト完了: ${testCase.description}`, {
      stage: "test",
    });
  });
}

Deno.test("3_core: 設定ドリブン統合 - パターン整合性検証", async () => {
  logger.debug("パターン整合性検証テスト開始", { stage: "testData vs pattern整合性" });

  // 設定ファイル読み込みとパターン整合性確認
  for (const testCase of configTestCases) {
    logger.debug(`パターン整合性検証: ${testCase.profileName}`, { stage: "整合性チェック開始" });

    // testDataの有効な値が実際にパターンマッチすることを確認
    for (const validArgs of testCase.validArgs) {
      const result = await executeBreakdownParams(validArgs, testCase.profileName);

      assertEquals(
        result.ok,
        true,
        `testData有効値がパターンに適合しない: ${validArgs.join(", ")} (${testCase.profileName})`,
      );

      // パターンとの整合性を詳細チェック
      const directiveRegex = new RegExp(testCase.expectedPatterns.directivePattern);
      const layerRegex = new RegExp(testCase.expectedPatterns.layerPattern);

      assertEquals(
        directiveRegex.test(validArgs[0]),
        true,
        `DirectiveType パターンマッチ失敗: ${validArgs[0]}`,
      );
      assertEquals(
        layerRegex.test(validArgs[1]),
        true,
        `LayerType パターンマッチ失敗: ${validArgs[1]}`,
      );
    }

    logger.debug(`パターン整合性検証完了: ${testCase.profileName}`, { stage: "整合性確認成功" });
  }
});

Deno.test("3_core: 設定ドリブン統合 - プロファイル切り替え", async () => {
  logger.debug("プロファイル切り替えテスト開始", { stage: "異なる設定間での動作確認" });

  const switchTestArgs = ["to", "project"];

  // default-test プロファイルでの実行
  const defaultResult = await createTwoParamsFromConfigFile(switchTestArgs, "default-test");
  assertEquals(defaultResult.ok, true);

  // flexible-test プロファイルでの実行
  const flexibleResult = await createTwoParamsFromConfigFile(switchTestArgs, "flexible-test");
  assertEquals(flexibleResult.ok, true);

  // 両方とも同じ結果を返すこと
  if (defaultResult.ok && flexibleResult.ok) {
    assertEquals(defaultResult.data.directiveType, flexibleResult.data.directiveType);
    assertEquals(defaultResult.data.layerType, flexibleResult.data.layerType);
  }

  // Both profiles support the same basic patterns, so this test demonstrates profile loading
  const basicArgs = ["summary", "issue"];

  const flexibleOnlyResult = await createTwoParamsFromConfigFile(basicArgs, "flexible-test");
  assertEquals(flexibleOnlyResult.ok, true);

  const defaultOnlyResult = await createTwoParamsFromConfigFile(basicArgs, "default-test");
  assertEquals(defaultOnlyResult.ok, true); // both profiles support basic patterns

  logger.debug("プロファイル切り替えテスト完了", { stage: "設定間での動作差分確認成功" });
});
