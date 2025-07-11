/**
 * @fileoverview Schema Path Value Object
 *
 * Represents a path to a schema file with validation and formatting capabilities.
 */

import type { DirectiveType } from "../../../../types/directive_type.ts";
import type { LayerType } from "../../../../types/layer_type.ts";

/**
 * Schema path result
 */
export interface SchemaPathResult {
  ok: boolean;
  data?: SchemaPath;
  error?: string;
}

/**
 * Schema Path Value Object
 */
export class SchemaPath {
  private constructor(
    private readonly directive: DirectiveType,
    private readonly layer: LayerType,
    private readonly filename: string,
  ) {}

  /**
   * Create a new schema path
   */
  static create(
    directive: DirectiveType,
    layer: LayerType,
    filename: string,
  ): SchemaPathResult {
    try {
      if (!directive || !layer || !filename) {
        return {
          ok: false,
          error: "Directive, layer, and filename are required",
        };
      }

      if (!filename.endsWith(".json")) {
        return {
          ok: false,
          error: "Schema filename must end with .json",
        };
      }

      return {
        ok: true,
        data: new SchemaPath(directive, layer, filename),
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get the full path
   */
  getPath(): string {
    return `${this.directive.getValue()}/${this.layer.getValue()}/${this.filename}`;
  }

  /**
   * Get directive
   */
  getDirective(): DirectiveType {
    return this.directive;
  }

  /**
   * Get layer
   */
  getLayer(): LayerType {
    return this.layer;
  }

  /**
   * Get filename
   */
  getFilename(): string {
    return this.filename;
  }

  /**
   * Check if this path equals another
   */
  equals(other: SchemaPath): boolean {
    return this.getPath() === other.getPath();
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.getPath();
  }
}
