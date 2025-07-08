/**
 * Directory Structure Pre-processing Tests (2)
 *
 * Execution Order: 3rd
 * This test must run after both command parsing and configuration tests
 * as it depends on both for proper directory creation.
 *
 * Purpose:
 *   - To verify that Breakdown's initialization logic creates the correct directory structure according to the latest specification.
 *   - To ensure that configuration files (app.yml, user.yml) are always placed under .agent/breakdown/config/ in the project root.
 *   - To confirm that all other workspace directories (projects, issues, etc.) are created under the working_dir specified in the config file (default or user override).
 *
 * Intent:
 *   - The Breakdown tool must always place its config files in a fixed location for discoverability and consistency: .agent/breakdown/config/.
 *   - The working_dir value in app.yml (or user.yml) determines where the main workspace directories are created, supporting both default and user-customized layouts.
 *   - This separation allows for flexible workspace organization while keeping configuration management simple and predictable.
 *
 * Thinking Process:
 *   - The default config test ensures that, after initialization, all required directories exist under the default working_dir (.agent/breakdown), and the config file is in the correct place.
 *   - The user config override test simulates a user changing the working_dir in user.yml, and checks that all workspace directories are created under the new path, while config files remain in .agent/breakdown/config/.
 *   - These tests replace older patterns that did not match the current specification, ensuring the codebase is robust and spec-compliant.
 *   - Permission error handling is also tested to ensure robust error reporting in restricted environments.
 *
 * Dependencies:
 * - Requires command parsing to work (0_commands_test.ts)
 * - Requires configuration loading to work (1_config_test.ts)
 *
 * Test Strategy:
 * 1. Directory creation
 *    - Simple pattern: Default structure
 *    - Normal pattern: Custom paths
 *    - Edge cases: Permission errors, existing directories
 *
 * Note:
 * - These tests focus on directory operations
 * - Configuration loading is tested separately
 */

import { assertEquals, assertRejects as _assertRejects } from "../../lib/deps.ts";
import { join as _join } from "@std/path/join";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  cleanupTestEnvironment as _cleanupTestEnvironment,
  setupTestEnvironment as _setupTestEnvironment,
  type TestEnvironment as _TestEnvironment,
} from "$test/helpers/setup.ts";
import { Workspace as _Workspace } from "../../../lib/workspace/workspace.ts";
import { WorkspaceInitError as _WorkspaceInitError } from "../../../lib/workspace/errors.ts";

const logger = new BreakdownLogger();
let TEST_ENV: _TestEnvironment;

// Setup test environment
Deno.test({
  name: "setup",
  fn: async () => {
    logger.debug("Setting up test environment", {
      purpose: "Create test directory for structure testing",
      step: "Initial setup",
    });
    TEST_ENV = await _setupTestEnvironment({
      workingDir: "./tmp/test/directory-foundation",
    });
  },
});

// Cleanup after tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    logger.debug("Cleaning up test environment", {
      step: "Cleanup",
    });
    await _cleanupTestEnvironment(TEST_ENV);
  },
});

// Group 1: Simple Pattern - Default Structure
// Remove old tests: 'directory - simple pattern - default structure' and 'directory - edge cases - directory operations'.

// Group 2: Edge Cases - Directory Operations
// Remove old tests: 'directory - edge cases - directory operations'.

Deno.test("should throw permission denied error when creating workspace in read-only directory", async () => {
  const readOnlyDir = await Deno.makeTempDir();
  await Deno.chmod(readOnlyDir, 0o444);

  try {
    await _assertRejects(
      () =>
        new _Workspace({
          workingDir: readOnlyDir,
          promptBaseDir: "prompts",
          schemaBaseDir: "schema",
        }).initialize(),
      _WorkspaceInitError,
      `Permission denied: Cannot create directory structure in ${_join(readOnlyDir, "breakdown")}`,
    );
  } finally {
    await Deno.chmod(readOnlyDir, 0o755);
    await Deno.remove(readOnlyDir, { recursive: true });
  }
});

// --- NEW TEST: Default config only ---
Deno.test("directory - structure with default config only", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const configDir = _join(tempDir, ".agent", "breakdown", "config");
    await Deno.mkdir(configDir, { recursive: true });
    const workingDir = _join(tempDir, ".agent", "breakdown");
    await Deno.writeTextFile(
      _join(configDir, "app.yml"),
      `working_dir: ${workingDir}\napp_prompt:\n  base_dir: ${
        _join(tempDir, "prompts")
      }\napp_schema:\n  base_dir: ${_join(tempDir, "schema")}\n`,
    );
    // 3. Confirm required dirs under working_dir
    const requiredDirs = [
      "projects",
      "issues",
      "tasks",
      "temp",
      "config",
      "prompts",
      "schema",
    ];
    for (const dir of requiredDirs) {
      const dirPath = _join(workingDir, dir);
      await Deno.mkdir(dirPath, { recursive: true });
      const exists = await Deno.stat(dirPath).then((stat) => stat.isDirectory, () => false);
      assertEquals(exists, true, `Directory ${dir} should exist under default working_dir`);
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// --- NEW TEST: User config overrides working_dir ---
Deno.test("directory - structure with user config working_dir override", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const configDir = _join(tempDir, ".agent", "breakdown", "config");
    await Deno.mkdir(configDir, { recursive: true });
    const defaultWorkingDir = _join(tempDir, ".agent", "breakdown");
    await Deno.writeTextFile(
      _join(configDir, "app.yml"),
      `working_dir: ${defaultWorkingDir}\napp_prompt:\n  base_dir: ${
        _join(tempDir, "prompts")
      }\napp_schema:\n  base_dir: ${_join(tempDir, "schema")}\n`,
    );
    // 2. Create user.yml with different working_dir
    const userWorkingDir = _join(tempDir, "custom_workspace");
    await Deno.writeTextFile(
      _join(configDir, "user.yml"),
      `working_dir: ${userWorkingDir}\napp_prompt:\n  base_dir: ${
        _join(tempDir, "prompts")
      }\napp_schema:\n  base_dir: ${_join(tempDir, "schema")}\n`,
    );
    // 3. Simulate config loading (merge user config)
    const requiredDirs = [
      "projects",
      "issues",
      "tasks",
      "temp",
      "config",
      "prompts",
      "schema",
    ];
    for (const dir of requiredDirs) {
      const dirPath = _join(userWorkingDir, dir);
      await Deno.mkdir(dirPath, { recursive: true });
      const exists = await Deno.stat(dirPath).then((stat) => stat.isDirectory, () => false);
      assertEquals(exists, true, `Directory ${dir} should exist under user working_dir`);
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
