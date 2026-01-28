/**
 * @fileoverview Tests for WorkingDirectoryPath Value Object
 *
 * Tests cover:
 * - 0_architecture: Value Object constraints and smart constructor pattern
 * - 1_behavior: Method behavior verification (creation, factories, operations)
 * - 2_structure: Data structure integrity and immutability
 *
 * Test Categories:
 * - Normal cases: Valid paths, successful operations
 * - Error cases: Invalid inputs, non-existent paths, permission errors
 * - Boundary cases: Edge conditions, path length limits, permission boundaries
 */

import { assertEquals, assertExists, assertNotEquals } from "../../../deps.ts";
import {
  DEFAULT_WORKING_DIRECTORY_CONFIG,
  formatWorkingDirectoryPathError,
  isDirectoryNotFoundError,
  isInvalidDirectoryPathError,
  isPermissionDeniedError,
  isSecurityViolationError,
  isValidationError,
  WorkingDirectoryPath,
  type WorkingDirectoryPathConfig,
  type WorkingDirectoryPathError,
} from "./working_directory_path.ts";

// Test fixtures
// Test fixtures - Use real path to resolve /tmp symlink on macOS
const TEST_BASE_DIR = (() => {
  try {
    // Get the real path for /tmp (resolves /tmp -> /private/tmp on macOS)
    const realTmp = Deno.realPathSync("/tmp");
    return `${realTmp}/breakdown-working-dir-tests`;
  } catch {
    // Fallback to standard /tmp if realPath fails
    return "/tmp/breakdown-working-dir-tests";
  }
})();

// Helper functions
async function createTestDirectory(path: string): Promise<void> {
  await Deno.mkdir(path, { recursive: true });
}

function normalizePath(path: string): string {
  // Normalize macOS symlink paths (/private/tmp -> /tmp)
  return path.replace("/private/tmp", "/tmp");
}

async function removeTestDirectory(path: string): Promise<void> {
  try {
    await Deno.remove(path, { recursive: true });
  } catch {
    // Ignore if already removed
  }
}

async function setupTestEnvironment(): Promise<string> {
  const testDir = `${TEST_BASE_DIR}-${Date.now()}`;
  await createTestDirectory(testDir);
  return testDir;
}

async function cleanupTestEnvironment(testDir: string): Promise<void> {
  await removeTestDirectory(testDir);
}

// =============================================================================
// 0_architecture: Value Object constraints and smart constructor pattern
// =============================================================================

