/**
 * @fileoverview Unified Error Types for Breakdown System
 *
 * This module provides a unified error type system following the Result pattern
 * and Totality principle. All error types across the system should extend
 * from these base types to ensure consistency.
 *
 * @module lib/types/unified_error_types
 */

import type { Result } from "./result.ts";

/**
 * Base error interface that all system errors should implement
 */
export interface BaseError {
  /** Discriminated union tag */
  kind: string;
  /** Human-readable error message */
  message?: string;
  /** Optional context data */
  context?: Record<string, unknown>;
}

/**
 * Common error categories used throughout the system
 */
export type SystemErrorKind =
  // Validation errors
  | "InvalidInput"
  | "InvalidPath"
  | "InvalidConfiguration"
  | "ValidationFailed"
  // File system errors
  | "FileNotFound"
  | "DirectoryNotFound"
  | "PermissionDenied"
  | "PathNotFound"
  // Processing errors
  | "ProcessingFailed"
  | "TransformationFailed"
  | "GenerationFailed"
  // Network/External errors
  | "ExternalServiceError"
  | "TimeoutError"
  // Business logic errors
  | "BusinessRuleViolation"
  | "StateTransitionInvalid"
  // Configuration errors
  | "ConfigurationError"
  | "ProfileNotFound";

/**
 * Standard error structure following discriminated union pattern
 */
export type SystemError<TKind extends string = SystemErrorKind> = BaseError & {
  kind: TKind;
};

/**
 * Path-related error types used across resolvers
 */
export type PathError =
  | { kind: "InvalidPath"; path: string; reason: string; context?: Record<string, unknown> }
  | { kind: "PathNotFound"; path: string; context?: Record<string, unknown> }
  | { kind: "DirectoryNotFound"; path: string; context?: Record<string, unknown> }
  | { kind: "PermissionDenied"; path: string; context?: Record<string, unknown> }
  | { kind: "PathTooLong"; path: string; maxLength: number; context?: Record<string, unknown> };

/**
 * Validation error types used across validators
 */
export type ValidationError =
  | {
    kind: "InvalidInput";
    field: string;
    value: unknown;
    reason: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "MissingRequiredField";
    field: string;
    source: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "InvalidFieldType";
    field: string;
    expected: string;
    received: string;
    context?: Record<string, unknown>;
  }
  | { kind: "ValidationFailed"; errors: string[]; context?: Record<string, unknown> };

/**
 * Configuration error types used across config handlers
 */
export type ConfigurationError =
  | {
    kind: "ConfigurationError";
    message: string;
    source?: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "ProfileNotFound";
    profile: string;
    availableProfiles?: string[];
    context?: Record<string, unknown>;
  }
  | {
    kind: "InvalidConfiguration";
    field: string;
    reason: string;
    context?: Record<string, unknown>;
  };

/**
 * Processing error types used across processors
 */
export type ProcessingError =
  | {
    kind: "ProcessingFailed";
    operation: string;
    reason: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "TransformationFailed";
    input: unknown;
    targetType: string;
    reason: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "GenerationFailed";
    generator: string;
    reason: string;
    context?: Record<string, unknown>;
  };

/**
 * Union of all standard error types
 */
export type UnifiedError =
  | PathError
  | ValidationError
  | ConfigurationError
  | ProcessingError;

/**
 * Standard Result type using unified errors
 */
export type UnifiedResult<T> = Result<T, UnifiedError>;

/**
 * Error factory functions for creating consistent errors
 */
export const ErrorFactory = {
  /**
   * Create a path error
   */
  pathError(
    kind: PathError["kind"],
    path: string,
    reason?: string,
    context?: Record<string, unknown>,
  ): PathError {
    const baseError = { kind, path, context };
    switch (kind) {
      case "InvalidPath":
        return { ...baseError, reason: reason ?? "Invalid path format" } as PathError;
      case "PathTooLong":
        return { ...baseError, maxLength: 4096 } as PathError;
      default:
        return baseError as PathError;
    }
  },

  /**
   * Create a validation error
   */
  validationError(
    kind: ValidationError["kind"],
    details: Partial<ValidationError>,
    context?: Record<string, unknown>,
  ): ValidationError {
    const baseError = { kind, context };
    return { ...baseError, ...details } as ValidationError;
  },

  /**
   * Create a configuration error
   */
  configError(
    kind: ConfigurationError["kind"],
    details: Partial<ConfigurationError>,
    context?: Record<string, unknown>,
  ): ConfigurationError {
    const baseError = { kind, context };
    return { ...baseError, ...details } as ConfigurationError;
  },

  /**
   * Create a processing error
   */
  processingError(
    kind: ProcessingError["kind"],
    details: Partial<ProcessingError>,
    context?: Record<string, unknown>,
  ): ProcessingError {
    const baseError = { kind, context };
    return { ...baseError, ...details } as ProcessingError;
  },
};

/**
 * Error message extraction utility
 */
export function extractUnifiedErrorMessage(error: UnifiedError): string {
  switch (error.kind) {
    case "InvalidPath":
    case "PathNotFound":
    case "DirectoryNotFound":
    case "PermissionDenied":
      return `${error.kind}: ${error.path}`;
    case "PathTooLong":
      return `${error.kind}: ${error.path} (max: ${error.maxLength})`;
    case "InvalidInput":
      return `${error.kind}: ${error.field} - ${error.reason}`;
    case "MissingRequiredField":
      return `${error.kind}: ${error.field} in ${error.source}`;
    case "InvalidFieldType":
      return `${error.kind}: ${error.field} expected ${error.expected}, got ${error.received}`;
    case "ValidationFailed":
      return `${error.kind}: ${error.errors.join(", ")}`;
    case "ConfigurationError":
      return `${error.kind}: ${error.message}`;
    case "ProfileNotFound":
      return `${error.kind}: ${error.profile}`;
    case "InvalidConfiguration":
      return `${error.kind}: ${error.field} - ${error.reason}`;
    case "ProcessingFailed":
      return `${error.kind}: ${error.operation} - ${error.reason}`;
    case "TransformationFailed":
      return `${error.kind}: to ${error.targetType} - ${error.reason}`;
    case "GenerationFailed":
      return `${error.kind}: ${error.generator} - ${error.reason}`;
    default:
      return `Unknown error: ${JSON.stringify(error)}`;
  }
}
