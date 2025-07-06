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
import { PromptTemplatePathResolver } from "../factory/prompt_template_path_resolver.ts";
import { SchemaFilePathResolver } from "../factory/schema_file_path_resolver.ts";
import { InputFilePathResolver } from "../factory/input_file_path_resolver.ts";
import { OutputFilePathResolver } from "../factory/output_file_path_resolver.ts";
import type { Result } from "../types/result.ts";
import { error as resultError, ok as resultOk } from "../types/result.ts";

/**
 * Factory configuration adapter
 * Converts UnifiedConfig to factory-compatible format
 */
export class FactoryConfigAdapter {
  /**
   * Convert UnifiedConfig to factory configuration format
   */
  static toFactoryConfig(unified: UnifiedConfig): Record<string, unknown> {
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
  static async createPromptVariablesFactory(
    unifiedConfig: UnifiedConfigInterface,
    cliParams: PromptCliParams,
  ): Promise<Result<PromptVariablesFactory, Error>> {
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
    const pathOptions = unifiedConfig.getPathOptions();
    const factoryConfig = this.toFactoryConfig(config);

    // Create dummy CLI params for resolvers that need them
    const dummyCliParams: PromptCliParams = {
      demonstrativeType: "",
      layerType: "",
      options: {},
    };

    return {
      template: PromptTemplatePathResolver.create(factoryConfig, dummyCliParams),
      schema: SchemaFilePathResolver.create(factoryConfig, dummyCliParams),
      input: InputFilePathResolver.create(factoryConfig, dummyCliParams),
      output: OutputFilePathResolver.create(factoryConfig, dummyCliParams),
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

    // Type-safe property access for old config
    const typedOldConfig = oldConfig as Record<string, any>;
    const typedMigrated = migrated as Record<string, any>;

    // Migrate app_prompt to paths.promptBaseDir
    if (typedOldConfig.app_prompt?.base_dir && !typedMigrated.paths.promptBaseDir) {
      typedMigrated.paths.promptBaseDir = typedOldConfig.app_prompt.base_dir;
    }

    // Migrate app_schema to paths.schemaBaseDir
    if (typedOldConfig.app_schema?.base_dir && !typedMigrated.paths.schemaBaseDir) {
      typedMigrated.paths.schemaBaseDir = typedOldConfig.app_schema.base_dir;
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
  async buildPromptVariablesFactory(
    cliParams: PromptCliParams,
  ): Promise<Result<PromptVariablesFactory, Error>> {
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
      const migrated = ConfigurationMigrator.migrateConfig(legacyConfig);

      // Create unified config with migrated data
      const result = await UnifiedConfigInterface.create({
        profile,
        workingDirectory: legacyConfig.working_directory as string || Deno.cwd(),
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
  const configResult = await UnifiedConfigInterface.create(options);
  if (!configResult.ok) {
    const errorMessage = configResult.error.kind === "ProfileNotFound"
      ? `Profile not found: ${configResult.error.profile}. Available: ${
        configResult.error.available.join(", ")
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
  const result = await UnifiedConfigInterface.create(options);
  if (!result.ok) {
    const errorMessage = result.error.kind === "ProfileNotFound"
      ? `Profile not found: ${result.error.profile}. Available: ${
        result.error.available.join(", ")
      }`
      : `Configuration error: ${result.error.kind}`;
    return resultError(new Error(errorMessage));
  }
  return result;
}
