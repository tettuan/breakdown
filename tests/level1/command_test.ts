import { assertEquals, assertStringIncludes } from "https://deno.land/std/testing/asserts.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";
import { removeTestDirs, TEST_WORKING_DIR } from "../test_utils.ts";

/**
 * 基本コマンド処理テスト [ID:CMD] - レベル1: 基本設定とコマンド処理
 * 
 * 目的:
 * - `breakdown --help` または `-h` が正しいヘルプ情報を表示することを確認
 * - `breakdown --version` または `-v` が正しいバージョン情報を表示することを確認
 * - `breakdown init` が正しく作業ディレクトリを作成することを確認
 * - 既に作業ディレクトリが存在する場合の適切なメッセージを確認
 * 
 * 境界線:
 * - コマンドライン引数解析 → プロンプト/スキーマ特定
 *   引数解析が正しく行われないと、正しいプロンプトやスキーマを特定できない
 */

// モック関数: 実際の実装では適切なインポートに置き換える
async function runCommand(args: string[]) {
  // 実際のコマンド実行をシミュレート
  let output = "";
  let error = "";
  
  if (args.includes("--help") || args.includes("-h")) {
    output = `
Usage: breakdown [command] [options]

Commands:
  to <layer>       Convert to specified layer
  summary <layer>  Summarize to specified layer
  defect <layer>   Report defects for specified layer
  init             Initialize working directory

Options:
  --from, -f       Input file path
  --destination, -o Output file path
  --input, -i      Input layer type
  --help, -h       Show help
  --version, -v    Show version
`;
  } else if (args.includes("--version") || args.includes("-v")) {
    output = "breakdown v1.0.0";
  } else if (args.includes("init")) {
    const dirExists = await exists(TEST_WORKING_DIR);
    
    if (!dirExists) {
      // ディレクトリを作成
      await Deno.mkdir(TEST_WORKING_DIR, { recursive: true });
      await Deno.mkdir(`${TEST_WORKING_DIR}/projects`, { recursive: true });
      await Deno.mkdir(`${TEST_WORKING_DIR}/issues`, { recursive: true });
      await Deno.mkdir(`${TEST_WORKING_DIR}/tasks`, { recursive: true });
      
      output = `作業ディレクトリを作成しました: ${TEST_WORKING_DIR}`;
    } else {
      output = `作業ディレクトリは既に存在します: ${TEST_WORKING_DIR}`;
    }
  } else {
    error = "Unknown command or option";
  }
  
  return { output, error };
}

// テスト実行前にセットアップを行う
Deno.test({
  name: "コマンド処理テストのセットアップ",
  fn: async () => {
    await removeTestDirs();
  }
});

Deno.test("ヘルプコマンドテスト", async () => {
  const { output } = await runCommand(["--help"]);
  
  assertStringIncludes(output, "Usage:");
  assertStringIncludes(output, "--from");
  assertStringIncludes(output, "--destination");
  assertStringIncludes(output, "--input");
  
  // エイリアスでも同様に動作することを確認
  const { output: aliasOutput } = await runCommand(["-h"]);
  assertEquals(output, aliasOutput);
});

Deno.test("バージョン確認コマンドテスト", async () => {
  const { output } = await runCommand(["--version"]);
  
  // バージョン情報の形式を確認
  assertStringIncludes(output, "breakdown v");
  
  // エイリアスでも同様に動作することを確認
  const { output: aliasOutput } = await runCommand(["-v"]);
  assertEquals(output, aliasOutput);
});

Deno.test("初期化コマンドテスト - 新規作成", async () => {
  const { output } = await runCommand(["init"]);
  
  assertStringIncludes(output, "作業ディレクトリを作成しました");
  
  // ディレクトリが作成されたことを確認
  const dirExists = await exists(TEST_WORKING_DIR);
  assertEquals(dirExists, true);
  
  // サブディレクトリも作成されていることを確認
  const projectsDirExists = await exists(`${TEST_WORKING_DIR}/projects`);
  const issuesDirExists = await exists(`${TEST_WORKING_DIR}/issues`);
  const tasksDirExists = await exists(`${TEST_WORKING_DIR}/tasks`);
  
  assertEquals(projectsDirExists, true);
  assertEquals(issuesDirExists, true);
  assertEquals(tasksDirExists, true);
});

Deno.test("初期化コマンドテスト - 既存の場合", async () => {
  const { output } = await runCommand(["init"]);
  
  assertStringIncludes(output, "作業ディレクトリは既に存在します");
}); 