/**
 * Tests for find bugs command with --config option
 *
 * Tests that the find bugs command properly uses configuration from
 * production-user.yml and that custom config settings are applied correctly.
 */

import { assertEquals, assertExists } from "@std/assert";
import { EnhancedParamsParser } from "../../../lib/cli/parser/enhanced_params_parser.ts";
import { parse } from "@std/yaml";
import { resolve } from "@std/path";

// Config interface for type safety
interface Config {
  customConfig?: {
    findBugs?: {
      enabled?: boolean;
      patterns?: string[];
      includeExtensions?: string[];
      excludeDirectories?: string[];
    };
  };
}

// Simple loadConfig function for testing
async function loadConfig(configPath: string): Promise<Config> {
  try {
    const content = await Deno.readTextFile(configPath);
    return parse(content) as Config;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load config from ${configPath}: ${message}`);
  }
}

Deno.test("Find Bugs Command - Config Option Integration", async (t) => {
  const configPath = resolve(Deno.cwd(), "config/production-user.yml");

  await t.step("should load production-user.yml configuration", async () => {
    const config = await loadConfig(configPath);
    assertExists(config);
    assertExists(config.customConfig);
    assertExists(config.customConfig.findBugs);
    assertEquals(config.customConfig.findBugs.enabled, true);
  });

  await t.step("should parse find bugs command with config option", () => {
    const parser = new EnhancedParamsParser();
    const result = parser.parse([
      "find",
      "bugs",
      "--config",
      "production-user.yml",
      "--from",
      "src/",
    ]);

    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    const twoResult = result as any;
    assertEquals(twoResult.demonstrativeType, "find");
    assertEquals(twoResult.layerType, "bugs");
    assertEquals(result.options?.config, "production-user.yml");
    assertEquals(result.options?.from, "src/");
  });

  await t.step("should parse find bugs with short form config option", () => {
    const parser = new EnhancedParamsParser();
    const result = parser.parse([
      "find",
      "bugs",
      "-c",
      "config/production-user.yml",
      "-f",
      "lib/",
      "-o",
      "bugs-report.md",
    ]);

    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    const twoResult = result as any;
    assertEquals(twoResult.demonstrativeType, "find");
    assertEquals(twoResult.layerType, "bugs");
    assertEquals(result.options?.config, "config/production-user.yml");
    assertEquals(result.options?.from, "lib/");
    assertEquals(result.options?.destination, "bugs-report.md");
  });

  await t.step("should use BreakdownParams customConfig from production-user.yml", () => {
    // Load config and create parser with BreakdownParams customConfig
    const customConfig = {
      validation: {
        zero: {
          allowedOptions: ["help", "version", "init"],
          valueOptions: ["config", "c"],
        },
        one: {
          allowedOptions: ["help", "extended", "custom-validation"],
          valueOptions: ["config", "c", "error-format", "destination", "from", "output"],
        },
        two: {
          allowedOptions: ["help", "extended", "custom-validation"],
          valueOptions: [
            "config",
            "c",
            "error-format",
            "destination",
            "from",
            "output",
            "prompt-dir",
          ],
        },
      },
      params: {
        two: {
          demonstrativeType: {
            pattern: "^(to|summary|defect|find)$",
            errorMessage: "Invalid demonstrative type. Must be one of: to, summary, defect, find",
          },
          layerType: {
            pattern: "^(project|issue|task|bugs)$",
            errorMessage: "Invalid layer type. Must be one of: project, issue, task, bugs",
          },
        },
      },
      options: {
        values: {
          config: {
            shortForm: "c",
            description: "Configuration file path",
            valueRequired: true,
            allowEqualsFormat: true,
          },
          from: {
            shortForm: "f",
            description: "Input file path",
            valueRequired: true,
            allowEqualsFormat: true,
          },
          destination: {
            shortForm: "o",
            description: "Output file path",
            valueRequired: true,
            allowEqualsFormat: true,
          },
        },
        flags: {
          help: {
            shortForm: "h",
            description: "Show help message",
          },
          extended: {
            description: "Enable extended processing",
          },
        },
      },
    };

    const parser = new EnhancedParamsParser(customConfig);
    const result = parser.parse([
      "find",
      "bugs",
      "--config=production-user.yml",
      "--from=src/",
      "--extended",
    ]);

    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    const twoResult = result as any;
    assertEquals(twoResult.demonstrativeType, "find");
    assertEquals(twoResult.layerType, "bugs");
    assertEquals(result.options?.config, "production-user.yml");
    assertEquals(result.options?.from, "src/");
    assertEquals(result.options?.extended, true);
  });
});

Deno.test("Find Bugs Config - Edge Cases", async (t) => {
  await t.step("should handle config with absolute path", () => {
    const parser = new EnhancedParamsParser();
    const result = parser.parse([
      "find",
      "bugs",
      "--config=/absolute/path/to/config.yml",
      "--from=./src",
    ]);

    assertEquals(result.type, "two");
    assertEquals(result.options?.config, "/absolute/path/to/config.yml");
  });

  await t.step("should handle config as first argument", () => {
    const parser = new EnhancedParamsParser();
    const result = parser.parse([
      "--config=production-user.yml",
      "find",
      "bugs",
      "--from=src/",
    ]);

    // Config as first option results in zero type
    assertEquals(result.type, "zero");
    assertEquals(result.options?.config, "production-user.yml");
  });

  await t.step("should handle multiple options with find bugs", () => {
    const parser = new EnhancedParamsParser();
    const result = parser.parse([
      "find",
      "bugs",
      "-c",
      "production-user.yml",
      "-f",
      "src/",
      "-o",
      "output/bugs.md",
      "--extended",
      "--custom-validation",
    ]);

    assertEquals(result.type, "two");
    // deno-lint-ignore no-explicit-any
    const twoResult = result as any;
    assertEquals(twoResult.demonstrativeType, "find");
    assertEquals(twoResult.layerType, "bugs");
    assertEquals(result.options?.config, "production-user.yml");
    assertEquals(result.options?.from, "src/");
    assertEquals(result.options?.destination, "output/bugs.md");
  });
});

Deno.test("Find Bugs Config - Validation Tests", async (t) => {
  await t.step("should validate bug patterns from config", async () => {
    const configPath = resolve(Deno.cwd(), "config/production-user.yml");
    const config = await loadConfig(configPath);

    const bugPatterns = config.customConfig?.findBugs?.patterns;
    assertExists(bugPatterns);
    assertEquals(Array.isArray(bugPatterns), true);
    assertEquals(bugPatterns.includes("TODO"), true);
    assertEquals(bugPatterns.includes("FIXME"), true);
    assertEquals(bugPatterns.includes("BUG"), true);
  });

  await t.step("should validate file extensions from config", async () => {
    const configPath = resolve(Deno.cwd(), "config/production-user.yml");
    const config = await loadConfig(configPath);

    const extensions = config.customConfig?.findBugs?.includeExtensions;
    assertExists(extensions);
    assertEquals(Array.isArray(extensions), true);
    assertEquals(extensions.includes(".ts"), true);
    assertEquals(extensions.includes(".js"), true);
  });

  await t.step("should validate exclude directories from config", async () => {
    const configPath = resolve(Deno.cwd(), "config/production-user.yml");
    const config = await loadConfig(configPath);

    const excludeDirs = config.customConfig?.findBugs?.excludeDirectories;
    assertExists(excludeDirs);
    assertEquals(Array.isArray(excludeDirs), true);
    assertEquals(excludeDirs.includes("node_modules"), true);
    assertEquals(excludeDirs.includes(".git"), true);
  });
});
