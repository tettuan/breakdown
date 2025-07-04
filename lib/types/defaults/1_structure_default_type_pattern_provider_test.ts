/**
 * @fileoverview Structure test for DefaultTypePatternProvider
 *
 * このテストは DefaultTypePatternProvider のクラス構造と責務分離を検証します。
 * 単一責任の原則の遵守、責務の重複の有無、適切な抽象化レベル、クラス間の関係性を確認します。
 *
 * 検証項目:
 * - クラスの責務が単一であること
 * - メソッドの責務が明確であること
 * - 適切な抽象化レベルを保っていること
 * - クラス間の関係が適切であること
 *
 * @module tests/types/defaults/1_structure_default_type_pattern_provider_test
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { DefaultTypePatternProvider } from "./default_type_pattern_provider.ts";
import { TwoParamsDirectivePattern } from "../directive_type.ts";
import { TwoParamsLayerTypePattern } from "../layer_type.ts";
import { __defaultConfigTwoParams } from "./config_twoparams.ts";

/**
 * 構造テスト: クラスの単一責任
 *
 * DefaultTypePatternProvider が単一の責任に集中していることを確認
 * 責任: デフォルト設定から型パターンを提供する
 */
Deno.test("1_structure - DefaultTypePatternProvider has single responsibility", () => {
  const provider = new DefaultTypePatternProvider();

  // クラスの責任: デフォルト設定からパターンを提供
  // 以下の責任に限定されていることを確認:
  // 1. DirectiveType パターンの提供
  // 2. LayerType パターンの提供
  // 3. デフォルト設定へのアクセス提供
  // 4. 有効値リストの提供

  // 責任外の機能が含まれていないことを確認
  const prototype = Object.getPrototypeOf(provider);
  const methods = Object.getOwnPropertyNames(prototype)
    .filter((name) => name !== "constructor" && typeof prototype[name] === "function");

  // 期待されるメソッドのみが存在することを確認
  const expectedMethods = [
    "getDirectivePattern",
    "getLayerTypePattern",
    "getDefaultConfig",
    "getValidDirectiveValues",
    "getValidLayerValues",
    "debug",
  ];

  // 余分なメソッドがないことを確認
  methods.forEach((method) => {
    assertEquals(
      expectedMethods.includes(method),
      true,
      `Method ${method} should be in expected methods list`,
    );
  });
});

/**
 * 構造テスト: メソッドの責務分離
 *
 * 各メソッドが明確な単一の責務を持つことを確認
 */
Deno.test("1_structure - DefaultTypePatternProvider methods have clear responsibilities", () => {
  const provider = new DefaultTypePatternProvider();

  // getDirectivePattern: DirectiveType パターンの取得のみ
  const directivePattern = provider.getDirectivePattern();
  if (directivePattern) {
    // private constructor のため、メソッドの存在で確認
    assertExists(directivePattern.test, "Should have test method");
    assertExists(directivePattern.toString, "Should have toString method");
    assertExists(directivePattern.getPattern, "Should have getPattern method");
    assertEquals(
      typeof directivePattern.test,
      "function",
      "getDirectivePattern should return pattern object with test method",
    );
  }

  // getLayerTypePattern: LayerType パターンの取得のみ
  const layerPattern = provider.getLayerTypePattern();
  if (layerPattern) {
    // private constructor のため、メソッドの存在で確認
    assertExists(layerPattern.test, "Should have test method");
    assertExists(layerPattern.toString, "Should have toString method");
    assertExists(layerPattern.getPattern, "Should have getPattern method");
    assertEquals(
      typeof layerPattern.test,
      "function",
      "getLayerTypePattern should return pattern object with test method",
    );
  }

  // getDefaultConfig: 設定オブジェクトの取得のみ
  const config = provider.getDefaultConfig();
  assertEquals(
    config,
    _defaultConfigTwoParams,
    "getDefaultConfig should return the default config object",
  );

  // getValidDirectiveValues: 有効な DirectiveType 値のリスト取得のみ
  const directiveValues = provider.getValidDirectiveValues();
  assertEquals(
    Array.isArray(directiveValues),
    true,
    "getValidDirectiveValues should return an array",
  );
  assertEquals(
    directiveValues.length > 0,
    true,
    "Should return non-empty array of valid directive values",
  );

  // getValidLayerValues: 有効な LayerType 値のリスト取得のみ
  const layerValues = provider.getValidLayerValues();
  assertEquals(
    Array.isArray(layerValues),
    true,
    "getValidLayerValues should return an array",
  );
  assertEquals(
    layerValues.length > 0,
    true,
    "Should return non-empty array of valid layer values",
  );
});

