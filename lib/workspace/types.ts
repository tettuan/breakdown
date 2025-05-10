/**
 * Type definitions for the Breakdown workspace module.
 *
 * This module defines the core interfaces and types used for workspace management,
 * including configuration, directory structure, and path resolution.
 *
 * @example
 * ```ts
 * import { WorkspaceOptions, WorkspaceConfig } from "@tettuan/breakdown/lib/workspace/types.ts";
 *
 * const options: WorkspaceOptions = {
 *   workingDir: ".",
 *   promptBaseDir: "custom/prompts"
 * };
 * ```
 *
 * @module
 */

/**
 * Workspace configuration options.
 * Used to configure the workspace directory and base directories.
 *
 * @interface
 * @property {string} workingDir - The working directory for the workspace
 * @property {string} [promptBaseDir] - Optional custom base directory for prompts
 * @property {string} [schemaBaseDir] - Optional custom base directory for schema
 */
export interface WorkspaceOptions {
  /** The working directory for the workspace. */
  workingDir: string;
  /** The base directory for prompts. */
  promptBaseDir?: string;
  /** The base directory for schema. */
  schemaBaseDir?: string;
}

/**
 * Workspace configuration structure.
 * Represents the structure of the workspace configuration file (app.yml).
 *
 * @interface
 * @property {string} working_dir - The working directory path relative to the workspace root
 * @property {Object} app_prompt - Prompt configuration settings
 * @property {string} app_prompt.base_dir - The base directory for prompts
 * @property {Object} app_schema - Schema configuration settings
 * @property {string} app_schema.base_dir - The base directory for schema
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
    /** The base directory for schema. */
    base_dir: string;
  };
}

/**
 * Directory structure management interface.
 * Provides methods for managing workspace directories and structure.
 *
 * @interface
 * @property {function(): string} getPromptBaseDir - Gets the base directory for prompts
 * @property {function(): string} getSchemaBaseDir - Gets the base directory for schema
 * @property {function(): string} getWorkingDir - Gets the working directory
 * @property {function(): Promise<void>} initialize - Initializes the workspace
 * @property {function(): Promise<void>} ensureDirectories - Ensures required directories exist
 */
export interface WorkspaceStructure {
  /** Gets the base directory for prompts. */
  getPromptBaseDir(): Promise<string>;
  /** Gets the base directory for schema. */
  getSchemaBaseDir(): Promise<string>;
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
 *
 * @interface
 * @property {function(): Promise<WorkspaceConfig>} getConfig - Gets the workspace configuration
 * @property {function(): Promise<void>} validateConfig - Validates the workspace configuration
 */
export interface WorkspaceConfigManager {
  /** Gets the workspace configuration. */
  getConfig(): Promise<WorkspaceConfig>;
  /** Validates the workspace configuration. */
  validateConfig(): Promise<void>;
}

/**
 * Path resolution interface.
 * Provides methods for resolving workspace paths for various file types.
 *
 * @interface
 * @property {function(name: string): string} resolvePromptPath - Resolves the path to a prompt file
 * @property {function(name: string): string} resolveSchemaPath - Resolves the path to a schema file
 * @property {function(name: string): string} resolveOutputPath - Resolves the path to an output file
 */
export interface WorkspacePaths {
  /** Resolves the path to a prompt file by name. */
  resolvePromptPath(name: string): string;
  /** Resolves the path to a schema file by name. */
  resolveSchemaPath(name: string): string;
  /** Resolves the path to an output file by name. */
  resolveOutputPath(name: string): string;
}
