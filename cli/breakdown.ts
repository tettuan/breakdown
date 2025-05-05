console.log("[CLI] Deno.cwd():", Deno.cwd());
import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger@^0.1.10";
import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.0.10";
import { type OptionParams } from "jsr:@tettuan/breakdownparams@^0.1.11";
import { initWorkspace } from "../lib/commands/mod.ts";
import { type CommandOptions, validateCommandOptions as validateArgs } from "../lib/cli/args.ts";
import { ParamsParser } from "jsr:@tettuan/breakdownparams@^0.1.11";
import { readAll } from "jsr:@std/io@0.224.0/read-all";
import { CliError, CliErrorCode } from "../lib/cli/errors.ts";

const logger = new BreakdownLogger();
function getLogLevelFromEnv(): LogLevel {
  switch ((Deno.env.get("LOG_LEVEL") || "").toLowerCase()) {
    case "debug":
      return LogLevel.DEBUG;
    case "info":
      return LogLevel.INFO;
    case "warn":
      return LogLevel.WARN;
    case "error":
      return LogLevel.ERROR;
    default:
      return LogLevel.ERROR;
  }
}
logger.setLogLevel(getLogLevelFromEnv());
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
    let configLoadSuccess = false;
    try {
      await settings.loadConfig();
      configLoadSuccess = true;
    } catch (e) {
      configLoadSuccess = false;
      if (Deno.env.get("DEBUG")) {
        logger.error("[DEBUG] Config load failed", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
      throw e;
    }
    if (Deno.env.get("DEBUG")) {
      if (configLoadSuccess) {
        logger.debug("[DEBUG] Config loaded successfully");
      }
    }
    // DEBUG: 設定ファイルのパスを出力
    try {
      // BreakdownConfigがパス情報を持っていない場合はデフォルトパスを推定
      const cwd = Deno.cwd();
      const configDir = `${cwd}/.agent/breakdown/config`;
      const appYmlPath = `${configDir}/app.yml`;
      const userYmlPath = `${configDir}/user.yml`;
      logger.debug("[DEBUG] Loaded config files", { appYmlPath, userYmlPath });
    } catch (e) {
      logger.debug("[DEBUG] Could not determine config file paths", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
    const settingsConfig = await settings.getConfig();
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
    // generateWithPrompt呼び出し直前でpromptDirの階層ごとにstat
    if (parsedArgs.promptDir) {
      const pathParts = parsedArgs.promptDir.split(/[\\/]/).filter(Boolean);
      let currentPath = parsedArgs.promptDir.startsWith("/") ? "/" : "";
      for (let i = 0; i < pathParts.length; i++) {
        currentPath = currentPath === "/"
          ? `/${pathParts[i]}`
          : (currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i]);
        try {
          const stat = await Deno.stat(currentPath);
          logger.debug(`[CLI][stat階層] ${i}階層目: ${currentPath}`, {
            isDirectory: stat.isDirectory,
            isFile: stat.isFile,
          });
        } catch (err) {
          logger.error(`[CLI][stat階層] ${i}階層目: ${currentPath} stat失敗`, {
            error: err instanceof Error ? err.message : String(err),
          });
          break;
        }
      }
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
        writeStderr(convResult.error);
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
        writeStderr(convResult.error);
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
