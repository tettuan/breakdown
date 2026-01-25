/**
 * @fileoverview Tests for PromptTemplatePathResolverTotality
 *
 * Tests cover:
 * - Totality principle implementation (Result types, no partial functions)
 * - Working directory path resolution
 * - Discriminated union configurations
 * - Exhaustive error handling
 * - Schema vs prompt path resolution
 * - Adaptation and fallback logic
 */

import { assertEquals, assertExists } from "../deps.ts";
import { join } from "jsr:@std/path@^1.0.9";
import {
  computePromptDirectory,
  formatPathResolutionError,
  PromptTemplatePathResolverTotality,
} from "./prompt_template_path_resolver_totality.ts";
import { DEFAULT_FROM_LAYER_TYPE, DEFAULT_SCHEMA_BASE_DIR } from "../config/constants.ts";
import type { TwoParams_Result } from "../deps.ts";

// Helper to create test directories
async function createTestDirectory(path: string): Promise<void> {
  await Deno.mkdir(path, { recursive: true });
}

// Helper to create test files
async function createTestFile(path: string): Promise<void> {
  const dir = path.substring(0, path.lastIndexOf("/"));
  await createTestDirectory(dir);
  await Deno.writeTextFile(path, "test content");
}

// Cleanup helper
async function cleanupTestDirectory(path: string): Promise<void> {
  try {
    await Deno.remove(path, { recursive: true });
  } catch {
    // Ignore if already removed
  }
}

Deno.test("PromptTemplatePathResolverTotality - Basic creation with valid parameters", () => {
  const config = {
    working_dir: "/tmp/test",
    app_prompt: { base_dir: "prompts" },
  };
  const cliParams: TwoParams_Result = {
    type: "two",
    params: ["to", "issue"],
    directiveType: "to",
    layerType: "issue",
    options: {},
  };

  const result = PromptTemplatePathResolverTotality.create(config, cliParams);
  assertExists(result.ok);
  assertEquals(result.ok, true);
});

Deno.test("PromptTemplatePathResolverTotality - Handles various config objects correctly", () => {
  const cliParams: TwoParams_Result = {
    type: "two",
    params: ["to", "issue"],
    directiveType: "to",
    layerType: "issue",
    options: {},
  };

  // Test that empty config is valid (falls back to NoConfig)
  const result1 = PromptTemplatePathResolverTotality.create({}, cliParams);
  assertEquals(result1.ok, true);

  // Test that any object config is valid
  const result2 = PromptTemplatePathResolverTotality.create({ invalid: true }, cliParams);
  assertEquals(result2.ok, true);
});

Deno.test("PromptTemplatePathResolverTotality - Creation fails with missing parameters", () => {
  const config = {
    app_prompt: { base_dir: "test/prompts" },
  };

  // Missing directiveType
  const params1: TwoParams_Result = {
    type: "two",
    params: ["", "issue"],
    directiveType: "",
    layerType: "issue",
    options: {},
  };
  const result1 = PromptTemplatePathResolverTotality.create(config, params1);
  assertEquals(result1.ok, false);
  if (!result1.ok) {
    assertEquals(result1.error.kind, "InvalidParameterCombination");
  }

  // Missing layerType
  const params2: TwoParams_Result = {
    type: "two",
    params: ["to", ""],
    directiveType: "to",
    layerType: "",
    options: {},
  };
  const result2 = PromptTemplatePathResolverTotality.create(config, params2);
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "InvalidParameterCombination");
  }
});

