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
import { PromptVariablesFactory } from "../factory/PromptVariablesFactory.ts";
import { PromptAdapterValidator, ValidationResult } from "./prompt_adapter_validator.ts";

/**
 * PromptAdapterImpl
 * - PromptVariablesFactoryを受け取り、パスのバリデーションとプロンプト生成を担う
 * - 生成APIは validateAndGenerate のみ
 */
export class PromptAdapterImpl {
  private readonly factory: PromptVariablesFactory;
  private readonly logger?: {
    debug: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };

  /**
   * @param factory 必須: パス解決済みのファクトリ
   * @param logger 任意: デバッグ用ロガー
   */
  constructor(
    factory: PromptVariablesFactory,
    logger?: { debug: (...args: unknown[]) => void; error: (...args: unknown[]) => void },
  ) {
    this.factory = factory;
    this.logger = logger;
  }

  /**
   * Validates the existence and correctness of prompt and input file paths.
   * @returns { success, errors }
   */
  async validatePaths(): Promise<{ success: boolean; errors: string[] }> {
    const { promptFilePath, inputFilePath } = this.factory.getAllParams();
    const validator = new PromptAdapterValidator();
    const errors: string[] = [];
    // Validate prompt file
    const promptResult = await validator.validateFile(promptFilePath, "Prompt file");
    if (!promptResult.ok) {
      errors.push(`[${promptResult.error}] ${promptResult.message}`);
    }
    // Validate input file (if set)
    if (inputFilePath) {
      const inputResult = await validator.validateFile(inputFilePath, "Input file");
      if (!inputResult.ok) {
        errors.push(`[${inputResult.error}] ${inputResult.message}`);
      }
    }
    return { success: errors.length === 0, errors };
  }

  /**
   * Reads files and generates the prompt using PromptManager.
   * Assumes validation has already passed.
   * @returns { success, content }
   */
  async generatePrompt(): Promise<{ success: boolean; content: string }> {
    const { promptFilePath, inputFilePath, outputFilePath } = this.factory.getAllParams();
    // Read the template file content
    let template = "";
    try {
      template = await Deno.readTextFile(promptFilePath);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, content: `[ReadError] Failed to read template: ${msg}` };
    }
    // If template references {input_text}, try to read input file
    let inputText = "";
    if (template.includes("{input_text}") && inputFilePath) {
      try {
        inputText = await Deno.readTextFile(inputFilePath);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { success: false, content: `[ReadError] Failed to read input file: ${msg}` };
      }
    }
    const variables = {
      input_text_file: inputFilePath ? basename(inputFilePath) : "",
      input_text: inputText,
      destination_path: outputFilePath || "",
    };
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
      return { success: false, content: validation.errors.join("\n") };
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

  /**
   * Public method for test: validate output file only
   */
  public async validateOutputFile(): Promise<ValidationResult> {
    const { outputFilePath } = this.factory.getAllParams();
    const validator = new PromptAdapterValidator();
    return await validator.validateFile(outputFilePath, "Output file");
  }
}
