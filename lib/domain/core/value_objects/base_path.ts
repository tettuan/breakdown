/**
 * @fileoverview Base Path Value Object - Foundation for all path-related value objects
 *
 * This module implements the base PathValueObject following DDD principles and
 * Totality design. All path-related value objects inherit from this base class
 * to ensure consistent validation, security, and behavior.
 *
 * Design Principles:
 * 1. Smart Constructor pattern for type-safe creation
 * 2. Immutable data structure for thread safety
 * 3. Result type for explicit error handling
 * 4. Security validation for path traversal prevention
 * 5. Cross-platform path normalization
 *
 * @module domain/core/value_objects/base_path
 */

import { error, ok, Result } from "../../../types/result.ts";

/**
 * Path validation error types using Discriminated Union
 */
export type PathValidationError =
  | { kind: "EMPTY_PATH"; message: string }
  | { kind: "PATH_TRAVERSAL"; message: string; attemptedPath: string }
  | { kind: "INVALID_CHARACTERS"; message: string; invalidChars: string[] }
  | { kind: "TOO_LONG"; message: string; maxLength: number; actualLength: number }
  | { kind: "ABSOLUTE_PATH_REQUIRED"; message: string }
  | { kind: "RELATIVE_PATH_REQUIRED"; message: string }
  | { kind: "INVALID_EXTENSION"; message: string; expected: string[]; actual: string }
  | { kind: "PLATFORM_INCOMPATIBLE"; message: string; platform: string };

/**
 * Path validation configuration
 */
export interface PathValidationConfig {
  /** Maximum allowed path length */
  readonly maxLength: number;
  /** Whether to allow relative paths */
  readonly allowRelative: boolean;
  /** Whether to allow absolute paths */
  readonly allowAbsolute: boolean;
  /** Required file extensions (if any) */
  readonly requiredExtensions?: readonly string[];
  /** Forbidden characters beyond default security list */
  readonly forbiddenChars?: readonly string[];
  /** Whether to normalize path separators */
  readonly normalizeSeparators: boolean;
}

/**
 * Default path validation configuration
 */
export const DEFAULT_PATH_CONFIG: PathValidationConfig = {
  maxLength: 260, // Windows MAX_PATH limitation
  allowRelative: true,
  allowAbsolute: true,
  normalizeSeparators: true,
};

/**
 * Base class for all path-related value objects
 *
 * Provides common path validation, normalization, and security features.
 * This class follows the Template Method pattern for extensible validation.
 *
 * @example Basic usage
 * ```typescript
 * class MyPath extends BasePathValueObject {
 *   static create(path: string): Result<MyPath, PathValidationError> {
 *     return super.createPath(path, {
 *       ...DEFAULT_PATH_CONFIG,
 *       requiredExtensions: ['.txt', '.md']
 *     }, (normalized) => new MyPath(normalized));
 *   }
 * }
 * ```
 */
export abstract class BasePathValueObject {
  /**
   * Private constructor enforcing Smart Constructor pattern
   * @param value The validated and normalized path string
   * @param shouldFreeze Whether to freeze the object immediately (default: true)
   */
  protected constructor(private readonly value: string, shouldFreeze: boolean = true) {
    // Apply Object.freeze() only if requested and this is not being extended
    // This allows subclasses to set their properties before freezing
    if (shouldFreeze && this.constructor === BasePathValueObject) {
      Object.freeze(this);
    }
  }

  /**
   * Protected method for subclasses to freeze the object after setting all properties
   * This ensures proper inheritance behavior with immutability
   */
  protected freezeObject(): void {
    Object.freeze(this);
  }

  /**
   * Get the path value
   * @returns The normalized path string
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Get the path as string representation
   * @returns The path value
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another path value object
   * @param other Another path value object
   * @returns True if paths are equal
   */
  equals(other: BasePathValueObject): boolean {
    return this.value === other.value;
  }

  /**
   * Get the file extension if present
   * @returns The file extension (including dot) or empty string
   */
  getExtension(): string {
    const lastDot = this.value.lastIndexOf('.');
    const lastSlash = Math.max(this.value.lastIndexOf('/'), this.value.lastIndexOf('\\'));
    
    // Extension must be after directory separator and not at the start of filename
    // This handles dotfiles correctly (e.g., ".dotfile" has no extension)
    if (lastDot > lastSlash && lastDot > lastSlash + 1) {
      return this.value.substring(lastDot);
    }
    
    return '';
  }

