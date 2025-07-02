/**
 * Unit tests for _workspace.ts
 *
 * These tests verify individual method functionality, error handling scenarios,
 * edge cases, and boundary conditions for the workspace module.
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { WorkspaceImpl } from "./_workspace.ts";
import { WorkspaceConfigError, WorkspaceInitError } from "./errors.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { join, resolve } from "@std/path";
import { exists } from "@std/fs";

Deno.test("Workspace Unit Tests", async (t) => {
  const _logger = new BreakdownLogger("unit-test");

  await t.step("Initialization Tests", async (t) => {
    await t.step("should initialize workspace successfully", async () => {
      _logger.debug("Testing successful workspace initialization");

      const tempDir = await Deno.makeTempDir();
      const _workspace = new WorkspaceImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      try {
        await _workspace.initialize();

        // Verify directories were created
        const workspaceExists = await _workspace.exists();
        assertEquals(workspaceExists, true);

        // Verify config file was created
        const configPath = join(tempDir, ".agent", "breakdown", "config", "app.yml");
        const configExists = await exists(configPath);
        assertEquals(configExists, true);

        // Verify template directories were created
        const promptDir = join(tempDir, ".agent", "breakdown", "prompts");
        const schemaDir = join(tempDir, ".agent", "breakdown", "schema");
        const promptExists = await exists(promptDir);
        const schemaExists = await exists(schemaDir);
        assertEquals(promptExists, true);
        assertEquals(schemaExists, true);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should handle permission denied errors", async () => {
      _logger.debug("Testing permission denied error handling");

      // Create workspace with invalid directory (simulate permission denied)
      const _workspace = new WorkspaceImpl({
        workingDir: "/root/restricted", // This should fail on most systems
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      // Should throw WorkspaceInitError for permission issues
      await assertRejects(
        () => _workspace.initialize(),
        Error, // Could be WorkspaceInitError or PermissionDenied
        undefined, // Don't specify exact message as it varies by system
      );
    });

    await t.step("should not overwrite existing config file", async () => {
      _logger.debug("Testing config file preservation");

      const tempDir = await Deno.makeTempDir();
      const configDir = join(tempDir, ".agent", "breakdown", "config");
      const configFile = join(configDir, "app.yml");

      try {
        // Create config directory and file first
        await Deno.mkdir(configDir, { recursive: true });
        await Deno.writeTextFile(configFile, "existing: config");

        const _workspace = new WorkspaceImpl({
          workingDir: tempDir,
          promptBaseDir: "prompts",
          schemaBaseDir: "schema",
        });

        await _workspace.initialize();

        // Verify existing config was preserved
        const configContent = await Deno.readTextFile(configFile);
        assertEquals(configContent, "existing: config");
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  await t.step("Path Resolution Tests", async (t) => {
    await t.step("should resolve paths correctly", async () => {
      _logger.debug("Testing path resolution");

      const tempDir = await Deno.makeTempDir();
      const _workspace = new WorkspaceImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      try {
        const resolvedPath = await _workspace.resolvePath("test/path");
        assertEquals(resolvedPath, ".agent/breakdown/test/path");
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should get correct base directories", async () => {
      _logger.debug("Testing base directory getters");

      const tempDir = await Deno.makeTempDir();
      const _workspace = new WorkspaceImpl({
        workingDir: tempDir,
        promptBaseDir: "custom-prompts",
        schemaBaseDir: "custom-schema",
      });

      try {
        const promptDir = await _workspace.getPromptBaseDir();
        const schemaDir = await _workspace.getSchemaBaseDir();
        const workingDir = await _workspace.getWorkingDir();

        assertEquals(promptDir, resolve(tempDir, "custom-prompts"));
        assertEquals(schemaDir, resolve(tempDir, "custom-schema"));
        assertEquals(workingDir, tempDir);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  await t.step("Directory Operations Tests", async (t) => {
    await t.step("should handle directory operations correctly", async () => {
      _logger.debug("Testing directory operations");

      const tempDir = await Deno.makeTempDir();
      const _workspace = new WorkspaceImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      try {
        await _workspace.initialize();

        // Test directory creation
        await _workspace.createDirectory("test/nested/dir");
        const dirExists = await _workspace.exists("test/nested/dir");
        assertEquals(dirExists, true);

        // Test directory removal
        await _workspace.removeDirectory("test");
        const dirRemoved = !(await _workspace.exists("test"));
        assertEquals(dirRemoved, true);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should handle exists check for non-existent paths", async () => {
      _logger.debug("Testing exists check for non-existent paths");

      const tempDir = await Deno.makeTempDir();
      const _workspace = new WorkspaceImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      try {
        const nonExistentExists = await _workspace.exists("non/existent/path");
        assertEquals(nonExistentExists, false);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  await t.step("Configuration Management Tests", async (t) => {
    await t.step("should validate config successfully", async () => {
      _logger.debug("Testing config validation");

      const tempDir = await Deno.makeTempDir();
      const _workspace = new WorkspaceImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      try {
        // Should pass validation for existing directory
        await _workspace.validateConfig();
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should fail validation for non-existent working directory", async () => {
      _logger.debug("Testing config validation failure");

      const _workspace = new WorkspaceImpl({
        workingDir: "/non/existent/directory",
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      await assertRejects(
        () => _workspace.validateConfig(),
        WorkspaceConfigError,
        "Working directory does not exist",
      );
    });

    await t.step("should reload config from file", async () => {
      _logger.debug("Testing config reload");

      const tempDir = await Deno.makeTempDir();
      const _workspace = new WorkspaceImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      try {
        await _workspace.initialize();

        // Modify config file
        const configFile = join(tempDir, ".agent", "breakdown", "config", "app.yml");
        const newConfig = `
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: "modified-prompts"
app_schema:
  base_dir: "modified-schema"
`;
        await Deno.writeTextFile(configFile, newConfig);

        // Reload config
        await _workspace.reloadConfig();

        // Verify config was reloaded (indirectly through getters)
        const promptDir = await _workspace.getPromptBaseDir();
        const schemaDir = await _workspace.getSchemaBaseDir();

        assertEquals(promptDir, resolve(tempDir, "modified-prompts"));
        assertEquals(schemaDir, resolve(tempDir, "modified-schema"));
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should fail to reload missing config file", async () => {
      _logger.debug("Testing config reload failure");

      const tempDir = await Deno.makeTempDir();
      const _workspace = new WorkspaceImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      try {
        await assertRejects(
          () => _workspace.reloadConfig(),
          WorkspaceConfigError,
          "Configuration file not found",
        );
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  await t.step("Edge Cases and Error Handling", async (t) => {
    await t.step("should handle empty path in exists check", async () => {
      _logger.debug("Testing exists check with no path parameter");

      const tempDir = await Deno.makeTempDir();
      const _workspace = new WorkspaceImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      try {
        // Should check working directory when no path provided
        const workspaceExists = await _workspace.exists();
        assertEquals(workspaceExists, true);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should handle special characters in paths", async () => {
      _logger.debug("Testing special characters in paths");

      const tempDir = await Deno.makeTempDir();
      const _workspace = new WorkspaceImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts with spaces",
        schemaBaseDir: "schema-with-dashes",
      });

      try {
        await _workspace.initialize();

        const promptDir = await _workspace.getPromptBaseDir();
        const schemaDir = await _workspace.getSchemaBaseDir();

        assertEquals(promptDir, resolve(tempDir, "prompts with spaces"));
        assertEquals(schemaDir, resolve(tempDir, "schema-with-dashes"));
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    await t.step("should handle concurrent initialization attempts", async () => {
      _logger.debug("Testing concurrent initialization");

      const tempDir = await Deno.makeTempDir();
      const workspace1 = new WorkspaceImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      const workspace2 = new WorkspaceImpl({
        workingDir: tempDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      try {
        // Both should succeed without conflict
        await Promise.all([
          workspace1.initialize(),
          workspace2.initialize(),
        ]);

        const exists1 = await workspace1.exists();
        const exists2 = await workspace2.exists();
        assertEquals(exists1, true);
        assertEquals(exists2, true);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });
});
