/**
 * Command handlers for the Breakdown tool.
 * @module
 */

import { ensureDir } from "jsr:@std/fs@^0.224.0";
import { join } from "jsr:@std/path@^0.224.0";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^0.1.10";
import { ArgumentError } from "../cli/args.ts";

const logger = new BreakdownLogger();

/**
 * The result of a command execution in the Breakdown CLI.
 *
 * @property success Indicates if the command was successful.
 * @property output The output message or result of the command.
 * @property error The error message, if the command failed.
 */
export interface CommandResult {
  success: boolean;
  output: string;
  error: string;
}

/**
 * Initialize the workspace directory structure.
 */
export async function initWorkspace(workingDir: string): Promise<CommandResult> {
  try {
    await ensureDir(workingDir);
    logger.debug(`Ensured working directory exists: ${workingDir}`);

    const breakdownDir = join(workingDir, "breakdown");
    await ensureDir(breakdownDir);
    logger.debug(`Created breakdown directory: ${breakdownDir}`);

    const subdirs = [
      "projects",
      "issues",
      "tasks",
      "temp",
      "config",
      "prompts",
      "schema",
    ];

    for (const dir of subdirs) {
      const fullPath = join(breakdownDir, dir);
      try {
        await ensureDir(fullPath);
        logger.debug(`Created directory: ${fullPath}`);
      } catch (error) {
        if (error instanceof Deno.errors.AlreadyExists) {
          logger.debug(`Directory already exists: ${fullPath}`);
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Failed to create directory ${dir}:`, errorMessage);
          return {
            success: false,
            output: "",
            error: `Failed to create directory ${dir}: ${errorMessage}`,
          };
        }
      }
    }

    logger.info("Workspace initialization completed successfully");
    return {
      success: true,
      output: "Workspace initialized successfully",
      error: "",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to initialize workspace:", errorMessage);
    return {
      success: false,
      output: "",
      error: `Failed to initialize workspace: ${errorMessage}`,
    };
  }
}

/**
 * Convert a file from one layer type to another
 */
export async function convertFile(
  fromFile: string,
  toFile: string,
  _format: string,
  force = false,
): Promise<CommandResult> {
  try {
    // Ensure source file exists
    try {
      await Deno.stat(fromFile);
    } catch {
      throw new ArgumentError(`Source file not found: ${fromFile}`);
    }

    // Read source file
    const content = await Deno.readTextFile(fromFile);
    logger.debug("Read source file", { file: fromFile, size: content.length });

    // Check if destination file exists and force flag is not set
    try {
      await Deno.stat(toFile);
      if (!force) {
        throw new ArgumentError(
          `Destination file already exists: ${toFile}. Use --force to overwrite.`,
        );
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }

    // Ensure destination directory exists
    const destDir = toFile.substring(0, toFile.lastIndexOf("/"));
    await ensureDir(destDir);

    // Write converted content
    await Deno.writeTextFile(toFile, content); // TODO: Implement actual conversion
    logger.debug("Wrote destination file", { file: toFile });

    return {
      success: true,
      output: `Converted ${fromFile} to ${toFile}`,
      error: "",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to convert file:", errorMessage);
    return {
      success: false,
      output: "",
      error: errorMessage,
    };
  }
}

/**
 * Display help information
 */
export function displayHelp(): CommandResult {
  const helpText = `
Breakdown - A tool for hierarchical task breakdown

Usage:
  breakdown [command] [options]

Commands:
  init                Initialize workspace
  to <layer>         Convert to specified layer
  summary <layer>    Generate summary for layer
  defect <layer>     Analyze defects in layer

Options:
  --help             Show this help message
  --version          Show version information
  --working-dir      Set working directory
  --from             Source file path
  --to               Destination file path
  --input            Input layer type

Examples:
  breakdown init
  breakdown to project --from input.md
  breakdown summary issue --from issue.md
  `;

  return {
    success: true,
    output: helpText,
    error: "",
  };
}

/**
 * Display version information
 */
export function displayVersion(): CommandResult {
  return {
    success: true,
    output: "Breakdown v0.1.0",
    error: "",
  };
}

/**
 * Convert a file to an issue layer (stub for future implementation).
 *
 * @param _fromFile The source file path.
 * @param _toFile The destination file path.
 * @param _force Whether to overwrite the destination file if it exists.
 * @returns {Promise<void>} Resolves when the conversion is complete.
 */
export async function convertToIssue(
  _fromFile: string,
  _toFile: string,
  _force = false,
): Promise<void> {
  // ... existing code ...
}
