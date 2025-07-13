/**
 * @fileoverview LayerTypeFactory - Compatibility Layer (DEPRECATED)
 *
 * This module provides backward compatibility for LayerTypeFactory.
 * All functionality has been moved to LayerType domain object following DDD principles.
 *
 * @deprecated Use LayerType.fromString() and LayerType.fromTwoParamsResult() instead
 * @module types/layer_type_factory
 */

import { LayerType } from "../domain/core/value_objects/layer_type.ts";
import type { LayerTypeResult, LayerTypeCreationError } from "./layer_type_types.ts";

/**
 * LayerTypeFactory - Compatibility wrapper (DEPRECATED)
 *
 * @deprecated Use LayerType static methods directly:
 * - LayerType.fromString() instead of LayerTypeFactory.fromString()
 * - LayerType.fromTwoParamsResult() instead of LayerTypeFactory.fromTwoParamsResult()
 * - LayerType.isValidLayer() instead of LayerTypeFactory.isValidLayer()
 * - LayerType.getKnownLayerTypes() instead of LayerTypeFactory.getKnownLayers()
 */
export class LayerTypeFactory {
  /**
   * @deprecated Use LayerType.fromString() instead
   */
  static fromString(
    input: unknown,
    pattern?: { test: (value: string) => boolean; getPattern: () => string },
  ): LayerTypeResult<LayerType> {
    // Convert pattern interface to TwoParamsLayerTypePattern if provided
    const layerPattern = pattern ? {
      test: (value: string) => pattern.test(value),
      getPattern: () => pattern.getPattern(),
      getLayerTypePattern: () => layerPattern,
      pattern: new RegExp(pattern.getPattern()),
    } : undefined;
    
    const result = LayerType.fromString(input, layerPattern as any);
    
    if (result.ok) {
      return {
        ok: true,
        data: result.data,
      };
    }

    // Convert domain error to factory error format
    const error: LayerTypeCreationError = (() => {
      if (result.error.kind === "EmptyInput") {
        if (input === null || input === undefined) {
          return { kind: "NullInput" };
        }
        if (typeof input !== "string") {
          return {
            kind: "InvalidInput",
            input,
            actualType: typeof input,
          };
        }
        return {
          kind: "EmptyInput",
          input: input as string,
        };
      }

      if (result.error.kind === "InvalidFormat") {
        return {
          kind: "ValidationFailed",
          input: result.error.value,
          pattern: result.error.pattern,
        };
      }

      // Check if suggestions are available (enhanced error)
      if ("suggestions" in result.error && result.error.suggestions) {
        return {
          kind: "UnknownLayer",
          input: result.error.value || "",
          suggestions: result.error.suggestions,
        };
      }

      // Default validation failed
      return {
        kind: "ValidationFailed",
        input: result.error.value || "",
        pattern: result.error.message,
      };
    })();

    return {
      ok: false,
      error,
    };
  }

  /**
   * @deprecated Use LayerType.fromTwoParamsResult() instead
   */
  static fromTwoParamsResult(result: { layerType: string }): LayerTypeResult<LayerType> {
    const layerResult = LayerType.fromTwoParamsResult(result);
    
    if (layerResult.ok) {
      return {
        ok: true,
        data: layerResult.data,
      };
    }

    return {
      ok: false,
      error: {
        kind: "ValidationFailed",
        input: result.layerType,
        pattern: layerResult.error.message,
      },
    };
  }

  /**
   * @deprecated Use LayerType.isValidLayer() instead
   */
  static isValidLayer(input: string): boolean {
    return LayerType.isValidLayer(input);
  }

  /**
   * @deprecated Use LayerType.getKnownLayerTypes() instead
   */
  static getKnownLayers(): readonly string[] {
    return LayerType.getKnownLayerTypes();
  }
}