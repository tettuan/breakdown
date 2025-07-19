/**
 * Workspace module for Breakdown tool.
 *
 * This module provides the core workspace functionality for the Breakdown tool,
 * including directory structure management, configuration handling, and path resolution.
 * It implements the workspace structure, configuration management, and path resolution
 * interfaces.
 *
 * @example
 * ```ts
 * import { Workspace } from "@tettuan/breakdown/lib/workspace/workspace.ts";
 *
 * const _workspace = new Workspace({ workingDir: "." });
 * await workspace.initialize();
 * ```
 *
 * @module
 */

import { dirname, join } from "@std/path";
import { ensureDir, exists } from "@std/fs";
import {
  createWorkspaceConfigError,
  createWorkspaceInitError,
  WorkspaceConfigError,
} from "./errors.ts";
import { stringify } from "jsr:@std/yaml@1.0.6";
import { Workspace, WorkspaceConfig as WorkspaceConfigInterface } from "./interfaces.ts";
import { WorkspaceStructureImpl } from "./structure.ts";
import { BreakdownConfig } from "../deps.ts";
import { WorkspacePathResolverImpl } from "./path/resolver.ts";
import { DefaultPathResolutionStrategy } from "./path/strategies.ts";
import { resolve } from "jsr:@std/path@1.0.0";
import { prompts } from "../templates/prompts.ts";
import { schema } from "../templates/schema.ts";
import { DEFAULT_PROMPT_BASE_DIR, DEFAULT_SCHEMA_BASE_DIR } from "../config/constants.ts";

/**
 * Workspace class for managing Breakdown project structure and configuration.
 *
 * This class handles all workspace-related operations including:
 * - Directory structure management
 * - Configuration file handling
 * - Path resolution for prompts, schema, and outputs
 * - Template and schema file management
 *
 * All configuration access must use BreakdownConfig from @tettuan/breakdownconfig.
 * Direct YAML or JSON config file reading is not allowed in this module.
 *
 * @implements {WorkspaceStructure}
 * @implements {WorkspaceConfigManager}
 * @implements {WorkspacePaths}
 */
export class WorkspaceImpl implements Workspace {
  private _structure: WorkspaceStructureImpl;
  private _pathResolver: WorkspacePathResolverImpl;
  private config: WorkspaceConfigInterface;

  /**
   * Creates a new WorkspaceImpl instance.
   * @param config The workspace configuration.
   */
  constructor(config: WorkspaceConfigInterface) {
    // Deep copy to ensure immutability
    this.config = this.deepCopyConfig(config);
    this._structure = new WorkspaceStructureImpl(config);
    this._pathResolver = new WorkspacePathResolverImpl(new DefaultPathResolutionStrategy());
  }

  /**
   * Deep copy workspace configuration manually to avoid JSON.parse
   * @param config - The workspace configuration to copy
   * @returns Deep copy of the workspace configuration
   */
  private deepCopyConfig(config: WorkspaceConfigInterface): WorkspaceConfigInterface {
    return {
      workingDir: config.workingDir,
      promptBaseDir: config.promptBaseDir,
      schemaBaseDir: config.schemaBaseDir,
    };
  }

