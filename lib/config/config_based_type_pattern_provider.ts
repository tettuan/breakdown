/**
 * @fileoverview ConfigBasedTypePatternProvider - 設定ベースのTypePatternProvider実装
 *
 * BreakdownConfigの設定ファイルから動的にDirectiveType/LayerTypeのパターンを
 * 提供するプロバイダークラス。ハードコード依存を完全に排除。
 *
 * @module config/config_based_type_pattern_provider
 */

import type { TypePatternProvider } from "./pattern_provider.ts";
import { ParamsCustomConfig } from "./params_custom_config.ts";
import { ConfigProfile } from "./config_profile_name.ts";
import { loadUserConfig } from "./user_config_loader.ts";

/**
 * 設定ベースのTypePatternProvider実装
 * 設定ファイルからDirectiveType/LayerTypeのパターンを動的に提供
 */
export class ConfigBasedTypePatternProvider implements TypePatternProvider {
  private directiveTypes: readonly string[] = [];
  private layerTypes: readonly string[] = [];

  constructor(
    private readonly customConfig: ParamsCustomConfig,
    private readonly profileName: string = "default",
  ) {
    this.initializeTypes();
  }

  /**
   * 設定ファイルからプロバイダーを作成
   * @param profileName プロファイル名
   * @returns ConfigBasedTypePatternProvider インスタンス
   */
  static async create(profileName: string = "default"): Promise<ConfigBasedTypePatternProvider> {
    const profile = ConfigProfile.create(profileName);
    const configData = await loadUserConfig(profile);
    const customConfig = ParamsCustomConfig.create(configData);

    return new ConfigBasedTypePatternProvider(customConfig, profileName);
  }

  /**
   * カスタム設定から直接作成（テスト用）
   * @param customConfig カスタム設定
   * @param profileName プロファイル名
   * @returns ConfigBasedTypePatternProvider インスタンス
   */
  static fromConfig(
    customConfig: ParamsCustomConfig,
    profileName: string = "default",
  ): ConfigBasedTypePatternProvider {
    return new ConfigBasedTypePatternProvider(customConfig, profileName);
  }

  /**
   * タイプの初期化
   */
  private initializeTypes(): void {
    // DirectiveTypeパターンから配列を生成
    const directivePattern = this.customConfig.directivePattern;
    if (directivePattern) {
      this.directiveTypes = Object.freeze(directivePattern.split("|"));
    }

    // LayerTypeパターンから配列を生成
    const layerPattern = this.customConfig.layerPattern;
    if (layerPattern) {
      this.layerTypes = Object.freeze(layerPattern.split("|"));
    }
  }

  /**
   * DirectiveTypeのパターンオブジェクトを取得
   * @returns DirectiveTypeパターンオブジェクト
   */
  getDirectivePattern(): { test(value: string): boolean; getPattern(): string } | null {
    const pattern = this.customConfig.directivePattern;
    if (!pattern) return null;

    const regex = new RegExp(`^(${pattern})$`);
    return {
      test: (value: string) => regex.test(value),
      getPattern: () => pattern,
    };
  }

  /**
   * LayerTypeのパターンオブジェクトを取得
   * @returns LayerTypeパターンオブジェクト
   */
  getLayerTypePattern(): { test(value: string): boolean; getPattern(): string } | null {
    const pattern = this.customConfig.layerPattern;
    if (!pattern) return null;

    const regex = new RegExp(`^(${pattern})$`);
    return {
      test: (value: string) => regex.test(value),
      getPattern: () => pattern,
    };
  }

  /**
   * 有効なDirectiveTypesを取得
   * @returns DirectiveTypeの配列
   */
  getValidDirectiveTypes(): readonly string[] {
    return this.directiveTypes;
  }

  /**
   * 有効なLayerTypesを取得
   * @returns LayerTypeの配列
   */
  getValidLayerTypes(): readonly string[] {
    return this.layerTypes;
  }

  /**
   * DirectiveTypeを検証
   * @param value 検証対象の値
   * @returns 有効な場合true
   */
  validateDirectiveType(value: string): boolean {
    const pattern = this.getDirectivePattern();
    return pattern ? pattern.test(value) : false;
  }

  /**
   * LayerTypeを検証
   * @param value 検証対象の値
   * @returns 有効な場合true
   */
  validateLayerType(value: string): boolean {
    const pattern = this.getLayerTypePattern();
    return pattern ? pattern.test(value) : false;
  }

  /**
   * DirectiveTypeが有効かチェック（後方互換性のため）
   * @param value チェック対象の値
   * @returns 有効な場合true
   * @deprecated validateDirectiveType を使用してください
   */
  isValidDirectiveType(value: string): boolean {
    return this.validateDirectiveType(value);
  }

  /**
   * LayerTypeが有効かチェック（後方互換性のため）
   * @param value チェック対象の値
   * @returns 有効な場合true
   * @deprecated validateLayerType を使用してください
   */
  isValidLayerType(value: string): boolean {
    return this.validateLayerType(value);
  }

  /**
   * プロファイル名を取得
   * @returns プロファイル名
   */
  getProfileName(): string {
    return this.profileName;
  }

  /**
   * 設定のサマリーを取得（デバッグ用）
   * @returns 設定サマリー
   */
  getSummary(): Record<string, unknown> {
    const directivePattern = this.getDirectivePattern();
    const layerPattern = this.getLayerTypePattern();

    return {
      profile: this.profileName,
      directivePattern: directivePattern?.getPattern() || "",
      layerPattern: layerPattern?.getPattern() || "",
      directiveTypes: this.directiveTypes,
      layerTypes: this.layerTypes,
    };
  }
}
