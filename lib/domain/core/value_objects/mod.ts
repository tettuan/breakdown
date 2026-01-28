/**
 * @fileoverview Core Value Objects Module - Unified exports for all domain value objects
 *
 * This module provides a centralized export point for all core domain value objects
 * following Domain-Driven Design and Totality design principles.
 *
 * All value objects in this module implement:
 * - Smart Constructor pattern for type-safe creation
 * - Discriminated Union error types for comprehensive error handling
 * - Result type for Totality principle compliance (no exceptions)
 * - Immutable design following DDD principles
 * - Security validation and comprehensive input validation
 *
 * @module domain/core/value_objects
 */

// Base Path Value Object
export {
  BasePathValueObject,
  DEFAULT_PATH_CONFIG,
  type PathValidationConfig,
  type PathValidationError,
} from "./base_path.ts";

// Template Path Value Object
export {
  DEFAULT_TEMPLATE_PATH_CONFIG,
  formatTemplatePathError,
  isInvalidDirectiveError as isTemplatePathInvalidDirectiveError,
  isInvalidFilenameError as isTemplatePathInvalidFilenameError,
  isInvalidLayerError as isTemplatePathInvalidLayerError,
  isPathConstructionError as isTemplatePathConstructionError,
  isSecurityViolationError as isTemplatePathSecurityViolationError,
  isValidationError as isTemplatePathValidationError,
  TemplatePath,
  type TemplatePathConfig,
  type TemplatePathError,
} from "./template_path.ts";

// Schema Path Value Object
export {
  DEFAULT_SCHEMA_PATH_CONFIG,
  formatSchemaPathError,
  isInvalidDirectiveError as isSchemaPathInvalidDirectiveError,
  isInvalidLayerError as isSchemaPathInvalidLayerError,
  isInvalidSchemaFilenameError,
  isJsonSchemaValidationError,
  isSchemaPathConstructionError,
  isSecurityViolationError as isSchemaPathSecurityViolationError,
  isValidationError as isSchemaPathValidationError,
  SchemaPath,
  type SchemaPathConfig,
  type SchemaPathError,
} from "./schema_path.ts";

// Working Directory Path Value Object
export {
  DEFAULT_WORKING_DIRECTORY_CONFIG,
  formatWorkingDirectoryPathError,
  isDirectoryNotFoundError,
  isFileSystemError,
  isInvalidDirectoryPathError,
  isPathResolutionGeneralError as isWorkingDirectoryPathResolutionError,
  isPermissionDeniedError,
  isSecurityViolationError as isWorkingDirectorySecurityViolationError,
  isValidationError as isWorkingDirectoryValidationError,
  WorkingDirectoryPath,
  type WorkingDirectoryPathConfig,
  type WorkingDirectoryPathError,
} from "./working_directory_path.ts";

/**
 * Union type for all path value object errors
 * Enables handling any path-related error uniformly
 */
export type PathValueObjectError =
  | import("./base_path.ts").PathValidationError
  | import("./template_path.ts").TemplatePathError
  | import("./schema_path.ts").SchemaPathError
  | import("./working_directory_path.ts").WorkingDirectoryPathError;

/**
 * Type guard to check if an error is any path value object error
 */
export function isPathValueObjectError(error: unknown): error is PathValueObjectError {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const errorObj = error as { kind?: string };
  const pathErrorKinds = [
    // PathValidationError kinds
    "EMPTY_PATH",
    "PATH_TRAVERSAL",
    "INVALID_CHARACTERS",
    "TOO_LONG",
    "ABSOLUTE_PATH_REQUIRED",
    "RELATIVE_PATH_REQUIRED",
    "INVALID_EXTENSION",
    "PLATFORM_INCOMPATIBLE",
    // TemplatePathError kinds
    "InvalidDirective",
    "InvalidLayer",
    "InvalidFilename",
    "PathConstructionError",
    "SecurityViolation",
    "ValidationError",
    // SchemaPathError kinds
    "InvalidSchemaFilename",
    "SchemaPathConstructionError",
    "JsonSchemaValidationError",
    // WorkingDirectoryPathError kinds
    "InvalidDirectoryPath",
    "DirectoryNotFound",
    "PermissionDenied",
    "PathResolutionGeneral",
    "FileSystemError",
  ];

  return typeof errorObj.kind === "string" && pathErrorKinds.includes(errorObj.kind);
}

/**
 * Format any path value object error for display
 * Provides unified error formatting across all path types
 */
export async function formatPathValueObjectError(error: PathValueObjectError): Promise<string> {
  // Import all formatters at once to avoid potential module resolution issues
  const [
    { formatTemplatePathError },
    { formatSchemaPathError },
    { formatWorkingDirectoryPathError },
  ] = await Promise.all([
    import("./template_path.ts"),
    import("./schema_path.ts"),
    import("./working_directory_path.ts"),
  ]);

  // Type-safe error formatting based on error structure
  if ("kind" in error) {
    switch (error.kind) {
      // PathValidationError
      case "EMPTY_PATH":
      case "PATH_TRAVERSAL":
      case "INVALID_CHARACTERS":
      case "TOO_LONG":
      case "ABSOLUTE_PATH_REQUIRED":
      case "RELATIVE_PATH_REQUIRED":
      case "INVALID_EXTENSION":
      case "PLATFORM_INCOMPATIBLE":
        return `Path validation error: ${error.message}`;

      // TemplatePathError
      case "InvalidDirective":
      case "InvalidLayer":
      case "InvalidFilename":
      case "PathConstructionError":
      case "SecurityViolation":
      case "ValidationError":
        return formatTemplatePathError(error as import("./template_path.ts").TemplatePathError);

      // SchemaPathError
      case "InvalidSchemaFilename":
      case "SchemaPathConstructionError":
      case "JsonSchemaValidationError":
        return formatSchemaPathError(error as import("./schema_path.ts").SchemaPathError);

      // WorkingDirectoryPathError
      case "InvalidDirectoryPath":
      case "DirectoryNotFound":
      case "PermissionDenied":
      case "PathResolutionGeneral":
      case "FileSystemError":
        return formatWorkingDirectoryPathError(
          error as import("./working_directory_path.ts").WorkingDirectoryPathError,
        );
    }
  }

  // Fallback for unknown error types
  return `Unknown path error: ${JSON.stringify(error)}`;
}

// Directive Type Value Object
export {
  DirectiveType,
  type DirectiveTypeError,
  TwoParamsDirectivePattern,
} from "./directive_type.ts";

// Layer Type Value Object
export { LayerType, type LayerTypeError, TwoParamsLayerTypePattern } from "./layer_type.ts";
