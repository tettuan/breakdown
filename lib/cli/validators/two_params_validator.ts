/**
 * @fileoverview TwoParamsValidator - Parameter validation with Totality principle
 * 
 * This module handles validation of two-parameter commands,
 * ensuring demonstrative type and layer type are valid.
 * 
 * @module cli/validators/two_params_validator
 */

import type { Result } from "../../types/result.ts";
import { ok, error } from "../../types/result.ts";
import type { DemonstrativeType, LayerType } from "../../types/mod.ts";

/**
 * Validation error types
 */
export type ValidationError =
  | { kind: "InvalidParameterCount"; received: number; expected: number }
  | { kind: "InvalidDemonstrativeType"; value: string; validTypes: string[] }
  | { kind: "InvalidLayerType"; value: string; validTypes: string[] };

/**
 * Validated parameters result
 */
export interface ValidatedParams {
  demonstrativeType: DemonstrativeType;
  layerType: string;
}

/**
 * Valid demonstrative types
 */
const VALID_DEMONSTRATIVE_TYPES = ["to", "summary", "defect", "init", "find"] as const;

/**
 * Valid layer types
 */
const VALID_LAYER_TYPES = ["project", "issue", "task", "bugs", "temp"] as const;

/**
 * TwoParamsValidator - Validates two-parameter commands
 * 
 * Responsibilities:
 * - Check parameter count
 * - Validate demonstrative type
 * - Validate layer type
 * - Return typed results
 */
export class TwoParamsValidator {
  /**
   * Validate two parameters
   * 
   * @param params - Array of string parameters
   * @returns Result with validated parameters or error
   */
  async validate(params: string[]): Promise<Result<ValidatedParams, ValidationError>> {
    // Check parameter count
    if (params.length < 2) {
      return error({
        kind: "InvalidParameterCount",
        received: params.length,
        expected: 2
      });
    }

    const [demonstrativeTypeStr, layerTypeStr] = params;

    // Validate demonstrative type
    const demonstrativeResult = this.validateDemonstrativeType(demonstrativeTypeStr);
    if (!demonstrativeResult.ok) {
      return error(demonstrativeResult.error);
    }

    // Validate layer type
    const layerResult = this.validateLayerType(layerTypeStr);
    if (!layerResult.ok) {
      return error(layerResult.error);
    }

    return ok({
      demonstrativeType: demonstrativeResult.data,
      layerType: layerResult.data
    });
  }

  /**
   * Validate demonstrative type
   */
  private validateDemonstrativeType(value: string): Result<DemonstrativeType, ValidationError> {
    if (VALID_DEMONSTRATIVE_TYPES.includes(value as DemonstrativeType)) {
      return ok(value as DemonstrativeType);
    }

    return error({
      kind: "InvalidDemonstrativeType",
      value,
      validTypes: [...VALID_DEMONSTRATIVE_TYPES]
    });
  }

  /**
   * Validate layer type
   */
  private validateLayerType(value: string): Result<string, ValidationError> {
    if (VALID_LAYER_TYPES.includes(value as any)) {
      return ok(value);
    }

    return error({
      kind: "InvalidLayerType",
      value,
      validTypes: [...VALID_LAYER_TYPES]
    });
  }
}