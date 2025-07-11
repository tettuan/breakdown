/**
 * Default path resolution strategy with Totality design.
 *
 * Provides a simple default strategy that delegates to platform-agnostic
 * implementation with additional convenience features.
 *
 * @module workspace/path/default_path_strategy
 */

import { PlatformAgnosticStrategyTotality } from "./platform_agnostic_strategy.ts";

// ===== Result Type =====
type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

// ===== Error Types =====
type PathErrorKind =
  | { kind: "INVALID_PATH"; path: string; reason: string }
  | { kind: "NORMALIZATION_FAILED"; path: string; cause: Error }
  | { kind: "SECURITY_VIOLATION"; path: string; violation: string }
  | { kind: "PLATFORM_DETECTION_FAILED"; message: string }
  | { kind: "STRATEGY_CREATION_FAILED"; message: string };

// ===== Default Path Strategy with Totality =====
/**
 * Default path resolution strategy that provides sensible defaults
 * and delegates to platform-agnostic implementation
 */
export class DefaultPathStrategyTotality {
  private constructor(
    private strategy: PlatformAgnosticStrategyTotality,
  ) {}

  /**
   * Creates a default strategy with automatic base directory detection
   */
  static create(baseDir?: string): Result<DefaultPathStrategyTotality, string> {
    // Use current working directory if not specified
    const effectiveBaseDir = baseDir || Deno.cwd();

    const strategyResult = PlatformAgnosticStrategyTotality.create(effectiveBaseDir);
    if (!strategyResult.ok) {
      return strategyResult;
    }

    return {
      ok: true,
      data: new DefaultPathStrategyTotality(strategyResult.data),
    };
  }

  /**
   * Creates a strategy for workspace operations
   */
  static createForWorkspace(): Result<DefaultPathStrategyTotality, string> {
    // Default workspace base directory
    const workspaceDir = ".agent/breakdown";
    return DefaultPathStrategyTotality.create(workspaceDir);
  }

  /**
   * Resolves a path with default handling
   */
  async resolve(path: string): Promise<Result<string, PathErrorKind>> {
    // Handle empty path as current directory
    const effectivePath = path || ".";

    const result = await this.strategy.resolve(effectivePath);
    if (!result.ok) {
      return result;
    }

    return { ok: true, data: result.data };
  }

  /**
   * Normalizes a path with default handling
   */
  normalize(path: string): Result<string, PathErrorKind> {
    // Handle empty path
    if (!path || path.trim() === "") {
      return { ok: true, data: "." };
    }

    return this.strategy.normalize(path);
  }

  /**
   * Validates a path with default rules
   */
  validate(path: string): Promise<Result<boolean, PathErrorKind>> {
    // Empty path is valid (treated as current directory)
    if (!path || path.trim() === "") {
      return Promise.resolve({ ok: true, data: true });
    }

    return this.strategy.validate(path);
  }

  /**
   * Gets the base directory
   */
  getBaseDir(): string {
    return this.strategy.getBaseDir();
  }

  /**
   * Resolves multiple paths in batch
   */
  async resolveMultiple(
    paths: string[],
  ): Promise<Result<string[], PathErrorKind>> {
    const resolved: string[] = [];

    for (const path of paths) {
      const result = await this.resolve(path);
      if (!result.ok) {
        return result;
      }
      resolved.push(result.data);
    }

    return { ok: true, data: resolved };
  }

  /**
   * Creates a child strategy with a subdirectory as base
   */
  async createChild(
    subdir: string,
  ): Promise<Result<DefaultPathStrategyTotality, PathErrorKind>> {
    const resolvedResult = await this.resolve(subdir);
    if (!resolvedResult.ok) {
      return resolvedResult;
    }

    const childResult = DefaultPathStrategyTotality.create(resolvedResult.data);
    if (!childResult.ok) {
      return {
        ok: false,
        error: {
          kind: "STRATEGY_CREATION_FAILED",
          message: childResult.error,
        },
      };
    }

    return { ok: true, data: childResult.data };
  }
}

// ===== Convenience Factory =====
/**
 * Factory for creating commonly used path strategies
 */
export class PathStrategyFactory {
  /**
   * Creates the default strategy
   */
  static createDefault(): Result<DefaultPathStrategyTotality, string> {
    return DefaultPathStrategyTotality.create();
  }

  /**
   * Creates a workspace strategy
   */
  static createWorkspace(): Result<DefaultPathStrategyTotality, string> {
    return DefaultPathStrategyTotality.createForWorkspace();
  }

  /**
   * Creates a project-specific strategy
   */
  static createProject(projectName: string): Result<DefaultPathStrategyTotality, string> {
    const projectDir = `.agent/breakdown/projects/${projectName}`;
    return DefaultPathStrategyTotality.create(projectDir);
  }

  /**
   * Creates a temporary directory strategy
   */
  static createTemp(): Result<DefaultPathStrategyTotality, string> {
    const tempDir = ".agent/breakdown/temp";
    return DefaultPathStrategyTotality.create(tempDir);
  }
}
