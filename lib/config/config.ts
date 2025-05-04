import { ensureDir } from "jsr:@std/fs@^0.224.0";
import { normalize } from "jsr:@std/path@^0.224.0";
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
    promptBaseDir: string;
    debug: boolean;
  } = DEFAULT_CONFIG.app_prompt;
  app_schema: {
    schemaBaseDir: string;
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

    if (config.app_prompt?.promptBaseDir) {
      normalized.app_prompt = {
        promptBaseDir: normalize(config.app_prompt.promptBaseDir),
        debug: config.app_prompt.debug ?? this.app_prompt.debug,
      };
    }

    if (config.app_schema?.schemaBaseDir) {
      normalized.app_schema = {
        schemaBaseDir: normalize(config.app_schema.schemaBaseDir),
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

    if (!config.app_prompt?.promptBaseDir?.trim()) {
      throw new InvalidConfigError(
        "app_prompt.promptBaseDir",
        config.app_prompt?.promptBaseDir,
        "Prompt directory cannot be empty",
      );
    }

    if (!config.app_schema?.schemaBaseDir?.trim()) {
      throw new InvalidConfigError(
        "app_schema.schemaBaseDir",
        config.app_schema?.schemaBaseDir,
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
