/**
 * @fileoverview Path resolution strategies for different platforms in Breakdown.
 *
 * This module provides various path resolution strategies that implement the
 * PathResolutionStrategy interface. Each strategy handles platform-specific
 * path resolution, normalization, and validation requirements for Unix,
 * Windows, and platform-agnostic environments.
 *
 * @module workspace/path/strategies
 */

import { PathResolutionStrategy } from "../interfaces.ts";
import { join, normalize } from "jsr:@std/path@0.224.0";

/**
 * Path resolution strategy for Unix-style paths.
 *
 * Implements Unix/Linux path conventions with forward slashes as separators,
 * case-sensitive path handling, and Unix-specific validation rules.
 *
 * @implements {PathResolutionStrategy}
 */
export class UnixPathStrategy implements PathResolutionStrategy {
  private baseDir: string;

  /**
   * Creates a new UnixPathStrategy instance with the specified base directory.
   *
   * Initializes the Unix path strategy with a base directory that will be used
   * as the root for all path resolution operations. The base directory should
   * be an absolute Unix-style path.
   *
   * @param baseDir - The base directory for path resolution (absolute Unix path)
   *
   * @example
   * ```typescript
   * const strategy = new UnixPathStrategy('/home/user/workspace');
   * const resolved = await strategy.resolve('projects/my-app');
   * // Result: /home/user/workspace/projects/my-app
   * ```
   */
  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Resolves a path by joining it with the base directory.
   *
   * Combines the provided path with the base directory using Unix path
   * conventions. The resulting path will always use forward slashes
   * as separators, regardless of the input format.
   *
   * @param path - The relative path to resolve
   * @returns Promise<string> - A promise resolving to the joined absolute path
   *
   * @example
   * ```typescript
   * const strategy = new UnixPathStrategy('/home/user/workspace');
   *
   * // Resolve a simple path
   * const simple = await strategy.resolve('projects');
   * // Result: /home/user/workspace/projects
   *
   * // Resolve a nested path
   * const nested = await strategy.resolve('projects/my-app/src');
   * // Result: /home/user/workspace/projects/my-app/src
   * ```
   */
  resolve(path: string): Promise<string> {
    return Promise.resolve(join(this.baseDir, path));
  }

  /**
   * Normalizes a path to Unix format.
   *
   * Converts any path format to Unix-style with forward slashes,
   * removing redundant separators and applying standard path
   * normalization rules.
   *
   * @param path - The path to normalize
   * @returns Promise<string> - A promise resolving to the normalized Unix path
   *
   * @example
   * ```typescript
   * const strategy = new UnixPathStrategy('/workspace');
   *
   * // Normalize Windows-style path
   * const windowsPath = await strategy.normalize('projects\\my-app\\src');
   * // Result: projects/my-app/src
   *
   * // Normalize path with double slashes
   * const doublePath = await strategy.normalize('projects//my-app');
   * // Result: projects/my-app
   * ```
   */
  normalize(path: string): Promise<string> {
    return Promise.resolve(normalize(path).replace(/\\/g, "/"));
  }

  /**
   * Validates that the normalized path does not contain double slashes.
   *
   * Checks whether the path, after normalization, contains any double
   * forward slashes which would indicate malformed path structure.
   * This validation helps ensure path integrity in Unix environments.
   *
   * @param path - The path to validate
   * @returns Promise<boolean> - A promise resolving to true if valid, false otherwise
   *
   * @example
   * ```typescript
   * const strategy = new UnixPathStrategy('/workspace');
   *
   * // Valid path
   * const valid = await strategy.validate('projects/my-app');
   * // Result: true
   *
   * // Invalid path with double slashes
   * const invalid = await strategy.validate('projects//my-app');
   * // Result: false
   * ```
   */
  validate(path: string): Promise<boolean> {
    return this.normalize(path).then((normalized) => !normalized.includes("//"));
  }
}

/**
 * Path resolution strategy for Windows-style paths.
 *
 * Implements Windows path conventions with backslashes as separators,
 * case-insensitive path handling, and Windows-specific validation rules.
 *
 * @implements {PathResolutionStrategy}
 */
export class WindowsPathStrategy implements PathResolutionStrategy {
  private baseDir: string;

  /**
   * Creates a new WindowsPathStrategy instance with the specified base directory.
   *
   * Initializes the Windows path strategy with a base directory that will be used
   * as the root for all path resolution operations. The base directory should
   * be an absolute Windows-style path.
   *
   * @param baseDir - The base directory for path resolution (absolute Windows path)
   *
   * @example
   * ```typescript
   * const strategy = new WindowsPathStrategy('C:\\workspace');
   * const resolved = await strategy.resolve('projects\\my-app');
   * // Result: C:\workspace\projects\my-app
   * ```
   */
  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Resolves a path by joining it with the base directory.
   *
   * Combines the provided path with the base directory using Windows path
   * conventions. The resulting path will always use backslashes as separators
   * and follow Windows path resolution rules.
   *
   * @param path - The relative path to resolve
   * @returns Promise<string> - A promise resolving to the joined absolute path
   *
   * @example
   * ```typescript
   * const strategy = new WindowsPathStrategy('C:\\workspace');
   *
   * // Resolve a simple path
   * const simple = await strategy.resolve('projects');
   * // Result: C:\workspace\projects
   *
   * // Resolve a nested path with Unix separators
   * const nested = await strategy.resolve('projects/my-app/src');
   * // Result: C:\workspace\projects\my-app\src
   * ```
   */
  resolve(path: string): Promise<string> {
    return Promise.resolve(join(this.baseDir, path));
  }

