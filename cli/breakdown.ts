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

const HELP_TEXT = `
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
    writeStdout(result.error);
    Deno.exit(1);
  }

  // Handle help/version flags
  if (result.type === "no-params") {
    if (result.help) {
      writeStdout(HELP_TEXT);
      return;
    }
    if (result.version) {
      // Use displayVersion from commands/mod.ts
      const { displayVersion } = await import("../lib/commands/mod.ts");
      const versionResult = displayVersion();
      writeStdout(versionResult.output);
      return;
    }
    // If no command, show help
    writeStdout(HELP_TEXT);
    return;
  }

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
    // Validate CLI arguments using validateArgs (from lib/cli/args.ts)
    let parsedArgs: CommandOptions;
    try {
      parsedArgs = validateArgs(args.slice(1)); // skip the command itself (e.g., 'to')
    } catch (err) {
      if (err instanceof CliError) {
        writeStderr(`[${err.code}] ${err.message}`);
      } else if (err instanceof Error) {
        writeStderr(err.message);
      } else {
        writeStderr("Unknown argument error");
      }
      Deno.exit(1);
    }
    // call generateWithPrompt for 'to' command
    if (result.demonstrativeType === "to" && parsedArgs.from && parsedArgs.destination) {
      const { generateWithPrompt } = await import("../lib/commands/mod.ts");
      const convResult = await generateWithPrompt(
        parsedArgs.from,
        parsedArgs.destination,
        result.layerType || "project",
        false,
        {
          adaptation: parsedArgs.adaptation,
          promptDir: parsedArgs.promptDir,
          demonstrativeType: result.demonstrativeType,
        },
      );
      if (convResult.success) {
        writeStdout(convResult.output);
      } else {
        writeStderr(formatError(convResult.error));
        Deno.exit(1);
      }
      return;
    }
    // call generateWithPrompt for 'summary' command
    if (result.demonstrativeType === "summary" && parsedArgs.from && parsedArgs.destination) {
      const { generateWithPrompt } = await import("../lib/commands/mod.ts");
      const convResult = await generateWithPrompt(
        parsedArgs.from,
        parsedArgs.destination,
        result.layerType || "project",
        false,
        {
          adaptation: parsedArgs.adaptation,
          promptDir: parsedArgs.promptDir,
          demonstrativeType: result.demonstrativeType,
        },
      );
      if (convResult.success) {
        writeStdout(convResult.output);
      } else {
        writeStderr(formatError(convResult.error));
        Deno.exit(1);
      }
      return;
    }
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
