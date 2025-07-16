/**
 * @fileoverview Unified configuration interface for Breakdown
 *
 * This module provides a unified interface that integrates:
 * - Application settings
 * - User settings
 * - Environment-specific settings
 * - Profile-based configuration switching
 *
 * Following Totality principle and DDD:
 * - Smart Constructor pattern for safe instance creation
 * - Result type for explicit error handling
 * - Immutable configuration objects
 * - Clear separation of concerns
 *
 * @module config/unified_config_interface
 */

import { error as resultError, ok as resultOk, type Result } from "../types/result.ts";
import { PathResolutionOption } from "../types/path_resolution_option.ts";
import { AsyncConfigPatternProvider } from "./pattern_provider_async.ts";
import { ConfigLoader, type CustomConfig as _CustomConfig } from "./loader.ts";
import { DEPENDENCY_VERSIONS } from "./versions.ts";
import { existsSync } from "@std/fs";
import { resolve } from "@std/path";
import { type BaseConfigStructure, extractBaseDir, extractNestedProperty } from "./types.ts";

/**
 * Configuration errors (unified with system-wide error types)
 */
export type ConfigurationError =
  | {
    kind: "ConfigurationError";
    message: string;
    source?: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "ProfileNotFound";
    profile: string;
    availableProfiles?: string[];
    available?: string[];
    context?: Record<string, unknown>;
  }
  | {
    kind: "InvalidConfiguration";
    field: string;
    reason: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "ConfigLoadError";
    message: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "PathResolutionError";
    message: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "ValidationError";
    field: string;
    message: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "MergeConflict";
    message: string;
    context?: Record<string, unknown>;
  };

/**
 * Configuration profile metadata
 */
export interface ConfigProfile {
  name: string;
  description: string | null;
  environment: "development" | "production" | "test" | null;
  priority: number;
  source: "default" | "user" | "environment" | "override";
}

/**
 * Complete configuration structure
 */
export interface UnifiedConfig {
  // Core settings
  profile: ConfigProfile;

  // Path resolution settings
  paths: {
    workingDirectory: string;
    resourceDirectory: string;
    promptBaseDir: string;
    schemaBaseDir: string;
    outputBaseDir: string;
  };

  // Type patterns (from AsyncConfigPatternProvider)
  patterns: {
    directiveTypes: string[];
    layerTypes: string[];
    customPatterns: Record<string, string[]> | null;
  };

  // Application settings
  app: {
    version: string;
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
  };

  // User customizations
  user: {
    customVariables: Record<string, string> | null;
    aliases: Record<string, string> | null;
    templates: Record<string, string> | null;
  };

  // Environment-specific settings
  environment: {
    logLevel: "debug" | "info" | "warn" | "error";
    colorOutput: boolean;
    timezone: string | null;
    locale: string | null;
  };

  // Raw config data for extensions
  raw: Record<string, unknown>;
}

/**
 * Configuration builder options
 */
export interface ConfigBuilderOptions {
  profile?: string | null;
  workingDirectory?: string | null;
  environmentOverrides?: Partial<UnifiedConfig["environment"]> | null;
  pathOverrides?: Partial<UnifiedConfig["paths"]> | null;
}

/**
 * Unified configuration interface
 *
 * Provides a single entry point for all configuration needs
 * with profile-based switching and environment-aware settings.
 */
export class UnifiedConfigInterface {
  private readonly config: UnifiedConfig;
  private readonly patternProvider: AsyncConfigPatternProvider;
  private readonly pathOptions: PathResolutionOption;

  /**
   * Private constructor following Smart Constructor pattern
   */
  private constructor(
    config: UnifiedConfig,
    patternProvider: AsyncConfigPatternProvider,
    pathOptions: PathResolutionOption,
  ) {
    this.config = Object.freeze(config);
    this.patternProvider = patternProvider;
    this.pathOptions = pathOptions;
  }

