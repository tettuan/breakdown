/**
 * @fileoverview BreakdownConfig Test Setup Utility
 *
 * Provides setup functions to ensure BreakdownConfig works properly in test environments
 * by creating the required .agent/breakdown/config directory structure.
 *
 * @module lib/test_helpers/breakdown_config_test_setup
 */

import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import { DEFAULT_CONFIG_DIR } from "../config/constants.ts";

/**
 * Ensure .agent directory structure exists for BreakdownConfig tests
 *
 * This function creates the .agent/breakdown/config directory and copies
 * configuration files from the project config/ directory. This is required
 * because BreakdownConfig expects configuration files to be in .agent/breakdown/config/
 * but this directory is gitignored and needs to be created for tests.
 */
export async function ensureBreakdownConfigTestSetup(): Promise<void> {
  const cwd = Deno.cwd?.() || ".";
  const agentConfigDir = join(cwd, DEFAULT_CONFIG_DIR);

  // Create .agent/breakdown/config directory if it doesn't exist
  await ensureDir(agentConfigDir);

  // Copy config files from test fixtures to .agent/breakdown/config/
  const fixturesConfigDir = join(cwd, "tests", "fixtures", "configs");
  try {
    // Get list of config files from test fixtures
    const entries = Deno.readDir(fixturesConfigDir);
    for await (const entry of entries) {
      if (entry.isFile && entry.name.endsWith(".yml")) {
        const sourceFile = join(fixturesConfigDir, entry.name);
        const targetFile = join(agentConfigDir, entry.name);

        // Check if target file already exists
        try {
          const [sourceContent, targetStat] = await Promise.all([
            Deno.readTextFile(sourceFile),
            Deno.stat(targetFile).catch(() => null),
          ]);

          // Copy if target doesn't exist or we want to ensure it's up to date
          if (!targetStat) {
            await Deno.writeTextFile(targetFile, sourceContent);
          }
        } catch {
          // If we can't read source file, skip it
          continue;
        }
      }
    }
  } catch {
    // If we can't read test fixtures directory, skip setup
    // This allows tests to run with pre-existing configuration
  }
}

/**
 * Setup function to be called at the beginning of integration tests
 * that use BreakdownConfig-related functionality.
 *
 * This should be called before any BreakdownConfig.create() calls.
 */
export async function setupBreakdownConfigIntegrationTest(): Promise<void> {
  await ensureBreakdownConfigTestSetup();
}
