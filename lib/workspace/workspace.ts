import { join } from "jsr:@std/path/join";
import { ensureDir } from "@std/fs";
import { exists } from "@std/fs";
import {
  WorkspaceConfig,
  WorkspaceConfigManager,
  WorkspaceOptions,
  WorkspacePaths,
  WorkspaceStructure,
} from "./types.ts";
import {
  WorkspaceConfigError,
  WorkspaceError,
  WorkspaceInitError,
  WorkspacePathError,
} from "./errors.ts";

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
    this.promptsDir = options.promptsDir || join(this.workingDir, "prompts");
    this.schemaDir = options.schemaDir || join(this.workingDir, "schemas");
  }

  /**
   * Initialize the workspace
   */
  public async initialize(): Promise<void> {
    try {
      await this.ensureDirectories();
      await this.validateConfig();
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceInitError(
        `Failed to initialize workspace: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Ensure required directories exist
   */
  public async ensureDirectories(): Promise<void> {
    try {
      await ensureDir(this.workingDir);
      await ensureDir(this.promptsDir);
      await ensureDir(this.schemaDir);
    } catch (error) {
      throw new WorkspaceInitError(
        `Failed to create workspace directories: ${
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
        working_dir: this.workingDir,
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
    const config = await this.getConfig();
    const requiredDirs = [
      config.working_dir,
      config.app_prompt.base_dir,
      config.app_schema.base_dir,
    ];

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
