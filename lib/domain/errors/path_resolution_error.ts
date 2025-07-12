/**
 * @fileoverview Path Resolution Domain Errors
 * 
 * Errors related to file path resolution, including prompt templates,
 * schemas, and output file paths.
 * 
 * @module domain/errors/path_resolution_error
 */

import { BaseBreakdownError } from "./breakdown_error.ts";

/**
 * Path resolution error types
 */
export type PathResolutionErrorKind =
  | "path-not-found"
  | "path-invalid-format"
  | "path-traversal-detected"
  | "path-permission-denied"
  | "template-not-found"
  | "schema-not-found"
  | "output-path-conflict"
  | "base-directory-invalid"
  | "resource-path-invalid";

/**
 * Path Resolution Error
 * Thrown when file path resolution fails
 */
export class PathResolutionError extends BaseBreakdownError {
  readonly domain = "path-resolution" as const;
  readonly kind: PathResolutionErrorKind;

  constructor(
    kind: PathResolutionErrorKind,
    message: string,
    options?: {
      cause?: Error;
      context?: {
        path?: string;
        basePath?: string;
        directiveType?: string;
        layerType?: string;
        fromLayerType?: string;
        adaptation?: string;
        resolvedPath?: string;
        availablePaths?: string[];
        reason?: string;
      };
    }
  ) {
    super(message, options);
    this.kind = kind;
  }

  /**
   * Create error for path not found
   */
  static notFound(path: string, resourceType: string): PathResolutionError {
    return new PathResolutionError(
      "path-not-found",
      `${resourceType} not found at path: ${path}`,
      {
        context: { path, reason: `${resourceType} file does not exist` }
      }
    );
  }

  /**
   * Create error for invalid path format
   */
  static invalidFormat(path: string, reason: string): PathResolutionError {
    return new PathResolutionError(
      "path-invalid-format",
      `Invalid path format: '${path}' - ${reason}`,
      {
        context: { path, reason }
      }
    );
  }

  /**
   * Create error for path traversal attempt
   */
  static traversalDetected(path: string, basePath: string): PathResolutionError {
    return new PathResolutionError(
      "path-traversal-detected",
      `Path traversal detected: '${path}' attempts to access outside of '${basePath}'`,
      {
        context: { path, basePath, reason: "Security violation: path traversal" }
      }
    );
  }

  /**
   * Create error for permission denied
   */
  static permissionDenied(path: string, operation: string): PathResolutionError {
    return new PathResolutionError(
      "path-permission-denied",
      `Permission denied for ${operation} on path: ${path}`,
      {
        context: { path, reason: `No ${operation} permission` }
      }
    );
  }

  /**
   * Create error for template not found
   */
  static templateNotFound(
    directiveType: string,
    layerType: string,
    fromLayerType?: string,
    adaptation?: string
  ): PathResolutionError {
    const parts = [directiveType, layerType];
    if (fromLayerType) parts.push(`from ${fromLayerType}`);
    if (adaptation) parts.push(`(${adaptation})`);
    
    const expectedPath = `prompts/${directiveType}/${layerType}/f_${fromLayerType || layerType}${adaptation ? `_${adaptation}` : ''}.md`;

    return new PathResolutionError(
      "template-not-found",
      `Prompt template not found for: ${parts.join(' ')}`,
      {
        context: { 
          directiveType, 
          layerType, 
          fromLayerType, 
          adaptation,
          path: expectedPath,
          reason: "Template file does not exist"
        }
      }
    );
  }

  /**
   * Create error for schema not found
   */
  static schemaNotFound(
    directiveType: string,
    layerType: string,
    schemaType: string = "base"
  ): PathResolutionError {
    const expectedPath = `schema/${directiveType}/${layerType}/${schemaType}.schema.md`;

    return new PathResolutionError(
      "schema-not-found",
      `Schema not found for ${directiveType}/${layerType} (${schemaType})`,
      {
        context: { 
          directiveType, 
          layerType,
          path: expectedPath,
          reason: "Schema file does not exist"
        }
      }
    );
  }

  /**
   * Create error for output path conflict
   */
  static outputPathConflict(
    path: string,
    reason: string
  ): PathResolutionError {
    return new PathResolutionError(
      "output-path-conflict",
      `Output path conflict: ${path} - ${reason}`,
      {
        context: { path, reason }
      }
    );
  }