Deno.test("PromptTemplatePathResolverTotality - Working directory resolution with relative paths", async () => {
  const testBaseDir = await Deno.makeTempDir();
  const workingDir = join(testBaseDir, "workspace");
  const promptsDir = join(workingDir, "prompts");
  const promptFile = join(promptsDir, "to", "issue", "f_default.md"); // Changed to match default fromLayerType

  try {
    await createTestFile(promptFile);

    // Test with relative base_dir and working_dir
    const config = {
      app_prompt: { base_dir: "prompts" }, // Relative path
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
    await cleanupTestDirectory(testBaseDir);
  }
});

Deno.test("PromptTemplatePathResolverTotality - Working directory fallback to Deno.cwd()", async () => {
  const originalCwd = Deno.cwd();
  const testBaseDir = await Deno.makeTempDir();

  try {
    // Change working directory
    Deno.chdir(testBaseDir);

    const promptsDir = join(testBaseDir, "prompts");
    const promptFile = join(promptsDir, "to", "issue", "f_default.md"); // Changed to match default fromLayerType
    await createTestFile(promptFile);

    // Test with relative base_dir and no working_dir specified
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
        // Normalize paths for macOS symlink differences (/var vs /private/var)
        const actualPath = await Deno.realPath(pathResult.data.value);
        const expectedPath = await Deno.realPath(promptFile);
        assertEquals(actualPath, expectedPath);

        const actualBaseDir = await Deno.realPath(pathResult.data.metadata.baseDir);
        const expectedBaseDir = await Deno.realPath(promptsDir);
        assertEquals(actualBaseDir, expectedBaseDir);
      }
    }
  } finally {
    Deno.chdir(originalCwd);
    await cleanupTestDirectory(testBaseDir);
  }
});

Deno.test("PromptTemplatePathResolverTotality - Schema path resolution with working_dir", async () => {
  const testBaseDir = await Deno.makeTempDir();
  const workingDir = join(testBaseDir, "workspace");
  const schemaDir = join(workingDir, DEFAULT_SCHEMA_BASE_DIR);
  const schemaFile = join(schemaDir, "to", "issue", "f_default.json"); // Changed to match default fromLayerType

  try {
    await createTestFile(schemaFile);

    const config = {
      app_schema: { base_dir: DEFAULT_SCHEMA_BASE_DIR }, // Relative path
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
        assertEquals(pathResult.data.metadata.baseDir, schemaDir);
      }
    }
  } finally {
    await cleanupTestDirectory(testBaseDir);
  }
});

Deno.test("PromptTemplatePathResolverTotality - Adaptation with fallback and working_dir", async () => {
  const testBaseDir = await Deno.makeTempDir();
  const workingDir = join(testBaseDir, "workspace");
  const promptsDir = join(workingDir, "prompts");
  const fallbackFile = join(promptsDir, "to", "issue", "f_default.md"); // Changed to match default fromLayerType

  try {
    // Create only the fallback file, not the adaptation file
    await createTestFile(fallbackFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: workingDir,
    };
    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
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
        assertEquals(pathResult.data.value, fallbackFile);
        assertEquals(pathResult.data.status, "Fallback");
        assertEquals(pathResult.data.metadata.adaptation, "custom");
        assertEquals(pathResult.data.metadata.attemptedPaths.length, 2);
      }
    }
  } finally {
    await cleanupTestDirectory(testBaseDir);
  }
});

Deno.test("PromptTemplatePathResolverTotality - Base directory not found error", () => {
  const config = {
    app_prompt: { base_dir: "non/existent/path" },
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
    }
  }
});

Deno.test("PromptTemplatePathResolverTotality - Template not found error", async () => {
  const testBaseDir = await Deno.makeTempDir();

  try {
    // Create the base directory but not the template files
    await Deno.mkdir(join(testBaseDir, "prompts"), { recursive: true });

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: testBaseDir,
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
        }
      }
    }
  } finally {
    await cleanupTestDirectory(testBaseDir);
  }
});

Deno.test("PromptTemplatePathResolverTotality - TwoParams_Result structure support", async () => {
  const testBaseDir = await Deno.makeTempDir();
  const promptFile = join(testBaseDir, "prompts", "to", "issue", "f_default.md"); // Changed to match default fromLayerType

  try {
    await createTestFile(promptFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: testBaseDir,
    };
    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      layerType: "issue",
      directiveType: "to",
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
      }
    }
  } finally {
    await cleanupTestDirectory(testBaseDir);
  }
});

