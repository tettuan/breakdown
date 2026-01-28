/**
 * @fileoverview PromptPath - Path Value Object for Prompt Template Resolution
 *
 * Represents a path to a prompt template file with Smart Constructor pattern.
 * Handles path resolution logic for prompt templates with support for adaptation variants.
 *
 * Design Principles:
 * - Smart Constructor for type-safe creation
 * - Result type for error handling (no partial functions)
 * - Immutable value object
 * - Path resolution encapsulation
 *
 * @module types/prompt_path
 */

import type { Result } from "./result.ts";
import { error, ok } from "./result.ts";
import type { DirectiveType } from "../domain/core/value_objects/directive_type.ts";
import type { LayerType } from "../domain/core/value_objects/layer_type.ts";

// ============================================================================
// Error Types
// ============================================================================

/**
 * PromptPath validation errors
 */
export type PromptPathError =
  | { readonly kind: "EmptyBaseDir"; readonly input: string }
  | { readonly kind: "EmptyFromLayer"; readonly input: string }
  | { readonly kind: "InvalidPathFormat"; readonly path: string; readonly reason: string }
  | { readonly kind: "InvalidAdaptation"; readonly adaptation: string; readonly reason: string };

// ============================================================================
// PromptPath Value Object
// ============================================================================

/**
 * PromptPath - Value object for prompt template path resolution
 *
 * Encapsulates the logic for resolving prompt template file paths based on:
 * - Base directory (from configuration)
 * - DirectiveType (processing direction)
 * - LayerType (hierarchy level)
 * - FromLayer (source layer for transformations)
 * - Adaptation (optional variant modifier)
 *
 * Path format: {baseDir}/{directive}/{layer}/f_{fromLayer}[_{adaptation}].md
 */
export class PromptPath {
  private constructor(
    public readonly baseDir: string,
    public readonly directive: DirectiveType,
    public readonly layer: LayerType,
    public readonly fromLayer: string,
    public readonly adaptation?: string,
  ) {
    Object.freeze(this);
  }

  // ============================================================================
  // Smart Constructors
  // ============================================================================

  /**
   * Create PromptPath with validation
   *
   * @param baseDir - Base directory for prompt templates
   * @param directive - DirectiveType instance
   * @param layer - LayerType instance
   * @param fromLayer - Source layer for transformation
   * @param adaptation - Optional adaptation variant
   * @returns Result with PromptPath or validation error
   */
  static create(
    baseDir: string,
    directive: DirectiveType,
    layer: LayerType,
    fromLayer: string,
    adaptation?: string,
  ): Result<PromptPath, PromptPathError> {
    // Validate baseDir
    if (!baseDir || baseDir.trim() === "") {
      return error({
        kind: "EmptyBaseDir",
        input: baseDir,
      });
    }

    // Validate fromLayer
    if (!fromLayer || fromLayer.trim() === "") {
      return error({
        kind: "EmptyFromLayer",
        input: fromLayer,
      });
    }

    // Validate adaptation format if provided
    if (adaptation !== undefined) {
      if (adaptation.trim() === "") {
        return error({
          kind: "InvalidAdaptation",
          adaptation,
          reason: "Adaptation cannot be empty string",
        });
      }

      // Check for valid adaptation format (alphanumeric, underscore, hyphen)
      if (!/^[a-zA-Z0-9_-]+$/.test(adaptation)) {
        return error({
          kind: "InvalidAdaptation",
          adaptation,
          reason: "Adaptation must contain only alphanumeric characters, underscores, and hyphens",
        });
      }
    }

    return ok(
      new PromptPath(
        baseDir.trim(),
        directive,
        layer,
        fromLayer.trim(),
        adaptation?.trim(),
      ),
    );
  }

  // ============================================================================
  // Path Resolution Methods
  // ============================================================================

