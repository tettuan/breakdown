import { assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { setupTestAssets, TEST_ASSETS_DIR } from "../test_utils.ts";

/**
 * スキーマファイル特定テスト [ID:SCHEMA] - レベル3: 入力タイプとファイル特定
 * 
 * 目的:
 * - DemonstrativeTypeとLayerTypeの組み合わせに基づいて正しいスキーマファイルが特定されることを確認
 * - スキーマファイルが存在しない場合のエラーハンドリングを確認
 * 
 * 境界線:
 * - スキーマ特定 → 出力検証
 *   スキーマファイルが特定できないと、出力の検証ができない
 * 
 * 依存関係:
 * - [ARGS] コマンドライン引数解析テスト
 */

// モック関数: 実際の実装では適切なインポートに置き換える
async function determineSchemaFile(
  demonstrativeType: string,
  layerType: string,
  config: { app_schema: { base_dir: string } }
): Promise<string> {
  // スキーマファイルのパスを構築
  const schemaDir = path.join(config.app_schema.base_dir, demonstrativeType);
  const schemaFileName = `${layerType}.json`;
  const schemaFilePath = path.join(schemaDir, schemaFileName);
  
  // ファイルの存在確認
  if (!await exists(schemaFilePath)) {
    throw new Error(`スキーマファイルが見つかりません: ${schemaFilePath}`);
  }
  
  return schemaFilePath;
}

// テスト実行前にセットアップを行う
Deno.test({
  name: "スキーマファイル特定テストのセットアップ",
  fn: async () => {
    await setupTestAssets();
    
    // テスト用のスキーマディレクトリとファイルを作成
    const schemasDir = path.join(TEST_ASSETS_DIR, "schemas");
    
    // to
    const toDir = path.join(schemasDir, "to");
    await ensureDir(toDir);
    await Deno.writeTextFile(
      path.join(toDir, "project.json"),
      '{"type": "object", "properties": {"title": {"type": "string"}}}'
    );
    await Deno.writeTextFile(
      path.join(toDir, "issue.json"),
      '{"type": "object", "properties": {"title": {"type": "string"}, "description": {"type": "string"}}}'
    );
    await Deno.writeTextFile(
      path.join(toDir, "task.json"),
      '{"type": "object", "properties": {"title": {"type": "string"}, "steps": {"type": "array"}}}'
    );
    
    // summary
    const summaryDir = path.join(schemasDir, "summary");
    await ensureDir(summaryDir);
    await Deno.writeTextFile(
      path.join(summaryDir, "project.json"),
      '{"type": "object", "properties": {"summary": {"type": "string"}}}'
    );
    await Deno.writeTextFile(
      path.join(summaryDir, "issue.json"),
      '{"type": "object", "properties": {"summary": {"type": "string"}}}'
    );
  }
});

Deno.test("スキーマファイル特定テスト - 正常系", async () => {
  const config = {
    app_schema: {
      base_dir: path.join(TEST_ASSETS_DIR, "schemas")
    }
  };
  
  // to/project.json
  const toProject = await determineSchemaFile("to", "project", config);
  assertEquals(
    toProject,
    path.join(config.app_schema.base_dir, "to", "project.json")
  );
  
  // to/issue.json
  const toIssue = await determineSchemaFile("to", "issue", config);
  assertEquals(
    toIssue,
    path.join(config.app_schema.base_dir, "to", "issue.json")
  );
  
  // to/task.json
  const toTask = await determineSchemaFile("to", "task", config);
  assertEquals(
    toTask,
    path.join(config.app_schema.base_dir, "to", "task.json")
  );
  
  // summary/project.json
  const summaryProject = await determineSchemaFile("summary", "project", config);
  assertEquals(
    summaryProject,
    path.join(config.app_schema.base_dir, "summary", "project.json")
  );
  
  // summary/issue.json
  const summaryIssue = await determineSchemaFile("summary", "issue", config);
  assertEquals(
    summaryIssue,
    path.join(config.app_schema.base_dir, "summary", "issue.json")
  );
});

Deno.test("スキーマファイル特定テスト - 存在しないファイル", async () => {
  const config = {
    app_schema: {
      base_dir: path.join(TEST_ASSETS_DIR, "schemas")
    }
  };
  
  // 存在しないスキーマファイル
  await assertThrows(
    async () => {
      await determineSchemaFile("summary", "task", config);
    },
    Error,
    "スキーマファイルが見つかりません"
  );
  
  // 存在しないデモンストレーティブタイプ
  await assertThrows(
    async () => {
      await determineSchemaFile("defect", "project", config);
    },
    Error,
    "スキーマファイルが見つかりません"
  );
}); 