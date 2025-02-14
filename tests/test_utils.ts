import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import { getConfig, setConfig } from "../breakdown/config/config.ts";

const TEST_DIR = "./.agent_test/breakdown";
const TEST_DATA_DIR = `${TEST_DIR}/_test_data`;  // テストデータ用ディレクトリ

// 設定のみを初期化
export function initTestConfig(): void {
  setConfig({ working_dir: TEST_DIR });
}

// ディレクトリ構造を作成
export async function setupTestDirs(): Promise<void> {
  await ensureDir(TEST_DIR);
  await ensureDir(`${TEST_DIR}/projects`);
  await ensureDir(`${TEST_DIR}/issues`);
  await ensureDir(`${TEST_DIR}/tasks`);
  await ensureDir(TEST_DATA_DIR);
}

// 後方互換性のための関数
export async function setupTestEnv(): Promise<void> {
  initTestConfig();
  await setupTestDirs();
}

// テストデータのクリーンアップ
export async function cleanupTestFiles(): Promise<void> {
  try {
    await Deno.remove(TEST_DATA_DIR, { recursive: true });
  } catch {
    // 無視
  }
}

// 作業ディレクトリの削除
export async function removeWorkDir(): Promise<void> {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // 無視
  }
} 