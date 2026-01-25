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
  kind:
    | "ConfigurationNotFound"
    | "InvalidConfiguration"
    | "ConfigurationParseError"
    | "ConfigurationWriteError";
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
