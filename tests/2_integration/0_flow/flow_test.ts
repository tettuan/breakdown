import { assertEquals } from "@std/assert";
import { exists } from "@std/fs";
import { Workspace } from "$lib/workspace/mod.ts";
import { WorkspaceConfigError } from "$lib/workspace/errors.ts";
import { join } from "@std/path/join";
import { resolve } from "@std/path/resolve";

/**
 * Integration tests for the breakdown workflow
 * These tests verify the interaction between different components
 * and ensure they work together correctly.
 */

const TEST_DIR = ".agent/breakdown";

// Setup test environment
Deno.test({
  name: "setup",
  fn: async () => {
    try {
      await Deno.remove(TEST_DIR, { recursive: true });
    } catch {
      // Ignore if directory doesn't exist
    }
    // Create required directories for cwd-based path resolution
    await Deno.mkdir("prompts", { recursive: true });
    await Deno.mkdir("schema", { recursive: true });
  },
});

// Test basic initialization flow
Deno.test("breakdown init creates correct directory structure", async () => {
  const workspace = new Workspace({
    workingDir: TEST_DIR,
    promptBaseDir: "prompts",
    schemaBaseDir: "schema",
  });

  await workspace.initialize();

  // Verify directory structure exists
  assertEquals(await exists(await workspace.getWorkingDir()), true);
  assertEquals(await exists(await workspace.getPromptBaseDir()), true);
  assertEquals(await exists(await workspace.getSchemaBaseDir()), true);
});

// Test workspace initialization and structure
Deno.test("workspace initialization and structure", async () => {
  // Overwrite config with custom base directories before initialization
  const configDir = join(TEST_DIR, ".agent", "breakdown", "config");
  await Deno.mkdir(configDir, { recursive: true });
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .\napp_prompt:\n  base_dir: custom_prompts\napp_schema:\n  base_dir: custom_schema\n`,
  );

  // Create custom directories
  await Deno.mkdir(join(TEST_DIR, "custom_prompts"), { recursive: true });
  await Deno.mkdir(join(TEST_DIR, "custom_schema"), { recursive: true });

  const workspace = new Workspace({
    workingDir: TEST_DIR,
    promptBaseDir: "custom_prompts",
    schemaBaseDir: "custom_schema",
  });

  // Initialize workspace
  await workspace.initialize();

  // Verify that paths are resolved relative to the workspace directory
  assertEquals(
    await workspace.getPromptBaseDir(),
    resolve(TEST_DIR, "custom_prompts"),
    "Custom prompt base directory should be resolved relative to workspace directory",
  );

  assertEquals(
    await workspace.getSchemaBaseDir(),
    resolve(TEST_DIR, "custom_schema"),
    "Custom schema base directory should be resolved relative to workspace directory",
  );
});

// Test error handling
Deno.test("workspace error handling", async () => {
  const workspace = new Workspace({
    workingDir: "/nonexistent/path",
    promptBaseDir: "prompts",
    schemaBaseDir: "schema",
  });

  try {
    await workspace.validateConfig();
    throw new Error("Should have thrown WorkspaceConfigError");
  } catch (error) {
    if (!(error instanceof WorkspaceConfigError)) {
      throw new Error("Expected WorkspaceConfigError");
    }
    assertEquals(error instanceof WorkspaceConfigError, true);
    assertEquals(error.code, "WORKSPACE_CONFIG_ERROR");
  }
});

// Test cwd-based path resolution
Deno.test("workspace path resolution", async () => {
  const workspace = new Workspace({
    workingDir: TEST_DIR,
    promptBaseDir: "custom_prompts",
    schemaBaseDir: "custom_schema",
  });

  // Initialize workspace
  await workspace.initialize();

  // Create config with custom base directories
  const configDir = join(TEST_DIR, ".agent", "breakdown", "config");
  await Deno.mkdir(configDir, { recursive: true });
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .\napp_prompt:\n  base_dir: custom_prompts\napp_schema:\n  base_dir: custom_schema\n`,
  );

  // Create custom directories
  await Deno.mkdir(join(TEST_DIR, "custom_prompts"), { recursive: true });
  await Deno.mkdir(join(TEST_DIR, "custom_schema"), { recursive: true });

  // Reload config after writing app.yml
  await workspace.reloadConfig();

  // Debug output
  const actualPromptBaseDir = await workspace.getPromptBaseDir();
  console.log("[DEBUG] actualPromptBaseDir:", actualPromptBaseDir);

  // Verify that paths are resolved relative to the workspace directory
  assertEquals(
    actualPromptBaseDir,
    resolve(TEST_DIR, "custom_prompts"),
    "Custom prompt base directory should be resolved relative to workspace directory",
  );

  assertEquals(
    await workspace.getSchemaBaseDir(),
    resolve(TEST_DIR, "custom_schema"),
    "Custom schema base directory should be resolved relative to workspace directory",
  );
});
