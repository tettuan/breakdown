/**
 * @fileoverview WorkspaceName Value Object with Smart Constructor
 *
 * This module provides a type-safe WorkspaceName value object following
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
 * WorkspaceName represents the name of a workspace within the Breakdown
 * application workspace management bounded context. It enforces domain
 * rules for valid workspace naming including filesystem safety.
 *
 * @module domain/core/value_objects/workspace_name
 */

import type { Result } from "../../../types/result.ts";
import { error, ok } from "../../../types/result.ts";

/**
 * Discriminated Union for WorkspaceName-specific errors
 * 
 * Each error type has a unique 'kind' discriminator for type safety
 * and follows Domain-Driven Design principles for error handling.
 * The error types reflect domain concepts and filesystem constraints.
 */
export type WorkspaceNameError =
  | {
    kind: "EmptyName";
    message: string;
  }
  | {
    kind: "InvalidCharacters";
    name: string;
    invalidChars: readonly string[];
    message: string;
  }
  | {
    kind: "PathTraversalAttempt";
    name: string;
    suspiciousPatterns: readonly string[];
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
    kind: "StartsWithDot";
    name: string;
    message: string;
  }
  | {
    kind: "ReservedName";
    name: string;
    reserved: readonly string[];
    message: string;
  }
  | {
    kind: "InvalidFormat";
    name: string;
    expectedPattern: string;
    message: string;
  }
  | {
    kind: "ContainsWhitespace";
    name: string;
    whitespacePositions: readonly number[];
    message: string;
  };

/**
 * Type guards for WorkspaceNameError discrimination
 * 
 * These type guards enable exhaustive pattern matching over error types
 * and provide type-safe access to error-specific properties.
 */
export function isEmptyNameError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "EmptyName" }> {
  return error.kind === "EmptyName";
}

export function isInvalidCharactersError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "InvalidCharacters" }> {
  return error.kind === "InvalidCharacters";
}

export function isPathTraversalAttemptError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "PathTraversalAttempt" }> {
  return error.kind === "PathTraversalAttempt";
}

export function isTooLongError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "TooLong" }> {
  return error.kind === "TooLong";
}

export function isStartsWithDotError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "StartsWithDot" }> {
  return error.kind === "StartsWithDot";
}

export function isReservedNameError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "ReservedName" }> {
  return error.kind === "ReservedName";
}

export function isInvalidFormatError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "InvalidFormat" }> {
  return error.kind === "InvalidFormat";
}

export function isContainsWhitespaceError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "ContainsWhitespace" }> {
  return error.kind === "ContainsWhitespace";
}

/**
 * Format WorkspaceNameError for display
 * 
 * Provides human-readable error messages for all error types
 * with contextual information to help users understand and fix issues.
 */
export function formatWorkspaceNameError(workspaceError: WorkspaceNameError): string {
  switch (workspaceError.kind) {
    case "EmptyName":
      return `Workspace name cannot be empty: ${workspaceError.message}`;
    case "InvalidCharacters":
      return `Workspace name "${workspaceError.name}" contains invalid characters: ${workspaceError.invalidChars.join(", ")}. ${workspaceError.message}`;
    case "PathTraversalAttempt":
      return `Workspace name "${workspaceError.name}" contains suspicious path patterns: ${workspaceError.suspiciousPatterns.join(", ")}. ${workspaceError.message}`;
    case "TooLong":
      return `Workspace name "${workspaceError.name}" is too long (${workspaceError.actualLength} characters). Maximum allowed: ${workspaceError.maxLength}. ${workspaceError.message}`;
    case "StartsWithDot":
      return `Workspace name "${workspaceError.name}" cannot start with a dot. ${workspaceError.message}`;
    case "ReservedName":
      return `Workspace name "${workspaceError.name}" is reserved. Reserved names: ${workspaceError.reserved.join(", ")}. ${workspaceError.message}`;
    case "InvalidFormat":
      return `Workspace name "${workspaceError.name}" has invalid format. Expected: ${workspaceError.expectedPattern}. ${workspaceError.message}`;
    case "ContainsWhitespace":
      return `Workspace name "${workspaceError.name}" contains whitespace at positions: ${workspaceError.whitespacePositions.join(", ")}. ${workspaceError.message}`;
  }
}

/**
 * WorkspaceName Value Object with Smart Constructor
 * 
 * Represents a valid workspace name within the Breakdown application.
 * Enforces domain rules for workspace naming including:
 * - Non-empty name requirement
 * - Filesystem-safe character restrictions
 * - Length limitations for cross-platform compatibility
 * - Security restrictions (no path traversal)
 * - No hidden files (names starting with dot)
 * - No whitespace for CLI compatibility
 * - Reserved name restrictions
 * 
 * The value object is immutable and provides type-safe access to the name.
 */
