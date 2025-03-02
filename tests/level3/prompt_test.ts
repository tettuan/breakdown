import { assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { setupTestAssets, TEST_ASSETS_DIR } from "../test_utils.ts";

/**
 * プロンプトファイル特定テスト [ID:PROMPT] - レベル3: 入力タイプとファイル特定
 * 
 * 目的:
 * - DemonstrativeTypeとLayerTypeの組み合わせに基づいて正しいプロンプトファイルが特定されることを確認
 * - FromLayerTypeに基づいて正しいプロンプトファイル名（f_<from_layer_type>.md）が特定されることを確認
 * - プロンプトファイルが存在しない場合のエラーハンドリングを確認
 * 
 * 境界線:
 * - プロンプト特定 → 変数置換
 *   プロンプトファイルが特定できないと、変数置換処理が実行できない
 * 
 * 依存関係:
 * - [LAYER] FromLayerType特定テスト
 * - [ARGS] コマンドライン引数解析テスト
 */

// モック関数: 実際の実装では適切なインポートに置き換える
async function determinePromptFile(
  demonstrativeType: string,
  layerType: string,
  fromLayerType: string,
  config: { app_prompt: { base_dir: string } }
): Promise<string> {
  // プロンプトファイルのパスを構築
  const promptDir = path.join(config.app_prompt.base_dir, demonstrativeType, layerType);
  const promptFileName = `f_${fromLayerType}.md`;
  const promptFilePath = path.join(promptDir, promptFileName);
  
  // ファイルの存在確認
  if (!await exists(promptFilePath)) {
    throw new Error(`プロンプトファイルが見つかりません: ${promptFilePath}`);
  }
  
  return promptFilePath;
}

// テスト実行前にセットアップを行う
Deno.test({
  name: "プロンプトファイル特定テストのセットアップ",
  fn: async () => {
    await setupTestAssets();
    
    // テスト用のプロンプトディレクトリとファイルを作成
    const promptsDir = path.join(TEST_ASSETS_DIR, "prompts");
    
    // to/project
    const toProjectDir = path.join(promptsDir, "to", "project");
    await ensureDir(toProjectDir);
    await Deno.writeTextFile(
      path.join(toProjectDir, "f_issue.md"),
      "# To Project from Issue Prompt"
    );
    
    // to/issue
    const toIssueDir = path.join(promptsDir, "to", "issue");
    await ensureDir(toIssueDir);
    await Deno.writeTextFile(
      path.join(toIssueDir, "f_project.md"),
      "# To Issue from Project Prompt"
    );
    await Deno.writeTextFile(
      path.join(toIssueDir, "f_task.md"),
      "# To Issue from Task Prompt"
    );
    
    // to/task
    const toTaskDir = path.join(promptsDir, "to", "task");
    await ensureDir(toTaskDir);
    await Deno.writeTextFile(
      path.join(toTaskDir, "f_issue.md"),
      "# To Task from Issue Prompt"
    );
    
    // summary/project
    const summaryProjectDir = path.join(promptsDir, "summary", "project");
    await ensureDir(summaryProjectDir);
    await Deno.writeTextFile(
      path.join(summaryProjectDir, "f_issue.md"),
      "# Summary Project from Issue Prompt"
    );
  }
});

Deno.test("プロンプトファイル特定テスト - 正常系", async () => {
  const config = {
    app_prompt: {
      base_dir: path.join(TEST_ASSETS_DIR, "prompts")
    }
  };
  
  // to/project/f_issue.md
  const toProjectFromIssue = await determinePromptFile("to", "project", "issue", config);
  assertEquals(
    toProjectFromIssue,
    path.join(config.app_prompt.base_dir, "to", "project", "f_issue.md")
  );
  
  // to/issue/f_project.md
  const toIssueFromProject = await determinePromptFile("to", "issue", "project", config);
  assertEquals(
    toIssueFromProject,
    path.join(config.app_prompt.base_dir, "to", "issue", "f_project.md")
  );
  
  // to/issue/f_task.md
  const toIssueFromTask = await determinePromptFile("to", "issue", "task", config);
  assertEquals(
    toIssueFromTask,
    path.join(config.app_prompt.base_dir, "to", "issue", "f_task.md")
  );
  
  // to/task/f_issue.md
  const toTaskFromIssue = await determinePromptFile("to", "task", "issue", config);
  assertEquals(
    toTaskFromIssue,
    path.join(config.app_prompt.base_dir, "to", "task", "f_issue.md")
  );
  
  // summary/project/f_issue.md
  const summaryProjectFromIssue = await determinePromptFile("summary", "project", "issue", config);
  assertEquals(
    summaryProjectFromIssue,
    path.join(config.app_prompt.base_dir, "summary", "project", "f_issue.md")
  );
});

Deno.test("プロンプトファイル特定テスト - 存在しないファイル", async () => {
  const config = {
    app_prompt: {
      base_dir: path.join(TEST_ASSETS_DIR, "prompts")
    }
  };
  
  // 存在しないプロンプトファイル
  await assertThrows(
    async () => {
      await determinePromptFile("to", "task", "project", config);
    },
    Error,
    "プロンプトファイルが見つかりません"
  );
  
  // 存在しないデモンストレーティブタイプ
  await assertThrows(
    async () => {
      await determinePromptFile("defect", "project", "issue", config);
    },
    Error,
    "プロンプトファイルが見つかりません"
  );
}); 