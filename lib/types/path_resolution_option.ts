/**
 * @fileoverview PathResolutionOption implementation with Totality principle
 *
 * This module implements PathResolutionOption following Domain-Driven Design
 * principles for the Configuration Management Domain. It provides type-safe
 * path resolution strategies with validation and fallback mechanisms.
 *
 * @module types/path_resolution_option
 */

import { error, ok, Result } from "./result.ts";

/**
 * Path resolution strategies
 */
export type PathResolutionStrategy = "absolute" | "relative" | "workspace";

/**
 * Path validation rule types
 */
export type PathValidationRule =
  | "must-exist"
  | "must-be-directory"
  | "must-be-file"
  | "must-be-readable"
  | "must-be-writable";

/**
 * Error types for path resolution
 */
export type PathResolutionError =
  | { kind: "InvalidStrategy"; strategy: string }
  | { kind: "EmptyBaseDir" }
  | { kind: "InvalidPath"; path: string; reason: string }
  | { kind: "NoValidFallback"; attempts: string[] }
  | { kind: "ValidationFailed"; rule: PathValidationRule; path: string }
  | { kind: "InvalidConfiguration"; details: string }
  | { kind: "BaseDirectoryNotFound"; path: string }
  | { kind: "InvalidParameterCombination"; demonstrativeType: string; layerType: string }
  | { kind: "TemplateNotFound"; attempted: string[]; fallback?: string };

/**
 * Path validation rules configuration
 */
export interface PathValidationRules {
  /** Rules that must be satisfied */
  required: PathValidationRule[];
  /** Rules that should be satisfied but are not critical */
  optional?: PathValidationRule[];
  /** Whether to normalize case for path comparisons */
  normalizeCase?: boolean;
  /** Custom validation function */
  custom?: (path: string) => Result<void, string>;
}

/**
 * PathResolutionOption with Totality principle
 *
 * Provides configuration for path resolution with validation,
 * fallback strategies, and environment-specific behavior.
 */
export class PathResolutionOption {
  private constructor(
    private readonly strategy: PathResolutionStrategy,
    private readonly baseDir: string,
    private readonly fallbacks: readonly string[],
    private readonly validation: PathValidationRules,
  ) {}

  /**
   * Smart Constructor for PathResolutionOption
   */
  static create(
    strategy: string,
    baseDir: string,
    fallbacks: string[] = [],
    validation?: Partial<PathValidationRules>,
  ): Result<PathResolutionOption, PathResolutionError> {
    // Validate strategy
    if (!["absolute", "relative", "workspace"].includes(strategy)) {
      return error({ kind: "InvalidStrategy", strategy });
    }

    // Validate baseDir
    if (!baseDir || baseDir.trim() === "") {
      return error({ kind: "EmptyBaseDir" });
    }

    // Create default validation rules if not provided
    const defaultValidation: PathValidationRules = {
      required: [],
      optional: [],
    };

    const mergedValidation = {
      ...defaultValidation,
      ...validation,
    };

    return ok(
      new PathResolutionOption(
        strategy as PathResolutionStrategy,
        baseDir.trim(),
        [...fallbacks], // Create immutable copy
        mergedValidation,
      ),
    );
  }

  /**
   * Factory method for absolute path resolution
   */
  static absolute(
    baseDir: string,
    validation?: Partial<PathValidationRules>,
  ): Result<PathResolutionOption, PathResolutionError> {
    return PathResolutionOption.create("absolute", baseDir, [], validation);
  }

  /**
   * Factory method for relative path resolution
   */
  static relative(
    baseDir: string,
    fallbacks: string[] = [],
    validation?: Partial<PathValidationRules>,
  ): Result<PathResolutionOption, PathResolutionError> {
    return PathResolutionOption.create("relative", baseDir, fallbacks, validation);
  }

  /**
   * Factory method for workspace-based path resolution
   */
  static workspace(
    workspaceDir: string,
    subDirs: string[] = [],
    validation?: Partial<PathValidationRules>,
  ): Result<PathResolutionOption, PathResolutionError> {
    return PathResolutionOption.create("workspace", workspaceDir, subDirs, validation);
  }

  /**
   * Resolve a path according to the configured strategy
   */
  resolve(path: string): Result<string, PathResolutionError> {
    switch (this.strategy) {
      case "absolute":
        return this.resolveAbsolute(path);
      case "relative":
        return this.resolveRelative(path);
      case "workspace":
        return this.resolveWorkspace(path);
    }
  }

  /**
   * Resolve with fallback paths
   */
  resolveWithFallbacks(path: string): Result<string, PathResolutionError> {
    // Try primary resolution
    const primaryResult = this.resolve(path);
    if (primaryResult.ok) {
      const validationResult = this.validatePath(primaryResult.data);
      if (validationResult.ok) {
        return primaryResult;
      }
    }

    // Try fallbacks
    const attempts: string[] = [path];
    for (const fallback of this.fallbacks) {
      const fallbackPath = this.combinePaths(fallback, path);
      attempts.push(fallbackPath);

      const result = this.resolve(fallbackPath);
      if (result.ok) {
        const validationResult = this.validatePath(result.data);
        if (validationResult.ok) {
          return result;
        }
      }
    }

    return error({ kind: "NoValidFallback", attempts });
  }

