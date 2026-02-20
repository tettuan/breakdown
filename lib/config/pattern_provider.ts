/**
 * @fileoverview TypePatternProvider implementation for BreakdownConfig integration
 *
 * This module provides the concrete implementation of TypePatternProvider that
 * integrates with BreakdownConfig to retrieve validation patterns for DirectiveType
 * and LayerType from configuration files (user.yml).
 *
 * @module config/pattern_provider
 */

import { BreakdownConfig } from "@tettuan/breakdownconfig";
// TypePatternProvider interface definition
export interface TypePatternProvider {
  /**
   * Gets validation result for DirectiveType
   * @param value The value to validate
   * @returns Validation result
   */
  validateDirectiveType(value: string): boolean;

  /**
   * Gets validation result for LayerType
   * @param value The value to validate
   * @returns Validation result
   */
  validateLayerType(value: string): boolean;

  /**
   * Gets available DirectiveType values
   * @returns Array of DirectiveType values allowed in configuration
   */
  getValidDirectiveTypes(): readonly string[];

  /**
   * Gets available LayerType values
   * @returns Array of LayerType values allowed in configuration
   */
  getValidLayerTypes(): readonly string[];
}
import { TwoParamsDirectivePattern } from "../domain/core/value_objects/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../domain/core/value_objects/layer_type.ts";
import { error, ok, type Result } from "../types/result.ts";
import { type ConfigurationError, ErrorFactory } from "../types/unified_error_types.ts";

/**
 * Configuration structure for validation patterns
 * Expected structure in user.yml configuration files
 */
interface PatternConfig {
  /** Regular expression pattern for DirectiveType validation */
  directivePattern?: string;
  /** Regular expression pattern for LayerType validation */
  layerTypePattern?: string;
  /** Alternative nested structure for two-param validation rules */
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
  /** Test data with invalid values for validation */
  testData?: {
    invalidDirectives?: string[];
    invalidLayers?: string[];
  };
}

/**
 * BreakdownConfig-based implementation of TypePatternProvider
 *
 * This class integrates with BreakdownConfig to retrieve validation patterns
 * from configuration files, supporting multiple configuration formats and
 * environments (development, staging, production).
 *
 * @example Basic usage with BreakdownConfig
 * ```typescript
 * const _configResult = await BreakdownConfig.create("production", "/workspace");
 * if (!configResult.success || !configResult.data) {
 *   throw new Error(`Config creation failed: ${configResult.error}`);
 * }
 *
 * const provider = new ConfigPatternProvider(configResult.data);
 * const directivePattern = provider.getDirectivePattern();
 * const layerPattern = provider.getLayerTypePattern();
 *
 * if (directivePattern && layerPattern) {
 *   const factory = new TypeFactory(provider);
 *   // Use factory with validated patterns
 * }
 * ```
 *
 * @example Custom pattern configuration in user.yml
 * ```yaml
 * # Basic pattern configuration
 * directivePattern: "^(to|summary|defect|init|find)$"
 * layerTypePattern: "^(project|issue|task|component|module)$"
 *
 * # Alternative nested structure
 * twoParamsRules:
 *   directive:
 *     pattern: "web|rag|db"
 *     errorMessage: "Invalid search directive"
 *   layer:
 *     pattern: "search|analysis|report"
 *     errorMessage: "Invalid search layer"
 * ```
 */
export class ConfigPatternProvider implements TypePatternProvider {
  private config: BreakdownConfig;
  private configData: Record<string, unknown> = {};
  private _patternCache: {
    directive: TwoParamsDirectivePattern | null | undefined;
    layer: TwoParamsLayerTypePattern | null | undefined;
  } = {
    directive: undefined,
    layer: undefined,
  };

  /**
   * Creates a new ConfigPatternProvider instance
   *
   * @param config - Initialized BreakdownConfig instance with loaded configuration
   */
  constructor(config: BreakdownConfig) {
    this.config = config;
  }

  /**
   * Factory method to create ConfigPatternProvider with automatic config loading
   *
   * @param configSetName - Configuration set name (e.g., "default", "production")
   * @param workspacePath - Workspace path for configuration resolution
   * @returns Promise<Result<ConfigPatternProvider, ConfigurationError>> - Result with initialized provider instance or error
   */
  static async create(
    configSetName: string = "default",
    workspacePath: string = Deno.cwd(),
  ): Promise<Result<ConfigPatternProvider, ConfigurationError>> {
    const configResult = await BreakdownConfig.create(configSetName, workspacePath);
    if (!configResult.success) {
      return error(ErrorFactory.configError(
        "ConfigurationError",
        {
          message: `Failed to create BreakdownConfig: ${configResult.error}`,
          source: "ConfigPatternProvider.create",
        },
      ));
    }
    const config = configResult.data;
    await config.loadConfig();
    const provider = new ConfigPatternProvider(config);
    // Pre-load config data for synchronous access
    try {
      provider.configData = await config.getConfig();
    } catch {
      // Config data will remain empty - patterns will return null
    }
    return ok(provider);
  }

