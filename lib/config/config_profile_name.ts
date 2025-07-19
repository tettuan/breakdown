/**
 * @fileoverview ConfigProfileName implementation with Totality principle
 *
 * This module implements ConfigProfileName following the Totality principle,
 * ensuring type safety through Smart Constructor pattern. ConfigProfileName
 * represents the configuration profile name with automatic fallback to 'default'
 * for empty or invalid values.
 *
 * ## Design Principles
 * 1. **Totality**: All inputs are handled without exceptions
 * 2. **Smart Constructor**: private constructor + static create
 * 3. **Immutable**: Values cannot be changed after creation
 * 4. **Default Guarantee**: Always returns a valid profile name
 *
 * @module config/config_profile_name
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import type { ValidationError } from "../types/unified_error_types.ts";
import { ErrorFactory } from "../types/unified_error_types.ts";

/**
 * ConfigProfileName - Configuration profile name with automatic default
 *
 * Totality principle implementation for configuration profile names.
 * This class guarantees that all instances have a valid, non-empty profile name
 * through automatic default value application.
 *
 * ## Smart Constructor Pattern
 * - `private constructor`: Prevents direct instantiation
 * - `static create()`: Total function that always returns valid instance
 * - Automatic default value application for invalid inputs
 *
 * ## Default Value Logic
 * The following inputs result in the default value "default":
 * - Empty string ("")
 * - null
 * - undefined
 * - Whitespace-only strings ("  ", "\t", "\n", etc.)
 *
 * @example Basic usage
 * ```typescript
 * const profile1 = ConfigProfileName.create("production");
 * console.log(profile1.value); // "production"
 *
 * const profile2 = ConfigProfileName.create("");
 * console.log(profile2.value); // "default"
 *
 * const profile3 = ConfigProfileName.create(undefined);
 * console.log(profile3.value); // "default"
 * ```
 *
 * @example Trimming behavior
 * ```typescript
 * const profile = ConfigProfileName.create("  staging  ");
 * console.log(profile.value); // "staging" (trimmed)
 *
 * const defaultProfile = ConfigProfileName.create("   ");
 * console.log(defaultProfile.value); // "default" (whitespace-only)
 * ```
 */
export class ConfigProfileName {
  /**
   * Default profile name constant
   * This value is used when no valid profile name is provided
   */
  static readonly DEFAULT: "default" = "default" as const;

  /**
   * Private constructor - Smart Constructor pattern implementation
   *
   * Direct instantiation is forbidden to ensure all instances
   * are created through the validated create() method.
   * This guarantees type safety and invariant maintenance.
   */
  private constructor(private readonly profileName: string) {}

  /**
   * Creates a ConfigProfileName instance with automatic default application
   *
   * This is a total function - it handles ALL possible inputs without throwing.
   * Invalid inputs (empty, null, undefined, whitespace-only) automatically
   * resolve to the default value "default".
   *
   * @param profileName - The profile name (optional, nullable)
   * @returns ConfigProfileName instance with guaranteed valid profile name
   *
   * @example
   * ```typescript
   * // Valid profile names
   * ConfigProfileName.create("production").value;  // "production"
   * ConfigProfileName.create("staging").value;     // "staging"
   * ConfigProfileName.create("dev-123").value;     // "dev-123"
   *
   * // Default fallback cases
   * ConfigProfileName.create("").value;            // "default"
   * ConfigProfileName.create(null).value;          // "default"
   * ConfigProfileName.create(undefined).value;     // "default"
   * ConfigProfileName.create("   ").value;         // "default"
   *
   * // Trimming behavior
   * ConfigProfileName.create("  test  ").value;    // "test"
   * ```
   */
  static create(profileName?: string | null | undefined): ConfigProfileName {
    // Normalize input: handle null, undefined, non-string, and trim whitespace
    const normalizedName = (typeof profileName === "string" ? profileName.trim() : "") || "";

    // Apply default if empty after normalization
    const finalName = normalizedName === "" ? ConfigProfileName.DEFAULT : normalizedName;

    return new ConfigProfileName(finalName);
  }

