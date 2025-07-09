/**
 * @fileoverview ConfigSetName Value Object with Smart Constructor
 *
 * This module provides a type-safe ConfigSetName value object following
 * Domain-Driven Design principles and the Totality pattern. All operations
 * return Result types instead of throwing exceptions, ensuring complete
 * type safety and explicit error handling.
 *
 * ## Design Patterns Applied
 * - Smart Constructor: Type-safe creation with validation
 * - Discriminated Union: Explicit error types with type guards
 * - Result Type: No exceptions, all errors as values
 * - Value Object: Immutable with domain logic encapsulation
 *
 * ## Domain Context
 * ConfigSetName represents the name of a configuration set within the
 * Breakdown application configuration management bounded context.
 * It enforces domain rules for valid configuration set naming.
 *
 * @module domain/core/value_objects/config_set_name
 */

import type { Result } from "../../../types/result.ts";
import { error, ok } from "../../../types/result.ts";

/**
 * Discriminated Union for ConfigSetName-specific errors
 * 
 * Each error type has a unique 'kind' discriminator for type safety
 * and follows Domain-Driven Design principles for error handling.
 * The error types reflect domain concepts and constraints.
 */
export type ConfigSetNameError =
  | {
    kind: "EmptyName";
    message: string;
  }
  | {
    kind: "InvalidFormat";
    name: string;
    pattern: string;
    message: string;
  }
  | {
    kind: "ReservedName";
    name: string;
    reserved: readonly string[];
    message: string;
  }
  | {
    kind: "TooLong";
    name: string;
    maxLength: number;
    actualLength: number;
    message: string;
  }
  | {
    kind: "InvalidCharacters";
    name: string;
    invalidChars: readonly string[];
    message: string;
  }
  | {
    kind: "StartsWithReservedPrefix";
    name: string;
    prefix: string;
    message: string;
  };

/**
 * Type guards for ConfigSetNameError discrimination
 * 
 * These type guards enable exhaustive pattern matching over error types
 * and provide type-safe access to error-specific properties.
 */
export function isEmptyNameError(error: ConfigSetNameError): error is Extract<ConfigSetNameError, { kind: "EmptyName" }> {
  return error.kind === "EmptyName";
}

export function isInvalidFormatError(error: ConfigSetNameError): error is Extract<ConfigSetNameError, { kind: "InvalidFormat" }> {
  return error.kind === "InvalidFormat";
}

export function isReservedNameError(error: ConfigSetNameError): error is Extract<ConfigSetNameError, { kind: "ReservedName" }> {
  return error.kind === "ReservedName";
}

export function isTooLongError(error: ConfigSetNameError): error is Extract<ConfigSetNameError, { kind: "TooLong" }> {
  return error.kind === "TooLong";
}

export function isInvalidCharactersError(error: ConfigSetNameError): error is Extract<ConfigSetNameError, { kind: "InvalidCharacters" }> {
  return error.kind === "InvalidCharacters";
}

export function isStartsWithReservedPrefixError(error: ConfigSetNameError): error is Extract<ConfigSetNameError, { kind: "StartsWithReservedPrefix" }> {
  return error.kind === "StartsWithReservedPrefix";
}

/**
 * Format ConfigSetNameError for display
 * 
 * Provides human-readable error messages for all error types
 * with contextual information to help users understand and fix issues.
 */
export function formatConfigSetNameError(configError: ConfigSetNameError): string {
  switch (configError.kind) {
    case "EmptyName":
      return `Configuration set name cannot be empty: ${configError.message}`;
    case "InvalidFormat":
      return `Invalid configuration set name format: "${configError.name}" does not match pattern ${configError.pattern}. ${configError.message}`;
    case "ReservedName":
      return `Configuration set name "${configError.name}" is reserved. Reserved names: ${configError.reserved.join(", ")}. ${configError.message}`;
    case "TooLong":
      return `Configuration set name "${configError.name}" is too long (${configError.actualLength} characters). Maximum allowed: ${configError.maxLength}. ${configError.message}`;
    case "InvalidCharacters":
      return `Configuration set name "${configError.name}" contains invalid characters: ${configError.invalidChars.join(", ")}. ${configError.message}`;
    case "StartsWithReservedPrefix":
      return `Configuration set name "${configError.name}" starts with reserved prefix "${configError.prefix}". ${configError.message}`;
  }
}

