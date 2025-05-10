/**
 * Command handlers for the Breakdown tool.
 *
 * All configuration access (e.g., prompt base dir, schema base dir) must use BreakdownConfig from @tettuan/breakdownconfig.
 * Do not read YAML or JSON config files directly in this module.
 *
 * @module
 */

import { join } from "@std/path";
import { VERSION } from "../version.ts";
import { PromptFileGenerator } from "./prompt_file_generator.ts";
import { Workspace } from "../workspace/workspace.ts";

/**
 * The result of a command execution in the Breakdown CLI.
 *
 * @property success Indicates if the command was successful.
 * @property output The output message or result of the command.
 * @property error The error message, if the command failed. Can be a string or an error object with type and message.
 */
export interface CommandResult {
  /** Indicates if the command was successful. */
  success: boolean;
  /** The output message or result of the command. */
  output: string;
  /** The error message, if the command failed. Can be a string or an error object with type and message. */
  error: string | { type: string; message: string } | null;
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
    const workingDir = _workingDir ?? Deno.cwd();
    // In production, use BreakdownConfig to load these values
    const workspace = new Workspace({
      workingDir,
      promptBaseDir: "prompts", // placeholder, should be loaded from config
      schemaBaseDir: "schema", // placeholder, should be loaded from config
    });
    await workspace.initialize();
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
  _options?: {
    adaptation?: string;
    promptDir?: string;
    demonstrativeType?: string;
    input_text?: string;
  },
): Promise<CommandResult> {
  try {
    // --- Add input file existence check ---
    if (_fromFile !== "-") {
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

/**
 * Options for generating a prompt file.
 */
export interface GenerateWithPromptOptions {
  /** Adaptation type for prompt generation. */
  adaptation?: string;
  /** Directory for prompt files. */
  promptDir?: string;
  /** Demonstrative type for prompt generation. */
  demonstrativeType?: string;
  /** Input text from stdin. */
  input_text?: string;
  /** Input text from file. */
  input_text_file?: string;
}

/**
 * Generates a prompt file by processing the input file and writing to the output file.
 *
 * @param _fromFile The source file path.
 * @param _toFile The destination file path.
 * @param _format The format to use for the prompt.
 * @param _force Whether to overwrite the destination file if it exists.
 * @param _options Additional options for prompt generation.
 * @returns The result of the command execution.
 */
export async function generateWithPrompt(
  _fromFile: string,
  _toFile: string,
  _format: string,
  _force = false,
  _options?: GenerateWithPromptOptions,
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