/**
 * 構造テスト: 抽象化レベルの一貫性
 *
 * DefaultTypePatternProvider が適切な抽象化レベルを保っていることを確認
 */
Deno.test("1_structure - DefaultTypePatternProvider maintains consistent abstraction level", () => {
  const provider = new DefaultTypePatternProvider();

  // 高レベル抽象化: パターンオブジェクトの取得
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();

  // 中レベル抽象化: 設定と有効値の取得
  const config = provider.getDefaultConfig();
  const directiveValues = provider.getValidDirectiveValues();
  const layerValues = provider.getValidLayerValues();

  // 低レベル詳細が露出していないことを確認
  // （正規表現の詳細やパターン生成ロジックは隠蔽されている）
  assertExists(directivePattern, "High-level pattern object should be returned");
  assertExists(layerPattern, "High-level pattern object should be returned");

  // 抽象化レベルが一貫していることを確認
  if (directivePattern && layerPattern) {
    // パターンオブジェクトは test メソッドを持つ高レベルインターフェース
    assertExists(directivePattern.test, "Pattern should have high-level test method");
    assertExists(layerPattern.test, "Pattern should have high-level test method");
  }
});

/**
 * 構造テスト: データと振る舞いの凝集性
 *
 * DefaultTypePatternProvider がデータと振る舞いを適切に組み合わせていることを確認
 */
Deno.test("1_structure - DefaultTypePatternProvider has cohesive data and behavior", () => {
  const provider = new DefaultTypePatternProvider();

  // プロバイダーはステートレス（データを持たない）
  const ownProperties = Object.getOwnPropertyNames(provider);
  assertEquals(
    ownProperties.length,
    0,
    "Provider should be stateless (no instance data)",
  );

  // 振る舞いは外部データ（_defaultConfigTwoParams）に依存
  const config = provider.getDefaultConfig();
  assertExists(config.params, "Should access external config data");
  assertExists(config.params.two, "Should access two params config");
  assertExists(config.params.two.demonstrativeType, "Should access directive config");
  assertExists(config.params.two.layerType, "Should access layer config");

  // データアクセスメソッドが一貫した形式で提供されている
  const directiveValues = provider.getValidDirectiveValues();
  const layerValues = provider.getValidLayerValues();

  assertEquals(
    Array.isArray(directiveValues) && Array.isArray(layerValues),
    true,
    "Value access methods should return consistent array format",
  );
});

/**
 * 構造テスト: 責務の重複がないこと
 *
 * DefaultTypePatternProvider のメソッド間で責務の重複がないことを確認
 */
Deno.test("1_structure - DefaultTypePatternProvider has no responsibility duplication", () => {
  const provider = new DefaultTypePatternProvider();

  // 各メソッドが独自の責務を持つことを確認
  const methodResponsibilities = {
    getDirectivePattern: "Create DirectiveType pattern object",
    getLayerTypePattern: "Create LayerType pattern object",
    getDefaultConfig: "Provide access to default configuration",
    getValidDirectiveValues: "Extract valid directive values from pattern",
    getValidLayerValues: "Extract valid layer values from pattern",
    debug: "Provide debug information",
  };

  // 責務の分離を確認
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();

  // パターン取得メソッドは異なる型のパターンを返す
  if (directivePattern && layerPattern) {
    // private constructor のため、メソッドの存在で型を確認
    assertExists(directivePattern.test, "DirectivePattern should have test method");
    assertExists(
      directivePattern.getDirectivePattern,
      "DirectivePattern should have getDirectivePattern method",
    );
    assertExists(layerPattern.test, "LayerPattern should have test method");
    assertExists(
      layerPattern.getLayerTypePattern,
      "LayerPattern should have getLayerTypePattern method",
    );
  }

  // 値取得メソッドは異なるデータを返す
  const directiveValues = provider.getValidDirectiveValues();
  const layerValues = provider.getValidLayerValues();

  assertEquals(
    directiveValues.includes("to"),
    true,
    "Directive values should include 'to'",
  );
  assertEquals(
    layerValues.includes("project"),
    true,
    "Layer values should include 'project'",
  );

  // 値のリストが異なることを確認（責務の分離）
  assertEquals(
    JSON.stringify(directiveValues) !== JSON.stringify(layerValues),
    true,
    "Different methods should return different value sets",
  );
});

