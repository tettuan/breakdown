/**
 * @fileoverview ConfigProfileName implementation with Result-based Totality principle
 *
 * This module implements ConfigProfileName following the improved Totality principle,
 * ensuring type safety through Smart Constructor pattern with Result type.
 * ConfigProfileName represents the configuration profile prefix (e.g., "production", "staging")
 * used in BreakdownConfig to switch between different configuration sets.
 *
 * @module types/config_profile_name
 */

import type { Result } from "./result.ts";
import { error, ok } from "./result.ts";

/**
 * ConfigProfileName validation errors
 */
export type ConfigProfileNameError =
  | { kind: "EmptyInput"; message: string }
  | { kind: "InvalidFormat"; value: string; pattern: string; message: string }
  | { kind: "TooLong"; value: string; maxLength: number; message: string };

/**
 * ConfigProfileName - 設定プロファイル名型
 *
 * Totality原則に準拠した制約型で、Result型を使用して型安全性を確保。
 * BreakdownConfigの設定プロファイル（prefix）を表現し、
 * CLI引数の --config/-c オプションの値として使用される。
 *
 * 設定プロファイルは以下の用途で使用される：
 * - アプリケーション設定ファイル: ${profileName}-app.yml
 * - ユーザー設定ファイル: ${profileName}-user.yml
 * - DirectiveTypeとLayerTypeの組み合わせの切り替え
 *
 * ## 改善されたTotality原則の適用
 * - Value Object内部にnullを持たない
 * - Result型で成功/失敗を明確に分離
 * - エラー情報を詳細に提供
 * - 型安全性を向上
 *
 * @example 基本的な使用例
 * ```typescript
 * // 有効な設定プロファイル名
 * const profileResult = ConfigProfileName.create("production");
 * if (profileResult.ok) {
 *   console.log(profileResult.data.value); // "production"
 * } else {
 *   console.error(profileResult.error.message);
 * }
 *
 * // 無効な設定プロファイル名
 * const invalidResult = ConfigProfileName.create("INVALID");
 * if (!invalidResult.ok) {
 *   switch (invalidResult.error.kind) {
 *     case "InvalidFormat":
 *       console.error(`Invalid format: ${invalidResult.error.data}`);
 *       break;
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
  static #PROFILE_NAME_PATTERN = /^[a-z0-9_-]{1,50}$/;

  /**
   * プライベートコンストラクタ
   *
   * 直接インスタンス化を禁止し、createメソッドのみでインスタンス作成を可能にします。
   * 有効な値のみを受け取り、nullは受け取りません。
   *
   * @param value - 検証済みの設定プロファイル名
   */
  private constructor(private readonly _value: string) {
    // 完全な不変性を保証するために Object.freeze を適用
    Object.freeze(this);
  }

  /**
   * 設定プロファイル名の値を取得
   * 読み取り専用のゲッターで、常に有効な値を返す（nullチェック不要）
   */
  get value(): string {
    return this._value;
  }

  /**
   * Smart Constructor完全実装 - getValue()メソッド
   *
   * Totality原則に基づく型安全な値アクセスメソッド。
   * Smart Constructorパターンの完全実装として、
   * オブジェクトの不変条件を保証しつつ値を返します。
   *
   * このメソッドは以下を保証します：
   * - 常に非null値を返す
   * - バリデーション済みの値のみを返す
   * - 不変条件の維持
   * - 型安全性の確保
   *
   * @returns 検証済みの設定プロファイル名（常に有効な値）
   *
   * @example
   * ```typescript
   * const profileResult = ConfigProfileName.create("production");
   * if (profileResult.ok) {
   *   const value = profileResult.data.getValue(); // "production"
   *   // 常に有効な値が返される（nullチェック不要）
   * }
   * ```
   */
  getValue(): string {
    // Smart Constructorパターンにより、この時点で_valueは
    // 必ず有効な値であることが保証されている
    return this._value;
  }

  /**
   * 設定プロファイル名を作成する（改善版）
   *
   * Result型を使用して成功/失敗を明確に分離。
   * 全域関数として設計され、例外を投げず、全ての入力に対して定義されている。
   *
   * @param value - 設定プロファイル名の候補（string または null を受け取り可能）
   * @returns Result型 - 成功時はConfigProfileName、失敗時は詳細なエラー情報
   *
   * @example
   * ```typescript
   * const validResult = ConfigProfileName.create("production");
   * if (validResult.ok) {
   *   console.log(validResult.data.value); // "production"
   * }
   *
   * const invalidResult = ConfigProfileName.create("INVALID");
   * if (!invalidResult.ok) {
   *   console.error(invalidResult.error.message);
   * }
   * ```
   */
  static create(
    value: string | null | undefined,
  ): Result<ConfigProfileName, ConfigProfileNameError> {
    // Case 1: null/undefined/空文字の処理
    if (!value || typeof value !== "string" || value.trim() === "") {
      return error({
        kind: "EmptyInput",
        message: "ConfigProfileName cannot be empty, null, or undefined",
      });
    }

    // Case 2: 長さ制限チェック
    if (value.length > 50) {
      return error({
        kind: "TooLong",
        value,
        maxLength: 50,
        message: `ConfigProfileName "${value}" exceeds maximum length of 50 characters`,
      });
    }

    // Case 3: フォーマット検証
    if (!ConfigProfileName.#PROFILE_NAME_PATTERN.test(value)) {
      return error({
        kind: "InvalidFormat",
        value,
        pattern: ConfigProfileName.#PROFILE_NAME_PATTERN.source,
        message:
          `ConfigProfileName "${value}" contains invalid characters. Only lowercase letters, numbers, hyphens, and underscores are allowed.`,
      });
    }

    // Case 4: 成功時
    return ok(new ConfigProfileName(value));
  }

  /**
   * 等価性チェック
   */
  equals(other: ConfigProfileName): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}
