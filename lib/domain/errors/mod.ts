/**
 * @fileoverview Domain Errors Module Export
 *
 * Central export point for all domain-specific error types.
 * Provides a unified error handling system for Breakdown.
 *
 * @module domain/errors
 */

// Base error types and utilities (first)
export {
  BaseBreakdownError,
  type BreakdownErrorBase,
  type ErrorRecoverySuggestion,
} from "./breakdown_error.ts";

// CLI parsing errors
export { CLIParsingError, type CLIParsingErrorKind } from "./cli_parsing_error.ts";

// Configuration errors
export { ConfigError, type ConfigErrorKind } from "./config_error.ts";

// Path resolution errors
export { PathResolutionError, type PathResolutionErrorKind } from "./path_resolution_error.ts";

// Variable generation errors
export {
  VariableGenerationError,
  type VariableGenerationErrorKind,
} from "./variable_generation_error.ts";

// Prompt generation errors
export {
  PromptGenerationError,
  type PromptGenerationErrorKind,
} from "./prompt_generation_error.ts";

// Import for internal use
import { BaseBreakdownError } from "./breakdown_error.ts";
import { CLIParsingError } from "./cli_parsing_error.ts";
import { ConfigError } from "./config_error.ts";
import { PathResolutionError } from "./path_resolution_error.ts";
import { VariableGenerationError } from "./variable_generation_error.ts";
import { PromptGenerationError } from "./prompt_generation_error.ts";
import type { ErrorRecoverySuggestion } from "./breakdown_error.ts";

// Union type of all errors
export type BreakdownError =
  | CLIParsingError
  | ConfigError
  | PathResolutionError
  | VariableGenerationError
  | PromptGenerationError;

/**
 * Error factory for creating domain errors
 */
export class BreakdownErrorFactory {
  /**
   * Create CLI parsing error
   */
  static get cliParsing() {
    return CLIParsingError;
  }

  /**
   * Create configuration error
   */
  static get config() {
    return ConfigError;
  }

  /**
   * Create path resolution error
   */
  static get pathResolution() {
    return PathResolutionError;
  }

  /**
   * Create variable generation error
   */
  static get variableGeneration() {
    return VariableGenerationError;
  }

  /**
   * Create prompt generation error
   */
  static get promptGeneration() {
    return PromptGenerationError;
  }
}

/**
 * Type guard for Breakdown errors (enhanced version)
 */
export function isBreakdownError(error: unknown): error is BreakdownError {
  return error instanceof BaseBreakdownError;
}

/**
 * Type guard for specific domain errors
 */
export function isDomainError<T extends BreakdownError>(
  error: unknown,
  domain: string,
): error is T {
  return isBreakdownError(error) && error.domain === domain;
}

/**
 * Get recovery suggestions for an error
 */
export function getRecoverySuggestions(error: BreakdownError): ErrorRecoverySuggestion[] {
  const suggestions: ErrorRecoverySuggestion[] = [];

  // Add domain-specific suggestions
  switch (error.domain) {
    case "cli-parsing":
      suggestions.push({
        action: "Check command syntax",
        description: "Run 'breakdown --help' to see valid command formats",
        command: "breakdown --help",
      });
      break;
    case "config":
      suggestions.push({
        action: "Initialize configuration",
        description: "Run 'breakdown init' to create default configuration",
        command: "breakdown init",
      });
      break;
    case "path-resolution":
      suggestions.push({
        action: "Verify project structure",
        description: "Ensure prompt templates and schemas are in correct directories",
      });
      break;
    case "variable-generation":
      suggestions.push({
        action: "Check input format",
        description: "Ensure input data matches expected schema",
      });
      break;
    case "prompt-generation":
      suggestions.push({
        action: "Validate template",
        description: "Check that prompt template exists and is valid",
      });
      break;
  }

  return suggestions;
}

/**
 * Format error for terminal output
 */
export function formatErrorForTerminal(error: BreakdownError): string {
  const lines: string[] = [
    `[ERROR] ${error.getUserMessage()}`,
    ``,
    `Error ID: ${error.id}`,
    `Domain: ${error.domain}`,
    `Type: ${error.kind}`,
  ];

  if (error.context && Object.keys(error.context).length > 0) {
    lines.push(`Context:`);
    for (const [key, value] of Object.entries(error.context)) {
      lines.push(`  ${key}: ${JSON.stringify(value)}`);
    }
  }

  const suggestions = getRecoverySuggestions(error);
  if (suggestions.length > 0) {
    lines.push(``);
    lines.push(`Suggestions:`);
    for (const suggestion of suggestions) {
      lines.push(`  - ${suggestion.action}: ${suggestion.description}`);
      if (suggestion.command) {
        lines.push(`    $ ${suggestion.command}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Error handler for CLI output
 */
export function handleBreakdownError(error: unknown): void {
  if (isBreakdownError(error)) {
    console.error(formatErrorForTerminal(error));

    // Log developer details in debug mode
    const debugEnv = Deno.env.get("DEBUG") || Deno.env.get("LOG_LEVEL");
    if (debugEnv === "debug" || debugEnv === "true") {
      console.error("\nDeveloper Details:");
      console.error(error.getDeveloperMessage());
      if (error.stack) {
        console.error("\nStack Trace:");
        console.error(error.stack);
      }
    }
  } else if (error instanceof Error) {
    // Handle non-Breakdown errors
    console.error(`[ERROR] Unexpected error: ${error.message}`);
    const debugEnv = Deno.env.get("DEBUG") || Deno.env.get("LOG_LEVEL");
    if (debugEnv === "debug" || debugEnv === "true") {
      console.error(error.stack);
    }
  } else {
    // Handle unknown errors
    console.error("[ERROR] An unknown error occurred");
    console.error(error);
  }
}

/**
 * Convert any error to BreakdownError
 */
export function toBreakdownError(
  error: unknown,
  _domain: string = "unknown",
  _kind: string = "unknown-error",
): BreakdownError {
  if (isBreakdownError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Try to determine appropriate error type based on error properties
    if (error.message.includes("ENOENT") || error.message.includes("not found")) {
      return PathResolutionError.notFound(
        error.message.match(/['"]([^'"]+)['"]/)?.[1] || "unknown",
        "File",
      );
    }
    if (error.message.includes("EACCES") || error.message.includes("permission")) {
      return PathResolutionError.permissionDenied(
        error.message.match(/['"]([^'"]+)['"]/)?.[1] || "unknown",
        "access",
      );
    }
    if (error.message.includes("JSON") || error.message.includes("parse")) {
      return ConfigError.invalidFormat(
        "unknown",
        error.message,
        error,
      );
    }

    // Generic conversion
    return PromptGenerationError.processingFailed(
      "unknown",
      error.message,
      error,
    );
  }

  // Convert non-Error objects
  return PromptGenerationError.processingFailed(
    "unknown",
    String(error),
  );
}

/**
 * Type guards for specific error domains
 */
export const ErrorGuards = {
  isCLIParsingError: (error: unknown): error is CLIParsingError =>
    isDomainError(error, "cli-parsing"),

  isConfigError: (error: unknown): error is ConfigError => isDomainError(error, "config"),

  isPathResolutionError: (error: unknown): error is PathResolutionError =>
    isDomainError(error, "path-resolution"),

  isVariableGenerationError: (error: unknown): error is VariableGenerationError =>
    isDomainError(error, "variable-generation"),

  isPromptGenerationError: (error: unknown): error is PromptGenerationError =>
    isDomainError(error, "prompt-generation"),
} as const;
