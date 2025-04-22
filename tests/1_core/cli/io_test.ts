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

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { runCommand } from "../../helpers/setup.ts";
import { assertCommandSuccess } from "../../helpers/assertions.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { ensureDir } from "@std/fs";

const logger = new BreakdownLogger();
const TEST_DIR = "tmp/test_cli_io";

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
  });

  await t.step("pipe input through stdin", async () => {
    logger.debug("Testing stdin input", {
      purpose: "Verify processing of piped input data",
    });
    const input = "# Test Project\n- Task 1\n- Task 2";
    const outputFile = join(TEST_DIR, "stdin_output.md");
    const result = await runCommand(
      ["to", "project", "--from", "-", "--destination", outputFile],
      input,
    );
    assertCommandSuccess(result);
  });

  await t.step("error level logging", async () => {
    logger.debug("Testing error level output", {
      purpose: "Verify error level log messages",
    });
    const result = await runCommand([
      "to",
      "project",
      "--from",
      join(TEST_DIR, "nonexistent.md"),
      "--destination",
      join(TEST_DIR, "output.md"),
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
  });
});
