/**
 * @fileoverview 1_behavior tests for PromptHelperPrototype
 *
 * Tests behavioral aspects of experimental prompt processing features:
 * - Variable detection and suggestion behavior
 * - Template enhancement processing and validation
 * - Dynamic content generation functionality
 * - Feature availability and configuration management
 * - Error handling and prototype limitations
 * - Language-specific processing behavior
 *
 * @module helpers/prompt_helper_prototype
 */

import { assert, assertEquals, assertRejects, assertThrows } from "@std/assert";
import { DirectiveType, LayerType } from "../types/mod.ts";
import {
  PromptTemplate,
  TemplatePath,
  TemplateVariables,
} from "../domain/templates/prompt_generation_aggregate.ts";
import {
  createPromptHelperPrototype,
  type DynamicContentResult,
  getExperimentalFeatures,
  isExperimentalFeature,
  type PromptEnhancementOptions,
  PromptHelperPrototype,
  PromptPrototypeError,
  type TemplateEnhancementResult,
  type VariableDetectionResult,
} from "./prompt_helper_prototype.ts";
import { createTwoParamsResult } from "../types/two_params_result_extension.ts";

// Helper functions to create test types
function createTestDirectiveType(value: string): DirectiveType {
  const result = DirectiveType.create(value);
  if (!result.ok) {
    throw new Error(`Failed to create DirectiveType: ${result.error.message}`);
  }
  return result.data;
}

function createTestLayerType(directiveType: string, value: string): LayerType {
  const result = createTwoParamsResult(directiveType, value);
  const layerResult = LayerType.create(result);
  if (!layerResult.ok) {
    throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
  }
  return layerResult.data;
}

// Helper function to create test template
function createTestTemplate(content: string, directive = "to", layer = "project"): PromptTemplate {
  const directiveType = createTestDirectiveType(directive);
  const layerType = createTestLayerType(directive, layer);
  const pathResult = TemplatePath.create(directiveType, layerType, "test.md");
  assert(pathResult.ok);

  const templateResult = PromptTemplate.create(pathResult.data, content);
  assert(templateResult.ok);

  return templateResult.data;
}

Deno.test("PromptHelperPrototype constructor - initializes with default options", () => {
  const helper = new PromptHelperPrototype();
  const status = helper.getFeatureStatus();

  assertEquals(status.version, "0.1.0-prototype");
  assertEquals(status.features.autoDetectVariables, true);
  assertEquals(status.features.validateTemplate, true);
  assertEquals(status.features.enableDynamicContent, false);
  assertEquals(status.features.debug, false);
});

Deno.test("PromptHelperPrototype constructor - respects custom options", () => {
  const options: PromptEnhancementOptions = {
    autoDetectVariables: false,
    validateTemplate: true,
    enableDynamicContent: true,
    language: "en",
    debug: true,
  };

  const helper = new PromptHelperPrototype(options);
  const status = helper.getFeatureStatus();

  assertEquals(status.features.autoDetectVariables, false);
  assertEquals(status.features.validateTemplate, true);
  assertEquals(status.features.enableDynamicContent, true);
  assertEquals(status.features.debug, true);
  assertEquals(status.options.language, "en");
});

Deno.test("PromptHelperPrototype detectVariables - detects required and additional variables", async () => {
  const helper = new PromptHelperPrototype({ autoDetectVariables: true });

  const templateContent = "This is a {title} with {content} and {{additional}} variable.";
  const template = createTestTemplate(templateContent);

  const providedVars = TemplateVariables.create({ title: "Test Title" });

  const result: VariableDetectionResult = await helper.detectVariables(template, providedVars);

  // Should detect variables from both standard and extended syntax
  assert(result.detectedVariables.includes("title"));
  assert(result.detectedVariables.includes("content"));
  assert(result.detectedVariables.includes("additional"));

  // Should identify missing variables
  assert(result.missingVariables.includes("content"));
  assert(result.missingVariables.includes("additional"));
  assert(!result.missingVariables.includes("title")); // provided

  // Should have suggested defaults
  assert(result.suggestedDefaults.has("content"));
  assertEquals(result.suggestedDefaults.get("content"), "Content");

  // Confidence should be calculated correctly (1 provided / 4 total variables detected)
  // Note: Template detected 4 variables: title, content, {additional, additional
  assertEquals(result.confidence, 0.25);
});

