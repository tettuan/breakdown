/**
 * @fileoverview TypeFactory implementation for safe type construction
 *
 * This module provides a factory for creating DirectiveType and LayerType instances
 * with proper validation patterns from configuration. It ensures Totality principle
 * compliance by centralizing type construction with validation.
 *
 * @module types/type_factory
 */

import { DirectiveType, TwoParamsDirectivePattern } from "./directive_type.ts";
import { LayerType, TwoParamsLayerTypePattern } from "./layer_type.ts";
import type { TwoParams_Result } from "../deps.ts";

/**
 * 設定ファイルからバリデーションパターンを提供するインターフェース
 * BreakdownConfig との連携を抽象化
 */
export interface TypePatternProvider {
  /**
   * DirectiveType用パターンを取得
   * @returns DirectiveType用バリデーションパターン
   */
  getDirectivePattern(): TwoParamsDirectivePattern | null;

  /**
   * LayerType用パターンを取得
   * @returns LayerType用バリデーションパターン
   */
  getLayerTypePattern(): TwoParamsLayerTypePattern | null;
}

/**
 * 型構築結果を表すResult型
 * Totality原則に基づいてエラーを値として扱う
 */
export type TypeCreationResult<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  error: TypeCreationError;
};

/**
 * 型構築時のエラー種別
 */
export type TypeCreationError =
  | { kind: "PatternNotFound"; message: string }
  | { kind: "ValidationFailed"; value: string; pattern: string }
  | { kind: "InvalidPattern"; pattern: string; cause: string };

/**
 * TypeFactory - 型構築のためのファクトリー
 *
 * 設定と連携して安全な型構築を提供。Totality原則に従い、
 * 型構築の失敗も明示的にResult型で表現する。
 *
 * @example 基本的な使用例
 * ```typescript
 * const factory = new TypeFactory(patternProvider);
 *
 * const directiveResult = factory.createDirectiveType("to");
 * if (directiveResult.ok) {
 *   console.log(directiveResult.data.getValue()); // "to"
 * } else {
 *   console.error(directiveResult.error.message);
 * }
 * ```
 *
 * @example 一括構築
 * ```typescript
 * const bothResult = factory.createBothTypes("summary", "project");
 * if (bothResult.ok) {
 *   const { directive, layer } = bothResult.data;
 *   // 両方とも有効な型として構築済み
 * }
 * ```
 */
export class TypeFactory {
  constructor(private readonly patternProvider: TypePatternProvider) {}

  /**
   * DirectiveType を安全に構築
   * @param value 構築対象の値
   * @returns 成功した場合は DirectiveType、失敗した場合は Error
   */
  createDirectiveType(value: string): TypeCreationResult<DirectiveType> {
    const pattern = this.patternProvider.getDirectivePattern();

    if (!pattern) {
      return {
        ok: false,
        error: {
          kind: "PatternNotFound",
          message: "DirectiveType validation pattern not found in configuration",
        },
      };
    }

    // DirectiveType.create() は TwoParams_Result のみを受け取る
    // パターンバリデーションは事前に実行する必要がある
    if (!pattern.test(value)) {
      return {
        ok: false,
        error: {
          kind: "ValidationFailed",
          value,
          pattern: pattern.getPattern(),
        },
      };
    }

    // 仮の TwoParams_Result を作成（実際にはBreakdownParamsから取得すべき）
    const twoParamsResult: TwoParams_Result = {
      type: "two",
      demonstrativeType: value,
      layerType: "project", // デフォルト値
      params: [value, "project"],
      options: {},
    };

    const directiveType = DirectiveType.create(twoParamsResult);

    // DirectiveType.create() は常に成功する（TwoParams_Result前提のため）

    return {
      ok: true,
      data: directiveType,
    };
  }

  /**
   * LayerType を安全に構築
   * @param value 構築対象の値
   * @returns 成功した場合は LayerType、失敗した場合は Error
   */
  createLayerType(value: string): TypeCreationResult<LayerType> {
    const pattern = this.patternProvider.getLayerTypePattern();

    if (!pattern) {
      return {
        ok: false,
        error: {
          kind: "PatternNotFound",
          message: "LayerType validation pattern not found in configuration",
        },
      };
    }

    // LayerType.create() は TwoParams_Result のみを受け取る
    // パターンバリデーションは事前に実行する必要がある
    if (!pattern.test(value)) {
      return {
        ok: false,
        error: {
          kind: "ValidationFailed",
          value,
          pattern: pattern.getPattern(),
        },
      };
    }

    // 仮の TwoParams_Result を作成（実際にはBreakdownParamsから取得すべき）
    const twoParamsResult: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to", // デフォルト値
      layerType: value,
      params: ["to", value],
      options: {},
    };

    const layerType = LayerType.create(twoParamsResult);

    // LayerType.create() は常に成功する（TwoParams_Result前提のため）

    return {
      ok: true,
      data: layerType,
    };
  }

  /**
   * DirectiveType と LayerType を同時に構築
   *
   * 両方の型が必要な場合の便利メソッド。
   * どちらか一方でも失敗した場合は全体が失敗となる。
   *
   * @param directiveValue DirectiveType の値
   * @param layerValue LayerType の値
   * @returns 両方成功した場合は両型、失敗した場合は Error
   */
  createBothTypes(
    directiveValue: string,
    layerValue: string,
  ): TypeCreationResult<{ directive: DirectiveType; layer: LayerType }> {
    const directiveResult = this.createDirectiveType(directiveValue);
    if (!directiveResult.ok) {
      return directiveResult;
    }

    const layerResult = this.createLayerType(layerValue);
    if (!layerResult.ok) {
      return layerResult;
    }

    return {
      ok: true,
      data: {
        directive: directiveResult.data,
        layer: layerResult.data,
      },
    };
  }

  /**
   * パターン検証のみ実行（型構築なし）
   *
   * 型を構築する前に検証のみ行いたい場合に使用。
   *
   * @param directiveValue DirectiveType の値
   * @param layerValue LayerType の値
   * @returns 両方が有効な場合 true
   */
  validateBothValues(directiveValue: string, layerValue: string): boolean {
    const directivePattern = this.patternProvider.getDirectivePattern();
    const layerPattern = this.patternProvider.getLayerTypePattern();

    if (!directivePattern || !layerPattern) {
      return false;
    }

    return directivePattern.test(directiveValue) && layerPattern.test(layerValue);
  }

  /**
   * 利用可能なパターンの確認
   * @returns パターンの利用可能性
   */
  getPatternAvailability(): {
    directive: boolean;
    layer: boolean;
    both: boolean;
  } {
    const directivePattern = this.patternProvider.getDirectivePattern();
    const layerPattern = this.patternProvider.getLayerTypePattern();

    return {
      directive: directivePattern !== null,
      layer: layerPattern !== null,
      both: directivePattern !== null && layerPattern !== null,
    };
  }

  /**
   * デバッグ用情報取得
   * @returns ファクトリーの状態情報
   */
  debug(): {
    patternProvider: string;
    availability: ReturnType<TypeFactory["getPatternAvailability"]>;
  } {
    return {
      patternProvider: this.patternProvider.constructor.name,
      availability: this.getPatternAvailability(),
    };
  }
}
