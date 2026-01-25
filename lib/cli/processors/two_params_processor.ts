/**
 * @fileoverview TwoParamsProcessor for converting TwoParams_Result to VariablesBuilder
 *
 * This module provides a processor that transforms TwoParams_Result from BreakdownParams
 * into VariablesBuilder following the Totality principle. It handles the conversion
 * process with proper error handling and Result type patterns.
 *
 * @module cli/processors/two_params_processor
 */

import { error, ok, type Result } from "$lib/types/result.ts";
import { type FactoryResolvedValues, VariablesBuilder } from "$lib/builder/variables_builder.ts";
import type { TwoParams_Result } from "$lib/deps.ts";
import type { BuilderVariableError } from "$lib/builder/variables_builder.ts";

/**
 * Processor result type following Totality principle
 */
export type ProcessorResult<T> = Result<T, ProcessorError>;

/**
 * Processor-specific error types
 * Following Worker7's Discriminated Union pattern
 */
export type ProcessorError =
  | {
    kind: "InvalidParams";
    message: string;
    params?: unknown;
    context?: Record<string, unknown>;
  }
  | {
    kind: "ConversionFailed";
    message: string;
    cause: BuilderVariableError[];
    context?: Record<string, unknown>;
  }
  | {
    kind: "MissingRequiredField";
    message: string;
    field: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "ValidationFailed";
    message: string;
    validationErrors: string[];
    context?: Record<string, unknown>;
  };

/**
 * Factory for creating ProcessorError instances with proper type safety
 * Following Worker5's successful pattern
 */
export const ProcessorErrorFactory = {
  /**
   * Creates an InvalidParams error
   */
  invalidParams(
    message: string,
    params?: unknown,
    context?: Record<string, unknown>,
  ): Extract<ProcessorError, { kind: "InvalidParams" }> {
    return {
      kind: "InvalidParams",
      message,
      params,
      context,
    };
  },

  /**
   * Creates a ConversionFailed error
   */
  conversionFailed(
    message: string,
    cause: BuilderVariableError[],
    context?: Record<string, unknown>,
  ): Extract<ProcessorError, { kind: "ConversionFailed" }> {
    return {
      kind: "ConversionFailed",
      message,
      cause,
      context,
    };
  },

  /**
   * Creates a MissingRequiredField error
   */
  missingRequiredField(
    message: string,
    field: string,
    context?: Record<string, unknown>,
  ): Extract<ProcessorError, { kind: "MissingRequiredField" }> {
    return {
      kind: "MissingRequiredField",
      message,
      field,
      context,
    };
  },

  /**
   * Creates a ValidationFailed error
   */
  validationFailed(
    message: string,
    validationErrors: string[],
    context?: Record<string, unknown>,
  ): Extract<ProcessorError, { kind: "ValidationFailed" }> {
    return {
      kind: "ValidationFailed",
      message,
      validationErrors,
      context,
    };
  },
};

/**
 * TwoParamsProcessor - Converts TwoParams_Result to VariablesBuilder
 *
 * This processor handles the transformation of parsed command-line parameters
 * into a structured VariablesBuilder instance, following the Totality principle
 * for comprehensive error handling.
 *
 * @example
 * ```typescript
 * const _processor = new TwoParamsProcessor();
 *
 * const twoParamsResult: TwoParams_Result = {
 *   type: "two",
 *   directiveType: "to",
    directiveType: "to",
 *   layerType: "project",
 *   directiveType: "to",
 *   params: ["to", "project"],
 *   options: { output: "result.md" }
 * };
 *
 * const result = processor.process(twoParamsResult);
 * if (result.ok) {
 *   const builder = result.data;
 *   const variables = builder.build();
 * }
 * ```
 */
