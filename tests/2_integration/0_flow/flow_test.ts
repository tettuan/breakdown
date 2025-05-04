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
  assertEquals(await exists(workspace.getPromptBaseDir()), true);
  assertEquals(await exists(workspace.getSchemaBaseDir()), true);
});

// Test workspace initialization and structure
Deno.test("workspace initialization and structure", async () => {
  const workspace = new Workspace({
    workingDir: TEST_DIR,
  });

  // Initialize workspace
  await workspace.initialize();

  // Create .agent/breakdown/config/app.yml for BreakdownConfig
  const configDir = join(".agent", "breakdown", "config");
  await Deno.mkdir(configDir, { recursive: true });
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schemas\n`
  );

  // Set PromptVariablesFactory for path resolution
  const cliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {
      fromFile: "test.md",
      destinationFile: "test.md",
      fromLayerType: "project",
    },
  };
  const factory = await import("$lib/factory/PromptVariablesFactory.ts").then(m => m.PromptVariablesFactory.create(cliParams));
  workspace.setPromptVariablesFactory(factory);

  // Verify workspace directories
  assertEquals(await exists(workspace.getPromptBaseDir()), true);
  assertEquals(await exists(workspace.getSchemaBaseDir()), true);
  assertEquals(await exists(workspace.getWorkingDir()), true);

  // See: docs/breakdown/app_config.ja.md
  // app_prompt.base_dir, app_schema.base_dir は working_dir の prefix ではなく、Deno.cwd()（プロジェクトルート）基準で解決される仕様。
  // 仕様詳細は app_config.ja.md を参照。
  assertEquals(
    workspace.resolvePromptPath("test.md"),
    resolve(Deno.cwd(), "prompts", "to", "project", "f_project.md"),
  );

  assertEquals(
    workspace.resolveSchemaPath("test.json"),
    resolve(Deno.cwd(), "schemas", "to", "project", "base.schema.md"),
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
