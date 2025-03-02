import { assertEquals, assertExists } from "https://deno.land/std/testing/asserts.ts";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { TEST_DIR, cleanupTestFiles, setupTestEnvironment } from "../test_utils.ts";

// Test directories that should persist
const PROJECTS_DIR = join(TEST_DIR, "projects");
const ISSUES_DIR = join(TEST_DIR, "issues");
const TASKS_DIR = join(TEST_DIR, "tasks");
const CONFIG_FILE = join(TEST_DIR, "config.json");

// Test files that should be removed during cleanup
const TEST_PROJECT_FILE = join(PROJECTS_DIR, "test_project_persistence.md");
const TEST_ISSUE_FILE = join(ISSUES_DIR, "test_issue_persistence.md");
const TEST_TASK_FILE = join(TASKS_DIR, "test_task_persistence.md");

/**
 * テストディレクトリ永続性テスト [ID:TEST] - レベル5: 特殊ケースと統合テスト
 * 
 * 目的:
 * - テスト実行後もベースディレクトリ（.agent_test/breakdown）が保持されることを確認
 * - サブディレクトリ（projects/, issues/, tasks/）が保持されることを確認
 * - config.jsonが保持されることを確認
 * - テスト生成ファイルのみが削除され、ディレクトリ構造は保持されることを確認
 * 
 * 特記事項:
 * - テスト環境の一貫性を保つために重要
 * - テスト間の独立性を確保しつつ、共通リソースを効率的に管理
 */
Deno.test({
  name: "[ID:TEST] Test directory structure persistence",
  async fn() {
    // Setup test environment
    await setupTestEnvironment();
    
    // Create test files
    const testContent = "This is a test file that should be removed during cleanup";
    await Deno.writeTextFile(TEST_PROJECT_FILE, testContent);
    await Deno.writeTextFile(TEST_ISSUE_FILE, testContent);
    await Deno.writeTextFile(TEST_TASK_FILE, testContent);
    
    // Create config file if it doesn't exist
    if (!await exists(CONFIG_FILE)) {
      await Deno.writeTextFile(CONFIG_FILE, JSON.stringify({
        working_dir: TEST_DIR,
        test_config: true
      }, null, 2));
    }
    
    // Verify files exist before cleanup
    assertEquals(await exists(TEST_PROJECT_FILE), true, "Test project file should exist before cleanup");
    assertEquals(await exists(TEST_ISSUE_FILE), true, "Test issue file should exist before cleanup");
    assertEquals(await exists(TEST_TASK_FILE), true, "Test task file should exist before cleanup");
    assertEquals(await exists(CONFIG_FILE), true, "Config file should exist before cleanup");
    
    // Run cleanup
    await cleanupTestFiles();
    
    // Verify directories and config persist
    assertEquals(await exists(PROJECTS_DIR), true, "Projects directory should persist after cleanup");
    assertEquals(await exists(ISSUES_DIR), true, "Issues directory should persist after cleanup");
    assertEquals(await exists(TASKS_DIR), true, "Tasks directory should persist after cleanup");
    assertEquals(await exists(CONFIG_FILE), true, "Config file should persist after cleanup");
    
    // Verify test files are removed
    assertEquals(await exists(TEST_PROJECT_FILE), false, "Test project file should be removed during cleanup");
    assertEquals(await exists(TEST_ISSUE_FILE), false, "Test issue file should be removed during cleanup");
    assertEquals(await exists(TEST_TASK_FILE), false, "Test task file should be removed during cleanup");
  },
});

// Test to ensure the test_utils.ts cleanupTestFiles function preserves directories
Deno.test({
  name: "[ID:TEST] Test cleanupTestFiles preserves directory structure",
  async fn() {
    // Create a nested test directory structure
    const NESTED_DIR = join(TEST_DIR, "nested_test_dir");
    const NESTED_FILE = join(NESTED_DIR, "test_file.md");
    
    await ensureDir(NESTED_DIR);
    await Deno.writeTextFile(NESTED_FILE, "This is a test file in a nested directory");
    
    // Verify nested structure exists
    assertEquals(await exists(NESTED_DIR), true, "Nested directory should exist before cleanup");
    assertEquals(await exists(NESTED_FILE), true, "Nested file should exist before cleanup");
    
    // Run cleanup
    await cleanupTestFiles();
    
    // Verify directory persists but file is removed
    assertEquals(await exists(NESTED_DIR), true, "Nested directory should persist after cleanup");
    assertEquals(await exists(NESTED_FILE), false, "Nested file should be removed during cleanup");
  },
}); 