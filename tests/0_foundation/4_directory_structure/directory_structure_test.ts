/**
 * Directory Structure Pre-processing Tests (2)
 *
 * Execution Order: 3rd
 * This test must run after both command parsing and configuration tests
 * as it depends on both for proper directory creation.
 *
 * Purpose:
 * Test the directory structure creation and validation
 * This is a foundational test that must pass before running command tests
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

import { assertEquals, assertRejects, join } from "$deps/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironment,
} from "$test/helpers/setup.ts";
import { initWorkspace } from "../../../lib/commands/mod.ts";
import { Workspace } from "../../../lib/workspace/workspace.ts";
import { WorkspaceInitError } from "../../../lib/workspace/errors.ts";

const logger = new BreakdownLogger();
let TEST_ENV: TestEnvironment;

// Setup test environment
Deno.test({
  name: "setup",
  fn: async () => {
    logger.debug("Setting up test environment", {
      purpose: "Create test directory for structure testing",
      step: "Initial setup",
    });
    TEST_ENV = await setupTestEnvironment({
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
    await cleanupTestEnvironment(TEST_ENV);
  },
});

// Group 1: Simple Pattern - Default Structure
Deno.test("directory - simple pattern - default structure", async () => {
  logger.debug("Testing default directory structure creation", {
    purpose: "Verify basic directory creation",
    step: "Simple pattern",
  });

  await initWorkspace(TEST_ENV.workingDir);

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
    const dirPath = join(TEST_ENV.workingDir, "breakdown", dir);
    const exists = await Deno.stat(dirPath).then(
      (stat) => stat.isDirectory,
      () => false,
    );
    assertEquals(exists, true, `Directory ${dir} should exist`);
  }
});

// Group 2: Edge Cases - Directory Operations
Deno.test("directory - edge cases - directory operations", async () => {
  logger.debug("Testing directory operation edge cases", {
    purpose: "Verify error handling for directory operations",
    step: "Edge cases",
  });

  // Case 1: Create in non-existent parent directory (should create recursively)
  const nonExistentPath = join(TEST_ENV.workingDir, "non-existent");
  await initWorkspace(nonExistentPath);

  // Verify all required directories were created
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
    const dirPath = join(nonExistentPath, "breakdown", dir);
    const exists = await Deno.stat(dirPath).then(
      (stat) => stat.isDirectory,
      () => false,
    );
    assertEquals(exists, true, `Directory ${dir} should exist in non-existent parent`);
  }

  // Case 2: Create with insufficient permissions
  // Note: This test might not work on all systems due to permission handling
  if (Deno.build.os !== "windows") {
    const restrictedPath = join(TEST_ENV.workingDir, "restricted");
    await Deno.mkdir(restrictedPath, { recursive: true });

    try {
      // Set restrictive permissions (read-only)
      await Deno.chmod(restrictedPath, 0o444);

      // Try to create workspace in read-only directory
      await assertRejects(
        async () => {
          const workspace = new Workspace({ workingDir: restrictedPath });
          await workspace.ensureDirectories();
        },
        WorkspaceInitError,
        `Permission denied: Cannot create directory structure in ${
          join(restrictedPath, "breakdown")
        }`,
      );
    } finally {
      // Restore permissions to allow cleanup
      try {
        await Deno.chmod(restrictedPath, 0o755);
      } catch (error) {
        logger.error("Failed to restore permissions", { error });
      }
    }
  }

  // Case 3: Create when directories already exist
  const existingPath = join(TEST_ENV.workingDir, "existing");
  await Deno.mkdir(existingPath, { recursive: true });
  await initWorkspace(existingPath);

  // Should not throw and should ensure all directories exist
  const breakdownDir = join(existingPath, "breakdown");
  const exists = await Deno.stat(breakdownDir).then(
    (stat) => stat.isDirectory,
    () => false,
  );
  assertEquals(exists, true, "Should handle existing directories gracefully");
});

Deno.test("should throw permission denied error when creating workspace in read-only directory", async () => {
  const readOnlyDir = await Deno.makeTempDir();
  await Deno.chmod(readOnlyDir, 0o444);

  try {
    await assertRejects(
      () => new Workspace({ workingDir: readOnlyDir }).ensureDirectories(),
      WorkspaceInitError,
      `Permission denied: Cannot create directory structure in ${join(readOnlyDir, "breakdown")}`,
    );
  } finally {
    await Deno.chmod(readOnlyDir, 0o755);
    await Deno.remove(readOnlyDir, { recursive: true });
  }
});
