/**
 * Platform-agnostic path resolution strategy with Totality design.
 *
 * Provides unified path handling across different platforms with:
 * 1. Result types for comprehensive error handling
 * 2. Smart Constructors for secure path validation
 * 3. Platform-independent normalization
 *
 * @module workspace/path/platform_agnostic_strategy
 */

import { join, normalize, SEPARATOR } from "@std/path";

// ===== Result Type =====
type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

// ===== Error Types =====
type PathErrorKind =
  | { kind: "INVALID_PATH"; path: string; reason: string }
  | { kind: "NORMALIZATION_FAILED"; path: string; cause: Error }
  | { kind: "SECURITY_VIOLATION"; path: string; violation: string }
  | { kind: "PLATFORM_DETECTION_FAILED"; message: string };

// ===== Platform Detection =====
type Platform = { kind: "UNIX" } | { kind: "WINDOWS" } | { kind: "UNKNOWN"; os: string };

/**
 * Detects the current platform
 */
function detectPlatform(): Platform {
  const os = Deno.build.os;
  switch (os) {
    case "linux":
    case "darwin":
    case "freebsd":
    case "netbsd":
    case "aix":
    case "solaris":
    case "illumos":
    case "android":
      return { kind: "UNIX" };
    case "windows":
      return { kind: "WINDOWS" };
    default:
      return { kind: "UNKNOWN", os };
  }
}

// ===== Smart Constructor: Agnostic Path =====
/**
 * Platform-independent validated path
 */
export class AgnosticPath {
  private constructor(
    readonly value: string,
    readonly normalized: string,
  ) {
    Object.freeze(this);
  }

  static create(path: string): Result<AgnosticPath, string> {
    if (!path || path.trim() === "") {
      return { ok: false, error: "Path cannot be empty" };
    }

    // Security: No path traversal
    if (path.includes("..")) {
      return { ok: false, error: "Path traversal detected" };
    }

    // Normalize to Unix-style for internal consistency
    const normalized = path.replace(/\\/g, "/");

    // Check for dangerous patterns
    const dangerousPatterns = [
      /^~/, // Home directory expansion
      /\$\{/, // Variable expansion
      // deno-lint-ignore no-control-regex
      /[<>:"|?*\x00-\x1f]/, // Invalid characters across platforms
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(path)) {
        return { ok: false, error: `Dangerous pattern detected: ${pattern}` };
      }
    }

    return { ok: true, data: new AgnosticPath(path, normalized) };
  }

  toString(): string {
    return this.value;
  }

  toNormalized(): string {
    return this.normalized;
  }
}

// ===== Smart Constructor: Agnostic Base Directory =====
/**
 * Platform-independent base directory
 */
export class AgnosticBaseDirectory {
  private constructor(
    readonly value: string,
    readonly platform: Platform,
  ) {
    Object.freeze(this);
  }

  static create(path: string): Result<AgnosticBaseDirectory, string> {
    if (!path || path.trim() === "") {
      return { ok: false, error: "Base directory cannot be empty" };
    }

    const platform = detectPlatform();

    // Validate based on platform
    switch (platform.kind) {
      case "UNIX":
        if (!path.startsWith("/") && !path.startsWith("./")) {
          return { ok: false, error: "Unix base directory must be absolute or relative" };
        }
        break;
      case "WINDOWS": {
        const drivePattern = /^[A-Za-z]:\\/;
        const uncPattern = /^\\\\/;
        const relativePattern = /^\.[\\/]/;
        if (!drivePattern.test(path) && !uncPattern.test(path) && !relativePattern.test(path)) {
          return { ok: false, error: "Windows base directory must be absolute or relative" };
        }
        break;
      }
      case "UNKNOWN":
        // Allow any non-empty path for unknown platforms
        break;
    }

    // No path traversal in base directory
    if (path.includes("..")) {
      return { ok: false, error: "Path traversal in base directory" };
    }

    return { ok: true, data: new AgnosticBaseDirectory(path, platform) };
  }

  toString(): string {
    return this.value;
  }

  getPlatform(): Platform {
    return this.platform;
  }
}

// ===== Platform-Agnostic Path Strategy with Totality =====
/**
 * Cross-platform path resolution with full type safety
 */
export class PlatformAgnosticStrategyTotality {
  private constructor(
    private baseDir: AgnosticBaseDirectory,
    private platform: Platform,
  ) {}

