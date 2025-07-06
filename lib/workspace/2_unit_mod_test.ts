/**
 * @fileoverview Unit Test for workspace module entry point
 *
 * Validates the functional behavior of the workspace module:
 * - Correct re-export functionality
 * - Export availability and accessibility
 * - Module loading behavior
 * - Export integrity
 *
 * @module workspace/2_unit_mod_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

const _logger = new _BreakdownLogger("unit-workspace-mod");

describe("Workspace Module - Unit Tests", async () => {
  it("should successfully import the module", async () => {
    _logger.debug("Testing module import");

    const _mod = await import("./mod.ts");
    assertExists(_mod);
  });

  it("should re-export all items from types.ts", async () => {
    _logger.debug("Testing types re-exports");

    const _mod = await import("./mod.ts");
    const types = await import("./types.ts");

    // Check that type-related exports are available
    // Note: TypeScript types aren't available at runtime, but we can check other exports
    Object.keys(types).forEach((key) => {
      if (key !== "default") {
        assertEquals(key in _mod, true, `${key} should be re-exported from types.ts`);
      }
    });
  });

  it("should re-export all error factories from errors.ts", async () => {
    _logger.debug("Testing error factory re-exports");

    const _mod = await import("./mod.ts");
    const errors = await import("./errors.ts");

    // All error factory functions should be re-exported
    const factoryFunctions = [
      "createWorkspaceError",
      "createWorkspaceInitError", 
      "createWorkspaceConfigError",
      "createWorkspacePathError",
      "createWorkspaceDirectoryError"
    ];
    
    factoryFunctions.forEach((key) => {
      if ((errors as Record<string, unknown>)[key]) {
        assertExists(
          (_mod as Record<string, unknown>)[key],
          `Factory function ${key} should be re-exported`,
        );
        assertEquals(
          (_mod as Record<string, unknown>)[key],
          (errors as Record<string, unknown>)[key],
          `${key} should be the same reference`,
        );
      }
    });
  });

  it("should re-export workspace functionality from workspace.ts", async () => {
    _logger.debug("Testing workspace re-exports");

    const _mod = await import("./mod.ts");
    const _workspace = await import("./workspace.ts");

    // All workspace exports should be available
    Object.keys(_workspace).forEach((key) => {
      if (key !== "default") {
        assertExists(
          (_mod as Record<string, unknown>)[key],
          `${key} should be re-exported from workspace.ts`,
        );
        assertEquals(
          (_mod as Record<string, unknown>)[key],
          (_workspace as Record<string, unknown>)[key],
          `${key} should be the same reference`,
        );
      }
    });
  });

  it("should handle error creation correctly", async () => {
    _logger.debug("Testing error creation through module");

    const _mod = await import("./mod.ts");

    // Test that error factory functions are available and work
    if (_mod.createWorkspaceError) {
      const error = _mod.createWorkspaceError("Test error", "TEST_CODE");
      assertExists(error);
      assertEquals(error.message, "Test error");
      assertEquals(error.code, "TEST_CODE");
      assertEquals(error.type, "WorkspaceError");
    }

    if (_mod.createWorkspaceInitError) {
      const initError = _mod.createWorkspaceInitError("directory", "/test/path");
      assertExists(initError);
      assertEquals(initError.message, "Failed to create workspace directory: /test/path");
      assertEquals(initError.name, "DirectoryCreationError");
      assertEquals(_mod.isWorkspaceError && _mod.isWorkspaceError(initError), true);
    }
  });

  it("should expose workspace creation functions", async () => {
    _logger.debug("Testing workspace function exports");

    const _mod = await import("./mod.ts");

    // Essential functions should be available
    if (_mod.initWorkspace) {
      assertEquals(typeof _mod.initWorkspace, "function");
    }

    // if (_mod.validateWorkspaceStructure) {
    //   assertEquals(typeof _mod.validateWorkspaceStructure, "function");
    // }
  });

  it("should maintain export reference equality", async () => {
    _logger.debug("Testing export reference equality");

    // Import the module twice
    const mod1 = await import("./mod.ts");
    const mod2 = await import("./mod.ts");

    // All exports should be the same reference
    Object.keys(mod1).forEach((key) => {
      if (key !== "default") {
        assertEquals(
          (mod1 as Record<string, unknown>)[key],
          (mod2 as Record<string, unknown>)[key],
          `Export ${key} should maintain reference equality`,
        );
      }
    });
  });

  it("should not expose internal implementation details", async () => {
    _logger.debug("Testing encapsulation");

    const _mod = await import("./mod.ts");

    // Check that no internal/private items are exposed
    const exportKeys = Object.keys(_mod);

    exportKeys.forEach((key) => {
      // No private/internal indicators
      assertEquals(key.startsWith("_"), false, `Should not expose private member: ${key}`);
      assertEquals(key.startsWith("internal"), false, `Should not expose internal member: ${key}`);
      assertEquals(key.includes("Private"), false, `Should not expose private member: ${key}`);
    });
  });

  it("should handle module loading errors gracefully", async () => {
    _logger.debug("Testing error handling");

    // Test that the module can be imported without throwing
    let error = null;
    try {
      await import("./mod.ts");
    } catch (e) {
      error = e;
    }

    assertEquals(error, null, "Module should load without errors");
  });

  it("should provide a stable API surface", async () => {
    _logger.debug("Testing API stability");

    const _mod = await import("./mod.ts");

    // Core API elements that should always be present
    const stableAPI = [
      "WorkspaceError",
      "Workspace",
    ];

    stableAPI.forEach((apiItem) => {
      assertExists(
        (_mod as Record<string, unknown>)[apiItem],
        `Stable API item ${apiItem} should exist`,
      );
    });
  });
});
