/**
 * @fileoverview Output destination types following Totality principle
 *
 * This module provides type-safe representation of output destinations,
 * avoiding implicit meanings of empty strings.
 */

import type { Result } from "./result.ts";

/**
 * Discriminated union for output destination
 */
export type OutputDestination =
  | { kind: "stdout" }
  | { kind: "file"; path: string };

/**
 * Smart constructor for output destination
 */
export class OutputPath {
  private constructor(private readonly destination: OutputDestination) {}

  /**
   * Create stdout output destination
   */
  static stdout(): OutputPath {
    return new OutputPath({ kind: "stdout" });
  }

  /**
   * Create file output destination
   */
  static file(path: string): Result<OutputPath, { kind: "EmptyPath"; message: string }> {
    if (!path || path.trim() === "") {
      return {
        ok: false,
        error: {
          kind: "EmptyPath",
          message: "File path cannot be empty",
        },
      };
    }
    return {
      ok: true,
      data: new OutputPath({ kind: "file", path }),
    };
  }

  /**
   * Check if output is stdout
   */
  isStdout(): boolean {
    return this.destination.kind === "stdout";
  }

  /**
   * Get file path if destination is file
   */
  getPath(): string | null {
    return this.destination.kind === "file" ? this.destination.path : null;
  }

  /**
   * Type-safe pattern matching
   */
  match<T>(patterns: {
    stdout: () => T;
    file: (path: string) => T;
  }): T {
    switch (this.destination.kind) {
      case "stdout":
        return patterns.stdout();
      case "file":
        return patterns.file(this.destination.path);
    }
  }

  /**
   * Convert to legacy string format for backward compatibility
   * Returns empty string for stdout, file path for file
   */
  toLegacyString(): string {
    return this.match({
      stdout: () => "",
      file: (path) => path,
    });
  }
}
