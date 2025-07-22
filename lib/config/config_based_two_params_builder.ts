/**
 * @fileoverview ConfigBasedTwoParamsBuilder - 設定ファイルベースTwoParams生成
 *
 * createDefault()依存を排除し、設定ファイル→CustomConfig→TwoParamsResultの
 * 統合フローを提供する。BreakdownParams統合による設定ベース初期化実装。
 *
 * @module config/config_based_two_params_builder
 */

import { ParamsCustomConfig } from "./params_custom_config.ts";
import { ConfigProfile } from "./config_profile_name.ts";
import { loadUserConfig } from "./user_config_loader.ts";

/**
 * 設定関連エラー型
 */
export interface ConfigError {
  kind: "ConfigLoadFailed" | "MissingPattern" | "BuilderCreationFailed";
  message: string;
  cause?: unknown;
}

/**
 * バリデーション関連エラー型
 */
export interface ValidationError {
  kind: "MissingPattern" | "ValidationFailed";
  message: string;
  details?: Record<string, unknown>;
}

/**
 * ビルド関連エラー型
 */
export interface BuildError {
  kind: "ValidationFailed" | "BuildFailed";
  message: string;
  cause?: unknown;
}

/**
 * Result型のシンプル実装
 */
export type Result<T, E> =
  | { ok: true; data: T; error?: never }
  | { ok: false; data?: never; error: E };

export function ok<T, E>(data: T): Result<T, E> {
  return { ok: true, data };
}

export function error<T, E>(err: E): Result<T, E> {
  return { ok: false, error: err };
}

/**
 * TwoParams_Result拡張インターフェース
 * BreakdownParamsの仕様に合わせた結果型
 */
export interface TwoParams_Result {
  type: "two";
  params: string[]; // [directiveType, layerType]
  layerType: string; // レイヤータイプ文字列
  directiveType: string; // ディレクティブタイプ文字列
  options: Record<string, unknown>;
}

/**
 * TwoParams_Result生成ファクトリー関数
 */
export function createTwoParamsResult(
  directiveType: string,
  layerType: string,
  options?: Record<string, unknown>,
): TwoParams_Result {
  return {
    type: "two",
    params: [directiveType, layerType],
    layerType,
    directiveType,
    options: options || {},
  };
}

/**
 * ConfigBasedTwoParamsBuilder
 * 設定ファイルベースでTwoParams_Resultを生成するビルダークラス
 */
export class ConfigBasedTwoParamsBuilder {
  constructor(
    private readonly customConfig: ParamsCustomConfig,
    private readonly profile: string = "default",
  ) {}

  /**
   * 設定ファイルからConfigBasedTwoParamsBuilderを構築
   * @param profileName プロファイル名（デフォルト: "default"）
   * @returns ConfigBasedTwoParamsBuilderまたはエラー
   */
  static async fromConfig(
    profileName: string = "default",
  ): Promise<Result<ConfigBasedTwoParamsBuilder, ConfigError>> {
    try {
      // 1. 設定ファイル読み込み
      const profile = ConfigProfile.create(profileName);
      const configData = await loadUserConfig(profile);

      // 2. CustomConfig作成
      const customConfig = ParamsCustomConfig.create(configData);

      return ok(new ConfigBasedTwoParamsBuilder(customConfig, profileName));
    } catch (cause) {
      return error({
        kind: "ConfigLoadFailed" as const,
        message: `Failed to load config for profile: ${profileName}`,
        cause,
      });
    }
  }

  /**
   * DirectiveTypeとLayerTypeの検証
   * @param directiveType ディレクティブタイプ
   * @param layerType レイヤータイプ
   * @returns 検証結果
   */
  validateParams(
    directiveType: string,
    layerType: string,
  ): Result<boolean, ValidationError> {
    const directivePattern = this.customConfig.directivePattern;
    const layerPattern = this.customConfig.layerPattern;

    if (!directivePattern || !layerPattern) {
      return error({
        kind: "MissingPattern" as const,
        message: "Required patterns not found in config",
      });
    }

    // パターン検証処理
    const directiveValid = new RegExp(`^(${directivePattern})$`).test(directiveType);
    const layerValid = new RegExp(`^(${layerPattern})$`).test(layerType);

    if (!directiveValid || !layerValid) {
      return error({
        kind: "ValidationFailed" as const,
        message: "Invalid directive or layer type",
        details: { directiveValid, layerValid, directiveType, layerType },
      });
    }

    return ok(true);
  }

  /**
   * 設定ベースTwoParams_Result生成
   * @param directiveType ディレクティブタイプ
   * @param layerType レイヤータイプ
   * @returns TwoParams_Resultまたはエラー
   */
  build(
    directiveType: string,
    layerType: string,
  ): Result<TwoParams_Result, BuildError> {
    // 1. パラメータ検証
    const validationResult = this.validateParams(directiveType, layerType);
    if (!validationResult.ok) {
      return error({
        kind: "ValidationFailed" as const,
        message: "Parameter validation failed",
        cause: validationResult.error,
      });
    }

    try {
      // 2. TwoParams_Result生成
      const result = createTwoParamsResult(
        directiveType,
        layerType,
        {
          profile: this.profile,
          source: "config-based",
          configData: this.customConfig.toJSON(),
        },
      );

      return ok(result);
    } catch (cause) {
      return error({
        kind: "BuildFailed" as const,
        message: "Failed to build TwoParams_Result",
        cause,
      });
    }
  }

  /**
   * 設定からDirectiveTypeパターンを取得
   * @returns DirectiveTypeパターン
   */
  getDirectivePattern(): string | undefined {
    return this.customConfig.directivePattern;
  }

  /**
   * 設定からLayerTypeパターンを取得
   * @returns LayerTypeパターン
   */
  getLayerPattern(): string | undefined {
    return this.customConfig.layerPattern;
  }

  /**
   * プロファイル名を取得
   * @returns プロファイル名
   */
  getProfile(): string {
    return this.profile;
  }
}

/**
 * createDefault()の代替として設定ベースビルダーを作成
 * @param profileName プロファイル名（デフォルト: "breakdown"）
 * @returns ConfigBasedTwoParamsBuilderまたはエラー
 */
export async function createConfigBasedBuilder(
  profileName: string = "breakdown",
): Promise<Result<ConfigBasedTwoParamsBuilder, ConfigError>> {
  return await ConfigBasedTwoParamsBuilder.fromConfig(profileName);
}
