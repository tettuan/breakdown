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

import { assertEquals } from "$std/assert/mod.ts";
import { assertRejects } from "$std/assert/assert_rejects.ts";
import { join } from "$std/path/mod.ts";
import { exists } from "$std/fs/exists.ts";
import { setupTestEnvironment, cleanupTestEnvironment } from "../../helpers/setup.ts";
import { getTestEnvOptions } from "../../helpers/test_utils.ts";
import {
  normalizePath,
  validateWorkingDir,
  createWorkingDirStructure,
  resolveLayerPath,
  type WorkingDirStructure,
  type LayerType
} from "$lib/path/path_utils.ts";

Deno.test({
  name: "path utils - basic functionality",
  async fn() {
    const env = await setupTestEnvironment(getTestEnvOptions("path-utils"));
    try {
      // Test basic path operations
      assertEquals(normalizePath("test.md"), "./test.md");
      assertEquals(normalizePath("/absolute/path/test.md"), "/absolute/path/test.md");
      
      // Test working directory validation
      const structure = await validateWorkingDir(env.workingDir);
      assertEquals(structure.projects, false);
      assertEquals(structure.issues, false);
      assertEquals(structure.tasks, false);
      assertEquals(structure.temp, false);
      
      // Test layer path resolution
      const testFile = "test.md";
      assertEquals(
        resolveLayerPath(testFile, "project", env.workingDir),
        join(env.workingDir, "projects", testFile)
      );
    } finally {
      await cleanupTestEnvironment(env);
    }
  }
});

Deno.test("path utils - normalization", async () => {
  const env = await setupTestEnvironment(getTestEnvOptions("path-utils-norm"));
  try {
    // Test basic path normalization
    assertEquals(normalizePath("test.md"), "./test.md");
    assertEquals(normalizePath("./test.md"), "./test.md");
    assertEquals(normalizePath("dir/test.md"), "./dir/test.md");
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - working directory validation", async () => {
  const env = await setupTestEnvironment();
  
  try {
    // Test empty directory
    const emptyResult = await validateWorkingDir(env.workingDir);
    assertEquals(emptyResult, {
      projects: false,
      issues: false,
      tasks: false,
      temp: false,
    } as WorkingDirStructure);
    
    // Create directories and test again
    await createWorkingDirStructure(env.workingDir);
    const fullResult = await validateWorkingDir(env.workingDir);
    assertEquals(fullResult, {
      projects: true,
      issues: true,
      tasks: true,
      temp: true,
    } as WorkingDirStructure);
    
    // Test partial structure
    await Deno.remove(join(env.workingDir, "projects"), { recursive: true });
    const partialResult = await validateWorkingDir(env.workingDir);
    assertEquals(partialResult, {
      projects: false,
      issues: true,
      tasks: true,
      temp: true,
    } as WorkingDirStructure);
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - layer path resolution", async () => {
  const env = await setupTestEnvironment(getTestEnvOptions("path-utils-layer"));
  try {
    await createWorkingDirStructure(env.workingDir);
    
    const testFile = "test.md";
    const layers: LayerType[] = ["project", "issue", "task"];
    
    for (const layer of layers) {
      const resolvedPath = resolveLayerPath(testFile, layer, env.workingDir);
      const expectedDir = layer === "project" ? "projects" : 
                         layer === "issue" ? "issues" : "tasks";
      assertEquals(
        resolvedPath,
        join(env.workingDir, expectedDir, testFile)
      );
    }
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - directory structure creation", async () => {
  const env = await setupTestEnvironment();
  
  try {
    // Create directory structure
    await createWorkingDirStructure(env.workingDir);
    
    // Verify all directories exist
    const dirs = ["projects", "issues", "tasks", "temp"];
    for (const dir of dirs) {
      const exists = await Deno.stat(join(env.workingDir, dir)).then(
        (stat) => stat.isDirectory,
        () => false
      );
      assertEquals(exists, true, `Directory ${dir} should exist`);
    }
    
    // Test recreation (should not throw)
    await createWorkingDirStructure(env.workingDir);
    
    // Test with non-existent parent directory
    const newDir = join(env.workingDir, "subdir");
    await createWorkingDirStructure(newDir);
    const exists = await Deno.stat(join(newDir, "projects")).then(
      (stat) => stat.isDirectory,
      () => false
    );
    assertEquals(exists, true, "Should create directories in new parent");
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - working directory structure", async () => {
  const env = await setupTestEnvironment(getTestEnvOptions("path-utils-struct"));
  try {
    await createWorkingDirStructure(env.workingDir);
    
    // Verify directory structure
    const structure = await validateWorkingDir(env.workingDir);
    assertEquals(structure.projects, true);
    assertEquals(structure.issues, true);
    assertEquals(structure.tasks, true);
    assertEquals(structure.temp, true);
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - file operations", async () => {
  const env = await setupTestEnvironment(getTestEnvOptions("path-utils-file"));
  try {
    const testFile = join(env.workingDir, "test.txt");
    await Deno.writeTextFile(testFile, "test");
    assertEquals(await exists(testFile), true);
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("path utils - error handling", async () => {
  const env = await setupTestEnvironment(getTestEnvOptions("path-utils-error"));
  try {
    await assertRejects(
      async () => await validateWorkingDir(""),
      Error,
      "Working directory is required"
    );
    
    await assertRejects(
      async () => await resolveLayerPath(undefined as unknown as string, "project", env.workingDir),
      Error,
      "File path is required"
    );
  } finally {
    await cleanupTestEnvironment(env);
  }
}); 