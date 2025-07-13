/**
 * @fileoverview Prompt Path Value Object
 *
 * Represents a path to a prompt template file with validation and formatting capabilities.
 */

import type { DirectiveType } from "../../../../types/directive_type.ts";
import type { LayerType } from "../../../../domain/core/value_objects/layer_type.ts";

/**
 * Prompt path result
 */
export interface PromptPathResult {
  ok: boolean;
  data?: PromptPath;
  error?: string;
}

/**
 * Prompt Path Value Object
 */
export class PromptPath {
  private constructor(
    private readonly directive: DirectiveType,
    private readonly layer: LayerType,
    private readonly filename: string,
  ) {}

  /**
   * Create a new prompt path
   */
  static create(
    directive: DirectiveType,
    layer: LayerType,
    filename: string,
  ): PromptPathResult {
    try {
      if (!directive || !layer || !filename) {
        return {
          ok: false,
          error: "Directive, layer, and filename are required",
        };
      }

      if (!filename.endsWith(".md")) {
        return {
          ok: false,
          error: "Prompt filename must end with .md",
        };
      }

      return {
        ok: true,
        data: new PromptPath(directive, layer, filename),
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
    return `${this.directive.value}/${this.layer.value}/${this.filename}`;
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
  equals(other: PromptPath): boolean {
    return this.getPath() === other.getPath();
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.getPath();
  }
}
