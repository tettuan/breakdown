/**
 * @fileoverview JSRPatternAdapter - Complete TypePatternProvider Implementation
 *
 * Uses CustomConfig from @tettuan/breakdownparams to fully implement the
 * TypePatternProvider interface. Replaces all functionality of AsyncConfigPatternProvider.
 *
 * @module config/jsr_pattern_adapter
 */

import type { TypePatternProvider } from "./pattern_provider.ts";
import type { CustomConfig } from "../deps.ts";
import { DEFAULT_CUSTOM_CONFIG } from "../deps.ts";
import type { Result } from "../types/result.ts";
import { error as resultError, ok as resultOk } from "../types/result.ts";

/**
 * JSRPatternAdapter Error Types
 */
export type JSRPatternAdapterError =
  | { kind: "InitializationFailed"; message: string }
  | { kind: "ConfigurationInvalid"; message: string }
  | { kind: "PatternExtractionFailed"; patternType: "directive" | "layer" };

/**
 * JSRPatternAdapter - Complete TypePatternProvider Implementation
 *
 * Implements all AsyncConfigPatternProvider functionality using @tettuan/breakdownparams directly.
 * Completely replaces the 583-line AsyncConfigPatternProvider with under 150 lines.
 */
export class JSRPatternAdapter implements TypePatternProvider {
  private customConfig: CustomConfig;
  private _initialized = false;

  // Pattern cache (TypePatternProvider compatible)
  private _directivePattern: { test(value: string): boolean; getPattern(): string } | null = null;
  private _layerTypePattern: { test(value: string): boolean; getPattern(): string } | null = null;

  /**
   * Private constructor - Use create() factory method
   */
  private constructor(customConfig: CustomConfig) {
    this.customConfig = customConfig;
  }

