// PromptVariablesFactory: パス解決・パラメータ構築の一元化クラス
// See: docs/breakdown/app_factory.ja.md

import { BreakdownConfig } from "@tettuan/breakdownconfig";
import type { DemonstrativeType, LayerType } from "../types/mod.ts";

/**
 * Parameters for CLI prompt operations.
 * Used to configure prompt generation and file resolution.
 */
export interface PromptCliParams {
  /** The demonstrative type for the prompt (e.g., 'to', 'summary'). */
  demonstrativeType: DemonstrativeType;
  /** The layer type for the prompt (e.g., 'project', 'issue'). */
  layerType: LayerType;
  /** Options for prompt generation and file resolution. */
  options: {
    /** The input file path. */
    fromFile?: string;
    /** The destination file path. */
    destinationFile?: string;
    /** The adaptation type for the prompt. */
    adaptation?: string;
    /** The directory for prompt files. */
    promptDir?: string;
    /** The layer type inferred from input. */
    fromLayerType?: string;
    /** The input text from stdin. */
    input_text?: string;
    /** Custom variables specified with --uv-* options. */
    customVariables?: Record<string, string>;
    /** Extended mode flag (--extended). */
    extended?: boolean;
    /** Custom validation flag (--custom-validation). */
    customValidation?: boolean;
    /** Error format option (--error-format). */
    errorFormat?: "simple" | "detailed" | "json";
    /** Custom configuration file path. */
    config?: string;
  };
}

type DoubleParamsResult = PromptCliParams;

import { PromptTemplatePathResolver } from "./prompt_template_path_resolver.ts";
import { InputFilePathResolver } from "./input_file_path_resolver.ts";
import { OutputFilePathResolver } from "./output_file_path_resolver.ts";
import { SchemaFilePathResolver } from "./schema_file_path_resolver.ts";

/**
 * Options for creating a PromptVariablesFactory instance.
 * @property config - Application configuration (from BreakdownConfig.getConfig()).
 * @property cliParams - Parameters from CLI or tests.
 */
export interface PromptVariablesFactoryOptions {
  /** Application configuration (from BreakdownConfig.getConfig()). */
  config:
    & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
    & Record<string, unknown>;
  /** Parameters from CLI or tests. */
  cliParams: PromptCliParams;
}

// --- サブクラス定義削除 ---

/**
 * The main factory for resolving paths and constructing parameters for Breakdown operations.
 * Use static async create(cliParams) to instantiate.
 */
export class PromptVariablesFactory {
  private config:
    & { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } }
    & Record<string, unknown>;
  /**
   * The CLI parameters used for prompt generation and file resolution.
   */
  public readonly cliParams: PromptCliParams;
  private baseDirOverride?: string;
  private _baseDirError?: string;

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

    // Validate base_dir configuration
    if (!config.app_prompt?.base_dir || config.app_prompt.base_dir.trim() === "") {
      this._baseDirError = "Prompt base_dir must be set in configuration";
    }

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
    const configSetName = cliParams.options.config || "default";
    const breakdownConfig = new BreakdownConfig(configSetName, Deno.cwd());
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
    customVariables?: Record<string, string>;
  } {
    return {
      promptFilePath: this.promptFilePath,
      inputFilePath: this.inputFilePath,
      outputFilePath: this.outputFilePath,
      schemaFilePath: this.schemaFilePath,
      customVariables: this.customVariables,
    };
  }

  /**
   * Get the CLI options
   */
  public getOptions(): PromptCliParams["options"] {
    return this.cliParams.options;
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
   * カスタム変数（--uv-*）
   */
  public get customVariables(): Record<string, string> {
    return this.cliParams.options.customVariables || {};
  }

  /**
   * 拡張モードフラグ（--extended）
   */
  public get extended(): boolean {
    return this.cliParams.options.extended || false;
  }

  /**
   * カスタムバリデーションフラグ（--custom-validation）
   */
  public get customValidation(): boolean {
    return this.cliParams.options.customValidation || false;
  }

  /**
   * エラーフォーマット（--error-format）
   */
  public get errorFormat(): "simple" | "detailed" | "json" {
    return this.cliParams.options.errorFormat || "simple";
  }

  /**
   * Returns true if base_dir is valid (not empty or missing)
   */
  public hasValidBaseDir(): boolean {
    return !this._baseDirError;
  }

  /**
   * If base_dir is invalid, returns the error message
   */
  public getBaseDirError(): string | undefined {
    return this._baseDirError;
  }
}
