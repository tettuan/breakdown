import { assertEquals } from "@std/assert";
import { exists } from "@std/fs";
import { Workspace } from "$lib/workspace/mod.ts";
import { WorkspaceConfigError } from "$lib/workspace/errors.ts";

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
  },
});

// Test basic initialization flow
Deno.test("breakdown init creates correct directory structure", async () => {
  const workspace = new Workspace({
    workingDir: TEST_DIR,
  });

  await workspace.initialize();

  // Verify directory structure exists
  assertEquals(await exists(workspace.getWorkingDir()), true);
  assertEquals(await exists(workspace.getPromptDir()), true);
  assertEquals(await exists(workspace.getSchemaDir()), true);
});

// Test workspace initialization and structure
Deno.test("workspace initialization and structure", async () => {
  const workspace = new Workspace({
    workingDir: TEST_DIR,
  });

  // Initialize workspace
  await workspace.initialize();

  // Verify workspace directories
  assertEquals(await exists(workspace.getPromptDir()), true);
  assertEquals(await exists(workspace.getSchemaDir()), true);
  assertEquals(await exists(workspace.getWorkingDir()), true);

  // Verify path resolution
  assertEquals(
    workspace.resolvePromptPath("test.md"),
    `${workspace.getPromptDir()}/test.md`,
  );

  assertEquals(
    workspace.resolveSchemaPath("test.json"),
    `${workspace.getSchemaDir()}/test.json`,
  );
});

// Test error handling
Deno.test("workspace error handling", async () => {
  const workspace = new Workspace({
    workingDir: "/nonexistent/path",
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
