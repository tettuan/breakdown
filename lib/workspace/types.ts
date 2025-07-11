/**
 * @fileoverview Type definitions for the Breakdown workspace module.
 *
 * This module defines a comprehensive set of interfaces and types used for
 * workspace management in the Breakdown AI development assistance tool.
 * It provides type definitions for configuration management, directory structure,
 * path resolution, and workspace orchestration.
 *
 * The type system supports the 3-layer architecture (Project → Issue → Task)
 * and ensures type safety across all workspace operations including initialization,
 * configuration validation, path resolution, and error handling.
 *
 * @module workspace/types
 *
 * @example
 * ```typescript
 * import { WorkspaceOptions, WorkspaceConfig, WorkspaceStructure } from "./types.ts";
 *
 * // Configuration options for workspace setup
 * const options: WorkspaceOptions = {
 *   workingDir: ".agent/breakdown",
 *   promptBaseDir: "lib/breakdown/prompts",
 *   schemaBaseDir: "lib/breakdown/schema"
 * };
 *
 * // Workspace configuration structure
 * const config: WorkspaceConfig = {
 *   working_dir: ".agent/breakdown",
 *   app_prompt: { base_dir: "lib/breakdown/prompts" },
 *   app_schema: { base_dir: "lib/breakdown/schema" }
 * };
 * ```
 */

/**
 * Workspace configuration options for initializing and configuring workspace settings.
 *
 * This interface defines the runtime configuration options used to customize
 * workspace behavior, including directory locations and operational parameters.
 * It supports flexible workspace layouts while maintaining the standard structure.
 *
 * @interface WorkspaceOptions
 *
 * @example
 * ```typescript
 * // Standard workspace configuration
 * const standardOptions: WorkspaceOptions = {
 *   workingDir: ".agent/breakdown"
 * };
 *
 * // Custom workspace with specific directories
 * const customOptions: WorkspaceOptions = {
 *   workingDir: "/custom/workspace",
 *   promptBaseDir: "templates/prompts",
 *   schemaBaseDir: "schemas/validation"
 * };
 * ```
 */
export interface WorkspaceOptions {
  /**
   * The working directory for the workspace.
   * This is the root directory where all workspace operations take place.
   */
  workingDir: string;
  /**
   * Optional custom base directory for prompt templates.
   * If not specified, uses the default from workspace configuration.
   */
  promptBaseDir?: string;
  /**
   * Optional custom base directory for JSON schema files.
   * If not specified, uses the default from workspace configuration.
   */
  schemaBaseDir?: string;
}

/**
 * Workspace configuration structure loaded from configuration files.
 *
 * This interface represents the structure of the workspace configuration
 * as stored in configuration files (typically app.yml or similar). It defines
 * the persistent configuration settings that control workspace behavior
 * across different execution contexts.
 *
 * @interface WorkspaceConfig
 *
 * @example
 * ```typescript
 * // Standard breakdown workspace configuration
 * const config: WorkspaceConfig = {
 *   working_dir: ".agent/breakdown",
 *   app_prompt: {
 *     base_dir: "lib/breakdown/prompts"
 *   },
 *   app_schema: {
 *     base_dir: "lib/breakdown/schema"
 *   }
 * };
 *
 * // Custom project-specific configuration
 * const projectConfig: WorkspaceConfig = {
 *   working_dir: "workspace/myproject",
 *   app_prompt: {
 *     base_dir: "templates/ai-prompts"
 *   },
 *   app_schema: {
 *     base_dir: "schemas/validation"
 *   }
 * };
 * ```
 */
export interface WorkspaceConfig {
  /**
   * The working directory for the workspace.
   * Relative or absolute path where workspace operations are performed.
   */
  working_dir: string;
  /**
   * Prompt configuration settings.
   * Defines the location and behavior of prompt templates.
   */
  app_prompt: {
    /**
     * The base directory for prompt templates.
     * All prompt files are resolved relative to this directory.
     */
    base_dir: string;
  };
  /**
   * Schema configuration settings.
   * Defines the location and behavior of JSON schema validation files.
   */
  app_schema: {
    /**
     * The base directory for JSON schema files.
     * All schema files are resolved relative to this directory.
     */
    base_dir: string;
  };
}

