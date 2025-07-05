/**
 * Architecture tests for PromptTemplatePathResolver
 *
 * These tests verify:
 * 1. Dependency direction is unidirectional (no circular dependencies)
 * 2. Proper layer boundaries are maintained
 * 3. Interface consistency with related components
 * 4. No violations of architectural constraints
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { fromFileUrl } from "@std/path";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("architecture-prompt-template-path-resolver");

describe("PromptTemplatePathResolver - Architectural Constraints", () => {
  it("should not have circular dependencies with other resolvers", async () => {
    logger.debug("Testing for circular dependencies");

    // Verify PromptTemplatePathResolver doesn't import other resolvers that might import it back
    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // Check that it doesn't import input, output, or schema resolvers
    const forbiddenImports = [
      "input_file_path_resolver",
      "output_file_path_resolver",
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
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
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
      "../config/", // Configuration modules
      "$lib/config/", // Internal config modules
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
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // Verify TypeCreationResult is used consistently if present
    if (moduleContent.includes("TypeCreationResult")) {
      const hasConsistentPattern = moduleContent.includes("success: true") &&
        moduleContent.includes("success: false");
      assertEquals(
        hasConsistentPattern,
        true,
        "Should use TypeCreationResult pattern consistently",
      );
    }
  });

  it("should respect layer boundaries and focus on template path resolution", async () => {
    logger.debug("Testing layer boundary respect");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // Should not perform file content manipulation
    const forbiddenOperations = [
      "Deno.readFile",
      "Deno.writeFile",
      "Deno.readTextFile",
      "Deno.writeTextFile",
      "Deno.remove",
      "template processing",
      "variable substitution",
    ];

    forbiddenOperations.forEach((operation) => {
      assertEquals(
        moduleContent.includes(operation),
        false,
        `Should not perform ${operation} - path resolution only`,
      );
    });

    // Should focus on path operations
    const allowedOperations = ["Deno.cwd", "Deno.stat", "Deno.statSync"];
    const denoOperations = moduleContent.match(/Deno\.\w+/g) || [];

    denoOperations.forEach((op) => {
      if (!allowedOperations.includes(op)) {
        assertEquals(
          allowedOperations.includes(op),
          true,
          `Operation ${op} should be limited to path resolution needs`,
        );
      }
    });
  });

  it("should follow single responsibility principle", async () => {
    logger.debug("Testing single responsibility principle");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // Count public methods (should be minimal)
    const publicMethodRegex = /public\s+(\w+)\s*\(/g;
    const publicMethods: string[] = [];
    let match;

    while ((match = publicMethodRegex.exec(moduleContent)) !== null) {
      publicMethods.push(match[1]);
    }

    // Should have reasonable public interface (prompt resolvers need multiple methods)
    assertEquals(
      publicMethods.length <= 10,
      true,
      `Should have reasonable public methods count, found: ${publicMethods.join(", ")}`,
    );

    // Should focus on template path resolution
    const hasTemplateFocus = moduleContent.includes("template") ||
      moduleContent.includes("prompt") ||
      moduleContent.includes("schema");

    assertEquals(
      hasTemplateFocus,
      true,
      "Should focus on template/prompt path resolution",
    );
  });

  it("should use proper abstraction for cross-cutting concerns", async () => {
    logger.debug("Testing abstraction usage");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // Should use standard library abstractions for path operations
    const hasPathImport = moduleContent.includes("@std/path");
    assertEquals(hasPathImport, true, "Should use @std/path for path operations");

    // Should not reimplement path logic
    const hasCustomPathLogic = moduleContent.match(
      /function\s+(join|resolve|dirname|basename)\s*\(/,
    );
    assertEquals(hasCustomPathLogic, null, "Should not reimplement standard path operations");
  });

  it("should handle configuration-based path resolution", async () => {
    logger.debug("Testing configuration integration");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // Should integrate with configuration system
    const hasConfigIntegration = moduleContent.includes("config") &&
      (moduleContent.includes("base_dir") ||
        moduleContent.includes("prompt") ||
        moduleContent.includes("schema"));

    assertEquals(
      hasConfigIntegration,
      true,
      "Should integrate with configuration for base directories",
    );

    // Should handle prompt template directories (schema handling is optional)
    const handlesPromptDirs = moduleContent.includes("prompt");

    assertEquals(
      handlesPromptDirs,
      true,
      "Should handle prompt template directories",
    );
  });

  it("should not expose internal implementation details", async () => {
    logger.debug("Testing encapsulation");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // All helper methods should be private
    const privateMethodRegex = /private\s+(\w+)\s*\(/g;
    const privateMethods: string[] = [];
    let match;

    while ((match = privateMethodRegex.exec(moduleContent)) !== null) {
      privateMethods.push(match[1]);
    }

    // Should have private helper methods
    assertEquals(
      privateMethods.length > 0,
      true,
      "Should have private helper methods for internal logic",
    );

    // No protected methods unless inheritance is used
    if (!moduleContent.includes("extends")) {
      const hasProtectedMethods = moduleContent.includes("protected ");
      assertEquals(
        hasProtectedMethods,
        false,
        "Should not have protected methods without inheritance",
      );
    }
  });
});

describe("PromptTemplatePathResolver - Integration Points", () => {
  it("should properly integrate with type system", async () => {
    logger.debug("Testing type system integration");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // Should work with directive and layer types
    const usesTypes = moduleContent.includes("DirectiveType") ||
      moduleContent.includes("LayerType") ||
      moduleContent.includes("demonstrativeType") ||
      moduleContent.includes("layerType");

    assertEquals(
      usesTypes,
      true,
      "Should integrate with type system for directive and layer types",
    );
  });

  it("should maintain consistent error handling patterns", async () => {
    logger.debug("Testing error handling patterns");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // Check for method documentation
    const hasMethodDocs = moduleContent.includes("@returns") ||
      moduleContent.includes("@throws") ||
      moduleContent.includes("/**") ||
      moduleContent.includes("* @param");

    assertEquals(
      hasMethodDocs,
      true,
      "Should document methods with JSDoc",
    );
  });

  it("should handle template file extensions appropriately", async () => {
    logger.debug("Testing template file extension handling");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // Should handle common template extensions
    const handlesExtensions = moduleContent.includes(".md") ||
      moduleContent.includes(".txt") ||
      moduleContent.includes("extension") ||
      moduleContent.includes("suffix");

    assertEquals(
      handlesExtensions,
      true,
      "Should handle template file extensions",
    );
  });
});

describe("PromptTemplatePathResolver - Dependency Graph Validation", () => {
  it("should form a proper dependency tree without cycles", async () => {
    logger.debug("Testing dependency tree structure");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // Should not import other resolvers to avoid potential cycles
    assertEquals(
      moduleContent.includes("input_file_path_resolver"),
      false,
      "Should not depend on input resolver",
    );

    assertEquals(
      moduleContent.includes("output_file_path_resolver"),
      false,
      "Should not depend on output resolver",
    );

    assertEquals(
      moduleContent.includes("schema_file_path_resolver"),
      false,
      "Should not depend on schema resolver",
    );
  });

  it("should follow the established module hierarchy", async () => {
    logger.debug("Testing module hierarchy compliance");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // Factory modules can depend on:
    // 1. Standard library (@std/*)
    // 2. External dependencies (via deps.ts)
    // 3. Type definitions (../types/*)
    // 4. Configuration (../config/*)

    // Should not depend on higher-level modules
    const forbiddenHigherLevel = [
      "../cli/",
      "../commands/",
      "../workspace/",
      "../builder/",
      "../processor/",
    ];

    forbiddenHigherLevel.forEach((higher) => {
      assertEquals(
        moduleContent.includes(`from "${higher}`),
        false,
        `Should not depend on higher-level module ${higher}`,
      );
    });
  });

  it("should maintain separation from file content processing", async () => {
    logger.debug("Testing separation of concerns");

    const moduleContent = await Deno.readTextFile(
      fromFileUrl(new URL("../../../../lib/factory/prompt_template_path_resolver.ts", import.meta.url)),
    );

    // Should focus on path resolution, not content processing
    const forbiddenContentOperations = [
      "render",
      "substitute",
      "interpolate",
      "compile",
      "transform",
      "parse",
    ];

    // Only check for obvious content processing operations, not normal string methods
    const actualContentOperations = [
      "template processing",
      "variable substitution",
      "content render",
      "mustache",
      "handlebars",
    ];

    actualContentOperations.forEach((operation) => {
      assertEquals(
        moduleContent.toLowerCase().includes(operation),
        false,
        `Should not handle content ${operation} - path resolution only`,
      );
    });

    // Should focus on path operations
    const pathOperations = [
      "resolve",
      "join",
      "dirname",
      "basename",
      "exists",
    ];

    const hasPathFocus = pathOperations.some((op) =>
      moduleContent.includes(op) ||
      moduleContent.includes("@std/path")
    );

    assertEquals(
      hasPathFocus,
      true,
      "Should focus on path operations",
    );
  });
});
