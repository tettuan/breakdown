/**
 * Path utilities for managing workspace directory structure and file paths.
 * Provides functionality for path normalization, directory structure validation,
 * and layer-specific path resolution.
 *
 * TODO:
 * 1. Add path validation rules
 * 2. Document path normalization rules
 * 3. Add directory structure validation
 * 4. Improve error handling
 * 5. Enhance configuration integration
 * 6. Add permission checks
 * 7. Document naming conventions
 */

import { ensureDir, exists } from "jsr:@std/fs@^0.224.0";
import { join, normalize, relative } from "jsr:@std/path@^0.224.0";

/**
 * Represents the structure of the working directory.
 * Contains paths for different components of the workspace.
 */
export interface WorkingDirStructure {
  /** Root directory for all projects */
  projects: string;
  /** Directory containing issue tracking data */
  issues: string;
  /** Directory for task management */
  tasks: string;
  /** Temporary directory for workspace operations */
  temp: string;
}

/**
 * Defines the different types of layers in the workspace.
 * Each layer represents a different aspect of the project structure.
 */
export type LayerType = "projects" | "issues" | "tasks" | "temp";

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
 * Validates that the given directory has the required workspace structure.
 * @param workingDir - The directory to validate
 * @returns A WorkingDirStructure object with paths if valid, throws error if invalid
 * @throws {Error} If the directory structure is invalid
 */
export async function validateWorkingDir(
  workingDir: string,
): Promise<WorkingDirStructure> {
  try {
    const structure: WorkingDirStructure = {
      projects: "",
      issues: "",
      tasks: "",
      temp: "",
    };

    // Check each required directory exists
    for (const dir of Object.keys(structure)) {
      const dirPath = join(workingDir, dir);
      if (await exists(dirPath) && (await Deno.stat(dirPath)).isDirectory) {
        structure[dir as keyof WorkingDirStructure] = dirPath;
      } else {
        throw new Error(`Required directory '${dir}' is missing or invalid`);
      }
    }

    return structure;
  } catch (error: unknown) {
    throw new Error(
      `Invalid working directory structure: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Create working directory structure
 * @param workingDir - Working directory path
 * @param structure - Working directory structure
 * @throws {Error} If directory creation fails or permission denied
 */
export async function createWorkingDirStructure(
  workingDir: string,
  structure: WorkingDirStructure,
): Promise<void> {
  try {
    // Check write permissions first
    try {
      const testFile = join(workingDir, ".permission_test");
      await Deno.writeTextFile(testFile, "");
      await Deno.remove(testFile);
    } catch (error) {
      if (error instanceof Deno.errors.PermissionDenied) {
        throw new Error("Permission denied");
      }
      // If the directory doesn't exist yet, we'll try to create it
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }

    // Create base directory
    await ensureDir(workingDir);

    // Create breakdown directory
    const breakdownDir = join(workingDir, "breakdown");
    await ensureDir(breakdownDir);

    // Create subdirectories under breakdown
    for (const [key, _] of Object.entries(structure)) {
      const dirPath = join(breakdownDir, key);
      try {
        await ensureDir(dirPath);
      } catch (error) {
        if (error instanceof Deno.errors.PermissionDenied) {
          throw new Error("Permission denied");
        }
        throw error;
      }
    }
  } catch (error) {
    // If it's already a permission denied error, preserve it
    if (error instanceof Error && error.message.includes("Permission denied")) {
      throw error;
    }
    // Otherwise wrap it in a generic error
    throw new Error(
      `Failed to create working directory structure: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
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
      projects: "projects",
      issues: "issues",
      tasks: "tasks",
      temp: "temp",
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
