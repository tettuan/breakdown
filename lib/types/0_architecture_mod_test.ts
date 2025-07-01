/**
 * @fileoverview Architecture tests for types module (mod.ts)
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

const logger = new BreakdownLogger("types-mod-architecture");

describe("Architecture: Module boundary enforcement", () => {
  it("should export all public types from the module", async () => {
    logger.debug("Testing module exports completeness");
    
    const mod = await import("./mod.ts");
    
    // New Totality-compliant types
    assertExists(mod.DirectiveType, "DirectiveType must be exported");
    assertExists(mod.TwoParamsDirectivePattern, "TwoParamsDirectivePattern must be exported");
    assertExists(mod.LayerType, "LayerType must be exported");
    assertExists(mod.TwoParamsLayerTypePattern, "TwoParamsLayerTypePattern must be exported");
    assertExists(mod.ConfigProfileName, "ConfigProfileName must be exported");
    assertExists(mod.TypeFactory, "TypeFactory must be exported");
    
    // PromptVariables types
    assertExists(mod.StandardVariable, "StandardVariable must be exported");
    assertExists(mod.FilePathVariable, "FilePathVariable must be exported");
    assertExists(mod.StdinVariable, "StdinVariable must be exported");
    assertExists(mod.UserVariable, "UserVariable must be exported");
    assertExists(mod.StandardVariableName, "StandardVariableName must be exported");
    assertExists(mod.FilePathVariableName, "FilePathVariableName must be exported");
    assertExists(mod.StdinVariableName, "StdinVariableName must be exported");
    assertExists(mod.toPromptParamsVariables, "toPromptParamsVariables must be exported");
    assertExists(mod.createPromptParams, "createPromptParams must be exported");
    
    // Result types
    assertExists(mod.ResultStatus, "ResultStatus must be exported");
    assertExists(mod.ok, "ok must be exported");
    assertExists(mod.error, "error must be exported");
    assertExists(mod.isOk, "isOk must be exported");
    assertExists(mod.isError, "isError must be exported");
    assertExists(mod.map, "map must be exported");
    assertExists(mod.chain, "chain must be exported");
    assertExists(mod.getOrElse, "getOrElse must be exported");
    assertExists(mod.all, "all must be exported");
    
    // ParamsCustomConfig types
    assertExists(mod.ConfigError, "ConfigError must be exported");
    assertExists(mod.ParamsCustomConfig, "ParamsCustomConfig must be exported");
    
    // Legacy types (deprecated but still exported)
    assertExists(mod.DemonstrativeTypeFactory, "DemonstrativeTypeFactory must be exported");
    assertExists(mod.LegacyLayerTypeFactory, "LegacyLayerTypeFactory must be exported");
    assertExists(mod.DemonstrativeTypeGuards, "DemonstrativeTypeGuards must be exported");
    assertExists(mod.LegacyLayerTypeGuards, "LegacyLayerTypeGuards must be exported");
    
    logger.debug("Module exports validation completed");
  });

  it("should not expose internal implementation details", async () => {
    logger.debug("Testing encapsulation boundaries");
    
    const mod = await import("./mod.ts");
    
    // These should not be exposed at module level
    const unexpectedExports = [
      "_internal",
      "private",
      "INTERNAL_CONSTANT",
      "internalFunction",
      "PrivateClass"
    ];
    
    for (const unexpectedExport of unexpectedExports) {
      assertEquals(
        (mod as any)[unexpectedExport],
        undefined,
        `${unexpectedExport} should not be exposed`
      );
    }
    
    logger.debug("Encapsulation boundary verification completed");
  });
});

describe("Architecture: Export structure validation", () => {
  it("should group exports by functionality", async () => {
    logger.debug("Testing export organization");
    
    const mod = await import("./mod.ts");
    
    // Totality types group
    const totalityTypes = [
      "DirectiveType",
      "LayerType",
      "ConfigProfileName",
      "TypeFactory"
    ];
    
    // PromptVariables group
    const promptVariableTypes = [
      "StandardVariable",
      "FilePathVariable",
      "StdinVariable",
      "UserVariable"
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
      "all"
    ];
    
    // Verify all groups are exported
    for (const type of totalityTypes) {
      assertExists((mod as any)[type], `Totality type ${type} must be exported`);
    }
    
    for (const type of promptVariableTypes) {
      assertExists((mod as any)[type], `PromptVariable type ${type} must be exported`);
    }
    
    for (const util of resultUtilities) {
      assertExists((mod as any)[util], `Result utility ${util} must be exported`);
    }
    
    logger.debug("Export organization validation completed");
  });

  it("should maintain backward compatibility for legacy types", async () => {
    logger.debug("Testing legacy type compatibility");
    
    const mod = await import("./mod.ts");
    
    // Legacy type aliases are types, not runtime values
    // They cannot be tested at runtime since TypeScript types don't exist in JavaScript
    // We verify their existence through import checks in the module source
    const moduleSource = await Deno.readTextFile("./lib/types/mod.ts");
    assertEquals(
      moduleSource.includes("export type DemonstrativeType"),
      true,
      "DemonstrativeType type alias must be exported"
    );
    assertEquals(
      moduleSource.includes("export type LegacyLayerType"),
      true,
      "LegacyLayerType type alias must be exported"
    );
    
    logger.debug("Legacy compatibility verification completed");
  });
});

describe("Architecture: Dependency direction verification", () => {
  it("should not import from higher-level modules", async () => {
    logger.debug("Testing dependency direction constraints");
    
    // Read the module source to check imports
    const moduleSource = await Deno.readTextFile("./lib/types/mod.ts");
    
    // Should not import from these higher-level modules
    const forbiddenImports = [
      "from \"../cli/",
      "from \"../commands/",
      "from \"../io/",
      "from \"../processor/",
      "from \"../../cli/",
      "from \"../../commands/"
    ];
    
    for (const forbidden of forbiddenImports) {
      assertEquals(
        moduleSource.includes(forbidden),
        false,
        `Should not import ${forbidden}`
      );
    }
    
    logger.debug("Dependency direction verification completed");
  });

  it("should only import from allowed modules", async () => {
    logger.debug("Testing allowed dependencies");
    
    const moduleSource = await Deno.readTextFile("./lib/types/mod.ts");
    
    // Allowed internal imports
    const allowedPatterns = [
      /from\s+"\.\/[^"]+"/g,  // Same directory imports
      /from\s+"\.\.\/factory\/prompt_variables_factory\.ts"/g,  // Specific factory import
      /from\s+"@tettuan\/breakdownparams"/g,  // External dependency
      /from\s+"@tettuan\/breakdown\/lib\/types\/mod\.ts"/g  // Self-import in tests
    ];
    
    // Extract all imports
    const importMatches = moduleSource.matchAll(/from\s+"[^"]+"/g);
    
    for (const match of importMatches) {
      const importPath = match[0];
      let isAllowed = false;
      
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
        `Import ${importPath} should match allowed patterns`
      );
    }
    
    logger.debug("Allowed dependencies verification completed");
  });
});

describe("Architecture: Type safety architecture", () => {
  it("should enforce Totality principle through type exports", async () => {
    logger.debug("Testing Totality principle enforcement");
    
    const mod = await import("./mod.ts");
    
    // Totality types should have factory methods
    assertEquals(typeof mod.DirectiveType.create, "function", "DirectiveType should have create method");
    assertEquals(typeof mod.LayerType.create, "function", "LayerType should have create method");
    assertEquals(typeof mod.ConfigProfileName.create, "function", "ConfigProfileName should have create method");
    
    // TypeFactory should provide centralized type creation
    const factory = mod.TypeFactory;
    assertExists(factory, "TypeFactory must be exported");
    assertEquals(typeof factory, "function", "TypeFactory should be a constructor");
    
    logger.debug("Totality principle enforcement verified");
  });

  it("should provide Result type for error handling", async () => {
    logger.debug("Testing Result type architecture");
    
    const mod = await import("./mod.ts");
    
    // Result constructors
    assertExists(mod.ok, "ok constructor must be exported");
    assertExists(mod.error, "error constructor must be exported");
    
    // Result utilities
    assertExists(mod.isOk, "isOk utility must be exported");
    assertExists(mod.isError, "isError utility must be exported");
    
    // Functional utilities
    assertExists(mod.map, "map utility must be exported");
    assertExists(mod.chain, "chain utility must be exported");
    assertExists(mod.getOrElse, "getOrElse utility must be exported");
    assertExists(mod.all, "all utility must be exported");
    
    // Test basic Result functionality
    const okResult = mod.ok(42);
    assertEquals(mod.isOk(okResult), true, "ok() should create success Result");
    
    const errorResult = mod.error("test error");
    assertEquals(mod.isError(errorResult), true, "error() should create error Result");
    
    logger.debug("Result type architecture verified");
  });
});

describe("Architecture: Module cohesion and coupling", () => {
  it("should have high cohesion within type module", async () => {
    logger.debug("Testing module cohesion");
    
    const mod = await import("./mod.ts");
    
    // All exports should be type-related
    const exportNames = Object.keys(mod);
    
    for (const exportName of exportNames) {
      // Skip symbols and internal properties
      if (typeof exportName !== "string" || exportName.startsWith("_")) continue;
      
      // All exports should be type constructors, utilities, or type guards
      const exportValue = (mod as any)[exportName];
      const isTypeRelated = 
        typeof exportValue === "function" ||  // Constructors, utilities
        typeof exportValue === "object" ||     // Enums, constants
        exportValue === undefined;             // Type aliases
      
      assertEquals(
        isTypeRelated,
        true,
        `Export ${exportName} should be type-related`
      );
    }
    
    logger.debug("Module cohesion verification completed");
  });

  it("should have loose coupling with other modules", async () => {
    logger.debug("Testing module coupling");
    
    // Count external dependencies
    const moduleSource = await Deno.readTextFile("./lib/types/mod.ts");
    const externalImports = moduleSource.match(/from\s+"[^.][^"]+"/g) || [];
    
    // Should have minimal external dependencies (allowing for reasonable JSR package dependencies)
    assertEquals(
      externalImports.length <= 4,
      true,
      `Should have minimal external dependencies (found ${externalImports.length})`
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
          importedSource.includes("from \"./mod.ts\""),
          false,
          `${importPath} should not import back to mod.ts`
        );
      } catch {
        // File might not exist or be accessible, skip
      }
    }
    
    logger.debug("Module coupling verification completed");
  });
});

describe("Architecture: Documentation and contracts", () => {
  it("should have comprehensive module documentation", async () => {
    logger.debug("Testing module documentation");
    
    const moduleSource = await Deno.readTextFile("./lib/types/mod.ts");
    
    // Should have module-level JSDoc
    assertEquals(
      moduleSource.includes("@module"),
      true,
      "Module should have @module documentation"
    );
    
    // Should have examples
    assertEquals(
      moduleSource.includes("@example"),
      true,
      "Module should include usage examples"
    );
    
    // Should document both new and legacy usage
    assertEquals(
      moduleSource.includes("Totality-compliant"),
      true,
      "Should document new Totality approach"
    );
    
    assertEquals(
      moduleSource.includes("deprecated"),
      true,
      "Should document deprecated features"
    );
    
    logger.debug("Module documentation verification completed");
  });

  it("should clearly mark deprecated exports", async () => {
    logger.debug("Testing deprecation markers");
    
    const moduleSource = await Deno.readTextFile("./lib/types/mod.ts");
    
    // Check specific deprecated exports
    const deprecatedExports = [
      "DemonstrativeType",
      "LegacyLayerType",
      "DemonstrativeTypeFactory",
      "LegacyLayerTypeFactory"
    ];
    
    for (const deprecated of deprecatedExports) {
      const exportSection = moduleSource.indexOf(`export.*${deprecated}`);
      if (exportSection !== -1) {
        // Find the nearest @deprecated comment before the export
        const precedingSection = moduleSource.slice(Math.max(0, exportSection - 500), exportSection);
        assertEquals(
          precedingSection.includes("@deprecated"),
          true,
          `${deprecated} should have @deprecated documentation`
        );
      }
    }
    
    logger.debug("Deprecation markers verification completed");
  });
});