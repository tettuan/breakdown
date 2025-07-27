/**
 * @fileoverview Enhanced path resolution tests for PromptTemplatePathResolverTotality
 *
 * Tests focus on path resolution logic with Totality principle:
 * - Base directory resolution with different configurations
 * - Working directory path resolution
 * - Schema vs prompt path selection logic
 * - Fallback path resolution logic
 * - FromLayerType resolution logic
 * - File name inference patterns
 */

import { assertEquals, assertExists } from "../deps.ts";
import { join } from "jsr:@std/path@^1.0.9";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { PromptTemplatePathResolverTotality } from "./prompt_template_path_resolver_totality.ts";
import { DEFAULT_FROM_LAYER_TYPE } from "../config/constants.ts";
import type { TwoParams_Result } from "../deps.ts";

const pathResolutionLogger = new BreakdownLogger("path-resolution-test");

// Helper function to create test CLI parameters
function createTestCliParams(overrides: Partial<TwoParams_Result> = {}): TwoParams_Result {
  const baseParams: TwoParams_Result = {
    type: "two",
    params: ["to", "issue"],
    directiveType: "to",
    layerType: "issue",
    options: {
      useSchema: false,
      adaptation: "",
      fromLayerType: "",
      fromFile: "",
    },
  };

  return { ...baseParams, ...overrides };
}

// Helper function to create test environment
async function createPathResolutionTestEnvironment(baseName: string): Promise<{
  testDir: string;
  promptsDir: string;
  schemasDir: string;
  workingDir: string;
}> {
  const testDir = join(Deno.cwd(), "tmp", `path-resolution-test-${baseName}`);
  const promptsDir = join(testDir, "prompts");
  const schemasDir = join(testDir, "schemas");
  const workingDir = join(testDir, "workspace");

  await Deno.mkdir(promptsDir, { recursive: true });
  await Deno.mkdir(schemasDir, { recursive: true });
  await Deno.mkdir(workingDir, { recursive: true });

  return { testDir, promptsDir, schemasDir, workingDir };
}

// Helper to create test files
async function createTestFile(filePath: string, content = "# Test content"): Promise<void> {
  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(filePath, content);
}

// Cleanup helper
async function cleanupPathResolutionTestEnvironment(testDir: string): Promise<void> {
  try {
    await Deno.remove(testDir, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
}

Deno.test("Path Resolution - Base directory resolution with different configurations", async () => {
  const { testDir, promptsDir, schemasDir } = await createPathResolutionTestEnvironment("base-dir");

  try {
    pathResolutionLogger.debug("Testing base directory resolution", {
      testCase: "base_directory_resolution",
      testDir,
      promptsDir,
      schemasDir,
    });

    // Create test files
    const promptFile = join(promptsDir, "to", "issue", "f_task.md");
    const schemaFile = join(schemasDir, "to", "issue", "f_task.json");
    await createTestFile(promptFile);
    await createTestFile(schemaFile, JSON.stringify({ type: "object" }));

    // Test prompt base directory selection
    const promptConfig = {
      app_prompt: { base_dir: "prompts" },
      working_dir: testDir,
    };
    const promptParams = createTestCliParams({
      options: { fromLayerType: "task" },
    });

    const promptResolver = PromptTemplatePathResolverTotality.create(promptConfig, promptParams);
    assertEquals(promptResolver.ok, true);

    if (promptResolver.ok) {
      const pathResult = promptResolver.data.getPath();
      assertEquals(pathResult.ok, true);
      if (pathResult.ok) {
        assertEquals(pathResult.data.value, promptFile);
        assertEquals(pathResult.data.metadata.baseDir, promptsDir);
      }
    }

    // Test schema base directory selection
    const schemaConfig = {
      app_schema: { base_dir: "schemas" },
      working_dir: testDir,
    };
    const schemaParams = createTestCliParams({
      options: { useSchema: true, fromLayerType: "task" },
    });

    const schemaResolver = PromptTemplatePathResolverTotality.create(schemaConfig, schemaParams);
    assertEquals(schemaResolver.ok, true);

    if (schemaResolver.ok) {
      const pathResult = schemaResolver.data.getPath();
      assertEquals(pathResult.ok, true);
      if (pathResult.ok) {
        assertEquals(pathResult.data.value, schemaFile);
        assertEquals(pathResult.data.metadata.baseDir, schemasDir);
      }
    }
  } finally {
    await cleanupPathResolutionTestEnvironment(testDir);
  }
});

Deno.test("Path Resolution - Working directory path resolution", async () => {
  const { testDir, promptsDir } = await createPathResolutionTestEnvironment("working-dir");

  try {
    pathResolutionLogger.debug("Testing working directory path resolution", {
      testCase: "working_directory_resolution",
      testDir,
    });

    // Create test file
    const promptFile = join(promptsDir, "to", "issue", "f_task.md");
    await createTestFile(promptFile);

    // Test with explicit working directory
    const configWithWorkingDir = {
      app_prompt: { base_dir: "prompts" },
      working_dir: testDir,
    };
    const cliParams = createTestCliParams({
      options: { fromLayerType: "task" },
    });

    const resolverResult = PromptTemplatePathResolverTotality.create(
      configWithWorkingDir,
      cliParams,
    );
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);
      if (pathResult.ok) {
        assertEquals(pathResult.data.value, promptFile);
      }
    }

    // Test without explicit working directory (should use Deno.cwd())
    const originalCwd = Deno.cwd();
    try {
      Deno.chdir(testDir);

      const configWithoutWorkingDir = {
        app_prompt: { base_dir: "prompts" },
      };

      const resolverWithoutWorkingDir = PromptTemplatePathResolverTotality.create(
        configWithoutWorkingDir,
        cliParams,
      );
      assertEquals(resolverWithoutWorkingDir.ok, true);

      if (resolverWithoutWorkingDir.ok) {
        const pathResult = resolverWithoutWorkingDir.data.getPath();
        assertEquals(pathResult.ok, true);
        if (pathResult.ok) {
          // Normalize paths for cross-platform compatibility
          const actualPath = await Deno.realPath(pathResult.data.value);
          const expectedPath = await Deno.realPath(promptFile);
          assertEquals(actualPath, expectedPath);
        }
      }
    } finally {
      Deno.chdir(originalCwd);
    }
  } finally {
    await cleanupPathResolutionTestEnvironment(testDir);
  }
});

