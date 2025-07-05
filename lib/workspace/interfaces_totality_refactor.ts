/**
 * Workspace interfaces with Totality design applied.
 *
 * This refactored version applies Smart Constructors and separation of concerns:
 * 1. Splits monolithic interfaces into domain-specific files
 * 2. Uses Smart Constructors for configuration
 * 3. Applies Result types for error handling
 * 4. Implements value objects with validation
 *
 * @module workspace/interfaces_totality_refactor
 */

// ===== Result Type =====
export type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

// ===== Smart Constructor: Workspace Configuration =====
/**
 * Immutable workspace configuration with validation.
 * Replaces the simple WorkspaceConfig interface with a validated value object.
 */
export class ValidatedWorkspaceConfig {
  private constructor(
    readonly workingDir: string,
    readonly promptBaseDir: string,
    readonly schemaBaseDir: string,
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a validated workspace configuration
   */
  static create(params: {
    workingDir: string;
    promptBaseDir: string;
    schemaBaseDir: string;
  }): Result<ValidatedWorkspaceConfig, string> {
    // Validate working directory
    if (!params.workingDir || params.workingDir.trim() === "") {
      return { ok: false, error: "Working directory cannot be empty" };
    }

    // Validate prompt base directory
    if (!params.promptBaseDir || params.promptBaseDir.trim() === "") {
      return { ok: false, error: "Prompt base directory cannot be empty" };
    }

    // Validate schema base directory
    if (!params.schemaBaseDir || params.schemaBaseDir.trim() === "") {
      return { ok: false, error: "Schema base directory cannot be empty" };
    }

    // Check for path traversal attempts
    const paths = [params.workingDir, params.promptBaseDir, params.schemaBaseDir];
    for (const path of paths) {
      if (path.includes("..")) {
        return { ok: false, error: `Path traversal detected in: ${path}` };
      }
    }

    return {
      ok: true,
      data: new ValidatedWorkspaceConfig(
        params.workingDir,
        params.promptBaseDir,
        params.schemaBaseDir,
      ),
    };
  }

  /**
   * Creates a copy with partial updates
   */
  with(
    updates: Partial<{
      workingDir: string;
      promptBaseDir: string;
      schemaBaseDir: string;
    }>,
  ): Result<ValidatedWorkspaceConfig, string> {
    return ValidatedWorkspaceConfig.create({
      workingDir: updates.workingDir ?? this.workingDir,
      promptBaseDir: updates.promptBaseDir ?? this.promptBaseDir,
      schemaBaseDir: updates.schemaBaseDir ?? this.schemaBaseDir,
    });
  }
}

// ===== Path Resolution Interfaces =====
/**
 * Path resolution strategy with Result types
 */
export interface PathResolutionStrategyTotality {
  /**
   * Resolves a path to its absolute form
   */
  resolve(path: string): Promise<Result<string, string>>;

  /**
   * Normalizes a path string
   */
  normalize(path: string): Result<string, string>;

  /**
   * Validates if a path is well-formed (not existence check)
   */
  validate(path: string): Result<boolean, string>;
}

// ===== Smart Constructor: Validated Path =====
/**
 * Represents a validated file system path
 */
export class ValidatedPath {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static create(path: string): Result<ValidatedPath, string> {
    if (!path || path.trim() === "") {
      return { ok: false, error: "Path cannot be empty" };
    }

    // Basic security check
    if (path.includes("..") || path.includes("~")) {
      return { ok: false, error: "Path contains unsafe characters" };
    }

    return { ok: true, data: new ValidatedPath(path.trim()) };
  }

  toString(): string {
    return this.value;
  }
}

// ===== Workspace Structure Interface =====
/**
 * Workspace structure management with Result types
 */
export interface WorkspaceStructureTotality {
  /**
   * Initializes the workspace structure
   */
  initialize(): Promise<Result<void, string>>;

  /**
   * Ensures all required directories exist
   */
  ensureDirectories(): Promise<Result<void, string>>;

  /**
   * Checks if a path exists in the workspace
   */
  exists(path?: ValidatedPath): Promise<Result<boolean, string>>;

  /**
   * Creates a directory at the specified path
   */
  createDirectory(path: ValidatedPath): Promise<Result<void, string>>;

  /**
   * Removes a directory at the specified path
   */
  removeDirectory(path: ValidatedPath): Promise<Result<void, string>>;
}

// ===== Configuration Manager Interface =====
/**
 * Configuration management with validated types
 */
export interface WorkspaceConfigManagerTotality {
  /**
   * Loads the workspace configuration
   */
  load(): Promise<Result<ValidatedWorkspaceConfig, string>>;

  /**
   * Gets the current workspace configuration
   */
  get(): Result<ValidatedWorkspaceConfig, string>;

  /**
   * Updates the workspace configuration
   */
  update(
    updates: Partial<{
      workingDir: string;
      promptBaseDir: string;
      schemaBaseDir: string;
    }>,
  ): Promise<Result<ValidatedWorkspaceConfig, string>>;

