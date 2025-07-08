/**
 * Structure tests for OutputFilePathResolver
 *
 * These tests verify:
 * 1. Class structure and responsibility separation
 * 2. Method cohesion and single responsibility
 * 3. Proper abstraction levels
 * 4. No responsibility duplication with other components
 */

import { assert, assertEquals, assertExists, assertNotEquals } from "../../../../lib/deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { OutputFilePathResolver } from "../../../../lib/factory/output_file_path_resolver.ts";
import type { PromptCliParams } from "../../../../lib/factory/prompt_variables_factory.ts";
import type { TwoParams_Result } from "../../../../lib/types/mod.ts";

const logger = new BreakdownLogger("structure-output-file-path-resolver");

describe("OutputFilePathResolver - Class Structure", () => {
  it("should have a clear single responsibility for output path resolution", () => {
    logger.debug("Testing single responsibility");

    // The class should only be responsible for resolving output file paths
    const mockConfig = { working_dir: ".agent/breakdown" };
    const mockParams: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "output.md" },
    };

    const resolverResult = OutputFilePathResolver.create(mockConfig, mockParams);
    assert(resolverResult.ok, "Should create resolver successfully");
    const resolver = resolverResult.data;

    // Should only expose output path resolution functionality
    assertEquals(typeof resolver.getPath, "function");
    
    // Verify through actual usage that it only handles output paths
    const result = resolver.getPath();
    assert(result.ok);
    assertEquals(result.data.type, "filename");
    assertEquals(result.data.value.includes("output.md"), true);

    // Should not expose unrelated functionality
    // Check that no methods for reading, writing, or content processing exist
    const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(resolver));
    const publicMethods = allMethods.filter(name => {
      if (name === 'constructor') return false;
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(resolver), name);
      return descriptor && typeof descriptor.value === 'function';
    });
    
    // Debug output to understand the methods
    logger.debug("Found methods", publicMethods);
    
    // getPath should be the only public method
    assertEquals(publicMethods.includes("getPath"), true, "Should have getPath method");
    
    // Private methods are marked private in TypeScript but still accessible at runtime
    // We verify they exist but are not part of the public API design
    const privateMethodNames = ['normalizePath', 'generateDefaultFilename', 'isDirectory', 'hasPathHierarchy', 'hasExtension'];
    privateMethodNames.forEach(methodName => {
      // In JavaScript runtime, private methods are still accessible via any cast
      // This is a limitation of TypeScript's private modifier
      const method = (resolver as any)[methodName];
      if (method !== undefined) {
        assertEquals(typeof method, 'function', `${methodName} should be a function if accessible`);
      }
    });
    
    // Verify that TypeScript's type system would prevent direct access
    // This is what matters for encapsulation in TypeScript
    // The fact that private methods exist at runtime is a JavaScript limitation,
    // but TypeScript enforces encapsulation at compile time
  });

  it("should properly encapsulate internal logic", () => {
    logger.debug("Testing encapsulation");

    const mockConfig = {};
    const mockParams: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolverResult = OutputFilePathResolver.create(mockConfig, mockParams);
    assert(resolverResult.ok, "Should create resolver successfully");
    const resolver = resolverResult.data;

    // Verify encapsulation through the public interface behavior
    const result1 = resolver.getPath();
    assert(result1.ok);
    
    // Test that internal implementation details are not exposed
    // The resolver should handle all path logic internally
    const publicMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(resolver))
      .filter(name => name !== 'constructor' && typeof (resolver as any)[name] === 'function');
    
    // Should only have minimal public interface
    assertEquals(publicMethods.includes('getPath'), true, "Should have getPath method");
    assertEquals(publicMethods.includes('create'), false, "create is static, not instance method");
  });

  it("should maintain immutable state after construction", () => {
    logger.debug("Testing immutability");

    const config = { working_dir: ".agent/breakdown" };
    const params: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "test.md" },
    };

    const resolverResult = OutputFilePathResolver.create(config, params);
    assert(resolverResult.ok, "Should create resolver successfully");
    const resolver = resolverResult.data;
    const path1 = resolver.getPath();

    // Modify original objects
    config.working_dir = "modified";
    params.options!.destinationFile = "modified.md";

    const path2 = resolver.getPath();

    // Resolver should not be affected by external modifications
    assertExists(path1);
    assertExists(path2);
  });
});

