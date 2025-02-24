import { ensureDir } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { getConfig, setConfig, initializeConfig } from "@/breakdown/config/config.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";

export const TEST_ROOT = "./.agent_test";
export const TEST_DIR = join(TEST_ROOT, "breakdown");

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

export async function setupTestLogger() {
  await Deno.mkdir("logs", { recursive: true });
  await Deno.writeTextFile("logs/test.log", ""); // ログファイルをクリア
  Deno.env.set("DENO_ENV", "test");
} 