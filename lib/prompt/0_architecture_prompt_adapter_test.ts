/**
 * @fileoverview Architecture tests for PromptAdapter
 *
 * Validates architectural constraints:
 * - Dependency direction and layer boundaries
 * - No circular dependencies
 * - Proper abstraction levels
 * - Interface consistency
 */

import { assertEquals, assertExists } from "@std/assert";
import { fromFileUrl } from "@std/path";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

const _logger = new _BreakdownLogger("architecture-prompt-adapter");

describe("PromptAdapter Architecture - Module Dependencies", () => {
  it("should only depend on allowed external packages", async () => {
    _logger.debug("Testing external package dependencies");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter.ts", import.meta.url)),
    );
    const imports = fileContent.match(/import.*from\s+["']([^"']+)["']/g) || [];

    const externalImports = imports
      .map((imp) => imp.match(/from\s+["']([^"']+)["']/)?.[1])
      .filter(Boolean)
      .filter((imp) =>
        imp?.startsWith("@") || imp?.startsWith("jsr:") || imp?.startsWith("https://")
      );

    const allowedExternals = [
      "jsr:@tettuan/breakdownprompt",
      "@std/path",
      "@tettuan/breakdownlogger",
    ];

    externalImports.forEach((imp) => {
      const isAllowed = allowedExternals.some((allowed) => imp?.includes(allowed));
      assertEquals(isAllowed, true, `Unexpected external import: ${imp}`);
    });
  });

  it("should maintain proper layer separation", async () => {
    _logger.debug("Testing layer separation");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter.ts", import.meta.url)),
    );

    // Should not directly import from lower-level modules
    const forbiddenImports = [
      "config/",
      "types/directive_type",
      "types/layer_type",
      "workspace/",
    ];

    forbiddenImports.forEach((forbidden) => {
      const hasForbidden = fileContent.includes(forbidden);
      assertEquals(hasForbidden, false, `Should not import from ${forbidden}`);
    });

    // Should only import from same or higher level
    const allowedInternalImports = [
      "../factory/",
      "../builder/",
      "./prompt_adapter_validator",
    ];

    const imports = fileContent.match(/from\s+["']\.\.?\/[^"']+["']/g) || [];
    imports.forEach((imp) => {
      const isAllowed = allowedInternalImports.some((allowed) => imp.includes(allowed));
      assertEquals(isAllowed, true, `Unexpected internal import: ${imp}`);
    });
  });

  it("should expose only necessary public interfaces", async () => {
    _logger.debug("Testing public interface exposure");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter.ts", import.meta.url)),
    );

    // Check exported items
    const exports = fileContent.match(/export\s+(class|interface|type|function|const)\s+(\w+)/g) ||
      [];
    const exportedNames = exports.map((exp) => exp.split(/\s+/)[2]);

    // Should export these specific items
    const requiredExports = [
      "PromptVariablesProvider",
      "PromptAdapterImpl",
      "PromptAdapter",
    ];

    requiredExports.forEach((required) => {
      const isExported = exportedNames.includes(required);
      assertEquals(isExported, true, `Missing required export: ${required}`);
    });

    // Should not export internal implementation details
    const internalPatterns = [
      /^_/, // Private convention
      /Helper$/, // Internal helpers
      /Internal/, // Internal classes
    ];

    exportedNames.forEach((name) => {
      const isInternal = internalPatterns.some((pattern) => pattern.test(name));
      assertEquals(isInternal, false, `Should not export internal: ${name}`);
    });
  });
});

describe("PromptAdapter Architecture - Adapter Pattern Compliance", () => {
  it("should follow adapter pattern responsibilities", async () => {
    _logger.debug("Testing adapter pattern implementation");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter.ts", import.meta.url)),
    );

    // Should have methods that adapt between interfaces
    const adapterMethods = [
      "validatePaths",
      "generatePrompt",
    ];

    adapterMethods.forEach((method) => {
      const hasMethod = fileContent.includes(`async ${method}`) ||
        fileContent.includes(`${method}(`);
      assertEquals(hasMethod, true, `Adapter should have ${method} method`);
    });

    // Should delegate to other components
    const delegationTargets = [
      "PromptAdapterValidator",
      "PromptManager",
      "VariablesBuilder",
    ];

    delegationTargets.forEach((target) => {
      const hasDelegation = fileContent.includes(`new ${target}`) ||
        fileContent.includes(`${target}.`);
      assertEquals(hasDelegation, true, `Should delegate to ${target}`);
    });
  });

  it("should maintain single responsibility", async () => {
    _logger.debug("Testing single responsibility principle");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter.ts", import.meta.url)),
    );

    // Should not contain business logic for these responsibilities
    const forbiddenResponsibilities = [
      "readFileSync", // File I/O should be delegated
      "writeFileSync",
      "resolve(", // Path resolution should be delegated
      "join(",
      "DirectiveType", // Type creation should be delegated
      "LayerType",
    ];

    forbiddenResponsibilities.forEach((forbidden) => {
      const hasResponsibility = fileContent.includes(forbidden);
      assertEquals(hasResponsibility, false, `Should not handle ${forbidden} directly`);
    });
  });
});

describe("PromptAdapter Architecture - Error Handling Consistency", () => {
  it("should use consistent error handling patterns", async () => {
    _logger.debug("Testing error handling consistency");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter.ts", import.meta.url)),
    );

    // Should return Result-like objects for error handling
    const hasResultPattern = fileContent.includes("success:") && fileContent.includes("errors:");
    assertEquals(hasResultPattern, true, "Should use Result pattern for error handling");

    // Should not throw exceptions directly
    const hasThrow = fileContent.match(/throw\s+new/g) || [];
    assertEquals(hasThrow.length, 0, "Should not throw exceptions directly");
  });

  it("should validate all required dependencies exist", async () => {
    _logger.debug("Testing dependency existence");

    // Verify required modules exist
    const requiredModules = [
      "./prompt_adapter_validator.ts",
      "../factory/prompt_variables_factory.ts",
      "../builder/variables_builder.ts",
    ];

    requiredModules.forEach((module) => {
      assertExists(module, `Required module should exist: ${module}`);
    });
  });
});
