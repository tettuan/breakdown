/**
 * @fileoverview Result-based error handling for the Breakdown workspace.
 *
 * This module defines a comprehensive set of error types and Result-based
 * operations for workspace-related tasks in the Breakdown AI development tool.
 * Following the Totality principle, all operations return Result types instead
 * of throwing exceptions, enabling explicit error handling and type safety.
 *
 * Error types follow DDD value object patterns with immutable properties
 * and explicit domain meaning. All errors include specific error codes
 * for systematic error identification and handling.
 *
 * @module workspace/errors
 *
 * @example
 * ```typescript
 * import { initWorkspace, isWorkspaceInitError } from "./errors.ts";
 *
 * const result = await initWorkspace("/path/to/workspace");
 * if (!result.ok) {
 *   if (isWorkspaceInitError(result.error)) {
 *     console.error(`Init failed: ${result.error.message} (${result.error.code})`);
 *   }
 * } else {
 *   console.log("Workspace initialized successfully");
 * }
 * ```
 */

import { Result } from "../types/result.ts";

// Re-export specific classes from workspace_init_error.ts
export {
  DirectoryCreationError,
  ConfigCreationError,
  InvalidWorkspaceLocationError,
  WorkspaceExistsError,
  createWorkspaceInitError as createWorkspaceInitErrorFromClass,
} from "./workspace_init_error.ts";

// Re-export the WorkspaceInitError class for tests
export { WorkspaceInitError } from "./workspace_init_error.ts";


/**
 * Base interface for all workspace-related errors in the Breakdown system.
 *
 * This interface serves as the foundation for all workspace-specific errors,
 * providing a common structure with error codes for systematic error
 * identification and handling. Following DDD value object patterns,
 * all error types are immutable and carry explicit domain meaning.
 *
 * @interface
 */
export interface WorkspaceErrorBase {
  /** The human-readable error message describing the workspace error */
  readonly message: string;
  /** The unique error code identifying the specific error type */
  readonly code: string;
  /** The error type for discriminated union support */
  readonly type: string;
}

/**
 * Creates a workspace error with the specified message and code.
 *
 * @param message - The human-readable error message
 * @param code - The unique error code
 * @returns Immutable WorkspaceErrorBase object
 *
 * @example
 * ```typescript
 * const error = createWorkspaceError("Directory not found", "WORKSPACE_DIR_NOT_FOUND");
 * console.log(error.message); // "Directory not found"
 * console.log(error.code);    // "WORKSPACE_DIR_NOT_FOUND"
 * ```
 */
export function createWorkspaceError(
  message: string,
  code: string,
): WorkspaceErrorBase {
  return {
    message,
    code,
    type: "workspace_error" as const,
  };
}

/**
 * Error interface for workspace initialization failures.
 *
 * This error type represents problems during workspace setup,
 * such as directory creation failures, permission issues, or conflicts
 * with existing files. It specifically handles initialization-phase errors
 * that prevent the workspace from being properly established.
 *
 * @interface
 */
export interface WorkspaceInitErrorInterface extends WorkspaceErrorBase {
  readonly type: "workspace_init_error";
  readonly code: "WORKSPACE_INIT_ERROR";
}

/**
 * Type alias for backward compatibility.
 */
export type WorkspaceInitErrorType = WorkspaceInitErrorInterface;

/**
 * Creates a WorkspaceInitErrorInterface for initialization failures.
 *
 * @param message - The error message describing the specific initialization failure
 * @returns Immutable WorkspaceInitErrorInterface object
 *
 * @example
 * ```typescript
 * const error = createWorkspaceInitErrorInterface("Failed to create projects directory: Permission denied");
 * 
 * // Usage with Result type
 * function initializeWorkspace(): Result<void, WorkspaceInitErrorInterface> {
 *   // Implementation logic here
 *   if (failed) {
 *     return { ok: false, error: createWorkspaceInitErrorInterface("Initialization failed") };
 *   }
 *   return { ok: true, data: undefined };
 * }
 * ```
 */
