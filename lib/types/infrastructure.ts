/**
 * @fileoverview Infrastructure abstractions for Dependency Injection
 * 
 * This module provides interface abstractions for external dependencies
 * following the Dependency Inversion Principle. These interfaces allow
 * for proper dependency injection and testability.
 */

import type { Result } from "./result.ts";

/**
 * File system provider abstraction
 * Abstracts away direct Deno file system operations
 */
export interface FileSystemProvider {
  /**
   * Get file or directory information
   */
  stat(path: string): Promise<Result<Deno.FileInfo, FileSystemError>>;
  
  /**
   * Read text file contents
   */
  readTextFile(path: string): Promise<Result<string, FileSystemError>>;
  
  /**
   * Write text to file
   */
  writeTextFile(path: string, content: string): Promise<Result<void, FileSystemError>>;
  
  /**
   * Create directory
   */
  mkdir(path: string, options?: Deno.MkdirOptions): Promise<Result<void, FileSystemError>>;
  
  /**
   * Check if path exists
   */
  exists(path: string): Promise<boolean>;
}

/**
 * Configuration repository abstraction
 * Handles configuration file operations with type safety
 */
export interface ConfigurationRepository {
  /**
   * Load configuration from file
   */
  load<T>(path: string): Promise<Result<T, ConfigurationError>>;
  
  /**
   * Save configuration to file
   */
  save<T>(path: string, config: T): Promise<Result<void, ConfigurationError>>;
  
  /**
   * Check if configuration exists
   */
  exists(path: string): Promise<boolean>;
}

/**
 * Template repository abstraction
 * Handles template deployment and retrieval
 */
export interface TemplateRepository {
  /**
   * Deploy templates to target directory
   */
  deployTemplates(targetDir: string): Promise<Result<void, TemplateError>>;
  
  /**
   * Get template content by name
   */
  getTemplate(name: string): Promise<Result<string, TemplateError>>;
  
  /**
   * List available templates
   */
  listTemplates(): Promise<Result<string[], TemplateError>>;
}

/**
 * Path resolver abstraction
 * Handles path resolution operations
 */
export interface PathResolver {
  /**
   * Resolve relative path to absolute
   */
  resolve(...paths: string[]): string;
  
  /**
   * Get directory name
   */
  dirname(path: string): string;
  
  /**
   * Join path segments
   */
  join(...paths: string[]): string;
  
  /**
   * Check if path is absolute
   */
  isAbsolute(path: string): boolean;
}

/**
 * File system error types
 */
export interface FileSystemError {
  kind: "FileNotFound" | "PermissionDenied" | "InvalidPath" | "UnknownFileSystemError";
  path: string;
  message: string;
  cause?: unknown;
}

/**
 * Configuration error types
 */
export interface ConfigurationError {
  kind: "ConfigurationNotFound" | "InvalidConfiguration" | "ConfigurationParseError" | "ConfigurationWriteError";
  path?: string;
  message: string;
  cause?: unknown;
}

/**
 * Template error types
 */
export interface TemplateError {
  kind: "TemplateNotFound" | "TemplateDeploymentError" | "InvalidTemplate";
  template?: string;
  message: string;
  cause?: unknown;
}

/**
 * Dependency injection container interface
 * Provides service resolution following DI principles
 */
export interface ServiceContainer {
  /**
   * Get file system provider instance
   */
  getFileSystemProvider(): FileSystemProvider;
  
  /**
   * Get configuration repository instance
   */
  getConfigurationRepository(): ConfigurationRepository;
  
  /**
   * Get template repository instance
   */
  getTemplateRepository(): TemplateRepository;
  
  /**
   * Get path resolver instance
   */
  getPathResolver(): PathResolver;
}

/**
 * Default Deno-based file system provider
 * Implements FileSystemProvider using Deno APIs
 */
