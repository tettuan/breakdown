/**
 * @fileoverview TwoParams Aggregate Root implementation (Optimized Version)
 *
 * TwoParams represents the core domain concept of Breakdown application:
 * the combination of DirectiveType (what to do) and LayerType (at which level).
 * This Aggregate Root follows DDD principles and Totality principle.
 *
 * Optimizations applied:
 * - Removed duplicate path resolution methods (50+ lines)
 * - Simplified over-engineered interfaces
 * - Made configuration values external
 * - Eliminated unnecessary abstractions
 *
 * @module domain/core/aggregates/two_params
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import { ConfigProfileName } from "$lib/types/config_profile_name.ts";
import { DirectiveType, type DirectiveTypeError } from "../value_objects/directive_type.ts";
import { LayerType, type LayerTypeError } from "../value_objects/layer_type.ts";
import type { BaseError } from "$lib/types/unified_error_types.ts";

/**
 * TwoParams validation errors following Discriminated Union pattern
 * Inherits from BaseError for unified error system compliance
 * Properly includes cause types from DirectiveTypeError and LayerTypeError
 */
export type TwoParamsValidationError =
  & BaseError
  & (
    | {
      kind: "InvalidDirective";
      directive: string;
      profile: string;
      pattern: string;
      cause: DirectiveTypeError;
      message: string;
    }
    | {
      kind: "InvalidLayer";
      layer: string;
      pattern: string;
      cause: LayerTypeError;
      message: string;
    }
    | {
      kind: "UnsupportedCombination";
      directive: string;
      layer: string;
      profile: string;
      message: string;
    }
    | { kind: "PatternNotFound"; profile: string; configPath: string; message: string }
  );

/**
 * Path configuration for TwoParams operations
 */
export interface PathConfig {
  readonly promptsDir: string;
  readonly schemasDir: string;
  readonly outputDir: string;
}

/**
 * TwoParams - DirectiveTypeとLayerTypeの組み合わせを表すAggregate Root
 *
 * ドメイン概念:
 * - Breakdownコマンドの中核的な処理単位
 * - 処理方向（DirectiveType）と階層（LayerType）の組み合わせ
 * - プロンプト生成とスキーマ解決のコンテキスト
 *
 * 設計理念:
 * - CLI引数からファイルシステムリソースへの橋渡し
 * - パターンバリデーションによる信頼性保証
 * - 型安全なパス解決の実現
 *
 * @example Basic usage
 * ```typescript
 * const profile = ConfigProfileName.createDefault();
 * const twoParamsResult = TwoParams.create("to", "issue", profile);
 * if (twoParamsResult.ok) {
 *   const twoParams = twoParamsResult.data;
 *   const promptPath = twoParams.resolvePromptPath("prompts", "issue");
 *   // Result: "prompts/to/issue/f_issue.md"
 * }
 * ```
 *
 * @example CLI integration
 * ```typescript
 * const twoParamsResult = TwoParams.createWithCliOption("to", "issue", null);
 * if (twoParamsResult.ok) {
 *   console.log(twoParamsResult.data.profile.value); // "default"
 * }
 * ```
 */
export class TwoParams {
  /**
   * Default path configuration
   */
  static readonly DEFAULT_CONFIG: PathConfig = {
    promptsDir: "prompts",
    schemasDir: "schemas",
    outputDir: "output",
  };

  /**
   * Private constructor following Smart Constructor pattern
   *
   * @param directive - Validated DirectiveType
   * @param layer - Validated LayerType
   * @param profile - Configuration profile
   */
  private constructor(
    private readonly _directive: DirectiveType,
    private readonly _layer: LayerType,
    private readonly _profile: ConfigProfileName,
  ) {
    Object.freeze(this);
  }

  /**
   * DirectiveType accessor
   */
  get directive(): DirectiveType {
    return this._directive;
  }

  /**
   * LayerType accessor
   */
  get layer(): LayerType {
    return this._layer;
  }

  /**
   * ConfigProfileName accessor
   */
  get profile(): ConfigProfileName {
    return this._profile;
  }

