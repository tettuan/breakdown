/**
 * @fileoverview 設定ファイル自動生成サービス
 *
 * テスト環境やCI環境で必要な設定ファイルが存在しない場合に
 * 自動的にデフォルト設定ファイルを生成するサービス
 *
 * @module supporting/initialization/config_file_generator
 */

import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import type { Result } from "../../types/result.ts";
import { error, ok } from "../../types/result.ts";
import { DEFAULT_CONFIG_DIR } from "../../config/constants.ts";

/**
 * 設定ファイル生成エラー型
 */
export type ConfigFileGeneratorError =
  | { kind: "DirectoryCreationError"; path: string; message: string; cause?: unknown }
  | { kind: "FileWriteError"; path: string; message: string; cause?: unknown }
  | { kind: "ValidationError"; profileName: string; message: string; cause?: unknown };

/**
 * デフォルトアプリケーション設定テンプレート
 */
const DEFAULT_APP_CONFIG_TEMPLATE = `# Default app configuration for Breakdown
# Auto-generated for test/CI environment

directiveTypes:
  - to
  - summary
  - defect
  - find
  - analyze
  - extract

layerTypes:
  - project
  - issue
  - task
  - bugs
  - component
  - module

app_prompt:
  basedir: ".breakdown/prompts"

app_schema:
  basedir: ".breakdown/schemas"

output:
  basedir: "output"

features:
  extendedThinking: false
  debugMode: true
  strictValidation: true
  autoSchema: true

limits:
  maxFileSize: 10485760
  maxPromptLength: 50000
  maxVariables: 100

environment:
  logLevel: "info"
  colorOutput: false
`;

/**
 * デフォルトユーザー設定テンプレート
 */
const DEFAULT_USER_CONFIG_TEMPLATE = `# Default user configuration for Breakdown
# Auto-generated for test/CI environment

params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find|analyze|extract)$"
      errorMessage: "Invalid directive type. Must be one of: to, summary, defect, find, analyze, extract"
    layerType:
      pattern: "^(project|issue|task|bugs|component|module)$"
      errorMessage: "Invalid layer type. Must be one of: project, issue, task, bugs, component, module"
`;

/**
 * 設定ファイル自動生成サービス
 */
export class ConfigFileGenerator {
  private readonly configDir: string;

  constructor(configDir: string = DEFAULT_CONFIG_DIR) {
    this.configDir = configDir;
  }

  /**
   * 指定されたプロファイル名のアプリケーション設定ファイルを生成
   */
  async generateAppConfig(profileName: string): Promise<Result<string, ConfigFileGeneratorError>> {
    const fileName = `${profileName}-app.yml`;
    const filePath = join(this.configDir, fileName);

    try {
      // ディレクトリが存在しない場合は作成
      await ensureDir(this.configDir);

      // 設定ファイルを書き込み
      await Deno.writeTextFile(filePath, DEFAULT_APP_CONFIG_TEMPLATE);

      return ok(filePath);
    } catch (cause) {
      if (cause instanceof Deno.errors.PermissionDenied) {
        return error({
          kind: "FileWriteError",
          path: filePath,
          message: `Permission denied when writing config file: ${filePath}`,
          cause,
        });
      }

      return error({
        kind: "FileWriteError",
        path: filePath,
        message: `Failed to write app config file: ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
        cause,
      });
    }
  }

  /**
   * 指定されたプロファイル名のユーザー設定ファイルを生成
   */
  async generateUserConfig(profileName: string): Promise<Result<string, ConfigFileGeneratorError>> {
    const fileName = `${profileName}-user.yml`;
    const filePath = join(this.configDir, fileName);

    try {
      // ディレクトリが存在しない場合は作成
      await ensureDir(this.configDir);

      // 設定ファイルを書き込み
      await Deno.writeTextFile(filePath, DEFAULT_USER_CONFIG_TEMPLATE);

      return ok(filePath);
    } catch (cause) {
      if (cause instanceof Deno.errors.PermissionDenied) {
        return error({
          kind: "FileWriteError",
          path: filePath,
          message: `Permission denied when writing config file: ${filePath}`,
          cause,
        });
      }

      return error({
        kind: "FileWriteError",
        path: filePath,
        message: `Failed to write user config file: ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
        cause,
      });
    }
  }

  /**
   * プロファイルの完全な設定ファイルセット（app + user）を生成
   */
  async generateProfileConfigSet(
    profileName: string,
  ): Promise<Result<{ appConfigPath: string; userConfigPath: string }, ConfigFileGeneratorError>> {
    const appResult = await this.generateAppConfig(profileName);
    if (!appResult.ok) {
      return error(appResult.error);
    }

    const userResult = await this.generateUserConfig(profileName);
    if (!userResult.ok) {
      return error(userResult.error);
    }

    return ok({
      appConfigPath: appResult.data,
      userConfigPath: userResult.data,
    });
  }

  /**
   * 設定ファイルの存在確認
   */
  async checkConfigExists(
    profileName: string,
  ): Promise<{ appExists: boolean; userExists: boolean }> {
    const appPath = join(this.configDir, `${profileName}-app.yml`);
    const userPath = join(this.configDir, `${profileName}-user.yml`);

    try {
      const appExists = await Deno.stat(appPath).then(() => true).catch(() => false);
      const userExists = await Deno.stat(userPath).then(() => true).catch(() => false);

      return { appExists, userExists };
    } catch {
      return { appExists: false, userExists: false };
    }
  }

  /**
   * テスト環境で必要な設定ファイルを自動生成
   * 存在しないファイルのみを生成する
   */
  async ensureTestConfig(
    profileName: string = "default",
  ): Promise<Result<string[], ConfigFileGeneratorError>> {
    const { appExists, userExists } = await this.checkConfigExists(profileName);
    const generatedFiles: string[] = [];

    // app設定ファイルが存在しない場合は生成
    if (!appExists) {
      const appResult = await this.generateAppConfig(profileName);
      if (!appResult.ok) {
        return error(appResult.error);
      }
      generatedFiles.push(appResult.data);
    }

    // user設定ファイルが存在しない場合は生成
    if (!userExists) {
      const userResult = await this.generateUserConfig(profileName);
      if (!userResult.ok) {
        return error(userResult.error);
      }
      generatedFiles.push(userResult.data);
    }

    return ok(generatedFiles);
  }

  /**
   * 設定ファイルの自動修復（破損または不完全な設定ファイルを再生成）
   */
  async repairConfig(profileName: string): Promise<Result<string[], ConfigFileGeneratorError>> {
    try {
      const result = await this.generateProfileConfigSet(profileName);
      if (!result.ok) {
        return error(result.error);
      }

      return ok([result.data.appConfigPath, result.data.userConfigPath]);
    } catch (cause) {
      return error({
        kind: "ValidationError",
        profileName,
        message: `Failed to repair config for profile: ${profileName}`,
        cause,
      });
    }
  }
}