  /**
   * Create unified configuration with profile support
   */
  static async create(
    options: ConfigBuilderOptions = {
      profile: null,
      workingDirectory: null,
      environmentOverrides: null,
      pathOverrides: null,
    },
  ): Promise<Result<UnifiedConfigInterface, ConfigurationError>> {
    try {
      // Load base configuration
      const baseConfigResult = await ConfigLoader.loadBreakdownConfig(
        options.profile || undefined,
        options.workingDirectory || undefined,
      );

      if (!baseConfigResult.ok) {
        const error = baseConfigResult.error;
        let message: string;
        
        switch (error.kind) {
          case "CreateError":
          case "LoadError":
          case "ConfigError":
            message = error.message;
            break;
          case "InvalidType":
          case "InvalidFormat":
          case "InvalidCharacters":
          case "PrefixTooLong":
            message = error.message;
            break;
          case "InvalidPath":
            message = `Invalid path: ${error.path} - ${error.reason}`;
            break;
          case "EmptyPath":
            message = error.message;
            break;
          default:
            message = "Unknown configuration error";
            break;
        }
        
        return resultError({
          kind: "ConfigLoadError",
          message,
        });
      }

      const baseConfig = baseConfigResult.data as BaseConfigStructure;

      // Create pattern provider
      const patternProviderResult = await AsyncConfigPatternProvider.create(
        options.profile || "default",
        options.workingDirectory || undefined,
      );

      if (!patternProviderResult.ok) {
        const error = patternProviderResult.error;
        let errorMessage: string;
        
        switch (error.kind) {
          case "ConfigLoadFailed":
            errorMessage = error.message;
            break;
          case "PatternCreationFailed":
            errorMessage = `Pattern creation failed for ${error.patternType}: ${error.pattern}`;
            break;
          case "NotInitialized":
            errorMessage = "Pattern provider not initialized";
            break;
          default:
            errorMessage = `Pattern provider error: ${(error as any).kind || "unknown"}`;
            break;
        }
        return resultError({
          kind: "ConfigLoadError",
          message: errorMessage,
        });
      }

      const patternProvider = patternProviderResult.data;

      // Build unified configuration
      const workingDir = options.workingDirectory || Deno.cwd();
      const unifiedConfigResult = await this.buildUnifiedConfig(
        baseConfig,
        patternProvider,
        workingDir,
        options,
      );

      if (!unifiedConfigResult.ok) {
        return unifiedConfigResult;
      }

      const unifiedConfig = unifiedConfigResult.data;

      // Create path resolution options
      const pathOptionsResult = PathResolutionOption.create(
        "workspace",
        unifiedConfig.paths.workingDirectory,
        [unifiedConfig.paths.resourceDirectory],
        {
          required: [],
          optional: [],
        },
      );

      if (!pathOptionsResult.ok) {
        const error = pathOptionsResult.error;
        let errorMessage: string;
        
        switch (error.kind) {
          case "ConfigurationError":
            errorMessage = error.message;
            break;
          case "ProfileNotFound":
            errorMessage = `Profile not found: ${error.profile}`;
            break;
          case "InvalidConfiguration":
            errorMessage = error.details;
            break;
          case "ConfigLoadError":
            errorMessage = error.message;
            break;
          case "InvalidPath":
            errorMessage = `Invalid path: ${error.path} - ${error.reason}`;
            break;
          case "PathNotFound":
            errorMessage = `Path not found: ${error.path}`;
            break;
          case "DirectoryNotFound":
            errorMessage = `Directory not found: ${error.path}`;
            break;
          case "PermissionDenied":
            errorMessage = `Permission denied: ${error.path}`;
            break;
          case "PathTooLong":
            errorMessage = `Path too long: ${error.path} (max: ${error.maxLength})`;
            break;
          case "InvalidStrategy":
            errorMessage = `Invalid strategy: ${error.strategy}`;
            break;
          case "EmptyBaseDir":
            errorMessage = "Empty base directory";
            break;
          case "NoValidFallback":
            errorMessage = `No valid fallback found after attempts: ${error.attempts.join(", ")}`;
            break;
          case "InvalidParameterCombination":
            errorMessage = `Invalid parameter combination: ${error.directiveType}/${error.layerType}`;
            break;
          case "TemplateNotFound":
            errorMessage = `Template not found. Attempted: ${error.attempted.join(", ")}`;
            break;
          default:
            errorMessage = `Path resolution error: ${(error as any).kind || "unknown"}`;
            break;
        }
        return resultError({
          kind: "PathResolutionError",
          message: errorMessage,
        });
      }

      return resultOk(
        new UnifiedConfigInterface(unifiedConfig, patternProvider, pathOptionsResult.data),
      );
    } catch (error) {
      return resultError({
        kind: "ConfigLoadError",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Build unified configuration from components
   */
  private static async buildUnifiedConfig(
    baseConfig: BaseConfigStructure,
    patternProvider: AsyncConfigPatternProvider,
    workingDir: string,
    options: ConfigBuilderOptions,
  ): Promise<Result<UnifiedConfig, ConfigurationError>> {
    // Extract paths with defaults using type-safe helpers
    const promptBaseDir = extractBaseDir(baseConfig, "app_prompt") ||
      ".agent/breakdown/prompts";
    const schemaBaseDir = extractBaseDir(baseConfig, "app_schema") ||
      ".agent/breakdown/schema";
    const outputBaseDir = extractBaseDir(baseConfig, "output") || "output";

    // Get patterns from provider
    const patternsResult = await patternProvider.getAllPatterns();
    if (!patternsResult.ok) {
      return resultError({
        kind: "ConfigLoadError",
        message: `Failed to get patterns: ${patternsResult.error.kind}`,
      });
    }
    const patterns = patternsResult.data;

    // Build unified config
    const config: UnifiedConfig = {
      profile: {
        name: options.profile || "default",
        description: extractNestedProperty<string | null>(
          baseConfig,
          ["profile", "description"],
          null,
        ),
        environment: this.detectEnvironment(),
        priority: 0,
        source: options.profile ? "user" : "default",
      },

      paths: {
        workingDirectory: workingDir,
        resourceDirectory: resolve(workingDir, ".agent/breakdown"),
        promptBaseDir: this.resolvePath(workingDir, promptBaseDir),
        schemaBaseDir: this.resolvePath(workingDir, schemaBaseDir),
        outputBaseDir: this.resolvePath(workingDir, outputBaseDir),
        ...(options.pathOverrides || {}),
      },

      patterns: {
        directiveTypes: patterns.directive ? [patterns.directive.getPattern()] : [],
        layerTypes: patterns.layer ? [patterns.layer.getPattern()] : [],
        customPatterns: null,
      },

      app: {
        version: DEPENDENCY_VERSIONS.BREAKDOWN_CONFIG,
        features: {
          extendedThinking: extractNestedProperty<boolean>(baseConfig, [
            "features",
            "extendedThinking",
          ], false),
          debugMode: extractNestedProperty<boolean>(baseConfig, ["features", "debugMode"], false),
          strictValidation: extractNestedProperty<boolean>(baseConfig, [
            "features",
            "strictValidation",
          ], true),
          autoSchema: extractNestedProperty<boolean>(baseConfig, ["features", "autoSchema"], true),
        },
        limits: {
          maxFileSize: extractNestedProperty<number>(
            baseConfig,
            ["limits", "maxFileSize"],
            10485760,
          ), // 10MB
          maxPromptLength: extractNestedProperty<number>(
            baseConfig,
            ["limits", "maxPromptLength"],
            50000,
          ),
          maxVariables: extractNestedProperty<number>(baseConfig, ["limits", "maxVariables"], 100),
        },
      },

      user: {
        customVariables: extractNestedProperty<Record<string, string> | null>(baseConfig, [
          "user",
          "customVariables",
        ], null),
        aliases: extractNestedProperty<Record<string, string> | null>(baseConfig, [
          "user",
          "aliases",
        ], null),
        templates: extractNestedProperty<Record<string, string> | null>(baseConfig, [
          "user",
          "templates",
        ], null),
      },

      environment: {
        logLevel: this.getLogLevel(baseConfig),
        colorOutput: extractNestedProperty<boolean>(
          baseConfig,
          ["environment", "colorOutput"],
          true,
        ),
        timezone: extractNestedProperty<string | null>(
          baseConfig,
          ["environment", "timezone"],
          null,
        ),
        locale: extractNestedProperty<string | null>(baseConfig, ["environment", "locale"], null),
        ...(options.environmentOverrides || {}),
      },

      raw: baseConfig,
    };

    return resultOk(config);
  }

  /**
   * Get the configuration
   */
  getConfig(): UnifiedConfig {
    return this.config;
  }

  /**
   * Get pattern provider
   */
  getPatternProvider(): AsyncConfigPatternProvider {
    return this.patternProvider;
  }

  /**
   * Get path resolution options
   */
  getPathOptions(): PathResolutionOption {
    return this.pathOptions;
  }

  /**
   * Get specific configuration value by path
   */
  get<T = unknown>(path: string): T | undefined {
    const parts = path.split(".");
    let current: unknown = this.config;

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = extractNestedProperty(current, [part], undefined);
      } else {
        return undefined;
      }
    }

    return current as T;
  }

  /**
   * Check if configuration has specific path
   */
  has(path: string): boolean {
    return this.get(path) !== undefined;
  }

  /**
   * Get available profiles
   */
  async getAvailableProfiles(): Promise<string[]> {
    const profiles: string[] = ["default"];

    // Check user config directory
    const userConfigDir = resolve(Deno.env.get("HOME") || "", ".breakdown/profiles");
    if (existsSync(userConfigDir)) {
      try {
        for await (const entry of Deno.readDir(userConfigDir)) {
          if (entry.isFile && entry.name.endsWith(".yml")) {
            profiles.push(entry.name.replace(".yml", ""));
          }
        }
      } catch {
        // Ignore errors reading user profiles
      }
    }

    // Check project config directory
    const projectConfigDir = resolve(this.config.paths.workingDirectory, ".breakdown/profiles");
    if (existsSync(projectConfigDir)) {
      try {
        for await (const entry of Deno.readDir(projectConfigDir)) {
          if (entry.isFile && entry.name.endsWith(".yml")) {
            const profileName = entry.name.replace(".yml", "");
            if (!profiles.includes(profileName)) {
              profiles.push(profileName);
            }
          }
        }
      } catch {
        // Ignore errors reading project profiles
      }
    }

    return profiles;
  }

  /**
   * Switch to different profile
   */
  async switchProfile(
    profileName: string,
  ): Promise<Result<UnifiedConfigInterface, ConfigurationError>> {
    const availableProfiles = await this.getAvailableProfiles();

    if (!availableProfiles.includes(profileName)) {
      return resultError({
        kind: "ProfileNotFound",
        profile: profileName,
        available: availableProfiles,
      });
    }

    return UnifiedConfigInterface.create({
      profile: profileName,
      workingDirectory: this.config.paths.workingDirectory,
      environmentOverrides: null,
      pathOverrides: null,
    });
  }

  /**
   * Validate configuration
   */
  validate(): Result<void, ConfigurationError> {
    // Validate paths exist
    const requiredPaths = [
      { path: this.config.paths.workingDirectory, field: "workingDirectory" },
    ];

    for (const { path, field } of requiredPaths) {
      if (!existsSync(path)) {
        return resultError({
          kind: "ValidationError",
          field: `paths.${field}`,
          message: `Required path does not exist: ${path}`,
        });
      }
    }

    // Validate patterns
    if (this.config.patterns.directiveTypes.length === 0) {
      return resultError({
        kind: "ValidationError",
        field: "patterns.directiveTypes",
        message: "At least one directive type is required",
      });
    }

    if (this.config.patterns.layerTypes.length === 0) {
      return resultError({
        kind: "ValidationError",
        field: "patterns.layerTypes",
        message: "At least one layer type is required",
      });
    }

    // Validate limits
    if (this.config.app.limits.maxFileSize <= 0) {
      return resultError({
        kind: "ValidationError",
        field: "app.limits.maxFileSize",
        message: "Max file size must be positive",
      });
    }

    return resultOk(undefined);
  }

  /**
   * Export configuration for debugging
   */
  export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Helper: Resolve path relative to working directory
   */
  private static resolvePath(workingDir: string, path: string): string {
    if (!path) return workingDir;
    return path.startsWith("/") ? path : resolve(workingDir, path);
  }

  /**
   * Helper: Detect current environment
   */
  private static detectEnvironment(): "development" | "production" | "test" | null {
    const env = Deno.env.get("DENO_ENV") || Deno.env.get("NODE_ENV");

    if (env === "production" || env === "prod") return "production";
    if (env === "test" || Deno.env.get("CI") === "true") return "test";
    if (env === "development" || env === "dev") return "development";
    return null;
  }

  /**
   * Helper: Get log level from config or environment
   */
  private static getLogLevel(
    config: BaseConfigStructure,
  ): UnifiedConfig["environment"]["logLevel"] {
    const envLevel = Deno.env.get("LOG_LEVEL");
    const configLevel = extractNestedProperty<string>(config, ["environment", "logLevel"], "info");

    const level = envLevel || configLevel || "info";

    if (["debug", "info", "warn", "error"].includes(level)) {
      return level as UnifiedConfig["environment"]["logLevel"];
    }

    return "info";
  }
}

/**
 * Configuration presets for common use cases
 */
export const CONFIG_PRESETS = {
  /**
   * Development configuration
   */
  development: {
    environmentOverrides: {
      logLevel: "debug" as const,
      colorOutput: true,
    },
  },

  /**
   * Production configuration
   */
  production: {
    environmentOverrides: {
      logLevel: "warn" as const,
      colorOutput: false,
    },
  },

  /**
   * Testing configuration
   */
  test: {
    environmentOverrides: {
      logLevel: "error" as const,
      colorOutput: false,
    },
    pathOverrides: {
      outputBaseDir: "/tmp/breakdown-test",
    },
  },
} as const;

/**
 * Format configuration error for user display
 */
export function formatConfigLoadError(error: ConfigurationError): string {
  switch (error.kind) {
    case "ConfigurationError":
      return `Configuration error: ${error.message}`;

    case "ProfileNotFound":
      return `Configuration profile not found: ${error.profile}\n` +
        `Available profiles: ${error.availableProfiles?.join(", ") || "none"}`;

    case "InvalidConfiguration":
      return `Configuration validation error in ${error.field}: ${error.reason}`;

    case "ConfigLoadError":
      return `Configuration load error: ${error.message}`;

    default:
      return `Unknown configuration error: ${JSON.stringify(error)}`;
  }
}
