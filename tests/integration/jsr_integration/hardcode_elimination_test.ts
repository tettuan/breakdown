/**
 * @fileoverview Hardcode elimination verification test - DirectiveType/LayerType array hardcode validation
 *
 * Verify that no hardcoded arrays exist in the codebase,
 * and all type definitions are dynamically loaded from configuration files
 *
 * @module tests/integration/jsr_integration/hardcode_elimination_test
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
// Removed @std/io import - not needed for file reading operations
import { join } from "@std/path";

const logger = new BreakdownLogger("hardcode-check");

describe("Hardcode elimination verification", () => {
  describe("DirectiveType/LayerType array hardcode detection", () => {
    it("No hardcoded arrays exist in lib/domain/core/value_objects/", async () => {
      const targetDir = join(Deno.cwd(), "lib", "domain", "core", "value_objects");

      // Define hardcode patterns
      const hardcodePatterns = [
        // 配列リテラル
        /\[(["'])(to|summary|defect|find|project|issue|task)\1[\s,\S]*?\]/g,
        // new Set() リテラル
        /new Set\(\[(["'])(to|summary|defect|find|project|issue|task)\1[\s,\S]*?\]\)/g,
        // Object.freeze() 配列
        /Object\.freeze\(\[(["'])(to|summary|defect|find|project|issue|task)\1[\s,\S]*?\]\)/g,
        // as const 配列
        /\[(["'])(to|summary|defect|find|project|issue|task)\1[\s,\S]*?\] as const/g,
      ];

      const files = await findTypeScriptFiles(targetDir);
      const violations: Array<{ file: string; line: number; content: string }> = [];

      for (const file of files) {
        const content = await Deno.readTextFile(file);
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          hardcodePatterns.forEach((pattern) => {
            if (pattern.test(line)) {
              // Exclude comment lines and mock data for tests
              if (
                !line.trim().startsWith("//") &&
                !line.includes("test") &&
                !line.includes("mock") &&
                !line.includes("example")
              ) {
                violations.push({
                  file: file.replace(Deno.cwd(), "."),
                  line: index + 1,
                  content: line.trim(),
                });
              }
            }
          });
        });
      }

      logger.debug("Hardcode inspection result", {
        filesChecked: files.length,
        violations: violations.length,
        details: violations,
      });

      // Verify that no hardcodes exist
      assertEquals(
        violations.length,
        0,
        `Hardcoded arrays found: ${JSON.stringify(violations, null, 2)}`,
      );
    });

    it("Verification that deleted files do not exist", async () => {
      const targetFile = join(
        Deno.cwd(),
        "lib",
        "types",
        "defaults",
        "default_type_pattern_provider.ts",
      );

      // Verify that the file has been deleted
      try {
        await Deno.readTextFile(targetFile);
        throw new Error("File scheduled for deletion still exists");
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          logger.debug("Hardcode removal confirmation", {
            file: "default_type_pattern_provider.ts",
            status: "successfully_removed",
            note: "TypePatternProvider functionality migrated to JSR package",
          });

          // Success: File has been properly deleted
          assertEquals(true, true, "default_type_pattern_provider.ts was successfully deleted");
        } else {
          throw error;
        }
      }
    });
  });

  describe("Dynamic pattern provider verification", () => {
    it("PatternProvider dynamically retrieves patterns from configuration", async () => {
      const targetFiles = [
        join(Deno.cwd(), "lib", "config", "pattern_provider.ts"),
        join(Deno.cwd(), "lib", "config", "pattern_provider_async.ts"),
      ];

      for (const file of targetFiles) {
        const content = await Deno.readTextFile(file);

        // Verify implementation of dynamic pattern retrieval
        const dynamicPatterns = [
          /this\.config\./g,
          /customConfig\./g,
          /pattern\s*=\s*[^"']/g, // Assignment from variables
          /getDirectivePattern/g,
          /getLayerPattern/g,
        ];

        let dynamicImplementations = 0;
        dynamicPatterns.forEach((pattern) => {
          const matches = content.match(pattern);
          if (matches) {
            dynamicImplementations += matches.length;
          }
        });

        logger.debug("Dynamic implementation inspection", {
          file: file.replace(Deno.cwd(), "."),
          dynamicImplementations,
          isDynamic: dynamicImplementations > 0,
        });

        assertEquals(
          dynamicImplementations > 0,
          true,
          `${file} does not implement dynamic pattern retrieval`,
        );
      }
    });
  });

  describe("Configuration-driven verification in integration tests", () => {
    it("Different profiles use different patterns", async () => {
      // ConfigBasedTwoParamsBuilderを使用して確認
      const { ConfigBasedTwoParamsBuilder } = await import(
        "../../../lib/config/config_based_two_params_builder.ts"
      );

      // Create builders with different profiles
      const profiles = [
        { name: "default", expectedPatterns: true },
        { name: "breakdown-params-integration", expectedPatterns: true },
        { name: "flexible-test", expectedPatterns: true },
      ];

      const patterns: Record<string, { directive?: string; layer?: string }> = {};

      for (const profile of profiles) {
        try {
          const builderResult = await ConfigBasedTwoParamsBuilder.fromConfig(profile.name);

          if (builderResult.ok) {
            const builder = builderResult.data;
            patterns[profile.name] = {
              directive: builder.getDirectivePattern(),
              layer: builder.getLayerPattern(),
            };
          }
        } catch (error) {
          logger.debug("Profile loading skipped", {
            profile: profile.name,
            reason: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.debug("Profile-specific patterns", patterns);

      // Verify that at least 2 profiles are loaded
      const loadedProfiles = Object.keys(patterns);
      assertEquals(loadedProfiles.length >= 2, true, "Multiple profiles were not loaded");

      // Verify that patterns exist and are strings
      loadedProfiles.forEach((profileName) => {
        const pattern = patterns[profileName];
        if (pattern.directive) {
          assertEquals(
            typeof pattern.directive,
            "string",
            `${profileName} directive pattern is not a string`,
          );
        }
        if (pattern.layer) {
          assertEquals(
            typeof pattern.layer,
            "string",
            `${profileName} layer pattern is not a string`,
          );
        }
      });
    });
  });
});

/**
 * Recursively search for TypeScript files
 */
async function findTypeScriptFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    for await (const entry of Deno.readDir(dir)) {
      const path = join(dir, entry.name);

      if (entry.isDirectory && !entry.name.startsWith(".")) {
        const subFiles = await findTypeScriptFiles(path);
        files.push(...subFiles);
      } else if (entry.isFile && entry.name.endsWith(".ts") && !entry.name.endsWith("_test.ts")) {
        files.push(path);
      }
    }
  } catch (error) {
    logger.debug("Directory reading error", {
      dir,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return files;
}
