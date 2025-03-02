import { assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { setupTestAssets, TEST_ASSETS_DIR } from "../test_utils.ts";

/**
 * スキーマ適用と検証テスト [ID:VALIDATE] - レベル4: 変数置換と出力処理
 * 
 * 目的:
 * - スキーマに基づいて出力が正しく検証されることを確認
 * - スキーマ違反がある場合のエラーハンドリングを確認
 * 
 * テストデータ:
 * - スキーマに準拠した出力
 * - スキーマに違反する出力
 * 
 * 境界線:
 * - スキーマ特定 → 出力検証
 *   スキーマファイルが特定できないと、出力の検証ができない
 * 
 * 依存関係:
 * - [SCHEMA] スキーマファイル特定テスト
 * - [REPLACE] プロンプト変数置換テスト
 */

// モック関数: 実際の実装では適切なインポートに置き換える
async function validateOutputWithSchema(
  output: string,
  schemaFilePath: string
): Promise<boolean> {
  // スキーマファイルを読み込む
  const schemaText = await Deno.readTextFile(schemaFilePath);
  const schema = JSON.parse(schemaText);
  
  // 出力をJSONとして解析
  let outputJson;
  try {
    outputJson = JSON.parse(output);
  } catch (e) {
    throw new Error(`出力がJSONとして解析できません: ${e.message}`);
  }
  
  // スキーマに基づいて検証
  // 実際の実装では、JSONスキーマバリデーターを使用する
  // ここではシンプルな検証を行う
  if (schema.type === "object") {
    if (typeof outputJson !== "object" || Array.isArray(outputJson)) {
      throw new Error("出力はオブジェクトである必要があります");
    }
    
    // 必須プロパティの検証
    if (schema.required) {
      for (const prop of schema.required) {
        if (!(prop in outputJson)) {
          throw new Error(`必須プロパティ '${prop}' が見つかりません`);
        }
      }
    }
    
    // プロパティの型検証
    if (schema.properties) {
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        if (prop in outputJson) {
          const value = outputJson[prop];
          const type = propSchema.type;
          
          if (type === "string" && typeof value !== "string") {
            throw new Error(`プロパティ '${prop}' は文字列である必要があります`);
          } else if (type === "number" && typeof value !== "number") {
            throw new Error(`プロパティ '${prop}' は数値である必要があります`);
          } else if (type === "array" && !Array.isArray(value)) {
            throw new Error(`プロパティ '${prop}' は配列である必要があります`);
          } else if (type === "object" && (typeof value !== "object" || Array.isArray(value))) {
            throw new Error(`プロパティ '${prop}' はオブジェクトである必要があります`);
          }
        }
      }
    }
  }
  
  return true;
}

// テスト実行前にセットアップを行う
Deno.test({
  name: "スキーマ適用と検証テストのセットアップ",
  fn: async () => {
    await setupTestAssets();
    
    // テスト用のスキーマディレクトリとファイルを作成
    const schemasDir = path.join(TEST_ASSETS_DIR, "schemas");
    
    // to/project.json
    const toDir = path.join(schemasDir, "to");
    await ensureDir(toDir);
    await Deno.writeTextFile(
      path.join(toDir, "project.json"),
      JSON.stringify({
        "type": "object",
        "required": ["title", "description"],
        "properties": {
          "title": {"type": "string"},
          "description": {"type": "string"},
          "goals": {"type": "array"}
        }
      })
    );
    
    // to/issue.json
    await Deno.writeTextFile(
      path.join(toDir, "issue.json"),
      JSON.stringify({
        "type": "object",
        "required": ["title", "description"],
        "properties": {
          "title": {"type": "string"},
          "description": {"type": "string"},
          "acceptance_criteria": {"type": "array"}
        }
      })
    );
  }
});

Deno.test("スキーマ適用と検証テスト - 正常系", async () => {
  const schemaFilePath = path.join(TEST_ASSETS_DIR, "schemas", "to", "project.json");
  
  // スキーマに準拠した出力
  const validOutput = JSON.stringify({
    "title": "テストプロジェクト",
    "description": "これはテストプロジェクトの説明です",
    "goals": ["目標1", "目標2"]
  });
  
  // 検証
  const result = await validateOutputWithSchema(validOutput, schemaFilePath);
  assertEquals(result, true);
});

Deno.test("スキーマ適用と検証テスト - 必須プロパティ欠落", async () => {
  const schemaFilePath = path.join(TEST_ASSETS_DIR, "schemas", "to", "project.json");
  
  // 必須プロパティが欠落した出力
  const invalidOutput = JSON.stringify({
    "title": "テストプロジェクト"
    // description が欠落
  });
  
  // 検証
  await assertThrows(
    async () => {
      await validateOutputWithSchema(invalidOutput, schemaFilePath);
    },
    Error,
    "必須プロパティ 'description' が見つかりません"
  );
});

Deno.test("スキーマ適用と検証テスト - プロパティ型不一致", async () => {
  const schemaFilePath = path.join(TEST_ASSETS_DIR, "schemas", "to", "project.json");
  
  // プロパティの型が不一致の出力
  const invalidOutput = JSON.stringify({
    "title": "テストプロジェクト",
    "description": "これはテストプロジェクトの説明です",
    "goals": "これは配列ではなく文字列です" // 配列ではなく文字列
  });
  
  // 検証
  await assertThrows(
    async () => {
      await validateOutputWithSchema(invalidOutput, schemaFilePath);
    },
    Error,
    "プロパティ 'goals' は配列である必要があります"
  );
});

Deno.test("スキーマ適用と検証テスト - 不正なJSON", async () => {
  const schemaFilePath = path.join(TEST_ASSETS_DIR, "schemas", "to", "project.json");
  
  // 不正なJSON形式の出力
  const invalidOutput = "{ this is not valid JSON }";
  
  // 検証
  await assertThrows(
    async () => {
      await validateOutputWithSchema(invalidOutput, schemaFilePath);
    },
    Error,
    "出力がJSONとして解析できません"
  );
}); 