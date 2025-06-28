/**
 * @fileoverview DirectiveType implementation with Totality principle
 * 
 * This module implements DirectiveType following the Totality principle,
 * ensuring type safety through Smart Constructor pattern and validation.
 * DirectiveType represents the processing direction (to, summary, defect, etc.)
 * and can only be constructed through proper validation.
 * 
 * @module types/directive_type
 */

import type { TwoParamsResult } from "../deps.ts";

/**
 * バリデーションパターン for DirectiveType
 * 設定ファイルの正規表現パターンをラップして安全な検証を提供
 */
export class TwoParamsDirectivePattern {
  private constructor(private readonly pattern: RegExp) {}

  /**
   * 正規表現文字列からパターンを構築
   * @param patternString 正規表現文字列（設定ファイルから取得）
   * @returns 有効な場合はパターン、無効な場合は null
   */
  static create(patternString: string): TwoParamsDirectivePattern | null {
    try {
      const regex = new RegExp(patternString);
      return new TwoParamsDirectivePattern(regex);
    } catch {
      return null;
    }
  }

  /**
   * 値がパターンに一致するか検証
   * @param value 検証対象の文字列
   * @returns 一致する場合 true
   */
  test(value: string): boolean {
    return this.pattern.test(value);
  }

  /**
   * パターンの文字列表現を取得
   * @returns 正規表現の文字列
   */
  toString(): string {
    return this.pattern.source;
  }

  /**
   * パターンの等価性確認
   * @param other 比較対象のパターン
   * @returns パターンが等しい場合 true
   */
  equals(other: TwoParamsDirectivePattern): boolean {
    return this.pattern.source === other.pattern.source;
  }
}

/**
 * DirectiveType - 処理方向型
 * 
 * Totality原則に準拠した制約型。TwoParamsResult を受け取る制約を持ち、
 * バリデーション経由でのみ構築可能。
 * 処理の方向性（to, summary, defect, init, find等）を表現し、
 * TwoParamsResult.demonstrativeType の値として検証される。
 * 
 * @example 基本的な使用例
 * ```typescript
 * const twoParamsResult: TwoParamsResult = {
 *   type: "two",
 *   demonstrativeType: "to",
 *   layerType: "project",
 *   options: {}
 * };
 * const pattern = TwoParamsDirectivePattern.create("to|summary|defect");
 * const directiveType = DirectiveType.create(twoParamsResult, pattern);
 * if (directiveType) {
 *   console.log(directiveType.value); // "to"
 * }
 * ```
 * 
 * @example 設定ファイル連携
 * ```typescript
 * // 設定から取得したパターン文字列
 * const configPattern = "web|rag|db"; // search プロファイル
 * const pattern = TwoParamsDirectivePattern.create(configPattern);
 * const searchResult: TwoParamsResult = { type: "two", demonstrativeType: "web", layerType: "search", options: {} };
 * const searchDirective = DirectiveType.create(searchResult, pattern);
 * ```
 */
export class DirectiveType {
  private constructor(private readonly result: TwoParamsResult) {}

  /**
   * TwoParamsResult からバリデーション済み DirectiveType を構築
   * 
   * この静的メソッドは Totality 原則の核心部分。
   * TwoParamsResult を受け取り、バリデーションパターンを通過した値のみが DirectiveType として構築される。
   * 
   * @param result TwoParamsResult 型の検証対象データ
   * @param pattern TwoParamsDirectivePattern によるバリデーションルール
   * @returns 有効な場合は DirectiveType、無効な場合は null
   */
  static create(
    result: TwoParamsResult, 
    pattern: TwoParamsDirectivePattern
  ): DirectiveType | null {
    if (!pattern.test(result.demonstrativeType)) {
      return null;
    }
    return new DirectiveType(result);
  }

  /**
   * 検証済み demonstrativeType 値を取得
   * 
   * このプロパティで取得される値は必ずバリデーション済みのため、
   * 安全に使用することができる。TwoParamsResult.demonstrativeType を返す。
   * 
   * @returns TwoParamsResult.demonstrativeType の検証済み文字列値
   */
  get value(): string {
    return this.result.demonstrativeType;
  }
}