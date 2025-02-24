/// <reference lib="deno.ns" />
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

import { assertEquals, assert, assertRejects } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { setupTestEnv, cleanupTestFiles, initTestConfig, setupTestDirs, removeWorkDir } from "./test_utils.ts";
import { parseArgs } from "@/cli/args.ts";
import { ERROR_MESSAGES } from "@/cli/constants.ts";
import { join, dirname } from "https://deno.land/std@0.208.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { runCLI, processCommand, processWithPrompt } from "@/cli/breakdown.ts";
import { ExitCode } from "@/cli/types.ts";
import { Args, ProcessResult } from "@/cli/types.ts";
import { setupPromptFixtures } from "./fixtures/setup.ts";
import {
  beforeEach,
  afterEach,
  describe,
  it
} from "https://deno.land/std@0.208.0/testing/bdd.ts";

// 1. テストディレクトリのパス定数化
const TEST_DIRS = {
  root: ".agent_test/breakdown",
  prompts: "./tests/fixtures/prompts",
  temp: "./tmp"
} as const;

// 2. テンプレート管理の統一
const TEST_TEMPLATES = {
  project: `## Input
{input_markdown}

## Source
{input_markdown_file}

## Schema
{schema_file}

## Output
{destination_path}`
} as const;

// 1. 型定義の整理
type EnvVars = Record<string, string>;

interface TestDirectories {
  root: string;
  prompt: string;
}

interface TestEnvironment {
  env: EnvVars;
  dirs: TestDirectories;
}

// 2. 環境設定関数
async function setupTestEnvironment(testDir: string): Promise<TestEnvironment> {
  await setupPromptFixtures();
  
  const dirs: TestDirectories = {
    root: testDir,
    prompt: "./tests/fixtures/prompts"
  };
  
  const env: EnvVars = {
    "NO_COLOR": "1",
    "BREAKDOWN_TEST_DIR": testDir,
    "BREAKDOWN_PROMPT_DIR": dirs.prompt,
    "BREAKDOWN_ROOT": testDir
  };

  Object.entries(env).forEach(([key, value]) => {
    Deno.env.set(key, value);
  });
  
  return { env, dirs };
}

async function setupPromptTemplate(type: keyof typeof TEST_TEMPLATES) {
  // ... テンプレート設定
}

async function runTest() {
  // ... テスト実行
}

