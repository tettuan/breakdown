/**
 * @fileoverview TwoParamsProcessor for converting TwoParams_Result to VariablesBuilder
 *
 * This module provides a processor that transforms TwoParams_Result from BreakdownParams
 * into VariablesBuilder following the Totality principle. It handles the conversion
 * process with proper error handling and Result type patterns.
 *
 * @module cli/processors/two_params_processor
 */

import { error, ok, Result } from "$lib/types/result.ts";
import { type FactoryResolvedValues, VariablesBuilder } from "$lib/builder/variables_builder.ts";
import type { TwoParams_Result } from "$lib/deps.ts";
import type { BuilderVariableError } from "$lib/builder/variables_builder.ts";

/**
 * Processor result type following Totality principle
 */
export type ProcessorResult<T> = Result<T, ProcessorError>;

/**
 * Processor-specific error types
 */
export type ProcessorError =
  | { kind: "InvalidParams"; message: string }
  | { kind: "ConversionFailed"; cause: BuilderVariableError[] }
  | { kind: "MissingRequiredField"; field: string };

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
 *   layerType: "project",
 *   demonstrativeType: "to",
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

    // Add base variables as standard variables (not user variables)
    builder.addStandardVariable("demonstrative_type", twoParamsResult.directiveType);
    builder.addStandardVariable("layer_type", twoParamsResult.layerType);

    // Validate the builder state
    const buildResult = builder.build();
    if (!buildResult.ok) {
      return error({
        kind: "ConversionFailed",
        cause: buildResult.error,
      });
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
      return error({
        kind: "InvalidParams",
        message: "TwoParams_Result cannot be null or undefined",
      });
    }

    // Validate type field
    if (!twoParamsResult.type) {
      return error({
        kind: "MissingRequiredField",
        field: "type",
      });
    }

    if (twoParamsResult.type !== "two") {
      return error({
        kind: "InvalidParams",
        message: `Expected type "two", got "${twoParamsResult.type}"`,
      });
    }

    // Validate directiveType property (empty string is treated as missing)
    if (!twoParamsResult.directiveType || twoParamsResult.directiveType.trim() === "") {
      return error({
        kind: "MissingRequiredField",
        field: "directiveType",
      });
    }

    // Validate layerType property (empty string is treated as missing)
    if (!twoParamsResult.layerType || twoParamsResult.layerType.trim() === "") {
      return error({
        kind: "MissingRequiredField",
        field: "layerType",
      });
    }

    // Validate params array
    if (!twoParamsResult.params || !Array.isArray(twoParamsResult.params)) {
      return error({
        kind: "InvalidParams",
        message: "TwoParams_Result must have a params array",
      });
    }

    // Validate params array length
    if (twoParamsResult.params.length < 2) {
      return error({
        kind: "InvalidParams",
        message: "TwoParams_Result must have at least 2 parameters",
      });
    }

    // Validate options property
    if (twoParamsResult.options === null || twoParamsResult.options === undefined) {
      return error({
        kind: "MissingRequiredField",
        field: "options",
      });
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
      return error({
        kind: "MissingRequiredField",
        field: "options",
      });
    }

    const options = twoParamsResult.options;

    // Extract file paths from options
    const inputFilePath = this.extractInputFilePath(options);
    const outputFilePath = this.extractOutputFilePath(options);
    const schemaFilePath = this.extractSchemaFilePath(options);
    const promptFilePath = this.extractPromptFilePath(options);

    // Extract custom variables (uv- prefixed options)
    const customVariables = this.extractCustomVariables(options);

    // Extract input text if available
    const inputText = this.extractInputText(options);

    const factoryValues: FactoryResolvedValues = {
      promptFilePath,
      inputFilePath,
      outputFilePath,
      schemaFilePath,
      customVariables,
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
      (options.input as string) ||
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
  private extractCustomVariables(options: Record<string, unknown>): Record<string, string> {
    if (!options) {
      return {};
    }

    const customVariables: Record<string, string> = {};

    for (const [key, value] of Object.entries(options)) {
      if (key.startsWith("uv-")) {
        // Keep the "uv-" prefix as required by VariablesBuilder
        customVariables[key] = String(value);
      }
    }

    return customVariables;
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
