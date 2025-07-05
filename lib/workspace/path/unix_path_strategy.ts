/**
 * Unix path resolution strategy with Totality design.
 *
 * Implements Unix/Linux path conventions with:
 * 1. Result types for error handling
 * 2. Smart Constructors for path validation
 * 3. Type-safe path operations
 *
 * @module workspace/path/unix_path_strategy
 */

import { join, normalize } from "@std/path";

// ===== Result Type =====
type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

// ===== Error Types =====
type PathErrorKind =
  | { kind: "INVALID_PATH"; path: string; reason: string }
  | { kind: "NORMALIZATION_FAILED"; path: string; cause: Error }
  | { kind: "SECURITY_VIOLATION"; path: string; violation: string };

// ===== Smart Constructor: Unix Path =====
/**
 * Validated Unix-style path
 */
export class UnixPath {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static create(path: string): Result<UnixPath, string> {
    if (!path || path.trim() === "") {
      return { ok: false, error: "Path cannot be empty" };
    }

    // Security: No path traversal
    if (path.includes("..")) {
      return { ok: false, error: "Path traversal detected" };
    }

    // Unix paths should use forward slashes
    const normalizedPath = path.replace(/\\/g, "/");

    return { ok: true, data: new UnixPath(normalizedPath) };
  }

  toString(): string {
    return this.value;
  }
}

// ===== Smart Constructor: Base Directory =====
/**
 * Validated base directory for Unix systems
 */
export class UnixBaseDirectory {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static create(path: string): Result<UnixBaseDirectory, string> {
    if (!path || path.trim() === "") {
      return { ok: false, error: "Base directory cannot be empty" };
    }

    // Must be absolute path in Unix
    if (!path.startsWith("/")) {
      return { ok: false, error: "Base directory must be absolute path" };
    }

    // No path traversal in base directory
    if (path.includes("..")) {
      return { ok: false, error: "Path traversal in base directory" };
    }

    return { ok: true, data: new UnixBaseDirectory(path) };
  }

  toString(): string {
    return this.value;
  }
}

// ===== Unix Path Strategy with Totality =====
/**
 * Unix path resolution strategy with full type safety
 */
export class UnixPathStrategyTotality {
  private constructor(private baseDir: UnixBaseDirectory) {}

  /**
   * Creates a new Unix path strategy
   */
  static create(baseDir: string): Result<UnixPathStrategyTotality, string> {
    const baseDirResult = UnixBaseDirectory.create(baseDir);
    if (!baseDirResult.ok) {
      return baseDirResult;
    }

    return {
      ok: true,
      data: new UnixPathStrategyTotality(baseDirResult.data),
    };
  }

  /**
   * Resolves a path with full validation
   */
  async resolve(path: string): Promise<Result<string, PathErrorKind>> {
    const pathResult = UnixPath.create(path);
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

    try {
      const resolved = join(this.baseDir.toString(), pathResult.data.toString());

      // Security check: Ensure resolved path is within base directory
      const normalizedBase = normalize(this.baseDir.toString());
      const normalizedResolved = normalize(resolved);

      if (!normalizedResolved.startsWith(normalizedBase)) {
        return {
          ok: false,
          error: {
            kind: "SECURITY_VIOLATION",
            path,
            violation: "Path escapes base directory",
          },
        };
      }

      return { ok: true, data: normalizedResolved };
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: "NORMALIZATION_FAILED",
          path,
          cause: error as Error,
        },
      };
    }
  }

  /**
   * Normalizes a path to Unix format
   */
  normalize(path: string): Result<string, PathErrorKind> {
    try {
      // Convert to Unix-style path
      const unixPath = path.replace(/\\/g, "/");
      const normalized = normalize(unixPath);

      // Ensure no double slashes remain
      const cleaned = normalized.replace(/\/+/g, "/");

      return { ok: true, data: cleaned };
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: "NORMALIZATION_FAILED",
          path,
          cause: error as Error,
        },
      };
    }
  }

  /**
   * Validates a Unix path
   */
  validate(path: string): Result<boolean, PathErrorKind> {
    // Check for empty path
    if (!path || path.trim() === "") {
      return {
        ok: false,
        error: {
          kind: "INVALID_PATH",
          path,
          reason: "Empty path",
        },
      };
    }

    // Check for path traversal
    if (path.includes("..")) {
      return {
        ok: false,
        error: {
          kind: "SECURITY_VIOLATION",
          path,
          violation: "Path traversal attempt",
        },
      };
    }

    // Check for invalid characters in Unix
    const invalidChars = /[\x00-\x1f\x7f]/;
    if (invalidChars.test(path)) {
      return {
        ok: false,
        error: {
          kind: "INVALID_PATH",
          path,
          reason: "Path contains invalid control characters",
        },
      };
    }

    // Check normalization doesn't change the path significantly
    const normalizeResult = this.normalize(path);
    if (!normalizeResult.ok) {
      return normalizeResult;
    }

    return { ok: true, data: true };
  }

  /**
   * Gets the base directory
   */
  getBaseDir(): string {
    return this.baseDir.toString();
  }
}
