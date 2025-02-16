import { ensureDir } from "https://deno.land/std@0.210.0/fs/mod.ts";
import { getConfig, setConfig } from "../breakdown/config/config.ts";

const TEST_DIR = "./.agent_test/breakdown";

export async function setupTestEnv(): Promise<string> {
  await ensureDir(TEST_DIR);
  setConfig({ working_dir: TEST_DIR });
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