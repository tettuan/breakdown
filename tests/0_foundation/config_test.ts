/**
 * Foundation tests for configuration functionality
 * 
 * Purpose:
 * - Verify basic configuration loading and validation
 * - Ensure working directory management works correctly
 * - Test configuration file existence and structure
 * 
 * Success Definition:
 * - Configuration files can be loaded and validated
 * - Working directories are properly managed
 * - Required directories exist and are accessible
 */

import { assertEquals } from "$std/testing/asserts.ts";
import { join } from "$std/path/mod.ts";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { setupTestEnvironment, cleanupTestEnvironment } from "../helpers/setup.ts";
import { assertValidConfig, assertDirectoryExists } from "../helpers/assertions.ts";

const TEST_ENV = await setupTestEnvironment();

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(TEST_ENV);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Basic configuration tests
Deno.test("config - basic configuration loading", async () => {
  const config = new BreakdownConfig();
  await config.loadConfig();
  
  const settings = config.getConfig();
  assertValidConfig(settings);
  
  // Verify required fields
  assertEquals(settings.working_dir, ".agent/breakdown");
  assertEquals(settings.app_prompt.base_dir, "lib/breakdown/prompts");
  assertEquals(settings.app_schema.base_dir, "lib/breakdown/schema");
});

// Working directory tests
Deno.test("config - working directory management", async () => {
  const config = new BreakdownConfig();
  await config.loadConfig();
  
  const workingDir = config.getConfig().working_dir;
  await assertDirectoryExists(workingDir);
  
  // Verify prompt directory
  const promptDir = join(workingDir, "prompts");
  await assertDirectoryExists(promptDir);
  
  // Verify schema directory
  const schemaDir = join(workingDir, "schemas");
  await assertDirectoryExists(schemaDir);
});

// Error handling tests
Deno.test("config - invalid configuration handling", async () => {
  const config = new BreakdownConfig();
  
  try {
    await config.loadConfig();
    // Force an error by attempting to access a nonexistent config
    config.getConfig();
    throw new Error("Should have thrown an error for invalid config");
  } catch (error: unknown) {
    if (error instanceof Error) {
      assertEquals(error.message.includes("Config not loaded"), true);
    } else {
      throw new Error("Unexpected error type");
    }
  }
}); 