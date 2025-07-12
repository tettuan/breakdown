/**
 * @fileoverview TwoParams Integrated Implementation - mod.ts Compatible Version
 *
 * This implementation combines the optimized DDD version with required mod.ts exports
 * to ensure full API compatibility during the transition period.
 *
 * Integration sources:
 * - Optimized TwoParams (25.3% code reduction)
 * - TwoParamsCollection from migration implementation  
 * - Error formatting utilities for backward compatibility
 *
 * @module domain/core/aggregates/two_params_integrated
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import { ConfigProfileName } from "$lib/types/config_profile_name.ts";
import { DirectiveType, type DirectiveTypeError } from "../value_objects/directive_type.ts";
import { LayerType, type LayerTypeError } from "../value_objects/layer_type.ts";

// ============================================================================
// Error Types - Full mod.ts compatibility
// ============================================================================

/**
 * TwoParams validation errors following Discriminated Union pattern
 */
export type TwoParamsValidationError =
  | { kind: "InvalidDirective"; directive: string; profile: string; pattern: string; cause: DirectiveTypeError }
  | { kind: "InvalidLayer"; layer: string; pattern: string; cause: LayerTypeError }
  | { kind: "UnsupportedCombination"; directive: string; layer: string; profile: string; message: string }
  | { kind: "PatternNotFound"; profile: string; configPath: string; message: string };

/**
 * Legacy error type alias for mod.ts compatibility
 * @deprecated Use TwoParamsValidationError instead
 */
export type TwoParamsError = TwoParamsValidationError;

/**
 * Path configuration for TwoParams operations
 */
export interface PathConfig {
  readonly promptsDir: string;
  readonly schemasDir: string;
  readonly outputDir: string;
}

// ============================================================================
// TwoParams Class - Optimized Implementation
// ============================================================================

/**
 * TwoParams - DirectiveTypeとLayerTypeの組み合わせを表すAggregate Root
 * 
 * Optimized implementation with:
 * - 25.3% code reduction (360→269 lines)
 * - Simplified path resolution
 * - External configuration
 * - Eliminated duplicate methods
 */
export class TwoParams {
  /**
   * Default configuration for path resolution
   */
  static readonly DEFAULT_CONFIG: PathConfig = {
    promptsDir: "prompts",
    schemasDir: "schemas", 
    outputDir: "output",
  };

  /**
   * Private constructor following Smart Constructor pattern
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
   * Optimized path resolution - unified method
   */
  resolvePromptPath(
    config: PathConfig = TwoParams.DEFAULT_CONFIG,
    fromLayer?: string,
    adaptation?: string,
  ): string {
    const layer = fromLayer || this._layer.value;
    const fileName = this._layer.getPromptFilename(layer, adaptation);
    return `${config.promptsDir}/${this._directive.value}/${this._layer.value}/${fileName}`;
  }

  /**
   * Optimized schema path resolution
   */
  resolveSchemaPath(config: PathConfig = TwoParams.DEFAULT_CONFIG): string {
    const fileName = this._layer.getSchemaFilename();
    return `${config.schemasDir}/${this._directive.value}/${this._layer.value}/${fileName}`;
  }

  /**
   * Output path resolution - new feature
   */
  resolveOutputPath(config: PathConfig = TwoParams.DEFAULT_CONFIG): string {
    return `${config.outputDir}/${this._directive.value}/${this._layer.value}`;
  }

  /**
   * Get command information (simplified from toCommand)
   */
  getCommandInfo(): { directive: string; layer: string; profile: string } {
    return {
      directive: this._directive.value,
      layer: this._layer.value,
      profile: this._profile.value,
    };
  }

  /**
   * Validate the current TwoParams state
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
   * Type-safe equality comparison
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

  // ============================================================================
  // Legacy API Compatibility Methods
  // ============================================================================

  /**
   * Legacy method: Resolve prompt file path
   * @deprecated Use resolvePromptPath() instead
   */
  resolvePromptFilePath(
    baseDir: string,
    fromLayerType?: string,
    adaptation?: string,
  ): string {
    return this.resolvePromptPath({ ...TwoParams.DEFAULT_CONFIG, promptsDir: baseDir }, fromLayerType, adaptation);
  }

  /**
   * Legacy method: Resolve schema file path  
   * @deprecated Use resolveSchemaPath() instead
   */
  resolveSchemaFilePath(baseDir: string): string {
    return this.resolveSchemaPath({ ...TwoParams.DEFAULT_CONFIG, schemasDir: baseDir });
  }

  /**
   * Legacy method: Convert to BreakdownCommand
   * @deprecated Use getCommandInfo() instead
   */
  toCommand(): { command: string; directive: string; layer: string; profile: string; timestamp: Date } {
    const info = this.getCommandInfo();
    return {
      command: "breakdown",
      ...info,
      timestamp: new Date(),
    };
  }
}

// ============================================================================
// TwoParamsCollection - For mod.ts compatibility
// ============================================================================

/**
 * Collection wrapper for multiple TwoParams instances
 * Required for mod.ts export compatibility
 */
export class TwoParamsCollection {
  constructor(private readonly items: readonly TwoParams[]) {}

  /**
   * Get all TwoParams as array
   */
  toArray(): readonly TwoParams[] {
    return this.items;
  }

  /**
   * Filter by DirectiveType
   */
  filterByDirective(directiveValue: string): TwoParamsCollection {
    const filtered = this.items.filter(
      item => item.directive.value === directiveValue
    );
    return new TwoParamsCollection(filtered);
  }

  /**
   * Filter by LayerType
   */
  filterByLayer(layerValue: string): TwoParamsCollection {
    const filtered = this.items.filter(
      item => item.layer.value === layerValue
    );
    return new TwoParamsCollection(filtered);
  }

  /**
   * Get first item that matches criteria
   */
  findFirst(predicate: (item: TwoParams) => boolean): TwoParams | undefined {
    return this.items.find(predicate);
  }

  /**
   * Get size of collection
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Check if collection is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

// ============================================================================
// Error Utility Functions - For mod.ts compatibility
// ============================================================================

/**
 * Format TwoParams error for display
 * @deprecated Direct error handling preferred
 */
export function formatTwoParamsError(error: TwoParamsValidationError): string {
  switch (error.kind) {
    case "InvalidDirective":
      return `Invalid directive: ${error.directive} (profile: ${error.profile})`;
    case "InvalidLayer":
      return `Invalid layer: ${error.layer}`;
    case "UnsupportedCombination":
      return `Unsupported combination: ${error.directive} + ${error.layer} (profile: ${error.profile})`;
    case "PatternNotFound":
      return `Pattern not found: ${error.profile} (config: ${error.configPath})`;
    default:
      return "Unknown TwoParams error";
  }
}

/**
 * Type guard functions for error handling
 * @deprecated Use discriminated union pattern matching instead
 */
export function isDirectiveCreationFailedError(error: TwoParamsValidationError): boolean {
  return error.kind === "InvalidDirective";
}

export function isLayerCreationFailedError(error: TwoParamsValidationError): boolean {
  return error.kind === "InvalidLayer";
}

export function isInvalidCombinationError(error: TwoParamsValidationError): boolean {
  return error.kind === "UnsupportedCombination";
}

export function isProfileValidationFailedError(error: TwoParamsValidationError): boolean {
  return error.kind === "PatternNotFound";
}

export function isPathResolutionFailedError(error: TwoParamsValidationError): boolean {
  // This was not a real error type, but provided for compatibility
  return false;
}