Deno.test("CLI Test Suite", async (t) => {
  await t.step("setup", async () => {
    await removeWorkDir();
    await setupTestEnv();
  });

  const testDir = await setupTestEnv();
  const { env } = await setupTestEnvironment(testDir);

  await t.step("CLI handles basic commands", async (t) => {
    await t.step("outputs 'to' for single argument", async () => {
      const process = new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "./src/cli/breakdown.ts", "to"],
        stdout: "piped"
      });
      const { stdout } = await process.output();
      assertEquals(new TextDecoder().decode(stdout).trim(), "to");
    });
  });

  await t.step("CLI processes prompts", async (t) => {
    await t.step("loads and processes template", async () => {
      const testDir = await setupTestEnv();
      const promptDir = join(testDir, "prompts");
      
      // 入力ファイルの準備を追加
      const inputFile = join(testDir, "input.md");
      await Deno.writeTextFile(inputFile, "# Test Project\n\nDescription");

      // プロンプトファイルを作成する前にディレクトリを確認
      const promptPath = join(promptDir, "to/project/f_project.md");
      await ensureDir(dirname(promptPath));

      // プロンプトテンプレートを書き込む前に既存ファイルを削除
      try {
        await Deno.remove(promptPath);
      } catch {
        // ファイルが存在しない場合は無視
      }

      // 新しいテンプレートを書き込み
      await Deno.writeTextFile(promptPath, TEST_TEMPLATES.project);

      // テストの実行
      const result = await processCommand({
        command: "to",
        layerType: "project",
        fromFile: inputFile,
        _: ["to", "project"]
      });

      assert(result.success, "Command should succeed");
      const output = result.data?.toString() || "";
      const EXPECTED_TEMPLATE_FORMAT = {
        heading: "# ",  // 見出しレベルを定数化
        sections: ["Input", "Source", "Schema", "Output"]
      };

      // テストケース内で使用
      const sections = EXPECTED_TEMPLATE_FORMAT.sections;
      sections.forEach(section => {
        assert(
          output.includes(`${EXPECTED_TEMPLATE_FORMAT.heading}${section}`),
          `Expected prompt to include '${EXPECTED_TEMPLATE_FORMAT.heading}${section}'`
        );
      });
    });
  });

  await t.step("CLI handles file output", async (t) => {
    await t.step("creates output file", async () => {
      const testDir = await setupTestEnv();
      const inputFile = join(testDir, "input.md");
      const outputFile = join(testDir, "output.json");

      // 入力ファイルの準備
      await Deno.writeTextFile(inputFile, "# Test Project\n\nDescription");

      const result = await processCommand({
        command: "to",
        layerType: "project",
        fromFile: inputFile,
        destinationFile: outputFile,
        _: ["to", "project"]
      });

      assert(result.success, "Command should succeed");
      assert(await exists(outputFile), "Output file should exist");
    });
  });

  await t.step("CLI errors on invalid first argument", async () => {
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./src/cli/breakdown.ts", "invalid"],
      stderr: "piped",
    });

    const { stderr } = await process.output();
    const error = new TextDecoder().decode(stderr).trim();
    assertEquals(error, "Invalid first argument. Must be one of: to, summary, defect, init");
  });

  await t.step("CLI errors when file input is missing", async () => {
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./src/cli/breakdown.ts", "to", "project"],
      stderr: "piped",
    });

    const { stderr } = await process.output();
    const error = new TextDecoder().decode(stderr).trim();
    assertEquals(error, "Input file is required. Use --from/-f option");
  });

  await t.step("CLI outputs prompt content with --from option", async () => {
    const testDir = await setupTestEnv();
    const { env, dirs } = await setupTestEnvironment(testDir);

    // 1. ディレクトリ構造の確認
    console.log("Test environment:", {
      testDir,
      dirs,
      env: {
        ...env,
        pwd: Deno.cwd()
      }
    });

    // 2. 入力ファイルの準備
    const inputFile = join(testDir, "input.md");
    await Deno.writeTextFile(inputFile, "# Test Project\n\nDescription");
    console.log("Input file created:", inputFile);

    // 3. プロンプトファイルの準備
    const promptFile = join(dirs.prompt, "to/project/f_project.md");
    await Deno.writeTextFile(promptFile, TEST_TEMPLATES.project);
    console.log("Prompt file created:", promptFile);

    // 4. 出力ディレクトリの準備
    const outputFile = join(testDir, "output.json");
    await ensureDir(dirname(outputFile));
    console.log("Output directory created:", dirname(outputFile));

    // 5. テスト対象のコマンド実行
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./src/cli/breakdown.ts", "to", "project", 
             "--from", inputFile, 
             "--destination", join(testDir, "output.json")],
      stdout: "piped",
      stderr: "piped",
      env
    });

    const { stdout, stderr, code } = await process.output();
    console.log("Process output:", {
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr)
    });

    // 6. 出力の確認
    assert(await exists(outputFile), `Output file not found: ${outputFile}`);
    const fileContent = await Deno.readTextFile(outputFile);
    console.log("Output file content:", fileContent);

    assertEquals(code, 0);
    assert(stderr.length === 0, "Expected no errors");
  });

  await t.step("CLI outputs prompt content with -f alias", async () => {
    const testDir = await setupTestEnv();
    const { env, dirs } = await setupTestEnvironment(testDir);

    await Deno.writeTextFile(
      join(dirs.prompt, "to/project/f_project.md"),
      TEST_TEMPLATES.project  // ##形式のテンプレート
    );

    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./src/cli/breakdown.ts", "to", "project", "-f", "input.md"],
      stdout: "piped",
      stderr: "piped",
      env
    });

    const { stdout, stderr } = await process.output();
    console.log("Args check:", {
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr)
    });
  });

  await t.step("CLI outputs prompt content with destination", async () => {
    const inputFile = "./.agent/breakdown/project/project_summary.md";
    const outputFile = "./.agent/breakdown/issues/issue_summary.md";
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./src/cli/breakdown.ts", "to", "issue", "-f", inputFile, "-o", outputFile],
      stdout: "piped",
      env: env
    });

    const { stdout } = await process.output();
    const output = new TextDecoder().decode(stdout).trim();
    
    assert(output.includes("# Input"));
    assert(output.includes("# Source"));
    assert(output.includes("# Output"));
    assert(output.includes(inputFile));
    assert(output.includes(outputFile));
  });

  await t.step("CLI creates working directory on init", async () => {
    // 既存のディレクトリを削除
    await removeWorkDir();
    
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./src/cli/breakdown.ts", "init"],
      stdout: "piped",
      env
    });

    const { stdout } = await process.output();
    const output = new TextDecoder().decode(stdout).trim();
    assertEquals(output, `Created working directory: ${testDir}`);
  });

  await t.step("CLI reports existing directory on init", async () => {
    initTestConfig();
    await setupTestDirs();

    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./src/cli/breakdown.ts", "init"],
      stdout: "piped",
      env: env
    });

    const { stdout } = await process.output();
    const output = new TextDecoder().decode(stdout).trim();
    assertEquals(output, `Working directory already exists: ${testDir}`);
  });

  await t.step("CLI errors on invalid layer type", async () => {
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./src/cli/breakdown.ts", "to", "invalid"],
      stderr: "piped",
    });

    const { stderr } = await process.output();
    const error = new TextDecoder().decode(stderr).trim();
    assertEquals(error, "Invalid second argument. Must be one of: project, issue, task");
  });

  await t.step("cleanup", async () => {
    await cleanupTestFiles();
  });

  await t.step("CLI generates prompt correctly", async () => {
    const testDir = await setupTestEnv();
    const { env, dirs } = await setupTestEnvironment(testDir);

    const inputFile = join(testDir, "input.md");
    await Deno.writeTextFile(inputFile, "# Test Project\n\nDescription");

    // プロンプト生成のみをテスト
    const result = await processCommand({
      command: "to",
      layerType: "project",
      fromFile: inputFile,
      _: ["to", "project"]
    });

    console.log("Prompt check:", {
      success: result.success,
      data: result.data
    });
  });

  await t.step("CLI writes output file correctly", async () => {
    const testDir = await setupTestEnv();
    const outputFile = join(testDir, "output.json");
    
    const result = await processWithPrompt(
      "to",
      "project",
      "input.md",
      outputFile
    );

    console.log("File output check:", {
      outputFile,
      exists: await exists(outputFile)
    });

    if (await exists(outputFile)) {
      const content = await Deno.readTextFile(outputFile);
      console.log("File content:", content);
    }
  });

  await t.step("should process markdown input from file", async () => {
    const testDir = await setupTestEnv();
    
    try {
      const promptDir = join(testDir, "prompts");
      await ensureDir(join(promptDir, "to/project"));
      
      const promptPath = join(promptDir, "to/project/f_project.md");
      await Deno.writeTextFile(promptPath, TEST_TEMPLATES.project);

      const inputFile = join(testDir, "input.md");
      const outputFile = join(testDir, "output.json");
      
      // 出力ディレクトリの作成を確実に
      await ensureDir(dirname(outputFile));
      await Deno.writeTextFile(inputFile, "# Test Project\n\nDescription");

      // プロセス実行前の状態確認
      console.log("Pre-process state:", {
        testDir: await exists(testDir),
        promptDir: await exists(promptDir),
        outputDir: await exists(dirname(outputFile))
      });
      
      const process = new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "./src/cli/breakdown.ts", "to", "project", 
               "--from", inputFile, 
               "--output", outputFile],
        stdout: "piped",
        stderr: "piped",
        cwd: Deno.cwd(),
        env: { 
          "NO_COLOR": "1",
          "BREAKDOWN_TEST_DIR": testDir,
          "BREAKDOWN_PROMPT_DIR": promptDir
        }
      });

      // プロセス実行を待機
      const { code, stdout, stderr } = await process.output();
      
      // 出力ファイルの存在を確認
      assert(await exists(outputFile), "Output file should exist");
      
      // ファイルの内容を確認
      const fileContent = await Deno.readTextFile(outputFile);
      const result = JSON.parse(fileContent);
      assertEquals(result.data.title, "Test Project");
    } finally {
      await Deno.remove(testDir, { recursive: true });
    }
  });
});