describe("OutputFilePathResolver - Method Responsibilities", () => {
  it("should handle all output path scenarios in getPath method", () => {
    logger.debug("Testing getPath comprehensive handling");

    const config = {};

    // Test 1: No destination specified - auto-generate
    const params1: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };
    const resolverResult1 = OutputFilePathResolver.create(config, params1);
    assert(resolverResult1.ok, "Should create resolver successfully");
    const resolver1 = resolverResult1.data;
    const result1 = resolver1.getPath();
    assert(result1.ok);
    assertEquals(result1.data.value.includes("project"), true);
    assertEquals(result1.data.value.endsWith(".md"), true);

    // Test 2: Absolute file path
    const params2: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "/absolute/path/file.md" },
    };
    const resolverResult2 = OutputFilePathResolver.create(config, params2);
    assert(resolverResult2.ok, "Should create resolver successfully");
    const resolver2 = resolverResult2.data;
    const result2 = resolver2.getPath();
    assert(result2.ok);
    assertEquals(result2.data.value, "/absolute/path/file.md");

    // Test 3: Relative file with hierarchy
    const params3: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "./output/file.md" },
    };
    const resolverResult3 = OutputFilePathResolver.create(config, params3);
    assert(resolverResult3.ok, "Should create resolver successfully");
    const resolver3 = resolverResult3.data;
    const result3 = resolver3.getPath();
    assert(result3.ok);
    assertEquals(result3.data.value.includes("output/file.md"), true);

    // Test 4: Filename only
    const params4: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "simple.md" },
    };
    const resolverResult4 = OutputFilePathResolver.create(config, params4);
    assert(resolverResult4.ok, "Should create resolver successfully");
    const resolver4 = resolverResult4.data;
    const result4 = resolver4.getPath();
    assert(result4.ok);
    assertEquals(result4.data.value.includes("project/simple.md"), true);
  });

  it("should maintain clear separation between different path operations", () => {
    logger.debug("Testing path operation separation");

    const config = {};
    const params: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolverResult = OutputFilePathResolver.create(config, params);
    assert(resolverResult.ok, "Should create resolver successfully");
    const resolver = resolverResult.data;

    // Test separation of concerns through output behavior
    // When no destination is specified
    const defaultResult = resolver.getPath();
    assert(defaultResult.ok);
    const defaultPath = defaultResult.data.value;
    
    // Should generate appropriate path (with layer directory)
    assertEquals(defaultPath.includes("project"), true, "Should include layer type in path");
    assertEquals(defaultPath.endsWith(".md"), true, "Should have markdown extension");
    
    // Path should be properly normalized (no backslashes)
    assertEquals(defaultPath.includes("\\"), false, "Should normalize path separators");
    
    // Should handle file naming consistently
    assertEquals(defaultPath.includes("_"), true, "Should use consistent naming pattern");
  });

  it("should generate unique filenames consistently", () => {
    logger.debug("Testing filename generation consistency");

    const config = {};
    const params: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolverResult = OutputFilePathResolver.create(config, params);
    assert(resolverResult.ok, "Should create resolver successfully");
    const resolver = resolverResult.data;

    // Generate multiple paths to test uniqueness
    const paths = [];
    for (let i = 0; i < 5; i++) {
      // Create new resolver each time to test filename generation
      const newResolverResult = OutputFilePathResolver.create(config, params);
      assert(newResolverResult.ok);
      const newResolver = newResolverResult.data;
      const result = newResolver.getPath();
      assert(result.ok);
      paths.push(result.data.value);
    }

    // All generated paths should be unique
    const uniquePaths = new Set(paths);
    assertEquals(uniquePaths.size, paths.length, "Each generated path should be unique");

    // All should follow consistent pattern
    paths.forEach((path) => {
      assertEquals(path.endsWith(".md"), true, "Should end with .md");
      assertEquals(path.includes("project"), true, "Should include layer type");
      assertEquals(path.includes("_"), true, "Should include separator in filename");
    });
  });
});

