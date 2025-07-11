/**
 * @fileoverview Unit tests for Workspace implementation
 *
 * Tests are organized in three categories:
 * - 0_architecture: Type constraint verification and Smart Constructor patterns
 * - 1_behavior: Runtime behavior verification and Totality principle
 * - 2_structure: Structural correctness verification
 *
 * @module workspace/workspace_test
 */

import { assert, assertEquals, assertRejects } from "@std/assert";
import { ensureDir, exists } from "@std/fs";
import { join } from "@std/path";
import { initWorkspace, WorkspaceImpl } from "./workspace.ts";
import {
  createWorkspaceConfigError,
  createWorkspaceInitError,
  isWorkspaceConfigError,
  isWorkspaceInitError,
  WorkspaceConfigError,
  type WorkspaceConfigError as _WorkspaceConfigErrorInterface,
  WorkspaceError as _WorkspaceError,
} from "./errors.ts";
import type { WorkspaceConfig } from "./interfaces.ts";

// =============================================================================
// 0_architecture: Type Constraint Tests & Smart Constructor
// =============================================================================

Deno.test("0_architecture: WorkspaceImpl enforces valid configuration types", () => {
  // Valid configuration should create workspace instance
  const validConfig: WorkspaceConfig = {
    workingDir: "/tmp/test-workspace",
    promptBaseDir: "prompts",
    schemaBaseDir: "schema",
  };

  const workspace = new WorkspaceImpl(validConfig);
  assert(workspace instanceof WorkspaceImpl);
});

Deno.test("0_architecture: Configuration immutability enforcement", async () => {
  const config: WorkspaceConfig = {
    workingDir: "/tmp/test-workspace-immutable",
    promptBaseDir: "prompts",
    schemaBaseDir: "schema",
  };

  const workspace = new WorkspaceImpl(config);

  // Modify original config
  config.workingDir = "/tmp/modified";

  // Workspace should maintain original values
  const workingDir = await workspace.getWorkingDir();
  assertEquals(workingDir, "/tmp/test-workspace-immutable");
});

