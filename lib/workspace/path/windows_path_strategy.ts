/**
 * Windows path resolution strategy with Totality design.
 *
 * Implements Windows path conventions with:
 * 1. Result types for error handling
 * 2. Smart Constructors for path validation
 * 3. Type-safe path operations
 *
 * @module workspace/path/windows_path_strategy
 */

import { join, normalize } from "@std/path";

// ===== Result Type =====
type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

// ===== Error Types =====
type PathErrorKind =
  | { kind: "INVALID_PATH"; path: string; reason: string }
  | { kind: "NORMALIZATION_FAILED"; path: string; cause: Error }
  | { kind: "SECURITY_VIOLATION"; path: string; violation: string };

// ===== Smart Constructor: Windows Path =====
/**
 * Validated Windows-style path
 */
export class WindowsPath {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static create(path: string): Result<WindowsPath, string> {
    if (!path || path.trim() === "") {
      return { ok: false, error: "Path cannot be empty" };
    }

    // Security: No path traversal
    if (path.includes("..")) {
      return { ok: false, error: "Path traversal detected" };
    }

    // Convert to Windows-style backslashes
    const windowsPath = path.replace(/\//g, "\\");

    // Check for invalid Windows path characters
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(windowsPath)) {
      return { ok: false, error: "Path contains invalid Windows characters" };
    }

    return { ok: true, data: new WindowsPath(windowsPath) };
  }

  toString(): string {
    return this.value;
  }
}

// ===== Smart Constructor: Windows Drive Letter =====
/**
 * Validated Windows drive letter
 */
export class WindowsDriveLetter {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static create(drive: string): Result<WindowsDriveLetter, string> {
    if (!drive || drive.length !== 1) {
      return { ok: false, error: "Drive must be a single letter" };
    }

    const upperDrive = drive.toUpperCase();
    if (!/^[A-Z]$/.test(upperDrive)) {
      return { ok: false, error: "Invalid drive letter" };
    }

    return { ok: true, data: new WindowsDriveLetter(upperDrive) };
  }

  toString(): string {
    return this.value;
  }
}

// ===== Smart Constructor: Windows Base Directory =====
/**
 * Validated base directory for Windows systems
 */
export class WindowsBaseDirectory {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static create(path: string): Result<WindowsBaseDirectory, string> {
    if (!path || path.trim() === "") {
      return { ok: false, error: "Base directory cannot be empty" };
    }

    // Windows absolute path patterns: C:\ or \\server\share
    const drivePattern = /^[A-Za-z]:\\/;
    const uncPattern = /^\\\\/;

    if (!drivePattern.test(path) && !uncPattern.test(path)) {
      return { ok: false, error: "Base directory must be absolute Windows path" };
    }

    // No path traversal in base directory
    if (path.includes("..")) {
      return { ok: false, error: "Path traversal in base directory" };
    }

    return { ok: true, data: new WindowsBaseDirectory(path) };
  }

  toString(): string {
    return this.value;
  }
}

// ===== Windows Path Strategy with Totality =====
/**
 * Windows path resolution strategy with full type safety
 */
export class WindowsPathStrategyTotality {
  private constructor(private baseDir: WindowsBaseDirectory) {}

  /**
   * Creates a new Windows path strategy
   */
  static create(baseDir: string): Result<WindowsPathStrategyTotality, string> {
    const baseDirResult = WindowsBaseDirectory.create(baseDir);
    if (!baseDirResult.ok) {
      return baseDirResult;
    }

    return {
      ok: true,
      data: new WindowsPathStrategyTotality(baseDirResult.data),
    };
  }

  /**
   * Resolves a path with full validation
   */
  resolve(path: string): Promise<Result<string, PathErrorKind>> {
    const pathResult = WindowsPath.create(path);
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

    try {
      const resolved = join(this.baseDir.toString(), pathResult.data.toString());

      // Security check: Ensure resolved path is within base directory
      const normalizedBase = normalize(this.baseDir.toString()).toLowerCase();
      const normalizedResolved = normalize(resolved).toLowerCase();

      if (!normalizedResolved.startsWith(normalizedBase)) {
        return Promise.resolve({
          ok: false,
          error: {
            kind: "SECURITY_VIOLATION",
            path,
            violation: "Path escapes base directory",
          },
        });
      }

      // Return with original casing
      return Promise.resolve({ ok: true, data: normalize(resolved) });
    } catch (error) {
      return Promise.resolve({
        ok: false,
        error: {
          kind: "NORMALIZATION_FAILED",
          path,
          cause: error as Error,
        },
      });
    }
  }

  /**
   * Normalizes a path to Windows format
   */
  normalize(path: string): Result<string, PathErrorKind> {
    try {
      // Convert to Windows-style path
      const windowsPath = path.replace(/\//g, "\\");
      const normalized = normalize(windowsPath);

      // Ensure no double backslashes (except at start for UNC)
      const cleaned = normalized.startsWith("\\\\")
        ? "\\\\" + normalized.substring(2).replace(/\\+/g, "\\")
        : normalized.replace(/\\+/g, "\\");

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
   * Validates a Windows path
   */
  validate(path: string): Promise<Result<boolean, PathErrorKind>> {
    // Check for empty path
    if (!path || path.trim() === "") {
      return Promise.resolve({
        ok: false,
        error: {
          kind: "INVALID_PATH",
          path,
          reason: "Empty path",
        },
      });
    }

    // Check for path traversal
    if (path.includes("..")) {
      return Promise.resolve({
        ok: false,
        error: {
          kind: "SECURITY_VIOLATION",
          path,
          violation: "Path traversal attempt",
        },
      });
    }

    // Check for invalid Windows characters
    // deno-lint-ignore no-control-regex
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    // Allow colon only in drive letter position
    const pathWithoutDrive = path.replace(/^[A-Za-z]:/, "");
    if (invalidChars.test(pathWithoutDrive)) {
      return Promise.resolve({
        ok: false,
        error: {
          kind: "INVALID_PATH",
          path,
          reason: "Path contains invalid Windows characters",
        },
      });
    }

    // Check normalization
    const normalizeResult = this.normalize(path);
    if (!normalizeResult.ok) {
      return Promise.resolve(normalizeResult);
    }

    // Check for double backslashes (except UNC paths)
    if (!path.startsWith("\\\\") && normalizeResult.data.includes("\\\\")) {
      return Promise.resolve({
        ok: false,
        error: {
          kind: "INVALID_PATH",
          path,
          reason: "Path contains double backslashes",
        },
      });
    }

    return Promise.resolve({ ok: true, data: true });
  }

  /**
   * Gets the base directory
   */
  getBaseDir(): string {
    return this.baseDir.toString();
  }
}
