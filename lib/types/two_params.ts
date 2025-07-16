/**
 * @fileoverview TwoParams type implementation with Smart Constructor pattern
 *
 * This module provides TwoParams type implementation in lib/types/ directory
 * that integrates with the aggregate root in lib/domain/core/aggregates/.
 * It follows Smart Constructor pattern and provides createOrError method.
 *
 * @module types/two_params
 */

import type { Result } from "./result.ts";
import { error, ok } from "./result.ts";
import type { ConfigProfileName } from "./config_profile_name.ts";
import type { TwoParams_Result } from "./two_params_result_extension.ts";
import { isTwoParamsResult } from "./two_params_result_extension.ts";
import type { ValidationError } from "./unified_error_types.ts";
import { ErrorFactory } from "./unified_error_types.ts";

// Re-export aggregate root for compatibility
export { TwoParams as TwoParamsAggregate } from "../domain/core/aggregates/two_params.ts";
export type { PathConfig, TwoParamsValidationError } from "../domain/core/aggregates/two_params.ts";

/**
 * TwoParams type errors following Discriminated Union pattern
 */
export type TwoParamsTypeError =
  | { kind: "InvalidInput"; field: string; value: unknown; reason: string }
  | { kind: "InvalidType"; expected: string; actual: string; message: string }
  | { kind: "MissingField"; field: string; message: string }
  | { kind: "ValidationFailed"; directive: string; layer: string; reason: string };

/**
 * TwoParams type representation for lib/types integration
 *
 * This class provides a Smart Constructor pattern implementation
 * that validates TwoParams_Result objects and creates type-safe instances.
 *
 * Design principles:
 * - Smart Constructor with createOrError method
 * - Totality principle compliance
 * - Integration with domain aggregate
 * - Type safety validation
 *
 * @example Basic usage with createOrError
 * ```typescript
 * const result = createTwoParamsResult("to", "task");
 * const twoParamsType = TwoParamsType.createOrError(result);
 *
 * if (twoParamsType.ok) {
 *   console.log(twoParamsType.data.directive); // "to"
 *   console.log(twoParamsType.data.layer); // "task"
 * }
 * ```
 *
 * @example Integration with aggregate
 * ```typescript
 * const typeResult = TwoParamsType.createOrError(paramsResult);
 * if (typeResult.ok) {
 *   const aggregate = typeResult.data.toAggregate(profile);
 *   // Use aggregate for domain operations
 * }
 * ```
 */
export class TwoParamsType {
  /**
   * Private constructor following Smart Constructor pattern
   *
   * @param directive - Validated directive type value
   * @param layer - Validated layer type value
   * @param params - Original params array
   * @param options - Additional options
   */
  private constructor(
    private readonly _directive: string,
    private readonly _layer: string,
    private readonly _params: readonly string[],
    private readonly _options: Record<string, unknown>,
  ) {
    Object.freeze(this);
  }

  /**
   * Directive type accessor
   */
  get directive(): string {
    return this._directive;
  }

  /**
   * Layer type accessor
   */
  get layer(): string {
    return this._layer;
  }

  /**
   * Params array accessor
   */
  get params(): readonly string[] {
    return this._params;
  }

  /**
   * Options accessor
   */
  get options(): Record<string, unknown> {
    return { ...this._options };
  }