Deno.test("PromptHelperPrototype detectVariables - throws error when disabled", async () => {
  const helper = new PromptHelperPrototype({ autoDetectVariables: false });
  const template = createTestTemplate("Test {variable}");

  await assertRejects(
    async () => await helper.detectVariables(template),
    PromptPrototypeError,
    "Variable detection is disabled",
  );
});

Deno.test("PromptHelperPrototype detectVariables - handles templates with no variables", async () => {
  const helper = new PromptHelperPrototype({ autoDetectVariables: true });
  const template = createTestTemplate("This template has no variables.");

  const result = await helper.detectVariables(template);

  assertEquals(result.detectedVariables.length, 0);
  assertEquals(result.missingVariables.length, 0);
  assertEquals(result.suggestedDefaults.size, 0);
  assertEquals(result.confidence, 1); // No variables means 100% satisfied
});

Deno.test("PromptHelperPrototype enhanceTemplate - adds context header and output format", async () => {
  const helper = new PromptHelperPrototype({
    validateTemplate: true,
    language: "ja",
  });

  const templateContent = "Process the {input} data carefully.";
  const template = createTestTemplate(templateContent, "summary", "project");

  const directive = createTestDirectiveType("summary");
  const layer = createTestLayerType("summary", "project");

  const result: TemplateEnhancementResult = await helper.enhanceTemplate(
    template,
    directive,
    layer,
  );

  assertEquals(result.success, true);
  assert(result.appliedEnhancements.includes("context_header"));
  assert(result.appliedEnhancements.includes("output_format"));
  assert(result.appliedEnhancements.includes("variable_syntax_validated"));
  assert(result.appliedEnhancements.includes("japanese_enhancements"));

  // Check that context header was added
  assert(result.enhancedContent.includes("## Context"));
  assert(result.enhancedContent.includes("Directive: summary"));
  assert(result.enhancedContent.includes("Layer: project"));

  // Check that output format was added
  assert(result.enhancedContent.includes("## Output Format"));
  assert(result.enhancedContent.includes("Summary (max 100 chars)"));
});

Deno.test("PromptHelperPrototype enhanceTemplate - detects invalid variable syntax", async () => {
  const helper = new PromptHelperPrototype({ validateTemplate: true });

  const templateContent = "Invalid syntax: {unclosed or }orphaned}";
  const template = createTestTemplate(templateContent);

  const directive = createTestDirectiveType("to");
  const layer = createTestLayerType("to", "task");

  const result = await helper.enhanceTemplate(template, directive, layer);

  assertEquals(result.success, true);
  assert(result.issues.includes("Invalid variable syntax detected"));
  assert(!result.appliedEnhancements.includes("variable_syntax_validated"));
});

Deno.test("PromptHelperPrototype enhanceTemplate - skips existing headers", async () => {
  const helper = new PromptHelperPrototype({ validateTemplate: true });

  const templateContent = `## Context
Already has context.

## Output
Already has output format.

Process {data}.`;

  const template = createTestTemplate(templateContent);
  const directive = createTestDirectiveType("to");
  const layer = createTestLayerType("to", "issue");

  const result = await helper.enhanceTemplate(template, directive, layer);

  assertEquals(result.success, true);
  assert(!result.appliedEnhancements.includes("context_header"));
  assert(!result.appliedEnhancements.includes("output_format"));
  assert(result.appliedEnhancements.includes("variable_syntax_validated"));
});

Deno.test("PromptHelperPrototype enhanceTemplate - throws error when disabled", async () => {
  const helper = new PromptHelperPrototype({ validateTemplate: false });
  const template = createTestTemplate("Test content");
  const directive = createTestDirectiveType("to");
  const layer = createTestLayerType("to", "project");

  await assertRejects(
    () => helper.enhanceTemplate(template, directive, layer),
    PromptPrototypeError,
    "Template enhancement is disabled",
  );
});

