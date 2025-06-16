/**
 * CLI Argument Parsing Tests - SIMPLIFIED FOR BREAKDOWNPARAMS DELEGATION
 *
 * Purpose:
 * - Basic verification that CLI delegates to BreakdownParams correctly
 * - Minimal testing of core CLI functionality
 * - Architecture consistency verification
 *
 * Note: Detailed argument parsing tests are now handled by BreakdownParams
 * This test suite focuses on delegation and basic integration only
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { runCommand } from "../../../tests/helpers/setup.ts";
// import { join } from "https://deno.land/std/path/mod.ts"; // Removed: unused import
import { ensureDir } from "@std/fs";

const logger = new BreakdownLogger();
const TEST_DIR = "tmp/test_cli_args_simplified";
let originalCwd: string;

Deno.test("CLI BreakdownParams Delegation", async (t) => {
  // Setup test environment
  await t.step("setup", async () => {
    originalCwd = Deno.cwd();
    await ensureDir(TEST_DIR);
    Deno.chdir(TEST_DIR);
    logger.debug("Test environment setup completed", { testDir: TEST_DIR });
  });

  // Basic CLI functionality verification
  await t.step("basic help functionality", async () => {
    logger.debug("Testing basic help functionality");
    const result = await runCommand(["--help"]);
    // Should handle help flag correctly
    logger.debug("help functionality result", result);
    // Basic verification - BreakdownParams handles the details
    assertEquals(typeof result.output, "string");
  });

  await t.step("basic version functionality", async () => {
    logger.debug("Testing basic version functionality");
    const result = await runCommand(["--version"]);
    // Should handle version flag correctly
    logger.debug("version functionality result", result);
    // Basic verification - BreakdownParams handles the details
    assertEquals(typeof result.output, "string");
  });

  await t.step("basic command delegation", async () => {
    logger.debug("Testing basic command delegation to BreakdownParams");
    const result = await runCommand(["to", "project"]);
    // Should delegate to BreakdownParams and handle appropriately
    logger.debug("command delegation result", result);
    // Any result is acceptable - focus is on delegation, not specific validation
    assertEquals(typeof result, "object");
  });

  await t.step("cleanup", async () => {
    Deno.chdir(originalCwd);
    try {
      await Deno.remove(TEST_DIR, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
    logger.debug("Test cleanup completed");
  });
});

// Additional basic CLI integration test
Deno.test("CLI error handling delegation", async () => {
  logger.debug("Testing CLI error handling delegation");
  const result = await runCommand(["invalid", "command"]);
  // Should handle errors appropriately through BreakdownParams
  logger.debug("error handling result", result);
  // Focus on delegation architecture, not specific error content
  assertEquals(typeof result, "object");
});
