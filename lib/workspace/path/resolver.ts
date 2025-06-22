/**
 * @fileoverview Workspace path resolution implementation for Breakdown.
 *
 * This module provides the core implementation for resolving, normalizing, and
 * validating paths within the Breakdown workspace. It uses configurable strategies
 * to handle different platforms and path resolution requirements, enabling flexible
 * path management across Unix, Windows, and platform-agnostic environments.
 *
 * @module workspace/path/resolver
 */

import { PathResolutionStrategy, WorkspacePathResolver } from "../interfaces.ts";

/**
 * Implementation of the WorkspacePathResolver interface for resolving, normalizing, and validating workspace paths.
 *
 * The WorkspacePathResolverImpl class provides a strategy-pattern implementation
 * for path resolution, allowing different resolution behaviors to be plugged in
 * based on platform requirements or specific use cases.
 *
 * @implements {WorkspacePathResolver}
 */
export class WorkspacePathResolverImpl implements WorkspacePathResolver {
  private strategy: PathResolutionStrategy;

  /**
   * Creates a new WorkspacePathResolverImpl instance with the specified strategy.
   *
   * Initializes the path resolver with a specific resolution strategy that
   * determines how paths are resolved, normalized, and validated. The strategy
   * can be changed later using the updateStrategy method.
   *
   * @param strategy - The path resolution strategy to use for all path operations
   *
   * @example
   * ```typescript
   * const unixStrategy = new UnixPathStrategy('/home/user/workspace');
   * const resolver = new WorkspacePathResolverImpl(unixStrategy);
   *
   * const absolutePath = await resolver.resolve('projects/my-app');
   * // Result: /home/user/workspace/projects/my-app
   * ```
   */
  constructor(strategy: PathResolutionStrategy) {
    this.strategy = strategy;
  }

  /**
   * Resolves a path to its absolute form using the current strategy.
   *
   * This method delegates path resolution to the configured strategy,
   * which typically joins the path with a base directory and applies
   * platform-specific resolution rules.
   *
   * @param path - The relative or partial path to resolve
   * @returns Promise<string> - A promise resolving to the absolute path
   *
   * @example
   * ```typescript
   * const resolver = new WorkspacePathResolverImpl(strategy);
   *
   * // Resolve a project path
   * const projectPath = await resolver.resolve('projects/my-app');
   *
   * // Resolve a nested file path
   * const filePath = await resolver.resolve('issues/auth/login.md');
   * ```
   */
  resolve(path: string): Promise<string> {
    return this.strategy.resolve(path);
  }

  /**
   * Normalizes a path string using the current strategy.
   *
   * Path normalization standardizes the format according to the current
   * strategy's rules, such as converting backslashes to forward slashes
   * on Unix systems or applying case sensitivity rules.
   *
   * @param path - The path string to normalize
   * @returns Promise<string> - A promise resolving to the normalized path
   *
   * @example
   * ```typescript
   * const resolver = new WorkspacePathResolverImpl(unixStrategy);
   *
   * // Normalize Windows-style path on Unix
   * const normalized = await resolver.normalize('projects\\my-app\\src');
   * // Result: projects/my-app/src
   *
   * // Normalize path with redundant separators
   * const clean = await resolver.normalize('projects//my-app');
   * // Result: projects/my-app
   * ```
   */
  normalize(path: string): Promise<string> {
    return this.strategy.normalize(path);
  }

  /**
   * Validates if a path exists or is correct using the current strategy.
   *
   * Path validation checks whether a path meets the current strategy's
   * validation criteria, which may include format checks, security
   * constraints, or existence verification.
   *
   * @param path - The path to validate
   * @returns Promise<boolean> - A promise resolving to true if valid, false otherwise
   *
   * @example
   * ```typescript
   * const resolver = new WorkspacePathResolverImpl(strategy);
   *
   * // Validate a project path
   * const isValid = await resolver.validate('projects/my-app');
   * if (isValid) {
   *   console.log('Path is valid');
   * }
   *
   * // Check for invalid characters or patterns
   * const hasInvalidChars = await resolver.validate('projects/../etc/passwd');
   * // Result: false (contains parent directory references)
   * ```
   */
  validate(path: string): Promise<boolean> {
    return this.strategy.validate(path);
  }

  /**
   * Updates the path resolution strategy.
   *
   * This method allows changing the resolution strategy at runtime,
   * enabling the resolver to adapt to different platforms or requirements
   * without creating a new resolver instance.
   *
   * @param strategy - The new path resolution strategy to use
   *
   * @example
   * ```typescript
   * const resolver = new WorkspacePathResolverImpl(unixStrategy);
   *
   * // Switch to Windows strategy for cross-platform compatibility
   * const windowsStrategy = new WindowsPathStrategy('C:\\workspace');
   * resolver.updateStrategy(windowsStrategy);
   *
   * // Now all path operations use Windows-style resolution
   * const windowsPath = await resolver.resolve('projects/my-app');
   * // Result: C:\workspace\projects\my-app
   * ```
   */
  updateStrategy(strategy: PathResolutionStrategy): void {
    this.strategy = strategy;
  }
}