  /**
   * Creates a ConfigProfileName with validation feedback (Result type)
   *
   * This method implements the Totality principle with explicit error handling.
   * Unlike create(), this method returns a Result type that contains either
   * a ConfigProfileName or a ValidationError with detailed feedback.
   *
   * When empty/null/undefined input is provided, it returns an error explaining
   * that the default value is being used.
   *
   * @param profileName - The profile name (optional, nullable)
   * @returns Result containing ConfigProfileName or ValidationError
   *
   * @example
   * ```typescript
   * // Valid profile name
   * const result1 = ConfigProfileName.createOrError("production");
   * if (result1.ok) {
   *   console.log(result1.data.value); // "production"
   * }
   *
   * // Empty input returns error with explanation
   * const result2 = ConfigProfileName.createOrError("");
   * if (!result2.ok) {
   *   console.log(result2.error.message); // Error explaining default usage
   * }
   * ```
   */
  static createOrError(
    profileName?: string | null | undefined,
  ): Result<ConfigProfileName, ValidationError> {
    // Normalize input: handle null, undefined, non-string, and trim whitespace
    const normalizedName = (typeof profileName === "string" ? profileName.trim() : "") || "";

    // Check if using default value
    if (normalizedName === "") {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "profileName",
        value: profileName,
        reason: "Profile name cannot be empty, using default",
      }));
    }

    // Valid profile name
    return ok(new ConfigProfileName(normalizedName));
  }

  /**
   * Creates a ConfigProfileName from an object with profilePrefix property
   *
   * This method provides compatibility with configuration objects
   * that may have a profilePrefix property. It delegates to the main
   * create() method, ensuring consistent behavior.
   *
   * @param config - Configuration object with optional profilePrefix
   * @returns ConfigProfileName instance
   *
   * @example
   * ```typescript
   * const config = { profilePrefix: "production" };
   * const profile = ConfigProfileName.createFromConfig(config);
   * console.log(profile.value); // "production"
   *
   * const emptyConfig = {};
   * const defaultProfile = ConfigProfileName.createFromConfig(emptyConfig);
   * console.log(defaultProfile.value); // "default"
   * ```
   */
  static createFromConfig(config?: { profilePrefix?: string | null } | null): ConfigProfileName {
    return ConfigProfileName.create(config?.profilePrefix);
  }

  /**
   * Creates a default ConfigProfileName instance
   *
   * This is a convenience method that creates a ConfigProfileName with
   * the default value "default". It's equivalent to calling create() with
   * no arguments or with an empty string.
   *
   * @returns ConfigProfileName instance with default value
   */
  static createDefault(): ConfigProfileName {
    return new ConfigProfileName(ConfigProfileName.DEFAULT);
  }

  /**
   * Creates a ConfigProfileName from CLI option with automatic default fallback
   *
   * This method is designed for CLI integration where invalid or empty
   * values should fall back to default rather than causing errors.
   *
   * @param option - CLI option value (can be null, undefined, or empty)
   * @returns ConfigProfileName instance (default for invalid inputs)
   */
  static fromCliOption(option?: string | null | undefined): ConfigProfileName {
    return ConfigProfileName.create(option);
  }

  /**
   * Gets the profile name value
   *
   * This property always returns a valid, non-empty profile name.
   * It is guaranteed to never be empty, null, or undefined due to
   * the validation in the create() method.
   *
   * @returns The profile name (never empty, never null, never undefined)
   */
  get value(): string {
    return this.profileName;
  }

  /**
   * Checks if this profile name is the default
   *
   * @returns true if the profile name is exactly "default"
   */
  isDefault(): boolean {
    return this.profileName === ConfigProfileName.DEFAULT;
  }

  /**
   * Gets the profile name as a prefix
   *
   * @returns The profile name (same as value)
   */
  get prefix(): string {
    return this.profileName;
  }

  /**
   * Gets the configuration path for this profile
   *
   * @returns The profile name (same as value)
   */
  getConfigPath(): string {
    return this.profileName;
  }

  /**
   * Gets the directive types for this profile
   *
   * @returns Array of directive types
   */
  getDirectiveTypes(): string[] {
    return ["to", "summary", "defect"];
  }

  /**
   * Gets the layer types for this profile
   *
   * @returns Array of layer types
   */
  getLayerTypes(): string[] {
    return ["project", "issue", "task", "bugs"];
  }

  /**
   * Checks equality with another ConfigProfileName
   *
   * Two ConfigProfileName instances are equal if they have
   * the same profile name value.
   *
   * @param other - Another ConfigProfileName instance
   * @returns true if both have the same profile name
   */
  equals(other: ConfigProfileName): boolean {
    return this.profileName === other.profileName;
  }

  /**
   * String representation of ConfigProfileName
   *
   * Returns a human-readable string representation for debugging
   * and logging purposes.
   *
   * @returns String representation in format "ConfigProfileName(value)"
   */
  toString(): string {
    return `ConfigProfileName(${this.profileName})`;
  }

  /**
   * Gets the file prefix for this profile
   *
   * This method returns the prefix used for configuration files.
   * The prefix is the profile name followed by a dash.
   *
   * @returns The file prefix with trailing dash
   *
   * @example
   * ```typescript
   * ConfigProfileName.create("production").getFilePrefix(); // "production-"
   * ConfigProfileName.create("default").getFilePrefix();    // "default-"
   * ConfigProfileName.create("").getFilePrefix();           // "default-"
   * ```
   */
  getFilePrefix(): string {
    return `${this.profileName}-`;
  }

  /**
   * Constructs a configuration filename for this profile
   *
   * Combines the profile prefix with a base filename to create
   * the full configuration filename.
   *
   * @param baseName - Base filename without profile prefix (e.g., "app.yml")
   * @returns Complete filename with profile prefix (e.g., "production-app.yml")
   *
   * @example
   * ```typescript
   * const prod = ConfigProfileName.create("production");
   * prod.getConfigFileName("app.yml");    // "production-app.yml"
   * prod.getConfigFileName("user.yml");   // "production-user.yml"
   *
   * const def = ConfigProfileName.create("");
   * def.getConfigFileName("app.yml");     // "default-app.yml"
   * ```
   */
  getConfigFileName(baseName: string): string {
    return `${this.getFilePrefix()}${baseName}`;
  }
}

// Make DEFAULT property truly immutable
Object.defineProperty(ConfigProfileName, "DEFAULT", {
  value: "default",
  writable: false,
  enumerable: true,
  configurable: false,
});
