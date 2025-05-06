/**
 * Command Line Argument Parser
 *
 * Handles parsing and validation of command line arguments for the Breakdown CLI.
 * Validates option combinations and enforces rules for input/output options.
 *
 * @module
 */

import { CliError, CliErrorCode } from "../cli/errors.ts";

/**
 * Error thrown when command line arguments are invalid.
 * Used to indicate issues with CLI argument parsing or validation.
 */
export class ArgumentError extends Error {
  /**
   * Creates a new ArgumentError instance.
   * @param message The error message describing the invalid argument.
   */
  constructor(message: string) {
    super(message);
    this.name = "ArgumentError";
  }
}

/**
 * Type definition for command line options.
 * Represents the set of options that can be passed to the Breakdown CLI.
 */
export interface CommandOptions {
  /** Path or identifier for the source input. */
  from?: string;
  /** Path to a file to use as input. */
  fromFile?: string;
  /** Project identifier to use as input. */
  fromProject?: string;
  /** Issue identifier to use as input. */
  fromIssue?: string;
  /** Path or identifier for the output destination. */
  destination?: string;
  /** Input type (e.g., project, issue, task). */
  input?: string;
  /** Working directory for the CLI process. */
  workingDir?: string;
  /** Suppress output if true. */
  quiet?: boolean;
  /** Enable debug mode if true. */
  debug: boolean;
  /** Demonstrative type for the CLI. */
  demonstrative?: string;
  /** Layer type for the CLI. */
  layer?: string;
  /** Adaptation type for the CLI. */
  adaptation?: string;
  /** Directory containing prompt files. */
  promptDir?: string;
}

/**
 * Valid command line options and their aliases.
 * Maps long and short option names for the CLI.
 */
export const VALID_OPTIONS = new Map<string, string>([
  ["--from", "-f"],
  ["--destination", "-o"],
  ["--input", "-i"],
  ["--debug", "-d"],
  ["--no-debug", "-n"],
  ["--adaptation", "-a"],
  ["--prompt-dir", ""],
]);

/**
 * Valid input layer types that can be used with --input.
 */
export const VALID_INPUT_TYPES = new Set([
  "project",
  "issue",
  "task",
]);

/**
 * Parses and validates command line arguments.
 * Throws a CliError if arguments are invalid or conflicting.
 *
 * @param args Raw command line arguments.
 * @returns Validated argument object.
 * @throws {CliError} If arguments are invalid or conflicting.
 */
export function parseArgs(args: string[]): CommandOptions {
  const options: CommandOptions = {
    from: undefined,
    destination: undefined,
    input: undefined,
    debug: false,
  };

  const seenOptions = new Set<string>();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("-")) continue;

    const option = arg.startsWith("--") ? arg : `--${arg.slice(1)}`;
    const canonicalName = getCanonicalOptionName(option);

    if (!canonicalName) {
      throw new CliError(CliErrorCode.INVALID_OPTION, `Invalid option: ${arg}`);
    }

    if (seenOptions.has(canonicalName)) {
      throw new CliError(
        CliErrorCode.DUPLICATE_OPTION,
        `Duplicate option: ${arg} is used multiple times`,
      );
    }
    seenOptions.add(canonicalName);

    switch (canonicalName) {
      case "--from":
        if (options.input) {
          throw new CliError(
            CliErrorCode.CONFLICTING_OPTIONS,
            "Cannot use --from and --input together",
          );
        }
        options.from = args[++i];
        break;
      case "--destination":
        options.destination = args[++i];
        break;
      case "--input": {
        if (options.from) {
          throw new CliError(
            CliErrorCode.CONFLICTING_OPTIONS,
            "Cannot use --from and --input together",
          );
        }
        const inputType = args[++i];
        if (!isValidInputType(inputType)) {
          throw new CliError(
            CliErrorCode.INVALID_INPUT_TYPE,
            `Invalid input layer type: ${inputType}`,
          );
        }
        options.input = inputType;
        break;
      }
      case "--debug":
        options.debug = true;
        break;
      case "--no-debug":
        options.debug = false;
        break;
      case "--adaptation":
      case "-a":
        if (options.adaptation) {
          throw new CliError(
            CliErrorCode.DUPLICATE_OPTION,
            "Duplicate option: --adaptation is used multiple times",
          );
        }
        options.adaptation = args[++i];
        break;
      case "--prompt-dir":
        if (options.promptDir) {
          throw new CliError(
            CliErrorCode.DUPLICATE_OPTION,
            "Duplicate option: --prompt-dir is used multiple times",
          );
        }
        options.promptDir = args[++i];
        break;
      default:
        throw new CliError(CliErrorCode.INVALID_OPTION, `Invalid option: ${arg}`);
    }
  }

  // Validate required options
  if (!options.from && !options.input) {
    throw new CliError(
      CliErrorCode.MISSING_REQUIRED,
      "Invalid input parameters: missing --from or --input",
    );
  }

  if (options.from && !options.destination) {
    throw new CliError(
      CliErrorCode.MISSING_REQUIRED,
      "Invalid input parameters: missing --destination for --from",
    );
  }

  return options;
}

