/**
 * @fileoverview Async-safe TypePatternProvider implementation for BreakdownConfig
 *
 * This module provides the async-safe implementation of TypePatternProvider that
 * properly handles asynchronous configuration loading. It replaces the problematic
 * sync/async mixed approach with a proper async initialization pattern.
 *
 * @module config/pattern_provider_async
 */

import { BreakdownConfig } from "@tettuan/breakdownconfig";
import type { TypePatternProvider } from "../types/type_factory.ts";
import { TwoParamsDirectivePattern } from "../domain/core/value_objects/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../domain/core/value_objects/layer_type.ts";
import { error as resultError, ok as resultOk, type Result } from "../types/result.ts";

/**
 * Configuration structure for validation patterns
 */
interface PatternConfig {
  directivePattern?: string;
  layerTypePattern?: string;
  twoParamsRules?: {
    directive?: {
      pattern?: string;
      errorMessage?: string;
    };
    layer?: {
      pattern?: string;
      errorMessage?: string;
    };
  };
}

/**
 * Pattern provider errors
 */
export type PatternProviderError =
  | { kind: "ConfigLoadFailed"; message: string }
  | { kind: "PatternCreationFailed"; patternType: "directive" | "layer"; pattern: string }
  | { kind: "NotInitialized" };

/**
 * Async-safe BreakdownConfig-based implementation of TypePatternProvider
 *
 * This class properly handles asynchronous configuration loading through
 * an explicit initialization phase, eliminating the sync/async mixing issues.
 */
export class AsyncConfigPatternProvider implements TypePatternProvider {
  private config: BreakdownConfig;
  private configData?: Record<string, unknown>;
  private _patternCache: {
    directive: TwoParamsDirectivePattern | null | undefined;
    layer: TwoParamsLayerTypePattern | null | undefined;
  } = {
    directive: undefined,
    layer: undefined,
  };
  private _initialized = false;

  /**
   * Private constructor - use create() factory method
   */
  private constructor(config: BreakdownConfig) {
    this.config = config;
  }