export class TwoParamsProcessor {
  /**
   * Process TwoParams_Result into VariablesBuilder
   *
   * @param twoParamsResult - The parsed two parameters result from BreakdownParams
   * @returns ProcessorResult containing VariablesBuilder or errors
   */
  process(twoParamsResult: TwoParams_Result): ProcessorResult<VariablesBuilder> {
    // Validate input parameters
    const validationResult = this.validateTwoParamsResult(twoParamsResult);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Convert to FactoryResolvedValues format
    const factoryValuesResult = this.convertToFactoryValues(twoParamsResult);
    if (!factoryValuesResult.ok) {
      return factoryValuesResult;
    }

    // Create VariablesBuilder from factory values
    const builder = VariablesBuilder.fromFactoryValues(factoryValuesResult.data);

    // Add base variables as user variables with required prefix
    builder.addUserVariable("uv-directive_type", twoParamsResult.directiveType);
    builder.addUserVariable("uv-layer_type", twoParamsResult.layerType);

    // Validate the builder state
    const buildResult = builder.build();
    if (!buildResult.ok) {
      return error(ProcessorErrorFactory.conversionFailed(
        "Failed to build variables from TwoParams_Result",
        buildResult.error,
        { operation: "build", paramsType: twoParamsResult.type },
      ));
    }

    return ok(builder);
  }

  /**
   * Validate TwoParams_Result structure
   *
   * @param twoParamsResult - Result to validate
   * @returns Validation result
   */
  private validateTwoParamsResult(twoParamsResult: TwoParams_Result): ProcessorResult<void> {
    // Check if the entire result object is null or undefined
    if (twoParamsResult === null || twoParamsResult === undefined) {
      return error(ProcessorErrorFactory.invalidParams(
        "TwoParams_Result cannot be null or undefined",
      ));
    }

    // Validate type field
    if (!twoParamsResult.type) {
      return error(ProcessorErrorFactory.missingRequiredField(
        "Missing required field: type",
        "type",
      ));
    }

    if (twoParamsResult.type !== "two") {
      return error(ProcessorErrorFactory.invalidParams(
        `Expected type "two", got "${twoParamsResult.type}"`,
      ));
    }

    // Validate directiveType property (empty string is treated as missing)
    if (!twoParamsResult.directiveType || twoParamsResult.directiveType.trim() === "") {
      return error(ProcessorErrorFactory.missingRequiredField(
        "DirectiveType is required and cannot be empty",
        "directiveType",
      ));
    }

    // Validate layerType property (empty string is treated as missing)
    if (!twoParamsResult.layerType || twoParamsResult.layerType.trim() === "") {
      return error(ProcessorErrorFactory.missingRequiredField(
        "LayerType is required and cannot be empty",
        "layerType",
      ));
    }

    // Validate params array
    if (!twoParamsResult.params || !Array.isArray(twoParamsResult.params)) {
      return error(ProcessorErrorFactory.invalidParams(
        "TwoParams_Result must have a params array",
      ));
    }

    // Validate params array length
    if (twoParamsResult.params.length < 2) {
      return error(ProcessorErrorFactory.invalidParams(
        "TwoParams_Result must have at least 2 parameters",
      ));
    }

    // Validate options property
    if (twoParamsResult.options === null || twoParamsResult.options === undefined) {
      return error(ProcessorErrorFactory.missingRequiredField(
        "Options property is required and cannot be null or undefined",
        "options",
      ));
    }

    return ok(undefined);
  }

  /**
   * Convert TwoParams_Result to FactoryResolvedValues
   *
   * @param twoParamsResult - Input parameters
   * @returns Conversion result
   */
  private convertToFactoryValues(
    twoParamsResult: TwoParams_Result,
  ): ProcessorResult<FactoryResolvedValues> {
    // Additional null check for options
    if (twoParamsResult.options === null || twoParamsResult.options === undefined) {
      return error(ProcessorErrorFactory.missingRequiredField(
        "Options property is required for factory value conversion",
        "options",
      ));
    }

    const options = twoParamsResult.options;

    // Extract file paths from options
    const inputFilePath = this.extractInputFilePath(options);
    const outputFilePath = this.extractOutputFilePath(options);
    const schemaFilePath = this.extractSchemaFilePath(options);
    const promptFilePath = this.extractPromptFilePath(options);

    // Extract custom variables (uv- prefixed options)
    const userVariables = this.extractUserVariables(options);

    // Extract input text if available
    const inputText = this.extractInputText(options);

    const factoryValues: FactoryResolvedValues = {
      promptFilePath,
      inputFilePath,
      outputFilePath,
      schemaFilePath,
      userVariables,
      inputText,
    };

    return ok(factoryValues);
  }

