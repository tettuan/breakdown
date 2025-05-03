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
import { assertCommandSuccess, assertCommandOutput } from "../../helpers/assertions.ts";
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

    // Save and change working directory to test dir
    originalCwd = Deno.cwd();
    Deno.chdir(TEST_DIR);
  });

  // Complex Option Combinations
  await t.step("multiple options", async () => {
    logger.debug("Testing multiple options");
    const args = [
      "--from",
      join("test.md"),
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
    assertCommandOutput(result, { error: "Invalid input parameters" });
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
    assertCommandSuccess(result);
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
    const hasError = result.output.includes("Cannot use --from and --input together") ||
      result.error.includes("Cannot use --from and --input together");
    assertEquals(hasError, true, "Expected error message for conflicting options");
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
    const hasError = result.output.includes("Invalid input layer type") ||
      result.error.includes("Invalid input layer type");
    assertEquals(hasError, true, "Expected error message for invalid input type");
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
    const hasError = result.output.includes("Duplicate option: --from is used multiple times") ||
      result.error.includes("Duplicate option: --from is used multiple times");
    assertEquals(hasError, true, "Expected error message for duplicate options");
  });

  await t.step("short form options", async () => {
    logger.debug("Testing short form options");
    const args = [
      "-f",
      join("test.md"),
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
    assertCommandOutput(result, { error: "Invalid input parameters" });
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
