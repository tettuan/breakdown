/**
 * Command handlers for the Breakdown tool.
 * @module
 */

import { ensureDir, join } from "$deps/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger();

/**
 * Initialize the workspace directory structure.
 * Creates a 'breakdown' directory under the specified working directory,
 * then creates all necessary subdirectories within it.
 * @param workingDir - The base directory where the 'breakdown' directory will be created
 */
export async function initWorkspace(workingDir: string): Promise<void> {
  try {
    // Ensure the working directory exists
    await ensureDir(workingDir);
    logger.debug(`Ensured working directory exists: ${workingDir}`);

    // Create the breakdown directory
    const breakdownDir = join(workingDir, "breakdown");
    await ensureDir(breakdownDir);
    logger.debug(`Created breakdown directory: ${breakdownDir}`);

    // List of required subdirectories
    const subdirs = [
      "projects",
      "issues",
      "tasks",
      "temp",
      "config",
      "prompts",
      "schema",
    ];

    // Create each subdirectory under breakdown/
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
          throw new Error(`Failed to create directory ${dir}: ${errorMessage}`);
        }
      }
    }

    logger.info("Workspace initialization completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to initialize workspace:", errorMessage);
    throw new Error(`Failed to initialize workspace: ${errorMessage}`);
  }
}

/**
 * Display help information
 */
export function displayHelp(): void {
  console.log(`
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
  `);
}

/**
 * Display version information
 */
export function displayVersion(): void {
  console.log("Breakdown v0.1.0");
}
