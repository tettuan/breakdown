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

import { dirname, fromFileUrl, isAbsolute, join } from "@std/path";
import { exists } from "@std/fs";
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
export class Workspace implements WorkspaceStructure, WorkspaceConfigManager, WorkspacePaths {
  private workingDir: string;
  private promptBaseDir: string;
  private schemaBaseDir: string;
  private config: WorkspaceConfig | null = null;
  private promptVariablesFactory?: PromptVariablesFactory;

  /**
   * Creates a new Workspace instance.
   * 
   * @param options - The workspace options for initialization
   * @param options.workingDir - The base working directory for the workspace
   * @param options.promptBaseDir - Optional custom prompt base directory
   * @param options.schemaBaseDir - Optional custom schema base directory
   */
  constructor(options: WorkspaceOptions) {
    this.workingDir = options.workingDir;
    const breakdownDir = join(this.workingDir, ".agent", "breakdown");
    this.promptBaseDir = options.promptBaseDir || join(breakdownDir, "prompts");
    this.schemaBaseDir = options.schemaBaseDir || join(breakdownDir, "schemas");
  }

  /**
   * Initialize the workspace by creating required directories and validating configuration.
   * 
   * This method:
   * 1. Creates the necessary directory structure
   * 2. Initializes configuration files
   * 3. Validates the configuration
   * 4. Copies template and schema files
   *
   * @throws {WorkspaceInitError} If initialization fails
   * @throws {WorkspaceConfigError} If configuration validation fails
   */
  public async initialize(): Promise<void> {
    // 1. Ensure .agent/breakdown/config/app.yml exists
    const breakdownDir = join(this.workingDir, ".agent", "breakdown");
    const configDir = join(breakdownDir, "config");
    const configFile = join(configDir, "app.yml");
    let config: WorkspaceConfig;

    // Check if any required paths exist as files
    const dirsToCheck = [breakdownDir, configDir];
    for (const dir of dirsToCheck) {
      if (await exists(dir)) {
        const stat = await Deno.stat(dir);
        if (!stat.isDirectory) {
          throw new WorkspaceInitError(`Path exists but is not a directory: ${dir}`);
        }
      }
    }

    if (!(await exists(configFile))) {
      await ensureDir(configDir);
      config = {
        working_dir: ".agent/breakdown",
        app_prompt: { base_dir: "prompts" },
        app_schema: { base_dir: "schemas" },
      };
      const configYaml = stringify(config);
      await Deno.writeTextFile(configFile, configYaml);
    }
    // Use BreakdownConfig to load config
    const breakdownConfig = new BreakdownConfig(this.workingDir);
    await breakdownConfig.loadConfig();
    const settings = await breakdownConfig.getConfig();
    if (!settings.app_prompt?.base_dir || settings.app_prompt.base_dir.trim() === "") {
      throw new WorkspaceInitError(
        "Prompt base_dir must be set in config (app_prompt.base_dir). No fallback allowed.",
      );
    }
    if (!settings.app_schema?.base_dir || settings.app_schema.base_dir.trim() === "") {
      throw new WorkspaceInitError(
        "Schema base_dir must be set in config (app_schema.base_dir). No fallback allowed.",
      );
    }
    const promptBase = settings.app_prompt.base_dir.toString().trim();
    const schemaBase = settings.app_schema.base_dir.toString().trim();

    // 3. Create required directories
    const subdirs = [
      "projects",
      "issues",
      "tasks",
      "temp",
      "config",
      promptBase,
      schemaBase,
    ];

    // Check if any subdirectories exist as files
    for (const dir of subdirs) {
      const dirPath = join(this.workingDir, ".agent", "breakdown", dir);
      if (await exists(dirPath)) {
        const stat = await Deno.stat(dirPath);
        if (!stat.isDirectory) {
          throw new WorkspaceInitError(`Path exists but is not a directory: ${dirPath}`);
        }
      }
    }

    await ensureDir(join(this.workingDir, ".agent", "breakdown"));
    for (const dir of subdirs) {
      await ensureDir(join(this.workingDir, ".agent", "breakdown", dir));
    }

    // テンプレート・スキーマコピー処理を追加
    await this.copyTemplatesAndSchemas();

    // 4. Validate config (check dirs exist)
    await this.validateConfig();
  }

