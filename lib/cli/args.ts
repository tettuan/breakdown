/**
 * Command Line Argument Parser
 *
 * Handles parsing and validation of command line arguments for the Breakdown CLI.
 * Validates option combinations and enforces rules for input/output options.
 */

/**
 * Error thrown when command line arguments are invalid
 */
export class ArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArgumentError";
  }
}

/**
 * Type definition for command line options
 */
export interface CommandOptions {
  from?: string;
  fromFile?: string;
  fromProject?: string;
  fromIssue?: string;
  destination?: string;
  input?: string;
  workingDir?: string;
  quiet?: boolean;
  debug: boolean;
  demonstrative?: string;
  layer?: string;
  adaptation?: string;
}

// Valid command line options and their aliases
export const VALID_OPTIONS = new Map<string, string>([
  ["--from", "-f"],
  ["--destination", "-o"],
  ["--input", "-i"],
  ["--debug", "-d"],
  ["--no-debug", "-n"],
  ["--adaptation", "-a"],
]);

// Input layer types that can be used with --input
export const VALID_INPUT_TYPES = new Set([
  "project",
  "issue",
  "task",
]);

/**
 * Parses and validates command line arguments
 * @param args Raw command line arguments
 * @returns Validated argument object or error message
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
      throw new Error(`Invalid option: ${arg}`);
    }

    if (seenOptions.has(canonicalName)) {
      throw new Error(`Duplicate option: ${arg} is used multiple times`);
    }
    seenOptions.add(canonicalName);

    switch (canonicalName) {
      case "--from":
        if (options.input) {
          throw new Error("Cannot use --from and --input together");
        }
        options.from = args[++i];
        break;
      case "--destination":
        options.destination = args[++i];
        break;
      case "--input": {
        if (options.from) {
          throw new Error("Cannot use --from and --input together");
        }
        const inputType = args[++i];
        if (!isValidInputType(inputType)) {
          throw new Error("Invalid input layer type");
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
          throw new Error("Duplicate option: --adaptation is used multiple times");
        }
        options.adaptation = args[++i];
        break;
      default:
        throw new Error(`Invalid option: ${arg}`);
    }
  }

  // Validate required options
  if (!options.from && !options.input) {
    throw new Error("Either --from or --input must be specified");
  }

  if (options.from && !options.destination) {
    throw new Error("--destination is required when using --from");
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
  };
  return optionMap[option];
}

function isValidInputType(type: string): boolean {
  return ["project", "issue", "task"].includes(type);
}

/**
 * Gets the value for a command line option
 * @param args Raw command line arguments
 * @param option Option name to get value for
 * @returns Option value or undefined if not found
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
          throw new Error("Duplicate option: --from is used multiple times");
        }
        if (options.input) {
          throw new Error("Cannot use --from and --input together");
        }
        options.from = value;
        i++;
        break;
      case "--destination":
      case "-o":
        if (options.destination) {
          throw new Error("Duplicate option: --destination is used multiple times");
        }
        options.destination = value;
        i++;
        break;
      case "--input":
      case "-i":
        if (options.input) {
          throw new Error("Duplicate option: --input is used multiple times");
        }
        if (options.from) {
          throw new Error("Cannot use --from and --input together");
        }
        if (!["project", "issue", "task"].includes(value)) {
          throw new Error("Invalid input layer type");
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
          throw new Error("Duplicate option: --adaptation is used multiple times");
        }
        options.adaptation = value;
        i++;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}
