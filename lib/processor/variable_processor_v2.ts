/**
 * @fileoverview Variable Processor V2 - Refactored with SRP
 *
 * This module orchestrates variable processing using separate specialized
 * components, following the Single Responsibility Principle.
 *
 * @module lib/processor/variable_processor_v2
 */

import type { Result } from "../types/result.ts";
import { error, ok } from "../types/result.ts";
import { type FactoryResolvedValues, VariablesBuilder } from "../builder/variables_builder.ts";
import { StdinVariableFactory } from "../factory/stdin_variable_factory.ts";
import { CustomVariableExtractor } from "./custom_variable_extractor.ts";
import { StandardVariableResolver, type StandardVariables } from "./standard_variable_resolver.ts";
import type { PromptVariable } from "../types/prompt_variables_vo.ts";

/**
 * Error types for Variable Processor
 */
export type VariableProcessorError =
  | { kind: "CustomVariableError"; error: unknown }
  | { kind: "StandardVariableError"; error: unknown }
  | { kind: "StdinVariableError"; error: string }
  | { kind: "BuilderError"; errors: Array<{ kind: string; [key: string]: unknown }> };

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
  standardVariables: StandardVariables;
  /** Builder instance for further manipulation */
  builder: VariablesBuilder;
}

/**
 * Variable Processor V2 class
 *
 * Orchestrates variable processing by delegating to specialized components:
 * - CustomVariableExtractor: Handles uv- prefixed variables
 * - StandardVariableResolver: Resolves input/output paths
 * - StdinVariableFactory: Creates STDIN variables
 * - VariablesBuilder: Builds final variable set
 */
export class VariableProcessorV2 {
  private readonly customExtractor: CustomVariableExtractor;
  private readonly standardResolver: StandardVariableResolver;
  private readonly stdinFactory: StdinVariableFactory;

  constructor() {
    this.customExtractor = new CustomVariableExtractor();
    this.standardResolver = new StandardVariableResolver();
    this.stdinFactory = new StdinVariableFactory();
  }

  /**
   * Process variables from options and content
   */
  process(params: ProcessorOptions): Result<ProcessorResult, VariableProcessorError> {
    // 1. Extract custom variables
    const customVarsResult = this.customExtractor.extract(params.options);
    if (!customVarsResult.ok) {
      return error({
        kind: "CustomVariableError",
        error: customVarsResult.error,
      });
    }

    // 2. Resolve standard variables
    const standardVarsResult = this.standardResolver.resolve({
      options: params.options,
      stdinContent: params.stdinContent,
      inputFile: params.inputFile,
      outputFile: params.outputFile,
    });
    if (!standardVarsResult.ok) {
      return error({
        kind: "StandardVariableError",
        error: standardVarsResult.error,
      });
    }

    // 3. Process STDIN variable if needed
    const stdinVarResult = this.processStdinVariable(params.stdinContent);
    if (!stdinVarResult.ok) {
      return error(stdinVarResult.error);
    }

    // 4. Build final variables
    const buildResult = this.buildVariables(
      params,
      customVarsResult.data,
      standardVarsResult.data,
      stdinVarResult.data,
    );
    if (!buildResult.ok) {
      return error(buildResult.error);
    }

    // 5. Create result
    const result: ProcessorResult = {
      variables: buildResult.data.toRecord(),
      customVariables: customVarsResult.data,
      standardVariables: standardVarsResult.data,
      builder: buildResult.data,
    };

    return ok(result);
  }

  /**
   * Process STDIN variable if content exists
   */
  private processStdinVariable(
    stdinContent?: string,
  ): Result<PromptVariable | undefined, VariableProcessorError> {
    if (!stdinContent) {
      return ok(undefined);
    }

    const stdinResult = this.stdinFactory.createFromText(stdinContent);
    if (!stdinResult.ok) {
      return error({
        kind: "StdinVariableError",
        error: JSON.stringify(stdinResult.error),
      });
    }

    return ok(stdinResult.data);
  }

  /**
   * Build variables using VariablesBuilder
   */
  private buildVariables(
    params: ProcessorOptions,
    customVariables: Record<string, string>,
    standardVariables: StandardVariables,
    stdinVariable?: PromptVariable,
  ): Result<VariablesBuilder, VariableProcessorError> {
    const builder = new VariablesBuilder();

    // Create factory values
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: params.promptFile || "default.md",
      inputFilePath: standardVariables.input_text_file,
      outputFilePath: standardVariables.destination_path,
      schemaFilePath: params.schemaFile || "",
      customVariables: customVariables,
      inputText: params.stdinContent,
    };

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