/**
 * 構造テスト: 内部実装の詳細が隠蔽されていること
 *
 * DefaultTypePatternProvider が実装詳細を適切に隠蔽していることを確認
 */
Deno.test("1_structure - DefaultTypePatternProvider encapsulates implementation details", () => {
  const provider = new DefaultTypePatternProvider();

  // パターン文字列の抽出ロジックが隠蔽されている
  const directiveValues = provider.getValidDirectiveValues();
  const layerValues = provider.getValidLayerValues();

  // 正規表現パターンの詳細が直接露出していない
  assertExists(directiveValues, "Should provide processed values, not raw patterns");
  assertExists(layerValues, "Should provide processed values, not raw patterns");

  // 値の抽出が内部で処理されている
  assertEquals(
    directiveValues.every((v) => typeof v === "string"),
    true,
    "Should return processed string values",
  );
  assertEquals(
    layerValues.every((v) => typeof v === "string"),
    true,
    "Should return processed string values",
  );

  // デバッグ情報は構造化されたオブジェクトとして提供
  const debugInfo = provider.debug();
  assertExists(debugInfo.providerType, "Debug info should be structured");
  assertExists(debugInfo.directivePattern, "Debug info should include pattern details");
  assertExists(debugInfo.layerPattern, "Debug info should include pattern details");
  assertExists(debugInfo.validDirectives, "Debug info should include valid values");
  assertExists(debugInfo.validLayers, "Debug info should include valid values");
});

/**
 * 構造テスト: クラス間の関係性
 *
 * DefaultTypePatternProvider と他のクラスとの関係が適切であることを確認
 */
Deno.test("1_structure - DefaultTypePatternProvider has appropriate class relationships", () => {
  const provider = new DefaultTypePatternProvider();

  // 依存関係:
  // - TwoParamsDirectivePattern (使用)
  // - TwoParamsLayerTypePattern (使用)
  // - _defaultConfigTwoParams (使用)
  // - TypePatternProvider (実装)

  // パターンクラスとの関係（使用関係）
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();

  if (directivePattern) {
    // TwoParamsDirectivePattern のインスタンスを返す（生成と使用）
    assertExists(directivePattern.test, "Should have test method");
    assertExists(directivePattern.getPattern, "Should have getPattern method");
    assertEquals(
      typeof directivePattern.test,
      "function",
      "Should create and return pattern instance",
    );
  }

  if (layerPattern) {
    // TwoParamsLayerTypePattern のインスタンスを返す（生成と使用）
    assertExists(layerPattern.test, "Should have test method");
    assertExists(layerPattern.getPattern, "Should have getPattern method");
    assertEquals(
      typeof layerPattern.test,
      "function",
      "Should create and return pattern instance",
    );
  }

  // 設定オブジェクトとの関係（参照関係）
  const config = provider.getDefaultConfig();
  assertEquals(
    config === _defaultConfigTwoParams,
    true,
    "Should reference the same config object",
  );
});

/**
 * 構造テスト: メソッドのシグネチャの一貫性
 *
 * DefaultTypePatternProvider のメソッドシグネチャが一貫していることを確認
 */
Deno.test("1_structure - DefaultTypePatternProvider has consistent method signatures", () => {
  const provider = new DefaultTypePatternProvider();
  const prototype = Object.getPrototypeOf(provider);

  // パターン取得メソッドの一貫性
  const patternMethods = ["getDirectivePattern", "getLayerTypePattern"];
  patternMethods.forEach((method) => {
    assertEquals(
      prototype[method].length,
      0,
      `${method} should take no parameters`,
    );
  });

  // 値取得メソッドの一貫性
  const valueMethods = ["getValidDirectiveValues", "getValidLayerValues"];
  valueMethods.forEach((method) => {
    assertEquals(
      prototype[method].length,
      0,
      `${method} should take no parameters`,
    );

    const result = provider[method as keyof typeof provider]();
    assertEquals(
      Array.isArray(result),
      true,
      `${method} should return an array`,
    );
  });

  // 情報取得メソッドの一貫性
  const infoMethods = ["getDefaultConfig", "debug"];
  infoMethods.forEach((method) => {
    assertEquals(
      prototype[method].length,
      0,
      `${method} should take no parameters`,
    );

    const result = provider[method as keyof typeof provider]();
    assertEquals(
      typeof result === "object" && result !== null,
      true,
      `${method} should return an object`,
    );
  });
});
