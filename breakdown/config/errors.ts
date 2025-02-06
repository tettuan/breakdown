export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ConfigLoadError extends ConfigError {
  override cause?: Error;

  constructor(path: string, cause?: unknown) {
    super(`Failed to load config from: ${path}`);
    this.name = 'ConfigLoadError';
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
} 