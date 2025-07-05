/**
 * @fileoverview Unit test for DefaultTypePatternProvider
 *
 * このテストは DefaultTypePatternProvider の機能の動作を検証します。
 * デフォルトパターンの検証、DirectiveType（to|summary|defect）とLayerType（project|issue|task）の
 * 正しい処理、エラーケースの処理などを確認します。
 *
 * 検証項目:
 * - DirectiveType パターンの正しい生成と検証
 * - LayerType パターンの正しい生成と検証
 * - デフォルト値の正しい取得
 * - エラーケースの適切な処理
 *
 * @module tests/types/defaults/2_unit_default_type_pattern_provider_test
 */

import { assertEquals, assertExists, assertNotEquals } from "../../../lib/deps.ts";
import { DefaultTypePatternProvider } from "../../../../lib/types/defaults/default_type_pattern_provider.ts";
import { _defaultConfigTwoParams } from "../../../../lib/types/defaults/config_two_params.ts";

/**
 * 単体テスト: getDirectivePattern の正常系
 *
 * DirectiveType パターンが正しく生成されることを確認
 * デフォルト: "^(to|summary|defect)$"
 */
Deno.test("2_unit - DefaultTypePatternProvider.getDirectivePattern returns valid pattern", () => {
  const provider = new DefaultTypePatternProvider();
  const pattern = provider.getDirectivePattern();

  assertExists(pattern, "Should return DirectivePattern object");
  assertExists(pattern?.test, "Pattern should have test method");
  assertEquals(typeof pattern?.test, "function", "test should be a function");

  // デフォルトパターンで有効な値をテスト
  if (pattern) {
    // 有効な値
    assertEquals(pattern.test("to"), true, "'to' should be valid");
    assertEquals(pattern.test("summary"), true, "'summary' should be valid");
    assertEquals(pattern.test("defect"), true, "'defect' should be valid");

    // 無効な値
    assertEquals(pattern.test("invalid"), false, "'invalid' should be invalid");
    assertEquals(pattern.test("TO"), false, "'TO' should be invalid (case sensitive)");
    assertEquals(pattern.test("to2"), false, "'to2' should be invalid");
    assertEquals(pattern.test(""), false, "Empty string should be invalid");
    assertEquals(pattern.test("to summary"), false, "Space-separated values should be invalid");
  }
});

/**
 * 単体テスト: getLayerTypePattern の正常系
 *
 * LayerType パターンが正しく生成されることを確認
 * デフォルト: "^(project|issue|task)$"
 */
Deno.test("2_unit - DefaultTypePatternProvider.getLayerTypePattern returns valid pattern", () => {
  const provider = new DefaultTypePatternProvider();
  const pattern = provider.getLayerTypePattern();

  assertExists(pattern, "Should return LayerTypePattern object");
  assertExists(pattern?.test, "Pattern should have test method");
  assertEquals(typeof pattern?.test, "function", "test should be a function");

  // デフォルトパターンで有効な値をテスト
  if (pattern) {
    // 有効な値
    assertEquals(pattern.test("project"), true, "'project' should be valid");
    assertEquals(pattern.test("issue"), true, "'issue' should be valid");
    assertEquals(pattern.test("task"), true, "'task' should be valid");

    // 無効な値
    assertEquals(pattern.test("invalid"), false, "'invalid' should be invalid");
    assertEquals(pattern.test("PROJECT"), false, "'PROJECT' should be invalid (case sensitive)");
    assertEquals(pattern.test("task1"), false, "'task1' should be invalid");
    assertEquals(pattern.test(""), false, "Empty string should be invalid");
    assertEquals(pattern.test("project issue"), false, "Space-separated values should be invalid");
  }
});

/**
 * 単体テスト: getDefaultConfig の動作
 *
 * デフォルト設定オブジェクトが正しく返されることを確認
 */
