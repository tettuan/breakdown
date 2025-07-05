/**
 * @fileoverview Unified PromptManagerAdapter implementation following the proposed design
 *
 * This module provides the simplified adapter for PromptManager that eliminates
 * the structural conflicts between PromptPath/PromptManager and PromptCliParams approaches.
 * It uses the Adapter Pattern + Factory Method as specified in the adoption plan.
 *
 * @module prompt/unified_prompt_manageradapter
 */

import { PromptManager } from "@tettuan/breakdownprompt";
import { error as resultError, ok as resultOk, type Result } from "../types/result.ts";
import type {
  PromptError,
  PromptPath,
  PromptResult,
  PromptVariables,
} from "../types/prompt_types.ts";

/**
 * Unified PromptManagerAdapter following the simplified design
 *
 * This adapter provides a clean interface that accepts abstract types
 * (PromptPath and PromptVariables) and converts them appropriately
 * for the BreakdownPrompt API.
 *
 * @example Basic usage
 * ```typescript
 * const pathResult = PromptPath.create("template.md");
 * const variables = new MyVariables({ name: "test" });
 *
 * if (pathResult.ok) {
 *   const result = await PromptManagerAdapter.generatePrompt(
 *     pathResult.data,
 *     variables
 *   );
 *   if (result.ok) {
 *     console.log(result.data.content);
 *   }
 * }
 * ```
 */
export class PromptManagerAdapter {
  /**
   * Generate a prompt from template and variables
   *
   * This static method follows the adoption plan by:
   * 1. Accepting abstract types (PromptPath, PromptVariables)
   * 2. Using Duck Typing pattern for conversion
   * 3. Directly calling BreakdownPrompt API
   * 4. Maintaining clear separation of concerns
   *
   * @param template - The prompt template path
   * @param variables - Variables to replace in the template
   * @returns Result containing generated prompt or error
   */
  static async generatePrompt(
    template: PromptPath,
    variables: PromptVariables,
  ): Promise<Result<PromptResult, PromptError>> {
    try {
      // Duck Typing pattern to extract values
      const templatePath = template.toString();
      const variableDict = variables.toRecord();

      // Create PromptManager instance and generate prompt
      const manager = new PromptManager();
      const content = await manager.generatePrompt(templatePath, variableDict);

      // Construct result with metadata
      const promptResult: PromptResult = {
        content: String(content),
        metadata: {
          template: templatePath,
          variables: variableDict,
          timestamp: new Date(),
        },
      };

      return resultOk(promptResult);
    } catch (error) {
      return PromptManagerAdapter.handleError(error, template.toString());
    }
  }

  /**
   * Generate prompt with custom configuration
   *
   * This method allows passing a custom PromptManager instance
   * for specialized configurations or testing scenarios.
   *
   * @param manager - Custom PromptManager instance
   * @param template - The prompt template path
   * @param variables - Variables to replace in the template
   * @returns Result containing generated prompt or error
   */
  static async generatePromptWithManager(
    manager: PromptManager,
    template: PromptPath,
    variables: PromptVariables,
  ): Promise<Result<PromptResult, PromptError>> {
    try {
      const templatePath = template.toString();
      const variableDict = variables.toRecord();

      const content = await manager.generatePrompt(templatePath, variableDict);

      const promptResult: PromptResult = {
        content: String(content),
        metadata: {
          template: templatePath,
          variables: variableDict,
          timestamp: new Date(),
        },
      };

      return resultOk(promptResult);
    } catch (error) {
      return PromptManagerAdapter.handleError(error, template.toString());
    }
  }

  /**
   * Handle errors from PromptManager
   *
   * Converts various error types into structured PromptError types
   * for consistent error handling throughout the application.
   *
   * @param error - The error to handle
   * @param templatePath - The template path for context
   * @returns Result with structured error
   */
  private static handleError(
    error: unknown,
    templatePath: string,
  ): Result<PromptResult, PromptError> {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("not found") || message.includes("does not exist")) {
        return resultError({
          kind: "TemplateNotFound",
          path: templatePath,
        });
      }

      if (message.includes("variable") || message.includes("undefined")) {
        return resultError({
          kind: "InvalidVariables",
          details: [error.message],
        });
      }

      if (message.includes("schema") || message.includes("validation")) {
        return resultError({
          kind: "SchemaError",
          schema: templatePath,
          error: error.message,
        });
      }

      if (message.includes("parse") || message.includes("syntax")) {
        return resultError({
          kind: "TemplateParseError",
          template: templatePath,
          error: error.message,
        });
      }
    }

    // Generic error fallback
    return resultError({
      kind: "ConfigurationError",
      message: `Unexpected error: ${String(error)}`,
    });
  }
}
