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
    // await Deno.mkdir("prompts", { recursive: true });
    // await Deno.mkdir("schema", { recursive: true });
  },
});

// Test basic initialization flow
Deno.test("breakdown init creates correct directory structure", async () => {
  const tempDir = await Deno.makeTempDir();
  const promptsDir = join(tempDir, "prompts");
  const schemaDir = join(tempDir, "schema");
  await Deno.mkdir(promptsDir, { recursive: true });
  await Deno.mkdir(schemaDir, { recursive: true });
  const workspace = new Workspace({
    workingDir: tempDir,
    promptBaseDir: promptsDir,
    schemaBaseDir: schemaDir,
  });
  await workspace.initialize();
  assertEquals(await exists(await workspace.getWorkingDir()), true);
  assertEquals(await exists(await workspace.getPromptBaseDir()), true);
  assertEquals(await exists(await workspace.getSchemaBaseDir()), true);
  await Deno.remove(tempDir, { recursive: true });
});

// Test workspace initialization and structure
Deno.test("workspace initialization and structure", async () => {
  const tempDir = await Deno.makeTempDir();
  const customPromptsDir = join(tempDir, "custom_prompts");
  const customSchemaDir = join(tempDir, "custom_schema");
  await Deno.mkdir(customPromptsDir, { recursive: true });
  await Deno.mkdir(customSchemaDir, { recursive: true });
  const configDir = join(tempDir, ".agent", "breakdown", "config");
  await Deno.mkdir(configDir, { recursive: true });
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .\napp_prompt:\n  base_dir: ${customPromptsDir}\napp_schema:\n  base_dir: ${customSchemaDir}\n`,
  );
  const workspace = new Workspace({
    workingDir: tempDir,
    promptBaseDir: customPromptsDir,
    schemaBaseDir: customSchemaDir,
  });
  await workspace.initialize();
  assertEquals(
    await workspace.getPromptBaseDir(),
    customPromptsDir,
    "Custom prompt base directory should be resolved to absolute path",
  );
  assertEquals(
    await workspace.getSchemaBaseDir(),
    customSchemaDir,
    "Custom schema base directory should be resolved to absolute path",
  );
  await Deno.remove(tempDir, { recursive: true });
});

// Test error handling
Deno.test("workspace error handling", async () => {
  const workspace = new Workspace({
    workingDir: "/nonexistent/path",
    promptBaseDir: "/nonexistent/prompts",
    schemaBaseDir: "/nonexistent/schema",
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
  const tempDir = await Deno.makeTempDir();
  const customPromptsDir = join(tempDir, "custom_prompts");
  const customSchemaDir = join(tempDir, "custom_schema");
  await Deno.mkdir(customPromptsDir, { recursive: true });
  await Deno.mkdir(customSchemaDir, { recursive: true });
  const workspace = new Workspace({
    workingDir: tempDir,
    promptBaseDir: customPromptsDir,
    schemaBaseDir: customSchemaDir,
  });
  await workspace.initialize();
  const configDir = join(tempDir, ".agent", "breakdown", "config");
  await Deno.mkdir(configDir, { recursive: true });
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .\napp_prompt:\n  base_dir: ${customPromptsDir}\napp_schema:\n  base_dir: ${customSchemaDir}\n`,
  );
  await workspace.reloadConfig();
  const actualPromptBaseDir = await workspace.getPromptBaseDir();
  assertEquals(
    actualPromptBaseDir,
    customPromptsDir,
    "Custom prompt base directory should be resolved to absolute path",
  );
  assertEquals(
    await workspace.getSchemaBaseDir(),
    customSchemaDir,
    "Custom schema base directory should be resolved to absolute path",
  );
  await Deno.remove(tempDir, { recursive: true });
});
