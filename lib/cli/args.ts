/**
 * Command Line Argument Parser
 *
 * Handles parsing and validation of command line arguments for the Breakdown CLI.
 *
 * The specification and validation rules for this file are described in docs/breakdown/options.ja.md.
 *
 * Validates option combinations and enforces rules for input/output options.
 *
 * @module
 */

import { CliError, CliErrorCode } from "../cli/errors.ts";
import { join } from "@std/path";

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
  /** Path or identifier for the output destination. */
  destination?: string;
  /** Input type (e.g., project, issue, task). */
  input?: string;
  /** Working directory for the CLI process. */
  workingDir?: string;
  /** Demonstrative type for the CLI. */
  demonstrative?: string;
  /** Layer type for the CLI. */
  layer?: string;
  /** Adaptation type for the CLI. */
  adaptation?: string;
  /** Directory containing prompt files. */
  promptDir?: string;
  /** Custom variables specified with --uv-* options. */
  customVariables?: Record<string, string>;
  /** Extended mode flag (--extended). */
  extended?: boolean;
  /** Custom validation flag (--custom-validation). */
  customValidation?: boolean;
  /** Error format option (--error-format). */
  errorFormat?: "simple" | "detailed" | "json";
  /** Path to configuration file. */
  config?: string;
}

/**
 * Valid command line options and their aliases.
 * Maps long and short option names for the CLI.
 */
export const VALID_OPTIONS = new Map<string, string>([
  ["--from", "-f"],
  ["--destination", "-o"],
  ["--input", "-i"],
  ["--adaptation", "-a"],
  ["--prompt-dir", ""],
  ["--extended", ""],
  ["--custom-validation", ""],
  ["--error-format", ""],
  ["--config", "-c"],
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
  };

  const seenOptions = new Set<string>();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("-")) continue;

    // Handle equals-separated options (--from=value)
    let optionName = arg;
    let optionValue: string | undefined;

    if (arg.includes("=")) {
      const [name, ...valueParts] = arg.split("=");
      optionName = name;
      optionValue = valueParts.join("=");
    }

    const canonicalName = getCanonicalOptionName(optionName);

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
        if (optionValue !== undefined) {
          options.from = optionValue;
        } else {
          options.from = args[++i];
        }
        break;
      case "--destination":
        if (optionValue !== undefined) {
          options.destination = optionValue;
        } else {
          options.destination = args[++i];
        }
        break;
      case "--input": {
        if (options.from) {
          throw new CliError(
            CliErrorCode.CONFLICTING_OPTIONS,
            "Cannot use --from and --input together",
          );
        }
        const inputType = optionValue !== undefined ? optionValue : args[++i];
        if (!isValidInputType(inputType)) {
          throw new CliError(
            CliErrorCode.INVALID_INPUT_TYPE,
            `Invalid input layer type: ${inputType}`,
          );
        }
        options.input = inputType;
        break;
      }
      case "--adaptation":
      case "-a":
        if (options.adaptation) {
          throw new CliError(
            CliErrorCode.DUPLICATE_OPTION,
            "Duplicate option: --adaptation is used multiple times",
          );
        }
        if (optionValue !== undefined) {
          options.adaptation = optionValue;
        } else {
          options.adaptation = args[++i];
        }
        break;
      case "--prompt-dir":
        if (options.promptDir) {
          throw new CliError(
            CliErrorCode.DUPLICATE_OPTION,
            "Duplicate option: --prompt-dir is used multiple times",
          );
        }
        if (optionValue !== undefined) {
          options.promptDir = optionValue;
        } else {
          options.promptDir = args[++i];
        }
        break;
      case "--config":
      case "-c": {
        if (options.config) {
          throw new CliError(
            CliErrorCode.DUPLICATE_OPTION,
            "Duplicate option: --config is used multiple times",
          );
        }
        // Resolve config name to actual file path
        const configValue = optionValue !== undefined ? optionValue : args[++i];
        options.config = resolveConfigPath(configValue);
        break;
      }
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

  // Require --destination for --from, except when --from is "-" (stdin)
  if (options.from && options.from !== "-" && !options.destination) {
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
    "--adaptation": "--adaptation",
    "-a": "--adaptation",
    "--prompt-dir": "--prompt-dir",
    "--config": "--config",
    "-c": "--config",
  };
  return optionMap[option];
}