  /**
   * Creates a new platform-agnostic strategy
   */
  static create(baseDir: string): Result<PlatformAgnosticStrategyTotality, string> {
    const baseDirResult = AgnosticBaseDirectory.create(baseDir);
    if (!baseDirResult.ok) {
      return baseDirResult;
    }

    const platform = detectPlatform();
    return {
      ok: true,
      data: new PlatformAgnosticStrategyTotality(baseDirResult.data, platform),
    };
  }

  /**
   * Resolves a path with full validation and security checks
   */
  async resolve(path: string): Promise<Result<string, PathErrorKind>> {
    // Validate input path
    const validationResult = await this.validate(path);
    if (!validationResult.ok) {
      return validationResult;
    }

    const pathResult = AgnosticPath.create(path);
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
      // Use platform-aware join
      const resolved = join(this.baseDir.toString(), pathResult.data.toString());

      // Normalize for the current platform
      const normalized = normalize(resolved);

      // Security check: Ensure resolved path is within base directory
      const normalizedBase = normalize(this.baseDir.toString());

      // Platform-aware comparison
      const isWithinBase = this.platform.kind === "WINDOWS"
        ? normalized.toLowerCase().startsWith(normalizedBase.toLowerCase())
        : normalized.startsWith(normalizedBase);

      if (!isWithinBase) {
        return {
          ok: false,
          error: {
            kind: "SECURITY_VIOLATION",
            path,
            violation: "Path escapes base directory",
          },
        };
      }

      return { ok: true, data: normalized };
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
   * Normalizes a path for the current platform
   */
  normalize(path: string): Result<string, PathErrorKind> {
    try {
      // First normalize to Unix style for processing
      const unixStyle = path.replace(/\\/g, "/");

      // Apply standard normalization
      let normalized = normalize(unixStyle);

      // Convert to platform-specific format
      if (this.platform.kind === "WINDOWS") {
        normalized = normalized.replace(/\//g, "\\");
        // Clean up double backslashes except UNC
        if (!normalized.startsWith("\\\\")) {
          normalized = normalized.replace(/\\+/g, "\\");
        }
      } else {
        // Ensure Unix style
        normalized = normalized.replace(/\\/g, "/");
        normalized = normalized.replace(/\/+/g, "/");
      }

      return { ok: true, data: normalized };
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
   * Validates a path for security and correctness
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

    // Platform-specific validation
    switch (this.platform.kind) {
      case "UNIX":
        // Check for null bytes and control characters
        // deno-lint-ignore no-control-regex
        if (/[\x00-\x1f\x7f]/.test(path)) {
          return Promise.resolve({
            ok: false,
            error: {
              kind: "INVALID_PATH",
              path,
              reason: "Path contains control characters",
            },
          });
        }
        break;

      case "WINDOWS": {
        // Check for invalid Windows characters
        // deno-lint-ignore no-control-regex
        const invalidWinChars = /[<>:"|?*\x00-\x1f]/;
        const pathWithoutDrive = path.replace(/^[A-Za-z]:/, "");
        if (invalidWinChars.test(pathWithoutDrive)) {
          return Promise.resolve({
            ok: false,
            error: {
              kind: "INVALID_PATH",
              path,
              reason: "Path contains invalid Windows characters",
            },
          });
        }
        break;
      }
      case "UNKNOWN":
        // Basic validation only
        // deno-lint-ignore no-control-regex
        if (/[\x00]/.test(path)) {
          return Promise.resolve({
            ok: false,
            error: {
              kind: "INVALID_PATH",
              path,
              reason: "Path contains null bytes",
            },
          });
        }
        break;
    }

    // Check normalized form doesn't differ significantly
    const normalizeResult = this.normalize(path);
    if (!normalizeResult.ok) {
      return Promise.resolve(normalizeResult);
    }

    return Promise.resolve({ ok: true, data: true });
  }

  /**
   * Gets the base directory
   */
  getBaseDir(): string {
    return this.baseDir.toString();
  }

  /**
   * Gets the detected platform
   */
  getPlatform(): Platform {
    return this.platform;
  }

  /**
   * Gets the platform-specific path separator
   */
  getPathSeparator(): string {
    return SEPARATOR;
  }
}
