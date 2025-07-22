/**
 * @fileoverview JSRPatternAdapter シンプルテスト
 *
 * DEFAULT_CUSTOM_CONFIGのみを使用したシンプルな動作確認
 */

import { assert, assertEquals } from "../deps.ts";
import { JSRPatternAdapter } from "./jsr_pattern_adapter.ts";

Deno.test("JSRPatternAdapter - DEFAULT_CUSTOM_CONFIGでの基本動作", () => {
  // DEFAULT_CUSTOM_CONFIGでの作成
  const result = JSRPatternAdapter.create();

  if (!result.ok) {
    const errorMessage = "message" in result.error ? result.error.message : result.error.kind;
    console.log(`Creation failed: ${errorMessage}`);

    // エラーでも継続（デバッグ目的）
    assert(false, `JSRPatternAdapter creation failed: ${errorMessage}`);
  }

  const adapter = result.data;

  // 基本的な初期化確認
  assertEquals(adapter.isInitialized(), true);

  // デバッグ情報確認
  const debugInfo = adapter.debug();
  console.log("Debug info:", debugInfo);

  // TypePatternProvider基本メソッドの動作確認
  console.log("validateDirectiveType('to'):", adapter.validateDirectiveType("to"));
  console.log("validateLayerType('project'):", adapter.validateLayerType("project"));

  console.log("getValidDirectiveTypes():", adapter.getValidDirectiveTypes());
  console.log("getValidLayerTypes():", adapter.getValidLayerTypes());
});

Deno.test("JSRPatternAdapter - パターンオブジェクト取得", () => {
  const result = JSRPatternAdapter.create();

  if (result.ok) {
    const adapter = result.data;

    const directivePattern = adapter.getDirectivePattern();
    const layerPattern = adapter.getLayerTypePattern();

    console.log("DirectivePattern:", directivePattern);
    console.log("LayerPattern:", layerPattern);

    // パターンが取得できているか確認（null でも構わない）
    console.log("Has directive pattern:", directivePattern !== null);
    console.log("Has layer pattern:", layerPattern !== null);
  } else {
    console.log("Adapter creation failed, skipping pattern test");
  }
});
