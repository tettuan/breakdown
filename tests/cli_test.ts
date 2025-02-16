import { assertEquals, assert } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { setupTestEnv, cleanupTestFiles, initTestConfig, setupTestDirs, removeWorkDir } from "./test_utils.ts";
import { parseArgs } from "../cli/args.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";

Deno.test({
  name: "CLI Test Suite",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    const testDir = await setupTestEnv();
    const commonEnv = {
      "BREAKDOWN_TEST": "true",
      "BREAKDOWN_TEST_DIR": testDir
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
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        
        // プロンプトの内容が含まれていることを確認
        assert(output.includes("プロジェクトからIssueへの変換プロンプト"));
        assert(output.length > 0);
      });

      await t.step("CLI outputs prompt content with -f alias", async () => {
        const testFile = "./.agent/breakdown/project/project_summary.md";
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "issue", "-f", testFile],
          stdout: "piped",
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        assert(output.includes("プロジェクトからIssueへの変換プロンプト"));
        assert(output.length > 0);
      });

      await t.step("CLI outputs prompt content with destination", async () => {
        const testDir = await setupTestEnv();
        await setupTestFiles(testDir);

        const inputFile = "./.agent/breakdown/project/project_summary.md";
        const outputFile = "./.agent/breakdown/issues/issue_summary.md";
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "issue", "-f", inputFile, "-o", outputFile],
          stdout: "piped",
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        
        // 期待値を新しいプロンプト形式に合わせる
        assert(output.includes("# Input"));
        assert(output.includes("# Source"));
        assert(output.includes("# Output"));
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
Deno.test("CLI Arguments Parser", async (t) => {
  await t.step("should return error for empty args", () => {
    const args: string[] = [];
    const result = parseArgs(args);
    assertEquals(result.error, "No arguments provided");
  });

  await t.step("should handle 'to' command", () => {
    const args = ["to"];
    const result = parseArgs(args);
    assertEquals(result.demonstrativeType, "to");
    assertEquals(result.error, undefined);
  });

  await t.step("should validate DemonstrativeType", () => {
    const args = ["invalid", "project"];
    const result = parseArgs(args);
    assertEquals(result.error, "Invalid DemonstrativeType");
  });

  await t.step("should handle 'to project' command", () => {
    const args = ["to", "project"];
    const result = parseArgs(args);
    assertEquals(result.demonstrativeType, "to");
    assertEquals(result.layerType, "project");
    assertEquals(result.error, undefined);
  });

  await t.step("should validate LayerType", () => {
    const args = ["to", "invalid"];
    const result = parseArgs(args);
    assertEquals(result.error, "Invalid LayerType");
  });

  await t.step("should allow init without LayerType", () => {
    const args = ["init"];
    const result = parseArgs(args);
    assertEquals(result.demonstrativeType, "init");
    assertEquals(result.layerType, undefined);
    assertEquals(result.error, undefined);
  });

  await t.step("should ignore LayerType for init command", () => {
    const args = ["init", "project"];
    const result = parseArgs(args);
    assertEquals(result.demonstrativeType, "init");
    assertEquals(result.layerType, undefined);
    assertEquals(result.error, undefined);
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