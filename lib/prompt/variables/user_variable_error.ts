/**
 * User variable validation error types
 *
 * Provides comprehensive error handling for user-defined prompt variables
 * following the Totality principle.
 */
export type UserVariableError =
  | { kind: "EmptyKey"; key: string }
  | { kind: "EmptyValue"; key: string }
  | { kind: "NullOrUndefined"; key: string }
  | { kind: "InvalidFormat"; key: string; reason: string }
  | { kind: "DuplicateKey"; key: string }
  | { kind: "TooManyVariables"; limit: number; actual: number }
  | { kind: "NotFound"; key: string };

/**
 * Creates an error message from UserVariableError
 */
export function formatUserVariableError(error: UserVariableError): string {
  switch (error.kind) {
    case "EmptyKey":
      return `Variable key cannot be empty: '${error.key}'`;
    case "EmptyValue":
      return `Variable value for '${error.key}' cannot be empty`;
    case "NullOrUndefined":
      return `Variable value for '${error.key}' cannot be null or undefined`;
    case "InvalidFormat":
      return `Invalid variable format for '${error.key}': ${error.reason}`;
    case "DuplicateKey":
      return `Duplicate variable key: '${error.key}'`;
    case "TooManyVariables":
      return `Too many variables: ${error.actual} exceeds limit of ${error.limit}`;
    case "NotFound":
      return `Variable '${error.key}' not found`;
  }
}
