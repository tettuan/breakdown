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
 * バリデーションパターン for LayerType
 * 設定ファイルの正規表現パターンをラップして安全な検証を提供
 */
export class TwoParamsLayerTypePattern {
  private constructor(private readonly pattern: RegExp) {}

  /**
   * 正規表現文字列からパターンを構築
   * @param patternString 正規表現文字列（設定ファイルから取得）
   * @returns 有効な場合はパターン、無効な場合は null
   */
  static create(patternString: string): TwoParamsLayerTypePattern | null {
    try {
      const regex = new RegExp(patternString);
      return new TwoParamsLayerTypePattern(regex);
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
  equals(other: TwoParamsLayerTypePattern): boolean {
    return this.pattern.source === other.pattern.source;
  }
}

/**
 * LayerType - 階層型
 * 
 * Totality原則に準拠した制約型。TwoParamsResult を受け取る制約を持ち、
 * バリデーション経由でのみ構築可能。
 * 処理対象の階層（project, issue, task, bugs, temp等）を表現し、
 * TwoParamsResult.layerType の値として検証される。
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
 * const pattern = TwoParamsLayerTypePattern.create("project|issue|task");
 * const layerType = LayerType.create(twoParamsResult, pattern);
 * if (layerType) {
 *   console.log(layerType.value); // "project"
 * }
 * ```
 * 
 * @example 環境別設定での使用
 * ```typescript
 * // staging環境での拡張パターン
 * const stagingPattern = TwoParamsLayerTypePattern.create("project|issue|task|epic|system");
 * const epicResult: TwoParamsResult = { type: "two", demonstrativeType: "to", layerType: "epic", options: {} };
 * const epicLayer = LayerType.create(epicResult, stagingPattern);
 * 
 * // production環境での特化パターン
 * const prodPattern = TwoParamsLayerTypePattern.create("bugs|issues|todos|comments|notes");
 * const issuesResult: TwoParamsResult = { type: "two", demonstrativeType: "to", layerType: "issues", options: {} };
 * const issuesLayer = LayerType.create(issuesResult, prodPattern);
 * ```
 */
export class LayerType {
  private constructor(private readonly result: TwoParamsResult) {}

  /**
   * TwoParamsResult からバリデーション済み LayerType を構築
   * 
   * この静的メソッドは Totality 原則の核心部分。
   * TwoParamsResult を受け取り、バリデーションパターンを通過した値のみが LayerType として構築される。
   * 
   * @param result TwoParamsResult 型の検証対象データ
   * @param pattern TwoParamsLayerTypePattern によるバリデーションルール
   * @returns 有効な場合は LayerType、無効な場合は null
   */
  static create(
    result: TwoParamsResult, 
    pattern: TwoParamsLayerTypePattern
  ): LayerType | null {
    if (!pattern.test(result.layerType)) {
      return null;
    }
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