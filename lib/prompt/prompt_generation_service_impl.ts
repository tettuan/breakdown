/**
 * @fileoverview Prompt Generation Domain Service Implementation
 *
 * This module provides the concrete implementation of PromptGenerationService,
 * handling prompt generation logic with clear domain boundaries.
 *
 * @module prompt/prompt_generation_service_impl
 */

import { PromptManager } from "@tettuan/breakdownprompt";
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
    // Debug logging to understand what we're receiving
    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
    if (isDebug) {
      console.log("[PromptGenerationServiceImpl] validateContext received:", {
        promptFilePath: context.promptFilePath,
        promptFilePathType: typeof context.promptFilePath,
        promptFilePathLength: context.promptFilePath?.length,
        cwdForComparison: Deno.cwd(),
        hasValidBaseDir: validationContext.hasValidBaseDir,
        baseDirError: validationContext.baseDirError,
      });
    }

    // Check base directory
    if (!validationContext.hasValidBaseDir) {
      return resultError({
        kind: "ConfigurationError",
        message: validationContext.baseDirError ?? "Prompt base_dir must be set",
      });
    }

    // Validate prompt file exists
    if (!existsSync(context.promptFilePath)) {
      if (isDebug) {
        console.log("[PromptGenerationServiceImpl] File not found:", {
          promptFilePath: context.promptFilePath,
          cwd: Deno.cwd(),
          fileExists: false,
        });
      }
      return resultError({
        kind: "TemplateNotFound",
        path: context.promptFilePath,
        workingDir: Deno.cwd(),
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
          workingDir: Deno.cwd(),
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
      builder.addStandardVariable("input_text_file", context.inputFilePath);
    }
    // Only add destination_path when output file is specified
    if (context.outputFilePath) {
      builder.addStandardVariable("destination_path", context.outputFilePath);
    }
    // When no output file specified, do not add destination_path variable
    // This allows {destination_path} to remain unsubstituted in the template

    // Add file path variables
    if (context.schemaFilePath) {
      builder.addFilePathVariable("schema_file", context.schemaFilePath);
    }

    // Add stdin variable
    if (inputText) {
      builder.addStdinVariable(inputText);
    }

    // Add custom variables with null/empty check
    if (context.userVariables && Object.keys(context.userVariables).length > 0) {
      // Filter out empty values before passing to builder
      const filteredUserVariables = Object.fromEntries(
        Object.entries(context.userVariables).filter(([_key, value]) =>
          value && typeof value === "string" && value.trim().length > 0
        ),
      );

      if (Object.keys(filteredUserVariables).length > 0) {
        builder.addUserVariables(filteredUserVariables);
      }
    }

    return builder.toTemplateRecord();
  }
}
