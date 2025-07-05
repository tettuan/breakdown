/**
 * @fileoverview Two Params Orchestrator - Internal implementation
 *
 * Orchestrates the two params handler components following the
 * Orchestrator pattern while maintaining the existing interface.
 *
 * @module lib/cli/orchestrators/two_params_orchestrator
 */

import type { Result } from "../../types/result.ts";
import { error, ok } from "../../types/result.ts";
import type { BreakdownConfigCompatible } from "../../config/timeout_manager.ts";
import { PromptVariablesFactory } from "../../factory/prompt_variables_factory.ts";
import { VariablesBuilder } from "../../builder/variables_builder.ts";
import type { TwoParamsHandlerError } from "../handlers/two_params_handler.ts";
import type { PromptCliParams } from "../../types/mod.ts";
import { PromptManagerAdapter } from "../../prompt/prompt_manager_adapter.ts";
import { PromptPath } from "../../types/prompt_types.ts";
import { convertPromptCliParamsToPromptVariables } from "../../migration/prompt_migration_utils.ts";
import { CompositePromptVariables } from "../../prompt/variables/composite_prompt_variables.ts";

// Import components
import { TwoParamsValidator } from "../validators/two_params_validator.ts";
import { TwoParamsStdinProcessor } from "../processors/two_params_stdin_processor.ts";

/**
 * Orchestrates two params handler components
 */
export class TwoParamsOrchestrator {
  private readonly validator: TwoParamsValidator;
  private readonly stdinProcessor: TwoParamsStdinProcessor;

  constructor(
    validator?: TwoParamsValidator,
    stdinProcessor?: TwoParamsStdinProcessor,
  ) {
    this.validator = validator || new TwoParamsValidator();
    this.stdinProcessor = stdinProcessor || new TwoParamsStdinProcessor();
  }

  /**
   * Execute the two params handler flow
   */
  async execute(
    params: string[],
    config: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<Result<void, TwoParamsHandlerError>> {
    // 1. Validate parameters
    const validationResult = await this.validator.validate(params);
    if (!validationResult.ok) {
      return error(validationResult.error);
    }

    const { demonstrativeType, layerType } = validationResult.data;

    // 2. Read STDIN
    const stdinResult = await this.stdinProcessor.process(
      config as BreakdownConfigCompatible,
      options,
    );
    if (!stdinResult.ok) {
      return error({
        kind: "StdinReadError",
        error: stdinResult.error.message,
      });
    }

    // 3. Extract and process variables
    const customVariables = this._extractCustomVariables(options);
    const processedVariables = this._processVariables(
      customVariables,
      stdinResult.data,
      options,
    );

    // 4. Create CLI parameters
    const cliParams = this._createCliParams(
      demonstrativeType,
      layerType,
      options,
      stdinResult.data,
      processedVariables,
    );

    // 5. Generate prompt
    const promptResult = await this._generatePrompt(
      config,
      cliParams,
      stdinResult.data,
      processedVariables,
    );
    if (!promptResult.ok) {
      return error(promptResult.error);
    }

    // 6. Write output
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(promptResult.data);
      await Deno.stdout.write(data);
    } catch (err) {
      return error({
        kind: "OutputWriteError",
        error: err instanceof Error ? err.message : String(err),
        cause: err,
      });
    }

    return ok(undefined);
  }

  /**
   * Extract custom variables from options
   */
  private _extractCustomVariables(options: Record<string, unknown>): Record<string, string> {
    const customVariables: Record<string, string> = {};

    for (const [key, value] of Object.entries(options)) {
      if (key.startsWith("uv-")) {
        customVariables[key] = String(value);
      }
    }

    return customVariables;
  }

  /**
   * Process variables (including standard variables)
   */
  private _processVariables(
    customVariables: Record<string, string>,
    inputText: string,
    options: Record<string, unknown>,
  ): Record<string, string> {
    const processed = { ...customVariables };

    if (inputText) {
      processed.input_text = inputText;
    }
    processed.input_text_file = (options.fromFile as string) || "stdin";
    processed.destination_path = (options.destinationFile as string) ||
      (options.output as string) || "stdout";

    return processed;
  }