  /**
   * Factory method to create and initialize AsyncConfigPatternProvider
   */
  static async create(
    configSetName: string = "default",
    workspacePath: string = Deno.cwd(),
  ): Promise<Result<AsyncConfigPatternProvider, PatternProviderError>> {
    try {
      // Create BreakdownConfig
      const configResult = await BreakdownConfig.create(configSetName, workspacePath);
      if (!configResult.success) {
        return resultError({
          kind: "ConfigLoadFailed",
          message: `Failed to create BreakdownConfig: ${configResult.error}`,
        });
      }

      const config = configResult.data;
      await config.loadConfig();

      // Create provider instance
      const provider = new AsyncConfigPatternProvider(config);

      // Initialize with configuration data
      const initResult = await provider.initialize();
      if (!initResult.ok) {
        return resultError(initResult.error);
      }

      return resultOk(provider);
    } catch (error) {
      return resultError({
        kind: "ConfigLoadFailed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Initialize the provider with configuration data
   */
  private async initialize(): Promise<Result<void, PatternProviderError>> {
    try {
      this.configData = await this.config.getConfig();
      this._initialized = true;
      return resultOk(undefined);
    } catch (error) {
      return resultError({
        kind: "ConfigLoadFailed",
        message: `Failed to load configuration: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  /**
   * Retrieves DirectiveType validation pattern from configuration
   */
  getDirectivePattern(): TwoParamsDirectivePattern | null {
    if (!this._initialized || !this.configData) {
      console.warn("AsyncConfigPatternProvider not initialized");
      return null;
    }

    if (this._patternCache.directive !== undefined) {
      return this._patternCache.directive;
    }

    try {
      const patternString = this.extractDirectivePatternString(this.configData);
      if (!patternString) {
        this._patternCache.directive = null;
        return null;
      }

      const pattern = TwoParamsDirectivePattern.create(patternString);
      this._patternCache.directive = pattern;
      return pattern;
    } catch (error) {
      console.warn("Failed to load directive pattern from config:", error);
      this._patternCache.directive = null;
      return null;
    }
  }

  /**
   * Retrieves LayerType validation pattern from configuration
   */
  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    if (!this._initialized || !this.configData) {
      console.warn("AsyncConfigPatternProvider not initialized");
      return null;
    }

    if (this._patternCache.layer !== undefined) {
      return this._patternCache.layer;
    }

    try {
      const patternString = this.extractLayerTypePatternString(this.configData);
      if (!patternString) {
        this._patternCache.layer = null;
        return null;
      }

      const pattern = TwoParamsLayerTypePattern.create(patternString);
      this._patternCache.layer = pattern;
      return pattern;
    } catch (error) {
      console.warn("Failed to load layer type pattern from config:", error);
      this._patternCache.layer = null;
      return null;
    }
  }

  /**
   * Checks if both patterns are available and valid
   */
  hasValidPatterns(): boolean {
    return this.getDirectivePattern() !== null && this.getLayerTypePattern() !== null;
  }

  /**
   * Clears the pattern cache to force re-reading from configuration
   */
  clearCache(): void {
    this._patternCache.directive = undefined;
    this._patternCache.layer = undefined;
  }

  /**
   * Gets all available patterns
   */
  getAllPatterns(): Result<
    { directive: TwoParamsDirectivePattern | null; layer: TwoParamsLayerTypePattern | null },
    PatternProviderError
  > {
    if (!this._initialized) {
      return resultError({
        kind: "NotInitialized",
      });
    }

    try {
      const directive = this.getDirectivePattern();
      const layer = this.getLayerTypePattern();

      return resultOk({
        directive,
        layer,
      });
    } catch (error) {
      return resultError({
        kind: "ConfigLoadFailed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if the provider is initialized
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Extracts directive pattern string from configuration data
   */
  private extractDirectivePatternString(configData: Record<string, unknown>): string | null {
    // Try direct pattern configuration
    if (typeof configData.directivePattern === "string") {
      return configData.directivePattern;
    }

    // Try nested structure
    const twoParamsRules = configData.twoParamsRules as PatternConfig["twoParamsRules"];
    if (
      twoParamsRules?.directive?.pattern && typeof twoParamsRules.directive.pattern === "string"
    ) {
      return twoParamsRules.directive.pattern;
    }

    // Try alternative nested structure
    const validation = configData.validation as {
      directive?: { pattern?: string };
      layer?: { pattern?: string };
    };
    if (validation?.directive?.pattern && typeof validation.directive.pattern === "string") {
      return validation.directive.pattern;
    }

    // Default fallback pattern for common directive types
    return "^(to|summary|defect)$";
  }

  /**
   * Extracts layer type pattern string from configuration data
   */
  private extractLayerTypePatternString(configData: Record<string, unknown>): string | null {
    // Try direct pattern configuration
    if (typeof configData.layerTypePattern === "string") {
      return configData.layerTypePattern;
    }

    // Try nested structure
    const twoParamsRules = configData.twoParamsRules as PatternConfig["twoParamsRules"];
    if (twoParamsRules?.layer?.pattern && typeof twoParamsRules.layer.pattern === "string") {
      return twoParamsRules.layer.pattern;
    }

    // Try alternative nested structure
    const validation = configData.validation as {
      directive?: { pattern?: string };
      layer?: { pattern?: string };
    };
    if (validation?.layer?.pattern && typeof validation.layer.pattern === "string") {
      return validation.layer.pattern;
    }

    // Default fallback pattern for common layer types
    return "^(project|issue|task|bugs|temp)$";
  }

  /**
   * DirectiveType用バリデーション結果を取得
   */
  validateDirectiveType(value: string): boolean {
    const pattern = this.getDirectivePattern();
    return pattern ? pattern.test(value) : false;
  }

  /**
   * LayerType用バリデーション結果を取得
   */
  validateLayerType(value: string): boolean {
    const pattern = this.getLayerTypePattern();
    return pattern ? pattern.test(value) : false;
  }

  /**
   * 利用可能なDirectiveType値を取得
   */
  getValidDirectiveTypes(): readonly string[] {
    const pattern = this.getDirectivePattern();
    if (!pattern) return [];

    // パターンから取りうる値を推定（基本的なもの）
    const patternStr = pattern.getPattern();
    if (patternStr.includes("to|summary|defect")) {
      return ["to", "summary", "defect"];
    }

    // 設定から直接取得する場合の処理
    if (this.configData) {
      const validValues = this.extractValidValues(this.configData, "directive");
      if (validValues && validValues.length > 0) {
        return validValues;
      }
    }

    return ["to", "summary", "defect"]; // デフォルト値
  }

  /**
   * 利用可能なLayerType値を取得
   */
  getValidLayerTypes(): readonly string[] {
    const pattern = this.getLayerTypePattern();
    if (!pattern) return [];

    // パターンから取りうる値を推定（基本的なもの）
    const patternStr = pattern.getPattern();
    if (patternStr.includes("project|issue|task|bugs|temp")) {
      return ["project", "issue", "task", "bugs", "temp"];
    }

    // 設定から直接取得する場合の処理
    if (this.configData) {
      const validValues = this.extractValidValues(this.configData, "layer");
      if (validValues && validValues.length > 0) {
        return validValues;
      }
    }

    return ["project", "issue", "task", "bugs", "temp"]; // デフォルト値
  }

  /**
   * 設定から有効な値を抽出
   */
  private extractValidValues(
    configData: Record<string, unknown>,
    type: "directive" | "layer",
  ): string[] | null {
    // 直接的な values 配列を探す
    const valuesKey = type === "directive" ? "directiveValues" : "layerTypeValues";
    if (Array.isArray(configData[valuesKey])) {
      return configData[valuesKey].filter((v): v is string => typeof v === "string");
    }

    // ネストした構造から探す
    const twoParamsRules = configData.twoParamsRules as {
      directive?: { values?: string[] };
      layer?: { values?: string[] };
    };
    if (twoParamsRules) {
      const ruleValues = type === "directive"
        ? twoParamsRules.directive?.values
        : twoParamsRules.layer?.values;
      if (Array.isArray(ruleValues)) {
        return ruleValues.filter((v): v is string => typeof v === "string");
      }
    }

    // validation構造から探す
    const validation = configData.validation as {
      directive?: { values?: string[] };
      layer?: { values?: string[] };
    };
    if (validation) {
      const validationValues = type === "directive"
        ? validation.directive?.values
        : validation.layer?.values;
      if (Array.isArray(validationValues)) {
        return validationValues.filter((v): v is string => typeof v === "string");
      }
    }

    return null;
  }

  /**
   * Gets debug information about the pattern provider state
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
  } {
    return {
      initialized: this._initialized,
      hasConfigData: !!this.configData,
      hasDirectivePattern: this.getDirectivePattern() !== null,
      hasLayerTypePattern: this.getLayerTypePattern() !== null,
      cacheStatus: {
        directive: this._patternCache.directive === undefined
          ? "not_loaded"
          : this._patternCache.directive === null
          ? "null"
          : "cached",
        layer: this._patternCache.layer === undefined
          ? "not_loaded"
          : this._patternCache.layer === null
          ? "null"
          : "cached",
      },
    };
  }
}

/**
 * Default pattern provider implementation for cases where config is not available
 */
export class DefaultPatternProvider implements TypePatternProvider {
  private directivePattern: TwoParamsDirectivePattern | null;
  private layerPattern: TwoParamsLayerTypePattern | null;

  constructor() {
    this.directivePattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");
    this.layerPattern = TwoParamsLayerTypePattern.create("^(project|issue|task|bugs|temp)$");
  }

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    return this.directivePattern;
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    return this.layerPattern;
  }

  /**
   * DirectiveType用バリデーション結果を取得
   */
  validateDirectiveType(value: string): boolean {
    return this.directivePattern ? this.directivePattern.test(value) : false;
  }

  /**
   * LayerType用バリデーション結果を取得
   */
  validateLayerType(value: string): boolean {
    return this.layerPattern ? this.layerPattern.test(value) : false;
  }

  /**
   * 利用可能なDirectiveType値を取得
   */
  getValidDirectiveTypes(): readonly string[] {
    return ["to", "summary", "defect"];
  }

  /**
   * 利用可能なLayerType値を取得
   */
  getValidLayerTypes(): readonly string[] {
    return ["project", "issue", "task", "bugs", "temp"];
  }
}

/**
 * Factory function to create appropriate pattern provider
 */
export async function createPatternProvider(
  useConfig: boolean = true,
  configSetName?: string,
  workspacePath?: string,
): Promise<TypePatternProvider> {
  if (!useConfig) {
    return new DefaultPatternProvider();
  }

  const result = await AsyncConfigPatternProvider.create(configSetName, workspacePath);
  if (result.ok) {
    return result.data;
  }

  console.warn(
    "Failed to create config-based pattern provider, falling back to defaults:",
    result.error,
  );
  return new DefaultPatternProvider();
}
