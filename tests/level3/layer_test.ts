import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { setupTestAssets, TEST_WORKING_DIR } from "../test_utils.ts";

/**
 * FromLayerType特定テスト [ID:LAYER] - レベル3: 入力タイプとファイル特定
 * 
 * 目的:
 * - --inputオプションで指定された値からFromLayerTypeが正しく特定されることを確認
 * - -iエイリアスでも同様に動作することを確認
 * - 大文字小文字を区別せずに特定されることを確認
 * - "project"として認識される値のテスト（project, pj, prj）
 * - "issue"として認識される値のテスト（issue, story）
 * - "task"として認識される値のテスト（task, todo, chore, style, fix, error, bug）
 * - --inputオプションが指定されていない場合に--fromオプションのファイル名からFromLayerTypeが推測されることを確認
 * - --inputと--fromの両方が指定された場合に--inputが優先されることを確認
 * 
 * 境界線:
 * - FromLayerType特定 → プロンプトファイル選択
 *   入力タイプが正しく特定されないと、適切なプロンプトファイルを選択できない
 * 
 * 依存関係:
 * - [ARGS] コマンドライン引数解析テスト
 * - [PATH] ファイルパス自動補完テスト
 */

// モック関数: 実際の実装では適切なインポートに置き換える
function determineFromLayerType(
  inputLayerType: string | undefined, 
  fromFile: string | undefined
): string {
  // inputLayerTypeが指定されている場合はそれを優先
  if (inputLayerType) {
    const lowerInput = inputLayerType.toLowerCase();
    
    // project関連
    if (["project", "pj", "prj"].includes(lowerInput)) {
      return "project";
    }
    
    // issue関連
    if (["issue", "story"].includes(lowerInput)) {
      return "issue";
    }
    
    // task関連
    if (["task", "todo", "chore", "style", "fix", "error", "bug"].includes(lowerInput)) {
      return "task";
    }
  }
  
  // fromFileからの推測
  if (fromFile) {
    const fileName = path.basename(fromFile).toLowerCase();
    
    // project関連
    if (fileName.includes("project") || fileName.includes("pj") || fileName.includes("prj")) {
      return "project";
    }
    
    // issue関連
    if (fileName.includes("issue") || fileName.includes("story")) {
      return "issue";
    }
    
    // task関連
    if (fileName.includes("task") || fileName.includes("todo") || 
        fileName.includes("chore") || fileName.includes("style") || 
        fileName.includes("fix") || fileName.includes("error") || 
        fileName.includes("bug")) {
      return "task";
    }
  }
  
  // デフォルト
  return "project";
}

// テスト実行前にセットアップを行う
Deno.test({
  name: "FromLayerType特定テストのセットアップ",
  fn: async () => {
    await setupTestAssets();
  }
});

Deno.test("FromLayerType特定テスト - inputLayerTypeから特定", () => {
  // project関連
  assertEquals(determineFromLayerType("project", undefined), "project");
  assertEquals(determineFromLayerType("pj", undefined), "project");
  assertEquals(determineFromLayerType("prj", undefined), "project");
  assertEquals(determineFromLayerType("PROJECT", undefined), "project"); // 大文字小文字を区別しない
  
  // issue関連
  assertEquals(determineFromLayerType("issue", undefined), "issue");
  assertEquals(determineFromLayerType("story", undefined), "issue");
  assertEquals(determineFromLayerType("ISSUE", undefined), "issue"); // 大文字小文字を区別しない
  
  // task関連
  assertEquals(determineFromLayerType("task", undefined), "task");
  assertEquals(determineFromLayerType("todo", undefined), "task");
  assertEquals(determineFromLayerType("chore", undefined), "task");
  assertEquals(determineFromLayerType("style", undefined), "task");
  assertEquals(determineFromLayerType("fix", undefined), "task");
  assertEquals(determineFromLayerType("error", undefined), "task");
  assertEquals(determineFromLayerType("bug", undefined), "task");
  assertEquals(determineFromLayerType("TASK", undefined), "task"); // 大文字小文字を区別しない
});

Deno.test("FromLayerType特定テスト - fromFileから特定", () => {
  // project関連
  assertEquals(determineFromLayerType(undefined, "project_summary.md"), "project");
  assertEquals(determineFromLayerType(undefined, "pj_plan.md"), "project");
  assertEquals(determineFromLayerType(undefined, "prj_overview.md"), "project");
  assertEquals(determineFromLayerType(undefined, path.join(TEST_WORKING_DIR, "projects", "project_summary.md")), "project");
  
  // issue関連
  assertEquals(determineFromLayerType(undefined, "issue_details.md"), "issue");
  assertEquals(determineFromLayerType(undefined, "story_123.md"), "issue");
  assertEquals(determineFromLayerType(undefined, path.join(TEST_WORKING_DIR, "issues", "issue_details.md")), "issue");
  
  // task関連
  assertEquals(determineFromLayerType(undefined, "task_list.md"), "task");
  assertEquals(determineFromLayerType(undefined, "todo_items.md"), "task");
  assertEquals(determineFromLayerType(undefined, "chore_cleanup.md"), "task");
  assertEquals(determineFromLayerType(undefined, "style_fixes.md"), "task");
  assertEquals(determineFromLayerType(undefined, "fix_bug.md"), "task");
  assertEquals(determineFromLayerType(undefined, "error_handling.md"), "task");
  assertEquals(determineFromLayerType(undefined, "bug_report.md"), "task");
  assertEquals(determineFromLayerType(undefined, path.join(TEST_WORKING_DIR, "tasks", "task_list.md")), "task");
});

Deno.test("FromLayerType特定テスト - 優先順位", () => {
  // inputLayerTypeとfromFileの両方が指定された場合、inputLayerTypeが優先される
  assertEquals(determineFromLayerType("issue", "project_summary.md"), "issue");
  assertEquals(determineFromLayerType("task", "issue_details.md"), "task");
  assertEquals(determineFromLayerType("project", "task_list.md"), "project");
  
  // どちらも指定されていない場合はデフォルト値
  assertEquals(determineFromLayerType(undefined, undefined), "project");
}); 