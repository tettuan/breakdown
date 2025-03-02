import { ensureDir, join, exists } from "../deps.ts";
import { getConfig, setConfig, initializeConfig } from "$lib/config/config.ts";
import * as path from "https://deno.land/std/path/mod.ts";

// Define test directory constant
export const TEST_DIR = ".agent_test/breakdown";
export const TEST_ASSETS_DIR = "./test_assets";
export const TEST_CONFIG_DIR = path.join(TEST_ASSETS_DIR, "config");
export const TEST_WORKING_DIR = ".agent_test/breakdown";
export const TEST_CUSTOM_WORKING_DIR = ".agent_test/breakdown_custom";
export const TEST_CONFIG_PATH = "./tests/fixtures/test.config.json";

async function setupTestPrompts(): Promise<void> {
  // プロンプトファイルの作成
  const promptDir = "./tests/fixtures/prompts/to/issue";
  await ensureDir(promptDir);
  
  await Deno.writeTextFile(
    join(promptDir, "f_project.md"),
    `## Input
{input_markdown}

## Source
{input_markdown_file}

## Schema
{schema_file}

## Output
{destination_path}`
  );

  // テスト用の入力ファイルも作成
  const projectDir = join(TEST_DIR, "project");
  await ensureDir(projectDir);
  
  await Deno.writeTextFile(
    join(projectDir, "project_summary.md"),
    "# Test Project\nThis is a test project."
  );
}

export async function setupTestEnv(): Promise<string> {
  await ensureDir(TEST_DIR);
  await setupTestPrompts();
  
  // 環境変数で設定ファイルのパスを指定
  Deno.env.set("BREAKDOWN_CONFIG", TEST_CONFIG_PATH);
  
  // 設定を初期化
  await initializeConfig({
    configPath: TEST_CONFIG_PATH
  });
  
  return TEST_DIR;
}

export async function removeWorkDir(): Promise<void> {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // ディレクトリが存在しない場合は無視
  }
}

export function initTestConfig(): void {
  setConfig({ working_dir: TEST_DIR });
}

export async function setupTestDirs(): Promise<void> {
  await ensureDir(TEST_DIR);
}

// テスト用のアセットディレクトリを準備
export async function setupTestAssets() {
  await ensureDir(TEST_CONFIG_DIR);
  await ensureDir(path.join(TEST_ASSETS_DIR, "input"));
  await ensureDir(path.join(TEST_ASSETS_DIR, "output"));
  await ensureDir(path.join(TEST_ASSETS_DIR, "prompts"));
  await ensureDir(path.join(TEST_ASSETS_DIR, "schemas"));
  
  // 正常な設定ファイルを作成
  const validConfig = {
    working_dir: TEST_WORKING_DIR,
    app_prompt: {
      base_dir: "./breakdown/prompts/"
    },
    app_schema: {
      base_dir: "./rules/schema/"
    }
  };
  
  await Deno.writeTextFile(
    path.join(TEST_CONFIG_DIR, "valid_config.json"),
    JSON.stringify(validConfig, null, 2)
  );
  
  // 不正な形式の設定ファイルを作成
  await Deno.writeTextFile(
    path.join(TEST_CONFIG_DIR, "invalid_config.json"),
    "{ this is not valid JSON }"
  );
  
  // working_dir設定を含む設定ファイルを作成
  const workingDirConfig = {
    working_dir: TEST_CUSTOM_WORKING_DIR,
    app_prompt: {
      base_dir: "./breakdown/prompts/"
    },
    app_schema: {
      base_dir: "./rules/schema/"
    }
  };
  
  await Deno.writeTextFile(
    path.join(TEST_CONFIG_DIR, "working_dir_config.json"),
    JSON.stringify(workingDirConfig, null, 2)
  );
}

/**
 * Cleans up test files while preserving directory structure and config.json
 */
export async function cleanupTestFiles(): Promise<void> {
  if (!await exists(TEST_DIR)) {
    return;
  }

  // Walk through all files in the test directory
  for await (const entry of Deno.readDir(TEST_DIR)) {
    const path = join(TEST_DIR, entry.name);
    
    // Preserve config.json
    if (entry.name === "config.json") {
      continue;
    }
    
    if (entry.isDirectory) {
      // For directories, recursively clean files but preserve the directory
      await cleanupDirectoryContents(path);
    } else {
      // Remove regular files
      await Deno.remove(path);
    }
  }
}

/**
 * Recursively cleans files within a directory while preserving the directory structure
 */
