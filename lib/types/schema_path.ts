/**
 * @fileoverview SchemaPath - Path Value Object for JSON Schema Resolution
 *
 * Represents a path to a JSON schema file with Smart Constructor pattern.
 * Handles path resolution logic for schema files used in prompt generation.
 *
 * Design Principles:
 * - Smart Constructor for type-safe creation
 * - Result type for error handling (no partial functions)
 * - Immutable value object
 * - Path resolution encapsulation
 *
 * @module types/schema_path
 */

import type { Result } from "./result.ts";
import { error, ok } from "./result.ts";
// Note: Using string types temporarily until DirectiveType and LayerType enhancements are complete
export type DirectiveType = string;
export type LayerType = string;

// ============================================================================
// Error Types
// ============================================================================

/**
 * SchemaPath validation errors
 */
export type SchemaPathError =
  | { readonly kind: "EmptyBaseDir"; readonly input: string }
  | { readonly kind: "EmptySchemaFile"; readonly input: string }
  | {
    readonly kind: "InvalidSchemaFileFormat";
    readonly filename: string;
    readonly reason: string;
  };

// ============================================================================
// SchemaPath Value Object
// ============================================================================

/**
 * SchemaPath - Value object for JSON schema path resolution
 *
 * Encapsulates the logic for resolving JSON schema file paths based on:
 * - Base directory (from configuration)
 * - DirectiveType (processing direction)
 * - LayerType (hierarchy level)
 * - Schema file name (typically "base.schema.json")
 *
 * Path format: {baseDir}/{directive}/{layer}/{schemaFile}
 */
export class SchemaPath {
  private constructor(
    public readonly baseDir: string,
    public readonly directive: DirectiveType,
    public readonly layer: LayerType,
    public readonly schemaFile: string,
  ) {
    Object.freeze(this);
  }

  // ============================================================================
  // Smart Constructors
  // ============================================================================

  /**
   * Create SchemaPath with validation
   *
   * @param baseDir - Base directory for schema files
   * @param directive - DirectiveType instance
   * @param layer - LayerType instance
   * @param schemaFile - Schema filename (defaults to "base.schema.json")
   * @returns Result with SchemaPath or validation error
   */
  static create(
    baseDir: string,
    directive: DirectiveType,
    layer: LayerType,
    schemaFile: string = "base.schema.json",
  ): Result<SchemaPath, SchemaPathError> {
    // Validate baseDir
    if (!baseDir || baseDir.trim() === "") {
      return error({
        kind: "EmptyBaseDir",
        input: baseDir,
      });
    }

    // Validate schemaFile
    if (!schemaFile || schemaFile.trim() === "") {
      return error({
        kind: "EmptySchemaFile",
        input: schemaFile,
      });
    }

    // Validate schema file format
    const trimmedSchemaFile = schemaFile.trim();
    if (!trimmedSchemaFile.endsWith(".json")) {
      return error({
        kind: "InvalidSchemaFileFormat",
        filename: schemaFile,
        reason: "Schema file must have .json extension",
      });
    }

    // Additional validation for schema file naming convention
    if (!trimmedSchemaFile.includes("schema")) {
      return error({
        kind: "InvalidSchemaFileFormat",
        filename: schemaFile,
        reason: "Schema file should contain 'schema' in the filename",
      });
    }

    return ok(
      new SchemaPath(
        baseDir.trim(),
        directive,
        layer,
        trimmedSchemaFile,
      ),
    );
  }

  /**
   * Create SchemaPath with default schema filename
   *
   * @param baseDir - Base directory for schema files
   * @param directive - DirectiveType instance
   * @param layer - LayerType instance
   * @returns Result with SchemaPath using default filename
   */
  static createDefault(
    baseDir: string,
    directive: DirectiveType,
    layer: LayerType,
  ): Result<SchemaPath, SchemaPathError> {
    return SchemaPath.create(baseDir, directive, layer, "base.schema.json");
  }

  // ============================================================================
  // Path Resolution Methods
  // ============================================================================

  /**
   * Resolve the complete file path
   *
   * @returns Complete path to schema file
   */
  resolve(): string {
    const directiveValue = this.getDirectiveValue();
    const layerValue = this.getLayerValue();

    return `${this.baseDir}/${directiveValue}/${layerValue}/${this.schemaFile}`;
  }

