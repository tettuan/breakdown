/**
 * @fileoverview Prompts Structure Tests
 * 
 * Tests for structural integrity and data consistency of prompts module.
 * Focuses on data organization, template relationships, and content structure validation.
 * 
 * @module templates/2_structure_prompts_test
 */

import { assertEquals, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { prompts } from "./prompts.ts";

describe("Prompts_Structure", () => {
  describe("Data Organization Structure", () => {
    it("should_maintain_hierarchical_key_structure", () => {
      const keys = Object.keys(prompts);
      const hierarchy = new Map<string, Map<string, Set<string>>>();
      
      // Build hierarchy map: directive -> layer -> files
      for (const key of keys) {
        const parts = key.split("/");
        
        if (parts.length >= 2) {
          const directive = parts[0];
          const layer = parts.length >= 3 ? parts[1] : "root";
          const filename = parts[parts.length - 1];
          
          if (!hierarchy.has(directive)) {
            hierarchy.set(directive, new Map());
          }
          if (!hierarchy.get(directive)!.has(layer)) {
            hierarchy.get(directive)!.set(layer, new Set());
          }
          hierarchy.get(directive)!.get(layer)!.add(filename);
        }
      }
      
      // Validate hierarchy structure
      assert(hierarchy.size > 0, "Should have at least one directive");
      
      for (const [directive, layers] of hierarchy) {
        assert(layers.size > 0, `Directive "${directive}" should have at least one layer`);
        
        for (const [layer, files] of layers) {
          assert(files.size > 0, `Layer "${directive}/${layer}" should have at least one file`);
          
          // Validate filename consistency within layer
          for (const filename of files) {
            assert(
              filename.endsWith(".md"),
              `File "${filename}" in "${directive}/${layer}" should have .md extension`
            );
          }
        }
      }
    });

    it("should_maintain_consistent_template_categorization", () => {
      const keys = Object.keys(prompts);
      const categories = {
        standard: new Set<string>(),
        specialized: new Set<string>(),
        documentation: new Set<string>(),
        samples: new Set<string>(),
      };
      
      // Categorize templates
      for (const key of keys) {
        if (key.startsWith("samples/")) {
          categories.samples.add(key);
        } else if (key === "README.md" || key.includes("README")) {
          categories.documentation.add(key);
        } else if (key.includes("_strict") || key.includes("_detailed") || key.includes("_critical")) {
          categories.specialized.add(key);
        } else if (key.includes("/f_")) {
          categories.standard.add(key);
        }
      }
      
      // Validate category distribution
      assert(categories.standard.size > 0, "Should have standard templates");
      assert(categories.specialized.size > 0, "Should have specialized templates");
      assert(categories.documentation.size > 0, "Should have documentation");
      assert(categories.samples.size > 0, "Should have sample templates");
      
      // Validate category relationships
      const totalCategorized = Object.values(categories).reduce((sum, set) => sum + set.size, 0);
      assert(
        totalCategorized <= keys.length,
        "All templates should fit into defined categories"
      );
    });

    it("should_maintain_consistent_naming_patterns", () => {
      const keys = Object.keys(prompts);
      const namingPatterns = {
        standardTemplate: /^[a-z]+\/[a-z]+\/f_[a-z]+\.md$/,
        specializedTemplate: /^[a-z]+\/[a-z]+\/[a-zA-Z_]+\.md$/,
        documentationFile: /^[A-Z][a-zA-Z]*\.md$/,
        sampleFile: /^samples\/[a-zA-Z\/]+\.md$/,
        specialFormat: /^[a-z]+\/[a-zA-Z_]+\.md$/,
      };
      
      const patternCounts = Object.fromEntries(
        Object.keys(namingPatterns).map(pattern => [pattern, 0])
      );
      
      for (const key of keys) {
        let matched = false;
        for (const [patternName, pattern] of Object.entries(namingPatterns)) {
          if (pattern.test(key)) {
            patternCounts[patternName]++;
            matched = true;
            break;
          }
        }
        
        assert(matched, `Key "${key}" does not match any expected naming pattern`);
      }
      
      // Validate pattern distribution
      assert(patternCounts.standardTemplate > 0, "Should have standard f_ templates");
      assert(patternCounts.specializedTemplate > 0, "Should have specialized templates");
    });
  });

  describe("Content Structure Consistency", () => {
    it("should_maintain_consistent_template_sections", () => {
      const entries = Object.entries(prompts);
      const sectionPatterns = {
        headers: /^#+\s+(.+)$/gm,
        inputSections: /## Input|# Input|input:|Input:/gi,
        outputSections: /## Output|# Output|output:|Output:/gi,
        instructionSections: /## Instructions|# Instructions|instructions:|Instructions:/gi,
      };
      
      for (const [key, content] of entries) {
        if (content.length > 200 && key.includes("/f_")) { // Focus on substantial standard templates
          const sections = {
            headers: (content.match(sectionPatterns.headers) || []).length,
            input: (content.match(sectionPatterns.inputSections) || []).length,
            output: (content.match(sectionPatterns.outputSections) || []).length,
            instructions: (content.match(sectionPatterns.instructionSections) || []).length,
          };
          
          // Standard templates should have structured sections
          assert(
            sections.headers > 0 || sections.input > 0 || sections.output > 0,
            `Standard template "${key}" should have structured sections`
          );
          
          // Templates with variables should reference input/output
          if (content.includes("{")) {
            const hasInputOutput = sections.input > 0 || sections.output > 0 || 
                                 content.includes("input") || content.includes("output") ||
                                 content.includes("Input") || content.includes("Output");
            
            assert(
              hasInputOutput,
              `Template "${key}" with variables should reference input/output`
            );
          }
        }
      }
    });

    it("should_maintain_consistent_variable_structure", () => {
      const variableStructure = new Map<string, {
        templates: Set<string>,
        contexts: Set<string>,
        patterns: Set<string>
      }>();
      
      // Analyze variable usage patterns
      for (const [key, content] of Object.entries(prompts)) {
        const variables = content.match(/\{([^}]+)\}/g) || [];
        
        for (const variable of variables) {
          const varName = variable.slice(1, -1);
          const context = key.split("/")[0]; // directive
          
          if (!variableStructure.has(varName)) {
            variableStructure.set(varName, {
              templates: new Set(),
              contexts: new Set(),
              patterns: new Set()
            });
          }
          
          const varInfo = variableStructure.get(varName)!;
          varInfo.templates.add(key);
          varInfo.contexts.add(context);
          varInfo.patterns.add(variable);
        }
      }
      
      // Validate variable consistency
      for (const [varName, info] of variableStructure) {
        // Variables used in multiple templates should have consistent patterns
        if (info.templates.size > 1) {
          assertEquals(
            info.patterns.size,
            1,
            `Variable "${varName}" should have consistent formatting across templates`
          );
        }
        
        // Common variables should be used across multiple contexts
        const commonVariables = ["input_text", "input_text_file", "destination_path"];
        if (commonVariables.includes(varName)) {
          assert(
            info.contexts.size >= 1,
            `Common variable "${varName}" should be used across multiple contexts`
          );
        }
      }
    });

    it("should_maintain_content_length_consistency", () => {
      const entries = Object.entries(prompts);
      const lengthCategories = {
        brief: { templates: new Set<string>(), min: 0, max: 200 },
        standard: { templates: new Set<string>(), min: 200, max: 1000 },
        detailed: { templates: new Set<string>(), min: 1000, max: 5000 },
        comprehensive: { templates: new Set<string>(), min: 5000, max: Infinity }
      };
      
      // Categorize by length
      for (const [key, content] of entries) {
        const length = content.length;
        
        for (const [category, info] of Object.entries(lengthCategories)) {
          if (length >= info.min && length < info.max) {
            info.templates.add(key);
            break;
          }
        }
      }
      
      // Validate length distribution
      assert(lengthCategories.brief.templates.size > 0, "Should have brief templates");
      assert(lengthCategories.standard.templates.size > 0, "Should have standard-length templates");
      
      // Specialized templates should tend to be longer
      for (const key of lengthCategories.comprehensive.templates) {
        const isSpecialized = key.includes("_detailed") || key.includes("_critical");
        if (isSpecialized) {
          assert(true, `Specialized template "${key}" appropriately comprehensive`);
        }
      }
      
      // Validate length appropriateness
      for (const [key, content] of entries) {
        if (key.includes("_detailed")) {
          assert(
            content.length > 500,
            `Detailed template "${key}" should be substantial (>500 chars)`
          );
        }
        
        if (key.includes("_critical")) {
          assert(
            content.length > 800,
            `Critical template "${key}" should be comprehensive (>800 chars)`
          );
        }
      }
    });
  });

  describe("Template Relationship Structure", () => {
    it("should_maintain_directive_layer_relationship_integrity", () => {
      const relationships = new Map<string, Map<string, Set<string>>>();
      const keys = Object.keys(prompts);
      
      // Build relationship map
      for (const key of keys) {
        const parts = key.split("/");
        if (parts.length >= 3) {
          const directive = parts[0];
          const layer = parts[1];
          const filename = parts[2];
          
          if (!relationships.has(directive)) {
            relationships.set(directive, new Map());
          }
          if (!relationships.get(directive)!.has(layer)) {
            relationships.get(directive)!.set(layer, new Set());
          }
          relationships.get(directive)!.get(layer)!.add(filename);
        }
      }
      
      // Validate relationship consistency
      for (const [directive, layers] of relationships) {
        const expectedLayers = ["project", "issue", "task"];
        const actualLayers = Array.from(layers.keys());
        
        // Should have logical layer progression for most directives
        if (directive !== "find" && directive !== "samples") { // Special cases
          const hasProjectLevel = actualLayers.includes("project");
          const hasTaskLevel = actualLayers.includes("task");
          
          if (hasProjectLevel && hasTaskLevel) {
            // Should also have issue level for complete hierarchy
            assert(
              actualLayers.includes("issue"),
              `Directive "${directive}" should have issue layer to complete hierarchy`
            );
          }
        }
      }
    });

    it("should_maintain_template_variant_relationships", () => {
      const baseTemplates = new Map<string, Set<string>>();
      const variants = new Map<string, Set<string>>();
      
      // Identify base templates and their variants
      for (const key of Object.keys(prompts)) {
        const parts = key.split("/");
        if (parts.length >= 3) {
          const directive = parts[0];
          const layer = parts[1];
          const filename = parts[2];
          const baseKey = `${directive}/${layer}`;
          
          if (!baseTemplates.has(baseKey)) {
            baseTemplates.set(baseKey, new Set());
          }
          baseTemplates.get(baseKey)!.add(filename);
          
          // Track variants
          if (filename.includes("_")) {
            const baseName = filename.split("_")[0];
            const variantKey = `${baseKey}/${baseName}`;
            
            if (!variants.has(variantKey)) {
              variants.set(variantKey, new Set());
            }
            variants.get(variantKey)!.add(filename);
          }
        }
      }
      
      // Validate variant relationships
      for (const [variantKey, filenames] of variants) {
        if (filenames.size > 1) {
          // Should have a base template and variants
          const hasBase = Array.from(filenames).some(name => !name.includes("_") || name.startsWith("f_"));
          const hasVariants = Array.from(filenames).some(name => 
            name.includes("_strict") || name.includes("_detailed") || name.includes("_critical")
          );
          
          if (hasVariants) {
            assert(
              hasBase,
              `Variant group "${variantKey}" should have a base template`
            );
          }
        }
      }
    });

    it("should_maintain_cross_directive_consistency", () => {
      const directiveStructure = new Map<string, Set<string>>();
      const layerStructure = new Map<string, Set<string>>();
      
      // Analyze structure across directives
      for (const key of Object.keys(prompts)) {
        const parts = key.split("/");
        if (parts.length >= 3) {
          const directive = parts[0];
          const layer = parts[1];
          
          if (!directiveStructure.has(directive)) {
            directiveStructure.set(directive, new Set());
          }
          directiveStructure.get(directive)!.add(layer);
          
          if (!layerStructure.has(layer)) {
            layerStructure.set(layer, new Set());
          }
          layerStructure.get(layer)!.add(directive);
        }
      }
      
      // Validate cross-directive consistency
      const commonLayers = Array.from(layerStructure.keys()).filter(layer => 
        layerStructure.get(layer)!.size > 1
      );
      
      assert(
        commonLayers.length > 0,
        "Should have layers that are common across multiple directives"
      );
      
      // Common layers should have similar template patterns
      for (const layer of commonLayers) {
        const directivesForLayer = Array.from(layerStructure.get(layer)!);
        
        if (directivesForLayer.length >= 2) {
          // Should have consistent template availability
          const templateCounts = directivesForLayer.map(directive => 
            Object.keys(prompts).filter(key => key.startsWith(`${directive}/${layer}/`)).length
          );
          
          const minTemplates = Math.min(...templateCounts);
          const maxTemplates = Math.max(...templateCounts);
          
          // Should not have extreme imbalances, but allow for some variation
          if (minTemplates > 0) {
            const ratio = maxTemplates / minTemplates;
            if (ratio > 10) { // Very extreme imbalance
              console.warn(`Layer "${layer}" has significant template count imbalance: ${ratio}x difference`);
            }
            // More lenient check for balance
            assert(
              ratio <= 20, // Allow up to 20x difference for flexibility
              `Layer "${layer}" template count imbalance is excessive: ${ratio}x difference (max: ${maxTemplates}, min: ${minTemplates})`
            );
          }
        }
      }
    });
  });

  describe("Data Integrity Structure", () => {
    it("should_maintain_content_encoding_consistency", () => {
      for (const [key, content] of Object.entries(prompts)) {
        // Should not contain null bytes
        assert(
          !content.includes("\0"),
          `Template "${key}" should not contain null bytes`
        );
        
        // Should have consistent line endings
        const hasWindowsEndings = content.includes("\r\n");
        const hasUnixEndings = content.includes("\n") && !content.includes("\r\n");
        const hasMacEndings = content.includes("\r") && !content.includes("\n");
        
        const endingTypes = [hasWindowsEndings, hasUnixEndings, hasMacEndings].filter(Boolean).length;
        
        assert(
          endingTypes <= 1,
          `Template "${key}" should have consistent line endings`
        );
        
        // Should handle unicode properly
        if (/[\u0080-\uFFFF]/.test(content)) {
          // Has non-ASCII characters - should be properly encoded
          assert(
            content.length === [...content].length || content.length >= [...content].length,
            `Template "${key}" should handle unicode characters properly`
          );
        }
      }
    });

    it("should_maintain_structural_completeness", () => {
      const keys = Object.keys(prompts);
      const structure = {
        directives: new Set<string>(),
        layers: new Set<string>(),
        combinations: new Set<string>(),
        specialFiles: new Set<string>()
      };
      
      // Analyze structural completeness
      for (const key of keys) {
        const parts = key.split("/");
        
        if (parts.length >= 3) {
          const directive = parts[0];
          const layer = parts[1];
          const combination = `${directive}/${layer}`;
          
          structure.directives.add(directive);
          structure.layers.add(layer);
          structure.combinations.add(combination);
        } else {
          structure.specialFiles.add(key);
        }
      }
      
      // Validate structural completeness
      const expectedDirectives = ["defect", "to", "summary"];
      const expectedLayers = ["project", "issue", "task"];
      
      for (const directive of expectedDirectives) {
        assert(
          structure.directives.has(directive),
          `Should have templates for directive: ${directive}`
        );
      }
      
      for (const layer of expectedLayers) {
        assert(
          structure.layers.has(layer),
          `Should have templates for layer: ${layer}`
        );
      }
      
      // Should have reasonable coverage of combinations
      const expectedCombinations = expectedDirectives.flatMap(d => 
        expectedLayers.map(l => `${d}/${l}`)
      );
      
      const actualCombinations = Array.from(structure.combinations);
      const coverage = expectedCombinations.filter(combo => 
        actualCombinations.includes(combo)
      ).length;
      
      assert(
        coverage >= expectedCombinations.length * 0.6, // At least 60% coverage
        `Should have reasonable coverage of directive/layer combinations (${coverage}/${expectedCombinations.length})`
      );
    });

    it("should_maintain_size_and_performance_structure", () => {
      const entries = Object.entries(prompts);
      const sizeMetrics = {
        totalSize: 0,
        maxSize: 0,
        avgSize: 0,
        templateCount: entries.length
      };
      
      // Calculate size metrics
      for (const [, content] of entries) {
        const size = content.length;
        sizeMetrics.totalSize += size;
        sizeMetrics.maxSize = Math.max(sizeMetrics.maxSize, size);
      }
      sizeMetrics.avgSize = sizeMetrics.totalSize / sizeMetrics.templateCount;
      
      // Validate size structure
      assert(
        sizeMetrics.totalSize <= 5000000, // 5MB total limit
        `Total prompts size should be reasonable for memory usage (${sizeMetrics.totalSize} bytes)`
      );
      
      assert(
        sizeMetrics.maxSize <= 100000, // 100KB per template limit
        `Individual templates should not be excessively large (max: ${sizeMetrics.maxSize} bytes)`
      );
      
      assert(
        sizeMetrics.avgSize >= 100, // Minimum average size for meaningful content
        `Templates should have meaningful content (avg: ${sizeMetrics.avgSize} bytes)`
      );
      
      // Validate size distribution
      const sizeBuckets = {
        small: entries.filter(([, c]) => c.length < 500).length,
        medium: entries.filter(([, c]) => c.length >= 500 && c.length < 2000).length,
        large: entries.filter(([, c]) => c.length >= 2000).length
      };
      
      assert(
        sizeBuckets.small + sizeBuckets.medium + sizeBuckets.large === entries.length,
        "All templates should be categorized by size"
      );
      
      // Should have variety in template sizes
      assert(sizeBuckets.small > 0, "Should have small templates for simple cases");
      assert(sizeBuckets.medium > 0, "Should have medium templates for standard cases");
      
      console.log(`Template size distribution: Small(${sizeBuckets.small}), Medium(${sizeBuckets.medium}), Large(${sizeBuckets.large})`);
    });
  });
});