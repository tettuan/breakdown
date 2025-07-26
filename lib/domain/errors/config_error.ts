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
  | "profile-invalid"
  | "config-data-invalid"
  | "config-hardcoded-fallback";

/**
 * Configuration Error
 * Thrown when configuration operations fail
 */
export class ConfigError extends BaseBreakdownError {
  override readonly domain = "config" as const;
  override readonly kind: ConfigErrorKind;

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
    },
  ) {
    super(message, "config", kind, options?.context);
    this.kind = kind;
    if (options?.cause) {
      this.cause = options.cause;
    }
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
        context: { configPath, profileName },
      },
    );
  }

  /**
   * Create error for invalid config format
   */
  static invalidFormat(
    configPath: string,
    reason: string,
    cause?: Error,
  ): ConfigError {
    return new ConfigError(
      "config-invalid-format",
      `Invalid configuration format in '${configPath}': ${reason}`,
      {
        cause,
        context: { configPath, expected: "valid YAML format" },
      },
    );
  }

  /**
   * Create error for config validation failure
   */
  static validationFailed(
    configPath: string,
    validationErrors: Array<{ field: string; error: string }>,
  ): ConfigError {
    const errorMessages = validationErrors
      .map((e) => `  - ${e.field}: ${e.error}`)
      .join("\n");

    return new ConfigError(
      "config-validation-failed",
      `Configuration validation failed in '${configPath}':\n${errorMessages}`,
      {
        context: { configPath, validationErrors },
      },
    );
  }

  /**
   * Create error for missing required config fields
   */
  static missingRequired(
    configPath: string,
    missingFields: string[],
  ): ConfigError {
    const fields = missingFields.join(", ");
    return new ConfigError(
      "config-missing-required",
      `Missing required configuration fields in '${configPath}': ${fields}`,
      {
        context: { configPath, missingFields },
      },
    );
  }

  /**
   * Create error for type mismatch
   */
  static typeMismatch(
    field: string,
    expected: string,
    actual: string,
    value?: unknown,
  ): ConfigError {
    return new ConfigError(
      "config-type-mismatch",
      `Configuration field '${field}' has wrong type: expected ${expected}, got ${actual}`,
      {
        context: { field, expected, actual, value },
      },
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
        context: { configPath },
      },
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
        context: { configPath, operation },
      },
    );
  }

  /**
   * Create error for profile not found
   */
  static profileNotFound(profileName: string, availableProfiles: string[]): ConfigError {
    const suggestions = availableProfiles
      .filter((p) => p.includes(profileName) || profileName.includes(p))
      .slice(0, 3);

    const message = suggestions.length > 0
      ? `Configuration profile '${profileName}' not found. Did you mean: ${suggestions.join(", ")}?`
      : `Configuration profile '${profileName}' not found`;

    return new ConfigError(
      "profile-not-found",
      message,
      {
        context: { profileName, availableProfiles },
      },
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
        context: { profileName },
      },
    );
  }

  /**
   * Create error for invalid configuration data
   */
  static dataInvalid(reason: string, context?: Record<string, unknown>): ConfigError {
    return new ConfigError(
      "config-data-invalid",
      `Invalid configuration data: ${reason}`,
      { context },
    );
  }

  /**
   * Create error for hardcoded fallback usage
   */
  static hardcodedFallbackUsed(
    missingFields: string[],
    configPath: string,
    profileName?: string,
  ): ConfigError {
    const fields = missingFields.join(", ");
    const message = profileName
      ? `Using hardcoded fallback values for missing fields in profile '${profileName}': ${fields}`
      : `Using hardcoded fallback values for missing fields: ${fields}`;

    return new ConfigError(
      "config-hardcoded-fallback",
      message,
      {
        context: {
          configPath,
          profileName,
          missingFields,
        },
      },
    );
  }

  /**
   * Get user-friendly error message
   */
  override getUserMessage(): string {
    const base = this.message;

    // Add helpful context for all error types (Totality principle)
    switch (this.kind) {
      case "config-not-found":
        return `${base}\n\nRun 'breakdown init' to create a default configuration.`;
      case "config-invalid-format":
        return `${base}\n\nCheck that your configuration file is valid YAML format.`;
      case "config-validation-failed":
        return `${base}\n\nRefer to the documentation for valid configuration options.`;
      case "config-permission-denied":
        return `${base}\n\nCheck file permissions and ensure you have read access.`;
      case "config-missing-required":
        return `${base}\n\nAdd the required fields to your configuration file.`;
      case "config-type-mismatch":
        return `${base}\n\nCheck the type of the configuration field and correct it.`;
      case "config-io-error":
        return `${base}\n\nCheck file system access and disk space availability.`;
      case "profile-not-found":
        return `${base}\n\nCheck available profiles or create the required profile configuration.`;
      case "profile-invalid":
        return `${base}\n\nValidate your profile configuration format and values.`;
      case "config-data-invalid":
        return `${base}\n\nReview your configuration data structure and fix any issues.`;
      case "config-hardcoded-fallback":
        return `${base}\n\nWARNING: Using fallback values. Update your configuration file to specify these fields explicitly.`;
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
      case "config-invalid-format":
        // Can be recovered by fixing YAML format
        return true;
      case "config-validation-failed":
        // Can be recovered by fixing validation errors
        return true;
      case "config-type-mismatch":
        // Can be recovered by correcting field types
        return true;
      case "profile-not-found":
        // Can be recovered by creating profile or using existing one
        return true;
      case "profile-invalid":
        // Can be recovered by fixing profile configuration
        return true;
      case "config-data-invalid":
        // Can be recovered by fixing configuration data
        return true;
      case "config-hardcoded-fallback":
        // Can be recovered by providing explicit configuration
        return true;
    }
  }

  /**
   * Get specific recovery suggestions
   */
  getRecoverySuggestions(): { action: string; description: string; command?: string }[] {
    const suggestions: { action: string; description: string; command?: string }[] = [];

    switch (this.kind) {
      case "config-not-found":
        suggestions.push({
          action: "init-config",
          description: "Create default configuration",
          command: "breakdown init",
        });
        suggestions.push({
          action: "create-file",
          description: `Create config file at: ${this.context?.configPath}`,
        });
        break;
      case "config-invalid-format":
        suggestions.push({
          action: "validate-yaml",
          description: "Validate your YAML syntax using a YAML validator",
        });
        suggestions.push({
          action: "check-structure",
          description: "Check for proper indentation and structure",
        });
        break;
      case "config-validation-failed":
        if (this.context?.validationErrors && Array.isArray(this.context.validationErrors)) {
          suggestions.push({
            action: "fix-validation",
            description: "Fix the following validation errors:",
          });
          this.context.validationErrors.forEach((e) => {
            suggestions.push({ action: "fix-field", description: `${e.field}: ${e.error}` });
          });
        }
        break;
      case "config-missing-required":
        if (this.context?.missingFields && Array.isArray(this.context.missingFields)) {
          suggestions.push({
            action: "add-fields",
            description: `Add the missing fields: ${this.context.missingFields.join(", ")}`,
          });
        }
        suggestions.push({
          action: "refer-docs",
          description: "Refer to example configuration in documentation",
        });
        break;
      case "config-type-mismatch":
        suggestions.push({
          action: "fix-type",
          description: `Change '${this.context?.field}' to type: ${this.context?.expected}`,
        });
        break;
      case "config-permission-denied":
        suggestions.push({
          action: "fix-permissions",
          description: "Check file permissions",
          command: `chmod 644 ${this.context?.configPath}`,
        });
        suggestions.push({
          action: "check-access",
          description: "Ensure you have read access to the config directory",
        });
        break;
      case "profile-not-found":
        suggestions.push({
          action: "list-profiles",
          description: "List available profiles",
          command: "breakdown config list-profiles",
        });
        if (
          this.context?.availableProfiles && Array.isArray(this.context.availableProfiles) &&
          this.context.availableProfiles.length > 0
        ) {
          suggestions.push({
            action: "use-available",
            description: `Available profiles: ${this.context.availableProfiles.join(", ")}`,
          });
        }
        break;
      case "profile-invalid":
        suggestions.push({
          action: "validate-profile",
          description: "Validate profile configuration syntax",
        });
        suggestions.push({
          action: "check-profile-structure",
          description: "Check profile configuration structure against expected format",
        });
        break;
      case "config-io-error":
        suggestions.push({ action: "check-disk-space", description: "Check available disk space" });
        suggestions.push({
          action: "verify-file-system",
          description: "Verify file system integrity",
        });
        suggestions.push({
          action: "retry-operation",
          description: "Retry the operation after a moment",
        });
        break;
      case "config-data-invalid":
        suggestions.push({
          action: "validate-structure",
          description: "Validate your configuration data structure",
        });
        suggestions.push({
          action: "check-types",
          description: "Ensure all fields have the correct types",
        });
        break;
      case "config-hardcoded-fallback":
        if (this.context?.missingFields && Array.isArray(this.context.missingFields)) {
          suggestions.push({
            action: "add-missing-fields",
            description: `Add the following fields to your configuration: ${
              this.context.missingFields.join(", ")
            }`,
          });
          suggestions.push({
            action: "update-config",
            description: `Update ${
              this.context.configPath || "configuration file"
            } with the missing fields`,
          });
        }
        suggestions.push({
          action: "use-init",
          description: "Run 'breakdown init' to generate a complete configuration template",
          command: "breakdown init",
        });
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
        if (
          this.context?.missingFields && Array.isArray(this.context.missingFields) &&
          this.context.missingFields.includes("directiveTypes")
        ) {
          return `directiveTypes:
  - to
  - summary
  - defect`;
        }
        if (
          this.context?.missingFields && Array.isArray(this.context.missingFields) &&
          this.context.missingFields.includes("layerTypes")
        ) {
          return `layerTypes:
  - project
  - issue
  - task`;
        }
        return `# Example basic configuration
directiveTypes:
  - to
  - summary
layerTypes:
  - project
  - task`;
      case "config-type-mismatch":
        if (this.context?.field === "directiveTypes") {
          return `directiveTypes: []  # Must be an array - see config file for valid values`;
        }
        if (this.context?.field === "layerTypes") {
          return `layerTypes: []  # Must be an array - see config file for valid values`;
        }
        return `# Correct type example for field: ${this.context?.field}
${this.context?.field}: ${
          this.context?.expected === "array"
            ? "[]"
            : this.context?.expected === "string"
            ? '""'
            : "value"
        }`;
      case "config-invalid-format":
        return `# Valid YAML configuration example
directiveTypes:
  - to
  - summary
layerTypes:
  - project
  - task`;
      case "config-validation-failed":
        return `# Valid configuration structure
directiveTypes:
  - to
  - summary
layerTypes:
  - project
  - task
# Ensure proper indentation and no duplicate keys`;
      case "profile-invalid":
        return `# Valid profile configuration
directiveTypes:
  - to
  - summary
layerTypes:
  - project
  - task`;
      case "config-not-found":
      case "config-permission-denied":
      case "config-io-error":
      case "profile-not-found":
        return `# Basic configuration template
directiveTypes:
  - to
  - summary
layerTypes:
  - project
  - task`;
      case "config-data-invalid":
        return `# Valid configuration structure example
directiveTypes:
  - to
  - summary
  - defect
layerTypes:
  - project
  - issue
  - task
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"`;
      case "config-hardcoded-fallback":
        if (this.context?.missingFields && Array.isArray(this.context.missingFields)) {
          const fields = this.context.missingFields;
          if (fields.some((f) => f.includes("params.two"))) {
            return `# Add missing params.two configuration
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"`;
          }
        }
        return `# Complete configuration with all required fields
directiveTypes:
  - to
  - summary
  - defect
layerTypes:
  - project
  - issue
  - task`;
    }
  }
}
