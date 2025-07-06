/**
 * Factory-specific error types for Totality implementation
 * 
 * Provides comprehensive error handling for prompt variables factory operations
 * following the Totality principle.
 */

/**
 * Factory initialization errors
 */
export type FactoryInitError =
  | { kind: "InvalidConfig"; type?: "factory_invalid_config"; reason: string }
  | { kind: "MissingParameter"; type?: "factory_missing_parameter"; parameter: string }
  | { kind: "ConfigValidation"; type?: "factory_config_validation"; field: string; reason: string }
  | { kind: "DependencyFailure"; type?: "factory_dependency_failure"; dependency: string; reason: string };

/**
 * Path resolution errors
 */
export type PathResolutionError =
  | { kind: "NotResolved"; type?: "factory_not_resolved"; resource: "promptFilePath" | "inputFilePath" | "outputFilePath" | "schemaFilePath" }
  | { kind: "InvalidPath"; type?: "factory_invalid_path"; path: string; reason: string }
  | { kind: "FileNotFound"; type?: "factory_file_not_found"; path: string }
  | { kind: "DirectoryNotFound"; type?: "factory_directory_not_found"; path: string }
  | { kind: "PermissionDenied"; type?: "factory_permission_denied"; path: string };

/**
 * Combined factory error types
 */
export type FactoryError = FactoryInitError | PathResolutionError;

/**
 * Format factory initialization error
 */
export function formatFactoryInitError(error: FactoryInitError): string {
  switch (error.kind) {
    case "InvalidConfig":
      return `Invalid configuration: ${error.reason}`;
    case "MissingParameter":
      return `Missing required parameter: ${error.parameter}`;
    case "ConfigValidation":
      return `Configuration validation failed for ${error.field}: ${error.reason}`;
    case "DependencyFailure":
      return `Dependency ${error.dependency} failed: ${error.reason}`;
  }
}

/**
 * Format path resolution error
 */
export function formatPathResolutionError(error: PathResolutionError): string {
  switch (error.kind) {
    case "NotResolved":
      return `${error.resource} not resolved`;
    case "InvalidPath":
      return `Invalid path '${error.path}': ${error.reason}`;
    case "FileNotFound":
      return `File not found: ${error.path}`;
    case "DirectoryNotFound":
      return `Directory not found: ${error.path}`;
    case "PermissionDenied":
      return `Permission denied: ${error.path}`;
  }
}

/**
 * Format any factory error
 */
export function formatFactoryError(error: FactoryError): string {
  if ("resource" in error || "path" in error) {
    return formatPathResolutionError(error as PathResolutionError);
  }
  return formatFactoryInitError(error as FactoryInitError);
}