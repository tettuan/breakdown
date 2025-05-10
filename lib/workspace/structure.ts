import { WorkspaceStructure, WorkspaceConfig } from "./interfaces.ts";
import { ensureDir } from "jsr:@std/fs@0.224.0";
import { join } from "jsr:@std/path@0.224.0";
import { WorkspaceInitError } from "./errors.ts";

export class WorkspaceStructureImpl implements WorkspaceStructure {
  private config: WorkspaceConfig;
  private directories: string[];

  constructor(config: WorkspaceConfig) {
    this.config = config;
    this.directories = [
      ".agent/breakdown/projects",
      ".agent/breakdown/issues",
      ".agent/breakdown/tasks",
      ".agent/breakdown/temp",
      ".agent/breakdown/config",
      ".agent/breakdown/prompts",
      ".agent/breakdown/schemas",
    ];
  }

  async initialize(): Promise<void> {
    await this.ensureDirectories();
  }

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

  async exists(path?: string): Promise<boolean> {
    try {
      const targetPath = path ? join(this.config.workingDir, path) : this.config.workingDir;
      await Deno.stat(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  async createDirectory(path: string): Promise<void> {
    const targetPath = join(this.config.workingDir, path);
    await ensureDir(targetPath);
  }

  async removeDirectory(path: string): Promise<void> {
    const targetPath = join(this.config.workingDir, path);
    await Deno.remove(targetPath, { recursive: true });
  }
} 