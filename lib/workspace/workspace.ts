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

/**
 * Workspace class for managing directory structure and configuration
 */
export class Workspace implements WorkspaceStructure, WorkspaceConfigManager, WorkspacePaths {
  private workingDir: string;
  private promptsDir: string;
  private schemaDir: string;
  private config: WorkspaceConfig | null = null;

  constructor(options: WorkspaceOptions) {
    this.workingDir = options.workingDir;
    const breakdownDir = join(this.workingDir, "breakdown");
    this.promptsDir = options.promptsDir || join(breakdownDir, "prompts");
    this.schemaDir = options.schemaDir || join(breakdownDir, "schemas");
  }

  /**
   * Initialize the workspace by creating required directories and validating configuration
   */
  public async initialize(): Promise<void> {
    // First create the required directories
    await this.ensureDirectories();

    // Then validate the configuration
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
    const breakdownDir = join(this.workingDir, "breakdown");
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
        working_dir: join(this.workingDir, "breakdown"),
        app_prompt: {
          base_dir: this.promptsDir,
        },
        app_schema: {
          base_dir: this.schemaDir,
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
    const requiredDirs = [
      config.working_dir,
      config.app_prompt.base_dir,
      config.app_schema.base_dir,
    ];

    // Check if directories exist
    for (const dir of requiredDirs) {
      if (!(await exists(dir))) {
        throw new WorkspaceConfigError(`Required directory does not exist: ${dir}`);
      }
    }
  }

  /**
   * Get prompts directory path
   */
  public getPromptDir(): string {
    return this.promptsDir;
  }

  /**
   * Get schema directory path
   */
  public getSchemaDir(): string {
    return this.schemaDir;
  }

  /**
   * Get working directory path
   */
  public getWorkingDir(): string {
    return this.workingDir;
  }

  /**
   * Resolve prompt file path
   */
  public resolvePromptPath(name: string): string {
    if (!name) {
      throw new WorkspacePathError("Prompt name is required");
    }
    return join(this.promptsDir, name);
  }

  /**
   * Resolve schema file path
   */
  public resolveSchemaPath(name: string): string {
    if (!name) {
      throw new WorkspacePathError("Schema name is required");
    }
    return join(this.schemaDir, name);
  }

  /**
   * Resolve output file path
   */
  public resolveOutputPath(name: string): string {
    if (!name) {
      throw new WorkspacePathError("Output name is required");
    }
    return join(this.workingDir, name);
  }
}

/**
 * Initialize a new workspace
 */
export async function initWorkspace(workingDir = "."): Promise<void> {
  const workspace = new Workspace({ workingDir });
  await workspace.initialize();
}
