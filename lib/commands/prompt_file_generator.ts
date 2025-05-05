import { PromptVariablesFactory } from "../factory/prompt_variables_factory.ts";
import { dirname } from "@std/path";
import { existsSync } from "@std/fs";

/**
 * Error types for prompt file generation
 */
export enum PromptFileErrorType {
  InputFileNotFound = "InputFileNotFound",
  PromptDirNotFound = "PromptDirNotFound",
  PromptFileNotFound = "PromptFileNotFound",
  Unknown = "Unknown",
}

export class PromptFileGenerator {
  validateInputFile(path: string): Promise<void> {
    return Deno.stat(path).then(() => {}, () => {
      throw new Error(`No such file: ${path}`);
    });
  }

  async writeOutputFile(path: string, content: string) {
    await Deno.writeTextFile(path, content);
  }

  /**
   * メインAPI: プロンプトテンプレートを使ってファイルを生成
   */
  async generateWithPrompt(
    fromFile: string,
    toFile: string,
    format: string,
    _force = false,
    options?: { adaptation?: string; promptDir?: string; demonstrativeType?: string },
  ) {
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
    const { promptFilePath, inputFilePath, outputFilePath } = factory.getAllParams();
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
      await this.writeOutputFile(outputFilePath, result.content);
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
