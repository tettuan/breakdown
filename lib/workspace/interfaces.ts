/**
 * Workspace configuration interface for type safety in workspace modules.
 *
 * Note: When reading actual configuration values, always use BreakdownConfig from @tettuan/breakdownconfig.
 * This interface is for type definition only and should not be used to load config values directly.
 */
export interface WorkspaceConfig {
  /** The working directory for the workspace. */
  workingDir: string;
  /** The base directory for prompt files. */
  promptBaseDir: string;
  /** The base directory for schema files. */
  schemaBaseDir: string;
}

/**
 * Interface for path resolution strategies in the workspace.
 */
export interface PathResolutionStrategy {
  /** Resolves a path to its absolute form. */
  resolve(path: string): Promise<string>;
  /** Normalizes a path string. */
  normalize(path: string): Promise<string>;
  /** Validates if a path exists or is correct. */
  validate(path: string): Promise<boolean>;
}

/**
 * Interface for managing the directory structure of the workspace.
 */
export interface WorkspaceStructure {
  /** Initializes the workspace structure. */
  initialize(): Promise<void>;
  /** Ensures all required directories exist. */
  ensureDirectories(): Promise<void>;
  /** Checks if a path exists in the workspace. */
  exists(path?: string): Promise<boolean>;
  /** Creates a directory at the specified path. */
  createDirectory(path: string): Promise<void>;
  /** Removes a directory at the specified path. */
  removeDirectory(path: string): Promise<void>;
}

/**
 * Interface for managing workspace configuration.
 */
export interface WorkspaceConfigManager {
  /** Loads the workspace configuration. */
  load(): Promise<void>;
  /** Gets the current workspace configuration. */
  get(): Promise<WorkspaceConfig>;
  /** Updates the workspace configuration. */
  update(config: Partial<WorkspaceConfig>): Promise<void>;
  /** Validates the workspace configuration. */
  validate(): Promise<void>;
}

/**
 * Interface for resolving and normalizing workspace paths.
 */
export interface WorkspacePathResolver {
  /** Resolves a path to its absolute form. */
  resolve(path: string): Promise<string>;
  /** Normalizes a path string. */
  normalize(path: string): Promise<string>;
  /** Validates if a path exists or is correct. */
  validate(path: string): Promise<boolean>;
  /** Updates the path resolution strategy. */
  updateStrategy(strategy: PathResolutionStrategy): void;
}

/**
 * Interface for handling errors in the workspace.
 */
export interface WorkspaceErrorHandler {
  /** Handles an error of a specific type. */
  handleError(error: Error, type: string): void;
  /** Logs an error with additional context. */
  logError(error: Error, context: Record<string, unknown>): void;
}

/**
 * Interface for event management in the workspace.
 */
export interface WorkspaceEventEmitter {
  /** Registers an event listener. */
  on(event: string, listener: (data: unknown) => void): void;
  /** Emits an event with associated data. */
  emit(event: string, data: unknown): void;
}

/**
 * Main interface for the workspace, providing core operations.
 */
export interface Workspace {
  /** Initializes the workspace. */
  initialize(): Promise<void>;
  /** Resolves a path in the workspace. */
  resolvePath(path: string): Promise<string>;
  /** Creates a directory in the workspace. */
  createDirectory(path: string): Promise<void>;
  /** Removes a directory from the workspace. */
  removeDirectory(path: string): Promise<void>;
  /** Checks if a path exists in the workspace. */
  exists(path?: string): Promise<boolean>;
  /** Gets the base directory for prompt files. */
  getPromptBaseDir(): Promise<string>;
  /** Gets the base directory for schema files. */
  getSchemaBaseDir(): Promise<string>;
  /** Gets the working directory for the workspace. */
  getWorkingDir(): Promise<string>;
  /** Validates the workspace configuration. */
  validateConfig(): Promise<void>;
  /** Reloads the workspace configuration. */
  reloadConfig(): Promise<void>;
}