  /**
   * Factory method - Create and initialize JSRPatternAdapter
   *
   * @param customConfig - Custom configuration for BreakdownParams
   * @returns JSRPatternAdapter instance
   */
  static create(
    customConfig?: CustomConfig,
  ): Result<JSRPatternAdapter, JSRPatternAdapterError> {
    try {
      const config = customConfig || DEFAULT_CUSTOM_CONFIG;
      const adapter = new JSRPatternAdapter(config);

      // Initialization process
      const initResult = adapter.initialize();
      if (!initResult.ok) {
        return resultError(initResult.error);
      }

      return resultOk(adapter);
    } catch (error) {
      return resultError({
        kind: "InitializationFailed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Initialize adapter
   */
  private initialize(): Result<void, JSRPatternAdapterError> {
    try {
      // Validate configuration
      if (!this.customConfig.params?.two) {
        return resultError({
          kind: "ConfigurationInvalid",
          message: "CustomConfig.params.two is required for JSRPatternAdapter",
        });
      }

      // Initialize pattern cache
      this.initializePatterns();

      this._initialized = true;
      return resultOk(undefined);
    } catch (error) {
      return resultError({
        kind: "InitializationFailed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Initialize pattern cache
   */
  private initializePatterns(): void {
    // Initialize DirectiveType pattern
    const directivePattern = this.customConfig.params?.two?.directiveType?.pattern;
    if (directivePattern) {
      const regex = new RegExp(`^(${directivePattern})$`);
      this._directivePattern = {
        test: (value: string) => regex.test(value),
        getPattern: () => directivePattern,
      };
    }

    // Initialize LayerType pattern
    const layerPattern = this.customConfig.params?.two?.layerType?.pattern;
    if (layerPattern) {
      const regex = new RegExp(`^(${layerPattern})$`);
      this._layerTypePattern = {
        test: (value: string) => regex.test(value),
        getPattern: () => layerPattern,
      };
    }
  }

  /**
   * Get validation result for DirectiveType
   * TypePatternProvider implementation method
   */
  validateDirectiveType(value: string): boolean {
    if (!this._initialized || !this._directivePattern) {
      return false;
    }
    return this._directivePattern.test(value);
  }

  /**
   * Get validation result for LayerType
   * TypePatternProvider implementation method
   */
  validateLayerType(value: string): boolean {
    if (!this._initialized || !this._layerTypePattern) {
      return false;
    }
    return this._layerTypePattern.test(value);
  }

  /**
   * Get available DirectiveType values
   * TypePatternProvider implementation method
   */
  getValidDirectiveTypes(): readonly string[] {
    if (!this._initialized || !this._directivePattern) {
      return Object.freeze([]);
    }

    const pattern = this._directivePattern.getPattern();
    return this.extractValuesFromPattern(pattern);
  }

  /**
   * Get available LayerType values
   * TypePatternProvider implementation method
   */
  getValidLayerTypes(): readonly string[] {
    if (!this._initialized || !this._layerTypePattern) {
      return Object.freeze([]);
    }

    const pattern = this._layerTypePattern.getPattern();
    return this.extractValuesFromPattern(pattern);
  }

  /**
   * Get pattern object for DirectiveType
   * TypePatternProvider implementation method
   */
  getDirectivePattern(): { test(value: string): boolean; getPattern(): string } | null {
    return this._directivePattern;
  }

  /**
   * Get pattern object for LayerType
   * TypePatternProvider implementation method
   */
  getLayerTypePattern(): { test(value: string): boolean; getPattern(): string } | null {
    return this._layerTypePattern;
  }

  /**
   * Check initialization status
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Check if both patterns are valid
   * AsyncConfigPatternProvider compatible method
   */
  hasValidPatterns(): boolean {
    return this._directivePattern !== null && this._layerTypePattern !== null;
  }

  /**
   * Clear pattern cache
   * AsyncConfigPatternProvider compatible method
   */
  clearCache(): void {
    this._directivePattern = null;
    this._layerTypePattern = null;
    this.initializePatterns();
  }

  /**
   * Get all patterns
   * AsyncConfigPatternProvider compatible method
   */
  getAllPatterns(): Result<
    {
      directive: { test(value: string): boolean; getPattern(): string } | null;
      layer: { test(value: string): boolean; getPattern(): string } | null;
    },
    JSRPatternAdapterError
  > {
    if (!this._initialized) {
      return resultError({
        kind: "InitializationFailed",
        message: "JSRPatternAdapter not initialized",
      });
    }

    return resultOk({
      directive: this._directivePattern,
      layer: this._layerTypePattern,
    });
  }

  /**
   * Extract values from pattern string
   * Extracts ["value1", "value2", "value3"] from regex pattern "^(value1|value2|value3)$"
   */
  private extractValuesFromPattern(pattern: string): readonly string[] {
    // Supports regex pattern "^(value1|value2|value3)$" or "value1|value2|value3" format
    let valuePart: string | undefined;

    // Check for parenthesized pattern
    const bracketMatch = pattern.match(/^\^?\(([^)]+)\)\$?$/);
    if (bracketMatch && bracketMatch[1]) {
      valuePart = bracketMatch[1];
    } else {
      // Also support direct value pattern (without parentheses)
      valuePart = pattern;
    }

    if (valuePart) {
      return Object.freeze(
        valuePart.split("|")
          .map((v) => v.trim())
          .filter((v) => v.length > 0),
      );
    }

    return Object.freeze([]);
  }

  /**
   * Get debug information
   * AsyncConfigPatternProvider compatible method (fully compatible version)
   */
  debug(): {
    initialized: boolean;
    hasConfigData: boolean;
    hasDirectivePattern: boolean;
    hasLayerTypePattern: boolean;
    cacheStatus: {
      directive: "cached" | "null" | "not_loaded";
      layer: "cached" | "null" | "not_loaded";
    };
    directivePattern?: string | null;
    layerTypePattern?: string | null;
    validDirectives?: readonly string[];
    validLayers?: readonly string[];
  } {
    return {
      initialized: this._initialized,
      hasConfigData: !!this.customConfig,
      hasDirectivePattern: this._directivePattern !== null,
      hasLayerTypePattern: this._layerTypePattern !== null,
      cacheStatus: {
        directive: this._directivePattern === null ? "null" : "cached",
        layer: this._layerTypePattern === null ? "null" : "cached",
      },
      directivePattern: this._directivePattern?.getPattern() || null,
      layerTypePattern: this._layerTypePattern?.getPattern() || null,
      validDirectives: this.getValidDirectiveTypes(),
      validLayers: this.getValidLayerTypes(),
    };
  }
}

/**
 * AsyncConfigPatternProvider compatible factory function
 * Used for replacing AsyncConfigPatternProvider
 */
export function createJSRPatternAdapter(
  customConfig?: CustomConfig,
): JSRPatternAdapter {
  const result = JSRPatternAdapter.create(customConfig);

  if (result.ok) {
    return result.data;
  }

  const errorMessage = "message" in result.error ? result.error.message : result.error.kind;
  throw new Error(`Failed to create JSR pattern adapter: ${errorMessage}`);
}

/**
 * Factory function for creating TypePatternProvider
 * Ensures compatibility with existing code
 */
export function createTypePatternProvider(
  customConfig?: CustomConfig,
): Promise<TypePatternProvider> {
  return Promise.resolve(createJSRPatternAdapter(customConfig));
}
