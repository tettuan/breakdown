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
  format: string,
  force = false,
): Promise<CommandResult> {
  try {
    // Ensure source file exists
    try {
      await Deno.stat(fromFile);
    } catch {
      throw new ArgumentError(`File not found: ${fromFile}`);
    }

    // Use BREAKDOWN_PROMPT_BASE env var if set
    const promptBaseDir = Deno.env.get("BREAKDOWN_PROMPT_BASE") || "";
    // If in test mode, pass a logger to processWithPrompt
    let logger = undefined;
    if (promptBaseDir) {
      const { BreakdownLogger, LogLevel } = await import("jsr:@tettuan/breakdownlogger@^0.1.10");
      const testLogger = new BreakdownLogger({ initialLevel: LogLevel.DEBUG });
      logger = {
        debug: (...args: unknown[]) => testLogger.debug(String(args[0]), args[1]),
        error: (...args: unknown[]) => testLogger.error(String(args[0]), args[1]),
      };
    }
    // Prompt変換処理
    const { processWithPrompt } = await import("../prompt/processor.ts");
    const result = await processWithPrompt(
      promptBaseDir,
      "to",
      format,
      fromFile,
      toFile,
      "",
      logger,
    );

    if (!result.success) {
      return {
        success: false,
        output: "",
        error: result.content,
      };
    }

    // 変換結果をoutputに返す（ファイル書き込みは行わない）
    return {
      success: true,
      output: result.content,
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
