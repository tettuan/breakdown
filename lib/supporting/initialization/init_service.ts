import { ensureDir, exists } from "@std/fs";
import { join, resolve } from "@std/path";
import { BreakdownConfig } from "@tettuan/breakdownconfig";

/**
 * 初期化サービスの設定オプション
 */
export interface InitServiceOptions {
  workspaceDirectory: string;
  configProfile?: string;
  force?: boolean;
  backup?: boolean;
}

/**
 * 初期化結果
 */
export interface InitializationResult {
  success: boolean;
  workspaceDirectory: string;
  configProfile: string;
  createdFiles: string[];
  createdDirectories: string[];
  backedUpFiles?: string[];
  message: string;
}

/**
 * 初期化サービス
 * プロジェクトの初期化とワークスペースのセットアップを担当
 */
export class InitService {
  private static readonly DEFAULT_PROFILE = "default";
  private static readonly BACKUP_SUFFIX = ".backup";

  private readonly config: BreakdownConfig | null;

  constructor(config?: BreakdownConfig | null) {
    this.config = config || null;
  }

  /**
   * ワークスペースを初期化
   */
  public async initialize(options: InitServiceOptions): Promise<InitializationResult> {
    const workspaceDir = resolve(options.workspaceDirectory);
    const profileName = options.configProfile || InitService.DEFAULT_PROFILE;

    const result: InitializationResult = {
      success: false,
      workspaceDirectory: workspaceDir,
      configProfile: profileName,
      createdFiles: [],
      createdDirectories: [],
      backedUpFiles: [],
      message: "",
    };

    try {
      // プロファイル名の簡易検証
      if (!profileName || profileName.includes("/") || profileName.includes("\\")) {
        throw new Error(`Invalid config profile name: ${profileName}`);
      }

      // ワークスペースディレクトリの作成
      await this.createWorkspaceDirectory(workspaceDir, result);

      // ディレクトリ構造の作成
      await this.createDirectoryStructure(workspaceDir, result);

      // 設定ファイルの生成
      await this.createConfigFiles(workspaceDir, profileName, options, result);

      // サンプルファイルの作成
      await this.createSampleFiles(workspaceDir, result);

      result.success = true;
      result.message = this.generateSuccessMessage(result);
    } catch (error) {
      result.success = false;
      result.message = `Initialization failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }

    return result;
  }

  /**
   * ワークスペースディレクトリを作成
   */
  private async createWorkspaceDirectory(
    workspaceDir: string,
    result: InitializationResult,
  ): Promise<void> {
    if (!await exists(workspaceDir)) {
      await ensureDir(workspaceDir);
      result.createdDirectories.push(workspaceDir);
    }
  }

  /**
   * ディレクトリ構造を作成
   */
  private async createDirectoryStructure(
    workspaceDir: string,
    result: InitializationResult,
  ): Promise<void> {
    const workspaceDirectories = this.getWorkspaceDirectories();
    for (const dir of workspaceDirectories) {
      const dirPath = join(workspaceDir, dir);
      if (!await exists(dirPath)) {
        await ensureDir(dirPath);
        result.createdDirectories.push(dirPath);
      }
    }
  }

  /**
   * ワークスペースディレクトリ構造をBreakdownConfigから取得
   */
  private getWorkspaceDirectories(): string[] {
    // デフォルトのディレクトリ構造を返す（BreakdownConfigへの依存を避けるため）
    // Use minimal defaults to avoid hardcoding - these should come from configuration
    const directiveTypes = this.getMinimalDirectiveTypes();
    const layerTypes = this.getMinimalLayerTypes();

    const directories: string[] = [];

    // 基本ディレクトリ
    directories.push("config", "output", "input", "tmp");

    // プロンプトディレクトリ
    directories.push("prompts");
    for (const directive of directiveTypes) {
      directories.push(`prompts/${directive}`);
      for (const layer of layerTypes) {
        directories.push(`prompts/${directive}/${layer}`);
      }
    }

    // スキーマディレクトリ
    directories.push("schemas");
    for (const directive of directiveTypes) {
      directories.push(`schemas/${directive}`);
      for (const layer of layerTypes) {
        directories.push(`schemas/${directive}/${layer}`);
      }
    }

    return directories;
  }

  /**
   * 設定ファイルを作成
   */
  private async createConfigFiles(
    workspaceDir: string,
    profileName: string,
    options: InitServiceOptions,
    result: InitializationResult,
  ): Promise<void> {
    const configDir = join(workspaceDir, "config");

    // アプリケーション設定ファイル
    const appConfigPath = join(configDir, `${profileName}-app.yml`);
    await this.createConfigFile(
      appConfigPath,
      this.generateAppConfig(profileName),
      options,
      result,
    );

    // ユーザー設定ファイル
    const userConfigPath = join(configDir, `${profileName}-user.yml`);
    await this.createConfigFile(
      userConfigPath,
      this.generateUserConfig(profileName),
      options,
      result,
    );
  }

  /**
   * 設定ファイルを作成（既存ファイルの保護付き）
   */
  private async createConfigFile(
    filePath: string,
    content: string,
    options: InitServiceOptions,
    result: InitializationResult,
  ): Promise<void> {
    const fileExists = await exists(filePath);

    if (fileExists) {
      if (options.backup && options.force) {
        // バックアップを作成してから上書き
        const backupPath = `${filePath}${InitService.BACKUP_SUFFIX}`;
        await Deno.copyFile(filePath, backupPath);
        result.backedUpFiles?.push(backupPath);

        await Deno.writeTextFile(filePath, content);
        result.createdFiles.push(filePath);
      } else if (!options.force) {
        // force=falseの場合はスキップ
        return;
      } else if (options.force) {
        // force=trueだがbackup=falseの場合は上書き
        await Deno.writeTextFile(filePath, content);
        result.createdFiles.push(filePath);
      }
    } else {
      // ファイルが存在しない場合は作成
      await Deno.writeTextFile(filePath, content);
      result.createdFiles.push(filePath);
    }
  }

  /**
   * アプリケーション設定の生成
   */
  private generateAppConfig(profileName: string): string {
    return `# Breakdown Application Configuration
# Profile: ${profileName}

# Version information
version: "1.0.0"

# Application settings
app:
  name: "breakdown"
  profile: "${profileName}"
  
# Timeout settings (milliseconds)
timeout:
  default: 30000
  stdin: 5000
  file: 10000

# Validation settings
validation:
  strict: true
  allowUnknownProperties: false

# Logging settings
logging:
  level: "info"
  format: "json"
`;
  }

  /**
   * ユーザー設定の生成
   */
  private generateUserConfig(profileName: string): string {
    return `# Breakdown User Configuration
# Profile: ${profileName}

# DirectiveType patterns
directiveTypes:
  - pattern: "to"
    description: "Transform content to target format"
  - pattern: "find"
    description: "Find specific elements"
  - pattern: "summary"
    description: "Summarize content"
  - pattern: "defect"
    description: "Detect defects or issues"

# LayerType patterns  
layerTypes:
  - pattern: "project"
    description: "Project level tasks"
  - pattern: "issue"
    description: "Issue level tasks"
  - pattern: "task"
    description: "Task level subtasks"
  - pattern: "bugs"
    description: "Bug related tasks"

# Custom settings
custom:
  # Add your custom settings here
`;
  }

  /**
   * サンプルファイルを作成
   */
  private async createSampleFiles(
    workspaceDir: string,
    result: InitializationResult,
  ): Promise<void> {
    // サンプルプロンプトファイル
    const samplePromptPath = join(workspaceDir, "prompts/to/project/example.md");
    const samplePromptContent = `# Project Breakdown Prompt

This is a sample prompt for breaking down a project.

## Input
{{input}}

## Instructions
Break down the above content into manageable project tasks.

## Output Format
Please structure your response according to the project schema.
`;

    if (!await exists(samplePromptPath)) {
      await Deno.writeTextFile(samplePromptPath, samplePromptContent);
      result.createdFiles.push(samplePromptPath);
    }

    // サンプルスキーマファイル
    const sampleSchemaPath = join(workspaceDir, "schemas/to/project/example.json");
    const sampleSchemaContent = JSON.stringify(
      {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "project": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "description": { "type": "string" },
              "tasks": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": { "type": "string" },
                    "title": { "type": "string" },
                    "description": { "type": "string" },
                  },
                },
              },
            },
          },
        },
      },
      null,
      2,
    );

    if (!await exists(sampleSchemaPath)) {
      await Deno.writeTextFile(sampleSchemaPath, sampleSchemaContent);
      result.createdFiles.push(sampleSchemaPath);
    }
  }

  /**
   * 成功メッセージを生成
   */
  private generateSuccessMessage(result: InitializationResult): string {
    const lines = [
      "✅ Workspace initialization completed successfully!",
      "",
      `📁 Workspace: ${result.workspaceDirectory}`,
      `🔧 Profile: ${result.configProfile}`,
      "",
    ];

    if (result.createdDirectories.length > 0) {
      lines.push(`📂 Created ${result.createdDirectories.length} directories`);
    }

    if (result.createdFiles.length > 0) {
      lines.push(`📄 Created ${result.createdFiles.length} files`);
    }

    if (result.backedUpFiles && result.backedUpFiles.length > 0) {
      lines.push(`💾 Backed up ${result.backedUpFiles.length} existing files`);
    }

    lines.push(
      "",
      "🚀 Next steps:",
      "1. Review the generated configuration files in the 'config' directory",
      "2. Customize the directiveTypes and layerTypes in the user config",
      "3. Add your prompt templates to the 'prompts' directory",
      "4. Add your JSON schemas to the 'schemas' directory",
      "5. Run 'breakdown --help' to see available commands",
      "",
      "📚 For more information, visit the documentation.",
    );

    return lines.join("\n");
  }

  /**
   * Gets minimal directive types for initialization
   * ❌ HARDCODE ELIMINATION: Must use configuration
   */
  private getMinimalDirectiveTypes(): string[] {
    // During initialization, we need to read from default config template
    // This should be loaded from .agent/breakdown/config/default-user.yml
    throw new Error(
      "Initialization must read directive types from configuration template. " +
      "Cannot use hardcoded values."
    );
  }

  /**
   * Gets minimal layer types for initialization
   * ❌ HARDCODE ELIMINATION: Must use configuration
   */
  private getMinimalLayerTypes(): string[] {
    // During initialization, we need to read from default config template
    // This should be loaded from .agent/breakdown/config/default-user.yml
    throw new Error(
      "Initialization must read layer types from configuration template. " +
      "Cannot use hardcoded values."
    );
  }
}
