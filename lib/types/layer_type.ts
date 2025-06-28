/**
 * @fileoverview LayerType implementation with Totality principle
 * 
 * This module implements LayerType following the Totality principle,
 * ensuring type safety through Smart Constructor pattern and validation.
 * LayerType represents the hierarchical layer (project, issue, task, etc.)
 * and can only be constructed through proper validation.
 * 
 * @module types/layer_type
 */

import type { TwoParamsResult } from "../deps.ts";

/**
 * LayerType - 階層型
 * 
 * Totality原則に準拠した制約型。TwoParamsResult を受け取る制約を持ち、
 * バリデーション経由でのみ構築可能。
 * 処理対象の階層（project, issue, task, bugs, temp等）を表現し、
 * TwoParamsResult.layerType の値として検証される。
 * 
 * バリデーションパターンは BreakdownParams 呼び出し時に適用される。
 * 
 * ## Smart Constructor パターン
 * このクラスは Smart Constructor パターンを実装しています：
 * - `private constructor`: 直接インスタンス化を禁止
 * - `static create()`: 制御された唯一の作成方法を提供
 * - 型安全性と将来のバリデーション拡張性を保証
 * 
 * 環境別設定での使用例：
 * - デフォルト: "project|issue|task|bugs"
 * - staging: "project|issue|task|epic|system"
 * - production: "bugs|issues|todos|comments|notes"
 * 
 * @example 基本的な使用例
 * ```typescript
 * const twoParamsResult: TwoParamsResult = {
 *   type: "two",
 *   demonstrativeType: "to",
 *   layerType: "project",
 *   options: {}
 * };
 * const layerType = LayerType.create(twoParamsResult);
 * console.log(layerType.value); // "project"
 * ```
 * 
 * @example 環境別設定での使用
 * ```typescript
 * // staging環境での拡張パターン
 * const epicResult: TwoParamsResult = { type: "two", demonstrativeType: "to", layerType: "epic", options: {} };
 * const epicLayer = LayerType.create(epicResult);
 * 
 * // production環境での特化パターン
 * const issuesResult: TwoParamsResult = { type: "two", demonstrativeType: "to", layerType: "issues", options: {} };
 * const issuesLayer = LayerType.create(issuesResult);
 * ```
 */
export class LayerType {
  /**
   * Private constructor - Smart Constructor パターンの実装
   * 直接インスタンス化を禁止し、create() メソッド経由での作成を強制
   */
  private constructor(private readonly result: TwoParamsResult) {}

  /**
   * TwoParamsResult からバリデーション済み LayerType を構築
   * 
   * この静的メソッドは Totality 原則の核心部分。
   * TwoParamsResult を受け取り、既にバリデーション済みの値のみが LayerType として構築される。
   * バリデーションは BreakdownParams 側で実行済み。
   * 
   * @param result TwoParamsResult 型の検証済みデータ
   * @returns LayerType インスタンス（TwoParamsResult は既にバリデーション済みのため常に成功）
   */
  static create(result: TwoParamsResult): LayerType {
    return new LayerType(result);
  }

  /**
   * 検証済み layerType 値を取得
   * 
   * このプロパティで取得される値は必ずバリデーション済みのため、
   * 安全に使用することができる。TwoParamsResult.layerType を返す。
   * 
   * @returns TwoParamsResult.layerType の検証済み文字列値
   */
  get value(): string {
    return this.result.layerType;
  }
}