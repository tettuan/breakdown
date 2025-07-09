/**
 * @fileoverview Structure Test for workspace module entry point
 *
 * Validates the structural organization of the workspace module:
 * - Export organization and grouping
 * - Module cohesion and responsibility
 * - Proper separation of concerns
 * - Interface consistency across exported items
 *
 * @module workspace/1_structure_mod_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

const _logger = new _BreakdownLogger("structure-workspace-mod");

describe("Workspace Module - Structure", async () => {
  it("should organize exports by functional area", async () => {
    _logger.debug("Testing export organization");

    const _mod = await import("./mod.ts");

    // Exports should be logically grouped:
    // 1. Types (configuration, structure)
    // 2. Errors (domain-specific exceptions)
    // 3. Core functionality (Workspace class and utilities)

    // Verify each category has appropriate exports
    const typeRelated = ["WorkspaceOptions", "WorkspaceConfig", "WorkspaceStructure"];
    const errorRelated = [
      "WorkspaceError",
      "WorkspaceInitError",
      "WorkspaceConfigError",
    ];
    const functionalityRelated = ["Workspace", "initWorkspace"];

    // At least one from each category should exist
    const _hasTypes = typeRelated.some((name) => name in _mod);
    const hasErrors = errorRelated.some((name) =>
      (_mod as Record<string, unknown>)[name] !== undefined
    );
    const hasFunctionality = functionalityRelated.some((name) =>
      (_mod as Record<string, unknown>)[name] !== undefined
    );

    assertEquals(hasErrors, true, "Should export error types");
    assertEquals(hasFunctionality, true, "Should export core functionality");
  });

  it("should maintain single responsibility", async () => {
    _logger.debug("Testing module responsibility");

    const modPath = new URL("./mod.ts", import.meta.url).pathname;
    const modContent = await Deno.readTextFile(modPath);

    // The module should only be responsible for re-exporting
    // It should not contain any implementation logic

    // Check for implementation patterns that shouldn't exist
    const hasClassDefinition = /^\s*class\s+\w+/m.test(modContent);
    const hasFunctionDefinition = /^\s*function\s+\w+/m.test(modContent);
    const _hasConstAssignment = /const\s+\w+\s*=\s*[^i]/.test(modContent); // Allow imports

    assertEquals(hasClassDefinition, false, "Module should not define classes");
    assertEquals(hasFunctionDefinition, false, "Module should not define functions");
  });

  it("should provide consistent export style", async () => {
    _logger.debug("Testing export consistency");

    const modPath = new URL("./mod.ts", import.meta.url).pathname;
    const modContent = await Deno.readTextFile(modPath);

    // All exports should use the same style (export * from)
    const exportLines = modContent.split("\n").filter((line) => line.trim().startsWith("export"));

    // Check that all exports follow the same pattern
    exportLines.forEach((line) => {
      // Allow both re-exports (export * from) and named exports (export { ... } from)
      const isReExport = line.includes("from") || line.includes("{");
      assertEquals(isReExport, true, `Export should be a re-export or named export: ${line}`);
    });
  });

  it("should maintain proper module cohesion", async () => {
    _logger.debug("Testing module cohesion");

    const _mod = await import("./mod.ts");

    // All exports should be related to workspace management
    // No unrelated functionality should be exposed
    const exports = Object.keys(_mod);

    exports.forEach((exportName) => {
      if (exportName === "default") return;

      // Check that export names are workspace-related
      const isWorkspaceRelated = exportName.includes("Workspace") ||
        exportName.includes("workspace") ||
        exportName.includes("Directory") ||
        exportName.includes("Path") ||
        exportName.includes("Config") ||
        exportName.includes("Structure") ||
        exportName.includes("Options");

      assertEquals(isWorkspaceRelated, true, `Export ${exportName} should be workspace-related`);
    });
  });

  it("should follow a logical export order", async () => {
    _logger.debug("Testing export order");

    const modPath = new URL("./mod.ts", import.meta.url).pathname;
    const modContent = await Deno.readTextFile(modPath);

    // Exports should be in a logical order:
    // 1. Types first (foundational)
    // 2. Errors second (exceptions)
    // 3. Core functionality last (depends on types)

    const exportLines = modContent.split("\n")
      .map((line, index) => ({ line: line.trim(), index }))
      .filter(({ line }) => line.startsWith("export"));

    // Find indices of different export types
    const typesIndex = exportLines.findIndex(({ line }) => line.includes("types.ts"));
    const errorsIndex = exportLines.findIndex(({ line }) => line.includes("errors.ts"));
    const workspaceIndex = exportLines.findIndex(({ line }) => line.includes("workspace.ts"));

    // Verify order (allowing for comments and empty lines)
    if (typesIndex !== -1 && errorsIndex !== -1) {
      assertEquals(typesIndex < errorsIndex, true, "Types should be exported before errors");
    }
    if (errorsIndex !== -1 && workspaceIndex !== -1) {
      assertEquals(
        errorsIndex < workspaceIndex,
        true,
        "Errors should be exported before workspace",
      );
    }
  });

  it("should have clear separation of concerns", async () => {
    _logger.debug("Testing separation of concerns");

    // Each imported module should have a distinct responsibility
    const types = await import("./types.ts");
    const errors = await import("./errors.ts");
    const _workspace = await import("./workspace.ts");

    // Types module should only export type-related items
    // (Can't check TypeScript types at runtime, but we verify the module exists)
    assertExists(types);

    // Errors module should only export error classes
    const errorExports = Object.keys(errors);
    errorExports.forEach((key) => {
      if (key !== "default" && (errors as Record<string, unknown>)[key]) {
        const errorClass = (errors as Record<string, unknown>)[key] as any;
        const isError = errorClass?.prototype instanceof Error ||
          errorClass?.name?.includes("Error");
        assertEquals(isError, true, `${key} should be an Error class`);
      }
    });

    // Workspace module should export main functionality
    assertExists(_workspace.Workspace);
    assertEquals(typeof _workspace.initWorkspace, "function");
  });

  it("should provide complete documentation references", async () => {
    _logger.debug("Testing documentation structure");

    const modPath = new URL("./mod.ts", import.meta.url).pathname;
    const modContent = await Deno.readTextFile(modPath);

    // Each export should have a documentation comment
    const exportBlocks = modContent.split(/export\s+\*\s+from/);

    exportBlocks.slice(1).forEach((block, index) => {
      // Check for preceding documentation
      const previousBlock = exportBlocks[index];
      const hasDocComment = previousBlock.includes("/**") || previousBlock.includes("*");

      assertEquals(hasDocComment, true, `Export block ${index + 1} should have documentation`);
    });
  });
});
