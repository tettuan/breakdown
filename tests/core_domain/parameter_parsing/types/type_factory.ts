/**
 * @fileoverview TypeFactory implementation for safe type construction
 * This module provides a factory for creating DirectiveType and LayerType instances
 * with proper validation patterns from configuration.
 * 
 * @module parameter_parsing/types/type_factory
 */

import { DirectiveType, TwoParamsDirectivePattern } from "../../../../lib/types/directive_type.ts";
import { LayerType, TwoParamsLayerTypePattern } from "../../../../lib/types/layer_type.ts";
import type { TwoParams_Result } from "../../../../lib/deps.ts";

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

    const twoParamsResult: TwoParams_Result = {
      type: "two",
      demonstrativeType: value,
      layerType: "project",
      params: [value, "project"],
      options: {},
    };

    const directiveType = DirectiveType.create(twoParamsResult);

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

    const twoParamsResult: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: value,
      params: ["to", value],
      options: {},
    };

    const layerType = LayerType.create(twoParamsResult);

    return {
      ok: true,
      data: layerType,
    };
  }

  /**
   * DirectiveType と LayerType を同時に構築
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