Deno.test("0_architecture: Smart Constructor pattern - initWorkspace validates inputs", async () => {
  // Should handle default values
  const tempDir = await Deno.makeTempDir();

  try {
    await initWorkspace(tempDir);

    // Verify workspace structure was created
    assert(await exists(join(tempDir, ".agent", "breakdown")));
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// =============================================================================
// 1_behavior: Runtime Behavior Tests & Totality Principle
// =============================================================================

Deno.test("1_behavior: Totality - initialize handles all possible filesystem states", async () => {
  const tempDir = await Deno.makeTempDir();

  try {
    const config: WorkspaceConfig = {
      workingDir: tempDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    };

    const workspace = new WorkspaceImpl(config);

    // Should succeed even if directory doesn't exist
    await workspace.initialize();

    // Should be idempotent - running again should not fail
    await workspace.initialize();

    // Verify all required directories exist
    assert(await exists(join(tempDir, "prompts")));
    assert(await exists(join(tempDir, "schema")));
    assert(await exists(join(tempDir, ".agent", "breakdown", "config")));
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("1_behavior: Totality - validateConfig handles non-existent directories", async () => {
  const config: WorkspaceConfig = {
    workingDir: "/non-existent-directory-12345",
    promptBaseDir: "prompts",
    schemaBaseDir: "schema",
  };

  const workspace = new WorkspaceImpl(config);

  // Should reject with error for non-existent directory
  try {
    await workspace.validateConfig();
    assert(false, "Expected validation to fail");
  } catch (error) {
    assert(
      error instanceof WorkspaceConfigError &&
        error.message.includes("Working directory does not exist"),
    );
  }
});

Deno.test("1_behavior: Directory operations maintain consistency", async () => {
  const tempDir = await Deno.makeTempDir();

  try {
    const config: WorkspaceConfig = {
      workingDir: tempDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    };

    const workspace = new WorkspaceImpl(config);
    await workspace.initialize();

    // Test directory creation
    const testDirPath = join(tempDir, "test-dir");
    await workspace.createDirectory(testDirPath);
    assert(await workspace.exists(testDirPath));

    // Test directory removal
    await workspace.removeDirectory(testDirPath);
    assert(!await workspace.exists(testDirPath));
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("1_behavior: Path resolution is deterministic", async () => {
  const tempDir = await Deno.makeTempDir();

  try {
    const config: WorkspaceConfig = {
      workingDir: tempDir,
      promptBaseDir: "custom-prompts",
      schemaBaseDir: "custom-schema",
    };

    const workspace = new WorkspaceImpl(config);

    const promptDir = await workspace.getPromptBaseDir();
    const schemaDir = await workspace.getSchemaBaseDir();
    const workingDir = await workspace.getWorkingDir();

    // Path resolution should be consistent
    assertEquals(await workspace.getPromptBaseDir(), promptDir);
    assertEquals(await workspace.getSchemaBaseDir(), schemaDir);
    assertEquals(await workspace.getWorkingDir(), workingDir);

    // Paths should contain expected components
    assert(promptDir.includes("custom-prompts"));
    assert(schemaDir.includes("custom-schema"));
    assertEquals(workingDir, tempDir);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("1_behavior: Configuration reload maintains state consistency", async () => {
  const tempDir = await Deno.makeTempDir();

  try {
    const config: WorkspaceConfig = {
      workingDir: tempDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    };

    const workspace = new WorkspaceImpl(config);
    await workspace.initialize();

    // Initial state
    const initialPromptDir = await workspace.getPromptBaseDir();

    // Reload configuration
    await workspace.reloadConfig();

    // State should remain consistent
    const reloadedPromptDir = await workspace.getPromptBaseDir();
    assertEquals(reloadedPromptDir, initialPromptDir);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("1_behavior: Error handling follows Result pattern principles", async () => {
  // Test permission denied scenario (simulated)
  const restrictedPath = "/root/restricted-workspace";

  const config: WorkspaceConfig = {
    workingDir: restrictedPath,
    promptBaseDir: "prompts",
    schemaBaseDir: "schema",
  };

  const workspace = new WorkspaceImpl(config);

  // Should handle permission errors gracefully
  await assertRejects(
    () => workspace.initialize(),
    Error, // Will be PermissionDenied in actual restricted environment
  );
});

// =============================================================================
// 1_behavior: Monadic Operations (Result-like behavior)
// =============================================================================

Deno.test("1_behavior: Workspace operations compose correctly", async () => {
  const tempDir = await Deno.makeTempDir();

  try {
    const config: WorkspaceConfig = {
      workingDir: tempDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    };

    const workspace = new WorkspaceImpl(config);

    // Operations should compose without side effects
    const operations = [
      () => workspace.initialize(),
      () => workspace.validateConfig(),
      () => workspace.getWorkingDir(),
      () => workspace.getPromptBaseDir(),
      () => workspace.getSchemaBaseDir(),
    ];

    // All operations should succeed in sequence
    for (const operation of operations) {
      await operation();
    }

    // Operations should be idempotent
    for (const operation of operations) {
      await operation();
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// =============================================================================
// 2_structure: Structural Correctness Tests
// =============================================================================

Deno.test("2_structure: Workspace implements required interfaces", () => {
  const config: WorkspaceConfig = {
    workingDir: "/tmp/test-workspace",
    promptBaseDir: "prompts",
    schemaBaseDir: "schema",
  };

  const workspace = new WorkspaceImpl(config);

  // Verify all required methods exist
  assert(typeof workspace.initialize === "function");
  assert(typeof workspace.createDirectory === "function");
  assert(typeof workspace.removeDirectory === "function");
  assert(typeof workspace.exists === "function");
  assert(typeof workspace.getPromptBaseDir === "function");
  assert(typeof workspace.getSchemaBaseDir === "function");
  assert(typeof workspace.getWorkingDir === "function");
  assert(typeof workspace.validateConfig === "function");
  assert(typeof workspace.reloadConfig === "function");
  assert(typeof workspace.resolvePath === "function");
});

Deno.test("2_structure: Configuration object maintains expected shape", () => {
  const config: WorkspaceConfig = {
    workingDir: "/tmp/test",
    promptBaseDir: "prompts",
    schemaBaseDir: "schema",
  };

  // Verify configuration has required properties
  assert("workingDir" in config);
  assert("promptBaseDir" in config);
  assert("schemaBaseDir" in config);

  assertEquals(typeof config.workingDir, "string");
  assertEquals(typeof config.promptBaseDir, "string");
  assertEquals(typeof config.schemaBaseDir, "string");
});

Deno.test("2_structure: Error types have correct structure", () => {
  const initError = createWorkspaceInitError("test init error");
  const configError = createWorkspaceConfigError("test config error");

  assert(isWorkspaceInitError(initError));
  assertEquals(initError.type, "workspace_init_error");
  assertEquals(initError.code, "WORKSPACE_INIT_ERROR");
  assertEquals(initError.message, "test init error");

  assert(isWorkspaceConfigError(configError));
  assertEquals(configError.type, "workspace_config_error");
  assertEquals(configError.code, "WORKSPACE_CONFIG_ERROR");
  assertEquals(configError.message, "test config error");
});

Deno.test("2_structure: initWorkspace function signature and defaults", async () => {
  const tempDir = await Deno.makeTempDir();

  try {
    // Test with minimal arguments
    await initWorkspace(tempDir);

    // Test with custom configuration
    await initWorkspace(tempDir, {
      app_prompt: { base_dir: "custom-prompts" },
      app_schema: { base_dir: "custom-schema" },
    });

    // Verify structure exists
    assert(await exists(join(tempDir, ".agent", "breakdown")));
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// =============================================================================
// Integration Tests with Supporting Domain Patterns
// =============================================================================

Deno.test("2_structure: Workspace integrates with supporting domain patterns", async () => {
  const tempDir = await Deno.makeTempDir();

  try {
    // Test workspace creation with various configurations
    const configs = [
      { promptBaseDir: "prompts", schemaBaseDir: "schema" },
      { promptBaseDir: "custom/prompts", schemaBaseDir: "custom/schema" },
      { promptBaseDir: ".templates/prompts", schemaBaseDir: ".templates/schema" },
    ];

    for (const [index, configPart] of configs.entries()) {
      const workspaceDir = join(tempDir, `workspace-${index}`);
      await ensureDir(workspaceDir);

      const config: WorkspaceConfig = {
        workingDir: workspaceDir,
        ...configPart,
      };

      const workspace = new WorkspaceImpl(config);
      await workspace.initialize();

      // Verify each workspace is isolated and correctly configured
      assert(await workspace.exists());
      const promptDir = await workspace.getPromptBaseDir();
      const schemaDir = await workspace.getSchemaBaseDir();

      assert(promptDir.includes(configPart.promptBaseDir));
      assert(schemaDir.includes(configPart.schemaBaseDir));
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
