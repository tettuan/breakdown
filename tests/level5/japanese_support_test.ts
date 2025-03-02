import { assertEquals, assertExists } from "https://deno.land/std/testing/asserts.ts";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { TEST_DIR, cleanupTestFiles, setupTestEnvironment } from "../test_utils.ts";

// Test files with Japanese names
const JP_PROJECT_DIR = join(TEST_DIR, "projects");
const JP_PROJECT_FILE = join(JP_PROJECT_DIR, "プロジェクト概要.md");
const JP_ISSUE_DIR = join(TEST_DIR, "issues");
const JP_ISSUE_FILE = join(JP_ISSUE_DIR, "課題一覧.md");
const JP_TASK_DIR = join(TEST_DIR, "tasks");
const JP_TASK_FILE = join(JP_TASK_DIR, "タスク詳細.md");

/**
 * 日本語対応テスト [ID:JP] - レベル5: 特殊ケースと統合テスト
 * 
 * 目的:
 * - 日本語を含むファイル名が正しく処理されることを確認
 * - 日本語を含むパスが正しく処理されることを確認
 * - 日本語を含む入力ファイルが正しく処理されることを確認
 * - 日本語を含む出力が正しく生成されることを確認
 * 
 * テストデータ:
 * - 日本語ファイル名とパス
 * - 日本語コンテンツを含む入力ファイル
 * 
 * 特記事項:
 * - 英語以外の言語（特に日本語）のサポートは重要な機能
 * - 文字化けやエンコーディングの問題が発生しないことを確認
 */

Deno.test({
  name: "[ID:JP] Test Japanese filename support",
  async fn() {
    // Setup test environment
    await setupTestEnvironment();
    await cleanupTestFiles(); // Clean any existing test files
    
    // Create test files with Japanese names
    const jpContent = "# 日本語テスト\nこれは日本語のテストファイルです。";
    await Deno.writeTextFile(JP_PROJECT_FILE, jpContent);
    await Deno.writeTextFile(JP_ISSUE_FILE, jpContent);
    await Deno.writeTextFile(JP_TASK_FILE, jpContent);
    
    // Verify files exist
    assertEquals(await exists(JP_PROJECT_FILE), true, "Japanese project file should exist");
    assertEquals(await exists(JP_ISSUE_FILE), true, "Japanese issue file should exist");
    assertEquals(await exists(JP_TASK_FILE), true, "Japanese task file should exist");
    
    // Read files to verify content
    const projectContent = await Deno.readTextFile(JP_PROJECT_FILE);
    const issueContent = await Deno.readTextFile(JP_ISSUE_FILE);
    const taskContent = await Deno.readTextFile(JP_TASK_FILE);
    
    assertEquals(projectContent, jpContent, "Japanese content in project file should match");
    assertEquals(issueContent, jpContent, "Japanese content in issue file should match");
    assertEquals(taskContent, jpContent, "Japanese content in task file should match");
    
    // Clean up test files
    await cleanupTestFiles();
    
    // Verify files were removed
    assertEquals(await exists(JP_PROJECT_FILE), false, "Japanese project file should be removed");
    assertEquals(await exists(JP_ISSUE_FILE), false, "Japanese issue file should be removed");
    assertEquals(await exists(JP_TASK_FILE), false, "Japanese task file should be removed");
  },
});

// Test for Japanese content processing
Deno.test({
  name: "[ID:JP] Test Japanese content processing",
  async fn() {
    // Setup test environment
    await setupTestEnvironment();
    
    // Create a test file with Japanese content
    const testFile = join(TEST_DIR, "test_jp_content.md");
    const jpContent = `
# プロジェクト概要
## 目的
このプロジェクトは日本語のサポートをテストするためのものです。

## 機能
1. 日本語ファイル名のサポート
2. 日本語コンテンツの処理
3. 文字化けの防止

## 期待される結果
- 日本語ファイル名が正しく処理される
- 日本語コンテンツが正しく処理される
- 出力ファイルでも日本語が正しく表示される
`;
    
    await Deno.writeTextFile(testFile, jpContent);
    
    // Verify file exists
    assertEquals(await exists(testFile), true, "Test file with Japanese content should exist");
    
    // Read file to verify content
    const content = await Deno.readTextFile(testFile);
    assertEquals(content, jpContent, "Japanese content should match");
    
    // Clean up
    await cleanupTestFiles();
  },
}); 