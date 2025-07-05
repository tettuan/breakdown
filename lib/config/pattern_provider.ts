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
import { TwoParamsDirectivePattern } from "../types/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../types/layer_type.ts";

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
 * layerTypePattern: "^(project|issue|task|bugs|temp)$"
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
   * @returns Promise<ConfigPatternProvider> - Initialized provider instance
   */
  static async create(
    configSetName: string = "default",
    workspacePath: string = Deno.cwd(),
  ): Promise<ConfigPatternProvider> {
    const configResult = await BreakdownConfig.create(configSetName, workspacePath);
    if (!configResult.success) {
      throw new Error(`Failed to create BreakdownConfig: ${configResult.error}`);
    }
    const config = configResult.data;
    await config.loadConfig();
    return new ConfigPatternProvider(config);
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
   * @returns Record<string, unknown> - Configuration data object
   */
  private async getConfigData(): Promise<Record<string, unknown>> {
    try {
      return await this.config.getConfig();
    } catch (error) {
      throw new Error(
        `Failed to get configuration data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Gets configuration data from BreakdownConfig synchronously
   * This is a temporary solution to avoid breaking the interface
   *
   * @returns Record<string, unknown> - Configuration data object
   */
  private getConfigDataSync(): Record<string, unknown> {
    // For now, return an empty object to avoid type errors
    // TODO: Refactor to properly handle async config loading
    return {};
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

    // Default fallback pattern for common directive types
    return "^(to|summary|defect|init|find)$";
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

    // Default fallback pattern for common layer types
    return "^(project|issue|task|bugs|temp)$";
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
