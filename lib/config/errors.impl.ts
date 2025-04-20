/**
 * Base class for all configuration-related errors
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Thrown when a required configuration value is missing
 */
export class MissingConfigError extends ConfigError {
  constructor(key: string) {
    super(`Missing required configuration value: ${key}`);
    this.name = "MissingConfigError";
  }
}

/**
 * Thrown when a configuration value is invalid
 */
export class InvalidConfigError extends ConfigError {
  constructor(key: string, value: unknown, reason: string) {
    super(`Invalid configuration value for ${key}: ${String(value)} (${reason})`);
    this.name = "InvalidConfigError";
  }
}

/**
 * Thrown when a configuration directory is invalid or inaccessible
 */
export class InvalidDirectoryError extends ConfigError {
  constructor(path: string, reason: string) {
    super(`Invalid directory at ${path}: ${reason}`);
    this.name = "InvalidDirectoryError";
  }
}

/**
 * Thrown when there's an error loading the configuration file
 */
export class ConfigLoadError extends ConfigError {
  constructor(path: string, reason: string) {
    super(`Failed to load configuration from ${path}: ${reason}`);
    this.name = "ConfigLoadError";
  }
}

/**
 * Thrown when there's an error saving the configuration file
 */
export class ConfigSaveError extends ConfigError {
  constructor(path: string, reason: string) {
    super(`Failed to save configuration to ${path}: ${reason}`);
    this.name = "ConfigSaveError";
  }
}