function getCanonicalOptionName(option: string): string | undefined {
  const optionMap: Record<string, string> = {
    "--from": "--from",
    "-f": "--from",
    "--destination": "--destination",
    "-o": "--destination",
    "--input": "--input",
    "-i": "--input",
    "--debug": "--debug",
    "-d": "--debug",
    "--no-debug": "--no-debug",
    "--adaptation": "--adaptation",
    "-a": "--adaptation",
    "--prompt-dir": "--prompt-dir",
  };
  return optionMap[option];
}

function isValidInputType(type: string): boolean {
  return ["project", "issue", "task"].includes(type);
}

/**
 * Gets the value for a command line option.
 *
 * @param args Raw command line arguments.
 * @param option Option name to get value for.
 * @returns Option value or undefined if not found.
 */
export function getOptionValue(args: string[], option: string): string | undefined {
  const index = args.indexOf(option);
  if (index === -1) {
    // Try short form
    const shortForm = VALID_OPTIONS.get(option);
    if (shortForm) {
      const shortIndex = args.indexOf(shortForm);
      if (shortIndex !== -1 && shortIndex < args.length - 1) {
        return args[shortIndex + 1];
      }
    }
    return undefined;
  }
  if (index < args.length - 1) {
    return args[index + 1];
  }
  return undefined;
}

/**
 * Validates command line options and returns a CommandOptions object.
 * Throws a CliError if validation fails.
 *
 * @param args Raw command line arguments.
 * @returns Validated CommandOptions object.
 * @throws {CliError} If validation fails.
 */
export function validateCommandOptions(args: string[]): CommandOptions {
  const options: CommandOptions = {
    debug: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("-")) continue;

    const value = args[i + 1];
    switch (arg) {
      case "--from":
      case "-f":
        if (options.from) {
          throw new CliError(
            CliErrorCode.DUPLICATE_OPTION,
            "Duplicate option: --from is used multiple times",
          );
        }
        if (options.input) {
          throw new CliError(
            CliErrorCode.CONFLICTING_OPTIONS,
            "Cannot use --from and --input together",
          );
        }
        options.from = value;
        i++;
        break;
      case "--destination":
      case "-o":
        if (options.destination) {
          throw new CliError(
            CliErrorCode.DUPLICATE_OPTION,
            "Duplicate option: --destination is used multiple times",
          );
        }
        options.destination = value;
        i++;
        break;
      case "--input":
      case "-i":
        if (options.input) {
          throw new CliError(
            CliErrorCode.DUPLICATE_OPTION,
            "Duplicate option: --input is used multiple times",
          );
        }
        if (options.from) {
          throw new CliError(
            CliErrorCode.CONFLICTING_OPTIONS,
            "Cannot use --from and --input together",
          );
        }
        if (!isValidInputType(value)) {
          throw new CliError(CliErrorCode.INVALID_INPUT_TYPE, `Invalid input layer type: ${value}`);
        }
        options.input = value;
        i++;
        break;
      case "--debug":
        options.debug = true;
        break;
      case "--no-debug":
        options.debug = false;
        break;
      case "--adaptation":
      case "-a":
        if (options.adaptation) {
          throw new CliError(
            CliErrorCode.DUPLICATE_OPTION,
            "Duplicate option: --adaptation is used multiple times",
          );
        }
        options.adaptation = value;
        i++;
        break;
      case "--prompt-dir":
        if (options.promptDir) {
          throw new CliError(
            CliErrorCode.DUPLICATE_OPTION,
            "Duplicate option: --prompt-dir is used multiple times",
          );
        }
        options.promptDir = value;
        i++;
        break;
      default:
        throw new CliError(CliErrorCode.INVALID_OPTION, `Unknown option: ${arg}`);
    }
  }

  return options;
}
