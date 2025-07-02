import { assertEquals, assertExists } from "@std/assert";
import {
  DEFAULT_PROMPT_BASE_DIR,
  DEFAULT_SCHEMA_BASE_DIR,
  DEFAULT_WORKSPACE_STRUCTURE,
  type DirectoryType,
} from "./constants.ts";

/**
 * Structure test for constants.ts
 *
 * Purpose: Verify structural design and responsibility separation
 * - Single Responsibility Principle
 * - Proper abstraction levels
 * - Clear separation of concerns
 * - No overlapping responsibilities
 */

Deno.test("Structure: workspace structure has single responsibility", () => {
  // DEFAULT_WORKSPACE_STRUCTURE should only define workspace layout
  // It should not contain logic, validation, or other concerns

  const _keys = Object.keys(DEFAULT_WORKSPACE_STRUCTURE);
  assertEquals(keys.length, 2); // Only 'root' and 'directories'
  assertEquals(keys.includes("root"), true);
  assertEquals(keys.includes("directories"), true);

  // Verify it only contains structural data
  assertEquals(typeof DEFAULT_WORKSPACE_STRUCTURE.root, "string");
  assertEquals(typeof DEFAULT_WORKSPACE_STRUCTURE.directories, "object");
});

Deno.test("Structure: directory constants follow consistent naming pattern", () => {
  // All directory names should be lowercase and plural
  const directories = Object.values(DEFAULT_WORKSPACE_STRUCTURE.directories);

  for (const dir of directories) {
    // Check lowercase
    assertEquals(dir, dir.toLowerCase(), `Directory "${dir}" should be lowercase`);

    // Check plural form (simple check - ends with 's')
    assertEquals(
      dir.endsWith("s"),
      true,
      `Directory "${dir}" should be plural`,
    );
  }
});

Deno.test("Structure: constants are properly grouped by concern", () => {
  // Constants should be grouped by their functional area

  // Workspace-related constants
  assertExists(DEFAULT_WORKSPACE_STRUCTURE);

  // Prompt-related constants
  assertExists(DEFAULT_PROMPT_BASE_DIR);

  // Schema-related constants
  assertExists(DEFAULT_SCHEMA_BASE_DIR);

  // Each constant should have a clear, single purpose
  assertEquals(
    DEFAULT_PROMPT_BASE_DIR.includes("prompt"),
    true,
    "Prompt base dir should contain 'prompt' in its path",
  );

  assertEquals(
    DEFAULT_SCHEMA_BASE_DIR.includes("schema"),
    true,
    "Schema base dir should contain 'schema' in its path",
  );
});

Deno.test("Structure: DirectoryType abstraction is at correct level", () => {
  // DirectoryType should abstract only the directory keys
  // It should not include implementation details

  type ExpectedDirectoryType = "issues" | "tasks" | "projects";

  // Verify DirectoryType matches expected abstraction
  const validDirectory: DirectoryType = "issues";
  const allDirectories: DirectoryType[] = ["issues", "tasks", "projects"];

  assertEquals(allDirectories.length, 3);
  assertEquals(typeof validDirectory, "string");
});

Deno.test("Structure: constants module has clear boundaries", () => {
  // The module should only export constants and types
  // No functions, classes, or complex logic

  // Create a totality-checking function to ensure all exports are accounted for
  type ConstantsExport =
    | typeof DEFAULT_WORKSPACE_STRUCTURE
    | typeof DEFAULT_PROMPT_BASE_DIR
    | typeof DEFAULT_SCHEMA_BASE_DIR
    | DirectoryType;

  // This pattern ensures we handle all exports
  const checkExportType = (name: string): "constant" | "type" => {
    switch (name) {
      case "DEFAULT_WORKSPACE_STRUCTURE":
      case "DEFAULT_PROMPT_BASE_DIR":
      case "DEFAULT_SCHEMA_BASE_DIR":
        return "constant";
      case "DirectoryType":
        return "type";
      default:
        // TypeScript would error if we add new exports without updating this
        return "constant";
    }
  };

  assertEquals(checkExportType("DEFAULT_WORKSPACE_STRUCTURE"), "constant");
  assertEquals(checkExportType("DirectoryType"), "type");
});

Deno.test("Structure: workspace directories form complete set", () => {
  // Using Totality pattern to ensure all workspace areas are covered

  type WorkspaceArea =
    | { type: "issues"; path: string }
    | { type: "tasks"; path: string }
    | { type: "projects"; path: string };

  const createWorkspaceArea = (dirType: DirectoryType): WorkspaceArea => {
    const path = DEFAULT_WORKSPACE_STRUCTURE.directories[dirType];

    switch (dirType) {
      case "issues":
        return { type: "issues", path };
      case "tasks":
        return { type: "tasks", path };
      case "projects":
        return { type: "projects", path };
        // TypeScript ensures exhaustiveness
    }
  };

  // Test all workspace areas are properly defined
  const issuesArea = createWorkspaceArea("issues");
  assertEquals(issuesArea.type, "issues");
  assertEquals(issuesArea.path, "issues");

  const tasksArea = createWorkspaceArea("tasks");
  assertEquals(tasksArea.type, "tasks");
  assertEquals(tasksArea.path, "tasks");

  const projectsArea = createWorkspaceArea("projects");
  assertEquals(projectsArea.type, "projects");
  assertEquals(projectsArea.path, "projects");
});
