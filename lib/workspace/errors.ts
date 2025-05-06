/**
 * Base error class for workspace-related errors.
 */
export class WorkspaceError extends Error {
  /**
   * Creates a new WorkspaceError instance.
   * @param message The error message describing the workspace error.
   * @param code The error code for the workspace error.
   */
  constructor(message: string, public code: string) {
    super(message);
    this.name = "WorkspaceError";
  }
}

/**
 * Error thrown when workspace initialization fails.
 */
export class WorkspaceInitError extends WorkspaceError {
  /**
   * Creates a new WorkspaceInitError instance.
   * @param message The error message describing the initialization error.
   */
  constructor(message: string) {
    super(message, "WORKSPACE_INIT_ERROR");
  }
}

/**
 * Error thrown when workspace configuration is invalid.
 */
export class WorkspaceConfigError extends WorkspaceError {
  /**
   * Creates a new WorkspaceConfigError instance.
   * @param message The error message describing the configuration error.
   */
  constructor(message: string) {
    super(message, "WORKSPACE_CONFIG_ERROR");
  }
}

/**
 * Error thrown when workspace path resolution fails.
 */
export class WorkspacePathError extends WorkspaceError {
  /**
   * Creates a new WorkspacePathError instance.
   * @param message The error message describing the path error.
   */
  constructor(message: string) {
    super(message, "WORKSPACE_PATH_ERROR");
  }
}
