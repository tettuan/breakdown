import { assertEquals, assertStringIncludes } from "https://deno.land/std/testing/asserts.ts";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { 
  setupTestAssets, 
  removeTestDirs, 
  TEST_WORKING_DIR,
  runCommand,
  TEST_DIR,
  cleanupTestFiles
} from "../test_utils.ts";

// モック関数: 実際の実装では適切なインポートに置き換える
async function runCommand(cmd: string, args: string[] = []): Promise<{ output: string, error: string }> {
  const command = new Deno.Command(cmd, {
    args,
    stdout: "piped",
    stderr: "piped",
  });
  
  const { stdout, stderr } = await command.output();
  
  const output = new TextDecoder().decode(stdout);
  const error = new TextDecoder().decode(stderr);
  
  return { output, error };
}

// テスト実行前にセットアップを行う
Deno.test({
  name: "日本語対応テストのセットアップ",
  fn: async () => {
    await setupTestAssets();
    await removeTestDirs();
    
    // テスト用ディレクトリを作成
    await ensureDir(TEST_WORKING_DIR);
    await ensureDir(path.join(TEST_WORKING_DIR, "projects"));
    await ensureDir(path.join(TEST_WORKING_DIR, "issues"));
    await ensureDir(path.join(TEST_WORKING_DIR, "tasks"));
    
    // 日本語ファイル名のテスト用ファイルを作成
    await Deno.writeTextFile(
      path.join(TEST_WORKING_DIR, "projects", "プロジェクト概要.md"),
      "# テストプロジェクト\nこれはテストプロジェクトの説明です。"
    );
    
    // 日本語コンテンツのテスト用ファイルを作成
    await Deno.writeTextFile(
      path.join(TEST_WORKING_DIR, "projects", "japanese_content.md"),
      "# 日本語コンテンツテスト\n\n## 概要\nこれは日本語のコンテンツを含むテストファイルです。\n\n## 目標\n- 日本語の処理が正しく行われることを確認する\n- 文字化けが発生しないことを確認する"
    );
  }
});

Deno.test("日本語ファイル名の処理テスト", async () => {
  // 日本語ファイル名の読み込み
  const filePath = path.join(TEST_WORKING_DIR, "projects", "プロジェクト概要.md");
  const fileContent = await Deno.readTextFile(filePath);
  
  // ファイル内容の確認
  assertStringIncludes(fileContent, "テストプロジェクト");
  assertStringIncludes(fileContent, "これはテストプロジェクトの説明です");
  
  // コマンド実行
  const { output, error } = await runCommand("deno", [
    "run", 
    "-A", 
    "cli.ts", 
    "to", 
    "issue", 
    "--from", 
    filePath, 
    "--destination", 
    path.join(TEST_WORKING_DIR, "issues", "課題_自動生成.md")
  ]);
  
  // エラーがないことを確認
  assertEquals(error, "");
  
  // 出力ファイルが作成されたことを確認
  const outputExists = await exists(path.join(TEST_WORKING_DIR, "issues", "課題_自動生成.md"));
  assertEquals(outputExists, true);
});

Deno.test("日本語コンテンツの処理テスト", async () => {
  // 日本語コンテンツの読み込み
  const filePath = path.join(TEST_WORKING_DIR, "projects", "japanese_content.md");
  const fileContent = await Deno.readTextFile(filePath);
  
  // ファイル内容の確認
  assertStringIncludes(fileContent, "日本語コンテンツテスト");
  assertStringIncludes(fileContent, "これは日本語のコンテンツを含むテストファイルです");
  
  // コマンド実行
  const { output, error } = await runCommand("deno", [
    "run", 
    "-A", 
    "cli.ts", 
    "to", 
    "issue", 
    "--from", 
    filePath, 
    "--destination", 
    path.join(TEST_WORKING_DIR, "issues", "issue_from_japanese.md")
  ]);
  
  // エラーがないことを確認
  assertEquals(error, "");
  
  // 出力ファイルが作成されたことを確認
  const outputExists = await exists(path.join(TEST_WORKING_DIR, "issues", "issue_from_japanese.md"));
  assertEquals(outputExists, true);
  
  // 出力ファイルの内容を確認
  const outputContent = await Deno.readTextFile(path.join(TEST_WORKING_DIR, "issues", "issue_from_japanese.md"));
  
  // 日本語が正しく処理されていることを確認
  assertStringIncludes(outputContent, "日本語");
  // 文字化けが発生していないことを確認（特定の文字化けパターンがないことを確認）
  assertEquals(outputContent.includes("�"), false);
});

Deno.test({
  name: "Japanese Support - File names and content",
  async fn() {
    try {
      // Setup test directories
      await ensureDir(`${TEST_DIR}/projects`);
      
      // Create test file with Japanese content
      const japaneseInputFile = path.join(TEST_DIR, "projects", "日本語プロジェクト.md");
      const japaneseContent = `# 日本語プロジェクト概要
## プロジェクトの目的
このプロジェクトは日本語のサポートをテストするためのものです。

## 主な機能
- 日本語ファイル名の処理
- 日本語コンテンツの処理
- 文字化けの防止

## 技術スタック
- TypeScript
- Deno
`;
      await Deno.writeTextFile(japaneseInputFile, japaneseContent);
      
      // Test command with Japanese file name
      const result = await runCommand([
        "to", "issue", 
        "-f", japaneseInputFile,
        "-o", `${TEST_DIR}/issues/日本語課題.md`
      ]);
      
      // Verify command execution
      assertEquals(result.code, 0, "Command should execute successfully");
      
      // Verify output file exists
      const outputExists = await exists(`${TEST_DIR}/issues/日本語課題.md`);
      assertEquals(outputExists, true, "Output file with Japanese name should exist");
      
      // Verify content
      const outputContent = await Deno.readTextFile(`${TEST_DIR}/issues/日本語課題.md`);
      assertStringIncludes(outputContent, "日本語プロジェクト", "Output should contain Japanese content");
      
      // Test auto-naming with Japanese input
      const autoNameResult = await runCommand([
        "to", "task", 
        "-f", `${TEST_DIR}/issues/日本語課題.md`,
        "-o"
      ]);
      
      assertEquals(autoNameResult.code, 0, "Auto-naming with Japanese input should succeed");
      
      // Verify that at least one file was created in the tasks directory
      const taskDir = await Deno.readDir(`${TEST_DIR}/tasks`);
      let taskFileFound = false;
      for await (const entry of taskDir) {
        if (entry.isFile && entry.name.endsWith(".md")) {
          taskFileFound = true;
          break;
        }
      }
      
      assertEquals(taskFileFound, true, "Task file should be created from Japanese input");
      
    } finally {
      // Clean up test files but preserve directory structure
      await cleanupTestFiles();
    }
  },
}); 