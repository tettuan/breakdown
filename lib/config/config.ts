import { ensureDir } from "jsr:@std/fs";
import { normalize } from "jsr:@std/path";
import { Config, DEFAULT_CONFIG, PartialConfig } from "./types.ts";
import { InvalidConfigError, InvalidDirectoryError, MissingConfigError } from "./errors.impl.ts";

/**
 * Gets a nested value from an object using a dot-notation path
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: unknown, key: string) => {
    return current && typeof current === "object"
      ? (current as Record<string, unknown>)[key]
      : undefined;
  }, obj);
}

/**
 * Configuration manager that implements the Config interface
 */
export class ConfigManager implements Config {
  working_dir: string = DEFAULT_CONFIG.working_dir;
  workingDirectory: string = DEFAULT_CONFIG.workingDirectory;
  workspaceStructure: {
    root: string;
    directories: {
      prompt: string;
      schema: string;
      output: string;
      temp: string;
      [key: string]: string;
    };
  } = DEFAULT_CONFIG.workspaceStructure;
  app_prompt: {
    base_dir: string;
    debug: boolean;
  } = DEFAULT_CONFIG.app_prompt;
  app_schema: {
    base_dir: string;
  } = DEFAULT_CONFIG.app_schema;
  [key: string]: unknown;

  constructor() {
    // No need for Object.assign since we're using property initializers
  }

  public async initialize(options: { workingDir: string }): Promise<void> {
    if (!options.workingDir) {
      throw new MissingConfigError("workingDir");
    }

    this.working_dir = options.workingDir;
    this.workingDirectory = options.workingDir;

    try {
      await ensureDir(options.workingDir);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InvalidDirectoryError(
        options.workingDir,
        `Failed to create directory: ${errorMessage}`,
      );
    }
  }

  public getConfig(): Config {
    return this;
  }

  public updateConfig(newConfig: PartialConfig): void {
    const normalized = this.normalizeConfig(newConfig);
    Object.assign(this, normalized);
  }

  private normalizeConfig(config: PartialConfig): Config {
    const normalized = { ...this };

    if (config.working_dir) {
      normalized.working_dir = normalize(config.working_dir);
    }

    if (config.app_prompt?.base_dir) {
      normalized.app_prompt = {
        base_dir: normalize(config.app_prompt.base_dir),
        debug: config.app_prompt.debug ?? this.app_prompt.debug,
      };
    }

    if (config.app_schema?.base_dir) {
      normalized.app_schema = {
        base_dir: normalize(config.app_schema.base_dir),
      };
    }

    // Validate the configuration
    this.validateConfig(normalized);

    return normalized;
  }

  private validateConfig(config: Config): void {
    if (!config.working_dir?.trim()) {
      throw new InvalidConfigError(
        "working_dir",
        config.working_dir,
        "Working directory cannot be empty",
      );
    }

    if (!config.app_prompt?.base_dir?.trim()) {
      throw new InvalidConfigError(
        "app_prompt.base_dir",
        config.app_prompt?.base_dir,
        "Prompt directory cannot be empty",
      );
    }

    if (!config.app_schema?.base_dir?.trim()) {
      throw new InvalidConfigError(
        "app_schema.base_dir",
        config.app_schema?.base_dir,
        "Schema directory cannot be empty",
      );
    }
  }

  public toString(): string {
    return JSON.stringify(this, null, 2);
  }
}

// Export a singleton instance
export const config = new ConfigManager();

/**
 * Gets the current configuration
 */
export function getConfig(): Config {
  return config.getConfig();
}

/**
 * Initializes the configuration with new values
 */
export function initializeConfig(newConfig: PartialConfig = {}): void {
  config.updateConfig(newConfig);
}
