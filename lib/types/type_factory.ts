/**
 * @fileoverview TypeFactory implementation for JSR-based type construction
 *
 * This module provides a factory for creating DirectiveType and LayerType instances
 * from JSR-validated BreakdownParams results. It ensures Totality principle
 * compliance by centralizing JSR-based type construction.
 *
 * @module types/type_factory
 */

import { DirectiveType } from "../domain/core/value_objects/directive_type.ts";
import { LayerType } from "../domain/core/value_objects/layer_type.ts";
import type { TwoParams_Result as _TwoParams_Result } from "../deps.ts";
import type { Result } from "./result.ts";
import type { ProcessingError } from "./unified_error_types.ts";
import { ErrorFactory } from "./unified_error_types.ts";

/**
 * Result type representing type construction results
 * Uses unified Result type and ProcessingError
 */
export type TypeCreationResult<T> = Result<T, ProcessingError>;

// New architecture through JSR integration:
// - Type construction delegated to DirectiveType.create()/LayerType.create()
// - Validation handled by BreakdownParams JSR package
// - Error handling unified with Result type

/**
 * TypeFactory - Factory for JSR-based type construction
 *
 * Provides safe type construction in coordination with BreakdownParams JSR package.
 * Following the Totality principle, type construction failures are explicitly
 * expressed using the Result type.
 *
 * @example Usage with JSR integration (recommended approach)
 * ```typescript
 * // Generate directly from JSR-validated values
 * const jsrResult = await breakdownParams.parseArgs(args);
 * if (jsrResult.type === "two") {
 *   const typesResult = TypeFactory.createFromJSR(jsrResult);
 *   if (typesResult.ok) {
 *     const { directive, layer } = typesResult.data;
 *     // Generation complete from JSR-validated values
 *   }
 * }
 * ```
 *
 * @example Direct type construction (assumes JSR-validated values)
 * ```typescript
 * const directiveResult = TypeFactory.createDirectiveType("to");
 * if (directiveResult.ok) {
 *   console.log(directiveResult.data.value); // "to"
 * } else {
 *   console.error(directiveResult.error.message);
 * }
 * ```
 */
export class TypeFactory {
  /**
   * Safely construct DirectiveType (assumes JSR-validated values)
   * @param value The value to construct (assumes pre-validation by JSR)
   * @returns DirectiveType on success, Error on failure
   */
  static createDirectiveType(
    value: string,
  ): TypeCreationResult<DirectiveType> {
    // Use DirectiveType's create method directly (assumes JSR-validated)
    const directiveResult = DirectiveType.create(value);

    if (!directiveResult.ok) {
      return {
        ok: false,
        error: ErrorFactory.processingError("ProcessingFailed", {
          operation: "jsr_type_creation",
          reason: directiveResult.error.message ?? "Unknown error",
        }),
      };
    }

    return {
      ok: true,
      data: directiveResult.data,
    };
  }

  /**
   * Safely construct LayerType (assumes JSR-validated values)
   * @param value The value to construct (assumes pre-validation by JSR)
   * @returns LayerType on success, Error on failure
   */
  static createLayerType(value: string): TypeCreationResult<LayerType> {
    // Use LayerType's create method directly (assumes JSR-validated)
    const layerResult = LayerType.create(value);

    if (!layerResult.ok) {
      return {
        ok: false,
        error: ErrorFactory.processingError("ProcessingFailed", {
          operation: "jsr_type_creation",
          reason: layerResult.error.message ?? "Unknown error",
        }),
      };
    }

    return {
      ok: true,
      data: layerResult.data,
    };
  }

  /**
   * Construct both DirectiveType and LayerType simultaneously (assumes JSR-validated values)
   *
   * Convenience method when both types are needed.
   * If either one fails, the entire operation fails.
   *
   * @param directiveValue DirectiveType value (JSR-validated)
   * @param layerValue LayerType value (JSR-validated)
   * @returns Both types on success, Error on failure
   */
  static createBothTypes(
    directiveValue: string,
    layerValue: string,
  ): TypeCreationResult<{ directive: DirectiveType; layer: LayerType }> {
    const directiveResult = TypeFactory.createDirectiveType(directiveValue);
    if (!directiveResult.ok) {
      return directiveResult;
    }

    const layerResult = TypeFactory.createLayerType(layerValue);
    if (!layerResult.ok) {
      return layerResult;
    }

    return {
      ok: true,
      data: {
        directive: directiveResult.data,
        layer: layerResult.data,
      },
    };
  }

  /**
   * Generate types directly from JSR-validated TwoParamsResult (recommended method)
   *
   * Performs direct type generation using values already validated by BreakdownParams.
   * This is the standard approach for JSR integration.
   *
   * @param jsrResult Result validated by JSR BreakdownParams
   * @returns Both types on success, Error on failure
   *
   * @example JSR integration usage example
   * ```typescript
   * // Directly use results validated by BreakdownParams
   * const jsrResult = await breakdownParams.parseArgs(args);
   * if (jsrResult.type === "two") {
   *   const typesResult = TypeFactory.createFromJSR(jsrResult);
   *   if (typesResult.ok) {
   *     const { directive, layer } = typesResult.data;
   *     // Types generated directly from JSR-validated values
   *   }
   * }
   * ```
   */
  static createFromJSR(
    jsrResult: _TwoParams_Result,
  ): TypeCreationResult<{ directive: DirectiveType; layer: LayerType }> {
    // Use JSR-validated values directly
    const directiveResult = DirectiveType.create(jsrResult.directiveType);
    if (!directiveResult.ok) {
      return {
        ok: false,
        error: ErrorFactory.processingError("ProcessingFailed", {
          operation: "jsr_type_creation",
          reason: `DirectiveType creation failed: ${
            directiveResult.error.message ?? "Unknown error"
          }`,
          context: {
            source: "JSR_validated",
            directiveType: jsrResult.directiveType,
          },
        }),
      };
    }

    const layerResult = LayerType.create(jsrResult.layerType);
    if (!layerResult.ok) {
      return {
        ok: false,
        error: ErrorFactory.processingError("ProcessingFailed", {
          operation: "jsr_type_creation",
          reason: `LayerType creation failed: ${layerResult.error.message ?? "Unknown error"}`,
          context: {
            source: "JSR_validated",
            layerType: jsrResult.layerType,
          },
        }),
      };
    }

    return {
      ok: true,
      data: {
        directive: directiveResult.data,
        layer: layerResult.data,
      },
    };
  }

  /**
   * Check JSR package integration status (for debugging)
   * @returns JSR integration status information
   */
  static debug(): {
    mode: "JSR_ONLY";
    availableMethods: string[];
    recommendedMethod: string;
  } {
    return {
      mode: "JSR_ONLY",
      availableMethods: [
        "TypeFactory.createFromJSR()",
        "TypeFactory.createDirectiveType()",
        "TypeFactory.createLayerType()",
        "TypeFactory.createBothTypes()",
      ],
      recommendedMethod: "TypeFactory.createFromJSR()",
    };
  }
}