/**
 * Directory structure management interface for workspace operations.
 *
 * This interface defines the contract for managing workspace directory structures,
 * providing methods for initialization, validation, and maintenance of the
 * standardized directory layout required by Breakdown.
 *
 * @interface WorkspaceStructure
 *
 * @example
 * ```typescript
 * // Implement workspace structure management
 * class CustomWorkspaceStructure implements WorkspaceStructure {
 *   async initialize(): Promise<void> {
 *     await this.ensureDirectories();
 *   }
 *
 *   getPromptBaseDir(): Promise<string> {
 *     return "custom/prompts";
 *   }
 * }
 * ```
 */
export interface WorkspaceStructure {
  /**
   * Gets the base directory for prompt templates.
   * @returns Promise<string> - The resolved base directory path for prompts
   */
  getPromptBaseDir(): Promise<string>;
  /**
   * Gets the base directory for JSON schema files.
   * @returns Promise<string> - The resolved base directory path for schemas
   */
  getSchemaBaseDir(): Promise<string>;
  /**
   * Gets the working directory for the workspace.
   * @returns string - The working directory path
   */
  getWorkingDir(): string;
  /**
   * Initializes the complete workspace structure.
   * @returns Promise<void> - Resolves when initialization is complete
   */
  initialize(): Promise<void>;
  /**
   * Ensures all required directories exist in the workspace.
   * @returns Promise<void> - Resolves when all directories are verified/created
   */
  ensureDirectories(): Promise<void>;
}

/**
 * Configuration management interface for workspace settings.
 *
 * This interface defines the contract for managing workspace configuration,
 * including loading, validation, and access to configuration settings.
 *
 * @interface WorkspaceConfigManager
 *
 * @example
 * ```typescript
 * // Implement configuration management
 * class FileBasedConfigManager implements WorkspaceConfigManager {
 *   async getConfig(): Promise<WorkspaceConfig> {
 *     const config = await loadConfigFromFile("app.yml");
 *     await this.validateConfig();
 *     return config;
 *   }
 *
 *   validateConfig(): Promise<void> {
 *     // Validate configuration settings
 *   }
 * }
 * ```
 */
export interface WorkspaceConfigManager {
  /**
   * Gets the workspace configuration from storage.
   * @returns Promise<WorkspaceConfig> - The loaded workspace configuration
   * @throws {WorkspaceConfigError} When configuration loading fails
   */
  getConfig(): Promise<WorkspaceConfig>;
  /**
   * Validates the workspace configuration for correctness.
   * @returns Promise<void> - Resolves when validation completes successfully
   * @throws {WorkspaceConfigError} When configuration validation fails
   */
  validateConfig(): Promise<void>;
}

/**
 * Path resolution interface for workspace file operations.
 *
 * This interface defines the contract for resolving file paths within
 * the workspace, supporting the various file types used by Breakdown
 * including prompts, schemas, and output files.
 *
 * @interface WorkspacePaths
 *
 * @example
 * ```typescript
 * // Implement path resolution
 * class StandardWorkspacePaths implements WorkspacePaths {
 *   resolvePromptPath(name: string): string {
 *     return `${this.promptBaseDir}/${name}.md`;
 *   }
 *
 *   resolveSchemaPath(name: string): string {
 *     return `${this.schemaBaseDir}/${name}.json`;
 *   }
 *
 *   resolveOutputPath(name: string): string {
 *     return `${this.workingDir}/output/${name}`;
 *   }
 * }
 * ```
 */
export interface WorkspacePaths {
  /**
   * Resolves the complete path to a prompt template file by name.
   * @param name - The name of the prompt file (without extension)
   * @returns string - The resolved absolute or relative path to the prompt file
   */
  resolvePromptPath(name: string): string;
  /**
   * Resolves the complete path to a JSON schema file by name.
   * @param name - The name of the schema file (without extension)
   * @returns string - The resolved absolute or relative path to the schema file
   */
  resolveSchemaPath(name: string): string;
  /**
   * Resolves the complete path to an output file by name.
   * @param name - The name of the output file
   * @returns string - The resolved absolute or relative path to the output file
   */
  resolveOutputPath(name: string): string;
}
