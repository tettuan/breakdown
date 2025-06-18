/**
 * Foundation tests for configuration functionality
 *
 * All configuration access in tests must use BreakdownConfig from @tettuan/breakdownconfig.
 * Do not read YAML or JSON config files directly in test logic.
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
  configSetName: "test-config",
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

/**
 * Test: config - default settings
 *
 * All config access must use BreakdownConfig, not direct file reads.
 */
Deno.test("config - default settings", async () => {
  const env = await setupTestEnvironment({
    workingDir: "./tmp/test/config",
    configSetName: "test-config-default",
    skipDefaultConfig: true,
  });
  const originalCwd = Deno.cwd();

  try {
    // Create config file in the project root location
    const configDir = join(originalCwd, ".agent", "breakdown", "config");
    await Deno.mkdir(configDir, { recursive: true });

    // Save existing config if present
    const configPath = join(configDir, "app.yml");
    let savedConfig: string | null = null;
    try {
      savedConfig = await Deno.readTextFile(configPath);
    } catch {
      // No existing config
    }

    await Deno.writeTextFile(
      configPath,
      `working_dir: .
app_prompt:
  base_dir: prompts/user
app_schema:
  base_dir: schema/user
`,
    );

    const config = new BreakdownConfig();
    await config.loadConfig();
    const settings = await config.getConfig();

    assertEquals(settings.working_dir, ".");
    assertEquals(settings.app_prompt.base_dir, "prompts/user");
    assertEquals(settings.app_schema.base_dir, "schema/user");

    // Restore original config
    if (savedConfig !== null) {
      await Deno.writeTextFile(configPath, savedConfig);
    } else {
      await Deno.remove(configPath);
    }
  } finally {
    Deno.chdir(originalCwd);
    await cleanupTestEnvironment(env);
  }
});

/**
 * Test: config - custom working directory
 *
 * All config access must use BreakdownConfig, not direct file reads.
 */
Deno.test("config - custom working directory", async () => {
  const env = await setupTestEnvironment({
    workingDir: "./tmp/test/config-custom",
    configSetName: "test-config-custom",
    skipDefaultConfig: true,
  });
  const originalCwd = Deno.cwd();

  try {
    // Create config file in the project root location
    const configDir = join(originalCwd, ".agent", "breakdown", "config");
    await Deno.mkdir(configDir, { recursive: true });

    // Save existing config if present
    const configPath = join(configDir, "app.yml");
    let savedConfig: string | null = null;
    try {
      savedConfig = await Deno.readTextFile(configPath);
    } catch {
      // No existing config
    }

    await Deno.writeTextFile(
      configPath,
      `working_dir: .
app_prompt:
  base_dir: prompts/user
app_schema:
  base_dir: schema/user
`,
    );

    const config = new BreakdownConfig();
    await config.loadConfig();
    const settings = await config.getConfig();

    assertEquals(settings.working_dir, ".");
    assertEquals(settings.app_prompt.base_dir, "prompts/user");
    assertEquals(settings.app_schema.base_dir, "schema/user");

    // Restore original config
    if (savedConfig !== null) {
      await Deno.writeTextFile(configPath, savedConfig);
    } else {
      await Deno.remove(configPath);
    }
  } finally {
    Deno.chdir(originalCwd);
    await cleanupTestEnvironment(env);
  }
});

/**
 * Test: config - invalid configuration handling
 *
 * All config access must use BreakdownConfig, not direct file reads.
 */
Deno.test("config - invalid configuration handling", async () => {
  // Change directory to a non-existent location to test missing config
  const originalCwd = Deno.cwd();
  const tempDir = await Deno.makeTempDir();
  Deno.chdir(tempDir);
  try {
    const config = new BreakdownConfig();

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
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

/**
 * Test: config - basic functionality
 *
 * All config access must use BreakdownConfig, not direct file reads.
 */
Deno.test({
  name: "config - basic functionality",
  async fn() {
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test/config-basic",
      configSetName: "test-config-basic",
      skipDefaultConfig: true,
    });
    const originalCwd = Deno.cwd();

    try {
      // Create config file in the project root location
      const configDir = join(originalCwd, ".agent", "breakdown", "config");
      await Deno.mkdir(configDir, { recursive: true });

      // Save existing config if present
      const configPath = join(configDir, "app.yml");
      let savedConfig: string | null = null;
      try {
        savedConfig = await Deno.readTextFile(configPath);
      } catch {
        // No existing config
      }

      await Deno.writeTextFile(
        configPath,
        `working_dir: .
app_prompt:
  base_dir: prompts/user
app_schema:
  base_dir: schema/user
`,
      );

      const config = new BreakdownConfig();
      await config.loadConfig();
      const settings = await config.getConfig();

      // Verify basic functionality
      assertEquals(typeof settings, "object");
      assertEquals(typeof settings.working_dir, "string");
      assertEquals(typeof settings.app_prompt, "object");
      assertEquals(typeof settings.app_schema, "object");
      assertEquals(settings.app_prompt.base_dir, "prompts/user");
      assertEquals(settings.app_schema.base_dir, "schema/user");

      // Restore original config
      if (savedConfig !== null) {
        await Deno.writeTextFile(configPath, savedConfig);
      } else {
        await Deno.remove(configPath);
      }
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test("config - error if no config file and different cwd", async () => {
  // Create a temp directory and chdir into it
  const tempDir = await Deno.makeTempDir();
  const originalCwd = Deno.cwd();
  Deno.chdir(tempDir);
  try {
    const config = new BreakdownConfig(); // No config file created
    let errorCaught = false;
    try {
      await config.loadConfig();
    } catch (error) {
      errorCaught = true;
      if (error instanceof Error) {
        // Should mention missing config
        if (!error.message.includes("Application configuration file not found")) {
          throw new Error("Unexpected error message: " + error.message);
        }
      } else {
        throw new Error("Unexpected error type");
      }
    }
    if (!errorCaught) {
      throw new Error("Should have thrown an error for missing config");
    }
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});