  /**
   * Get the filename (basename) without directory path
   * @returns The filename portion of the path
   */
  getFilename(): string {
    const lastSlash = Math.max(this.value.lastIndexOf('/'), this.value.lastIndexOf('\\'));
    return this.value.substring(lastSlash + 1);
  }

  /**
   * Get the directory portion of the path
   * @returns The directory path without filename
   */
  getDirectory(): string {
    const lastSlash = Math.max(this.value.lastIndexOf('/'), this.value.lastIndexOf('\\'));
    if (lastSlash < 0) return '';
    return this.value.substring(0, lastSlash);
  }

  /**
   * Check if this is an absolute path
   * @returns True if the path is absolute
   */
  isAbsolute(): boolean {
    // Windows: starts with drive letter or UNC path
    if (/^[a-zA-Z]:[/\\]/.test(this.value) || this.value.startsWith('\\\\')) {
      return true;
    }
    
    // Unix-like: starts with forward slash
    return this.value.startsWith('/');
  }

  /**
   * Check if this is a relative path
   * @returns True if the path is relative
   */
  isRelative(): boolean {
    return !this.isAbsolute();
  }

  /**
   * Template method for creating path value objects with validation
   *
   * This method implements the core validation logic that can be reused
   * by all path value object subclasses.
   *
   * @template T The concrete path value object type
   * @param rawPath The raw path string to validate
   * @param config Validation configuration
   * @param constructor Factory function to create the concrete instance
   * @returns Result containing validated path value object or error
   */
  protected static createPath<T extends BasePathValueObject>(
    rawPath: string,
    config: PathValidationConfig,
    constructor: (normalizedPath: string) => T,
  ): Result<T, PathValidationError> {
    // Stage 1: Basic validation
    const basicValidation = this.validateBasicConstraints(rawPath);
    if (!basicValidation.ok) {
      return basicValidation;
    }

    // Stage 2: Normalize path
    const normalized = this.normalizePath(rawPath, config);

    // Stage 3: Security validation
    const securityValidation = this.validateSecurity(normalized);
    if (!securityValidation.ok) {
      return securityValidation;
    }

    // Stage 4: Path type validation (absolute/relative)
    const pathTypeValidation = this.validatePathType(normalized, config);
    if (!pathTypeValidation.ok) {
      return pathTypeValidation;
    }

    // Stage 5: Extension validation
    if (config.requiredExtensions && config.requiredExtensions.length > 0) {
      const extensionValidation = this.validateExtension(normalized, config.requiredExtensions);
      if (!extensionValidation.ok) {
        return extensionValidation;
      }
    }

    // Stage 6: Length validation
    const lengthValidation = this.validateLength(normalized, config.maxLength);
    if (!lengthValidation.ok) {
      return lengthValidation;
    }

    // Stage 7: Custom character validation
    if (config.forbiddenChars && config.forbiddenChars.length > 0) {
      const charValidation = this.validateCustomCharacters(normalized, config.forbiddenChars);
      if (!charValidation.ok) {
        return charValidation;
      }
    }

    // All validations passed - create instance
    return ok(constructor(normalized));
  }

  /**
   * Validate basic constraints (empty, null, undefined)
   */
  private static validateBasicConstraints(rawPath: string): Result<void, PathValidationError> {
    if (rawPath == null || rawPath === undefined) {
      return error({
        kind: "EMPTY_PATH",
        message: "Path cannot be null or undefined",
      });
    }

    if (typeof rawPath !== 'string') {
      return error({
        kind: "EMPTY_PATH",
        message: "Path must be a string",
      });
    }

    const trimmed = rawPath.trim();
    if (trimmed.length === 0) {
      return error({
        kind: "EMPTY_PATH",
        message: "Path cannot be empty or whitespace only",
      });
    }

    return ok(undefined);
  }

  /**
   * Normalize path separators and resolve relative components
   */
  private static normalizePath(rawPath: string, config: PathValidationConfig): string {
    let normalized = rawPath.trim();

    if (config.normalizeSeparators) {
      // Convert all separators to forward slashes for consistent processing
      normalized = normalized.replace(/[/\\]+/g, '/');
      
      // Remove trailing slashes except for root
      if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }
    }

