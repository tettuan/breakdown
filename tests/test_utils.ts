import { ensureDir, join } from "../deps.ts";
import { getConfig, setConfig, initializeConfig } from "$lib/config/config.ts";

const TEST_DIR = "./.agent_test/breakdown";
const TEST_CONFIG_PATH = "./tests/fixtures/test.config.json";

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

export async function cleanupTestFiles(): Promise<void> {
  await removeWorkDir();
}

export function initTestConfig(): void {
  setConfig({ working_dir: TEST_DIR });
}

export async function setupTestDirs(): Promise<void> {
  await ensureDir(TEST_DIR);
} 