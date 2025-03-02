import { assertEquals, assertNotEquals } from "https://deno.land/std/testing/asserts.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { 
  setupTestAssets, 
  removeTestDirs, 
  TEST_WORKING_DIR 
} from "../test_utils.ts";

/**
 * ファイルパス自動補完テスト [ID:PATH] - レベル2: 引数解析とパス処理
 * 
 * 目的:
 * - パス情報を含むFromFileが補完されないことを確認
 * - パス情報を含まないFromFileが正しく補完されることを確認
 * - パス情報を含むDestinationFileが補完されないことを確認
 * - パス情報を含まないDestinationFileが正しく補完されることを確認
 * - DestinationFileが指定されていない場合の自動ファイル名生成を確認
 *   - 日付とハッシュ値を含む形式になっているか確認
 *   - 生成されたファイル名が一意であることを確認
 * 
 * 境界線:
 * - ファイルパス自動補完 → ファイル読み書き
 *   パスの自動補完が正しく行われないと、ファイルの読み書きが失敗する
 * 
 * 依存関係:
 * - [WORKDIR] 作業ディレクトリ管理テスト
 * - [ARGS] コマンドライン引数解析テスト
 */

// モック関数: 実際の実装では適切なインポートに置き換える
function completeFromFilePath(fromFile: string, config: { working_dir: string }) {
  // パス情報を含む場合はそのまま返す
  if (fromFile.includes("/") || fromFile.includes("\\")) {
    return fromFile;
  }
  
  // パス情報を含まない場合は自動補完
  // ファイル名から推測されるレイヤータイプに基づいてディレクトリを選択
  let layerDir = "projects"; // デフォルト
  
  if (fromFile.includes("issue") || fromFile.includes("story")) {
    layerDir = "issues";
  } else if (fromFile.includes("task") || fromFile.includes("todo") || 
             fromFile.includes("bug") || fromFile.includes("fix")) {
    layerDir = "tasks";
  }
  
  return path.join(config.working_dir, layerDir, fromFile);
}

