import { PromptVariablesFactory } from "../factory/PromptVariablesFactory.ts";
import { join, dirname } from "@std/path";
import { existsSync } from "@std/fs";

export class PromptFileGenerator {
  async validateInputFile(path: string): Promise<void> {
    return Deno.stat(path).then(() => {}, () => {
      throw new Error(`No such file: ${path}`);
    });
  }

  async setupLogger(enabled: boolean) {
    if (!enabled) return undefined;
    const { BreakdownLogger, LogLevel } = await import("@tettuan/breakdownlogger");
    const testLogger = new BreakdownLogger({ initialLevel: LogLevel.DEBUG });
    return {
      debug: (...args: unknown[]) => testLogger.debug(String(args[0]), args[1]),
      error: (...args: unknown[]) => testLogger.error(String(args[0]), args[1]),
    };
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
    // stdin ('-') 特別扱い: 先にエラー返す
    if (fromFile === '-') {
      throw new Error('No such file: -');
    }
    // 1. CLIパラメータを組み立ててPromptVariablesFactoryで一元解決
    const cliParams = {
      demonstrativeType: options?.demonstrativeType || "to",
      layerType: format,
      options: {
        fromFile,
        destinationFile: toFile,
        adaptation: options?.adaptation,
        promptDir: options?.promptDir,
      },
    };
    const factory = await PromptVariablesFactory.create(cliParams, options?.promptDir);
    factory.validateAll();
    // 2. 必要なパスを取得
    const { promptFilePath, inputFilePath, outputFilePath } = factory.getAllParams();
    // 3. 入力ファイル存在チェック（先に判定）
    try {
      await this.validateInputFile(inputFilePath);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("No such file")) {
        return {
          success: false,
          output: "",
          error: e.message,
        };
      }
      throw e;
    }
    // 4. テンプレートファイル存在チェック
    const promptDir = dirname(promptFilePath);
    if (!existsSync(promptDir)) {
      return {
        success: false,
        output: "",
        error: "Required directory does not exist",
      };
    }
    if (!existsSync(promptFilePath)) {
      return {
        success: false,
        output: "",
        error: "template not found",
      };
    }
    // 5. ロガーセットアップ
    const logger = await this.setupLogger(true);
    // 6. テンプレート処理
    const adapter = new (await import("../prompt/prompt_adapter.ts")).PromptAdapterImpl();
    const result = await adapter.generate(
      join(promptFilePath, ".."),
      cliParams.demonstrativeType,
      cliParams.layerType,
      inputFilePath,
      outputFilePath,
      cliParams.layerType,
      logger,
      cliParams.options.adaptation,
    );
    if (result.success) {
      await this.writeOutputFile(outputFilePath, result.content);
      return {
        success: true,
        output: result.content,
        error: "",
      };
    } else if (typeof result.content === "string" && result.content.includes("template not found")) {
      return {
        success: false,
        output: "",
        error: "template not found",
      };
    } else {
      return {
        success: false,
        output: "",
        error: result.content,
      };
    }
  }
} 