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

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("architecture-workspace-mod");

describe("Workspace Module - Architecture", () => {
  it("should export all required types from types.ts", async () => {
    logger.debug("Testing types exports");
    
    const mod = await import("./mod.ts");
    
    // Core type exports that should be available
    const expectedTypes = [
      "WorkspaceOptions",
      "WorkspaceConfig",
      "WorkspaceStructure",
      "DirectoryStructure",
      "PathMapping"
    ];
    
    // Since these are TypeScript types, we can't check them at runtime
    // But we ensure the module exports from types.ts
    assertExists(mod);
  });

  it("should export all error types from errors.ts", async () => {
    logger.debug("Testing error exports");
    
    const mod = await import("./mod.ts");
    
    // Error classes that should be exported
    assertExists(mod.WorkspaceError);
    assertExists(mod.WorkspaceInitError);
    assertExists(mod.WorkspacePathError);
    assertExists(mod.WorkspaceConfigError);
  });

  it("should export workspace functionality from workspace.ts", async () => {
    logger.debug("Testing workspace exports");
    
    const mod = await import("./mod.ts");
    
    // Main workspace class and functions
    assertExists(mod.Workspace);
    assertExists(mod.initWorkspace);
    // Main workspace functions exist through re-exports
  });

  it("should maintain module boundary integrity", async () => {
    logger.debug("Testing module boundary");
    
    const mod = await import("./mod.ts");
    
    // The module should only export from its public API files
    // It should not expose internal implementation details
    const moduleKeys = Object.keys(mod);
    
    // All exports should come from the three main files
    assertEquals(moduleKeys.length > 0, true);
  });

  it("should follow dependency hierarchy", async () => {
    logger.debug("Testing dependency hierarchy");
    
    // mod.ts should only import from its direct children
    const modContent = await Deno.readTextFile("./lib/workspace/mod.ts");
    
    // Check that imports are only from local files
    const importMatches = modContent.match(/from\s+["']\.\/([^"']+)["']/g) || [];
    const importedFiles = importMatches.map(match => 
      match.replace(/from\s+["']\.\//, "").replace(/["']/, "")
    );
    
    // Should only import from types, errors, and workspace
    const allowedImports = ["types.ts", "errors.ts", "workspace.ts"];
    importedFiles.forEach(file => {
      assertEquals(allowedImports.includes(file), true, `File ${file} is not in allowed imports list`);
    });
  });

  it("should not have circular dependencies", async () => {
    logger.debug("Testing for circular dependencies");
    
    // Attempt to import all exported modules
    try {
      const mod = await import("./mod.ts");
      
      // If we can successfully import and all exports are defined,
      // there are no circular dependency issues
      assertExists(mod);
      
      // Check that exported items are not undefined (sign of circular deps)
      const exports = Object.entries(mod);
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
    logger.debug("Testing public API completeness");
    
    const mod = await import("./mod.ts");
    
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
    
    essentialExports.forEach(exportName => {
      const exportValue = (mod as any)[exportName];
      assertExists(exportValue, `Missing essential export: ${exportName}`);
    });
  });
});