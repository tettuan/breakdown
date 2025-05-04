/**
 * CLI error codes for common argument and validation errors
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
 * Custom error for CLI argument/validation errors
 */
export class CliError extends Error {
  code: CliErrorCode;
  constructor(code: CliErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.code = code;
    this.name = "CliError";
  }
}
