/**
 * Workspace configuration options
 */
export interface WorkspaceOptions {
  workingDir: string;
  promptBaseDir?: string;
  schemaBaseDir?: string;
}

/**
 * Workspace configuration structure
 */
export interface WorkspaceConfig {
  working_dir: string;
  app_prompt: {
    base_dir: string;
  };
  app_schema: {
    base_dir: string;
  };
}

/**
 * Directory structure management interface
 */
export interface WorkspaceStructure {
  getPromptBaseDir(): string;
  getSchemaBaseDir(): string;
  getWorkingDir(): string;
  initialize(): Promise<void>;
  ensureDirectories(): Promise<void>;
}

/**
 * Configuration management interface
 */
export interface WorkspaceConfigManager {
  getConfig(): Promise<WorkspaceConfig>;
  validateConfig(): Promise<void>;
}

/**
 * Path resolution interface
 */
export interface WorkspacePaths {
  resolvePromptPath(name: string): string;
  resolveSchemaPath(name: string): string;
  resolveOutputPath(name: string): string;
}
