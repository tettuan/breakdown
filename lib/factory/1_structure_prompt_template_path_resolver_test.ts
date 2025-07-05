/**
 * Structure tests for PromptTemplatePathResolver
 *
 * These tests verify:
 * 1. Class structure and responsibility separation
 * 2. Method cohesion and single responsibility
 * 3. Proper abstraction levels
 * 4. No responsibility duplication with other components
 */

import { assertEquals, assertExists, assertNotEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import type { TwoParams_Result } from "../deps.ts";

const logger = new BreakdownLogger("structure-prompt-template-path-resolver");

describe("PromptTemplatePathResolver - Class Structure", () => {
  it("should have a clear single responsibility for template path resolution", async () => {
    logger.debug("Testing single responsibility");

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    // The class should only be responsible for resolving template file paths
    const mockConfig = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
    };
    const mockParams: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolver = new PromptTemplatePathResolver(mockConfig, mockParams);

    // Should only expose template path resolution functionality
    assertEquals(typeof resolver.getPath, "function");

    // Should not expose unrelated functionality
    assertEquals(
      typeof (resolver as any as { readTemplate?: unknown }).readTemplate,
      "undefined",
    );
    assertEquals(
      typeof (resolver as any as { processTemplate?: unknown }).processTemplate,
      "undefined",
    );
    assertEquals(
      typeof (resolver as any as { renderTemplate?: unknown }).renderTemplate,
      "undefined",
    );
    assertEquals(
      typeof (resolver as any as { validateContent?: unknown }).validateContent,
      "undefined",
    );
  });

  it("should properly encapsulate internal logic", async () => {
    logger.debug("Testing encapsulation");

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    const mockConfig = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
    };
    const mockParams: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolver = new PromptTemplatePathResolver(mockConfig, mockParams);

    // Private methods should not be accessible
    assertEquals(
      typeof (resolver as any as { getPromptDir?: unknown }).getPromptDir,
      "undefined",
    );
    assertEquals(
      typeof (resolver as any as { getSchemaDir?: unknown }).getSchemaDir,
      "undefined",
    );
    assertEquals(
      typeof (resolver as any as { buildTemplatePath?: unknown }).buildTemplatePath,
      "undefined",
    );
    assertEquals(
      typeof (resolver as any as { getTemplateFilename?: unknown }).getTemplateFilename,
      "undefined",
    );

    // Only public interface should be accessible
    assertEquals(typeof resolver.getPath, "function");
  });

  it("should maintain immutable state after construction", async () => {
    logger.debug("Testing immutability");

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    const config = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
    };
    const params: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolver = new PromptTemplatePathResolver(config, params);
    const path1 = resolver.getPath();

    // Modify original objects
    config.app_prompt.base_dir = "modified";
    (params as { layerType: string }).layerType = "modified";

    const path2 = resolver.getPath();

    // Resolver should not be affected by external modifications
    assertEquals(path1, path2);
  });
});

describe("PromptTemplatePathResolver - Method Responsibilities", () => {
  it("should handle template path resolution comprehensively", async () => {
    logger.debug("Testing comprehensive template path handling");

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    // Test 1: Standard prompt template
    const config1 = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
    };
    const params1: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };
    const resolver1 = new PromptTemplatePathResolver(config1, params1);
    const result1 = resolver1.getPath();

    assertExists(result1);
    assertEquals(result1.includes("prompts"), true);
    assertEquals(result1.includes("to"), true);
    assertEquals(result1.includes("project"), true);

    // Test 2: Schema template
    const params2: TwoParams_Result = {
      type: "two",
      params: ["summary", "issue"],
      demonstrativeType: "summary",
      layerType: "issue",
      options: {},
    };
    const resolver2 = new PromptTemplatePathResolver(config1, params2);
    const result2 = resolver2.getPath();

    assertExists(result2);
    // Should handle schema path resolution
    assertNotEquals(result2, result1);
  });

  it("should maintain clear separation between prompt and schema paths", async () => {
    logger.debug("Testing prompt vs schema path separation");

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    const config = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
    };

    // Test prompt path
    const promptParams: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };
    const promptResolver = new PromptTemplatePathResolver(config, promptParams);
    const promptPath = promptResolver.getPath();

    // Test schema path (if supported)
    const schemaParams: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: { useSchema: true },
    };
    const schemaResolver = new PromptTemplatePathResolver(config, schemaParams);
    const schemaPath = schemaResolver.getPath();

    // Paths should be different and use appropriate directories
    assertNotEquals(promptPath, schemaPath);
    assertEquals(promptPath.includes("prompts"), true);
  });

  it("should generate consistent template paths for same parameters", async () => {
    logger.debug("Testing path consistency");

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    const config = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
    };
    const params: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    // Multiple resolvers with same parameters should produce same path
    const resolver1 = new PromptTemplatePathResolver(config, params);
    const resolver2 = new PromptTemplatePathResolver(config, params);

    const path1 = resolver1.getPath();
    const path2 = resolver2.getPath();

    assertEquals(path1, path2);
  });
});

