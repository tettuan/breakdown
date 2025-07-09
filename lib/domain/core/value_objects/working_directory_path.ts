/**
 * @fileoverview Working Directory Path Value Object - Unified implementation following Totality design
 *
 * This module provides a unified WorkingDirectoryPath value object that manages
 * working directory paths with comprehensive validation and type safety.
 *
 * Design Principles:
 * 1. Smart Constructor pattern for type-safe creation
 * 2. Discriminated Union for comprehensive error handling
 * 3. Result type for Totality principle compliance
 * 4. Immutable value object following DDD principles
 * 5. Directory-specific validation and security checks
 *
 * @module domain/core/value_objects/working_directory_path
 */

import { error, ok, Result } from "../../../types/result.ts";
import { BasePathValueObject, DEFAULT_PATH_CONFIG, PathValidationConfig } from "./base_path.ts";
import type { PathResolutionError } from "../../../types/path_resolution_option.ts";

/**
 * Working Directory Path specific error types using Discriminated Union
 *
 * Each error type has a unique 'kind' discriminator for type safety
 * and provides specific context for different failure scenarios.
 */
export type WorkingDirectoryPathError =
  | {
    kind: "InvalidDirectoryPath";
    message: string;
    path: string;
  }
  | {
    kind: "DirectoryNotFound";
    message: string;
    path: string;
  }
  | {
    kind: "PermissionDenied";
    message: string;
    path: string;
    operation: "read" | "write" | "execute";
  }
  | {
    kind: "PathResolutionGeneral";
    message: string;
    originalPath: string;
    resolvedPath?: string;
    resolutionError: PathResolutionError;
  }
  | {
    kind: "SecurityViolation";
    message: string;
    attemptedPath: string;
    violation: "path_traversal" | "invalid_characters" | "suspicious_pattern";
  }
  | {
    kind: "ValidationError";
    field: string;
    message: string;
    value?: string;
  }
  | {
    kind: "FileSystemError";
    message: string;
    path: string;
    operation: string;
    originalError?: Error;
  };

/**
 * Type guards for WorkingDirectoryPathError discrimination
 * Enables type-safe error handling throughout the application
 */
export function isInvalidDirectoryPathError(
  error: WorkingDirectoryPathError,
): error is Extract<WorkingDirectoryPathError, { kind: "InvalidDirectoryPath" }> {
  return error.kind === "InvalidDirectoryPath";
}

export function isDirectoryNotFoundError(
  error: WorkingDirectoryPathError,
): error is Extract<WorkingDirectoryPathError, { kind: "DirectoryNotFound" }> {
  return error.kind === "DirectoryNotFound";
}

export function isPermissionDeniedError(
  error: WorkingDirectoryPathError,
): error is Extract<WorkingDirectoryPathError, { kind: "PermissionDenied" }> {
  return error.kind === "PermissionDenied";
}

export function isPathResolutionGeneralError(
  error: WorkingDirectoryPathError,
): error is Extract<WorkingDirectoryPathError, { kind: "PathResolutionGeneral" }> {
  return error.kind === "PathResolutionGeneral";
}

export function isSecurityViolationError(
  error: WorkingDirectoryPathError,
): error is Extract<WorkingDirectoryPathError, { kind: "SecurityViolation" }> {
  return error.kind === "SecurityViolation";
}

export function isValidationError(
  error: WorkingDirectoryPathError,
): error is Extract<WorkingDirectoryPathError, { kind: "ValidationError" }> {
  return error.kind === "ValidationError";
}

export function isFileSystemError(
  error: WorkingDirectoryPathError,
): error is Extract<WorkingDirectoryPathError, { kind: "FileSystemError" }> {
  return error.kind === "FileSystemError";
}

/**
 * Format working directory path error for display
 * Provides consistent error messaging across the application
 */
