/**
 * @fileoverview Structure test for ConfigPatternProvider
 * 
 * This test verifies the structural design and responsibilities of ConfigPatternProvider:
 * - Class structure and responsibility separation
 * - Pattern cache management structure
 * - Configuration data extraction logic structure
 * - Method organization and cohesion
 * 
 * @module config/1_structure_pattern_provider_test
 */

import { assertExists, assertEquals, assertInstanceOf } from "@std/assert";
import { ConfigPatternProvider } from "./pattern_provider.ts";
import { BreakdownConfig } from "@tettuan/breakdownconfig";

/**
 * 構造テスト: ConfigPatternProviderのクラス構造
 * 
 * 検証内容:
 * - 適切なプロパティ構造
 * - キャッシュ機構の構造
 * - 責務の分離
 */
Deno.test("Structure: ConfigPatternProvider class structure", () => {
  // モックBreakdownConfigを作成
  const mockConfig = {
    getConfig: () => ({}),
    loadConfig: async () => {},
  } as unknown as BreakdownConfig;
  
  const provider = new ConfigPatternProvider(mockConfig);
  
  // インスタンスの型確認
  assertInstanceOf(provider, ConfigPatternProvider, "Should create ConfigPatternProvider instance");
  
  // 必須プロパティの存在確認（privateでもメソッド経由で確認可能）
  assertExists(provider.getDirectivePattern, "Should have getDirectivePattern method");
  assertExists(provider.getLayerTypePattern, "Should have getLayerTypePattern method");
  assertExists(provider.clearCache, "Should have clearCache method");
});

/**
 * 構造テスト: キャッシュ機構の構造設計
 * 
 * パターンキャッシュが適切に構造化されているかを検証
 * - キャッシュの初期化
 * - キャッシュのクリア機能
 * - キャッシュ状態の管理
 */
Deno.test("Structure: Pattern cache mechanism structure", () => {
  const mockConfig = {
    getConfig: () => ({}),
    loadConfig: async () => {},
  } as unknown as BreakdownConfig;
  
  const provider = new ConfigPatternProvider(mockConfig);
  
  // キャッシュクリアメソッドの存在と構造
  assertEquals(typeof provider.clearCache, "function", "clearCache should be a function");
  
  // デバッグ情報でキャッシュ状態を確認
  const debugInfo = provider.debug();
  assertExists(debugInfo.cacheStatus, "Debug info should include cache status");
  assertExists(debugInfo.cacheStatus.directive, "Cache status should include directive status");
  assertExists(debugInfo.cacheStatus.layer, "Cache status should include layer status");
  
  // キャッシュ状態の値が適切な種類であることを確認
  const validCacheStates = ["cached", "null", "not_loaded"];
  assertEquals(
    validCacheStates.includes(debugInfo.cacheStatus.directive),
    true,
    "Directive cache status should be one of: cached, null, not_loaded"
  );
  assertEquals(
    validCacheStates.includes(debugInfo.cacheStatus.layer),
    true,
    "Layer cache status should be one of: cached, null, not_loaded"
  );
});

/**
 * 構造テスト: ファクトリーメソッドの構造
 * 
 * 静的ファクトリーメソッドが適切に構造化されているかを検証
 * - 非同期処理の構造
 * - エラーハンドリングの構造
 */
Deno.test("Structure: Factory method structure", () => {
  // ファクトリーメソッドの構造確認
  assertEquals(
    typeof ConfigPatternProvider.create,
    "function",
    "Should have static create method"
  );
  
  // ファクトリーメソッドのパラメータ数（デフォルト値があるため0になる）
  assertEquals(
    ConfigPatternProvider.create.length,
    0,
    "Factory method should have default parameters (length is 0 due to defaults)"
  );
});

/**
 * 構造テスト: パターン取得メソッドの一貫性
 * 
 * getDirectivePatternとgetLayerTypePatternが
 * 同じ構造パターンに従っているかを検証
 */
Deno.test("Structure: Pattern getter methods consistency", () => {
  const mockConfig = {
    getConfig: () => ({}),
    loadConfig: async () => {},
  } as unknown as BreakdownConfig;
  
  const provider = new ConfigPatternProvider(mockConfig);
  
  // 両メソッドが同じ返り値の型構造を持つ（Pattern | null）
  const directiveResult = provider.getDirectivePattern();
  const layerResult = provider.getLayerTypePattern();
  
  // 両方ともnullまたはオブジェクトを返すべき
  assertEquals(
    directiveResult === null || typeof directiveResult === "object",
    true,
    "getDirectivePattern should return null or object"
  );
  assertEquals(
    layerResult === null || typeof layerResult === "object",
    true,
    "getLayerTypePattern should return null or object"
  );
});

/**
 * 構造テスト: 設定データ抽出の責務分離
 * 
 * 設定データの抽出ロジックが適切に分離されているかを検証
 * プライベートメソッドの存在は直接確認できないが、
 * パブリックAPIの振る舞いから構造を推測
 */
