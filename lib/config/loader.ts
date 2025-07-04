/**
 * @fileoverview Configuration loader with Smart Constructor pattern
 *
 * This module provides utilities to load and parse configuration files
 * following DDD and Totality principles. All operations return Result types
 * instead of throwing exceptions, ensuring type-safe configuration loading.
 *
 * ## Totality Principle
 * - All functions are total (no exceptions)
 * - Error cases are represented as values using Result types
 * - Smart Constructor pattern for type-safe creation
 *
 * @module config/loader
 */

import { parse } from "jsr:@std/yaml@^1.0.6";
import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";

/**
 * Configuration structure for custom configs
 * Immutable value object with explicit structure
 */
export interface CustomConfig {
  readonly customConfig?: {
    readonly findBugs?: {
      readonly enabled?: boolean;
      readonly sensitivity?: string;
      readonly patterns?: readonly string[];
      readonly includeExtensions?: readonly string[];
      readonly excludeDirectories?: readonly string[];
      readonly maxResults?: number;
      readonly detailedReports?: boolean;
    };
    readonly find?: {
      readonly twoParams?: readonly string[];
    };
  };
  readonly breakdownParams?: {
    readonly version?: string;
    readonly customConfig?: {
      readonly validation?: Record<string, unknown>;
      readonly params?: Record<string, unknown>;
      readonly options?: Record<string, unknown>;
    };
    readonly customParams?: Record<string, unknown>;
  };
  readonly [key: string]: unknown;
}

/**
 * Configuration file path value object
 * Ensures valid file paths with Smart Constructor pattern
 */
export class ConfigFilePath {
  private constructor(private readonly _path: string) {
    Object.freeze(this);
  }

  /**
   * Create ConfigFilePath with validation
   * @param path File path to validate
   * @returns Result with ConfigFilePath or error
   */
  static create(path: string): Result<ConfigFilePath, ConfigFilePathError> {
    // Validate path is not empty
    if (!path || typeof path !== "string") {
      return error({
        kind: "EmptyPath",
        message: "Configuration file path cannot be empty"
      });
    }

    // Validate path is properly trimmed
    const trimmed = path.trim();
    if (trimmed !== path) {
      return error({
        kind: "InvalidFormat",
        message: "Configuration file path cannot have leading or trailing whitespace",
        path
      });
    }

    // Validate path length
    if (trimmed.length === 0) {
      return error({
        kind: "EmptyPath",
        message: "Configuration file path cannot be empty after trimming"
      });
    }

    if (trimmed.length > 1000) {
      return error({
        kind: "PathTooLong",
        message: "Configuration file path is too long (max 1000 characters)",
        path: trimmed
      });
    }

    return ok(new ConfigFilePath(trimmed));
  }

  /**
   * Get the validated file path
   */
  get value(): string {
    return this._path;
  }

  /**
   * String representation
   */
  toString(): string {
    return `ConfigFilePath(${this._path})`;
  }
}

/**
 * Configuration prefix value object for BreakdownConfig integration
 */
export class ConfigPrefix {
  private constructor(private readonly _prefix: string | null) {
    Object.freeze(this);
  }

  /**
   * Create ConfigPrefix with validation
   * @param prefix Optional config prefix
   * @returns Result with ConfigPrefix or error
   */
  static create(prefix?: string | null): Result<ConfigPrefix, ConfigPrefixError> {
    // Handle null/undefined as valid (no prefix)
    if (prefix === null || prefix === undefined) {
      return ok(new ConfigPrefix(null));
    }

    // Validate type
    if (typeof prefix !== "string") {
      return error({
        kind: "InvalidType",
        message: "Configuration prefix must be a string or null",
        received: typeof prefix
      });
    }

    // Handle empty string as null
    if (prefix === "") {
      return ok(new ConfigPrefix(null));
    }

    // Validate prefix format
    const trimmed = prefix.trim();
    if (trimmed !== prefix) {
      return error({
        kind: "InvalidFormat",
        message: "Configuration prefix cannot have leading or trailing whitespace",
        prefix
      });
    }

    // Validate prefix pattern (alphanumeric, hyphens, underscores)
    const VALID_PREFIX_PATTERN = /^[a-zA-Z0-9_-]+$/;
    if (!VALID_PREFIX_PATTERN.test(trimmed)) {
      return error({
        kind: "InvalidCharacters",
        message: "Configuration prefix can only contain alphanumeric characters, hyphens, and underscores",
        prefix: trimmed
      });
    }

    // Validate length
    if (trimmed.length > 100) {
      return error({
        kind: "PrefixTooLong",
        message: "Configuration prefix is too long (max 100 characters)",
        prefix: trimmed
      });
    }

    return ok(new ConfigPrefix(trimmed));
  }

