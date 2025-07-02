/**
 * @fileoverview ParameterValidator for validating parsed parameters
 *
 * This module provides comprehensive parameter validation following the Totality principle.
 * It validates parameters from BreakdownParams (TwoParamsResult, OneParamsResult, ZeroParamsResult)
 * and produces ValidatedParams with full type safety and Result-based error handling.
 *
 * @module validator/parameter_validator
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import { DirectiveType } from "../types/directive_type.ts";
import { LayerType } from "../types/layer_type.ts";
import type { OneParamsResult, TwoParamsResult, ZeroParamsResult } from "../deps.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";

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
  source: "TwoParamsResult" | "OneParamsResult" | "ZeroParamsResult";
  profileName?: string;
};

/**
 * Validation error types following discriminated union pattern
 */
export type ValidationError =
  | { kind: "InvalidParamsType"; expected: string; received: string }
  | { kind: "MissingRequiredField"; field: string; source: string }
  | { kind: "InvalidDirectiveType"; value: string; validPattern: string }
  | { kind: "InvalidLayerType"; value: string; validPattern: string }
  | { kind: "PathValidationFailed"; path: string; reason: string }
  | { kind: "CustomVariableInvalid"; key: string; reason: string }
  | { kind: "ConfigValidationFailed"; errors: string[] }
  | { kind: "UnsupportedParamsType"; type: string };

/**
 * Configuration validator interface (to be injected)
 */
export interface ConfigValidator {
  validateConfig(config: unknown): Result<void, string[]>;
}

/**
 * ParameterValidator - Comprehensive parameter validation
 *
 * Validates parsed parameters from BreakdownParams and produces
 * ValidatedParams with full type safety and error handling.
 *
 * @example
 * ```typescript
 * const _validator = new ParameterValidator(patternProvider, configValidator);
 *
 * const result = validator.validateTwoParams(twoParamsResult);
 * if (result.ok) {
 *   const { directive, layer, options } = result.data;
 *   // Use validated parameters
 * }
 * ```
 */
export class ParameterValidator {
  constructor(
    private readonly patternProvider: TypePatternProvider,
    private readonly configValidator: ConfigValidator,
  ) {}

  /**
   * Validate TwoParamsResult
   *
   * @param result - Parsed two parameters result
   * @returns Result containing ValidatedParams or ValidationError
   */
  validateTwoParams(result: TwoParamsResult): Result<ValidatedParams, ValidationError> {
    // Verify correct params type
    if (_result.type !== "two") {
      return error({
        kind: "InvalidParamsType",
        expected: "two",
        received: result.type,
      });
    }

    // Validate required fields
    if (!result.demonstrativeType) {
      return error({
        kind: "MissingRequiredField",
        field: "demonstrativeType",
        source: "TwoParamsResult",
      });
    }

    if (!result.layerType) {
      return error({
        kind: "MissingRequiredField",
        field: "layerType",
        source: "TwoParamsResult",
      });
    }

    // Validate directive type against pattern
    const directivePattern = this.patternProvider.getDirectivePattern();
    if (!directivePattern || !directivePattern.test(result.demonstrativeType)) {
      return error({
        kind: "InvalidDirectiveType",
        value: result.demonstrativeType,
        validPattern: directivePattern ? directivePattern.getPattern() : "undefined",
      });
    }

    // Validate layer type against pattern
    const layerPattern = this.patternProvider.getLayerTypePattern();
    if (!layerPattern || !layerPattern.test(result.layerType)) {
      return error({
        kind: "InvalidLayerType",
        value: result.layerType,
        validPattern: layerPattern ? layerPattern.getPattern() : "undefined",
      });
    }

    // Create validated types
    const directive = DirectiveType.create(result);
    const layer = LayerType.create(result);

    // Extract and validate options
    const optionsResult = this.extractValidatedOptions(result.options || {});
    if (!optionsResult.ok) {
      return error(optionsResult.error);
    }

    // Extract and validate custom variables
    const customVariablesResult = this.extractCustomVariables(result.options || {});
    if (!customVariablesResult.ok) {
      return error(customVariablesResult.error);
    }

    // Create metadata
    const metadata: ValidationMetadata = {
      validatedAt: new Date(),
      source: "TwoParamsResult",
      profileName: this.extractProfileName(result.options),
    };

    return ok({
      directive,
      layer,
      options: optionsResult.data,
      customVariables: customVariablesResult.data,
      metadata,
    });
  }

