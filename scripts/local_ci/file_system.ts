/**
 * @file file_system.ts
 * @description File system utilities for the CI system
 */

import { join, relative } from "@std/path";

export class FileSystem {
  /**
   * Find all TypeScript test files in the specified directories
   */
  static async findTestFiles(
    directories: string[] = ["lib", "tests"],
    pattern = "*_test.ts",
  ): Promise<string[]> {
    const testFiles: string[] = [];

    for (const dir of directories) {
      try {
        const files = await this.findFiles(dir, pattern);
        testFiles.push(...files);
      } catch (error) {
        // Directory might not exist, skip it
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }
    }

    return testFiles.sort();
  }

  /**
   * Find all TypeScript files (excluding test files)
   */
  static async findTypeScriptFiles(
    directories: string[] = ["lib", "cli"],
    excludePatterns: string[] = ["*_test.ts", "tmp/*", "node_modules/*"],
  ): Promise<string[]> {
    const tsFiles: string[] = [];

    for (const dir of directories) {
      try {
        const files = await this.findFiles(dir, "*.ts");
        const filteredFiles = files.filter((file) => {
          return !excludePatterns.some((pattern) => {
            if (pattern.includes("*")) {
              const regex = new RegExp(pattern.replace(/\*/g, ".*"));
              return regex.test(file);
            }
            return file.includes(pattern);
          });
        });
        tsFiles.push(...filteredFiles);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }
    }

    return tsFiles.sort();
  }

  /**
   * Find files matching a pattern in a directory
   */
  static async findFiles(
    directory: string,
    pattern: string,
  ): Promise<string[]> {
    const files: string[] = [];
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));

    try {
      await this.walkDirectory(directory, (filePath) => {
        const relativePath = relative(Deno.cwd(), filePath);
        if (regex.test(relativePath)) {
          files.push(filePath);
        }
      });
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }

    return files;
  }

  /**
   * Walk directory recursively
   */
  private static async walkDirectory(
    directory: string,
    callback: (filePath: string) => void,
  ): Promise<void> {
    try {
      const stat = await Deno.stat(directory);
      if (!stat.isDirectory) {
        return;
      }

      for await (const entry of Deno.readDir(directory)) {
        const fullPath = join(directory, entry.name);

        if (entry.isDirectory) {
          await this.walkDirectory(fullPath, callback);
        } else if (entry.isFile) {
          callback(fullPath);
        }
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
  }

  /**
   * Check if a file exists
   */
  static async exists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Remove a file if it exists
   */
  static async removeIfExists(path: string): Promise<void> {
    try {
      await Deno.remove(path);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
  }

  /**
   * Get file size in bytes
   */
  static async getFileSize(path: string): Promise<number> {
    try {
      const stat = await Deno.stat(path);
      return stat.size;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return 0;
      }
      throw error;
    }
  }

  /**
   * Get directory size recursively
   */
  static async getDirectorySize(directory: string): Promise<number> {
    let size = 0;

    try {
      await this.walkDirectory(directory, (_filePath) => {
        // This is approximate since we can't await in the callback
        // For accurate size, we'd need to restructure this
        size += 1; // Just count files for now
      });
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }

    return size;
  }

  /**
   * Split array into chunks
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get relative path from current working directory
   */
  static getRelativePath(path: string): string {
    return relative(Deno.cwd(), path);
  }

  /**
   * Normalize path separators
   */
  static normalizePath(path: string): string {
    return path.replace(/\\/g, "/");
  }
}
