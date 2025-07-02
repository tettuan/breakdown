import { assertEquals, assertThrows } from "@std/assert";
import {
  DEFAULT_PROMPT_BASE_DIR,
  DEFAULT_SCHEMA_BASE_DIR,
  DEFAULT_WORKSPACE_STRUCTURE,
  type DirectoryType,
} from "./constants.ts";

/**
 * Unit test for constants.ts
 *
 * Purpose: Verify functional behavior and value correctness
 * - Correct constant values
 * - Type safety in usage
 * - Smart constructor patterns
 * - Result type handling
 */

Deno.test("Unit: DEFAULT_WORKSPACE_STRUCTURE has correct values", () => {
  assertEquals(DEFAULT_WORKSPACE_STRUCTURE.root, ".agent/breakdown");
  assertEquals(DEFAULT_WORKSPACE_STRUCTURE.directories.issues, "issues");
  assertEquals(DEFAULT_WORKSPACE_STRUCTURE.directories.tasks, "tasks");
  assertEquals(DEFAULT_WORKSPACE_STRUCTURE.directories.projects, "projects");
});

Deno.test("Unit: DEFAULT_PROMPT_BASE_DIR has correct value", () => {
  assertEquals(DEFAULT_PROMPT_BASE_DIR, "lib/breakdown/prompts");
  assertEquals(typeof DEFAULT_PROMPT_BASE_DIR, "string");
  assertEquals(DEFAULT_PROMPT_BASE_DIR.length > 0, true);
});

Deno.test("Unit: DEFAULT_SCHEMA_BASE_DIR has correct value", () => {
  assertEquals(DEFAULT_SCHEMA_BASE_DIR, "lib/breakdown/schema");
  assertEquals(typeof DEFAULT_SCHEMA_BASE_DIR, "string");
  assertEquals(DEFAULT_SCHEMA_BASE_DIR.length > 0, true);
});

Deno.test("Unit: DirectoryType allows only valid directory keys", () => {
  // Test valid directory types
  const validTypes: DirectoryType[] = ["issues", "tasks", "projects"];

  validTypes.forEach((dirType) => {
    const _dirPath = DEFAULT_WORKSPACE_STRUCTURE.directories[dirType];
    assertEquals(typeof dirPath, "string");
    assertEquals(dirPath.length > 0, true);
  });

  // TypeScript prevents invalid types at compile time
  // @ts-expect-error - "invalid" is not a valid DirectoryType
  const invalidType: DirectoryType = "invalid";
});

Deno.test("Unit: Smart Constructor pattern for workspace paths", () => {
  // Result type for workspace path creation
  type WorkspacePathResult =
    | { success: true; path: string; type: DirectoryType }
    | { success: false; error: string };

  // Smart constructor with validation
  class WorkspacePathBuilder {
    static create(
      root: string,
      dirType: DirectoryType,
    ): WorkspacePathResult {
      // Validate root
      if (!root || root.trim() === "") {
        return { success: false, error: "Root path is required" };
      }

      if (root.includes("..")) {
        return { success: false, error: "Root path cannot contain parent directory references" };
      }

      // Validate directory type exists
      const dirName = DEFAULT_WORKSPACE_STRUCTURE.directories[dirType];
      if (!dirName) {
        return { success: false, error: `Unknown directory type: ${dirType}` };
      }

      // Build path
      const path = `${root}/${dirName}`;

      return {
        success: true,
        path,
        type: dirType,
      };
    }
  }

  // Test success cases
  const issuesPath = WorkspacePathBuilder.create(".agent/breakdown", "issues");
  assertEquals(issuesPath.success, true);
  if (issuesPath.success) {
    assertEquals(issuesPath.path, ".agent/breakdown/issues");
    assertEquals(issuesPath.type, "issues");
  }

  const tasksPath = WorkspacePathBuilder.create(".agent/breakdown", "tasks");
  assertEquals(tasksPath.success, true);
  if (tasksPath.success) {
    assertEquals(tasksPath.path, ".agent/breakdown/tasks");
    assertEquals(tasksPath.type, "tasks");
  }

  // Test failure cases
  const emptyRoot = WorkspacePathBuilder.create("", "issues");
  assertEquals(emptyRoot.success, false);
  if (!emptyRoot.success) {
    assertEquals(emptyRoot.error, "Root path is required");
  }

  const parentRef = WorkspacePathBuilder.create("../bad", "tasks");
  assertEquals(parentRef.success, false);
  if (!parentRef.success) {
    assertEquals(parentRef.error, "Root path cannot contain parent directory references");
  }
});

Deno.test("Unit: Discriminated Union for configuration types", () => {
  // Configuration can be for different purposes
  type ConfigPath =
    | {
      type: "workspace";
      root: string;
      directories: typeof DEFAULT_WORKSPACE_STRUCTURE.directories;
    }
    | { type: "prompt"; baseDir: string }
    | { type: "schema"; baseDir: string };

  // Factory function using discriminated union
  const createConfig = (type: "workspace" | "prompt" | "schema"): ConfigPath => {
    switch (type) {
      case "workspace":
        return {
          type: "workspace",
          root: DEFAULT_WORKSPACE_STRUCTURE.root,
          directories: DEFAULT_WORKSPACE_STRUCTURE.directories,
        };
      case "prompt":
        return {
          type: "prompt",
          baseDir: DEFAULT_PROMPT_BASE_DIR,
        };
      case "schema":
        return {
          type: "schema",
          baseDir: DEFAULT_SCHEMA_BASE_DIR,
        };
    }
  };

  // Test workspace config
  const workspaceConfig = createConfig("workspace");
  assertEquals(workspaceConfig.type, "workspace");
  if (workspaceConfig.type === "workspace") {
    assertEquals(workspaceConfig.root, ".agent/breakdown");
    assertEquals(workspaceConfig.directories.issues, "issues");
  }

  // Test prompt config
  const promptConfig = createConfig("prompt");
  assertEquals(promptConfig.type, "prompt");
  if (promptConfig.type === "prompt") {
    assertEquals(promptConfig.baseDir, "lib/breakdown/prompts");
  }

  // Test schema config
  const schemaConfig = createConfig("schema");
  assertEquals(schemaConfig.type, "schema");
  if (schemaConfig.type === "schema") {
    assertEquals(schemaConfig.baseDir, "lib/breakdown/schema");
  }
});

Deno.test("Unit: Complete path construction with all directory types", () => {
  // Ensure we handle all directory types (totality)
  const allDirectoryTypes: DirectoryType[] = ["issues", "tasks", "projects"];

  const constructedPaths = allDirectoryTypes.map((dirType) => {
    const path = `${DEFAULT_WORKSPACE_STRUCTURE.root}/${
      DEFAULT_WORKSPACE_STRUCTURE.directories[dirType]
    }`;
    return { dirType, path };
  });

  // Verify all paths are constructed correctly
  assertEquals(constructedPaths.length, 3);
  assertEquals(constructedPaths[0], { dirType: "issues", path: ".agent/breakdown/issues" });
  assertEquals(constructedPaths[1], { dirType: "tasks", path: ".agent/breakdown/tasks" });
  assertEquals(constructedPaths[2], { dirType: "projects", path: ".agent/breakdown/projects" });

  // Ensure no directory type is missed
  const directoryKeys = Object.keys(DEFAULT_WORKSPACE_STRUCTURE.directories);
  assertEquals(directoryKeys.length, allDirectoryTypes.length);
});