  /**
   * Get the validated prefix (null if no prefix)
   */
  get value(): string | null {
    return this._prefix;
  }

  /**
   * Check if prefix is set
   */
  get hasValue(): boolean {
    return this._prefix !== null;
  }

  /**
   * String representation
   */
  toString(): string {
    return `ConfigPrefix(${this._prefix ?? "null"})`;
  }
}

/**
 * Working directory value object
 */
export class WorkingDirectory {
  private constructor(private readonly _path: string) {
    Object.freeze(this);
  }

  /**
   * Create WorkingDirectory with validation
   * @param path Directory path
   * @returns Result with WorkingDirectory or error
   */
  static create(path?: string): Result<WorkingDirectory, WorkingDirectoryError> {
    // Default to current working directory if not provided
    const targetPath = path ?? Deno.cwd();

    // Validate path
    if (!targetPath || typeof targetPath !== "string") {
      return error({
        kind: "InvalidPath",
        message: "Working directory path must be a non-empty string",
        path: targetPath
      });
    }

    const trimmed = targetPath.trim();
    if (trimmed.length === 0) {
      return error({
        kind: "EmptyPath",
        message: "Working directory path cannot be empty"
      });
    }

    return ok(new WorkingDirectory(trimmed));
  }

  /**
   * Get the validated directory path
   */
  get value(): string {
    return this._path;
  }

  /**
   * String representation
   */
  toString(): string {
    return `WorkingDirectory(${this._path})`;
  }
}

/**
 * Error types for configuration loading
 */
export type ConfigFilePathError =
  | { kind: "EmptyPath"; message: string }
  | { kind: "InvalidFormat"; message: string; path: string }
  | { kind: "PathTooLong"; message: string; path: string };

export type ConfigPrefixError =
  | { kind: "InvalidType"; message: string; received: string }
  | { kind: "InvalidFormat"; message: string; prefix: string }
  | { kind: "InvalidCharacters"; message: string; prefix: string }
  | { kind: "PrefixTooLong"; message: string; prefix: string };

export type WorkingDirectoryError =
  | { kind: "InvalidPath"; message: string; path: unknown }
  | { kind: "EmptyPath"; message: string };

export type ConfigLoadError =
  | { kind: "FileNotFound"; message: string; path: string }
  | { kind: "FileReadError"; message: string; path: string; cause: string }
  | { kind: "ParseError"; message: string; path: string; cause: string }
  | { kind: "ValidationError"; message: string; path: string }
  | ConfigFilePathError;

export type BreakdownConfigLoadError =
  | { kind: "CreateError"; message: string; cause: string }
  | { kind: "LoadError"; message: string; cause: string }
  | { kind: "ConfigError"; message: string; cause: string }
  | ConfigPrefixError
  | WorkingDirectoryError;

/**
 * Configuration loader with Smart Constructor pattern
 * Provides type-safe configuration loading with Result-based error handling
 */
export class ConfigLoader {
  private constructor() {
    // Prevent direct instantiation
  }

