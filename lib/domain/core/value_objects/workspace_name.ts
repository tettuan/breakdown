/**
 * @fileoverview WorkspaceName Value Object implementation with Smart Constructor pattern
 *
 * This module implements a DDD Value Object for workspace names that provides:
 * - Immutable workspace name instances with value semantics
 * - Comprehensive validation for filesystem and security safety
 * - Smart Constructor pattern with Result type for error handling
 * - Factory methods for common workspace naming patterns
 * - Utility methods for naming convention checks and transformations
 *
 * @module domain/core/value_objects/workspace_name
 */

import type { Result } from "../../../types/result.ts";
import { error as resultError, ok as resultOk } from "../../../types/result.ts";

/**
 * Result type alias for WorkspaceName creation
 */
export type WorkspaceNameResult = Result<WorkspaceName, WorkspaceNameError>;

/**
 * Discriminated union of workspace name validation errors
 */
export type WorkspaceNameError =
  | { kind: "EmptyName"; input: string; message: string }
  | { kind: "InvalidFormat"; input: string; reason: string; message: string }
  | {
    kind: "ContainsWhitespace";
    input: string;
    whitespacePositions: number[];
    message: string;
  }
  | {
    kind: "PathTraversalAttempt";
    input: string;
    suspiciousPatterns: string[];
    message: string;
  }
  | { kind: "TooLong"; input: string; maxLength: number; actualLength: number; message: string }
  | { kind: "StartsWithDot"; input: string; message: string }
  | { kind: "InvalidCharacters"; input: string; invalidChars: string[]; message: string }
  | { kind: "ReservedName"; input: string; reserved: string[]; message: string };

/**
 * Type guards for workspace name errors
 */
export function isEmptyNameError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "EmptyName" }> {
  return error.kind === "EmptyName";
}

export function isInvalidFormatError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "InvalidFormat" }> {
  return error.kind === "InvalidFormat";
}

export function isContainsWhitespaceError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "ContainsWhitespace" }> {
  return error.kind === "ContainsWhitespace";
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

export function isInvalidCharactersError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "InvalidCharacters" }> {
  return error.kind === "InvalidCharacters";
}

export function isReservedNameError(error: WorkspaceNameError): error is Extract<WorkspaceNameError, { kind: "ReservedName" }> {
  return error.kind === "ReservedName";
}

/**
 * Immutable value object representing a workspace name
 * 
 * Workspace names must be:
 * - Non-empty and valid strings
 * - Free of whitespace characters
 * - Safe for filesystem usage (no forbidden characters)
 * - Not path traversal attempts
 * - Not reserved system names
 * - Not starting with dots (hidden files)
 * - Within reasonable length limits
 */
