/**
 * PromptAdapter (Adapter Pattern)
 *
 * Responsibilities:
 * - Receives resolved values (paths, parameters) from PromptTemplatePathResolver or similar resolvers
 * - Delegates validation of these values to PromptAdapterValidator
 * - Handles error processing if validation fails (returns error result as value)
 * - On successful validation, passes values to PromptManager for prompt generation
 * - Acts as an Adapter to bridge path/parameter resolution and prompt processing logic
 *
 * This design ensures clear separation of concerns:
 * - Path/parameter resolution is handled by resolvers (e.g., PromptTemplatePathResolver)
 * - Validation logic is centralized in PromptAdapterValidator
 * - PromptManager is only responsible for template processing
 * - Adapter coordinates the flow and error handling between these components
 */
import { PromptManager } from "jsr:@tettuan/breakdownprompt@1.1.2";
import { basename } from "@std/path/basename";
import { PromptVariablesFactory } from "../factory/prompt_variables_factory.ts";
import { PromptAdapterValidator, ValidationResult } from "./prompt_adapter_validator.ts";
import { VariablesBuilder } from "../builder/variables_builder.ts";
import type { PromptCliOptions } from "../factory/prompt_variables_factory.ts";

/**
 * Interface for providing prompt variables and configuration.
 * This abstraction allows for future migration to TotalityPromptVariablesFactory.
 */
export interface PromptVariablesProvider {
  getAllParams(): {
    promptFilePath: string;
    inputFilePath: string;
    outputFilePath: string;
    schemaFilePath: string;
    customVariables?: Record<string, string>;
  };
  getOptions(): PromptCliOptions;
  hasValidBaseDir(): boolean;
  getBaseDirError(): string | undefined;
  get customVariables(): Record<string, string>;
}

/**
 * Implementation of the PromptAdapter pattern for Breakdown.
 * Receives a PromptVariablesProvider and provides prompt validation and generation APIs.
 */
export class PromptAdapterImpl {
  private readonly factory: PromptVariablesProvider;

  /**
   * Creates a new PromptAdapterImpl instance.
   * @param factory The PromptVariablesProvider with resolved paths and parameters.
   */
  constructor(factory: PromptVariablesProvider) {
    this.factory = factory;
  }

  /**
   * Validates the existence and correctness of prompt and input file paths.
   * @returns { success, errors }
   */
  async validatePaths(): Promise<{ success: boolean; errors: string[] }> {
    const { promptFilePath, inputFilePath } = this.factory.getAllParams();
    const _validator = new PromptAdapterValidator();
    const errors: string[] = [];
    // Validate prompt file
    const promptResult = await _validator.validateFile(promptFilePath, "Prompt file");
    if (!promptResult.ok) {
      errors.push(`[${promptResult.error}] ${promptResult.message}`);
    }
    // Validate input file (if set and not stdin)
    if (inputFilePath && inputFilePath !== "-") {
      const inputResult = await _validator.validateFile(inputFilePath, "Input file");
      if (!inputResult.ok) {
        errors.push(`[${inputResult.error}] ${inputResult.message}`);
      }
    }
    return { success: errors.length === 0, errors };
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
      builder.addStandardVariable("input_text_file", basename(inputFilePath));
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
   * Reads files and generates the prompt using PromptManager.
   * Assumes validation has already passed.
   * @returns { success, content }
   */
  async generatePrompt(): Promise<{ success: boolean; content: string }> {
    const { promptFilePath, inputFilePath } = this.factory.getAllParams();
    // Read the template file content
    let template = "";
    try {
      template = await Deno.readTextFile(promptFilePath);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, content: `[ReadError] Failed to read template: ${msg}` };
    }
    // Get input text from stdin or file
    let inputText = "";
    if (template.includes("{input_text}")) {
      // First try to get input_text from options (stdin)
      const options = this.factory.getOptions();
      if (options?.input_text) {
        inputText = options.input_text;
      } else if (inputFilePath) {
        // Fall back to reading from file
        try {
          inputText = await Deno.readTextFile(inputFilePath);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return { success: false, content: `[ReadError] Failed to read input file: ${msg}` };
        }
      }
    }
    // Build variables using separated method
    const variables = this.buildVariables(inputText);

    const prompt = new PromptManager();
    const genResult = await prompt.generatePrompt(template, variables);
    if (genResult && typeof genResult === "object" && "success" in genResult) {
      if (genResult.success) {
        return { success: true, content: genResult.prompt ?? "" };
      } else {
        return { success: false, content: genResult.error ?? "" };
      }
    }
    return { success: true, content: String(genResult) };
  }

  /**
   * Validates paths and generates the prompt if validation passes.
   * @returns { success, content }
   */
  async validateAndGenerate(): Promise<{ success: boolean; content: string }> {
    if (!this.factory.hasValidBaseDir()) {
      return {
        success: false,
        content: this.factory.getBaseDirError() ?? "Prompt base_dir must be set",
      };
    }
    const validation = await this.validatePaths();
    if (!validation.success) {
      return {
        success: false,
        content: validation.errors.reduce((acc, err, i) => acc + (i > 0 ? "\n" : "") + err, ""),
      };
    }
    return await this.generatePrompt();
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