  /**
   * Retrieves DirectiveType validation pattern from configuration
   *
   * @returns TwoParamsDirectivePattern | null - Pattern if configured and valid, null otherwise
   */
  getDirectivePattern(): TwoParamsDirectivePattern | null {
    if (this._patternCache.directive !== undefined) {
      return this._patternCache.directive;
    }

    try {
      // For now, use sync method to avoid breaking interface
      const configData = this.getConfigDataSync();
      const patternString = this.extractDirectivePatternString(configData);

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
   *
   * @returns TwoParamsLayerTypePattern | null - Pattern if configured and valid, null otherwise
   */
  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    if (this._patternCache.layer !== undefined) {
      return this._patternCache.layer;
    }

    try {
      // For now, use sync method to avoid breaking interface
      const configData = this.getConfigDataSync();
      const patternString = this.extractLayerTypePatternString(configData);

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
   *
   * @returns boolean - True if both directive and layer patterns are available
   */
  hasValidPatterns(): boolean {
    return this.getDirectivePattern() !== null && this.getLayerTypePattern() !== null;
  }

  /**
   * Clears the pattern cache to force re-reading from configuration
   * Useful when configuration has been reloaded
   */
  clearCache(): void {
    this._patternCache.directive = undefined;
    this._patternCache.layer = undefined;
  }

  /**
   * Gets pre-loaded configuration data for synchronous access
   *
   * Config data is loaded during create() factory method.
   * When constructed directly (not via create()), returns empty object.
   *
   * @returns Record<string, unknown> - Configuration data object
   */
  private getConfigDataSync(): Record<string, unknown> {
    return this.configData;
  }

  /**
   * Extracts directive pattern string from configuration data
   * Supports multiple configuration formats and fallbacks
   *
   * @param configData - Configuration data object
   * @returns string | null - Pattern string if found, null otherwise
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

    // [HARDCODE ELIMINATION]: No fallback patterns allowed
    // Configuration MUST define patterns explicitly
    return null;
  }

  /**
   * Extracts layer type pattern string from configuration data
   * Supports multiple configuration formats and fallbacks
   *
   * @param configData - Configuration data object
   * @returns string | null - Pattern string if found, null otherwise
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

    // [HARDCODE ELIMINATION]: No fallback patterns allowed
    // Configuration MUST define patterns explicitly
    return null;
  }

  /**
   * Validates DirectiveType value against configured pattern and invalid value list
   * @param value - Value to validate
   * @returns boolean - True if value matches the pattern and is not in invalid list
   */
  validateDirectiveType(value: string): boolean {
    if (!value || typeof value !== "string" || value.trim() === "") {
      return false;
    }

    // Check if value is in invalid list from configuration
    const invalidValues = this.getInvalidDirectiveValues();
    if (invalidValues.includes(value.trim())) {
      return false;
    }

    // Validate against pattern
    const pattern = this.getDirectivePattern();
    return pattern?.test(value) ?? false;
  }

  /**
   * Validates LayerType value against configured pattern and invalid value list
   * @param value - Value to validate
   * @returns boolean - True if value matches the pattern and is not in invalid list
   */
  validateLayerType(value: string): boolean {
    if (!value || typeof value !== "string" || value.trim() === "") {
      return false;
    }

    // Check if value is in invalid list from configuration
    const invalidValues = this.getInvalidLayerValues();
    if (invalidValues.includes(value.trim())) {
      return false;
    }

    // Validate against pattern
    const pattern = this.getLayerTypePattern();
    return pattern?.test(value) ?? false;
  }

  /**
   * Gets list of valid DirectiveType values from pattern
   * @returns readonly string[] - Array of valid directive types
   */
  getValidDirectiveTypes(): readonly string[] {
    const pattern = this.getDirectivePattern();
    if (!pattern) {
      return [];
    }

    // Extract values from pattern like "^(to|summary|defect|init|find)$"
    const patternString = pattern.getPattern();
    const match = patternString.match(/\^\(([^)]+)\)\$/);
    if (match && match[1]) {
      return match[1].split("|").filter((v: string) => v.trim().length > 0);
    }

    return [];
  }

  /**
   * Gets list of valid LayerType values from pattern
   * @returns readonly string[] - Array of valid layer types
   */
  getValidLayerTypes(): readonly string[] {
    const pattern = this.getLayerTypePattern();
    if (!pattern) {
      return [];
    }

    // Extract values from pattern like "^(project|issue|task|component|module)$"
    const patternString = pattern.getPattern();
    const match = patternString.match(/\^\(([^)]+)\)\$/);
    if (match && match[1]) {
      return match[1].split("|").filter((v: string) => v.trim().length > 0);
    }

    return [];
  }

  /**
   * Gets list of invalid LayerType values from configuration
   * @returns string[] - Array of invalid layer type values
   */
  getInvalidLayerValues(): string[] {
    try {
      const configData = this.getConfigDataSync();
      const testData = configData.testData as PatternConfig["testData"];

      if (testData?.invalidLayers && Array.isArray(testData.invalidLayers)) {
        return testData.invalidLayers.filter((v: unknown): v is string => typeof v === "string");
      }

      // Fallback to empty array if no invalid values configured
      return [];
    } catch (error) {
      console.warn("Failed to load invalid layer values from config:", error);
      return [];
    }
  }

  /**
   * Gets list of invalid DirectiveType values from configuration
   * @returns string[] - Array of invalid directive type values
   */
  getInvalidDirectiveValues(): string[] {
    try {
      const configData = this.getConfigDataSync();
      const testData = configData.testData as PatternConfig["testData"];

      if (testData?.invalidDirectives && Array.isArray(testData.invalidDirectives)) {
        return testData.invalidDirectives.filter((v: unknown): v is string =>
          typeof v === "string"
        );
      }

      // Fallback to empty array if no invalid values configured
      return [];
    } catch (error) {
      console.warn("Failed to load invalid directive values from config:", error);
      return [];
    }
  }

  /**
   * Gets debug information about the pattern provider state
   *
   * @returns Debug information object
   */
  debug(): {
    configSetName: string;
    hasDirectivePattern: boolean;
    hasLayerTypePattern: boolean;
    cacheStatus: {
      directive: "cached" | "null" | "not_loaded";
      layer: "cached" | "null" | "not_loaded";
    };
  } {
    return {
      configSetName: "unknown", // TODO: Use appropriate config identifier
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
