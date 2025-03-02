import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std/testing/asserts.ts";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { TEST_DIR, cleanupTestFiles, setupTestEnvironment, runCommand } from "../test_utils.ts";

/**
 * コマンド連鎖テスト [ID:CHAIN] - レベル5: 特殊ケースと統合テスト
 * 
 * 目的:
 * - 複数のコマンドを連続して実行した場合の動作を確認
 * - 前のコマンドの出力を次のコマンドの入力として使用できることを確認
 * 
 * テストシナリオ:
 * 1. `breakdown init` で作業ディレクトリ作成
 * 2. `breakdown to project -f input.md -o` でプロジェクト概要生成
 * 3. 生成されたファイルを使って `breakdown to issue -f [生成されたファイル] -o` を実行
 * 4. 生成されたissueファイルを使って `breakdown to task -f [生成されたissueファイル] -o` を実行
 * 
 * 依存関係:
 * - [CMD] 基本コマンド処理テスト
 * - [PATH] ファイルパス自動補完テスト
 * - [PROMPT] プロンプトファイル特定テスト
 * - [SCHEMA] スキーマファイル特定テスト
 * - [REPLACE] プロンプト変数置換テスト
 * - [VALIDATE] スキーマ適用と検証テスト
 */

Deno.test({
  name: "[ID:CHAIN] Test command chain from project to task",
  async fn() {
    // Setup test environment
    await setupTestEnvironment();
    await cleanupTestFiles(); // Clean any existing test files
    
    // Step 1: Run init command
    let result = await runCommand(["init"]);
    assertEquals(result.code, 0, "Init command should succeed");
    
    // Create initial input file
    const inputFile = join(TEST_DIR, "input.md");
    await Deno.writeTextFile(inputFile, `
# Test Project
## Overview
This is a test project for command chaining.

## Goals
- Test the breakdown command chain
- Verify output files are created correctly
- Ensure each step uses the output from the previous step
    `);
    
    // Step 2: Generate project overview
    result = await runCommand(["to", "project", "-f", inputFile, "-o"]);
    assertEquals(result.code, 0, "Project generation command should succeed");
    
    // Find the generated project file
    let projectFile = "";
    for await (const entry of Deno.readDir(join(TEST_DIR, "projects"))) {
      if (entry.isFile && entry.name.endsWith(".md")) {
        projectFile = join(TEST_DIR, "projects", entry.name);
        break;
      }
    }
    
    assertExists(projectFile, "Project file should be generated");
    assertEquals(await exists(projectFile), true, "Project file should exist");
    
    // Step 3: Generate issues from project
    result = await runCommand(["to", "issue", "-f", projectFile, "-o"]);
    assertEquals(result.code, 0, "Issue generation command should succeed");
    
    // Find the generated issue file
    let issueFile = "";
    for await (const entry of Deno.readDir(join(TEST_DIR, "issues"))) {
      if (entry.isFile && entry.name.endsWith(".md")) {
        issueFile = join(TEST_DIR, "issues", entry.name);
        break;
      }
    }
    
    assertExists(issueFile, "Issue file should be generated");
    assertEquals(await exists(issueFile), true, "Issue file should exist");
    
    // Step 4: Generate tasks from issue
    result = await runCommand(["to", "task", "-f", issueFile, "-o"]);
    assertEquals(result.code, 0, "Task generation command should succeed");
    
    // Find the generated task file
    let taskFile = "";
    for await (const entry of Deno.readDir(join(TEST_DIR, "tasks"))) {
      if (entry.isFile && entry.name.endsWith(".md")) {
        taskFile = join(TEST_DIR, "tasks", entry.name);
        break;
      }
    }
    
    assertExists(taskFile, "Task file should be generated");
    assertEquals(await exists(taskFile), true, "Task file should exist");
    
    // Verify content of each file to ensure proper chaining
    const projectContent = await Deno.readTextFile(projectFile);
    const issueContent = await Deno.readTextFile(issueFile);
    const taskContent = await Deno.readTextFile(taskFile);
    
    assertStringIncludes(projectContent, "Project", "Project file should contain project-related content");
    assertStringIncludes(issueContent, "Issue", "Issue file should contain issue-related content");
    assertStringIncludes(taskContent, "Task", "Task file should contain task-related content");
    
    // Clean up test files but preserve directory structure
    await cleanupTestFiles();
  },
}); 