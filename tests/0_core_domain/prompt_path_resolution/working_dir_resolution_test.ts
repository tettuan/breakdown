/**
 * @fileoverview Integration tests for Working Directory Path Resolution
 *
 * Tests cover the integration between WorkingDirectoryPath and PromptTemplatePathResolverTotality
 * focusing on working directory path resolution scenarios.
 *
 * Test Categories:
 * - 3_core: Domain integration functionality tests
 * - Normal cases: Various working directory configurations
 * - Error cases: Invalid working directory configurations
 * - Boundary cases: Edge conditions in path resolution
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { join } from "jsr:@std/path@^1.0.9";
import {
  formatPathResolutionError,
  PromptTemplatePathResolverTotality,
} from "../../../lib/factory/prompt_template_path_resolver_totality.ts";
import { WorkingDirectoryPath } from "../../../lib/domain/core/value_objects/working_directory_path.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";

// Test fixtures and helpers
const TEST_BASE_DIR = "/tmp/breakdown-working-dir-integration-tests";

async function createTestEnvironment(): Promise<{
  testDir: string;
  workingDir: string;
  promptsDir: string;
  schemasDir: string;
}> {
  const testDir = `${TEST_BASE_DIR}-${Date.now()}`;
  const workingDir = join(testDir, "workspace");
  const promptsDir = join(workingDir, "prompts");
  const schemasDir = join(workingDir, "schemas");

  await Deno.mkdir(testDir, { recursive: true });
  await Deno.mkdir(workingDir, { recursive: true });
  await Deno.mkdir(promptsDir, { recursive: true });
  await Deno.mkdir(schemasDir, { recursive: true });

  return { testDir, workingDir, promptsDir, schemasDir };
}

async function createTestFile(path: string, content: string = "test content"): Promise<void> {
  const dir = path.substring(0, path.lastIndexOf("/"));
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(path, content);
}

async function cleanupTestEnvironment(testDir: string): Promise<void> {
  try {
    await Deno.remove(testDir, { recursive: true });
  } catch {
    // Ignore if already removed
  }
}

// =============================================================================
// 3_core: Domain integration functionality tests
// =============================================================================

Deno.test("3_core - Working directory with relative prompt base_dir", async () => {
  const { testDir, workingDir, promptsDir } = await createTestEnvironment();
  const promptFile = join(promptsDir, "to", "issue", "f_issue.md");

  try {
    await createTestFile(promptFile);

    // Test configuration with relative base_dir and explicit working_dir
    const config = {
      app_prompt: { base_dir: "prompts" }, // Relative to working_dir
      working_dir: workingDir,
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
      options: {},
    };

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        assertEquals(pathResult.data.value, promptFile);
        assertEquals(pathResult.data.status, "Found");
        assertEquals(pathResult.data.metadata.baseDir, promptsDir);
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("3_core - Working directory with schema base_dir resolution", async () => {
  const { testDir, workingDir, schemasDir } = await createTestEnvironment();
  const schemaFile = join(schemasDir, "to", "issue", "f_issue.json");

  try {
    await createTestFile(schemaFile);

    const config = {
      app_schema: { base_dir: "schemas" }, // Relative to working_dir
      working_dir: workingDir,
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
      options: { useSchema: true },
    };

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        assertEquals(pathResult.data.value, schemaFile);
        assertEquals(pathResult.data.metadata.baseDir, schemasDir);
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("3_core - Working directory fallback to Deno.cwd() when not specified", async () => {
  const originalCwd = Deno.cwd();
  const { testDir, workingDir, promptsDir } = await createTestEnvironment();
  const promptFile = join(promptsDir, "to", "issue", "f_issue.md");

  try {
    await createTestFile(promptFile);

    // Change working directory to test directory
    Deno.chdir(workingDir);

    // Configuration without explicit working_dir
    const config = {
      app_prompt: { base_dir: "prompts" }, // Relative path
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
      options: {},
    };

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        // Normalize paths for comparison (handles symlinks on macOS)
        const actualPath = await Deno.realPath(pathResult.data.value);
        const expectedPath = await Deno.realPath(promptFile);
        assertEquals(actualPath, expectedPath);
      }
    }
  } finally {
    Deno.chdir(originalCwd);
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("3_core - Working directory with both prompt and schema directories", async () => {
  const { testDir, workingDir, promptsDir, schemasDir } = await createTestEnvironment();
  const promptFile = join(promptsDir, "summary", "task", "f_task.md");
  const schemaFile = join(schemasDir, "summary", "task", "f_task.json");

  try {
    await createTestFile(promptFile);
    await createTestFile(schemaFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
      working_dir: workingDir,
    };

    // Test prompt resolution
    const promptParams: TwoParams_Result = {
      type: "two",
      params: ["summary", "task"],
      directiveType: "summary",
      layerType: "task",
      options: {},
    };

    const promptResolverResult = PromptTemplatePathResolverTotality.create(config, promptParams);
    assertExists(promptResolverResult.ok);
    assertEquals(promptResolverResult.ok, true);

    if (promptResolverResult.ok) {
      const promptPathResult = promptResolverResult.data.getPath();
      assertExists(promptPathResult.ok);
      assertEquals(promptPathResult.ok, true);

      if (promptPathResult.ok) {
        assertEquals(promptPathResult.data.value, promptFile);
      }
    }

    // Test schema resolution
    const schemaParams: TwoParams_Result = {
      type: "two",
      params: ["summary", "task"],
      directiveType: "summary",
      layerType: "task",
      options: { useSchema: true },
    };

    const schemaResolverResult = PromptTemplatePathResolverTotality.create(config, schemaParams);
    assertExists(schemaResolverResult.ok);
    assertEquals(schemaResolverResult.ok, true);

    if (schemaResolverResult.ok) {
      const schemaPathResult = schemaResolverResult.data.getPath();
      assertExists(schemaPathResult.ok);
      assertEquals(schemaPathResult.ok, true);

      if (schemaPathResult.ok) {
        assertEquals(schemaPathResult.data.value, schemaFile);
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("3_core - Working directory with adaptation and fallback", async () => {
  const { testDir, workingDir, promptsDir } = await createTestEnvironment();
  const fallbackFile = join(promptsDir, "to", "project", "f_project.md");
  const adaptationFile = join(promptsDir, "to", "project", "f_project_custom.md");

  try {
    // Create only the fallback file (not the adaptation file)
    await createTestFile(fallbackFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: workingDir,
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      directiveType: "to",
      layerType: "project",
      options: { adaptation: "custom" },
    };

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        // Should fall back to base template
        assertEquals(pathResult.data.value, fallbackFile);
        assertEquals(pathResult.data.status, "Fallback");
        assertEquals(pathResult.data.metadata.adaptation, "custom");

        // Should show both attempted paths
        assertEquals(pathResult.data.metadata.attemptedPaths.length, 2);
        assertEquals(pathResult.data.metadata.attemptedPaths[0], adaptationFile);
        assertEquals(pathResult.data.metadata.attemptedPaths[1], fallbackFile);
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("3_core - Working directory with fromLayerType option", async () => {
  const { testDir, workingDir, promptsDir } = await createTestEnvironment();
  const promptFile = join(promptsDir, "defect", "issue", "f_task.md"); // Note: using f_task.md for fromLayerType

  try {
    await createTestFile(promptFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: workingDir,
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["defect", "issue"],
      directiveType: "defect",
      layerType: "issue",
      options: { fromLayerType: "task" }, // Override layerType for file lookup
    };

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        assertEquals(pathResult.data.value, promptFile);
        assertEquals(pathResult.data.metadata.fromLayerType, "task");
        assertEquals(pathResult.data.metadata.layerType, "issue"); // Original layerType preserved
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

// =============================================================================
// Error cases: Invalid working directory configurations
// =============================================================================

Deno.test("3_core - Error: Non-existent working directory", () => {
  const config = {
    app_prompt: { base_dir: "prompts" },
    working_dir: "/completely/non/existent/working/dir",
  };

  const cliParams: TwoParams_Result = {
    type: "two",
    params: ["to", "issue"],
    directiveType: "to",
    layerType: "issue",
    options: {},
  };

  const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
  assertExists(resolverResult.ok);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, false);

    if (!pathResult.ok) {
      assertEquals(pathResult.error.kind, "BaseDirectoryNotFound");

      const errorMessage = formatPathResolutionError(pathResult.error);
      assertEquals(errorMessage.includes("Base Directory Not Found"), true);
    }
  }
});

Deno.test("3_core - Error: Working directory results in non-existent base directory", async () => {
  const { testDir, workingDir } = await createTestEnvironment();

  try {
    // Note: Don't create the prompts directory
    const config = {
      app_prompt: { base_dir: "prompts" }, // This will resolve to workingDir/prompts
      working_dir: workingDir,
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
      options: {},
    };

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, false);

      if (!pathResult.ok) {
        assertEquals(pathResult.error.kind, "TemplateNotFound");
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("3_core - Error: Template not found with working directory", async () => {
  const { testDir, workingDir, promptsDir } = await createTestEnvironment();

  try {
    // Create the prompts directory but not the specific template file
    await Deno.mkdir(join(promptsDir, "to", "issue"), { recursive: true });

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: workingDir,
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
      options: {},
    };

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, false);

      if (!pathResult.ok) {
        assertEquals(pathResult.error.kind, "TemplateNotFound");
        if (pathResult.error.kind === "TemplateNotFound") {
          assertExists(pathResult.error.attempted);
          assertEquals(pathResult.error.attempted.length > 0, true);

          // Should attempt to find file in working directory resolved path
          const expectedPath = join(promptsDir, "to", "issue", "f_issue.md");
          assertEquals(pathResult.error.attempted[0], expectedPath);
        }
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

// =============================================================================
// Boundary cases: Edge conditions in path resolution
// =============================================================================

Deno.test("3_core - Boundary: Working directory with special characters", async () => {
  const { testDir } = await createTestEnvironment();
  const specialWorkingDir = join(testDir, "workspace with spaces & special-chars_123");
  const specialPromptsDir = join(specialWorkingDir, "prompts");
  const promptFile = join(specialPromptsDir, "to", "issue", "f_issue.md");

  try {
    await createTestFile(promptFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: specialWorkingDir,
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
      options: {},
    };

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        assertEquals(pathResult.data.value, promptFile);
        assertEquals(pathResult.data.metadata.baseDir, specialPromptsDir);
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("3_core - Boundary: Deep nested working directory structure", async () => {
  const { testDir } = await createTestEnvironment();
  const deepWorkingDir = join(testDir, "level1", "level2", "level3", "workspace");
  const deepPromptsDir = join(deepWorkingDir, "prompts");
  const promptFile = join(deepPromptsDir, "summary", "project", "f_project.md");

  try {
    await createTestFile(promptFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: deepWorkingDir,
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["summary", "project"],
      directiveType: "summary",
      layerType: "project",
      options: {},
    };

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        assertEquals(pathResult.data.value, promptFile);
        assertEquals(pathResult.data.metadata.baseDir, deepPromptsDir);
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("3_core - Boundary: Working directory integration with WorkingDirectoryPath value object", async () => {
  const { testDir, workingDir, promptsDir } = await createTestEnvironment();
  const promptFile = join(promptsDir, "to", "task", "f_task.md");

  try {
    await createTestFile(promptFile);

    // Create WorkingDirectoryPath value object and use it in configuration
    const workingDirPathResult = WorkingDirectoryPath.create(workingDir);
    assertExists(workingDirPathResult.ok);
    assertEquals(workingDirPathResult.ok, true);

    if (workingDirPathResult.ok) {
      const workingDirPath = workingDirPathResult.data;

      // Test that the working directory path is correctly resolved
      assertEquals(workingDirPath.getAbsolutePath(), workingDir);
      assertEquals(workingDirPath.directoryExists(), true);

      // Use in path resolver configuration
      const config = {
        app_prompt: { base_dir: "prompts" },
        working_dir: workingDirPath.getAbsolutePath(),
      };

      const cliParams: TwoParams_Result = {
        type: "two",
        params: ["to", "task"],
        directiveType: "to",
        layerType: "task",
        options: {},
      };

      const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
      assertExists(resolverResult.ok);
      assertEquals(resolverResult.ok, true);

      if (resolverResult.ok) {
        const pathResult = resolverResult.data.getPath();
        assertExists(pathResult.ok);
        assertEquals(pathResult.ok, true);

        if (pathResult.ok) {
          assertEquals(pathResult.data.value, promptFile);

          // Verify that the base directory matches what we expect from WorkingDirectoryPath
          const expectedBaseDir = workingDirPath.join("prompts");
          if (expectedBaseDir.ok) {
            assertEquals(pathResult.data.metadata.baseDir, expectedBaseDir.data.getAbsolutePath());
          }
        }
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});