Deno.test("2_unit - DefaultTypePatternProvider.getDefaultConfig returns _defaultConfigTwoParams", () => {
  const provider = new DefaultTypePatternProvider();
  const config = provider.getDefaultConfig();

  // 同一オブジェクトを返すことを確認
  assertEquals(config, _defaultConfigTwoParams, "Should return _defaultConfigTwoParams");

  // 設定の構造を確認
  assertExists(config.params, "Config should have params");
  assertExists(config.params.two, "Config should have two params");
  assertExists(config.params.two.demonstrativeType, "Config should have demonstrativeType");
  assertExists(config.params.two.layerType, "Config should have layerType");

  // パターン文字列の確認
  assertEquals(
    config.params.two.demonstrativeType.pattern,
    "^(to|summary|defect)$",
    "DirectiveType pattern should match expected",
  );
  assertEquals(
    config.params.two.layerType.pattern,
    "^(project|issue|task)$",
    "LayerType pattern should match expected",
  );
});

/**
 * 単体テスト: getValidDirectiveValues の動作
 *
 * 有効な DirectiveType 値のリストが正しく抽出されることを確認
 */
Deno.test("2_unit - DefaultTypePatternProvider.getValidDirectiveValues extracts correct values", () => {
  const provider = new DefaultTypePatternProvider();
  const values = provider.getValidDirectiveValues();

  // 配列であることを確認
  assertEquals(Array.isArray(values), true, "Should return an array");

  // 期待される値を確認
  assertEquals(values.length, 3, "Should have 3 valid directive values");
  assertEquals(values.includes("to"), true, "Should include 'to'");
  assertEquals(values.includes("summary"), true, "Should include 'summary'");
  assertEquals(values.includes("defect"), true, "Should include 'defect'");

  // 順序も確認（正規表現の順序と一致）
  assertEquals(values[0], "to", "First value should be 'to'");
  assertEquals(values[1], "summary", "Second value should be 'summary'");
  assertEquals(values[2], "defect", "Third value should be 'defect'");
});

/**
 * 単体テスト: getValidLayerValues の動作
 *
 * 有効な LayerType 値のリストが正しく抽出されることを確認
 */
Deno.test("2_unit - DefaultTypePatternProvider.getValidLayerValues extracts correct values", () => {
  const provider = new DefaultTypePatternProvider();
  const values = provider.getValidLayerValues();

  // 配列であることを確認
  assertEquals(Array.isArray(values), true, "Should return an array");

  // 期待される値を確認
  assertEquals(values.length, 3, "Should have 3 valid layer values");
  assertEquals(values.includes("project"), true, "Should include 'project'");
  assertEquals(values.includes("issue"), true, "Should include 'issue'");
  assertEquals(values.includes("task"), true, "Should include 'task'");

  // 順序も確認（正規表現の順序と一致）
  assertEquals(values[0], "project", "First value should be 'project'");
  assertEquals(values[1], "issue", "Second value should be 'issue'");
  assertEquals(values[2], "task", "Third value should be 'task'");
});

/**
 * 単体テスト: debug メソッドの動作
 *
 * デバッグ情報が正しく構造化されて返されることを確認
 */
Deno.test("2_unit - DefaultTypePatternProvider.debug returns structured debug info", () => {
  const provider = new DefaultTypePatternProvider();
  const debugInfo = provider.debug();

  // デバッグ情報の構造を確認
  assertExists(debugInfo, "Should return debug info object");
  assertEquals(typeof debugInfo, "object", "Debug info should be an object");

  // 必須フィールドの確認
  assertEquals(
    debugInfo.providerType,
    "DefaultTypePatternProvider",
    "Should identify provider type",
  );
  assertEquals(
    debugInfo.directivePattern,
    "^(to|summary|defect)$",
    "Should include directive pattern",
  );
  assertEquals(debugInfo.layerPattern, "^(project|issue|task)$", "Should include layer pattern");

  // 有効値リストの確認
  assertEquals(
    Array.isArray(debugInfo.validDirectives),
    true,
    "Should include directive values array",
  );
  assertEquals(debugInfo.validDirectives.length, 3, "Should have 3 directive values");
  assertEquals(
    debugInfo.validDirectives,
    ["to", "summary", "defect"],
    "Directive values should match",
  );

  assertEquals(Array.isArray(debugInfo.validLayers), true, "Should include layer values array");
  assertEquals(debugInfo.validLayers.length, 3, "Should have 3 layer values");
  assertEquals(debugInfo.validLayers, ["project", "issue", "task"], "Layer values should match");
});

/**
 * 単体テスト: パターン抽出の境界ケース
 *
 * 正規表現パターンからの値抽出が特殊なケースでも動作することを確認
 */