/**
 * ConfigSetName Value Object with Smart Constructor
 * 
 * Represents a valid configuration set name within the Breakdown application.
 * Enforces domain rules for configuration set naming including:
 * - Non-empty name requirement
 * - Valid character restrictions (alphanumeric, hyphens, underscores)
 * - Length limitations
 * - Reserved name restrictions
 * - Reserved prefix restrictions
 * 
 * The value object is immutable and provides type-safe access to the name.
 */
export class ConfigSetName {
  private constructor(private readonly _value: string) {
    // Ensure complete immutability
    Object.freeze(this);
  }

  /**
   * Smart Constructor for ConfigSetName with comprehensive validation
   * 
   * Validates all domain rules for configuration set names and returns
   * a Result type containing either a valid ConfigSetName or specific error.
   * 
   * @param name - The configuration set name to validate and create
   * @returns Result containing ConfigSetName or ConfigSetNameError
   * 
   * @example
   * ```typescript
   * const result = ConfigSetName.create("my-config");
   * if (result.ok) {
   *   console.log(`Valid config name: ${result.data.value}`);
   * } else {
   *   console.error(formatConfigSetNameError(result.error));
   * }
   * ```
   */
  static create(name: string): Result<ConfigSetName, ConfigSetNameError> {
    // Validate name is not null or undefined
    if (name == null) {
      return error({
        kind: "EmptyName",
        message: "Configuration set name must be provided (cannot be null or undefined)",
      });
    }

    // Validate name is a string
    if (typeof name !== "string") {
      return error({
        kind: "InvalidFormat",
        name: String(name),
        pattern: "string",
        message: "Configuration set name must be a string",
      });
    }

    const trimmed = name.trim();

    // Validate name is not empty after trimming
    if (trimmed.length === 0) {
      return error({
        kind: "EmptyName",
        message: "Configuration set name cannot be empty or contain only whitespace",
      });
    }

    // Validate length constraints (aligned with filesystem and database limitations)
    const MAX_LENGTH = 64;
    if (trimmed.length > MAX_LENGTH) {
      return error({
        kind: "TooLong",
        name: trimmed,
        maxLength: MAX_LENGTH,
        actualLength: trimmed.length,
        message: "Configuration set names should be concise for readability and compatibility",
      });
    }

    // Validate character format (alphanumeric, hyphens, underscores only)
    const VALID_FORMAT_PATTERN = /^[a-zA-Z0-9_-]+$/;
    if (!VALID_FORMAT_PATTERN.test(trimmed)) {
      // Extract invalid characters for detailed error reporting
      const invalidChars = [...new Set(
        trimmed.split('').filter(char => !/[a-zA-Z0-9_-]/.test(char))
      )];
      
      return error({
        kind: "InvalidCharacters",
        name: trimmed,
        invalidChars,
        message: "Only alphanumeric characters, hyphens, and underscores are allowed for cross-platform compatibility",
      });
    }

    // Validate against reserved names (system-level configuration names)
    const RESERVED_NAMES = [
      "default", "system", "global", "local", "temp", "tmp", "cache",
      "config", "configuration", "settings", "app", "application",
      "user", "profile", "env", "environment", "dev", "development",
      "prod", "production", "test", "testing", "stage", "staging"
    ] as const;

    if (RESERVED_NAMES.includes(trimmed.toLowerCase() as typeof RESERVED_NAMES[number])) {
      return error({
        kind: "ReservedName",
        name: trimmed,
        reserved: RESERVED_NAMES,
        message: "Reserved names are protected to avoid conflicts with system configurations",
      });
    }

    // Validate against reserved prefixes (system namespaces)
    const RESERVED_PREFIXES = ["sys-", "system-", "app-", "tmp-", "temp-", "test-"] as const;
    const foundReservedPrefix = RESERVED_PREFIXES.find(prefix => 
      trimmed.toLowerCase().startsWith(prefix.toLowerCase())
    );

    if (foundReservedPrefix) {
      return error({
        kind: "StartsWithReservedPrefix",
        name: trimmed,
        prefix: foundReservedPrefix,
        message: "Reserved prefixes are protected to maintain clear separation between user and system configurations",
      });
    }

    // All validations passed - create immutable ConfigSetName
    return ok(new ConfigSetName(trimmed));
  }