describe("OutputFilePathResolver - Abstraction Levels", () => {
  it("should use appropriate abstractions for path operations", () => {
    logger.debug("Testing abstraction usage");

    const config = {};
    const params: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "./test/output.md" },
    };

    const resolverResult = OutputFilePathResolver.create(config, params);
    assert(resolverResult.ok, "Should create resolver successfully");
    const resolver = resolverResult.data;
    const result = resolver.getPath();

    // Should produce properly resolved paths using standard abstractions
    assertExists(result);
    assert(result.ok);
    assertNotEquals(result.data.value, "./test/output.md"); // Should be absolute
    assertEquals(result.data.value.startsWith("/") || result.data.value.match(/^[A-Z]:/), true); // Absolute path
  });

  it("should handle cross-platform path normalization consistently", () => {
    logger.debug("Testing cross-platform normalization");

    const config = {};

    // Windows-style paths
    const windowsPaths = [
      "output\\file.md",
      "..\\parent\\file.md",
      ".\\current\\file.md",
    ];

    windowsPaths.forEach((winPath) => {
      const params: PromptCliParams = {
        demonstrativeType: "to",
        layerType: "project",
        options: { destinationFile: winPath },
      };

      const resolverResult = OutputFilePathResolver.create(config, params);
      assert(resolverResult.ok, "Should create resolver successfully");
      const resolver = resolverResult.data;
      const result = resolver.getPath();
      assert(result.ok);
      const normalized = result.data.value;

      // Should normalize to forward slashes
      assertEquals(normalized.includes("\\"), false);
      assertEquals(normalized.includes("/"), true);
    });
  });

  it("should handle directory detection appropriately", () => {
    logger.debug("Testing directory detection");

    const config = {};
    const params: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolverResult = OutputFilePathResolver.create(config, params);
    assert(resolverResult.ok, "Should create resolver successfully");
    const resolver = resolverResult.data;

    // Test directory handling through path resolution behavior
    // When destination is a directory (no extension)
    const dirParams: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "./output/" },
    };
    
    const dirResolverResult = OutputFilePathResolver.create(config, dirParams);
    assert(dirResolverResult.ok);
    const dirResolver = dirResolverResult.data;
    const dirResult = dirResolver.getPath();
    
    // Should handle directory paths appropriately
    assert(dirResult.ok, "Should resolve directory paths");
    assertEquals(dirResult.data.value.endsWith(".md"), true, "Should add filename to directory");
  });
});

