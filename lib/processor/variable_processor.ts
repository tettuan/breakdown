/**
 * @fileoverview Two Params Variable Processor
 *
 * This module provides enhanced variable processing for two-parameter commands,
 * extracting and managing custom variables, standard variables, and STDIN data
 * using the Result type pattern for error handling.
 *
 * Key features:
 * - Extracts custom variables from CLI options (uv- prefixed)
 * - Manages standard variables (input_text, input_text_file, destination_path)
 * - Integrates with VariablesBuilder for consistent variable management
 * - Full Result type error handling
 *
 * @module lib/processor/variable_processor
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import { type FactoryResolvedValues, VariablesBuilder } from "../builder/variables_builder.ts";
import { StdinVariableFactory } from "../factory/stdin_variable_factory.ts";
import type { PromptVariable } from "../types/prompt_variables.ts";
import { CustomVariableExtractor } from "./custom_variable_extractor.ts";
import { StandardVariableResolver } from "./standard_variable_resolver.ts";

/**
 * Error types for Variable Processor
 */
export type VariableProcessorError =
  | { kind: "InvalidOption"; key: string; value: unknown; reason: string }
  | { kind: "StdinVariableError"; error: string }
  | { kind: "BuilderError"; errors: Array<{ kind: string; [key: string]: unknown }> }
  | { kind: "ValidationError"; errors: string[] };

/**
 * Options structure for variable processing
 */
export interface ProcessorOptions {
  /** Raw CLI options */
  options: Record<string, unknown>;
  /** STDIN content if available */
  stdinContent?: string;
  /** Input file path */
  inputFile?: string;
  /** Output file path */
  outputFile?: string;
  /** Schema file path */
  schemaFile?: string;
  /** Prompt file path */
  promptFile?: string;
}

/**
 * Result of variable processing
 */
export interface ProcessorResult {
  /** All processed variables as a record */
  variables: Record<string, string>;
  /** Custom variables (uv- prefixed) */
  customVariables: Record<string, string>;
  /** Standard variables */
  standardVariables: {
    input_text?: string;
    input_text_file: string;
    destination_path: string;
  };
  /** Builder instance for further manipulation */
  builder: VariablesBuilder;
}

/**
 * Two Params Variable Processor class
 *
 * @example Basic usage
 * ```typescript
 * const _processor = new TwoParamsVariableProcessor();
 * const result = await processor.process({
 *   options: {
 *     "uv-project": "my-project",
 *     "uv-version": "1.0.0",
 *     fromFile: "input.txt",
 *     output: "output.md"
 *   },
 *   stdinContent: "Hello, world!"
 * });
 *
 * if (result.ok) {
 *   console.log(result.data.variables);
 *   // { "uv-project": "my-project", "uv-version": "1.0.0", ... }
 * }
 * ```
 */
export class TwoParamsVariableProcessor {
  #stdinFactory: StdinVariableFactory;
  #customExtractor: CustomVariableExtractor;
  #standardResolver: StandardVariableResolver;

  constructor() {
    this.#stdinFactory = new StdinVariableFactory();
    this.#customExtractor = new CustomVariableExtractor();
    this.#standardResolver = new StandardVariableResolver();
  }

  /**
   * Process variables from options and content
   */
  process(params: ProcessorOptions): Result<ProcessorResult, VariableProcessorError> {
    // 1. Extract custom variables using dedicated extractor
    const customVarsResult = this.#customExtractor.extract(params.options);
    if (!customVarsResult.ok) {
      return error({
        kind: "InvalidOption",
        key: customVarsResult.error.key,
        value: "",
        reason: `${customVarsResult.error.kind}: ${customVarsResult.error.key}`,
      });
    }

    // 2. Process standard variables using dedicated resolver
    const standardVarsResult = this.#standardResolver.resolve({
      options: params.options,
      stdinContent: params.stdinContent,
      inputFile: params.inputFile,
      outputFile: params.outputFile,
    });
    if (!standardVarsResult.ok) {
      return error(standardVarsResult.error);
    }

    // 3. Process STDIN variable if needed
    let stdinVariable: PromptVariable | undefined;
    if (params.stdinContent) {
      const stdinResult = this.#stdinFactory.createFromText(params.stdinContent);
      if (!stdinResult.ok) {
        return error({
          kind: "StdinVariableError",
          error: JSON.stringify(stdinResult.error),
        });
      }
      stdinVariable = stdinResult.data;
    }

    // 4. Create factory values for builder
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: params.promptFile || "default.md",
      inputFilePath: standardVarsResult.data.input_text_file,
      outputFilePath: standardVarsResult.data.destination_path,
      schemaFilePath: params.schemaFile || "",
      customVariables: customVarsResult.data,
      inputText: params.stdinContent,
    };

    // 5. Build variables using VariablesBuilder
    const builderResult = this.#buildVariables(
      factoryValues,
      stdinVariable,
    );
    if (!builderResult.ok) {
      return error(builderResult.error);
    }

    // 6. Create result
    const result: ProcessorResult = {
      variables: builderResult.data.toRecord(),
      customVariables: customVarsResult.data,
      standardVariables: standardVarsResult.data,
      builder: builderResult.data,
    };

    return ok(result);
  }

  /**
   * Extract custom variables from options (uv- prefixed)
   * @deprecated Use CustomVariableExtractor instead
   */
  extractCustomVariables(
    options: Record<string, unknown>,
  ): Result<Record<string, string>, VariableProcessorError> {
    // Delegate to the new extractor for backward compatibility
    const result = this.#customExtractor.extract(options);
    if (!result.ok) {
      return error({
        kind: "InvalidOption",
        key: result.error.key,
        value: "",
        reason: `${result.error.kind}: ${result.error.key}`,
      });
    }
    return ok(result.data);
  }

  /**
   * Build variables using VariablesBuilder
   */
  #buildVariables(
    factoryValues: FactoryResolvedValues,
    stdinVariable?: PromptVariable,
  ): Result<VariablesBuilder, VariableProcessorError> {
    const builder = new VariablesBuilder();

    // Validate factory values
    const validationResult = builder.validateFactoryValues(factoryValues);
    if (!validationResult.ok) {
      return error({
        kind: "BuilderError",
        errors: validationResult.error,
      });
    }

    // Add factory values
    builder.addFromFactoryValues(factoryValues);

    // Add STDIN variable if exists (only if not already handled by factory values)
    if (stdinVariable && !factoryValues.inputText) {
      builder.addStdinVariable(stdinVariable.value);
    }

    // Build final variables
    const buildResult = builder.build();
    if (!buildResult.ok) {
      return error({
        kind: "BuilderError",
        errors: buildResult.error,
      });
    }

    return ok(builder);
  }

  /**
   * Enhanced version of extractCustomVariables for backward compatibility
   * This static method maintains the original function signature
   */
  static extractCustomVariables(options: Record<string, unknown>): Record<string, string> {
    const processor = new TwoParamsVariableProcessor();
    const result = processor.extractCustomVariables(options);

    // Return empty object on error for backward compatibility
    return result.ok ? result.data : {};
  }
}

/**
 * Factory function for creating processor instance
 */
export function createVariableProcessor(): TwoParamsVariableProcessor {
  return new TwoParamsVariableProcessor();
}

/**
 * Enhanced extractCustomVariables function for backward compatibility
 * Maintains the original function signature while using the new processor
 */
export function extractCustomVariables(options: Record<string, unknown>): Record<string, string> {
  return TwoParamsVariableProcessor.extractCustomVariables(options);
}