Deno.test("Path Resolution - Schema vs prompt path selection logic", async () => {
  const { testDir, promptsDir, schemasDir } = await createPathResolutionTestEnvironment(
    "schema-prompt",
  );

  try {
    pathResolutionLogger.debug("Testing schema vs prompt path selection", {
      testCase: "schema_prompt_selection",
    });

    // Create both prompt and schema files
    const promptFile = join(promptsDir, "to", "issue", "f_task.md");
    const schemaFile = join(schemasDir, "to", "issue", "f_task.json");
    await createTestFile(promptFile);
    await createTestFile(schemaFile, JSON.stringify({ type: "object" }));

    const config = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
      working_dir: testDir,
    };

    // Test prompt mode (useSchema: false)
    const promptParams = createTestCliParams({
      options: { useSchema: false, fromLayerType: "task" },
    });

    const promptResolver = PromptTemplatePathResolverTotality.create(config, promptParams);
    assertEquals(promptResolver.ok, true);

    if (promptResolver.ok) {
      const pathResult = promptResolver.data.getPath();
      assertEquals(pathResult.ok, true);
      if (pathResult.ok) {
        assertEquals(pathResult.data.value, promptFile);
        assertEquals(pathResult.data.value.endsWith(".md"), true);
      }
    }

    // Test schema mode (useSchema: true)
    const schemaParams = createTestCliParams({
      options: { useSchema: true, fromLayerType: "task" },
    });

    const schemaResolver = PromptTemplatePathResolverTotality.create(config, schemaParams);
    assertEquals(schemaResolver.ok, true);

    if (schemaResolver.ok) {
      const pathResult = schemaResolver.data.getPath();
      assertEquals(pathResult.ok, true);
      if (pathResult.ok) {
        assertEquals(pathResult.data.value, schemaFile);
        assertEquals(pathResult.data.value.endsWith(".json"), true);
      }
    }
  } finally {
    await cleanupPathResolutionTestEnvironment(testDir);
  }
});