  /**
   * Validate OneParamsResult
   *
   * @param result - Parsed one parameter result
   * @returns Result containing ValidatedParams or ValidationError
   */
  validateOneParams(result: OneParamsResult): Result<ValidatedParams, ValidationError> {
    // Verify correct params type
    if (_result.type !== "one") {
      return error({
        kind: "InvalidParamsType",
        expected: "one",
        received: result.type,
      });
    }

    // For one param, we need to determine directive/layer from context
    // This is a simplified implementation - actual logic would be more complex
    if (!result.params || result.params.length !== 1) {
      return error({
        kind: "MissingRequiredField",
        field: "params",
        source: "OneParamsResult",
      });
    }

    // Create default directive and layer for one param case
    // In real implementation, this would involve more complex logic
    const defaultTwoParams: TwoParamsResult = {
      type: "two",
      demonstrativeType: "init", // Default directive for one param
      layerType: result.params[0], // Use the single param as layer
      params: ["init", result.params[0]],
      options: result.options,
    };

    // Validate as two params with defaults, but preserve original source
    const validationResult = this.validateTwoParams(defaultTwoParams);
    if (validationResult.ok) {
      // Update metadata to reflect original source
      validationResult.data.metadata = {
        ...validationResult.data.metadata,
        source: "OneParamsResult",
      };
    }
    return validationResult;
  }

  /**
   * Validate ZeroParamsResult
   *
   * @param result - Parsed zero parameters result
   * @returns Result containing ValidatedParams or ValidationError
   */
  validateZeroParams(result: ZeroParamsResult): Result<ValidatedParams, ValidationError> {
    // Verify correct params type
    if (_result.type !== "zero") {
      return error({
        kind: "InvalidParamsType",
        expected: "zero",
        received: result.type,
      });
    }

    // For zero params, use complete defaults
    const defaultTwoParams: TwoParamsResult = {
      type: "two",
      demonstrativeType: "init", // Default directive
      layerType: "project", // Default layer
      params: ["init", "project"],
      options: result.options,
    };

    // Validate as two params with defaults, but preserve original source
    const validationResult = this.validateTwoParams(defaultTwoParams);
    if (validationResult.ok) {
      // Update metadata to reflect original source
      validationResult.data.metadata = {
        ...validationResult.data.metadata,
        source: "ZeroParamsResult",
      };
    }
    return validationResult;
  }

  /**
   * Extract and validate options
   */
  private extractValidatedOptions(
    options: Record<string, unknown>,
  ): Result<ValidatedOptions, ValidationError> {
    const inputPath = this.normalizeInputPath(options);
    const outputPath = this.normalizeOutputPath(options);

    // Validate paths if needed
    const inputValidation = this.validatePath(inputPath, "input");
    if (!inputValidation.ok) {
      return error(inputValidation.error);
    }

    const outputValidation = this.validatePath(outputPath, "output");
    if (!outputValidation.ok) {
      return error(outputValidation.error);
    }

    const validatedOptions: ValidatedOptions = {
      inputPath,
      outputPath,
      schemaPath: this.extractOptionalPath(options, ["schemaFile", "schema"]),
      promptPath: this.extractOptionalPath(options, ["promptFile", "prompt", "template"]),
      stdin: this.extractStdin(options),
    };

    return ok(validatedOptions);
  }

  /**
   * Extract custom variables with uv- prefix
   */
  private extractCustomVariables(
    options: Record<string, unknown>,
  ): Result<Record<string, string>, ValidationError> {
    const customVariables: Record<string, string> = {};

    for (const [key, value] of Object.entries(options)) {
      if (key.startsWith("uv-")) {
        // Validate custom variable
        if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
          return error({
            kind: "CustomVariableInvalid",
            key,
            reason: "Value must be string, number, or boolean",
          });
        }
        customVariables[key] = String(value);
      }
    }

    return ok(customVariables);
  }

  /**
   * Normalize input path from various option keys
   */
  private normalizeInputPath(options: Record<string, unknown>): string {
    const value = options.fromFile || options.from || options.input;
    return value ? String(value) : "stdin";
  }

  /**
   * Normalize output path from various option keys
   */
  private normalizeOutputPath(options: Record<string, unknown>): string {
    const value = options.destinationFile || options.destination || options.output;
    return value ? String(value) : "stdout";
  }

  /**
   * Extract optional path from multiple possible keys
   */
  private extractOptionalPath(
    options: Record<string, unknown>,
    keys: string[],
  ): string | undefined {
    for (const key of keys) {
      const value = options[key];
      if (value && typeof value === "string") {
        return value;
      }
    }
    return undefined;
  }

  /**
   * Extract stdin content if available
   */
  private extractStdin(options: Record<string, unknown>): string | undefined {
    const stdin = options.input_text || options.stdin;
    return stdin && typeof stdin === "string" ? stdin : undefined;
  }

  /**
   * Extract profile name from options
   */
  private extractProfileName(options?: Record<string, unknown>): string | undefined {
    if (!options) return undefined;
    const profile = options.profile || options.configProfile;
    return profile && typeof profile === "string" ? profile : undefined;
  }

  /**
   * Validate path format and accessibility
   */
  private validatePath(path: string, type: "input" | "output"): Result<void, ValidationError> {
    // Basic validation - in real implementation would check file system
    if (path === "stdin" || path === "stdout") {
      return ok(undefined);
    }

    // Check for invalid characters
    if (path.includes("\0")) {
      return error({
        kind: "PathValidationFailed",
        path,
        reason: "Path contains null character",
      });
    }

    // Check for empty path
    if (path.trim() === "") {
      return error({
        kind: "PathValidationFailed",
        path,
        reason: `${type} path cannot be empty`,
      });
    }

    return ok(undefined);
  }
}