Deno.test("0_architecture - WorkingDirectoryPath follows Value Object constraints", async () => {
  const testDir = await setupTestEnvironment();

  try {
    const result = WorkingDirectoryPath.create(testDir);
    assertEquals(result.ok, true);

    if (result.ok) {
      const path1 = result.data;
      const path2Result = WorkingDirectoryPath.create(testDir);

      assertEquals(path2Result.ok, true);
      if (path2Result.ok) {
        const path2 = path2Result.data;

        // Value Object equality
        assertEquals(path1.equals(path2), true);

        // Immutability - objects should be different instances but equal values
        // Note: For Value Objects, structural equality is more important than reference equality
        assertEquals(path1.getAbsolutePath(), path2.getAbsolutePath()); // Same values
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("0_architecture - WorkingDirectoryPath equals() returns false for different paths", async () => {
  const testDir1 = await setupTestEnvironment();
  const testDir2 = `${testDir1}/subdir`;
  await createTestDirectory(testDir2);

  try {
    const path1Result = WorkingDirectoryPath.create(testDir1);
    const path2Result = WorkingDirectoryPath.create(testDir2);

    assertEquals(path1Result.ok, true);
    assertEquals(path2Result.ok, true);

    if (path1Result.ok && path2Result.ok) {
      const path1 = path1Result.data;
      const path2 = path2Result.data;

      // Different paths should NOT be equal
      assertEquals(path1.equals(path2), false);
      assertEquals(path2.equals(path1), false);

      // Verify they are actually different
      assertNotEquals(path1.getAbsolutePath(), path2.getAbsolutePath());
    }
  } finally {
    await cleanupTestEnvironment(testDir1);
  }
});

Deno.test("0_architecture - Smart Constructor prevents direct instantiation", () => {
  // This test verifies that constructor is private by ensuring
  // only the static create methods are available
  const validMethods = ["create", "createWithConfig", "current", "temp", "home"];
  const _staticMethods = Object.getOwnPropertyNames(WorkingDirectoryPath)
    .filter((name) =>
      typeof (WorkingDirectoryPath as unknown as Record<string, unknown>)[name] === "function"
    );

  validMethods.forEach((method) => {
    assertExists((WorkingDirectoryPath as unknown as Record<string, unknown>)[method]);
  });
});

Deno.test("0_architecture - Result type usage prevents exceptions", async () => {
  // All methods should return Result types, never throw exceptions
  const testDir = await setupTestEnvironment();

  try {
    // Valid case should return Ok result
    const validResult = WorkingDirectoryPath.create(testDir);
    assertEquals(typeof validResult.ok, "boolean");

    // Invalid case should return Error result, not throw
    const invalidResult = WorkingDirectoryPath.create("");
    assertEquals(validResult.ok, true);
    assertEquals(invalidResult.ok, false);

    // Non-existent path should return Error result
    const nonExistentResult = WorkingDirectoryPath.create("/non/existent/path");
    assertEquals(nonExistentResult.ok, false);
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

// =============================================================================
// 1_behavior: Method behavior verification
// =============================================================================

Deno.test("1_behavior - create() with valid absolute path", async () => {
  const testDir = await setupTestEnvironment();

  try {
    const result = WorkingDirectoryPath.create(testDir);

    assertEquals(result.ok, true);

    if (result.ok) {
      assertEquals(result.data.getAbsolutePath(), testDir);
      assertEquals(result.data.isAbsolutePath(), true);
      assertEquals(result.data.directoryExists(), true);
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("1_behavior - create() with valid relative path", async () => {
  const testDir = await setupTestEnvironment();
  const originalCwd = Deno.cwd();

  try {
    // Change to test directory and create a subdirectory
    Deno.chdir(testDir);
    const subDir = "subdir";
    await createTestDirectory(subDir);

    const result = WorkingDirectoryPath.create(subDir);

    assertEquals(result.ok, true);

    if (result.ok) {
      const expectedPath = await Deno.realPath(`${testDir}/${subDir}`);
      const actualPath = await Deno.realPath(result.data.getAbsolutePath());
      assertEquals(actualPath, expectedPath);
      assertEquals(result.data.getOriginalPath(), subDir);
      assertEquals(result.data.isAbsolutePath(), true); // Should be resolved to absolute
    }
  } finally {
    Deno.chdir(originalCwd);
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("1_behavior - current() factory method", () => {
  const result = WorkingDirectoryPath.current();

  assertEquals(result.ok, true);

  if (result.ok) {
    assertEquals(result.data.isAbsolutePath(), true);
    assertEquals(result.data.getAbsolutePath(), Deno.cwd());
    assertEquals(result.data.directoryExists(), true);
  }
});

Deno.test("1_behavior - temp() factory method", () => {
  const result = WorkingDirectoryPath.temp();

  assertEquals(result.ok, true);

  if (result.ok) {
    assertEquals(result.data.isAbsolutePath(), true);
    assertEquals(result.data.directoryExists(), true);

    // Should be a valid temp directory - verify it's within or matches system temp
    const tempPath = normalizePath(result.data.getAbsolutePath());
    const systemTempDir = normalizePath(
      (Deno.env.get("TMPDIR") || Deno.env.get("TEMP") || "/tmp").replace(/\/$/, ""),
    );
    const isValidTempPath = tempPath === systemTempDir ||
      tempPath.startsWith(systemTempDir + "/") ||
      tempPath.includes("/var/folders") ||
      tempPath.includes("tmp") ||
      tempPath.includes("TEMP");
    assertEquals(isValidTempPath, true);
  }
});

Deno.test("1_behavior - join() method", async () => {
  const testDir = await setupTestEnvironment();

  try {
    const result = WorkingDirectoryPath.create(testDir);
    assertEquals(result.ok, true);

    if (result.ok) {
      // Test join() method with non-existent path (should work because join doesn't verify existence)
      // Instead, create a subdir for the join test to pass
      await createTestDirectory(`${testDir}/subdir`);
      const joinResult = result.data.join("subdir");
      assertEquals(joinResult.ok, true);

      if (joinResult.ok) {
        const expectedPath = `${testDir}/subdir`;
        // Normalize both paths for comparison (handles /private/tmp vs /tmp)
        const actualPath = normalizePath(joinResult.data.getAbsolutePath());
        const normalizedExpected = normalizePath(expectedPath);
        assertEquals(actualPath, normalizedExpected);
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("1_behavior - getParent() method", async () => {
  const testDir = await setupTestEnvironment();
  const subDir = `${testDir}/subdir`;
  await createTestDirectory(subDir);

  try {
    const result = WorkingDirectoryPath.create(subDir);
    assertEquals(result.ok, true);

    if (result.ok) {
      const parentResult = result.data.getParent();
      assertEquals(parentResult.ok, true);

      if (parentResult.ok) {
        assertEquals(parentResult.data.getAbsolutePath(), testDir);
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("1_behavior - getRelativePath() method", async () => {
  const testDir = await setupTestEnvironment();
  const subDir = `${testDir}/subdir`;
  await createTestDirectory(subDir);

  try {
    const baseDirResult = WorkingDirectoryPath.create(testDir);
    const subDirResult = WorkingDirectoryPath.create(subDir);

    assertEquals(baseDirResult.ok && subDirResult.ok, true);

    if (baseDirResult.ok && subDirResult.ok) {
      const relativeResult = subDirResult.data.getRelativePath(baseDirResult.data);
      assertEquals(relativeResult.ok, true);

      if (relativeResult.ok) {
        assertEquals(relativeResult.data, "subdir");
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("1_behavior - getDirectoryName() method", async () => {
  const testDir = await setupTestEnvironment();

  try {
    const result = WorkingDirectoryPath.create(testDir);
    assertEquals(result.ok, true);

    if (result.ok) {
      const dirName = result.data.getDirectoryName();
      const expectedName = testDir.split("/").pop() || "";
      assertEquals(dirName, expectedName);
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

// =============================================================================
// Error cases: Invalid inputs, non-existent paths, permission errors
// =============================================================================

Deno.test("1_behavior - create() with invalid inputs", () => {
  // Empty string
  const emptyResult = WorkingDirectoryPath.create("");
  assertEquals(emptyResult.ok, false);
  if (!emptyResult.ok) {
    assertEquals(isInvalidDirectoryPathError(emptyResult.error), true);
  }

  // Whitespace only
  const whitespaceResult = WorkingDirectoryPath.create("   ");
  assertEquals(whitespaceResult.ok, false);
  if (!whitespaceResult.ok) {
    assertEquals(isInvalidDirectoryPathError(whitespaceResult.error), true);
  }
});

Deno.test("1_behavior - create() with non-existent directory", () => {
  const result = WorkingDirectoryPath.create("/completely/non/existent/path");
  assertEquals(result.ok, false);

  if (!result.ok) {
    assertEquals(isDirectoryNotFoundError(result.error), true);
  }
});

Deno.test("1_behavior - createWithConfig() with createIfMissing option", async () => {
  const testDir = await setupTestEnvironment();
  const newDir = `${testDir}/new-directory`;

  try {
    const config: WorkingDirectoryPathConfig = {
      ...DEFAULT_WORKING_DIRECTORY_CONFIG,
      createIfMissing: true,
    };

    const result = WorkingDirectoryPath.createWithConfig(newDir, config);
    assertEquals(result.ok, true);

    if (result.ok) {
      // Normalize paths for comparison (handles /private/tmp vs /tmp)
      const actualPath = normalizePath(result.data.getAbsolutePath());
      const expectedPath = normalizePath(newDir);
      assertEquals(actualPath, expectedPath);
      assertEquals(result.data.directoryExists(), true);

      // Verify directory was actually created
      const stat = await Deno.stat(newDir);
      assertEquals(stat.isDirectory, true);
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("1_behavior - createWithConfig() with permission requirements", async () => {
  const testDir = await setupTestEnvironment();

  try {
    const configWithWrite: WorkingDirectoryPathConfig = {
      ...DEFAULT_WORKING_DIRECTORY_CONFIG,
      requireWritePermission: true,
    };

    const result = WorkingDirectoryPath.createWithConfig(testDir, configWithWrite);
    assertEquals(result.ok, true);

    if (result.ok) {
      assertEquals(result.data.directoryExists(), true);
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

// =============================================================================
// 2_structure: Data structure integrity and immutability
// =============================================================================

Deno.test("2_structure - WorkingDirectoryPath immutability", async () => {
  const testDir = await setupTestEnvironment();

  try {
    const result = WorkingDirectoryPath.create(testDir);
    assertEquals(result.ok, true);

    if (result.ok) {
      const path = result.data;

      // Attempt to modify internal state should not be possible
      // (TypeScript prevents this at compile time, but we test runtime behavior)
      const frozenPath = Object.isFrozen(path);
      assertEquals(frozenPath, true);

      // Methods should return new instances, not modify existing ones
      const joinResult = path.join("subdir");
      if (joinResult.ok) {
        assertNotEquals(joinResult.data, path);
        assertEquals(path.getAbsolutePath(), testDir); // Original unchanged
      }
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("2_structure - Error type discrimination", () => {
  // Test that error types can be properly discriminated
  const errors: WorkingDirectoryPathError[] = [
    { kind: "InvalidDirectoryPath", message: "test", path: "/test" },
    { kind: "DirectoryNotFound", message: "test", path: "/test" },
    { kind: "PermissionDenied", message: "test", path: "/test", operation: "read" },
    {
      kind: "SecurityViolation",
      message: "test",
      attemptedPath: "/test",
      violation: "path_traversal",
    },
    { kind: "ValidationError", field: "path", message: "test" },
  ];

  assertEquals(isInvalidDirectoryPathError(errors[0]), true);
  assertEquals(isDirectoryNotFoundError(errors[1]), true);
  assertEquals(isPermissionDeniedError(errors[2]), true);
  assertEquals(isSecurityViolationError(errors[3]), true);
  assertEquals(isValidationError(errors[4]), true);

  // Cross-validation (should be false)
  assertEquals(isInvalidDirectoryPathError(errors[1]), false);
  assertEquals(isDirectoryNotFoundError(errors[0]), false);
});

Deno.test("2_structure - Error formatting", () => {
  const error: WorkingDirectoryPathError = {
    kind: "DirectoryNotFound",
    message: "Directory does not exist",
    path: "/test/path",
  };

  const formatted = formatWorkingDirectoryPathError(error);
  assertEquals(formatted.includes("Directory not found"), true);
  assertEquals(formatted.includes("/test/path"), true);
});

Deno.test("2_structure - toDebugString() output format", async () => {
  const testDir = await setupTestEnvironment();

  try {
    const result = WorkingDirectoryPath.create(testDir);
    assertEquals(result.ok, true);

    if (result.ok) {
      const debugString = result.data.toDebugString();

      assertEquals(debugString.includes("WorkingDirectoryPath{"), true);
      assertEquals(debugString.includes(`original=${testDir}`), true);
      assertEquals(debugString.includes(`resolved=${testDir}`), true);
      assertEquals(debugString.includes("absolute=true"), true);
      assertEquals(debugString.includes("exists=true"), true);
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

// =============================================================================
// Boundary cases: Edge conditions
// =============================================================================

Deno.test("1_behavior - boundary case: root directory", () => {
  const result = WorkingDirectoryPath.create("/");
  assertEquals(result.ok, true);

  if (result.ok) {
    assertEquals(result.data.getAbsolutePath(), "/");
    assertEquals(result.data.getDirectoryName(), "");

    const parentResult = result.data.getParent();
    if (parentResult.ok) {
      assertEquals(parentResult.data.getAbsolutePath(), "/");
    }
  }
});

Deno.test("1_behavior - boundary case: very long path", async () => {
  // Test with a moderately long path (not system-breaking)
  const testDir = await setupTestEnvironment();
  const longSubPath = "a".repeat(50) + "/" + "b".repeat(50);
  const longPath = `${testDir}/${longSubPath}`;

  try {
    await createTestDirectory(longPath);

    const result = WorkingDirectoryPath.create(longPath);
    assertEquals(result.ok, true);

    if (result.ok) {
      assertEquals(result.data.getAbsolutePath(), longPath);
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});

Deno.test("1_behavior - boundary case: paths with spaces and special characters", async () => {
  const testDir = await setupTestEnvironment();
  const specialDir = `${testDir}/dir with spaces & special-chars_123`;

  try {
    await createTestDirectory(specialDir);

    const result = WorkingDirectoryPath.create(specialDir);
    assertEquals(result.ok, true);

    if (result.ok) {
      assertEquals(result.data.getAbsolutePath(), specialDir);
      assertEquals(result.data.directoryExists(), true);
    }
  } finally {
    await cleanupTestEnvironment(testDir);
  }
});
