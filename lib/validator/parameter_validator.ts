/**
 * @fileoverview Parameter Validator - Orchestrates parameter validation with SRP
 *
 * This module orchestrates parameter validation using specialized validators,
 * following the Single Responsibility Principle and Domain-Driven Design.
 *
 * @module lib/validator/parameter_validator
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import { DirectiveType } from "../domain/core/value_objects/directive_type.ts";
import { LayerType } from "../domain/core/value_objects/layer_type.ts";
import type { OneParamsResult, TwoParams_Result, ZeroParamsResult } from "../deps.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";
import { PathValidator } from "./path_validator.ts";
import { OptionsNormalizer } from "./options_normalizer.ts";
import { ParamsTypeValidator } from "./params_type_validator.ts";
import { CustomVariableExtractor } from "../processor/custom_variable_extractor.ts";
// ConfigProfile removed for BreakdownParams integration

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
  source:
    | "TwoParams"
    | "OneParams"
    | "ZeroParams"
    | "TwoParams_Result"
    | "OneParamsResult"
    | "ZeroParamsResult";
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
  | { kind: "TypeCreationError"; type: "directive" | "layer"; value: string }
  | { kind: "ConfigValidationFailed"; errors: string[]; context?: Record<string, unknown> }
  | {
    kind: "InvalidDirectiveType";
    value: string;
    validPattern: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "InvalidLayerType";
    value: string;
    validPattern: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "InvalidParamsType";
    expected: string;
    received: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "PathValidationFailed";
    path: string;
    reason: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "CustomVariableInvalid";
    key: string;
    reason: string;
    context?: Record<string, unknown>;
  };

/**
 * Configuration validator interface
 */
export interface ConfigValidator {
  validateConfig(config: unknown): Result<void, string[]>;
}

/**
 * Parameter Validator - Orchestrates parameter validation
 *
 * Uses specialized validators for different aspects:
 * - ParamsTypeValidator: Validates parameter type and structure
 * - PathValidator: Validates file system paths
 * - OptionsNormalizer: Normalizes option formats
 * - CustomVariableExtractor: Extracts custom variables
 */
export class ParameterValidator {
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
  async validateTwoParams(result: TwoParams_Result): Promise<Result<ValidatedParams, ValidationError>> {
    return await this.validateParams({
      type: result.type,
      directiveType: result.directiveType,
      layerType: result.layerType,
      params: result.params,
      options: result.options,
    }, "TwoParams_Result");
  }

  /**
   * Validate OneParamsResult
   */
  async validateOneParams(result: OneParamsResult): Promise<Result<ValidatedParams, ValidationError>> {
    return await this.validateParams({
      type: result.type,
      params: result.params,
      options: result.options,
    }, "OneParamsResult");
  }

  /**
   * Validate ZeroParamsResult
   */
  async validateZeroParams(result: ZeroParamsResult): Promise<Result<ValidatedParams, ValidationError>> {
    return await this.validateParams({
      type: result.type,
      options: result.options,
    }, "ZeroParamsResult");
  }

  /**
   * Common validation logic
   */
  private async validateParams(
    result: {
      type: string;
      params?: string[];
      options?: Record<string, unknown>;
      directiveType?: string;
      layerType?: string;
    },
    source: "TwoParams_Result" | "OneParamsResult" | "ZeroParamsResult",
  ): Promise<Result<ValidatedParams, ValidationError>> {
    // 1. Validate params type and structure
    const typeValidation = await this.paramsValidator.validate(result);
    if (!typeValidation.ok) {
      // Map specific ParamsTypeError to ValidationError
      const paramsError = typeValidation.error;

      if (paramsError.kind === "InvalidParamsType") {
        // Map expected type based on source
        let expected: string;
        switch (source) {
          case "TwoParams_Result":
            expected = "two";
            break;
          case "OneParamsResult":
            expected = "one";
            break;
          case "ZeroParamsResult":
            expected = "zero";
            break;
          default:
            expected = paramsError.expected;
        }

        return error({
          kind: "InvalidParamsType",
          expected,
          received: paramsError.received,
          context: undefined,
        });
      }

      if (paramsError.kind === "InvalidFieldValue") {
        if (paramsError.field === "directiveType") {
          return error({
            kind: "InvalidDirectiveType",
            value: String(paramsError.value),
            validPattern: paramsError.pattern === "no pattern available"
              ? "undefined"
              : paramsError.pattern,
            context: undefined,
          });
        }
        if (paramsError.field === "layerType") {
          return error({
            kind: "InvalidLayerType",
            value: String(paramsError.value),
            validPattern: paramsError.pattern === "no pattern available"
              ? "undefined"
              : paramsError.pattern,
            context: undefined,
          });
        }
      }

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
      // Map specific CustomVariableError to ValidationError
      const customError = customVarsResult.error;

      if (customError.kind === "InvalidVariableValue") {
        return error({
          kind: "CustomVariableInvalid",
          key: customError.key,
          reason: customError.reason,
          context: undefined,
        });
      }

      return error({
        kind: "CustomVariableError",
        error: customVarsResult.error,
      });
    }

    // 5. Create validated types with DDD approach
    // Note: This section is only used for type validation, not for creating the actual result

    // Use DDD DirectiveType with Smart Constructor pattern
    const directiveResult = DirectiveType.create(
      typeValidation.data.directiveType
    );
    if (!directiveResult.ok) {
      return error({
        kind: "TypeCreationError",
        type: "directive",
        value: typeValidation.data.directiveType,
      });
    }

    // Use DDD LayerType with Smart Constructor pattern
    const layerResult = LayerType.create(
      typeValidation.data.layerType,
    );
    if (!layerResult.ok) {
      return error({
        kind: "TypeCreationError",
        type: "layer",
        value: typeValidation.data.layerType,
      });
    }

    const directive = directiveResult.data;
    const layer = layerResult.data;

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

  /**
   * Get profile name string with fallback to default
   */
  private getConfigProfile(profileName?: string): string {
    if (!profileName) {
      return "default"; // Default profile name
    }

    return profileName; // Return profile name as string
  }
}
