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

import { dirname, join } from "@std/path";
import { ensureDir, exists } from "@std/fs";
import { parse } from "@std/yaml";
import { WorkspaceConfigError, WorkspaceInitError } from "./errors.ts";
import { stringify } from "jsr:@std/yaml@1.0.6";
import { Workspace, WorkspaceConfig as WorkspaceConfigInterface } from "./interfaces.ts";
import { WorkspaceStructureImpl } from "./structure.ts";
import { WorkspacePathResolverImpl } from "./path/resolver.ts";
import { DefaultPathResolutionStrategy } from "./path/strategies.ts";
import { resolve } from "jsr:@std/path@1.0.0";
import { prompts } from "../templates/prompts.ts";
import { schema } from "../templates/schema.ts";

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
        } catch (e) {
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
        } catch (e) {
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
        throw new WorkspaceInitError(
          `Permission denied: Cannot create directory structure in ${
            join(this.config.workingDir, "breakdown")
          }`,
        );
      }
      throw error;
    }
  }

  resolvePath(path: string): Promise<string> {
    return this.pathResolver.resolve(path);
  }

  createDirectory(path: string): Promise<void> {
    return this.structure.createDirectory(path);
  }

  removeDirectory(path: string): Promise<void> {
    return this.structure.removeDirectory(path);
  }

  exists(path?: string): Promise<boolean> {
    return this.structure.exists(path);
  }

  getPromptBaseDir(): Promise<string> {
    return Promise.resolve(resolve(this.config.workingDir, this.config.promptBaseDir));
  }

  getSchemaBaseDir(): Promise<string> {
    return Promise.resolve(resolve(this.config.workingDir, this.config.schemaBaseDir));
  }

  getWorkingDir(): Promise<string> {
    return Promise.resolve(this.config.workingDir);
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
    schemaBaseDir: "schema", // placeholder, should be loaded from config
  });
  await workspace.initialize();
}
