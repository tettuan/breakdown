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

/**
 * Factory functions for common path creation patterns
 */
export class PathValueObjectFactory {
  /**
   * Create a template path for a specific directive and layer
   */
  static createTemplatePath(
    directive: import("./directive_type.ts").DirectiveType,
    layer: import("./layer_type.ts").LayerType,
    filename: string,
  ) {
    return import("./template_path.ts").then(({ TemplatePath }) =>
      TemplatePath.create(directive, layer, filename)
    );
  }

  /**
   * Create a schema path for a specific directive and layer
   */
  static createSchemaPath(
    directive: import("./directive_type.ts").DirectiveType,
    layer: import("./layer_type.ts").LayerType,
    filename: string,
  ) {
    return import("./schema_path.ts").then(({ SchemaPath }) =>
      SchemaPath.create(directive, layer, filename)
    );
  }

  /**
   * Create a working directory path
   */
  static createWorkingDirectoryPath(path: string) {
    return import("./working_directory_path.ts").then(({ WorkingDirectoryPath }) =>
      WorkingDirectoryPath.create(path)
    );
  }

  /**
   * Get current working directory as WorkingDirectoryPath
   */
  static getCurrentWorkingDirectory() {
    return import("./working_directory_path.ts").then(({ WorkingDirectoryPath }) =>
      WorkingDirectoryPath.current()
    );
  }
}

// Validation Rule Value Object
// Note: validation_rule.ts, error_severity.ts, timeout_duration.ts, workspace_name.ts 
// have been removed as part of DDD totality refactoring

// Config Set Name Value Object
export {
  ConfigSetName,
  type ConfigSetNameError,
  formatConfigSetNameError,
  isEmptyNameError as isConfigSetEmptyNameError,
  isInvalidCharactersError as isConfigSetInvalidCharactersError,
  isInvalidFormatError as isConfigSetInvalidFormatError,
  isReservedNameError as isConfigSetReservedNameError,
  isStartsWithReservedPrefixError,
  isTooLongError as isConfigSetTooLongError,
} from "./config_set_name.ts";

// Directive Type Value Object  
export {
  DirectiveType,
  TwoParamsDirectivePattern,
  type DirectiveTypeError,
} from "./directive_type.ts";

// Layer Type Value Object
export {
  LayerType,
  type LayerTypeError,
} from "./layer_type.ts";

/**
 * Get configuration presets for different environments
 * These functions return proper configurations by importing the defaults dynamically
 */
export const PathValueObjectConfigs = {
  /**
   * Get development environment configuration
   */
  async development() {
    const { DEFAULT_TEMPLATE_PATH_CONFIG } = await import("./template_path.ts");
    const { DEFAULT_SCHEMA_PATH_CONFIG } = await import("./schema_path.ts");
    const { DEFAULT_WORKING_DIRECTORY_CONFIG } = await import("./working_directory_path.ts");

    return {
      template: {
        ...DEFAULT_TEMPLATE_PATH_CONFIG,
        allowCustomDirectives: true,
        allowCustomLayers: true,
      },
      schema: {
        ...DEFAULT_SCHEMA_PATH_CONFIG,
        allowCustomDirectives: true,
        allowCustomLayers: true,
      },
      workingDirectory: {
        ...DEFAULT_WORKING_DIRECTORY_CONFIG,
        createIfMissing: true,
        requireWritePermission: true,
      },
    };
  },

  /**
   * Get production environment configuration
   */
  async production() {
    const { DEFAULT_TEMPLATE_PATH_CONFIG } = await import("./template_path.ts");
    const { DEFAULT_SCHEMA_PATH_CONFIG } = await import("./schema_path.ts");
    const { DEFAULT_WORKING_DIRECTORY_CONFIG } = await import("./working_directory_path.ts");

    return {
      template: DEFAULT_TEMPLATE_PATH_CONFIG,
      schema: DEFAULT_SCHEMA_PATH_CONFIG,
      workingDirectory: {
        ...DEFAULT_WORKING_DIRECTORY_CONFIG,
        verifyExistence: true,
        requireReadPermission: true,
      },
    };
  },

  /**
   * Get testing environment configuration
   */
  async testing() {
    const { DEFAULT_TEMPLATE_PATH_CONFIG } = await import("./template_path.ts");
    const { DEFAULT_SCHEMA_PATH_CONFIG } = await import("./schema_path.ts");
    const { DEFAULT_WORKING_DIRECTORY_CONFIG } = await import("./working_directory_path.ts");

    return {
      template: {
        ...DEFAULT_TEMPLATE_PATH_CONFIG,
        allowCustomDirectives: true,
        allowCustomLayers: true,
        basePathConfig: {
          ...DEFAULT_TEMPLATE_PATH_CONFIG.basePathConfig,
          maxLength: 50, // Shorter paths for tests
        },
      },
      schema: {
        ...DEFAULT_SCHEMA_PATH_CONFIG,
        allowCustomDirectives: true,
        allowCustomLayers: true,
        basePathConfig: {
          ...DEFAULT_SCHEMA_PATH_CONFIG.basePathConfig,
          maxLength: 50, // Shorter paths for tests
        },
      },
      workingDirectory: {
        ...DEFAULT_WORKING_DIRECTORY_CONFIG,
        verifyExistence: false, // Don't verify in tests
        createIfMissing: true,
        requireReadPermission: false,
        requireWritePermission: false,
      },
    };
  },
} as const;
