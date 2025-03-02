import { assertEquals, assertExists } from "https://deno.land/std/testing/asserts.ts";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { 
  setupTestAssets, 
  cleanupTestFiles, 
  TEST_WORKING_DIR,
  TEST_DIR
} from "../test_utils.ts";
import { runCommand } from "../test_utils.ts";

// Test directory structure constants
const PROJECTS_DIR = `${TEST_DIR}/projects`;
const ISSUES_DIR = `${TEST_DIR}/issues`;
const TASKS_DIR = `${TEST_DIR}/tasks`;
const CONFIG_FILE = `${TEST_DIR}/config.json`;

// Helper function to create test files
async function createTestFiles() {
  // Create test files in each directory
  await Deno.writeTextFile(`${PROJECTS_DIR}/test_file.md`, "Test content");
  await Deno.writeTextFile(`${ISSUES_DIR}/test_file.md`, "Test content");
  await Deno.writeTextFile(`${TASKS_DIR}/test_file.md`, "Test content");
}

// Helper function to verify directory structure
async function verifyDirectoryStructure() {
  // Check base directory exists
  const baseExists = await exists(TEST_DIR);
  assertExists(baseExists, `Base test directory ${TEST_DIR} should exist`);
  
  // Check subdirectories exist
  const projectsExists = await exists(PROJECTS_DIR);
  assertExists(projectsExists, `Projects directory ${PROJECTS_DIR} should exist`);
  
  const issuesExists = await exists(ISSUES_DIR);
  assertExists(issuesExists, `Issues directory ${ISSUES_DIR} should exist`);
  
  const tasksExists = await exists(TASKS_DIR);
  assertExists(tasksExists, `Tasks directory ${TASKS_DIR} should exist`);
  
  // Check config file exists
  const configExists = await exists(CONFIG_FILE);
  assertExists(configExists, `Config file ${CONFIG_FILE} should exist`);
}

// テスト実行前にセットアップを行う
Deno.test({
  name: "テストディレクトリ永続性テストのセットアップ",
  fn: async () => {
    await setupTestAssets();
    
    // テスト用ディレクトリを作成
    await Deno.mkdir(TEST_WORKING_DIR, { recursive: true });
    await Deno.mkdir(path.join(TEST_WORKING_DIR, "projects"), { recursive: true });
    await Deno.mkdir(path.join(TEST_WORKING_DIR, "issues"), { recursive: true });
    await Deno.mkdir(path.join(TEST_WORKING_DIR, "tasks"), { recursive: true });
    
    // config.jsonを作成
    await Deno.writeTextFile(
      path.join(TEST_WORKING_DIR, "config.json"),
      JSON.stringify({
        working_dir: TEST_WORKING_DIR,
        app_prompt: {
          base_dir: "./breakdown/prompts/"
        },
        app_schema: {
          base_dir: "./rules/schema/"
        }
      }, null, 2)
    );
    
    // テスト用ファイルを作成
    await Deno.writeTextFile(
      path.join(TEST_WORKING_DIR, "projects", "test_project.md"),
      "# Test Project\nThis is a test project."
    );
    await Deno.writeTextFile(
      path.join(TEST_WORKING_DIR, "issues", "test_issue.md"),
      "# Test Issue\nThis is a test issue."
    );
    await Deno.writeTextFile(
      path.join(TEST_WORKING_DIR, "tasks", "test_task.md"),
      "# Test Task\nThis is a test task."
    );
  }
});

Deno.test("ディレクトリ構造の永続性確認", async () => {
  // クリーンアップ前の状態を確認
  const baseExists = await exists(TEST_WORKING_DIR);
  const projectsExists = await exists(path.join(TEST_WORKING_DIR, "projects"));
  const issuesExists = await exists(path.join(TEST_WORKING_DIR, "issues"));
  const tasksExists = await exists(path.join(TEST_WORKING_DIR, "tasks"));
  const configExists = await exists(path.join(TEST_WORKING_DIR, "config.json"));
  const projectFileExists = await exists(path.join(TEST_WORKING_DIR, "projects", "test_project.md"));
  
  assertEquals(baseExists, true);
  assertEquals(projectsExists, true);
  assertEquals(issuesExists, true);
  assertEquals(tasksExists, true);
  assertEquals(configExists, true);
  assertEquals(projectFileExists, true);
  
  // クリーンアップを実行
  await cleanupTestFiles();
  
  // クリーンアップ後の状態を確認
  const baseExistsAfter = await exists(TEST_WORKING_DIR);
  const projectsExistsAfter = await exists(path.join(TEST_WORKING_DIR, "projects"));
  const issuesExistsAfter = await exists(path.join(TEST_WORKING_DIR, "issues"));
  const tasksExistsAfter = await exists(path.join(TEST_WORKING_DIR, "tasks"));
  const configExistsAfter = await exists(path.join(TEST_WORKING_DIR, "config.json"));
  const projectFileExistsAfter = await exists(path.join(TEST_WORKING_DIR, "projects", "test_project.md"));
  
  // ディレクトリ構造は保持されるべき
  assertEquals(baseExistsAfter, true);
  assertEquals(projectsExistsAfter, true);
  assertEquals(issuesExistsAfter, true);
  assertEquals(tasksExistsAfter, true);
  assertEquals(configExistsAfter, true);
  
  // テスト生成ファイルは削除されるべき
  assertEquals(projectFileExistsAfter, false);
});

