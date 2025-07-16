/**
 * @fileoverview Stdin Error Types and Guards
 * 
 * This module provides the error types and type guards needed for
 * stdin error handling tests.
 */

/**
 * Union type for all possible stdin errors
 */
export type StdinErrorType = 
  | { kind: "ReadError"; message: string }
  | { kind: "TimeoutError"; timeout: number }
  | { kind: "EmptyInputError"; message: string }
  | { kind: "NotAvailableError"; environment: string }
  | { kind: "ValidationError"; field: string; message: string }
  | { kind: "ConfigurationError"; setting: string; value?: unknown };

/**
 * Type guards for stdin errors
 */
export function isReadError(error: StdinErrorType): error is { kind: "ReadError"; message: string } {
  return error.kind === "ReadError";
}

export function isTimeoutError(error: StdinErrorType): error is { kind: "TimeoutError"; timeout: number } {
  return error.kind === "TimeoutError";
}

export function isEmptyInputError(error: StdinErrorType): error is { kind: "EmptyInputError"; message: string } {
  return error.kind === "EmptyInputError";
}

export function isNotAvailableError(error: StdinErrorType): error is { kind: "NotAvailableError"; environment: string } {
  return error.kind === "NotAvailableError";
}

export function isValidationError(error: StdinErrorType): error is { kind: "ValidationError"; field: string; message: string } {
  return error.kind === "ValidationError";
}

export function isConfigurationError(error: StdinErrorType): error is { kind: "ConfigurationError"; setting: string; value?: unknown } {
  return error.kind === "ConfigurationError";
}

/**
 * Format stdin error to readable message
 */
export function formatStdinError(error: StdinErrorType): string {
  switch (error.kind) {
    case "ReadError":
      return `Stdin read error: ${error.message}`;
    case "TimeoutError":
      return `Stdin timeout after ${error.timeout}ms`;
    case "EmptyInputError":
      return `Empty input: ${error.message}`;
    case "NotAvailableError":
      return `Stdin not available in ${error.environment} environment`;
    case "ValidationError":
      return `Validation error for ${error.field}: ${error.message}`;
    case "ConfigurationError":
      return error.value !== undefined 
        ? `Configuration error for ${error.setting}: ${error.value}`
        : `Configuration error for ${error.setting}`;
  }
}