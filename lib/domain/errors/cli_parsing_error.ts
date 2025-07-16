/**
 * @fileoverview CLI Parsing Domain Errors
 *
 * Errors related to command-line argument parsing and validation.
 * Provides detailed context about what went wrong during CLI parsing.
 *
 * @module domain/errors/cli_parsing_error
 */

import { BaseBreakdownError } from "./breakdown_error.ts";

/**
 * CLI parsing error types
 */
export type CLIParsingErrorKind =
  | "missing-required-argument"
  | "invalid-argument-format"
  | "unknown-option"
  | "invalid-option-value"
  | "conflicting-options"
  | "too-many-arguments"
  | "invalid-command"
  | "parsing-failed";

/**
 * CLI Parsing Error
 * Thrown when command-line argument parsing fails
 */
export class CLIParsingError extends BaseBreakdownError {
  override readonly domain = "cli-parsing" as const;
  override readonly kind: CLIParsingErrorKind;

  constructor(
    kind: CLIParsingErrorKind,
    message: string,
    options?: {
      cause?: Error;
      context?: {
        argument?: string;
        value?: string;
        expected?: string;
        actual?: string;
        position?: number;
        availableOptions?: string[];
        providedArgs?: string[];
        command?: string;
      };
    },
  ) {
    super(message, "cli-parsing", kind, options?.context);
    this.kind = kind;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }

  /**
   * Create error for missing required argument
   */
  static missingRequired(argument: string, position?: number): CLIParsingError {
    return new CLIParsingError(
      "missing-required-argument",
      `Missing required argument: ${argument}`,
      {
        context: { argument, position },
      },
    );
  }

  /**
   * Create error for invalid argument format
   */
  static invalidFormat(
    argument: string,
    value: string,
    expected: string,
  ): CLIParsingError {
    return new CLIParsingError(
      "invalid-argument-format",
      `Invalid format for argument '${argument}': expected ${expected}, got '${value}'`,
      {
        context: { argument, value, expected },
      },
    );
  }

  /**
   * Create error for invalid parameter
   */
  static invalidParameter(
    parameter: string,
    message: string,
  ): CLIParsingError {
    return new CLIParsingError(
      "invalid-argument-format",
      `Invalid parameter '${parameter}': ${message}`,
      {
        context: { argument: parameter },
      },
    );
  }

  /**
   * Create error for unknown option
   */
  static unknownOption(
    option: string,
    availableOptions: string[],
  ): CLIParsingError {
    // Totality: Ensure safe array operations
    const cleanOption = option.replace(/-/g, "");
    const suggestions = availableOptions
      .filter((opt) => {
        if (typeof opt !== "string" || opt.length === 0) return false;
        const cleanOpt = opt.replace(/-/g, "");
        return cleanOpt.includes(cleanOption) || cleanOption.includes(cleanOpt);
      })
      .slice(0, 3);

    // Totality: Safe message construction
    const message = suggestions.length > 0
      ? `Unknown option '${option}'. Did you mean: ${suggestions.join(", ")}?`
      : `Unknown option '${option}'`;

    return new CLIParsingError(
      "unknown-option",
      message,
      {
        context: { argument: option, availableOptions },
      },
    );
  }

  /**
   * Create error for invalid option value
   */
  static invalidOptionValue(
    option: string,
    value: string,
    expected: string,
  ): CLIParsingError {
    return new CLIParsingError(
      "invalid-option-value",
      `Invalid value '${value}' for option '${option}': ${expected}`,
      {
        context: { argument: option, value, expected },
      },
    );
  }

  /**
   * Create error for conflicting options
   */
  static conflictingOptions(
    option1: string,
    option2: string,
  ): CLIParsingError {
    return new CLIParsingError(
      "conflicting-options",
      `Options '${option1}' and '${option2}' cannot be used together`,
      {
        context: { argument: `${option1}, ${option2}` },
      },
    );
  }

  /**
   * Create error for too many arguments
   */
  static tooManyArguments(
    expected: number,
    actual: number,
    providedArgs: string[],
  ): CLIParsingError {
    return new CLIParsingError(
      "too-many-arguments",
      `Too many arguments: expected ${expected}, got ${actual}`,
      {
        context: {
          expected: expected.toString(),
          actual: actual.toString(),
          providedArgs,
        },
      },
    );
  }

