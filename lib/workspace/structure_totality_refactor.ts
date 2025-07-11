/**
 * Workspace structure management with Totality design applied.
 *
 * This refactored version applies:
 * 1. Result types for error handling
 * 2. Configuration-driven directory structure
 * 3. Smart Constructors for path validation
 * 4. Separation of concerns
 *
 * @module workspace/structure_totality_refactor
 */

import { ensureDir } from "@std/fs";
import { join } from "@std/path";

// ===== Result Type =====
type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

// ===== Error Types =====
type StructureErrorKind =
  | { kind: "PATH_NOT_DIRECTORY"; path: string }
  | { kind: "PERMISSION_DENIED"; path: string; cause: Error }
  | { kind: "INVALID_PATH"; path: string; reason: string }
  | { kind: "IO_ERROR"; message: string; cause: Error }
  | { kind: "NOT_FOUND"; path: string };

// ===== Smart Constructor: Directory Path =====
/**
 * Validated directory path within workspace
 */
export class WorkspaceDirectoryPath {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static create(path: string): Result<WorkspaceDirectoryPath, string> {
    if (!path || path.trim() === "") {
      return { ok: false, error: "Directory path cannot be empty" };
    }

    // Security: No path traversal
    if (path.includes("..") || path.includes("~")) {
      return { ok: false, error: "Path contains unsafe characters" };
    }

    // No absolute paths in workspace
    if (path.startsWith("/") || path.match(/^[A-Za-z]:\\/)) {
      return { ok: false, error: "Absolute paths not allowed in workspace" };
    }

    return { ok: true, data: new WorkspaceDirectoryPath(path.trim()) };
  }

  toString(): string {
    return this.value;
  }
}

// ===== Smart Constructor: Directory Structure Configuration =====
/**
 * Configurable workspace directory structure
 */
export class DirectoryStructureConfig {
  private constructor(
    readonly directories: ReadonlyArray<WorkspaceDirectoryPath>,
  ) {
    Object.freeze(this);
  }

  /**
   * Creates default Breakdown directory structure
   */
  static createDefault(): Result<DirectoryStructureConfig, string> {
    const defaultPaths = [
      ".agent/breakdown/projects",
      ".agent/breakdown/issues",
      ".agent/breakdown/tasks",
      ".agent/breakdown/temp",
      ".agent/breakdown/config",
      ".agent/breakdown/prompts",
      ".agent/breakdown/schema",
    ];

    const validatedPaths: WorkspaceDirectoryPath[] = [];

    for (const path of defaultPaths) {
      const result = WorkspaceDirectoryPath.create(path);
      if (!result.ok) {
        return { ok: false, error: `Invalid default path: ${path}` };
      }
      validatedPaths.push(result.data);
    }

    return {
      ok: true,
      data: new DirectoryStructureConfig(validatedPaths),
    };
  }

  /**
   * Creates custom directory structure
   */
  static createCustom(paths: string[]): Result<DirectoryStructureConfig, string> {
    const validatedPaths: WorkspaceDirectoryPath[] = [];

    for (const path of paths) {
      const result = WorkspaceDirectoryPath.create(path);
      if (!result.ok) {
        return { ok: false, error: `Invalid path: ${path} - ${result.error}` };
      }
      validatedPaths.push(result.data);
    }

    return {
      ok: true,
      data: new DirectoryStructureConfig(validatedPaths),
    };
  }

  /**
   * Merges with additional directories
   */
  withAdditional(paths: string[]): Result<DirectoryStructureConfig, string> {
    const currentPaths = [...this.directories];
    const additionalResult = DirectoryStructureConfig.createCustom(paths);

    if (!additionalResult.ok) {
      return additionalResult;
    }

    return {
      ok: true,
      data: new DirectoryStructureConfig([
        ...currentPaths,
        ...additionalResult.data.directories,
      ]),
    };
  }
}

// ===== Workspace Structure Implementation with Totality =====
/**
 * Manages workspace directory structure with full type safety
 */
export class WorkspaceStructureTotality {
  constructor(
    private workingDir: string,
    private structureConfig: DirectoryStructureConfig,
  ) {}

  /**
   * Creates workspace structure manager
   */
  static create(
    workingDir: string,
    customPaths?: string[],
  ): Result<WorkspaceStructureTotality, string> {
    if (!workingDir || workingDir.trim() === "") {
      return { ok: false, error: "Working directory cannot be empty" };
    }

    const configResult = customPaths
      ? DirectoryStructureConfig.createCustom(customPaths)
      : DirectoryStructureConfig.createDefault();

    if (!configResult.ok) {
      return configResult;
    }

    return {
      ok: true,
      data: new WorkspaceStructureTotality(workingDir, configResult.data),
    };
  }

