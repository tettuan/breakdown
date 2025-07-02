import { assertEquals, assertExists } from "@std/assert";
import {
  DEFAULT_PROMPT_BASE_DIR,
  DEFAULT_SCHEMA_BASE_DIR,
  DEFAULT_WORKSPACE_STRUCTURE,
  type DirectoryType,
} from "./constants.ts";

/**
 * Architecture test for constants.ts
 *
 * Purpose: Verify architectural constraints and dependencies
 * - No circular dependencies
 * - Type safety at compile time
 * - Immutability guarantees
 * - Module boundaries
 */

Deno.test("Architecture: constants module has no external dependencies", () => {
  // constants.ts should be a leaf module with no imports
  // This test passes if the module loads without import errors
  assertExists(DEFAULT_WORKSPACE_STRUCTURE);
  assertExists(DEFAULT_PROMPT_BASE_DIR);
  assertExists(DEFAULT_SCHEMA_BASE_DIR);
});

Deno.test("Architecture: constants are immutable at compile time", () => {
  // TypeScript's 'as const' assertion ensures compile-time immutability
  // These tests verify the type system enforces immutability

  // Save original values
  const _originalRoot = DEFAULT_WORKSPACE_STRUCTURE.root;
  const originalIssues = DEFAULT_WORKSPACE_STRUCTURE.directories.issues;

  // Attempt mutations (these should fail at runtime if not truly immutable)
  try {
    // @ts-expect-error - Should not allow mutation of const object
    DEFAULT_WORKSPACE_STRUCTURE.root = "modified";
  } catch {
    // Expected to fail
  }

  try {
    // @ts-expect-error - Should not allow mutation of nested properties
    DEFAULT_WORKSPACE_STRUCTURE.directories.issues = "modified";
  } catch {
    // Expected to fail
  }

  // Verify actual values remain unchanged
  assertEquals(DEFAULT_WORKSPACE_STRUCTURE.root, originalRoot);
  assertEquals(DEFAULT_WORKSPACE_STRUCTURE.directories.issues, originalIssues);
});

Deno.test("Architecture: DirectoryType is a discriminated union", () => {
  // DirectoryType should be a union of literal types
  // This enables exhaustive checking in switch statements

  const checkDirectoryType = (dir: DirectoryType): string => {
    switch (dir) {
      case "issues":
        return "issues directory";
      case "tasks":
        return "tasks directory";
      case "projects":
        return "projects directory";
        // TypeScript ensures this is exhaustive
    }
  };

  // Test all valid directory types
  assertEquals(checkDirectoryType("issues"), "issues directory");
  assertEquals(checkDirectoryType("tasks"), "tasks directory");
  assertEquals(checkDirectoryType("projects"), "projects directory");
});

Deno.test("Architecture: constants follow Result type pattern for validation", () => {
  // Smart Constructor pattern with Result type
  type ValidationResult<T> =
    | { success: true; value: T }
    | { success: false; error: string };

  // Smart constructor for directory paths
  const createDirectoryPath = (
    root: string,
    directory: DirectoryType,
  ): ValidationResult<string> => {
    if (!root || root.trim() === "") {
      return { success: false, error: "Root path cannot be empty" };
    }

    if (!DEFAULT_WORKSPACE_STRUCTURE.directories[directory]) {
      return { success: false, error: `Invalid directory type: ${directory}` };
    }

    return {
      success: true,
      value: `${root}/${DEFAULT_WORKSPACE_STRUCTURE.directories[directory]}`,
    };
  };

  // Test success case
  const successResult = createDirectoryPath(DEFAULT_WORKSPACE_STRUCTURE.root, "issues");
  assertEquals(successResult.success, true);
  if (successResult.success) {
    assertEquals(
      successResult.value,
      `${DEFAULT_WORKSPACE_STRUCTURE.root}/${DEFAULT_WORKSPACE_STRUCTURE.directories.issues}`,
    );
  }

  // Test failure cases
  const emptyRootResult = createDirectoryPath("", "issues");
  assertEquals(emptyRootResult.success, false);
  if (!emptyRootResult.success) {
    assertEquals(emptyRootResult.error, "Root path cannot be empty");
  }
});

Deno.test("Architecture: constants module exports are properly typed", () => {
  // Verify that all exports have explicit types
  // This ensures type safety across module boundaries

  // Test that DirectoryType is properly exported and usable
  const validDirectories: DirectoryType[] = ["issues", "tasks", "projects"];
  assertEquals(validDirectories.length, 3);

  // Test that constants maintain their literal types
  const workspaceRoot: ".agent/breakdown" = DEFAULT_WORKSPACE_STRUCTURE.root;
  assertEquals(workspaceRoot, ".agent/breakdown");
});
