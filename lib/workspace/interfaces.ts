/**
 * Unified workspace configuration interface following working_dir + relative base_dir pattern.
 *
 * This interface defines the structure for workspace configuration data,
 * providing type safety across the breakdown workspace management system.
 * Uses the unified pattern: working_dir + relative base_dir for consistent path resolution.
 *
 * @example Unified configuration pattern
 * ```typescript
 * const config: WorkspaceConfig = {
 *   working_dir: ".agent/breakdown",
 *   app_prompt: { base_dir: "prompts" },     // Always relative
 *   app_schema: { base_dir: "schemas" }      // Always relative
 * };
 * ```
 *
 * Note: When reading actual configuration values, always use BreakdownConfig from @tettuan/breakdownconfig.
 * This interface is for type definition only and should not be used to load config values directly.
 */
export interface WorkspaceConfig {
  /**
   * The working directory for the workspace.
   * @property working_dir - Single source of truth for workspace root directory
   */
  working_dir: string;

  /**
   * App prompt configuration with relative base directory.
   * @property app_prompt - Configuration for prompt template files
   */
  app_prompt: {
    /**
     * Relative base directory for prompt files.
     * @property base_dir - Always relative path from working_dir
     */
    base_dir: string;
  };

  /**
   * App schema configuration with relative base directory.
   * @property app_schema - Configuration for JSON schema files
   */
  app_schema: {
    /**
     * Relative base directory for schema files.
     * @property base_dir - Always relative path from working_dir
     */
    base_dir: string;
  };
}

/**
 * Interface for path resolution strategies in the workspace.
 *
 * Defines the contract for different path resolution approaches,
 * allowing for platform-specific and context-aware path handling.
 *
 * @example Unix path strategy implementation
 * ```typescript
 * class UnixStrategy implements PathResolutionStrategy {
 *   resolve(path: string): Promise<string> {
 *     return join(this.baseDir, path.replace(/\\/g, '/'));
 *   }
 * }
 * ```
 */
export interface PathResolutionStrategy {
  /**
   * Resolves a path to its absolute form.
   * @property resolve - Converts a relative or partial path to an absolute path
   * based on the strategy's base directory and resolution rules
   */
  resolve(path: string): Promise<string>;

  /**
   * Normalizes a path string.
   * @property normalize - Standardizes path format according to platform conventions
   * (e.g., forward vs backward slashes, case sensitivity)
   */
  normalize(path: string): Promise<string>;

  /**
   * Validates if a path exists or is correct.
   * @property validate - Checks path validity according to strategy rules,
   * including security constraints and format requirements
   */
  validate(path: string): Promise<boolean>;
}

/**
 * Interface for managing the directory structure of the workspace.
 *
 * Provides methods for workspace initialization, directory management,
 * and structural integrity validation.
 */
export interface WorkspaceStructure {
  /**
   * Initializes the workspace structure.
   * @property initialize - Sets up the initial workspace directory structure,
   * creating necessary base directories and configuration files
   */
  initialize(): Promise<void>;

  /**
   * Ensures all required directories exist.
   * @property ensureDirectories - Verifies and creates any missing directories
   * required for workspace operations
   */
  ensureDirectories(): Promise<void>;

  /**
   * Checks if a path exists in the workspace.
   * @property exists - Verifies the existence of a file or directory,
   * optionally checking the workspace root if no path is provided
   */
  exists(path?: string): Promise<boolean>;

  /**
   * Creates a directory at the specified path.
   * @property createDirectory - Creates a new directory and any necessary
   * parent directories in the workspace
   */
  createDirectory(path: string): Promise<void>;

  /**
   * Removes a directory at the specified path.
   * @property removeDirectory - Deletes a directory and all its contents
   * from the workspace
   */
  removeDirectory(path: string): Promise<void>;
}

/**
 * Interface for managing workspace configuration.
 *
 * Handles loading, updating, and validating workspace configuration data,
 * providing a centralized configuration management system.
 */
export interface WorkspaceConfigManager {
  /**
   * Loads the workspace configuration.
   * @property load - Reads configuration from files and initializes
   * the configuration state for the workspace
   */
  load(): Promise<void>;

  /**
   * Gets the current workspace configuration.
   * @property get - Retrieves the currently loaded workspace configuration,
   * including all resolved paths and settings
   */
  get(): Promise<WorkspaceConfig>;

  /**
   * Updates the workspace configuration.
   * @property update - Modifies workspace configuration with partial updates,
   * merging new values with existing configuration
   */
  update(config: Partial<WorkspaceConfig>): Promise<void>;

  /**
   * Validates the workspace configuration.
   * @property validate - Checks configuration integrity, path validity,
   * and required setting completeness
   */
  validate(): Promise<void>;
}

/**
 * Interface for resolving and normalizing workspace paths.
 *
 * Provides path resolution services using configurable strategies,
 * enabling flexible path handling across different platforms and contexts.
 */
export interface WorkspacePathResolver {
  /**
   * Resolves a path to its absolute form.
   * @property resolve - Converts relative paths to absolute paths
   * using the current resolution strategy
   */
  resolve(path: string): Promise<string>;

  /**
   * Normalizes a path string.
   * @property normalize - Standardizes path format according to
   * the current strategy's normalization rules
   */
  normalize(path: string): Promise<string>;

