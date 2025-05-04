import { join } from "@std/path";
import { exists } from "@std/fs";
import {
  WorkspaceConfig,
  WorkspaceConfigManager,
  WorkspaceOptions,
  WorkspacePaths,
  WorkspaceStructure,
} from "./types.ts";
import { WorkspaceConfigError, WorkspaceInitError, WorkspacePathError } from "./errors.ts";
import { stringify } from "jsr:@std/yaml@1.0.6";
import { ensureDir } from "@std/fs";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { PromptVariablesFactory } from "../factory/PromptVariablesFactory.ts";

/**
 * Workspace class and helpers for Breakdown.
 *
 * All configuration access (e.g., prompt base dir, schema base dir) must use BreakdownConfig from @tettuan/breakdownconfig.
 * Do not read YAML or JSON config files directly in this module.
 */
export class Workspace implements WorkspaceStructure, WorkspaceConfigManager, WorkspacePaths {
  private workingDir: string;
  private promptBaseDir: string;
  private schemaBaseDir: string;
  private config: WorkspaceConfig | null = null;
  private promptVariablesFactory?: PromptVariablesFactory;

  constructor(options: WorkspaceOptions) {
    this.workingDir = options.workingDir;
    const breakdownDir = join(this.workingDir, ".agent", "breakdown");
    this.promptBaseDir = options.promptBaseDir || join(breakdownDir, "prompts");
    this.schemaBaseDir = options.schemaBaseDir || join(breakdownDir, "schemas");
  }

  /**
   * Initialize the workspace by creating required directories and validating configuration
   *
   * All config access must use BreakdownConfig, not direct file reads.
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

    // 4. Validate config (check dirs exist)
    await this.validateConfig();
  }

  /**
   * Test if a directory is writable by attempting to create and remove a test file
   * @throws {Error} If directory is not writable
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
   * Ensure required directories exist
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
   * Get workspace configuration
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
   * Validate workspace configuration
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
   * Get prompts directory path
   */
  public getPromptBaseDir(): string {
    // Always return the absolute path to the prompts directory
    const config = this.config || { app_prompt: { base_dir: "prompts" } };
    return join(this.workingDir, ".agent", "breakdown", config.app_prompt.base_dir || "prompts");
  }

  /**
   * Get schema directory path
   * 設定値(app_schema.base_dir)を優先し、未設定時はlib/breakdown/schemaを返す
   */
  public getSchemaBaseDir(): string {
    const config = this.config || { app_schema: { base_dir: "schemas" } };
    return join(this.workingDir, ".agent", "breakdown", config.app_schema.base_dir || "schemas");
  }

  /**
   * Get working directory path
   */
  public getWorkingDir(): string {
    return this.workingDir;
  }

  /**
   * PromptVariablesFactory経由でプロンプトパスを取得
   */
  public setPromptVariablesFactory(factory: PromptVariablesFactory) {
    this.promptVariablesFactory = factory;
  }

  public resolvePromptPath(_name: string): string {
    if (!this.promptVariablesFactory) throw new Error("PromptVariablesFactory not set");
    return this.promptVariablesFactory.promptFilePath;
  }

  public resolveSchemaPath(_name: string): string {
    if (!this.promptVariablesFactory) throw new Error("PromptVariablesFactory not set");
    return this.promptVariablesFactory.schemaFilePath;
  }

  public resolveOutputPath(_name: string): string {
    if (!this.promptVariablesFactory) throw new Error("PromptVariablesFactory not set");
    return this.promptVariablesFactory.outputFilePath;
  }
}

/**
 * Initialize a new workspace
 */
export async function initWorkspace(workingDir = "."): Promise<void> {
  const workspace = new Workspace({ workingDir });
  await workspace.initialize();
}