  /**
   * Smart Constructor for TwoParams creation
   *
   * Creates a validated TwoParams instance by combining DirectiveType and LayerType.
   * Follows Totality principle by handling all possible input cases.
   *
   * @param directive - Directive type string
   * @param layer - Layer type string
   * @param profile - Configuration profile
   * @returns Result with TwoParams or detailed error
   */
  static create(
    directive: string,
    layer: string,
    profile: ConfigProfileName,
  ): Result<TwoParams, TwoParamsValidationError> {
    // Validate DirectiveType
    const directiveResult = DirectiveType.create(directive, profile);
    if (!directiveResult.ok) {
      return error({
        kind: "InvalidDirective",
        directive,
        profile: profile.value,
        pattern: "ConfigProfileName pattern validation",
        cause: directiveResult.error,
        message: `DirectiveType validation failed: ${directiveResult.error.message}`,
      });
    }

    // Validate LayerType
    const layerResult = LayerType.create(layer);
    if (!layerResult.ok) {
      return error({
        kind: "InvalidLayer",
        layer,
        pattern: "LayerType pattern validation",
        cause: layerResult.error,
        message: `LayerType validation failed: ${layerResult.error.message}`,
      });
    }

    // Check combination compatibility
    const directiveType = directiveResult.data;
    const layerType = layerResult.data;

    if (!layerType.isValidForDirective(directiveType)) {
      return error({
        kind: "UnsupportedCombination",
        directive,
        layer,
        profile: profile.value,
        message:
          `Combination of directive "${directive}" and layer "${layer}" is not supported for profile "${profile.value}"`,
      });
    }

    // Success: create TwoParams
    return ok(new TwoParams(directiveType, layerType, profile));
  }

  /**
   * Create TwoParams with CLI option handling
   *
   * Convenience method that handles null/undefined profile options
   * by automatically applying default profile.
   *
   * @param directive - Directive type string
   * @param layer - Layer type string
   * @param profileOption - CLI profile option (null for default)
   * @returns Result with TwoParams or detailed error
   */
  static createWithCliOption(
    directive: string,
    layer: string,
    profileOption: string | null | undefined,
  ): Result<TwoParams, TwoParamsValidationError> {
    const profile = ConfigProfileName.fromCliOption(profileOption);
    return TwoParams.create(directive, layer, profile);
  }

  /**
   * Validate the current TwoParams state
   *
   * @returns Result indicating validation success or failure
   */
  validate(): Result<void, TwoParamsValidationError> {
    // Check if directive is still valid for the profile
    if (!this._directive.isValidForProfile(this._profile)) {
      return error({
        kind: "InvalidDirective",
        directive: this._directive.value,
        profile: this._profile.value,
        pattern: "Profile validation",
        cause: {
          kind: "PatternMismatch",
          value: this._directive.value,
          profile: this._profile.value,
          validDirectives: this._profile.getDirectiveTypes(),
          message: "Directive no longer valid for profile",
        } as DirectiveTypeError,
        message:
          `Directive "${this._directive.value}" is no longer valid for profile "${this._profile.value}"`,
      });
    }

    // Check if layer is still valid for the profile
    if (!this._layer.isValidForProfile(this._profile)) {
      return error({
        kind: "InvalidLayer",
        layer: this._layer.value,
        pattern: "Profile validation",
        cause: {
          kind: "PatternMismatch",
          value: this._layer.value,
          profile: this._profile.value,
          validLayers: this._profile.getLayerTypes(),
          message: "Layer no longer valid for profile",
        } as LayerTypeError,
        message:
          `Layer "${this._layer.value}" is no longer valid for profile "${this._profile.value}"`,
      });
    }

    // Check layer-directive compatibility
    if (!this._layer.isValidForDirective(this._directive)) {
      return error({
        kind: "UnsupportedCombination",
        directive: this._directive.value,
        layer: this._layer.value,
        profile: this._profile.value,
        message: "Layer and directive combination is no longer valid",
      });
    }

    return ok(undefined);
  }

  /**
   * Resolve prompt file path (Unified method)
   *
   * @param config - Path configuration (uses default if not provided)
   * @param fromLayerType - Source layer type context
   * @param adaptation - Optional adaptation modifier
   * @returns Complete prompt file path string
   */
  resolvePromptPath(
    config: PathConfig = TwoParams.DEFAULT_CONFIG,
    fromLayerType?: string,
    adaptation?: string,
  ): string {
    const fromLayer = fromLayerType || this._layer.value;
    const fileName = this._layer.getPromptFilename(fromLayer, adaptation);
    return `${config.promptsDir}/${this._directive.value}/${this._layer.value}/${fileName}`;
  }