export class WorkspaceName {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
    Object.freeze(this);
  }

  /**
   * Smart Constructor: Creates a WorkspaceName with comprehensive validation
   */
  static create(input: string): Result<WorkspaceName, WorkspaceNameError> {
    // Validate input type
    if (typeof input !== "string") {
      return resultError({
        kind: "InvalidFormat",
        input: String(input),
        reason: "Input must be a string",
        message: "Input must be a string",
      });
    }

    // Trim whitespace
    const trimmed = input.trim();

    // Check for empty names
    if (!trimmed || trimmed.length === 0) {
      const isNullOrUndefined = input === null || input === undefined;
      return resultError({
        kind: "EmptyName",
        input: input,
        message: isNullOrUndefined 
          ? "Workspace name cannot be null or undefined"
          : input === "" || input.trim() === "" 
            ? "Workspace name cannot be empty or contain only whitespace"
            : "Workspace name cannot be empty",
      });
    }

    // Validate length
    const maxLength = 255;
    if (trimmed.length > maxLength) {
      return resultError({
        kind: "TooLong",
        input: trimmed,
        maxLength,
        actualLength: trimmed.length,
        message: `Workspace name exceeds filesystem path length limit (${trimmed.length} > ${maxLength})`,
      });
    }

    // Check for path traversal attempts (highest priority)
    const pathTraversalPatterns = ["../", "..\\", "/", "\\"];
    const foundPatterns = pathTraversalPatterns.filter(pattern => 
      trimmed.includes(pattern)
    );
    if (foundPatterns.length > 0) {
      return resultError({
        kind: "PathTraversalAttempt",
        input: trimmed,
        suspiciousPatterns: foundPatterns,
        message: `Path traversal patterns detected: ${foundPatterns.join(", ")}`,
      });
    }

    // Check for dot prefix (hidden files)
    if (trimmed.startsWith(".")) {
      return resultError({
        kind: "StartsWithDot",
        input: trimmed,
        message: "Workspace names starting with dot create hidden directories",
      });
    }

    // Check for whitespace characters
    const whitespaceRegex = /\s/g;
    const whitespaceMatches = [...trimmed.matchAll(whitespaceRegex)];
    if (whitespaceMatches.length > 0) {
      const positions = whitespaceMatches.map(match => match.index!);
      return resultError({
        kind: "ContainsWhitespace",
        input: trimmed,
        whitespacePositions: positions,
        message: `Workspace name contains whitespace at positions: ${positions.join(", ")}`,
      });
    }

    // Check for forbidden characters
    const forbiddenChars = ["<", ">", ":", '"', "|", "?", "*", "\0"];
    const foundForbidden = forbiddenChars.filter(char => trimmed.includes(char));
    if (foundForbidden.length > 0) {
      return resultError({
        kind: "InvalidCharacters",
        input: trimmed,
        invalidChars: foundForbidden,
        message: `Invalid characters for cross-platform filesystem: ${foundForbidden.join(", ")}`,
      });
    }

    // Check for reserved names
    const reservedNames = [
      // Windows reserved names
      "CON", "PRN", "AUX", "NUL",
      "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
      "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
      // Unix/Linux system directories
      "bin", "boot", "dev", "etc", "home", "lib", "lib64", "mnt", "opt",
      "proc", "root", "run", "sbin", "srv", "sys", "tmp", "usr", "var",
      // Common application directories
      "node_modules", "target", "build", "dist",
    ];

    const matchedReserved = reservedNames.filter(reserved => 
      trimmed.toLowerCase() === reserved.toLowerCase()
    );
    if (matchedReserved.length > 0) {
      return resultError({
        kind: "ReservedName",
        input: trimmed,
        reserved: matchedReserved,
        message: `Reserved name that conflicts with system directories: ${matchedReserved.join(", ")}`,
      });
    }

    return resultOk(new WorkspaceName(trimmed));
  }

  /**
   * Factory method: Create a default workspace name
   */
  static defaultWorkspace(): Result<WorkspaceName, WorkspaceNameError> {
    return WorkspaceName.create("default-workspace");
  }

  /**
   * Factory method: Create a workspace name with timestamp
   */
  static withTimestamp(prefix = "workspace"): Result<WorkspaceName, WorkspaceNameError> {
    const now = new Date();
    const timestamp = now.toISOString()
      .slice(0, 19)
      .replace(/[T:]/g, "-")
      .replace(/:/g, "-");
    
    return WorkspaceName.create(`${prefix}-${timestamp}`);
  }

  /**
   * Factory method: Create a workspace name for a project
   */
  static forProject(projectName: string, suffix?: string): Result<WorkspaceName, WorkspaceNameError> {
    if (typeof projectName !== "string" || !projectName.trim()) {
      return resultError({
        kind: "EmptyName",
        input: projectName,
        message: "Project name is required",
      });
    }

    // Sanitize project name for workspace usage
    let sanitized = projectName.trim()
      .replace(/\s+/g, "-")  // Replace whitespace with hyphens
      .replace(/[^a-zA-Z0-9\-_]/g, "-")  // Replace invalid chars with hyphens
      .replace(/-+/g, "-")  // Collapse multiple hyphens
      .replace(/^-|-$/g, "");  // Remove leading/trailing hyphens

    if (!sanitized) {
      return resultError({
        kind: "InvalidFormat",
        input: projectName,
        reason: "Project name contains only invalid characters",
        message: "Project name must contain at least one valid character",
      });
    }

    if (suffix) {
      sanitized = `${sanitized}-${suffix}`;
    }

    return WorkspaceName.create(sanitized);
  }

  /**
   * Factory method: Create a temporary workspace name
   */
  static temporary(purpose?: string): Result<WorkspaceName, WorkspaceNameError> {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const name = purpose ? `temp-${purpose}-${randomSuffix}` : `temp-${randomSuffix}`;
    return WorkspaceName.create(name);
  }

  /**
   * Get the string value
   */
  get value(): string {
    return this._value;
  }

  /**
   * Value equality comparison
   */
  equals(other: WorkspaceName): boolean {
    return this._value === other._value;
  }

  /**
   * Case-insensitive equality comparison
   */
  equalsIgnoreCase(other: WorkspaceName): boolean {
    return this._value.toLowerCase() === other._value.toLowerCase();
  }

  /**
   * Get the length of the workspace name
   */
  getLength(): number {
    return this._value.length;
  }

  /**
   * Check if the name is all lowercase
   */
  isLowerCase(): boolean {
    return this._value === this._value.toLowerCase();
  }

  /**
   * Check if the name follows kebab-case convention
   */
  isKebabCase(): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(this._value);
  }

  /**
   * Check if the name follows snake_case convention
   */
  isSnakeCase(): boolean {
    return /^[a-z0-9]+(_[a-z0-9]+)*$/.test(this._value);
  }

  /**
   * Check if the name is suitable for production environments
   */
  isSuitableForProduction(): boolean {
    const nonProdPatterns = [
      /^temp-/i,
      /^test-/i,
      /^debug-/i,
      /^dev-/i,
    ];

    // Too short names are not suitable for production
    if (this._value.length < 3) {
      return false;
    }

    return !nonProdPatterns.some(pattern => pattern.test(this._value));
  }

  /**
   * Convert to lowercase version
   */
  toLowerCase(): Result<WorkspaceName, WorkspaceNameError> {
    const lower = this._value.toLowerCase();
    if (lower === this._value) {
      return resultOk(this); // Return same instance if already lowercase
    }
    return WorkspaceName.create(lower);
  }

  /**
   * Create a new workspace name with prefix
   */
  withPrefix(prefix: string): Result<WorkspaceName, WorkspaceNameError> {
    if (!prefix || prefix.trim() === "") {
      return resultError({
        kind: "EmptyName",
        input: prefix,
        message: "Prefix cannot be empty",
      });
    }
    return WorkspaceName.create(`${prefix.trim()}-${this._value}`);
  }

  /**
   * Create a new workspace name with suffix
   */
  withSuffix(suffix: string): Result<WorkspaceName, WorkspaceNameError> {
    if (!suffix || suffix.trim() === "") {
      return resultError({
        kind: "EmptyName",
        input: suffix,
        message: "Suffix cannot be empty",
      });
    }
    return WorkspaceName.create(`${this._value}-${suffix.trim()}`);
  }

  /**
   * Convert to a filesystem-safe name (for this implementation, it's already safe)
   */
  toSafeName(): Result<WorkspaceName, WorkspaceNameError> {
    return resultOk(this);
  }

  /**
   * Generate a directory path with optional base path
   */
  toDirectoryPath(basePath?: string): string {
    if (basePath) {
      return `${basePath}/${this._value}`;
    }
    return this._value;
  }

  /**
   * String representation for debugging
   */
  toString(): string {
    return `WorkspaceName(${this._value})`;
  }

  /**
   * JSON serialization
   */
  toJSON(): string {
    return this._value;
  }

  /**
   * Primitive value conversion
   */
  valueOf(): string {
    return this._value;
  }
}

