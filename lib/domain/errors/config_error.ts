/**
 * @fileoverview Configuration Domain Errors
 * 
 * Errors related to configuration loading, validation, and management.
 * Covers both application and user configuration issues.
 * 
 * @module domain/errors/config_error
 */

import { BaseBreakdownError } from "./breakdown_error.ts";

/**
 * Configuration error types
 */
export type ConfigErrorKind =
  | "config-not-found"
  | "config-invalid-format"
  | "config-validation-failed"
  | "config-missing-required"
  | "config-type-mismatch"
  | "config-permission-denied"
  | "config-io-error"
  | "profile-not-found"
  | "profile-invalid";

/**
 * Configuration Error
 * Thrown when configuration operations fail
 */
export class ConfigError extends BaseBreakdownError {
  readonly domain = "config" as const;
  readonly kind: ConfigErrorKind;

  constructor(
    kind: ConfigErrorKind,
    message: string,
    options?: {
      cause?: Error;
      context?: {
        configPath?: string;
        profileName?: string;
        field?: string;
        value?: unknown;
        expected?: string;
        actual?: string;
        missingFields?: readonly string[];
        validationErrors?: Array<{ field: string; error: string }>;
        operation?: string;
        availableProfiles?: readonly string[];
      };
    }
  ) {
    super(message, options);
    this.kind = kind;
  }

  /**
   * Create error for config file not found
   */
  static notFound(configPath: string, profileName?: string): ConfigError {
    const message = profileName
      ? `Configuration file not found for profile '${profileName}': ${configPath}`
      : `Configuration file not found: ${configPath}`;

    return new ConfigError(
      "config-not-found",
      message,
      {
        context: { configPath, profileName }
      }
    );
  }

  /**
   * Create error for invalid config format
   */
  static invalidFormat(
    configPath: string,
    reason: string,
    cause?: Error
  ): ConfigError {
    return new ConfigError(
      "config-invalid-format",
      `Invalid configuration format in '${configPath}': ${reason}`,
      {
        cause,
        context: { configPath, expected: "valid YAML format" }
      }
    );
  }

  /**
   * Create error for config validation failure
   */
  static validationFailed(
    configPath: string,
    validationErrors: Array<{ field: string; error: string }>
  ): ConfigError {
    const errorMessages = validationErrors
      .map(e => `  - ${e.field}: ${e.error}`)
      .join('\n');

    return new ConfigError(
      "config-validation-failed",
      `Configuration validation failed in '${configPath}':\n${errorMessages}`,
      {
        context: { configPath, validationErrors }
      }
    );
  }

  /**
   * Create error for missing required config fields
   */
  static missingRequired(
    configPath: string,
    missingFields: string[]
  ): ConfigError {
    const fields = missingFields.join(', ');
    return new ConfigError(
      "config-missing-required",
      `Missing required configuration fields in '${configPath}': ${fields}`,
      {
        context: { configPath, missingFields }
      }
    );
  }

  /**
   * Create error for type mismatch
   */
  static typeMismatch(
    field: string,
    expected: string,
    actual: string,
    value?: unknown
  ): ConfigError {
    return new ConfigError(
      "config-type-mismatch",
      `Configuration field '${field}' has wrong type: expected ${expected}, got ${actual}`,
      {
        context: { field, expected, actual, value }
      }
    );
  }

  /**
   * Create error for permission denied
   */
  static permissionDenied(configPath: string, cause?: Error): ConfigError {
    return new ConfigError(
      "config-permission-denied",
      `Permission denied when accessing configuration file: ${configPath}`,
      {
        cause,
        context: { configPath }
      }
    );
  }

  /**
   * Create error for IO issues
   */
  static ioError(configPath: string, operation: string, cause?: Error): ConfigError {
    return new ConfigError(
      "config-io-error",
      `IO error during ${operation} of configuration file: ${configPath}`,
      {
        cause,
        context: { configPath, operation }
      }
    );
  }

