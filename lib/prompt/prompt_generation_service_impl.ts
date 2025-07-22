/**
 * @fileoverview Prompt Generation Domain Service Implementation
 *
 * This module provides the concrete implementation of PromptGenerationService,
 * handling prompt generation logic with clear domain boundaries.
 *
 * @module prompt/prompt_generation_service_impl
 */

import { PromptManager } from "@tettuan/breakdownprompt";
import { basename } from "@std/path/basename";
import { existsSync } from "@std/fs/exists";
import type { Result } from "../types/result.ts";
import { error as resultError, ok } from "../types/result.ts";
import type { PromptError, PromptResult } from "../types/prompt_types.ts";
import type {
  PromptGenerationContext,
  PromptGenerationService,
  PromptValidationContext,
} from "./prompt_generation_service.ts";
import { VariablesBuilder } from "../builder/variables_builder.ts";

/**
 * Default implementation of PromptGenerationService
 *
 * This implementation uses PromptManager for actual prompt generation
 * while maintaining clear domain boundaries.
 */
export class PromptGenerationServiceImpl implements PromptGenerationService {
  private readonly promptManager: PromptManager;

  constructor(promptManager?: PromptManager) {
    this.promptManager = promptManager ?? new PromptManager();
  }

  /**
   * Validate the prompt generation context
   */
  validateContext(
    context: PromptGenerationContext,
    validationContext: PromptValidationContext,
  ): Result<void, PromptError> {
    // Check base directory
    if (!validationContext.hasValidBaseDir) {
      return resultError({
        kind: "ConfigurationError",
        message: validationContext.baseDirError ?? "Prompt base_dir must be set",
      });
    }

    // Validate prompt file exists
    if (!existsSync(context.promptFilePath)) {
      return resultError({
        kind: "TemplateNotFound",
        path: context.promptFilePath,
      });
    }

    // Validate input file if not stdin
    if (context.inputFilePath && context.inputFilePath !== "-") {
      if (!existsSync(context.inputFilePath)) {
        return resultError({
          kind: "InvalidPath",
          message: `Input file not found: ${context.inputFilePath}`,
        });
      }
    }

    return ok(undefined);
  }

  /**
   * Generate a prompt from the given context
   */
  async generatePrompt(
    context: PromptGenerationContext,
  ): Promise<Result<PromptResult, PromptError>> {
    try {
      // Read template file
      let template: string;
      try {
        template = await Deno.readTextFile(context.promptFilePath);
      } catch (_e) {
        return resultError({
          kind: "TemplateNotFound",
          path: context.promptFilePath,
        });
      }

      // Get input text
      let inputText = context.inputText ?? "";
      if (!inputText && template.includes("{input_text}") && context.inputFilePath !== "-") {
        try {
          inputText = await Deno.readTextFile(context.inputFilePath);
        } catch (e) {
          return resultError({
            kind: "InvalidPath",
            message: `Failed to read input file: ${e instanceof Error ? e.message : String(e)}`,
          });
        }
      }

      // Build variables
      const variables = this.buildVariables(context, inputText);

      // Generate prompt
      const result = await this.promptManager.generatePrompt(template, variables);

      // Handle result - PromptManager returns string content directly
      return ok({
        content: String(result),
        metadata: {
          template: context.promptFilePath,
          variables,
          timestamp: new Date(),
        },
      });
    } catch (_e) {
      return resultError({
        kind: "ConfigurationError",
        message: `Unexpected error: ${_e instanceof Error ? _e.message : String(_e)}`,
      });
    }
  }

  /**
   * Validate and generate prompt in one operation
   */
  async validateAndGenerate(
    context: PromptGenerationContext,
    validationContext: PromptValidationContext,
  ): Promise<Result<PromptResult, PromptError>> {
    const validationResult = this.validateContext(context, validationContext);
    if (!validationResult.ok) {
      return validationResult;
    }

    return await this.generatePrompt(context);
  }

  /**
   * Build variables from context and input text
   */
  private buildVariables(
    context: PromptGenerationContext,
    inputText: string,
  ): Record<string, string> {
    const builder = new VariablesBuilder();

    // Add standard variables
    if (context.inputFilePath) {
      builder.addStandardVariable("input_text_file", basename(context.inputFilePath));
    }
    if (context.outputFilePath) {
      builder.addStandardVariable("destination_path", context.outputFilePath);
    }

    // Add file path variables
    if (context.schemaFilePath) {
      builder.addFilePathVariable("schema_file", context.schemaFilePath);
    }

    // Add stdin variable
    if (inputText) {
      builder.addStdinVariable(inputText);
    }

    // Add custom variables
    if (context.customVariables) {
      builder.addCustomVariables(context.customVariables);
    }

    return builder.toTemplateRecord();
  }
}