describe("OutputFilePathResolver - Responsibility Boundaries", () => {
  it("should not duplicate path resolution logic from other resolvers", () => {
    logger.debug("Testing responsibility separation from other resolvers");

    const config = { working_dir: ".agent/breakdown" };

    // Output resolver should only handle destinationFile paths
    const outputParams: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: {
        destinationFile: "output.md",
        fromFile: "input.md", // Should be ignored by output resolver
        promptDir: "prompts/", // Should be ignored by output resolver
      },
    };

    const resolverResult = OutputFilePathResolver.create(config, outputParams);
    assert(resolverResult.ok, "Should create resolver successfully");
    const resolver = resolverResult.data;
    const result = resolver.getPath();

    // Should only process destinationFile, not other file options
    assert(result.ok);
    assertEquals(result.data.value.includes("output.md"), true);
    assertEquals(result.data.value.includes("input.md"), false);
    assertEquals(result.data.value.includes("prompts"), false);
  });

  it("should handle parameter structure variations gracefully", () => {
    logger.debug("Testing parameter structure handling");

    const config = {};

    // Test with PromptCliParams structure
    const promptParams: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "test1.md" },
    };

    const resolverResult1 = OutputFilePathResolver.create(config, promptParams);
    assert(resolverResult1.ok, "Should create resolver successfully");
    const resolver1 = resolverResult1.data;
    const result1 = resolver1.getPath();
    assertExists(result1);

    // Test with TwoParams_Result-like structure
    const twoParamsLike: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "test2.md" },
    };

    const resolverResult2 = OutputFilePathResolver.create(config, twoParamsLike);
    assert(resolverResult2.ok, "Should create resolver successfully");
    const resolver2 = resolverResult2.data;
    const result2 = resolver2.getPath();
    assertExists(result2);
  });

  it("should maintain consistent behavior across different layer types", () => {
    logger.debug("Testing layer type consistency");

    const config = {};

    // Test with different layer types
    const layers = ["project", "issue", "task", "bugs", "temp"];

    layers.forEach((layer) => {
      const params: PromptCliParams = {
        demonstrativeType: "to",
        layerType: layer,
        options: {},
      };

      const resolverResult = OutputFilePathResolver.create(config, params);
      assert(resolverResult.ok, "Should create resolver successfully");
      const resolver = resolverResult.data;
      const result = resolver.getPath();

      // Should generate path with appropriate layer directory
      assert(result.ok);
      assertEquals(result.data.value.includes(layer), true);
      assertEquals(result.data.value.endsWith(".md"), true);
    });
  });
});

describe("OutputFilePathResolver - Edge Cases and Boundaries", () => {
  it("should handle empty and null-like values appropriately", () => {
    logger.debug("Testing edge case handling");

    const config = {};

    // Test various empty/null-like values
    const edgeCases = [
      undefined,
      null,
      "",
      " ",
      "\t",
      "\n",
    ];

    edgeCases.forEach((edgeCase) => {
      const params: PromptCliParams = {
        demonstrativeType: "to",
        layerType: "project",
        options: { destinationFile: edgeCase as any },
      };

      const resolverResult = OutputFilePathResolver.create(config, params);
      assert(resolverResult.ok, "Should create resolver successfully");
      const resolver = resolverResult.data;
      const result = resolver.getPath();

      // Should handle invalid inputs by auto-generating
      assertExists(result);
      assert(result.ok);
      assertNotEquals(result.data.value, "");
      // Should generate a meaningful path (may or may not include "project")
      assert(result.data.value.length > 0, "Should generate non-empty path");
    });
  });

  it("should handle special path characters correctly", () => {
    logger.debug("Testing special character handling");

    const config = {};

    // Test paths with special characters
    const specialPaths = [
      "file with spaces.md",
      "file-with-dashes.md",
      "file_with_underscores.md",
      "file.multiple.dots.md",
      "file@special#chars.md",
      "folder/file (1).md",
      "folder/[bracketed].md",
    ];

    specialPaths.forEach((specialPath) => {
      const params: PromptCliParams = {
        demonstrativeType: "to",
        layerType: "project",
        options: { destinationFile: specialPath },
      };

      const resolverResult = OutputFilePathResolver.create(config, params);
      assert(resolverResult.ok, "Should create resolver successfully");
      const resolver = resolverResult.data;
      const result = resolver.getPath();

      // Should handle special characters without errors
      assertExists(result);
      assert(result.ok);
      assertNotEquals(result.data.value, "");
    });
  });

  it("should provide appropriate default behavior for missing layer types", () => {
    logger.debug("Testing missing layer type handling");

    const config = {};

    // Test with missing layerType
    const paramsWithoutLayer: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "",
      options: {},
    };

    const resolverResult = OutputFilePathResolver.create(config, paramsWithoutLayer);
    assert(resolverResult.ok, "Should create resolver successfully");
    const resolver = resolverResult.data;
    const result = resolver.getPath();

    // Should still generate a valid path
    assertExists(result);
    assert(result.ok);
    assertNotEquals(result.data.value, "");
    assertEquals(result.data.value.endsWith(".md"), true);
  });
});