Deno.test("Path Resolution - Fallback path resolution logic", async () => {
  const { testDir, promptsDir } = await createPathResolutionTestEnvironment("fallback");

  try {
    pathResolutionLogger.debug("Testing fallback path resolution", {
      testCase: "fallback_resolution",
    });

    // Create only the fallback file, not the adaptation file
    const fallbackFile = join(promptsDir, "to", "issue", "f_task.md");
    await createTestFile(fallbackFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: testDir,
    };

    // Test with adaptation (should fallback to base file)
    const adaptationParams = createTestCliParams({
      options: { adaptation: "custom", fromLayerType: "task" },
    });

    const resolverResult = PromptTemplatePathResolverTotality.create(config, adaptationParams);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);
      if (pathResult.ok) {
        assertEquals(pathResult.data.value, fallbackFile);
        assertEquals(pathResult.data.status, "Fallback");
        assertEquals(pathResult.data.metadata.adaptation, "custom");
        assertEquals(pathResult.data.metadata.attemptedPaths.length >= 2, true);
      }
    }

    // Test with both adaptation file and fallback file existing
    const adaptationFile = join(promptsDir, "to", "issue", "f_task_custom.md");
    await createTestFile(adaptationFile);

    const resolverWithBothFiles = PromptTemplatePathResolverTotality.create(
      config,
      adaptationParams,
    );
    assertEquals(resolverWithBothFiles.ok, true);

    if (resolverWithBothFiles.ok) {
      const pathResult = resolverWithBothFiles.data.getPath();
      assertEquals(pathResult.ok, true);
      if (pathResult.ok) {
        assertEquals(pathResult.data.value, adaptationFile);
        assertEquals(pathResult.data.status, "Found");
        assertEquals(pathResult.data.metadata.adaptation, "custom");
      }
    }
  } finally {
    await cleanupPathResolutionTestEnvironment(testDir);
  }
});

Deno.test("Path Resolution - FromLayerType resolution logic", () => {
  const config = {
    app_prompt: { base_dir: "prompts" },
    working_dir: "./workspace",
  };

  pathResolutionLogger.debug("Testing FromLayerType resolution logic", {
    testCase: "from_layer_type_resolution",
  });

  // Test explicit fromLayerType option
  const explicitParams = createTestCliParams({
    options: { fromLayerType: "project" },
  });

  const explicitResolver = PromptTemplatePathResolverTotality.create(config, explicitParams);
  assertEquals(explicitResolver.ok, true);

  if (explicitResolver.ok) {
    const fromLayerTypeResult = explicitResolver.data.resolveFromLayerTypeSafe();
    assertEquals(fromLayerTypeResult.ok, true);
    if (fromLayerTypeResult.ok) {
      assertEquals(fromLayerTypeResult.data, "project");
    }

    // Test file name generation with explicit fromLayerType
    const fileName = explicitResolver.data.buildFileName();
    assertEquals(fileName, "f_project.md");
  }

  // Test inference from fromFile option
  const inferenceParams = createTestCliParams({
    options: { fromFile: "task_specification.md" },
  });

  const inferenceResolver = PromptTemplatePathResolverTotality.create(config, inferenceParams);
  assertEquals(inferenceResolver.ok, true);

  if (inferenceResolver.ok) {
    const fromLayerTypeResult = inferenceResolver.data.resolveFromLayerTypeSafe();
    assertEquals(fromLayerTypeResult.ok, true);
    if (fromLayerTypeResult.ok) {
      assertEquals(fromLayerTypeResult.data, "task");
    }

    // Test file name generation with inferred fromLayerType
    const fileName = inferenceResolver.data.buildFileName();
    assertEquals(fileName, "f_task.md");
  }

  // Test default fallback when no options specified
  const defaultParams = createTestCliParams({
    options: {},
  });

  const defaultResolver = PromptTemplatePathResolverTotality.create(config, defaultParams);
  assertEquals(defaultResolver.ok, true);

  if (defaultResolver.ok) {
    const fromLayerTypeResult = defaultResolver.data.resolveFromLayerTypeSafe();
    assertEquals(fromLayerTypeResult.ok, true);
    if (fromLayerTypeResult.ok) {
      assertEquals(fromLayerTypeResult.data, DEFAULT_FROM_LAYER_TYPE);
    }

    // Test file name generation with default fromLayerType
    const fileName = defaultResolver.data.buildFileName();
    assertEquals(fileName, `f_${DEFAULT_FROM_LAYER_TYPE}.md`);
  }
});