export class WorkspaceName {
  private constructor(private readonly _value: string) {
    // Ensure complete immutability
    Object.freeze(this);
  }

  /**
   * Smart Constructor for WorkspaceName with comprehensive validation
   * 
   * Validates all domain rules for workspace names and returns
   * a Result type containing either a valid WorkspaceName or specific error.
   * 
   * @param name - The workspace name to validate and create
   * @returns Result containing WorkspaceName or WorkspaceNameError
   * 
   * @example
   * ```typescript
   * const result = WorkspaceName.create("my-project");
   * if (result.ok) {
   *   console.log(`Valid workspace: ${result.data.value}`);
   * } else {
   *   console.error(formatWorkspaceNameError(result.error));
   * }
   * ```
   */
  static create(name: string): Result<WorkspaceName, WorkspaceNameError> {
    // Validate name is not null or undefined
    if (name == null) {
      return error({
        kind: "EmptyName",
        message: "Workspace name must be provided (cannot be null or undefined)",
      });
    }

    // Validate name is a string
    if (typeof name !== "string") {
      return error({
        kind: "InvalidFormat",
        name: String(name),
        expectedPattern: "string",
        message: "Workspace name must be a string",
      });
    }

    const trimmed = name.trim();

    // Validate name is not empty after trimming
    if (trimmed.length === 0) {
      return error({
        kind: "EmptyName",
        message: "Workspace name cannot be empty or contain only whitespace",
      });
    }

    // Validate no whitespace for CLI and filesystem compatibility
    const whitespacePattern = /\s/;
    if (whitespacePattern.test(trimmed)) {
      const whitespacePositions = [...trimmed].map((char, index) => 
        /\s/.test(char) ? index : -1
      ).filter(pos => pos !== -1);
      
      return error({
        kind: "ContainsWhitespace",
        name: trimmed,
        whitespacePositions,
        message: "Workspace names cannot contain whitespace for CLI and filesystem compatibility",
      });
    }

    // Validate length constraints (filesystem limitations vary by OS)
    const MAX_LENGTH = 255; // Conservative limit for most filesystems
    if (trimmed.length > MAX_LENGTH) {
      return error({
        kind: "TooLong",
        name: trimmed,
        maxLength: MAX_LENGTH,
        actualLength: trimmed.length,
        message: "Workspace names must fit within filesystem path length limitations",
      });
    }

    // Validate not starting with dot (hidden files/directories)
    if (trimmed.startsWith('.')) {
      return error({
        kind: "StartsWithDot",
        name: trimmed,
        message: "Workspace names cannot start with dot to avoid creating hidden directories",
      });
    }

    // Validate against path traversal attacks
    const SUSPICIOUS_PATTERNS = ["..", "/", "\\", ":", "*", "?", "\"", "<", ">", "|"] as const;
    const foundPatterns = SUSPICIOUS_PATTERNS.filter(pattern => 
      trimmed.includes(pattern)
    );

    if (foundPatterns.length > 0) {
      return error({
        kind: "PathTraversalAttempt",
        name: trimmed,
        suspiciousPatterns: foundPatterns,
        message: "Workspace names cannot contain path manipulation characters for security",
      });
    }

    // Validate character restrictions for cross-platform filesystem compatibility
    // Forbidden characters vary by filesystem, but these are commonly problematic
    const FORBIDDEN_CHARS = ['<', '>', ':', '"', '|', '?', '*', '\0'] as const;
    const invalidChars = [...new Set(
      trimmed.split('').filter(char => FORBIDDEN_CHARS.includes(char as typeof FORBIDDEN_CHARS[number]))
    )];

    if (invalidChars.length > 0) {
      return error({
        kind: "InvalidCharacters",
        name: trimmed,
        invalidChars,
        message: "Workspace names must use filesystem-safe characters for cross-platform compatibility",
      });
    }

    // Validate against filesystem reserved names (primarily Windows, but good practice)
    const RESERVED_NAMES = [
      "CON", "PRN", "AUX", "NUL",
      "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
      "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
      // Unix/Linux common system directories
      "bin", "boot", "dev", "etc", "home", "lib", "lib64", "mnt", "opt",
      "proc", "root", "run", "sbin", "srv", "sys", "tmp", "usr", "var",
      // Common application directories
      "node_modules", ".git", ".svn", ".hg", "target", "build", "dist"
    ] as const;

    if (RESERVED_NAMES.includes(trimmed.toUpperCase() as typeof RESERVED_NAMES[number]) ||
        RESERVED_NAMES.includes(trimmed.toLowerCase() as typeof RESERVED_NAMES[number])) {
      return error({
        kind: "ReservedName",
        name: trimmed,
        reserved: RESERVED_NAMES,
        message: "Reserved names are protected to avoid conflicts with system directories and tools",
      });
    }

    // All validations passed - create immutable WorkspaceName
    return ok(new WorkspaceName(trimmed));
  }

