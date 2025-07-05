/**
 * @fileoverview New Unified PromptManagerAdapter following Totality principle
 *
 * This module provides the unified adapter for prompt management, integrating
 * the existing PromptManagerAdapter with the factory patterns while eliminating
 * the structural conflicts identified in draft analysis.
 *
 * Key improvements:
 * - Eliminates PromptCliParams vs PromptPath/PromptVariables conflict
 * - Provides unified interface using Adapter Pattern + Factory Method
 * - Maintains backward compatibility during migration
 * - Follows Totality principle throughout
 *
 * @module prompt/new_prompt_manageradapter
 */

import { PromptManager } from "@tettuan/breakdownprompt";
import { error as resultError, ok as resultOk, Result } from "../types/result.ts";
import {
  PromptError,
  PromptPath,
  PromptResult,
  PromptVariables as PromptVariablesInterface,
} from "../types/prompt_types.ts";
import {
  FilePathVariable,
  PromptVariable,
  StandardVariable,
  StdinVariable,
  UserVariable,
} from "../types/prompt_variables.ts";
import type { VariableError } from "../types/variable_result.ts";
import type {
  PromptCliParams,
  TotalityPromptCliParams,
} from "../factory/prompt_variables_factory.ts";

/**
 * Configuration options for New PromptManagerAdapter
 */
export interface NewPromptManagerAdapterConfig {
  /** Custom PromptManager instance */
  promptManager?: PromptManager;
  /** Enable detailed logging */
  debug?: boolean;
  /** Custom template directory */
  templateDir?: string;
  /** Profile name for configuration */
  profile?: string;
}

/**
 * Composite PromptVariables implementation following Duck Typing
 *
 * Combines multiple PromptVariable instances into a unified collection
 * that implements the PromptVariables interface through toRecord().
 */
export class CompositePromptVariables implements PromptVariablesInterface {
  constructor(private variables: PromptVariable[] = []) {}

  /**
   * Add a variable to the collection
   */
  addVariable(variable: PromptVariable): void {
    this.variables.push(variable);
  }

  /**
   * Add a standard variable (input_text_file, destination_path, etc.)
   */
  addStandardVariable(name: string, value: string): Result<void, PromptError> {
    const variableResult = StandardVariable.create(name, value);
    if (!variableResult.ok) {
      return resultError({
        kind: "InvalidVariables",
        details: [this.formatVariableError(variableResult.error)],
      });
    }
    this.addVariable(variableResult.data);
    return resultOk(undefined);
  }

  /**
   * Add a file path variable (schema_file)
   */
  addFilePathVariable(name: string, value: string): Result<void, PromptError> {
    const variableResult = FilePathVariable.create(name, value);
    if (!variableResult.ok) {
      return resultError({
        kind: "InvalidVariables",
        details: [this.formatVariableError(variableResult.error)],
      });
    }
    this.addVariable(variableResult.data);
    return resultOk(undefined);
  }

  /**
   * Add a stdin variable (input_text)
   */
  addStdinVariable(name: string, value: string): Result<void, PromptError> {
    const variableResult = StdinVariable.create(name, value);
    if (!variableResult.ok) {
      return resultError({
        kind: "InvalidVariables",
        details: [this.formatVariableError(variableResult.error)],
      });
    }
    this.addVariable(variableResult.data);
    return resultOk(undefined);
  }

  /**
   * Add a user variable (--uv-* options)
   */
  addUserVariable(name: string, value: string): Result<void, PromptError> {
    const variableResult = UserVariable.create(name, value);
    if (!variableResult.ok) {
      return resultError({
        kind: "InvalidVariables",
        details: [this.formatVariableError(variableResult.error)],
      });
    }
    this.addVariable(variableResult.data);
    return resultOk(undefined);
  }

  /**
   * Convert to Record format for Duck Typing compatibility
   */
  toRecord(): Record<string, string> {
    const record: Record<string, string> = {};
    for (const variable of this.variables) {
      record[variable.name as string] = variable.value;
    }
    return record;
  }

  /**
   * Get all variables in the collection
   */
  getVariables(): PromptVariable[] {
    return [...this.variables];
  }

  /**
   * Check if collection is empty
   */
  isEmpty(): boolean {
    return this.variables.length === 0;
  }