export function createWorkspaceInitErrorInterface(message: string): WorkspaceInitErrorInterface {
  return {
    message,
    code: "WORKSPACE_INIT_ERROR" as const,
    type: "workspace_init_error" as const,
  };
}

/**
 * Creates a WorkspaceInitError for initialization failures.
 * Alias for createWorkspaceInitErrorInterface for backward compatibility.
 *
 * @param message - The error message describing the specific initialization failure
 * @returns Immutable WorkspaceInitErrorInterface object
 */
export const createWorkspaceInitError = createWorkspaceInitErrorInterface;

/**
 * Type guard to check if an error is a WorkspaceInitErrorInterface.
 *
 * @param error - The error object to check
 * @returns True if the error is a WorkspaceInitErrorInterface
 */
export function isWorkspaceInitError(
  error: WorkspaceErrorBase,
): error is WorkspaceInitErrorInterface {
  return error.type === "workspace_init_error";
}

/**
 * Error interface for workspace configuration failures.
 *
 * This error type represents problems with workspace configuration,
 * such as missing required settings, invalid values, malformed configuration
 * files, or incompatible configuration options. It handles all configuration
 * validation and parsing errors.
 *
 * @interface
 */
export interface WorkspaceConfigErrorInterface extends WorkspaceErrorBase {
  readonly type: "workspace_config_error";
  readonly code: "WORKSPACE_CONFIG_ERROR";
}

/**
 * Creates a WorkspaceConfigErrorInterface for configuration failures.
 *
 * @param message - The error message describing the specific configuration problem
 * @returns Immutable WorkspaceConfigErrorInterface object
 *
 * @example
 * ```typescript
 * const error = createWorkspaceConfigError("Working directory not specified in configuration");
 * 
 * // Usage with Result type
 * function loadWorkspaceConfig(): Result<Config, WorkspaceConfigErrorInterface> {
 *   if (configMissing) {
 *     return { ok: false, error: createWorkspaceConfigError("Configuration not found") };
 *   }
 *   return { ok: true, data: config };
 * }
 * ```
 */
export function createWorkspaceConfigError(message: string): WorkspaceConfigErrorInterface {
  return {
    message,
    code: "WORKSPACE_CONFIG_ERROR" as const,
    type: "workspace_config_error" as const,
  };
}

// Alias for backward compatibility  
export const createWorkspaceConfigErrorInterface = createWorkspaceConfigError;

/**
 * Type guard to check if an error is a WorkspaceConfigErrorInterface.
 *
 * @param error - The error object to check
 * @returns True if the error is a WorkspaceConfigErrorInterface
 */
export function isWorkspaceConfigError(
  error: WorkspaceErrorBase,
): error is WorkspaceConfigErrorInterface {
  return error.type === "workspace_config_error";
}

/**
 * Error interface for workspace path resolution failures.
 *
 * This error type represents problems resolving paths within the workspace,
 * such as invalid file paths, missing directories, malformed path strings,
 * or attempts to access paths outside the workspace boundaries. It handles
 * all path-related validation and resolution errors.
 *
 * @interface
 */
export interface WorkspacePathErrorInterface extends WorkspaceErrorBase {
  readonly type: "workspace_path_error";
  readonly code: "WORKSPACE_PATH_ERROR";
}

/**
 * Creates a WorkspacePathErrorInterface for path resolution failures.
 *
 * @param message - The error message describing the specific path resolution problem
 * @returns Immutable WorkspacePathErrorInterface object
 *
 * @example
 * ```typescript
 * const error = createWorkspacePathError("Invalid relative path: '../../../etc/passwd'");
 * 
 * // Usage with Result type
 * function resolvePath(path: string): Result<string, WorkspacePathErrorInterface> {
 *   if (isInvalidPath(path)) {
 *     return { ok: false, error: createWorkspacePathError("Invalid path format") };
 *   }
 *   return { ok: true, data: resolvedPath };
 * }
 * ```
 */
