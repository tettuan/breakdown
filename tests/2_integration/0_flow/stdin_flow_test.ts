/**
 * Integration tests for stdin handling in the breakdown workflow
 *
 * Purpose:
 * - Test the complete flow from stdin input to output
 * - Verify that stdin input is correctly processed and used
 * - Ensure stdin input is properly handled in different command contexts
 *
 * Related Docs:
 * - docs/breakdown/index.ja.md: CLI specifications
 * - docs/breakdown/testing.ja.md: Test requirements
 * - docs/breakdown/options.ja.md: Option specifications
 *
 * Dependencies:
 * - Requires 1_core/1_io/stdin_test.ts to pass first
 * - Requires 1_core/4_cli/io_test.ts to pass first
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { runCommand } from "../../helpers/setup.ts";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";

const logger = new BreakdownLogger();
const TEST_DIR = "tmp/test_stdin_flow";

Deno.test("Stdin Flow Integration", async (t) => {
  let originalCwd: string;

  await t.step("setup", async () => {
    logger.debug("Setting up test environment", {
      purpose: "Create test directory and files",
      dir: TEST_DIR,
    });
    originalCwd = Deno.cwd();
    await ensureDir(TEST_DIR);

    // Initialize workspace
    const initResult = await runCommand(["init"], undefined, TEST_DIR);
    assertEquals(initResult.success, true, "Workspace initialization should succeed");
  });

  await t.step("summary command with stdin input", async () => {
    logger.debug("Testing summary command with stdin input", {
      purpose: "Verify stdin input is processed correctly for summary command",
    });
    const input = "This is a test project summary from stdin.";
    const result = await runCommand(
      ["summary", "project", "--from", "-"],
      input,
      TEST_DIR,
    );
    assertEquals(result.success, true, "Command should succeed");
    assertStringIncludes(result.output, "project summary", "Output should contain project summary");
  });

  await t.step("to command with stdin input", async () => {
    logger.debug("Testing to command with stdin input", {
      purpose: "Verify stdin input is processed correctly for to command",
    });
    const input = "This is a test project description from stdin.";
    const result = await runCommand(
      ["to", "project", "--from", "-"],
      input,
      TEST_DIR,
    );
    assertEquals(result.success, true, "Command should succeed");
    assertStringIncludes(result.output, "project description", "Output should contain project description");
  });

  await t.step("stdin with -o option", async () => {
    logger.debug("Testing stdin with -o option", {
      purpose: "Verify -o option works correctly with stdin input",
    });
    const input = "This is a test project summary from stdin.";
    const outputFile = "output/project_summary.md";
    await ensureDir(join(TEST_DIR, "output"));
    const result = await runCommand(
      ["summary", "project", "--from", "-", "-o", outputFile],
      input,
      TEST_DIR,
    );
    assertEquals(result.success, true, "Command should succeed");
    assertStringIncludes(result.output, "project summary", "Output should contain project summary");
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