  /**
   * Create error for invalid base directory
   */
  static baseDirectoryInvalid(
    basePath: string,
    reason: string
  ): PathResolutionError {
    return new PathResolutionError(
      "base-directory-invalid",
      `Invalid base directory: '${basePath}' - ${reason}`,
      {
        context: { basePath, reason }
      }
    );
  }

  /**
   * Create error for invalid resource path
   */
  static resourcePathInvalid(
    path: string,
    resourceType: string,
    availablePaths?: string[]
  ): PathResolutionError {
    const message = availablePaths?.length
      ? `Invalid ${resourceType} path: '${path}'. Available: ${availablePaths.slice(0, 3).join(', ')}`
      : `Invalid ${resourceType} path: '${path}'`;

    return new PathResolutionError(
      "resource-path-invalid",
      message,
      {
        context: { path, availablePaths, reason: `Invalid ${resourceType} path` }
      }
    );
  }

  /**
   * Get user-friendly error message
   */
  override getUserMessage(): string {
    const base = super.getUserMessage();
    
    // Add helpful context for common errors
    switch (this.kind) {
      case "template-not-found":
        return `${base}\n\nExpected location: ${this.context?.path}`;
      case "schema-not-found":
        return `${base}\n\nExpected location: ${this.context?.path}`;
      case "path-traversal-detected":
        return `${base}\n\nSecurity: Paths must stay within project directory`;
      case "output-path-conflict":
        return `${base}\n\nChoose a different output filename or location`;
      default:
        return base;
    }
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    switch (this.kind) {
      case "path-not-found":
      case "template-not-found":
      case "schema-not-found":
        // Can be recovered by creating the missing files
        return true;
      case "path-permission-denied":
        // Might be recoverable by fixing permissions
        return true;
      case "path-traversal-detected":
        // Security violation - not recoverable
        return false;
      default:
        return true;
    }
  }

  /**
   * Get specific recovery suggestions
   */
  getRecoverySuggestions(): string[] {
    const suggestions: string[] = [];

    switch (this.kind) {
      case "path-not-found":
        suggestions.push(`Create the missing file at: ${this.context?.path}`);
        suggestions.push("Check if the path is correct");
        break;
      case "template-not-found":
        if (this.context?.path) {
          suggestions.push(`Create template at: ${this.context.path}`);
        }
        suggestions.push("Run 'breakdown init' to create default templates");
        suggestions.push("Check available templates with 'breakdown list templates'");
        break;
      case "schema-not-found":
        if (this.context?.path) {
          suggestions.push(`Create schema at: ${this.context.path}`);
        }
        suggestions.push("Use 'breakdown init' to generate default schemas");
        break;
      case "path-invalid-format":
        suggestions.push("Use forward slashes (/) in paths");
        suggestions.push("Avoid special characters in filenames");
        suggestions.push("Remove any '..' or absolute paths");
        break;
      case "path-traversal-detected":
        suggestions.push("Use relative paths within the project directory");
        suggestions.push("Remove '..' from your path");
        break;
      case "path-permission-denied":
        suggestions.push(`Check file permissions for: ${this.context?.path}`);
        suggestions.push("Ensure you have read/write access to the directory");
        break;
      case "output-path-conflict":
        suggestions.push("Choose a different output filename");
        suggestions.push("Use --output flag to specify a different location");
        break;
      case "base-directory-invalid":
        suggestions.push("Ensure the base directory exists");
        suggestions.push("Check your working directory");
        break;
    }

    return suggestions;
  }

  /**
   * Get example path for the error context
   */
  getExamplePath(): string | undefined {
    switch (this.kind) {
      case "template-not-found":
        if (this.context?.directiveType && this.context?.layerType) {
          const from = this.context.fromLayerType || this.context.layerType;
          const adapt = this.context.adaptation ? `_${this.context.adaptation}` : '';
          return `prompts/${this.context.directiveType}/${this.context.layerType}/f_${from}${adapt}.md`;
        }
        break;
      case "schema-not-found":
        if (this.context?.directiveType && this.context?.layerType) {
          return `schema/${this.context.directiveType}/${this.context.layerType}/base.schema.md`;
        }
        break;
    }
    return undefined;
  }
}