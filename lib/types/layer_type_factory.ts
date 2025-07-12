/**
 * @fileoverview LayerTypeFactory for creating LayerType instances
 *
 * This module provides a factory for creating LayerType instances following
 * Totality principle with proper error handling and validation.
 *
 * @module types/layer_type_factory
 */

import { LayerType, TwoParamsLayerTypePattern } from "../domain/core/value_objects/layer_type.ts";
import type { TwoParams_Result } from "../deps.ts";

/**
 * Error types for LayerType creation
 */
export type LayerTypeCreationError =
  | { kind: "EmptyInput"; input: string }
  | { kind: "UnknownLayer"; input: string; suggestions: readonly string[] }
  | { kind: "ValidationFailed"; input: string; pattern: string }
  | { kind: "NullInput" }
  | { kind: "InvalidInput"; input: unknown; actualType: string };

/**
 * LayerType creation result following Totality principle
 */
export type LayerTypeResult<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  error: LayerTypeCreationError;
};

/**
 * LayerTypeFactory - Factory for creating LayerType instances
 *
 * Provides safe LayerType construction with comprehensive error handling
 * following the Totality principle.
 */
export class LayerTypeFactory {
  private static readonly KNOWN_LAYERS = ["project", "issue", "task", "bugs", "temp"] as const;

  /**
   * Creates LayerType from string input with validation
   * @param input - String input to convert to LayerType
   * @param pattern - Optional validation pattern
   * @returns LayerTypeResult with success or error
   */
  static fromString(
    input: unknown,
    pattern?: TwoParamsLayerTypePattern,
  ): LayerTypeResult<LayerType> {
    // Handle null/undefined
    if (input === null || input === undefined) {
      return {
        ok: false,
        error: { kind: "NullInput" },
      };
    }

    // Handle non-string input
    if (typeof input !== "string") {
      return {
        ok: false,
        error: {
          kind: "InvalidInput",
          input,
          actualType: typeof input,
        },
      };
    }

    // Handle empty string
    if (input.trim() === "") {
      return {
        ok: false,
        error: {
          kind: "EmptyInput",
          input,
        },
      };
    }

    const normalized = input.trim().toLowerCase();

    // Pattern validation if provided
    if (pattern && !pattern.test(normalized)) {
      return {
        ok: false,
        error: {
          kind: "ValidationFailed",
          input: normalized,
          pattern: pattern.getPattern(),
        },
      };
    }

    // Create appropriate LayerType based on input
    if (
      LayerTypeFactory.KNOWN_LAYERS.includes(
        normalized as typeof LayerTypeFactory.KNOWN_LAYERS[number],
      )
    ) {
      // Create TwoParams_Result for LayerType.create()
      const twoParamsResult: TwoParams_Result = {
        type: "two",
        demonstrativeType: "to", // Default directive
        layerType: normalized,
        params: ["to", normalized],
        options: {},
      };

      const layerTypeResult = LayerType.create(twoParamsResult);
      if (layerTypeResult.ok) {
        return {
          ok: true,
          data: layerTypeResult.data,
        };
      } else {
        return {
          ok: false,
          error: {
            kind: "ValidationFailed" as const,
            input: normalized,
            pattern: layerTypeResult.error.message,
          },
        };
      }
    }

    // Unknown layer - provide suggestions
    const suggestions = LayerTypeFactory.calculateSuggestions(normalized);
    return {
      ok: false,
      error: {
        kind: "UnknownLayer",
        input: normalized,
        suggestions,
      },
    };
  }

  /**
   * Creates LayerType from TwoParams_Result
   * @param result - TwoParams_Result containing layer information
   * @returns LayerTypeResult with success or error
   */
  static fromTwoParamsResult(result: TwoParams_Result): LayerTypeResult<LayerType> {
    try {
      const layerTypeResult = LayerType.create(result);
      if (layerTypeResult.ok) {
        return {
          ok: true,
          data: layerTypeResult.data,
        };
      } else {
        return {
          ok: false,
          error: {
            kind: "ValidationFailed" as const,
            input: result.layerType,
            pattern: layerTypeResult.error.message,
          },
        };
      }
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: "ValidationFailed",
          input: result.layerType,
          pattern: `TwoParams_Result validation: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      };
    }
  }

  /**
   * Calculate suggestions for unknown layer inputs
   * @param input - Unknown layer input
   * @returns Array of suggested layer names
   */
  private static calculateSuggestions(input: string): readonly string[] {
    const suggestions: string[] = [];

    for (const known of LayerTypeFactory.KNOWN_LAYERS) {
      // Simple similarity: starts with or contains
      if (known.startsWith(input) || input.startsWith(known) || known.includes(input)) {
        suggestions.push(known);
      }
    }

    // If no close matches, return all options
    if (suggestions.length === 0) {
      return [...LayerTypeFactory.KNOWN_LAYERS];
    }

    return suggestions;
  }

  /**
   * Check if a layer value is valid
   * @param input - Layer value to check
   * @returns boolean indicating validity
   */
  static isValidLayer(input: string): boolean {
    const normalized = input.trim().toLowerCase();
    return LayerTypeFactory.KNOWN_LAYERS.includes(
      normalized as typeof LayerTypeFactory.KNOWN_LAYERS[number],
    );
  }

  /**
   * Get all known layer types
   * @returns Array of known layer type names
   */
  static getKnownLayers(): readonly string[] {
    return [...LayerTypeFactory.KNOWN_LAYERS];
  }
}
