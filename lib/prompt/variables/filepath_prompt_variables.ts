/**
 * @fileoverview FilePathPromptVariables - File path variable management with validation
 *
 * This module provides a class for managing file path variables (specifically schema_file)
 * with path validation and file existence checking following the Totality principle.
 *
 * @module prompt/variables/filepath_prompt_variables
 */

import type { PromptVariables } from "../../types/prompt_types.ts";
import { error as resultError, ok as resultOk, type Result } from "../../types/result.ts";
import type { FilePathVariable } from "../../types/prompt_variables_vo.ts";
import { existsSync } from "@std/fs";
import { isAbsolute, join, normalize } from "@std/path";

/**
 * Error types for file path operations
 */
export type FilePathError =
  | { kind: "FileNotFound"; path: string }
  | { kind: "InvalidPath"; path: string; reason: string }
  | { kind: "SecurityViolation"; path: string; reason: string }
  | { kind: "ValidationFailed"; message: string };

/**
 * FilePathPromptVariables - Manages file path variables with validation
 *
 * This class implements the PromptVariables interface to provide
 * validated file path variables (specifically schema_file paths).
 * It ensures that:
 * - Paths are valid and secure (no directory traversal)
 * - Files exist when required
 * - Paths are properly normalized
 *
 * @example
 * ```typescript
 * const result = await FilePathPromptVariables.create("/path/to/schema.json");
 * if (result.ok) {
 *   const variables = result.data.toRecord();
 *   console.log(variables.schema_file); // "/path/to/schema.json"
 * }
 * ```
 */
export class FilePathPromptVariables implements PromptVariables {
  private constructor(
    private readonly schemaFile: string,
    private readonly additionalPaths: Record<string, string> = {},
  ) {}

  /**
   * Creates a new FilePathPromptVariables instance with validation
   *
   * @param schemaFile - Path to the schema file
   * @param options - Creation options
   * @returns Result containing FilePathPromptVariables or FilePathError
   */
  static create(
    schemaFile: string,
    options: {
      workingDirectory?: string;
      checkExists?: boolean;
      additionalPaths?: Record<string, string>;
    } = {},
  ): Result<FilePathPromptVariables, FilePathError> {
    const {
      workingDirectory = Deno.cwd(),
      checkExists = true,
      additionalPaths = {},
    } = options;

    // Validate schema file path
    const schemaPathResult = this.validatePath(schemaFile, workingDirectory);
    if (!schemaPathResult.ok) {
      return schemaPathResult;
    }

    const resolvedSchemaPath = schemaPathResult.data;

    // Check if file exists (if required)
    if (checkExists && !existsSync(resolvedSchemaPath)) {
      return resultError({
        kind: "FileNotFound",
        path: resolvedSchemaPath,
      });
    }

    // Validate additional paths
    const validatedAdditionalPaths: Record<string, string> = {};
    for (const [key, path] of Object.entries(additionalPaths)) {
      const pathResult = this.validatePath(path, workingDirectory);
      if (!pathResult.ok) {
        return resultError({
          kind: "ValidationFailed",
          message: `Additional path '${key}' validation failed: ${
            this.formatError(pathResult.error)
          }`,
        });
      }

      if (checkExists && !existsSync(pathResult.data)) {
        return resultError({
          kind: "FileNotFound",
          path: pathResult.data,
        });
      }

      validatedAdditionalPaths[key] = pathResult.data;
    }

    return resultOk(
      new FilePathPromptVariables(
        resolvedSchemaPath,
        validatedAdditionalPaths,
      ),
    );
  }

  /**
   * Creates from FilePathVariable instance
   *
   * @param variable - FilePathVariable instance
   * @param options - Creation options
   * @returns Result containing FilePathPromptVariables or FilePathError
   */
  static fromFilePathVariable(
    variable: FilePathVariable,
    options: {
      workingDirectory?: string;
      checkExists?: boolean;
    } = {},
  ): Result<FilePathPromptVariables, FilePathError> {
    return this.create(variable.value, options);
  }

  /**
   * Validates a file path for security and correctness
   *
   * @param path - Path to validate
   * @param workingDirectory - Working directory for relative paths
   * @returns Result containing resolved path or FilePathError
   */
  private static validatePath(
    path: string,
    workingDirectory: string,
  ): Result<string, FilePathError> {
    // Check for empty path
    if (!path || path.trim() === "") {
      return resultError({
        kind: "InvalidPath",
        path,
        reason: "Path cannot be empty",
      });
    }

    // Security check: prevent directory traversal
    if (path.includes("..")) {
      return resultError({
        kind: "SecurityViolation",
        path,
        reason: "Path cannot contain '..' for security reasons",
      });
    }

    // Security check: prevent null bytes
    if (path.includes("\0")) {
      return resultError({
        kind: "SecurityViolation",
        path,
        reason: "Path cannot contain null bytes",
      });
    }

    // Normalize and resolve path
    const resolvedPath = isAbsolute(path)
      ? normalize(path)
      : normalize(join(workingDirectory, path));

    // Additional security check after normalization
    if (resolvedPath.includes("..")) {
      return resultError({
        kind: "SecurityViolation",
        path: resolvedPath,
        reason: "Resolved path contains directory traversal",
      });
    }

    return resultOk(resolvedPath);
  }

  /**
   * Convert to record format for use with PromptParams
   *
   * @returns Record of file path variables
   */
  toRecord(): Record<string, string> {
    const result: Record<string, string> = {
      schema_file: this.schemaFile,
    };

    // Add any additional paths
    for (const [key, value] of Object.entries(this.additionalPaths)) {
      result[key] = value;
    }

    return result;
  }

  /**
   * Get the schema file path
   *
   * @returns The schema file path
   */
  getSchemaFile(): string {
    return this.schemaFile;
  }

  /**
   * Get additional paths
   *
   * @returns Record of additional paths
   */
  getAdditionalPaths(): Record<string, string> {
    return { ...this.additionalPaths };
  }

  /**
   * Check if a specific path key exists
   *
   * @param key - The path key to check
   * @returns True if the path exists
   */
  hasPath(key: string): boolean {
    return key === "schema_file" || key in this.additionalPaths;
  }

  /**
   * Get a specific path by key
   *
   * @param key - The path key
   * @returns The path value or undefined
   */
  getPath(key: string): string | undefined {
    if (key === "schema_file") {
      return this.schemaFile;
    }
    return this.additionalPaths[key];
  }

  /**
   * Format error for display
   *
   * @param error - The error to format
   * @returns Formatted error message
   */
  private static formatError(error: FilePathError): string {
    switch (error.kind) {
      case "FileNotFound":
        return `File not found: ${error.path}`;
      case "InvalidPath":
        return `Invalid path '${error.path}': ${error.reason}`;
      case "SecurityViolation":
        return `Security violation in path '${error.path}': ${error.reason}`;
      case "ValidationFailed":
        return error.message;
    }
  }
}

/**
 * Type guard to check if error is FileNotFound
 */
export function isFileNotFoundError(
  error: FilePathError,
): error is Extract<FilePathError, { kind: "FileNotFound" }> {
  return error.kind === "FileNotFound";
}

/**
 * Type guard to check if error is SecurityViolation
 */
export function isSecurityViolationError(
  error: FilePathError,
): error is Extract<FilePathError, { kind: "SecurityViolation" }> {
  return error.kind === "SecurityViolation";
}
