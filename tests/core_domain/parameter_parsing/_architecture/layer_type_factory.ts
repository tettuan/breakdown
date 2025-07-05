/**
 * @fileoverview LayerTypeFactory for creating LayerType instances
 *
 * This factory provides type-safe LayerType creation following the Totality principle.
 * All operations return Result types instead of throwing exceptions.
 *
 * @module core_domain/parameter_parsing/layer_type_factory
 */

import { LayerType, TwoParamsLayerTypePattern } from "../../../../lib/types/layer_type.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";

/**
 * Error types for LayerType creation
 */
export type LayerTypeCreationError =
  | { kind: "NullInput" }
  | { kind: "EmptyInput"; input: string }
  | { kind: "InvalidInput"; input: unknown; actualType: string }
  | { kind: "UnknownLayer"; input: string; suggestions: string[] }
  | { kind: "ValidationFailed"; input: string; pattern: string };

/**
 * Result type for LayerType creation
 */
export type LayerTypeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: LayerTypeCreationError };

/**
 * Factory for creating LayerType instances
 */
export class LayerTypeFactory {
  /**
   * Known layer types
   */
  private static readonly KNOWN_LAYERS = [
    "project",
    "issue", 
    "task",
    "bugs",
    "temp",
  ] as const;

  /**
   * Create LayerType from string
   */
  static fromString(
    input: unknown,
    pattern?: TwoParamsLayerTypePattern,
  ): LayerTypeResult<LayerType> {
    // Null check
    if (input === null || input === undefined) {
      return { ok: false, error: { kind: "NullInput" } };
    }

    // Type check
    if (typeof input !== "string") {
      return { 
        ok: false, 
        error: { 
          kind: "InvalidInput", 
          input, 
          actualType: typeof input 
        } 
      };
    }

    // Empty check
    if (input.trim() === "") {
      return { 
        ok: false, 
        error: { 
          kind: "EmptyInput", 
          input 
        } 
      };
    }

    const layerValue = input.trim();

    // Pattern validation if provided
    if (pattern) {
      if (!pattern.test(layerValue)) {
        return {
          ok: false,
          error: {
            kind: "ValidationFailed",
            input: layerValue,
            pattern: pattern.getPattern(),
          },
        };
      }
    } else {
      // Default validation against known layers
      if (!this.isValidLayer(layerValue)) {
        return {
          ok: false,
          error: {
            kind: "UnknownLayer",
            input: layerValue,
            suggestions: this.getKnownLayers(),
          },
        };
      }
    }

    // Create TwoParams_Result for LayerType creation
    const result: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: layerValue,
      params: ["to", layerValue],
      options: {},
    };

    const layerType = LayerType.create(result);
    return { ok: true, data: layerType };
  }

  /**
   * Create LayerType from TwoParams_Result
   */
  static fromTwoParamsResult(
    result: TwoParams_Result,
  ): LayerTypeResult<LayerType> {
    const layerType = LayerType.create(result);
    return { ok: true, data: layerType };
  }

  /**
   * Check if layer is valid
   */
  static isValidLayer(layer: string): boolean {
    return this.KNOWN_LAYERS.includes(layer as any);
  }

  /**
   * Get all known layers
   */
  static getKnownLayers(): string[] {
    return [...this.KNOWN_LAYERS];
  }
}