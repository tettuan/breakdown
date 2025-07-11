/**
 * @fileoverview Workspace initialization error types and utilities
 *
 * This module provides error handling for workspace initialization failures.
 * Used by workspace initialization components to provide consistent error reporting.
 */

/**
 * Base error class for workspace initialization failures
 */
export class WorkspaceInitError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = "WORKSPACE_INIT_ERROR",
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "WorkspaceInitError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Error for when workspace directory creation fails
 */
export class DirectoryCreationError extends WorkspaceInitError {
  constructor(path: string, cause?: Error) {
    super(
      `Failed to create workspace directory: ${path}`,
      "DIRECTORY_CREATION_FAILED",
      { path, cause: cause?.message },
    );
  }
}

/**
 * Error for when configuration file creation fails
 */
export class ConfigCreationError extends WorkspaceInitError {
  constructor(path: string, cause?: Error) {
    super(
      `Failed to create configuration file: ${path}`,
      "CONFIG_CREATION_FAILED",
      { path, cause: cause?.message },
    );
  }
}

/**
 * Error for when workspace initialization is attempted in invalid location
 */
export class InvalidWorkspaceLocationError extends WorkspaceInitError {
  constructor(path: string, reason: string) {
    super(
      `Invalid workspace location: ${path} (${reason})`,
      "INVALID_WORKSPACE_LOCATION",
      { path, reason },
    );
  }
}

/**
 * Error for when workspace already exists and force flag is not set
 */
export class WorkspaceExistsError extends WorkspaceInitError {
  constructor(path: string) {
    super(
      `Workspace already exists at: ${path}. Use --force to overwrite.`,
      "WORKSPACE_EXISTS",
      { path },
    );
  }
}

/**
 * Factory function to create appropriate workspace init error
 */
export function createWorkspaceInitError(
  type: "directory" | "config" | "location" | "exists",
  path: string,
  details?: { cause?: Error; reason?: string },
): WorkspaceInitError {
  switch (type) {
    case "directory":
      return new DirectoryCreationError(path, details?.cause);
    case "config":
      return new ConfigCreationError(path, details?.cause);
    case "location":
      return new InvalidWorkspaceLocationError(path, details?.reason || "Unknown reason");
    case "exists":
      return new WorkspaceExistsError(path);
    default:
      return new WorkspaceInitError(`Workspace initialization failed: ${path}`, "UNKNOWN_ERROR", {
        path,
      });
  }
}
