/**
 * @fileoverview Factory integration with unified configuration
 *
 * This module provides integration between the unified configuration interface
 * and the existing factory classes, enabling seamless migration.
 *
 * @module config/factory_integration
 */

import { type UnifiedConfig, UnifiedConfigInterface } from "./unified_config_interface.ts";
import {
  type PromptCliParams,
  PromptVariablesFactory,
} from "../factory/prompt_variables_factory.ts";
import { PromptTemplatePathResolverTotality as PromptTemplatePathResolver } from "../factory/prompt_template_path_resolver_totality.ts";
import { SchemaFilePathResolverTotality as SchemaFilePathResolver } from "../factory/schema_file_path_resolver_totality.ts";
// import { InputFilePathResolver } from "../factory/input_file_path_resolver.ts"; // REMOVED - file doesn't exist
// import { OutputFilePathResolver } from "../factory/output_file_path_resolver.ts"; // REMOVED - file doesn't exist
import type { Result } from "../types/result.ts";
import { error as resultError, ok as resultOk } from "../types/result.ts";
import { extractBaseDir } from "./types.ts";

/**
 * Factory configuration interface
 */
export interface FactoryConfig {
  app_prompt: {
    base_dir: string;
  };
  app_schema: {
    base_dir: string;
  };
  output: {
    base_dir: string;
  };
  features: {
    extendedThinking: boolean;
    debugMode: boolean;
    strictValidation: boolean;
    autoSchema: boolean;
  };
  limits: {
    maxFileSize: number;
    maxPromptLength: number;
    maxVariables: number;
  };
  environment: {
    logLevel: "debug" | "info" | "warn" | "error";
    colorOutput: boolean;
    timezone: string | null;
    locale: string | null;
  };
  user: {
    customVariables: Record<string, string> | null;
    aliases: Record<string, string> | null;
    templates: Record<string, string> | null;
  };
  [key: string]: unknown; // For raw config spreading
}

/**
 * Factory configuration adapter
 * Converts UnifiedConfig to factory-compatible format
 */
export class FactoryConfigAdapter {
  /**
   * Convert UnifiedConfig to factory configuration format
   */
  static toFactoryConfig(unified: UnifiedConfig): FactoryConfig {
    return {
      app_prompt: {
        base_dir: unified.paths.promptBaseDir,
      },
      app_schema: {
        base_dir: unified.paths.schemaBaseDir,
      },
      output: {
        base_dir: unified.paths.outputBaseDir,
      },
      features: unified.app.features,
      limits: unified.app.limits,
      environment: unified.environment,
      user: unified.user,
      // Include raw config for backward compatibility
      ...unified.raw,
    };
  }

