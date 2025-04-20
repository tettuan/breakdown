/**
 * Base error class for workspace-related errors
 */
export class WorkspaceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "WorkspaceError";
  }
}

/**
 * Error thrown when workspace initialization fails
 */
export class WorkspaceInitError extends WorkspaceError {
  constructor(message: string) {
    super(message, "WORKSPACE_INIT_ERROR");
  }
}

/**
 * Error thrown when workspace configuration is invalid
 */
export class WorkspaceConfigError extends WorkspaceError {
  constructor(message: string) {
    super(message, "WORKSPACE_CONFIG_ERROR");
  }
}

/**
 * Error thrown when workspace path resolution fails
 */
export class WorkspacePathError extends WorkspaceError {
  constructor(message: string) {
    super(message, "WORKSPACE_PATH_ERROR");
  }
}
