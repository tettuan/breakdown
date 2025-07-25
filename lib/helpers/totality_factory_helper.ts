/**
 * @fileoverview Totality Factory Helper - Unified initialization for Totality-compliant types
 *
 * This module provides helper functions for creating and managing Totality-compliant
 * type factories with proper configuration integration. It simplifies the process
 * of setting up TypeFactory instances with ConfigPatternProvider.
 *
 * @module helpers/totality_factory_helper
 */

import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { TypeFactory } from "../types/type_factory.ts";
import { JSRPatternProvider } from "../config/jsr_pattern_provider.ts";
import type { PromptCliParams, TotalityPromptCliParams, TypeCreationResult } from "../types/mod.ts";
import { TotalityPromptVariablesFactory } from "../factory/prompt_variables_factory.ts";

/**
 * Configuration options for Totality factory initialization
 */
export interface TotalityFactoryOptions {
  /** Configuration set name (e.g., "default", "production", "staging") */
  configSetName?: string;
  /** Workspace path for configuration resolution */
  workspacePath?: string;
  /** Pre-loaded BreakdownConfig instance (optional) */
  config?: BreakdownConfig;
}

/**
 * _Result type for factory creation operations
 */
export type FactoryCreation_Result<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  error: string;
  details?: string;
};

/**
 * Complete Totality factory bundle containing all necessary components
 */
export interface TotalityFactoryBundle {
  /** Pattern provider with configuration integration */
  patternProvider: JSRPatternProvider;
  /** BreakdownConfig instance */
  config: BreakdownConfig;
  /** Helper function to create PromptVariablesFactory */
  createPromptFactory: (params: TotalityPromptCliParams) => Promise<TotalityPromptVariablesFactory>;
  /** Static TypeFactory methods for type creation */
  createDirectiveType: typeof TypeFactory.createDirectiveType;
  createLayerType: typeof TypeFactory.createLayerType;
  createBothTypes: typeof TypeFactory.createBothTypes;
}

/**
 * Creates a complete Totality factory bundle with configuration integration
 *
 * This is the primary helper function for setting up Totality-compliant type factories.
 * It handles configuration loading, pattern provider setup, and TypeFactory initialization.
 *
 * @param options - Configuration options for factory setup
 * @returns Promise<FactoryCreation_Result<TotalityFactoryBundle>> - Complete factory bundle or error
 *
 * @example Basic usage
 * ```typescript
 * const _factoryResult = await createTotalityFactory();
 * if (factoryResult.ok) {
 *   const { typeFactory, patternProvider } = factoryResult.data;
 *
 *   // Create validated types
 *   const typesResult = typeFactory.createBothTypes("to", "project");
 *   if (typesResult.ok) {
 *     const { directive, layer } = typesResult.data;
 *     console.log(`Created: ${directive.value}, ${layer.value}`);
 *   }
 * }
 * ```
 *
 * @example With custom configuration
 * ```typescript
 * const factoryResult = await createTotalityFactory({
 *   configSetName: "production",
 *   workspacePath: "/workspace"
 * });
 *
 * if (factoryResult.ok) {
 *   const bundle = factoryResult.data;
 *
 *   // Check pattern availability
 *   const availability = bundle.typeFactory.getPatternAvailability();
 *   console.log("Patterns available:", availability);
 * }
 * ```
 */
