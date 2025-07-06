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
  type BasePathError,
  isInvalidPathError as isBasePathInvalidPathError,
  isSecurityViolationError as isBasePathSecurityViolationError,
  isValidationError as isBasePathValidationError,
  formatBasePathError,
} from "./base_path.ts";

// Template Path Value Object
export {
  TemplatePath,
  DEFAULT_TEMPLATE_PATH_CONFIG,
  type TemplatePathConfig,
  type TemplatePathError,
  isInvalidDirectiveError as isTemplatePathInvalidDirectiveError,
  isInvalidLayerError as isTemplatePathInvalidLayerError,
  isInvalidFilenameError as isTemplatePathInvalidFilenameError,
  isPathConstructionError as isTemplatePathConstructionError,
  isSecurityViolationError as isTemplatePathSecurityViolationError,
  isValidationError as isTemplatePathValidationError,
  formatTemplatePathError,
} from "./template_path.ts";

// Schema Path Value Object
export {
  SchemaPath,
  DEFAULT_SCHEMA_PATH_CONFIG,
  type SchemaPathConfig,
  type SchemaPathError,
  isInvalidDirectiveError as isSchemaPathInvalidDirectiveError,
  isInvalidLayerError as isSchemaPathInvalidLayerError,
  isInvalidSchemaFilenameError,
  isSchemaPathConstructionError,
  isJsonSchemaValidationError,
  isSecurityViolationError as isSchemaPathSecurityViolationError,
  isValidationError as isSchemaPathValidationError,
  formatSchemaPathError,
} from "./schema_path.ts";

// Working Directory Path Value Object
export {
  WorkingDirectoryPath,
  DEFAULT_WORKING_DIRECTORY_CONFIG,
  type WorkingDirectoryPathConfig,
  type WorkingDirectoryPathError,
  isInvalidDirectoryPathError,
  isDirectoryNotFoundError,
  isPermissionDeniedError,
  isPathResolutionError as isWorkingDirectoryPathResolutionError,
  isSecurityViolationError as isWorkingDirectorySecurityViolationError,
  isValidationError as isWorkingDirectoryValidationError,
  isFileSystemError,
  formatWorkingDirectoryPathError,
} from "./working_directory_path.ts";

/**
 * Union type for all path value object errors
 * Enables handling any path-related error uniformly
 */
export type PathValueObjectError = 
  | import("./base_path.ts").BasePathError
  | import("./template_path.ts").TemplatePathError 
  | import("./schema_path.ts").SchemaPathError
  | import("./working_directory_path.ts").WorkingDirectoryPathError;

/**
 * Type guard to check if an error is any path value object error
 */
export function isPathValueObjectError(error: unknown): error is PathValueObjectError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  
  const errorObj = error as { kind?: string };
  const pathErrorKinds = [
    // BasePathError kinds
    "InvalidPath", "SecurityViolation", "ValidationError",
    // TemplatePathError kinds  
    "InvalidDirective", "InvalidLayer", "InvalidFilename", "PathConstructionError",
    // SchemaPathError kinds
    "InvalidSchemaFilename", "SchemaPathConstructionError", "JsonSchemaValidationError",
    // WorkingDirectoryPathError kinds
    "InvalidDirectoryPath", "DirectoryNotFound", "PermissionDenied", 
    "PathResolutionError", "FileSystemError"
  ];
  
  return typeof errorObj.kind === 'string' && pathErrorKinds.includes(errorObj.kind);
}

/**
 * Format any path value object error for display
 * Provides unified error formatting across all path types
 */
export function formatPathValueObjectError(error: PathValueObjectError): string {
  // Import the specific formatters
  const { formatBasePathError } = await import("./base_path.ts");
  const { formatTemplatePathError } = await import("./template_path.ts");
  const { formatSchemaPathError } = await import("./schema_path.ts");
  const { formatWorkingDirectoryPathError } = await import("./working_directory_path.ts");
  
  // Type-safe error formatting based on error structure
  if ('kind' in error) {
    switch (error.kind) {
      // BasePathError
      case "InvalidPath":
      case "SecurityViolation":
      case "ValidationError":
        return formatBasePathError(error as import("./base_path.ts").BasePathError);
        
      // TemplatePathError  
      case "InvalidDirective":
      case "InvalidLayer":
      case "InvalidFilename":
      case "PathConstructionError":
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
      case "PathResolutionError":
      case "FileSystemError":
        return formatWorkingDirectoryPathError(error as import("./working_directory_path.ts").WorkingDirectoryPathError);
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
    directive: import("../../../types/directive_type.ts").DirectiveType,
    layer: import("../../../types/layer_type.ts").LayerType,
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
    directive: import("../../../types/directive_type.ts").DirectiveType,
    layer: import("../../../types/layer_type.ts").LayerType,
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

/**
 * Configuration presets for different environments
 */
export const PathValueObjectConfigs = {
  /**
   * Development environment configuration
   */
  development: {
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
  },

  /**
   * Production environment configuration
   */
  production: {
    template: DEFAULT_TEMPLATE_PATH_CONFIG,
    schema: DEFAULT_SCHEMA_PATH_CONFIG,
    workingDirectory: {
      ...DEFAULT_WORKING_DIRECTORY_CONFIG,
      verifyExistence: true,
      requireReadPermission: true,
    },
  },

  /**
   * Testing environment configuration
   */
  testing: {
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
  },
} as const;