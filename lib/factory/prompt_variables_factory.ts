// PromptVariablesFactory: パス解決・パラメータ構築の一元化クラス
// See: docs/breakdown/app_factory.ja.md

import { BreakdownConfig } from "@tettuan/breakdownconfig";
import type { DemonstrativeType, LayerType } from "../types/mod.ts";

export interface PromptCliParams {
  demonstrativeType: DemonstrativeType;
  layerType: LayerType;
  options: {
    fromFile?: string;
    destinationFile?: string;
    adaptation?: string;
    promptDir?: string;
    fromLayerType?: string;
  };
}

type DoubleParamsResult = PromptCliParams;

import { PromptTemplatePathResolver } from "./prompt_template_path_resolver.ts";
import { InputFilePathResolver } from "./input_file_path_resolver.ts";
import { OutputFilePathResolver } from "./output_file_path_resolver.ts";
import { SchemaFilePathResolver } from "./schema_file_path_resolver.ts";

/**
 * PromptVariablesFactoryOptions
 * @property config - アプリケーション設定（BreakdownConfig.getConfig()で取得したものを渡すこと）
 * @property cliParams - CLI/テスト等から渡されるパラメータ
 */
export interface PromptVariablesFactoryOptions {
  /** BreakdownConfig.getConfig() で取得した設定オブジェクト */
  config:
    & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
    & Record<string, unknown>;
  cliParams: PromptCliParams;
}

// --- サブクラス定義削除 ---

/**
 * PromptVariablesFactory
 * Breakdown全体のパス解決・パラメータ構築の唯一の窓口
 * - 設定値は内部でBreakdownConfigから取得
 * - cliParamsは必ず外部から受け取る
 * - インスタンス生成は static async create(cliParams) を利用
 */
export class PromptVariablesFactory {
  private config:
    & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
    & Record<string, unknown>;
  private readonly cliParams: PromptCliParams;
  private baseDirOverride?: string;

  private promptPathResolver: PromptTemplatePathResolver;
  private inputPathResolver: InputFilePathResolver;
  private outputPathResolver: OutputFilePathResolver;
  private schemaPathResolver: SchemaFilePathResolver;

  private constructor(
    config:
      & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
      & Record<string, unknown>,
    cliParams: PromptCliParams,
    baseDirOverride?: string,
  ) {
    this.config = config;
    this.cliParams = cliParams;
    this.baseDirOverride = baseDirOverride;
    this.promptPathResolver = new PromptTemplatePathResolver(config, cliParams);
    this.inputPathResolver = new InputFilePathResolver(config, cliParams);
    this.outputPathResolver = new OutputFilePathResolver(config, cliParams);
    this.schemaPathResolver = new SchemaFilePathResolver(config, cliParams);
  }

  /**
   * Factory method to create PromptVariablesFactory
   * @param cliParams CLI parameters
   */
  static async create(cliParams: PromptCliParams): Promise<PromptVariablesFactory> {
    const breakdownConfig = new BreakdownConfig(Deno.cwd());
    await breakdownConfig.loadConfig();
    const config = await breakdownConfig.getConfig();
    return new PromptVariablesFactory(config, cliParams);
  }

  /**
   * 主要パラメータをまとめて取得
   */
  public getAllParams(): {
    promptFilePath: string;
    inputFilePath: string;
    outputFilePath: string;
    schemaFilePath: string;
    // ...他の必要なパラメータ
  } {
    return {
      promptFilePath: this.promptFilePath,
      inputFilePath: this.inputFilePath,
      outputFilePath: this.outputFilePath,
      schemaFilePath: this.schemaFilePath,
    };
  }

  /**
   * パラメータ・パスのバリデーション
   * 必須パラメータ・パスの妥当性を簡易チェック
   */
  public validateAll(): void {
    if (!this.cliParams) throw new Error("cliParams is required");
    if (!this.config) throw new Error("config is required");
    if (!this.promptFilePath) throw new Error("Prompt file path is required");
    if (!this.schemaFilePath) throw new Error("Schema file path is required");
    // 入力・出力ファイルパスは空でも許容
  }

  /**
   * プロンプトファイルパス
   */
  public get promptFilePath(): string {
    return this.promptPathResolver.getPath();
  }
  /**
   * 入力ファイルパス
   */
  public get inputFilePath(): string {
    return this.inputPathResolver.getPath();
  }
  /**
   * 出力ファイルパス
   */
  public get outputFilePath(): string {
    return this.outputPathResolver.getPath();
  }
  /**
   * スキーマファイルパス
   */
  public get schemaFilePath(): string {
    return this.schemaPathResolver.getPath();
  }

  /**
   * Returns true if base_dir is valid (not empty or missing)
   */
  public hasValidBaseDir(): boolean {
    // 型安全に _baseDirError をアクセス
    // @ts-ignore: _baseDirError は protected/private で型定義されていない場合の暫定対応
    return !(this as { _baseDirError?: boolean })._baseDirError;
  }

  /**
   * If base_dir is invalid, returns the error message
   */
  public getBaseDirError(): string | undefined {
    // 型安全に _baseDirError をアクセス
    // @ts-ignore: _baseDirError は protected/private で型定義されていない場合の暫定対応
    return (this as { _baseDirError?: boolean })._baseDirError;
  }
}
