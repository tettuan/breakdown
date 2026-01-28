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
import {
  type BaseResolverConfig,
  PathResolverBase,
  type ResolverCliParams,
} from "./path_resolver_base.ts";

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
 * Configuration for output file path resolver
 */
interface OutputResolverConfig extends BaseResolverConfig {
  destinationPrefix?: string;
}

/**
 * Output file path resolver implementing Totality principle
 * Extends PathResolverBase for common functionality
 */
export class OutputFilePathResolverTotality extends PathResolverBase<OutputResolverConfig> {
  private readonly filePath: FilePath;

  /**
   * Private constructor following Smart Constructor pattern
   */
  private constructor(
    config: OutputResolverConfig,
    cliParams: ResolverCliParams,
    filePath: FilePath,
  ) {
    super(config, cliParams);
    this.filePath = filePath;
  }

  /**
   * Safely extract destination prefix from config
   */
  private static getDestinationPrefix(config: Record<string, unknown>): string | undefined {
    const options = config.options as Record<string, unknown> | undefined;
    if (!options) return undefined;

    const destination = options.destination as Record<string, unknown> | undefined;
    if (!destination) return undefined;

    const prefix = destination.prefix;
    return typeof prefix === "string" ? prefix : undefined;
  }

  /**
   * Creates a new OutputFilePathResolverTotality instance
   */
  static create(
    config: Record<string, unknown>,
    cliParams: PromptCliParams,
  ): Result<OutputFilePathResolverTotality, OutputFilePathResolutionError> {
    // Extract destination file from options
    const destinationFile = cliParams.options.destinationFile;
    const destinationPrefix = this.getDestinationPrefix(config);
    const workingDir = (config.working_dir as string) || ".";

    let resolvedPath: string;

    if (destinationFile) {
      // Case 1-3: CLI option specified
      if (isAbsolute(String(destinationFile))) {
        // Case 2: Absolute path - use as-is
        resolvedPath = String(destinationFile);
      } else if (destinationPrefix) {
        // Case 3: Relative path with prefix - concatenate prefix + destinationFile directly
        const baseDir = resolve(Deno.cwd(), workingDir);
        resolvedPath = resolve(baseDir, destinationPrefix + String(destinationFile));
      } else {
        // Case 1: Relative path without prefix - traditional behavior
        resolvedPath = resolve(Deno.cwd(), workingDir, String(destinationFile));
      }
    } else if (destinationPrefix) {
      // Case 4: No CLI option but prefix specified
      resolvedPath = resolve(Deno.cwd(), workingDir, destinationPrefix);
    } else {
      // Case 5: Neither specified - error
      return error({
        kind: "MissingDestinationFile",
        message:
          "No destination file specified in options (use -o, --destination, or --output) and no prefix configured in options.destination.prefix",
      });
    }

    const filePath: FilePath = {
      value: resolvedPath,
      getValue(): string {
        return this.value;
      },
    };

    const resolverConfig: OutputResolverConfig = {
      workingDir,
      destinationPrefix,
    };

    return ok(new OutputFilePathResolverTotality(resolverConfig, cliParams, filePath));
  }

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