  /**
   * Factory method for creating a standard default configuration set name
   * 
   * @returns Result containing the default ConfigSetName or error
   */
  static defaultSet(): Result<ConfigSetName, ConfigSetNameError> {
    return ConfigSetName.create("main");
  }

  /**
   * Factory method for creating development-specific configuration set names
   * 
   * @param suffix - Optional suffix to distinguish development configurations
   * @returns Result containing the development ConfigSetName or error
   */
  static development(suffix?: string): Result<ConfigSetName, ConfigSetNameError> {
    const name = suffix ? `dev-${suffix}` : "development-main";
    return ConfigSetName.create(name);
  }

  /**
   * Factory method for creating project-specific configuration set names
   * 
   * @param projectName - The project identifier
   * @returns Result containing the project ConfigSetName or error
   */
  static forProject(projectName: string): Result<ConfigSetName, ConfigSetNameError> {
    if (!projectName || typeof projectName !== "string" || projectName.trim().length === 0) {
      return error({
        kind: "EmptyName",
        message: "Project name is required for project-specific configuration sets",
      });
    }

    const sanitizedProject = projectName.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");
    return ConfigSetName.create(`project-${sanitizedProject}`);
  }

  /**
   * Get the validated configuration set name
   * 
   * @returns The immutable string value of the configuration set name
   */
  get value(): string {
    return this._value;
  }

  /**
   * Check if this configuration set name equals another
   * 
   * @param other - Another ConfigSetName to compare with
   * @returns True if the names are equal (case-sensitive)
   */
  equals(other: ConfigSetName): boolean {
    return this._value === other._value;
  }

  /**
   * Check if this configuration set name equals another (case-insensitive)
   * 
   * @param other - Another ConfigSetName to compare with
   * @returns True if the names are equal (case-insensitive)
   */
  equalsIgnoreCase(other: ConfigSetName): boolean {
    return this._value.toLowerCase() === other._value.toLowerCase();
  }

  /**
   * Get the length of the configuration set name
   * 
   * @returns The character count of the name
   */
  getLength(): number {
    return this._value.length;
  }

  /**
   * Check if the name contains only lowercase characters
   * 
   * @returns True if the name is all lowercase
   */
  isLowerCase(): boolean {
    return this._value === this._value.toLowerCase();
  }