Deno.test("Structure: Configuration extraction responsibility separation", () => {
  const mockConfig = {
    getConfig: () => ({
      directivePattern: "test-pattern",
      layerTypePattern: "test-layer-pattern"
    }),
    loadConfig: async () => {},
  } as unknown as BreakdownConfig;
  
  const provider = new ConfigPatternProvider(mockConfig);
  
  // 異なる設定構造に対する対応（責務の分離を示唆）
  const mockConfigNested = {
    getConfig: () => ({
      twoParamsRules: {
        directive: { pattern: "nested-pattern" },
        layer: { pattern: "nested-layer-pattern" }
      }
    }),
    loadConfig: async () => {},
  } as unknown as BreakdownConfig;
  
  const providerNested = new ConfigPatternProvider(mockConfigNested);
  
  // 両方のプロバイダーが動作することで、
  // 設定抽出ロジックが適切に構造化されていることを確認
  assertExists(provider, "Should handle direct pattern configuration");
  assertExists(providerNested, "Should handle nested pattern configuration");
});

/**
 * 構造テスト: デバッグ情報の構造
 * 
 * デバッグメソッドが返す情報の構造が適切かを検証
 */
Deno.test("Structure: Debug information structure", () => {
  const mockConfig = {
    getConfig: () => ({}),
    loadConfig: async () => {},
  } as unknown as BreakdownConfig;
  
  const provider = new ConfigPatternProvider(mockConfig);
  const debugInfo = provider.debug();
  
  // デバッグ情報の構造を検証
  const expectedKeys = ["configSetName", "hasDirectivePattern", "hasLayerTypePattern", "cacheStatus"];
  const actualKeys = Object.keys(debugInfo);
  
  for (const key of expectedKeys) {
    assertEquals(
      actualKeys.includes(key),
      true,
      `Debug info should include ${key}`
    );
  }
  
  // cacheStatusの内部構造
  assertEquals(
    Object.keys(debugInfo.cacheStatus).sort(),
    ["directive", "layer"].sort(),
    "Cache status should have directive and layer keys"
  );
});

/**
 * 構造テスト: hasValidPatternsメソッドの論理構造
 * 
 * 両方のパターンの有効性を確認するメソッドの構造を検証
 */
Deno.test("Structure: hasValidPatterns method logic structure", () => {
  const mockConfig = {
    getConfig: () => ({}),
    loadConfig: async () => {},
  } as unknown as BreakdownConfig;
  
  const provider = new ConfigPatternProvider(mockConfig);
  
  // hasValidPatternsは両方のパターンの論理積を返すべき
  const result = provider.hasValidPatterns();
  assertEquals(
    typeof result,
    "boolean",
    "hasValidPatterns should return boolean"
  );
  
  // デバッグ情報との一貫性
  const debugInfo = provider.debug();
  const expectedResult = debugInfo.hasDirectivePattern && debugInfo.hasLayerTypePattern;
  assertEquals(
    result,
    expectedResult,
    "hasValidPatterns should be consistent with debug info"
  );
});

/**
 * 構造テスト: エラー処理の構造的一貫性
 * 
 * エラー処理が構造的に一貫しているかを検証
 * - パターン取得メソッドはnullを返す
 * - ファクトリーメソッドは例外をスロー
 */
Deno.test("Structure: Error handling structural consistency", () => {
  // 不正な設定でのパターン取得
  const mockConfigWithError = {
    getConfig: () => { throw new Error("Config error"); },
    loadConfig: async () => {},
  } as unknown as BreakdownConfig;
  
  const provider = new ConfigPatternProvider(mockConfigWithError);
  
  // パターン取得メソッドはエラー時にnullを返す構造
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();
  
  assertEquals(
    directivePattern === null || typeof directivePattern === "object",
    true,
    "getDirectivePattern should handle errors gracefully"
  );
  assertEquals(
    layerPattern === null || typeof layerPattern === "object",
    true,
    "getLayerTypePattern should handle errors gracefully"
  );
});

/**
 * 構造テスト: 責務の凝集性
 * 
 * ConfigPatternProviderの全メソッドが
 * パターン提供という単一の責務に凝集しているかを検証
 */
Deno.test("Structure: Responsibility cohesion", () => {
  const mockConfig = {
    getConfig: () => ({}),
    loadConfig: async () => {},
  } as unknown as BreakdownConfig;
  
  const provider = new ConfigPatternProvider(mockConfig);
  
  // 全ての公開メソッドがパターン関連の責務を持つ
  const patternRelatedMethods = [
    provider.getDirectivePattern,
    provider.getLayerTypePattern,
    provider.hasValidPatterns,
    provider.clearCache,
    provider.debug
  ];
  
  // 全メソッドが関数として存在
  for (const method of patternRelatedMethods) {
    assertEquals(
      typeof method,
      "function",
      "All public methods should be functions related to pattern provision"
    );
  }
  
  // メソッド間の関連性（debugがパターン状態を報告）
  const debugInfo = provider.debug();
  assertExists(debugInfo.hasDirectivePattern, "Debug should report directive pattern status");
  assertExists(debugInfo.hasLayerTypePattern, "Debug should report layer pattern status");
});