/**
 * Collection utility for multiple workspace names
 */
export class WorkspaceNameCollection {
  private readonly _workspaceNames: WorkspaceName[];

  private constructor(workspaceNames: WorkspaceName[]) {
    this._workspaceNames = [...workspaceNames];
    Object.freeze(this);
  }

  /**
   * Create a collection from string names
   */
  static create(names: string[]): Result<WorkspaceNameCollection, WorkspaceNameError> {
    const workspaceNames: WorkspaceName[] = [];

    for (const name of names) {
      const result = WorkspaceName.create(name);
      if (!result.ok) {
        return result;
      }
      workspaceNames.push(result.data);
    }

    return resultOk(new WorkspaceNameCollection(workspaceNames));
  }

  /**
   * Get the count of workspace names
   */
  getCount(): number {
    return this._workspaceNames.length;
  }

  /**
   * Check if the collection is empty
   */
  isEmpty(): boolean {
    return this._workspaceNames.length === 0;
  }

  /**
   * Get all names as strings
   */
  getNames(): string[] {
    return this._workspaceNames.map(ws => ws.value);
  }

  /**
   * Get all WorkspaceName instances
   */
  getWorkspaceNames(): WorkspaceName[] {
    return [...this._workspaceNames];
  }

  /**
   * Check if the collection contains a workspace name
   */
  contains(workspaceName: WorkspaceName): boolean {
    return this._workspaceNames.some(ws => ws.equals(workspaceName));
  }

  /**
   * Filter to only production-suitable workspace names
   */
  filterProductionSuitable(): WorkspaceNameCollection {
    const productionSuitable = this._workspaceNames.filter(ws => 
      ws.isSuitableForProduction()
    );
    return new WorkspaceNameCollection(productionSuitable);
  }
}

/**
 * Format workspace name error for user-friendly display
 */
export function formatWorkspaceNameError(error: WorkspaceNameError): string {
  switch (error.kind) {
    case "EmptyName":
      return "Workspace name cannot be empty. Please provide a valid name.";

    case "InvalidFormat":
      return `Invalid format: ${error.reason}. Input: "${error.input}"`;

    case "ContainsWhitespace":
      return `Workspace name contains whitespace characters at positions: ${error.whitespacePositions.join(", ")}. ` +
        `Please use hyphens or underscores instead of spaces.`;

    case "PathTraversalAttempt":
      return `Workspace name contains suspicious path patterns: ${error.suspiciousPatterns.join(", ")}. ` +
        `This could be a security risk. Please use a simple name without path separators.`;

    case "TooLong":
      return `Workspace name is too long (${error.actualLength} characters). ` +
        `Maximum allowed length is ${error.maxLength} characters.`;

    case "StartsWithDot":
      return `Workspace name cannot start with a dot as this creates hidden directories. ` +
        `Please choose a name that doesn't start with a dot.`;

    case "InvalidCharacters":
      return `Workspace name contains invalid characters: ${error.invalidChars.join(", ")}. ` +
        `Please use only letters, numbers, hyphens, and underscores.`;

    case "ReservedName":
      return `"${error.input}" is a reserved system name (${error.reserved.join(", ")}). ` +
        `Please choose a different name to avoid conflicts.`;

    default:
      return "Unknown workspace name validation error occurred.";
  }
}

export function createWorkspaceName(name: string): WorkspaceName {
  const result = WorkspaceName.create(name);
  if (!result.ok) {
    throw new Error(formatWorkspaceNameError(result.error));
  }
  return result.data;
}