  /**
   * Create CLI parameters
   */
  private _createCliParams(
    demonstrativeType: string,
    layerType: string,
    options: Record<string, unknown>,
    inputText: string,
    customVariables: Record<string, string>,
  ): PromptCliParams {
    return {
      demonstrativeType,
      layerType,
      options: {
        fromFile: (options.from as string) || (options.fromFile as string),
        destinationFile: (options.destination as string) ||
          (options.output as string) || "output.md",
        adaptation: options.adaptation as string,
        promptDir: options.promptDir as string,
        fromLayerType: options.input as string,
        input_text: inputText,
        customVariables,
        extended: options.extended as boolean,
        customValidation: options.customValidation as boolean,
        errorFormat: options.errorFormat as "simple" | "detailed" | "json" | undefined,
        config: options.config as string,
      },
    };
  }

  /**
   * Generate prompt using factory and builder
   */
  private async _generatePrompt(
    _config: Record<string, unknown>,
    cliParams: PromptCliParams,
    inputText: string,
    customVariables: Record<string, string>,
  ): Promise<Result<string, TwoParamsHandlerError>> {
    try {
      // Create factory with robust fallback mechanisms
      let factory;
      try {
        factory = await PromptVariablesFactory.create(cliParams);
      } catch (_configError) {
        // Fallback: Use minimal config when main config loading fails
        const fallbackConfig = {
          working_dir: ".agent/breakdown",
          app_prompt: { base_dir: ".agent/breakdown/prompts" },
          app_schema: { base_dir: ".agent/breakdown/schema" },
        };
        factory = PromptVariablesFactory.createWithConfig(fallbackConfig, cliParams);
      }

      // Validate factory
      factory.validateAll();

      const allParams = factory.getAllParams();

      // Create factory values
      const factoryValues = {
        promptFilePath: allParams.promptFilePath,
        inputFilePath: allParams.inputFilePath || "",
        outputFilePath: allParams.outputFilePath || "output.md",
        schemaFilePath: allParams.schemaFilePath || "",
        customVariables,
        inputText: inputText || undefined,
      };

      // Build variables
      const builder = new VariablesBuilder();
      const validationResult = builder.validateFactoryValues(factoryValues);

      if (!validationResult.ok) {
        return error({
          kind: "VariablesBuilderError",
          errors: validationResult.error.map((e) => JSON.stringify(e)),
        });
      }

      builder.addFromFactoryValues(factoryValues);
      const buildResult = builder.build();

      if (!buildResult.ok) {
        return error({
          kind: "VariablesBuilderError",
          errors: buildResult.error.map((e) => JSON.stringify(e)),
        });
      }

      // Convert PromptCliParams to PromptVariables using migration utility
      const variablesResult = convertPromptCliParamsToPromptVariables(cliParams);
      if (!variablesResult.ok) {
        return error({
          kind: "VariablesBuilderError",
          errors: variablesResult.error.details,
        });
      }

      // Create PromptPath
      const pathResult = PromptPath.create(allParams.promptFilePath);
      if (!pathResult.ok) {
        return error({
          kind: "PromptGenerationError",
          error: pathResult.error.message,
        });
      }

      // Generate prompt using PromptManagerAdapter
      const promptAdapter = new PromptManagerAdapter();
      const compositeVariables = new CompositePromptVariables(variablesResult.data);
      const result = await promptAdapter.generatePrompt(
        pathResult.data,
        compositeVariables,
      );

      // Extract content
      if (!result.ok) {
        return error({
          kind: "PromptGenerationError",
          error: `${result.error.kind}: ${this._formatPromptError(result.error)}`,
        });
      }

      const content = result.data.content;

      return ok(content);
    } catch (err) {
      return error({
        kind: "FactoryValidationError",
        errors: [err instanceof Error ? err.message : String(err)],
      });
    }
  }

  /**
   * Format PromptError for display
   */
  private _formatPromptError(error: import("../../types/prompt_types.ts").PromptError): string {
    switch (error.kind) {
      case "TemplateNotFound":
        return `Template not found: ${error.path}`;
      case "InvalidVariables":
        return `Invalid variables: ${error.details.join(", ")}`;
      case "SchemaError":
        return `Schema error in ${error.schema}: ${error.error}`;
      case "InvalidPath":
        return `Invalid path: ${error.message}`;
      case "TemplateParseError":
        return `Failed to parse template ${error.template}: ${error.error}`;
      case "ConfigurationError":
        return `Configuration error: ${error.message}`;
    }
  }
}