async function cleanupDirectoryContents(dirPath: string): Promise<void> {
  for await (const entry of Deno.readDir(dirPath)) {
    const path = join(dirPath, entry.name);
    
    if (entry.isDirectory) {
      // Recursively clean subdirectories
      await cleanupDirectoryContents(path);
    } else {
      // Remove files
      await Deno.remove(path);
    }
  }
}

// テスト用ディレクトリの完全削除（テスト開始前のセットアップ用）
export async function removeTestDirs() {
  try {
    await Deno.remove(TEST_WORKING_DIR, { recursive: true });
  } catch (_) {
    // ディレクトリが存在しない場合は無視
  }
  
  try {
    await Deno.remove(TEST_CUSTOM_WORKING_DIR, { recursive: true });
  } catch (_) {
    // ディレクトリが存在しない場合は無視
  }
}

// Helper function to run breakdown command
export async function runCommand(args: string[]): Promise<{code: number, stdout: string, stderr: string}> {
  const command = new Deno.Command("breakdown", {
    args: args,
    stdout: "piped",
    stderr: "piped",
  });
  
  const { code, stdout, stderr } = await command.output();
  
  return {
    code,
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr)
  };
}

// Helper function to ensure test directory structure
export async function setupTestEnvironment() {
  await ensureDir(TEST_DIR);
  await ensureDir(`${TEST_DIR}/projects`);
  await ensureDir(`${TEST_DIR}/issues`);
  await ensureDir(`${TEST_DIR}/tasks`);
  
  // Create config file if it doesn't exist
  const configFile = `${TEST_DIR}/config.json`;
  if (!await exists(configFile)) {
    await Deno.writeTextFile(configFile, JSON.stringify({
      working_dir: TEST_DIR
    }));
  }
}

/**
 * テスト用ユーティリティ関数
 * 
 * 目的:
 * - テスト環境のセットアップと後処理を一貫して行う
 * - テストデータの準備と管理
 * - テスト実行のヘルパー関数を提供
 * 
 * 主要な機能:
 * - setupTestEnv: テスト環境のセットアップ
 * - removeWorkDir: 作業ディレクトリの削除
 * - initTestConfig: テスト用設定の初期化
 * - setupTestDirs: テスト用ディレクトリの作成
 * - setupTestAssets: テスト用アセットの準備
 * - cleanupTestFiles: テストファイルのクリーンアップ（ディレクトリ構造は保持）
 * - runCommand: コマンド実行のヘルパー
 * 
 * 特記事項:
 * - cleanupTestFiles関数は、ディレクトリ構造を保持しながらテストファイルのみを削除
 * - テスト環境では .agent_test/breakdown を使用（本番環境の .agent/breakdown の代わり）
 * 
 * テストレベルの構成と方針:
 * このテストスイートは、アプリケーションの機能を段階的に検証するために5つのレベルに分けられています：
 * 
 * レベル1: 基本設定とコマンド処理
 * - 設定ファイルの読み込み、作業ディレクトリの管理、基本コマンドの処理など、
 *   アプリケーションの基盤となる機能をテスト
 * - これらのテストが失敗すると、他のすべてのテストも失敗する可能性が高い
 * 
 * レベル2: 引数解析とパス処理
 * - コマンドライン引数の解析とファイルパスの自動補完をテスト
 * - ユーザー入力の正確な解釈と適切なファイルパスの構築を確認
 * 
 * レベル3: 入力タイプとファイル特定
 * - 入力タイプの特定、プロンプトファイルとスキーマファイルの選択をテスト
 * - 正しい入力タイプに基づいて適切なファイルが選択されることを確認
 * 
 * レベル4: 変数置換と出力処理
 * - プロンプト内の変数置換とスキーマに基づく出力検証をテスト
 * - 入力から出力への変換プロセスの正確性を確認
 * 
 * レベル5: 特殊ケースと統合テスト
 * - 日本語対応、エラーハンドリング、テストディレクトリの永続性、コマンド連鎖など、
 *   特殊なケースや複数の機能を組み合わせた統合テストを実施
 * - アプリケーション全体の動作を実際のユースケースに近い形で検証
 * 
 * テスト実行方針:
 * 1. 各テストは独立して実行できるように設計
 * 2. テスト環境は各テスト前に適切にセットアップし、テスト後にクリーンアップ
 * 3. テストディレクトリ構造は保持しつつ、テストファイルのみを削除
 * 4. モック関数を使用して外部依存を最小限に抑え、テストの信頼性を確保
 * 5. 境界条件とエラーケースを重点的にテスト
 * 6. 日本語を含む国際化対応も検証
 */ 