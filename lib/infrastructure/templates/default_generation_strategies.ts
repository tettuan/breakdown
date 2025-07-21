/**
 * @fileoverview Default Generation Strategies - Infrastructure implementations
 *
 * This module provides default implementations of generation strategies
 * for variable resolution and template selection with BreakdownConfig-based configuration.
 *
 * @module infrastructure/templates/default_generation_strategies
 */

import type { DirectiveType, LayerType } from "../../types/mod.ts";
import { TemplatePath } from "../../domain/templates/prompt_generation_aggregate.ts";
import type {
  ResolutionContext,
  SelectionContext,
  TemplateSelectionStrategy,
  VariableResolutionStrategy,
} from "../../domain/templates/generation_policy.ts";
import type { Result } from "../../types/result.ts";
import { join } from "@std/path";
import { exists } from "@std/fs";
import { BreakdownConfig } from "../../deps.ts";

/**
 * Configuration structure for generation strategies
 */
interface GenerationStrategiesConfig {
  variableResolution?: {
    environment?: {
      prefix?: string;
      priority?: number;
    };
    filePath?: {
      priority?: number;
    };
    defaultValues?: {
      priority?: number;
      variables?: Record<string, string>;
    };
  };
  templateSelection?: {
    standard?: {
      defaultFilename?: string;
    };
    fallback?: {
      enabled?: boolean;
      mappings?: Record<string, string>;
    };
  };
}

/**
 * Configuration loader for generation strategies
 */
class GenerationStrategiesConfigLoader {
  private config: GenerationStrategiesConfig = {};

  constructor(private readonly configProfile: string) {}

  async loadConfig(): Promise<void> {
    try {
      const configResult = await BreakdownConfig.create(this.configProfile, Deno.cwd());
      if (!configResult.success) {
        this.config = {};
        return;
      }
      
      const breakdownConfig = configResult.data;
      await breakdownConfig.loadConfig();
      const mergedConfig = await breakdownConfig.getConfig();
      
      // Extract generation_strategies configuration
      this.config = (mergedConfig as any)?.generation_strategies || {};
    } catch (error) {
      // If config loading fails, use empty config (defaults will be applied)
      this.config = {};
    }
  }

  getEnvironmentConfig() {
    return {
      prefix: this.config.variableResolution?.environment?.prefix || "BREAKDOWN_",
      priority: this.config.variableResolution?.environment?.priority || 10,
    };
  }

  getFilePathConfig() {
    return {
      priority: this.config.variableResolution?.filePath?.priority || 50,
    };
  }

  getDefaultValuesConfig() {
    return {
      priority: this.config.variableResolution?.defaultValues?.priority || 1,
      variables: this.config.variableResolution?.defaultValues?.variables || {
        schema_file: "",
        adaptation: "",
      },
    };
  }

  getStandardTemplateConfig() {
    return {
      defaultFilename: this.config.templateSelection?.standard?.defaultFilename || "f_",
    };
  }

  getFallbackConfig() {
    return {
      enabled: this.config.templateSelection?.fallback?.enabled ?? true,
      mappings: this.config.templateSelection?.fallback?.mappings || {
        "defect/project": "f_project.md",
        "defect/issue": "f_issue.md",
        "defect/task": "f_task.md",
      },
    };
  }
}

/**
 * Environment variable resolution strategy
 */
export class EnvironmentVariableStrategy implements VariableResolutionStrategy {
  constructor(
    private readonly prefix: string = "BREAKDOWN_",
    private readonly priority: number = 10,
  ) {}

  resolve(variableName: string, context: ResolutionContext): Promise<string | undefined> {
    const envName = this.prefix + variableName.toUpperCase();
    const envValue = Deno.env.get(envName);
    if (envValue !== undefined) {
      return Promise.resolve(envValue);
    }

    // Safely access environmentVariables with proper null checking
    if (context.environmentVariables && typeof context.environmentVariables === "object") {
      return Promise.resolve(context.environmentVariables[envName]);
    }

    return Promise.resolve(undefined);
  }

  getPriority(): number {
    return this.priority;
  }
}

/**
 * File path resolution strategy
 */
export class FilePathResolutionStrategy implements VariableResolutionStrategy {
  constructor(private readonly priority: number = 50) {}

  async resolve(variableName: string, context: ResolutionContext): Promise<string | undefined> {
    // Ensure providedVariables exists and is an object
    if (!context.providedVariables || typeof context.providedVariables !== "object") {
      return undefined;
    }

    // Special handling for file path variables
    if (variableName === "input_text_file") {
      const fromFile = context.providedVariables.fromFile;
      if (fromFile !== undefined && typeof fromFile === "string") {
        if (fromFile === "-") return "stdin";

        // Resolve relative paths
        const absolutePath = join(context.workingDirectory, fromFile);
        if (await exists(absolutePath)) {
          return absolutePath;
        }
        return fromFile; // Return as-is if not found
      }
    }

    if (variableName === "destination_path") {
      const destinationFile = context.providedVariables.destinationFile;
      if (destinationFile !== undefined && typeof destinationFile === "string") {
        return join(context.workingDirectory, destinationFile);
      }
    }

    return undefined;
  }

  getPriority(): number {
    return this.priority;
  }
}