  /**
   * Resolve schema file path (Unified method)
   *
   * @param config - Path configuration (uses default if not provided)
   * @returns Complete schema file path string
   */
  resolveSchemaPath(config: PathConfig = TwoParams.DEFAULT_CONFIG): string {
    const fileName = this._layer.getSchemaFilename();
    return `${config.schemasDir}/${this._directive.value}/${this._layer.value}/${fileName}`;
  }

  /**
   * Resolve output directory path
   *
   * @param config - Path configuration (uses default if not provided)
   * @returns Complete output directory path string
   */
  resolveOutputPath(config: PathConfig = TwoParams.DEFAULT_CONFIG): string {
    return `${config.outputDir}/${this._directive.value}/${this._layer.value}`;
  }

  /**
   * Get basic command info for external system integration
   * Simplified from the over-engineered BreakdownCommand interface
   *
   * @returns Simple object with command information
   */
  getCommandInfo(): {
    directive: string;
    layer: string;
    profile: string;
  } {
    return {
      directive: this._directive.value,
      layer: this._layer.value,
      profile: this._profile.value,
    };
  }

  /**
   * Generate BreakdownCommand structure for integration compatibility
   *
   * @returns BreakdownCommand compatible object
   */
  toCommand(): {
    command: string;
    directive: string;
    layer: string;
    profile: string;
    timestamp: Date;
  } {
    return {
      command: "breakdown",
      directive: this._directive.value,
      layer: this._layer.value,
      profile: this._profile.value,
      timestamp: new Date(),
    };
  }

  /**
   * Resolve prompt file path (Legacy compatibility method)
   *
   * @param promptsDir - Prompts directory base path
   * @param fromLayerType - Source layer type context
   * @param adaptation - Optional adaptation modifier
   * @returns Complete prompt file path string
   */
  resolvePromptFilePath(
    promptsDir: string = "prompts",
    fromLayerType?: string,
    adaptation?: string,
  ): string {
    return this.resolvePromptPath(
      { promptsDir, schemasDir: "schemas", outputDir: "output" },
      fromLayerType,
      adaptation,
    );
  }

  /**
   * Resolve schema file path (Legacy compatibility method)
   *
   * @param schemasDir - Schemas directory base path
   * @returns Complete schema file path string
   */
  resolveSchemaFilePath(schemasDir: string = "schemas"): string {
    return this.resolveSchemaPath({ promptsDir: "prompts", schemasDir, outputDir: "output" });
  }

  /**
   * Get PromptPath object for integration compatibility
   *
   * @param fromLayerType - Source layer type context
   * @returns PromptPath-like object
   */
  getPromptPath(fromLayerType?: string): {
    directive: string;
    layer: string;
    fromLayer: string;
    resolve: () => string;
  } {
    const fromLayer = fromLayerType || this._layer.value;
    return {
      directive: this._directive.value,
      layer: this._layer.value,
      fromLayer,
      resolve: () => this.resolvePromptPath(TwoParams.DEFAULT_CONFIG, fromLayer),
    };
  }

  /**
   * Get SchemaPath object for integration compatibility
   *
   * @returns SchemaPath-like object
   */
  getSchemaPath(): {
    directive: string;
    layer: string;
    resolve: () => string;
  } {
    return {
      directive: this._directive.value,
      layer: this._layer.value,
      resolve: () => this.resolveSchemaPath(TwoParams.DEFAULT_CONFIG),
    };
  }

  /**
   * Type-safe equality comparison
   *
   * @param other - Another TwoParams to compare
   * @returns true if all components are equal
   */
  equals(other: TwoParams): boolean {
    return (
      this._directive.equals(other._directive) &&
      this._layer.equals(other._layer) &&
      this._profile.equals(other._profile)
    );
  }

  /**
   * String representation
   */
  toString(): string {
    return `${this._directive.value} ${this._layer.value}`;
  }

  /**
   * Get detailed information for debugging
   */
  toDebugString(): string {
    return `TwoParams(directive="${this._directive.value}", layer="${this._layer.value}", profile="${this._profile.value}")`;
  }
}
