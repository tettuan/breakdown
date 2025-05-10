/**
 * Breakdown CLI Entrypoint
 *
 * This module provides the command-line interface for the Breakdown tool. It parses arguments, dispatches commands,
 * and handles user interaction for initializing workspaces, converting layers, generating summaries, and defect reports.
 *
 * @module
 */
import { type OptionParams } from "jsr:@tettuan/breakdownparams@^0.1.11";
import { initWorkspace } from "../lib/commands/mod.ts";
import { type CommandOptions, validateCommandOptions as validateArgs } from "../lib/cli/args.ts";
import { ParamsParser } from "jsr:@tettuan/breakdownparams@^0.1.11";
import { CliError } from "../lib/cli/errors.ts";
import { isStdinAvailable, readStdin } from "../lib/io/stdin.ts";
import { resolve } from "@std/path";
import { CommandOptionsValidator } from "../lib/cli/validators/command_options_validator.ts";

export const HELP_TEXT: string = `
Breakdown - AI Development Instruction Tool

Usage:
  breakdown [command] [options]

Commands:
  init                    Initialize a new workspace
  to <layer>             Convert to specified layer type
  summary <layer>        Generate summary for layer type
  defect <layer>         Generate defect report for layer type

Layer Types:
  project, issue, task

Options:
  -h, --help            Show this help message
  -v, --version         Show version information
  -f, --from <file>     Input file path
  -o, --destination <file>  Output file path
  -i, --input <type>    Input layer type (project|issue|task)
  -a, --adaptation <type>  Adaptation type for template selection
`;

function writeStdout(message: string): void {
  Deno.stdout.writeSync(new TextEncoder().encode(message + "\n"));
}

function writeStderr(message: string): void {
  Deno.stderr.writeSync(new TextEncoder().encode(message + "\n"));
}

function formatError(error: string | { type: string; message: string } | null): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error === "object" && "type" in error && "message" in error) {
    return `[${error.type}] ${error.message}`;
  }
  return String(error);
}

/**
 * Entry point for the Breakdown CLI.
 *
 * This function processes command-line arguments and executes the appropriate Breakdown command.
 * It handles workspace initialization, Markdown conversion, summary generation, and defect analysis
 * according to the provided arguments. This is the main function invoked when using Breakdown as a CLI tool.
 *
 * @param {string[]} args - The command-line arguments (excluding the Deno executable and script name).
 *
 * @example
 * // Run Breakdown CLI with arguments
 * await runBreakdown(["to", "project", "--from", "input.md", "-o", "output_dir"]);
 *
 * @returns {Promise<void>} Resolves when the command completes.
 */