  /**
   * Format VariableError into string message
   */
  private formatVariableError(error: VariableError): string {
    switch (error.kind) {
      case "InvalidName":
        return `Invalid variable name "${error.name}". Valid names: ${error.validNames.join(", ")}`;
      case "EmptyValue":
        return `Empty value for variable "${error.variableName}": ${error.reason}`;
      case "ValidationFailed":
        return `Validation failed for value "${error.value}": ${error.constraint}`;
      default:
        return "Unknown variable error";
    }
  }
}

/**
 * New Unified PromptManagerAdapter
 *
 * Provides a unified interface that eliminates the structural conflicts
 * between PromptCliParams and PromptPath/PromptVariables approaches.
 * Uses Adapter Pattern + Factory Method as recommended in draft analysis.
 *
 * @example Basic usage with PromptPath and PromptVariables
 * ```typescript
 * const adapter = new NewPromptManagerAdapter();
 * const pathResult = PromptPath.create("template.md");
 * const variables = new CompositePromptVariables();
 * variables.addStandardVariable("input_text_file", "/path/to/file");
 *
 * if (pathResult.ok) {
 *   const result = await adapter.generatePrompt(pathResult.data, variables);
 *   if (result.ok) {
 *     console.log(result.data.content);
 *   }
 * }
 * ```
 *
 * @example Migration from legacy PromptCliParams
 * ```typescript
 * const adapter = new NewPromptManagerAdapter();
 * const legacyParams: PromptCliParams = {
 *   demonstrativeType: "to",
 *   layerType: "project",
 *   options: { fromFile: "input.md" }
 * };
 *
 * const result = await adapter.generatePromptFromLegacyParams(legacyParams);
 * ```
 *
 * @example Using with Totality-compliant types
 * ```typescript
 * const adapter = new NewPromptManagerAdapter();
 * const totalityParams: TotalityPromptCliParams = {
 *   directive: DirectiveType.create("to"),
 *   layer: LayerType.create("project"),
 *   options: {}
 * };
 *
 * const result = await adapter.generatePromptFromTotalityParams(totalityParams);
 * ```
 */
export class NewPromptManagerAdapter {
  private readonly promptManager: PromptManager;
  private readonly debug: boolean;
  private readonly templateDir?: string;
  private readonly profile?: string;

  constructor(config?: NewPromptManagerAdapterConfig) {
    this.promptManager = config?.promptManager ?? new PromptManager();
    this.debug = config?.debug ?? false;
    this.templateDir = config?.templateDir;
    this.profile = config?.profile;
  }

  /**
   * Generate a prompt from PromptPath and PromptVariables (new approach)
   *
   * This is the primary method that follows the draft analysis recommendation
   * for unified prompt generation using abstract types.
   *
   * @param template - The prompt template path
   * @param variables - Variables to replace in the template
   * @returns Result containing generated prompt or error
   */
  async generatePrompt(
    template: PromptPath,
    variables: PromptVariablesInterface,
  ): Promise<Result<PromptResult, PromptError>> {
    try {
      // Convert abstract types using Duck Typing pattern
      const templatePath = this.resolveTemplatePath(template);
      const variableDict = variables.toRecord();

      if (this.debug) {
        console.debug("New PromptManagerAdapter: Generating prompt:", {
          template: templatePath,
          variables: Object.keys(variableDict),
          profile: this.profile,
        });
      }

      // Validate variables before processing
      const validationResult = this.validateVariables(variableDict);
      if (!validationResult.ok) {
        return validationResult;
      }

      // Call BreakdownPrompt API directly
      const content = await this.promptManager.generatePrompt(
        templatePath,
        variableDict,
      );

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
      return this.handleError(error, template.toString());
    }
  }

  /**
   * Generate prompt with profile support (enhanced version)
   *
   * @param profile - Profile name to use
   * @param template - The prompt template path
   * @param variables - Variables to replace in the template
   * @returns Result containing generated prompt or error
   */
  async generatePromptWithProfile(
    profile: string,
    template: PromptPath,
    variables: PromptVariablesInterface,
  ): Promise<Result<PromptResult, PromptError>> {
    try {
      // Create new adapter instance with profile configuration
      const profiledAdapter = new NewPromptManagerAdapter({
        promptManager: this.promptManager,
        debug: this.debug,
        templateDir: this.templateDir,
        profile: profile,
      });

      return await profiledAdapter.generatePrompt(template, variables);
    } catch (error) {
      return resultError({
        kind: "ConfigurationError",
        message: `Failed to apply profile '${profile}': ${String(error)}`,
      });
    }
  }