Deno.test("新規ファイル作成後のディレクトリ永続性確認", async () => {
  // 新しいテストファイルを作成
  const newFilePath = path.join(TEST_WORKING_DIR, "projects", "new_project.md");
  await Deno.writeTextFile(
    newFilePath,
    "# New Project\nThis is a new test project."
  );
  
  // ファイルが作成されたことを確認
  const fileExists = await exists(newFilePath);
  assertEquals(fileExists, true);
  
  // クリーンアップを実行
  await cleanupTestFiles();
  
  // クリーンアップ後の状態を確認
  const baseExistsAfter = await exists(TEST_WORKING_DIR);
  const projectsExistsAfter = await exists(path.join(TEST_WORKING_DIR, "projects"));
  const fileExistsAfter = await exists(newFilePath);
  
  // ディレクトリ構造は保持されるべき
  assertEquals(baseExistsAfter, true);
  assertEquals(projectsExistsAfter, true);
  
  // テスト生成ファイルは削除されるべき
  assertEquals(fileExistsAfter, false);
});

Deno.test({
  name: "Test directory structure persists across test runs",
  async fn() {
    // Ensure the directory structure exists
    await ensureDir(TEST_DIR);
    await ensureDir(PROJECTS_DIR);
    await ensureDir(ISSUES_DIR);
    await ensureDir(TASKS_DIR);
    
    // Create config file if it doesn't exist
    if (!await exists(CONFIG_FILE)) {
      await Deno.writeTextFile(CONFIG_FILE, JSON.stringify({
        working_dir: TEST_DIR
      }));
    }
    
    // Create test files
    await createTestFiles();
    
    // Verify directory structure
    await verifyDirectoryStructure();
    
    // Simulate cleanup (remove test files but preserve directories and config)
    await Deno.remove(`${PROJECTS_DIR}/test_file.md`);
    await Deno.remove(`${ISSUES_DIR}/test_file.md`);
    await Deno.remove(`${TASKS_DIR}/test_file.md`);
    
    // Verify directory structure still exists after cleanup
    await verifyDirectoryStructure();
  },
});

Deno.test({
  name: "Test directory structure is properly initialized",
  async fn() {
    // Ensure the directory structure exists
    await ensureDir(TEST_DIR);
    await ensureDir(PROJECTS_DIR);
    await ensureDir(ISSUES_DIR);
    await ensureDir(TASKS_DIR);
    
    // Create config file if it doesn't exist
    if (!await exists(CONFIG_FILE)) {
      await Deno.writeTextFile(CONFIG_FILE, JSON.stringify({
        working_dir: TEST_DIR
      }));
    }
    
    // Verify directory structure
    await verifyDirectoryStructure();
  },
});

Deno.test({
  name: "Test Directory Persistence - Structure preservation",
  async fn() {
    try {
      // Setup test directories and config
      await ensureDir(`${TEST_DIR}/projects`);
      await ensureDir(`${TEST_DIR}/issues`);
      await ensureDir(`${TEST_DIR}/tasks`);
      
      // Create config.json
      const configContent = JSON.stringify({
        working_dir: TEST_DIR,
        app_prompt: {
          base_dir: "./breakdown/prompts/"
        },
        app_schema: {
          base_dir: "./rules/schema/"
        }
      }, null, 2);
      
      await Deno.writeTextFile(path.join(TEST_DIR, "config.json"), configContent);
      
      // Create test files
      const testProjectFile = path.join(TEST_DIR, "projects", "test_project.md");
      await Deno.writeTextFile(testProjectFile, "# Test Project");
      
      // Run a command that generates output
      await runCommand([
        "to", "issue", 
        "-f", testProjectFile,
        "-o", `${TEST_DIR}/issues/test_issue.md`
      ]);
      
      // Run cleanup
      await cleanupTestFiles();
      
      // Verify directory structure persists
      const baseExists = await exists(TEST_DIR);
      const projectsExists = await exists(`${TEST_DIR}/projects`);
      const issuesExists = await exists(`${TEST_DIR}/issues`);
      const tasksExists = await exists(`${TEST_DIR}/tasks`);
      const configExists = await exists(path.join(TEST_DIR, "config.json"));
      
      assertEquals(baseExists, true, "Base directory should persist");
      assertEquals(projectsExists, true, "Projects directory should persist");
      assertEquals(issuesExists, true, "Issues directory should persist");
      assertEquals(tasksExists, true, "Tasks directory should persist");
      assertEquals(configExists, true, "Config file should persist");
      
      // Verify test files are removed
      const testProjectExists = await exists(testProjectFile);
      const testIssueExists = await exists(`${TEST_DIR}/issues/test_issue.md`);
      
      assertEquals(testProjectExists, false, "Test project file should be removed");
      assertEquals(testIssueExists, false, "Test issue file should be removed");
      
    } finally {
      // We don't call cleanupTestFiles() here as we're testing it
    }
  },
}); 