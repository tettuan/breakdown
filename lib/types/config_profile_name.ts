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
 * この型は以下の状態のみを許可し、曖昧な状態を排除：
 * - 有効なプロファイル名を含むConfigProfileNameインスタンス（value が string）
 * - 無効・空・存在しない場合のConfigProfileNameインスタンス（value が null）
 * 
 * インスタンスは常に存在し、有効性は value プロパティのnullチェックで判定します。
 * 
 * @example 基本的な使用例
 * ```typescript
 * // 有効な設定プロファイル名
 * const profile = ConfigProfileName.create("production");
 * if (profile.value) {
 *   console.log(profile.value); // "production"
 * }
 * 
 * // 無効な設定プロファイル名
 * const invalid = ConfigProfileName.create("INVALID");
 * console.log(invalid.value); // null
 * 
 * // 空文字の場合
 * const empty = ConfigProfileName.create("");
 * console.log(empty.value); // null
 * ```
 * 
 * @example BreakdownConfigとの連携
 * ```typescript
 * import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.1.4";
 * 
 * const profile = ConfigProfileName.create("staging");
 * if (profile.value) {
 *   const configResult = await BreakdownConfig.create(profile.value);
 *   if (configResult.success && configResult.data) {
 *     // staging-app.yml, staging-user.yml が読み込まれる
 *   }
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
   * プライベートコンストラクタ
   * 
   * 直接インスタンス化を禁止し、createメソッドのみでインスタンス作成を可能にします。
   * インスタンスが存在する時点で、値が有効であることを保証します。
   * 
   * @param value - 設定プロファイル名（有効な値またはnull）
   */
  private constructor(public readonly value: string | null) {}

  /**
   * 設定プロファイル名を作成する
   * 
   * 無効な値が渡された場合、nullの値を持つConfigProfileNameインスタンスを返す。
   * 常にConfigProfileNameインスタンスを返し、nullは返さない。
   * 
   * @param value - 設定プロファイル名の候補（string または null を受け取り可能）
   * @returns 常にConfigProfileNameインスタンス（無効な場合はnullの値を持つ）
   * 
   * @example
   * ```typescript
   * const valid = ConfigProfileName.create("production");
   * console.log(valid.value); // "production"
   * 
   * const invalid = ConfigProfileName.create("INVALID");
   * console.log(invalid.value); // null
   * 
   * const empty = ConfigProfileName.create("");
   * console.log(empty.value); // null
   * 
   * const nullInput = ConfigProfileName.create(null);
   * console.log(nullInput.value); // null
   * ```
   */
  static create(value: string | null): ConfigProfileName {
    // null/undefined/非文字列の処理
    if (!value || typeof value !== 'string') {
      return new ConfigProfileName(null);
    }

    // 空文字の場合はnullの値を持つインスタンスを返す
    if (value === "") {
      return new ConfigProfileName(null);
    }

    // プロファイル名のバリデーション
    if (!this.PROFILE_NAME_PATTERN.test(value)) {
      return new ConfigProfileName(null);
    }

    return new ConfigProfileName(value);
  }
}
