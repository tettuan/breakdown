/**
 * @fileoverview TwoParams Optimized Implementation
 *
 * This module provides the TwoParams implementation by importing from
 * @tettuan/breakdownparams package, following the principle that
 * the main Breakdown application should delegate parameter parsing
 * responsibilities to the dedicated BreakdownParams package.
 *
 * @module domain/core/aggregates/two_params_optimized
 */

// Import base types from BreakdownParams package
import { type BaseTwoParamsResult } from "../../../deps.ts";
import { DirectiveType } from "../value_objects/directive_type.ts";
import { LayerType } from "../value_objects/layer_type.ts";
import { join } from "../../../deps.ts";
import type { Result } from "../../../types/result.ts";
import { error, ok } from "../../../types/result.ts";

// PathConfig type definition for parameter configuration
export interface PathConfig {
  /** Working directory path */
  workDir?: string;
  /** Resource directory path */
  resourceDir?: string;
}

// TwoParams validation error type
export interface TwoParamsValidationError {
  kind: string;
  message: string;
  code?: string;
  directive?: string;
  layer?: string;
  configPath?: string;
}

// TwoParams implementation using ParamsParser
export class TwoParams {
  private _directive?: DirectiveType;
  private _layer?: LayerType;
  private _profile?: { value: string };

  constructor(
    public readonly directiveType: string,
    public readonly layerType: string,
  ) {}

  static create(
    directiveType: string,
    layerType: string,
  ): Result<TwoParams, TwoParamsValidationError> {
    // Basic validation
    if (!directiveType?.trim()) {
      return error({
        kind: "ValidationFailed",
        message: "DirectiveType is required",
        directive: directiveType,
      });
    }
    if (!layerType?.trim()) {
      return error({
        kind: "ValidationFailed",
        message: "LayerType is required",
        layer: layerType,
      });
    }

    return ok(new TwoParams(directiveType.trim(), layerType.trim()));
  }

  static fromParamsResult(result: BaseTwoParamsResult): TwoParams {
    // TwoParamsResult contains params as string array: [directiveType, layerType]
    if (
      "params" in result && result.params && Array.isArray(result.params) &&
      result.params.length >= 2
    ) {
      const createResult = TwoParams.create(
        result.params[0], // directiveType
        result.params[1], // layerType
      );
      if (!createResult.ok) {
        throw new Error(`Failed to create TwoParams: ${createResult.error.message}`);
      }
      return createResult.data;
    }

    // Handle error case
    const errorMsg = "error" in result && result.error
      ? (typeof result.error === "string" ? result.error : result.error.message || "Unknown error")
      : "Invalid parameters format";
    throw new Error(`Failed to create TwoParams: ${errorMsg}`);
  }

  static createWithCliOption(
    directiveType: string,
    layerType: string,
    _options?: string | null,
  ): Result<TwoParams, TwoParamsValidationError> {
    return TwoParams.create(directiveType, layerType);
  }

  get directive(): DirectiveType {
    if (!this._directive) {
      const result = DirectiveType.create(this.directiveType);
      if (!result.ok) {
        throw new Error(`Failed to create DirectiveType: ${result.error}`);
      }
      this._directive = result.data;
    }
    return this._directive;
  }

  get layer(): LayerType {
    if (!this._layer) {
      const result = LayerType.create(this.layerType);
      if (!result.ok) {
        throw new Error(`Failed to create LayerType: ${result.error}`);
      }
      this._layer = result.data;
    }
    return this._layer;
  }

  get profile(): { value: string } {
    if (!this._profile) {
      this._profile = { value: "default" };
    }
    return this._profile;
  }

  resolvePromptFilePath(baseDir: string): string {
    return join(baseDir, this.directiveType, this.layerType, `f_${this.layerType}.md`);
  }

  resolveSchemaFilePath(baseDir: string): string {
    return join(baseDir, this.directiveType, this.layerType, `f_${this.layerType}.json`);
  }

  validate(): Result<boolean, TwoParamsValidationError> {
    // Validate directiveType
    const directiveResult = DirectiveType.create(this.directiveType);
    if (!directiveResult.ok) {
      return error({
        kind: "DirectiveTypeValidationError",
        message: "DirectiveType validation failed",
        directive: this.directiveType,
      });
    }

    // Validate layerType
    const layerResult = LayerType.create(this.layerType);
    if (!layerResult.ok) {
      return error({
        kind: "LayerTypeValidationError",
        message: "LayerType validation failed",
        layer: this.layerType,
      });
    }

    return ok(true);
  }
}
