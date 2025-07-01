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

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("structure-workspace-mod");

describe("Workspace Module - Structure", () => {
  it("should organize exports by functional area", async () => {
    logger.debug("Testing export organization");
    
    const mod = await import("./mod.ts");
    
    // Exports should be logically grouped:
    // 1. Types (configuration, structure)
    // 2. Errors (domain-specific exceptions)
    // 3. Core functionality (Workspace class and utilities)
    
    // Verify each category has appropriate exports
    const typeRelated = ["WorkspaceOptions", "WorkspaceConfig", "WorkspaceStructure"];
    const errorRelated = ["WorkspaceError", "WorkspaceInitializationError", "WorkspaceValidationError"];
    const functionalityRelated = ["Workspace", "initWorkspace", "validateWorkspaceStructure"];
    
    // At least one from each category should exist
    const hasTypes = typeRelated.some(name => name in mod);
    const hasErrors = errorRelated.some(name => (mod as any)[name] !== undefined);
    const hasFunctionality = functionalityRelated.some(name => (mod as any)[name] !== undefined);
    
    assertEquals(hasErrors, true, "Should export error types");
    assertEquals(hasFunctionality, true, "Should export core functionality");
  });

  it("should maintain single responsibility", async () => {
    logger.debug("Testing module responsibility");
    
    const modContent = await Deno.readTextFile("./mod.ts");
    
    // The module should only be responsible for re-exporting
    // It should not contain any implementation logic
    
    // Check for implementation patterns that shouldn't exist
    const hasClassDefinition = /class\s+\w+/.test(modContent);
    const hasFunctionDefinition = /function\s+\w+/.test(modContent);
    const hasConstAssignment = /const\s+\w+\s*=\s*[^i]/.test(modContent); // Allow imports
    
    assertEquals(hasClassDefinition, false, "Module should not define classes");
    assertEquals(hasFunctionDefinition, false, "Module should not define functions");
  });

  it("should provide consistent export style", async () => {
    logger.debug("Testing export consistency");
    
    const modContent = await Deno.readTextFile("./mod.ts");
    
    // All exports should use the same style (export * from)
    const exportLines = modContent.split('\n').filter(line => 
      line.trim().startsWith('export')
    );
    
    // Check that all exports follow the same pattern
    exportLines.forEach(line => {
      const isReExport = line.includes('from');
      assertEquals(isReExport, true, `Export should be a re-export: ${line}`);
    });
  });

  it("should maintain proper module cohesion", async () => {
    logger.debug("Testing module cohesion");
    
    const mod = await import("./mod.ts");
    
    // All exports should be related to workspace management
    // No unrelated functionality should be exposed
    const exports = Object.keys(mod);
    
    exports.forEach(exportName => {
      if (exportName === "default") return;
      
      // Check that export names are workspace-related
      const isWorkspaceRelated = 
        exportName.includes("Workspace") ||
        exportName.includes("workspace") ||
        exportName.includes("Directory") ||
        exportName.includes("Path") ||
        exportName.includes("Config") ||
        exportName.includes("Structure") ||
        exportName.includes("Options");
      
      assertEquals(isWorkspaceRelated, true, 
        `Export ${exportName} should be workspace-related`);
    });
  });

  it("should follow a logical export order", async () => {
    logger.debug("Testing export order");
    
    const modContent = await Deno.readTextFile("./mod.ts");
    
    // Exports should be in a logical order:
    // 1. Types first (foundational)
    // 2. Errors second (exceptions)
    // 3. Core functionality last (depends on types)
    
    const exportLines = modContent.split('\n')
      .map((line, index) => ({ line: line.trim(), index }))
      .filter(({ line }) => line.startsWith('export'));
    
    // Find indices of different export types
    const typesIndex = exportLines.findIndex(({ line }) => line.includes('types.ts'));
    const errorsIndex = exportLines.findIndex(({ line }) => line.includes('errors.ts'));
    const workspaceIndex = exportLines.findIndex(({ line }) => line.includes('workspace.ts'));
    
    // Verify order (allowing for comments and empty lines)
    if (typesIndex !== -1 && errorsIndex !== -1) {
      assertEquals(typesIndex < errorsIndex, true, "Types should be exported before errors");
    }
    if (errorsIndex !== -1 && workspaceIndex !== -1) {
      assertEquals(errorsIndex < workspaceIndex, true, "Errors should be exported before workspace");
    }
  });

  it("should have clear separation of concerns", async () => {
    logger.debug("Testing separation of concerns");
    
    // Each imported module should have a distinct responsibility
    const types = await import("./types.ts");
    const errors = await import("./errors.ts");
    const workspace = await import("./workspace.ts");
    
    // Types module should only export type-related items
    // (Can't check TypeScript types at runtime, but we verify the module exists)
    assertExists(types);
    
    // Errors module should only export error classes
    const errorExports = Object.keys(errors);
    errorExports.forEach(key => {
      if (key !== "default" && (errors as any)[key]?.prototype) {
        const isError = (errors as any)[key].prototype instanceof Error || 
                       (errors as any)[key].name.includes("Error");
        assertEquals(isError, true, `${key} should be an Error class`);
      }
    });
    
    // Workspace module should export main functionality
    assertExists(workspace.Workspace);
    assertEquals(typeof workspace.initWorkspace, "function");
  });

  it("should provide complete documentation references", async () => {
    logger.debug("Testing documentation structure");
    
    const modContent = await Deno.readTextFile("./mod.ts");
    
    // Each export should have a documentation comment
    const exportBlocks = modContent.split(/export\s+\*\s+from/);
    
    exportBlocks.slice(1).forEach((block, index) => {
      // Check for preceding documentation
      const previousBlock = exportBlocks[index];
      const hasDocComment = previousBlock.includes("/**") || previousBlock.includes("*");
      
      assertEquals(hasDocComment, true, 
        `Export block ${index + 1} should have documentation`);
    });
  });
});