  /**
   * Get the directory path (without filename)
   *
   * @returns Directory path
   */
  getDirectory(): string {
    const directiveValue = this.getDirectiveValue();
    const layerValue = this.getLayerValue();

    return `${this.baseDir}/${directiveValue}/${layerValue}`;
  }

  /**
   * Get alternative schema path with different filename
   *
   * @param alternativeSchemaFile - Alternative schema filename
   * @returns SchemaPath with alternative filename
   */
  withSchemaFile(alternativeSchemaFile: string): Result<SchemaPath, SchemaPathError> {
    return SchemaPath.create(
      this.baseDir,
      this.directive,
      this.layer,
      alternativeSchemaFile,
    );
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Extract DirectiveType value
   *
   * Note: This method assumes DirectiveType has a way to extract its string value.
   * The actual implementation depends on DirectiveType's interface.
   *
   * @returns DirectiveType string value
   */
  private getDirectiveValue(): string {
    // TODO: Update this method based on DirectiveType enhancement
    // For now, assume DirectiveType can be converted to string
    return String(this.directive);
  }

  /**
   * Extract LayerType value
   *
   * Note: This method assumes LayerType has a way to extract its string value.
   * The actual implementation depends on LayerType's interface.
   *
   * @returns LayerType string value
   */
  private getLayerValue(): string {
    // TODO: Update this method based on LayerType enhancement
    // For now, assume LayerType can be converted to string
    return String(this.layer);
  }

  // ============================================================================
  // Schema-specific Methods
  // ============================================================================

  /**
   * Check if this is the default schema file
   *
   * @returns true if using default schema filename
   */
  isDefaultSchema(): boolean {
    return this.schemaFile === "base.schema.json";
  }

  /**
   * Get schema file extension
   *
   * @returns File extension (e.g., ".json")
   */
  getExtension(): string {
    const lastDotIndex = this.schemaFile.lastIndexOf(".");
    return lastDotIndex !== -1 ? this.schemaFile.substring(lastDotIndex) : "";
  }

  /**
   * Get schema file basename (without extension)
   *
   * @returns Filename without extension
   */
  getBasename(): string {
    const lastDotIndex = this.schemaFile.lastIndexOf(".");
    return lastDotIndex !== -1 ? this.schemaFile.substring(0, lastDotIndex) : this.schemaFile;
  }

  /**
   * Check if path exists in filesystem
   *
   * Note: This is an async operation that would require filesystem access.
   * Implementation depends on runtime environment and permissions.
   *
   * @returns Promise resolving to true if file exists
   */
  async exists(): Promise<boolean> {
    try {
      const stat = await Deno.stat(this.resolve());
      return stat.isFile;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Value Object Methods
  // ============================================================================

  /**
   * Type-safe equality comparison
   *
   * @param other - Another SchemaPath to compare
   * @returns true if paths are equal
   */
  equals(other: SchemaPath): boolean {
    return (
      this.baseDir === other.baseDir &&
      this.directive === other.directive &&
      this.layer === other.layer &&
      this.schemaFile === other.schemaFile
    );
  }

  /**
   * String representation
   *
   * @returns Resolved path string
   */
  toString(): string {
    return this.resolve();
  }

  // ============================================================================
  // Type Guards and Utilities
  // ============================================================================

  /**
   * Type guard for SchemaPath instances
   *
   * @param value - Value to check
   * @returns true if value is SchemaPath
   */
  static is(value: unknown): value is SchemaPath {
    return value instanceof SchemaPath;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create SchemaPath with error throwing (for cases where error is unexpected)
 *
 * @param baseDir - Base directory
 * @param directive - DirectiveType instance
 * @param layer - LayerType instance
 * @param schemaFile - Schema filename
 * @returns SchemaPath instance
 * @throws Error if validation fails
 */
export function createSchemaPathUnsafe(
  baseDir: string,
  directive: DirectiveType,
  layer: LayerType,
  schemaFile: string = "base.schema.json",
): SchemaPath {
  const result = SchemaPath.create(baseDir, directive, layer, schemaFile);
  if (!result.ok) {
    throw new Error(`Invalid SchemaPath: ${result.error.kind} - ${JSON.stringify(result.error)}`);
  }
  return result.data;
}
