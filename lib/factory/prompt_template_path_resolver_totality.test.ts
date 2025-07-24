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
  formatPathResolutionError,
  PromptTemplatePathResolverTotality,
} from "./prompt_template_path_resolver_totality.ts";
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
    app_prompt: { base_dir: "/test/prompts" },
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
    app_prompt: { base_dir: "/test/prompts" },
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
  const promptFile = join(promptsDir, "to", "issue", "f_issue.md");

  try {
    await createTestFile(promptFile);

    // Test with relative base_dir and working_dir
    const config = {
      app_prompt: { base_dir: "prompts" }, // Relative path
      workspace: { working_dir: workingDir },
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
    const promptFile = join(promptsDir, "to", "issue", "f_issue.md");
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
  const schemaDir = join(workingDir, "schemas");
  const schemaFile = join(schemaDir, "to", "issue", "f_issue.json");

  try {
    await createTestFile(schemaFile);

    const config = {
      app_schema: { base_dir: "schemas" }, // Relative path
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
  const fallbackFile = join(promptsDir, "to", "issue", "f_issue.md");

  try {
    // Create only the fallback file, not the adaptation file
    await createTestFile(fallbackFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      workspace: { working_dir: workingDir },
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
    app_prompt: { base_dir: "/non/existent/path" },
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
    const config = {
      app_prompt: { base_dir: testBaseDir },
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
  const promptFile = join(testBaseDir, "to", "issue", "f_issue.md");

  try {
    await createTestFile(promptFile);

    const config = {
      app_prompt: { base_dir: testBaseDir },
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
    app_prompt: { base_dir: "/prompts" },
    app_schema: { base_dir: "/schemas" },
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
    app_schema: { base_dir: "/schemas" },
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

Deno.test("PromptTemplatePathResolverTotality - fromLayerType resolution with working_dir", async () => {
  const testBaseDir = await Deno.makeTempDir();
  const workingDir = join(testBaseDir, "workspace");
  const promptsDir = join(workingDir, "prompts");
  const promptFile = join(promptsDir, "to", "issue", "f_task.md");

  try {
    await createTestFile(promptFile);

    const config = {
      app_prompt: { base_dir: "prompts" },
      workspace: { working_dir: workingDir },
    };
    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
      options: { fromLayerType: "task" },
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
      }
    }
  } finally {
    await cleanupTestDirectory(testBaseDir);
  }
});