export function formatWorkingDirectoryPathError(
  workingDirError: WorkingDirectoryPathError,
): string {
  switch (workingDirError.kind) {
    case "InvalidDirectoryPath":
      return `Invalid directory path '${workingDirError.path}': ${workingDirError.message}`;
    case "DirectoryNotFound":
      return `Directory not found '${workingDirError.path}': ${workingDirError.message}`;
    case "PermissionDenied":
      return `Permission denied for ${workingDirError.operation} operation on '${workingDirError.path}': ${workingDirError.message}`;
    case "PathResolutionGeneral":
      return `Path resolution failed for '${workingDirError.originalPath}': ${workingDirError.message}`;
    case "SecurityViolation":
      return `Security violation detected in path '${workingDirError.attemptedPath}': ${workingDirError.message}`;
    case "ValidationError":
      return `Validation error in ${workingDirError.field}: ${workingDirError.message}`;
    case "FileSystemError":
      return `File system error during ${workingDirError.operation} on '${workingDirError.path}': ${workingDirError.message}`;
  }
}

/**
 * Working Directory Path configuration with directory-specific validation rules
 */
export interface WorkingDirectoryPathConfig {
  /** Whether to verify directory existence during creation */
  readonly verifyExistence: boolean;
  /** Whether to check read permissions */
  readonly requireReadPermission: boolean;
  /** Whether to check write permissions */
  readonly requireWritePermission: boolean;
  /** Whether to resolve relative paths to absolute */
  readonly resolveToAbsolute: boolean;
  /** Whether to create directory if it doesn't exist */
  readonly createIfMissing: boolean;
  /** Base path validation configuration */
  readonly basePathConfig: PathValidationConfig;
}

/**
 * Default working directory path configuration
 */
export const DEFAULT_WORKING_DIRECTORY_CONFIG: WorkingDirectoryPathConfig = {
  verifyExistence: true,
  requireReadPermission: true,
  requireWritePermission: false,
  resolveToAbsolute: true,
  createIfMissing: false,
  basePathConfig: {
    ...DEFAULT_PATH_CONFIG,
    allowAbsolute: true, // Working directories can be absolute
    allowRelative: true, // Working directories can be relative
    requiredExtensions: [], // Directories don't have extensions
    maxLength: 500, // Allow longer paths for deep directory structures
  },
};

/**
 * Working Directory Path Value Object
 *
 * Represents a validated working directory path with comprehensive validation
 * and optional file system verification.
 *
 * This class provides:
 * - Type-safe construction through Smart Constructor pattern
 * - Directory-specific validation with specific error types
 * - Immutable design following DDD principles
 * - Security validation to prevent path traversal attacks
 * - Optional file system verification (existence, permissions)
 * - Path resolution capabilities (relative to absolute)
 *
 * @example Basic usage
 * ```typescript
 * const pathResult = WorkingDirectoryPath.create("/home/user/projects");
 * if (pathResult.ok) {
 *   console.log(pathResult.data.getAbsolutePath());
 * }
 * ```
 *
 * @example With custom configuration
 * ```typescript
 * const config: WorkingDirectoryPathConfig = {
 *   ...DEFAULT_WORKING_DIRECTORY_CONFIG,
 *   createIfMissing: true,
 *   requireWritePermission: true,
 * };
 *
 * const pathResult = WorkingDirectoryPath.createWithConfig("./workspace", config);
 * ```
 *
 * @example Current working directory
 * ```typescript
 * const cwdResult = WorkingDirectoryPath.current();
 * if (cwdResult.ok) {
 *   console.log("Current directory:", cwdResult.data.getAbsolutePath());
 * }
 * ```
 */
export class WorkingDirectoryPath extends BasePathValueObject {
  /**
   * Private constructor enforcing Smart Constructor pattern
   *
   * @param originalPath The original input path
   * @param resolvedPath The resolved absolute path
   * @param isAbsolute Whether the path is absolute
   * @param exists Whether the directory exists (if checked)
   */
  private constructor(
    private readonly originalPath: string,
    resolvedPath: string,
    private readonly _isAbsolute: boolean,
    private readonly exists?: boolean,
  ) {
    // Pass false to parent constructor to prevent premature freezing
    super(resolvedPath, false);
    // Now that all properties are set, freeze the object for immutability
    this.freezeObject();
  }