  /**
   * Check if the name follows kebab-case convention
   * 
   * @returns True if the name uses kebab-case (lowercase with hyphens)
   */
  isKebabCase(): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(this._value);
  }

  /**
   * Check if the name follows snake_case convention
   * 
   * @returns True if the name uses snake_case (lowercase with underscores)
   */
  isSnakeCase(): boolean {
    return /^[a-z0-9]+(_[a-z0-9]+)*$/.test(this._value);
  }

  /**
   * Convert to lowercase variant (creates new ConfigSetName if different)
   * 
   * @returns Result containing lowercase ConfigSetName or error
   */
  toLowerCase(): Result<ConfigSetName, ConfigSetNameError> {
    const lowerValue = this._value.toLowerCase();
    if (lowerValue === this._value) {
      return ok(this); // Same instance if already lowercase
    }
    return ConfigSetName.create(lowerValue);
  }

  /**
   * Create a prefixed version of this configuration set name
   * 
   * @param prefix - The prefix to add (will be validated)
   * @returns Result containing prefixed ConfigSetName or error
   */
  withPrefix(prefix: string): Result<ConfigSetName, ConfigSetNameError> {
    if (!prefix || typeof prefix !== "string" || prefix.trim().length === 0) {
      return error({
        kind: "EmptyName",
        message: "Prefix cannot be empty for configuration set name prefixing",
      });
    }

    const trimmedPrefix = prefix.trim();
    const prefixedName = `${trimmedPrefix}-${this._value}`;
    return ConfigSetName.create(prefixedName);
  }

  /**
   * Create a suffixed version of this configuration set name
   * 
   * @param suffix - The suffix to add (will be validated)
   * @returns Result containing suffixed ConfigSetName or error
   */
  withSuffix(suffix: string): Result<ConfigSetName, ConfigSetNameError> {
    if (!suffix || typeof suffix !== "string" || suffix.trim().length === 0) {
      return error({
        kind: "EmptyName",
        message: "Suffix cannot be empty for configuration set name suffixing",
      });
    }

    const trimmedSuffix = suffix.trim();
    const suffixedName = `${this._value}-${trimmedSuffix}`;
    return ConfigSetName.create(suffixedName);
  }

  /**
   * String representation for debugging and logging
   * 
   * @returns String representation of the ConfigSetName
   */
  toString(): string {
    return `ConfigSetName(${this._value})`;
  }

  /**
   * JSON serialization support
   * 
   * @returns The string value for JSON serialization
   */
  toJSON(): string {
    return this._value;
  }

  /**
   * Value for primitive conversion
   * 
   * @returns The string value
   */
  valueOf(): string {
    return this._value;
  }
}

/**
 * Type alias for Result operations with ConfigSetName
 */
export type ConfigSetNameResult = Result<ConfigSetName, ConfigSetNameError>;

/**
 * Utility function to create ConfigSetName from string with error handling
 * 
 * @param name - The name string to convert
 * @returns ConfigSetName instance or throws formatted error
 * @throws {Error} Formatted error message if validation fails
 * @deprecated Use ConfigSetName.create() for Result-based error handling
 */
export function createConfigSetName(name: string): ConfigSetName {
  const result = ConfigSetName.create(name);
  if (!result.ok) {
    throw new Error(formatConfigSetNameError(result.error));
  }
  return result.data;
}

/**
 * Collection utilities for working with multiple ConfigSetName instances
 */
export class ConfigSetNameCollection {
  private constructor(private readonly _names: readonly ConfigSetName[]) {
    Object.freeze(this);
    Object.freeze(this._names);
  }

  /**
   * Create a collection from string names
   * 
   * @param names - Array of name strings to validate and convert
   * @returns Result containing ConfigSetNameCollection or first validation error
   */
  static create(names: readonly string[]): Result<ConfigSetNameCollection, ConfigSetNameError> {
    const validatedNames: ConfigSetName[] = [];
    
    for (const name of names) {
      const result = ConfigSetName.create(name);
      if (!result.ok) {
        return error(result.error);
      }
      validatedNames.push(result.data);
    }

    return ok(new ConfigSetNameCollection(validatedNames));
  }

  /**
   * Get all names as strings
   * 
   * @returns Array of name strings
   */
  getNames(): readonly string[] {
    return Object.freeze(this._names.map(name => name.value));
  }

  /**
   * Get all ConfigSetName instances
   * 
   * @returns Array of ConfigSetName instances
   */
  getConfigSetNames(): readonly ConfigSetName[] {
    return this._names;
  }

  /**
   * Check if collection contains a specific name
   * 
   * @param name - ConfigSetName to search for
   * @returns True if the collection contains the name
   */
  contains(name: ConfigSetName): boolean {
    return this._names.some(existing => existing.equals(name));
  }

  /**
   * Check if collection contains a specific name (case-insensitive)
   * 
   * @param name - ConfigSetName to search for
   * @returns True if the collection contains the name (case-insensitive)
   */
  containsIgnoreCase(name: ConfigSetName): boolean {
    return this._names.some(existing => existing.equalsIgnoreCase(name));
  }

  /**
   * Get the number of names in the collection
   * 
   * @returns The count of names
   */
  getCount(): number {
    return this._names.length;
  }

  /**
   * Check if the collection is empty
   * 
   * @returns True if the collection has no names
   */
  isEmpty(): boolean {
    return this._names.length === 0;
  }
}