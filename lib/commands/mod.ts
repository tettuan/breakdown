/**
 * Command handlers for the Breakdown tool.
 * @module
 */

import { ensureDir } from "jsr:@std/fs@^0.224.0";
import { join } from "jsr:@std/path@^0.224.0";
import { ArgumentError } from "../cli/args.ts";
import { parse } from "jsr:@std/yaml@1.0.6";
import { exists } from "jsr:@std/fs@^0.224.0";
import { VERSION } from "../version.ts";

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
 * app.yml の構造に合わせた型定義
 */
interface AppConfig {
  working_dir: string;
  app_prompt?: {
    base_dir?: string;
  };
  app_schema?: {
    base_dir?: string;
  };
}

/**
 * Initialize the workspace directory structure.
 */
export async function initWorkspace(_workingDir?: string): Promise<CommandResult> {
  try {
    // Always use ./.agent/breakdown as the root for config and subdirs
    const projectRoot = Deno.cwd();
    const breakdownDir = join(projectRoot, ".agent", "breakdown");
    await ensureDir(breakdownDir);

    // Config dir and file (under .agent/breakdown)
    const configDir = join(breakdownDir, "config");
    const configFile = join(configDir, "app.yml");
    if (!(await exists(configFile))) {
      await ensureDir(configDir);
      // working_dir value is always .agent/breakdown (relative to project root)
      const configYaml =
        `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`;
      await Deno.writeTextFile(configFile, configYaml);
    } else {
      // Config already exists, do not overwrite
    }

    // Read config
    const configText = await Deno.readTextFile(configFile);
    const config = parse(configText) as AppConfig;
    const promptBase = config?.app_prompt?.base_dir || "prompts";
    const schemaBase = config?.app_schema?.base_dir || "schema";

    // Create required subdirectories under .agent/breakdown
    const subdirs = [
      "projects",
      "issues",
      "tasks",
      "temp",
      "config",
      promptBase,
      schemaBase,
    ];
    for (const dir of subdirs) {
      const fullPath = join(breakdownDir, dir);
      try {
        await ensureDir(fullPath);
      } catch (error) {
        if (!(error instanceof Deno.errors.AlreadyExists)) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            success: false,
            output: "",
            error: `Failed to create directory ${dir}: ${errorMessage}`,
          };
        }
      }
    }

    return {
      success: true,
      output: "Workspace initialized successfully",
      error: "",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
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
      throw new ArgumentError(`File not found: ${fromFile}`);
    }

    // Read source file
    const content = await Deno.readTextFile(fromFile);

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

    return {
      success: true,
      output: `Converted ${fromFile} to ${toFile}`,
      error: "",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
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
    output: `Breakdown v${VERSION}`,
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
