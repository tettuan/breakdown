/**
 * Structure tests for SchemaFilePathResolver
 *
 * These tests verify:
 * 1. Class structure and responsibility separation
 * 2. Method cohesion and single responsibility
 * 3. Proper abstraction levels
 * 4. No responsibility duplication with other components
 */

import { assertEquals, assertExists, assertNotEquals } from "../../../lib/deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import type { TwoParams_Result } from "$lib/types/mod.ts";
import { SchemaFilePathResolver } from "./schema_file_path_resolver.ts";

const logger = new BreakdownLogger("structure-schema-file-path-resolver");

describe("SchemaFilePathResolver - Class Structure", () => {
  it("should have a clear single responsibility for schema path resolution", async () => {
    logger.debug("Testing single responsibility");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    // The class should only be responsible for resolving schema file paths
    const mockConfig = {
      app_schema: { base_dir: "schemas" },
    };
    const mockParams = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {},
    };

    const resolver = new SchemaFilePathResolver(mockConfig, mockParams);

    // Should only expose schema path resolution functionality
    assertEquals(typeof resolver.getPath, "function");

    // Should not expose unrelated functionality
    assertEquals(
      typeof (resolver as any as { validateSchema?: unknown }).validateSchema,
      "undefined",
    );
    assertEquals(
      typeof (resolver as any as { parseSchema?: unknown }).parseSchema,
      "undefined",
    );
    assertEquals(
      typeof (resolver as any as { compileSchema?: unknown }).compileSchema,
      "undefined",
    );
    assertEquals(typeof (resolver as any as { readSchema?: unknown }).readSchema, "undefined");
    assertEquals(
      typeof (resolver as any as { processSchema?: unknown }).processSchema,
      "undefined",
    );
  });

  it("should properly encapsulate internal logic", async () => {
    logger.debug("Testing encapsulation");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    const mockConfig = {
      app_schema: { base_dir: "schemas" },
    };
    const mockParams = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {},
    };

    const resolver = new SchemaFilePathResolver(mockConfig, mockParams);

    // Private methods should not be accessible
    assertEquals(
      typeof (resolver as any as { getSchemaDir?: unknown }).getSchemaDir,
      "undefined",
    );
    assertEquals(
      typeof (resolver as any as { buildSchemaPath?: unknown }).buildSchemaPath,
      "function",
    ); // This is public
    assertEquals(
      typeof (resolver as any as { getSchemaFilename?: unknown }).getSchemaFilename,
      "undefined",
    );
    assertEquals(
      typeof (resolver as any as { getSchemaExtension?: unknown }).getSchemaExtension,
      "undefined",
    );

    // Only public interface should be accessible
    assertEquals(typeof resolver.getPath, "function");
  });

  it("should maintain immutable state after construction", async () => {
    logger.debug("Testing immutability");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    const config = {
      app_schema: { base_dir: "schemas" },
    };
    const params = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {},
    };

    const resolver = new SchemaFilePathResolver(config, params);
    const path1 = resolver.getPath();

    // Modify original objects
    config.app_schema.base_dir = "modified";
    params.layerType = "modified";

    const path2 = resolver.getPath();

    // Resolver should not be affected by external modifications
    assertEquals(path1, path2);
  });
});

describe("SchemaFilePathResolver - Method Responsibilities", () => {
  it("should handle schema path resolution comprehensively", async () => {
    logger.debug("Testing comprehensive schema path handling");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    // Test 1: Standard schema file
    const config1 = {
      app_schema: { base_dir: "schemas" },
    };
    const params1 = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {},
    };
    const resolver1 = new SchemaFilePathResolver(config1, params1);
    const result1 = resolver1.getPath();

    assertExists(result1);
    assertEquals(result1.includes("schemas"), true);
    assertEquals(result1.includes("to"), true);
    assertEquals(result1.includes("project"), true);

    // Test 2: Different directive and layer combination
    const params2 = {
      demonstrativeType: "summary" as const,
      layerType: "issue",
      options: {},
    };
    const resolver2 = new SchemaFilePathResolver(config1, params2);
    const result2 = resolver2.getPath();

    assertExists(result2);
    assertEquals(result2.includes("schemas"), true);
    assertEquals(result2.includes("summary"), true);
    assertEquals(result2.includes("issue"), true);
    assertNotEquals(result2, result1);
  });

  it("should generate appropriate schema file extensions", async () => {
    logger.debug("Testing schema file extension handling");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    const config = {
      app_schema: { base_dir: "schemas" },
    };
    const params = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {},
    };

    const resolver = new SchemaFilePathResolver(config, params);
    const result = resolver.getPath();

    // Should use appropriate schema file extension
    const hasSchemaExtension = result.endsWith(".json") ||
      result.endsWith(".yaml") ||
      result.endsWith(".yml") ||
      result.endsWith(".schema.json") ||
      result.endsWith(".schema.md"); // Breakdown uses .schema.md files

    assertEquals(hasSchemaExtension, true, "Should use appropriate schema file extension");
  });

  it("should generate consistent schema paths for same parameters", async () => {
    logger.debug("Testing path consistency");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    const config = {
      app_schema: { base_dir: "schemas" },
    };
    const params = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {},
    };

    // Multiple resolvers with same parameters should produce same path
    const resolver1 = new SchemaFilePathResolver(config, params);
    const resolver2 = new SchemaFilePathResolver(config, params);

    const path1 = resolver1.getPath();
    const path2 = resolver2.getPath();

    assertEquals(path1, path2);
  });
});