    // Add STDIN variable if exists and not already handled
    if (stdinVariable && !factoryValues.inputText) {
      const stdinRecord = stdinVariable.toRecord();
      const stdinValue = Object.values(stdinRecord)[0] || "";
      builder.addStdinVariable(stdinValue);
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
}

/**
 * Backward compatibility interface for ProcessedVariables
 */
export interface ProcessedVariables {
  /** Custom variables with uv- prefix */
  customVariables: Record<string, string>;
  /** Standard variables for prompt processing */
  standardVariables: Record<string, string>;
  /** All variables combined */
  allVariables: Record<string, string>;
}

/**
 * Backward compatibility error types for TwoParamsVariableProcessor
 */
export type TwoParamsVariableProcessorError =
  | { kind: "InvalidVariablePrefix"; key: string; expectedPrefix: string }
  | { kind: "ReservedVariableName"; key: string }
  | { kind: "EmptyVariableValue"; key: string }
  | { kind: "InvalidOptions"; message: string };

/**
 * Two Params Variable Processor wrapper for backward compatibility
 */
export class TwoParamsVariableProcessor {
  private readonly processor: VariableProcessorV2;

  constructor() {
    this.processor = new VariableProcessorV2();
  }

  /**
   * Process variables with backward compatible interface
   */
  processVariables(
    options: Record<string, unknown>,
    stdinContent: string,
  ): Result<ProcessedVariables, TwoParamsVariableProcessorError[]> {
    // Validate options first
    if (!options || typeof options !== "object") {
      return error([{
        kind: "InvalidOptions",
        message: "Options must be a valid object",
      }]);
    }

    // Extract and validate custom variables with backward compatible error handling
    const customVarsResult = this.extractCustomVariablesCompatible(options);
    if (!customVarsResult.ok) {
      return error(customVarsResult.error);
    }

    // Build standard variables
    const standardVariables = this.buildStandardVariablesCompatible(options, stdinContent);

    // Combine all variables
    const allVariables = {
      ...customVarsResult.data,
      ...standardVariables,
    };

    const processedVariables: ProcessedVariables = {
      customVariables: customVarsResult.data,
      standardVariables,
      allVariables,
    };

    return ok(processedVariables);
  }

  /**
   * Extract custom variables with backward compatible error handling
   */
  private extractCustomVariablesCompatible(
    options: Record<string, unknown>,
  ): Result<Record<string, string>, TwoParamsVariableProcessorError[]> {
    const customVariables: Record<string, string> = {};
    const errors: TwoParamsVariableProcessorError[] = [];
    const reservedNames = new Set([
      "input_text",
      "input_text_file", 
      "destination_path",
      "schema_file",
    ]);

    for (const [key, value] of Object.entries(options)) {
      if (key.startsWith("uv-")) {
        // Validate against reserved names
        const varName = key.substring(3); // Remove "uv-" prefix
        if (reservedNames.has(varName)) {
          errors.push({
            kind: "ReservedVariableName",
            key,
          });
          continue;
        }

        // Ensure value is not empty
        const stringValue = String(value);
        if (!stringValue || stringValue.trim() === "") {
          errors.push({
            kind: "EmptyVariableValue",
            key,
          });
          continue;
        }

        customVariables[key] = stringValue;
      }
    }

    if (errors.length > 0) {
      return error(errors);
    }

    return ok(customVariables);
  }

  /**
   * Build standard variables with backward compatible interface
   */
  private buildStandardVariablesCompatible(
    options: Record<string, unknown>,
    stdinContent: string,
  ): Record<string, string> {
    const standardVariables: Record<string, string> = {};

    // Add stdin content if available
    if (stdinContent) {
      standardVariables.input_text = stdinContent;
    }

    // Add input file name (from -f/--from option)
    const inputFile = options.from ?? options.fromFile;
    standardVariables.input_text_file = inputFile !== undefined ? String(inputFile) : "stdin";

    // Add destination path (from -o/--destination option)
    const destinationPath = options.destination ??
      options.destinationFile ??
      options.output;
    standardVariables.destination_path = destinationPath !== undefined
      ? String(destinationPath)
      : "stdout";

    return standardVariables;
  }

  /**
   * Process variables without stdin content
   */
  processVariablesWithoutStdin(
    options: Record<string, unknown>,
  ): Result<ProcessedVariables, TwoParamsVariableProcessorError[]> {
    return this.processVariables(options, "");
  }
}
