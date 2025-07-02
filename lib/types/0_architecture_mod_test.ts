/**
 * @fileoverview Architecture tests for types module (_mod.ts)
 *
 * Tests architectural constraints and dependencies:
 * - Module boundary enforcement
 * - Export structure validation
 * - Dependency direction verification
 * - Type safety architecture
 * - Totality principle compliance
 *
 * @module types/mod_architecture_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const _logger = new BreakdownLogger("types-mod-architecture");

describe("Architecture: Module boundary enforcement", () => {
  it("should export all public types from the module", async () => {
    _logger.debug("Testing module exports completeness");

    const _mod = await import("./mod.ts");

    // New Totality-compliant types
    assertExists(_mod.DirectiveType, "DirectiveType must be exported");
    assertExists(_mod.TwoParamsDirectivePattern, "TwoParamsDirectivePattern must be exported");
    assertExists(_mod.LayerType, "LayerType must be exported");
    assertExists(_mod.TwoParamsLayerTypePattern, "TwoParamsLayerTypePattern must be exported");
    assertExists(_mod.ConfigProfileName, "ConfigProfileName must be exported");
    assertExists(_mod.TypeFactory, "TypeFactory must be exported");

    // PromptVariables types
    assertExists(_mod.StandardVariable, "StandardVariable must be exported");
    assertExists(_mod.FilePathVariable, "FilePathVariable must be exported");
    assertExists(_mod.StdinVariable, "StdinVariable must be exported");
    assertExists(_mod.UserVariable, "UserVariable must be exported");
    assertExists(_mod.StandardVariableName, "StandardVariableName must be exported");
    assertExists(_mod.FilePathVariableName, "FilePathVariableName must be exported");
    assertExists(_mod.StdinVariableName, "StdinVariableName must be exported");
    assertExists(_mod.toPromptParamsVariables, "toPromptParamsVariables must be exported");
    assertExists(_mod.createPromptParams, "createPromptParams must be exported");

    // Result types
    assertExists(_mod.ResultStatus, "ResultStatus must be exported");
    assertExists(_mod.ok, "ok must be exported");
    assertExists(_mod.error, "error must be exported");
    assertExists(_mod.isOk, "isOk must be exported");
    assertExists(_mod.isError, "isError must be exported");
    assertExists(_mod.map, "map must be exported");
    assertExists(_mod.chain, "chain must be exported");
    assertExists(_mod.getOrElse, "getOrElse must be exported");
    assertExists(_mod.all, "all must be exported");

    // ParamsCustomConfig types
    assertExists(_mod.ConfigError, "ConfigError must be exported");
    assertExists(_mod.ParamsCustomConfig, "ParamsCustomConfig must be exported");

    // Legacy types (deprecated but still exported)
    assertExists(_mod.DemonstrativeTypeFactory, "DemonstrativeTypeFactory must be exported");
    assertExists(_mod.LegacyLayerTypeFactory, "LegacyLayerTypeFactory must be exported");
    assertExists(_mod.DemonstrativeTypeGuards, "DemonstrativeTypeGuards must be exported");
    assertExists(_mod.LegacyLayerTypeGuards, "LegacyLayerTypeGuards must be exported");

    _logger.debug("Module exports validation completed");
  });

  it("should not expose internal implementation details", async () => {
    _logger.debug("Testing encapsulation boundaries");

    const _mod = await import("./mod.ts");

    // These should not be exposed at module level
    const unexpectedExports = [
      "_internal",
      "private",
      "INTERNAL_CONSTANT",
      "internalFunction",
      "PrivateClass",
    ];

    for (const unexpectedExport of unexpectedExports) {
      assertEquals(
        (mod as unknown)[unexpectedExport],
        undefined,
        `${unexpectedExport} should not be exposed`,
      );
    }

    _logger.debug("Encapsulation boundary verification completed");
  });
});

describe("Architecture: Export structure validation", () => {
  it("should group exports by functionality", async () => {
    _logger.debug("Testing export organization");

    const _mod = await import("./mod.ts");

    // Totality types group
    const totalityTypes = [
      "DirectiveType",
      "LayerType",
      "ConfigProfileName",
      "TypeFactory",
    ];

    // PromptVariables group
    const promptVariableTypes = [
      "StandardVariable",
      "FilePathVariable",
      "StdinVariable",
      "UserVariable",
    ];

    // Result utilities group
    const resultUtilities = [
      "ok",
      "error",
      "isOk",
      "isError",
      "map",
      "chain",
      "getOrElse",
      "all",
    ];

    // Verify all groups are exported
    for (const type of totalityTypes) {
      assertExists((mod as unknown)[type], `Totality type ${type} must be exported`);
    }

    for (const type of promptVariableTypes) {
      assertExists((mod as unknown)[type], `PromptVariable type ${type} must be exported`);
    }

    for (const util of resultUtilities) {
      assertExists((mod as unknown)[util], `Result utility ${util} must be exported`);
    }

    _logger.debug("Export organization validation completed");
  });

  it("should maintain backward compatibility for legacy types", async () => {
    _logger.debug("Testing legacy type compatibility");

    const _mod = await import("./mod.ts");

    // Legacy type aliases are types, not runtime values
    // They cannot be tested at runtime since TypeScript types don't exist in JavaScript
    // We verify their existence through import checks in the module source
    const moduleSource = await Deno.readTextFile("./lib/types/_mod.ts");
    assertEquals(
      moduleSource.includes("DemonstrativeType") && moduleSource.includes("export type"),
      true,
      "DemonstrativeType type alias must be exported",
    );
    assertEquals(
      moduleSource.includes("LegacyLayerType") && moduleSource.includes("export type"),
      true,
      "LegacyLayerType type alias must be exported",
    );

    _logger.debug("Legacy compatibility verification completed");
  });
});

describe("Architecture: Dependency direction verification", () => {
  it("should not import from higher-level modules", async () => {
    _logger.debug("Testing dependency direction constraints");

    // Read the module source to check imports
    const moduleSource = await Deno.readTextFile("./lib/types/_mod.ts");

    // Should not import from these higher-level modules
    const forbiddenImports = [
      'from "../cli/',
      'from "../commands/',
      'from "../io/',
      'from "../processor/',
      'from "../../cli/',
      'from "../../commands/',
    ];

    for (const forbidden of forbiddenImports) {
      assertEquals(
        moduleSource.includes(forbidden),
        false,
        `Should not import ${forbidden}`,
      );
    }

    _logger.debug("Dependency direction verification completed");
  });

  it("should only import from allowed modules", async () => {
    _logger.debug("Testing allowed dependencies");

    const moduleSource = await Deno.readTextFile("./lib/types/_mod.ts");

    // Allowed internal imports
    const allowedPatterns = [
      /from\s+"\.\/[^"]+"/g, // Same directory imports
      /from\s+"\.\.\/factory\/prompt_variables_factory\.ts"/g, // Specific factory import
      /from\s+"@tettuan\/breakdownparams"/g, // External dependency
      /from\s+"@tettuan\/breakdown\/lib\/types\/mod\.ts"/g, // Self-import in tests
    ];

    // Extract all imports
    const importMatches = moduleSource.matchAll(/from\s+"[^"]+"/g);

    for (const match of importMatches) {
      const importPath = match[0];
      const isAllowed = false;

      // Reset RegExp lastIndex before testing
      for (const pattern of allowedPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(importPath)) {
          isAllowed = true;
          break;
        }
      }

      assertEquals(
        isAllowed,
        true,
        `Import ${importPath} should match allowed patterns`,
      );
    }

    _logger.debug("Allowed dependencies verification completed");
  });
});

describe("Architecture: Type safety architecture", () => {
  it("should enforce Totality principle through type exports", async () => {
    _logger.debug("Testing Totality principle enforcement");

    const _mod = await import("./mod.ts");

    // Totality types should have factory methods
    assertEquals(
      typeof _mod.DirectiveType.create,
      "function",
      "DirectiveType should have create method",
    );
    assertEquals(typeof _mod.LayerType.create, "function", "LayerType should have create method");
    assertEquals(
      typeof _mod.ConfigProfileName.create,
      "function",
      "ConfigProfileName should have create method",
    );

    // TypeFactory should provide centralized type creation
    const _factory = _mod.TypeFactory;
    assertExists(factory, "TypeFactory must be exported");
    assertEquals(typeof factory, "function", "TypeFactory should be a constructor");

    _logger.debug("Totality principle enforcement verified");
  });

  it("should provide Result type for error handling", async () => {
    _logger.debug("Testing Result type architecture");

    const _mod = await import("./mod.ts");

    // Result constructors
    assertExists(_mod.ok, "ok constructor must be exported");
    assertExists(_mod.error, "error constructor must be exported");

    // Result utilities
    assertExists(_mod.isOk, "isOk utility must be exported");
    assertExists(_mod.isError, "isError utility must be exported");

    // Functional utilities
    assertExists(_mod.map, "map utility must be exported");
    assertExists(_mod.chain, "chain utility must be exported");
    assertExists(_mod.getOrElse, "getOrElse utility must be exported");
    assertExists(_mod.all, "all utility must be exported");

    // Test basic Result functionality
    const okResult = _mod.ok(42);
    assertEquals(_mod.isOk(okResult), true, "ok() should create success Result");

    const errorResult = _mod.error("test error");
    assertEquals(_mod.isError(errorResult), true, "error() should create error Result");

    _logger.debug("Result type architecture verified");
  });
});

describe("Architecture: Module cohesion and coupling", () => {
  it("should have high cohesion within type module", async () => {
    _logger.debug("Testing module cohesion");

    const _mod = await import("./mod.ts");

    // All exports should be type-related
    const exportNames = Object.keys(_mod);

    for (const exportName of exportNames) {
      // Skip symbols and internal properties
      if (typeof exportName !== "string" || exportName.startsWith("_")) continue;

      // All exports should be type constructors, utilities, or type guards
      const exportValue = (mod as unknown)[exportName];
      const isTypeRelated = typeof exportValue === "function" || // Constructors, utilities
        typeof exportValue === "object" || // Enums, constants
        exportValue === undefined; // Type aliases

      assertEquals(
        isTypeRelated,
        true,
        `Export ${exportName} should be type-related`,
      );
    }

    _logger.debug("Module cohesion verification completed");
  });

  it("should have loose coupling with other modules", async () => {
    _logger.debug("Testing module coupling");

    // Count external dependencies
    const moduleSource = await Deno.readTextFile("./lib/types/_mod.ts");
    const externalImports = moduleSource.match(/from\s+"[^.][^"]+"/g) || [];

    // Should have minimal external dependencies (allowing for reasonable JSR package dependencies)
    assertEquals(
      externalImports.length <= 4,
      true,
      `Should have minimal external dependencies (found ${externalImports.length})`,
    );

    // Verify no circular dependencies by checking that imported modules don't import back
    // This is a simplified check - real circular dependency detection would be more complex
    const internalImports = moduleSource.match(/from\s+"\.[^"]+"/g) || [];

    for (const imp of internalImports) {
      const importPath = imp.match(/"([^"]+)"/)?.[1];
      if (!importPath || !importPath.endsWith(".ts")) continue;

      try {
        const importedSource = await Deno.readTextFile(`./lib/types/${importPath.slice(2)}`);
        assertEquals(
          importedSource.includes('from "./mod.ts"'),
          false,
          `${importPath} should not import back to _mod.ts`,
        );
      } catch {
        // File might not exist or be accessible, skip
      }
    }

    _logger.debug("Module coupling verification completed");
  });
});

describe("Architecture: Documentation and contracts", () => {
  it("should have comprehensive module documentation", async () => {
    _logger.debug("Testing module documentation");

    const moduleSource = await Deno.readTextFile("./lib/types/_mod.ts");

    // Should have module-level JSDoc
    assertEquals(
      moduleSource.includes("@module"),
      true,
      "Module should have @module documentation",
    );

    // Should have examples
    assertEquals(
      moduleSource.includes("@example"),
      true,
      "Module should include usage examples",
    );

    // Should document both new and legacy usage
    assertEquals(
      moduleSource.includes("Totality-compliant"),
      true,
      "Should document new Totality approach",
    );

    assertEquals(
      moduleSource.includes("deprecated"),
      true,
      "Should document deprecated features",
    );

    _logger.debug("Module documentation verification completed");
  });

  it("should clearly mark deprecated exports", async () => {
    _logger.debug("Testing deprecation markers");

    const moduleSource = await Deno.readTextFile("./lib/types/_mod.ts");

    // Check specific deprecated exports
    const deprecatedExports = [
      "DemonstrativeType",
      "LegacyLayerType",
      "DemonstrativeTypeFactory",
      "LegacyLayerTypeFactory",
    ];

    for (const deprecated of deprecatedExports) {
      const exportSection = moduleSource.indexOf(`export.*${deprecated}`);
      if (exportSection !== -1) {
        // Find the nearest @deprecated comment before the export
        const precedingSection = moduleSource.slice(
          Math.max(0, exportSection - 500),
          exportSection,
        );
        assertEquals(
          precedingSection.includes("@deprecated"),
          true,
          `${deprecated} should have @deprecated documentation`,
        );
      }
    }

    _logger.debug("Deprecation markers verification completed");
  });
});
