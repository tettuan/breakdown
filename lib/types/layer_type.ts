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
 * TwoParamsLayerTypePattern - LayerType用のバリデーションパターン
 * 
 * 正規表現パターンを安全にラップし、LayerTypeのバリデーションに使用する。
 * Smart Constructorパターンを採用して、無効なパターンの作成を防ぐ。
 */
export class TwoParamsLayerTypePattern {
  private constructor(private readonly pattern: RegExp) {}

  /**
   * 文字列パターンから TwoParamsLayerTypePattern を作成
   * @param pattern 正規表現文字列
   * @returns 成功時は TwoParamsLayerTypePattern、失敗時は null
   */
  static create(pattern: string): TwoParamsLayerTypePattern | null {
    try {
      const regex = new RegExp(pattern);
      return new TwoParamsLayerTypePattern(regex);
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
    return this.pattern.source;
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
   * @returns 自身を返す（TypePatternProvider.getLayerTypePattern用）
   */
  getLayerTypePattern(): TwoParamsLayerTypePattern {
    return this;
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
  equals(other: LayerType): boolean {
    return this.value === other.value;
  }

  /**
   * getHierarchyLevel method for compatibility with test files
   * @deprecated This method is for testing purposes only
   */
  getHierarchyLevel(): number {
    const hierarchyMap: Record<string, number> = {
      "project": 1,
      "issue": 2,
      "task": 3,
      "bugs": 0,
      "temp": 0
    };
    return hierarchyMap[this.value] || 0;
  }

  /**
   * isStandardHierarchy method for compatibility with test files
   * @deprecated This method is for testing purposes only
   */
  isStandardHierarchy(): boolean {
    const standardTypes = ["project", "issue", "task"];
    return standardTypes.includes(this.value);
  }

  /**
   * String representation of LayerType
   * 
   * デバッグや表示用の文字列表現を返す。
   * フォーマット: "LayerType(value)"
   * 
   * @returns LayerType の文字列表現
   */
  toString(): string {
    return `LayerType(${this.value})`;
  }

  /**
   * 元の TwoParamsResult への読み取り専用アクセス
   * 
   * デバッグや詳細情報が必要な場合に使用。
   * Immutable なので安全に公開可能。
   * 
   * @returns 元の TwoParamsResult（読み取り専用）
   */
  get originalResult(): Readonly<TwoParamsResult> {
    return this.result;
  }
}