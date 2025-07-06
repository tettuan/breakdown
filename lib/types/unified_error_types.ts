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
  /** Legacy type property for backward compatibility */
  type?: string;
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
  | "ConfigLoadError"
  | "ProfileNotFound"
  // Workspace errors
  | "WorkspaceInitError"
  | "WorkspaceConfigError"
  | "WorkspacePathError"
  | "WorkspaceDirectoryError"
  | "WorkspaceError";

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
  }
  | {
    kind: "ConfigLoadError";
    message: string;
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
 * Workspace error types for workspace operations
 */
export type WorkspaceError =
  | {
    kind: "WorkspaceInitError";
    type: "workspace_init_error";
    code: "WORKSPACE_INIT_ERROR";
    message: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "WorkspaceConfigError";
    type: "workspace_config_error";
    code: "WORKSPACE_CONFIG_ERROR";
    message: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "WorkspacePathError";
    type: "workspace_path_error";
    code: "WORKSPACE_PATH_ERROR";
    message: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "WorkspaceDirectoryError";
    type: "workspace_directory_error";
    code: "WORKSPACE_DIRECTORY_ERROR";
    message: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "WorkspaceError";
    type: "workspace_error";
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };

/**
 * Union of all standard error types
 */
export type UnifiedError =
  | PathError
  | ValidationError
  | ConfigurationError
  | ProcessingError
  | WorkspaceError;

/**
 * Standard Result type using unified errors
 */
export type UnifiedResult<T> = Result<T, UnifiedError>;

/**
 * Type guard functions for error types
 */
export const ErrorGuards = {
  isPathError(error: unknown): error is PathError {
    return (
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      "path" in error &&
      typeof (error as any).path === "string" &&
      [
        "InvalidPath",
        "PathNotFound",
        "DirectoryNotFound",
        "PermissionDenied",
        "PathTooLong",
      ].includes((error as any).kind)
    );
  },

  isValidationError(error: unknown): error is ValidationError {
    return (
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      [
        "InvalidInput",
        "MissingRequiredField",
        "InvalidFieldType",
        "ValidationFailed",
      ].includes((error as any).kind)
    );
  },

  isConfigurationError(error: unknown): error is ConfigurationError {
    return (
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      [
        "ConfigurationError",
        "ProfileNotFound",
        "InvalidConfiguration",
        "ConfigLoadError",
      ].includes((error as any).kind)
    );
  },

  isProcessingError(error: unknown): error is ProcessingError {
    return (
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      [
        "ProcessingFailed",
        "TransformationFailed",
        "GenerationFailed",
      ].includes((error as any).kind)
    );
  },

  isWorkspaceError(error: unknown): error is WorkspaceError {
    return (
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      [
        "WorkspaceInitError",
        "WorkspaceConfigError",
        "WorkspacePathError",
        "WorkspaceDirectoryError",
        "WorkspaceError",
      ].includes((error as any).kind)
    );
  },
};

/**
 * Error factory functions for creating consistent errors
 */
export const ErrorFactory = {
  /**
   * Create a path error with proper type inference
   */
  pathError<K extends PathError["kind"]>(
    kind: K,
    path: string,
    additionalData?: K extends "InvalidPath"
      ? { reason: string; context?: Record<string, unknown> }
      : K extends "PathTooLong"
      ? { maxLength?: number; context?: Record<string, unknown> }
      : { context?: Record<string, unknown> },
  ): Extract<PathError, { kind: K }> {
    switch (kind) {
      case "InvalidPath": {
        const data = additionalData as { reason: string; context?: Record<string, unknown> } | undefined;
        return {
          kind: "InvalidPath",
          path,
          reason: data?.reason ?? "Invalid path format",
          context: data?.context,
        } as Extract<PathError, { kind: K }>;
      }
      case "PathTooLong": {
        const data = additionalData as { maxLength?: number; context?: Record<string, unknown> } | undefined;
        return {
          kind: "PathTooLong",
          path,
          maxLength: data?.maxLength ?? 4096,
          context: data?.context,
        } as Extract<PathError, { kind: K }>;
      }
      case "PathNotFound":
      case "DirectoryNotFound":
      case "PermissionDenied": {
        const data = additionalData as { context?: Record<string, unknown> } | undefined;
        return {
          kind,
          path,
          context: data?.context,
        } as Extract<PathError, { kind: K }>;
      }
      default: {
        const exhaustiveCheck: never = kind;
        throw new Error(`Unhandled path error kind: ${exhaustiveCheck}`);
      }
    }
  },

  /**
   * Create a validation error with proper type inference
   */
  validationError<K extends ValidationError["kind"]>(
    kind: K,
    details: K extends "InvalidInput"
      ? { field: string; value: unknown; reason: string; context?: Record<string, unknown> }
      : K extends "MissingRequiredField"
      ? { field: string; source: string; context?: Record<string, unknown> }
      : K extends "InvalidFieldType"
      ? { field: string; expected: string; received: string; context?: Record<string, unknown> }
      : K extends "ValidationFailed"
      ? { errors: string[]; context?: Record<string, unknown> }
      : never,
  ): Extract<ValidationError, { kind: K }> {
    switch (kind) {
      case "InvalidInput": {
        const d = details as { field: string; value: unknown; reason: string; context?: Record<string, unknown> };
        return {
          kind: "InvalidInput",
          field: d.field,
          value: d.value,
          reason: d.reason,
          context: d.context,
        } as Extract<ValidationError, { kind: K }>;
      }
      case "MissingRequiredField": {
        const d = details as { field: string; source: string; context?: Record<string, unknown> };
        return {
          kind: "MissingRequiredField",
          field: d.field,
          source: d.source,
          context: d.context,
        } as Extract<ValidationError, { kind: K }>;
      }
      case "InvalidFieldType": {
        const d = details as { field: string; expected: string; received: string; context?: Record<string, unknown> };
        return {
          kind: "InvalidFieldType",
          field: d.field,
          expected: d.expected,
          received: d.received,
          context: d.context,
        } as Extract<ValidationError, { kind: K }>;
      }
      case "ValidationFailed": {
        const d = details as { errors: string[]; context?: Record<string, unknown> };
        return {
          kind: "ValidationFailed",
          errors: d.errors,
          context: d.context,
        } as Extract<ValidationError, { kind: K }>;
      }
      default: {
        const exhaustiveCheck: never = kind;
        throw new Error(`Unhandled validation error kind: ${exhaustiveCheck}`);
      }
    }
  },

  /**
   * Create a configuration error with proper type inference
   */
  configError<K extends ConfigurationError["kind"]>(
    kind: K,
    details: K extends "ConfigurationError"
      ? { message: string; source?: string; context?: Record<string, unknown> }
      : K extends "ProfileNotFound"
      ? { profile: string; availableProfiles?: string[]; context?: Record<string, unknown> }
      : K extends "InvalidConfiguration"
      ? { field: string; reason: string; context?: Record<string, unknown> }
      : K extends "ConfigLoadError"
      ? { message: string; context?: Record<string, unknown> }
      : never,
  ): Extract<ConfigurationError, { kind: K }> {
    switch (kind) {
      case "ConfigurationError": {
        const d = details as { message: string; source?: string; context?: Record<string, unknown> };
        return {
          kind: "ConfigurationError",
          message: d.message,
          source: d.source,
          context: d.context,
        } as Extract<ConfigurationError, { kind: K }>;
      }
      case "ProfileNotFound": {
        const d = details as { profile: string; availableProfiles?: string[]; context?: Record<string, unknown> };
        return {
          kind: "ProfileNotFound",
          profile: d.profile,
          availableProfiles: d.availableProfiles,
          context: d.context,
        } as Extract<ConfigurationError, { kind: K }>;
      }
      case "InvalidConfiguration": {
        const d = details as { field: string; reason: string; context?: Record<string, unknown> };
        return {
          kind: "InvalidConfiguration",
          field: d.field,
          reason: d.reason,
          context: d.context,
        } as Extract<ConfigurationError, { kind: K }>;
      }
      case "ConfigLoadError": {
        const d = details as { message: string; context?: Record<string, unknown> };
        return {
          kind: "ConfigLoadError",
          message: d.message,
          context: d.context,
        } as Extract<ConfigurationError, { kind: K }>;
      }
      default: {
        const exhaustiveCheck: never = kind;
        throw new Error(`Unhandled configuration error kind: ${exhaustiveCheck}`);
      }
    }
  },

  /**
   * Create a processing error with proper type inference
   */
  processingError<K extends ProcessingError["kind"]>(
    kind: K,
    details: K extends "ProcessingFailed"
      ? { operation: string; reason: string; context?: Record<string, unknown> }
      : K extends "TransformationFailed"
      ? { input: unknown; targetType: string; reason: string; context?: Record<string, unknown> }
      : K extends "GenerationFailed"
      ? { generator: string; reason: string; context?: Record<string, unknown> }
      : never,
  ): Extract<ProcessingError, { kind: K }> {
    switch (kind) {
      case "ProcessingFailed": {
        const d = details as { operation: string; reason: string; context?: Record<string, unknown> };
        return {
          kind: "ProcessingFailed",
          operation: d.operation,
          reason: d.reason,
          context: d.context,
        } as Extract<ProcessingError, { kind: K }>;
      }
      case "TransformationFailed": {
        const d = details as { input: unknown; targetType: string; reason: string; context?: Record<string, unknown> };
        return {
          kind: "TransformationFailed",
          input: d.input,
          targetType: d.targetType,
          reason: d.reason,
          context: d.context,
        } as Extract<ProcessingError, { kind: K }>;
      }
      case "GenerationFailed": {
        const d = details as { generator: string; reason: string; context?: Record<string, unknown> };
        return {
          kind: "GenerationFailed",
          generator: d.generator,
          reason: d.reason,
          context: d.context,
        } as Extract<ProcessingError, { kind: K }>;
      }
      default: {
        const exhaustiveCheck: never = kind;
        throw new Error(`Unhandled processing error kind: ${exhaustiveCheck}`);
      }
    }
  },

  /**
   * Create a workspace error with proper type inference
   */
  workspaceError<K extends WorkspaceError["kind"]>(
    kind: K,
    details: K extends "WorkspaceError"
      ? { message: string; code: string; context?: Record<string, unknown> }
      : { message: string; context?: Record<string, unknown> },
  ): Extract<WorkspaceError, { kind: K }> {
    switch (kind) {
      case "WorkspaceInitError": {
        const d = details as { message: string; context?: Record<string, unknown> };
        return {
          kind: "WorkspaceInitError",
          type: "workspace_init_error",
          code: "WORKSPACE_INIT_ERROR",
          message: d.message,
          context: d.context,
        } as Extract<WorkspaceError, { kind: K }>;
      }
      case "WorkspaceConfigError": {
        const d = details as { message: string; context?: Record<string, unknown> };
        return {
          kind: "WorkspaceConfigError",
          type: "workspace_config_error",
          code: "WORKSPACE_CONFIG_ERROR",
          message: d.message,
          context: d.context,
        } as Extract<WorkspaceError, { kind: K }>;
      }
      case "WorkspacePathError": {
        const d = details as { message: string; context?: Record<string, unknown> };
        return {
          kind: "WorkspacePathError",
          type: "workspace_path_error",
          code: "WORKSPACE_PATH_ERROR",
          message: d.message,
          context: d.context,
        } as Extract<WorkspaceError, { kind: K }>;
      }
      case "WorkspaceDirectoryError": {
        const d = details as { message: string; context?: Record<string, unknown> };
        return {
          kind: "WorkspaceDirectoryError",
          type: "workspace_directory_error",
          code: "WORKSPACE_DIRECTORY_ERROR",
          message: d.message,
          context: d.context,
        } as Extract<WorkspaceError, { kind: K }>;
      }
      case "WorkspaceError": {
        const d = details as { message: string; code: string; context?: Record<string, unknown> };
        return {
          kind: "WorkspaceError",
          type: "workspace_error",
          code: d.code,
          message: d.message,
          context: d.context,
        } as Extract<WorkspaceError, { kind: K }>;
      }
      default: {
        const exhaustiveCheck: never = kind;
        throw new Error(`Unhandled workspace error kind: ${exhaustiveCheck}`);
      }
    }
  },
};

/**
 * Type assertion helper for exhaustive checks
 */
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

/**
 * Error message extraction utility with exhaustive type checking
 */
export function extractUnifiedErrorMessage(error: UnifiedError): string {
  switch (error.kind) {
    // Path errors
    case "InvalidPath":
      return `${error.kind}: ${error.path} - ${error.reason}`;
    case "PathNotFound":
      return `${error.kind}: ${error.path}`;
    case "DirectoryNotFound":
      return `${error.kind}: ${error.path}`;
    case "PermissionDenied":
      return `${error.kind}: ${error.path}`;
    case "PathTooLong":
      return `${error.kind}: ${error.path} (max: ${error.maxLength})`;
    
    // Validation errors
    case "InvalidInput":
      return `${error.kind}: ${error.field} - ${error.reason}`;
    case "MissingRequiredField":
      return `${error.kind}: ${error.field} in ${error.source}`;
    case "InvalidFieldType":
      return `${error.kind}: ${error.field} expected ${error.expected}, got ${error.received}`;
    case "ValidationFailed":
      return `${error.kind}: ${error.errors.join(", ")}`;
    
    // Configuration errors
    case "ConfigurationError":
      return `${error.kind}: ${error.message}`;
    case "ProfileNotFound":
      return `${error.kind}: ${error.profile}`;
    case "InvalidConfiguration":
      return `${error.kind}: ${error.field} - ${error.reason}`;
    case "ConfigLoadError":
      return `${error.kind}: ${error.message}`;
    
    // Processing errors
    case "ProcessingFailed":
      return `${error.kind}: ${error.operation} - ${error.reason}`;
    case "TransformationFailed":
      return `${error.kind}: to ${error.targetType} - ${error.reason}`;
    case "GenerationFailed":
      return `${error.kind}: ${error.generator} - ${error.reason}`;
    
    // Workspace errors
    case "WorkspaceInitError":
      return `${error.kind}: ${error.message}`;
    case "WorkspaceConfigError":
      return `${error.kind}: ${error.message}`;
    case "WorkspacePathError":
      return `${error.kind}: ${error.message}`;
    case "WorkspaceDirectoryError":
      return `${error.kind}: ${error.message}`;
    case "WorkspaceError":
      return `${error.kind}: ${error.message}`;
    
    default:
      return assertNever(error);
  }
}
