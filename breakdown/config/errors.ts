export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ConfigLoadError extends Error {
  constructor(path: string, cause?: unknown) {
    super(`Failed to load config from ${path}${cause ? `: ${cause}` : ''}`);
    this.name = 'ConfigLoadError';
  }
}

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
} 