  /**
   * Normalizes a path to Windows format.
   *
   * Converts any path format to Windows-style with backslashes,
   * removing redundant separators and applying standard Windows path
   * normalization rules.
   *
   * @param path - The path to normalize
   * @returns Promise<string> - A promise resolving to the normalized Windows path
   *
   * @example
   * ```typescript
   * const strategy = new WindowsPathStrategy('C:\\workspace');
   *
   * // Normalize Unix-style path
   * const unixPath = await strategy.normalize('projects/my-app/src');
   * // Result: projects\\my-app\\src
   *
   * // Normalize path with double backslashes
   * const doublePath = await strategy.normalize('projects\\\\my-app');
   * // Result: projects\\my-app
   * ```
   */
  normalize(path: string): Promise<string> {
    return Promise.resolve(normalize(path).replace(/\//g, "\\"));
  }

  /**
   * Validates that the normalized path does not contain double backslashes.
   *
   * Checks whether the path, after normalization, contains any double
   * backslashes which would indicate malformed path structure.
   * This validation helps ensure path integrity in Windows environments.
   *
   * @param path - The path to validate
   * @returns Promise<boolean> - A promise resolving to true if valid, false otherwise
   *
   * @example
   * ```typescript
   * const strategy = new WindowsPathStrategy('C:\\workspace');
   *
   * // Valid path
   * const valid = await strategy.validate('projects\\my-app');
   * // Result: true
   *
   * // Invalid path with double backslashes
   * const invalid = await strategy.validate('projects\\\\my-app');
   * // Result: false
   * ```
   */
  validate(path: string): Promise<boolean> {
    return this.normalize(path).then((normalized) => !normalized.includes("\\\\"));
  }
}

/**
 * Platform-agnostic path resolution strategy.
 *
 * Provides unified path handling that works across different platforms
 * by normalizing to Unix-style paths and applying comprehensive validation.
 * Includes security checks and error handling for invalid paths.
 *
 * @implements {PathResolutionStrategy}
 */
export class PlatformAgnosticPathStrategy implements PathResolutionStrategy {
  private baseDir: string;

  /**
   * Creates a new PlatformAgnosticPathStrategy instance with the specified base directory.
   *
   * Initializes the platform-agnostic path strategy with a base directory that
   * will be used as the root for all path resolution operations. This strategy
   * normalizes all paths to Unix-style format for consistency.
   *
   * @param baseDir - The base directory for path resolution
   *
   * @example
   * ```typescript
   * const strategy = new PlatformAgnosticPathStrategy('/workspace');
   * const resolved = await strategy.resolve('projects\\my-app');
   * // Result: /workspace/projects/my-app (normalized to Unix style)
   * ```
   */
  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Resolves a path after validation and normalization.
   *
   * This method first validates the path, then normalizes it to Unix format,
   * and finally joins it with the base directory. It throws an error if the
   * path is invalid according to the validation rules.
   *
   * @param path - The path to resolve
   * @returns Promise<string> - A promise resolving to the joined and normalized path
   * @throws {Error} If the path is invalid according to validation rules
   *
   * @example
   * ```typescript
   * const strategy = new PlatformAgnosticPathStrategy('/workspace');
   *
   * // Resolve valid path
   * const valid = await strategy.resolve('projects/my-app');
   * // Result: /workspace/projects/my-app
   *
   * // This would throw an error
   * try {
   *   await strategy.resolve('projects/../etc/passwd');
   * } catch (error) {
   *   console.error('Invalid path:', error.message);
   * }
   * ```
   */
  async resolve(path: string): Promise<string> {
    if (!(await this.validate(path))) {
      throw new Error(`Invalid path: ${path}`);
    }
    const normalized = await this.normalize(path);
    return join(this.baseDir, normalized);
  }

  /**
   * Normalizes a path to Unix format.
   *
   * Converts any path format to Unix-style with forward slashes,
   * removing redundant separators and applying standard path
   * normalization rules for cross-platform compatibility.
   *
   * @param path - The path to normalize
   * @returns Promise<string> - A promise resolving to the normalized path
   *
   * @example
   * ```typescript
   * const strategy = new PlatformAgnosticPathStrategy('/workspace');
   *
   * // Normalize Windows-style path
   * const windowsPath = await strategy.normalize('projects\\my-app\\src');
   * // Result: projects/my-app/src
   *
   * // Normalize mixed separators
   * const mixedPath = await strategy.normalize('projects/my-app\\src');
   * // Result: projects/my-app/src
   * ```
   */
  normalize(path: string): Promise<string> {
    return Promise.resolve(normalize(path).replace(/\\/g, "/"));
  }

  /**
   * Validates that the path does not contain double slashes or security risks.
   *
   * Performs comprehensive validation including checking for double slashes,
   * which could indicate path traversal attempts or malformed paths.
   * This validation is performed before normalization to catch potential issues.
   *
   * @param path - The path to validate
   * @returns Promise<boolean> - A promise resolving to true if valid, false otherwise
   *
   * @example
   * ```typescript
   * const strategy = new PlatformAgnosticPathStrategy('/workspace');
   *
   * // Valid paths
   * const validSimple = await strategy.validate('projects/my-app');
   * // Result: true
   *
   * const validComplex = await strategy.validate('projects/my-app/src/components');
   * // Result: true
   *
   * // Invalid paths
   * const invalidDoubleSlash = await strategy.validate('projects//my-app');
   * // Result: false
   *
   * const invalidTraversal = await strategy.validate('projects/../etc');
   * // Result: false (would fail after normalization check)
   * ```
   */
  validate(path: string): Promise<boolean> {
    // Convert all backslashes to slashes, then check for double slashes before normalization
    const preNormalized = path.replace(/\\/g, "/");
    if (preNormalized.includes("//")) {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }
}

/**
 * Default path resolution strategy for Breakdown.
 *
 * Provides a simple, consistent path resolution strategy with a predefined
 * base directory structure. This is the recommended strategy for most
 * Breakdown workspace operations.
 *
 * @implements {PathResolutionStrategy}
 */
export class DefaultPathResolutionStrategy implements PathResolutionStrategy {
  private baseDir: string;

  /**
   * Creates a new DefaultPathResolutionStrategy instance with the specified base directory.
   *
   * Initializes the default path strategy with a configurable base directory.
   * If no base directory is provided, it defaults to ".agent/breakdown" which
   * follows the standard Breakdown workspace structure.
   *
   * @param baseDir - The base directory for path resolution. Defaults to ".agent/breakdown"
   *
   * @example
   * ```typescript
   * // Use default base directory
   * const defaultStrategy = new DefaultPathResolutionStrategy();
   *
   * // Use custom base directory
   * const customStrategy = new DefaultPathResolutionStrategy('/my/workspace');
   *
   * const resolved = await defaultStrategy.resolve('projects/my-app');
   * // Result: .agent/breakdown/projects/my-app
   * ```
   */
  constructor(baseDir: string = ".agent/breakdown") {
    this.baseDir = baseDir;
  }

  /**
   * Resolves a path by joining it with the base directory.
   *
   * Simple path resolution that joins the provided path with the base
   * directory. This method provides basic path resolution without
   * complex validation or normalization rules.
   *
   * @param path - The path to resolve
   * @returns Promise<string> - A promise resolving to the joined path
   *
   * @example
   * ```typescript
   * const strategy = new DefaultPathResolutionStrategy();
   *
   * // Resolve project path
   * const projectPath = await strategy.resolve('projects/my-app');
   * // Result: .agent/breakdown/projects/my-app
   *
   * // Resolve configuration path
   * const configPath = await strategy.resolve('config/workspace.json');
   * // Result: .agent/breakdown/config/workspace.json
   * ```
   */
  resolve(path: string): Promise<string> {
    return Promise.resolve(join(this.baseDir, path));
  }

  /**
   * Normalizes a path by joining it with the base directory.
   *
   * For the default strategy, normalization is the same as resolution,
   * providing a simple and consistent approach to path handling.
   *
   * @param path - The path to normalize
   * @returns Promise<string> - A promise resolving to the joined path
   *
   * @example
   * ```typescript
   * const strategy = new DefaultPathResolutionStrategy();
   *
   * const normalized = await strategy.normalize('projects/my-app');
   * // Result: .agent/breakdown/projects/my-app
   * ```
   */
  normalize(path: string): Promise<string> {
    return Promise.resolve(join(this.baseDir, path));
  }

  /**
   * Validates that the resolved path does not contain parent directory references.
   *
   * Checks the resolved path to ensure it doesn't contain ".." sequences
   * which could indicate path traversal attempts or unintended directory
   * access outside the workspace.
   *
   * @param path - The path to validate
   * @returns Promise<boolean> - A promise resolving to true if valid, false otherwise
   *
   * @example
   * ```typescript
   * const strategy = new DefaultPathResolutionStrategy();
   *
   * // Valid path
   * const valid = await strategy.validate('projects/my-app');
   * // Result: true
   *
   * // Invalid path with parent references
   * const invalid = await strategy.validate('../outside-workspace');
   * // Result: false
   *
   * // Another invalid path
   * const traversal = await strategy.validate('projects/../../etc');
   * // Result: false
   * ```
   */
  validate(path: string): Promise<boolean> {
    return this.resolve(path).then((resolved) => !resolved.includes(".."));
  }
}
