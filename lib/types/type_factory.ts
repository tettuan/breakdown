/**
 * @fileoverview TypeFactory implementation for JSR-based type construction
 *
 * This module provides a factory for creating DirectiveType and LayerType instances
 * from JSR-validated BreakdownParams results. It ensures Totality principle
 * compliance by centralizing JSR-based type construction.
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
 * 型構築結果を表すResult型
 * 統一されたResult型とProcessingErrorを使用
 */
export type TypeCreationResult<T> = Result<T, ProcessingError>;

// JSR統合による新しいアーキテクチャ:
// - 型構築はDirectiveType.create()/LayerType.create()に委譲
// - バリデーションはBreakdownParams JSRパッケージが担当
// - エラーハンドリングはResult型で統一

/**
 * TypeFactory - JSR-based型構築のためのファクトリー
 *
 * BreakdownParams JSRパッケージと連携して安全な型構築を提供。
 * Totality原則に従い、型構築の失敗も明示的にResult型で表現する。
 *
 * @example JSR統合での使用（推奨方式）
 * ```typescript
 * // JSR検証済み値から直接生成
 * const jsrResult = await breakdownParams.parseArgs(args);
 * if (jsrResult.type === "two") {
 *   const typesResult = TypeFactory.createFromJSR(jsrResult);
 *   if (typesResult.ok) {
 *     const { directive, layer } = typesResult.data;
 *     // JSRバリデーション済み値から直接生成完了
 *   }
 * }
 * ```
 *
 * @example 直接型構築（JSR検証済み値前提）
 * ```typescript
 * const directiveResult = TypeFactory.createDirectiveType("to");
 * if (directiveResult.ok) {
 *   console.log(directiveResult.data.value); // "to"
 * } else {
 *   console.error(directiveResult.error.message);
 * }
 * ```
 */
export class TypeFactory {
  /**
   * DirectiveType を安全に構築（JSR検証済み値前提）
   * @param value 構築対象の値（JSRによる事前検証を前提）
   * @returns 成功した場合は DirectiveType、失敗した場合は Error
   */
  static createDirectiveType(
    value: string,
  ): TypeCreationResult<DirectiveType> {
    // DirectiveTypeのcreateメソッドを直接使用（JSR検証済み前提）
    const directiveResult = DirectiveType.create(value);

    if (!directiveResult.ok) {
      return {
        ok: false,
        error: ErrorFactory.processingError("ProcessingFailed", {
          operation: "jsr_type_creation",
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
   * LayerType を安全に構築（JSR検証済み値前提）
   * @param value 構築対象の値（JSRによる事前検証を前提）
   * @returns 成功した場合は LayerType、失敗した場合は Error
   */
  static createLayerType(value: string): TypeCreationResult<LayerType> {
    // LayerTypeのcreateメソッドを直接使用（JSR検証済み前提）
    const layerResult = LayerType.create(value);

    if (!layerResult.ok) {
      return {
        ok: false,
        error: ErrorFactory.processingError("ProcessingFailed", {
          operation: "jsr_type_creation",
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
   * DirectiveType と LayerType を同時に構築（JSR検証済み値前提）
   *
   * 両方の型が必要な場合の便利メソッド。
   * どちらか一方でも失敗した場合は全体が失敗となる。
   *
   * @param directiveValue DirectiveType の値（JSR検証済み）
   * @param layerValue LayerType の値（JSR検証済み）
   * @returns 両方成功した場合は両型、失敗した場合は Error
   */
  static createBothTypes(
    directiveValue: string,
    layerValue: string,
  ): TypeCreationResult<{ directive: DirectiveType; layer: LayerType }> {
    const directiveResult = TypeFactory.createDirectiveType(directiveValue);
    if (!directiveResult.ok) {
      return directiveResult;
    }

    const layerResult = TypeFactory.createLayerType(layerValue);
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
   * JSR検証済みTwoParamsResultから直接型を生成（推奨メソッド）
   *
   * BreakdownParamsで既に検証済みの値を使用して、
   * 直接的な型生成を行う。これがJSR統合における標準的なアプローチ。
   *
   * @param jsrResult JSR BreakdownParamsによる検証済み結果
   * @returns 成功した場合は両型、失敗した場合は Error
   *
   * @example JSR統合の使用例
   * ```typescript
   * // BreakdownParamsによる検証済み結果を直接利用
   * const jsrResult = await breakdownParams.parseArgs(args);
   * if (jsrResult.type === "two") {
   *   const typesResult = TypeFactory.createFromJSR(jsrResult);
   *   if (typesResult.ok) {
   *     const { directive, layer } = typesResult.data;
   *     // JSR検証済み値から直接生成された型
   *   }
   * }
   * ```
   */
  static createFromJSR(
    jsrResult: _TwoParams_Result,
  ): TypeCreationResult<{ directive: DirectiveType; layer: LayerType }> {
    // JSR検証済み値を直接使用
    const directiveResult = DirectiveType.create(jsrResult.directiveType);
    if (!directiveResult.ok) {
      return {
        ok: false,
        error: ErrorFactory.processingError("ProcessingFailed", {
          operation: "jsr_type_creation",
          reason: `DirectiveType creation failed: ${
            directiveResult.error.message ?? "Unknown error"
          }`,
          context: {
            source: "JSR_validated",
            directiveType: jsrResult.directiveType,
          },
        }),
      };
    }

    const layerResult = LayerType.create(jsrResult.layerType);
    if (!layerResult.ok) {
      return {
        ok: false,
        error: ErrorFactory.processingError("ProcessingFailed", {
          operation: "jsr_type_creation",
          reason: `LayerType creation failed: ${layerResult.error.message ?? "Unknown error"}`,
          context: {
            source: "JSR_validated",
            layerType: jsrResult.layerType,
          },
        }),
      };
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
   * JSRパッケージ統合状況の確認（デバッグ用）
   * @returns JSR統合の状態情報
   */
  static debug(): {
    mode: "JSR_ONLY";
    availableMethods: string[];
    recommendedMethod: string;
  } {
    return {
      mode: "JSR_ONLY",
      availableMethods: [
        "TypeFactory.createFromJSR()",
        "TypeFactory.createDirectiveType()",
        "TypeFactory.createLayerType()",
        "TypeFactory.createBothTypes()",
      ],
      recommendedMethod: "TypeFactory.createFromJSR()",
    };
  }
}
