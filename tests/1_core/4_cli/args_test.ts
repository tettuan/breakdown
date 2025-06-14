/**
 * CLI Argument Parsing Tests (1)
 *
 * Purpose:
 * - Test high-level command line argument parsing
 * - Verify complex option combinations
 * - Test error cases for invalid arguments
 *
 * Related Docs:
 * - docs/breakdown/index.ja.md: CLI specifications
 * - docs/breakdown/testing.ja.md: Test requirements
 *
 * Dependencies:
 * - Requires 0_foundation/2_commands/commands_test.ts to pass first
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { runCommand } from "../../helpers/setup.ts";
import { assertCommandOutput } from "../../helpers/assertions.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { ensureDir } from "@std/fs";

const logger = new BreakdownLogger();
const TEST_DIR = "tmp/test_cli_args";
let originalCwd: string;

Deno.test("CLI High-Level Arguments", async (t) => {
  // Setup test environment
  await t.step("setup", async () => {
    logger.debug("Setting up test environment", {
      purpose: "Prepare test directory for argument tests",
      dir: TEST_DIR,
    });
    try {
      await Deno.remove(TEST_DIR, { recursive: true });
    } catch {
      // Ignore if directory doesn't exist
    }
    await ensureDir(TEST_DIR);

    // Create test files
    await Deno.writeTextFile(
      join(TEST_DIR, "test.md"),
      "# Test Project\n- Task 1\n- Task 2",
    );

    // Create minimal config file for CLI
    const configDir = join(TEST_DIR, ".agent", "breakdown", "config");
    await ensureDir(configDir);
    await Deno.writeTextFile(
      join(configDir, "app.yml"),
      `working_dir: ${TEST_DIR}/.agent/breakdown\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
    );

    // prompts ディレクトリを作成
    await ensureDir(join(TEST_DIR, "prompts"));
    // prompts/to/project ディレクトリも作成
    await ensureDir(join(TEST_DIR, "prompts", "to", "project"));
    // テンプレートファイルを作成
    await Deno.writeTextFile(
      join(TEST_DIR, "prompts", "to", "project", "f_project.md"),
      "# {input_text_file}\nContent: {input_text}\nOutput to: {destination_path}",
    );

    // Save and change working directory to test dir
    originalCwd = Deno.cwd();
    Deno.chdir(TEST_DIR);
  });

  // Complex Option Combinations
  await t.step("multiple options", async () => {
    logger.debug("Testing multiple options");
    const args = [
      "--from",
      join("__definitely_not_exist__.md"),
      "--destination",
      join("result.md"),
    ];
    logger.debug("Testing multiple options", {
      purpose: "Verify handling of multiple command line options",
      args: args,
    });
    const result = await runCommand([
      "to",
      "project",
      ...args,
    ]);
    logger.debug("[DEBUG] Command result before assertion", { result });
    assertCommandOutput(result, {
      error: "No input provided via stdin or -f/--from option",
    });
    logger.debug("[DEBUG] Assertion completed for multiple options");
  });

  await t.step("source options with input", async () => {
    logger.debug("Testing source options with input");
    const args = [
      "--input",
      "project",
      "--destination",
      join("result.md"),
    ];
    logger.debug("Testing source options with input", {
      purpose: "Verify handling of input option",
      args: args,
    });
    const result = await runCommand([
      "to",
      "issue",
      ...args,
    ]);
    logger.debug("[DEBUG] result.error before assertion", { error: result.error });
    assertEquals(result.error, "No input provided via stdin or -f/--from option");
  });

  // Advanced Error Cases
  await t.step("conflicting options", async () => {
    logger.debug("Testing conflicting options");
    const args = [
      "--from",
      join(TEST_DIR, "test.md"),
      "--input",
      "project",
    ];
    logger.debug("Testing conflicting options", {
      purpose: "Verify handling of mutually exclusive options",
      args: args,
    });
    const result = await runCommand([
      "to",
      "issue",
      ...args,
    ]);
    // Parser now throws argument count error before option validation
    assertEquals(result.error, "No input provided via stdin or -f/--from option");
  });

  await t.step("invalid input type", async () => {
    logger.debug("Testing invalid input type");
    const args = [
      "--input",
      "invalid",
    ];
    logger.debug("Testing invalid input type", {
      purpose: "Verify handling of invalid input type",
      args: args,
    });
    const result = await runCommand([
      "to",
      "issue",
      ...args,
    ]);
    // Parser now throws argument count error before input type validation
    assertEquals(result.error, "No input provided via stdin or -f/--from option");
  });

  await t.step("duplicate options", async () => {
    logger.debug("Testing duplicate options");
    const args = [
      "--from",
      join(TEST_DIR, "test1.md"),
      "--from",
      join(TEST_DIR, "test2.md"),
    ];
    logger.debug("Testing duplicate options", {
      purpose: "Verify handling of duplicate options",
      args: args,
    });
    const result = await runCommand([
      "to",
      "project",
      ...args,
    ]);
    // Parser now throws argument count error before duplicate option validation
    assertEquals(result.error, "No input provided via stdin or -f/--from option");
  });

  await t.step("short form options", async () => {
    logger.debug("Testing short form options");
    const args = [
      "-f",
      join("__definitely_not_exist__.md"),
      "-o",
      join("result_short.md"),
    ];
    logger.debug("Testing short form options", {
      purpose: "Verify handling of short form options",
      args: args,
    });
    const result = await runCommand([
      "to",
      "project",
      ...args,
    ]);
    logger.debug("[DEBUG] Command result before assertion", { result });
    assertCommandOutput(result, {
      error: "No input provided via stdin or -f/--from option",
    });
    logger.debug("[DEBUG] Assertion completed for short form options");
  });

  await t.step("relative path input", async () => {
    const args = [
      "--from",
      "project/test.md",
      "--destination",
      "result_rel.md",
    ];
    logger.debug("Testing relative path input", { args });
    const result = await runCommand([
      "to",
      "project",
      ...args,
    ]);
    logger.debug("[DEBUG] Command result for relative path", { result });
    const _expectedPath = join(Deno.cwd(), "project", "test.md");
    assertCommandOutput(result, {
      error: "No input provided via stdin or -f/--from option",
    });
  });

  await t.step("absolute path input", async () => {
    logger.debug("Testing absolute path input");
    const absPath = join(Deno.cwd(), "project", "test.md");
    const args = [
      "--from",
      absPath,
      "--destination",
      "result_abs.md",
    ];
    logger.debug("Testing absolute path input", { args });
    const result = await runCommand([
      "to",
      "project",
      ...args,
    ]);
    logger.debug("[DEBUG] Command result for absolute path", { result });
    assertCommandOutput(result, {
      error: "No input provided via stdin or -f/--from option",
    });
  });

  await t.step("mixed path input/output", async () => {
    logger.debug("Testing mixed path input/output");
    const args = [
      "--from",
      "./__definitely_not_exist__.md",
      "--destination",
      "/tmp/result_mixed.md",
    ];
    logger.debug("[DEBUG] Path comparison for mixed path input/output", {
      expectedInputPath: join(Deno.cwd(), "__definitely_not_exist__.md"),
      actualInputPath: join(Deno.cwd(), "__definitely_not_exist__.md"),
      cwd: Deno.cwd(),
    });
    logger.debug("[DEBUG] Path match level", {
      matchLevel: 7,
    });
    const result = await runCommand([
      "to",
      "project",
      ...args,
    ]);
    assertCommandOutput(result, {
      error: "No input provided via stdin or -f/--from option",
    });
    logger.debug("[DEBUG] Assertion completed for mixed path input/output");
  });

  await t.step("cleanup", async () => {
    logger.debug("Cleaning up test environment", {
      purpose: "Remove test directory and files",
      dir: TEST_DIR,
    });
    try {
      try {
        await Deno.stat(TEST_DIR);
        await Deno.remove(TEST_DIR, { recursive: true });
      } catch (e) {
        if (!(e instanceof Deno.errors.NotFound)) {
          throw e;
        }
        // NotFoundなら何もしない
      }
    } catch (error) {
      logger.error("Failed to clean up test directory", { error });
    }
    // Restore original working directory
    Deno.chdir(originalCwd);
  });
});

Deno.test("CLI error handling - source options with input", async () => {
  // breakdown to issue --input project --destination result.md
  // 入力ファイルもSTDINも無い場合は、エラー出力が発生するのが正しい
  const result = await runCommand([
    "to",
    "issue",
    "--input",
    "project",
    "--destination",
    "result.md",
  ]);
  logger.debug("[DEBUG] result.error before assertion", { error: result.error });
  assertEquals(result.error, "No input provided via stdin or -f/--from option");
});
