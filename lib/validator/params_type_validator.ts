/**
 * @fileoverview Params Type Validator
 *
 * This module validates the type and structure of parsed parameters,
 * following the Single Responsibility Principle.
 *
 * @module lib/validator/params_type_validator
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";

/**
 * Params type validation error
 */
export type ParamsTypeError =
  | { kind: "InvalidParamsType"; expected: string; received: string }
  | { kind: "MissingRequiredField"; field: string; source: string }
  | { kind: "InvalidFieldType"; field: string; expected: string; received: string }
  | { kind: "InvalidFieldValue"; field: string; value: unknown; pattern: string }
  | { kind: "IncompatibleParams"; reason: string };

/**
 * Generic params result interface
 */
export interface ParamsResult {
  type: string;
  params?: string[];
  options?: Record<string, unknown>;
  demonstrativeType?: string;
  layerType?: string;
}

/**
 * Validated params structure
 */
export interface ValidatedParamsType {
  type: "zero" | "one" | "two";
  demonstrativeType: string;
  layerType: string;
  params: string[];
  options: Record<string, unknown>;
}

/**
 * Params Type Validator class
 *
 * Responsible for validating the type and structure of parsed parameters,
 * ensuring they conform to expected patterns and contain required fields.
 */
export class ParamsTypeValidator {
  constructor(
    private readonly patternProvider: TypePatternProvider,
  ) {}

  /**
   * Validate params result type and structure
   */
  validate(result: ParamsResult): Result<ValidatedParamsType, ParamsTypeError> {
    switch (result.type) {
      case "two":
        return this.validateTwoParams(result);
      case "one":
        return this.validateOneParams(result);
      case "zero":
        return this.validateZeroParams(result);
      default:
        return error({
          kind: "InvalidParamsType",
          expected: "zero, one, or two",
          received: result.type,
        });
    }
  }

  /**
   * Validate two params structure
   */
  private validateTwoParams(result: ParamsResult): Result<ValidatedParamsType, ParamsTypeError> {
    // Validate required fields
    if (!result.demonstrativeType) {
      return error({
        kind: "MissingRequiredField",
        field: "demonstrativeType",
        source: "TwoParams",
      });
    }

    if (!result.layerType) {
      return error({
        kind: "MissingRequiredField",
        field: "layerType",
        source: "TwoParams",
      });
    }

    // Validate against patterns
    const directiveValidation = this.validateDirectiveType(result.demonstrativeType);
    if (!directiveValidation.ok) {
      return error(directiveValidation.error);
    }

    const layerValidation = this.validateLayerType(result.layerType);
    if (!layerValidation.ok) {
      return error(layerValidation.error);
    }

    // Validate params array
    if (!result.params || result.params.length !== 2) {
      return error({
        kind: "InvalidFieldType",
        field: "params",
        expected: "array of 2 strings",
        received: result.params ? `array of ${result.params.length}` : "undefined",
      });
    }

    return ok({
      type: "two",
      demonstrativeType: result.demonstrativeType,
      layerType: result.layerType,
      params: result.params,
      options: result.options ?? {},
    });
  }

  /**
   * Validate one param structure
   */
  private validateOneParams(result: ParamsResult): Result<ValidatedParamsType, ParamsTypeError> {
    if (!result.params || result.params.length !== 1) {
      return error({
        kind: "MissingRequiredField",
        field: "params",
        source: "OneParams",
      });
    }

    const param = result.params[0];

    // Try to infer directive and layer
    const inferred = this.inferDirectiveAndLayer(param);
    if (!inferred.ok) {
      return error(inferred.error);
    }

    return ok({
      type: "one",
      demonstrativeType: inferred.data.directive,
      layerType: inferred.data.layer,
      params: result.params,
      options: result.options ?? {},
    });
  }

  /**
   * Validate zero params structure
   */
  private validateZeroParams(result: ParamsResult): Result<ValidatedParamsType, ParamsTypeError> {
    // Use defaults for zero params
    const defaults = this.getDefaultDirectiveAndLayer();

    return ok({
      type: "zero",
      demonstrativeType: defaults.directive,
      layerType: defaults.layer,
      params: [],
      options: result.options ?? {},
    });
  }

  /**
   * Validate directive type against pattern
   */
  private validateDirectiveType(value: string): Result<void, ParamsTypeError> {
    const pattern = this.patternProvider.getDirectivePattern();
    if (!pattern) {
      return error({
        kind: "InvalidFieldValue",
        field: "demonstrativeType",
        value,
        pattern: "no pattern available",
      });
    }

    if (!pattern.test(value)) {
      return error({
        kind: "InvalidFieldValue",
        field: "demonstrativeType",
        value,
        pattern: pattern.getPattern(),
      });
    }

    return ok(undefined);
  }

  /**
   * Validate layer type against pattern
   */
  private validateLayerType(value: string): Result<void, ParamsTypeError> {
    const pattern = this.patternProvider.getLayerTypePattern();
    if (!pattern) {
      return error({
        kind: "InvalidFieldValue",
        field: "layerType",
        value,
        pattern: "no pattern available",
      });
    }

    if (!pattern.test(value)) {
      return error({
        kind: "InvalidFieldValue",
        field: "layerType",
        value,
        pattern: pattern.getPattern(),
      });
    }

    return ok(undefined);
  }

  /**
   * Infer directive and layer from a single parameter
   */
  private inferDirectiveAndLayer(
    param: string,
  ): Result<{ directive: string; layer: string }, ParamsTypeError> {
    // Check if param is a known layer type
    const layerPattern = this.patternProvider.getLayerTypePattern();
    if (layerPattern && layerPattern.test(param)) {
      return ok({
        directive: "init", // Default directive for single layer param
        layer: param,
      });
    }

    // Check if param is a known directive type
    const directivePattern = this.patternProvider.getDirectivePattern();
    if (directivePattern && directivePattern.test(param)) {
      return ok({
        directive: param,
        layer: "project", // Default layer for single directive param
      });
    }

    return error({
      kind: "IncompatibleParams",
      reason: `Cannot infer directive and layer from parameter: ${param}`,
    });
  }

  /**
   * Get default directive and layer values
   */
  private getDefaultDirectiveAndLayer(): { directive: string; layer: string } {
    return {
      directive: "init",
      layer: "project",
    };
  }
}