  /**
   * Validates if a path exists or is correct.
   * @property validate - Checks path validity using the current
   * strategy's validation criteria
   */
  validate(path: string): Promise<boolean>;

  /**
   * Updates the path resolution strategy.
   * @property updateStrategy - Changes the current path resolution strategy
   * to accommodate different platforms or requirements
   */
  updateStrategy(strategy: PathResolutionStrategy): void;
}

/**
 * Interface for handling errors in the workspace.
 *
 * Provides standardized error handling and logging capabilities
 * for workspace operations, enabling consistent error management.
 */
export interface WorkspaceErrorHandler {
  /**
   * Handles an error of a specific type.
   * @property handleError - Processes errors according to their type,
   * applying appropriate recovery strategies or escalation procedures
   */
  handleError(error: Error, type: string): void;

  /**
   * Logs an error with additional context.
   * @property logError - Records error information with contextual data
   * for debugging and monitoring purposes
   */
  logError(error: Error, context: Record<string, unknown>): void;
}

/**
 * Interface for event management in the workspace.
 *
 * Enables event-driven communication within the workspace system,
 * supporting loose coupling between workspace components.
 */
export interface WorkspaceEventEmitter {
  /**
   * Registers an event listener.
   * @property on - Subscribes a callback function to specific events,
   * enabling reactive behavior to workspace changes
   */
  on(event: string, listener: (data: unknown) => void): void;

  /**
   * Emits an event with associated data.
   * @property emit - Broadcasts events to registered listeners,
   * facilitating component communication and state updates
   */
  emit(event: string, data: unknown): void;
}

/**
 * Main interface for the workspace, providing core operations.
 *
 * The Workspace interface serves as the primary entry point for all workspace
 * operations in the Breakdown system. It orchestrates the 3-layer architecture
 * (Project → Issue → Task) and provides unified access to configuration,
 * directory management, and path resolution services.
 *
 * @example Basic workspace initialization
 * ```typescript
 * const _workspace = new WorkspaceImpl(config);
 * await workspace.initialize();
 *
 * // Check if workspace is ready
 * const exists = await workspace.exists();
 * console.log('Workspace ready:', exists);
 * ```
 *
 * @example Path resolution and directory operations
 * ```typescript
 * // Resolve paths for different workspace areas
 * const projectPath = await workspace.resolvePath('projects/my-app');
 * const promptDir = await workspace.getPromptBaseDir();
 *
 * // Create project structure
 * await workspace.createDirectory('projects/my-app/issues');
 * await workspace.createDirectory('projects/my-app/tasks');
 * ```
 *
 * @example Configuration management
 * ```typescript
 * // Validate and reload configuration
 * await workspace.validateConfig();
 * await workspace.reloadConfig();
 *
 * // Access configuration directories
 * const workingDir = await workspace.getWorkingDir();
 * const schemaDir = await workspace.getSchemaBaseDir();
 * ```
 *
 * @example Error handling and cleanup
 * ```typescript
 * try {
 *   await workspace.initialize();
 *   await workspace.createDirectory('temp/analysis');
 * } catch (error) {
 *   console.error('Workspace operation failed:', error);
 *   // Cleanup temporary directories
 *   await workspace.removeDirectory('temp/analysis');
 * }
 * ```
 */
export interface Workspace {
  /**
   * Initializes the workspace.
   * @property initialize - Sets up the complete workspace structure,
   * creates required directories, and validates configuration
   */
  initialize(): Promise<void>;

  /**
   * Resolves a path in the workspace.
   * @property resolvePath - Converts relative paths to absolute paths
   * within the workspace context
   */
  resolvePath(path: string): Promise<string>;

  /**
   * Creates a directory in the workspace.
   * @property createDirectory - Creates a new directory and any necessary
   * parent directories within the workspace
   */
  createDirectory(path: string): Promise<void>;

  /**
   * Removes a directory from the workspace.
   * @property removeDirectory - Recursively deletes a directory
   * and all its contents from the workspace
   */
  removeDirectory(path: string): Promise<void>;

  /**
   * Checks if a path exists in the workspace.
   * @property exists - Verifies the existence of files or directories
   * within the workspace, checking the root if no path is specified
   */
  exists(path?: string): Promise<boolean>;

  /**
   * Gets the base directory for prompt files.
   * @property getPromptBaseDir - Returns the absolute path to the directory
   * containing prompt templates for breakdown operations
   */
  getPromptBaseDir(): Promise<string>;

  /**
   * Gets the base directory for schema files.
   * @property getSchemaBaseDir - Returns the absolute path to the directory
   * containing JSON schema files for validation
   */
  getSchemaBaseDir(): Promise<string>;

  /**
   * Gets the working directory for the workspace.
   * @property getWorkingDir - Returns the absolute path to the workspace
   * root directory where all operations are performed
   */
  getWorkingDir(): Promise<string>;

  /**
   * Validates the workspace configuration.
   * @property validateConfig - Checks configuration integrity,
   * path validity, and required setting completeness
   */
  validateConfig(): Promise<void>;

  /**
   * Reloads the workspace configuration.
   * @property reloadConfig - Refreshes configuration from source files,
   * applying any changes to workspace behavior
   */
  reloadConfig(): Promise<void>;
}
