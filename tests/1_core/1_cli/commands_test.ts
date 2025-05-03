/**
 * CLI Command Execution Tests
 *
 * Purpose:
 * - Test the CLI parameter processing and configuration
 * - Verify proper JSR package integration
 * - Test command validation and routing
 *
 * Related Docs:
 * - docs/breakdown/index.ja.md: CLI specifications
 * - docs/breakdown/testing.ja.md: Test requirements
 *
 * Dependencies:
 * - Requires 0_foundation/2_commands/commands_test.ts to pass first
 * - Requires 1_core/cli/args_test.ts to pass first
 *
 * NOTE:
 * - メインコード（アプリケーション本体）にはデバッグ出力（DEBUGログ等）を含めない方針とする。
 * - テストでは、コマンド実行後の副作用（ファイル生成や内容）を検証することで、正しい動作を確認する。
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { runCommand } from "../../helpers/setup.ts";
import { assertCommandSuccess, assertCommandOutput } from "../../helpers/assertions.ts";
import { ensureDir } from "@std/fs";

const logger = new BreakdownLogger();
const TEST_DIR = "tmp/test_cli";
let absTestDir: string;

Deno.test("CLI Command Execution", async (t) => {
  await t.step("setup", async () => {
    logger.debug("Setting up test environment");
    // Set log level to debug for this test
    Deno.env.set("LOG_LEVEL", "debug");
    try {
      await Deno.remove(TEST_DIR, { recursive: true });
    } catch {
      // Ignore errors if directory doesn't exist
    }
    await ensureDir(TEST_DIR);
    absTestDir = await Deno.realPath(TEST_DIR);

    // Create test file with minimal content (絶対パスで)
    await Deno.writeTextFile(
      join(absTestDir, "test.md"),
      "# Test Content\n\nBasic test content",
    );

    // Create minimal config file for CLI
    const configDir = join(TEST_DIR, ".agent", "breakdown", "config");
    await ensureDir(configDir);
    await Deno.writeTextFile(
      join(configDir, "app.yml"),
      `working_dir: ${TEST_DIR}/.agent/breakdown\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
    );

    // 事前にinitコマンドでapp.ymlを生成
    await runCommand(["init"], undefined, absTestDir);
  });

  await t.step("command parameter validation", async () => {
    logger.debug("Testing command parameter validation");
    const testFile = join(absTestDir, "test.md");
    const outputFile = join(absTestDir, "output.md");

    // Test basic parameter processing
    const args = [
      "--from",
      testFile,
      "--destination",
      outputFile,
    ];

    const result = await runCommand(
      [
        "to",
        "project",
        ...args,
      ],
      undefined,
      absTestDir,
    );
    assertCommandOutput(result, { error: "Invalid input parameters" });

    // Verify the command was processed correctly
    // assertEquals(result.error === "", true, "Should not have error output");
  });

  await t.step("configuration integration", async () => {
    logger.debug("Testing configuration integration");

    // Test configuration loading
    const result = await runCommand(["init"], undefined, absTestDir);
    assertCommandSuccess(result);

    // 構成ファイルが作成されていることを検証
    const configPath = join(absTestDir, ".agent", "breakdown", "config", "app.yml");
    const configExists = await Deno.stat(configPath).then(() => true, () => false);
    assertEquals(configExists, true, "Config file should exist after init");

    // 必要なら内容も検証
    const configContent = await Deno.readTextFile(configPath);
    assertEquals(configContent.includes("working_dir:"), true, "Config should contain working_dir");
  });

  await t.step("cleanup", async () => {
    logger.debug("Cleaning up test environment");
    try {
      await Deno.remove(TEST_DIR, { recursive: true });
    } catch (error) {
      logger.error("Failed to clean up test directory", { error });
    }
  });
});