  /**
   * Create PromptVariablesFactory with unified configuration
   */
  static createPromptVariablesFactory(
    unifiedConfig: UnifiedConfigInterface,
    cliParams: PromptCliParams,
  ): Result<PromptVariablesFactory, Error> {
    try {
      const factoryConfig = this.toFactoryConfig(unifiedConfig.getConfig());
      const factoryResult = PromptVariablesFactory.createWithConfig(factoryConfig, cliParams);
      if (!factoryResult.ok) {
        return resultError(new Error(`Factory creation failed: ${factoryResult.error}`));
      }
      return resultOk(factoryResult.data);
    } catch (error) {
      return resultError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Create path resolvers with unified configuration
   */
  static createPathResolvers(unifiedConfig: UnifiedConfigInterface) {
    const config = unifiedConfig.getConfig();
    const factoryConfig = this.toFactoryConfig(config);

    // Create dummy CLI params for resolvers that need them
    const dummyCliParams: PromptCliParams = {
      directiveType: "",
      layerType: "",
      options: {},
    };

    return {
      template: PromptTemplatePathResolver.create(factoryConfig, dummyCliParams),
      schema: SchemaFilePathResolver.create(factoryConfig, dummyCliParams),
      // input: InputFilePathResolver.create(factoryConfig, dummyCliParams), // REMOVED - class doesn't exist
      // output: OutputFilePathResolver.create(factoryConfig, dummyCliParams), // REMOVED - class doesn't exist
    };
  }
}

/**
 * Configuration migration helper
 * Assists in migrating from old configuration format to unified
 */
export class ConfigurationMigrator {
  /**
   * Migrate old configuration format to unified format
   */
  static migrateConfig(oldConfig: Record<string, unknown>): Record<string, unknown> {
    const migrated: Record<string, unknown> = { ...oldConfig };

    // Migrate path configurations
    if (!migrated.paths) {
      migrated.paths = {};
    }

    // Use type-safe extraction helpers
    const appPromptBaseDir = extractBaseDir(oldConfig, "app_prompt");
    const appSchemaBaseDir = extractBaseDir(oldConfig, "app_schema");

    // Ensure paths is an object
    const paths = migrated.paths as Record<string, unknown>;

    // Migrate app_prompt to paths.promptBaseDir
    if (appPromptBaseDir && !paths.promptBaseDir) {
      paths.promptBaseDir = appPromptBaseDir;
    }

    // Migrate app_schema to paths.schemaBaseDir
    if (appSchemaBaseDir && !paths.schemaBaseDir) {
      paths.schemaBaseDir = appSchemaBaseDir;
    }

    // Migrate features
    if (!migrated.features) {
      migrated.features = {
        extendedThinking: oldConfig.extended_thinking ?? false,
        debugMode: oldConfig.debug_mode ?? false,
        strictValidation: oldConfig.strict_validation ?? true,
        autoSchema: oldConfig.auto_schema ?? true,
      };
    }

    // Migrate environment
    if (!migrated.environment) {
      migrated.environment = {
        logLevel: oldConfig.log_level || "info",
        colorOutput: oldConfig.color_output ?? true,
      };
    }

    return migrated;
  }

  /**
   * Validate migration result
   */
  static validateMigration(config: Record<string, unknown>): string[] {
    const errors: string[] = [];

    // Check required paths
    if (!config.paths || typeof config.paths !== "object") {
      errors.push("Missing 'paths' configuration section");
    }

    // Check patterns availability
    if (!config.patterns && !config.type_patterns) {
      errors.push("No type patterns configuration found");
    }

    return errors;
  }
}

/**
 * Factory builder with unified configuration
 */
export class UnifiedFactoryBuilder {
  private unifiedConfig: UnifiedConfigInterface;

  constructor(unifiedConfig: UnifiedConfigInterface) {
    this.unifiedConfig = unifiedConfig;
  }

  /**
   * Build PromptVariablesFactory
   */
  buildPromptVariablesFactory(
    cliParams: PromptCliParams,
  ): Result<PromptVariablesFactory, Error> {
    return FactoryConfigAdapter.createPromptVariablesFactory(
      this.unifiedConfig,
      cliParams,
    );
  }

  /**
   * Build all path resolvers
   */
  buildPathResolvers() {
    return FactoryConfigAdapter.createPathResolvers(this.unifiedConfig);
  }

  /**
   * Get pattern provider from unified config
   */
  getPatternProvider() {
    return this.unifiedConfig.getPatternProvider();
  }

  /**
   * Get path options from unified config
   */
  getPathOptions() {
    return this.unifiedConfig.getPathOptions();
  }
}

/**
 * Configuration compatibility layer
 * Ensures backward compatibility during migration
 */
export class ConfigCompatibilityLayer {
  /**
   * Check if configuration needs migration
   */
  static needsMigration(config: Record<string, unknown>): boolean {
    // Old format indicators
    const hasOldFormat = Boolean(
      config.app_prompt ||
        config.app_schema ||
        config.type_patterns ||
        !config.paths,
    );

    return hasOldFormat;
  }

  /**
   * Create unified config from legacy format
   */
  static async fromLegacy(
    legacyConfig: Record<string, unknown>,
    profile?: string,
  ): Promise<Result<UnifiedConfigInterface, Error>> {
    try {
      // First migrate the config
      const _migrated = ConfigurationMigrator.migrateConfig(legacyConfig);

      // Create unified config with migrated data
      const result = await UnifiedConfigInterface.create({
        profile: profile || null,
        workingDirectory: legacyConfig.working_directory as string || Deno.cwd(),
        environmentOverrides: null,
        pathOverrides: null,
      });

      return result.ok
        ? result
        : resultError(new Error(`Config creation failed: ${result.error.kind}`));
    } catch (error) {
      return resultError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}

/**
 * Export convenience functions for common operations
 */

/**
 * Create factory with unified configuration
 */
export async function createFactoryWithUnifiedConfig(
  cliParams: PromptCliParams,
  options?: {
    profile?: string;
    workingDirectory?: string;
  },
): Promise<Result<PromptVariablesFactory, Error>> {
  // Create unified config
  const configResult = await UnifiedConfigInterface.create({
    profile: options?.profile || null,
    workingDirectory: options?.workingDirectory || null,
    environmentOverrides: null,
    pathOverrides: null,
  });
  if (!configResult.ok) {
    const errorMessage = configResult.error.kind === "ProfileNotFound"
      ? `Profile not found: ${configResult.error.profile}. Available: ${
        configResult.error.availableProfiles?.join(", ") || "none"
      }`
      : `Configuration error: ${configResult.error.kind}`;
    return resultError(new Error(errorMessage));
  }

  // Create factory
  const builder = new UnifiedFactoryBuilder(configResult.data);
  return builder.buildPromptVariablesFactory(cliParams);
}

/**
 * Get unified configuration instance
 */
export async function getUnifiedConfig(
  options?: {
    profile?: string;
    workingDirectory?: string;
  },
): Promise<Result<UnifiedConfigInterface, Error>> {
  const result = await UnifiedConfigInterface.create({
    profile: options?.profile || null,
    workingDirectory: options?.workingDirectory || null,
    environmentOverrides: null,
    pathOverrides: null,
  });
  if (!result.ok) {
    const errorMessage = result.error.kind === "ProfileNotFound"
      ? `Profile not found: ${result.error.profile}. Available: ${
        result.error.availableProfiles?.join(", ") || "none"
      }`
      : `Configuration error: ${result.error.kind}`;
    return resultError(new Error(errorMessage));
  }
  return result;
}
