#!/usr/bin/env -S deno run -A
/**
 * Test execution with automatic cleanup
 *
 * This script runs tests and automatically cleans up temporary artifacts
 * to prevent accumulation of test files in the tmp/ directory.
 *
 * Features:
 * - Runs full test suite
 * - Automatically cleans tmp/ directory after tests
 * - Reports cleanup statistics
 * - Handles cleanup failures gracefully
 */

import { globalTestCleanup } from "../tests/helpers/setup.ts";

async function runTestsWithCleanup() {
  console.log("🧪 Starting test execution with automatic cleanup...");

  // Run the full test suite
  const testCommand = new Deno.Command(Deno.execPath(), {
    args: ["test", "--allow-env", "--allow-write", "--allow-read", "--allow-run"],
    stdout: "inherit",
    stderr: "inherit",
  });

  const testResult = await testCommand.output();
  const testSuccess = testResult.success;

  console.log(`\n📊 Test execution ${testSuccess ? "completed successfully" : "failed"}`);

  // Always perform cleanup, regardless of test results
  console.log("\n🧹 Starting automatic cleanup...");
  try {
    await globalTestCleanup();
    console.log("✅ Automatic cleanup completed successfully");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }

  // Exit with the same code as the test execution
  Deno.exit(testSuccess ? 0 : 1);
}

if (import.meta.main) {
  await runTestsWithCleanup();
}