  /**
   * Test if a directory is writable by attempting to create and remove a test file.
   * 
   * @param dir - The directory to test
   * @throws {Error} If directory is not writable
   * @private
   */
  private async testDirectoryWritable(dir: string): Promise<void> {
    const testFile = join(dir, ".write_test");
    try {
      await Deno.writeTextFile(testFile, "test");
      await Deno.remove(testFile);
    } catch (error: unknown) {
      if (error instanceof Deno.errors.PermissionDenied) {
        throw new WorkspaceInitError(
          `Permission denied: Cannot create directory structure in ${join(dir, "breakdown")}`,
        );
      }
      throw error;
    }
  }

  /**
   * Ensure required directories exist and are writable.
   * 
   * @throws {WorkspaceInitError} If directory creation fails
   * @throws {Error} If permission denied
   */
  public async ensureDirectories(): Promise<void> {
    // First check if parent directory exists and is writable
    const parentDir = this.workingDir;
    try {
      const parentStat = await Deno.stat(parentDir);
      if (!parentStat.isDirectory) {
        throw new WorkspaceInitError(`${parentDir} exists but is not a directory`);
      }

      // Test write permission on parent directory
      await this.testDirectoryWritable(parentDir);
    } catch (error: unknown) {
      if (error instanceof Deno.errors.NotFound) {
        // Parent directory doesn't exist, try to create it
        try {
          await Deno.mkdir(parentDir, { recursive: true });
          // Test write permission after creation
          await this.testDirectoryWritable(parentDir);
        } catch (mkdirError: unknown) {
          if (mkdirError instanceof Deno.errors.PermissionDenied) {
            throw new WorkspaceInitError(`Permission denied: Cannot create directory ${parentDir}`);
          }
          throw new WorkspaceInitError(
            `Failed to create working directory: ${
              mkdirError instanceof Error ? mkdirError.message : String(mkdirError)
            }`,
          );
        }
      } else if (error instanceof Error) {
        throw new WorkspaceInitError(error.message);
      } else {
        throw new WorkspaceInitError(String(error));
      }
    }

    // Create the breakdown directory structure
    const breakdownDir = join(this.workingDir, ".agent", "breakdown");
    const subdirs = [
      "projects",
      "issues",
      "tasks",
      "temp",
      "config",
      "prompts",
      "schemas",
    ];

    try {
      // Create breakdown directory first
      await Deno.mkdir(breakdownDir, { recursive: true });
      // Test write permission on breakdown directory
      await this.testDirectoryWritable(breakdownDir);

      // Create all subdirectories
      for (const dir of subdirs) {
        const dirPath = join(breakdownDir, dir);
        await Deno.mkdir(dirPath, { recursive: true });
        // Test write permission on each subdirectory
        await this.testDirectoryWritable(dirPath);
      }
    } catch (error: unknown) {
      if (error instanceof Deno.errors.PermissionDenied) {
        throw new WorkspaceInitError(
          `Permission denied: Cannot create directory structure in ${breakdownDir}`,
        );
      }
      throw new WorkspaceInitError(
        `Failed to create directory structure: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Get the current workspace configuration.
   * 
   * @returns {Promise<WorkspaceConfig>} The workspace configuration
   * @throws {WorkspaceConfigError} If configuration is not loaded
   */
  public getConfig(): Promise<WorkspaceConfig> {
    if (!this.config) {
      this.config = {
        working_dir: ".agent/breakdown",
        app_prompt: {
          base_dir: "prompts",
        },
        app_schema: {
          base_dir: "schemas",
        },
      };
    }
    return Promise.resolve(this.config);
  }

  /**
   * Validate the workspace configuration.
   * 
   * @throws {WorkspaceConfigError} If validation fails
   */
  public async validateConfig(): Promise<void> {
    // Get config first
    const config = await this.getConfig();
    const breakdownDir = join(this.workingDir, ".agent", "breakdown");
    // Check for existence of the correct absolute paths
    const requiredDirs = [
      breakdownDir,
    ];
    if (config.app_prompt && config.app_prompt.base_dir) {
      requiredDirs.push(join(this.workingDir, ".agent", "breakdown", config.app_prompt.base_dir));
    }
    if (config.app_schema && config.app_schema.base_dir) {
      requiredDirs.push(join(this.workingDir, ".agent", "breakdown", config.app_schema.base_dir));
    }
    for (const dir of requiredDirs) {
      if (!(await exists(dir))) {
        throw new WorkspaceConfigError(`Required directory does not exist: ${dir}`);
      }
    }
  }

  /**
   * Get the prompt base directory path.
   * 
   * @returns {string} The absolute path to the prompt base directory
   */
  public getPromptBaseDir(): string {
    const config = this.config || { app_prompt: { base_dir: "prompts" } };
    const baseDir = config.app_prompt.base_dir || "prompts";
    return isAbsolute(baseDir) ? baseDir : join(this.workingDir, ".agent", "breakdown", baseDir);
  }

  /**
   * Get the schema base directory path.
   * 
   * @returns {string} The absolute path to the schema base directory
   */
  public getSchemaBaseDir(): string {
    const config = this.config || { app_schema: { base_dir: "schemas" } };
    const baseDir = config.app_schema.base_dir || "schemas";
    return isAbsolute(baseDir) ? baseDir : join(this.workingDir, ".agent", "breakdown", baseDir);
  }

  /**
   * Get the working directory path.
   * 
   * @returns {string} The absolute path to the working directory
   */
  public getWorkingDir(): string {
    return this.workingDir;
  }

  /**
   * Set the prompt variables factory.
   * 
   * @param factory - The prompt variables factory to use
   */
  public setPromptVariablesFactory(factory: PromptVariablesFactory) {
    this.promptVariablesFactory = factory;
  }

  /**
   * Resolve the full path for a prompt file.
   * 
   * @param name - The name of the prompt file
   * @returns {string} The absolute path to the prompt file
   */
  public resolvePromptPath(_name: string): string {
    if (!this.promptVariablesFactory) throw new Error("PromptVariablesFactory not set");
    return this.promptVariablesFactory.promptFilePath;
  }

  /**
   * Resolve the full path for a schema file.
   * 
   * @param name - The name of the schema file
   * @returns {string} The absolute path to the schema file
   */
  public resolveSchemaPath(_name: string): string {
    if (!this.promptVariablesFactory) throw new Error("PromptVariablesFactory not set");
    return this.promptVariablesFactory.schemaFilePath;
  }

  /**
   * Resolve the full path for an output file.
   * 
   * @param name - The name of the output file
   * @returns {string} The absolute path to the output file
   */
  public resolveOutputPath(_name: string): string {
    if (!this.promptVariablesFactory) throw new Error("PromptVariablesFactory not set");
    return this.promptVariablesFactory.outputFilePath;
  }

  /**
   * Copy template and schema files to the workspace.
   * 
   * @private
   */
  private async copyTemplatesAndSchemas(): Promise<void> {
    const thisFileDir = dirname(fromFileUrl(import.meta.url));
    const projectRoot = join(thisFileDir, "../..");
    const breakdownDir = join(this.workingDir, ".agent", "breakdown");
    const breakdownConfig = new BreakdownConfig(this.workingDir);
    await breakdownConfig.loadConfig();
    const settings = await breakdownConfig.getConfig();
    const promptBase = settings.app_prompt.base_dir.toString().trim();
    const schemaBase = settings.app_schema.base_dir.toString().trim();
    // prompts
    try {
      const srcPrompts = join(projectRoot, "lib", "breakdown", "prompts");
      const destPrompts = join(breakdownDir, promptBase);
      await ensureDir(destPrompts);
      const srcPromptsExists = await exists(srcPrompts);
      if (srcPromptsExists) {
        // no debug output
      }
      await this.copyDirRecursive(srcPrompts, destPrompts, [".md"]);
    } catch (_e) {
      // no debug output
    }
    // schemas
    try {
      const srcSchemas = join(projectRoot, "lib", "breakdown", "schemas");
      const destSchemas = join(breakdownDir, schemaBase);
      await ensureDir(destSchemas);
      const srcSchemasExists = await exists(srcSchemas);
      if (srcSchemasExists) {
        // no debug output
      }
      await this.copyDirRecursive(srcSchemas, destSchemas);
    } catch (_e) {
      // no debug output
    }
  }

  /**
   * Recursively copy a directory.
   * 
   * @param src - Source directory path
   * @param dest - Destination directory path
   * @param exts - Optional array of file extensions to copy
   * @private
   */
  private async copyDirRecursive(src: string, dest: string, exts?: string[]) {
    for await (const entry of Deno.readDir(src)) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);
      if (entry.isDirectory) {
        await ensureDir(destPath);
        await this.copyDirRecursive(srcPath, destPath, exts);
      } else if (entry.isFile) {
        if (!exts || exts.some((ext) => entry.name.endsWith(ext))) {
          try {
            await Deno.lstat(destPath);
            // 既に存在する場合は上書きしない
          } catch (_e) {
            await Deno.copyFile(srcPath, destPath);
            // no debug output
          }
        }
      }
    }
  }
}

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
  const workspace = new Workspace({ workingDir });
  await workspace.initialize();
}
