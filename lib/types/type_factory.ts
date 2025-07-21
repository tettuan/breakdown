/**
 * @fileoverview TypeFactory implementation for safe type construction
 *
 * This module provides a factory for creating DirectiveType and LayerType instances
 * with proper validation patterns from configuration. It ensures Totality principle
 * compliance by centralizing type construction with validation.
 *
 * @module types/type_factory
 */

import { DirectiveType } from "../domain/core/value_objects/directive_type.ts";
import { LayerType } from "../domain/core/value_objects/layer_type.ts";
import type { TwoParams_Result as _TwoParams_Result } from "../deps.ts";
import type { Result } from "./result.ts";
import type { ProcessingError } from "./unified_error_types.ts";
import { ErrorFactory } from "./unified_error_types.ts";

/**
 * 設定ファイルからバリデーションパターンを提供するインターフェース
 * BreakdownConfig との連携を抽象化
 */
export interface TypePatternProvider {
  /**
   * DirectiveType用バリデーション結果を取得
   * @param value 検証対象の値
   * @returns バリデーション結果
   */
  validateDirectiveType(value: string): boolean;

  /**
   * LayerType用バリデーション結果を取得
   * @param value 検証対象の値
   * @returns バリデーション結果
   */
  validateLayerType(value: string): boolean;

  /**
   * 利用可能なDirectiveType値を取得
   * @returns 設定で許可されたDirectiveType値の配列
   */
  getValidDirectiveTypes(): readonly string[];

  /**
   * 利用可能なLayerType値を取得
   * @returns 設定で許可されたLayerType値の配列
   */
  getValidLayerTypes(): readonly string[];

  /**
   * DirectiveType用パターンオブジェクトを取得
   * @returns DirectiveType用のパターンオブジェクト
   */
  getDirectivePattern(): { test(value: string): boolean; getPattern(): string } | null;

  /**
   * LayerType用パターンオブジェクトを取得
   * @returns LayerType用のパターンオブジェクト
   */
  getLayerTypePattern(): { test(value: string): boolean; getPattern(): string } | null;
}

/**
 * 型構築結果を表すResult型
 * 統一されたResult型とProcessingErrorを使用
 */
export type TypeCreationResult<T> = Result<T, ProcessingError>;

// TypeCreationError は ProcessingError に統一されました
// 新しいDirectiveType/LayerTypeとの連携:
// - 型構築はDirectiveType.create()/LayerType.create()に委譲
// - パターンバリデーションはTypePatternProviderが担当
// - エラーハンドリングはResult型で統一

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
 *   console.log(directiveResult.data.value); // "to"
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
  createDirectiveType(
    value: string,
  ): TypeCreationResult<DirectiveType> {
    // TypePatternProviderによるバリデーション
    if (!this.patternProvider.validateDirectiveType(value)) {
      return {
        ok: false,
        error: ErrorFactory.processingError("PatternValidationFailed", {
          value,
          pattern: "directive_type_pattern",
          operation: "type_creation",
        }),
      };
    }

    // 新しいDirectiveTypeのcreateメソッドを使用
    const directiveResult = DirectiveType.create(value);

    if (!directiveResult.ok) {
      return {
        ok: false,
        error: ErrorFactory.processingError("ProcessingFailed", {
          operation: "type_creation",
          reason: directiveResult.error.message ?? "Unknown error",
        }),
      };
    }

    return {
      ok: true,
      data: directiveResult.data,
    };
  }

  /**
   * LayerType を安全に構築
   * @param value 構築対象の値
   * @returns 成功した場合は LayerType、失敗した場合は Error
   */
  createLayerType(value: string): TypeCreationResult<LayerType> {
    // TypePatternProviderによるバリデーション
    if (!this.patternProvider.validateLayerType(value)) {
      return {
        ok: false,
        error: ErrorFactory.processingError("PatternValidationFailed", {
          value,
          pattern: "layer_type_pattern",
          operation: "type_creation",
        }),
      };
    }

    // 新しいLayerTypeのcreateメソッドを使用
    const layerResult = LayerType.create(value);

    if (!layerResult.ok) {
      return {
        ok: false,
        error: ErrorFactory.processingError("ProcessingFailed", {
          operation: "type_creation",
          reason: layerResult.error.message ?? "Unknown error",
        }),
      };
    }

    return {
      ok: true,
      data: layerResult.data,
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
    return this.patternProvider.validateDirectiveType(directiveValue) &&
      this.patternProvider.validateLayerType(layerValue);
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
    const directiveTypes = this.patternProvider.getValidDirectiveTypes();
    const layerTypes = this.patternProvider.getValidLayerTypes();

    return {
      directive: directiveTypes.length > 0,
      layer: layerTypes.length > 0,
      both: directiveTypes.length > 0 && layerTypes.length > 0,
    };
  }

  /**
   * デバッグ用情報取得
   * @returns ファクトリーの状態情報
   */
  debug(): {
    patternProvider: string;
    availability: ReturnType<TypeFactory["getPatternAvailability"]>;
    validDirectives: readonly string[];
    validLayers: readonly string[];
  } {
    return {
      patternProvider: this.patternProvider.constructor.name,
      availability: this.getPatternAvailability(),
      validDirectives: this.patternProvider.getValidDirectiveTypes(),
      validLayers: this.patternProvider.getValidLayerTypes(),
    };
  }
}
