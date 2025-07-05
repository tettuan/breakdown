/**
 * @fileoverview Path Validator
 *
 * This module is responsible for validating file system paths,
 * following the Single Responsibility Principle.
 *
 * @module lib/validator/path_validator
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import type { PathError } from "../types/unified_error_types.ts";
import { ErrorFactory } from "../types/unified_error_types.ts";

/**
 * Path validation options
 */
export interface PathValidationOptions {
  /** Maximum allowed path length */
  maxLength?: number;
  /** Allow stdin/stdout as valid paths */
  allowStdio?: boolean;
  /** Check if path exists (for input paths) */
  checkExists?: boolean;
  /** Allow relative paths */
  allowRelative?: boolean;
}

/**
 * Path Validator class
 *
 * Responsible for validating file system paths with various constraints
 * and security considerations.
 */
export class PathValidator {
  private static readonly STDIO_PATHS = new Set(["stdin", "stdout", "stderr", "-"]);
  private static readonly INVALID_CHARS = ["\0", "\r", "\n"];
  private static readonly DEFAULT_MAX_LENGTH = 4096;

  /**
   * Validate a file system path
   */
  validate(
    path: string,
    type: "input" | "output",
    options: PathValidationOptions = {},
  ): Result<void, PathError> {
    const {
      maxLength = PathValidator.DEFAULT_MAX_LENGTH,
      allowStdio = true,
      allowRelative = true,
    } = options;

    // Check for stdio paths
    if (PathValidator.STDIO_PATHS.has(path)) {
      if (allowStdio) {
        return ok(undefined);
      }
      return error(ErrorFactory.pathError(
        "InvalidPath",
        path,
        "Standard I/O paths are not allowed",
        { type, allowStdio },
      ));
    }

    // Check for empty path
    if (!path || path.trim() === "") {
      return error(ErrorFactory.pathError(
        "InvalidPath",
        path,
        `${type} path cannot be empty`,
        { type },
      ));
    }

    // Check for invalid characters
    const invalidChars = this.findInvalidCharacters(path);
    if (invalidChars.length > 0) {
      return error(ErrorFactory.pathError(
        "InvalidPath",
        path,
        `Path contains invalid characters: ${invalidChars.join(", ")}`,
        { type, invalidChars },
      ));
    }

    // Check path length
    if (path.length > maxLength) {
      return error(ErrorFactory.pathError(
        "PathTooLong",
        path,
        undefined,
        { type, actualLength: path.length },
      ));
    }

    // Check for absolute path requirement
    if (!allowRelative && !this.isAbsolutePath(path)) {
      return error(ErrorFactory.pathError(
        "InvalidPath",
        path,
        "Path must be absolute",
        { type, allowRelative },
      ));
    }

    // Additional security checks
    const securityResult = this.performSecurityChecks(path);
    if (!securityResult.ok) {
      return error(securityResult.error);
    }

    return ok(undefined);
  }

  /**
   * Check if a path is a standard I/O path
   */
  isStdioPath(path: string): boolean {
    return PathValidator.STDIO_PATHS.has(path);
  }

  /**
   * Find invalid characters in a path
   */
  private findInvalidCharacters(path: string): string[] {
    const found: string[] = [];
    for (const char of PathValidator.INVALID_CHARS) {
      if (path.includes(char)) {
        found.push(char === "\0" ? "\\0" : char === "\r" ? "\\r" : "\\n");
      }
    }
    return found;
  }

  /**
   * Check if a path is absolute
   */
  private isAbsolutePath(path: string): boolean {
    // Unix-style absolute path
    if (path.startsWith("/")) return true;

    // Windows-style absolute path
    if (/^[A-Za-z]:[\\/]/.test(path)) return true;

    // UNC path
    if (path.startsWith("\\\\")) return true;

    return false;
  }

  /**
   * Perform additional security checks
   */
  private performSecurityChecks(path: string): Result<void, PathError> {
    // Check for path traversal attempts
    if (path.includes("..")) {
      // More sophisticated check would normalize the path first
      if (path.includes("../") || path.includes("..\\") || path.endsWith("..")) {
        return error(ErrorFactory.pathError(
          "InvalidPath",
          path,
          "Path traversal detected",
          { securityViolation: "path_traversal" },
        ));
      }
    }

    // Check for suspicious patterns
    if (path.includes("~") && path.startsWith("~")) {
      // Tilde expansion could be dangerous in some contexts
      return error(ErrorFactory.pathError(
        "InvalidPath",
        path,
        "Tilde expansion not allowed",
        { securityViolation: "tilde_expansion" },
      ));
    }

    return ok(undefined);
  }

  /**
   * Normalize a path for consistent handling
   */
  normalize(path: string): string {
    // Basic normalization - in real implementation would be more comprehensive
    return path
      .replace(/\\/g, "/") // Convert backslashes to forward slashes
      .replace(/\/+/g, "/") // Remove duplicate slashes
      .replace(/\/$/, ""); // Remove trailing slash (except for root)
  }
}
