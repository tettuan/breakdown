import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger@^0.1.10";
import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.0.10";
import { type OptionParams } from "jsr:@tettuan/breakdownparams@^0.1.11";
import { initWorkspace } from "../lib/commands/mod.ts";
import { type CommandOptions, validateCommandOptions as validateArgs } from "../lib/cli/args.ts";
import { ParamsParser } from "jsr:@tettuan/breakdownparams@^0.1.11";
import { readAll } from "jsr:@std/io@0.224.0/read-all";

const logger = new BreakdownLogger();
const settings = new BreakdownConfig();

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

/**
 * Extended options for Breakdown CLI commands.
 *
 * This interface extends OptionParams to include additional CLI-specific options
 * such as file paths, help/version flags, and debug mode.
 */
export interface ExtendedOptionParams extends OptionParams {
  fromFile?: string;
  destinationFile?: string;
  inputLayerType?: string;
  help?: boolean;
  version?: boolean;
  noDebug?: boolean;
}

function normalizeLayerType(type: string): string | undefined {
  const projectAliases = ["project", "pj", "prj"];
  const issueAliases = ["issue", "story"];
  const taskAliases = ["task", "todo", "chore", "style", "fix", "error", "bug"];

  if (projectAliases.includes(type.toLowerCase())) return "project";
  if (issueAliases.includes(type.toLowerCase())) return "issue";
  if (taskAliases.includes(type.toLowerCase())) return "task";
  return undefined;
}

function getCommand(args: string[]): string | undefined {
  return args.length > 0 && !args[0].startsWith("--") ? args[0] : undefined;
}

function checkDuplicateOptions(args: string[]): void {
  const seenOptions = new Map<string, string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const option = arg.slice(2);
      const value = args[i + 1];
      if (seenOptions.has(option)) {
        throw new Error(`Duplicate option: ${arg} is used multiple times`);
      }
      if (value && !value.startsWith("--")) {
        seenOptions.set(option, value);
      }
    }
  }
}

function writeStdout(message: string): void {
  Deno.stdout.writeSync(new TextEncoder().encode(message + "\n"));
}

function writeStderr(message: string): void {
  Deno.stderr.writeSync(new TextEncoder().encode(message + "\n"));
}

function handleTestError(message: string): void {
  writeStderr(message);
  writeStdout(HELP_TEXT);
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
    // Only load config for non-init commands
    await settings.loadConfig();
    const settingsConfig = await settings.getConfig();
    // Validate CLI arguments using validateArgs (from lib/cli/args.ts)
    let parsedArgs: CommandOptions;
    try {
      parsedArgs = validateArgs(args.slice(1)); // skip the command itself (e.g., 'to')
    } catch (err) {
      if (err instanceof Error) {
        writeStderr(err.message);
      } else {
        writeStderr("Unknown argument error");
      }
      Deno.exit(1);
    }
    // Minimal implementation: call convertFile for 'to' command
    if (result.demonstrativeType === "to" && parsedArgs.from && parsedArgs.destination) {
      const { convertFile } = await import("../lib/commands/mod.ts");
      if (parsedArgs.from === "-") {
        // Read from stdin and write to destination
        const decoder = new TextDecoder();
        const input = await readAll(Deno.stdin);
        const content = decoder.decode(input);
        try {
          // Ensure destination directory exists
          const destDir = parsedArgs.destination.substring(
            0,
            parsedArgs.destination.lastIndexOf("/"),
          );
          if (destDir) {
            const { ensureDir } = await import("jsr:@std/fs@^0.224.0");
            await ensureDir(destDir);
          }
          await Deno.writeTextFile(parsedArgs.destination, content);
          writeStdout(`Converted stdin to ${parsedArgs.destination}`);
        } catch (error) {
          writeStderr(error instanceof Error ? error.message : String(error));
        }
        return;
      } else {
        const convResult = await convertFile(
          parsedArgs.from,
          parsedArgs.destination,
          result.layerType || "project",
        );
        if (convResult.success) {
          writeStdout(convResult.output);
        } else {
          writeStderr(convResult.error);
        }
      }
      return;
    }
    // Add summary command handling with adaptation and prompt-dir
    if (result.demonstrativeType === "summary" && parsedArgs.from && parsedArgs.destination) {
      const { processWithPrompt } = await import("../lib/prompt/processor.ts");
      // Use parsedArgs.promptDir if present
      const promptBaseDir = parsedArgs.promptDir;
      const adaptationIdx = args.findIndex((a) => a === "--adaptation" || a === "-a");
      const adaptation = adaptationIdx !== -1 ? args[adaptationIdx + 1] : parsedArgs.adaptation;
      try {
        await processWithPrompt(
          result.demonstrativeType,
          (result.layerType as any) || "task",
          parsedArgs.from,
          parsedArgs.destination,
          { adaptation, promptBaseDir },
        );
        writeStdout(`Summary generated to ${parsedArgs.destination}`);
      } catch (err) {
        writeStderr(err instanceof Error ? err.message : String(err));
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
    if (error instanceof Error) {
      writeStderr(error.message);
    } else {
      writeStderr("An unknown error occurred");
    }
    Deno.exit(1);
  }
}
