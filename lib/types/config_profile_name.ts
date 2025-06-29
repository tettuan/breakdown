/**
 * @fileoverview ConfigProfileName implementation with Totality principle
 * 
 * This module implements ConfigProfileName following the Totality principle,
 * ensuring type safety through Smart Constructor pattern and validation.
 * ConfigProfileName represents the configuration profile prefix (e.g., "production", "staging")
 * used in BreakdownConfig to switch between different configuration sets.
 * 
 * @module types/config_profile_name
 */

/**
 * ConfigProfileName - 設定プロファイル名型
 * 
 * Totality原則に準拠した制約型。BreakdownConfigの設定プロファイル（prefix）を表現し、
 * CLI引数の --config/-c オプションの値として使用される。
 * 
 * 設定プロファイルは以下の用途で使用される：
 * - アプリケーション設定ファイル: ${profileName}-app.yml
 * - ユーザー設定ファイル: ${profileName}-user.yml
 * - DirectiveTypeとLayerTypeの組み合わせの切り替え
 * 
 * ## 全域性原則の適用
 * この型は以下の状態のみを許可し、null/undefined の状態を排除：
 * - 有効なプロファイル名が存在する状態
 * - プロファイル名が存在しない状態（空文字で表現）
 * 
 * 値は必ずstring型として取得でき、利用者はnull/undefinedの処理を考慮不要。
 * 
 * @example 基本的な使用例
 * ```typescript
 * // 有効な設定プロファイル名
 * const profile = ConfigProfileName.create("production");
 * console.log(profile.getValue()); // "production"
 * console.log(profile.exists()); // true
 * 
 * // 無効な設定プロファイル名（空のプロファイルとして扱われる）
 * const invalid = ConfigProfileName.create("INVALID");
 * console.log(invalid.getValue()); // ""
 * console.log(invalid.exists()); // false
 * 
 * // 設定プロファイル名が存在しない場合
 * const noProfile = ConfigProfileName.empty();
 * console.log(noProfile.getValue()); // ""
 * console.log(noProfile.exists()); // false
 * ```
 * 
 * @example BreakdownConfigとの連携
 * ```typescript
 * import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.1.4";
 * 
 * const profile = ConfigProfileName.create("staging");
 * if (profile.exists()) {
 *   const config = new BreakdownConfig(profile.getValue());
 *   await config.loadConfig();
 *   // staging-app.yml, staging-user.yml が読み込まれる
 * }
 * ```
 */
export class ConfigProfileName {
  /**
   * プロファイル名パターン
   * 
   * 設定プロファイル名として許可される文字パターン：
   * - 英小文字（a-z）
   * - 数字（0-9）
   * - ハイフン（-）
   * - アンダースコア（_）
   * - 1文字以上50文字以内
   */
  private static readonly PROFILE_NAME_PATTERN = /^[a-z0-9_-]{1,50}$/;

  /**
   * @param value - 設定プロファイル名（常にstring、存在しない場合は空文字）
   */
  private constructor(private readonly value: string) {}

  /**
   * 設定プロファイル名を作成する
   * 
   * 無効な値が渡された場合、空のプロファイル名として扱い、nullは返さない。
   * 
   * @param value - 設定プロファイル名の候補
   * @returns ConfigProfileName インスタンス（常に有効なインスタンス）
   * 
   * @example
   * ```typescript
   * const valid = ConfigProfileName.create("production");
   * console.log(valid.getValue()); // "production"
   * console.log(valid.exists()); // true
   * 
   * const invalid = ConfigProfileName.create("INVALID");
   * console.log(invalid.getValue()); // ""
   * console.log(invalid.exists()); // false
   * ```
   */
  static create(value: string): ConfigProfileName {
    // null/undefined/非文字列の処理
    if (!value || typeof value !== 'string') {
      return new ConfigProfileName("");
    }

    // プロファイル名のバリデーション
    if (!this.PROFILE_NAME_PATTERN.test(value)) {
      return new ConfigProfileName("");
    }

    return new ConfigProfileName(value);
  }

  /**
   * 空の設定プロファイル名を作成する
   * 
   * @returns 空の ConfigProfileName インスタンス
   * 
   * @example
   * ```typescript
   * const noProfile = ConfigProfileName.empty();
   * console.log(noProfile.exists()); // false
   * console.log(noProfile.getValue()); // ""
   * ```
   */
  static empty(): ConfigProfileName {
    return new ConfigProfileName("");
  }

  /**
   * 設定プロファイル名の値を取得する
   * 
   * @returns 設定プロファイル名（存在しない場合は空文字、常にstring型）
   */
  getValue(): string {
    return this.value;
  }

  /**
   * 設定プロファイル名が存在するかどうかを確認する
   * 
   * @returns 設定プロファイル名が存在する場合は true、そうでなければ false
   */
  exists(): boolean {
    return this.value !== "";
  }
}
