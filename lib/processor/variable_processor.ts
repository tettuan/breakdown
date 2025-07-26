/**
 * @fileoverview Variable Processor - Orchestrates variable processing with SRP
 *
 * This module orchestrates variable processing using separate specialized
 * components, following the Single Responsibility Principle and Domain-Driven Design.
 *
 * @module lib/processor/variable_processor
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
 * Following Worker7's Discriminated Union pattern for consistency
 */
export type VariableProcessorError =
  | {
    kind: "CustomVariableError";
    message: string;
    error: unknown;
    context?: Record<string, unknown>;
  }
  | {
    kind: "StandardVariableError";
    message: string;
    error: unknown;
    context?: Record<string, unknown>;
  }
  | {
    kind: "StdinVariableError";
    message: string;
    error: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "BuilderError";
    message: string;
    errors: Array<{ kind: string; [key: string]: unknown }>;
    context?: Record<string, unknown>;
  };

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
 * Following Worker7's Discriminated Union pattern for consistency
 */
export type TwoParamsVariableProcessorError =
  | {
    kind: "InvalidVariablePrefix";
    message: string;
    key: string;
    expectedPrefix: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "ReservedVariableName";
    message: string;
    key: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "EmptyVariableValue";
    message: string;
    key: string;
    context?: Record<string, unknown>;
  }
  | {
    kind: "InvalidOptions";
    message: string;
    options?: unknown;
    context?: Record<string, unknown>;
  };

/**
 * Two Params Variable Processor - Main implementation for variable processing
 *
 * This processor orchestrates variable processing using separate specialized
 * components following Domain-Driven Design principles.
 */
export class TwoParamsVariableProcessor {
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
   * Main entry point for variable processing
   */
  process(params: ProcessorOptions): Result<ProcessorResult, VariableProcessorError> {
    // 1. Extract custom variables
    const customVarsResult = this.customExtractor.extract(params.options);
    if (!customVarsResult.ok) {
      return error({
        kind: "CustomVariableError",
        message: "Failed to extract custom variables",
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
        message: "Failed to resolve standard variables",
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
            message: `Reserved variable name: ${key}`,
            key,
          });
          continue;
        }

        // Ensure value is not empty
        let stringValue: string;
        if (typeof value === "object" && value !== null) {
          try {
            stringValue = JSON.stringify(value);
          } catch {
            stringValue = String(value);
          }
        } else {
          stringValue = String(value);
        }

        if (!stringValue || stringValue.trim() === "") {
          errors.push({
            kind: "EmptyVariableValue",
            message: `Empty variable value: ${key}`,
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

    // Add stdin content - always set input_text (even if empty string)
    // This ensures input_text is always available in standardVariables
    standardVariables.input_text = stdinContent || "";

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

  /**
   * Extract custom variables (public method for architecture test)
   * Returns Result type as expected by tests
   */
  extractCustomVariables(
    options: Record<string, unknown>,
  ): Result<Record<string, string>, VariableProcessorError> {
    const result = this.extractCustomVariablesCompatible(options);
    if (!result.ok) {
      // Convert array of errors to single error for architecture test
      return error({
        kind: "CustomVariableError",
        message: "Failed to extract custom variables",
        error: result.error,
      });
    }
    return ok(result.data);
  }

  /**
   * Extract variables (alias for extractCustomVariables)
   * Returns simplified format for architecture test
   */
  extractVariables(
    options: Record<string, unknown>,
  ): Result<Record<string, string>, TwoParamsVariableProcessorError[]> {
    const result = this.extractCustomVariablesCompatible(options);
    if (!result.ok) {
      return result;
    }
    // Return the custom variables directly
    return ok(result.data);
  }

  /**
   * Process all variables (alias for processVariables)
   * Matches the expected interface for architecture test
   */
  processAllVariables(params: {
    options: Record<string, unknown>;
    stdinContent: string;
  }): Result<ProcessedVariables, TwoParamsVariableProcessorError[]> {
    return this.processVariables(params.options, params.stdinContent);
  }

  /**
   * Static method to extract custom variables
   * Returns simple object format as expected by tests
   */
  static extractCustomVariables(
    options: Record<string, unknown>,
  ): Record<string, string> {
    const customVariables: Record<string, string> = {};
    for (const [key, value] of Object.entries(options)) {
      if (key.startsWith("uv-")) {
        // Convert values to string more intelligently
        if (typeof value === "object" && value !== null) {
          try {
            customVariables[key] = JSON.stringify(value);
          } catch {
            customVariables[key] = String(value);
          }
        } else {
          customVariables[key] = String(value);
        }
      }
    }
    return customVariables;
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
        message: "Failed to create stdin variable",
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
        message: "Failed to validate factory values",
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
        message: "Failed to build final variables",
        errors: buildResult.error,
      });
    }

    return ok(builder);
  }
}
