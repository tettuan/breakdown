import { PromptVariablesFactory } from "../factory/prompt_variables_factory.ts";
import { dirname } from "@std/path";
import { existsSync } from "@std/fs";

/**
 * Error types for prompt file generation.
 * Used to categorize errors encountered during prompt file generation.
 */
export enum PromptFileErrorType {
  InputFileNotFound = "InputFileNotFound",
  PromptDirNotFound = "PromptDirNotFound",
  PromptFileNotFound = "PromptFileNotFound",
  Unknown = "Unknown",
}

/**
 * Generates prompt files using templates and validates input/output paths.
 */
export class PromptFileGenerator {
  /**
   * Validates that the input file exists at the given path.
   * @param path The file path to validate.
   * @returns A promise that resolves if the file exists, or throws an error if not.
   */
  validateInputFile(path: string): Promise<void> {
    return Deno.stat(path).then(() => {}, () => {
      throw new Error(`No such file: ${path}`);
    });
  }

  /**
   * Main API: Generates a file using a prompt template.
   *
   * @param fromFile The source file path.
   * @param toFile The destination file path.
   * @param format The format to use for the prompt.
   * @param _force Whether to overwrite the destination file if it exists.
   * @param options Additional options for prompt generation.
   * @returns An object indicating success, output, and error details.
   */
  async generateWithPrompt(
    fromFile: string,
    toFile: string,
    format: string,
    _force = false,
    options?: { adaptation?: string; promptDir?: string; demonstrativeType?: string },
  ): Promise<{ success: boolean; output: string; error: unknown }> {
    if (fromFile === "-") {
      return {
        success: false,
        output: "",
        error: {
          type: PromptFileErrorType.InputFileNotFound,
          message: `Input file is stdin ('-'), which is not supported. [file: -]`,
        },
      };
    }
    const cliParams = {
      demonstrativeType:
        (options?.demonstrativeType || "to") as import("../types/mod.ts").DemonstrativeType,
      layerType: format as import("../types/mod.ts").LayerType,
      options: {
        fromFile,
        destinationFile: toFile,
        adaptation: options?.adaptation,
      },
    };
    const factory = await PromptVariablesFactory.create(cliParams);
    factory.validateAll();
    const { promptFilePath, inputFilePath } = factory.getAllParams();
    // 3. 入力ファイル存在チェック（先に判定）
    try {
      await this.validateInputFile(inputFilePath);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("No such file")) {
        return {
          success: false,
          output: "",
          error: {
            type: PromptFileErrorType.InputFileNotFound,
            message: `Input file not found: ${inputFilePath}`,
          },
        };
      }
      return {
        success: false,
        output: "",
        error: {
          type: PromptFileErrorType.Unknown,
          message: `Unknown error while checking input file: ${inputFilePath} - ${e}`,
        },
      };
    }
    // 4. テンプレートファイル存在チェック
    const promptDir = dirname(promptFilePath);
    if (!existsSync(promptDir)) {
      return {
        success: false,
        output: "",
        error: {
          type: PromptFileErrorType.PromptDirNotFound,
          message: `Prompt directory not found: ${promptDir}`,
        },
      };
    }
    if (!existsSync(promptFilePath)) {
      return {
        success: false,
        output: "",
        error: {
          type: PromptFileErrorType.PromptFileNotFound,
          message: `Prompt template file not found: ${promptFilePath}`,
        },
      };
    }
    // 6. テンプレート処理
    const { PromptAdapterImpl } = await import("../prompt/prompt_adapter.ts");
    const adapter = new PromptAdapterImpl(factory);
    const result = await adapter.validateAndGenerate();
    if (result.success) {
      return {
        success: true,
        output: result.content,
        error: null,
      };
    } else {
      return {
        success: false,
        output: "",
        error: {
          type: PromptFileErrorType.Unknown,
          message: result.content,
        },
      };
    }
  }
}