Deno.test("2_unit - DefaultTypePatternProvider handles pattern extraction edge cases", () => {
  const provider = new DefaultTypePatternProvider();

  // 現在の実装では固定パターンなので、エッジケースは限定的
  // 将来の拡張性のためのテスト

  const directiveValues = provider.getValidDirectiveValues();
  const layerValues = provider.getValidLayerValues();

  // 値が文字列であることを確認
  directiveValues.forEach((value) => {
    assertEquals(typeof value, "string", `Directive value '${value}' should be string`);
    assertNotEquals(value, "", `Directive value should not be empty`);
  });

  layerValues.forEach((value) => {
    assertEquals(typeof value, "string", `Layer value '${value}' should be string`);
    assertNotEquals(value, "", `Layer value should not be empty`);
  });
});

/**
 * 単体テスト: メソッドの冪等性
 *
 * 同じメソッドを複数回呼んでも同じ結果を返すことを確認
 */
Deno.test("2_unit - DefaultTypePatternProvider methods are idempotent", () => {
  const provider = new DefaultTypePatternProvider();

  // getDirectivePattern の冪等性
  const pattern1 = provider.getDirectivePattern();
  const pattern2 = provider.getDirectivePattern();
  assertExists(pattern1, "First call should return pattern");
  assertExists(pattern2, "Second call should return pattern");

  // getLayerTypePattern の冪等性
  const layerPattern1 = provider.getLayerTypePattern();
  const layerPattern2 = provider.getLayerTypePattern();
  assertExists(layerPattern1, "First call should return pattern");
  assertExists(layerPattern2, "Second call should return pattern");

  // getDefaultConfig の冪等性（同一オブジェクト参照）
  const config1 = provider.getDefaultConfig();
  const config2 = provider.getDefaultConfig();
  assertEquals(config1, config2, "Should return same config object");

  // getValidDirectiveValues の冪等性（同じ値）
  const dirValues1 = provider.getValidDirectiveValues();
  const dirValues2 = provider.getValidDirectiveValues();
  assertEquals(dirValues1, dirValues2, "Should return same directive values");

  // getValidLayerValues の冪等性（同じ値）
  const layerValues1 = provider.getValidLayerValues();
  const layerValues2 = provider.getValidLayerValues();
  assertEquals(layerValues1, layerValues2, "Should return same layer values");
});

/**
 * 単体テスト: インスタンス間の独立性
 *
 * 複数のインスタンス間で状態が共有されないことを確認
 */
Deno.test("2_unit - DefaultTypePatternProvider instances are independent", () => {
  const provider1 = new DefaultTypePatternProvider();
  const provider2 = new DefaultTypePatternProvider();

  // 両インスタンスが同じ設定を参照することを確認
  const config1 = provider1.getDefaultConfig();
  const config2 = provider2.getDefaultConfig();
  assertEquals(config1, config2, "Should reference same config object");

  // パターン生成は独立して行われることを確認
  const pattern1 = provider1.getDirectivePattern();
  const pattern2 = provider2.getDirectivePattern();
  assertExists(pattern1, "Provider1 should create pattern");
  assertExists(pattern2, "Provider2 should create pattern");

  // 値の取得も独立して行われることを確認
  const values1 = provider1.getValidDirectiveValues();
  const values2 = provider2.getValidDirectiveValues();
  assertEquals(values1, values2, "Should extract same values independently");
});

/**
 * 単体テスト: TypeFactory との統合を想定した使用例
 *
 * TypeFactory から使用される際の動作を確認
 */
Deno.test("2_unit - DefaultTypePatternProvider works as TypePatternProvider", () => {
  const provider = new DefaultTypePatternProvider();

  // TypePatternProvider インターフェースのメソッドとして使用
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();

  // null でないことを確認（TypeFactory は null チェックを行う）
  assertNotEquals(directivePattern, null, "DirectivePattern should not be null for valid config");
  assertNotEquals(layerPattern, null, "LayerPattern should not be null for valid config");

  // パターンが使用可能であることを確認
  if (directivePattern && layerPattern) {
    // TypeFactory での使用例をシミュレート
    const directiveValidation = directivePattern.test("to");
    const layerValidation = layerPattern.test("project");

    assertEquals(directiveValidation, true, "Should validate 'to' as DirectiveType");
    assertEquals(layerValidation, true, "Should validate 'project' as LayerType");
  }
});