  /**
   * Create error for invalid command
   */
  static invalidCommand(
    command: string,
    availableCommands: string[],
  ): CLIParsingError {
    // Totality: Safe command filtering with proper bounds checking
    const firstChar = command.length > 0 ? command[0] : "";
    const suggestions = availableCommands
      .filter((cmd) => {
        if (typeof cmd !== "string" || cmd.length === 0) return false;
        return (firstChar && cmd.startsWith(firstChar)) || cmd.includes(command);
      })
      .slice(0, 3);

    // Totality: Safe message construction
    const message = suggestions.length > 0
      ? `Invalid command '${command}'. Did you mean: ${suggestions.join(", ")}?`
      : `Invalid command '${command}'`;

    return new CLIParsingError(
      "invalid-command",
      message,
      {
        context: { command, availableOptions: availableCommands },
      },
    );
  }

  /**
   * Create generic parsing error
   */
  static parsingFailed(
    message: string,
    cause?: Error,
    context?: Record<string, unknown>,
  ): CLIParsingError {
    return new CLIParsingError(
      "parsing-failed",
      message,
      { cause, context },
    );
  }

  /**
   * Get user-friendly error message with examples
   */
  override getUserMessage(): string {
    const base = this.message;

    // Add examples for common errors
    switch (this.kind) {
      case "missing-required-argument":
        return `${base}\n\nExample: breakdown to project --input data.json`;
      case "invalid-argument-format":
        return `${base}\n\nExample: breakdown ${this.context?.argument} <valid-value>`;
      case "unknown-option": {
        // Totality: Safe context access with comprehensive type checking
        const options = this.context?.availableOptions;
        if (
          Array.isArray(options) && options.length > 0 &&
          options.every((opt) => typeof opt === "string")
        ) {
          return `${base}\n\nAvailable options: ${options.join(", ")}`;
        }
        return base;
      }
      default:
        return base;
    }
  }

  /**
   * Check if error is recoverable
   * Totality: All CLI parsing errors are recoverable by definition
   */
  isRecoverable(): boolean {
    // Totality: CLI parsing errors are always recoverable by correcting the command
    // This is a total function as it always returns true for all valid CLIParsingErrorKind values
    return true;
  }

  /**
   * Get specific recovery suggestions
   * Totality: Always returns at least one suggestion for every error kind
   */
  getRecoverySuggestions(): { action: string; description: string; command?: string }[] {
    const suggestions: { action: string; description: string; command?: string }[] = [];

    switch (this.kind) {
      case "missing-required-argument":
        suggestions.push({
          action: "add-argument",
          description: `Add the required argument: ${this.context?.argument}`,
        });
        suggestions.push({
          action: "show-help",
          description: "See all required arguments",
          command: "breakdown --help",
        });
        break;
      case "invalid-argument-format":
        suggestions.push({
          action: "fix-format",
          description: `Use correct format: ${this.context?.expected}`,
        });
        break;
      case "unknown-option": {
        suggestions.push({
          action: "show-help",
          description: "Check available options",
          command: "breakdown --help",
        });
        // Totality: Safe array operations with type guards
        const options = this.context?.availableOptions;
        if (
          Array.isArray(options) && options.length > 0 &&
          options.every((opt) => typeof opt === "string")
        ) {
          const validOptions = options.slice(0, 5).join(", ");
          suggestions.push({
            action: "use-valid-option",
            description: `Valid options include: ${validOptions}`,
          });
        }
        break;
      }
      case "conflicting-options":
        suggestions.push({
          action: "remove-conflict",
          description: "Use only one of the conflicting options",
        });
        break;
      case "too-many-arguments":
        suggestions.push({
          action: "remove-arguments",
          description: `Remove extra arguments (expected ${this.context?.expected})`,
        });
        break;
      case "invalid-command":
        suggestions.push({
          action: "show-help",
          description: "See available commands",
          command: "breakdown help",
        });
        break;
      default:
        // Totality: Ensure all error kinds have recovery suggestions
        suggestions.push({
          action: "check-help",
          description: "Check command documentation for proper usage",
          command: "breakdown --help",
        });
        break;
    }

    // Totality: Guarantee at least one suggestion is always returned
    if (suggestions.length === 0) {
      suggestions.push({
        action: "retry-command",
        description: "Review and retry the command with correct syntax",
      });
    }

    return suggestions;
  }
}