  /**
   * Load and parse a YAML configuration file with type safety
   * @param filePath Configuration file path
   * @returns Result with parsed CustomConfig or ConfigLoadError
   */
  static async loadConfig(filePath: string): Promise<Result<CustomConfig, ConfigLoadError>> {
    // Validate file path using Smart Constructor
    const pathResult = ConfigFilePath.create(filePath);
    if (!pathResult.ok) {
      return error(pathResult.error);
    }

    const configPath = pathResult.data;

    try {
      // Check if file exists before attempting to read
      try {
        const fileInfo = await Deno.stat(configPath.value);
        if (!fileInfo.isFile) {
          return error({
            kind: "FileNotFound",
            message: "Path exists but is not a file",
            path: configPath.value
          });
        }
      } catch {
        return error({
          kind: "FileNotFound",
          message: "Configuration file not found",
          path: configPath.value
        });
      }

      // Read file content
      let content: string;
      try {
        content = await Deno.readTextFile(configPath.value);
      } catch (readError) {
        return error({
          kind: "FileReadError",
          message: "Failed to read configuration file",
          path: configPath.value,
          cause: readError instanceof Error ? readError.message : String(readError)
        });
      }

      // Parse YAML content
      let parsedConfig: unknown;
      try {
        parsedConfig = parse(content);
      } catch (parseError) {
        return error({
          kind: "ParseError",
          message: "Failed to parse YAML configuration",
          path: configPath.value,
          cause: parseError instanceof Error ? parseError.message : String(parseError)
        });
      }

      // Validate configuration structure
      if (!ConfigLoader.isValidCustomConfig(parsedConfig)) {
        return error({
          kind: "ValidationError",
          message: "Configuration structure is invalid",
          path: configPath.value
        });
      }

      return ok(parsedConfig as CustomConfig);
    } catch (unexpectedError) {
      return error({
        kind: "FileReadError",
        message: "Unexpected error during configuration loading",
        path: configPath.value,
        cause: unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError)
      });
    }
  }

  /**
   * Load configuration using BreakdownConfig with type safety
   * @param configPrefix Optional config prefix for BreakdownConfig
   * @param workingDir Working directory for BreakdownConfig  
   * @returns Result with merged configuration or BreakdownConfigLoadError
   */
  static async loadBreakdownConfig(
    configPrefix?: string | null,
    workingDir?: string
  ): Promise<Result<Record<string, unknown>, BreakdownConfigLoadError>> {
    // Validate config prefix using Smart Constructor
    const prefixResult = ConfigPrefix.create(configPrefix);
    if (!prefixResult.ok) {
      return error(prefixResult.error);
    }

    // Validate working directory using Smart Constructor
    const workingDirResult = WorkingDirectory.create(workingDir);
    if (!workingDirResult.ok) {
      return error(workingDirResult.error);
    }

    const prefix = prefixResult.data;
    const workDir = workingDirResult.data;

    try {
      // Dynamic import using latest version (managed in versions.ts: 1.1.4)
      const { BreakdownConfig } = await import("jsr:@tettuan/breakdownconfig@^1.1.4");

      // Use BreakdownConfig static factory method (convert null to undefined)
      const configResult = await BreakdownConfig.create(prefix.value ?? undefined);
      if (!configResult.success) {
        return error({
          kind: "CreateError",
          message: "Failed to create BreakdownConfig instance",
          cause: "BreakdownConfig.create returned failure"
        });
      }

      const config = configResult.data;
      
      // Load configuration
      try {
        await config.loadConfig();
      } catch (loadError) {
        return error({
          kind: "LoadError",
          message: "Failed to load BreakdownConfig",
          cause: loadError instanceof Error ? loadError.message : String(loadError)
        });
      }

      // Get configuration data
      let configData: Record<string, unknown>;
      try {
        configData = await config.getConfig();
      } catch (getConfigError) {
        return error({
          kind: "ConfigError",
          message: "Failed to get configuration data",
          cause: getConfigError instanceof Error ? getConfigError.message : String(getConfigError)
        });
      }

      return ok(configData);
    } catch (importError) {
      return error({
        kind: "CreateError",
        message: "Failed to import or initialize BreakdownConfig",
        cause: importError instanceof Error ? importError.message : String(importError)
      });
    }
  }

  /**
   * Validate CustomConfig structure
   * @param config Unknown configuration object
   * @returns True if valid CustomConfig structure
   */
  private static isValidCustomConfig(config: unknown): config is CustomConfig {
    // Allow null, undefined, or object types
    if (config === null || config === undefined) {
      return true;
    }
    
    if (typeof config !== "object") {
      return false;
    }

    // Basic validation - accept any object structure as valid CustomConfig
    // This maintains backward compatibility with existing tests
    return true;
  }
}

/**
 * Legacy function wrapper for backward compatibility
 * @deprecated Use ConfigLoader.loadConfig instead
 */
export async function loadConfig(filePath: string): Promise<CustomConfig> {
  try {
    const content = await Deno.readTextFile(filePath);
    const config = parse(content) as CustomConfig;
    return config;
  } catch (error) {
    throw new Error(
      `Failed to load config from ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Legacy function wrapper for backward compatibility
 * @deprecated Use ConfigLoader.loadBreakdownConfig instead
 */
export async function loadBreakdownConfig(
  configPrefix?: string | null,
  _workingDir?: string,
): Promise<Record<string, unknown>> {
  // Dynamic import using latest version (managed in versions.ts: 1.1.4)
  const { BreakdownConfig } = await import("jsr:@tettuan/breakdownconfig@^1.1.4");

  // Use BreakdownConfig static factory method (convert null to undefined)
  const configResult = await BreakdownConfig.create(configPrefix ?? undefined);
  if (!configResult.success) {
    throw new Error(`Failed to create BreakdownConfig`);
  }
  const config = configResult.data;
  await config.loadConfig();
  return await config.getConfig();
}
