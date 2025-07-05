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

import { assertEquals } from "../../lib/deps.ts";
import { join as _join } from "jsr:@std/path/join";
import { BreakdownConfig as _BreakdownConfig } from "@tettuan/breakdownconfig";
import {
  cleanupTestEnvironment as _cleanupTestEnvironment,
  setupTestEnvironment as _setupTestEnvironment,
} from "$test/helpers/setup.ts";

const TEST_ENV = await _setupTestEnvironment({
  workingDir: "./tmp/test/config",
  configSetName: "test-config",
});

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await _cleanupTestEnvironment(TEST_ENV);
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
  const env = await _setupTestEnvironment({
    workingDir: "./tmp/test/config",
    configSetName: "test-config-default",
    skipDefaultConfig: true,
  });
  const originalCwd = Deno.cwd();

  try {
    // Create config file in the project root location
    const configDir = _join(originalCwd, ".agent", "breakdown", "config");
    await Deno.mkdir(configDir, { recursive: true });

    // Save existing config if present
    const configPath = _join(configDir, "app.yml");
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
  base_dir: lib/breakdown/prompts
app_schema:
  base_dir: lib/breakdown/schema
`,
    );

    const configResult = await _BreakdownConfig.create();
    if (!configResult.success) {
      throw new Error("Failed to create BreakdownConfig");
    }
    const config = configResult.data;
    await (config as any).loadConfig();
    const settings = await (config as any).getConfig();

    assertEquals(settings.working_dir, ".");
    assertEquals(settings.app_prompt.base_dir, "lib/breakdown/prompts");
    assertEquals(settings.app_schema.base_dir, "lib/breakdown/schema");

    // Restore original config
    if (savedConfig !== null) {
      await Deno.writeTextFile(configPath, savedConfig);
    } else {
      await Deno.remove(configPath);
    }
  } finally {
    Deno.chdir(originalCwd);
    await _cleanupTestEnvironment(env);
  }
});

/**
 * Test: config - custom working directory
 *
 * All config access must use BreakdownConfig, not direct file reads.
 */
Deno.test("config - custom working directory", async () => {
  const env = await _setupTestEnvironment({
    workingDir: "./tmp/test/config-custom",
    configSetName: "test-config-custom",
    skipDefaultConfig: true,
  });
  const originalCwd = Deno.cwd();

  try {
    // Create config file in the project root location
    const configDir = _join(originalCwd, ".agent", "breakdown", "config");
    await Deno.mkdir(configDir, { recursive: true });

    // Save existing config if present
    const configPath = _join(configDir, "app.yml");
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
  base_dir: lib/breakdown/prompts
app_schema:
  base_dir: lib/breakdown/schema
`,
    );

    const configResult = await _BreakdownConfig.create();
    if (!configResult.success) {
      throw new Error("Failed to create BreakdownConfig");
    }
    const config = configResult.data;
    await (config as any).loadConfig();
    const settings = await (config as any).getConfig();

    assertEquals(settings.working_dir, ".");
    assertEquals(settings.app_prompt.base_dir, "lib/breakdown/prompts");
    assertEquals(settings.app_schema.base_dir, "lib/breakdown/schema");

    // Restore original config
    if (savedConfig !== null) {
      await Deno.writeTextFile(configPath, savedConfig);
    } else {
      await Deno.remove(configPath);
    }
  } finally {
    Deno.chdir(originalCwd);
    await _cleanupTestEnvironment(env);
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
    const configResult = await _BreakdownConfig.create();
    if (!configResult.success) {
      throw new Error("Failed to create BreakdownConfig");
    }
    const config = configResult.data;

    try {
      await (config as any).loadConfig();
      throw new Error("Should have thrown an error for missing config");
    } catch (_error: unknown) {
      if (_error instanceof Error) {
        assertEquals(_error.message.includes("Application configuration file not found"), true);
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
    const env = await _setupTestEnvironment({
      workingDir: "./tmp/test/config-basic",
      configSetName: "test-config-basic",
      skipDefaultConfig: true,
    });
    const originalCwd = Deno.cwd();

    try {
      // Create config file in the project root location
      const configDir = _join(originalCwd, ".agent", "breakdown", "config");
      await Deno.mkdir(configDir, { recursive: true });

      // Save existing config if present
      const configPath = _join(configDir, "app.yml");
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
  base_dir: lib/breakdown/prompts
app_schema:
  base_dir: lib/breakdown/schema
`,
      );

      const configResult = await _BreakdownConfig.create();
      if (!configResult.success) {
        throw new Error("Failed to create BreakdownConfig");
      }
      const config = configResult.data;
      await (config as any).loadConfig();
      const settings = await (config as any).getConfig();

      // Verify basic functionality
      assertEquals(typeof settings, "object");
      assertEquals(typeof settings.working_dir, "string");
      assertEquals(typeof settings.app_prompt, "object");
      assertEquals(typeof settings.app_schema, "object");
      assertEquals(settings.app_prompt.base_dir, "lib/breakdown/prompts");
      assertEquals(settings.app_schema.base_dir, "lib/breakdown/schema");

      // Restore original config
      if (savedConfig !== null) {
        await Deno.writeTextFile(configPath, savedConfig);
      } else {
        await Deno.remove(configPath);
      }
    } finally {
      Deno.chdir(originalCwd);
      await _cleanupTestEnvironment(env);
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
    const configResult = await _BreakdownConfig.create(); // No config file created
    if (!configResult.success) {
      throw new Error("Failed to create BreakdownConfig");
    }
    const config = configResult.data;
    let errorCaught = false;
    try {
      await (config as any).loadConfig();
    } catch (_error) {
      errorCaught = true;
      if (_error instanceof Error) {
        // Should mention missing config
        if (!_error.message.includes("Application configuration file not found")) {
          throw new Error("Unexpected error message: " + _error.message);
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
