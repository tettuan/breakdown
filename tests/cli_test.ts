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

import { assertEquals, assert, join, ensureDir, exists } from "../deps.ts";
import { setupTestEnv, cleanupTestFiles, initTestConfig, setupTestDirs, removeWorkDir } from "./test_utils.ts";
import { parseArgs, ERROR_MESSAGES } from "$lib/cli/args.ts";

// デバッグ用のロガー関数
function log(level: string, message: string, data?: unknown) {
  const LOG_LEVEL = Deno.env.get("LOG_LEVEL") || "info";
  
  const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  if (levels[level as keyof typeof levels] >= levels[LOG_LEVEL as keyof typeof levels]) {
    console.log(`[${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : "");
  }
}

// コマンド実行関数をラップしてデバッグ情報を追加
async function runCommand(cmd: string, args: string[] = []): Promise<{ output: string, error: string }> {
  log("debug", `Executing command: ${cmd} ${args.join(" ")}`);
  
  const command = new Deno.Command(cmd, {
    args,
    stdout: "piped",
    stderr: "piped",
  });
  
  log("debug", "Command created, awaiting output");
  const { stdout, stderr } = await command.output();
  
  const output = new TextDecoder().decode(stdout);
  const error = new TextDecoder().decode(stderr);
  
  log("debug", "Command output received", { 
    output: output.length > 100 ? output.substring(0, 100) + "..." : output,
    error: error.length > 100 ? error.substring(0, 100) + "..." : error
  });
  
  return { output, error };
}

Deno.test("CLI Test Suite", async (t) => {
  await t.step("CLI outputs 'to' when given single valid argument", async () => {
    log("info", "Starting test: CLI outputs 'to' when given single valid argument");
    
    // コマンドを実行
    log("debug", "Running 'breakdown to' command");
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "to"]);
    log("debug", "Command execution completed", { output, error });
    
    // 出力を検証
    log("debug", "Asserting output equals 'to'");
    assertEquals(output.trim(), "to");
    log("info", "Test completed successfully");
  });
  
  await t.step("CLI errors on invalid first argument", async () => {
    log("info", "Starting test: CLI errors on invalid first argument");
    
    // コマンドを実行
    log("debug", "Running 'breakdown invalid' command");
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "invalid"]);
    log("debug", "Command execution completed", { output, error });
    
    // エラー出力を検証
    log("debug", "Asserting error output");
    assertEquals(error.trim(), "Invalid first argument. Must be one of: to, summary, defect, init");
    log("info", "Test completed successfully");
  });
  
  await t.step("CLI errors when file input is missing", async () => {
    log("info", "Starting test: CLI errors when file input is missing");
    
    // コマンドを実行
    log("debug", "Running 'breakdown to project' command");
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "to", "project"]);
    log("debug", "Command execution completed", { output, error });
    
    // エラー出力を検証
    log("debug", "Asserting error output");
    assertEquals(error.trim(), "Input file is required. Use --from/-f option");
    log("info", "Test completed successfully");
  });
  
  await t.step("CLI outputs prompt content with --from option", async () => {
    log("info", "Starting test: CLI outputs prompt content with --from option");
    
    // テスト用のファイルを作成
    const testFilePath = "./test_input.md";
    log("debug", `Creating test file at ${testFilePath}`);
    try {
      await Deno.writeTextFile(testFilePath, "# Test Content");
      log("debug", "Test file created successfully");
    } catch (e) {
      log("error", "Error creating test file", e);
    }
    
    // コマンドを実行
    log("debug", "Running command with --from option");
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "to", "project", "--from", testFilePath]);
    log("debug", "Command execution completed", { output, error });
    
    // エラーメッセージを検証
    log("debug", "Asserting error message contains prompt file not found");
    assertEquals(error.includes("Prompt file not found"), true);
    
    // テスト用ファイルを削除
    log("debug", `Removing test file ${testFilePath}`);
    try {
      await Deno.remove(testFilePath);
      log("debug", "Test file removed successfully");
    } catch (e) {
      log("error", "Error removing test file", e);
    }
    
    log("info", "Test completed successfully");
  });
  
  await t.step("CLI creates working directory on init", async () => {
    log("info", "Starting test: CLI creates working directory on init");
    
    // テスト前にディレクトリの状態を確認
    const dirExistsBefore = await exists(".agent/breakdown");
    log("debug", "Directory exists before test", { dirExistsBefore });
    
    // テスト前にディレクトリを削除
    if (dirExistsBefore) {
      log("debug", "Removing existing directory");
      try {
        await Deno.remove(".agent/breakdown", { recursive: true });
        log("debug", "Directory removed successfully");
      } catch (e) {
        log("error", "Error removing directory", e);
      }
    }
    
    // コマンドを実行
    log("debug", "Running 'breakdown init' command");
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "init"]);
    log("debug", "Command execution completed", { output, error });
    
    // 出力を検証
    log("debug", "Asserting output message");
    assertEquals(output.trim(), "Created working directory: .agent/breakdown");
    
    // ディレクトリの存在を確認
    const dirExistsAfter = await exists(".agent/breakdown");
    log("debug", "Directory exists after test", { dirExistsAfter });
    assertEquals(dirExistsAfter, true);
    
    log("info", "Test completed successfully");
  });
  
  await t.step("CLI reports existing directory on init", async () => {
    log("info", "Starting test: CLI reports existing directory on init");
    
    // テスト前にディレクトリの状態を確認
    const dirExistsBefore = await exists(".agent/breakdown");
    log("debug", "Directory exists before test", { dirExistsBefore });
    
    // ディレクトリが存在しない場合は作成
    if (!dirExistsBefore) {
      log("debug", "Creating directory for test");
      try {
        await Deno.mkdir(".agent/breakdown", { recursive: true });
        log("debug", "Directory created successfully");
      } catch (e) {
        log("error", "Error creating directory", e);
      }
    }
    
    // コマンドを実行
    log("debug", "Running 'breakdown init' command");
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "init"]);
    log("debug", "Command execution completed", { output, error });
    
    // 出力を検証
    log("debug", "Asserting output message");
    assertEquals(output.trim(), "Working directory already exists: .agent/breakdown");
    
    log("info", "Test completed successfully");
  });
  
  await t.step("CLI errors on invalid layer type", async () => {
    log("info", "Starting test: CLI errors on invalid layer type");
    
    // コマンドを実行
    log("debug", "Running command with invalid layer type");
    const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "to", "invalid", "--from", "test.md"]);
    log("debug", "Command execution completed", { output, error });
    
    // エラー出力を検証
    log("debug", "Asserting error output");
    assertEquals(error.trim(), "Invalid second argument. Must be one of: project, issue, task");
    
    log("info", "Test completed successfully");
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