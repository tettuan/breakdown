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

Deno.test({
  name: "CLI Test Suite",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    const testDir = await setupTestEnv();
    const commonEnv = {
      // BREAKDOWN_TEST と BREAKDOWN_TEST_DIR を削除
      // "BREAKDOWN_TEST": "true",
      // "BREAKDOWN_TEST_DIR": testDir
    };

    try {
      await t.step("CLI outputs 'to' when given single valid argument", async () => {
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to"],
          stdout: "piped",
          env: commonEnv
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        assertEquals(output, "to");
      });

      await t.step("CLI errors on invalid first argument", async () => {
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "invalid"],
          stderr: "piped",
        });

        const { stderr } = await process.output();
        const error = new TextDecoder().decode(stderr).trim();
        assertEquals(error, "Invalid first argument. Must be one of: to, summary, defect, init");
      });

      await t.step("CLI errors when file input is missing", async () => {
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "project"],
          stderr: "piped",
        });

        const { stderr } = await process.output();
        const error = new TextDecoder().decode(stderr).trim();
        assertEquals(error, "Input file is required. Use --from/-f option");
      });

      await t.step("CLI outputs prompt content with --from option", async () => {
        const testFile = "./.agent/breakdown/project/project_summary.md";
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "issue", "--from", testFile],
          stdout: "piped",
          stderr: "piped",
          env: commonEnv
        });

        const { stdout, stderr } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        
        assert(output.includes("## Input"));
        assert(output.includes("## Source"));
        assert(output.includes(testFile));
        assert(output.includes("./rules/schema/to/issue/base.schema.json"));
      });

      await t.step("CLI outputs prompt content with -f alias", async () => {
        const testFile = "./.agent/breakdown/project/project_summary.md";
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "issue", "-f", testFile],
          stdout: "piped",
          stderr: "piped",
          env: commonEnv
        });

        const { stdout, stderr } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        
        assert(output.includes("## Input"));
        assert(output.includes("## Source"));
        assert(output.includes(testFile));
      });

      await t.step("CLI outputs prompt content with destination", async () => {
        const inputFile = "./.agent/breakdown/project/project_summary.md";
        const outputFile = "./.agent/breakdown/issues/issue_summary.md";
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "issue", "-f", inputFile, "-o", outputFile],
          stdout: "piped",
          stderr: "piped",
          env: commonEnv
        });

        const { stdout, stderr } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        
        assert(output.includes("## Input"));
        assert(output.includes("## Source"));
        assert(output.includes("## Output"));
        assert(output.includes(inputFile));
        assert(output.includes(outputFile));
      });

      await t.step("CLI creates working directory on init", async () => {
        await removeWorkDir();
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "init"],
          stdout: "piped",
          env: commonEnv
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        assertEquals(output, `Created working directory: ${testDir}`);
      });

      await t.step("CLI reports existing directory on init", async () => {
        // このテストでは作業ディレクトリを作成する
        initTestConfig();
        await setupTestDirs();

        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "init"],
          stdout: "piped",
          env: commonEnv
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        assertEquals(output, `Working directory already exists: ${testDir}`);
      });

      await t.step("CLI errors on invalid layer type", async () => {
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "invalid"],
          stderr: "piped",
        });

        const { stderr } = await process.output();
        const error = new TextDecoder().decode(stderr).trim();
        assertEquals(error, "Invalid second argument. Must be one of: project, issue, task");
      });
    } finally {
      await cleanupTestFiles();
    }
  }
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