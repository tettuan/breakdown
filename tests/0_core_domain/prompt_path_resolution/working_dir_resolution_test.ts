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
} from "../../../lib/factory/prompt_template_path_resolver.ts";
import { WorkingDirectoryPath } from "../../../lib/domain/core/value_objects/working_directory_path.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";
import { TestLoggerFactory } from "$test/helpers/test_logger_factory.ts";

// Test fixtures and helpers
const TEST_BASE_DIR = "/tmp/breakdown-working-dir-integration-tests";
const logger = TestLoggerFactory.create("core", "working-dir-resolution");

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

  logger.debug("Test environment created", {
    stage: "setup",
    testDir,
    workingDir,
    promptsDir,
    schemasDir,
  });

  return { testDir, workingDir, promptsDir, schemasDir };
}

async function createTestFile(path: string, content: string = "test content"): Promise<void> {
  const dir = path.substring(0, path.lastIndexOf("/"));
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(path, content);

  logger.debug("Test file created", {
    stage: "file_create",
    path,
    contentLength: content.length,
  });
}

async function cleanupTestEnvironment(testDir: string): Promise<void> {
  try {
    await Deno.remove(testDir, { recursive: true });
    logger.debug("Test environment cleaned", { stage: "cleanup", testDir });
  } catch {
    // Ignore if already removed
    logger.debug("Test environment cleanup skipped", {
      stage: "cleanup",
      testDir,
      reason: "already_removed",
    });
  }
}

// =============================================================================
// 3_core: Domain integration functionality tests
// =============================================================================

