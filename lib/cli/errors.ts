/**
 * @fileoverview CLI Error Types using Discriminated Union Pattern
 *
 * This module provides CLI-specific error types following the unified error
 * system pattern. All CLI errors use discriminated unions for type safety
 * and exhaustive error handling.
 *
 * @module lib/cli/errors
 */

/**
 * CLI-specific error type using discriminated union pattern.
 * Each error type has a unique 'kind' for pattern matching.
 */
export type CliError =
  | {
    kind: "InvalidOption";
    option: string;
    message: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "DuplicateOption";
    option: string;
    occurrences: number;
    message: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "ConflictingOptions";
    options: string[];
    message: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "InvalidInputType";
    expected: string;
    received: string;
    inputSource: string;
    message: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "MissingRequired";
    required: string | string[];
    message: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "InvalidParameters";
    parameters: unknown;
    reason: string;
    message: string;
    context?: Record<string, unknown>;
  };

/**
 * Factory functions for creating CLI errors with proper type inference
 */
export const CliErrorFactory = {
  /**
   * Creates an InvalidOption error
   */
  invalidOption(
    option: string,
    message: string,
    context?: Record<string, unknown>,
  ): Extract<CliError, { kind: "InvalidOption" }> {
    return {
      kind: "InvalidOption",
      option,
      message,
      context,
    };
  },

  /**
   * Creates a DuplicateOption error
   */
  duplicateOption(
    option: string,
    occurrences: number,
    message: string,
    context?: Record<string, unknown>,
  ): Extract<CliError, { kind: "DuplicateOption" }> {
    return {
      kind: "DuplicateOption",
      option,
      occurrences,
      message,
      context,
    };
  },

  /**
   * Creates a ConflictingOptions error
   */
  conflictingOptions(
    options: string[],
    message: string,
    context?: Record<string, unknown>,
  ): Extract<CliError, { kind: "ConflictingOptions" }> {
    return {
      kind: "ConflictingOptions",
      options,
      message,
      context,
    };
  },

  /**
   * Creates an InvalidInputType error
   */
  invalidInputType(
    expected: string,
    received: string,
    inputSource: string,
    message: string,
    context?: Record<string, unknown>,
  ): Extract<CliError, { kind: "InvalidInputType" }> {
    return {
      kind: "InvalidInputType",
      expected,
      received,
      inputSource,
      message,
      context,
    };
  },

  /**
   * Creates a MissingRequired error
   */
  missingRequired(
    required: string | string[],
    message: string,
    context?: Record<string, unknown>,
  ): Extract<CliError, { kind: "MissingRequired" }> {
    return {
      kind: "MissingRequired",
      required,
      message,
      context,
    };
  },

  /**
   * Creates an InvalidParameters error
   */
  invalidParameters(
    parameters: unknown,
    reason: string,
    message: string,
    context?: Record<string, unknown>,
  ): Extract<CliError, { kind: "InvalidParameters" }> {
    return {
      kind: "InvalidParameters",
      parameters,
      reason,
      message,
      context,
    };
  },
};

/**
 * Type guard for checking if an error is a CliError
 */
export function isCliError(error: unknown): error is CliError {
  return (
    typeof error === "object" &&
    error !== null &&
    "kind" in error &&
    [
      "InvalidOption",
      "DuplicateOption",
      "ConflictingOptions",
      "InvalidInputType",
      "MissingRequired",
      "InvalidParameters",
    ].includes((error as Record<string, unknown>).kind as string)
  );
}

/**
 * Extracts a human-readable message from a CliError
 */
export function extractCliErrorMessage(error: CliError): string {
  switch (error.kind) {
    case "InvalidOption":
      return `[InvalidOption] ${error.message}`;
    case "DuplicateOption":
      return `[DuplicateOption] ${error.message}`;
    case "ConflictingOptions":
      return `[ConflictingOptions] ${error.message}`;
    case "InvalidInputType":
      return `[InvalidInputType] ${error.message}`;
    case "MissingRequired":
      return `[MissingRequired] ${error.message}`;
    case "InvalidParameters":
      return `[InvalidParameters] ${error.message}`;
    default: {
      // TypeScript ensures this is unreachable if all cases are handled
      const _exhaustive: never = error;
      return `Unknown CLI error: ${JSON.stringify(_exhaustive)}`;
    }
  }
}