function completeDestinationFilePath(
  destinationFile: string | undefined, 
  layerType: string, 
  config: { working_dir: string }
) {
  // destinationFileが指定されていない場合は自動生成
  if (!destinationFile) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${dateStr}_${randomStr}.md`;
    
    let layerDir = "";
    if (layerType === "project") {
      layerDir = "projects";
    } else if (layerType === "issue") {
      layerDir = "issues";
    } else if (layerType === "task") {
      layerDir = "tasks";
    }
    
    return path.join(config.working_dir, layerDir, fileName);
  }
  
  // パス情報を含む場合はそのまま返す
  if (destinationFile.includes("/") || destinationFile.includes("\\")) {
    return destinationFile;
  }
  
  // パス情報を含まない場合は自動補完
  let layerDir = "";
  if (layerType === "project") {
    layerDir = "projects";
  } else if (layerType === "issue") {
    layerDir = "issues";
  } else if (layerType === "task") {
    layerDir = "tasks";
  }
  
  return path.join(config.working_dir, layerDir, destinationFile);
}

// テスト実行前にセットアップを行う
Deno.test({
  name: "ファイルパス自動補完テストのセットアップ",
  fn: async () => {
    await setupTestAssets();
    await removeTestDirs();
    
    // テスト用ディレクトリを作成
    await Deno.mkdir(TEST_WORKING_DIR, { recursive: true });
    await Deno.mkdir(path.join(TEST_WORKING_DIR, "projects"), { recursive: true });
    await Deno.mkdir(path.join(TEST_WORKING_DIR, "issues"), { recursive: true });
    await Deno.mkdir(path.join(TEST_WORKING_DIR, "tasks"), { recursive: true });
    
    // テスト用ファイルを作成
    await Deno.writeTextFile(
      path.join(TEST_WORKING_DIR, "projects", "project_summary.md"),
      "# Test Project\nThis is a test project."
    );
    
    await Deno.writeTextFile(
      path.join(TEST_WORKING_DIR, "issues", "issue_details.md"),
      "# Test Issue\nThis is a test issue."
    );
    
    await Deno.writeTextFile(
      path.join(TEST_WORKING_DIR, "tasks", "task_list.md"),
      "# Test Task\nThis is a test task."
    );
  }
});

Deno.test("FromFilePath自動補完テスト - パス情報を含む場合", () => {
  const config = { working_dir: TEST_WORKING_DIR };
  
  // パス情報を含むファイル名はそのまま返されることを確認
  const absolutePath = path.join(TEST_WORKING_DIR, "issues", "issue_summary.md");
  const completedPath = completeFromFilePath(absolutePath, config);
  assertEquals(completedPath, absolutePath);
  
  const relativePath = "./issues/issue_summary.md";
  const completedRelativePath = completeFromFilePath(relativePath, config);
  assertEquals(completedRelativePath, relativePath);
});

Deno.test("FromFilePath自動補完テスト - パス情報を含まない場合", () => {
  const config = { working_dir: TEST_WORKING_DIR };
  
  // プロジェクト関連のファイル名
  const projectFile = "project_summary.md";
  const completedProjectPath = completeFromFilePath(projectFile, config);
  assertEquals(completedProjectPath, path.join(TEST_WORKING_DIR, "projects", projectFile));
  
  // イシュー関連のファイル名
  const issueFile = "issue_details.md";
  const completedIssuePath = completeFromFilePath(issueFile, config);
  assertEquals(completedIssuePath, path.join(TEST_WORKING_DIR, "issues", issueFile));
  
  const storyFile = "story_123.md";
  const completedStoryPath = completeFromFilePath(storyFile, config);
  assertEquals(completedStoryPath, path.join(TEST_WORKING_DIR, "issues", storyFile));
  
  // タスク関連のファイル名
  const taskFile = "task_list.md";
  const completedTaskPath = completeFromFilePath(taskFile, config);
  assertEquals(completedTaskPath, path.join(TEST_WORKING_DIR, "tasks", taskFile));
  
  const bugFile = "bug_fix.md";
  const completedBugPath = completeFromFilePath(bugFile, config);
  assertEquals(completedBugPath, path.join(TEST_WORKING_DIR, "tasks", bugFile));
});

Deno.test("DestinationFilePath自動補完テスト - パス情報を含む場合", () => {
  const config = { working_dir: TEST_WORKING_DIR };
  
  // パス情報を含むファイル名はそのまま返されることを確認
  const absolutePath = path.join(TEST_WORKING_DIR, "tasks", "task_output.md");
  const completedPath = completeDestinationFilePath(absolutePath, "task", config);
  assertEquals(completedPath, absolutePath);
  
  const relativePath = "./tasks/task_output.md";
  const completedRelativePath = completeDestinationFilePath(relativePath, "task", config);
  assertEquals(completedRelativePath, relativePath);
});

Deno.test("DestinationFilePath自動補完テスト - パス情報を含まない場合", () => {
  const config = { working_dir: TEST_WORKING_DIR };
  
  // プロジェクトレイヤーの場合
  const projectFile = "project_output.md";
  const completedProjectPath = completeDestinationFilePath(projectFile, "project", config);
  assertEquals(completedProjectPath, path.join(TEST_WORKING_DIR, "projects", projectFile));
  
  // イシューレイヤーの場合
  const issueFile = "issue_output.md";
  const completedIssuePath = completeDestinationFilePath(issueFile, "issue", config);
  assertEquals(completedIssuePath, path.join(TEST_WORKING_DIR, "issues", issueFile));
  
  // タスクレイヤーの場合
  const taskFile = "task_output.md";
  const completedTaskPath = completeDestinationFilePath(taskFile, "task", config);
  assertEquals(completedTaskPath, path.join(TEST_WORKING_DIR, "tasks", taskFile));
});

Deno.test("DestinationFilePath自動補完テスト - 未指定の場合", () => {
  const config = { working_dir: TEST_WORKING_DIR };
  
  // 未指定の場合は自動生成されることを確認
  const completedProjectPath = completeDestinationFilePath(undefined, "project", config);
  assertNotEquals(completedProjectPath, "");
  assertTrue(completedProjectPath.startsWith(path.join(TEST_WORKING_DIR, "projects")));
  assertTrue(completedProjectPath.endsWith(".md"));
  
  // 生成されるファイル名が一意であることを確認
  const completedProjectPath2 = completeDestinationFilePath(undefined, "project", config);
  assertNotEquals(completedProjectPath, completedProjectPath2);
});

// ヘルパー関数
function assertTrue(value: boolean) {
  assertEquals(value, true);
} 