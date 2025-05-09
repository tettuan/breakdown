/**
 * Error handling module for the Breakdown workspace.
 *
 * This module defines custom error classes for workspace-related operations,
 * providing specific error types for initialization, configuration, and path resolution.
 *
 * @example
 * ```ts
 * import { WorkspaceInitError } from "@tettuan/breakdown/lib/workspace/errors.ts";
 *
 * try {
 *   await workspace.initialize();
 * } catch (error) {
 *   if (error instanceof WorkspaceInitError) {
 *     console.error("Workspace initialization failed:", error.message);
 *   }
 * }
 * ```
 *
 * @module
 */

/**
 * Base error class for workspace-related errors.
 *
 * This class serves as the foundation for all workspace-specific errors,
 * providing a common structure and error code system.
 *
 * @extends {Error}
 * @property {string} code - The error code identifying the specific error type
 */
export class WorkspaceError extends Error {
  /**
   * Creates a new WorkspaceError instance.
   *
   * @param message - The error message describing the workspace error
   * @param code - The error code for the workspace error
   */
  constructor(message: string, public code: string) {
    super(message);
    this.name = "WorkspaceError";
  }
}

/**
 * Error thrown when workspace initialization fails.
 *
 * This error is thrown when there are problems during workspace setup,
 * such as directory creation failures or permission issues.
 *
 * @extends {WorkspaceError}
 * @property {string} code - Always set to "WORKSPACE_INIT_ERROR"
 */
export class WorkspaceInitError extends WorkspaceError {
  /**
   * Creates a new WorkspaceInitError instance.
   *
   * @param message - The error message describing the initialization error
   */
  constructor(message: string) {
    super(message, "WORKSPACE_INIT_ERROR");
  }
}

/**
 * Error thrown when workspace configuration is invalid.
 *
 * This error is thrown when there are problems with the workspace configuration,
 * such as missing required settings or invalid values.
 *
 * @extends {WorkspaceError}
 * @property {string} code - Always set to "WORKSPACE_CONFIG_ERROR"
 */
export class WorkspaceConfigError extends WorkspaceError {
  /**
   * Creates a new WorkspaceConfigError instance.
   *
   * @param message - The error message describing the configuration error
   */
  constructor(message: string) {
    super(message, "WORKSPACE_CONFIG_ERROR");
  }
}

/**
 * Error thrown when workspace path resolution fails.
 *
 * This error is thrown when there are problems resolving paths within the workspace,
 * such as invalid file paths or missing directories.
 *
 * @extends {WorkspaceError}
 * @property {string} code - Always set to "WORKSPACE_PATH_ERROR"
 */
export class WorkspacePathError extends WorkspaceError {
  /**
   * Creates a new WorkspacePathError instance.
   *
   * @param message - The error message describing the path error
   */
  constructor(message: string) {
    super(message, "WORKSPACE_PATH_ERROR");
  }
}