Deno.test("3_core - Working directory with relative prompt base_dir", async () => {
  const { testDir, workingDir, promptsDir } = await createTestEnvironment();
  const promptFile = join(promptsDir, "to", "issue", "f_default.md");

  try {
    await createTestFile(promptFile);

    logger.debug("Test start: relative prompt base_dir", {
      stage: "test_start",
      testDir,
      workingDir,
      promptsDir,
      promptFile,
    });

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

    logger.debug("Resolver configuration prepared", { stage: "config", config, cliParams });

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        logger.debug("Relative prompt base_dir resolution", {
          stage: "path_result",
          resolvedPath: pathResult.data.value,
          baseDir: pathResult.data.metadata.baseDir,
        });
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
  const schemaFile = join(schemasDir, "to", "issue", "f_default.json");

  try {
    await createTestFile(schemaFile);

    logger.debug("Test start: schema base_dir resolution", {
      stage: "test_start",
      testDir,
      workingDir,
      schemasDir,
      schemaFile,
    });

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

    logger.debug("Schema resolver configuration", { stage: "config", config, cliParams });

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        logger.debug("Schema path resolution", {
          stage: "path_result",
          resolvedPath: pathResult.data.value,
          baseDir: pathResult.data.metadata.baseDir,
        });
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
  const promptFile = join(promptsDir, "to", "issue", "f_default.md");

  try {
    await createTestFile(promptFile);

    logger.debug("Test start: fallback to cwd", {
      stage: "test_start",
      testDir,
      workingDir,
      promptsDir,
      promptFile,
      originalCwd,
    });

    // Change working directory to test directory
    Deno.chdir(workingDir);
    logger.debug("Changed current directory for fallback scenario", {
      stage: "cwd_change",
      currentCwd: Deno.cwd(),
    });

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

    logger.debug("Fallback resolver configuration", { stage: "config", config, cliParams });

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
        logger.debug("Fallback resolution result", {
          stage: "path_result",
          actualPath,
          expectedPath,
        });
        assertEquals(actualPath, expectedPath);
      }
    }
  } finally {
    Deno.chdir(originalCwd);
    logger.debug("Restored working directory after fallback test", {
      stage: "cwd_restore",
      restoredCwd: Deno.cwd(),
    });
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("3_core - Working directory with both prompt and schema directories", async () => {
  const { testDir, workingDir, promptsDir, schemasDir } = await createTestEnvironment();
  const promptFile = join(promptsDir, "summary", "task", "f_default.md");
  const schemaFile = join(schemasDir, "summary", "task", "f_default.json");

  try {
    await createTestFile(promptFile);
    await createTestFile(schemaFile);

    logger.debug("Test start: prompt + schema directories", {
      stage: "test_start",
      workingDir,
      promptFile,
      schemaFile,
    });

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

    logger.debug("Prompt path resolver configuration", {
      stage: "config",
      config,
      promptParams,
    });

    const promptResolverResult = PromptTemplatePathResolverTotality.create(config, promptParams);
    assertExists(promptResolverResult.ok);
    assertEquals(promptResolverResult.ok, true);

    if (promptResolverResult.ok) {
      const promptPathResult = promptResolverResult.data.getPath();
      assertExists(promptPathResult.ok);
      assertEquals(promptPathResult.ok, true);

      if (promptPathResult.ok) {
        logger.debug("Prompt path resolution result", {
          stage: "prompt_path_result",
          resolvedPath: promptPathResult.data.value,
          baseDir: promptPathResult.data.metadata.baseDir,
        });
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
        logger.debug("Schema path resolution result", {
          stage: "schema_path_result",
          resolvedPath: schemaPathResult.data.value,
          baseDir: schemaPathResult.data.metadata.baseDir,
        });
        assertEquals(schemaPathResult.data.value, schemaFile);
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("3_core - Working directory with adaptation and fallback", async () => {
  const { testDir, workingDir, promptsDir } = await createTestEnvironment();
  const fallbackFile = join(promptsDir, "to", "project", "f_default.md");
  const adaptationFile = join(promptsDir, "to", "project", "f_default_custom.md"); // Changed to match default fromLayerType

  try {
    // Create only the fallback file (not the adaptation file)
    await createTestFile(fallbackFile);

    logger.debug("Test start: adaptation fallback", {
      stage: "test_start",
      workingDir,
      fallbackFile,
      adaptationFile,
    });

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

    logger.debug("Adaptation fallback configuration", {
      stage: "config",
      config,
      cliParams,
    });

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        // Should fall back to base template
        logger.debug("Adaptation fallback result", {
          stage: "path_result",
          resolvedPath: pathResult.data.value,
          status: pathResult.data.status,
          metadata: pathResult.data.metadata,
        });
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

Deno.test("3_core - Working directory with fromFile option", async () => {
  const { testDir, workingDir, promptsDir } = await createTestEnvironment();
  const promptFile = join(promptsDir, "defect", "issue", "f_task.md"); // Changed to match inference from task_data.md

  try {
    await createTestFile(promptFile);

    logger.debug("Test start: fromFile option", {
      stage: "test_start",
      workingDir,
      promptFile,
    });

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: workingDir,
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["defect", "issue"],
      directiveType: "defect",
      layerType: "issue",
      options: { fromFile: "task_data.md" }, // fromFile option (should infer "task" from filename)
    };

    logger.debug("fromFile resolver configuration", {
      stage: "config",
      config,
      cliParams,
    });

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        logger.debug("fromFile resolution result", {
          stage: "path_result",
          resolvedPath: pathResult.data.value,
          metadata: pathResult.data.metadata,
        });
        assertEquals(pathResult.data.value, promptFile);
        assertEquals(pathResult.data.metadata.fromLayerType, "task"); // Inferred from task_data.md
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

  logger.debug("Test start: non-existent working directory", {
    stage: "test_start",
    config,
    cliParams,
  });

  const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
  assertExists(resolverResult.ok);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, false);

    if (!pathResult.ok) {
      assertEquals(pathResult.error.kind, "BaseDirectoryNotFound");

      const errorMessage = formatPathResolutionError(pathResult.error);
      logger.debug("Expected error captured", {
        stage: "error",
        errorKind: pathResult.error.kind,
        message: errorMessage,
      });
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

    logger.debug("Test start: base directory missing", {
      stage: "test_start",
      workingDir,
      config,
      cliParams,
    });

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, false);

      if (!pathResult.ok) {
        assertEquals(pathResult.error.kind, "TemplateNotFound");
        logger.debug("Expected template error", {
          stage: "error",
          errorKind: pathResult.error.kind,
          attempted: pathResult.error.kind === "TemplateNotFound"
            ? pathResult.error.attempted
            : undefined,
        });
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

    logger.debug("Test start: template missing", {
      stage: "test_start",
      workingDir,
      promptsDir,
      config,
      cliParams,
    });

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
          const expectedPath = join(promptsDir, "to", "issue", "f_default.md");
          logger.debug("Template missing details", {
            stage: "error",
            attempted: pathResult.error.attempted,
            expectedPath,
          });
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
  const promptFile = join(specialPromptsDir, "to", "issue", "f_default.md");

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

    logger.debug("Test start: special characters in working dir", {
      stage: "test_start",
      specialWorkingDir,
      promptFile,
    });

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        logger.debug("Special characters resolution", {
          stage: "path_result",
          resolvedPath: pathResult.data.value,
          baseDir: pathResult.data.metadata.baseDir,
        });
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
  const promptFile = join(deepPromptsDir, "summary", "project", "f_default.md");

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

    logger.debug("Test start: deep working directory", {
      stage: "test_start",
      deepWorkingDir,
      promptFile,
    });

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        logger.debug("Deep directory resolution", {
          stage: "path_result",
          resolvedPath: pathResult.data.value,
          baseDir: pathResult.data.metadata.baseDir,
        });
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
  const promptFile = join(promptsDir, "to", "task", "f_default.md");

  try {
    await createTestFile(promptFile);

    // Create WorkingDirectoryPath value object and use it in configuration
    const workingDirPathResult = WorkingDirectoryPath.create(workingDir);
    assertExists(workingDirPathResult.ok);
    assertEquals(workingDirPathResult.ok, true);

    if (workingDirPathResult.ok) {
      const workingDirPath = workingDirPathResult.data;

      logger.debug("WorkingDirectoryPath created", {
        stage: "value_object",
        workingDir: workingDirPath.getAbsolutePath(),
      });

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
          logger.debug("WorkingDirectoryPath path resolution", {
            stage: "path_result",
            resolvedPath: pathResult.data.value,
            baseDir: pathResult.data.metadata.baseDir,
          });
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