  /**
   * Create error for profile not found
   */
  static profileNotFound(profileName: string, availableProfiles: string[]): ConfigError {
    const suggestions = availableProfiles
      .filter(p => p.includes(profileName) || profileName.includes(p))
      .slice(0, 3);

    const message = suggestions.length > 0
      ? `Configuration profile '${profileName}' not found. Did you mean: ${suggestions.join(', ')}?`
      : `Configuration profile '${profileName}' not found`;

    return new ConfigError(
      "profile-not-found",
      message,
      {
        context: { profileName, availableProfiles }
      }
    );
  }

  /**
   * Create error for invalid profile
   */
  static profileInvalid(profileName: string, reason: string): ConfigError {
    return new ConfigError(
      "profile-invalid",
      `Invalid configuration profile '${profileName}': ${reason}`,
      {
        context: { profileName }
      }
    );
  }

  /**
   * Get user-friendly error message
   */
  override getUserMessage(): string {
    const base = super.getUserMessage();
    
    // Add helpful context for common errors
    switch (this.kind) {
      case "config-not-found":
        return `${base}\n\nRun 'breakdown init' to create a default configuration.`;
      case "config-invalid-format":
        return `${base}\n\nCheck that your configuration file is valid YAML format.`;
      case "config-validation-failed":
        return `${base}\n\nRefer to the documentation for valid configuration options.`;
      case "config-permission-denied":
        return `${base}\n\nCheck file permissions and ensure you have read access.`;
      default:
        return base;
    }
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    switch (this.kind) {
      case "config-not-found":
      case "config-missing-required":
        // Can be recovered by creating/updating config
        return true;
      case "config-permission-denied":
        // Might be recoverable by fixing permissions
        return true;
      case "config-io-error":
        // Depends on the specific IO error
        return false;
      default:
        // Most config errors require manual intervention
        return true;
    }
  }

  /**
   * Get specific recovery suggestions
   */
  getRecoverySuggestions(): string[] {
    const suggestions: string[] = [];

    switch (this.kind) {
      case "config-not-found":
        suggestions.push("Run 'breakdown init' to create default configuration");
        suggestions.push(`Create config file at: ${this.context?.configPath}`);
        break;
      case "config-invalid-format":
        suggestions.push("Validate your YAML syntax using a YAML validator");
        suggestions.push("Check for proper indentation and structure");
        break;
      case "config-validation-failed":
        if (this.context?.validationErrors && Array.isArray(this.context.validationErrors)) {
          suggestions.push("Fix the following validation errors:");
          this.context.validationErrors.forEach(e => {
            suggestions.push(`  - ${e.field}: ${e.error}`);
          });
        }
        break;
      case "config-missing-required":
        if (this.context?.missingFields && Array.isArray(this.context.missingFields)) {
          suggestions.push(`Add the missing fields: ${this.context.missingFields.join(', ')}`);
        }
        suggestions.push("Refer to example configuration in documentation");
        break;
      case "config-type-mismatch":
        suggestions.push(`Change '${this.context?.field}' to type: ${this.context?.expected}`);
        break;
      case "config-permission-denied":
        suggestions.push(`Check file permissions: chmod 644 ${this.context?.configPath}`);
        suggestions.push("Ensure you have read access to the config directory");
        break;
      case "profile-not-found":
        suggestions.push("List available profiles: breakdown config list-profiles");
        if (this.context?.availableProfiles && Array.isArray(this.context.availableProfiles) && this.context.availableProfiles.length > 0) {
          suggestions.push(`Available profiles: ${this.context.availableProfiles.join(', ')}`);
        }
        break;
    }

    return suggestions;
  }

  /**
   * Get example configuration snippet
   */
  getConfigExample(): string | undefined {
    switch (this.kind) {
      case "config-missing-required":
        if (this.context?.missingFields && Array.isArray(this.context.missingFields) && this.context.missingFields.includes("directiveTypes")) {
          return `directiveTypes:
  - to
  - summary
  - defect`;
        }
        if (this.context?.missingFields && Array.isArray(this.context.missingFields) && this.context.missingFields.includes("layerTypes")) {
          return `layerTypes:
  - project
  - issue
  - task`;
        }
        break;
      case "config-type-mismatch":
        if (this.context?.field === "directiveTypes") {
          return `directiveTypes: ["to", "summary", "defect"]  # Must be an array`;
        }
        break;
    }
    return undefined;
  }
}