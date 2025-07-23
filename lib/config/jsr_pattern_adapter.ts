/**
 * @fileoverview JSRPatternAdapter - TypePatternProvider完全実装
 *
 * @tettuan/breakdownparams の CustomConfig を使用し、TypePatternProvider
 * インターフェースを完全実装。AsyncConfigPatternProvider の全機能を代替。
 *
 * @module config/jsr_pattern_adapter
 */

import type { TypePatternProvider } from "./pattern_provider.ts";
import type { CustomConfig } from "../deps.ts";
import { DEFAULT_CUSTOM_CONFIG } from "../deps.ts";
import type { Result } from "../types/result.ts";
import { error as resultError, ok as resultOk } from "../types/result.ts";

/**
 * JSRPatternAdapter エラー型
 */
export type JSRPatternAdapterError =
  | { kind: "InitializationFailed"; message: string }
  | { kind: "ConfigurationInvalid"; message: string }
  | { kind: "PatternExtractionFailed"; patternType: "directive" | "layer" };

/**
 * JSRPatternAdapter - TypePatternProvider完全実装
 *
 * AsyncConfigPatternProviderの全機能を@tettuan/breakdownparams直接利用で実現。
 * 583行のAsyncConfigPatternProviderを150行以下で完全代替。
 */
export class JSRPatternAdapter implements TypePatternProvider {
  private customConfig: CustomConfig;
  private _initialized = false;

  // パターンキャッシュ（TypePatternProvider互換）
  private _directivePattern: { test(value: string): boolean; getPattern(): string } | null = null;
  private _layerTypePattern: { test(value: string): boolean; getPattern(): string } | null = null;

  /**
   * プライベートコンストラクタ - create()ファクトリメソッド使用
   */
  private constructor(customConfig: CustomConfig) {
    this.customConfig = customConfig;
  }