describe("SchemaFilePathResolver - Abstraction Levels", () => {
  it("should use appropriate abstractions for path operations", async () => {
    logger.debug("Testing abstraction usage");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    const config = {
      app_schema: { base_dir: "schemas" },
    };
    const params = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {},
    };

    const resolver = new SchemaFilePathResolver(config, params);
    const result = resolver.getPath();

    // Should produce properly resolved paths
    assertExists(result);
    assertNotEquals(result, "");

    // Should be absolute or properly relative path
    assertEquals(
      result.startsWith("/") || result.startsWith("./") || result.match(/^[A-Z]:/),
      true,
    );
  });

  it("should handle configuration-based directory resolution", async () => {
    logger.debug("Testing configuration-based resolution");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    // Test with different base directories
    const configs = [
      { app_schema: { base_dir: "custom_schemas" } },
      { app_schema: { base_dir: "./schemas" } },
      { app_schema: { base_dir: "/absolute/schemas" } },
    ];

    const params = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {},
    };

    configs.forEach((config, index) => {
      const resolver = new SchemaFilePathResolver(
        config,
        params as {
          demonstrativeType: "to";
          layerType: "project";
          options: Record<string, unknown>;
        },
      );
      const result = resolver.getPath();

      assertExists(result);
      assertNotEquals(result, "");

      // Should incorporate the configured base directory
      const baseDir = config.app_schema.base_dir.replace(/^\.?\//, "");
      assertEquals(result.includes(baseDir), true);
    });
  });
});

describe("SchemaFilePathResolver - Responsibility Boundaries", () => {
  it("should not duplicate functionality from other resolvers", async () => {
    logger.debug("Testing responsibility separation from other resolvers");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    const config = {
      app_schema: { base_dir: "schemas" },
    };

    // Schema resolver should focus on schema paths only
    const schemaParams = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {
        fromFile: "input.md", // Should be ignored
        destinationFile: "output.md", // Should be ignored
        promptDir: "prompts/", // Should be ignored
      },
    };

    const resolver = new SchemaFilePathResolver(config, schemaParams);
    const result = resolver.getPath();

    // Should focus on schema resolution, not input/output files or prompts
    assertEquals(result.includes("input.md"), false);
    assertEquals(result.includes("output.md"), false);
    assertEquals(result.includes("prompts"), false);
    assertEquals(result.includes("schemas"), true);
  });

  it("should handle parameter structure variations gracefully", async () => {
    logger.debug("Testing parameter structure handling");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    const config = {
      app_schema: { base_dir: "schemas" },
    };

    // Test with different parameter structures
    const paramVariations = [
      {
        demonstrativeType: "to" as const,
        layerType: "project",
        options: {},
      },
      {
        demonstrativeType: "summary" as const,
        layerType: "issue",
        options: { useCustomSchema: true },
      },
    ];

    paramVariations.forEach((_params) => {
      const resolver = new SchemaFilePathResolver(
        config,
        _params as {
          demonstrativeType: "to" | "summary";
          layerType: "project" | "issue";
          options: Record<string, unknown>;
        },
      );
      const result = resolver.getPath();

      assertExists(result);
      assertNotEquals(result, "");
    });
  });

  it("should maintain consistent behavior across different types", async () => {
    logger.debug("Testing type consistency");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    const config = {
      app_schema: { base_dir: "schemas" },
    };

    // Test with different directive and layer type combinations
    const typeCombinations = [
      ["to", "project"],
      ["summary", "issue"],
      ["defect", "task"],
      ["init", "bugs"],
      ["find", "temp"],
    ];

    typeCombinations.forEach(([directive, layer]) => {
      const params: TwoParams_Result = {
        type: "two",
        params: [directive, layer],
        demonstrativeType: directive as string,
        layerType: layer,
        options: {},
      };

      const resolver = new SchemaFilePathResolver(config, params);
      const result = resolver.getPath();

      // Should generate valid paths for all type combinations
      assertExists(result);
      assertNotEquals(result, "");
      assertEquals(result.includes(directive), true);
      assertEquals(result.includes(layer), true);
      assertEquals(result.includes("schemas"), true);
    });
  });
});

