/**
 * @fileoverview TwoParams Aggregate Root implementation
 *
 * TwoParams represents the core domain concept of Breakdown application:
 * the combination of DirectiveType (what to do) and LayerType (at which level).
 * This Aggregate Root follows DDD principles and Totality principle.
 *
 * @module domain/core/aggregates/two_params
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import { ConfigProfileName } from "$lib/types/config_profile_name.ts";
import { DirectiveType, type DirectiveTypeError } from "../value_objects/directive_type.ts";
import { LayerType, type LayerTypeError } from "../value_objects/layer_type.ts";

/**
 * TwoParams validation errors following Discriminated Union pattern
 */
export type TwoParamsValidationError =
  | { kind: "InvalidDirective"; directive: string; profile: string; pattern: string; cause: DirectiveTypeError }
  | { kind: "InvalidLayer"; layer: string; pattern: string; cause: LayerTypeError }
  | { kind: "UnsupportedCombination"; directive: string; layer: string; profile: string; message: string }
  | { kind: "PatternNotFound"; profile: string; configPath: string; message: string };

/**
 * BreakdownCommand representation for external systems
 */
export interface BreakdownCommand {
  readonly command: "breakdown";
  readonly directive: string;
  readonly layer: string;
  readonly profile: string;
  readonly timestamp: Date;
}

/**
 * PromptPath for path resolution
 */
export interface PromptPath {
  readonly baseDir: string;
  readonly directive: string;
  readonly layer: string;
  readonly fromLayer: string;
  readonly adaptation?: string;
  resolve(): string;
  resolveWithAdaptation(adaptation: string): string;
}

/**
 * SchemaPath for schema file resolution
 */
export interface SchemaPath {
  readonly baseDir: string;
  readonly directive: string;
  readonly layer: string;
  readonly schemaFile: string;
  resolve(): string;
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
 *   const promptPath = twoParams.resolvePromptFilePath("prompts", "issue");
 *   // Result: "prompts/to/issue/f_issue.md"
 * }
 * ```
 * 
 * @example CLI integration
 * ```typescript
 * const twoParamsResult = TwoParams.createWithCliOption("to", "issue", null);
 * if (twoParamsResult.ok) {
 *   console.log(twoParamsResult.data.profile.value); // "default"
 *   console.log(twoParamsResult.data.toCommand().command); // "breakdown"
 * }
 * ```
 */
export class TwoParams {
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
        message: `Combination of directive "${directive}" and layer "${layer}" is not supported for profile "${profile.value}"`,
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
   * Convert to BreakdownCommand representation
   * 
   * @returns BreakdownCommand for external system integration
   */
  toCommand(): BreakdownCommand {
    return {
      command: "breakdown",
      directive: this._directive.value,
      layer: this._layer.value,
      profile: this._profile.value,
      timestamp: new Date(),
    };
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
        },
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
   * Get PromptPath for this TwoParams
   * 
   * @param fromLayerType - Source layer type context
   * @param adaptation - Optional adaptation modifier
   * @returns PromptPath instance
   */
  getPromptPath(fromLayerType?: string, adaptation?: string): PromptPath {
    const fromLayer = fromLayerType || this._layer.value;
    return {
      baseDir: "prompts", // Default, should be configurable
      directive: this._directive.value,
      layer: this._layer.value,
      fromLayer,
      adaptation,
      resolve: () => {
        const fileName = this._layer.getPromptFilename(fromLayer, adaptation);
        return `prompts/${this._directive.value}/${this._layer.value}/${fileName}`;
      },
      resolveWithAdaptation: (adaptationParam: string) => {
        const fileName = this._layer.getPromptFilename(fromLayer, adaptationParam);
        return `prompts/${this._directive.value}/${this._layer.value}/${fileName}`;
      },
    };
  }

  /**
   * Get SchemaPath for this TwoParams
   * 
   * @returns SchemaPath instance
   */
  getSchemaPath(): SchemaPath {
    return {
      baseDir: "schemas", // Default, should be configurable
      directive: this._directive.value,
      layer: this._layer.value,
      schemaFile: this._layer.getSchemaFilename(),
      resolve: () => {
        const fileName = this._layer.getSchemaFilename();
        return `schemas/${this._directive.value}/${this._layer.value}/${fileName}`;
      },
    };
  }

  /**
   * Resolve prompt file path
   * 
   * @param baseDir - Base directory for prompts
   * @param fromLayerType - Source layer type context
   * @param adaptation - Optional adaptation modifier
   * @returns Complete file path string
   */
  resolvePromptFilePath(
    baseDir: string,
    fromLayerType?: string,
    adaptation?: string,
  ): string {
    const fromLayer = fromLayerType || this._layer.value;
    const fileName = this._layer.getPromptFilename(fromLayer, adaptation);
    return `${baseDir}/${this._directive.value}/${this._layer.value}/${fileName}`;
  }

  /**
   * Resolve schema file path
   * 
   * @param baseDir - Base directory for schemas
   * @returns Complete file path string
   */
  resolveSchemaFilePath(baseDir: string): string {
    const fileName = this._layer.getSchemaFilename();
    return `${baseDir}/${this._directive.value}/${this._layer.value}/${fileName}`;
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