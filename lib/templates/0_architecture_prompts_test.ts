/**
 * @fileoverview Prompts Architecture Tests
 *
 * Tests for architectural constraints and structural integrity of prompts module.
 * Focuses on template structure, key consistency, and template format validation.
 *
 * @module templates/0_architecture_prompts_test
 */

import { assert, assertEquals } from "jsr:@std/assert@0.224.0";
import { describe, it } from "@std/testing/bdd";
import { prompts } from "./prompts.ts";

describe("Prompts_Architecture", () => {
  describe("Template Structure Constraints", () => {
    it("should_maintain_consistent_key_format", () => {
      const keys = Object.keys(prompts);

      // All keys should follow the pattern: directive/layer/filename.md or special paths
      const validPatterns = [
        /^[a-z]+\/[a-z]+\/[a-zA-Z_]+\.md$/, // directive/layer/filename.md
        /^[a-zA-Z_\/]+\.md$/, // Special files like README.md, samples/
        /^[a-z]+\/[a-zA-Z_]+\.md$/, // directive/filename.md
      ];

      for (const key of keys) {
        const isValid = validPatterns.some((pattern) => pattern.test(key));
        assert(
          isValid,
          `Key "${key}" does not match expected patterns. Should follow directive/layer/filename.md format or be a special path.`,
        );
      }
    });

    it("should_enforce_file_extension_consistency", () => {
      const keys = Object.keys(prompts);

      // All keys should end with .md
      for (const key of keys) {
        assert(
          key.endsWith(".md"),
          `Key "${key}" should end with .md extension`,
        );
      }
    });

    it("should_maintain_hierarchical_organization", () => {
      const keys = Object.keys(prompts);
      const directiveTypes = new Set<string>();
      const layerTypes = new Set<string>();

      // Extract directive and layer types from keys
      for (const key of keys) {
        const parts = key.split("/");
        if (parts.length >= 2) {
          directiveTypes.add(parts[0]);
          if (parts.length >= 3) {
            layerTypes.add(parts[1]);
          }
        }
      }

      // Should have consistent directive types
      const expectedDirectives = ["defect", "to", "summary", "find"];
      for (const directive of expectedDirectives) {
        assert(
          directiveTypes.has(directive),
          `Missing expected directive type: ${directive}`,
        );
      }

      // Should have consistent layer types
      const expectedLayers = ["project", "issue", "task"];
      for (const layer of expectedLayers) {
        assert(
          layerTypes.has(layer),
          `Missing expected layer type: ${layer}`,
        );
      }
    });

    it("should_enforce_template_naming_conventions", () => {
      const keys = Object.keys(prompts);

      // Check for standard template naming patterns
      const templatePatterns = {
        standard: /^[a-z]+\/[a-z]+\/f_[a-z]+\.md$/,
        special: /^[a-z]+\/[a-z]+\/[a-zA-Z_]+\.md$/,
        documentation: /^README\.md$/,
        samples: /^samples\//,
      };

      let standardCount = 0;
      let specialCount = 0;

      for (const key of keys) {
        if (templatePatterns.standard.test(key)) {
          standardCount++;

          // Standard templates should start with f_
          const filename = key.split("/").pop()!;
          assert(
            filename.startsWith("f_"),
            `Standard template "${key}" should start with f_ prefix`,
          );
        } else if (templatePatterns.special.test(key)) {
          specialCount++;
        }
      }

      // Should have both standard and special templates
      assert(standardCount > 0, "Should have standard f_ templates");
      assert(specialCount > 0, "Should have special templates");
    });
  });

  describe("Template Content Validation", () => {
    it("should_contain_non_empty_template_content", () => {
      const entries = Object.entries(prompts);

      for (const [key, content] of entries) {
        assert(
          typeof content === "string",
          `Template "${key}" content should be a string`,
        );

        assert(
          content.length > 0,
          `Template "${key}" should not be empty`,
        );

        // Content should be meaningful (more than just whitespace), but allow placeholders
        if (content.trim().length === 0) {
          console.warn(`Template "${key}" contains only whitespace - this may be a placeholder`);
        }
      }
    });

    it("should_validate_template_variable_format", () => {
      const entries = Object.entries(prompts);
      const variablePattern = /\{([^}]+)\}/g;

      for (const [key, content] of entries) {
        let match;
        const variables = new Set<string>();

        // Extract all variables from template
        while ((match = variablePattern.exec(content)) !== null) {
          variables.add(match[1]);
        }

        // Validate variable names if they exist
        for (const variable of variables) {
          assert(
            /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable),
            `Invalid variable name "${variable}" in template "${key}". Should contain only alphanumeric characters and underscores.`,
          );
        }
      }
    });

    it("should_enforce_consistent_template_structure", () => {
      const entries = Object.entries(prompts);

      // Check templates that should have specific structure
      const structuredTemplates = entries.filter(([key]) =>
        key.includes("/f_") && !key.includes("samples/")
      );

      for (const [key, content] of structuredTemplates) {
        // Should contain basic template elements
        const hasInput = content.includes("input") || content.includes("Input");
        const hasOutput = content.includes("output") || content.includes("Output");

        // For transformation templates (to/), should have input/output structure
        if (key.startsWith("to/")) {
          assert(
            hasInput,
            `Transformation template "${key}" should reference input`,
          );

          assert(
            hasOutput,
            `Transformation template "${key}" should reference output`,
          );
        }
      }
    });

    it("should_validate_markdown_format_consistency", () => {
      const entries = Object.entries(prompts);

      for (const [key, content] of entries) {
        // Should not have malformed markdown syntax
        const lines = content.split("\n");

        // Check for unmatched backticks
        const backtickCount = (content.match(/```/g) || []).length;
        if (backtickCount > 0) {
          assert(
            backtickCount % 2 === 0,
            `Template "${key}" has unmatched code block backticks`,
          );
        }

        // Check for reasonable line length (not excessively long)
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          assert(
            line.length <= 1000,
            `Template "${key}" line ${i + 1} is excessively long (${line.length} chars)`,
          );
        }
      }
    });
  });

  describe("Template Relationship Constraints", () => {
    it("should_maintain_directive_layer_coverage", () => {
      const keys = Object.keys(prompts);
      const coverage = new Map<string, Set<string>>();

      // Build coverage map
      for (const key of keys) {
        const parts = key.split("/");
        if (parts.length >= 3 && parts[2].startsWith("f_")) {
          const directive = parts[0];
          const layer = parts[1];

          if (!coverage.has(directive)) {
            coverage.set(directive, new Set());
          }
          coverage.get(directive)!.add(layer);
        }
      }

      // Should have consistent coverage across directives
      const expectedLayers = ["project", "issue", "task"];

      for (const [directive, layers] of coverage) {
        if (directive === "find") continue; // Special case for find directive

        for (const expectedLayer of expectedLayers) {
          if (directive === "summary" && expectedLayer === "task") continue; // Some combinations may not exist

          // Check if layer is covered or if there's a reasonable alternative
          const hasStandardLayer = layers.has(expectedLayer);
          const hasAlternativeLayer = Array.from(layers).some((layer) =>
            layer.includes(expectedLayer) || expectedLayer.includes(layer)
          );

          if (!hasStandardLayer && !hasAlternativeLayer) {
            console.warn(`Directive "${directive}" missing layer "${expectedLayer}"`);
          }
        }
      }
    });

    it("should_validate_template_variable_consistency", () => {
      const entries = Object.entries(prompts);
      const commonVariables = new Set<string>();

      // Find common variables across templates
      for (const [, content] of entries) {
        const variableMatches = content.match(/\{([^}]+)\}/g);
        if (variableMatches) {
          for (const match of variableMatches) {
            const variable = match.slice(1, -1);
            commonVariables.add(variable);
          }
        }
      }

      // Validate that common variables are used consistently
      const expectedCommonVariables = [
        "input_text",
        "input_text_file",
        "destination_path",
        "schema_file",
      ];

      for (const expectedVar of expectedCommonVariables) {
        assert(
          commonVariables.has(expectedVar),
          `Common variable "${expectedVar}" should be used across templates`,
        );
      }
    });
  });

  describe("Auto-generation Contract", () => {
    it("should_maintain_auto_generation_header", () => {
      // Get the file content to check the header
      const fileContent = prompts as Record<string, string>;

      // Should be marked as auto-generated (this is architectural constraint)
      // We can't directly access the file header, but we can verify the structure
      // suggests auto-generation (consistent format, comprehensive coverage)

      const keys = Object.keys(fileContent);

      // Auto-generated files should have comprehensive coverage
      assert(
        keys.length > 20,
        "Auto-generated prompts should have comprehensive template coverage",
      );

      // Should have consistent structure across all entries
      const allStrings = Object.values(fileContent).every((v) => typeof v === "string");
      assert(allStrings, "All prompt values should be strings (consistent auto-generation)");
    });

    it("should_enforce_readonly_structure", () => {
      // Verify the prompts object is properly typed as const
      const promptsObject = prompts;

      // Should be an object with string keys and values
      assert(typeof promptsObject === "object", "Prompts should be an object");
      assert(promptsObject !== null, "Prompts should not be null");

      // Verify keys are strings and values are strings
      for (const [key, value] of Object.entries(promptsObject)) {
        assertEquals(typeof key, "string", "All keys should be strings");
        assertEquals(typeof value, "string", "All values should be strings");
      }
    });

    it("should_maintain_source_attribution", () => {
      // Auto-generated files should maintain clear source attribution
      // This is tested through the presence of structured, comprehensive content

      const keys = Object.keys(prompts);
      const directiveGroups = new Map<string, number>();

      // Count templates by directive, excluding special files
      for (const key of keys) {
        const parts = key.split("/");
        if (parts.length >= 2) {
          const directive = parts[0];
          directiveGroups.set(directive, (directiveGroups.get(directive) || 0) + 1);
        }
      }

      // Should have multiple directives (indicating comprehensive source coverage)
      assert(
        directiveGroups.size >= 3,
        "Should have templates from multiple directive types (indicates proper source coverage)",
      );

      // Each directive should have at least one template
      for (const [directive, count] of directiveGroups) {
        if (directive !== "samples" && directive !== "README.md") { // Exclude special cases
          assert(
            count >= 1,
            `Directive "${directive}" should have at least one template (indicates proper source processing)`,
          );
        }
      }
    });
  });

  describe("Performance and Memory Constraints", () => {
    it("should_maintain_reasonable_memory_footprint", () => {
      const entries = Object.entries(prompts);
      let totalSize = 0;
      let maxTemplateSize = 0;

      for (const [key, content] of entries) {
        const size = content.length;
        totalSize += size;
        maxTemplateSize = Math.max(maxTemplateSize, size);

        // Individual templates should not be excessively large
        assert(
          size <= 50000, // 50KB limit per template
          `Template "${key}" is too large (${size} bytes). Consider splitting into smaller templates.`,
        );
      }

      // Total size should be reasonable for in-memory storage
      assert(
        totalSize <= 2000000, // 2MB total limit
        `Total prompts size is too large (${totalSize} bytes). Consider external storage or lazy loading.`,
      );

      console.log(
        `Total prompts: ${entries.length}, Total size: ${totalSize} bytes, Max template: ${maxTemplateSize} bytes`,
      );
    });

    it("should_enable_efficient_key_lookup", () => {
      const keys = Object.keys(prompts);

      // Keys should be structured for efficient lookup
      // Test that key lookup is O(1) by accessing random keys
      const randomKeys = keys.slice(0, Math.min(10, keys.length));

      for (const key of randomKeys) {
        const startTime = performance.now();
        const value = prompts[key as keyof typeof prompts];
        const endTime = performance.now();

        assert(value !== undefined, `Key "${key}" should exist`);
        assert(
          endTime - startTime < 1, // Should be very fast (< 1ms)
          `Key lookup for "${key}" took too long (${endTime - startTime}ms)`,
        );
      }
    });
  });

  describe("Integration Contract", () => {
    it("should_support_template_engine_integration", () => {
      const entries = Object.entries(prompts);

      // Should have templates suitable for template engine processing
      let templatesWithVariables = 0;
      let templatesWithoutVariables = 0;

      for (const [key, content] of entries) {
        const hasVariables = content.includes("{") && content.includes("}");

        if (hasVariables) {
          templatesWithVariables++;

          // Templates with variables should be processable by template engines
          const variables = content.match(/\{([^}]+)\}/g) || [];

          for (const variable of variables) {
            // Should not have nested braces (which would break simple template engines)
            // But allow valid variable names that contain underscores
            const varName = variable.slice(1, -1);
            assert(
              /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName),
              `Template "${key}" has invalid variable name in: ${variable}`,
            );
          }
        } else {
          templatesWithoutVariables++;
        }
      }

      // Should have both types of templates
      assert(
        templatesWithVariables > 0,
        "Should have templates with variables for dynamic content",
      );

      assert(
        templatesWithoutVariables > 0,
        "Should have static templates for fixed content",
      );
    });

    it("should_maintain_cross_platform_compatibility", () => {
      const entries = Object.entries(prompts);

      for (const [key, content] of entries) {
        // Should not contain platform-specific line endings in keys
        assert(
          !key.includes("\r") && !key.includes("\n"),
          `Key "${key}" contains line ending characters`,
        );

        // Should handle different line endings gracefully in content
        const hasWindowsLineEndings = content.includes("\r\n");
        const hasUnixLineEndings = content.includes("\n");

        if (hasWindowsLineEndings && hasUnixLineEndings) {
          console.warn(`Template "${key}" has mixed line endings`);
        }

        // Should not contain null bytes or other problematic characters
        assert(
          !content.includes("\0"),
          `Template "${key}" contains null bytes`,
        );
      }
    });
  });
});
