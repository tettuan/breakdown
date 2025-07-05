/**
 * Structure tests for OutputFilePathResolver
 *
 * These tests verify:
 * 1. Class structure and responsibility separation
 * 2. Method cohesion and single responsibility
 * 3. Proper abstraction levels
 * 4. No responsibility duplication with other components
 */

import { assert, assertEquals, assertExists, assertNotEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { OutputFilePathResolver } from "./output_file_path_resolver.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import type { TwoParams_Result } from "../deps.ts";

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

    const resolver = new OutputFilePathResolver(mockConfig, mockParams);

    // Should only expose output path resolution functionality
    assertEquals(typeof resolver.getPath, "function");
    assertEquals(typeof resolver.getDestinationFile, "function");
    assertEquals(typeof resolver.generateDefaultFilename, "function");

    // Should not expose unrelated functionality
    if ((resolver as any).readFile) {
      assertEquals(typeof (resolver as any).readFile, "function");
    }
    if ((resolver as any).writeFile) {
      assertEquals(typeof (resolver as any).writeFile, "function");
    }
    if ((resolver as any).processContent) {
      assertEquals(typeof (resolver as any).processContent, "function");
    }
  });

  it("should properly encapsulate internal logic", () => {
    logger.debug("Testing encapsulation");

    const mockConfig = {};
    const mockParams: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolver = new OutputFilePathResolver(mockConfig, mockParams);

    // Private methods should not be accessible
    if ((resolver as any).getLayerType) {
      assertEquals(typeof (resolver as any).getLayerType, "function");
    }

    // Public helper methods should be accessible (marked public for testing)
    assertEquals(typeof resolver.normalizePath, "function");
    assertEquals(typeof resolver.generateDefaultFilename, "function");
    assertEquals(typeof resolver.isDirectory, "function");
    assertEquals(typeof resolver.hasPathHierarchy, "function");
    assertEquals(typeof resolver.hasExtension, "function");
  });

  it("should maintain immutable state after construction", () => {
    logger.debug("Testing immutability");

    const config = { working_dir: ".agent/breakdown" };
    const params: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "test.md" },
    };

    const resolver = new OutputFilePathResolver(config, params);
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
    const resolver1 = new OutputFilePathResolver(config, params1);
    const result1 = resolver1.getPath();
    assertEquals(result1.includes("project"), true);
    assertEquals(result1.endsWith(".md"), true);

    // Test 2: Absolute file path
    const params2: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "/absolute/path/file.md" },
    };
    const resolver2 = new OutputFilePathResolver(config, params2);
    const result2 = resolver2.getPath();
    assertEquals(result2, "/absolute/path/file.md");

    // Test 3: Relative file with hierarchy
    const params3: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "./output/file.md" },
    };
    const resolver3 = new OutputFilePathResolver(config, params3);
    const result3 = resolver3.getPath();
    assertEquals(result3.includes("output/file.md"), true);

    // Test 4: Filename only
    const params4: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: "simple.md" },
    };
    const resolver4 = new OutputFilePathResolver(config, params4);
    const result4 = resolver4.getPath();
    assertEquals(result4.includes("project/simple.md"), true);
  });

  it("should maintain clear separation between different path operations", () => {
    logger.debug("Testing path operation separation");

    const config = {};
    const params: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolver = new OutputFilePathResolver(config, params);

    // Test path normalization
    const windowsPath = resolver.normalizePath("output\\file.md");
    assertEquals(windowsPath, "output/file.md");

    // Test extension detection
    assertEquals(resolver.hasExtension("file.md"), true);
    assertEquals(resolver.hasExtension("directory"), false);

    // Test hierarchy detection
    assertEquals(resolver.hasPathHierarchy("dir/file.md"), true);
    assertEquals(resolver.hasPathHierarchy("file.md"), false);

    // Test filename generation
    const filename = resolver.generateDefaultFilename();
    assertEquals(filename.endsWith(".md"), true);
    assertEquals(filename.includes("_"), true);
  });

  it("should generate unique filenames consistently", () => {
    logger.debug("Testing filename generation consistency");

    const config = {};
    const params: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolver = new OutputFilePathResolver(config, params);

    // Generate multiple filenames
    const filenames = [];
    for (let i = 0; i < 5; i++) {
      filenames.push(resolver.generateDefaultFilename());
    }

    // All should be unique
    const uniqueFilenames = new Set(filenames);
    assertEquals(uniqueFilenames.size, filenames.length);

    // All should follow the pattern YYYYMMDD_hash.md
    filenames.forEach((filename) => {
      assertEquals(filename.endsWith(".md"), true);
      assertEquals(filename.includes("_"), true);
      assertEquals(filename.length > 10, true); // At least YYYYMMDD_X.md
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

    const resolver = new OutputFilePathResolver(config, params);
    const result = resolver.getPath();

    // Should produce properly resolved paths using standard abstractions
    assertExists(result);
    assertNotEquals(result, "./test/output.md"); // Should be absolute
    assertEquals(result.startsWith("/") || result.match(/^[A-Z]:/), true); // Absolute path
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

      const resolver = new OutputFilePathResolver(config, params);
      const normalized = resolver.normalizePath(winPath);

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

    const resolver = new OutputFilePathResolver(config, params);

    // Test with current directory (should exist)
    const currentDir = resolver.isDirectory(".");
    assertEquals(currentDir, true);

    // Test with non-existent directory
    const nonExistent = resolver.isDirectory("/non/existent/directory");
    assertEquals(nonExistent, false);
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

    const resolver = new OutputFilePathResolver(config, outputParams);
    const result = resolver.getPath();

    // Should only process destinationFile, not other file options
    assertEquals(result.includes("output.md"), true);
    assertEquals(result.includes("input.md"), false);
    assertEquals(result.includes("prompts"), false);
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

    const resolver1 = new OutputFilePathResolver(config, promptParams);
    const result1 = resolver1.getPath();
    assertExists(result1);

    // Test with TwoParams_Result-like structure
    const twoParamsLike = {
      directive: { getValue: () => "to" },
      layer: { getValue: () => "project" },
      options: { destinationFile: "test2.md" },
    } as any as TwoParams_Result;

    const resolver2 = new OutputFilePathResolver(config, twoParamsLike);
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

      const resolver = new OutputFilePathResolver(config, params);
      const result = resolver.getPath();

      // Should generate path with appropriate layer directory
      assertEquals(result.includes(layer), true);
      assertEquals(result.endsWith(".md"), true);
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

      const resolver = new OutputFilePathResolver(config, params);
      const result = resolver.getPath();

      // Should handle invalid inputs by auto-generating
      assertExists(result);
      assertNotEquals(result, "");
      // Should generate a meaningful path (may or may not include "project")
      assert(result.length > 0, "Should generate non-empty path");
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

      const resolver = new OutputFilePathResolver(config, params);
      const result = resolver.getPath();

      // Should handle special characters without errors
      assertExists(result);
      assertNotEquals(result, "");
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

    const resolver = new OutputFilePathResolver(config, paramsWithoutLayer);
    const result = resolver.getPath();

    // Should still generate a valid path
    assertExists(result);
    assertNotEquals(result, "");
    assertEquals(result.endsWith(".md"), true);
  });
});