  /**
   * Resolve the complete file path
   *
   * @returns Complete path to prompt template file
   */
  resolve(): string {
    const directiveValue = this.getDirectiveValue();
    const layerValue = this.getLayerValue();
    const filename = this.getFilename();

    return `${this.baseDir}/${directiveValue}/${layerValue}/${filename}`;
  }

  /**
   * Resolve path with specific adaptation
   *
   * @param adaptation - Adaptation variant to use
   * @returns Complete path with adaptation
   */
  resolveWithAdaptation(adaptation: string): string {
    const directiveValue = this.getDirectiveValue();
    const layerValue = this.getLayerValue();
    const filename = this.getFilenameWithAdaptation(adaptation);

    return `${this.baseDir}/${directiveValue}/${layerValue}/${filename}`;
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
   * Get the filename component
   *
   * @returns Filename with extension
   */
  getFilename(): string {
    const baseFilename = `f_${this.fromLayer}`;
    const extension = ".md";

    if (this.adaptation) {
      return `${baseFilename}_${this.adaptation}${extension}`;
    } else {
      return `${baseFilename}${extension}`;
    }
  }

  /**
   * Get filename with specific adaptation
   *
   * @param adaptation - Adaptation variant
   * @returns Filename with adaptation
   */
  getFilenameWithAdaptation(adaptation: string): string {
    return `f_${this.fromLayer}_${adaptation}.md`;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Extract DirectiveType value
   *
   * @returns DirectiveType string value
   */
  private getDirectiveValue(): string {
    return this.directive.value;
  }

  /**
   * Extract LayerType value
   *
   * @returns LayerType string value
   */
  private getLayerValue(): string {
    return this.layer.value;
  }

  // ============================================================================
  // Value Object Methods
  // ============================================================================

  /**
   * Type-safe equality comparison
   *
   * @param other - Another PromptPath to compare
   * @returns true if paths are equal
   */
  equals(other: PromptPath): boolean {
    return (
      this.baseDir === other.baseDir &&
      this.directive.equals(other.directive) &&
      this.layer.equals(other.layer) &&
      this.fromLayer === other.fromLayer &&
      this.adaptation === other.adaptation
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

  /**
   * Check if path has adaptation
   *
   * @returns true if adaptation is specified
   */
  hasAdaptation(): boolean {
    return this.adaptation !== undefined;
  }

  /**
   * Get path without adaptation
   *
   * @returns PromptPath without adaptation
   */
  withoutAdaptation(): Result<PromptPath, PromptPathError> {
    return PromptPath.create(
      this.baseDir,
      this.directive,
      this.layer,
      this.fromLayer,
    );
  }

  /**
   * Get path with different adaptation
   *
   * @param adaptation - New adaptation to use
   * @returns PromptPath with new adaptation
   */
  withAdaptation(adaptation: string): Result<PromptPath, PromptPathError> {
    return PromptPath.create(
      this.baseDir,
      this.directive,
      this.layer,
      this.fromLayer,
      adaptation,
    );
  }

  // ============================================================================
  // Type Guards and Utilities
  // ============================================================================

  /**
   * Type guard for PromptPath instances
   *
   * @param value - Value to check
   * @returns true if value is PromptPath
   */
  static is(value: unknown): value is PromptPath {
    return value instanceof PromptPath;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create PromptPath with error throwing (for cases where error is unexpected)
 *
 * @param baseDir - Base directory
 * @param directive - DirectiveType instance
 * @param layer - LayerType instance
 * @param fromLayer - Source layer
 * @param adaptation - Optional adaptation
 * @returns PromptPath instance
 * @throws Error if validation fails
 */
export function createPromptPathUnsafe(
  baseDir: string,
  directive: DirectiveType,
  layer: LayerType,
  fromLayer: string,
  adaptation?: string,
): PromptPath {
  const result = PromptPath.create(baseDir, directive, layer, fromLayer, adaptation);
  if (!result.ok) {
    throw new Error(`Invalid PromptPath: ${result.error.kind} - ${JSON.stringify(result.error)}`);
  }
  return result.data;
}
