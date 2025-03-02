import { assertEquals, assertExists, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { 
  setupTestAssets, 
  removeTestDirs, 
  TEST_WORKING_DIR, 
  TEST_CUSTOM_WORKING_DIR 
} from "../test_utils.ts";

/**
 * 作業ディレクトリ管理テスト [ID:WORKDIR] - レベル1: 基本設定とコマンド処理
 * 
 * 目的:
 * - working_dirの設定値が正しく適用されることを確認
 * - working_dirが存在しない場合のエラーメッセージを確認
 * - working_dirの自動作成機能が正しく動作することを確認
 * - テスト環境では `.agent_test/breakdown` が使用されることを確認
 * 
 * 境界線:
 * - 作業ディレクトリ確認 → ファイル操作
 *   作業ディレクトリが存在しないと、ファイル操作がすべて失敗する
 * 
 * 依存関係:
 * - [CONFIG] 設定ファイル処理テスト
 */

// モック関数: 実際の実装では適切なインポートに置き換える
async function checkWorkingDir(config: { working_dir: string }) {
  if (!await exists(config.working_dir)) {
    throw new Error("breakdown init を実行し、作業フォルダを作成してください。");
  }
  return true;
}

async function createWorkingDir(config: { working_dir: string }) {
  const dirExists = await exists(config.working_dir);
  
  // ディレクトリを作成
  await Deno.mkdir(config.working_dir, { recursive: true });
  await Deno.mkdir(path.join(config.working_dir, "projects"), { recursive: true });
  await Deno.mkdir(path.join(config.working_dir, "issues"), { recursive: true });
  await Deno.mkdir(path.join(config.working_dir, "tasks"), { recursive: true });
  
  return !dirExists; // 新規作成した場合はtrue、既存の場合はfalse
}

// テスト実行前にセットアップを行う
Deno.test({
  name: "作業ディレクトリ管理テストのセットアップ",
  fn: async () => {
    await setupTestAssets();
    await removeTestDirs();
  }
});

Deno.test("作業ディレクトリ確認テスト - 存在しない場合", async () => {
  const config = { working_dir: TEST_WORKING_DIR };
  
  await assertThrows(
    async () => {
      await checkWorkingDir(config);
    },
    Error,
    "breakdown init を実行し、作業フォルダを作成してください"
  );
});

Deno.test("作業ディレクトリ作成テスト - 新規作成", async () => {
  const config = { working_dir: TEST_WORKING_DIR };
  
  // 新規作成の場合はtrueが返ることを確認
  const created = await createWorkingDir(config);
  assertEquals(created, true);
  
  // ディレクトリが作成されたことを確認
  const dirExists = await exists(config.working_dir);
  assertEquals(dirExists, true);
  
  // サブディレクトリも作成されていることを確認
  const projectsDirExists = await exists(`${config.working_dir}/projects`);
  const issuesDirExists = await exists(`${config.working_dir}/issues`);
  const tasksDirExists = await exists(`${config.working_dir}/tasks`);
  
  assertEquals(projectsDirExists, true);
  assertEquals(issuesDirExists, true);
  assertEquals(tasksDirExists, true);
});

Deno.test("作業ディレクトリ作成テスト - 既存の場合", async () => {
  const config = { working_dir: TEST_WORKING_DIR };
  
  // 既に存在する場合はfalseが返ることを確認
  const created = await createWorkingDir(config);
  assertEquals(created, false);
});

Deno.test("作業ディレクトリ確認テスト - 存在する場合", async () => {
  const config = { working_dir: TEST_WORKING_DIR };
  
  // 存在する場合はtrueが返ることを確認
  const result = await checkWorkingDir(config);
  assertEquals(result, true);
});

Deno.test("カスタム作業ディレクトリテスト", async () => {
  const config = { working_dir: TEST_CUSTOM_WORKING_DIR };
  
  // 新規作成の場合はtrueが返ることを確認
  const created = await createWorkingDir(config);
  assertEquals(created, true);
  
  // ディレクトリが作成されたことを確認
  const dirExists = await exists(config.working_dir);
  assertEquals(dirExists, true);
}); 