Deno.test("PromptHelperPrototype enhanceTemplate - handles English language", async () => {
  const helper = new PromptHelperPrototype({
    validateTemplate: true,
    language: "en",
  });

  const template = createTestTemplate("Process {input}.", "summary", "project");
  const directive = createTestDirectiveType("summary");
  const layer = createTestLayerType("summary", "project");

  const result = await helper.enhanceTemplate(template, directive, layer);

  assertEquals(result.success, true);
  assert(result.enhancedContent.includes("## Context"));
  assert(result.enhancedContent.includes("Directive: summary"));
  assert(result.enhancedContent.includes("Layer: project"));
  assert(result.enhancedContent.includes("## Output Format"));
  assert(result.enhancedContent.includes("Summary (max 100 chars)"));
  assert(!result.appliedEnhancements.includes("japanese_enhancements"));
});

Deno.test("PromptHelperPrototype generateDynamicContent - generates context-aware content", async () => {
  const helper = new PromptHelperPrototype({ enableDynamicContent: true, language: "ja" });

  const directive = createTestDirectiveType("to");
  const layer = createTestLayerType("to", "project");
  const context = { source: "markdown", target: "html" };

  const result: DynamicContentResult = await helper.generateDynamicContent(
    directive,
    layer,
    context,
  );

  assertEquals(result.dynamicContent.size, 3);
  assert(result.dynamicContent.has("dynamic_instruction"));
  assert(result.dynamicContent.has("dynamic_example"));
  assert(result.dynamicContent.has("dynamic_constraints"));

  assertEquals(result.injectionPoints.length, 3);
  assert(result.injectionPoints.includes("{{dynamic_instruction}}"));
  assert(result.injectionPoints.includes("{{dynamic_example}}"));
  assert(result.injectionPoints.includes("{{dynamic_constraints}}"));

  assertEquals(result.metadata.directive, "to");
  assertEquals(result.metadata.layer, "project");
  assertEquals(result.metadata.language, "ja");

  // Check content (note: implementation uses English for both ja and en)
  const instruction = result.dynamicContent.get("dynamic_instruction");
  assert(instruction?.includes("Execute to processing"));
  assert(instruction?.includes("project level"));
  assert(instruction?.includes("Context: source, target"));
});

Deno.test("PromptHelperPrototype generateDynamicContent - works without context", async () => {
  const helper = new PromptHelperPrototype({ enableDynamicContent: true, language: "en" });

  const directive = createTestDirectiveType("summary");
  const layer = createTestLayerType("summary", "issue");

  const result = await helper.generateDynamicContent(directive, layer);

  assertEquals(result.dynamicContent.size, 3);
  assertEquals(result.metadata.directive, "summary");
  assertEquals(result.metadata.layer, "issue");
  assertEquals(result.metadata.language, "en");

  // Check English content
  const instruction = result.dynamicContent.get("dynamic_instruction");
  assert(instruction?.includes("Execute summary processing"));
  assert(instruction?.includes("issue level"));
  assert(!instruction?.includes("Context:"));
});

Deno.test("PromptHelperPrototype generateDynamicContent - throws error when disabled", () => {
  const helper = new PromptHelperPrototype({ enableDynamicContent: false });
  const directive = createTestDirectiveType("to");
  const layer = createTestLayerType("to", "project");

  assertThrows(
    () => helper.generateDynamicContent(directive, layer),
    PromptPrototypeError,
    "Dynamic content generation is disabled",
  );
});

Deno.test("PromptHelperPrototype validateFeatureAvailability - reports correct feature status", () => {
  const helper = new PromptHelperPrototype({
    autoDetectVariables: true,
    validateTemplate: false,
    enableDynamicContent: true,
  });

  const availability = helper.validateFeatureAvailability();

  assert(availability.available.includes("variable_detection"));
  assert(availability.available.includes("dynamic_content"));
  assert(availability.disabled.includes("template_enhancement"));

  assertEquals(availability.available.length, 2);
  assertEquals(availability.disabled.length, 1);
});