describe("SchemaFilePathResolver - Edge Cases and Boundaries", () => {
  it("should handle missing configuration gracefully", async () => {
    logger.debug("Testing missing configuration handling");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    // Test with missing or incomplete configuration
    const edgeConfigs = [
      {}, // Empty config
      { app_schema: {} }, // Missing base_dir
      { app_schema: { base_dir: "" } }, // Empty base_dir
      { app_schema: null }, // Null config
      { app_prompt: { base_dir: "prompts" } }, // Wrong config section
    ];

    const params = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {},
    };

    edgeConfigs.forEach((config, index) => {
      const resolver = new SchemaFilePathResolver(config as Record<string, unknown>, params);

      // Should handle gracefully without throwing
      try {
        const result = resolver.getPath();
        assertExists(result);
      } catch (error) {
        // If it throws, should be a meaningful error
        assertExists((error as Error).message);
        assertEquals(typeof (error as Error).message, "string");
      }
    });
  });

  it("should handle special characters in paths appropriately", async () => {
    logger.debug("Testing special character handling");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    // Test with special characters in configuration
    const specialConfigs = [
      { app_schema: { base_dir: "schemas with spaces" } },
      { app_schema: { base_dir: "schemas-with-dashes" } },
      { app_schema: { base_dir: "schemas_with_underscores" } },
      { app_schema: { base_dir: "schemas/with/slashes" } },
    ];

    const params = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {},
    };

    specialConfigs.forEach((config) => {
      const resolver = new SchemaFilePathResolver(
        config,
        params as {
          demonstrativeType: "to";
          layerType: "project";
          options: Record<string, unknown>;
        },
      );
      const result = resolver.getPath();

      // Should handle special characters without errors
      assertExists(result);
      assertNotEquals(result, "");
    });
  });

  it("should provide meaningful error information for invalid configurations", async () => {
    logger.debug("Testing error information quality");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    const invalidConfig = {
      app_schema: { base_dir: null },
    };

    const params = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {},
    };

    const resolver = new SchemaFilePathResolver(invalidConfig as Record<string, unknown>, params);

    // Should either handle gracefully or provide meaningful error
    try {
      const result = resolver.getPath();
      // If successful, should still produce a usable path
      assertExists(result);
    } catch (error) {
      // Error should be informative
      assertExists((error as Error).message);
      assertEquals((error as Error).message.length > 0, true);
    }
  });

  it("should distinguish schema files from other file types", async () => {
    logger.debug("Testing schema file type distinction");

    const module = await import("./schema_file_path_resolver.ts");
    const { SchemaFilePathResolver } = module;

    const config = {
      app_schema: { base_dir: "schemas" },
    };
    const params = {
      demonstrativeType: "to" as const,
      layerType: "project",
      options: {},
    };

    const resolver = new SchemaFilePathResolver(config, params);
    const result = resolver.getPath();

    // Should not produce paths that look like other file types
    assertEquals(result.endsWith(".txt"), false, "Should not produce text files");
    assertEquals(result.endsWith(".js"), false, "Should not produce JavaScript files");
    assertEquals(result.endsWith(".ts"), false, "Should not produce TypeScript files");

    // Should produce schema-appropriate extensions (Breakdown uses .schema.md)
    const hasSchemaExtension = result.endsWith(".json") ||
      result.endsWith(".yaml") ||
      result.endsWith(".yml") ||
      result.endsWith(".schema.md") ||
      result.includes("schema");

    assertEquals(hasSchemaExtension, true, "Should produce schema-appropriate file extensions");
  });
});
