/**
 * Path utilities for handling file paths and directory structures
 * Uses URL API for robust path handling as per Deno best practices
 *
 * This module provides utilities for:
 * - Path normalization
 * - Working directory validation
 * - Layer path resolution
 * - Directory structure creation
 *
 * SPECIFICATION DISCREPANCIES AND REQUIRED CHANGES
 *
 * 1. Path Resolution:
 *    - URL-based path resolution needs implementation per path.ja.md
 *    - Path normalization rules need documentation and implementation
 *    - Path completion rules need specification
 *    - Path validation needs enhancement
 *
 * 2. Directory Structure:
 *    - Directory naming conventions need documentation
 *    - Required file checks need implementation
 *    - Directory permissions need specification
 *    - Directory structure validation needs enhancement
 *
 * 3. Layer Path Resolution:
 *    - Layer type validation needs improvement
 *    - Layer path completion rules need documentation
 *    - Layer directory structure needs specification
 *    - Layer path validation needs enhancement
 *
 * 4. Error Handling:
 *    - Error message language consistency needed
 *    - Error recovery procedures need documentation
 *    - Error types need specification
 *    - Validation error handling needs improvement
 *
 * 5. Configuration Integration:
 *    - Config-based path resolution needs implementation
 *    - Environment variable handling needs completion
 *    - Working directory configuration needs enhancement
 *    - Path configuration validation needs improvement
 *
 * TODO:
 * 1. Implement URL-based path resolution
 * 2. Document path normalization rules
 * 3. Add directory structure validation
 * 4. Improve error handling
 * 5. Enhance configuration integration
 * 6. Add permission checks
 * 7. Document naming conventions
 */

import { join, normalize, relative } from "jsr:@std/path";
import { exists } from "jsr:@std/fs";

/**
 * Structure of the working directory
 */
export interface WorkingDirStructure {
  projects: boolean;
  issues: boolean;
  tasks: boolean;
  temp: boolean;
}

/**
 * Layer types for path resolution
 */
export type LayerType = "project" | "issue" | "task";

/**
 * Normalizes a file path
 * @throws {Error} If path is invalid or empty
 */
export function normalizePath(path: string): string {
  if (!path) {
    throw new Error("Path is required");
  }

  try {
    // Normalize the path using the path module
    let normalizedPath = normalize(path);

    // Ensure relative paths start with "./"
    if (!normalizedPath.startsWith(".") && !normalizedPath.startsWith("/")) {
      normalizedPath = `./${normalizedPath}`;
    }

    return normalizedPath;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid path format: ${message}`);
  }
}

/**
 * Validates the working directory structure
 * @throws {Error} If working directory is invalid or inaccessible
 */
export async function validateWorkingDir(workingDir: string): Promise<WorkingDirStructure> {
  if (!workingDir) {
    throw new Error("Working directory is required");
  }

  try {
    const structure: WorkingDirStructure = {
      projects: false,
      issues: false,
      tasks: false,
      temp: false,
    };

    // Check each required directory
    for (const dir of Object.keys(structure)) {
      const dirPath = join(workingDir, dir);
      structure[dir as keyof WorkingDirStructure] = await exists(dirPath) &&
        (await Deno.stat(dirPath)).isDirectory;
    }

    return structure;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to validate working directory: ${message}`);
  }
}

/**
 * Creates the required directory structure
 * @throws {Error} If directory creation fails
 */
export async function createWorkingDirStructure(workingDir: string): Promise<void> {
  if (!workingDir) {
    throw new Error("Working directory is required");
  }

  try {
    // Create parent directory
    await Deno.mkdir(workingDir, { recursive: true });

    // Create required directories
    const dirs = ["projects", "issues", "tasks", "temp"];
    for (const dir of dirs) {
      const dirPath = join(workingDir, dir);
      await Deno.mkdir(dirPath, { recursive: true });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create directory structure: ${message}`);
  }
}

/**
 * Resolves a file path to its layer-specific location
 * @throws {Error} If path resolution fails
 */
export function resolveLayerPath(
  filePath: string | undefined,
  layer: LayerType,
  workingDir: string,
): string {
  if (!filePath) {
    throw new Error("File path is required");
  }
  if (!workingDir) {
    throw new Error("Working directory is required");
  }

  try {
    const layerDirs = {
      project: "projects",
      issue: "issues",
      task: "tasks",
    };

    const layerDir = layerDirs[layer];
    if (!layerDir) {
      throw new Error(`Invalid layer type: ${layer}`);
    }

    // If path is absolute, make it relative to working directory
    const relativePath = filePath.startsWith("/") || filePath.match(/^[A-Za-z]:\\/)
      ? relative(workingDir, filePath)
      : filePath;

    // Join the layer directory with the relative path
    return join(workingDir, layerDir, relativePath);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to resolve layer path: ${message}`);
  }
}
