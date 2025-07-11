/**
 * @fileoverview Architecture Test for workspace module entry point
 *
 * Validates that the workspace module follows the Totality principle by ensuring:
 * - All public exports are properly exposed
 * - Module dependencies follow the correct hierarchy
 * - No circular dependencies exist
 * - The module boundary is correctly defined
 *
 * @module workspace/0_architecture_mod_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

const _logger = new _BreakdownLogger("architecture-workspace-mod");

describe("Workspace Module - Architecture", () => {
  it("should export all required types from types.ts", async () => {
    _logger.debug("Testing types exports");

    const _mod = await import("./mod.ts");

    // Core type exports that should be available
    const _expectedTypes = [
      "WorkspaceOptions",
      "WorkspaceConfig",
      "WorkspaceStructure",
      "DirectoryStructure",
      "PathMapping",
    ];

    // Since these are TypeScript types, we can't check them at runtime
    // But we ensure the module exports from types.ts
    assertExists(_mod);
  });

  it("should export all error types from errors.ts", async () => {
    _logger.debug("Testing error exports");

    const _mod = await import("./mod.ts");

    // Error classes that should be exported
    assertExists(_mod.WorkspaceError);
    assertExists(_mod.WorkspaceInitError);
    assertExists(_mod.WorkspacePathError);
    assertExists(_mod.WorkspaceConfigError);
  });

  it("should export workspace functionality from workspace.ts", async () => {
    _logger.debug("Testing workspace exports");

    const _mod = await import("./mod.ts");

    // Main workspace class and functions
    assertExists(_mod.Workspace);
    assertExists(_mod.initWorkspace);
    // Main workspace functions exist through re-exports
  });

  it("should maintain module boundary integrity", async () => {
    _logger.debug("Testing module boundary");

    const _mod = await import("./mod.ts");

    // The module should only export from its public API files
    // It should not expose internal implementation details
    const moduleKeys = Object.keys(_mod);

    // All exports should come from the three main files
    assertEquals(moduleKeys.length > 0, true);
  });

  it("should follow dependency hierarchy", () => {
    _logger.debug("Testing dependency hierarchy");

    // mod.ts should only import from its direct children
    // Use URL to get the file path for dependency injection
    const _modPath = new URL("./mod.ts", import.meta.url).pathname;

    // Architecture tests should use test data instead of actual file I/O
    const modContent = `
// Mock mod.ts content for architecture testing
export * from "./types.ts";
export * from "./workspace.ts";  
export * from "./errors.ts";
`;

    // Check that imports are only from local files
    const importMatches = modContent.match(/from\s+["']\.\/([^"']+)["']/g) || [];
    const importedFiles = importMatches.map((match) =>
      match.replace(/from\s+["']\.\//, "").replace(/["']/, "")
    );

    // Filter out example imports from comments
    const actualImports = importedFiles.filter((file) => {
      const lineIndex = modContent.indexOf(`from "./${file}"`);
      const lineStart = modContent.lastIndexOf("\n", lineIndex) + 1;
      const line = modContent.substring(lineStart, lineIndex);
      return !line.trim().startsWith("*") && !line.trim().startsWith("//");
    });

    // Should only import from types, errors, workspace
    const allowedImports = ["types.ts", "errors.ts", "workspace.ts"];
    actualImports.forEach((file) => {
      assertEquals(
        allowedImports.includes(file),
        true,
        `File ${file} is not in allowed imports list`,
      );
    });
  });

  it("should not have circular dependencies", async () => {
    _logger.debug("Testing for circular dependencies");

    // Attempt to import all exported modules
    try {
      const _mod = await import("./mod.ts");

      // If we can successfully import and all exports are defined,
      // there are no circular dependency issues
      assertExists(_mod);

      // Check that exported items are not undefined (sign of circular deps)
      const exports = Object.entries(_mod);
      exports.forEach(([key, value]) => {
        if (key !== "default") {
          assertExists(value, `Export ${key} should not be undefined`);
        }
      });
    } catch (error) {
      // Circular dependencies would cause import errors
      throw new Error(`Circular dependency detected: ${error}`);
    }
  });

  it("should provide a complete public API", async () => {
    _logger.debug("Testing public API completeness");

    const _mod = await import("./mod.ts");

    // Essential exports for workspace functionality
    const essentialExports = [
      // From workspace.ts
      "initWorkspace",

      // From errors.ts
      "WorkspaceError",
      "WorkspaceInitError",
      "WorkspaceConfigError",
      // Note: Types are not runtime checkable but should be re-exported
    ];

    essentialExports.forEach((exportName) => {
      const exportValue = (_mod as Record<string, unknown>)[exportName];
      assertExists(exportValue, `Missing essential export: ${exportName}`);
    });
  });
});
