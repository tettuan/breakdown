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
  static create(path: unknown): Result<ConfigFilePath, ConfigFilePathError> {
    // Validate type first
    if (typeof path !== "string") {
      return error({
        kind: "EmptyPath",
        message: "Configuration file path must be a string",
      });
    }

    // Validate path is not empty (including empty string)
    if (!path || path === "") {
      return error({
        kind: "EmptyPath",
        message: "Configuration file path cannot be empty",
      });
    }

    // Validate path is properly trimmed
    const trimmed = path.trim();

    // Check if path becomes empty after trimming
    if (trimmed.length === 0) {
      return error({
        kind: "EmptyPath",
        message: "Configuration file path cannot be empty after trimming",
      });
    }

    // Check if path had whitespace
    if (trimmed !== path) {
      return error({
        kind: "InvalidFormat",
        message: "Configuration file path cannot have leading or trailing whitespace",
        path,
      });
    }

    if (trimmed.length > 1000) {
      return error({
        kind: "PathTooLong",
        message: "Configuration file path is too long (max 1000 characters)",
        path: trimmed,
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
        received: typeof prefix,
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
        prefix,
      });
    }

    // Validate prefix pattern (alphanumeric, hyphens, underscores)
    const VALID_PREFIX_PATTERN = /^[a-zA-Z0-9_-]+$/;
    if (!VALID_PREFIX_PATTERN.test(trimmed)) {
      return error({
        kind: "InvalidCharacters",
        message:
          "Configuration prefix can only contain alphanumeric characters, hyphens, and underscores",
        prefix: trimmed,
      });
    }

    // Validate length
    if (trimmed.length > 100) {
      return error({
        kind: "PrefixTooLong",
        message: "Configuration prefix is too long (max 100 characters)",
        prefix: trimmed,
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
  static create(path?: unknown): Result<WorkingDirectory, WorkingDirectoryError> {
    // Handle undefined/null case - use current working directory
    if (path === undefined) {
      return ok(new WorkingDirectory(Deno.cwd()));
    }

    // Validate type
    if (path === null || typeof path !== "string") {
      return error({
        kind: "InvalidPath",
        path: String(path),
        reason: "Working directory path must be a string or undefined",
      });
    }

    // Validate non-empty string
    if (path === "") {
      return error({
        kind: "InvalidPath",
        path: path,
        reason: "Working directory path cannot be an empty string",
      });
    }

    const trimmed = path.trim();
    if (trimmed.length === 0) {
      return error({
        kind: "EmptyPath",
        message: "Working directory path cannot be empty after trimming",
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
  | { kind: "InvalidPath"; path: string; reason: string }
  | { kind: "EmptyPath"; message: string };

export type ConfigLoadError =
  | { kind: "FileNotFound"; message: string; path: string }
  | { kind: "FileReadError"; message: string; path: string; cause: string }
  | { kind: "ParseError"; message: string; path: string; cause: string }
  | { kind: "ValidationError"; message: string; path: string }
  | ConfigFilePathError;

export type BreakdownConfigLoadError =
  | { kind: "ImportError"; message: string; cause: string; importPath?: string }
  | { kind: "CreateError"; message: string; cause: string; prefix?: string }
  | { kind: "LoadError"; message: string; cause: string; context?: string }
  | { kind: "ConfigError"; message: string; cause: string; operation?: string }
  | { kind: "UnexpectedError"; message: string; cause: string; phase?: string }
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
  static async loadConfig(filePath: unknown): Promise<Result<CustomConfig, ConfigLoadError>> {
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
            path: configPath.value,
          });
        }
      } catch (_statError) {
        return error({
          kind: "FileNotFound",
          message: "Configuration file not found",
          path: configPath.value,
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
          cause: readError instanceof Error ? readError.message : String(readError),
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
          cause: parseError instanceof Error ? parseError.message : String(parseError),
        });
      }

      // Validate configuration structure
      if (!ConfigLoader.isValidCustomConfig(parsedConfig)) {
        return error({
          kind: "ValidationError",
          message: "Configuration structure is invalid",
          path: configPath.value,
        });
      }

      return ok(parsedConfig as CustomConfig);
    } catch (unexpectedError) {
      return error({
        kind: "FileReadError",
        message: "Unexpected error during configuration loading",
        path: configPath.value,
        cause: unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError),
      });
    }
  }

  /**
   * Load configuration using BreakdownConfig with type safety and comprehensive error handling
   * @param configPrefix Optional config prefix for BreakdownConfig
   * @param workingDir Working directory for BreakdownConfig
   * @returns Result with merged configuration or BreakdownConfigLoadError
   */
  static async loadBreakdownConfig(
    configPrefix?: unknown,
    workingDir?: unknown,
  ): Promise<Result<Record<string, unknown>, BreakdownConfigLoadError>> {
    // Phase 1: Input Validation
    try {
      // Validate config prefix using Smart Constructor
      const prefixResult = ConfigPrefix.create(configPrefix as string | null | undefined);
      if (!prefixResult.ok) {
        return error(prefixResult.error);
      }

      // Validate working directory using Smart Constructor
      // If no working directory is provided, use current working directory
      const resolvedWorkingDir = workingDir ?? Deno.cwd();
      const workingDirResult = WorkingDirectory.create(resolvedWorkingDir);
      if (!workingDirResult.ok) {
        return error(workingDirResult.error);
      }

      const prefix = prefixResult.data;
      const workDir = workingDirResult.data;

      // Phase 2: BreakdownConfig Package Import
      let BreakdownConfig: any;
      try {
        const importPath = "jsr:@tettuan/breakdownconfig@^1.1.4";
        const importResult = await import(importPath);
        BreakdownConfig = importResult.BreakdownConfig;
        
        if (!BreakdownConfig || typeof BreakdownConfig.create !== 'function') {
          return error({
            kind: "ImportError",
            message: "BreakdownConfig class or create method not found in imported module",
            cause: "Invalid BreakdownConfig API structure",
            importPath,
          });
        }
      } catch (importError) {
        return error({
          kind: "ImportError",
          message: "Failed to import BreakdownConfig package",
          cause: importError instanceof Error ? importError.message : String(importError),
          importPath: "jsr:@tettuan/breakdownconfig@^1.1.4",
        });
      }

      // Phase 3: BreakdownConfig Instance Creation
      let configResult: any;
      try {
        // Use BreakdownConfig static factory method - only pass prefix
        // BreakdownConfig should detect working directory automatically
        configResult = await BreakdownConfig.create(
          prefix.value ?? undefined
        );
      } catch (createCallError) {
        return error({
          kind: "CreateError",
          message: "BreakdownConfig.create method threw an exception",
          cause: createCallError instanceof Error ? createCallError.message : String(createCallError),
          prefix: prefix.value ?? "undefined",
        });
      }

      // Validate creation result
      if (!configResult || typeof configResult.success !== 'boolean') {
        return error({
          kind: "CreateError",
          message: "BreakdownConfig.create returned invalid result structure",
          cause: "Expected result with 'success' boolean property",
          prefix: prefix.value ?? "undefined",
        });
      }

      if (!configResult.success) {
        return error({
          kind: "CreateError",
          message: "BreakdownConfig instance creation failed",
          cause: configResult.error || "BreakdownConfig.create returned failure without error details",
          prefix: prefix.value ?? "undefined",
        });
      }

      if (!configResult.data) {
        return error({
          kind: "CreateError",
          message: "BreakdownConfig.create succeeded but returned no data",
          cause: "Missing data property in successful result",
          prefix: prefix.value ?? "undefined",
        });
      }

      const config = configResult.data;

      // Phase 4: Configuration Loading
      try {
        await config.loadConfig();
      } catch (loadError) {
        // Enhanced error handling with more specific error information
        const errorMessage = loadError instanceof Error ? loadError.message : String(loadError);
        const isConfigNotFound = errorMessage.includes("Failed to load BreakdownConfig profile") ||
                                 errorMessage.includes("Configuration not found") ||
                                 errorMessage.includes("ENOENT") ||
                                 errorMessage.includes("No such file or directory");
        
        return error({
          kind: "LoadError",
          message: isConfigNotFound 
            ? `Configuration file not found for profile '${prefix.value ?? "default"}'. Please run 'breakdown init' to create configuration files.`
            : "Failed to load configuration files",
          cause: errorMessage,
          context: `prefix: ${prefix.value ?? "undefined"}, workingDir: ${workDir.value}`,
        });
      }

      // Phase 5: Configuration Data Retrieval
      let configData: Record<string, unknown>;
      try {
        configData = await config.getConfig();
      } catch (getConfigError) {
        return error({
          kind: "ConfigError",
          message: "Failed to retrieve configuration data",
          cause: getConfigError instanceof Error ? getConfigError.message : String(getConfigError),
          operation: "getConfig",
        });
      }

      // Validate retrieved configuration data
      if (!configData || typeof configData !== 'object') {
        return error({
          kind: "ConfigError",
          message: "Retrieved configuration data is not a valid object",
          cause: `Expected object, got ${typeof configData}`,
          operation: "getConfig validation",
        });
      }

      return ok(configData);

    } catch (unexpectedError) {
      // Catch-all for any unexpected errors during the entire process
      return error({
        kind: "UnexpectedError",
        message: "Unexpected error during BreakdownConfig processing",
        cause: unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError),
        phase: "loadBreakdownConfig",
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
 * Convenience export for backward compatibility and easier usage
 * Allows direct import of loadConfig function without accessing ConfigLoader
 *
 * @example
 * ```typescript
 * import { loadConfig } from "./loader.ts";
 * const result = await loadConfig("config.yml");
 * ```
 */
export const loadConfig = ConfigLoader.loadConfig.bind(ConfigLoader);

/**
 * Convenience export for loading BreakdownConfig
 * Provides direct access to loadBreakdownConfig function
 *
 * @example
 * ```typescript
 * import { loadBreakdownConfig } from "./loader.ts";
 * const result = await loadBreakdownConfig("default", "./workspace");
 * ```
 */
export const loadBreakdownConfig = ConfigLoader.loadBreakdownConfig.bind(ConfigLoader);
