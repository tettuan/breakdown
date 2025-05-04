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
import { PromptManager } from "../deps.ts";
import { join, normalize } from "@std/path";
import { exists } from "@std/fs";
import { basename } from "@std/path/basename";
import { CliError, CliErrorCode } from "../cli/errors.ts";
import { PromptVariablesFactory } from "../factory/PromptVariablesFactory.ts";
import { PromptAdapterValidator, ValidationResult } from "./prompt_adapter_validator.ts";

/**
 * PromptAdapterImpl
 * - PromptVariablesFactoryを受け取り、パスのバリデーションとプロンプト生成を担う
 * - 生成APIは validateAndGenerate のみ
 */
export class PromptAdapterImpl {
  private readonly factory: PromptVariablesFactory;
  private readonly logger?: { debug: (...args: unknown[]) => void; error: (...args: unknown[]) => void };

  /**
   * @param factory 必須: パス解決済みのファクトリ
   * @param logger 任意: デバッグ用ロガー
   */
  constructor(factory: PromptVariablesFactory, logger?: { debug: (...args: unknown[]) => void; error: (...args: unknown[]) => void }) {
    this.factory = factory;
    this.logger = logger;
  }

  /**
   * パスの存在バリデーションとプロンプト生成
   * @returns { success, content }
   */
  async validateAndGenerate(): Promise<{ success: boolean; content: string }> {
    const { promptFilePath, inputFilePath, outputFilePath } = this.factory.getAllParams();
    const validator = new PromptAdapterValidator();
    // Promptファイルのバリデーション
    const promptResult = await validator.validateFile(promptFilePath, "Prompt file");
    if (!promptResult.ok) {
      return { success: false, content: `[${promptResult.error}] ${promptResult.message}` };
    }
    // Inputファイルのバリデーション（任意）
    if (inputFilePath) {
      const inputResult = await validator.validateFile(inputFilePath, "Input file");
      if (!inputResult.ok) {
        return { success: false, content: `[${inputResult.error}] ${inputResult.message}` };
      }
    }
    // outputFilePath: existence check is not required for output (usually written, not read)
    const variables = {
      input_text_file: inputFilePath ? basename(inputFilePath) : "",
      input_text: "",
      destination_path: outputFilePath || ""
    };
    const prompt = new PromptManager();
    const genResult = await prompt.generatePrompt("", variables);
    if (genResult && typeof genResult === "object" && "success" in genResult) {
      if (genResult.success) {
        return { success: true, content: genResult.prompt ?? "" };
      } else {
        return { success: false, content: genResult.error ?? "" };
      }
    }
    return { success: true, content: String(genResult) };
  }
}
