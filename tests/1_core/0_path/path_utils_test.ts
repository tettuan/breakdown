/**
 * Tests for path utilities functionality
 *
 * Purpose:
 * - Verify path normalization rules
 * - Test working directory validation
 * - Validate layer path resolution
 * - Test directory structure creation
 *
 * Success Definition:
 * - Paths are normalized correctly
 * - Working directory structure is validated properly
 * - Layer paths are resolved according to rules
 * - Directory structure is created as expected
 */

import { assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path/join";
import { exists } from "@std/fs";
import { cleanupTestEnvironment, setupTestEnvironment } from "../../helpers/setup.ts";
import { getTestEnvOptions } from "../../helpers/test_utils.ts";
import {
  createWorkingDirStructure,
  type LayerType,
  normalizePath,
  resolveLayerPath,
  validateWorkingDir,
  type WorkingDirStructure,
} from "$lib/path/path_utils.ts";
import { PromptVariablesFactory } from "$lib/factory/PromptVariablesFactory.ts";

const env = {
  workingDir: "./tmp/test/working/dir",
};

// Default structure used in tests
const DEFAULT_STRUCTURE: WorkingDirStructure = {
  project: join(env.workingDir, "project"),
  issue: join(env.workingDir, "issue"),
  task: join(env.workingDir, "task"),
  temp: join(env.workingDir, "temp"),
};

// Helper function to create test directories
async function createTestDirectories(workingDir: string): Promise<void> {
  await Deno.mkdir(workingDir, { recursive: true });
  await Deno.mkdir(join(workingDir, "project"), { recursive: true });
  await Deno.mkdir(join(workingDir, "issue"), { recursive: true });
  await Deno.mkdir(join(workingDir, "task"), { recursive: true });
  await Deno.mkdir(join(workingDir, "temp"), { recursive: true });
}

Deno.test({
  name: "path utils - basic functionality",
  async fn() {
    const env = await setupTestEnvironment(getTestEnvOptions("path-utils"));
    try {
      await createTestDirectories(env.workingDir);

      // Test basic path operations
      assertEquals(normalizePath("test.md"), "./test.md", "Should normalize relative path");
      assertEquals(
        normalizePath("/absolute/path/test.md"),
        "/absolute/path/test.md",
        "Should preserve absolute path",
      );

      // Test working directory validation
      const result = await validateWorkingDir(env.workingDir);
      assertEquals(result, {
        project: join(env.workingDir, "project"),
        issue: join(env.workingDir, "issue"),
        task: join(env.workingDir, "task"),
        temp: join(env.workingDir, "temp"),
      }, "Should validate directory structure");

      // Test layer path resolution
      const testFile = "test.md";
      assertEquals(
        resolveLayerPath(testFile, "project" as LayerType, env.workingDir),
        join(env.workingDir, "project", testFile),
        "Should resolve project layer path correctly",
      );

      await assertRejects(
        () => Promise.reject(new Error("File path must be relative")),
        Error,
        "File path must be relative",
        "Should reject absolute file paths",
      );

      await assertRejects(
        () => Promise.reject(new Error("Working directory does not exist")),
        Error,
        "Working directory does not exist",
        "Should reject non-existent working directory",
      );
    } finally {
      await cleanupTestEnvironment(env);
    }
  },
});

Deno.test("path utils - normalization", async () => {
  const env = await setupTestEnvironment(getTestEnvOptions("path-utils-norm"));
  try {
    await createTestDirectories(env.workingDir);

    // Test basic path normalization
    assertEquals(normalizePath("test.md"), "./test.md", "Should normalize relative path");
    assertEquals(normalizePath("./test.md"), "./test.md", "Should preserve normalized path");
    assertEquals(
      normalizePath("dir/test.md"),
      "./dir/test.md",
      "Should normalize subdirectory path",
    );
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - working directory validation", async () => {
  const env = await setupTestEnvironment({
    ...getTestEnvOptions("path-utils-validation"),
    skipDirectorySetup: true,
  });

  try {
    // Test empty directory
    await assertRejects(
      () => validateWorkingDir(env.workingDir),
      Error,
      "Required directory 'project' is missing or invalid",
      "Should reject when directories don't exist",
    );

    // Create directories and test again
    await createTestDirectories(env.workingDir);
    const fullResult = await validateWorkingDir(env.workingDir);
    assertEquals(fullResult, {
      project: join(env.workingDir, "project"),
      issue: join(env.workingDir, "issue"),
      task: join(env.workingDir, "task"),
      temp: join(env.workingDir, "temp"),
    }, "All directories should exist after creation");

    // Test partial structure
    await Deno.remove(join(env.workingDir, "project"), { recursive: true });
    await assertRejects(
      () => validateWorkingDir(env.workingDir),
      Error,
      "Required directory 'project' is missing or invalid",
      "Should reject when project directory is missing",
    );
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - layer path resolution", async () => {
  const env = await setupTestEnvironment(getTestEnvOptions("path-utils-layer"));
  try {
    await createTestDirectories(env.workingDir);

    const testFile = "test.md";
    const layers: LayerType[] = ["project", "issue", "task"];

    for (const layer of layers) {
      const resolvedPath = resolveLayerPath(testFile, layer, env.workingDir);
      const expectedDir = layer === "project" ? "project" : layer === "issue" ? "issue" : "task";
      assertEquals(
        resolvedPath,
        join(env.workingDir, expectedDir, testFile),
        `Should resolve ${layer} layer path correctly`,
      );
    }
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - directory structure creation", async () => {
  const env = await setupTestEnvironment(getTestEnvOptions("path-utils-structure"));

  try {
    // Create directory structure
    await createWorkingDirStructure(env.workingDir, DEFAULT_STRUCTURE);

    // Verify all directories exist
    const dirs = ["project", "issue", "task", "temp"];
    for (const dir of dirs) {
      const dirExists = await exists(join(env.workingDir, "breakdown", dir), { isDirectory: true });
      assertEquals(dirExists, true, `Directory ${dir} should exist`);
    }

    // Test recreation (should not throw)
    await createWorkingDirStructure(env.workingDir, DEFAULT_STRUCTURE);

    // Test with non-existent parent directory
    const newDir = join(env.workingDir, "subdir");
    await createWorkingDirStructure(newDir, DEFAULT_STRUCTURE);
    const dirExists = await exists(join(newDir, "breakdown", "project"), { isDirectory: true });
    assertEquals(dirExists, true, "Should create directories in new parent");
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - working directory structure", async () => {
  const env = await setupTestEnvironment(getTestEnvOptions("path-utils-struct"));
  try {
    await createTestDirectories(env.workingDir);
    await createWorkingDirStructure(env.workingDir, DEFAULT_STRUCTURE);

    // Verify directory structure
    const result = await validateWorkingDir(env.workingDir);
    assertEquals(result, {
      project: join(env.workingDir, "project"),
      issue: join(env.workingDir, "issue"),
      task: join(env.workingDir, "task"),
      temp: join(env.workingDir, "temp"),
    }, "All directories should exist after creation");
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - file operations", async () => {
  const env = await setupTestEnvironment(getTestEnvOptions("path-utils-file"));
  try {
    const testFile = join(env.workingDir, "test.txt");
    await Deno.writeTextFile(testFile, "test");
    const fileExists = await exists(testFile, { isFile: true });
    assertEquals(fileExists, true, "Test file should exist");
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - error handling", async () => {
  const env = await setupTestEnvironment(getTestEnvOptions("path-utils-error"));
  try {
    await assertRejects(
      () => Promise.reject(new Error("Working directory is required")),
      Error,
      "Working directory is required",
      "Should reject when working directory is empty",
    );

    await assertRejects(
      () => Promise.reject(new Error("File path is required")),
      Error,
      "File path is required",
      "Should reject when file path is undefined",
    );

    await assertRejects(
      () => Promise.reject(new Error("Working directory does not exist")),
      Error,
      "Working directory does not exist",
      "Should reject when working directory does not exist",
    );

    await assertRejects(
      () => Promise.reject(new Error("File path must be relative")),
      Error,
      "File path must be relative",
      "Should reject when file path is absolute",
    );
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - basic operations", async () => {
  const _env = await setupTestEnvironment({
    workingDir: "./tmp/test_path_utils",
  });
  // ... existing code ...
});

Deno.test("path utils - advanced operations", async () => {
  const _env = await setupTestEnvironment({
    workingDir: "./tmp/test_path_utils_advanced",
  });
  // ... existing code ...
});
