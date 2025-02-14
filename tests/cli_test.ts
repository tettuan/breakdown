import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { getConfig, setConfig } from "../breakdown/config/config.ts";
import { ensureDir, exists } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { setupTestEnv, cleanupTestFiles, initTestConfig, setupTestDirs, removeWorkDir } from "./test_utils.ts";
import { parseArgs } from "../cli/args.ts";

Deno.test({
  name: "CLI Test Suite",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    // 各テストケースで共通の環境設定
    const commonEnv = {
      "BREAKDOWN_TEST": "true",
      "BREAKDOWN_TEST_DIR": "./.agent_test/breakdown"
    };

    try {
      await t.step("CLI outputs 'to' when given single valid argument", async () => {
        await setupTestEnv();  // 各テストの開始時に環境を初期化
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
        assertEquals(error, "Input file is required. Use --from/-f option or --new/-n for new file");
      });

      await t.step("CLI outputs file path with --from option", async () => {
        const testFile = "./.agent/breakdown/issues/issue_summary.md";
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "project", "--from", testFile],
          stdout: "piped",
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        assertEquals(output, testFile);
      });

      await t.step("CLI outputs file path with -f alias", async () => {
        const testFile = "./.agent/breakdown/issues/issue_summary.md";
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "project", "-f", testFile],
          stdout: "piped",
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        assertEquals(output, testFile);
      });

      await t.step("CLI outputs file conversion with destination", async () => {
        const inputFile = "./.agent/breakdown/issues/project_summary.md";
        const outputFile = "./.agent/breakdown/issues/issue_summary.md";
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "issue", "-f", inputFile, "-o", outputFile],
          stdout: "piped",
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        assertEquals(output, `${inputFile} --> ${outputFile}`);
      });

      await t.step("CLI creates working directory on init", async () => {
        // 設定のみ初期化し、ディレクトリは作成しない
        initTestConfig();
        await removeWorkDir();  // 確実に削除

        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "init"],
          stdout: "piped",
          env: commonEnv
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        assertEquals(output, `Created working directory: ${commonEnv.BREAKDOWN_TEST_DIR}`);
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
        assertEquals(output, `Working directory already exists: ${commonEnv.BREAKDOWN_TEST_DIR}`);
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

      await t.step("CLI auto-completes input file path", async () => {
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "issue", "-f", "project_summary.md"],
          stdout: "piped",
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        assertEquals(output, "./.agent/breakdown/issues/project_summary.md");
      });

      await t.step("CLI auto-completes both input and output paths", async () => {
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "issue", "-f", "project_summary.md", "-o", "issue_summary.md"],
          stdout: "piped",
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        assertEquals(output, "./.agent/breakdown/issues/project_summary.md --> ./.agent/breakdown/issues/issue_summary.md");
      });

      await t.step("CLI generates default filename with --new flag", async () => {
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "issue", "--new"],
          stdout: "piped",
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        
        const pattern = /^\.\/\.agent\/breakdown\/issues\/\d{8}_[0-9a-f]{8}\.md$/;
        assertEquals(pattern.test(output), true);
      });

      await t.step("CLI errors when working directory does not exist", async () => {
        await setupTestEnv();  // 環境を初期化
        try {
          await Deno.remove(commonEnv.BREAKDOWN_TEST_DIR, { recursive: true });
        } catch {
          // 無視
        }

        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "project", "--new"],
          stderr: "piped",
          env: commonEnv  // 環境変数を設定
        });

        const { stderr } = await process.output();
        const error = new TextDecoder().decode(stderr).trim();
        assertEquals(error, "breakdown init を実行し、作業フォルダを作成してください");
      });

      await t.step("CLI auto-generates filename when -o is empty", async () => {
        await setupTestEnv();
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "issue", "-f", "input.md", "-o"],
          stdout: "piped",
          env: commonEnv
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        
        // パターンを実際の出力形式に合わせる
        const pattern = /^\.\/\.agent_test\/breakdown\/issues\/input\.md --> \.\/\.agent_test\/breakdown\/issues\/\d{8}_[0-9a-f]{8}\.md$/;
        assertEquals(pattern.test(output), true);
      });
    } finally {
      try {
        await cleanupTestFiles();
      } catch {
        // クリーンアップエラーは無視
      }
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