/**
 * CLIコマンドのテスト
 * 
 * 目的:
 * - CLIコマンドの基本的な動作の検証
 * - --input オプションを含むコマンドライン引数の解析
 * - エラーケースの検証
 * 
 * 関連する仕様:
 * - docs/breakdown/options.ja.md: CLIオプションの仕様
 * 
 * 実装の考慮点:
 * 1. コマンドライン引数の解析
 *    - 必須オプションのチェック
 *    - エイリアスの解決
 *    - 無効な値のエラー処理
 * 
 * 2. ファイル操作
 *    - 入力ファイルの存在チェック
 *    - 出力ディレクトリの作成
 *    - ファイルパスの正規化
 * 
 * 3. エラーハンドリング
 *    - 適切なエラーメッセージ
 *    - エラー時の終了コード
 * 
 * 関連コミット:
 * - feat: add --input option (24671fe)
 * - test: add CLI option tests
 */

import { assertEquals, assert, assertStringIncludes, join, ensureDir, exists } from "../deps.ts";
import { setupTestEnv, cleanupTestFiles, initTestConfig, setupTestDirs, removeWorkDir } from "./test_utils.ts";
import { parseArgs, ERROR_MESSAGES } from "$lib/cli/args.ts";
import { checkpoint, logObject } from "../utils/debug-logger.ts";

// コマンド実行関数をラップしてデバッグ情報を追加
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

Deno.test("CLI Test Suite", async (t) => {
  await t.step("CLI outputs 'to' when given single valid argument", async () => {
    // コマンドを実行
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "to"]);
    
    // 出力を検証
    assertEquals(output.trim(), "to");
  });
  
  await t.step("CLI errors on invalid first argument", async () => {
    // コマンドを実行
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "invalid"]);
    
    // エラー出力を検証
    assertEquals(error.trim(), "Invalid first argument. Must be one of: to, summary, defect, init");
  });
  
  await t.step("CLI errors when file input is missing", async () => {
    // コマンドを実行
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "to", "project"]);
    
    // エラー出力を検証
    assertEquals(error.trim(), "Input file is required. Use --from/-f option");
  });
  
  await t.step("CLI outputs prompt content with --from option", async () => {
    // テスト用のファイルを作成
    const testFilePath = "./test_input.md";
    
    try {
      await Deno.writeTextFile(testFilePath, "# Test Content");
    } catch (e) {
      console.error("Error creating test file", e);
    }
    
    // コマンドを実行
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "to", "project", "--from", testFilePath]);
    
    // エラーメッセージを検証
    assertEquals(output, "# Project Prompt\n{input_markdown}\n\n", "Command should output prompt template");
    
    // テスト用ファイルを削除
    try {
      await Deno.remove(testFilePath);
    } catch (e) {
      console.error("Error removing test file", e);
    }
  });
  
  await t.step("CLI creates working directory on init", async () => {
    // テスト前にディレクトリの状態を確認
    const dirExistsBefore = await exists(".agent/breakdown");
    
    // テスト前にディレクトリを削除
    if (dirExistsBefore) {
      try {
        await Deno.remove(".agent/breakdown", { recursive: true });
      } catch (e) {
        console.error("Error removing directory", e);
      }
    }
    
    // コマンドを実行
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "init"]);
    
    // 出力を検証
    assertEquals(output.trim(), "Created working directory: .agent/breakdown");
    
    // ディレクトリの存在を確認
    const dirExistsAfter = await exists(".agent/breakdown");
    assertEquals(dirExistsAfter, true);
  });
  
  await t.step("CLI reports existing directory on init", async () => {
    // テスト前にディレクトリの状態を確認
    const dirExistsBefore = await exists(".agent/breakdown");
    
    // ディレクトリが存在しない場合は作成
    if (!dirExistsBefore) {
      try {
        await Deno.mkdir(".agent/breakdown", { recursive: true });
      } catch (e) {
        console.error("Error creating directory", e);
      }
    }
    
    // コマンドを実行
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "init"]);
    
    // 出力を検証
    assertEquals(output.trim(), "Working directory already exists: .agent/breakdown");
  });
  
  await t.step("CLI errors on invalid layer type", async () => {
    // コマンドを実行
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "to", "invalid", "--from", "test.md"]);
    
    // エラー出力を検証
    assertEquals(error.trim(), "Invalid second argument. Must be one of: project, issue, task");
  });
});

// 基本的な引数解析のテスト
Deno.test("CLI Arguments Parser - Basic Command Handling", async (t) => {
  // 基本的なコマンド処理のテスト
  await t.step("should handle empty args", () => {
    const args: string[] = [];
    const result = parseArgs(args);
    assertEquals(result.error, "No arguments provided");
  });

  await t.step("should handle invalid command", () => {
    const args = ["invalid"];
    const result = parseArgs(args);
    assertEquals(result.error, "Invalid DemonstrativeType");
  });

  // 基本的なコマンド処理のテスト - 正常系
  await t.step("should handle 'to' command", () => {
    const args = ["to"];
    const result = parseArgs(args);
    assertEquals(result.command, "to");
    assertEquals(result.error, ERROR_MESSAGES.LAYER_REQUIRED);  // LayerType は必須
  });

  await t.step("should handle init command", () => {
    const args = ["init"];
    const result = parseArgs(args);
    assertEquals(result.command, "init");
    assertEquals(result.error, undefined);
  });
});

Deno.test("CLI Arguments Parser - LayerType Handling", async (t) => {
  // 2. レイヤータイプ処理のテスト
  await t.step("should handle 'to project' command", () => {
    const args = ["to", "project"];
    const result = parseArgs(args);
    assertEquals(result.command, "to");
    assertEquals(result.layerType, "project");
    assertEquals(result.error, undefined);
  });

  await t.step("should handle invalid layer type", () => {
    const args = ["to", "invalid"];
    const result = parseArgs(args);
    assertEquals(result.error, "Invalid LayerType");
  });
});

// テスト用のファイルとディレクトリを準備
async function setupTestFiles(testDir: string): Promise<void> {
  const inputDir = join(testDir, "project");
  const outputDir = join(testDir, "issues");
  await ensureDir(inputDir);
  await ensureDir(outputDir);

  // テスト用の入力ファイルを作成
  const inputFile = join(inputDir, "project_summary.md");
  await Deno.writeTextFile(inputFile, `# Test Project
This is a test project summary.`);
} 