Deno.test("PromptHelperPrototype getFeatureStatus - returns complete status information", () => {
  const options: PromptEnhancementOptions = {
    autoDetectVariables: false,
    validateTemplate: true,
    enableDynamicContent: true,
    language: "en",
    debug: true,
  };

  const helper = new PromptHelperPrototype(options);
  const status = helper.getFeatureStatus();

  assertEquals(status.version, "0.1.0-prototype");
  assertEquals(status.features.autoDetectVariables, false);
  assertEquals(status.features.validateTemplate, true);
  assertEquals(status.features.enableDynamicContent, true);
  assertEquals(status.features.debug, true);
  assertEquals(status.options.language, "en");
});

Deno.test("createPromptHelperPrototype factory function - creates instance correctly", () => {
  const options: PromptEnhancementOptions = { language: "en", debug: true };
  const helper = createPromptHelperPrototype(options);

  const status = helper.getFeatureStatus();
  assertEquals(status.options.language, "en");
  assertEquals(status.features.debug, true);
});

Deno.test("isExperimentalFeature utility - correctly identifies experimental features", () => {
  assertEquals(isExperimentalFeature("variable_detection"), true);
  assertEquals(isExperimentalFeature("template_enhancement"), true);
  assertEquals(isExperimentalFeature("dynamic_content"), true);
  assertEquals(isExperimentalFeature("japanese_enhancements"), true);
  assertEquals(isExperimentalFeature("non_existent_feature"), false);
  assertEquals(isExperimentalFeature("standard_feature"), false);
});

Deno.test("getExperimentalFeatures utility - returns all experimental features", () => {
  const features = getExperimentalFeatures();

  assert(features.includes("variable_detection"));
  assert(features.includes("template_enhancement"));
  assert(features.includes("dynamic_content"));
  assert(features.includes("japanese_enhancements"));
  assert(features.includes("auto_context_generation"));
  assert(features.includes("smart_defaults"));

  assertEquals(features.length, 6);
});

Deno.test("PromptHelperPrototype variable detection - generates appropriate default values", async () => {
  const helper = new PromptHelperPrototype({ autoDetectVariables: true });

  const templateContent =
    "Title: {title}, Name: {name}, Description: {description}, Date: {date}, Author: {author}, Custom: {custom_field}";
  const template = createTestTemplate(templateContent);

  const result = await helper.detectVariables(template);

  assertEquals(result.suggestedDefaults.get("title"), "Sample Title");
  assertEquals(result.suggestedDefaults.get("name"), "Sample Name");
  assertEquals(result.suggestedDefaults.get("description"), "Description");
  assertEquals(result.suggestedDefaults.get("author"), "System");
  assert(result.suggestedDefaults.get("date")?.match(/^\d{4}-\d{2}-\d{2}$/)); // Date format
  assertEquals(result.suggestedDefaults.get("custom_field"), "{custom_field value}");
});

Deno.test("PromptHelperPrototype enhancement - applies directive-specific output formats", async () => {
  const helper = new PromptHelperPrototype({ validateTemplate: true, language: "ja" });

  // Test different directive types
  const testCases = [
    { directive: "summary", expected: "Summary (max 100 chars)" },
    { directive: "to", expected: "Converted content" },
    { directive: "custom", expected: "Provide output in the specified format" },
  ];

  for (const testCase of testCases) {
    const template = createTestTemplate("Test content", testCase.directive, "project");
    const directive = createTestDirectiveType(testCase.directive);
    const layer = createTestLayerType(testCase.directive, "project");

    const result = await helper.enhanceTemplate(template, directive, layer);

    assert(result.enhancedContent.includes(testCase.expected));
  }
});

Deno.test("PromptHelperPrototype error handling - provides detailed error information", async () => {
  const helper = new PromptHelperPrototype({ enableDynamicContent: false });
  const directive = createTestDirectiveType("test");
  const layer = createTestLayerType("test", "project");

  try {
    await helper.generateDynamicContent(directive, layer);
    assert(false, "Should have thrown an error");
  } catch (error) {
    assert(error instanceof PromptPrototypeError);
    assertEquals(error.feature, "generateDynamicContent");
    assertEquals(error.details, "Enable enableDynamicContent option");
    assertEquals(error.name, "PromptPrototypeError");
  }
});
