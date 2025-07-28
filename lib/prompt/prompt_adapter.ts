/**
 * PromptAdapter (Adapter Pattern) - Refactored for DDD
 *
 * This module now provides both the original implementation (for backward compatibility)
 * and a new domain-driven implementation with clear boundaries.
 *
 * Responsibilities:
 * - Bridge between legacy PromptVariablesProvider and new domain services
 * - Maintain backward compatibility while enabling migration to DDD patterns
 * - Delegate actual prompt generation to domain services
 */
import { PromptAdapterValidator, ValidationResult } from "./prompt_adapter_validator.ts";
import { VariablesBuilder } from "../builder/variables_builder.ts";
import type { PromptCliOptions } from "../factory/prompt_variables_factory.ts";
import { Result } from "../types/result.ts";
import {
  convertLegacyProvider,
  DomainPromptAdapter,
  type LegacyPromptVariablesProvider,
} from "./domain_prompt_adapter.ts";
import type { PromptError } from "../types/prompt_types.ts";

/**
 * Interface for providing prompt variables and configuration.
 * This abstraction allows for future migration to TotalityPromptVariablesFactory.
 */
/**
 * Type for parameters that may or may not have custom variables
 */
export type PromptParams =
  | {
    promptFilePath: string;
    inputFilePath: string;
    outputFilePath: string;
    schemaFilePath: string;
    customVariables: Record<string, string>;
  }
  | {
    promptFilePath: string;
    inputFilePath: string;
    outputFilePath: string;
    schemaFilePath: string;
    customVariables?: never;
  };

export interface PromptVariablesProvider {
  getAllParams(): PromptParams;
  getOptions(): PromptCliOptions;
  hasValidBaseDir(): boolean;
  getBaseDirError(): Result<void, string>;
  get customVariables(): Record<string, string>;
}

/**
 * Implementation of the PromptAdapter pattern for Breakdown.
 * Now delegates to DomainPromptAdapter for improved separation of concerns.
 */
export class PromptAdapterImpl {
  private readonly factory: PromptVariablesProvider;
  private readonly domainAdapter: DomainPromptAdapter;

  /**
   * Creates a new PromptAdapterImpl instance.
   * @param factory The PromptVariablesProvider with resolved paths and parameters.
   */
  constructor(factory: PromptVariablesProvider) {
    this.factory = factory;
    this.domainAdapter = new DomainPromptAdapter();
  }

  /**
   * Validates the existence and correctness of prompt and input file paths.
   * @returns { success, errors }
   */
  async validatePaths(): Promise<{ success: boolean; errors: string[] }> {
    const { context, validationContext } = convertLegacyProvider(
      this.factory as LegacyPromptVariablesProvider,
    );

    const result = await this.domainAdapter.validatePaths(context, validationContext);
    if (result.ok) {
      return { success: true, errors: [] };
    }

    // Convert PromptError to legacy error format
    const errorMessage = this.formatPromptError(result.error);
    return { success: false, errors: [errorMessage] };
  }

  /**
   * Format PromptError to legacy error message format
   */
  private formatPromptError(error: PromptError): string {
    switch (error.kind) {
      case "TemplateNotFound": {
        let message = `[TemplateNotFound] Template not found: ${error.path}`;
        if (error.workingDir) {
          message += ` (working_dir: ${error.workingDir})`;
        }
        if (error.attemptedPaths && error.attemptedPaths.length > 0) {
          message += `\nAttempted paths: ${error.attemptedPaths.join(", ")}`;
        }
        return message;
      }
      case "InvalidPath":
        return `[InvalidPath] ${error.message}`;
      case "ConfigurationError":
        return `[ConfigurationError] ${error.message}`;
      case "InvalidVariables":
        return `[InvalidVariables] ${error.details.join(", ")}`;
      default:
        return `[${error.kind}] ${JSON.stringify(error)}`;
    }
  }

  /**
   * Builds variables using VariablesBuilder for type-safe construction.
   * @param inputText The input text content (from stdin or file)
   * @returns Built variables in Record format
   */
  private buildVariables(inputText: string): Record<string, string> {
    const { inputFilePath, outputFilePath, schemaFilePath } = this.factory.getAllParams();
    const builder = new VariablesBuilder();

    // Add standard variables
    if (inputFilePath) {
      builder.addStandardVariable("input_text_file", inputFilePath);
    }
    if (outputFilePath) {
      builder.addStandardVariable("destination_path", outputFilePath);
    }

    // Add file path variables
    if (schemaFilePath) {
      builder.addFilePathVariable("schema_file", schemaFilePath);
    }

    // Add stdin variable
    if (inputText) {
      builder.addStdinVariable(inputText);
    }

    // Add custom variables for template usage (without uv- prefix requirement)
    const customVariables = this.factory.customVariables;
    builder.addCustomVariables(customVariables);

    // Debug information in development
    if (Deno.env.get("DEBUG")) {
      console.debug(`Variables built: ${builder.getVariableCount()} variables`);
      console.debug(`Has input_text: ${builder.hasVariable("input_text")}`);
      console.debug(`Has schema_file: ${builder.hasVariable("schema_file")}`);
    }

    return builder.toTemplateRecord();
  }

  /**
   * Reads files and generates the prompt using domain service.
   * Assumes validation has already passed.
   * @returns { success, content }
   */
  async generatePrompt(): Promise<{ success: boolean; content: string }> {
    const { context } = convertLegacyProvider(this.factory as LegacyPromptVariablesProvider);

    const result = await this.domainAdapter.generatePrompt(context);
    if (result.ok) {
      return { success: true, content: result.data.content };
    }

    // Convert PromptError to legacy error format
    const errorMessage = this.formatPromptError(result.error);
    return { success: false, content: errorMessage };
  }

  /**
   * Validates paths and generates the prompt if validation passes.
   * @returns { success, content }
   */
  async validateAndGenerate(): Promise<{ success: boolean; content: string }> {
    const { context, validationContext } = convertLegacyProvider(
      this.factory as LegacyPromptVariablesProvider,
    );

    const result = await this.domainAdapter.validateAndGenerate(context, validationContext);
    if (result.ok) {
      return { success: true, content: result.data.content };
    }

    // Convert PromptError to legacy error format
    const errorMessage = this.formatPromptError(result.error);
    return { success: false, content: errorMessage };
  }

  /**
   * Public method for test: validate input file only
   */
  public async validateInputFile(): Promise<ValidationResult> {
    const { inputFilePath } = this.factory.getAllParams();
    const validator = new PromptAdapterValidator();
    return await validator.validateFile(inputFilePath, "Input file");
  }
}

// Export type alias for architectural consistency
export type PromptAdapter = PromptAdapterImpl;
