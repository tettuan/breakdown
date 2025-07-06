/**
 * @fileoverview DirectiveType implementation with Totality principle
 *
 * This module implements DirectiveType following the Totality principle,
 * ensuring type safety through Smart Constructor pattern. DirectiveType
 * represents the processing direction (to, summary, defect, etc.) and can
 * only be constructed from validated TwoParams_Result.
 *
 * All validation is performed by BreakdownParams before DirectiveType creation.
 * This ensures single responsibility and prevents validation logic duplication.
 *
 * @module types/directive_type
 */

import type { TwoParams_Result } from "../deps.ts";
import type { Result } from "./result.ts";
import { error, ok } from "./result.ts";
import type { ValidationError } from "./unified_error_types.ts";
import { ErrorFactory } from "./unified_error_types.ts";

/**
 * TwoParamsDirectivePattern - DirectiveType用のバリデーションパターン
 *
 * 正規表現パターンを安全にラップし、DirectiveTypeのバリデーションに使用する。
 * Smart Constructorパターンを採用して、無効なパターンの作成を防ぐ。
 */
export class TwoParamsDirectivePattern {
  private constructor(private readonly pattern: RegExp) {}

  /**
   * 文字列パターンから TwoParamsDirectivePattern を作成
   * @param pattern 正規表現文字列
   * @returns 成功時は TwoParamsDirectivePattern、失敗時は null
   */
  static create(pattern: string): TwoParamsDirectivePattern | null {
    // Validate input type first
    if (typeof pattern !== 'string' || pattern == null) {
      return null;
    }
    
    try {
      const regex = new RegExp(pattern);
      return new TwoParamsDirectivePattern(regex);
    } catch {
      return null;
    }
  }

  /**
   * 文字列パターンから TwoParamsDirectivePattern を作成（Result型版）
   * 
   * Totality原則に準拠し、エラーを明示的に返す。
   * 
   * @param pattern 正規表現文字列
   * @returns 成功時は Result<TwoParamsDirectivePattern>、失敗時はエラー情報
   */
  static createOrError(pattern: string): Result<TwoParamsDirectivePattern, ValidationError> {
    if (!pattern || pattern.length === 0) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "pattern",
        value: pattern,
        reason: "Pattern cannot be empty",
      }));
    }

    try {
      const regex = new RegExp(pattern);
      return ok(new TwoParamsDirectivePattern(regex));
    } catch (e) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "pattern",
        value: pattern,
        reason: `Invalid regex pattern: ${e instanceof Error ? e.message : "Unknown error"}`,
      }));
    }
  }

  /**
   * 値がパターンにマッチするかテスト
   * @param value テスト対象の値
   * @returns マッチする場合 true
   */
  test(value: string): boolean {
    return this.pattern.test(value);
  }

  /**
   * パターンの文字列表現を取得
   * @returns 正規表現の文字列
   */
  toString(): string {
    return this.pattern.toString();
  }

  /**
   * パターンの文字列表現を取得（getPatternメソッド）
   * @returns 正規表現の文字列
   */
  getPattern(): string {
    return this.pattern.source;
  }

  /**
   * TypePatternProvider インターフェース準拠のためのメソッド
   * @returns 自身を返す（TypePatternProvider.getDirectivePattern用）
   */
  getDirectivePattern(): TwoParamsDirectivePattern {
    return this;
  }
}

/**
 * DirectiveType - 処理方向型
 *
 * Totality原則に準拠した純粋なSmart Constructor実装。
 * TwoParams_Resultからのみ構築可能で、バリデーション責任はBreakdownParamsに委譲。
 *
 * ## 設計原則
 * 1. **単一責任**: 検証済み値の型安全な保持のみ
 * 2. **Smart Constructor**: private constructor + static create
 * 3. **Immutable**: 構築後の変更不可
 * 4. **Total Function**: 全ての入力に対して定義済み（TwoParams_Resultが前提）
 *
 * ## バリデーション責任分離
 * - **BreakdownParams**: 入力値の検証・TwoParams_Result生成
 * - **DirectiveType**: 検証済み値の型安全な保持・アクセス
 *
 * @example 基本的な使用例
 * ```typescript
 * // BreakdownParams でバリデーション済みの TwoParams_Result から構築
 * const twoParamsResult: TwoParams_Result = {
 *   type: "two",
 *   demonstrativeType: "to",
 *   layerType: "project",
 *   options: {}
 * };
 * const directiveType = DirectiveType.create(twoParamsResult);
 * console.log(directiveType.value); // "to"
 * ```
 *
 * @example 設定ファイル連携での使用
 * ```typescript
 * // カスタム設定から検証済みの値を使用
 * const customResult: TwoParams_Result = {
 *   type: "two",
 *   demonstrativeType: "analyze",
 *   layerType: "system",
 *   options: {}
 * };
 * const analyzeDirective = DirectiveType.create(customResult);
 * console.log(analyzeDirective.value); // "analyze"
 * ```
 */