  /**
   * Smart Constructor for WorkingDirectoryPath with default configuration
   *
   * Creates a validated WorkingDirectoryPath instance using standard validation rules.
   * This is the primary factory method for most use cases.
   *
   * @param path The directory path (relative or absolute)
   * @returns Result containing WorkingDirectoryPath or specific error
   */
  static create(
    path: string,
  ): Result<WorkingDirectoryPath, WorkingDirectoryPathError> {
    return WorkingDirectoryPath.createWithConfig(path, DEFAULT_WORKING_DIRECTORY_CONFIG);
  }

  /**
   * Smart Constructor for WorkingDirectoryPath with custom configuration
   *
   * Provides full control over validation rules and file system verification.
   * Useful for testing, custom environments, or special use cases.
   *
   * @param path The directory path
   * @param config Custom validation configuration
   * @returns Result containing WorkingDirectoryPath or specific error
   */
  static createWithConfig(
    path: string,
    config: WorkingDirectoryPathConfig,
  ): Result<WorkingDirectoryPath, WorkingDirectoryPathError> {
    // Stage 1: Basic input validation
    const inputValidation = WorkingDirectoryPath.validateInput(path);
    if (!inputValidation.ok) {
      return inputValidation;
    }

    const trimmedPath = path.trim();

    // Stage 2: Path resolution
    const resolutionResult = WorkingDirectoryPath.resolvePath(trimmedPath, config);
    if (!resolutionResult.ok) {
      return resolutionResult;
    }

    const { resolvedPath, isAbsolute } = resolutionResult.data;

    // Stage 3: Security validation using base class
    const baseValidation = super.createPath(
      resolvedPath,
      config.basePathConfig,
      (normalizedPath) => {
        // This will be replaced by actual object creation after verification
        return new WorkingDirectoryPath(trimmedPath, normalizedPath, isAbsolute, undefined);
      },
    );

    if (!baseValidation.ok) {
      return error({
        kind: "SecurityViolation",
        message: "Path failed security validation",
        attemptedPath: resolvedPath,
        violation: "suspicious_pattern",
      });
    }

    const normalizedPath = baseValidation.data.getValue();

    // Stage 4: File system verification (if enabled)
    const verificationResult = WorkingDirectoryPath.verifyFileSystem(normalizedPath, config);
    if (!verificationResult.ok) {
      return verificationResult;
    }

    const { exists } = verificationResult.data;

    // Stage 5: Create the final instance
    return ok(new WorkingDirectoryPath(trimmedPath, normalizedPath, isAbsolute, exists));
  }

  /**
   * Factory for current working directory
   */
  static current(): Result<WorkingDirectoryPath, WorkingDirectoryPathError> {
    try {
      const cwd = Deno.cwd();
      return WorkingDirectoryPath.create(cwd);
    } catch (err) {
      return error({
        kind: "FileSystemError",
        message: "Failed to get current working directory",
        path: ".",
        operation: "getcwd",
        originalError: err instanceof Error ? err : undefined,
      });
    }
  }

  /**
   * Factory for temporary directory
   */
  static temp(): Result<WorkingDirectoryPath, WorkingDirectoryPathError> {
    try {
      const tempDir = Deno.env.get("TMPDIR") || Deno.env.get("TEMP") || "/tmp";
      return WorkingDirectoryPath.create(tempDir);
    } catch (err) {
      return error({
        kind: "FileSystemError",
        message: "Failed to get temporary directory",
        path: "TMPDIR",
        operation: "getenv",
        originalError: err instanceof Error ? err : undefined,
      });
    }
  }

  /**
   * Factory for home directory
   */
  static home(): Result<WorkingDirectoryPath, WorkingDirectoryPathError> {
    try {
      const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
      if (!homeDir) {
        return error({
          kind: "DirectoryNotFound",
          message: "Home directory not found in environment variables",
          path: "HOME/USERPROFILE",
        });
      }
      return WorkingDirectoryPath.create(homeDir);
    } catch (err) {
      return error({
        kind: "FileSystemError",
        message: "Failed to get home directory",
        path: "HOME",
        operation: "getenv",
        originalError: err instanceof Error ? err : undefined,
      });
    }
  }

  /**
   * Get the original input path
   */
  getOriginalPath(): string {
    return this.originalPath;
  }

