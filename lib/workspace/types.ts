/**
 * Workspace configuration options.
 * Used to configure the workspace directory and base directories.
 */
export interface WorkspaceOptions {
  /** The working directory for the workspace. */
  workingDir: string;
  /** The base directory for prompts. */
  promptBaseDir?: string;
  /** The base directory for schemas. */
  schemaBaseDir?: string;
}

/**
 * Workspace configuration structure.
 * Represents the structure of the workspace configuration file.
 */
export interface WorkspaceConfig {
  /** The working directory for the workspace. */
  working_dir: string;
  /** Prompt configuration. */
  app_prompt: {
    /** The base directory for prompts. */
    base_dir: string;
  };
  /** Schema configuration. */
  app_schema: {
    /** The base directory for schemas. */
    base_dir: string;
  };
}

/**
 * Directory structure management interface.
 * Provides methods for managing workspace directories.
 */
export interface WorkspaceStructure {
  /** Gets the base directory for prompts. */
  getPromptBaseDir(): string;
  /** Gets the base directory for schemas. */
  getSchemaBaseDir(): string;
  /** Gets the working directory. */
  getWorkingDir(): string;
  /** Initializes the workspace. */
  initialize(): Promise<void>;
  /** Ensures required directories exist. */
  ensureDirectories(): Promise<void>;
}

/**
 * Configuration management interface.
 * Provides methods for managing and validating workspace configuration.
 */
export interface WorkspaceConfigManager {
  /** Gets the workspace configuration. */
  getConfig(): Promise<WorkspaceConfig>;
  /** Validates the workspace configuration. */
  validateConfig(): Promise<void>;
}

/**
 * Path resolution interface.
 * Provides methods for resolving workspace paths.
 */
export interface WorkspacePaths {
  /** Resolves the path to a prompt file by name. */
  resolvePromptPath(name: string): string;
  /** Resolves the path to a schema file by name. */
  resolveSchemaPath(name: string): string;
  /** Resolves the path to an output file by name. */
  resolveOutputPath(name: string): string;
}