describe("PromptTemplatePathResolver - Abstraction Levels", () => {
  it("should use appropriate abstractions for path operations", async () => {
    logger.debug("Testing abstraction usage");

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    const config = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
    };
    const params: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolver = new PromptTemplatePathResolver(config, params);
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

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    // Test with different base directories
    const configs = [
      { app_prompt: { base_dir: "custom_prompts" }, app_schema: { base_dir: "custom_schemas" } },
      { app_prompt: { base_dir: "./prompts" }, app_schema: { base_dir: "./schemas" } },
      {
        app_prompt: { base_dir: "/absolute/prompts" },
        app_schema: { base_dir: "/absolute/schemas" },
      },
    ];

    const params: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    configs.forEach((config, index) => {
      const resolver = new PromptTemplatePathResolver(config, params);
      const result = resolver.getPath();

      assertExists(result);
      assertNotEquals(result, "");

      // Should incorporate the configured base directory
      const baseDir = config.app_prompt.base_dir.replace(/^\.?\//, "");
      assertEquals(result.includes(baseDir), true);
    });
  });
});

describe("PromptTemplatePathResolver - Responsibility Boundaries", () => {
  it("should not duplicate functionality from other resolvers", async () => {
    logger.debug("Testing responsibility separation from other resolvers");

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    const config = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
    };

    // Template resolver should focus on template paths
    const templateParams: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolver = new PromptTemplatePathResolver(config, templateParams);
    const result = resolver.getPath();

    // Should focus on template resolution, not input/output files
    assertEquals(result.includes("input.md"), false);
    assertEquals(result.includes("output.md"), false);
    assertEquals(result.includes("prompts") || result.includes("schemas"), true);
  });

  it("should handle parameter structure variations gracefully", async () => {
    logger.debug("Testing parameter structure handling");

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    const config = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" },
    };

    // Test with different parameter structures
    const paramVariations: TwoParams_Result[] = [
      {
        type: "two",
        params: ["to", "project"],
        demonstrativeType: "to",
        layerType: "project",
        options: {},
      },
      {
        type: "two",
        params: ["summary", "issue"],
        demonstrativeType: "summary",
        layerType: "issue",
        options: { useSchema: true },
      },
    ];

    paramVariations.forEach((params) => {
      const resolver = new PromptTemplatePathResolver(config, params);
      const result = resolver.getPath();

      assertExists(result);
      assertNotEquals(result, "");
    });
  });

  it("should maintain consistent behavior across different types", async () => {
    logger.debug("Testing type consistency");

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    const config = {
      app_prompt: { base_dir: "prompts" },
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
        demonstrativeType: directive,
        layerType: layer,
        options: {},
      };

      const resolver = new PromptTemplatePathResolver(config, params);
      const result = resolver.getPath();

      // Should generate valid paths for all type combinations
      assertExists(result);
      assertNotEquals(result, "");
      assertEquals(result.includes(directive), true);
      assertEquals(result.includes(layer), true);
    });
  });
});

describe("PromptTemplatePathResolver - Edge Cases and Boundaries", () => {
  it("should handle missing configuration gracefully", async () => {
    logger.debug("Testing missing configuration handling");

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    // Test with missing or incomplete configuration
    const edgeConfigs = [
      {}, // Empty config
      { app_prompt: {} }, // Missing base_dir
      { app_schema: {} }, // Missing prompt config
      { app_prompt: { base_dir: "" } }, // Empty base_dir
      { app_prompt: null, app_schema: null }, // Null configs
    ];

    const params: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    edgeConfigs.forEach((config, index) => {
      const resolver = new PromptTemplatePathResolver(config as Record<string, unknown>, params);

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

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    // Test with special characters in configuration
    const specialConfigs = [
      { app_prompt: { base_dir: "prompts with spaces" } },
      { app_prompt: { base_dir: "prompts-with-dashes" } },
      { app_prompt: { base_dir: "prompts_with_underscores" } },
      { app_prompt: { base_dir: "prompts/with/slashes" } },
    ];

    const params: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    specialConfigs.forEach((config) => {
      const resolver = new PromptTemplatePathResolver(config, params);
      const result = resolver.getPath();

      // Should handle special characters without errors
      assertExists(result);
      assertNotEquals(result, "");
    });
  });

  it("should provide meaningful error information for invalid configurations", async () => {
    logger.debug("Testing error information quality");

    const module = await import("./prompt_template_path_resolver.ts");
    const { PromptTemplatePathResolver } = module;

    const invalidConfig = {
      app_prompt: { base_dir: null },
      app_schema: { base_dir: undefined },
    };

    const params: TwoParams_Result = {
      type: "two",
      params: ["to", "project"],
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    };

    const resolver = new PromptTemplatePathResolver(
      invalidConfig as Record<string, unknown>,
      params,
    );

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
});
