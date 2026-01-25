/**
 * @fileoverview JSR Direct Integration TypePatternProvider implementation
 *
 * Direct integration with BreakdownParams JSR package to eliminate TypePatternProvider dependency.
 * Achieves a simple flow: Config file -> BreakdownParams -> Direct pattern provision.
 *
 * @module config/jsr_pattern_provider
 */

import type { CustomConfig } from "../deps.ts";
import { DEFAULT_CUSTOM_CONFIG } from "../deps.ts";
import type { Result } from "../types/result.ts";
import { error as resultError, ok as resultOk } from "../types/result.ts";

/**
 * JSR Integration Pattern Provider
 *
 * Direct integration with BreakdownParams JSR package to eliminate TypePatternProvider dependency.
 * Simplifies AsyncConfigPatternProvider's 583 lines of code to under 100 lines.
 */
export class JSRPatternProvider {
  private customConfig: CustomConfig;
  private _initialized = false;

  /**
   * Private constructor - Use create() factory method
   */
  private constructor(customConfig: CustomConfig) {
    this.customConfig = customConfig;
    // Remove BreakdownParams dependency - JSRPatternProvider works directly with CustomConfig
  }

  /**
   * Factory method - Create and initialize JSRPatternProvider
   *
   * @param customConfig - Custom configuration for BreakdownParams
   * @returns JSRPatternProvider instance
   */
  static create(customConfig?: CustomConfig): Result<JSRPatternProvider, string> {
    try {
      const config = customConfig || DEFAULT_CUSTOM_CONFIG;
      const provider = new JSRPatternProvider(config);
      provider._initialized = true;
      return resultOk(provider);
    } catch (error) {
      return resultError(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Validate DirectiveType
   * Directly uses pattern from CustomConfig
   */
  validateDirectiveType(value: string): boolean {
    if (!this._initialized) return false;

    try {
      const pattern = this.customConfig?.params?.two?.directiveType?.pattern;
      if (!pattern) return false;

      const regex = new RegExp(`^(${pattern})$`);
      return regex.test(value);
    } catch {
      return false;
    }
  }

  /**
   * Validate LayerType
   * Directly uses pattern from CustomConfig
   */
  validateLayerType(value: string): boolean {
    if (!this._initialized) return false;

    try {
      const pattern = this.customConfig?.params?.two?.layerType?.pattern;
      if (!pattern) return false;

      const regex = new RegExp(`^(${pattern})$`);
      return regex.test(value);
    } catch {
      return false;
    }
  }

  /**
   * Get available DirectiveType values
   * Extracts patterns directly from custom config
   */
  getValidDirectiveTypes(): readonly string[] {
    if (!this._initialized || !this.customConfig.params?.two?.directiveType?.pattern) {
      return [];
    }

    const pattern = this.customConfig.params.two.directiveType.pattern;
    return this.extractValuesFromPattern(pattern);
  }

  /**
   * Get available LayerType values
   * Extracts patterns directly from custom config
   */
  getValidLayerTypes(): readonly string[] {
    if (!this._initialized || !this.customConfig.params?.two?.layerType?.pattern) {
      return [];
    }

    const pattern = this.customConfig.params.two.layerType.pattern;
    return this.extractValuesFromPattern(pattern);
  }

  /**
   * Get DirectiveType pattern object
   * For TypePatternProvider compatibility
   */
  getDirectivePattern(): { test(value: string): boolean; getPattern(): string } | null {
    if (!this._initialized || !this.customConfig.params?.two?.directiveType?.pattern) {
      return null;
    }

    const pattern = this.customConfig.params.two.directiveType.pattern;
    const regex = new RegExp(`^(${pattern})$`);

    return {
      test: (value: string) => regex.test(value),
      getPattern: () => pattern,
    };
  }

  /**
   * Get LayerType pattern object
   * For TypePatternProvider compatibility
   */
  getLayerTypePattern(): { test(value: string): boolean; getPattern(): string } | null {
    if (!this._initialized || !this.customConfig.params?.two?.layerType?.pattern) {
      return null;
    }

    const pattern = this.customConfig.params.two.layerType.pattern;
    const regex = new RegExp(`^(${pattern})$`);

    return {
      test: (value: string) => regex.test(value),
      getPattern: () => pattern,
    };
  }

  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Extract values from pattern string
   * Extracts ["value1", "value2", "value3"] from regex pattern "^(value1|value2|value3)$"
   */
  private extractValuesFromPattern(pattern: string): readonly string[] {
    const match = pattern.match(/^\^?\(([^)]+)\)\$?$/);
    if (match && match[1]) {
      return Object.freeze(
        match[1].split("|")
          .map((v) => v.trim())
          .filter((v) => v.length > 0),
      );
    }
    return Object.freeze([]);
  }

  /**
   * Get debug information
   */
  debug(): {
    initialized: boolean;
    hasDirectivePattern: boolean;
    hasLayerTypePattern: boolean;
    directivePattern: string | null;
    layerTypePattern: string | null;
  } {
    return {
      initialized: this._initialized,
      hasDirectivePattern: !!this.customConfig.params?.two?.directiveType?.pattern,
      hasLayerTypePattern: !!this.customConfig.params?.two?.layerType?.pattern,
      directivePattern: this.customConfig.params?.two?.directiveType?.pattern || null,
      layerTypePattern: this.customConfig.params?.two?.layerType?.pattern || null,
    };
  }
}

/**
 * Factory function compatible with BreakdownConfig
 * Replacement for AsyncConfigPatternProvider
 */
export function createJSRPatternProvider(
  customConfig?: CustomConfig,
): JSRPatternProvider {
  const result = JSRPatternProvider.create(customConfig);

  if (result.ok) {
    return result.data;
  }

  throw new Error(`Failed to create JSR pattern provider: ${result.error}`);
}
