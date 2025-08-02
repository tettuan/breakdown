/**
 * @fileoverview File path value types following Totality principle
 *
 * This module provides type-safe representation of file paths,
 * distinguishing between "not specified", "empty", and actual paths.
 */

/**
 * Discriminated union for file path values
 */
export type FilePathValue =
  | { kind: "not-specified" }
  | { kind: "empty" }
  | { kind: "path"; value: string };

/**
 * Smart constructor for file path values
 */
export class FilePath {
  private constructor(private readonly value: FilePathValue) {}

  /**
   * Create a not-specified file path
   */
  static notSpecified(): FilePath {
    return new FilePath({ kind: "not-specified" });
  }

  /**
   * Create an empty file path (explicitly empty)
   */
  static empty(): FilePath {
    return new FilePath({ kind: "empty" });
  }

  /**
   * Create a file path with value
   */
  static fromString(path: string): FilePath {
    if (path === "") {
      return FilePath.empty();
    }
    return new FilePath({ kind: "path", value: path });
  }

  /**
   * Check if path is not specified
   */
  isNotSpecified(): boolean {
    return this.value.kind === "not-specified";
  }

  /**
   * Check if path is empty
   */
  isEmpty(): boolean {
    return this.value.kind === "empty";
  }

  /**
   * Check if path has a value
   */
  hasValue(): boolean {
    return this.value.kind === "path";
  }

  /**
   * Get the path value if it exists
   */
  getPath(): string | null {
    return this.value.kind === "path" ? this.value.value : null;
  }

  /**
   * Pattern matching for file path
   */
  match<T>(patterns: {
    notSpecified: () => T;
    empty: () => T;
    path: (value: string) => T;
  }): T {
    switch (this.value.kind) {
      case "not-specified":
        return patterns.notSpecified();
      case "empty":
        return patterns.empty();
      case "path":
        return patterns.path(this.value.value);
    }
  }

  /**
   * Convert to legacy string format for backward compatibility
   * Returns null for not-specified, empty string for empty, actual path for path
   */
  toLegacyString(): string | null {
    return this.match({
      notSpecified: () => null,
      empty: () => "",
      path: (value) => value,
    });
  }

  /**
   * Check if this path should create a variable in prompt templates
   */
  shouldCreateVariable(): boolean {
    return this.value.kind === "path";
  }
}
