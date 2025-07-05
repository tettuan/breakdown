/**
 * @fileoverview Parameter Validator V2 - Refactored with SRP
 *
 * This module orchestrates parameter validation using specialized validators,
 * following the Single Responsibility Principle.
 *
 * @module lib/validator/parameter_validator_v2
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import { DirectiveType } from "../types/directive_type.ts";
import { LayerType } from "../types/layer_type.ts";
import type { OneParamsResult, TwoParams_Result, ZeroParamsResult } from "../deps.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";
import { PathValidator } from "./path_validator.ts";
import { OptionsNormalizer } from "./options_normalizer.ts";
import { ParamsTypeValidator } from "./params_type_validator.ts";
import { CustomVariableExtractor } from "../processor/custom_variable_extractor.ts";

/**
 * Validated parameters after comprehensive validation
 */
export type ValidatedParams = {
  directive: DirectiveType;
  layer: LayerType;
  options: ValidatedOptions;
  customVariables: Record<string, string>;
  metadata: ValidationMetadata;
};

/**
 * Validated options with normalized paths
 */
export type ValidatedOptions = {
  inputPath: string;
  outputPath: string;
  schemaPath?: string;
  promptPath?: string;
  stdin?: string;
};

/**
 * Validation metadata for traceability
 */
export type ValidationMetadata = {
  validatedAt: Date;
  source: "TwoParams" | "OneParams" | "ZeroParams";
  profileName?: string;
};

/**
 * Validation error types
 */
export type ValidationError =
  | { kind: "ParamsTypeError"; error: unknown }
  | { kind: "PathValidationError"; error: unknown }
  | { kind: "OptionsNormalizationError"; error: unknown }
  | { kind: "CustomVariableError"; error: unknown }
  | { kind: "TypeCreationError"; type: "directive" | "layer"; value: string };

/**
 * Configuration validator interface
 */
export interface ConfigValidator {
  validateConfig(config: unknown): Result<void, string[]>;
}

/**
 * Parameter Validator V2 - Orchestrates parameter validation
 *
 * Uses specialized validators for different aspects:
 * - ParamsTypeValidator: Validates parameter type and structure
 * - PathValidator: Validates file system paths
 * - OptionsNormalizer: Normalizes option formats
 * - CustomVariableExtractor: Extracts custom variables
 */
export class ParameterValidatorV2 {
  private readonly paramsValidator: ParamsTypeValidator;
  private readonly pathValidator: PathValidator;
  private readonly optionsNormalizer: OptionsNormalizer;
  private readonly customVariableExtractor: CustomVariableExtractor;

  constructor(
    private readonly patternProvider: TypePatternProvider,
    private readonly configValidator: ConfigValidator,
  ) {
    this.paramsValidator = new ParamsTypeValidator(patternProvider);
    this.pathValidator = new PathValidator();
    this.optionsNormalizer = new OptionsNormalizer();
    this.customVariableExtractor = new CustomVariableExtractor();
  }

  /**
   * Validate TwoParams_Result
   */
  validateTwoParams(result: TwoParams_Result): Result<ValidatedParams, ValidationError> {
    return this.validateParams({
      type: result.type,
      demonstrativeType: result.demonstrativeType,
      layerType: result.layerType,
      params: result.params,
      options: result.options,
    }, "TwoParams");
  }

  /**
   * Validate OneParamsResult
   */
  validateOneParams(result: OneParamsResult): Result<ValidatedParams, ValidationError> {
    return this.validateParams({
      type: result.type,
      params: result.params,
      options: result.options,
    }, "OneParams");
  }

  /**
   * Validate ZeroParamsResult
   */
  validateZeroParams(result: ZeroParamsResult): Result<ValidatedParams, ValidationError> {
    return this.validateParams({
      type: result.type,
      options: result.options,
    }, "ZeroParams");
  }

  /**
   * Common validation logic
   */
  private validateParams(
    result: {
      type: string;
      params?: string[];
      options?: Record<string, unknown>;
      demonstrativeType?: string;
      layerType?: string;
    },
    source: "TwoParams" | "OneParams" | "ZeroParams",
  ): Result<ValidatedParams, ValidationError> {
    // 1. Validate params type and structure
    const typeValidation = this.paramsValidator.validate(result);
    if (!typeValidation.ok) {
      return error({
        kind: "ParamsTypeError",
        error: typeValidation.error,
      });
    }

    // 2. Normalize options
    const options = result.options || {};
    const normalizedOptions = this.optionsNormalizer.normalize(options);
    if (!normalizedOptions.ok) {
      return error({
        kind: "OptionsNormalizationError",
        error: normalizedOptions.error,
      });
    }

    // 3. Validate paths
    const inputPathValidation = this.pathValidator.validate(
      normalizedOptions.data.inputPath,
      "input",
    );
    if (!inputPathValidation.ok) {
      return error({
        kind: "PathValidationError",
        error: inputPathValidation.error,
      });
    }

    const outputPathValidation = this.pathValidator.validate(
      normalizedOptions.data.outputPath,
      "output",
    );
    if (!outputPathValidation.ok) {
      return error({
        kind: "PathValidationError",
        error: outputPathValidation.error,
      });
    }

    // 4. Extract custom variables
    const customVarsResult = this.customVariableExtractor.extract(options);
    if (!customVarsResult.ok) {
      return error({
        kind: "CustomVariableError",
        error: customVarsResult.error,
      });
    }

    // 5. Create validated types
    const twoParamsResult: TwoParams_Result = {
      type: "two",
      demonstrativeType: typeValidation.data.demonstrativeType,
      layerType: typeValidation.data.layerType,
      params: typeValidation.data.params,
      options: typeValidation.data.options,
    };

    const directive = DirectiveType.create(twoParamsResult);
    const layer = LayerType.create(twoParamsResult);

    // 6. Create validated options
    const validatedOptions: ValidatedOptions = {
      inputPath: normalizedOptions.data.inputPath,
      outputPath: normalizedOptions.data.outputPath,
      schemaPath: normalizedOptions.data.schemaPath,
      promptPath: normalizedOptions.data.promptPath,
      stdin: normalizedOptions.data.stdin,
    };

    // 7. Create metadata
    const metadata: ValidationMetadata = {
      validatedAt: new Date(),
      source,
      profileName: normalizedOptions.data.profile,
    };

    return ok({
      directive,
      layer,
      options: validatedOptions,
      customVariables: customVarsResult.data,
      metadata,
    });
  }
}
