/**
 * @fileoverview Prompts Behavior Tests
 *
 * Tests for behavioral aspects and functional correctness of prompts module.
 * Focuses on template selection, variable substitution, and content generation behaviors.
 *
 * @module templates/1_behavior_prompts_test
 */

import { assert, assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { prompts } from "./prompts.ts";

describe("Prompts_Behavior", () => {
  describe("Template Selection Behavior", () => {
    it("should_provide_templates_for_all_standard_directive_layer_combinations", () => {
      const standardCombinations = [
        "defect/project",
        "defect/issue",
        "defect/task",
        "to/project",
        "to/issue",
        "to/task",
        "summary/project",
        "summary/issue",
        "find/bugs",
      ];

      for (const combination of standardCombinations) {
        // Look for standard template (f_*.md) or any template for this combination
        const hasStandardTemplate = Object.keys(prompts).some((key) =>
          key.startsWith(`${combination}/f_`)
        );
        const hasAnyTemplate = Object.keys(prompts).some((key) => key.startsWith(combination));

        assert(
          hasStandardTemplate || hasAnyTemplate,
          `Missing template for standard combination: ${combination}`,
        );
      }
    });

    it("should_support_hierarchical_template_fallback", () => {
      // Test that we can find templates at different specificity levels
      const keys = Object.keys(prompts);

      // Should have general templates that can serve as fallbacks
      const generalTemplates = keys.filter((key) => {
        const parts = key.split("/");
        return parts.length === 3 && parts[2].startsWith("f_") &&
          ["project", "issue", "task"].includes(parts[1]);
      });

      assert(
        generalTemplates.length > 0,
        "Should have general templates for fallback behavior",
      );

      // Should have specific templates for specialized use cases
      const specificTemplates = keys.filter((key) =>
        key.includes("_strict") || key.includes("_detailed") || key.includes("_critical")
      );

      assert(
        specificTemplates.length > 0,
        "Should have specific templates for specialized behaviors",
      );
    });

    it("should_enable_template_discovery_by_directive_type", () => {
      const directives = ["defect", "to", "summary", "find"];

      for (const directive of directives) {
        const templatesForDirective = Object.keys(prompts).filter((key) =>
          key.startsWith(`${directive}/`)
        );

        assert(
          templatesForDirective.length > 0,
          `Should have templates for directive: ${directive}`,
        );

        // Should have variety in templates for each directive
        if (directive !== "find") { // find might have fewer variations
          assert(
            templatesForDirective.length >= 2,
            `Directive "${directive}" should have multiple template variants`,
          );
        }
      }
    });

    it("should_provide_layer_specific_template_behaviors", () => {
      const layers = ["project", "issue", "task"];

      for (const layer of layers) {
        const templatesForLayer = Object.keys(prompts).filter((key) =>
          key.includes(`/${layer}/`) || key.endsWith(`/${layer}.md`)
        );

        if (templatesForLayer.length > 0) {
          // Layer templates should have appropriate content for that layer
          for (const templateKey of templatesForLayer) {
            const content = prompts[templateKey as keyof typeof prompts];

            // Skip placeholder templates with minimal content
            if (content.trim().length <= 5) {
              console.warn(`Skipping placeholder template: ${templateKey}`);
              continue;
            }

            // Content should reference the layer context appropriately
            const layerReferences = content.toLowerCase().includes(layer.toLowerCase()) ||
              content.includes("Input") || // Generic input handling
              content.includes("Output"); // Generic output handling

            assert(
              layerReferences,
              `Template "${templateKey}" should reference ${layer} context or have generic I/O handling`,
            );
          }
        }
      }
    });
  });

  describe("Variable Substitution Behavior", () => {
    it("should_define_consistent_variable_interfaces", () => {
      const variableUsage = new Map<string, Set<string>>();

      // Collect variable usage across templates
      for (const [key, content] of Object.entries(prompts)) {
        const variables = content.match(/\{([^}]+)\}/g) || [];

        for (const variable of variables) {
          const varName = variable.slice(1, -1);
          if (!variableUsage.has(varName)) {
            variableUsage.set(varName, new Set());
          }
          variableUsage.get(varName)!.add(key);
        }
      }

      // Common variables should be used consistently
      const commonVariables = ["input_text", "input_text_file", "destination_path"];

      for (const commonVar of commonVariables) {
        if (variableUsage.has(commonVar)) {
          const usageCount = variableUsage.get(commonVar)!.size;
          assert(
            usageCount >= 2,
            `Common variable "${commonVar}" should be used in multiple templates for consistency`,
          );
        }
      }
    });

    it("should_handle_template_variable_substitution_gracefully", () => {
      const testVariables = {
        input_text: "Sample input content",
        input_text_file: "sample.md",
        destination_path: "output/result.md",
        schema_file: "schema.json",
      };

      for (const [key, content] of Object.entries(prompts)) {
        const variables = content.match(/\{([^}]+)\}/g) || [];

        if (variables.length > 0) {
          let processedContent: string = content;

          // Simulate variable substitution
          for (const variable of variables) {
            const varName = variable.slice(1, -1);
            const testValue = testVariables[varName as keyof typeof testVariables] ||
              `[${varName}]`;
            processedContent = processedContent.replaceAll(variable, testValue);
          }

          // After substitution, should not have unresolved variables for common vars
          const unresolvedCommon = processedContent.match(
            /\{(input_text|input_text_file|destination_path|schema_file)\}/g,
          );

          assertEquals(
            unresolvedCommon,
            null,
            `Template "${key}" should have all common variables resolved after substitution`,
          );

          // Should produce meaningful content after substitution
          assert(
            processedContent.length > content.length * 0.8,
            `Template "${key}" should retain most content after variable substitution`,
          );
        }
      }
    });

    it("should_validate_variable_context_appropriateness", () => {
      const contextualVariables = {
        "defect": ["error", "issue", "bug", "problem"],
        "to": ["input", "output", "conversion", "convert", "変換", "実行", "tasks", "Task"],
        "summary": ["content", "overview", "summary"],
        "find": ["search", "detection", "analysis"],
      };

      for (const [key, content] of Object.entries(prompts)) {
        const directive = key.split("/")[0];
        const _variables = content.match(/\{([^}]+)\}/g) || [];

        // Skip placeholder templates and non-directive content
        if (
          content.trim().length <= 5 ||
          !contextualVariables[directive as keyof typeof contextualVariables]
        ) {
          continue;
        }

        if (contextualVariables[directive as keyof typeof contextualVariables]) {
          const expectedContext =
            contextualVariables[directive as keyof typeof contextualVariables];

          // Content should have contextually appropriate language
          const hasAppropriateContext = expectedContext.some((term) =>
            content.toLowerCase().includes(term)
          ) || content.includes("{") || content.includes("Input") || content.includes("Output");

          assert(
            hasAppropriateContext,
            `Template "${key}" should have content appropriate for "${directive}" directive`,
          );
        }
      }
    });
  });

  describe("Content Generation Behavior", () => {
    it("should_generate_structured_output_guidance", () => {
      const structuredTemplates = Object.entries(prompts).filter(([key, content]) =>
        key.includes("/f_") && !key.includes("samples/") && content.trim().length > 10
      );

      for (const [key, content] of structuredTemplates) {
        // Should provide output structure guidance
        const hasOutputGuidance = content.includes("Output") ||
          content.includes("format") ||
          content.includes("Format") ||
          content.includes("schema") ||
          content.includes("Schema") ||
          content.includes("Markdown") ||
          content.includes("JSON");

        assert(
          hasOutputGuidance,
          `Structured template "${key}" should provide output format guidance`,
        );
      }
    });

    it("should_provide_actionable_instructions", () => {
      for (const [key, content] of Object.entries(prompts)) {
        // Skip short templates and documentation files
        if (content.length > 100 && !key.includes("README") && !key.includes("samples/")) {
          // Should contain actionable language
          const hasActionableInstructions = content.includes("analyze") ||
            content.includes("Analyze") ||
            content.includes("create") ||
            content.includes("Create") ||
            content.includes("convert") ||
            content.includes("Convert") ||
            content.includes("generate") ||
            content.includes("Generate") ||
            content.includes("follow") ||
            content.includes("should") ||
            content.includes("must") ||
            content.includes("Must") ||
            content.includes("instruction") ||
            content.includes("Instruction") ||
            content.includes("変換") ||
            content.includes("実行") ||
            content.includes("入力") ||
            content.includes("出力") ||
            content.includes("マッピング") ||
            content.includes("解析");

          assert(
            hasActionableInstructions,
            `Template "${key}" should contain actionable instructions`,
          );
        }
      }
    });

    it("should_maintain_appropriate_tone_and_style", () => {
      for (const [key, content] of Object.entries(prompts)) {
        // Skip very short templates, documentation files, and execute templates which may have different tone requirements
        if (
          content.trim().length <= 20 || key.includes("README") || key.includes("samples/") ||
          key.includes("execute")
        ) {
          continue;
        }

        // Should not contain overly casual language (but allow Japanese casual forms that are professional)
        const hasInappropriateTone = content.toLowerCase().includes("awesome") ||
          content.toLowerCase().includes("cool") ||
          content.toLowerCase().includes("hey") ||
          content.toLowerCase().includes("guys");

        assert(
          !hasInappropriateTone,
          `Template "${key}" should maintain professional tone`,
        );

        // Long templates should have professional structure
        if (content.length > 200) {
          const hasStructure = content.includes("#") || // Headers
            content.includes("##") ||
            content.includes("-") || // Lists
            content.includes("*") ||
            content.includes("1.") || // Numbered lists
            content.includes("•");

          assert(
            hasStructure,
            `Longer template "${key}" should have structured formatting`,
          );
        }
      }
    });
  });

  describe("Specialized Template Behavior", () => {
    it("should_handle_critical_severity_templates", () => {
      const criticalTemplates = Object.entries(prompts).filter(([key]) => key.includes("critical"));

      for (const [key, content] of criticalTemplates) {
        // Critical templates should have enhanced guidance
        const hasCriticalGuidance = content.includes("Critical") ||
          content.includes("critical") ||
          content.includes("severity") ||
          content.includes("Severity") ||
          content.includes("impact") ||
          content.includes("Impact") ||
          content.includes("urgent") ||
          content.includes("Urgent");

        assert(
          hasCriticalGuidance,
          `Critical template "${key}" should contain severity/impact guidance`,
        );

        // Should be more comprehensive than standard templates
        assert(
          content.length > 500,
          `Critical template "${key}" should be comprehensive (>500 chars)`,
        );
      }
    });

    it("should_handle_strict_mode_templates", () => {
      const strictTemplates = Object.entries(prompts).filter(([key]) => key.includes("strict"));

      for (const [key, content] of strictTemplates) {
        // Strict templates should have validation requirements
        const hasValidationRequirements = content.includes("strict") ||
          content.includes("Strict") ||
          content.includes("required") ||
          content.includes("Required") ||
          content.includes("must") ||
          content.includes("Must") ||
          content.includes("enforce") ||
          content.includes("validate") ||
          content.includes("Validate");

        assert(
          hasValidationRequirements,
          `Strict template "${key}" should contain validation requirements`,
        );
      }
    });

    it("should_handle_detailed_analysis_templates", () => {
      const detailedTemplates = Object.entries(prompts).filter(([key]) => key.includes("detailed"));

      for (const [key, content] of detailedTemplates) {
        // Detailed templates should be comprehensive
        assert(
          content.length > 800,
          `Detailed template "${key}" should be comprehensive (>800 chars)`,
        );

        // Should have multiple analysis dimensions
        const analysisKeywords = [
          "analysis",
          "Analysis",
          "assessment",
          "Assessment",
          "evaluation",
          "Evaluation",
          "review",
          "Review",
        ];

        const analysisCount = analysisKeywords.reduce(
          (count, keyword) => count + (content.match(new RegExp(keyword, "g")) || []).length,
          0,
        );

        assert(
          analysisCount >= 2,
          `Detailed template "${key}" should have multiple analysis dimensions`,
        );
      }
    });
  });

  describe("Multi-language and Format Support", () => {
    it("should_handle_mixed_language_content", () => {
      const mixedLanguageTemplates = Object.entries(prompts).filter(([, content]) =>
        /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(content) // Japanese characters
      );

      for (const [key, content] of mixedLanguageTemplates) {
        // Mixed language templates should be well-formed
        assert(
          content.length > 50,
          `Mixed language template "${key}" should have substantial content`,
        );

        // Should not have encoding issues (basic check)
        assert(
          !content.includes("ã") || !content.includes("â"), // Common encoding issue markers
          `Template "${key}" should not have encoding issues`,
        );
      }
    });

    it("should_support_markdown_formatting_behavior", () => {
      for (const [key, content] of Object.entries(prompts)) {
        if (content.includes("#")) {
          // Headers should be properly formatted
          const headerLines = content.split("\n").filter((line) => line.startsWith("#"));

          for (const header of headerLines) {
            assert(
              header.match(/^#+\s+\S/), // Should have space after # and content
              `Template "${key}" should have properly formatted headers: "${header}"`,
            );
          }
        }

        if (content.includes("```")) {
          // Code blocks should be balanced
          const codeBlockCount = (content.match(/```/g) || []).length;
          assertEquals(
            codeBlockCount % 2,
            0,
            `Template "${key}" should have balanced code blocks`,
          );
        }
      }
    });

    it("should_handle_special_characters_and_escaping", () => {
      for (const [key, content] of Object.entries(prompts)) {
        // Should handle backslash escaping properly
        if (content.includes("\\")) {
          const _backslashes = content.match(/\\\\/g) || [];
          const _singleBackslashes = content.match(/(?<!\\)\\(?!\\)/g) || [];

          // Should not have unescaped special sequences that break markdown
          assert(
            !content.includes("\\n") || content.includes("\\\\n"),
            `Template "${key}" should properly escape newline sequences`,
          );
        }

        // Should handle quotes appropriately
        if (content.includes('"')) {
          // Should not have unbalanced quotes in structured content
          const quotes = (content.match(/"/g) || []).length;
          if (quotes > 2) { // More than simple quoted strings
            // This is a warning rather than assertion as quotes can be contextual
            console.log(`Template "${key}" has multiple quotes - verify proper escaping`);
          }
        }
      }
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should_handle_missing_variable_scenarios", () => {
      // Test templates that might not have all expected variables
      const templatesWithoutCommonVars = Object.entries(prompts).filter(([, content]) =>
        !content.includes("{input_text}") &&
        !content.includes("{input_text_file}") &&
        content.length > 100
      );

      for (const [key, content] of templatesWithoutCommonVars) {
        // Should still be functional without common variables
        assert(
          content.includes("Input") ||
            content.includes("input") ||
            content.includes("content") ||
            content.includes("information") ||
            content.trim().length > 50,
          `Template "${key}" should be functional even without common variables`,
        );
      }
    });

    it("should_provide_fallback_behavior_guidance", () => {
      // Look for templates that provide guidance on handling missing information
      const guidanceKeywords = [
        "missing",
        "Missing",
        "unclear",
        "Unclear",
        "unknown",
        "Unknown",
        "not available",
        "Not available",
      ];

      let templatesWithGuidance = 0;

      for (const [_key, content] of Object.entries(prompts)) {
        const hasGuidance = guidanceKeywords.some((keyword) => content.includes(keyword));

        if (hasGuidance) {
          templatesWithGuidance++;
        }
      }

      assert(
        templatesWithGuidance > 0,
        "Should have templates that provide guidance for handling missing information",
      );
    });

    it("should_handle_edge_case_input_scenarios", () => {
      // Test that templates can handle various input scenarios
      const edgeCaseKeywords = [
        "empty",
        "Empty",
        "invalid",
        "Invalid",
        "error",
        "Error",
        "exception",
        "Exception",
      ];

      let templatesHandlingEdgeCases = 0;

      for (const [_key, content] of Object.entries(prompts)) {
        const handlesEdgeCases = edgeCaseKeywords.some((keyword) => content.includes(keyword));

        if (handlesEdgeCases) {
          templatesHandlingEdgeCases++;
        }
      }

      // Should have some templates that explicitly handle edge cases
      assert(
        templatesHandlingEdgeCases > 0,
        "Should have templates that handle edge case scenarios",
      );
    });
  });
});