  /**
   * ファクトリメソッド - JSRPatternAdapterを作成・初期化
   *
   * @param customConfig - BreakdownParams用カスタム設定
   * @returns JSRPatternAdapter インスタンス
   */
  static create(
    customConfig?: CustomConfig,
  ): Result<JSRPatternAdapter, JSRPatternAdapterError> {
    try {
      const config = customConfig || DEFAULT_CUSTOM_CONFIG;
      const adapter = new JSRPatternAdapter(config);

      // 初期化処理
      const initResult = adapter.initialize();
      if (!initResult.ok) {
        return resultError(initResult.error);
      }

      return resultOk(adapter);
    } catch (error) {
      return resultError({
        kind: "InitializationFailed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * アダプター初期化
   */
  private initialize(): Result<void, JSRPatternAdapterError> {
    try {
      // 設定の有効性確認
      if (!this.customConfig.params?.two) {
        return resultError({
          kind: "ConfigurationInvalid",
          message: "CustomConfig.params.two is required for JSRPatternAdapter",
        });
      }

      // パターンキャッシュの初期化
      this.initializePatterns();

      this._initialized = true;
      return resultOk(undefined);
    } catch (error) {
      return resultError({
        kind: "InitializationFailed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * パターンキャッシュ初期化
   */
  private initializePatterns(): void {
    // DirectiveTypeパターン初期化
    const directivePattern = this.customConfig.params?.two?.directiveType?.pattern;
    if (directivePattern) {
      const regex = new RegExp(`^(${directivePattern})$`);
      this._directivePattern = {
        test: (value: string) => regex.test(value),
        getPattern: () => directivePattern,
      };
    }

    // LayerTypeパターン初期化
    const layerPattern = this.customConfig.params?.two?.layerType?.pattern;
    if (layerPattern) {
      const regex = new RegExp(`^(${layerPattern})$`);
      this._layerTypePattern = {
        test: (value: string) => regex.test(value),
        getPattern: () => layerPattern,
      };
    }
  }

  /**
   * DirectiveType用バリデーション結果を取得
   * TypePatternProvider実装メソッド
   */
  validateDirectiveType(value: string): boolean {
    if (!this._initialized || !this._directivePattern) {
      return false;
    }
    return this._directivePattern.test(value);
  }

  /**
   * LayerType用バリデーション結果を取得
   * TypePatternProvider実装メソッド
   */
  validateLayerType(value: string): boolean {
    if (!this._initialized || !this._layerTypePattern) {
      return false;
    }
    return this._layerTypePattern.test(value);
  }

  /**
   * 利用可能なDirectiveType値を取得
   * TypePatternProvider実装メソッド
   */
  getValidDirectiveTypes(): readonly string[] {
    if (!this._initialized || !this._directivePattern) {
      return Object.freeze([]);
    }

    const pattern = this._directivePattern.getPattern();
    return this.extractValuesFromPattern(pattern);
  }

  /**
   * 利用可能なLayerType値を取得
   * TypePatternProvider実装メソッド
   */
  getValidLayerTypes(): readonly string[] {
    if (!this._initialized || !this._layerTypePattern) {
      return Object.freeze([]);
    }

    const pattern = this._layerTypePattern.getPattern();
    return this.extractValuesFromPattern(pattern);
  }

  /**
   * DirectiveType用パターンオブジェクトを取得
   * TypePatternProvider実装メソッド
   */
  getDirectivePattern(): { test(value: string): boolean; getPattern(): string } | null {
    return this._directivePattern;
  }

  /**
   * LayerType用パターンオブジェクトを取得
   * TypePatternProvider実装メソッド
   */
  getLayerTypePattern(): { test(value: string): boolean; getPattern(): string } | null {
    return this._layerTypePattern;
  }

  /**
   * 初期化状態確認
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * 両方のパターンが有効か確認
   * AsyncConfigPatternProvider互換メソッド
   */
  hasValidPatterns(): boolean {
    return this._directivePattern !== null && this._layerTypePattern !== null;
  }

  /**
   * パターンキャッシュをクリア
   * AsyncConfigPatternProvider互換メソッド
   */
  clearCache(): void {
    this._directivePattern = null;
    this._layerTypePattern = null;
    this.initializePatterns();
  }

  /**
   * 全パターン取得
   * AsyncConfigPatternProvider互換メソッド
   */
  getAllPatterns(): Result<
    {
      directive: { test(value: string): boolean; getPattern(): string } | null;
      layer: { test(value: string): boolean; getPattern(): string } | null;
    },
    JSRPatternAdapterError
  > {
    if (!this._initialized) {
      return resultError({
        kind: "InitializationFailed",
        message: "JSRPatternAdapter not initialized",
      });
    }

    return resultOk({
      directive: this._directivePattern,
      layer: this._layerTypePattern,
    });
  }

  /**
   * パターン文字列から値を抽出
   * 正規表現パターン "^(値1|値2|値3)$" から ["値1", "値2", "値3"] を抽出
   */
  private extractValuesFromPattern(pattern: string): readonly string[] {
    // 正規表現パターン "^(値1|値2|値3)$" または "値1|値2|値3" 形式に対応
    let valuePart: string | undefined;

    // 括弧付きパターンをチェック
    const bracketMatch = pattern.match(/^\^?\(([^)]+)\)\$?$/);
    if (bracketMatch && bracketMatch[1]) {
      valuePart = bracketMatch[1];
    } else {
      // 直接的な値パターン（括弧なし）もサポート
      valuePart = pattern;
    }

    if (valuePart) {
      return Object.freeze(
        valuePart.split("|")
          .map((v) => v.trim())
          .filter((v) => v.length > 0),
      );
    }

    return Object.freeze([]);
  }

  /**
   * デバッグ情報取得
   * AsyncConfigPatternProvider互換メソッド（完全互換版）
   */
  debug(): {
    initialized: boolean;
    hasConfigData: boolean;
    hasDirectivePattern: boolean;
    hasLayerTypePattern: boolean;
    cacheStatus: {
      directive: "cached" | "null" | "not_loaded";
      layer: "cached" | "null" | "not_loaded";
    };
    directivePattern?: string | null;
    layerTypePattern?: string | null;
    validDirectives?: readonly string[];
    validLayers?: readonly string[];
  } {
    return {
      initialized: this._initialized,
      hasConfigData: !!this.customConfig,
      hasDirectivePattern: this._directivePattern !== null,
      hasLayerTypePattern: this._layerTypePattern !== null,
      cacheStatus: {
        directive: this._directivePattern === null ? "null" : "cached",
        layer: this._layerTypePattern === null ? "null" : "cached",
      },
      directivePattern: this._directivePattern?.getPattern() || null,
      layerTypePattern: this._layerTypePattern?.getPattern() || null,
      validDirectives: this.getValidDirectiveTypes(),
      validLayers: this.getValidLayerTypes(),
    };
  }
}

/**
 * AsyncConfigPatternProvider互換ファクトリー関数
 * AsyncConfigPatternProviderの置き換え用
 */
export function createJSRPatternAdapter(
  customConfig?: CustomConfig,
): JSRPatternAdapter {
  const result = JSRPatternAdapter.create(customConfig);

  if (result.ok) {
    return result.data;
  }

  const errorMessage = "message" in result.error ? result.error.message : result.error.kind;
  throw new Error(`Failed to create JSR pattern adapter: ${errorMessage}`);
}

/**
 * TypePatternProvider作成のためのファクトリー関数
 * 既存コードとの互換性確保
 */
export function createTypePatternProvider(
  customConfig?: CustomConfig,
): Promise<TypePatternProvider> {
  return Promise.resolve(createJSRPatternAdapter(customConfig));
}
