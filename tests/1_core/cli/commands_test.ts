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
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { runCommand } from "../../helpers/setup.ts";
import { assertCommandSuccess } from "../../helpers/assertions.ts";
import { ensureDir } from "@std/fs";

const logger = new BreakdownLogger();
const TEST_DIR = "tmp/test_cli";

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

    // Create test file with minimal content
    await Deno.writeTextFile(
      join(TEST_DIR, "test.md"),
      "# Test Content\n\nBasic test content",
    );

    // Create minimal config file for CLI
    const configDir = join(TEST_DIR, ".agent", "breakdown", "config");
    await ensureDir(configDir);
    await Deno.writeTextFile(
      join(configDir, "app.yml"),
      `working_dir: ${TEST_DIR}/.agent/breakdown\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
    );

    // Change working directory to test dir
    Deno.chdir(TEST_DIR);
  });

  await t.step("command parameter validation", async () => {
    logger.debug("Testing command parameter validation");
    const testFile = "test.md";
    const outputFile = "output.md";

    // Test basic parameter processing
    const args = [
      "--from",
      testFile,
      "--destination",
      outputFile,
    ];

    const result = await runCommand([
      "to",
      "project",
      ...args,
    ]);
    assertCommandSuccess(result);

    // Verify the command was processed correctly
    assertEquals(result.error === "", true, "Should not have error output");
  });

  await t.step("configuration integration", async () => {
    logger.debug("Testing configuration integration");

    // Test configuration loading
    const result = await runCommand(["init"]);
    assertCommandSuccess(result);

    // Verify configuration was processed
    const configLoadedPattern =
      /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[DEBUG\] Configuration loaded/;
    assertEquals(
      configLoadedPattern.test(result.output),
      true,
      "Should show configuration loaded debug message",
    );
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
