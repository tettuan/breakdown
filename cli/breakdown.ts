import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger@^0.1.10";
import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.0.10";
import { type OptionParams } from "jsr:@tettuan/breakdownparams@^0.1.11";
import { initWorkspace } from "../lib/commands/mod.ts";
import { type CommandOptions, validateCommandOptions as validateArgs } from "../lib/cli/args.ts";

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
  logger.error(message);
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
  logger.debug("Running breakdown command", { args });

  if (args.length === 0) {
    writeStdout(HELP_TEXT);
    return;
  }

  try {
    // Get command first - do this before param parsing
    const command = getCommand(args);
    logger.debug("Command extracted", { command });

    if (!command) {
      handleTestError("No command specified");
      return;
    }

    // Initialize configuration
    await settings.loadConfig();
    const settingsConfig = await settings.getConfig();
    logger.debug("Configuration loaded");

    // Check for duplicate options first
    try {
      logger.debug("Checking for duplicate options");
      checkDuplicateOptions(args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.debug("Duplicate options error", { error: errorMessage });
      handleTestError(errorMessage);
      return;
    }

    // Parse command parameters and execute command
    let options: CommandOptions = {
      debug: false,
    };
    try {
      // Parse options first
      options = validateArgs(args.slice(1));
      logger.debug("Parameters parsed", { parsedParams: options });

      // Set logger level based on options
      if (options.debug) {
        logger.setLogLevel(LogLevel.DEBUG);
      }

      // Execute command based on type
      switch (command) {
        case "init":
          await initWorkspace(options.workingDir || settingsConfig.working_dir || ".");
          break;
        case "to":
        case "summary":
        case "defect": {
          // Get layer type from args
          const layerType = args[1];
          if (!layerType || !normalizeLayerType(layerType)) {
            handleTestError(`Invalid layer type: ${layerType}`);
            return;
          }

          if (!options.from && !options.input) {
            handleTestError("Either --from or --input option is required");
            return;
          }
          if (options.from && options.from !== "-") {
            try {
              await Deno.stat(options.from);
            } catch {
              handleTestError(`File not found: ${options.from}`);
              return;
            }
          }
          // Handle command execution...
          break;
        }
        default:
          handleTestError(`Unknown command type: ${command}`);
          return;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.debug("Command execution error", { error: errorMessage });
      handleTestError(errorMessage);
      return;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug("Breakdown execution error", { error: errorMessage });
    handleTestError(errorMessage);
    return;
  }
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
