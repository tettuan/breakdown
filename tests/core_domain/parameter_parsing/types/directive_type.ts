/**
 * @fileoverview DirectiveType implementation with Totality principle
 *
 * This module implements DirectiveType following the Totality principle,
 * ensuring type safety through Smart Constructor pattern. DirectiveType
 * represents the processing direction (to, summary, defect, etc.) and can
 * only be constructed from validated TwoParams_Result.
 *
 * @module parameter_parsing/types/directive_type
 */

import type { TwoParams_Result } from "../../lib/deps.ts";

/**
 * TwoParamsDirectivePattern - DirectiveType用のバリデーションパターン
 */
export class TwoParamsDirectivePattern {
  private constructor(private readonly pattern: RegExp) {}

  /**
   * 文字列パターンから TwoParamsDirectivePattern を作成
   * @param pattern 正規表現文字列
   * @returns 成功時は TwoParamsDirectivePattern、失敗時は null
   */
  static create(pattern: string): TwoParamsDirectivePattern | null {
    try {
      const regex = new RegExp(pattern);
      return new TwoParamsDirectivePattern(regex);
    } catch {
      return null;
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
 */
export class DirectiveType {
  /**
   * Private constructor - Smart Constructor パターンの実装
   */
  private constructor(private readonly result: TwoParams_Result) {}

  /**
   * TwoParams_Result から DirectiveType を構築
   *
   * @param result BreakdownParamsで検証済みのTwoParams_Result
   * @returns DirectiveType インスタンス（常に成功）
   */
  static create(result: TwoParams_Result): DirectiveType {
    return new DirectiveType(result);
  }

  /**
   * 検証済み demonstrativeType 値を取得
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
   * @returns DirectiveType の文字列表現
   */
  toString(): string {
    return `DirectiveType(${this.value})`;
  }

  /**
   * 元の TwoParams_Result への読み取り専用アクセス
   *
   * @returns 元の TwoParams_Result（読み取り専用）
   */
  get originalResult(): Readonly<TwoParams_Result> {
    return this.result;
  }
}