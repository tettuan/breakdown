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
 * const workspace = new Workspace({ workingDir: "." });
 * await workspace.initialize();
 * ```
 *
 * @module
 */

import { dirname, fromFileUrl, isAbsolute, join, normalize, basename } from "@std/path";
import { exists } from "@std/fs";
import { parse } from "@std/yaml";
import {
  WorkspaceConfig,
  WorkspaceConfigManager,
  WorkspaceOptions,
  WorkspacePaths,
  WorkspaceStructure,
} from "./types.ts";
import { WorkspaceConfigError, WorkspaceInitError } from "./errors.ts";
import { stringify } from "jsr:@std/yaml@1.0.6";
import { ensureDir } from "@std/fs";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { PromptVariablesFactory } from "../factory/prompt_variables_factory.ts";
import { DEFAULT_WORKSPACE_STRUCTURE } from "../config/constants.ts";
import { Workspace, WorkspaceConfig as WorkspaceConfigInterface } from "./interfaces.ts";
import { WorkspaceStructureImpl } from "./structure.ts";
import { WorkspacePathResolverImpl } from "./path/resolver.ts";
import { DefaultPathResolutionStrategy } from "./path/strategies.ts";
import { walk } from "jsr:@std/fs@0.224.0/walk";
import { resolve } from "jsr:@std/path@1.0.0";

/**
 * Workspace class for managing Breakdown project structure and configuration.
 *
 * This class handles all workspace-related operations including:
 * - Directory structure management
 * - Configuration file handling
 * - Path resolution for prompts, schemas, and outputs
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
  private structure: WorkspaceStructureImpl;
  private pathResolver: WorkspacePathResolverImpl;
  private config: WorkspaceConfigInterface;

  constructor(config: WorkspaceConfigInterface) {
    this.config = config;
    this.structure = new WorkspaceStructureImpl(config);
    this.pathResolver = new WorkspacePathResolverImpl(new DefaultPathResolutionStrategy());
  }

  async initialize(): Promise<void> {
    try {
      await ensureDir(this.config.workingDir);
      await ensureDir(join(this.config.workingDir, this.config.promptBaseDir));
      await ensureDir(join(this.config.workingDir, this.config.schemaBaseDir));
      await this.structure.initialize();
      
      // Create config file if it doesn't exist
      const configDir = join(this.config.workingDir, ".agent", "breakdown", "config");
      const configFile = join(configDir, "app.yml");
      
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
      const customPromptDir = join(this.config.workingDir, ".agent", "breakdown", this.config.promptBaseDir);
      const customSchemaDir = join(this.config.workingDir, ".agent", "breakdown", this.config.schemaBaseDir);
      
      await ensureDir(customPromptDir);
      await ensureDir(customSchemaDir);

      // Copy prompt templates if not already present
      const promptTemplateSrc = join(fromFileUrl(import.meta.url), "../../breakdown/prompts");
      for await (const entry of walk(promptTemplateSrc, { includeDirs: false })) {
        const relPath = entry.path.substring(promptTemplateSrc.length + 1);
        const destPath = join(customPromptDir, relPath);
        try {
          await Deno.stat(destPath);
        } catch (e) {
          if (e instanceof Deno.errors.NotFound) {
            await ensureDir(dirname(destPath));
            await Deno.copyFile(entry.path, destPath);
          } else {
            throw e;
          }
        }
      }

      // Copy schema templates if not already present (from both schema and schemas)
      const schemaTemplateSrcs = [
        join(fromFileUrl(import.meta.url), "../../breakdown/schema"),
        join(fromFileUrl(import.meta.url), "../../breakdown/schemas"),
      ];
      for (const schemaTemplateSrc of schemaTemplateSrcs) {
        try {
          for await (const entry of walk(schemaTemplateSrc, { includeDirs: false })) {
            const relPath = entry.path.substring(schemaTemplateSrc.length + 1);
            const destPath = join(customSchemaDir, relPath);
            try {
              await Deno.stat(destPath);
            } catch (e) {
              if (e instanceof Deno.errors.NotFound) {
                await ensureDir(dirname(destPath));
                await Deno.copyFile(entry.path, destPath);
              } else {
                throw e;
              }
            }
          }
        } catch (e) {
          if (!(e instanceof Deno.errors.NotFound)) {
            throw e;
          }
          // If the directory doesn't exist, skip
        }
      }
    } catch (error) {
      if (error instanceof Deno.errors.PermissionDenied) {
        throw new WorkspaceInitError(`Permission denied: Cannot create directory structure in ${join(this.config.workingDir, "breakdown")}`);
      }
      throw error;
    }
  }

  async resolvePath(path: string): Promise<string> {
    return this.pathResolver.resolve(path);
  }

  async createDirectory(path: string): Promise<void> {
    await this.structure.createDirectory(path);
  }

  async removeDirectory(path: string): Promise<void> {
    await this.structure.removeDirectory(path);
  }

  async exists(path?: string): Promise<boolean> {
    return this.structure.exists(path);
  }

  async getPromptBaseDir(): Promise<string> {
    return resolve(this.config.workingDir, this.config.promptBaseDir);
  }

  async getSchemaBaseDir(): Promise<string> {
    return resolve(this.config.workingDir, this.config.schemaBaseDir);
  }

  async getWorkingDir(): Promise<string> {
    return this.config.workingDir;
  }

  async validateConfig(): Promise<void> {
    if (!await exists(this.config.workingDir)) {
      throw new WorkspaceConfigError("Working directory does not exist");
    }
  }

  async reloadConfig(): Promise<void> {
    // Reload configuration from file
    const configDir = join(this.config.workingDir, ".agent", "breakdown", "config");
    const configFile = join(configDir, "app.yml");
    
    try {
      const configContent = await Deno.readTextFile(configFile);
      const config = parse(configContent) as {
        working_dir: string;
        app_prompt: { base_dir: string };
        app_schema: { base_dir: string };
      };
      
      this.config = {
        workingDir: this.config.workingDir,
        promptBaseDir: config.app_prompt.base_dir,
        schemaBaseDir: config.app_schema.base_dir,
      };
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new WorkspaceConfigError("Configuration file not found");
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
 * @throws {WorkspaceInitError} If initialization fails
 * @throws {WorkspaceConfigError} If configuration validation fails
 */
export async function initWorkspace(workingDir = "."): Promise<void> {
  // In production, use BreakdownConfig to load these values
  const workspace = new WorkspaceImpl({
    workingDir,
    promptBaseDir: "prompts", // placeholder, should be loaded from config
    schemaBaseDir: "schemas", // placeholder, should be loaded from config
  });
  await workspace.initialize();
}
