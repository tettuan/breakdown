import { WorkspaceConfig, WorkspaceStructure } from "./interfaces.ts";
import { ensureDir } from "jsr:@std/fs@0.224.0";
import { join } from "jsr:@std/path@0.224.0";
import { WorkspaceInitError } from "./errors.ts";

/**
 * Implementation of the WorkspaceStructure interface for managing the directory structure of the Breakdown workspace.
 */
export class WorkspaceStructureImpl implements WorkspaceStructure {
  private config: WorkspaceConfig;
  private directories: string[];

  /**
   * Creates a new WorkspaceStructureImpl instance.
   * @param config The workspace configuration.
   */
  constructor(config: WorkspaceConfig) {
    this.config = config;
    this.directories = [
      ".agent/breakdown/projects",
      ".agent/breakdown/issues",
      ".agent/breakdown/tasks",
      ".agent/breakdown/temp",
      ".agent/breakdown/config",
      ".agent/breakdown/prompts",
      ".agent/breakdown/schema",
    ];
  }

  /**
   * Initializes the workspace structure by ensuring all required directories exist.
   */
  async initialize(): Promise<void> {
    await this.ensureDirectories();
  }

  /**
   * Ensures all required directories exist in the workspace.
   * Creates them if they do not exist.
   */
  async ensureDirectories(): Promise<void> {
    for (const dir of this.directories) {
      const path = join(this.config.workingDir, dir);
      try {
        const stat = await Deno.stat(path);
        if (!stat.isDirectory) {
          throw new WorkspaceInitError(`Path exists but is not a directory: ${path}`);
        }
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          await ensureDir(path);
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Checks if a path exists in the workspace.
   * @param path The path to check. If not provided, checks the working directory.
   * @returns True if the path exists, false otherwise.
   */
  async exists(path?: string): Promise<boolean> {
    try {
      const targetPath = path ? join(this.config.workingDir, path) : this.config.workingDir;
      await Deno.stat(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates a directory at the specified path in the workspace.
   * @param path The path of the directory to create.
   */
  async createDirectory(path: string): Promise<void> {
    const targetPath = join(this.config.workingDir, path);
    await ensureDir(targetPath);
  }

  /**
   * Removes a directory at the specified path in the workspace.
   * @param path The path of the directory to remove.
   */
  async removeDirectory(path: string): Promise<void> {
    const targetPath = join(this.config.workingDir, path);
    await Deno.remove(targetPath, { recursive: true });
  }
}
