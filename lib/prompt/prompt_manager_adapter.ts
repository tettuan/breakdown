/**
 * @fileoverview Adapter for PromptManager following Totality principle
 *
 * This module provides an adapter for the BreakdownPrompt package,
 * converting abstract types to concrete implementations while maintaining
 * type safety and explicit error handling.
 *
 * @module prompt/prompt_manager_adapter
 */

import { PromptManager } from "@tettuan/breakdownprompt";
import { error as resultError, ok as resultOk, Result } from "../types/result.ts";
import { PromptError, PromptPath, PromptResult, PromptVariables } from "../types/prompt_types.ts";

/**
 * Configuration options for PromptManagerAdapter
 */
export interface PromptManagerAdapterConfig {
  /** Custom PromptManager instance */
  promptManager?: PromptManager;
  /** Enable detailed logging */
  debug?: boolean;
  /** Custom template directory */
  templateDir?: string;
}

/**
 * Adapter for PromptManager
 *
 * Provides a type-safe interface for prompt generation,
 * converting abstract types to concrete implementations.
 *
 * @example
 * ```typescript
 * const adapter = new PromptManagerAdapter();
 * const pathResult = PromptPath.create("template.md");
 * const variables = new MyVariables({ name: "test" });
 *
 * if (pathResult.ok) {
 *   const result = await adapter.generatePrompt(pathResult.data, variables);
 *   if (result.ok) {
 *     console.log(result.data.content);
 *   }
 * }
 * ```
 */
export class PromptManagerAdapter {
  private readonly promptManager: PromptManager;
  private readonly debug: boolean;
  private readonly templateDir?: string;

  constructor(config?: PromptManagerAdapterConfig) {
    this.promptManager = config?.promptManager ?? new PromptManager();
    this.debug = config?.debug ?? false;
    this.templateDir = config?.templateDir;
  }

  /**
   * Generate a prompt from template and variables
   *
   * @param template - The prompt template path
   * @param variables - Variables to replace in the template
   * @returns Result containing generated prompt or error
   */
  async generatePrompt(
    template: PromptPath,
    variables: PromptVariables,
  ): Promise<Result<PromptResult, PromptError>> {
    try {
      // Convert abstract types using Duck Typing
      const templatePath = this.resolveTemplatePath(template);
      const variableDict = variables.toRecord();

      if (this.debug) {
        console.debug("Generating prompt:", {
          template: templatePath,
          variables: Object.keys(variableDict),
        });
      }

      // Validate variables before processing
      const validationResult = this.validateVariables(variableDict);
      if (!validationResult.ok) {
        return validationResult;
      }

      // Call BreakdownPrompt API
      const content = await this.promptManager.generatePrompt(
        templatePath,
        variableDict,
      );

      const promptResult: PromptResult = {
        content: String(content), // Ensure content is a string
        metadata: {
          template: templatePath,
          variables: variableDict,
          timestamp: new Date(),
        },
      };

      return resultOk(promptResult);
    } catch (error) {
      return this.handleError(error, template.toString());
    }
  }

  /**
   * Generate prompt with profile support
   *
   * @param profile - Profile name to use
   * @param template - The prompt template path
   * @param variables - Variables to replace in the template
   * @returns Result containing generated prompt or error
   */
  async generatePromptWithProfile(
    profile: string,
    template: PromptPath,
    variables: PromptVariables,
  ): Promise<Result<PromptResult, PromptError>> {
    try {
      // Create new instance with profile configuration
      // Note: @tettuan/breakdownprompt doesn't support profile parameter yet
      // For now, we'll use the default instance
      const profiledManager = new PromptManager();
      const adapter = new PromptManagerAdapter({
        promptManager: profiledManager,
        debug: this.debug,
        templateDir: this.templateDir,
      });

      return await adapter.generatePrompt(template, variables);
    } catch (error) {
      return resultError({
        kind: "ConfigurationError",
        message: `Failed to apply profile '${profile}': ${String(error)}`,
      });
    }
  }

  /**
   * Validate template exists
   *
   * @param template - Template path to validate
   * @returns Result indicating if template exists
   */
  async validateTemplate(
    template: PromptPath,
  ): Promise<Result<boolean, PromptError>> {
    try {
      const templatePath = this.resolveTemplatePath(template);
      // Check if template exists by attempting to generate with empty variables
      // This is a workaround since templateExists is not available in @tettuan/breakdownprompt
      try {
        await this.promptManager.generatePrompt(templatePath, {});
        return resultOk(true);
      } catch (error) {
        return resultError({
          kind: "TemplateNotFound",
          path: templatePath,
        });
      }
    } catch (error) {
      return resultError({
        kind: "ConfigurationError",
        message: `Failed to validate template: ${String(error)}`,
      });
    }
  }

  /**
   * Resolve template path with directory prefix if configured
   */
  private resolveTemplatePath(template: PromptPath): string {
    const templateStr = template.toString();
    if (this.templateDir && !templateStr.startsWith("/")) {
      return `${this.templateDir}/${templateStr}`;
    }
    return templateStr;
  }

  /**
   * Validate variables dictionary
   */
  private validateVariables(
    variables: Record<string, string>,
  ): Result<true, PromptError> {
    const errors: string[] = [];

    // Check for empty variables
    if (Object.keys(variables).length === 0) {
      errors.push("No variables provided");
    }

    // Check for invalid variable names
    for (const key of Object.keys(variables)) {
      if (!this.isValidVariableName(key)) {
        errors.push(`Invalid variable name: ${key}`);
      }
    }

    // Check for null/undefined values
    for (const [key, value] of Object.entries(variables)) {
      if (value === null || value === undefined) {
        errors.push(`Variable '${key}' has null/undefined value`);
      }
    }

    if (errors.length > 0) {
      return resultError({
        kind: "InvalidVariables",
        details: errors,
      });
    }

    return resultOk(true);
  }

  /**
   * Check if variable name is valid
   */
  private isValidVariableName(name: string): boolean {
    // Variable names must start with letter or underscore
    // and contain only letters, numbers, and underscores
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  }

  /**
   * Handle errors from PromptManager
   */
  private handleError(
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
