import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { setupTestEnv, cleanupTestFiles, initTestConfig, setupTestDirs, removeWorkDir } from "./test_utils.ts";
import { parseArgs } from "../cli/args.ts";

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

      await t.step("CLI outputs file path with --from option", async () => {
        const testFile = "./.agent/breakdown/issues/issue_summary.md";
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "task", "--from", testFile],
          stdout: "piped",
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        assertEquals(output, `${testFile} --> ./breakdown/prompts/to/task/f_issue.md`);
      });

      await t.step("CLI outputs file path with -f alias", async () => {
        const testFile = "./.agent/breakdown/issues/issue_summary.md";
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "task", "-f", testFile],
          stdout: "piped",
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        assertEquals(output, `${testFile} --> ./breakdown/prompts/to/task/f_issue.md`);
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
        assertEquals(output, `${inputFile} --> ./breakdown/prompts/to/issue/f_project.md --> ${outputFile}`);
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

      await t.step("CLI auto-completes input file path", async () => {
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "issue", "-f", "project_summary.md"],
          stdout: "piped",
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        const expectedPath = "./.agent/breakdown/issues/project_summary.md";
        assertEquals(output, `${expectedPath} --> ./breakdown/prompts/to/issue/f_project.md`);
      });

      await t.step("CLI auto-completes both input and output paths", async () => {
        const process = new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "cli/breakdown.ts", "to", "issue", "-f", "project_summary.md", "-o", "issue_summary.md"],
          stdout: "piped",
        });

        const { stdout } = await process.output();
        const output = new TextDecoder().decode(stdout).trim();
        const inputPath = "./.agent/breakdown/issues/project_summary.md";
        const outputPath = "./.agent/breakdown/issues/issue_summary.md";
        assertEquals(output, `${inputPath} --> ./breakdown/prompts/to/issue/f_project.md --> ${outputPath}`);
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
        
        // プロンプトパスを含むパターンに修正
        const pattern = /^\.\/\.agent_test\/breakdown\/issues\/input\.md --> \.\/breakdown\/prompts\/to\/issue\/f_\w+\.md --> \.\/\.agent_test\/breakdown\/issues\/\d{8}_[0-9a-f]{8}\.md$/;
        assertEquals(pattern.test(output), true);
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