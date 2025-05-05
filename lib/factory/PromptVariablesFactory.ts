// PromptVariablesFactory: パス解決・パラメータ構築の一元化クラス
// See: docs/breakdown/app_factory.ja.md

import { BreakdownConfig } from "@tettuan/breakdownconfig";
import * as path from "@std/path";
import { existsSync } from "@std/fs";
// TODO: DoubleParamsResult型の正確な定義が見つからないため、any型で仮置き
// import type { DoubleParamsResult } from "../params/types.ts";
type DoubleParamsResult = any;

import { PromptTemplatePathResolver } from "./PromptTemplatePathResolver.ts";
import { InputFilePathResolver } from "./InputFilePathResolver.ts";
import { OutputFilePathResolver } from "./OutputFilePathResolver.ts";
import { SchemaFilePathResolver } from "./SchemaFilePathResolver.ts";

/**
 * PromptVariablesFactoryOptions
 * @property config - アプリケーション設定（BreakdownConfig.getConfig()で取得したものを渡すこと）
 * @property cliParams - CLI/テスト等から渡されるパラメータ
 */
export interface PromptVariablesFactoryOptions {
  /** BreakdownConfig.getConfig() で取得した設定オブジェクト */
  config: any;
  cliParams: DoubleParamsResult;
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
  private config: any;
  private readonly cliParams: DoubleParamsResult;
  private baseDirOverride?: string;

  private promptPathResolver: PromptTemplatePathResolver;
  private inputPathResolver: InputFilePathResolver;
  private outputPathResolver: OutputFilePathResolver;
  private schemaPathResolver: SchemaFilePathResolver;

  private constructor(config: any, cliParams: DoubleParamsResult, baseDirOverride?: string) {
    this.config = config;
    this.cliParams = cliParams;
    this.baseDirOverride = baseDirOverride;
    this.promptPathResolver = new PromptTemplatePathResolver(config, cliParams);
    this.inputPathResolver = new InputFilePathResolver(config, cliParams);
    this.outputPathResolver = new OutputFilePathResolver(config, cliParams);
    this.schemaPathResolver = new SchemaFilePathResolver(config, cliParams);
  }

  /**
   * 非同期ファクトリメソッド
   * @param cliParams 実行時パラメータ
   * @param baseDirOverride オプション: app_prompt.base_dir を上書き
   */
  static async create(cliParams: DoubleParamsResult, baseDirOverride?: string): Promise<PromptVariablesFactory> {
    const breakdownConfig = new BreakdownConfig();
    await breakdownConfig.loadConfig();
    // 明示的にuser.yml > app.ymlの優先順位でマージ
    let config = await breakdownConfig.getConfig();
    if (config && typeof config === "object" && config.user && typeof config.user === "object") {
      if (config.user.app_prompt && typeof config.user.app_prompt === "object" && (config.user.app_prompt as any).base_dir) {
        if (config.app_prompt && typeof config.app_prompt === "object") {
          (config.app_prompt as any).base_dir = (config.user.app_prompt as any).base_dir;
        }
      }
      if (config.user.app_schema && typeof config.user.app_schema === "object" && (config.user.app_schema as any).base_dir) {
        if (config.app_schema && typeof config.app_schema === "object") {
          (config.app_schema as any).base_dir = (config.user.app_schema as any).base_dir;
        }
      }
    }
    // Use override if provided
    let baseDir = baseDirOverride ?? config?.app_prompt?.base_dir;
    if (typeof baseDir !== "string" || baseDir.trim() === "") {
      // Return a factory with an error property for adapter to check
      const factory = new PromptVariablesFactory(undefined, undefined, undefined);
      (factory as any)._baseDirError = "Prompt base_dir must be set";
      return factory;
    }
    const instance = new PromptVariablesFactory(config, cliParams, baseDirOverride);
    // Debug output for config and resolved paths
    console.log("[DEBUG Factory] app_prompt.base_dir:", config.app_prompt?.base_dir);
    console.log("[DEBUG Factory] promptFilePath:", instance.promptFilePath);
    console.log("[DEBUG Factory] inputFilePath:", instance.inputFilePath);
    console.log("[DEBUG Factory] outputFilePath:", instance.outputFilePath);
    console.log("[DEBUG Factory] schemaFilePath:", instance.schemaFilePath);
    console.log("[DEBUG Factory] cwd:", Deno.cwd());
    return instance;
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
    // If _baseDirError is set, base_dir is invalid
    return !(this as any)._baseDirError;
  }

  /**
   * If base_dir is invalid, returns the error message
   */
  public getBaseDirError(): string | undefined {
    return (this as any)._baseDirError;
  }
} 