  /**
   * Validate a resolved path
   */
  validatePath(resolvedPath: string): Result<void, PathResolutionError> {
    // Check required rules
    for (const rule of this.validation.required) {
      const result = this.checkRule(rule, resolvedPath);
      if (!result.ok) {
        return error({ kind: "ValidationFailed", rule, path: resolvedPath });
      }
    }

    // Check custom validation if provided
    if (this.validation.custom) {
      const customResult = this.validation.custom(resolvedPath);
      if (!customResult.ok) {
        return error({
          kind: "InvalidPath",
          path: resolvedPath,
          reason: customResult.error,
        });
      }
    }

    return ok(undefined);
  }

  /**
   * Get configuration details
   */
  getConfig(): {
    strategy: PathResolutionStrategy;
    baseDir: string;
    fallbacks: readonly string[];
    validationRules: readonly PathValidationRule[];
  } {
    return {
      strategy: this.strategy,
      baseDir: this.baseDir,
      fallbacks: this.fallbacks,
      validationRules: this.validation.required,
    };
  }

  // Private methods

  private resolveAbsolute(path: string): Result<string, PathResolutionError> {
    // For absolute strategy, paths must already be absolute
    if (!this.isAbsolutePath(path)) {
      // Convert to absolute using baseDir
      return ok(this.joinPaths(this.baseDir, path));
    }
    return ok(path);
  }

  private resolveRelative(path: string): Result<string, PathResolutionError> {
    // For relative strategy, resolve from current working directory
    const cwd = Deno.cwd();
    return ok(this.joinPaths(cwd, this.baseDir, path));
  }

  private resolveWorkspace(path: string): Result<string, PathResolutionError> {
    // For workspace strategy, resolve within workspace
    return ok(this.joinPaths(this.baseDir, path));
  }

  private checkRule(rule: PathValidationRule, path: string): Result<void, string> {
    try {
      switch (rule) {
        case "must-exist": {
          const stat = Deno.statSync(path);
          return stat ? ok(undefined) : error("Path does not exist");
        }
        case "must-be-directory": {
          const stat = Deno.statSync(path);
          return stat.isDirectory ? ok(undefined) : error("Path is not a directory");
        }
        case "must-be-file": {
          const stat = Deno.statSync(path);
          return stat.isFile ? ok(undefined) : error("Path is not a file");
        }
        case "must-be-readable": {
          // Try to read permissions
          Deno.statSync(path);
          return ok(undefined);
        }
        case "must-be-writable": {
          // Check write permissions by attempting to open for write
          const file = Deno.openSync(path, { write: true, create: false });
          file.close();
          return ok(undefined);
        }
      }
    } catch {
      return error(`Failed ${rule} check`);
    }
  }

  private isAbsolutePath(path: string): boolean {
    // Unix/Mac absolute paths start with /
    if (path.startsWith("/")) return true;
    // Windows absolute paths
    if (/^[A-Za-z]:[\\/]/.test(path)) return true;
    return false;
  }

  private joinPaths(...parts: string[]): string {
    return parts
      .filter((p) => p && p.trim() !== "")
      .join("/")
      .replace(/\/+/g, "/");
  }

  private combinePaths(base: string, path: string): string {
    if (this.isAbsolutePath(path)) {
      return path;
    }
    return this.joinPaths(base, path);
  }
}

/**
 * Pre-configured path resolution options for common scenarios
 */
export class PathResolutionPresets {
  /**
   * Prompt template path resolution
   */
  static promptTemplates(baseDir: string): Result<PathResolutionOption, PathResolutionError> {
    return PathResolutionOption.create(
      "workspace",
      baseDir,
      ["lib/breakdown/prompts", "prompts", ".breakdown/prompts"],
      {
        required: ["must-exist", "must-be-directory", "must-be-readable"],
      },
    );
  }

  /**
   * Schema file path resolution
   */
  static schemaFiles(baseDir: string): Result<PathResolutionOption, PathResolutionError> {
    return PathResolutionOption.create(
      "workspace",
      baseDir,
      ["lib/breakdown/schema", "schema", ".breakdown/schema"],
      {
        required: ["must-exist", "must-be-directory", "must-be-readable"],
      },
    );
  }

  /**
   * Configuration file path resolution
   */
  static configFiles(workspaceDir: string): Result<PathResolutionOption, PathResolutionError> {
    return PathResolutionOption.create(
      "workspace",
      workspaceDir,
      [".breakdown", ".config/breakdown", "config"],
      {
        required: ["must-be-readable"],
        optional: ["must-exist"],
      },
    );
  }

  /**
   * Output file path resolution
   */
  static outputFiles(baseDir: string): Result<PathResolutionOption, PathResolutionError> {
    return PathResolutionOption.create(
      "relative",
      baseDir,
      ["output", "dist", "."],
      {
        required: ["must-be-writable"],
        custom: (path) => {
          // Ensure parent directory exists
          const parent = path.substring(0, path.lastIndexOf("/"));
          if (parent) {
            try {
              Deno.statSync(parent);
              return ok(undefined);
            } catch {
              return error("Parent directory does not exist");
            }
          }
          return ok(undefined);
        },
      },
    );
  }
}
