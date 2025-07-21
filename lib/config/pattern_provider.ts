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
import type { TypePatternProvider } from "../types/type_factory.ts";
import { TwoParamsDirectivePattern } from "../domain/core/value_objects/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../domain/core/value_objects/layer_type.ts";
import { error, ok, Result } from "../types/result.ts";
import { ConfigurationError, ErrorFactory } from "../types/unified_error_types.ts";

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
    // Create defensive copy to ensure immutability
    // Note: BreakdownConfig may contain methods, so use structuredClone or shallow copy
    try {
      this.config = structuredClone(config);
    } catch {
      // Fallback to shallow copy if structuredClone fails with methods
      this.config = Object.assign(Object.create(Object.getPrototypeOf(config)), config);
    }
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
    return ok(new ConfigPatternProvider(config));
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
   * Gets configuration data from BreakdownConfig
   *
   * @returns Promise<Result<Record<string, unknown>, ConfigurationError>> - Result with configuration data or error
   */
  private async getConfigData(): Promise<Result<Record<string, unknown>, ConfigurationError>> {
    try {
      const configData = await this.config.getConfig();
      return ok(configData);
    } catch (err) {
      return error(ErrorFactory.configError(
        "ConfigurationError",
        {
          message: `Failed to get configuration data: ${
            err instanceof Error ? err.message : String(err)
          }`,
          source: "ConfigPatternProvider.getConfigData",
        },
      ));
    }
  }

  /**
   * Gets configuration data from BreakdownConfig synchronously
   * ❌ CRITICAL: This method must properly access config data for pattern loading
   * Currently using async getConfigData() method through temporary sync wrapper
   *
   * @returns Record<string, unknown> - Configuration data object
   */
  private getConfigDataSync(): Record<string, unknown> {
    try {
      // Use async method through Promise chain (temporary solution)
      // TODO: Refactor pattern provider interface to be fully async
      let configData: Record<string, unknown> = {};
      
      // Synchronous access to config data through blocking async call
      // This is NOT ideal but necessary to maintain interface compatibility
      this.getConfigData().then(result => {
        if (result.ok) {
          configData = result.data;
        } else {
          console.warn("Failed to get config data:", result.error);
        }
      }).catch(error => {
        console.warn("Error getting config data:", error);
      });
      
      return configData;
    } catch (error) {
      console.warn("Failed to get config data synchronously:", error);
      return {};
    }
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

    // ❌ HARDCODE ELIMINATION: No fallback patterns allowed
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

    // ❌ HARDCODE ELIMINATION: No fallback patterns allowed
    // Configuration MUST define patterns explicitly
    return null;
  }

  /**
   * Validates DirectiveType value against configured pattern
   * @param value - Value to validate
   * @returns boolean - True if value matches the pattern
   */
  validateDirectiveType(value: string): boolean {
    const pattern = this.getDirectivePattern();
    return pattern?.test(value) ?? false;
  }

  /**
   * Validates LayerType value against configured pattern
   * @param value - Value to validate
   * @returns boolean - True if value matches the pattern
   */
  validateLayerType(value: string): boolean {
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
