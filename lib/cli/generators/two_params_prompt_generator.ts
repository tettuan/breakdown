/**
 * @fileoverview TwoParamsPromptGenerator - Prompt generation with Totality principle
 * 
 * This module handles prompt generation following the single responsibility principle.
 * It manages the creation of PromptVariablesFactory, integration with VariablesBuilder,
 * and final prompt generation through PromptManager.
 * 
 * @module cli/generators/two_params_prompt_generator
 */

import type { Result } from "../../types/result.ts";
import { ok, error } from "../../types/result.ts";
import type { DemonstrativeType, LayerType } from "../../types/mod.ts";
import { PromptManager } from "jsr:@tettuan/breakdownprompt@1.2.3";
import { PromptVariablesFactory } from "../../factory/prompt_variables_factory.ts";
import type { PromptCliParams } from "../../types/mod.ts";
import { VariablesBuilder, type FactoryResolvedValues } from "../../builder/variables_builder.ts";
import type { ProcessedVariables } from "../processors/two_params_variable_processor.ts";

/**
 * Prompt generation error types
 */
export type PromptGeneratorError =
  | { kind: "FactoryCreationError"; message: string }
  | { kind: "FactoryValidationError"; errors: string[] }
  | { kind: "VariablesBuilderError"; errors: string[] }
  | { kind: "PromptGenerationError"; error: string }
  | { kind: "InvalidConfiguration"; message: string }
  | { kind: "ConfigurationValidationError"; message: string; missingProperties: string[] };

/**
 * Validated parameters from TwoParamsValidator
 */
export interface ValidatedParams {
  demonstrativeType: DemonstrativeType;
  layerType: string;
}

/**
 * TwoParamsPromptGenerator - Generates prompts with single responsibility
 * 
 * Responsibilities:
 * - Create and manage PromptVariablesFactory
 * - Coordinate with VariablesBuilder
 * - Generate final prompt through PromptManager
 * - Handle all prompt-related errors
 */
export class TwoParamsPromptGenerator {
  /**
   * Create CLI parameters from validated inputs
   */
  private createCliParams(
    params: ValidatedParams,
    options: Record<string, unknown>,
    variables: ProcessedVariables
  ): PromptCliParams {
    return {
      demonstrativeType: params.demonstrativeType,
      layerType: params.layerType,
      options: {
        fromFile: (options.from as string) || (options.fromFile as string),
        destinationFile: (options.destination as string) || (options.output as string) || "output.md",
        adaptation: options.adaptation as string,
        promptDir: options.promptDir as string,
        fromLayerType: options.input as string,
        input_text: variables.standardVariables.input_text || "",
        customVariables: variables.customVariables,
        extended: options.extended as boolean,
        customValidation: options.customValidation as boolean,
        errorFormat: options.errorFormat as "simple" | "detailed" | "json" | undefined,
        config: options.config as string,
      },
    };
  }

  /**
   * Validate factory parameters
   */
  private validateFactory(
    factory: PromptVariablesFactory
  ): Result<void, PromptGeneratorError> {
    try {
      factory.validateAll();
      return ok(undefined);
    } catch (err) {
      return error({
        kind: "FactoryValidationError",
        errors: [err instanceof Error ? err.message : String(err)]
      });
    }
  }

  /**
   * Build variables using VariablesBuilder
   */
  private buildVariables(
    factory: PromptVariablesFactory,
    variables: ProcessedVariables
  ): Result<Record<string, string>, PromptGeneratorError> {
    const allParams = factory.getAllParams();
    
    // Create factory values for VariablesBuilder
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: allParams.promptFilePath,
      inputFilePath: allParams.inputFilePath || "",
      outputFilePath: allParams.outputFilePath || "output.md",
      schemaFilePath: allParams.schemaFilePath || "",
      customVariables: variables.customVariables,
      inputText: variables.standardVariables.input_text,
    };

    // Use VariablesBuilder to construct variables
    const builder = new VariablesBuilder();
    const validationResult = builder.validateFactoryValues(factoryValues);
    
    if (!validationResult.ok) {
      return error({
        kind: "VariablesBuilderError",
        errors: validationResult.error.map(e => JSON.stringify(e))
      });
    }

    builder.addFromFactoryValues(factoryValues);
    const buildResult = builder.build();
    
    if (!buildResult.ok) {
      return error({
        kind: "VariablesBuilderError",
        errors: buildResult.error.map(e => JSON.stringify(e))
      });
    }

    return ok(builder.toRecord());
  }

  /**
   * Generate prompt using PromptManager
   */
  private async generateWithPromptManager(
    promptFilePath: string,
    variables: Record<string, string>
  ): Promise<Result<string, PromptGeneratorError>> {
    try {
      const promptManager = new PromptManager();
      const result = await promptManager.generatePrompt(
        promptFilePath,
        variables
      );

      // Extract content from result
      let content: string;
      if (result && typeof result === "object" && "success" in result) {
        const res = result as { success: boolean; content?: string; error?: string };
        if (res.success) {
          content = res.content || "";
        } else {
          return error({
            kind: "PromptGenerationError",
            error: res.error || "Prompt generation failed"
          });
        }
      } else {
        content = String(result);
      }

      return ok(content);
    } catch (err) {
      return error({
        kind: "PromptGenerationError",
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  /**
   * Generate prompt with all dependencies
   * 
   * @param config - Configuration object
   * @param params - Validated parameters
   * @param options - Command line options
   * @param variables - Processed variables
   * @returns Result with generated prompt or errors
   */
  async generatePrompt(
    config: Record<string, unknown>,
    params: ValidatedParams,
    options: Record<string, unknown>,
    variables: ProcessedVariables
  ): Promise<Result<string, PromptGeneratorError>> {
    // Validate configuration
    if (!config || typeof config !== "object") {
      return error({
        kind: "InvalidConfiguration",
        message: "Configuration must be a valid object"
      });
    }

    // Validate required configuration properties
    const configValidation = this.validateConfiguration(config);
    if (!configValidation.ok) {
      return error(configValidation.error);
    }

    // Create CLI parameters
    const cliParams = this.createCliParams(params, options, variables);

    // Create factory
    let factory: PromptVariablesFactory;
    try {
      factory = await PromptVariablesFactory.create(cliParams);
    } catch (err) {
      return error({
        kind: "FactoryCreationError",
        message: err instanceof Error ? err.message : String(err)
      });
    }

    // Validate factory
    const validationResult = this.validateFactory(factory);
    if (!validationResult.ok) {
      return error(validationResult.error);
    }

    // Build variables
    const variablesResult = this.buildVariables(factory, variables);
    if (!variablesResult.ok) {
      return error(variablesResult.error);
    }

    // Generate prompt
    const allParams = factory.getAllParams();
    return await this.generateWithPromptManager(
      allParams.promptFilePath,
      variablesResult.data
    );
  }

  /**
   * Validates configuration for required properties
   * @param config - Configuration object to validate
   * @returns Result indicating validation success or failure
   */
  private validateConfiguration(config: Record<string, unknown>): Result<void, PromptGeneratorError> {
    // Check for prompt directory configuration
    const hasPromptConfig = config.promptDir || 
                           (config.app_prompt && (config.app_prompt as any).base_dir);
    
    if (!hasPromptConfig) {
      return error({
        kind: "ConfigurationValidationError",
        message: "Missing required configuration: promptDir or app_prompt.base_dir must be specified",
        missingProperties: ["promptDir", "app_prompt.base_dir"]
      });
    }

    return ok(undefined);
  }
}