function isValidInputType(type: string): boolean {
  return ["project", "issue", "task"].includes(type);
}

/**
 * Parses custom variables from command line arguments.
 * Custom variables are specified with --uv-* options.
 *
 * @param args Raw command line arguments.
 * @returns Record of custom variables (key-value pairs).
 */
export function parseCustomVariables(args: string[]): Record<string, string> {
  const customVariables: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--uv-")) {
      // Handle equals-separated custom variables (--uv-var=value)
      if (arg.includes("=")) {
        const [name, ...valueParts] = arg.split("=");
        const variableName = name.slice(5); // Remove "--uv-" prefix
        const value = valueParts.join("=");
        customVariables[variableName] = value;
      } else {
        // Handle space-separated custom variables (--uv-var value)
        const variableName = arg.slice(5); // Remove "--uv-" prefix
        const value = args[i + 1];
        if (value && !value.startsWith("-")) {
          customVariables[variableName] = value;
          i++; // Skip the value on next iteration
        } else {
          throw new CliError(
            CliErrorCode.INVALID_OPTION,
            `Custom variable ${arg} requires a value`,
          );
        }
      }
    }
  }

  return customVariables;
}

/**
 * Valid error format values.
 */
export const VALID_ERROR_FORMATS = new Set([
  "simple",
  "detailed",
  "json",
]);

/**
 * Predefined configuration name to file path mappings.
 * These allow users to specify --config=test instead of full file paths.
 */
export const PREDEFINED_CONFIGS = new Map<string, string>([
  ["test", "config/test-app.yml"],
  ["dev", "config/dev-app.yml"],
  ["prod", "config/prod-app.yml"],
  ["production", "config/production-app.yml"],
]);

/**
 * Resolves a configuration name or path to an actual file path.
 * If the value matches a predefined config name, returns the mapped path.
 * Otherwise, treats the value as a file path and returns it as-is.
 *
 * @param configValue - The configuration name or file path from --config option
 * @param workingDir - The working directory to resolve relative paths against (defaults to current working directory)
 * @returns Resolved configuration file path
 */
export function resolveConfigPath(configValue: string, workingDir?: string): string {
  // Check if it's a predefined configuration name
  if (PREDEFINED_CONFIGS.has(configValue)) {
    const predefinedPath = PREDEFINED_CONFIGS.get(configValue)!;
    const baseDir = workingDir || Deno.cwd();
    return join(baseDir, predefinedPath);
  }

  // If not a predefined name, treat as file path
  // If it's already absolute, return as-is
  // If relative, resolve against working directory
  if (configValue.startsWith("/")) {
    return configValue;
  }

  const baseDir = workingDir || Deno.cwd();
  return join(baseDir, configValue);
}

/**
 * Gets the value for a command line option.
 *
 * @param args Raw command line arguments.
 * @param option Option name to get value for.
 * @returns Option value or undefined if not found.
 */
export function getOptionValue(args: string[], option: string): string | undefined {
  // Check for equals-separated options first
  for (const arg of args) {
    if (arg.includes("=")) {
      const [name, ...valueParts] = arg.split("=");
      if (name === option) {
        return valueParts.join("=");
      }
      // Try short form
      const shortForm = VALID_OPTIONS.get(option);
      if (shortForm && name === shortForm) {
        return valueParts.join("=");
      }
    }
  }

  // Fallback to space-separated options
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
 * This is a simplified wrapper around parseArgs for backward compatibility.
 *
 * @param args Raw command line arguments.
 * @returns Validated CommandOptions object.
 * @throws {CliError} If validation fails.
 */
export function validateCommandOptions(args: string[]): CommandOptions {
  const options = parseArgs(args);

  // Parse custom variables separately as they're not handled by parseArgs
  options.customVariables = parseCustomVariables(args);

  return options;
}
