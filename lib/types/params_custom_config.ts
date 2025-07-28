/**
 * ParamsCustomConfig type definition for Breakdown
 *
 * This module defines type-safe configuration for BreakdownParams following Totality principles.
 * Uses Smart Constructors and Discriminated Unions to ensure type safety.
 *
 * Key features:
 * - Returns undefined when configuration is missing (as expected by BreakdownParams for default behavior)
 * - Uses DEFAULT_CUSTOM_CONFIG as base and applies partial overrides via spread operator
 * - Supports partial configuration (only specified fields are overridden)
 * - Smart constructor pattern following Totality principles
 * - Direct compatibility with BreakdownParams v1.0.7 CustomConfig type
 *
 * @module types/params_custom_config
 */

// Import CustomConfig type and DEFAULT_CUSTOM_CONFIG from BreakdownParams
import type { CustomConfig } from "@tettuan/breakdownparams";
import { DEFAULT_CUSTOM_CONFIG } from "@tettuan/breakdownparams";

// Import result types
import { Result, ResultStatus } from "./enums.ts";

/**
 * Configuration creation errors
 */
export class ConfigError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Type definition for ParamsConfig structure (matching BreakdownParams v1.1.0)
 *
 * Updated to directiveType only (unified naming in v1.1.0)
 */
export interface ParamsConfig {
  directiveType: {
    pattern: string;
    errorMessage: string;
  };
  layerType: {
    pattern: string;
    errorMessage: string;
  };
}

/**
 * ParamsCustomConfig utilities for creating type-safe BreakdownParams configuration
 * Uses smart constructor following Totality principles
 *
 * Usage:
 * ```typescript
 * // 1. Create configuration with partial overrides
 * const _userConfig = {
 *   breakdown: {
 *     params: {
 *       two: {
 *         DirectiveType: {
 *           pattern: "^(custom|test)$",
 *           errorMessage: "Custom directive error"
 *         }
 *         // layerType will use DEFAULT_CUSTOM_CONFIG values
 *       }
 *     },
 *     errorHandling: {
 *       unknownOption: "warn"  // Override just this one setting
 *     }
 *   }
 * };
 *
 * // 2. Create merged CustomConfig (defaults + overrides)
 * const result = ParamsCustomConfig.create(userConfig);
 *
 * // 3. Handle success/failure
 * if (_result.status === ResultStatus.SUCCESS && result.data !== undefined) {
 *   // Uses: custom directiveType + default layerType + custom unknownOption + other defaults
 *   const parser = new ParamsParser(undefined, result.data);
 * } else if (_result.status === ResultStatus.SUCCESS && result.data === undefined) {
 *   // No breakdown config found, BreakdownParams will use its defaults
 *   const parser = new ParamsParser(undefined, undefined);
 * } else {
 *   console.error("Configuration extraction failed:", result.error);
 * }
 * ```
 */
export class ParamsCustomConfig {
  private constructor() {
    // Static utility class
  }

  /**
   * Checks if configuration is missing or contains insufficient data
   * Returns true when config should be considered "missing" and undefined should be returned
   */
  private static isConfigMissing(mergedConfig: Record<string, unknown>): boolean {
    // Check if config is empty or null/undefined
    if (!mergedConfig || Object.keys(mergedConfig).length === 0) {
      return true;
    }

    // Check if breakdown-specific configuration exists
    const breakdown = mergedConfig.breakdown;
    if (!breakdown || typeof breakdown !== "object") {
      return true;
    }

    const breakdownObj = breakdown as Record<string, unknown>;

    // Check if any breakdown configuration exists at all
    // If there's any breakdown config, we consider it as present (even if partial)
    const hasAnyConfig = (breakdownObj.params && typeof breakdownObj.params === "object") ||
      (breakdownObj.options && typeof breakdownObj.options === "object") ||
      (breakdownObj.validation && typeof breakdownObj.validation === "object") ||
      (breakdownObj.errorHandling && typeof breakdownObj.errorHandling === "object");

    return !hasAnyConfig;
  }

  /**
   * Smart constructor that validates and creates type-safe CustomConfig
   * Uses DEFAULT_CUSTOM_CONFIG as base and applies partial overrides
   * Returns undefined when configuration is missing (as expected by BreakdownParams)
   */
  static create(
    mergedConfig: Record<string, unknown>,
  ): Result<CustomConfig | undefined, ConfigError> {
    // Check if configuration is missing or empty
    if (ParamsCustomConfig.isConfigMissing(mergedConfig)) {
      return {
        status: ResultStatus.SUCCESS,
        data: undefined,
      };
    }

    try {
      // Start with DEFAULT_CUSTOM_CONFIG as base
      const customConfig: CustomConfig = {
        ...DEFAULT_CUSTOM_CONFIG,
        ...ParamsCustomConfig.extractOverrides(mergedConfig),
      };

      return {
        status: ResultStatus.SUCCESS,
        data: customConfig,
      };
    } catch (error) {
      return {
        status: ResultStatus.ERROR,
        error: new ConfigError(
          error instanceof Error ? error.message : "Unknown configuration error",
          "CONFIG_EXTRACTION_ERROR",
        ),
      };
    }
  }