  /**
   * Extract input file path from options
   */
  private extractInputFilePath(options: Record<string, unknown>): string {
    if (!options) {
      return "stdin";
    }

    return (options.fromFile as string) ||
      (options.from as string) ||
      (options.edition as string) ||
      "stdin";
  }

  /**
   * Extract output file path from options
   */
  private extractOutputFilePath(options: Record<string, unknown>): string {
    if (!options) {
      return "stdout";
    }

    return (options.destinationFile as string) ||
      (options.destination as string) ||
      (options.output as string) ||
      "stdout";
  }

  /**
   * Extract schema file path from options
   */
  private extractSchemaFilePath(options: Record<string, unknown>): string {
    if (!options) {
      return "";
    }

    return (options.schemaFile as string) ||
      (options.schema as string) ||
      "";
  }

  /**
   * Extract prompt file path from options
   */
  private extractPromptFilePath(options: Record<string, unknown>): string {
    if (!options) {
      return "";
    }

    return (options.promptFile as string) ||
      (options.prompt as string) ||
      (options.template as string) ||
      "";
  }

  /**
   * Extract custom variables with uv- prefix
   */
  private extractUserVariables(options: Record<string, unknown>): Record<string, string> {
    if (!options) {
      return {};
    }

    const userVariables: Record<string, string> = {};

    for (const [key, value] of Object.entries(options)) {
      if (key.startsWith("uv-")) {
        // Keep the "uv-" prefix as required by VariablesBuilder
        // Convert values to string more intelligently
        if (typeof value === "object" && value !== null) {
          try {
            userVariables[key] = JSON.stringify(value);
          } catch {
            userVariables[key] = String(value);
          }
        } else {
          userVariables[key] = String(value);
        }
      }
    }

    return userVariables;
  }

  /**
   * Extract input text from options
   */
  private extractInputText(options: Record<string, unknown>): string | undefined {
    if (!options) {
      return undefined;
    }

    const inputText = options.input_text as string;
    return inputText && inputText.trim() !== "" ? inputText : undefined;
  }

  /**
   * Create processor with validation-only mode
   *
   * This method validates the TwoParams_Result without creating a VariablesBuilder,
   * useful for pre-validation scenarios.
   *
   * @param twoParamsResult - Parameters to validate
   * @returns Validation result
   */
  validateOnly(twoParamsResult: TwoParams_Result): ProcessorResult<void> {
    const validationResult = this.validateTwoParamsResult(twoParamsResult);
    if (!validationResult.ok) {
      return validationResult;
    }

    const factoryValuesResult = this.convertToFactoryValues(twoParamsResult);
    if (!factoryValuesResult.ok) {
      return factoryValuesResult;
    }

    // Create temporary builder for validation
    const builder = new VariablesBuilder();
    const validateResult = builder.validateFactoryValues(factoryValuesResult.data);

    if (!validateResult.ok) {
      return error({
        kind: "ConversionFailed",
        message:
          `Factory values validation failed: ${validateResult.error.length} errors encountered`,
        cause: validateResult.error,
      });
    }

    return ok(undefined);
  }

  /**
   * Get processor information for debugging
   *
   * @returns Processor metadata
   */
  getProcessorInfo(): {
    name: string;
    version: string;
    supportedInputType: string;
    outputType: string;
  } {
    return {
      name: "TwoParamsProcessor",
      version: "1.0.0",
      supportedInputType: "TwoParams_Result",
      outputType: "VariablesBuilder",
    };
  }
}
