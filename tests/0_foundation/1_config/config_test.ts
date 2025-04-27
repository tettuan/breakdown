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

import { assertEquals } from "jsr:@std/assert";
import { join } from "jsr:@std/path/join";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { cleanupTestEnvironment, setupTestEnvironment } from "$test/helpers/setup.ts";

const TEST_ENV = await setupTestEnvironment({
  workingDir: "./tmp/test/config",
});

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
  const env = await setupTestEnvironment({ 
    workingDir: "./tmp/test/config",
    skipDefaultConfig: true 
  });
  try {
    // Create config file in the correct location
    const configDir = join(env.workingDir, ".agent", "breakdown", "config");
    await Deno.mkdir(configDir, { recursive: true });
    await Deno.writeTextFile(
      join(configDir, "app.yml"),
      `working_dir: .agent/breakdown
app_prompt:
  base_dir: lib/breakdown/prompts
app_schema:
  base_dir: lib/breakdown/schema
`,
    );

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
  const env = await setupTestEnvironment({ 
    workingDir: "./tmp/test/config-custom",
    skipDefaultConfig: true 
  });
  try {
    // Create config file in the correct location
    const configDir = join(env.workingDir, ".agent", "breakdown", "config");
    await Deno.mkdir(configDir, { recursive: true });
    await Deno.writeTextFile(
      join(configDir, "app.yml"),
      `working_dir: ./tmp/test/config-custom
app_prompt:
  base_dir: lib/breakdown/prompts
app_schema:
  base_dir: lib/breakdown/schema
`,
    );

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
  const config = new BreakdownConfig("nonexistent/path");

  try {
    await config.loadConfig();
    throw new Error("Should have thrown an error for missing config");
  } catch (error: unknown) {
    if (error instanceof Error) {
      assertEquals(error.message.includes("Application configuration file not found"), true);
    } else {
      throw new Error("Unexpected error type");
    }
  }
});

Deno.test({
  name: "config - basic functionality",
  async fn() {
    const env = await setupTestEnvironment({ 
      workingDir: "./tmp/test/config-basic",
      skipDefaultConfig: true 
    });
    try {
      // Create config file in the correct location
      const configDir = join(env.workingDir, ".agent", "breakdown", "config");
      await Deno.mkdir(configDir, { recursive: true });
      await Deno.writeTextFile(
        join(configDir, "app.yml"),
        `working_dir: ./tmp/test/config-basic
app_prompt:
  base_dir: lib/breakdown/prompts
app_schema:
  base_dir: lib/breakdown/schema
`,
      );

      const config = new BreakdownConfig(env.workingDir);
      await config.loadConfig();
      const settings = await config.getConfig();

      // Verify basic functionality
      assertEquals(typeof settings, "object");
      assertEquals(typeof settings.working_dir, "string");
      assertEquals(typeof settings.app_prompt, "object");
      assertEquals(typeof settings.app_schema, "object");
    } finally {
      await cleanupTestEnvironment(env);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
