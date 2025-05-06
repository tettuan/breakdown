/**
 * CLI error codes for common argument and validation errors.
 * Used to identify specific error types in CLI operations.
 */
export enum CliErrorCode {
  INVALID_OPTION = "INVALID_OPTION",
  DUPLICATE_OPTION = "DUPLICATE_OPTION",
  CONFLICTING_OPTIONS = "CONFLICTING_OPTIONS",
  INVALID_INPUT_TYPE = "INVALID_INPUT_TYPE",
  MISSING_REQUIRED = "MISSING_REQUIRED",
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
}

/**
 * Custom error for CLI argument/validation errors.
 * Associates a CliErrorCode with the error for precise error handling.
 */
export class CliError extends Error {
  /** The error code representing the type of CLI error. */
  code: CliErrorCode;
  /**
   * Creates a new CliError instance.
   * @param code The error code representing the type of error.
   * @param message The error message describing the error.
   */
  constructor(code: CliErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.code = code;
    this.name = "CliError";
  }
}
