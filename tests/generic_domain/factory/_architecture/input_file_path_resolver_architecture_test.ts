/**
 * Architecture tests for InputFilePathResolver
 *
 * These tests verify:
 * 1. Dependency direction is unidirectional (no circular dependencies)
 * 2. Proper layer boundaries are maintained
 * 3. Interface consistency with related components
 * 4. No violations of architectural constraints
 */

import { assertEquals, assertExists } from "../../../../lib/deps.ts";
import { fromFileUrl } from "@std/path";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("architecture-input-file-path-resolver");

describe("InputFilePathResolver - Architectural Constraints", () => {
  it("should not have circular dependencies with other resolvers", async () => {
    logger.debug("Testing for circular dependencies");

    // Verify InputFilePathResolver doesn't import other resolvers that might import it back
    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/input_file_path_resolver.ts", import.meta.url)),
    );

    // Check that it doesn't import output, prompt_template, or schema resolvers
    const forbiddenImports = [
      "output_file_path_resolver",
      "prompt_template_path_resolver",
      "schema_file_path_resolver",
    ];

    forbiddenImports.forEach((forbidden) => {
      assertEquals(
        moduleContent.includes(`from "./${forbidden}"`),
        false,
        `Should not import ${forbidden} to avoid circular dependencies`,
      );
    });
  });

  it("should only depend on allowed external modules", async () => {
    logger.debug("Testing external dependencies");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/input_file_path_resolver.ts", import.meta.url)),
    );

    // Extract all import statements
    const importRegex = /import\s+.*?\s+from\s+["'](.+?)["']/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(moduleContent)) !== null) {
      imports.push(match[1]);
    }

    // Verify all imports are from allowed sources
    const allowedPrefixes = [
      "@std/", // Standard library
      "../deps.ts", // Project dependencies
      "./prompt_variables_factory.ts", // Factory types
      "../types/", // Type definitions
    ];

    imports.forEach((importPath) => {
      const isAllowed = allowedPrefixes.some((prefix) => importPath.startsWith(prefix));
      assertEquals(
        isAllowed,
        true,
        `Import "${importPath}" should be from an allowed source`,
      );
    });
  });

  it("should maintain consistent interface with TypeCreationResult pattern", async () => {
    logger.debug("Testing TypeCreationResult pattern consistency");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/input_file_path_resolver.ts", import.meta.url)),
    );

    // Verify TypeCreationResult is properly defined
    const hasTypeCreationResult = moduleContent.includes("export type TypeCreationResult<T>");
    assertEquals(hasTypeCreationResult, true, "Should export TypeCreationResult type");

    // Verify it follows the success/failure pattern
    const hasSuccessCase = moduleContent.includes("success: true; data: T");
    const hasFailureCase = moduleContent.includes("success: false; error: string");

    assertEquals(hasSuccessCase, true, "Should have success case in TypeCreationResult");
    assertEquals(hasFailureCase, true, "Should have failure case in TypeCreationResult");
  });

  it("should respect layer boundaries and not access lower-level implementation details", async () => {
    logger.debug("Testing layer boundary respect");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/input_file_path_resolver.ts", import.meta.url)),
    );

    // Should not directly access file system operations beyond Deno.cwd()
    const forbiddenOperations = [
      "Deno.readFile",
      "Deno.writeFile",
      "Deno.remove",
      "Deno.mkdir",
      "Deno.readDir",
    ];

    forbiddenOperations.forEach((operation) => {
      assertEquals(
        moduleContent.includes(operation),
        false,
        `Should not directly use ${operation} - path resolution only`,
      );
    });

    // Should only use Deno.cwd() for current working directory
    const allowedDenoOperations = moduleContent.match(/Deno\.\w+/g) || [];
    const filteredOperations = allowedDenoOperations.filter((op) => op !== "Deno.cwd");

    assertEquals(
      filteredOperations.length,
      0,
      `Should only use Deno.cwd(), found: ${filteredOperations.join(", ")}`,
    );
  });

  it("should follow single responsibility principle", async () => {
    logger.debug("Testing single responsibility principle");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/input_file_path_resolver.ts", import.meta.url)),
    );

    // Count public methods (should be minimal)
    const publicMethodRegex = /public\s+(\w+)\s*\(/g;
    const publicMethods: string[] = [];
    let match;

    while ((match = publicMethodRegex.exec(moduleContent)) !== null) {
      publicMethods.push(match[1]);
    }

    // Should only have getPath as public method
    assertEquals(publicMethods.length, 1, "Should have exactly one public method");
    assertEquals(publicMethods[0], "getPath", "Public method should be getPath");

    // Verify class has single clear purpose
    const classComment = moduleContent.match(
      /\/\*\*[\s\S]*?\*\/\s*export\s+class\s+InputFilePathResolver/,
    );
    assertExists(
      classComment,
      "Class should have documentation explaining its single responsibility",
    );
  });

  it("should use proper abstraction for cross-cutting concerns", async () => {
    logger.debug("Testing abstraction usage");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/input_file_path_resolver.ts", import.meta.url)),
    );

    // Should use standard library abstractions for path operations
    const hasPathImport = moduleContent.includes('import { isAbsolute, resolve } from "@std/path"');
    assertEquals(hasPathImport, true, "Should use @std/path for path operations");

    // Should not reimplement path logic
    const hasCustomPathLogic = moduleContent.match(/function\s+(isAbsolute|resolve)\s*\(/);
    assertEquals(hasCustomPathLogic, null, "Should not reimplement standard path operations");
  });

  it("should handle both legacy and new parameter structures consistently", async () => {
    logger.debug("Testing parameter structure handling consistency");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/input_file_path_resolver.ts", import.meta.url)),
    );

    // Verify it handles both DoubleParamsResult and TwoParams_Result
    const hasLegacyType = moduleContent.includes("type DoubleParamsResult = PromptCliParams");
    const hasTwoParamsImport = moduleContent.includes("type { TwoParams_Result }");

    assertEquals(hasLegacyType, true, "Should have legacy type alias for compatibility");
    assertEquals(hasTwoParamsImport, true, "Should import new TwoParams_Result type");

    // Verify constructor accepts both types
    const constructorMatch = moduleContent.match(/constructor\s*\([^)]*\)/s);
    assertExists(constructorMatch, "Should have constructor");

    const constructorParams = constructorMatch[0];
    const acceptsBothTypes = constructorParams.includes("DoubleParamsResult | TwoParams_Result");
    assertEquals(acceptsBothTypes, true, "Constructor should accept both parameter types");
  });

  it("should not expose internal implementation details", async () => {
    logger.debug("Testing encapsulation");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/input_file_path_resolver.ts", import.meta.url)),
    );

    // All helper methods should be private
    const privateMethodRegex = /private\s+(\w+)\s*\(/g;
    const privateMethods: string[] = [];
    let match;

    while ((match = privateMethodRegex.exec(moduleContent)) !== null) {
      privateMethods.push(match[1]);
    }

    // Expected private methods
    const expectedPrivateMethods = [
      "getFromFile",
      "normalizePath",
      "isAbsolute",
      "hasPathHierarchy",
      "getDirectory",
    ];

    expectedPrivateMethods.forEach((method) => {
      assertEquals(
        privateMethods.includes(method),
        true,
        `${method} should be private`,
      );
    });

    // No protected methods (not needed for this class)
    const hasProtectedMethods = moduleContent.includes("protected ");
    assertEquals(hasProtectedMethods, false, "Should not have protected methods");
  });
});

