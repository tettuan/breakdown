/**
 * @fileoverview Adapter for PromptManager following Totality principle
 *
 * This module provides an adapter for the BreakdownPrompt package,
 * converting abstract types to concrete implementations while maintaining
 * type safety and explicit error handling.
 *
 * @module prompt/prompt_manageradapter
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
  /** Use internal variable replacement instead of external package */
  useInternalReplacement?: boolean;
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
  private readonly useInternalReplacement: boolean;

  constructor(config: PromptManagerAdapterConfig = {}) {
    this.promptManager = config && "promptManager" in config && config.promptManager !== undefined
      ? config.promptManager
      : new PromptManager();
    this.debug = config && "debug" in config && config.debug !== undefined ? config.debug : false;
    this.templateDir = config && "templateDir" in config && config.templateDir !== undefined
      ? config.templateDir
      : undefined;
    this.useInternalReplacement =
      config && "useInternalReplacement" in config && config.useInternalReplacement !== undefined
        ? config.useInternalReplacement
        : false;
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

      // Use internal replacement or external package
      const content = this.useInternalReplacement
        ? await this.generatePromptInternally(templatePath, variableDict)
        : await this.promptManager.generatePrompt(templatePath, variableDict);

      // Debug output to investigate the content type
      if (this.debug || Deno.env.get("LOG_LEVEL") === "debug") {
        console.log("[PromptManagerAdapter] Input variables:", variableDict);
        console.log("[PromptManagerAdapter] Template path:", templatePath);
        console.debug("PromptManager returned content:", {
          type: typeof content,
          content: content,
          isString: typeof content === "string",
          toString: String(content),
        });
      }

      // Handle BreakdownPrompt response format
      // BreakdownPrompt returns an object with success/error status
      if (content && typeof content === "object") {
        const responseObj = content as {
          success?: boolean;
          error?: string;
          templatePath?: string;
          content?: string;
          variables?: {
            detected?: string[];
            replaced?: string[];
            remaining?: string[];
          };
        };

        // If BreakdownPrompt returns an error object instead of throwing
        if (responseObj.success === false && responseObj.error) {
          const errorMessage = responseObj.error;

          if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
            return resultError({
              kind: "TemplateNotFound",
              path: responseObj.templatePath || templatePath,
              workingDir: Deno.cwd(),
            });
          }

          if (errorMessage.includes("variable") || errorMessage.includes("undefined")) {
            return resultError({
              kind: "InvalidVariables",
              details: [errorMessage],
            });
          }

          // Generic error fallback
          return resultError({
            kind: "ConfigurationError",
            message: errorMessage,
          });
        }

        // Handle successful response
        if (responseObj.success === true && responseObj.content) {
          // Debug: Check if variables were replaced
          if (this.debug || Deno.env.get("LOG_LEVEL") === "debug") {
            console.debug("PromptManager variable replacement info:", {
              detected: responseObj.variables?.detected || [],
              replaced: responseObj.variables?.replaced || [],
              remaining: responseObj.variables?.remaining || [],
            });
          }

          // Use the content from the successful response
          const stringContent = responseObj.content;

          // Create result
          const promptResult: PromptResult = {
            content: stringContent,
            metadata: {
              template: templatePath,
              variables: variableDict,
              timestamp: new Date(),
            },
          };

          return resultOk(promptResult);
        }
      }

      // Fallback for unexpected response format
      let stringContent: string;
      if (typeof content === "string") {
        stringContent = content;
      } else if (content && typeof content === "object" && "toString" in content) {
        stringContent = content.toString();
      } else if (content && typeof content === "object") {
        stringContent = JSON.stringify(content, null, 2);
      } else {
        stringContent = String(content);
      }

      const promptResult: PromptResult = {
        content: stringContent,
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
      } catch {
        return resultError({
          kind: "TemplateNotFound",
          path: templatePath,
          workingDir: Deno.cwd(),
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
    // and contain only letters, numbers, underscores, and hyphens
    // Special case: allow "uv-" prefix for user variables
    if (name.startsWith("uv-")) {
      // After "uv-", allow letters, numbers, underscores, and hyphens
      return /^uv-[a-zA-Z0-9_-]+$/.test(name);
    }
    // Standard variables: start with letter or underscore, contain letters, numbers, and underscores
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  }

  /**
   * Internal variable replacement implementation
   *
   * @param templatePath - Path to the template file
   * @param variables - Variables to replace in the template
   * @returns Promise<string> The processed template content
   */
  private async generatePromptInternally(
    templatePath: string,
    variables: Record<string, string>,
  ): Promise<string> {
    try {
      // Read template file
      const templateContent = await Deno.readTextFile(templatePath);

      if (this.debug) {
        console.debug("Internal replacement - Template loaded:", {
          path: templatePath,
          contentLength: templateContent.length,
          variables: Object.keys(variables),
        });
      }

      // Replace variables using the internal logic
      const processedContent = this.replaceVariables(templateContent, variables);

      if (this.debug) {
        console.debug("Internal replacement - Variables replaced:", {
          originalLength: templateContent.length,
          processedLength: processedContent.length,
        });
      }

      return processedContent;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new Error(`Template not found: ${templatePath}`);
      }
      throw error;
    }
  }

  /**
   * Replace variables in template content
   *
   * Supports multiple variable formats:
   * - {{variable_name}} - Standard handlebars-style
   * - ${variable_name} - Shell-style
   * - {variable_name} - Simple brace format
   *
   * @param content - Template content
   * @param variables - Variables to replace
   * @returns Processed content with variables replaced
   */
  private replaceVariables(
    content: string,
    variables: Record<string, string>,
  ): string {
    let result = content;

    // Track variable usage for debugging
    const usedVariables: string[] = [];
    const remainingVariables = new Set(Object.keys(variables));

    // Replace handlebars-style variables {{variable_name}}
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();
      if (trimmedName in variables) {
        usedVariables.push(trimmedName);
        remainingVariables.delete(trimmedName);
        return variables[trimmedName];
      }
      return match; // Keep original if variable not found
    });

    // Replace shell-style variables ${variable_name}
    result = result.replace(/\$\{([^}]+)\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();
      if (trimmedName in variables) {
        usedVariables.push(trimmedName);
        remainingVariables.delete(trimmedName);
        return variables[trimmedName];
      }
      return match; // Keep original if variable not found
    });

    // Replace simple brace variables {variable_name}
    result = result.replace(/\{([^{}]+)\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();
      if (trimmedName in variables) {
        usedVariables.push(trimmedName);
        remainingVariables.delete(trimmedName);
        return variables[trimmedName];
      }
      return match; // Keep original if variable not found
    });

    if (this.debug) {
      console.debug("Internal replacement - Variable usage:", {
        usedVariables: [...new Set(usedVariables)],
        remainingVariables: [...remainingVariables],
      });
    }

    return result;
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
          workingDir: Deno.cwd(),
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