  /**
   * Get the resolved absolute path
   */
  getAbsolutePath(): string {
    return this.getValue();
  }

  /**
   * Get the path relative to another directory
   */
  getRelativePath(baseDir: WorkingDirectoryPath): Result<string, WorkingDirectoryPathError> {
    try {
      const basePath = baseDir.getAbsolutePath();
      const thisPath = this.getAbsolutePath();

      // Simple relative path calculation
      if (thisPath.startsWith(basePath)) {
        const relativePath = thisPath.slice(basePath.length);
        return ok(relativePath.startsWith("/") ? relativePath.slice(1) : relativePath);
      }

      return error({
        kind: "PathResolutionGeneral",
        message: "Cannot create relative path - paths are not related",
        originalPath: thisPath,
        resolvedPath: basePath,
        resolutionError: { kind: "InvalidPath", path: thisPath, reason: "Paths are not related" },
      });
    } catch (resolutionError) {
      return error({
        kind: "PathResolutionGeneral",
        message: `Failed to calculate relative path: ${
          resolutionError instanceof Error ? resolutionError.message : String(resolutionError)
        }`,
        originalPath: this.getAbsolutePath(),
        resolutionError: {
          kind: "InvalidPath",
          path: this.getAbsolutePath(),
          reason: resolutionError instanceof Error
            ? resolutionError.message
            : String(resolutionError),
        },
      });
    }
  }

  /**
   * Check if this is an absolute path
   */
  isAbsolutePath(): boolean {
    return this._isAbsolute;
  }

  /**
   * Check if directory exists (if verification was performed)
   */
  directoryExists(): boolean | undefined {
    return this.exists;
  }

  /**
   * Join this path with additional path components
   */
  join(...components: string[]): Result<WorkingDirectoryPath, WorkingDirectoryPathError> {
    try {
      const basePath = this.getAbsolutePath();
      const joinedPath = [basePath, ...components].join("/").replace(/\/+/g, "/");
      return WorkingDirectoryPath.create(joinedPath);
    } catch (joinError) {
      return error({
        kind: "PathResolutionGeneral",
        message: `Failed to join path components: ${
          joinError instanceof Error ? joinError.message : String(joinError)
        }`,
        originalPath: this.getAbsolutePath(),
        resolutionError: {
          kind: "InvalidPath",
          path: this.getAbsolutePath(),
          reason: joinError instanceof Error ? joinError.message : String(joinError),
        },
      });
    }
  }

  /**
   * Get parent directory
   */
  getParent(): Result<WorkingDirectoryPath, WorkingDirectoryPathError> {
    try {
      const currentPath = this.getAbsolutePath();
      const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
      return WorkingDirectoryPath.create(parentPath);
    } catch (parentError) {
      return error({
        kind: "PathResolutionGeneral",
        message: `Failed to get parent directory: ${
          parentError instanceof Error ? parentError.message : String(parentError)
        }`,
        originalPath: this.getAbsolutePath(),
        resolutionError: {
          kind: "InvalidPath",
          path: this.getAbsolutePath(),
          reason: parentError instanceof Error ? parentError.message : String(parentError),
        },
      });
    }
  }

  /**
   * Get directory name (last component)
   */
  getDirectoryName(): string {
    const path = this.getAbsolutePath();
    const parts = path.split("/").filter((part) => part.length > 0);
    return parts[parts.length - 1] || "";
  }

  /**
   * Check if this directory path equals another
   */
  override equals(other: BasePathValueObject): boolean {
    if (!(other instanceof WorkingDirectoryPath)) {
      return false;
    }

    return super.equals(other) &&
      this.originalPath === other.originalPath &&
      this._isAbsolute === other._isAbsolute;
  }

  /**
   * Convert to debug string representation
   */
  toDebugString(): string {
    const existsInfo = this.exists !== undefined ? `, exists=${this.exists}` : "";
    return `WorkingDirectoryPath{original=${this.originalPath}, resolved=${this.getAbsolutePath()}, absolute=${this._isAbsolute}${existsInfo}}`;
  }

  // Private validation methods