/**
 * Default value resolution strategy
 */
export class DefaultValueStrategy implements VariableResolutionStrategy {
  private readonly defaults: Map<string, string>;

  constructor(
    defaults: Record<string, string> = {},
    private readonly priority: number = 1,
  ) {
    this.defaults = new Map(Object.entries({
      schema_file: "",
      adaptation: "",
      ...defaults,
    }));
  }

  resolve(variableName: string): Promise<string | undefined> {
    return Promise.resolve(this.defaults.get(variableName));
  }

  getPriority(): number {
    return this.priority;
  }
}

/**
 * Standard template selection strategy
 */
export class StandardTemplateSelectionStrategy implements TemplateSelectionStrategy {
  constructor(
    private readonly defaultFilename: string = "f_",
  ) {}

  selectTemplate(
    directive: DirectiveType,
    layer: LayerType,
    context: SelectionContext,
  ): Result<TemplatePath, string> {
    // Use custom path if provided
    if (context.customPath !== undefined && typeof context.customPath === "string") {
      const parts = context.customPath.split("/");
      if (parts.length >= 3) {
        const filename = parts[parts.length - 1];
        return TemplatePath.create(directive, layer, filename);
      }
    }

    // Build standard filename
    const filename = `${this.defaultFilename}${layer.value}.md`;
    return TemplatePath.create(directive, layer, filename);
  }
}

/**
 * Fallback template selection strategy
 */
export class FallbackTemplateSelectionStrategy implements TemplateSelectionStrategy {
  constructor(
    private readonly primary: TemplateSelectionStrategy,
    private readonly fallbackMappings: Map<string, string>,
  ) {}

  selectTemplate(
    directive: DirectiveType,
    layer: LayerType,
    context: SelectionContext,
  ): Result<TemplatePath, string> {
    const primaryPath = this.primary.selectTemplate(directive, layer, context);

    // Ensure fallbackEnabled is boolean (required by interface)
    if (context.fallbackEnabled !== true) {
      return primaryPath;
    }

    // Check for fallback mapping
    const key = `${directive.value}/${layer.value}`;
    const fallbackFilename = this.fallbackMappings.get(key);

    if (fallbackFilename !== undefined) {
      return TemplatePath.create(directive, layer, fallbackFilename);
    }

    return primaryPath;
  }
}

/**
 * Create default variable resolution strategies
 */
export function createDefaultVariableStrategies(
  configProfile: string = "default",
): VariableResolutionStrategy[] {
  const configLoader = new GenerationStrategiesConfigLoader(configProfile);
  
  // Note: This is synchronous creation with default values
  // For async config loading, use createDefaultVariableStrategiesAsync
  const envConfig = configLoader.getEnvironmentConfig();
  const fileConfig = configLoader.getFilePathConfig();
  const defaultConfig = configLoader.getDefaultValuesConfig();

  return [
    new FilePathResolutionStrategy(fileConfig.priority),
    new EnvironmentVariableStrategy(envConfig.prefix, envConfig.priority),
    new DefaultValueStrategy(defaultConfig.variables, defaultConfig.priority),
  ];
}

/**
 * Create default variable resolution strategies with async config loading
 */
export async function createDefaultVariableStrategiesAsync(
  configProfile: string = "default",
): Promise<VariableResolutionStrategy[]> {
  const configLoader = new GenerationStrategiesConfigLoader(configProfile);
  await configLoader.loadConfig();
  
  const envConfig = configLoader.getEnvironmentConfig();
  const fileConfig = configLoader.getFilePathConfig();
  const defaultConfig = configLoader.getDefaultValuesConfig();

  return [
    new FilePathResolutionStrategy(fileConfig.priority),
    new EnvironmentVariableStrategy(envConfig.prefix, envConfig.priority),
    new DefaultValueStrategy(defaultConfig.variables, defaultConfig.priority),
  ];
}

/**
 * Create default template selection strategy
 */
export function createDefaultSelectionStrategy(
  configProfile: string = "default",
): TemplateSelectionStrategy {
  const configLoader = new GenerationStrategiesConfigLoader(configProfile);
  
  // Note: This is synchronous creation with default values
  // For async config loading, use createDefaultSelectionStrategyAsync
  const standardConfig = configLoader.getStandardTemplateConfig();
  const fallbackConfig = configLoader.getFallbackConfig();
  
  const fallbackMappings = new Map(Object.entries(fallbackConfig.mappings));

  return new FallbackTemplateSelectionStrategy(
    new StandardTemplateSelectionStrategy(standardConfig.defaultFilename),
    fallbackMappings,
  );
}

/**
 * Create default template selection strategy with async config loading
 */
export async function createDefaultSelectionStrategyAsync(
  configProfile: string = "default",
): Promise<TemplateSelectionStrategy> {
  const configLoader = new GenerationStrategiesConfigLoader(configProfile);
  await configLoader.loadConfig();
  
  const standardConfig = configLoader.getStandardTemplateConfig();
  const fallbackConfig = configLoader.getFallbackConfig();
  
  const fallbackMappings = new Map(Object.entries(fallbackConfig.mappings));

  return new FallbackTemplateSelectionStrategy(
    new StandardTemplateSelectionStrategy(standardConfig.defaultFilename),
    fallbackMappings,
  );
}