export class DenoFileSystemProvider implements FileSystemProvider {
  async stat(path: string): Promise<Result<Deno.FileInfo, FileSystemError>> {
    try {
      const fileInfo = await Deno.stat(path);
      return { ok: true, data: fileInfo };
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: this.mapDenoError(error),
          path,
          message: error instanceof Error ? error.message : String(error),
          cause: error,
        },
      };
    }
  }
  
  async readTextFile(path: string): Promise<Result<string, FileSystemError>> {
    try {
      const content = await Deno.readTextFile(path);
      return { ok: true, data: content };
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: this.mapDenoError(error),
          path,
          message: error instanceof Error ? error.message : String(error),
          cause: error,
        },
      };
    }
  }
  
  async writeTextFile(path: string, content: string): Promise<Result<void, FileSystemError>> {
    try {
      await Deno.writeTextFile(path, content);
      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: this.mapDenoError(error),
          path,
          message: error instanceof Error ? error.message : String(error),
          cause: error,
        },
      };
    }
  }
  
  async mkdir(path: string, options?: Deno.MkdirOptions): Promise<Result<void, FileSystemError>> {
    try {
      await Deno.mkdir(path, options);
      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: this.mapDenoError(error),
          path,
          message: error instanceof Error ? error.message : String(error),
          cause: error,
        },
      };
    }
  }
  
  async exists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch {
      return false;
    }
  }
  
  private mapDenoError(error: unknown): FileSystemError["kind"] {
    if (error instanceof Deno.errors.NotFound) {
      return "FileNotFound";
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      return "PermissionDenied";
    }
    return "UnknownFileSystemError";
  }
}

/**
 * Mock file system provider for testing
 * Implements FileSystemProvider with in-memory operations
 */
export class MockFileSystemProvider implements FileSystemProvider {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();
  
  constructor(initialFiles: Record<string, string> = {}) {
    for (const [path, content] of Object.entries(initialFiles)) {
      this.files.set(path, content);
    }
  }
  
  async stat(path: string): Promise<Result<Deno.FileInfo, FileSystemError>> {
    if (this.files.has(path)) {
      const fileInfo: Deno.FileInfo = {
        isFile: true,
        isDirectory: false,
        isSymlink: false,
        size: this.files.get(path)!.length,
        mtime: new Date(),
        atime: new Date(),
        birthtime: new Date(),
        dev: 0,
        ino: 0,
        mode: 0o644,
        nlink: 1,
        uid: 0,
        gid: 0,
        rdev: 0,
        blksize: 4096,
        blocks: 1,
      };
      return { ok: true, data: fileInfo };
    }
    
    if (this.directories.has(path)) {
      const fileInfo: Deno.FileInfo = {
        isFile: false,
        isDirectory: true,
        isSymlink: false,
        size: 0,
        mtime: new Date(),
        atime: new Date(),
        birthtime: new Date(),
        dev: 0,
        ino: 0,
        mode: 0o755,
        nlink: 1,
        uid: 0,
        gid: 0,
        rdev: 0,
        blksize: 4096,
        blocks: 1,
      };
      return { ok: true, data: fileInfo };
    }
    
    return {
      ok: false,
      error: {
        kind: "FileNotFound",
        path,
        message: `File or directory not found: ${path}`,
      },
    };
  }
  
  async readTextFile(path: string): Promise<Result<string, FileSystemError>> {
    const content = this.files.get(path);
    if (content !== undefined) {
      return { ok: true, data: content };
    }
    
    return {
      ok: false,
      error: {
        kind: "FileNotFound",
        path,
        message: `File not found: ${path}`,
      },
    };
  }
  
  async writeTextFile(path: string, content: string): Promise<Result<void, FileSystemError>> {
    this.files.set(path, content);
    return { ok: true, data: undefined };
  }
  
  async mkdir(path: string, _options?: Deno.MkdirOptions): Promise<Result<void, FileSystemError>> {
    this.directories.add(path);
    return { ok: true, data: undefined };
  }
  
  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.directories.has(path);
  }
  
  /**
   * Test helper: Set file content
   */
  setFile(path: string, content: string): void {
    this.files.set(path, content);
  }
  
  /**
   * Test helper: Create directory
   */
  createDirectory(path: string): void {
    this.directories.add(path);
  }
}