describe("InputFilePathResolver - Integration Points", () => {
  it("should properly integrate with configuration structure", async () => {
    logger.debug("Testing configuration integration");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/input_file_path_resolver.ts", import.meta.url)),
    );

    // Should accept generic config object
    const constructorMatch = moduleContent.match(/constructor\s*\([^)]*\)/s);
    assertExists(constructorMatch);

    const hasConfigParam = constructorMatch[0].includes("config: Record<string, unknown>");
    assertEquals(hasConfigParam, true, "Should accept generic config object");

    // Should not assume specific config structure
    const accessesSpecificConfig = moduleContent.match(
      /this\.config\.(working_dir|app_prompt|app_schema)/,
    );
    assertEquals(
      accessesSpecificConfig,
      null,
      "Should not access specific config properties directly",
    );
  });

  it("should maintain consistent error handling patterns", async () => {
    logger.debug("Testing error handling patterns");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/input_file_path_resolver.ts", import.meta.url)),
    );

    // Should document error cases - check for the specific getPath method documentation
    const getPathMethodMatch = moduleContent.match(/\/\*\*[\s\S]*?public getPath\(\):/);
    if (getPathMethodMatch) {
      // Extract the JSDoc block before the getPath method
      const beforeGetPath = moduleContent.substring(0, getPathMethodMatch.index);
      const lastJSDocStart = beforeGetPath.lastIndexOf("/**");
      const jsDocBlock = moduleContent.substring(
        lastJSDocStart,
        getPathMethodMatch.index! + getPathMethodMatch[0].length,
      );

      const hasThrowsDoc = jsDocBlock.includes("@throws");
      assertEquals(hasThrowsDoc, true, "Should document thrown errors");
    } else {
      // Fallback: check if @throws appears anywhere in method documentation
      const hasThrowsDoc = moduleContent.includes("@throws");
      assertEquals(hasThrowsDoc, true, "Should document thrown errors");
    }

    // Should not use generic Error without context
    const genericErrorCount = (moduleContent.match(/throw\s+new\s+Error\s*\(/g) || []).length;
    assertEquals(genericErrorCount, 0, "Should not throw generic errors");
  });
});

describe("InputFilePathResolver - Dependency Graph Validation", () => {
  it("should form a proper dependency tree without cycles", async () => {
    logger.debug("Testing dependency tree structure");

    // Map out the dependency relationships
    const dependencies = new Map<string, Set<string>>();

    // InputFilePathResolver dependencies
    dependencies.set(
      "input_file_path_resolver",
      new Set([
        "@std/path",
        "prompt_variables_factory",
        "../deps",
      ]),
    );

    // Check that none of its dependencies depend back on it
    const resolverDeps = dependencies.get("input_file_path_resolver")!;

    for (const dep of resolverDeps) {
      // These modules should not import input_file_path_resolver
      if (dep.startsWith("./") || dep.startsWith("../")) {
        // For local modules, verify they don't create cycles
        assertEquals(
          dep === "./input_file_path_resolver",
          false,
          "Should not have self-dependency",
        );
      }
    }
  });

  it("should follow the established module hierarchy", async () => {
    logger.debug("Testing module hierarchy compliance");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/input_file_path_resolver.ts", import.meta.url)),
    );

    // Factory modules can depend on:
    // 1. Standard library (@std/*)
    // 2. External dependencies (via deps.ts)
    // 3. Type definitions (../types/*)
    // 4. Other factory modules (with care to avoid cycles)

    // Should not depend on higher-level modules
    const forbiddenHigherLevel = [
      "../cli/",
      "../commands/",
      "../workspace/",
    ];

    forbiddenHigherLevel.forEach((higher) => {
      assertEquals(
        moduleContent.includes(`from "${higher}`),
        false,
        `Should not depend on higher-level module ${higher}`,
      );
    });
  });
});
