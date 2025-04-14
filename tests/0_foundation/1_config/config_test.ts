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
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import {
  assertDirectoryExists,
  assertFileExists,
} from "$test/helpers/assertions.ts";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironment,
} from "$test/helpers/setup.ts";

const TEST_ENV = await setupTestEnvironment({ workingDir: "./tmp/test/config-base" });

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
Deno.test("config - default settings", async () => {
  const env = await setupTestEnvironment({ workingDir: "./tmp/test/config" });
  try {
    const config = new BreakdownConfig(env.workingDir);
    await config.loadConfig();
    const settings = await config.getConfig();
    
    assertEquals(settings.working_dir, ".agent/breakdown");
    assertEquals(settings.app_prompt.base_dir, "lib/breakdown/prompts");
    assertEquals(settings.app_schema.base_dir, "lib/breakdown/schema");
  } finally {
    await cleanupTestEnvironment(env);
  }
});

// Working directory tests
Deno.test("config - custom working directory", async () => {
  const env = await setupTestEnvironment({ workingDir: "./tmp/test/config-custom" });
  try {
    const config = new BreakdownConfig(env.workingDir);
    await config.loadConfig();
    const settings = await config.getConfig();
    
    assertEquals(settings.working_dir, "./tmp/test/config-custom");
  } finally {
    await cleanupTestEnvironment(env);
  }
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