export function createWorkspacePathError(message: string): WorkspacePathErrorInterface {
  return {
    message,
    code: "WORKSPACE_PATH_ERROR" as const,
    type: "workspace_path_error" as const,
  };
}

// Alias for backward compatibility
export const createWorkspacePathErrorInterface = createWorkspacePathError;

/**
 * Type guard to check if an error is a WorkspacePathErrorInterface.
 *
 * @param error - The error object to check
 * @returns True if the error is a WorkspacePathErrorInterface
 */
export function isWorkspacePathError(
  error: WorkspaceErrorBase,
): error is WorkspacePathErrorInterface {
  return error.type === "workspace_path_error";
}

/**
 * Error interface for workspace directory operation failures.
 *
 * This error type represents problems with directory operations,
 * such as creation failures, deletion failures, permission issues,
 * or attempts to perform invalid directory operations. It handles
 * all directory-specific operation errors.
 *
 * @interface
 */
export interface WorkspaceDirectoryErrorInterface extends WorkspaceErrorBase {
  readonly type: "workspace_directory_error";
  readonly code: "WORKSPACE_DIRECTORY_ERROR";
}

/**
 * Creates a WorkspaceDirectoryError for directory operation failures.
 *
 * @param message - The error message describing the specific directory operation failure
 * @returns Immutable WorkspaceDirectoryError object
 *
 * @example
 * ```typescript
 * const error = createWorkspaceDirectoryError("Failed to create directory: Permission denied");
 * 
 * // Usage with Result type
 * function createDirectory(path: string): Result<void, WorkspaceDirectoryError> {
 *   if (permissionDenied) {
 *     return { ok: false, error: createWorkspaceDirectoryError("Permission denied") };
 *   }
 *   return { ok: true, data: undefined };
 * }
 * ```
 */
export function createWorkspaceDirectoryError(message: string): WorkspaceDirectoryErrorInterface {
  return {
    message,
    code: "WORKSPACE_DIRECTORY_ERROR" as const,
    type: "workspace_directory_error" as const,
  };
}

// Alias for backward compatibility
export const createWorkspaceDirectoryErrorInterface = createWorkspaceDirectoryError;

/**
 * Type guard to check if an error is a WorkspaceDirectoryError.
 *
 * @param error - The error object to check
 * @returns True if the error is a WorkspaceDirectoryError
 */
export function isWorkspaceDirectoryError(
  error: WorkspaceErrorBase,
): error is WorkspaceDirectoryErrorInterface {
  return error.type === "workspace_directory_error";
}

/**
 * Union type of all workspace error types for discriminated union support.
 */
export type WorkspaceErrorType = 
  | WorkspaceInitErrorInterface
  | WorkspaceConfigErrorInterface
  | WorkspacePathErrorInterface
  | WorkspaceDirectoryErrorInterface;

/**
 * Type guard to check if an error is any WorkspaceErrorType.
 *
 * @param error - The error object to check
 * @returns True if the error is a WorkspaceErrorType
 */
export function isWorkspaceError(error: unknown): error is WorkspaceErrorType {
  return typeof error === "object" && error !== null &&
    "type" in error && typeof error.type === "string" &&
    (error.type === "workspace_init_error" ||
     error.type === "workspace_config_error" ||
     error.type === "workspace_path_error" ||
     error.type === "workspace_directory_error");
}

/**
 * Result type for workspace operations that can fail.
 */
export type WorkspaceResult<T> = Result<T, WorkspaceErrorType>;

// Error classes for tests that expect constructors
export class WorkspaceError extends Error {
  public readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "WorkspaceError";
    this.code = code;
  }
}

export class WorkspaceConfigError extends Error {
  public readonly code: string = "WORKSPACE_CONFIG_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceConfigError";
  }
}

export class WorkspacePathError extends Error {
  public readonly code: string = "WORKSPACE_PATH_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "WorkspacePathError";
  }
}

export class WorkspaceDirectoryError extends Error {
  public readonly code: string = "WORKSPACE_DIRECTORY_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceDirectoryError";
  }
}
