/**
 * @fileoverview ConfigBasedTwoParamsBuilder - Config file based TwoParams generation
 *
 * Eliminates createDefault() dependency and provides an integrated flow of
 * config file -> CustomConfig -> TwoParamsResult.
 * Config-based initialization implementation via BreakdownParams integration.
 *
 * @module config/config_based_two_params_builder
 */

import { ParamsCustomConfig } from "./params_custom_config.ts";
import { ConfigProfile } from "./config_profile_name.ts";
import { loadUserConfig } from "./user_config_loader.ts";

/**
 * Config-related error type
 */
export interface ConfigError {
  kind: "ConfigLoadFailed" | "MissingPattern" | "BuilderCreationFailed";
  message: string;
  cause?: unknown;
}

/**
 * Validation-related error type
 */
export interface ValidationError {
  kind: "MissingPattern" | "ValidationFailed";
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Build-related error type
 */
export interface BuildError {
  kind: "ValidationFailed" | "BuildFailed";
  message: string;
  cause?: unknown;
}

/**
 * Simple Result type implementation
 */
export type Result<T, E> =
  | { ok: true; data: T; error?: never }
  | { ok: false; data?: never; error: E };

export function ok<T, E>(data: T): Result<T, E> {
  return { ok: true, data };
}

export function error<T, E>(err: E): Result<T, E> {
  return { ok: false, error: err };
}

/**
 * TwoParams_Result extended interface
 * Result type aligned with BreakdownParams specification
 */
export interface TwoParams_Result {
  type: "two";
  params: string[]; // [directiveType, layerType]
  layerType: string; // layer type string
  directiveType: string; // directive type string
  options: Record<string, unknown>;
}

/**
 * TwoParams_Result factory function
 */
export function createTwoParamsResult(
  directiveType: string,
  layerType: string,
  options?: Record<string, unknown>,
): TwoParams_Result {
  return {
    type: "two",
    params: [directiveType, layerType],
    layerType,
    directiveType,
    options: options || {},
  };
}

/**
 * ConfigBasedTwoParamsBuilder
 * Builder class that generates TwoParams_Result based on config files
 */
export class ConfigBasedTwoParamsBuilder {
  constructor(
    private readonly customConfig: ParamsCustomConfig,
    private readonly profile: string = "default",
  ) {}

  /**
   * Build ConfigBasedTwoParamsBuilder from config file
   * @param profileName Profile name (default: "default")
   * @returns ConfigBasedTwoParamsBuilder or error
   */
  static async fromConfig(
    profileName: string = "default",
  ): Promise<Result<ConfigBasedTwoParamsBuilder, ConfigError>> {
    try {
      // 1. Load config file
      const profile = ConfigProfile.create(profileName);
      const configData = await loadUserConfig(profile);

      // 2. Create CustomConfig
      const customConfig = ParamsCustomConfig.create(configData);

      return ok(new ConfigBasedTwoParamsBuilder(customConfig, profileName));
    } catch (cause) {
      return error({
        kind: "ConfigLoadFailed" as const,
        message: `Failed to load config for profile: ${profileName}`,
        cause,
      });
    }
  }

  /**
   * Validate DirectiveType and LayerType
   * @param directiveType Directive type
   * @param layerType Layer type
   * @returns Validation result
   */
  validateParams(
    directiveType: string,
    layerType: string,
  ): Result<boolean, ValidationError> {
    const directivePattern = this.customConfig.directivePattern;
    const layerPattern = this.customConfig.layerPattern;

    if (!directivePattern || !layerPattern) {
      return error({
        kind: "MissingPattern" as const,
        message: "Required patterns not found in config",
      });
    }

    // Pattern validation
    const directiveValid = new RegExp(`^(${directivePattern})$`).test(directiveType);
    const layerValid = new RegExp(`^(${layerPattern})$`).test(layerType);

    if (!directiveValid || !layerValid) {
      return error({
        kind: "ValidationFailed" as const,
        message: "Invalid directive or layer type",
        details: { directiveValid, layerValid, directiveType, layerType },
      });
    }

    return ok(true);
  }

  /**
   * Generate config-based TwoParams_Result
   * @param directiveType Directive type
   * @param layerType Layer type
   * @returns TwoParams_Result or error
   */
  build(
    directiveType: string,
    layerType: string,
  ): Result<TwoParams_Result, BuildError> {
    // 1. Parameter validation
    const validationResult = this.validateParams(directiveType, layerType);
    if (!validationResult.ok) {
      return error({
        kind: "ValidationFailed" as const,
        message: "Parameter validation failed",
        cause: validationResult.error,
      });
    }

    try {
      // 2. Generate TwoParams_Result
      const result = createTwoParamsResult(
        directiveType,
        layerType,
        {
          profile: this.profile,
          source: "config-based",
          configData: this.customConfig.toJSON(),
        },
      );

      return ok(result);
    } catch (cause) {
      return error({
        kind: "BuildFailed" as const,
        message: "Failed to build TwoParams_Result",
        cause,
      });
    }
  }

  /**
   * Get DirectiveType pattern from config
   * @returns DirectiveType pattern
   */
  getDirectivePattern(): string | undefined {
    return this.customConfig.directivePattern;
  }

  /**
   * Get LayerType pattern from config
   * @returns LayerType pattern
   */
  getLayerPattern(): string | undefined {
    return this.customConfig.layerPattern;
  }

  /**
   * Get profile name
   * @returns Profile name
   */
  getProfile(): string {
    return this.profile;
  }
}

/**
 * Create config-based builder as an alternative to createDefault()
 * @param profileName Profile name (default: "breakdown")
 * @returns ConfigBasedTwoParamsBuilder or error
 */
export async function createConfigBasedBuilder(
  profileName: string = "breakdown",
): Promise<Result<ConfigBasedTwoParamsBuilder, ConfigError>> {
  return await ConfigBasedTwoParamsBuilder.fromConfig(profileName);
}
