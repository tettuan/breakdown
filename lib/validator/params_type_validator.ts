/**
 * @fileoverview Params Type Validator
 *
 * This module validates the type and structure of parsed parameters,
 * following the Single Responsibility Principle.
 *
 * @module lib/validator/params_type_validator
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
// TypePatternProvider依存を除去 - JSR統合により不要
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { DirectiveType } from "../domain/core/value_objects/directive_type.ts";
import { LayerType } from "../domain/core/value_objects/layer_type.ts";

/**
 * Params type validation error
 */
export type ParamsTypeError =
  | { kind: "InvalidParamsType"; expected: string; received: string }
  | { kind: "MissingRequiredField"; field: string; source: string }
  | { kind: "InvalidFieldType"; field: string; expected: string; received: string }
  | { kind: "InvalidFieldValue"; field: string; value: unknown; pattern: string }
  | { kind: "IncompatibleParams"; reason: string };

/**
 * Generic params result interface
 */
export interface ParamsResult {
  type: string;
  params?: string[];
  options?: Record<string, unknown>;
  directiveType?: string;
  layerType?: string;
}

/**
 * Validated params structure
 */
export interface ValidatedParamsType {
  type: "zero" | "one" | "two";
  directiveType: string;
  layerType: string;
  params: string[];
  options: Record<string, unknown>;
}

/**
 * Params Type Validator class
 *
 * Responsible for validating the type and structure of parsed parameters,
 * ensuring they conform to expected patterns and contain required fields.
 */
export class ParamsTypeValidator {
  constructor(
    private readonly config?: BreakdownConfig,
  ) {}

  /**
   * Validate params result type and structure
   */
  validate(result: ParamsResult): Result<ValidatedParamsType, ParamsTypeError> {
    switch (result.type) {
      case "two": {
        return this.validateTwoParams(result);
      }
      case "one": {
        return this.validateOneParams(result);
      }
      case "zero": {
        return this.validateZeroParams(result);
      }
      default: {
        return error({
          kind: "InvalidParamsType",
          expected: "zero, one, or two",
          received: result.type,
        });
      }
    }
  }

  /**
   * Validate two params structure
   */
  private validateTwoParams(result: ParamsResult): Result<ValidatedParamsType, ParamsTypeError> {
    // Validate required fields
    if (!result.directiveType) {
      return error({
        kind: "MissingRequiredField",
        field: "directiveType",
        source: "TwoParams",
      });
    }

    if (!result.layerType) {
      return error({
        kind: "MissingRequiredField",
        field: "layerType",
        source: "TwoParams",
      });
    }

    // Validate against patterns
    const directiveValidation = this.validateDirectiveType(result.directiveType);
    if (!directiveValidation.ok) {
      return error(directiveValidation.error);
    }

    const layerValidation = this.validateLayerType(result.layerType);
    if (!layerValidation.ok) {
      return error(layerValidation.error);
    }

    // Validate params array
    if (!result.params || result.params.length !== 2) {
      return error({
        kind: "InvalidFieldType",
        field: "params",
        expected: "array of 2 strings",
        received: result.params ? `array of ${result.params.length}` : "undefined",
      });
    }

    return ok({
      type: "two",
      directiveType: result.directiveType,
      layerType: result.layerType,
      params: result.params,
      options: result.options ?? {},
    });
  }

  /**
   * Validate one param structure
   */
  private validateOneParams(result: ParamsResult): Result<ValidatedParamsType, ParamsTypeError> {
    if (!result.params || result.params.length !== 1) {
      return error({
        kind: "MissingRequiredField",
        field: "params",
        source: "OneParams",
      });
    }

    const param = result.params[0];

    // Try to infer directive and layer
    const inferred = this.inferDirectiveAndLayer(param);
    if (!inferred.ok) {
      return error(inferred.error);
    }

    return ok({
      type: "one",
      directiveType: inferred.data.directive,
      layerType: inferred.data.layer,
      params: result.params,
      options: result.options ?? {},
    });
  }

  /**
   * Validate zero params structure
   */
  private validateZeroParams(result: ParamsResult): Result<ValidatedParamsType, ParamsTypeError> {
    // Use defaults for zero params
    const defaults = this.getDefaultDirectiveAndLayer();

    return ok({
      type: "zero",
      directiveType: defaults.directive,
      layerType: defaults.layer,
      params: [],
      options: result.options ?? {},
    });
  }

  /**
   * Validate directive type against pattern (JSR integrated)
   */
  private validateDirectiveType(value: string): Result<void, ParamsTypeError> {
    // JSR統合により、パターンプロバイダーを使わずDirectiveType.createで検証
    const directiveResult = DirectiveType.create(value);
    if (!directiveResult.ok) {
      return error({
        kind: "InvalidFieldValue",
        field: "directiveType",
        value,
        pattern: "JSR validation failed",
      });
    }

    return ok(undefined);
  }

  /**
   * Validate layer type against pattern
   */
  private validateLayerType(value: string): Result<void, ParamsTypeError> {
    // JSR統合により、パターンプロバイダーを使わずLayerType.createで検証
    const layerResult = LayerType.create(value);
    if (!layerResult.ok) {
      return error({
        kind: "InvalidFieldValue",
        field: "layerType",
        value,
        pattern: "JSR validation failed",
      });
    }

    return ok(undefined);
  }

  /**
   * Infer directive and layer from a single parameter
   */
  private inferDirectiveAndLayer(
    param: string,
  ): Result<{ directive: string; layer: string }, ParamsTypeError> {
    const defaults = this.getDefaultDirectiveAndLayer();

    // Check if param is a known layer type
    const layerResult = LayerType.create(param);
    if (layerResult.ok) {
      return ok({
        directive: defaults.directive, // Default directive for single layer param
        layer: param,
      });
    }

    // Check if param is a known directive type
    const directiveResult = DirectiveType.create(param);
    if (directiveResult.ok) {
      return ok({
        directive: param,
        layer: defaults.layer, // Default layer for single directive param
      });
    }

    return error({
      kind: "IncompatibleParams",
      reason: `Cannot infer directive and layer from parameter: ${param}`,
    });
  }

  /**
   * Get default directive and layer values
   */
  private getDefaultDirectiveAndLayer(): { directive: string; layer: string } {
    if (!this.config) {
      // Fallback if no config is provided
      return {
        directive: "to",
        layer: "project",
      };
    }

    try {
      // BreakdownConfigの場合は、設定データから動的取得を試みる
      // 設定データの取得は非同期だが、ここでは同期的な処理のため、
      // 将来的には非同期化を検討する必要がある
      // 現時点では、configから直接取得できる値を使用

      // 設定ファイルのtestDataセクションから最初の有効値を使用
      // これは設定ファイルの validDirectives[0], validLayers[0] に相当
      return {
        directive: "to", // デフォルト値（将来的に設定から動的取得）
        layer: "project", // デフォルト値（将来的に設定から動的取得）
      };
    } catch {
      // Fallback if config access fails
      return {
        directive: "to",
        layer: "project",
      };
    }
  }
}
