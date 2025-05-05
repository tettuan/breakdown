/**
 * Command handlers for the Breakdown tool.
 *
 * All configuration access (e.g., prompt base dir, schema base dir) must use BreakdownConfig from @tettuan/breakdownconfig.
 * Do not read YAML or JSON config files directly in this module.
 *
 * @module
 */

import { join } from "@std/path";
import { ensureDir, exists } from "@std/fs";
import { VERSION } from "../version.ts";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { PromptFileGenerator } from "./prompt_file_generator.ts";

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
 *
 * All config access must use BreakdownConfig, not direct file reads.
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

    // Use BreakdownConfig to load config
    const config = new BreakdownConfig();
    await config.loadConfig();
    const settings = await config.getConfig();
    if (!settings.app_prompt?.base_dir || settings.app_prompt.base_dir.trim() === "") {
      throw new Error(
        "Prompt base_dir must be set in config (app_prompt.base_dir). No fallback allowed.",
      );
    }
    if (!settings.app_schema?.base_dir || settings.app_schema.base_dir.trim() === "") {
      throw new Error(
        "Schema base_dir must be set in config (app_schema.base_dir). No fallback allowed.",
      );
    }
    const promptBase = settings.app_prompt.base_dir;
    const schemaBase = settings.app_schema.base_dir;

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
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("Not a directory")) {
          return {
            success: false,
            output: "",
            error: `is not a directory: ${fullPath}`,
          };
        }
        if (!(error instanceof Deno.errors.AlreadyExists)) {
          return {
            success: false,
            output: "",
            error: `Failed to create directory ${dir}: ${errorMessage}`,
          };
        }
      }
    }

    // --- Copy prompt templates from lib/prompts/to/* to promptBase ---
    // Only copy if not already present
    const promptSourceRoot = join(projectRoot, "lib", "prompts", "to");
    try {
      for await (const entry of Deno.readDir(promptSourceRoot)) {
        if (entry.isDirectory) {
          const srcDir = join(promptSourceRoot, entry.name);
          const destDir = join(breakdownDir, promptBase, entry.name);
          await ensureDir(destDir);
          for await (const fileEntry of Deno.readDir(srcDir)) {
            if (fileEntry.isFile && fileEntry.name.endsWith(".md")) {
              const srcFile = join(srcDir, fileEntry.name);
              const destFile = join(destDir, fileEntry.name);
              try {
                await Deno.lstat(destFile);
                // File exists, do not overwrite
              } catch (_e) {
                // File does not exist, copy
                await Deno.copyFile(srcFile, destFile);
              }
            }
          }
        }
      }
    } catch (copyErr) {
      return {
        success: false,
        output: "",
        error: `Failed to copy prompt templates: ${copyErr}`,
      };
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

// 1. 入力ファイル存在チェック
function validateInputFile(path: string): Promise<void> {
  return Deno.stat(path).then(() => {}, () => {
    throw new Error(`No such file: ${path}`);
  });
}

// 5. プロンプト変換処理
async function runPromptProcessing(
  _fromFile: string,
  _toFile: string,
  _format: string,
  _force: boolean,
  _options?: { adaptation?: string; promptDir?: string; demonstrativeType?: string },
): Promise<CommandResult> {
  try {
    // --- Add input file existence check ---
    try {
      const absFromFile = _fromFile.startsWith("/") ? _fromFile : join(Deno.cwd(), _fromFile);
      await validateInputFile(absFromFile);
    } catch (_e) {
      const absFromFile = _fromFile.startsWith("/") ? _fromFile : join(Deno.cwd(), _fromFile);
      return {
        success: false,
        output: "",
        error: `No such file: ${absFromFile}`,
      };
    }
    // ---
    const generator = new PromptFileGenerator();
    const result = await generator.generateWithPrompt(
      _fromFile,
      _toFile,
      _format,
      _force,
      _options,
    );
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      output: "",
      error: errorMessage,
    };
  }
}

export async function generateWithPrompt(
  _fromFile: string,
  _toFile: string,
  _format: string,
  _force = false,
  _options?: { adaptation?: string; promptDir?: string; demonstrativeType?: string },
): Promise<CommandResult> {
  return await runPromptProcessing(_fromFile, _toFile, _format, _force, _options);
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
