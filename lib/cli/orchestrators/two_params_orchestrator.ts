/**
 * @fileoverview Two Params Orchestrator - Internal implementation
 *
 * Orchestrates the two params handler components following the
 * Orchestrator pattern while maintaining the existing interface.
 *
 * @module lib/cli/orchestrators/two_params_orchestrator
 */

import type { Result } from "$lib/types/result.ts";
import { error, ok } from "$lib/types/result.ts";
import type { BreakdownConfigCompatible } from "$lib/config/timeout_manager.ts";
import { PromptVariablesFactory } from "$lib/factory/prompt_variables_factory.ts";
import { VariablesBuilder } from "$lib/builder/variables_builder.ts";
import { PromptManager } from "jsr:@tettuan/breakdownprompt@1.2.3";
import type { TwoParamsHandlerError } from "../handlers/two_params_handler.ts";
import type { PromptCliParams } from "$lib/factory/prompt_variables_factory.ts";

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
    const customVariables = this.extractCustomVariables(options);
    const processedVariables = this.processVariables(
      customVariables,
      stdinResult.data,
      options,
    );

    // 4. Create CLI parameters
    const cliParams = this.createCliParams(
      demonstrativeType,
      layerType,
      options,
      stdinResult.data,
      processedVariables,
    );

    // 5. Generate prompt
    const promptResult = await this.generatePrompt(
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
   * Process variables (including standard variables)
   */
  private processVariables(
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
  private createCliParams(
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
  private async generatePrompt(
    config: Record<string, unknown>,
    cliParams: PromptCliParams,
    inputText: string,
    customVariables: Record<string, string>,
  ): Promise<Result<string, TwoParamsHandlerError>> {
    try {
      // Create factory with robust fallback mechanisms
      let factory;
      try {
        factory = await PromptVariablesFactory.create(cliParams);
      } catch (configError) {
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

      // Generate prompt
      const variablesRecord = builder.toRecord();
      const promptManager = new PromptManager();
      const result = await promptManager.generatePrompt(
        allParams.promptFilePath,
        variablesRecord,
      );

      // Extract content
      let content: string;
      if (result && typeof result === "object" && "success" in result) {
        const res = result as { success: boolean; content?: string; error?: string };
        if (res.success) {
          content = res.content || "";
        } else {
          return error({
            kind: "PromptGenerationError",
            error: res.error || "Prompt generation failed",
          });
        }
      } else {
        content = String(result);
      }

      return ok(content);
    } catch (err) {
      return error({
        kind: "FactoryValidationError",
        errors: [err instanceof Error ? err.message : String(err)],
      });
    }
  }
}
