/**
 * @fileoverview JSR直接統合 TypePatternProvider implementation
 *
 * BreakdownParams JSRパッケージを直接利用してTypePatternProvider依存を完全排除。
 * 設定ファイル → BreakdownParams → 直接パターン提供の簡潔なフローを実現。
 *
 * @module config/jsr_pattern_provider
 */

import type { CustomConfig } from "../deps.ts";
import { DEFAULT_CUSTOM_CONFIG } from "../deps.ts";
import type { Result } from "../types/result.ts";
import { error as resultError, ok as resultOk } from "../types/result.ts";

/**
 * JSR統合パターンプロバイダー
 *
 * BreakdownParams JSRパッケージを直接利用し、TypePatternProvider依存を完全排除。
 * AsyncConfigPatternProviderの583行コードを100行以下に簡素化。
 */
export class JSRPatternProvider {
  private customConfig: CustomConfig;
  private _initialized = false;

  /**
   * プライベートコンストラクタ - create()ファクトリメソッドを使用
   */
  private constructor(customConfig: CustomConfig) {
    this.customConfig = customConfig;
    // Remove BreakdownParams dependency - JSRPatternProvider works directly with CustomConfig
  }

  /**
   * ファクトリメソッド - JSRPatternProviderを作成・初期化
   *
   * @param customConfig - BreakdownParams用カスタム設定
   * @returns JSRPatternProvider インスタンス
   */
  static create(customConfig?: CustomConfig): Result<JSRPatternProvider, string> {
    try {
      const config = customConfig || DEFAULT_CUSTOM_CONFIG;
      const provider = new JSRPatternProvider(config);
      provider._initialized = true;
      return resultOk(provider);
    } catch (error) {
      return resultError(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * DirectiveTypeの検証
   * CustomConfigのpatternを直接利用
   */
  validateDirectiveType(value: string): boolean {
    if (!this._initialized) return false;

    try {
      const pattern = this.customConfig?.params?.two?.directiveType?.pattern;
      if (!pattern) return false;

      const regex = new RegExp(`^(${pattern})$`);
      return regex.test(value);
    } catch {
      return false;
    }
  }

  /**
   * LayerTypeの検証
   * CustomConfigのpatternを直接利用
   */
  validateLayerType(value: string): boolean {
    if (!this._initialized) return false;

    try {
      const pattern = this.customConfig?.params?.two?.layerType?.pattern;
      if (!pattern) return false;

      const regex = new RegExp(`^(${pattern})$`);
      return regex.test(value);
    } catch {
      return false;
    }
  }

  /**
   * 利用可能なDirectiveType値を取得
   * カスタム設定から直接パターンを抽出
   */
  getValidDirectiveTypes(): readonly string[] {
    if (!this._initialized || !this.customConfig.params?.two?.directiveType?.pattern) {
      return [];
    }

    const pattern = this.customConfig.params.two.directiveType.pattern;
    return this.extractValuesFromPattern(pattern);
  }

  /**
   * 利用可能なLayerType値を取得
   * カスタム設定から直接パターンを抽出
   */
  getValidLayerTypes(): readonly string[] {
    if (!this._initialized || !this.customConfig.params?.two?.layerType?.pattern) {
      return [];
    }

    const pattern = this.customConfig.params.two.layerType.pattern;
    return this.extractValuesFromPattern(pattern);
  }

  /**
   * DirectiveTypeパターンオブジェクトを取得
   * TypePatternProvider互換性のため
   */
  getDirectivePattern(): { test(value: string): boolean; getPattern(): string } | null {
    if (!this._initialized || !this.customConfig.params?.two?.directiveType?.pattern) {
      return null;
    }

    const pattern = this.customConfig.params.two.directiveType.pattern;
    const regex = new RegExp(`^(${pattern})$`);

    return {
      test: (value: string) => regex.test(value),
      getPattern: () => pattern,
    };
  }

  /**
   * LayerTypeパターンオブジェクトを取得
   * TypePatternProvider互換性のため
   */
  getLayerTypePattern(): { test(value: string): boolean; getPattern(): string } | null {
    if (!this._initialized || !this.customConfig.params?.two?.layerType?.pattern) {
      return null;
    }

    const pattern = this.customConfig.params.two.layerType.pattern;
    const regex = new RegExp(`^(${pattern})$`);

    return {
      test: (value: string) => regex.test(value),
      getPattern: () => pattern,
    };
  }

  /**
   * 初期化状態を取得
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * パターン文字列から値を抽出
   * 正規表現パターン "^(値1|値2|値3)$" から ["値1", "値2", "値3"] を抽出
   */
  private extractValuesFromPattern(pattern: string): readonly string[] {
    const match = pattern.match(/^\^?\(([^)]+)\)\$?$/);
    if (match && match[1]) {
      return Object.freeze(
        match[1].split("|")
          .map((v) => v.trim())
          .filter((v) => v.length > 0),
      );
    }
    return Object.freeze([]);
  }

  /**
   * デバッグ情報取得
   */
  debug(): {
    initialized: boolean;
    hasDirectivePattern: boolean;
    hasLayerTypePattern: boolean;
    directivePattern: string | null;
    layerTypePattern: string | null;
  } {
    return {
      initialized: this._initialized,
      hasDirectivePattern: !!this.customConfig.params?.two?.directiveType?.pattern,
      hasLayerTypePattern: !!this.customConfig.params?.two?.layerType?.pattern,
      directivePattern: this.customConfig.params?.two?.directiveType?.pattern || null,
      layerTypePattern: this.customConfig.params?.two?.layerType?.pattern || null,
    };
  }
}

/**
 * BreakdownConfig互換のファクトリー関数
 * AsyncConfigPatternProviderの置き換え用
 */
export function createJSRPatternProvider(
  customConfig?: CustomConfig,
): JSRPatternProvider {
  const result = JSRPatternProvider.create(customConfig);

  if (result.ok) {
    return result.data;
  }

  throw new Error(`Failed to create JSR pattern provider: ${result.error}`);
}