Deno.test("Path Resolution - File name inference patterns", () => {
  const config = {
    app_prompt: { base_dir: "prompts" },
    working_dir: "./workspace",
  };

  pathResolutionLogger.debug("Testing file name inference patterns", {
    testCase: "file_name_inference",
  });

  // Test valid inference patterns
  const validPatterns = [
    { fileName: "task_data.md", expected: "task" },
    { fileName: "project_spec.txt", expected: "project" },
    { fileName: "issue_requirements.json", expected: "issue" },
    { fileName: "component_design.md", expected: "component" },
  ];

  for (const pattern of validPatterns) {
    const params = createTestCliParams({
      options: { fromFile: pattern.fileName },
    });

    const resolver = PromptTemplatePathResolverTotality.create(config, params);
    assertEquals(resolver.ok, true);

    if (resolver.ok) {
      const fromLayerTypeResult = resolver.data.resolveFromLayerTypeSafe();
      assertEquals(fromLayerTypeResult.ok, true);
      if (fromLayerTypeResult.ok) {
        assertEquals(fromLayerTypeResult.data, pattern.expected);
      }
    }
  }

  // Test invalid inference patterns (should fallback to default)
  const invalidPatterns = [
    "data.md", // No underscore
    "spec", // No extension
    "readme.txt", // No underscore separator
  ];

  for (const fileName of invalidPatterns) {
    const params = createTestCliParams({
      options: { fromFile: fileName },
    });

    const resolver = PromptTemplatePathResolverTotality.create(config, params);
    assertEquals(resolver.ok, true);

    if (resolver.ok) {
      const fromLayerTypeResult = resolver.data.resolveFromLayerTypeSafe();
      assertEquals(fromLayerTypeResult.ok, true);
      if (fromLayerTypeResult.ok) {
        // Should fallback to DEFAULT_FROM_LAYER_TYPE when inference fails
        assertEquals(fromLayerTypeResult.data, DEFAULT_FROM_LAYER_TYPE);
      }
    }
  }
});

Deno.test("Path Resolution - Priority handling for fromLayerType and fromFile", () => {
  const config = {
    app_prompt: { base_dir: "prompts" },
    working_dir: "./workspace",
  };

  pathResolutionLogger.debug("Testing priority handling", {
    testCase: "priority_handling",
  });

  // Test that explicit fromLayerType takes priority over fromFile inference
  const priorityParams = createTestCliParams({
    options: {
      fromLayerType: "component", // Explicit value should take priority
      fromFile: "task_specification.md", // Would infer "task" but should be ignored
    },
  });

  const resolver = PromptTemplatePathResolverTotality.create(config, priorityParams);
  assertEquals(resolver.ok, true);

  if (resolver.ok) {
    const fromLayerTypeResult = resolver.data.resolveFromLayerTypeSafe();
    assertEquals(fromLayerTypeResult.ok, true);
    if (fromLayerTypeResult.ok) {
      assertEquals(fromLayerTypeResult.data, "component"); // Should use explicit value
    }

    const fileName = resolver.data.buildFileName();
    assertEquals(fileName, "f_component.md"); // Should use explicit value
  }

  // Test that input option is treated as fromLayerType
  const inputParams = createTestCliParams({
    options: {
      input: "service", // Should be treated as fromLayerType
      fromFile: "task_notes.md", // Should be ignored when input is present
    },
  });

  const inputResolver = PromptTemplatePathResolverTotality.create(config, inputParams);
  assertEquals(inputResolver.ok, true);

  if (inputResolver.ok) {
    const fromLayerTypeResult = inputResolver.data.resolveFromLayerTypeSafe();
    assertEquals(fromLayerTypeResult.ok, true);
    if (fromLayerTypeResult.ok) {
      assertEquals(fromLayerTypeResult.data, "service");
    }
  }
});

Deno.test("Path Resolution - Error scenarios", async () => {
  const { testDir } = await createPathResolutionTestEnvironment("error-scenarios");

  try {
    pathResolutionLogger.debug("Testing error scenarios", {
      testCase: "error_scenarios",
    });

    // Test base directory not found
    const nonExistentConfig = {
      app_prompt: { base_dir: "non-existent-prompts" },
      working_dir: testDir,
    };
    const cliParams = createTestCliParams();

    const resolver = PromptTemplatePathResolverTotality.create(nonExistentConfig, cliParams);
    assertEquals(resolver.ok, true);

    if (resolver.ok) {
      const pathResult = resolver.data.getPath();
      assertEquals(pathResult.ok, false);
      if (!pathResult.ok) {
        assertEquals(pathResult.error.kind, "BaseDirectoryNotFound");
      }
    }

    // Test template not found (directory exists but file doesn't)
    const emptyDirConfig = {
      app_prompt: { base_dir: "prompts" },
      working_dir: testDir,
    };

    // Create empty prompts directory
    await Deno.mkdir(join(testDir, "prompts"), { recursive: true });

    const emptyResolver = PromptTemplatePathResolverTotality.create(emptyDirConfig, cliParams);
    assertEquals(emptyResolver.ok, true);

    if (emptyResolver.ok) {
      const pathResult = emptyResolver.data.getPath();
      assertEquals(pathResult.ok, false);
      if (!pathResult.ok) {
        assertEquals(pathResult.error.kind, "TemplateNotFound");
        if (pathResult.error.kind === "TemplateNotFound") {
          assertExists(pathResult.error.attempted);
          assertEquals(pathResult.error.attempted.length > 0, true);
        }
      }
    }
  } finally {
    await cleanupPathResolutionTestEnvironment(testDir);
  }
});