  /**
   * Smart Constructor with Result type for Totality principle
   *
   * Creates a TwoParamsType instance from TwoParams_Result with comprehensive validation.
   * Follows Totality principle by handling all possible error cases explicitly.
   *
   * @param result - TwoParams_Result to validate and convert
   * @returns Result containing TwoParamsType or validation error
   *
   * @example Success case
   * ```typescript
   * const result = createTwoParamsResult("to", "task");
   * const twoParamsType = TwoParamsType.createOrError(result);
   * // twoParamsType.ok === true
   * ```
   *
   * @example Error case
   * ```typescript
   * const invalidResult = { type: "invalid" };
   * const twoParamsType = TwoParamsType.createOrError(invalidResult);
   * // twoParamsType.ok === false
   * // twoParamsType.error.kind === "InvalidInput"
   * ```
   */
  static createOrError(result: unknown): Result<TwoParamsType, ValidationError> {
    // Null/undefined check
    if (result === null || result === undefined) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "result",
        value: result,
        reason: "TwoParams_Result cannot be null or undefined",
      }));
    }

    // Type guard validation
    if (!isTwoParamsResult(result)) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "result",
        value: result,
        reason:
          "Invalid TwoParams_Result: must have required fields (type, params, directiveType, layerType)",
      }));
    }

    // Type field validation
    if (result.type !== "two") {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "type",
        value: result.type,
        reason: "Invalid TwoParams_Result: must have type 'two'",
      }));
    }

    // directiveType validation (primary)
    const directiveType = result.directiveType || result.demonstrativeType;
    if (!directiveType || typeof directiveType !== "string") {
      return error(ErrorFactory.validationError("MissingRequiredField", {
        field: "directiveType",
        source: "TwoParams_Result",
      }));
    }

    // layerType validation
    if (!result.layerType || typeof result.layerType !== "string") {
      return error(ErrorFactory.validationError("MissingRequiredField", {
        field: "layerType",
        source: "TwoParams_Result",
      }));
    }

    // params validation
    if (!Array.isArray(result.params)) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "params",
        value: result.params,
        reason: "params must be an array",
      }));
    }

    // params content validation
    if (result.params.length !== 2) {
      return error(ErrorFactory.validationError("PathValidationFailed", {
        path: "params",
        reason: "params array must contain exactly 2 elements",
      }));
    }

    // params consistency validation
    if (result.params[0] !== directiveType || result.params[1] !== result.layerType) {
      return error(ErrorFactory.validationError("PathValidationFailed", {
        path: "params",
        reason: "params array must match directiveType and layerType",
      }));
    }

    // Success: create TwoParamsType instance
    return ok(
      new TwoParamsType(
        directiveType,
        result.layerType,
        [...result.params], // Create immutable copy
        result.options || {},
      ),
    );
  }

  /**
   * Convert to domain aggregate root
   *
   * Creates a TwoParams aggregate root instance from this type.
   * Enables integration between types layer and domain layer.
   *
   * @param profile - Configuration profile for domain validation
   * @returns Result containing TwoParams aggregate or domain error
   */
  async toAggregate(
    profile: ConfigProfileName,
  ): Promise<
    Result<
      import("../domain/core/aggregates/two_params.ts").TwoParams,
      import("../domain/core/aggregates/two_params.ts").TwoParamsValidationError
    >
  > {
    const { TwoParams } = await import("../domain/core/aggregates/two_params.ts");
    return TwoParams.create(this._directive, this._layer, profile);
  }

  /**
   * Equality comparison
   *
   * @param other - Other TwoParamsType to compare
   * @returns true if equal, false otherwise
   */
  equals(other: TwoParamsType): boolean {
    return this._directive === other._directive &&
      this._layer === other._layer &&
      this._params.length === other._params.length &&
      this._params.every((param, index) => param === other._params[index]);
  }

  /**
   * String representation
   *
   * @returns String representation in "directive layer" format
   */
  toString(): string {
    return `${this._directive} ${this._layer}`;
  }

  /**
   * Debug string with detailed information
   *
   * @returns Detailed debug string
   */
  toDebugString(): string {
    return `TwoParamsType(directive="${this._directive}", layer="${this._layer}", params=[${
      this._params.join(", ")
    }])`;
  }

  /**
   * JSON serialization
   *
   * @returns Serializable object representation
   */
  toJSON(): Record<string, unknown> {
    return {
      directive: this._directive,
      layer: this._layer,
      params: [...this._params],
      options: { ...this._options },
    };
  }

  /**
   * Validate directive and layer combination
   *
   * @returns Result indicating if combination is valid
   */
  validate(): Result<true, TwoParamsTypeError> {
    // Basic validation rules
    if (this._directive.length === 0) {
      return error({
        kind: "ValidationFailed",
        directive: this._directive,
        layer: this._layer,
        reason: "Directive cannot be empty",
      });
    }

    if (this._layer.length === 0) {
      return error({
        kind: "ValidationFailed",
        directive: this._directive,
        layer: this._layer,
        reason: "Layer cannot be empty",
      });
    }

    return ok(true);
  }

  /**
   * Type guard to check if a value is a TwoParamsType instance
   *
   * @param value - Value to check
   * @returns true if value is TwoParamsType, false otherwise
   */
  static is(value: unknown): value is TwoParamsType {
    return value instanceof TwoParamsType;
  }
}

/**
 * Helper function to create TwoParamsType from directive and layer strings
 *
 * @param directive - Directive type string
 * @param layer - Layer type string
 * @param options - Additional options
 * @returns Result containing TwoParamsType or validation error
 */
export async function createTwoParamsType(
  directive: string,
  layer: string,
  options: Record<string, unknown> = {},
): Promise<Result<TwoParamsType, ValidationError>> {
  const { createTwoParamsResult } = await import("./two_params_result_extension.ts");
  const result = createTwoParamsResult(directive, layer, options);
  return TwoParamsType.createOrError(result);
}

/**
 * Type alias for backward compatibility
 */
export type TwoParams = TwoParamsType;

/**
 * Export class as TwoParams for backward compatibility
 * This allows TwoParams.is() and other static methods to work
 */
export const TwoParams = TwoParamsType;

/**
 * Default export for common usage
 */
export default TwoParamsType;
