/**
 * @fileoverview Error handling module for the Breakdown workspace.
 *
 * This module defines a comprehensive hierarchy of custom error classes for
 * workspace-related operations in the Breakdown AI development assistance tool.
 * It provides specific error types for initialization, configuration, path
 * resolution, and directory operations, enabling precise error handling and
 * debugging throughout the workspace management system.
 *
 * The error hierarchy follows the pattern:
 * WorkspaceError (base) → Specific error types with unique error codes
 *
 * @module workspace/errors
 *
 * @example
 * ```typescript
 * import { WorkspaceInitError, WorkspaceConfigError } from "./errors.ts";
 *
 * try {
 *   await workspace.initialize();
 * } catch (error) {
 *   if (error instanceof WorkspaceInitError) {
 *     // Handle initialization-specific errors
 *     console.error(`Init failed: ${error.message} (${error.code})`);
 *   } else if (error instanceof WorkspaceConfigError) {
 *     // Handle configuration-specific errors
 *     console.error(`Config error: ${error.message} (${error.code})`);
 *   }
 * }
 * ```
 */

/**
 * Base error class for all workspace-related errors in the Breakdown system.
 *
 * This class serves as the foundation for all workspace-specific errors,
 * providing a common structure with error codes for systematic error
 * identification and handling. All workspace errors inherit from this class
 * to ensure consistent error handling patterns.
 *
 * @extends {Error}
 */
export class WorkspaceError extends Error {
  /** The error code identifying the specific error type. */
  code: string;

  /**
   * Creates a new WorkspaceError instance with the specified message and code.
   *
   * @param message - The human-readable error message describing the workspace error
   * @param code - The unique error code identifying the specific error type
   *
   * @example
   * ```typescript
   * const _error = new WorkspaceError("Directory not found", "WORKSPACE_DIR_NOT_FOUND");
   * console.log(error.message); // "Directory not found"
   * console.log(error.code);    // "WORKSPACE_DIR_NOT_FOUND"
   * ```
   */
  constructor(message: string, code: string) {
    super(message);
    this.name = "WorkspaceError";
    this.code = code;
  }
}

/**
 * Error thrown when workspace initialization fails.
 *
 * This error is thrown when there are problems during workspace setup,
 * such as directory creation failures, permission issues, or conflicts
 * with existing files. It specifically handles initialization-phase errors
 * that prevent the workspace from being properly established.
 *
 * @extends {WorkspaceError}
 */
export class WorkspaceInitError extends WorkspaceError {
  /**
   * Creates a new WorkspaceInitError instance.
   *
   * @param message - The error message describing the specific initialization failure
   *
   * @example
   * ```typescript
   * // Throw when directory creation fails
   * throw new WorkspaceInitError("Failed to create projects directory: Permission denied");
   *
   * // Catch and handle initialization errors
   * try {
   *   await workspace.initialize();
   * } catch (error) {
   *   if (error instanceof WorkspaceInitError) {
   *     console.error(`Workspace setup failed: ${error.message}`);
   *   }
   * }
   * ```
   */
  constructor(message: string) {
    super(message, "WORKSPACE_INIT_ERROR");
    this.name = "WorkspaceInitError";
  }
}

/**
 * Error thrown when workspace configuration is invalid or missing.
 *
 * This error is thrown when there are problems with the workspace configuration,
 * such as missing required settings, invalid values, malformed configuration
 * files, or incompatible configuration options. It handles all configuration
 * validation and parsing errors.
 *
 * @extends {WorkspaceError}
 */
export class WorkspaceConfigError extends WorkspaceError {
  /**
   * Creates a new WorkspaceConfigError instance.
   *
   * @param message - The error message describing the specific configuration problem
   *
   * @example
   * ```typescript
   * // Throw when required config is missing
   * throw new WorkspaceConfigError("Working directory not specified in configuration");
   *
   * // Throw when config value is invalid
   * throw new WorkspaceConfigError("Invalid working directory path: '/invalid/path'");
   *
   * // Handle configuration errors
   * try {
   *   const config = loadWorkspaceConfig();
   * } catch (error) {
   *   if (error instanceof WorkspaceConfigError) {
   *     console.error(`Configuration error: ${error.message}`);
   *   }
   * }
   * ```
   */
  constructor(message: string) {
    super(message, "WORKSPACE_CONFIG_ERROR");
    this.name = "WorkspaceConfigError";
  }
}

/**
 * Error thrown when path resolution fails within the workspace.
 *
 * This error is thrown when there are problems resolving paths within the workspace,
 * such as invalid file paths, missing directories, malformed path strings,
 * or attempts to access paths outside the workspace boundaries. It handles
 * all path-related validation and resolution errors.
 *
 * @extends {WorkspaceError}
 */
export class WorkspacePathError extends WorkspaceError {
  /**
   * Creates a new WorkspacePathError instance.
   *
   * @param message - The error message describing the specific path resolution problem
   *
   * @example
   * ```typescript
   * // Throw when path is invalid
   * throw new WorkspacePathError("Invalid relative path: '../../../etc/passwd'");
   *
   * // Throw when target doesn't exist
   * throw new WorkspacePathError("Path not found: 'projects/nonexistent-project'");
   *
   * // Handle path resolution errors
   * try {
   *   const resolvedPath = await resolvePath("some/path");
   * } catch (error) {
   *   if (error instanceof WorkspacePathError) {
   *     console.error(`Path resolution failed: ${error.message}`);
   *   }
   * }
   * ```
   */
  constructor(message: string) {
    super(message, "WORKSPACE_PATH_ERROR");
    this.name = "WorkspacePathError";
  }
}

/**
 * Error thrown when directory operations fail within the workspace.
 *
 * This error is thrown when there are problems with directory operations,
 * such as creation failures, deletion failures, permission issues,
 * or attempts to perform invalid directory operations. It handles
 * all directory-specific operation errors.
 *
 * @extends {WorkspaceError}
 */
export class WorkspaceDirectoryError extends WorkspaceError {
  /**
   * Creates a new WorkspaceDirectoryError instance.
   *
   * @param message - The error message describing the specific directory operation failure
   *
   * @example
   * ```typescript
   * // Throw when directory creation fails
   * throw new WorkspaceDirectoryError("Failed to create directory: Permission denied");
   *
   * // Throw when directory removal fails
   * throw new WorkspaceDirectoryError("Cannot remove non-empty directory without recursive flag");
   *
   * // Handle directory operation errors
   * try {
   *   await workspace.createDirectory("new-project");
   * } catch (error) {
   *   if (error instanceof WorkspaceDirectoryError) {
   *     console.error(`Directory operation failed: ${error.message}`);
   *   }
   * }
   * ```
   */
  constructor(message: string) {
    super(message, "WORKSPACE_DIRECTORY_ERROR");
    this.name = "WorkspaceDirectoryError";
  }
}
