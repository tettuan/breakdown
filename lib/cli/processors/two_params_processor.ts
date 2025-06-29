/**
 * @fileoverview TwoParamsProcessor for converting TwoParamsResult to VariablesBuilder
 * 
 * This module provides a processor that transforms TwoParamsResult from BreakdownParams
 * into VariablesBuilder following the Totality principle. It handles the conversion
 * process with proper error handling and Result type patterns.
 * 
 * @module cli/processors/two_params_processor
 */

import { Result, ok, error } from "../../types/result.ts";
import { VariablesBuilder, type FactoryResolvedValues } from "../../builder/variables_builder.ts";
import type { TwoParamsResult } from "../../deps.ts";
import type { BuilderVariableError } from "../../builder/variables_builder.ts";

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
 * TwoParamsProcessor - Converts TwoParamsResult to VariablesBuilder
 * 
 * This processor handles the transformation of parsed command-line parameters
 * into a structured VariablesBuilder instance, following the Totality principle
 * for comprehensive error handling.
 * 
 * @example
 * ```typescript
 * const processor = new TwoParamsProcessor();
 * 
 * const twoParamsResult: TwoParamsResult = {
 *   type: "two",
 *   demonstrativeType: "to",
 *   layerType: "project",
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
   * Process TwoParamsResult into VariablesBuilder
   * 
   * @param twoParamsResult - The parsed two parameters result from BreakdownParams
   * @returns ProcessorResult containing VariablesBuilder or errors
   */
  process(twoParamsResult: TwoParamsResult): ProcessorResult<VariablesBuilder> {
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
    
    // Validate the builder state
    const buildResult = builder.build();
    if (!buildResult.ok) {
      return error({
        kind: "ConversionFailed",
        cause: buildResult.error
      });
    }

    return ok(builder);
  }

  /**
   * Validate TwoParamsResult structure
   * 
   * @param twoParamsResult - Result to validate
   * @returns Validation result
   */
  private validateTwoParamsResult(twoParamsResult: TwoParamsResult): ProcessorResult<void> {
    if (twoParamsResult.type !== "two") {
      return error({
        kind: "InvalidParams",
        message: `Expected type "two", got "${twoParamsResult.type}"`
      });
    }

    if (!twoParamsResult.demonstrativeType) {
      return error({
        kind: "MissingRequiredField",
        field: "demonstrativeType"
      });
    }

    if (!twoParamsResult.layerType) {
      return error({
        kind: "MissingRequiredField",
        field: "layerType"
      });
    }

    if (!twoParamsResult.params || twoParamsResult.params.length < 2) {
      return error({
        kind: "InvalidParams",
        message: "TwoParamsResult must have at least 2 parameters"
      });
    }

    return ok(undefined);
  }

  /**
   * Convert TwoParamsResult to FactoryResolvedValues
   * 
   * @param twoParamsResult - Input parameters
   * @returns Conversion result
   */
  private convertToFactoryValues(twoParamsResult: TwoParamsResult): ProcessorResult<FactoryResolvedValues> {
    const options = twoParamsResult.options || {};
    
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
    return (options.fromFile as string) || 
           (options.from as string) || 
           (options.input as string) || 
           "stdin";
  }

  /**
   * Extract output file path from options
   */
  private extractOutputFilePath(options: Record<string, unknown>): string {
    return (options.destinationFile as string) || 
           (options.destination as string) || 
           (options.output as string) || 
           "stdout";
  }

  /**
   * Extract schema file path from options
   */
  private extractSchemaFilePath(options: Record<string, unknown>): string {
    return (options.schemaFile as string) || 
           (options.schema as string) || 
           "";
  }

  /**
   * Extract prompt file path from options
   */
  private extractPromptFilePath(options: Record<string, unknown>): string {
    return (options.promptFile as string) || 
           (options.prompt as string) || 
           (options.template as string) || 
           "";
  }

  /**
   * Extract custom variables with uv- prefix
   */
  private extractCustomVariables(options: Record<string, unknown>): Record<string, string> {
    const customVariables: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(options)) {
      if (key.startsWith("uv-")) {
        customVariables[key] = String(value);
      }
    }

    return customVariables;
  }

  /**
   * Extract input text from options
   */
  private extractInputText(options: Record<string, unknown>): string | undefined {
    const inputText = options.input_text as string;
    return inputText && inputText.trim() !== "" ? inputText : undefined;
  }

  /**
   * Create processor with validation-only mode
   * 
   * This method validates the TwoParamsResult without creating a VariablesBuilder,
   * useful for pre-validation scenarios.
   * 
   * @param twoParamsResult - Parameters to validate
   * @returns Validation result
   */
  validateOnly(twoParamsResult: TwoParamsResult): ProcessorResult<void> {
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
        cause: validateResult.error
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
      supportedInputType: "TwoParamsResult",
      outputType: "VariablesBuilder"
    };
  }
}