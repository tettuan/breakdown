import { assertEquals, assertExists, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { setupTestAssets, TEST_CONFIG_DIR, TEST_WORKING_DIR } from "../test_utils.ts";

// モック関数: 実際の実装では適切なインポートに置き換える
async function loadConfig(configPath: string) {
  try {
    const text = await Deno.readTextFile(configPath);
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return getDefaultConfig();
    }
    if (error instanceof Error) {
      throw new Error(`設定ファイルの読み込みに失敗しました: ${error.message}`);
    }
    throw new Error(`設定ファイルの読み込みに失敗しました: ${String(error)}`);
  }
}

function getDefaultConfig() {
  return {
    working_dir: TEST_WORKING_DIR,
    app_prompt: {
      base_dir: "./breakdown/prompts/"
    },
    app_schema: {
      base_dir: "./rules/schema/"
    }
  };
}

/**
 * 設定ファイル処理テスト [ID:CONFIG] - レベル1: 基本設定とコマンド処理
 * 
 * 目的:
 * - 設定ファイル（config.json）が正しく読み込まれることを確認
 * - 設定ファイルが存在しない場合のデフォルト値の適用を確認
 * - 設定ファイルの形式が不正な場合のエラーハンドリングを確認
 * 
 * テストデータ:
 * - 標準的な設定ファイル: test_assets/config/valid_config.json
 * - 不正な形式の設定ファイル: test_assets/config/invalid_config.json
 * 
 * 境界線:
 * - 設定ファイル読み込み → 他のすべての処理
 *   設定ファイルが正しく読み込まれないと、すべての後続処理が失敗する
 */

// テスト実行前にセットアップを行う
Deno.test({
  name: "設定ファイル処理テストのセットアップ",
  fn: async () => {
    await setupTestAssets();
  }
});

Deno.test("設定ファイル読み込みテスト - 正常な設定ファイル", async () => {
  const validConfigPath = path.join(TEST_CONFIG_DIR, "valid_config.json");
  const config = await loadConfig(validConfigPath);
  
  assertExists(config);
  assertEquals(config.working_dir, TEST_WORKING_DIR);
  assertEquals(config.app_prompt.base_dir, "./breakdown/prompts/");
  assertEquals(config.app_schema.base_dir, "./rules/schema/");
});

Deno.test("設定ファイル読み込みテスト - 存在しない設定ファイル", async () => {
  const nonExistentPath = path.join(TEST_CONFIG_DIR, "non_existent.json");
  const defaultConfig = await loadConfig(nonExistentPath);
  
  assertEquals(defaultConfig, getDefaultConfig());
});

Deno.test("設定ファイル読み込みテスト - 不正な形式の設定ファイル", async () => {
  const invalidConfigPath = path.join(TEST_CONFIG_DIR, "invalid_config.json");
  
  await assertThrows(
    async () => {
      await loadConfig(invalidConfigPath);
    },
    Error,
    "設定ファイルの読み込みに失敗しました"
  );
}); 