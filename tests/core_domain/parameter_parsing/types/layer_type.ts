/**
 * @fileoverview LayerType implementation with Totality principle
 *
 * This module implements LayerType following the Totality principle,
 * ensuring type safety through Smart Constructor pattern and validation.
 * LayerType represents the hierarchical layer (project, issue, task, etc.)
 * and can only be constructed through proper validation.
 *
 * @module parameter_parsing/types/layer_type
 */

import type { TwoParams_Result } from "../../../lib/deps.ts";

/**
 * TwoParamsLayerTypePattern - LayerType用のバリデーションパターン
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
 * Totality原則に準拠した制約型。TwoParams_Result を受け取る制約を持ち、
 * バリデーション経由でのみ構築可能。
 * 処理対象の階層（project, issue, task, bugs, temp等）を表現し、
 * TwoParams_Result.layerType の値として検証される。
 */
export class LayerType {
  /**
   * Private constructor - Smart Constructor パターンの実装
   * 直接インスタンス化を禁止し、create() メソッド経由での作成を強制
   */
  private constructor(private readonly result: TwoParams_Result) {}

  /**
   * TwoParams_Result からバリデーション済み LayerType を構築
   *
   * @param result TwoParams_Result 型の検証済みデータ
   * @returns LayerType インスタンス（TwoParams_Result は既にバリデーション済みのため常に成功）
   */
  static create(result: TwoParams_Result): LayerType {
    return new LayerType(result);
  }

  /**
   * 検証済み layerType 値を取得
   *
   * @returns TwoParams_Result.layerType の検証済み文字列値
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
      "temp": 0,
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
   * @returns LayerType の文字列表現
   */
  toString(): string {
    return `LayerType(${this.value})`;
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