export async function runBreakdown(args: string[]): Promise<void> {
  if (args.length === 0) {
    writeStdout(HELP_TEXT);
    return;
  }

  const parser = new ParamsParser();
  const result = parser.parse(args);

  // Handle error from ParamsParser
  if ("error" in result && result.error) {
    writeStderr(result.error);
    Deno.exit(1);
  }

  // Handle help/version flags recognized by ParamsParser immediately
  if (result.type === "no-params") {
    if (result.help) {
      writeStdout(HELP_TEXT);
      return;
    }
    if (result.version) {
      const { displayVersion } = await import("../lib/commands/mod.ts");
      const versionResult = displayVersion();
      writeStdout(versionResult.output);
      return;
    }
    // If no command and not help/version, show help
    writeStdout(HELP_TEXT);
    return;
  }

  try {
    // バリデーション一元化: CommandOptionsValidator
    const validator = new CommandOptionsValidator();
    const parsedOptions = validateArgs(args);
    const validationResult = validator.validate({
      ...result,
      options: parsedOptions,
      stdinAvailable: isStdinAvailable(),
    });
    if (!validationResult.success) {
      writeStderr(validationResult.errorMessage ?? "Invalid CLI parameters");
      Deno.exit(1);
    }
    const values = validationResult.values;

    // Single command (e.g., init)
    if (result.type === "single") {
      if (result.command === "init") {
        await initWorkspace(".");
        return;
      }
      // Add more single commands as needed
    }

    // Double command (e.g., to, summary, defect)
    if (result.type === "double") {
      // --- STDIN/ファイル入力の取得 ---
      let inputText = "";
      let inputTextFile = "";
      let hasInput = false;

      // Handle file input if specified
      if (values.from) {
        if (values.from === "-") {
          // Special case: '-' indicates stdin input
          if (isStdinAvailable()) {
            inputText = await readStdin({ allowEmpty: false });
            hasInput = true;
          }
        } else {
          try {
            const resolvedPath = resolve(Deno.cwd(), values.from);
            inputTextFile = await Deno.readTextFile(resolvedPath);
            hasInput = true;
          } catch (e) {
            writeStderr(`Failed to read input file ${values.from}: ${e}`);
            Deno.exit(1);
          }
        }
      } // Handle stdin input if available and no file input
      else if (isStdinAvailable()) {
        inputText = await readStdin({ allowEmpty: false });
        hasInput = true;
      }

      if (!hasInput) {
        writeStderr("No input provided via stdin or --from option");
        Deno.exit(1);
      }

      // --- Factory/PromptManagerに渡す ---
      const extraVars = values.from === "-"
        ? { input_text: inputText }
        : values.from
        ? { input_text_file: inputTextFile }
        : { input_text: inputText };
      const fromFile = values.from || (isStdinAvailable() ? "-" : "");

      // call generateWithPrompt for 'to' command
      if (result.demonstrativeType === "to") {
        const { generateWithPrompt } = await import("../lib/commands/mod.ts");
        const convResult = await generateWithPrompt(
          fromFile, // fromFile
          values.destination || "output.md", // Default output file
          result.layerType!,
          false,
          {
            adaptation: values.adaptation,
            promptDir: values.promptDir,
            demonstrativeType: result.demonstrativeType,
            ...extraVars,
          },
        );
        if (convResult.success) {
          // Write output to destination file if specified
          if (values.destination) {
            try {
              // Ensure output directory exists
              const outputDir = values.destination.split("/").slice(0, -1).join("/");
              if (outputDir) {
                await Deno.mkdir(outputDir, { recursive: true });
              }
              await Deno.writeTextFile(values.destination, convResult.output);
            } catch (e) {
              writeStderr(`Failed to write output to ${values.destination}: ${e}`);
              Deno.exit(1);
            }
          }
          writeStdout(convResult.output);
        } else {
          writeStderr(formatError(convResult.error));
          Deno.exit(1);
        }
        return;
      }

      // call generateWithPrompt for 'summary' command
      if (result.demonstrativeType === "summary") {
        const { generateWithPrompt } = await import("../lib/commands/mod.ts");
        const convResult = await generateWithPrompt(
          fromFile, // fromFile
          values.destination || "output.md", // Default output file
          result.layerType!,
          false,
          {
            adaptation: values.adaptation,
            promptDir: values.promptDir,
            demonstrativeType: result.demonstrativeType,
            ...extraVars,
          },
        );
        if (convResult.success) {
          // Write output to destination file if specified
          if (values.destination) {
            try {
              // Ensure output directory exists
              const outputDir = values.destination.split("/").slice(0, -1).join("/");
              if (outputDir) {
                await Deno.mkdir(outputDir, { recursive: true });
              }
              await Deno.writeTextFile(values.destination, convResult.output);
            } catch (e) {
              writeStderr(`Failed to write output to ${values.destination}: ${e}`);
              Deno.exit(1);
            }
          }
          writeStdout(convResult.output);
        } else {
          writeStderr(formatError(convResult.error));
          Deno.exit(1);
        }
        return;
      }
    }
  } catch (error: unknown) {
    if (error instanceof CliError) {
      writeStderr(`[${error.code}] ${error.message}`);
    } else if (error instanceof Error) {
      writeStderr(error.message);
    } else {
      writeStderr("An unknown error occurred");
    }
    Deno.exit(1);
  }

  // Fallback: show help
  writeStdout(HELP_TEXT);
}

if (import.meta.main) {
  try {
    await runBreakdown(Deno.args);
  } catch (error: unknown) {
    if (error instanceof CliError) {
      writeStderr(`[${error.code}] ${error.message}`);
    } else if (error instanceof Error) {
      writeStderr(error.message);
    } else {
      writeStderr("An unknown error occurred");
    }
    Deno.exit(1);
  }
}