export async function createTotalityFactory(
  options: TotalityFactoryOptions = {},
): Promise<FactoryCreation_Result<TotalityFactoryBundle>> {
  try {
    const {
      configSetName = "default",
      workspacePath = Deno.cwd(),
      config: preloadedConfig,
    } = options;

    // Initialize or use provided BreakdownConfig
    let config = preloadedConfig;
    if (!preloadedConfig) {
      const configResult = await BreakdownConfig.create(configSetName, workspacePath);
      if (!configResult.success) {
        throw new Error(`Failed to create BreakdownConfig: ${configResult.error}`);
      }
      config = configResult.data;
    }

    if (!preloadedConfig) {
      await config!.loadConfig();
    }

    // Create JSR pattern provider using DEFAULT_CUSTOM_CONFIG
    const patternProviderResult = JSRPatternProvider.create();
    if (!patternProviderResult.ok) {
      return {
        ok: false,
        error: "Failed to create JSR pattern provider",
        details: patternProviderResult.error,
      };
    }

    const patternProvider = patternProviderResult.data;

    // Create helper function for PromptVariablesFactory
    const createPromptFactory = async (
      params: TotalityPromptCliParams,
    ): Promise<TotalityPromptVariablesFactory> => {
      const configData = await config!.getConfig();
      const result = TotalityPromptVariablesFactory.createWithConfig(configData, params);

      if (!result.ok) {
        throw new Error(
          `Failed to create PromptVariablesFactory: ${result.error.message || "Unknown error"}`,
        );
      }

      return result.data;
    };

    return {
      ok: true,
      data: {
        patternProvider,
        config: config!,
        createPromptFactory,
        // Static TypeFactory methods
        createDirectiveType: TypeFactory.createDirectiveType,
        createLayerType: TypeFactory.createLayerType,
        createBothTypes: TypeFactory.createBothTypes,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      details: error instanceof Error ? error.stack : undefined,
    };
  }
}

/**
 * Quick helper for creating validated CLI parameters from strings
 *
 * This function combines type creation and validation into a single operation,
 * making it easy to create PromptCliParams from raw string inputs.
 *
 * @param directiveValue - Raw directive string (e.g., "to", "summary")
 * @param layerValue - Raw layer string (e.g., "project", "issue")
 * @param options - CLI options object
 * @param factoryBundle - Initialized factory bundle from createTotalityFactory
 * @returns TypeCreation_Result<PromptCliParams> - Validated parameters or error
 *
 * @example Creating CLI parameters
 * ```typescript
 * const factoryResult = await createTotalityFactory();
 * if (factoryResult.ok) {
 *   const paramsResult = await createValidatedCliParams(
 *     "to",
 *     "project",
 *     { fromFile: "input.md" },
 *     factoryResult.data
 *   );
 *
 *   if (paramsResult.ok) {
 *     const factory = await factoryResult.data.createPromptFactory(paramsResult.data);
 *     console.log("All paths resolved:", factory.getAllParams());
 *   }
 * }
 * ```
 */
export function createValidatedCliParams(
  directiveValue: string,
  layerValue: string,
  options: PromptCliParams["options"],
  factoryBundle: TotalityFactoryBundle,
): TypeCreationResult<TotalityPromptCliParams> {
  const typesResult = factoryBundle.createBothTypes(directiveValue, layerValue);

  if (!typesResult.ok) {
    const errorMessage = (() => {
      const err = typesResult.error;
      switch (err.kind) {
        case "PatternNotFound":
          return err.reason;
        case "PatternValidationFailed":
          return `Validation failed for value "${err.value}" with pattern "${err.pattern}"`;
        case "InvalidPattern":
          return `Invalid pattern "${err.pattern}": ${err.reason}`;
        case "ProcessingFailed":
          return `${err.operation}: ${err.reason}`;
        case "TransformationFailed":
          return `Failed to transform to ${err.targetType}: ${err.reason}`;
        case "GenerationFailed":
          return `${err.generator} failed: ${err.reason}`;
        default:
          return `Type validation failed`;
      }
    })();

    return {
      ok: false,
      error: {
        kind: "PatternNotFound",
        operation: "type validation",
        reason: errorMessage,
      },
    };
  }

  return {
    ok: true,
    data: {
      directiveType: typesResult.data.directive.value,
      layerType: typesResult.data.layer.value,
      options,
      // Include directive and layer objects for backward compatibility
      directive: typesResult.data.directive,
      layer: typesResult.data.layer,
    },
  };
}

/**
 * Simplified helper for common use cases - creates types and factory in one step
 *
 * This is a convenience function that combines factory creation, type validation,
 * and PromptVariablesFactory initialization into a single operation.
 *
 * @param directiveValue - Raw directive string
 * @param layerValue - Raw layer string
 * @param options - CLI options
 * @param factoryOptions - Factory configuration options
 * @returns Promise<FactoryCreation_Result<TotalityPromptVariablesFactory>> - Ready-to-use factory
 *
 * @example One-step factory creation
 * ```typescript
 * const result = await createTotalityPromptFactory(
 *   "summary",
 *   "issue",
 *   { fromFile: "analysis.md", extended: true },
 *   { configSetName: "production" }
 * );
 *
 * if (result.ok) {
 *   const factory = result.data;
 *   console.log("Prompt file:", factory.promptFilePath);
 *   console.log("Schema file:", factory.schemaFilePath);
 * }
 * ```
 */
export async function createTotalityPromptFactory(
  directiveValue: string,
  layerValue: string,
  options: PromptCliParams["options"],
  factoryOptions: TotalityFactoryOptions = {},
): Promise<FactoryCreation_Result<TotalityPromptVariablesFactory>> {
  // Create factory bundle
  const bundleResult = await createTotalityFactory(factoryOptions);
  if (!bundleResult.ok) {
    return bundleResult;
  }

  // Create validated CLI parameters
  const paramsResult = await createValidatedCliParams(
    directiveValue,
    layerValue,
    options,
    bundleResult.data,
  );

  if (!paramsResult.ok) {
    const errorMessage = (() => {
      const err = paramsResult.error;
      switch (err.kind) {
        case "PatternNotFound":
          return err.reason;
        case "PatternValidationFailed":
          return `Validation failed for value "${err.value}" with pattern "${err.pattern}"`;
        case "InvalidPattern":
          return `Invalid pattern "${err.pattern}": ${err.reason}`;
        case "ProcessingFailed":
          return `${err.operation}: ${err.reason}`;
        case "TransformationFailed":
          return `Failed to transform to ${err.targetType}: ${err.reason}`;
        case "GenerationFailed":
          return `${err.generator} failed: ${err.reason}`;
        default:
          return `Type validation failed`;
      }
    })();

    return {
      ok: false,
      error: `Parameter validation failed: ${errorMessage}`,
      details: paramsResult.error.kind,
    };
  }

  // Create PromptVariablesFactory
  try {
    const promptFactory = await bundleResult.data.createPromptFactory(paramsResult.data);
    return {
      ok: true,
      data: promptFactory,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create prompt factory",
      details: error instanceof Error ? error.stack : undefined,
    };
  }
}

/**
 * Utility for validating configuration patterns before factory creation
 *
 * @param configSetName - Configuration set to validate
 * @param workspacePath - Workspace path
 * @returns Promise<boolean> - True if patterns are valid
 */
export async function validateConfigurationPatterns(
  configSetName: string = "default",
  workspacePath: string = Deno.cwd(),
): Promise<{ valid: boolean; details: string[] }> {
  try {
    const configResult = await BreakdownConfig.create(configSetName, workspacePath);
    if (!configResult.success) {
      return {
        valid: false,
        details: [`Failed to create BreakdownConfig: ${configResult.error}`],
      };
    }

    const config = configResult.data;
    await config.loadConfig();

    const providerResult = JSRPatternProvider.create();
    if (!providerResult.ok) {
      return {
        valid: false,
        details: [`Failed to create JSR pattern provider: ${providerResult.error}`],
      };
    }

    const provider = providerResult.data;
    const directivePattern = provider.getDirectivePattern();
    const layerPattern = provider.getLayerTypePattern();

    const details: string[] = [];

    if (!directivePattern) {
      details.push("DirectiveType pattern not found or invalid");
    } else {
      details.push(`DirectiveType pattern: ${directivePattern.getPattern()}`);
    }

    if (!layerPattern) {
      details.push("LayerType pattern not found or invalid");
    } else {
      details.push(`LayerType pattern: ${layerPattern.getPattern()}`);
    }

    return {
      valid: directivePattern !== null && layerPattern !== null,
      details,
    };
  } catch (error) {
    return {
      valid: false,
      details: [
        `Configuration validation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }
}