  /**
   * Initializes the workspace structure
   */
  initialize(): Promise<Result<void, StructureErrorKind>> {
    return this.ensureDirectories();
  }

  /**
   * Ensures all configured directories exist
   */
  async ensureDirectories(): Promise<Result<void, StructureErrorKind>> {
    for (const dirPath of this.structureConfig.directories) {
      const fullPath = join(this.workingDir, dirPath.toString());

      try {
        const stat = await Deno.stat(fullPath);
        if (!stat.isDirectory) {
          return {
            ok: false,
            error: { kind: "PATH_NOT_DIRECTORY", path: fullPath },
          };
        }
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          const createResult = await this.createDirectoryInternal(fullPath);
          if (!createResult.ok) {
            return createResult;
          }
        } else if (error instanceof Deno.errors.PermissionDenied) {
          return {
            ok: false,
            error: {
              kind: "PERMISSION_DENIED",
              path: fullPath,
              cause: error,
            },
          };
        } else {
          return {
            ok: false,
            error: {
              kind: "IO_ERROR",
              message: `Failed to check directory: ${fullPath}`,
              cause: error as Error,
            },
          };
        }
      }
    }

    return { ok: true, data: undefined };
  }

  /**
   * Checks if a path exists within the workspace
   */
  async exists(path?: string): Promise<Result<boolean, StructureErrorKind>> {
    try {
      const targetPath = path ? join(this.workingDir, path) : this.workingDir;
      await Deno.stat(targetPath);
      return { ok: true, data: true };
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return { ok: true, data: false };
      }
      return {
        ok: false,
        error: {
          kind: "IO_ERROR",
          message: "Failed to check path existence",
          cause: error as Error,
        },
      };
    }
  }

  /**
   * Creates a directory with validation
   */
  createDirectory(path: string): Promise<Result<void, StructureErrorKind>> {
    const pathResult = WorkspaceDirectoryPath.create(path);
    if (!pathResult.ok) {
      return Promise.resolve({
        ok: false,
        error: {
          kind: "INVALID_PATH",
          path,
          reason: pathResult.error,
        },
      });
    }

    const fullPath = join(this.workingDir, pathResult.data.toString());
    return this.createDirectoryInternal(fullPath);
  }

  /**
   * Removes a directory with validation
   */
  async removeDirectory(path: string): Promise<Result<void, StructureErrorKind>> {
    const pathResult = WorkspaceDirectoryPath.create(path);
    if (!pathResult.ok) {
      return {
        ok: false,
        error: {
          kind: "INVALID_PATH",
          path,
          reason: pathResult.error,
        },
      };
    }

    const fullPath = join(this.workingDir, pathResult.data.toString());

    try {
      await Deno.remove(fullPath, { recursive: true });
      return { ok: true, data: undefined };
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return {
          ok: false,
          error: { kind: "NOT_FOUND", path: fullPath },
        };
      } else if (error instanceof Deno.errors.PermissionDenied) {
        return {
          ok: false,
          error: {
            kind: "PERMISSION_DENIED",
            path: fullPath,
            cause: error,
          },
        };
      }
      return {
        ok: false,
        error: {
          kind: "IO_ERROR",
          message: `Failed to remove directory: ${fullPath}`,
          cause: error as Error,
        },
      };
    }
  }

  /**
   * Internal directory creation with error handling
   */
  private async createDirectoryInternal(
    fullPath: string,
  ): Promise<Result<void, StructureErrorKind>> {
    try {
      await ensureDir(fullPath);
      return { ok: true, data: undefined };
    } catch (error) {
      if (error instanceof Deno.errors.PermissionDenied) {
        return {
          ok: false,
          error: {
            kind: "PERMISSION_DENIED",
            path: fullPath,
            cause: error,
          },
        };
      }
      return {
        ok: false,
        error: {
          kind: "IO_ERROR",
          message: `Failed to create directory: ${fullPath}`,
          cause: error as Error,
        },
      };
    }
  }

  /**
   * Gets the configured directory structure
   */
  getStructure(): DirectoryStructureConfig {
    return this.structureConfig;
  }

  /**
   * Updates the directory structure configuration
   */
  updateStructure(
    newConfig: DirectoryStructureConfig,
  ): Result<void, string> {
    this.structureConfig = newConfig;
    return { ok: true, data: undefined };
  }
}
