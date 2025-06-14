/**
 * Breakdown CLI Entrypoint
 *
 * This module provides the command-line interface for the Breakdown tool. It parses arguments, dispatches commands,
 * and handles user interaction for initializing workspaces, converting layers, generating summaries, and defect reports.
 *
 * @module
 */
import { initWorkspace } from "../lib/commands/mod.ts";
import { type CommandOptions, validateCommandOptions as validateArgs } from "../lib/cli/args.ts";
import { EnhancedParamsParser } from "../lib/cli/parser/enhanced_params_parser.ts";
import { CliError } from "../lib/cli/errors.ts";
import { isStdinAvailable, readStdin } from "../lib/io/stdin.ts";
import { resolve } from "@std/path";
import { CommandOptionsValidator } from "../lib/cli/validators/command_options_validator.ts";
import type { ThreeParamsResult } from "../lib/cli/validators/three_command_validator.ts";
import type {
  OneParamsResult,
  ParamsResult,
  TwoParamsResult,
} from "jsr:@tettuan/breakdownparams@^1.0.1";

/**
 * Help text displayed for the Breakdown CLI.
 * Provides usage instructions, command descriptions, and available options for users.
 */
export const HELP_TEXT: string = `
Breakdown - AI Development Instruction Tool

Usage:
  breakdown [command] [options]

Commands:
  init                    Initialize a new workspace
  to <layer>             Convert to specified layer type
  summary <layer>        Generate summary for layer type
  defect <layer>         Generate defect report for layer type
  find bugs              Find and analyze bugs in code

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
 * Pre-processes command line arguments to separate commands from options.
 * This works around BreakdownParams v1.0.1 limitation where options are counted as arguments.
 *
 * @param args - Original command line arguments
 * @returns Object with separated command arguments and extracted options
 */
function preprocessCommandLine(args: string[]): {
  commandArgs: string[];
  extractedOptions: Record<string, string | boolean>;
} {
  const commandArgs: string[] = [];
  const extractedOptions: Record<string, string | boolean> = {};

  // Find the end of command arguments (stop at first option)
  let commandEndIndex = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("-")) {
      commandEndIndex = i;
      break;
    }
    commandArgs.push(args[i]);
    commandEndIndex = i + 1;
  }

  // If no options found, return original args
  if (commandEndIndex >= args.length) {
    return { commandArgs: args, extractedOptions: {} };
  }

  // Process options
  for (let i = commandEndIndex; i < args.length; i++) {
    const arg = args[i];

    // Custom variables (--uv-*) are handled by EnhancedParamsParser
    // Check for custom variables BEFORE general equals format handling
    if (arg.startsWith("--uv-")) {
      // Pass through to commandArgs for EnhancedParamsParser to handle
      commandArgs.push(arg);
      // Check if this custom variable has a value (non-equals format)
      if (!arg.includes("=") && i + 1 < args.length && !args[i + 1].startsWith("-")) {
        commandArgs.push(args[i + 1]);
        i++; // Skip the value
      }
      continue;
    }

    // Handle equals format (-f=value, --from=value)
    if (arg.includes("=")) {
      const [option, ...valueParts] = arg.split("=");
      const value = valueParts.join("=");
      const key = option.replace(/^-+/, "");
      extractedOptions[key] = value;
      continue;
    }

    // Handle regular options
    if (arg.startsWith("-")) {
      const key = arg.replace(/^-+/, "");
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        extractedOptions[key] = args[i + 1];
        i++; // Skip value
      } else {
        extractedOptions[key] = true;
      }
      continue;
    }

    // If we get here, it's a value without an option (shouldn't happen with our logic)
    commandArgs.push(arg);
  }

  return { commandArgs, extractedOptions };
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
  // Pre-process arguments to handle BreakdownParams limitations
  const { commandArgs, extractedOptions } = preprocessCommandLine(args);

  const parser = new EnhancedParamsParser();
  const result = parser.parse(commandArgs);

  // Handle error from EnhancedParamsParser
  if (result.type === "error" && result.error) {
    writeStderr(result.error.message || "Unknown error");
    Deno.exit(1);
  }

  // Handle help/version flags from both ParamsParser and extractedOptions
  if (result.type === "zero") {
    if (result.options.help || extractedOptions.help || extractedOptions.h) {
      writeStdout(HELP_TEXT);
      return;
    }
    if (result.options.version || extractedOptions.version || extractedOptions.v) {
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
    // Get filtered args without custom variables to avoid duplicate processing
    // EnhancedParamsParser already processed custom variables and added them to result.options.customVariables
    const filteredArgs = commandArgs.filter((arg) => !arg.startsWith("--uv-"));
    const parsedOptions = validateArgs(filteredArgs);
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
    if (result.type === "one") {
      const oneResult = result as OneParamsResult;
      if (oneResult.demonstrativeType === "init") {
        await initWorkspace(".");
        return;
      }
      // Add more single commands as needed
    }

    // Double command (e.g., to, summary, defect)
    if (result.type === "two") {
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
      const twoResult = result as TwoParamsResult;
      if (twoResult.demonstrativeType === "to") {
        const { generateWithPrompt } = await import("../lib/commands/mod.ts");
        const convResult = await generateWithPrompt(
          fromFile, // fromFile
          values.destination || "output.md", // Default output file
          twoResult.layerType,
          false,
          {
            adaptation: values.adaptation,
            promptDir: values.promptDir,
            demonstrativeType: twoResult.demonstrativeType,
            customVariables: twoResult.options.customVariables as Record<string, string>,
            extended: twoResult.options.extended as boolean,
            customValidation: twoResult.options.customValidation as boolean,
            errorFormat: twoResult.options.errorFormat as "detailed" | "simple" | "json",
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
      if (twoResult.demonstrativeType === "summary") {
        const { generateWithPrompt } = await import("../lib/commands/mod.ts");
        const convResult = await generateWithPrompt(
          fromFile, // fromFile
          values.destination || "output.md", // Default output file
          twoResult.layerType,
          false,
          {
            adaptation: values.adaptation,
            promptDir: values.promptDir,
            demonstrativeType: twoResult.demonstrativeType,
            customVariables: twoResult.options.customVariables as Record<string, string>,
            extended: twoResult.options.extended as boolean,
            customValidation: twoResult.options.customValidation as boolean,
            errorFormat: twoResult.options.errorFormat as "detailed" | "simple" | "json",
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

    // Three-word command (e.g., find bugs)
    if (result.type === "three") {
      const threeResult = result as ThreeParamsResult;
      if (threeResult.demonstrativeType === "find" && threeResult.subCommand === "bugs") {
        // --- STDIN/ファイル入力の取得 (three-word command用) ---
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
          writeStderr("No input provided via stdin or --from option for find bugs command");
          Deno.exit(1);
        }

        // --- Factory/PromptManagerに渡す (three-word command用) ---
        const extraVars = values.from === "-"
          ? { input_text: inputText }
          : values.from
          ? { input_text_file: inputTextFile }
          : { input_text: inputText };
        const fromFile = values.from || (isStdinAvailable() ? "-" : "");

        const { generateWithPrompt } = await import("../lib/commands/mod.ts");
        const convResult = await generateWithPrompt(
          fromFile, // fromFile
          values.destination || "bugs_report.md", // Default output file for bug reports
          "bugs", // Use "bugs" as layerType for find bugs command
          false,
          {
            adaptation: values.adaptation,
            promptDir: values.promptDir,
            demonstrativeType: "find", // Use "find" as demonstrative type
            customVariables: threeResult.options.customVariables as Record<string, string>,
            extended: threeResult.options.extended as boolean,
            customValidation: threeResult.options.customValidation as boolean,
            errorFormat: threeResult.options.errorFormat as "detailed" | "simple" | "json",
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
      } else {
        writeStderr(
          `Unsupported three-word command: ${threeResult.demonstrativeType} ${threeResult.subCommand}`,
        );
        Deno.exit(1);
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