  /**
   * Extract partial overrides from user configuration
   * Only extracts fields that exist and are valid, leaving others to defaults
   */
  private static extractOverrides(mergedConfig: Record<string, unknown>): Partial<CustomConfig> {
    const breakdown = mergedConfig.breakdown as Record<string, unknown>;
    const overrides: Partial<CustomConfig> = {};

    // Extract params overrides
    if (breakdown.params && typeof breakdown.params === "object") {
      const params = breakdown.params as Record<string, unknown>;

      if (params.two && typeof params.two === "object") {
        const two = params.two as Record<string, unknown>;
        const paramsOverride: Partial<ParamsConfig> = {};

        // Override directiveType if provided (handle both directiveType and DirectiveType)
        const directiveConfig = (two.directiveType || two.DirectiveType) as
          | Record<string, unknown>
          | undefined;
        if (directiveConfig && typeof directiveConfig === "object") {
          if (typeof directiveConfig.pattern === "string") {
            paramsOverride.directiveType = {
              pattern: directiveConfig.pattern,
              errorMessage: typeof directiveConfig.errorMessage === "string"
                ? directiveConfig.errorMessage
                : `Invalid directive type. Must match pattern: ${directiveConfig.pattern}`,
            };
          }
        }

        // Override layerType if provided
        if (two.layerType && typeof two.layerType === "object") {
          const layer = two.layerType as Record<string, unknown>;
          if (typeof layer.pattern === "string") {
            paramsOverride.layerType = {
              pattern: layer.pattern,
              errorMessage: typeof layer.errorMessage === "string"
                ? layer.errorMessage
                : `Invalid layer type. Must match pattern: ${layer.pattern}`,
            };
          }
        }

        if (Object.keys(paramsOverride).length > 0) {
          overrides.params = {
            two: {
              ...DEFAULT_CUSTOM_CONFIG.params.two,
              ...paramsOverride,
            },
          };
        }
      }
    }

    // Extract options overrides (if needed)
    if (breakdown.options && typeof breakdown.options === "object") {
      const options = breakdown.options as Record<string, unknown>;
      const optionsOverride: Partial<CustomConfig["options"]> = {};

      if (options.userVariables && typeof options.userVariables === "object") {
        const customVars = options.userVariables as Record<string, unknown>;
        if (typeof customVars.pattern === "string" || typeof customVars.description === "string") {
          optionsOverride.userVariables = {
            ...DEFAULT_CUSTOM_CONFIG.options.userVariables,
            ...(typeof customVars.pattern === "string" && { pattern: customVars.pattern }),
            ...(typeof customVars.description === "string" &&
              { description: customVars.description }),
          };
        }
      }

      if (Object.keys(optionsOverride).length > 0) {
        overrides.options = {
          ...DEFAULT_CUSTOM_CONFIG.options,
          ...optionsOverride,
        };
      }
    }

    // Extract validation overrides (if needed)
    if (breakdown.validation && typeof breakdown.validation === "object") {
      const validation = breakdown.validation as Record<string, unknown>;
      const validationOverride: Partial<CustomConfig["validation"]> = {};

      ["zero", "one", "two"].forEach((key) => {
        const section = validation[key];
        if (section && typeof section === "object") {
          const sectionObj = section as Record<string, unknown>;
          validationOverride[key as keyof CustomConfig["validation"]] = {
            allowedOptions: Array.isArray(sectionObj.allowedOptions)
              ? sectionObj.allowedOptions as string[]
              : DEFAULT_CUSTOM_CONFIG.validation[key as keyof CustomConfig["validation"]]
                .allowedOptions,
            allowedValueOptions: Array.isArray(sectionObj.allowedValueOptions)
              ? sectionObj.allowedValueOptions as string[]
              : DEFAULT_CUSTOM_CONFIG.validation[key as keyof CustomConfig["validation"]]
                .allowedValueOptions,
            allowUserVariables: typeof sectionObj.allowUserVariables === "boolean"
              ? sectionObj.allowUserVariables
              : DEFAULT_CUSTOM_CONFIG.validation[key as keyof CustomConfig["validation"]]
                .allowUserVariables,
          };
        }
      });

      if (Object.keys(validationOverride).length > 0) {
        overrides.validation = {
          ...DEFAULT_CUSTOM_CONFIG.validation,
          ...validationOverride,
        };
      }
    }

    // Extract errorHandling overrides (if needed)
    if (breakdown.errorHandling && typeof breakdown.errorHandling === "object") {
      const errorHandling = breakdown.errorHandling as Record<string, unknown>;
      const validValues = ["error", "ignore", "warn"] as const;
      const errorHandlingOverride: Partial<CustomConfig["errorHandling"]> = {};

      ["unknownOption", "duplicateOption", "emptyValue"].forEach((key) => {
        const value = errorHandling[key];
        if (
          typeof value === "string" && validValues.includes(value as typeof validValues[number])
        ) {
          errorHandlingOverride[key as keyof CustomConfig["errorHandling"]] =
            value as typeof validValues[number];
        }
      });

      if (Object.keys(errorHandlingOverride).length > 0) {
        overrides.errorHandling = {
          ...DEFAULT_CUSTOM_CONFIG.errorHandling,
          ...errorHandlingOverride,
        };
      }
    }

    return overrides;
  }
}
