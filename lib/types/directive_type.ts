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
 * DirectiveType - 処理方向型
 * 
 * Totality原則に準拠した制約型。TwoParamsResult を受け取る制約を持ち、
 * バリデーション経由でのみ構築可能。
 * 処理の方向性（to, summary, defect, init, find等）を表現し、
 * TwoParamsResult.demonstrativeType の値として検証される。
 * 
 * バリデーションパターンは BreakdownParams 呼び出し時に適用される。
 * 
 * ## Smart Constructor パターン
 * このクラスは Smart Constructor パターンを実装しています：
 * - `private constructor`: 直接インスタンス化を禁止
 * - `static create()`: 制御された唯一の作成方法を提供
 * - 型安全性と将来のバリデーション拡張性を保証
 * 
 * @example 基本的な使用例
 * ```typescript
 * const twoParamsResult: TwoParamsResult = {
 *   type: "two",
 *   demonstrativeType: "to",
 *   layerType: "project",
 *   options: {}
 * };
 * const directiveType = DirectiveType.create(twoParamsResult);
 * console.log(directiveType.value); // "to"
 * ```
 * 
 * @example 設定ファイル連携
 * ```typescript
 * // 設定から取得したパターンで BreakdownParams 側でバリデーション済み
 * const searchResult: TwoParamsResult = { type: "two", demonstrativeType: "web", layerType: "search", options: {} };
 * const searchDirective = DirectiveType.create(searchResult);
 * ```
 */
export class DirectiveType {
  /**
   * Private constructor - Smart Constructor パターンの実装
   * 直接インスタンス化を禁止し、create() メソッド経由での作成を強制
   */
  private constructor(private readonly result: TwoParamsResult) {}

  /**
   * TwoParamsResult からバリデーション済み DirectiveType を構築
   * 
   * この静的メソッドは Totality 原則の核心部分。
   * TwoParamsResult を受け取り、既にバリデーション済みの値のみが DirectiveType として構築される。
   * バリデーションは BreakdownParams 側で実行済み。
   * 
   * @param result TwoParamsResult 型の検証済みデータ
   * @returns DirectiveType インスタンス（TwoParamsResult は既にバリデーション済みのため常に成功）
   */
  static create(result: TwoParamsResult): DirectiveType {
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