  /**
   * Initializes the workspace, creating required directories and config files.
   * @throws {WorkspaceInitError} If initialization fails
   */
  async initialize(): Promise<void> {
    try {
      await ensureDir(this.config.workingDir);
      await ensureDir(join(this.config.workingDir, this.config.promptBaseDir));
      await ensureDir(join(this.config.workingDir, this.config.schemaBaseDir));
      await this._structure.initialize();

      // Create config file if it doesn't exist
      const configDir = join(this.config.workingDir, ".agent", "breakdown", "config");
      const configFile = join(configDir, "default-app.yml");

      try {
        await Deno.stat(configFile);
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          await ensureDir(configDir);
          const config = {
            working_dir: ".agent/breakdown",
            app_prompt: {
              base_dir: this.config.promptBaseDir,
            },
            app_schema: {
              base_dir: this.config.schemaBaseDir,
            },
          };
          await Deno.writeTextFile(configFile, stringify(config));
        } else {
          throw error;
        }
      }

      // Create custom base directories if specified
      const customPromptDir = join(
        this.config.workingDir,
        ".agent",
        "breakdown",
        this.config.promptBaseDir,
      );
      const customSchemaDir = join(
        this.config.workingDir,
        ".agent",
        "breakdown",
        this.config.schemaBaseDir,
      );

      await ensureDir(customPromptDir);
      await ensureDir(customSchemaDir);

      // 展開: prompts テンプレート
      for (const [relPath, content] of Object.entries(prompts)) {
        const destPath = join(customPromptDir, relPath);
        try {
          await Deno.stat(destPath);
        } catch (e: unknown) {
          if (e instanceof Deno.errors.NotFound) {
            await ensureDir(dirname(destPath));
            await Deno.writeTextFile(destPath, content);
          } else {
            throw e;
          }
        }
      }

      // 展開: schema テンプレート
      for (const [relPath, content] of Object.entries(schema)) {
        const destPath = join(customSchemaDir, relPath);
        try {
          await Deno.stat(destPath);
        } catch (e: unknown) {
          if (e instanceof Deno.errors.NotFound) {
            await ensureDir(dirname(destPath));
            await Deno.writeTextFile(destPath, content);
          } else {
            throw e;
          }
        }
      }
    } catch (error) {
      if (error instanceof Deno.errors.PermissionDenied) {
        throw createWorkspaceInitError(
          `Permission denied: Cannot create directory structure in ${
            join(this.config.workingDir, "breakdown")
          }`,
        );
      }
      throw error;
    }
  }

  /**
   * Resolves a path in the workspace using the path resolver.
   * @param path The path to resolve.
   * @returns A promise resolving to the resolved path.
   */
  resolvePath(path: string): Promise<string> {
    return this._pathResolver.resolve(path);
  }

  /**
   * Creates a directory in the workspace.
   * @param path The path of the directory to create.
   * @returns A promise that resolves when the directory is created.
   */
  createDirectory(path: string): Promise<void> {
    return this._structure.createDirectory(path);
  }

  /**
   * Removes a directory from the workspace.
   * @param path The path of the directory to remove.
   * @returns A promise that resolves when the directory is removed.
   */
  removeDirectory(path: string): Promise<void> {
    return this._structure.removeDirectory(path);
  }

  /**
   * Checks if a path exists in the workspace.
   * @param path The path to check. If not provided, checks the working directory.
   * @returns A promise resolving to true if the path exists, false otherwise.
   */
  exists(path?: string): Promise<boolean> {
    return this._structure.exists(path);
  }

  /**
   * Gets the base directory for prompt files.
   * @returns A promise resolving to the prompt base directory.
   */
  getPromptBaseDir(): Promise<string> {
    return Promise.resolve(resolve(this.config.workingDir, this.config.promptBaseDir));
  }

  /**
   * Gets the base directory for schema files.
   * @returns A promise resolving to the schema base directory.
   */
  getSchemaBaseDir(): Promise<string> {
    return Promise.resolve(resolve(this.config.workingDir, this.config.schemaBaseDir));
  }

  /**
   * Gets the working directory for the workspace.
   * @returns A promise resolving to the working directory.
   */
  getWorkingDir(): Promise<string> {
    return Promise.resolve(this.config.workingDir);
  }

  /**
   * Validates the workspace configuration.
   * @throws {WorkspaceConfigError} If the working directory does not exist
   */
  async validateConfig(): Promise<void> {
    if (!await exists(this.config.workingDir)) {
      throw new WorkspaceConfigError("Working directory does not exist");
    }
  }

  /**
   * Reloads the workspace configuration from file.
   * @throws {WorkspaceConfigError} If the configuration file is not found
   */
  async reloadConfig(): Promise<void> {
    // Reload configuration using BreakdownConfig
    try {
      // Create BreakdownConfig instance with default profile using static factory method
      const breakdownConfigResult = await BreakdownConfig.create("default", this.config.workingDir);

      if (!breakdownConfigResult.success || !breakdownConfigResult.data) {
        throw createWorkspaceConfigError(`Failed to create BreakdownConfig`);
      }

      const breakdownConfig = breakdownConfigResult.data;

      // Load configuration
      await breakdownConfig.loadConfig();

      // Get merged configuration
      const mergedConfig = await breakdownConfig.getConfig();

      // Extract the necessary configuration values
      this.config = {
        workingDir: this.config.workingDir,
        promptBaseDir: mergedConfig.app_prompt?.base_dir || "prompts",
        schemaBaseDir: mergedConfig.app_schema?.base_dir || "schema",
      };
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw createWorkspaceConfigError("Configuration file not found");
      }
      throw error;
    }
  }
}

export { WorkspaceImpl as Workspace };

/**
 * Initialize a new Breakdown workspace.
 *
 * Creates and initializes a new workspace in the specified directory.
 *
 * @param workingDir - The directory to initialize the workspace in (defaults to ".")
 * @param config - Optional configuration object with app_prompt and app_schema base directories
 * @throws {WorkspaceInitError} If initialization fails
 * @throws {WorkspaceConfigError} If configuration validation fails
 */
export async function initWorkspace(
  workingDir = ".",
  config?: { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } },
): Promise<void> {
  // In production, use BreakdownConfig to load these values
  const workspace = new WorkspaceImpl({
    workingDir,
    promptBaseDir: config?.app_prompt?.base_dir ?? DEFAULT_PROMPT_BASE_DIR,
    schemaBaseDir: config?.app_schema?.base_dir ?? DEFAULT_SCHEMA_BASE_DIR,
  });
  await workspace.initialize();
}
