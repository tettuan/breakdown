import { PathResolutionStrategy } from "../interfaces.ts";
import { join, normalize } from "jsr:@std/path@0.224.0";

/**
 * Path resolution strategy for Unix-style paths.
 */
export class UnixPathStrategy implements PathResolutionStrategy {
  private baseDir: string;

  /**
   * Creates a new UnixPathStrategy instance.
   * @param baseDir The base directory for path resolution.
   */
  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Resolves a path by joining it with the base directory.
   * @param path The path to resolve.
   * @returns A promise resolving to the joined path.
   */
  resolve(path: string): Promise<string> {
    return Promise.resolve(join(this.baseDir, path));
  }

  /**
   * Normalizes a path to Unix format.
   * @param path The path to normalize.
   * @returns A promise resolving to the normalized path.
   */
  normalize(path: string): Promise<string> {
    return Promise.resolve(normalize(path).replace(/\\/g, "/"));
  }

  /**
   * Validates that the normalized path does not contain double slashes.
   * @param path The path to validate.
   * @returns A promise resolving to true if valid, false otherwise.
   */
  validate(path: string): Promise<boolean> {
    return this.normalize(path).then((normalized) => !normalized.includes("//"));
  }
}

/**
 * Path resolution strategy for Windows-style paths.
 */
export class WindowsPathStrategy implements PathResolutionStrategy {
  private baseDir: string;

  /**
   * Creates a new WindowsPathStrategy instance.
   * @param baseDir The base directory for path resolution.
   */
  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Resolves a path by joining it with the base directory.
   * @param path The path to resolve.
   * @returns A promise resolving to the joined path.
   */
  resolve(path: string): Promise<string> {
    return Promise.resolve(join(this.baseDir, path));
  }

  /**
   * Normalizes a path to Windows format.
   * @param path The path to normalize.
   * @returns A promise resolving to the normalized path.
   */
  normalize(path: string): Promise<string> {
    return Promise.resolve(normalize(path).replace(/\//g, "\\"));
  }

  /**
   * Validates that the normalized path does not contain double backslashes.
   * @param path The path to validate.
   * @returns A promise resolving to true if valid, false otherwise.
   */
  validate(path: string): Promise<boolean> {
    return this.normalize(path).then((normalized) => !normalized.includes("\\\\"));
  }
}

/**
 * Platform-agnostic path resolution strategy.
 */
export class PlatformAgnosticPathStrategy implements PathResolutionStrategy {
  private baseDir: string;

  /**
   * Creates a new PlatformAgnosticPathStrategy instance.
   * @param baseDir The base directory for path resolution.
   */
  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Resolves a path after validation and normalization.
   * @param path The path to resolve.
   * @returns A promise resolving to the joined and normalized path.
   * @throws Error if the path is invalid.
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
   * @param path The path to normalize.
   * @returns A promise resolving to the normalized path.
   */
  normalize(path: string): Promise<string> {
    return Promise.resolve(normalize(path).replace(/\\/g, "/"));
  }

  /**
   * Validates that the path does not contain double slashes.
   * @param path The path to validate.
   * @returns A promise resolving to true if valid, false otherwise.
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
 */
export class DefaultPathResolutionStrategy implements PathResolutionStrategy {
  private baseDir: string;

  /**
   * Creates a new DefaultPathResolutionStrategy instance.
   * @param baseDir The base directory for path resolution. Defaults to ".agent/breakdown".
   */
  constructor(baseDir: string = ".agent/breakdown") {
    this.baseDir = baseDir;
  }

  /**
   * Resolves a path by joining it with the base directory.
   * @param path The path to resolve.
   * @returns A promise resolving to the joined path.
   */
  resolve(path: string): Promise<string> {
    return Promise.resolve(join(this.baseDir, path));
  }

  /**
   * Normalizes a path by joining it with the base directory.
   * @param path The path to normalize.
   * @returns A promise resolving to the joined path.
   */
  normalize(path: string): Promise<string> {
    return Promise.resolve(join(this.baseDir, path));
  }

  /**
   * Validates that the resolved path does not contain parent directory references.
   * @param path The path to validate.
   * @returns A promise resolving to true if valid, false otherwise.
   */
  validate(path: string): Promise<boolean> {
    return this.resolve(path).then((resolved) => !resolved.includes(".."));
  }
}