  /**
   * Migration method: Generate prompt from legacy PromptCliParams
   *
   * This method provides backward compatibility during the migration
   * from PromptCliParams to PromptPath/PromptVariables approach.
   *
   * @deprecated Use generatePrompt() with PromptPath and PromptVariables instead
   * @param params - Legacy CLI parameters
   * @returns Result containing generated prompt or error
   */
  async generatePromptFromLegacyParams(
    params: PromptCliParams,
  ): Promise<Result<PromptResult, PromptError>> {
    try {
      // Convert legacy params to new format
      const conversionResult = this.convertLegacyParams(params);
      if (!conversionResult.ok) {
        return conversionResult;
      }

      const { template, variables } = conversionResult.data;
      return await this.generatePrompt(template, variables);
    } catch (error) {
      return this.handleError(error, "legacy-conversion");
    }
  }

  /**
   * Migration method: Generate prompt from Totality-compliant params
   *
   * @param params - Totality-compliant CLI parameters
   * @returns Result containing generated prompt or error
   */
  async generatePromptFromTotalityParams(
    params: TotalityPromptCliParams,
  ): Promise<Result<PromptResult, PromptError>> {
    try {
      // Convert Totality params to new format
      const conversionResult = this.convertTotalityParams(params);
      if (!conversionResult.ok) {
        return conversionResult;
      }

      const { template, variables } = conversionResult.data;
      return await this.generatePrompt(template, variables);
    } catch (error) {
      return this.handleError(error, "totality-conversion");
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

      // Use empty variables for validation
      const emptyVariables = new CompositePromptVariables();

      try {
        await this.promptManager.generatePrompt(templatePath, emptyVariables.toRecord());
        return resultOk(true);
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("not found") || error.message.includes("does not exist"))
        ) {
          return resultError({
            kind: "TemplateNotFound",
            path: templatePath,
          });
        }
        // Other errors (like missing variables) still indicate template exists
        return resultOk(true);
      }
    } catch (error) {
      return resultError({
        kind: "ConfigurationError",
        message: `Failed to validate template: ${String(error)}`,
      });
    }
  }

  /**
   * Convert legacy PromptCliParams to new format
   */
  private convertLegacyParams(
    params: PromptCliParams,
  ): Result<{ template: PromptPath; variables: CompositePromptVariables }, PromptError> {
    try {
      // Build template path from demonstrativeType and layerType
      const templateName = `${params.demonstrativeType}/${params.layerType}.md`;
      const templateResult = PromptPath.create(templateName);
      if (!templateResult.ok) {
        return resultError({
          kind: "InvalidPath",
          message: templateResult.error.message,
        });
      }

      // Convert options to variables
      const variables = new CompositePromptVariables();
      const options = params.options;

      // Add standard variables
      if (options.fromFile) {
        const result = variables.addStandardVariable("input_text_file", options.fromFile);
        if (!result.ok) return result;
      }

      if (options.destinationFile) {
        const result = variables.addStandardVariable("destination_path", options.destinationFile);
        if (!result.ok) return result;
      }

      // Add demonstrative type and layer type as standard variables
      const demoResult = variables.addStandardVariable(
        "demonstrative_type",
        params.demonstrativeType,
      );
      if (!demoResult.ok) return demoResult;

      const layerResult = variables.addStandardVariable("layer_type", params.layerType);
      if (!layerResult.ok) return layerResult;

      // Add stdin content if available
      if (options.input_text) {
        const result = variables.addStdinVariable("input_text", options.input_text);
        if (!result.ok) return result;
      }

      // Add custom variables
      if (options.customVariables) {
        for (const [name, value] of Object.entries(options.customVariables)) {
          const result = variables.addUserVariable(name, value);
          if (!result.ok) return result;
        }
      }

      return resultOk({
        template: templateResult.data,
        variables,
      });
    } catch (error) {
      return resultError({
        kind: "ConfigurationError",
        message: `Legacy parameter conversion failed: ${String(error)}`,
      });
    }
  }

  /**
   * Convert Totality-compliant params to new format
   */
  private convertTotalityParams(
    params: TotalityPromptCliParams,
  ): Result<{ template: PromptPath; variables: CompositePromptVariables }, PromptError> {
    try {
      // Build template path from validated types
      const templateName = `${params.directive.value}/${params.layer.value}.md`;
      const templateResult = PromptPath.create(templateName);
      if (!templateResult.ok) {
        return resultError({
          kind: "InvalidPath",
          message: templateResult.error.message,
        });
      }

      // Convert options to variables (similar to legacy conversion)
      const variables = new CompositePromptVariables();
      const options = params.options;

      // Add standard variables from Totality types
      const demoResult = variables.addStandardVariable(
        "demonstrative_type",
        params.directive.value,
      );
      if (!demoResult.ok) return demoResult;

      const layerResult = variables.addStandardVariable("layer_type", params.layer.value);
      if (!layerResult.ok) return layerResult;

      // Add file variables
      if (options.fromFile) {
        const result = variables.addStandardVariable("input_text_file", options.fromFile);
        if (!result.ok) return result;
      }

      if (options.destinationFile) {
        const result = variables.addStandardVariable("destination_path", options.destinationFile);
        if (!result.ok) return result;
      }

      // Add stdin content
      if (options.input_text) {
        const result = variables.addStdinVariable("input_text", options.input_text);
        if (!result.ok) return result;
      }

      // Add custom variables
      if (options.customVariables) {
        for (const [name, value] of Object.entries(options.customVariables)) {
          const result = variables.addUserVariable(name, value);
          if (!result.ok) return result;
        }
      }

      return resultOk({
        template: templateResult.data,
        variables,
      });
    } catch (error) {
      return resultError({
        kind: "ConfigurationError",
        message: `Totality parameter conversion failed: ${String(error)}`,
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
   * Validate variables dictionary (enhanced version)
   */
  private validateVariables(
    variables: Record<string, string>,
  ): Result<true, PromptError> {
    const errors: string[] = [];

    // Note: Empty variables are now allowed for templates that don't require variables

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
   * Handle errors from PromptManager (enhanced version)
   */
  private handleError(
    error: unknown,
    context: string,
  ): Result<PromptResult, PromptError> {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("not found") || message.includes("does not exist")) {
        return resultError({
          kind: "TemplateNotFound",
          path: context,
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
          schema: context,
          error: error.message,
        });
      }

      if (message.includes("parse") || message.includes("syntax")) {
        return resultError({
          kind: "TemplateParseError",
          template: context,
          error: error.message,
        });
      }
    }

    // Generic error fallback
    return resultError({
      kind: "ConfigurationError",
      message: `Unexpected error in ${context}: ${String(error)}`,
    });
  }
}

/**
 * Utility function to create CompositePromptVariables from factory data
 *
 * This utility helps migrate from factory-based variable construction
 * to the new CompositePromptVariables approach.
 *
 * @param factoryData - Data from PromptVariablesFactory
 * @returns Result containing CompositePromptVariables or error
 */
export function createVariablesFromFactory(factoryData: {
  inputFilePath?: string;
  outputFilePath?: string;
  schemaFilePath?: string;
  customVariables?: Record<string, string>;
  [key: string]: unknown;
}): Result<CompositePromptVariables, PromptError> {
  try {
    const variables = new CompositePromptVariables();

    // Add standard variables
    if (factoryData.inputFilePath) {
      const result = variables.addStandardVariable("input_text_file", factoryData.inputFilePath);
      if (!result.ok) return result;
    }

    if (factoryData.outputFilePath) {
      const result = variables.addStandardVariable("destination_path", factoryData.outputFilePath);
      if (!result.ok) return result;
    }

    // Add schema file as file path variable
    if (factoryData.schemaFilePath) {
      const result = variables.addFilePathVariable("schema_file", factoryData.schemaFilePath);
      if (!result.ok) return result;
    }

    // Add custom variables
    if (factoryData.customVariables) {
      for (const [name, value] of Object.entries(factoryData.customVariables)) {
        const result = variables.addUserVariable(name, value);
        if (!result.ok) return result;
      }
    }

    return resultOk(variables);
  } catch (error) {
    return resultError({
      kind: "ConfigurationError",
      message: `Factory data conversion failed: ${String(error)}`,
    });
  }
}