  /**
   * Factory method for creating a default workspace name
   * 
   * @returns Result containing the default WorkspaceName or error
   */
  static defaultWorkspace(): Result<WorkspaceName, WorkspaceNameError> {
    return WorkspaceName.create("default-workspace");
  }

  /**
   * Factory method for creating timestamp-based workspace names
   * 
   * @param prefix - Optional prefix for the workspace name
   * @returns Result containing the timestamped WorkspaceName or error
   */
  static withTimestamp(prefix: string = "workspace"): Result<WorkspaceName, WorkspaceNameError> {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, "-")
      .replace(/T/, "_")
      .slice(0, 19); // Remove milliseconds and timezone
    
    return WorkspaceName.create(`${prefix}-${timestamp}`);
  }

  /**
   * Factory method for creating project-based workspace names
   * 
   * @param projectName - The project identifier
   * @param suffix - Optional suffix (e.g., environment)
   * @returns Result containing the project WorkspaceName or error
   */
  static forProject(projectName: string, suffix?: string): Result<WorkspaceName, WorkspaceNameError> {
    if (!projectName || typeof projectName !== "string" || projectName.trim().length === 0) {
      return error({
        kind: "EmptyName",
        message: "Project name is required for project-based workspace names",
      });
    }

    // Sanitize project name for filesystem safety
    const sanitizedProject = projectName.trim()
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (sanitizedProject.length === 0) {
      return error({
        kind: "InvalidFormat",
        name: projectName,
        expectedPattern: "alphanumeric characters, hyphens, and underscores",
        message: "Project name must contain at least some valid characters after sanitization",
      });
    }

    const workspaceName = suffix 
      ? `${sanitizedProject}-${suffix}`
      : sanitizedProject;

    return WorkspaceName.create(workspaceName);
  }

  /**
   * Factory method for creating temporary workspace names
   * 
   * @param purpose - Optional purpose identifier
   * @returns Result containing the temporary WorkspaceName or error
   */
  static temporary(purpose?: string): Result<WorkspaceName, WorkspaceNameError> {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const purposeString = purpose ? `-${purpose}` : "";
    return WorkspaceName.create(`temp${purposeString}-${randomSuffix}`);
  }

  /**
   * Get the validated workspace name
   * 
   * @returns The immutable string value of the workspace name
   */
  get value(): string {
    return this._value;
  }

  /**
   * Check if this workspace name equals another
   * 
   * @param other - Another WorkspaceName to compare with
   * @returns True if the names are equal (case-sensitive)
   */
  equals(other: WorkspaceName): boolean {
    return this._value === other._value;
  }

  /**
   * Check if this workspace name equals another (case-insensitive)
   * 
   * @param other - Another WorkspaceName to compare with
   * @returns True if the names are equal (case-insensitive)
   */
  equalsIgnoreCase(other: WorkspaceName): boolean {
    return this._value.toLowerCase() === other._value.toLowerCase();
  }

  /**
   * Get the length of the workspace name
   * 
   * @returns The character count of the name
   */
  getLength(): number {
    return this._value.length;
  }

  /**
   * Check if the name contains only lowercase characters and allowed symbols
   * 
   * @returns True if the name is filesystem-friendly lowercase
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
   * Convert to filesystem-safe variant (creates new WorkspaceName)
   * 
   * This method sanitizes the workspace name for maximum filesystem compatibility
   * by replacing problematic characters and ensuring safe patterns.
   * 
   * @returns Result containing filesystem-safe WorkspaceName or error
   */
  toSafeName(): Result<WorkspaceName, WorkspaceNameError> {
    const safeName = this._value
      .replace(/[^\w\-_.]/g, '_')  // Replace non-word chars with underscore
      .replace(/_{2,}/g, '_')      // Collapse multiple underscores
      .replace(/^_|_$/g, '');      // Remove leading/trailing underscores

    if (safeName.length === 0) {
      return error({
        kind: "InvalidFormat",
        name: this._value,
        expectedPattern: "characters that can be converted to filesystem-safe format",
        message: "Workspace name contains no convertible characters",
      });
    }

    return WorkspaceName.create(safeName);
  }

  /**
   * Convert to lowercase variant (creates new WorkspaceName if different)
   * 
   * @returns Result containing lowercase WorkspaceName or error
   */
  toLowerCase(): Result<WorkspaceName, WorkspaceNameError> {
    const lowerValue = this._value.toLowerCase();
    if (lowerValue === this._value) {
      return ok(this); // Same instance if already lowercase
    }
    return WorkspaceName.create(lowerValue);
  }

  /**
   * Create a prefixed version of this workspace name
   * 
   * @param prefix - The prefix to add (will be validated)
   * @returns Result containing prefixed WorkspaceName or error
   */
  withPrefix(prefix: string): Result<WorkspaceName, WorkspaceNameError> {
    if (!prefix || typeof prefix !== "string" || prefix.trim().length === 0) {
      return error({
        kind: "EmptyName",
        message: "Prefix cannot be empty for workspace name prefixing",
      });
    }

    const trimmedPrefix = prefix.trim();
    const prefixedName = `${trimmedPrefix}-${this._value}`;
    return WorkspaceName.create(prefixedName);
  }

  /**
   * Create a suffixed version of this workspace name
   * 
   * @param suffix - The suffix to add (will be validated)
   * @returns Result containing suffixed WorkspaceName or error
   */
  withSuffix(suffix: string): Result<WorkspaceName, WorkspaceNameError> {
    if (!suffix || typeof suffix !== "string" || suffix.trim().length === 0) {
      return error({
        kind: "EmptyName",
        message: "Suffix cannot be empty for workspace name suffixing",
      });
    }

    const trimmedSuffix = suffix.trim();
    const suffixedName = `${this._value}-${trimmedSuffix}`;
    return WorkspaceName.create(suffixedName);
  }

  /**
   * Check if this workspace name is suitable for production use
   * 
   * Production workspace names should follow stricter conventions:
   * - No temporary indicators
   * - Meaningful names
   * - Standard naming patterns
   * 
   * @returns True if suitable for production
   */
  isSuitableForProduction(): boolean {
    const tempIndicators = ["temp", "tmp", "test", "debug", "dev"];
    const lowerName = this._value.toLowerCase();
    
    return !tempIndicators.some(indicator => 
      lowerName.includes(indicator)
    ) && this._value.length >= 3; // Minimum meaningful length
  }

  /**
   * Get the workspace directory path (filesystem representation)
   * 
   * @param basePath - Optional base path to prepend
   * @returns Filesystem path for this workspace
   */
  toDirectoryPath(basePath?: string): string {
    const safeName = this._value; // Already validated to be filesystem-safe
    return basePath ? `${basePath}/${safeName}` : safeName;
  }

  /**
   * String representation for debugging and logging
   * 
   * @returns String representation of the WorkspaceName
   */
  toString(): string {
    return `WorkspaceName(${this._value})`;
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
 * Type alias for Result operations with WorkspaceName
 */
export type WorkspaceNameResult = Result<WorkspaceName, WorkspaceNameError>;

/**
 * Utility function to create WorkspaceName from string with error handling
 * 
 * @param name - The name string to convert
 * @returns WorkspaceName instance or throws formatted error
 * @throws {Error} Formatted error message if validation fails
 * @deprecated Use WorkspaceName.create() for Result-based error handling
 */
export function createWorkspaceName(name: string): WorkspaceName {
  const result = WorkspaceName.create(name);
  if (!result.ok) {
    throw new Error(formatWorkspaceNameError(result.error));
  }
  return result.data;
}

/**
 * Collection utilities for working with multiple WorkspaceName instances
 */
export class WorkspaceNameCollection {
  private constructor(private readonly _names: readonly WorkspaceName[]) {
    Object.freeze(this);
    Object.freeze(this._names);
  }

  /**
   * Create a collection from string names
   * 
   * @param names - Array of name strings to validate and convert
   * @returns Result containing WorkspaceNameCollection or first validation error
   */
  static create(names: readonly string[]): Result<WorkspaceNameCollection, WorkspaceNameError> {
    const validatedNames: WorkspaceName[] = [];
    
    for (const name of names) {
      const result = WorkspaceName.create(name);
      if (!result.ok) {
        return error(result.error);
      }
      validatedNames.push(result.data);
    }

    return ok(new WorkspaceNameCollection(validatedNames));
  }

  /**
   * Get all names as strings
   * 
   * @returns Array of name strings
   */
  getNames(): readonly string[] {
    return this._names.map(name => name.value);
  }

  /**
   * Get all WorkspaceName instances
   * 
   * @returns Array of WorkspaceName instances
   */
  getWorkspaceNames(): readonly WorkspaceName[] {
    return this._names;
  }

  /**
   * Check if collection contains a specific name
   * 
   * @param name - WorkspaceName to search for
   * @returns True if the collection contains the name
   */
  contains(name: WorkspaceName): boolean {
    return this._names.some(existing => existing.equals(name));
  }

  /**
   * Filter production-suitable workspace names
   * 
   * @returns New collection containing only production-suitable names
   */
  filterProductionSuitable(): WorkspaceNameCollection {
    const productionNames = this._names.filter(name => name.isSuitableForProduction());
    return new WorkspaceNameCollection(productionNames);
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