  /**
   * Validate basic input
   */
  private static validateInput(path: string): Result<void, WorkingDirectoryPathError> {
    if (!path || typeof path !== "string") {
      return error({
        kind: "InvalidDirectoryPath",
        message: "Path cannot be null, undefined, or non-string",
        path: String(path),
      });
    }

    const trimmedPath = path.trim();
    if (trimmedPath.length === 0) {
      return error({
        kind: "InvalidDirectoryPath",
        message: "Path cannot be empty or whitespace only",
        path: path,
      });
    }

    return ok(undefined);
  }

  /**
   * Resolve path to absolute form if needed
   */
  private static resolvePath(
    path: string,
    config: WorkingDirectoryPathConfig,
  ): Result<{ resolvedPath: string; isAbsolute: boolean }, WorkingDirectoryPathError> {
    try {
      const isAbsolute = path.startsWith("/") || /^[a-zA-Z]:/.test(path);

      let resolvedPath: string;
      if (config.resolveToAbsolute && !isAbsolute) {
        // Resolve relative path to absolute
        const cwd = Deno.cwd();
        resolvedPath = `${cwd}/${path}`.replace(/\/+/g, "/");
      } else {
        resolvedPath = path;
      }

      // Normalize path separators
      resolvedPath = resolvedPath.replace(/\\+/g, "/").replace(/\/+/g, "/");

      return ok({
        resolvedPath,
        isAbsolute: resolvedPath.startsWith("/") || /^[a-zA-Z]:/.test(resolvedPath),
      });
    } catch (resolutionError) {
      return error({
        kind: "PathResolutionGeneral",
        message: `Failed to resolve path: ${
          resolutionError instanceof Error ? resolutionError.message : String(resolutionError)
        }`,
        originalPath: path,
        resolutionError: {
          kind: "InvalidPath",
          path: path,
          reason: resolutionError instanceof Error
            ? resolutionError.message
            : String(resolutionError),
        },
      });
    }
  }

  /**
   * Verify file system properties if enabled
   */
  private static verifyFileSystem(
    path: string,
    config: WorkingDirectoryPathConfig,
  ): Result<{ exists: boolean }, WorkingDirectoryPathError> {
    let exists = false;

    if (config.verifyExistence || config.requireReadPermission || config.requireWritePermission) {
      try {
        const stat = Deno.statSync(path);
        exists = stat.isDirectory;

        if (config.verifyExistence && !exists) {
          if (config.createIfMissing) {
            try {
              Deno.mkdirSync(path, { recursive: true });
              exists = true;
            } catch (createError) {
              return error({
                kind: "FileSystemError",
                message: `Failed to create directory: ${
                  createError instanceof Error ? createError.message : String(createError)
                }`,
                path: path,
                operation: "mkdir",
                originalError: createError instanceof Error ? createError : undefined,
              });
            }
          } else {
            return error({
              kind: "DirectoryNotFound",
              message: "Directory does not exist",
              path: path,
            });
          }
        }

        // Check permissions if required
        if (config.requireReadPermission) {
          try {
            Deno.readDirSync(path).next(); // Try to read one entry
          } catch (readError) {
            return error({
              kind: "PermissionDenied",
              message: `Cannot read directory: ${
                readError instanceof Error ? readError.message : String(readError)
              }`,
              path: path,
              operation: "read",
            });
          }
        }

        if (config.requireWritePermission) {
          // Test write permission by trying to create a temporary file
          const testFile = `${path}/.write_test_${Date.now()}`;
          try {
            Deno.writeTextFileSync(testFile, "test");
            Deno.removeSync(testFile);
          } catch (writeError) {
            return error({
              kind: "PermissionDenied",
              message: `Cannot write to directory: ${
                writeError instanceof Error ? writeError.message : String(writeError)
              }`,
              path: path,
              operation: "write",
            });
          }
        }
      } catch (statError) {
        if (config.verifyExistence) {
          return error({
            kind: "DirectoryNotFound",
            message: `Directory does not exist: ${
              statError instanceof Error ? statError.message : String(statError)
            }`,
            path: path,
          });
        }
        // If not verifying existence, assume it doesn't exist
        exists = false;
      }
    }

    return ok({ exists });
  }
}
