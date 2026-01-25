/**
 * @fileoverview ConfigBasedTypePatternProvider - Configuration-based TypePatternProvider implementation
 *
 * A provider class that dynamically provides DirectiveType/LayerType patterns
 * from BreakdownConfig configuration files. Completely eliminates hardcoded dependencies.
 *
 * @module config/config_based_type_pattern_provider
 */

import type { TypePatternProvider } from "./pattern_provider.ts";
import { ParamsCustomConfig } from "./params_custom_config.ts";
import { ConfigProfile } from "./config_profile_name.ts";
import { loadUserConfig } from "./user_config_loader.ts";

/**
 * Configuration-based TypePatternProvider implementation
 * Dynamically provides DirectiveType/LayerType patterns from configuration files
 */
export class ConfigBasedTypePatternProvider implements TypePatternProvider {
  private directiveTypes: readonly string[] = [];
  private layerTypes: readonly string[] = [];

  constructor(
    private readonly customConfig: ParamsCustomConfig,
    private readonly profileName: string = "default",
  ) {
    this.initializeTypes();
  }

  /**
   * Create provider from configuration file
   * @param profileName Profile name
   * @returns ConfigBasedTypePatternProvider instance
   */
  static async create(profileName: string = "default"): Promise<ConfigBasedTypePatternProvider> {
    const profile = ConfigProfile.create(profileName);
    const configData = await loadUserConfig(profile);
    const customConfig = ParamsCustomConfig.create(configData);

    return new ConfigBasedTypePatternProvider(customConfig, profileName);
  }

  /**
   * Create directly from custom configuration (for testing)
   * @param customConfig Custom configuration
   * @param profileName Profile name
   * @returns ConfigBasedTypePatternProvider instance
   */
  static fromConfig(
    customConfig: ParamsCustomConfig,
    profileName: string = "default",
  ): ConfigBasedTypePatternProvider {
    return new ConfigBasedTypePatternProvider(customConfig, profileName);
  }

  /**
   * Initialize types
   */
  private initializeTypes(): void {
    // Generate array from DirectiveType pattern
    const directivePattern = this.customConfig.directivePattern;
    if (directivePattern) {
      this.directiveTypes = Object.freeze(directivePattern.split("|"));
    }

    // Generate array from LayerType pattern
    const layerPattern = this.customConfig.layerPattern;
    if (layerPattern) {
      this.layerTypes = Object.freeze(layerPattern.split("|"));
    }
  }

  /**
   * Get DirectiveType pattern object
   * @returns DirectiveType pattern object
   */
  getDirectivePattern(): { test(value: string): boolean; getPattern(): string } | null {
    const pattern = this.customConfig.directivePattern;
    if (!pattern) return null;

    const regex = new RegExp(`^(${pattern})$`);
    return {
      test: (value: string) => regex.test(value),
      getPattern: () => pattern,
    };
  }

  /**
   * Get LayerType pattern object
   * @returns LayerType pattern object
   */
  getLayerTypePattern(): { test(value: string): boolean; getPattern(): string } | null {
    const pattern = this.customConfig.layerPattern;
    if (!pattern) return null;

    const regex = new RegExp(`^(${pattern})$`);
    return {
      test: (value: string) => regex.test(value),
      getPattern: () => pattern,
    };
  }

  /**
   * Get valid DirectiveTypes
   * @returns Array of DirectiveTypes
   */
  getValidDirectiveTypes(): readonly string[] {
    return this.directiveTypes;
  }

  /**
   * Get valid LayerTypes
   * @returns Array of LayerTypes
   */
  getValidLayerTypes(): readonly string[] {
    return this.layerTypes;
  }

  /**
   * Validate DirectiveType
   * @param value Value to validate
   * @returns true if valid
   */
  validateDirectiveType(value: string): boolean {
    const pattern = this.getDirectivePattern();
    return pattern ? pattern.test(value) : false;
  }

  /**
   * Validate LayerType
   * @param value Value to validate
   * @returns true if valid
   */
  validateLayerType(value: string): boolean {
    const pattern = this.getLayerTypePattern();
    return pattern ? pattern.test(value) : false;
  }

  /**
   * Check if DirectiveType is valid (for backward compatibility)
   * @param value Value to check
   * @returns true if valid
   * @deprecated Use validateDirectiveType instead
   */
  isValidDirectiveType(value: string): boolean {
    return this.validateDirectiveType(value);
  }

  /**
   * Check if LayerType is valid (for backward compatibility)
   * @param value Value to check
   * @returns true if valid
   * @deprecated Use validateLayerType instead
   */
  isValidLayerType(value: string): boolean {
    return this.validateLayerType(value);
  }

  /**
   * Get profile name
   * @returns Profile name
   */
  getProfileName(): string {
    return this.profileName;
  }

  /**
   * Get configuration summary (for debugging)
   * @returns Configuration summary
   */
  getSummary(): Record<string, unknown> {
    const directivePattern = this.getDirectivePattern();
    const layerPattern = this.getLayerTypePattern();

    return {
      profile: this.profileName,
      directivePattern: directivePattern?.getPattern() || "",
      layerPattern: layerPattern?.getPattern() || "",
      directiveTypes: this.directiveTypes,
      layerTypes: this.layerTypes,
    };
  }
}
