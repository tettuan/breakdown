// =============================================================================
// Totality-based Type System Foundation
// =============================================================================

// Common Result type for error handling
export type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

// Common validation error types
export type ValidationError = 
  | { kind: "ParseError"; input: string }
  | { kind: "EmptyInput" }
  | { kind: "InvalidFormat"; input: string; expected: string }
  | { kind: "CommandFailed"; command: string; stderr: string }
  | { kind: "TimeoutError"; operation: string }
  | { kind: "InvalidTimeFormat"; input: string }
  | { kind: "FileNotFound"; path: string }
  | { kind: "InvalidState"; current: string; expected: string }
  | { kind: "CancellationRequested"; operation: string }
  | { kind: "SessionNotFound" }
  | { kind: "PaneNotFound"; paneId: string }
  | { kind: "RuntimeLimitExceeded"; maxRuntime: number };

// Error creation helper
export const createError = (error: ValidationError, customMessage?: string): ValidationError & { message: string } => ({
  ...error,
  message: customMessage || getDefaultMessage(error)
});

export const getDefaultMessage = (error: ValidationError): string => {
  switch (error.kind) {
    case "ParseError": 
      return `Cannot parse "${error.input}"`;
    case "EmptyInput": 
      return "Input cannot be empty";
    case "InvalidFormat": 
      return `Invalid format: "${error.input}", expected: ${error.expected}`;
    case "CommandFailed": 
      return `Command failed: ${error.command}. Error: ${error.stderr}`;
    case "TimeoutError": 
      return `Operation timed out: ${error.operation}`;
    case "InvalidTimeFormat": 
      return `Invalid time format: "${error.input}", expected: HH:MM`;
    case "FileNotFound": 
      return `File not found: ${error.path}`;
    case "InvalidState": 
      return `Invalid state: ${error.current}, expected: ${error.expected}`;
    case "CancellationRequested": 
      return `Cancellation requested for operation: ${error.operation}`;
    case "SessionNotFound":
      return "No tmux session found";
    case "PaneNotFound":
      return `Pane not found: ${error.paneId}`;
    case "RuntimeLimitExceeded":
      return `Runtime limit exceeded: ${error.maxRuntime}ms`;
  }
};
