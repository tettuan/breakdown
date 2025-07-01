/**
 * @fileoverview Workspace structure management for Breakdown.
 *
 * This module provides the core implementation for managing workspace directory
 * structures in the Breakdown AI development assistance tool. It handles the
 * creation, validation, and maintenance of the standardized directory layout
 * required for project organization and prompt generation workflows.
 *
 * @module workspace/structure
 */

import { WorkspaceConfig, WorkspaceStructure } from "./interfaces.ts";
import { ensureDir } from "jsr:@std/fs@0.224.0";
import { join } from "jsr:@std/path@0.224.0";
import { WorkspaceInitError } from "./errors.ts";

/**
 * Implementation of the WorkspaceStructure interface for managing the directory
 * structure of the Breakdown workspace.
 *
 * The WorkspaceStructureImpl class orchestrates the creation and maintenance of
 * a standardized directory structure that supports the 3-layer architecture
 * (Project → Issue → Task) used by Breakdown for organizing AI development
 * assistance workflows.
 *
 * @implements {WorkspaceStructure}
 */
export class WorkspaceStructureImpl implements WorkspaceStructure {
  #config: WorkspaceConfig;
  #directories: string[];

  /**
   * Creates a new WorkspaceStructureImpl instance with the specified configuration.
   *
   * Initializes the workspace structure manager with predefined directory paths
   * that follow the Breakdown standard layout for organizing projects, issues,
   * tasks, and supporting files.
   *
   * @param config - The workspace configuration containing working directory
   *                 and other workspace-specific settings
   *
   * @example
   * ```typescript
   * const config = { workingDir: ".agent/breakdown" };
   * const workspace = new WorkspaceStructureImpl(config);
   * await workspace.initialize();
   * ```
   */
  constructor(config: WorkspaceConfig) {
    this.#config = config;
    this.#directories = [
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
   * Initializes the complete workspace structure by ensuring all required
   * directories exist.
   *
   * This method creates the full directory hierarchy needed for Breakdown
   * operations, including directories for projects, issues, tasks, temporary
   * files, configuration, prompts, and schema files.
   *
   * @returns Promise<void> - Resolves when all directories are successfully created
   *
   * @throws {WorkspaceInitError} When directory creation fails or path conflicts exist
   *
   * @example
   * ```typescript
   * const workspace = new WorkspaceStructureImpl(config);
   * await workspace.initialize(); // Creates all required directories
   * ```
   */
  async initialize(): Promise<void> {
    await this.ensureDirectories();
  }

  /**
   * Ensures all required directories exist in the workspace, creating them if necessary.
   *
   * This method validates the existence of each directory in the predefined list
   * and creates any missing directories. It also performs safety checks to ensure
   * that existing paths are actually directories and not files.
   *
   * @returns Promise<void> - Resolves when all directories are verified/created
   *
   * @throws {WorkspaceInitError} When a path exists but is not a directory
   * @throws {Error} When directory creation fails due to permissions or other issues
   *
   * @example
   * ```typescript
   * const workspace = new WorkspaceStructureImpl(config);
   * await workspace.ensureDirectories();
   * // All required directories now exist
   * ```
   */
  async ensureDirectories(): Promise<void> {
    for (const dir of this.#directories) {
      const path = join(this.#config.workingDir, dir);
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
   * Checks if a specified path exists within the workspace.
   *
   * This method verifies the existence of a path relative to the workspace
   * working directory. If no path is provided, it checks the working directory itself.
   *
   * @param path - Optional relative path to check within the workspace.
   *               If not provided, checks the working directory itself
   *
   * @returns Promise<boolean> - True if the path exists, false otherwise
   *
   * @example
   * ```typescript
   * const workspace = new WorkspaceStructureImpl(config);
   *
   * // Check if working directory exists
   * const workspaceExists = await workspace.exists();
   *
   * // Check if specific subdirectory exists
   * const projectsExists = await workspace.exists("projects");
   * ```
   */
  async exists(path?: string): Promise<boolean> {
    try {
      const targetPath = path ? join(this.#config.workingDir, path) : this.#config.workingDir;
      await Deno.stat(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates a new directory at the specified path within the workspace.
   *
   * This method creates a directory (and any necessary parent directories)
   * at the given path relative to the workspace working directory.
   *
   * @param path - The relative path where the directory should be created
   *
   * @returns Promise<void> - Resolves when the directory is successfully created
   *
   * @throws {Error} When directory creation fails due to permissions or invalid paths
   *
   * @example
   * ```typescript
   * const workspace = new WorkspaceStructureImpl(config);
   *
   * // Create a new project directory
   * await workspace.createDirectory("projects/my-new-project");
   *
   * // Create nested directories
   * await workspace.createDirectory("temp/analysis/data");
   * ```
   */
  async createDirectory(path: string): Promise<void> {
    const targetPath = join(this.#config.workingDir, path);
    await ensureDir(targetPath);
  }

  /**
   * Removes a directory and all its contents at the specified path within the workspace.
   *
   * This method recursively deletes a directory and all its subdirectories and files.
   * Use with caution as this operation is irreversible.
   *
   * @param path - The relative path of the directory to remove
   *
   * @returns Promise<void> - Resolves when the directory is successfully removed
   *
   * @throws {Error} When directory removal fails due to permissions or if path doesn't exist
   *
   * @example
   * ```typescript
   * const workspace = new WorkspaceStructureImpl(config);
   *
   * // Remove a temporary directory
   * await workspace.removeDirectory("temp/old-analysis");
   *
   * // Clean up a completed project
   * await workspace.removeDirectory("projects/completed-project");
   * ```
   */
  async removeDirectory(path: string): Promise<void> {
    const targetPath = join(this.#config.workingDir, path);
    await Deno.remove(targetPath, { recursive: true });
  }
}