export class DirectiveType {
  /**
   * Private constructor - Smart Constructor パターンの実装
   *
   * 直接インスタンス化を禁止し、create() メソッド経由での作成を強制。
   * これにより型の整合性と将来の拡張性を保証する。
   */
  private constructor(private readonly result: TwoParams_Result) {}

  /**
   * TwoParams_Result から DirectiveType を構築
   *
   * Totality原則に従い、TwoParams_Resultは既にBreakdownParamsで
   * バリデーション済みであることを前提とする。そのため、この関数は
   * 常に成功し、例外も発生しない（Total Function）。
   *
   * @param result BreakdownParamsで検証済みのTwoParams_Result
   * @returns DirectiveType インスタンス（常に成功）
   *
   * @example
   * ```typescript
   * const result = await breakdownParams.parse(args);
   * if (_result.type === "two") {
   *   const directive = DirectiveType.create(result);
   *   // 型安全に使用可能
   * }
   * ```
   */
  static create(result: TwoParams_Result): DirectiveType {
    return new DirectiveType(result);
  }

  /**
   * TwoParams_Result から DirectiveType を構築（Result型版）
   *
   * Totality原則に完全準拠し、すべてのエラーケースを明示的に扱う。
   * DirectiveTypeの構築前に追加バリデーションを実行し、
   * 失敗の可能性がある場合はResult型でエラーを返す。
   *
   * @param result TwoParams_Result（基本的なバリデーション済み）
   * @param pattern オプショナル：追加バリデーション用のパターン
   * @returns 成功時は Result<DirectiveType>、失敗時はエラー情報
   *
   * @example
   * ```typescript
   * const pattern = TwoParamsDirectivePattern.createOrError("^(to|from|summary)$");
   * if (pattern.ok) {
   *   const directiveResult = DirectiveType.createOrError(result, pattern.data);
   *   if (directiveResult.ok) {
   *     // 型安全に使用可能
   *     console.log(directiveResult.data.value);
   *   } else {
   *     // エラーハンドリング
   *     console.error(directiveResult.error);
   *   }
   * }
   * ```
   */
  static createOrError(
    result: TwoParams_Result,
    pattern?: TwoParamsDirectivePattern
  ): Result<DirectiveType, ValidationError> {
    // 基本的なバリデーション
    if (!result || result.type !== "two") {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "result",
        value: result,
        reason: "Invalid TwoParams_Result: must have type 'two'",
      }));
    }

    if (!result.demonstrativeType || typeof result.demonstrativeType !== "string") {
      return error(ErrorFactory.validationError("MissingRequiredField", {
        field: "demonstrativeType",
        source: "TwoParams_Result",
      }));
    }

    // パターンマッチングによる追加バリデーション（オプショナル）
    if (pattern && !pattern.test(result.demonstrativeType)) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "demonstrativeType",
        value: result.demonstrativeType,
        reason: `Value does not match required pattern: ${pattern.getPattern()}`,
      }));
    }

    // すべてのバリデーションに成功
    return ok(new DirectiveType(result));
  }

  /**
   * 検証済み demonstrativeType 値を取得
   *
   * TwoParams_Result.demonstrativeType の値を返す。
   * この値は BreakdownParams でバリデーション済みのため、
   * 安全に使用することができる。
   *
   * @returns 検証済みの処理方向文字列
   */
  get value(): string {
    return this.result.demonstrativeType;
  }

  /**
   * getValue method for compatibility with test files
   * @deprecated Use .value property instead
   */
  getValue(): string {
    return this.value;
  }

  /**
   * equals method for value comparison
   */
  equals(other: DirectiveType): boolean {
    return this.value === other.value;
  }

  /**
   * String representation of DirectiveType
   *
   * デバッグや表示用の文字列表現を返す。
   * フォーマット: "DirectiveType(value)"
   *
   * @returns DirectiveType の文字列表現
   */
  toString(): string {
    return `DirectiveType(${this.value})`;
  }

  /**
   * 元の TwoParams_Result への読み取り専用アクセス
   *
   * デバッグや詳細情報が必要な場合に使用。
   * Immutable なので安全に公開可能。
   *
   * @returns 元の TwoParams_Result（読み取り専用）
   */
  get originalResult(): Readonly<TwoParams_Result> {
    return this.result;
  }
}
