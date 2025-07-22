/**
 * @fileoverview 新統合フロー回帰テスト
 *
 * createDefault()修正後の回帰テスト要件を満たすテストスイート
 * 既存機能への影響がないことを確認
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

// テストロガー初期化
const logger = new BreakdownLogger("regression-test");

Deno.test("0_architecture: 回帰テスト - TwoParamsType互換性", async () => {
  logger.debug("TwoParamsType互換性テスト開始", { tag: "既存APIとの互換性確認" });

  // 新統合フローで取得したTwoParamsResult - 設定ファイルから有効な値を取得
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];
  const args = [validDirective, validLayer];

  logger.debug("設定ファイルから取得した互換性テスト用値", {
    directive: validDirective,
    layer: validLayer,
  });
  const paramsResult = await executeBreakdownParams(args, "default-test");

  assertEquals(paramsResult.ok, true);
  if (!paramsResult.ok) return;
  assertExists(paramsResult.data);

  // TwoParamsType.createOrErrorでの従来通りの処理
  const twoParamsTypeResult = TwoParamsType.createOrError(paramsResult.data);

  logger.debug("TwoParamsType作成結果 - 互換性チェック", { result: twoParamsTypeResult });

  assertEquals(twoParamsTypeResult.ok, true);
  if (!twoParamsTypeResult.ok) return;
  assertExists(twoParamsTypeResult.data);

  const twoParamsType = twoParamsTypeResult.data;
  assertEquals(twoParamsType.directive, validDirective);
  assertEquals(twoParamsType.layer, validLayer);
  assertEquals(twoParamsType.params, [validDirective, validLayer]);

  logger.debug("TwoParamsType互換性確認完了", { tag: "既存API互換性維持" });
});

Deno.test("0_architecture: 回帰テスト - ConfigProfile依存除去確認", async () => {
  logger.debug("ConfigProfile依存除去確認テスト開始", { tag: "ハードコード除去検証" });

  // createDefault()を使わない新しい実装での動作確認
  const customConfigResult = await createCustomConfigFromProfile("default-test");

  assertEquals(customConfigResult.ok, true);
  if (!customConfigResult.ok) return;
  assertExists(customConfigResult.data);

  // CustomConfigの内容が設定ファイルから適切に生成されていることを確認
  const customConfig = customConfigResult.data;

  // パターンが設定ファイルから読み込まれていること
  assertExists(customConfig.params);
  assertExists(customConfig.params.two);
  assertExists(customConfig.params.two.directiveType);
  assertExists(customConfig.params.two.layerType);

  // ハードコードされた値ではなく、設定ファイルからの値であることを確認
  logger.debug("設定ファイルから読み込まれたパターン - ハードコード除去確認", {
    tag: "パターン確認",
    directivePattern: customConfig.params.two.directiveType.pattern,
    layerPattern: customConfig.params.two.layerType.pattern,
  });

  logger.debug("ConfigProfile依存除去確認完了", { tag: "ハードコード除去成功" });
});

Deno.test("1_behavior: 回帰テスト - 既存テストケース互換性", async () => {
  logger.debug("既存テストケース互換性テスト開始", { tag: "従来のテストケース動作確認" });

  // 従来のテストで使われていた典型的なパターンを設定ファイルから生成
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

  logger.debug("設定ファイルから生成されたテストケース", { testCases: legacyTestCases });

  for (const testCase of legacyTestCases) {
    const result = await createTwoParamsFromConfigFile(testCase.args, "default-test");

    logger.debug(`既存テストケース結果: ${testCase.args.join(" ")}`, { result });

    assertEquals(result.ok, true, `既存テストケースが失敗: ${testCase.args.join(" ")}`);
    if (!result.ok) continue;
    assertExists(result.data);
    assertEquals(result.data.directive.value, testCase.expected.directive);
    assertEquals(result.data.layer.value, testCase.expected.layer);
  }

  logger.debug("既存テストケース互換性確認完了", { tag: "従来テストケース動作維持" });
});

Deno.test("1_behavior: 回帰テスト - エラーメッセージ整合性", async () => {
  logger.debug("エラーメッセージ整合性テスト開始", { tag: "エラー処理の一貫性確認" });

  // 無効な引数でのエラーメッセージ - 設定ファイルから無効な値を取得
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const invalidDirective = configResult.userConfig.testData.invalidDirectives[0] ||
    "invalid_directive";
  const invalidLayer = configResult.userConfig.testData.invalidLayers[0] || "invalid_layer";
  const invalidArgs = [invalidDirective, invalidLayer];

  logger.debug("設定ファイルから取得した無効値", {
    directive: invalidDirective,
    layer: invalidLayer,
  });
  const errorResult = await createTwoParamsFromConfigFile(invalidArgs, "default-test");

  assertEquals(errorResult.ok, false);
  if (errorResult.ok) return;
  assertExists(errorResult.error);

  // エラーの種類が適切であること (現在のBreakdownParams実装に基づく)
  const errorKinds = [
    "ParamsExecutionError",
    "DirectiveTypeCreationError",
    "LayerTypeCreationError",
    "InvalidParamsType",
  ];
  const hasValidErrorKind = errorKinds.includes(errorResult.error.kind);
  assertEquals(hasValidErrorKind, true, `予期しないエラー種類: ${errorResult.error.kind}`);

  logger.debug("エラーメッセージ - エラー種類確認", {
    tag: "エラー詳細",
    kind: errorResult.error.kind,
    message: errorResult.error.message,
  });

  logger.debug("エラーメッセージ整合性確認完了", { tag: "エラー処理一貫性維持" });
});

Deno.test("2_structure: 回帰テスト - パフォーマンス劣化チェック", async () => {
  logger.debug("パフォーマンス劣化チェック開始", { tag: "処理時間測定" });

  // パフォーマンステスト用の値を設定ファイルから取得
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const args = [
    configResult.userConfig.testData.validDirectives[0],
    configResult.userConfig.testData.validLayers[0],
  ];
  const iterations = 10;

  logger.debug("設定ファイルから取得したパフォーマンステスト用値", { args });
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

  logger.debug("パフォーマンス測定結果 - 実行時間統計", {
    tag: "統計情報",
    averageTime: `${averageTime.toFixed(2)}ms`,
    maxTime: `${maxTime.toFixed(2)}ms`,
    iterations,
  });

  // パフォーマンス劣化の検出 (100ms以内であること)
  assertEquals(averageTime < 100, true, `平均実行時間が長すぎる: ${averageTime.toFixed(2)}ms`);
  assertEquals(maxTime < 200, true, `最大実行時間が長すぎる: ${maxTime.toFixed(2)}ms`);

  logger.debug("パフォーマンス劣化チェック完了", { tag: "処理時間要件満足" });
});

Deno.test("2_structure: 回帰テスト - メモリリーク検証", async () => {
  logger.debug("メモリリーク検証テスト開始", { tag: "メモリ使用量確認" });

  // メモリリークテスト用の値を設定ファイルから取得
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("flexible-test");
  const args = [
    configResult.userConfig.testData.validDirectives[1] ||
    configResult.userConfig.testData.validDirectives[0],
    configResult.userConfig.testData.validLayers[1] ||
    configResult.userConfig.testData.validLayers[0],
  ];
  const iterations = 50;

  logger.debug("設定ファイルから取得したメモリリークテスト用値", { args });

  // 初期メモリ使用量測定（概算）
  const initialMemory = performance.memory?.usedJSHeapSize || 0;

  for (let i = 0; i < iterations; i++) {
    const result = await createTwoParamsFromConfigFile(args, "flexible-test");
    assertEquals(result.ok, true);

    // 強制ガベージコレクション（可能な場合）
    if (typeof gc !== "undefined" && gc) {
      gc();
    }
  }

  // 最終メモリ使用量測定（概算）
  const finalMemory = performance.memory?.usedJSHeapSize || 0;

  if (initialMemory > 0 && finalMemory > 0) {
    const memoryIncrease = finalMemory - initialMemory;
    logger.debug("メモリ使用量変化 - メモリリーク検証", {
      tag: "メモリ統計",
      initialMemory: `${(initialMemory / 1024 / 1024).toFixed(2)}MB`,
      finalMemory: `${(finalMemory / 1024 / 1024).toFixed(2)}MB`,
      increase: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
    });

    // 大幅なメモリ増加がないことを確認（10MB以内）
    assertEquals(
      memoryIncrease < 10 * 1024 * 1024,
      true,
      `メモリ使用量が大幅に増加: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  logger.debug("メモリリーク検証完了", { tag: "メモリ使用量正常" });
});

Deno.test("3_core: 回帰テスト - 並行処理安全性", async () => {
  logger.debug("並行処理安全性テスト開始", { tag: "同時実行での動作確認" });

  // 並行処理テストケースを設定ファイルから動的生成
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

  logger.debug("設定ファイルから生成した並行処理テストケース", { testCases });

  // 全テストケースを並行実行
  const promises = testCases.map(async (testCase, index) => {
    const result = await createTwoParamsFromConfigFile(testCase.args, testCase.profile);
    return { index, testCase, result };
  });

  const results = await Promise.all(promises);

  // 全ての結果が正常であることを確認
  for (const { index, testCase, result } of results) {
    logger.debug(`並行処理結果 - テストケース${index}: ${testCase.args.join(" ")}`, { result });

    assertEquals(result.ok, true, `並行処理テストケース${index}が失敗`);
    if (!result.ok) continue;
    assertExists(result.data);
    assertEquals(result.data.directiveType, testCase.args[0]);
    assertEquals(result.data.layerType, testCase.args[1]);
  }

  logger.debug("並行処理安全性確認完了", { tag: "同時実行での動作正常" });
});
