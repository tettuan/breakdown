/**
 * Architecture tests for OutputFilePathResolver
 * 
 * These tests verify:
 * 1. Dependency direction is unidirectional (no circular dependencies)
 * 2. Proper layer boundaries are maintained
 * 3. Interface consistency with related components
 * 4. No violations of architectural constraints
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("architecture-output-file-path-resolver");

describe("OutputFilePathResolver - Architectural Constraints", () => {
  it("should not have circular dependencies with other resolvers", async () => {
    logger.debug("Testing for circular dependencies");
    
    // Verify OutputFilePathResolver doesn't import other resolvers that might import it back
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
    // Check that it doesn't import input, prompt_template, or schema resolvers
    const forbiddenImports = [
      "input_file_path_resolver",
      "prompt_template_path_resolver", 
      "schema_file_path_resolver"
    ];
    
    forbiddenImports.forEach(forbidden => {
      assertEquals(
        moduleContent.includes(`from "./${forbidden}"`),
        false,
        `Should not import ${forbidden} to avoid circular dependencies`
      );
    });
  });

  it("should only depend on allowed external modules", async () => {
    logger.debug("Testing external dependencies");
    
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
    // Extract all import statements
    const importRegex = /import\s+.*?\s+from\s+["'](.+?)["']/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(moduleContent)) !== null) {
      imports.push(match[1]);
    }
    
    // Verify all imports are from allowed sources
    const allowedPrefixes = [
      "@std/",           // Standard library
      "../deps.ts",      // Project dependencies
      "./prompt_variables_factory.ts", // Factory types
      "../types/",       // Type definitions
      "../config/",      // Configuration modules
    ];
    
    imports.forEach(importPath => {
      const isAllowed = allowedPrefixes.some(prefix => importPath.startsWith(prefix));
      assertEquals(
        isAllowed,
        true,
        `Import "${importPath}" should be from an allowed source`
      );
    });
  });

  it("should maintain consistent interface with TypeCreationResult pattern", async () => {
    logger.debug("Testing TypeCreationResult pattern consistency");
    
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
    // Verify TypeCreationResult is used consistently if present
    if (moduleContent.includes("TypeCreationResult")) {
      const hasConsistentPattern = 
        moduleContent.includes("success: true") && 
        moduleContent.includes("success: false");
      assertEquals(
        hasConsistentPattern, 
        true, 
        "Should use TypeCreationResult pattern consistently"
      );
    }
  });

  it("should respect layer boundaries and not access lower-level implementation details", async () => {
    logger.debug("Testing layer boundary respect");
    
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
    // Should not directly manipulate file system beyond path operations
    const forbiddenOperations = [
      "Deno.readFile",
      "Deno.writeFile",
      "Deno.readTextFile",
      "Deno.writeTextFile",
      "Deno.remove",
      "Deno.readDir"
    ];
    
    forbiddenOperations.forEach(operation => {
      assertEquals(
        moduleContent.includes(operation),
        false,
        `Should not directly use ${operation} - path resolution only`
      );
    });
    
    // May use file system operations for path validation and directory creation
    const allowedOperations = ["Deno.cwd", "Deno.mkdir", "Deno.mkdirSync", "Deno.statSync", "Deno.stat"];
    const denoOperations = moduleContent.match(/Deno\.\w+/g) || [];
    
    denoOperations.forEach(op => {
      if (!allowedOperations.includes(op)) {
        assertEquals(
          allowedOperations.includes(op),
          true,
          `Operation ${op} should be in allowed list`
        );
      }
    });
  });

  it("should follow single responsibility principle", async () => {
    logger.debug("Testing single responsibility principle");
    
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
    // Count public methods (should be minimal)
    const publicMethodRegex = /public\s+(\w+)\s*\(/g;
    const publicMethods: string[] = [];
    let match;
    
    while ((match = publicMethodRegex.exec(moduleContent)) !== null) {
      publicMethods.push(match[1]);
    }
    
    // Should have reasonable public interface (output resolvers need more methods than input)
    assertEquals(
      publicMethods.length <= 8, 
      true, 
      `Should have reasonable public methods count, found: ${publicMethods.join(", ")}`
    );
    
    // Verify class has single clear purpose
    const classComment = moduleContent.match(/\/\*\*[\s\S]*?\*\/\s*export\s+class\s+OutputFilePathResolver/);
    assertExists(classComment, "Class should have documentation explaining its single responsibility");
  });

  it("should use proper abstraction for cross-cutting concerns", async () => {
    logger.debug("Testing abstraction usage");
    
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
    // Should use standard library abstractions for path operations
    const hasPathImport = moduleContent.includes('@std/path');
    assertEquals(hasPathImport, true, "Should use @std/path for path operations");
    
    // Should not reimplement path logic
    const hasCustomPathLogic = moduleContent.match(/function\s+(join|resolve|dirname|basename)\s*\(/);
    assertEquals(hasCustomPathLogic, null, "Should not reimplement standard path operations");
  });

  it("should handle both legacy and new parameter structures consistently", async () => {
    logger.debug("Testing parameter structure handling consistency");
    
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
    // Verify it can handle different parameter structures
    const hasFlexibleParams = 
      moduleContent.includes("PromptCliParams") || 
      moduleContent.includes("TwoParamsResult") ||
      moduleContent.includes("DoubleParamsResult");
    
    assertEquals(hasFlexibleParams, true, "Should handle parameter structures flexibly");
    
    // Verify constructor or methods handle type variations
    const constructorMatch = moduleContent.match(/constructor\s*\([^)]*\)/s);
    if (constructorMatch) {
      const hasUnionType = constructorMatch[0].includes("|");
      assertEquals(
        hasUnionType || moduleContent.includes("as any"),
        true,
        "Should handle multiple parameter types"
      );
    }
  });

  it("should not expose internal implementation details", async () => {
    logger.debug("Testing encapsulation");
    
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
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
      "Should have private helper methods for internal logic"
    );
    
    // No protected methods unless inheritance is used
    if (!moduleContent.includes("extends")) {
      const hasProtectedMethods = moduleContent.includes("protected ");
      assertEquals(hasProtectedMethods, false, "Should not have protected methods without inheritance");
    }
  });
});

describe("OutputFilePathResolver - Integration Points", () => {
  it("should properly integrate with configuration structure", async () => {
    logger.debug("Testing configuration integration");
    
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
    // Should work with configuration for working directory
    const usesConfig = 
      moduleContent.includes("config") &&
      (moduleContent.includes("working_dir") || moduleContent.includes("workingDir"));
    
    assertEquals(
      usesConfig,
      true,
      "Should integrate with configuration for working directory"
    );
  });

  it("should maintain consistent error handling patterns", async () => {
    logger.debug("Testing error handling patterns");
    
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
    // Check for proper documentation (error handling or return values)
    const hasMethodDocs = moduleContent.includes("@returns") || 
                         moduleContent.includes("@throws") ||
                         moduleContent.includes("/**") ||
                         moduleContent.includes("* @param");
    
    assertEquals(
      hasMethodDocs,
      true,
      "Should document methods with JSDoc"
    );
    
    // Should not use generic Error without context
    const genericErrorCount = (moduleContent.match(/throw\s+new\s+Error\s*\(/g) || []).length;
    assertEquals(genericErrorCount, 0, "Should not throw generic errors");
  });
});

describe("OutputFilePathResolver - Dependency Graph Validation", () => {
  it("should form a proper dependency tree without cycles", async () => {
    logger.debug("Testing dependency tree structure");
    
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
    // Should not import input resolver to avoid potential cycles
    assertEquals(
      moduleContent.includes("input_file_path_resolver"),
      false,
      "Should not depend on input resolver"
    );
    
    // Should not import other path resolvers that might create cycles
    assertEquals(
      moduleContent.includes("prompt_template_path_resolver"),
      false,
      "Should not depend on prompt template resolver"
    );
    
    assertEquals(
      moduleContent.includes("schema_file_path_resolver"),
      false,
      "Should not depend on schema resolver"
    );
  });

  it("should follow the established module hierarchy", async () => {
    logger.debug("Testing module hierarchy compliance");
    
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
    // Factory modules can depend on:
    // 1. Standard library (@std/*)
    // 2. External dependencies (via deps.ts)
    // 3. Type definitions (../types/*)
    // 4. Configuration (../config/*)
    // 5. Other factory modules (with care to avoid cycles)
    
    // Should not depend on higher-level modules
    const forbiddenHigherLevel = [
      "../cli/",
      "../commands/",
      "../workspace/",
      "../builder/",
      "../processor/"
    ];
    
    forbiddenHigherLevel.forEach(higher => {
      assertEquals(
        moduleContent.includes(`from "${higher}`),
        false,
        `Should not depend on higher-level module ${higher}`
      );
    });
  });

  it("should maintain separation from input path resolution", async () => {
    logger.debug("Testing separation of concerns");
    
    const moduleContent = await Deno.readTextFile(new URL("./output_file_path_resolver.ts", import.meta.url).pathname);
    
    // Should focus on output/destination paths only
    const hasOutputFocus = 
      moduleContent.includes("destination") ||
      moduleContent.includes("output") ||
      moduleContent.includes("target");
    
    assertEquals(
      hasOutputFocus,
      true,
      "Should focus on output/destination path resolution"
    );
    
    // Should not handle input/source paths
    const handlesForeignConcerns = 
      moduleContent.includes("fromFile") &&
      !moduleContent.includes("destinationFile");
    
    assertEquals(
      handlesForeignConcerns,
      false,
      "Should not handle input file concerns"
    );
  });
});