Deno.test("PromptTemplatePathResolverTotality - Config normalization to discriminated unions", () => {
  // Test WithPromptConfig
  const config1 = {
    app_prompt: { base_dir: "prompts" },
    app_schema: { base_dir: "schemas" },
  };
  const cliParams: TwoParams_Result = {
    type: "two",
    params: ["to", "issue"],
    directiveType: "to",
    layerType: "issue",
    options: {},
  };

  const result1 = PromptTemplatePathResolverTotality.create(config1, cliParams);
  assertExists(result1.ok);
  assertEquals(result1.ok, true);

  // Test WithSchemaConfig
  const config2 = {
    app_schema: { base_dir: "schemas" },
  };
  const result2 = PromptTemplatePathResolverTotality.create(config2, cliParams);
  assertExists(result2.ok);
  assertEquals(result2.ok, true);

  // Test NoConfig
  const config3 = {};
  const result3 = PromptTemplatePathResolverTotality.create(config3, cliParams);
  assertExists(result3.ok);
  assertEquals(result3.ok, true);
});

Deno.test("formatPathResolutionError - Error message formatting", () => {
  // Test InvalidConfiguration
  const error1 = formatPathResolutionError({
    kind: "InvalidConfiguration",
    details: "Test configuration error",
  });
  assertEquals(error1.includes("Configuration Error"), true);

  // Test BaseDirectoryNotFound
  const error2 = formatPathResolutionError({
    kind: "BaseDirectoryNotFound",
    path: "/test/path",
  });
  assertEquals(error2.includes("Base Directory Not Found"), true);

  // Test InvalidParameterCombination
  const error3 = formatPathResolutionError({
    kind: "InvalidParameterCombination",
    directiveType: "to",
    layerType: "(missing)",
  });
  assertEquals(error3.includes("Invalid Parameter Combination"), true);

  // Test TemplateNotFound
  const error4 = formatPathResolutionError({
    kind: "TemplateNotFound",
    attempted: ["/path1", "/path2"],
    fallback: "Attempted fallback",
  });
  assertEquals(error4.includes("パスは正確に生成されました"), true);
  assertEquals(error4.includes("試行したパス"), true);
});

Deno.test("PromptTemplatePathResolverTotality - fromFile option with working_dir", async () => {
  const testBaseDir = await Deno.makeTempDir();
  const workingDir = join(testBaseDir, "workspace");
  const promptsDir = join(workingDir, "prompts");
  const promptFile = join(promptsDir, "to", "issue", "f_task.md"); // Inferred from task_notes.md

  try {
    await createTestFile(promptFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: workingDir,
    };
    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
      options: { fromFile: "task_notes.md" }, // fromFile option (infers "task" layerType)
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
        assertEquals(pathResult.data.metadata.fromLayerType, "task"); // Inferred from task_notes.md
      }
    }
  } finally {
    await cleanupTestDirectory(testBaseDir);
  }
});

Deno.test("PromptTemplatePathResolverTotality - Default fromLayerType when no -i option", () => {
  const config = {
    app_prompt: { base_dir: "test/prompts" },
  };
  const cliParams: TwoParams_Result = {
    type: "two",
    params: ["to", "issue"],
    directiveType: "to",
    layerType: "issue",
    options: {}, // No fromLayerType, no fromFile - should use DEFAULT_FROM_LAYER_TYPE
  };

  const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const fromLayerTypeResult = resolverResult.data.resolveFromLayerTypeSafe();
    assertEquals(fromLayerTypeResult.ok, true);

    if (fromLayerTypeResult.ok) {
      assertEquals(fromLayerTypeResult.data, DEFAULT_FROM_LAYER_TYPE);

      // Verify the filename uses default
      const fileName = resolverResult.data.buildFileName();
      assertEquals(fileName, `f_${DEFAULT_FROM_LAYER_TYPE}.md`);
    }
  }
});

