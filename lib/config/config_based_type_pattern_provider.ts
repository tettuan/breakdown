/**
 * @fileoverview ConfigBasedTypePatternProvider - 設定ベースのTypePatternProvider実装
 *
 * BreakdownConfigの設定ファイルから動的にDirectiveType/LayerTypeのパターンを
 * 提供するプロバイダークラス。ハードコード依存を完全に排除。
 *
 * @module config/config_based_type_pattern_provider
 */

import { TypePatternProvider } from "../types/type_factory.ts";
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
   * DirectiveTypeのパターンを取得
   * @returns DirectiveTypeパターン（正規表現文字列）
   */
  getDirectivePattern(): string {
    return this.customConfig.directivePattern || "";
  }

  /**
   * LayerTypeのパターンを取得
   * @returns LayerTypeパターン（正規表現文字列）
   */
  getLayerPattern(): string {
    return this.customConfig.layerPattern || "";
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
   * DirectiveTypeが有効かチェック
   * @param value チェック対象の値
   * @returns 有効な場合true
   */
  isValidDirectiveType(value: string): boolean {
    const pattern = this.getDirectivePattern();
    if (!pattern) return false;
    return new RegExp(`^(${pattern})$`).test(value);
  }

  /**
   * LayerTypeが有効かチェック
   * @param value チェック対象の値
   * @returns 有効な場合true
   */
  isValidLayerType(value: string): boolean {
    const pattern = this.getLayerPattern();
    if (!pattern) return false;
    return new RegExp(`^(${pattern})$`).test(value);
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
    return {
      profile: this.profileName,
      directivePattern: this.getDirectivePattern(),
      layerPattern: this.getLayerPattern(),
      directiveTypes: this.directiveTypes,
      layerTypes: this.layerTypes,
    };
  }
}
