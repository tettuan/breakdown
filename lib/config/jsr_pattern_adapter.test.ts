/**
 * @fileoverview JSRPatternAdapter テスト
 *
 * TypePatternProvider完全実装の動作確認とAsyncConfigPatternProvider代替性検証
 */

import { assert, assertEquals, assertExists } from "../deps.ts";
import { createJSRPatternAdapter, JSRPatternAdapter } from "./jsr_pattern_adapter.ts";
import { DEFAULT_CUSTOM_CONFIG } from "../deps.ts";
import type { CustomConfig } from "../deps.ts";

Deno.test("JSRPatternAdapter - 基本的な作成とTypePatternProvider実装", () => {
  // テスト用カスタム設定
  const testConfig: CustomConfig = {
    ...DEFAULT_CUSTOM_CONFIG,
    params: {
      two: {
        directiveType: {
          pattern: "to|summary|defect",
          errorMessage: "Invalid directive type",
        },
        layerType: {
          pattern: "project|issue|task",
          errorMessage: "Invalid layer type",
        },
      },
    },
  };

  // JSRPatternAdapter作成
  const result = JSRPatternAdapter.create(testConfig);
  if (!result.ok) {
    const errorMessage = "message" in result.error ? result.error.message : result.error.kind;
    assert(false, `Failed to create JSRPatternAdapter: ${errorMessage}`);
  }

  const adapter = result.data;

  // TypePatternProvider実装メソッドの確認
  assertEquals(adapter.isInitialized(), true);

  // DirectiveType検証
  assertEquals(adapter.validateDirectiveType("to"), true);
  assertEquals(adapter.validateDirectiveType("summary"), true);
  assertEquals(adapter.validateDirectiveType("invalid"), false);

  // LayerType検証
  assertEquals(adapter.validateLayerType("project"), true);
  assertEquals(adapter.validateLayerType("issue"), true);
  assertEquals(adapter.validateLayerType("invalid"), false);
});

Deno.test("JSRPatternAdapter - 有効な値取得", () => {
  const testConfig: CustomConfig = {
    ...DEFAULT_CUSTOM_CONFIG,
    params: {
      two: {
        directiveType: {
          pattern: "to|summary|defect",
          errorMessage: "Invalid directive type",
        },
        layerType: {
          pattern: "project|issue|task",
          errorMessage: "Invalid layer type",
        },
      },
    },
  };

  const result = JSRPatternAdapter.create(testConfig);
  assert(result.ok);
  const adapter = result.data;

  // 有効なDirectiveType取得
  const validDirectives = adapter.getValidDirectiveTypes();
  assertEquals(validDirectives.length, 3);
  assertEquals(validDirectives, ["to", "summary", "defect"]);

  // 有効なLayerType取得
  const validLayers = adapter.getValidLayerTypes();
  assertEquals(validLayers.length, 3);
  assertEquals(validLayers, ["project", "issue", "task"]);
});

Deno.test("JSRPatternAdapter - パターンオブジェクト取得", () => {
  const testConfig: CustomConfig = {
    ...DEFAULT_CUSTOM_CONFIG,
    params: {
      two: {
        directiveType: {
          pattern: "to|summary|defect",
          errorMessage: "Invalid directive type",
        },
        layerType: {
          pattern: "project|issue|task",
          errorMessage: "Invalid layer type",
        },
      },
    },
  };

  const result = JSRPatternAdapter.create(testConfig);
  assert(result.ok);
  const adapter = result.data;

  // DirectiveTypeパターンオブジェクト
  const directivePattern = adapter.getDirectivePattern();
  assertExists(directivePattern);
  assertEquals(directivePattern.test("to"), true);
  assertEquals(directivePattern.test("invalid"), false);
  assertEquals(directivePattern.getPattern(), "to|summary|defect");

  // LayerTypeパターンオブジェクト
  const layerPattern = adapter.getLayerTypePattern();
  assertExists(layerPattern);
  assertEquals(layerPattern.test("project"), true);
  assertEquals(layerPattern.test("invalid"), false);
  assertEquals(layerPattern.getPattern(), "project|issue|task");
});

Deno.test("JSRPatternAdapter - AsyncConfigPatternProvider互換機能", () => {
  const testConfig: CustomConfig = {
    ...DEFAULT_CUSTOM_CONFIG,
    params: {
      two: {
        directiveType: {
          pattern: "to|summary|defect",
          errorMessage: "Invalid directive type",
        },
        layerType: {
          pattern: "project|issue|task",
          errorMessage: "Invalid layer type",
        },
      },
    },
  };

  const result = JSRPatternAdapter.create(testConfig);
  assert(result.ok);
  const adapter = result.data;

  // hasValidPatterns
  assertEquals(adapter.hasValidPatterns(), true);

  // getAllPatterns
  const allPatternsResult = adapter.getAllPatterns();
  assert(allPatternsResult.ok);
  assertExists(allPatternsResult.data.directive);
  assertExists(allPatternsResult.data.layer);

  // clearCache (正常動作確認)
  adapter.clearCache();
  assertEquals(adapter.hasValidPatterns(), true); // 再初期化されるので有効のまま

  // debug情報
  const debugInfo = adapter.debug();
  assertEquals(debugInfo.initialized, true);
  assertEquals(debugInfo.hasDirectivePattern, true);
  assertEquals(debugInfo.hasLayerTypePattern, true);
  assertEquals(debugInfo.validDirectives, ["to", "summary", "defect"]);
  assertEquals(debugInfo.validLayers, ["project", "issue", "task"]);
});

Deno.test("JSRPatternAdapter - ファクトリー関数", async () => {
  const testConfig: CustomConfig = {
    ...DEFAULT_CUSTOM_CONFIG,
    params: {
      two: {
        directiveType: {
          pattern: "to|summary|defect",
          errorMessage: "Invalid directive type",
        },
        layerType: {
          pattern: "project|issue|task",
          errorMessage: "Invalid layer type",
        },
      },
    },
  };

  // createJSRPatternAdapter
  const adapter = await createJSRPatternAdapter(testConfig);
  assertEquals(adapter.isInitialized(), true);
  assertEquals(adapter.validateDirectiveType("to"), true);
  assertEquals(adapter.validateLayerType("project"), true);
});

Deno.test("JSRPatternAdapter - DEFAULT_CUSTOM_CONFIG使用", () => {
  // DEFAULT_CUSTOM_CONFIGでの作成
  const result = JSRPatternAdapter.create();
  if (!result.ok) {
    const errorMessage = "message" in result.error ? result.error.message : result.error.kind;
    assert(false, `Failed with DEFAULT_CUSTOM_CONFIG: ${errorMessage}`);
  }

  const adapter = result.data;
  assertEquals(adapter.isInitialized(), true);

  // DEFAULT_CUSTOM_CONFIGの値で動作確認
  const debugInfo = adapter.debug();
  assertEquals(debugInfo.initialized, true);
});

Deno.test("JSRPatternAdapter - エラーハンドリング", () => {
  // 無効な設定でのテスト（params無しでエラーを誘発）
  const invalidConfig = {
    ...DEFAULT_CUSTOM_CONFIG,
    params: undefined as never, // 無効な設定
  } as CustomConfig;

  const result = JSRPatternAdapter.create(invalidConfig);
  assert(!result.ok, "Should fail with invalid config");
  assertEquals(result.error.kind, "ConfigurationInvalid");
});
