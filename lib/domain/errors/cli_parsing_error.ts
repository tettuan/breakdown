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
  readonly domain = "cli-parsing" as const;
  readonly kind: CLIParsingErrorKind;

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
    }
  ) {
    super(message, options);
    this.kind = kind;
  }

  /**
   * Create error for missing required argument
   */
  static missingRequired(argument: string, position?: number): CLIParsingError {
    return new CLIParsingError(
      "missing-required-argument",
      `Missing required argument: ${argument}`,
      {
        context: { argument, position }
      }
    );
  }

  /**
   * Create error for invalid argument format
   */
  static invalidFormat(
    argument: string,
    value: string,
    expected: string
  ): CLIParsingError {
    return new CLIParsingError(
      "invalid-argument-format",
      `Invalid format for argument '${argument}': expected ${expected}, got '${value}'`,
      {
        context: { argument, value, expected }
      }
    );
  }

  /**
   * Create error for unknown option
   */
  static unknownOption(
    option: string,
    availableOptions: string[]
  ): CLIParsingError {
    const suggestions = availableOptions
      .filter(opt => opt.includes(option.replace(/-/g, '')) || option.includes(opt.replace(/-/g, '')))
      .slice(0, 3);

    const message = suggestions.length > 0
      ? `Unknown option '${option}'. Did you mean: ${suggestions.join(', ')}?`
      : `Unknown option '${option}'`;

    return new CLIParsingError(
      "unknown-option",
      message,
      {
        context: { argument: option, availableOptions }
      }
    );
  }

  /**
   * Create error for invalid option value
   */
  static invalidOptionValue(
    option: string,
    value: string,
    expected: string
  ): CLIParsingError {
    return new CLIParsingError(
      "invalid-option-value",
      `Invalid value '${value}' for option '${option}': ${expected}`,
      {
        context: { argument: option, value, expected }
      }
    );
  }

  /**
   * Create error for conflicting options
   */
  static conflictingOptions(
    option1: string,
    option2: string
  ): CLIParsingError {
    return new CLIParsingError(
      "conflicting-options",
      `Options '${option1}' and '${option2}' cannot be used together`,
      {
        context: { argument: `${option1}, ${option2}` }
      }
    );
  }

  /**
   * Create error for too many arguments
   */
  static tooManyArguments(
    expected: number,
    actual: number,
    providedArgs: string[]
  ): CLIParsingError {
    return new CLIParsingError(
      "too-many-arguments",
      `Too many arguments: expected ${expected}, got ${actual}`,
      {
        context: { 
          expected: expected.toString(), 
          actual: actual.toString(),
          providedArgs 
        }
      }
    );
  }

  /**
   * Create error for invalid command
   */
  static invalidCommand(
    command: string,
    availableCommands: string[]
  ): CLIParsingError {
    const suggestions = availableCommands
      .filter(cmd => cmd.startsWith(command[0]) || cmd.includes(command))
      .slice(0, 3);

    const message = suggestions.length > 0
      ? `Invalid command '${command}'. Did you mean: ${suggestions.join(', ')}?`
      : `Invalid command '${command}'`;

    return new CLIParsingError(
      "invalid-command",
      message,
      {
        context: { command, availableOptions: availableCommands }
      }
    );
  }

  /**
   * Create generic parsing error
   */
  static parsingFailed(
    message: string,
    cause?: Error,
    context?: Record<string, unknown>
  ): CLIParsingError {
    return new CLIParsingError(
      "parsing-failed",
      message,
      { cause, context }
    );
  }

  /**
   * Get user-friendly error message with examples
   */
  override getUserMessage(): string {
    const base = super.getUserMessage();
    
    // Add examples for common errors
    switch (this.kind) {
      case "missing-required-argument":
        return `${base}\n\nExample: breakdown to project --input data.json`;
      case "invalid-argument-format":
        return `${base}\n\nExample: breakdown ${this.context?.argument} <valid-value>`;
      case "unknown-option":
        if (this.context?.availableOptions && Array.isArray(this.context.availableOptions) && this.context.availableOptions.length > 0) {
          return `${base}\n\nAvailable options: ${this.context.availableOptions.join(', ')}`;
        }
        return base;
      default:
        return base;
    }
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    // Most CLI parsing errors are recoverable by fixing the command
    return true;
  }

  /**
   * Get specific recovery suggestions
   */
  getRecoverySuggestions(): string[] {
    const suggestions: string[] = [];

    switch (this.kind) {
      case "missing-required-argument":
        suggestions.push(`Add the required argument: ${this.context?.argument}`);
        suggestions.push("Run 'breakdown --help' to see all required arguments");
        break;
      case "invalid-argument-format":
        suggestions.push(`Use correct format: ${this.context?.expected}`);
        break;
      case "unknown-option":
        suggestions.push("Check available options with 'breakdown --help'");
        if (this.context?.availableOptions && Array.isArray(this.context.availableOptions) && this.context.availableOptions.length > 0) {
          suggestions.push(`Valid options include: ${this.context.availableOptions.slice(0, 5).join(', ')}`);
        }
        break;
      case "conflicting-options":
        suggestions.push("Use only one of the conflicting options");
        break;
      case "too-many-arguments":
        suggestions.push(`Remove extra arguments (expected ${this.context?.expected})`);
        break;
      case "invalid-command":
        suggestions.push("Use 'breakdown help' to see available commands");
        break;
    }

    return suggestions;
  }
}