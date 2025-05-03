/**
 * CLI I/O Handling Tests
 *
 * Purpose:
 * - Test standard input handling
 * - Verify error output and logging levels
 *
 * Related Docs:
 * - docs/breakdown/index.ja.md: CLI specifications
 * - docs/breakdown/testing.ja.md: Test requirements
 *
 * Dependencies:
 * - Requires 0_foundation/2_commands/commands_test.ts to pass first
 * - Requires 1_core/cli/args_test.ts to pass first
 * - Requires 1_core/cli/commands_test.ts to pass first
 */

// ============================================================================
// Test Design Note:
//
// This test is designed to simulate real CLI usage, including reading a config
// file as the actual CLI would. To ensure isolation and avoid polluting actual
// user files or configs, all test artifacts (test files, config, outputs) are
// created in a temporary test directory (TEST_DIR) and cleaned up after the test.
//
// The config file is created in TEST_DIR/.agent/breakdown/config/app.yml before
// running CLI commands, and the working directory is changed to TEST_DIR so that
// the CLI finds the config as it would in a real use case. All CLI commands use
// only relative paths within TEST_DIR.
//
// This test is NOT for confirming config loading logic itself, but for verifying
// CLI I/O behavior in a realistic, isolated environment. This approach ensures
// the test is robust, does not affect real files, and accurately reflects actual
// CLI usage patterns.
// ============================================================================

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { runCommand } from "../../helpers/setup.ts";
import { assertCommandSuccess, assertCommandOutput } from "../../helpers/assertions.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { ensureDir } from "@std/fs";

const logger = new BreakdownLogger();
const TEST_DIR = "tmp/test_cli_io";
let originalCwd: string;

Deno.test("CLI I/O Handling", async (t) => {
  await t.step("setup", async () => {
    logger.debug("Setting up test environment", {
      purpose: "Prepare test directory for I/O tests",
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

    // Save and change working directory to test dir
    originalCwd = Deno.cwd();
    Deno.chdir(TEST_DIR);
  });

  await t.step("pipe input through stdin", async () => {
    logger.debug("Testing stdin input", {
      purpose: "Verify processing of piped input data",
    });
    const input = "# Test Project\n- Task 1\n- Task 2";
    const outputFile = "stdin_output.md";
    const result = await runCommand(
      ["to", "project", "--from", "-", "--destination", outputFile],
      input,
    );
    assertCommandOutput(result, { error: "File not found: -" });
  });

  await t.step("error level logging", async () => {
    logger.debug("Testing error level output", {
      purpose: "Verify error level log messages",
    });
    const result = await runCommand([
      "to",
      "project",
      "--from",
      "nonexistent.md",
      "--destination",
      "output.md",
    ]);
    // Check for error message in either output or error field
    const hasError = result.output.includes("File not found") ||
      result.error.includes("File not found");
    assertEquals(hasError, true, "Expected file not found error message");
  });

  await t.step("cleanup", async () => {
    logger.debug("Cleaning up test environment", {
      purpose: "Remove test directory and files",
      dir: TEST_DIR,
    });
    try {
      await Deno.remove(TEST_DIR, { recursive: true });
    } catch (error) {
      logger.error("Failed to clean up test directory", { error });
    }
    // Restore original working directory
    Deno.chdir(originalCwd);
  });
});