  /**
   * Validates the workspace configuration
   */
  validate(config: ValidatedWorkspaceConfig): Promise<Result<void, string>>;
}

// ===== Path Resolver Interface =====
/**
 * Path resolution with validated types
 */
export interface WorkspacePathResolverTotality {
  /**
   * Resolves a path to its absolute form
   */
  resolve(path: ValidatedPath): Promise<Result<ValidatedPath, string>>;

  /**
   * Normalizes a path string
   */
  normalize(path: ValidatedPath): Result<ValidatedPath, string>;

  /**
   * Validates if a path is well-formed
   */
  validate(path: ValidatedPath): Result<boolean, string>;

  /**
   * Updates the path resolution strategy
   */
  updateStrategy(strategy: PathResolutionStrategyTotality): Result<void, string>;
}

// ===== Error Handler with Discriminated Union =====
export type WorkspaceErrorType =
  | { kind: "INITIALIZATION"; details: string }
  | { kind: "CONFIGURATION"; details: string }
  | { kind: "PATH_RESOLUTION"; details: string }
  | { kind: "IO_OPERATION"; details: string }
  | { kind: "PERMISSION"; details: string };

/**
 * Error handling with type-safe error types
 */
export interface WorkspaceErrorHandlerTotality {
  /**
   * Handles an error of a specific type
   */
  handleError(error: WorkspaceErrorType): Result<void, string>;

  /**
   * Logs an error with additional context
   */
  logError(error: WorkspaceErrorType, context: Record<string, unknown>): void;
}

// ===== Event Management with Type Safety =====
export type WorkspaceEventType =
  | { kind: "INITIALIZED"; timestamp: Date }
  | { kind: "CONFIG_UPDATED"; config: ValidatedWorkspaceConfig }
  | { kind: "DIRECTORY_CREATED"; path: ValidatedPath }
  | { kind: "DIRECTORY_REMOVED"; path: ValidatedPath }
  | { kind: "ERROR_OCCURRED"; error: WorkspaceErrorType };

/**
 * Type-safe event management
 */
export interface WorkspaceEventEmitterTotality {
  /**
   * Registers a type-safe event listener
   */
  on<T extends WorkspaceEventType["kind"]>(
    event: T,
    listener: (data: Extract<WorkspaceEventType, { kind: T }>) => void,
  ): void;

  /**
   * Emits a type-safe event
   */
  emit<T extends WorkspaceEventType>(event: T): void;
}

// ===== Main Workspace Interface with Totality =====
/**
 * Main workspace interface with full type safety and Result types
 */
export interface WorkspaceTotality {
  /**
   * Initializes the workspace
   */
  initialize(): Promise<Result<void, WorkspaceErrorType>>;

  /**
   * Resolves a path in the workspace
   */
  resolvePath(path: string): Promise<Result<ValidatedPath, WorkspaceErrorType>>;

  /**
   * Creates a directory in the workspace
   */
  createDirectory(path: string): Promise<Result<void, WorkspaceErrorType>>;

  /**
   * Removes a directory from the workspace
   */
  removeDirectory(path: string): Promise<Result<void, WorkspaceErrorType>>;

  /**
   * Checks if a path exists in the workspace
   */
  exists(path?: string): Promise<Result<boolean, WorkspaceErrorType>>;

  /**
   * Gets validated paths for workspace directories
   */
  getPaths(): Result<{
    promptBaseDir: ValidatedPath;
    schemaBaseDir: ValidatedPath;
    workingDir: ValidatedPath;
  }, WorkspaceErrorType>;

  /**
   * Validates the workspace configuration
   */
  validateConfig(): Promise<Result<void, WorkspaceErrorType>>;

  /**
   * Reloads the workspace configuration
   */
  reloadConfig(): Promise<Result<ValidatedWorkspaceConfig, WorkspaceErrorType>>;
}

// ===== Factory for creating workspace instances =====
/**
 * Factory for creating validated workspace instances
 */
export class WorkspaceFactory {
  static create(params: {
    workingDir: string;
    promptBaseDir: string;
    schemaBaseDir: string;
  }): Result<WorkspaceTotality, string> {
    const configResult = ValidatedWorkspaceConfig.create(params);
    if (!configResult.ok) {
      return configResult;
    }

    // Implementation would create actual workspace instance
    // This is just the interface definition
    return { ok: false, error: "Implementation required" };
  }
}

// ===== Recommended file split structure =====
/*
 * This single 370-line interface file should be split into:
 *
 * 1. workspace_config_interfaces.ts - Configuration related (50 lines)
 * 2. workspace_path_interfaces.ts - Path resolution related (80 lines)
 * 3. workspace_structure_interfaces.ts - Structure management (60 lines)
 * 4. workspace_error_interfaces.ts - Error handling (40 lines)
 * 5. workspace_event_interfaces.ts - Event management (40 lines)
 * 6. workspace_main_interface.ts - Main workspace interface (100 lines)
 *
 * Each file would have its own focused responsibility and imports.
 */