    return normalized;
  }

  /**
   * Validate against security vulnerabilities
   */
  private static validateSecurity(path: string): Result<void, PathValidationError> {
    // Check for path traversal attacks
    const pathTraversalPatterns = [
      '../',
      '..\\',
      '/..',
      '\\..',
    ];

    for (const pattern of pathTraversalPatterns) {
      if (path.includes(pattern)) {
        return error({
          kind: "PATH_TRAVERSAL",
          message: "Path contains path traversal sequences which are not allowed for security reasons",
          attemptedPath: path,
        });
      }
    }

    // Check for suspicious characters that might indicate injection attempts
    const suspiciousChars = ['\0', '\r', '\n'];
    const foundSuspicious = suspiciousChars.filter(char => path.includes(char));
    
    if (foundSuspicious.length > 0) {
      return error({
        kind: "INVALID_CHARACTERS",
        message: "Path contains control characters which are not allowed",
        invalidChars: foundSuspicious.map(char => `\\x${char.charCodeAt(0).toString(16).padStart(2, '0')}`),
      });
    }

    return ok(undefined);
  }

  /**
   * Validate path type (absolute vs relative)
   */
  private static validatePathType(path: string, config: PathValidationConfig): Result<void, PathValidationError> {
    const isAbsolute = this.isAbsolutePath(path);

    if (isAbsolute && !config.allowAbsolute) {
      return error({
        kind: "ABSOLUTE_PATH_REQUIRED",
        message: "Absolute paths are not allowed in this context",
      });
    }

    if (!isAbsolute && !config.allowRelative) {
      return error({
        kind: "RELATIVE_PATH_REQUIRED",
        message: "Relative paths are not allowed in this context",
      });
    }

    return ok(undefined);
  }

  /**
   * Check if a path is absolute
   */
  private static isAbsolutePath(path: string): boolean {
    // Windows: starts with drive letter or UNC path
    if (/^[a-zA-Z]:[/\\]/.test(path) || path.startsWith('\\\\')) {
      return true;
    }
    
    // Unix-like: starts with forward slash
    return path.startsWith('/');
  }

  /**
   * Validate file extension
   */
  private static validateExtension(
    path: string,
    requiredExtensions: readonly string[],
  ): Result<void, PathValidationError> {
    const actualExtension = this.getFileExtension(path);
    
    const hasValidExtension = requiredExtensions.some(ext => 
      actualExtension.toLowerCase() === ext.toLowerCase()
    );

    if (!hasValidExtension) {
      return error({
        kind: "INVALID_EXTENSION",
        message: `File must have one of the following extensions: ${requiredExtensions.join(', ')}`,
        expected: [...requiredExtensions],
        actual: actualExtension,
      });
    }

    return ok(undefined);
  }

  /**
   * Get file extension from path
   */
  private static getFileExtension(path: string): string {
    const lastDot = path.lastIndexOf('.');
    const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    
    // Extension must be after directory separator and not at the start of filename
    // This handles dotfiles correctly (e.g., ".dotfile" has no extension)
    if (lastDot > lastSlash && lastDot > lastSlash + 1) {
      return path.substring(lastDot);
    }
    
    return '';
  }

  /**
   * Validate path length
   */
  private static validateLength(path: string, maxLength: number): Result<void, PathValidationError> {
    if (path.length > maxLength) {
      return error({
        kind: "TOO_LONG",
        message: `Path is too long (${path.length} characters). Maximum allowed: ${maxLength}`,
        maxLength,
        actualLength: path.length,
      });
    }

    return ok(undefined);
  }

  /**
   * Validate custom forbidden characters
   */
  private static validateCustomCharacters(
    path: string,
    forbiddenChars: readonly string[],
  ): Result<void, PathValidationError> {
    const foundForbidden = forbiddenChars.filter(char => path.includes(char));
    
    if (foundForbidden.length > 0) {
      return error({
        kind: "INVALID_CHARACTERS",
        message: `Path contains forbidden characters: ${foundForbidden.join(', ')}`,
        invalidChars: foundForbidden,
      });
    }

    return ok(undefined);
  }
}