Deno.test("PromptTemplatePathResolverTotality - Single source working_dir configuration", () => {
  const cliParams: TwoParams_Result = {
    type: "two",
    params: ["to", "issue"],
    directiveType: "to",
    layerType: "issue",
    options: {},
  };

  // Test configuration with only root working_dir (should work)
  const validConfig1 = {
    app_prompt: { base_dir: "test/prompts" },
    working_dir: "/test/workspace",
  };
  const result1 = PromptTemplatePathResolverTotality.create(validConfig1, cliParams);
  assertEquals(result1.ok, true);

  // Test configuration with no working_dir (should work - uses current directory)
  const validConfig2 = {
    app_prompt: { base_dir: "test/prompts" },
  };
  const result2 = PromptTemplatePathResolverTotality.create(validConfig2, cliParams);
  assertEquals(result2.ok, true);

  // Test configuration with workspace structure but no working_dir inside (should work)
  const validConfig3 = {
    app_prompt: { base_dir: "test/prompts" },
    workspace: { temp_dir: "/tmp" },
  };
  const result3 = PromptTemplatePathResolverTotality.create(validConfig3, cliParams);
  assertEquals(result3.ok, true);
});

Deno.test("PromptTemplatePathResolverTotality - input option as fromLayerType", async () => {
  const testBaseDir = await Deno.makeTempDir();
  const workingDir = join(testBaseDir, "workspace");
  const promptsDir = join(workingDir, "prompts");
  const promptFile = join(promptsDir, "to", "issue", "f_project.md"); // Expecting f_project.md

  try {
    await createTestFile(promptFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: workingDir,
    };
    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
      options: { input: "project" }, // --input option should be treated as fromLayerType
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
        assertEquals(pathResult.data.metadata.fromLayerType, "project");
      }
    }
  } finally {
    await cleanupTestDirectory(testBaseDir);
  }
});

Deno.test("PromptTemplatePathResolverTotality - input option priority over fromFile", async () => {
  const testBaseDir = await Deno.makeTempDir();
  const workingDir = join(testBaseDir, "workspace");
  const promptsDir = join(workingDir, "prompts");
  const promptFile = join(promptsDir, "to", "issue", "f_component.md"); // Should use input value

  try {
    await createTestFile(promptFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: workingDir,
    };
    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
      options: {
        input: "component", // --input option should take priority
        fromFile: "task_notes.md", // This should be ignored when input is present
      },
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
        assertEquals(pathResult.data.metadata.fromLayerType, "component"); // Should use input, not inferred from fromFile
      }
    }
  } finally {
    await cleanupTestDirectory(testBaseDir);
  }
});

Deno.test("computePromptDirectory - Pure function computes directory path correctly", () => {
  // Basic case
  assertEquals(
    computePromptDirectory("/workspace/prompts", "to", "task"),
    join("/workspace/prompts", "to", "task"),
  );

  // Different directive types
  assertEquals(
    computePromptDirectory("/prompts", "summary", "project"),
    join("/prompts", "summary", "project"),
  );

  assertEquals(
    computePromptDirectory("/prompts", "defect", "issue"),
    join("/prompts", "defect", "issue"),
  );

  // Relative base directory
  assertEquals(
    computePromptDirectory("prompts", "to", "task"),
    join("prompts", "to", "task"),
  );
});

Deno.test("computePromptDirectory - Can be used independently without resolver instance", () => {
  // This test verifies that the pure function can be used for variable construction
  // without needing to create a resolver instance (no dependency on path resolution result)
  const baseDir = "/workspace/prompts";
  const directiveType = "to";
  const layerType = "task";

  const result = computePromptDirectory(baseDir, directiveType, layerType);

  // The result should be deterministic and independent of any resolver state
  assertEquals(result, "/workspace/prompts/to/task");

  // Same inputs always produce same outputs (referential transparency)
  assertEquals(
    computePromptDirectory(baseDir, directiveType, layerType),
    computePromptDirectory(baseDir, directiveType, layerType),
  );
});
