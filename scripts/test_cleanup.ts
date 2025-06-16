#!/usr/bin/env -S deno run -A
/**
 * Automated test cleanup script
 *
 * Purpose:
 * - Automatically clean up temporary test artifacts after CI runs
 * - Prevent accumulation of test files in tmp/ directory
 * - Report cleanup statistics for monitoring
 *
 * Usage:
 * - Called automatically by local_ci.sh after all tests pass
 * - Can be run manually: deno run -A scripts/test_cleanup.ts
 * - Safe to run multiple times
 */

import { globalTestCleanup } from "../tests/helpers/setup.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

async function main() {
  const logger = new BreakdownLogger("test-cleanup-script");

  try {
    console.log("🧹 Starting automated test cleanup...");

    // Check if tmp directory exists and get size before cleanup
    let sizeBefore = 0;
    try {
      const tmpStat = await Deno.stat("tmp");
      if (tmpStat.isDirectory) {
        // Simple size calculation for reporting
        for await (const entry of Deno.readDir("tmp")) {
          if (entry.isFile) {
            const fileStat = await Deno.stat(`tmp/${entry.name}`);
            sizeBefore += fileStat.size;
          }
        }
      }
    } catch {
      // tmp directory doesn't exist, nothing to clean
      console.log("✅ No tmp directory found - nothing to clean");
      return;
    }

    if (sizeBefore === 0) {
      console.log("✅ tmp directory is already clean");
      return;
    }

    console.log(`📊 Found ${Math.round(sizeBefore / 1024)}KB of test artifacts`);

    // Perform the cleanup
    await globalTestCleanup();

    // Check size after cleanup
    let sizeAfter = 0;
    try {
      for await (const entry of Deno.readDir("tmp")) {
        if (entry.isFile) {
          const fileStat = await Deno.stat(`tmp/${entry.name}`);
          sizeAfter += fileStat.size;
        }
      }
    } catch {
      // Directory might be empty now
    }

    const removedKB = Math.round((sizeBefore - sizeAfter) / 1024);
    const remainingKB = Math.round(sizeAfter / 1024);

    console.log(`✅ Cleanup completed: ${removedKB}KB removed, ${remainingKB}KB remaining`);

    if (remainingKB > 0) {
      logger.warn("Some test artifacts remain after cleanup", { remainingKB });
    }
  } catch (error) {
    console.error("❌ Test cleanup failed:", error);
    logger.error("Test cleanup script failed", { error });
    // Don't exit with error code - cleanup failure shouldn't break CI
  }
}

if (import.meta.main) {
  await main();
}