// 基本的な引数解析のテスト
Deno.test("CLI Arguments Parser - Basic Command Handling", async (t) => {
  // 基本的なコマンド処理のテスト
  await t.step("should handle empty args", () => {
    const args: string[] = [];
    const result = parseArgs(args);
    assertEquals(result, {
      command: "",
      error: ERROR_MESSAGES.NO_ARGS,
      _: args
    });
  });

  await t.step("should handle invalid command", () => {
    const args = ["invalid"];
    const result = parseArgs(args);
    assertEquals(result, {
      command: "invalid",
      error: ERROR_MESSAGES.INVALID_DEMONSTRATIVE,
      _: args
    });
  });

  // 基本的なコマンド処理のテスト - 正常系
  await t.step("should handle 'to' command", () => {
    const args = ["to"];
    const result = parseArgs(args);
    assertEquals(result, {
      command: "to",
      error: ERROR_MESSAGES.LAYER_REQUIRED,
      _: args
    });
  });

  await t.step("should handle init command", () => {
    const args = ["init"];
    const result = parseArgs(args);
    assertEquals(result, {
      command: "init",
      _: args
    });
  });
});

Deno.test("CLI Arguments Parser - LayerType Handling", async (t) => {
  // 2. レイヤータイプ処理のテスト
  await t.step("should handle 'to project' command", () => {
    const args = ["to", "project"];
    const result = parseArgs(args);
    assertEquals(result, {
      command: "to",
      layerType: "project",
      _: args
    });
  });

  await t.step("should handle invalid layer type", () => {
    const args = ["to", "invalid"];
    const result = parseArgs(args);
    assertEquals(result, {
      command: "to",
      error: ERROR_MESSAGES.INVALID_LAYER,
      _: args
    });
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

Deno.test("parseArgs", async (t) => {
  await t.step("should handle empty args", () => {
    const result = parseArgs([]);
    assertEquals(result, {
      command: "",
      error: ERROR_MESSAGES.NO_ARGS,
      _: []
    });
  });

  await t.step("should handle init command", () => {
    const result = parseArgs(["init"]);
    assertEquals(result, {
      command: "init",
      _: ["init"]
    });
  });

  await t.step("should validate 'to' command with project layer", () => {
    const args = ["to", "project", "input.md", "-o", "output.json"];
    const result = parseArgs(args);
    assertEquals(result, {
      command: "to",
      layerType: "project",
      destinationFile: "output.json",
      _: args
    });
  });

  await t.step("should validate 'summary' command with issue layer", () => {
    const args = ["summary", "issue", "--from", "project.json"];
    const result = parseArgs(args);
    assertEquals(result, {
      command: "summary",
      layerType: "issue",
      fromFile: "project.json",
      inputLayerType: "project",
      _: args
    });
  });

  await t.step("should handle input layer type inference", () => {
    const args = ["to", "task", "--from", "project/issue-123.md"];
    const result = parseArgs(args);
    assertEquals(result, {
      command: "to",
      layerType: "task",
      fromFile: "project/issue-123.md",
      inputLayerType: "project",
      _: args
    });
  });

  await t.step("should handle explicit input layer type", () => {
    const args = ["to", "task", "-i", "story"];
    const result = parseArgs(args);
    assertEquals(result, {
      command: "to",
      layerType: "task",
      inputLayerType: "issue",
      _: args
    });
  });

  await t.step("should reject invalid demonstrative type", () => {
    const args = ["invalid", "project"];
    const result = parseArgs(args);
    assertEquals(result, {
      command: "invalid",
      error: ERROR_MESSAGES.INVALID_DEMONSTRATIVE,
      _: args
    });
  });

  await t.step("should reject invalid layer type", () => {
    const args = ["to", "invalid"];
    const result = parseArgs(args);
    assertEquals(result, {
      command: "to",
      error: ERROR_MESSAGES.INVALID_LAYER,
      _: args
    });
  });
});

// メインプロセスのテスト
Deno.test("main process", async (t) => {
  await t.step("should process markdown input from file", async () => {
    const testDir = await setupTestEnv();
    
    try {
      const promptDir = join(testDir, "prompts");
      await ensureDir(join(promptDir, "to/project"));
      
      const promptPath = join(promptDir, "to/project/f_project.md");
      await Deno.writeTextFile(promptPath, TEST_TEMPLATES.project);

      const inputFile = join(testDir, "input.md");
      const outputFile = join(testDir, "output.json");
      
      // 出力ディレクトリの作成を確実に
      await ensureDir(dirname(outputFile));
      await Deno.writeTextFile(inputFile, "# Test Project\n\nDescription");

      // プロセス実行前の状態確認
      console.log("Pre-process state:", {
        testDir: await exists(testDir),
        promptDir: await exists(promptDir),
        outputDir: await exists(dirname(outputFile))
      });
      
      const process = new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "./src/cli/breakdown.ts", "to", "project", 
               "--from", inputFile, 
               "--output", outputFile],
        stdout: "piped",
        stderr: "piped",
        cwd: Deno.cwd(),
        env: { 
          "NO_COLOR": "1",
          "BREAKDOWN_TEST_DIR": testDir,
          "BREAKDOWN_PROMPT_DIR": promptDir
        }
      });

      // プロセス実行を待機
      const { code, stdout, stderr } = await process.output();
      
      // 出力ファイルの存在を確認
      assert(await exists(outputFile), "Output file should exist");
      
      // ファイルの内容を確認
      const fileContent = await Deno.readTextFile(outputFile);
      const result = JSON.parse(fileContent);
      assertEquals(result.data.title, "Test Project");
    } finally {
      await Deno.remove(testDir, { recursive: true });
    }
  });
});

// 入力ソース判定のテスト
Deno.test("Input Source Detection", async (t) => {
  await t.step("should detect input source correctly", async () => {
    const testDir = await Deno.makeTempDir();
    const inputFile = join(testDir, "input.md");
    await Deno.writeTextFile(inputFile, "# Test");

    const fileArgs: Args = {
      command: "to",
      layerType: "project",
      fromFile: inputFile,
      _: ["to", "project"]
    };
    const fileResult = await processCommand(fileArgs);
    assertEquals(fileResult.code, ExitCode.Success);
  });
});

// テストのセットアップ部分を修正
async function setupTest() {
  const testDir = ".agent_test/breakdown";
  const promptDir = "./tests/fixtures/prompts";

  // 既存のテンプレート変数を使用
  const promptPath = join(promptDir, "to", "project", "f_project.md");
  await ensureDir(dirname(promptPath));
  await Deno.writeTextFile(promptPath, TEST_TEMPLATES.project);

  return {
    testDir,
    promptDir,
    promptPath
  };
} 