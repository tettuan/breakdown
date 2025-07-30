/**
 * @fileoverview Output File Path Resolver - Totality Implementation
 *
 * This module implements output file path resolution following the Totality principle.
 * It resolves the destination path for generated output files based on CLI parameters
 * and configuration settings.
 *
 * @module factory/output_file_path_resolver_totality
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import type { PromptCliParams } from "../types/mod.ts";
import { isAbsolute, resolve } from "jsr:@std/path@^1.0.9";

/**
 * Error types for output file path resolution
 */
export type OutputFilePathResolutionError =
  | { kind: "MissingDestinationFile"; message: string }
  | { kind: "InvalidPath"; path: string; reason: string }
  | { kind: "PathCreationError"; path: string; error: string };

/**
 * Simple FilePath wrapper
 */
interface FilePath {
  value: string;
  getValue(): string;
}

/**
 * Output file path resolver implementing Totality principle
 */
export class OutputFilePathResolverTotality {
  /**
   * Creates a new OutputFilePathResolverTotality instance
   */
  static create(
    config: Record<string, unknown>,
    cliParams: PromptCliParams,
  ): Result<OutputFilePathResolverTotality, OutputFilePathResolutionError> {
    // Extract destination file from options
    const destinationFile = cliParams.options.destinationFile;

    if (!destinationFile) {
      return error({
        kind: "MissingDestinationFile",
        message: "No destination file specified in options (use -o, --destination, or --output)",
      });
    }

    // Resolve path
    const workingDir = (config.working_dir as string) || ".";
    const resolvedPath = isAbsolute(String(destinationFile))
      ? String(destinationFile)
      : resolve(Deno.cwd(), workingDir, String(destinationFile));

    const filePath: FilePath = {
      value: resolvedPath,
      getValue(): string {
        return this.value;
      },
    };

    return ok(new OutputFilePathResolverTotality(filePath));
  }

  /**
   * Private constructor following Smart Constructor pattern
   */
  private constructor(private readonly filePath: FilePath) {}

  /**
   * Gets the resolved output file path
   */
  getPath(): Result<FilePath, OutputFilePathResolutionError> {
    return ok(this.filePath);
  }

  /**
   * Validates the output path
   */
  validate(): Result<void, OutputFilePathResolutionError> {
    const path = this.filePath.getValue();

    // Basic validation - ensure path is not empty
    if (!path || path.trim() === "") {
      return error({
        kind: "InvalidPath",
        path,
        reason: "Output path cannot be empty",
      });
    }

    // Additional validation can be added here
    // For example: check if parent directory exists, check write permissions, etc.

    return ok(undefined);
  }
}

/**
 * Format output file path resolution errors for display
 */
export function formatOutputFilePathError(
  error: OutputFilePathResolutionError,
): string {
  switch (error.kind) {
    case "MissingDestinationFile":
      return `Output file error: ${error.message}`;
    case "InvalidPath":
      return `Invalid output path '${error.path}': ${error.reason}`;
    case "PathCreationError":
      return `Failed to create output path '${error.path}': ${error.error}`;
  }
}
