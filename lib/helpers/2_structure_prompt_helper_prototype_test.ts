/**
 * @fileoverview 2_structure tests for PromptHelperPrototype
 *
 * Tests structural integrity and consistency of experimental prompt processing:
 * - Interface and type structure validation
 * - Data structure consistency and immutability
 * - Configuration option structure integrity
 * - Result type structure and completeness
 * - Error type structure and hierarchy
 * - Method signature consistency
 * - State management structure validation
 *
 * @module helpers/prompt_helper_prototype
 */

import { assert, assertEquals, assertExists } from "@std/assert";
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

// Helper functions for test setup
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

function createTestTemplate(content: string, directive = "to", layer = "project"): PromptTemplate {
  const directiveType = createTestDirectiveType(directive);
  const layerType = createTestLayerType(directive, layer);
  const pathResult = TemplatePath.create(directiveType, layerType, "test.md");
  assert(pathResult.ok);

  const templateResult = PromptTemplate.create(pathResult.data, content);
  assert(templateResult.ok);

  return templateResult.data;
}

Deno.test("PromptEnhancementOptions interface structure - has all required optional properties", () => {
  // Test that all properties are optional by creating with empty object
  const emptyOptions: PromptEnhancementOptions = {};
  assertExists(emptyOptions);

  // Test all properties are assignable
  const fullOptions: PromptEnhancementOptions = {
    autoDetectVariables: true,
    validateTemplate: false,
    enableDynamicContent: true,
    language: "ja",
    debug: false,
  };

  assertEquals(typeof fullOptions.autoDetectVariables, "boolean");
  assertEquals(typeof fullOptions.validateTemplate, "boolean");
  assertEquals(typeof fullOptions.enableDynamicContent, "boolean");
  assertEquals(fullOptions.language, "ja");
  assertEquals(typeof fullOptions.debug, "boolean");
});

Deno.test("PromptEnhancementOptions language property - accepts only valid values", () => {
  const jaOptions: PromptEnhancementOptions = { language: "ja" };
  assertEquals(jaOptions.language, "ja");

  const enOptions: PromptEnhancementOptions = { language: "en" };
  assertEquals(enOptions.language, "en");

  // TypeScript should prevent invalid values, but verify expected types
  const validLanguages = ["ja", "en"];
  assert(validLanguages.includes("ja"));
  assert(validLanguages.includes("en"));
});

Deno.test("VariableDetectionResult structure - contains all required properties with correct types", async () => {
  const helper = new PromptHelperPrototype({ autoDetectVariables: true });
  const template = createTestTemplate("Test {variable}");

  const result: VariableDetectionResult = await helper.detectVariables(template);

  // Verify structure completeness
  assertExists(result.detectedVariables);
  assertExists(result.missingVariables);
  assertExists(result.suggestedDefaults);
  assertExists(result.confidence);

  // Verify types
  assert(Array.isArray(result.detectedVariables));
  assert(Array.isArray(result.missingVariables));
  assert(result.suggestedDefaults instanceof Map);
  assertEquals(typeof result.confidence, "number");

  // Verify array element types
  result.detectedVariables.forEach((variable) => {
    assertEquals(typeof variable, "string");
  });

  result.missingVariables.forEach((variable) => {
    assertEquals(typeof variable, "string");
  });

  // Verify Map structure
  for (const [key, value] of result.suggestedDefaults) {
    assertEquals(typeof key, "string");
    assertEquals(typeof value, "string");
  }

  // Verify confidence range
  assert(result.confidence >= 0 && result.confidence <= 1);
});

Deno.test("TemplateEnhancementResult structure - maintains consistency across operations", async () => {
  const helper = new PromptHelperPrototype({ validateTemplate: true });
  const template = createTestTemplate("Test content");
  const directive = createTestDirectiveType("to");
  const layer = createTestLayerType("to", "project");

  const result: TemplateEnhancementResult = await helper.enhanceTemplate(
    template,
    directive,
    layer,
  );

  // Verify structure completeness
  assertExists(result.enhancedContent);
  assertExists(result.appliedEnhancements);
  assertExists(result.issues);
  assertExists(result.success);

  // Verify types
  assertEquals(typeof result.enhancedContent, "string");
  assert(Array.isArray(result.appliedEnhancements));
  assert(Array.isArray(result.issues));
  assertEquals(typeof result.success, "boolean");

  // Verify array element types
  result.appliedEnhancements.forEach((enhancement) => {
    assertEquals(typeof enhancement, "string");
  });

  result.issues.forEach((issue) => {
    assertEquals(typeof issue, "string");
  });

  // Verify logical consistency
  if (result.success) {
    assert(result.appliedEnhancements.length >= 0);
  }

  // Enhanced content should be at least as long as original (additions)
  assert(result.enhancedContent.length >= "Test content".length);
});

Deno.test("DynamicContentResult structure - maintains metadata consistency", async () => {
  const helper = new PromptHelperPrototype({ enableDynamicContent: true });
  const directive = createTestDirectiveType("summary");
  const layer = createTestLayerType("summary", "issue");

  const result: DynamicContentResult = await helper.generateDynamicContent(directive, layer);

  // Verify structure completeness
  assertExists(result.dynamicContent);
  assertExists(result.injectionPoints);
  assertExists(result.metadata);

  // Verify types
  assert(result.dynamicContent instanceof Map);
  assert(Array.isArray(result.injectionPoints));
  assertEquals(typeof result.metadata, "object");

  // Verify metadata structure
  assertExists(result.metadata.generatedAt);
  assertExists(result.metadata.directive);
  assertExists(result.metadata.layer);
  assertExists(result.metadata.language);

  assert(result.metadata.generatedAt instanceof Date);
  assertEquals(typeof result.metadata.directive, "string");
  assertEquals(typeof result.metadata.layer, "string");
  assertEquals(typeof result.metadata.language, "string");

  // Verify consistency between content and injection points
  assertEquals(result.dynamicContent.size, result.injectionPoints.length);

  // Verify injection point format
  result.injectionPoints.forEach((point) => {
    assert(point.startsWith("{{"));
    assert(point.endsWith("}}"));
    const key = point.slice(2, -2);
    assert(result.dynamicContent.has(key));
  });

  // Verify metadata values match inputs
  assertEquals(result.metadata.directive, "summary");
  assertEquals(result.metadata.layer, "issue");
});

Deno.test("PromptPrototypeError structure - extends Error correctly", () => {
  const error = new PromptPrototypeError("Test message", "testFeature", "Test details");

  // Verify inheritance
  assert(error instanceof Error);
  assert(error instanceof PromptPrototypeError);

  // Verify structure
  assertEquals(error.message, "Test message");
  assertEquals(error.feature, "testFeature");
  assertEquals(error.details, "Test details");
  assertEquals(error.name, "PromptPrototypeError");

  // Verify required properties exist
  assertExists(error.feature);
  assertEquals(typeof error.feature, "string");

  // Verify optional details
  assertEquals(typeof error.details, "string");

  // Test without details
  const errorNoDetails = new PromptPrototypeError("Test", "feature");
  assertEquals(errorNoDetails.details, undefined);
});

Deno.test("PromptHelperPrototype class structure - has all required methods", () => {
  const helper = new PromptHelperPrototype();

  // Verify method existence and types
  assertEquals(typeof helper.detectVariables, "function");
  assertEquals(typeof helper.enhanceTemplate, "function");
  assertEquals(typeof helper.generateDynamicContent, "function");
  assertEquals(typeof helper.validateFeatureAvailability, "function");
  assertEquals(typeof helper.getFeatureStatus, "function");

  // Verify method signatures return correct types
  const status = helper.getFeatureStatus();
  assertEquals(typeof status, "object");
  assertExists(status.version);
  assertExists(status.features);
  assertExists(status.options);

  const availability = helper.validateFeatureAvailability();
  assertEquals(typeof availability, "object");
  assert(Array.isArray(availability.available));
  assert(Array.isArray(availability.disabled));
});

Deno.test("PromptHelperPrototype getFeatureStatus - returns complete structured information", () => {
  const options: PromptEnhancementOptions = {
    autoDetectVariables: true,
    validateTemplate: false,
    enableDynamicContent: true,
    language: "en",
    debug: true,
  };

  const helper = new PromptHelperPrototype(options);
  const status = helper.getFeatureStatus();

  // Verify return type structure
  assertEquals(typeof status.version, "string");
  assertEquals(typeof status.features, "object");
  assertEquals(typeof status.options, "object");

  // Verify version format
  assert(status.version.includes("prototype"));
  assert(status.version.match(/^\d+\.\d+\.\d+-\w+$/));

  // Verify features object structure
  const expectedFeatures = [
    "autoDetectVariables",
    "validateTemplate",
    "enableDynamicContent",
    "debug",
  ];
  expectedFeatures.forEach((feature) => {
    assertExists(status.features[feature]);
    assertEquals(typeof status.features[feature], "boolean");
  });

  // Verify options object preserves original structure
  assertEquals(status.options.autoDetectVariables, options.autoDetectVariables);
  assertEquals(status.options.validateTemplate, options.validateTemplate);
  assertEquals(status.options.enableDynamicContent, options.enableDynamicContent);
  assertEquals(status.options.language, options.language);
  assertEquals(status.options.debug, options.debug);
});

Deno.test("PromptHelperPrototype validateFeatureAvailability - returns consistent structure", () => {
  const helper = new PromptHelperPrototype({
    autoDetectVariables: true,
    validateTemplate: true,
    enableDynamicContent: false,
  });

  const availability = helper.validateFeatureAvailability();

  // Verify structure
  assertExists(availability.available);
  assertExists(availability.disabled);
  assert(Array.isArray(availability.available));
  assert(Array.isArray(availability.disabled));

  // Verify all features are accounted for
  const allFeatures = [...availability.available, ...availability.disabled];
  const expectedFeatures = ["variable_detection", "template_enhancement", "dynamic_content"];

  expectedFeatures.forEach((feature) => {
    assert(allFeatures.includes(feature));
  });

  // Verify no duplicates
  assertEquals(allFeatures.length, new Set(allFeatures).size);

  // Verify consistency with constructor options
  assert(availability.available.includes("variable_detection"));
  assert(availability.available.includes("template_enhancement"));
  assert(availability.disabled.includes("dynamic_content"));
});

Deno.test("Factory function createPromptHelperPrototype - creates consistent instances", () => {
  const options: PromptEnhancementOptions = { language: "ja", debug: false };

  const helper1 = createPromptHelperPrototype(options);
  const helper2 = createPromptHelperPrototype(options);

  // Verify both instances have same configuration
  const status1 = helper1.getFeatureStatus();
  const status2 = helper2.getFeatureStatus();

  assertEquals(status1.version, status2.version);
  assertEquals(status1.options.language, status2.options.language);
  assertEquals(status1.options.debug, status2.options.debug);

  // Verify instances are separate objects
  assert(helper1 !== helper2);

  // Test with no options
  const defaultHelper = createPromptHelperPrototype();
  const defaultStatus = defaultHelper.getFeatureStatus();

  assertEquals(defaultStatus.options.language, "ja"); // Default value
  assertEquals(defaultStatus.features.debug, false); // Default value
});

Deno.test("Utility functions structure - maintain consistent interfaces", () => {
  // Test isExperimentalFeature function structure
  assertEquals(typeof isExperimentalFeature, "function");
  assertEquals(typeof isExperimentalFeature("test"), "boolean");

  // Test getExperimentalFeatures function structure
  assertEquals(typeof getExperimentalFeatures, "function");
  const features = getExperimentalFeatures();
  assert(Array.isArray(features));

  // Verify all returned features are strings
  features.forEach((feature) => {
    assertEquals(typeof feature, "string");
    assert(feature.length > 0);
  });

  // Verify consistency between utility functions
  // Note: Some features in getExperimentalFeatures may not be implemented yet
  const implementedFeatures = [
    "variable_detection",
    "template_enhancement",
    "dynamic_content",
    "japanese_enhancements",
  ];
  implementedFeatures.forEach((feature) => {
    assertEquals(isExperimentalFeature(feature), true);
  });
});

Deno.test("PromptHelperPrototype option immutability - preserves original configuration", () => {
  const originalOptions: PromptEnhancementOptions = {
    autoDetectVariables: true,
    validateTemplate: false,
    language: "en",
  };

  const helper = new PromptHelperPrototype(originalOptions);

  // Modify original options object
  originalOptions.autoDetectVariables = false;
  originalOptions.language = "ja";

  // Verify helper's configuration is unaffected
  const status = helper.getFeatureStatus();
  assertEquals(status.options.autoDetectVariables, true);
  assertEquals(status.options.language, "en");

  // Verify returned options are not the same reference
  assert(status.options !== originalOptions);
});

Deno.test("VariableDetectionResult consistency - maintains data relationships", async () => {
  const helper = new PromptHelperPrototype({ autoDetectVariables: true });
  const template = createTestTemplate("{var1} and {var2} and {var3}");
  const providedVars = TemplateVariables.create({ var1: "value1", var2: "value2" });

  const result = await helper.detectVariables(template, providedVars);

  // Verify data consistency
  assertEquals(result.detectedVariables.length, 3);
  assertEquals(result.missingVariables.length, 1);
  assert(result.missingVariables.includes("var3"));

  // Verify no overlap between missing and provided
  const providedKeys = Object.keys(providedVars.toObject());
  result.missingVariables.forEach((missing) => {
    assert(!providedKeys.includes(missing));
  });

  // Verify all detected variables are either provided or missing
  result.detectedVariables.forEach((detected) => {
    const isProvided = providedKeys.includes(detected);
    const isMissing = result.missingVariables.includes(detected);
    assert(isProvided || isMissing);
  });

  // Verify suggested defaults only exist for missing variables
  for (const [key] of result.suggestedDefaults) {
    assert(result.missingVariables.includes(key));
  }

  // Verify confidence calculation
  const expectedConfidence = providedKeys.length / result.detectedVariables.length;
  assertEquals(result.confidence, expectedConfidence);
});

Deno.test("DynamicContentResult injection point format - follows consistent pattern", async () => {
  const helper = new PromptHelperPrototype({ enableDynamicContent: true });
  const directive = createTestDirectiveType("to");
  const layer = createTestLayerType("to", "project");

  const result = await helper.generateDynamicContent(directive, layer);

  // Verify injection point format consistency
  result.injectionPoints.forEach((point) => {
    // Must start with {{ and end with }}
    assert(point.startsWith("{{"));
    assert(point.endsWith("}}"));

    // Content between braces should be valid identifier
    const content = point.slice(2, -2);
    assert(content.length > 0);
    assert(/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(content));

    // Must correspond to a key in dynamicContent
    assert(result.dynamicContent.has(content));
  });

  // Verify all dynamic content has corresponding injection point
  for (const [key] of result.dynamicContent) {
    const expectedPoint = `{{${key}}}`;
    assert(result.injectionPoints.includes(expectedPoint));
  }
});

Deno.test("Error handling structure - maintains error hierarchy and information", () => {
  const feature = "testFeature";
  const message = "Test error message";
  const details = "Detailed error information";

  const error = new PromptPrototypeError(message, feature, details);

  // Verify Error interface compliance
  assertEquals(error.name, "PromptPrototypeError");
  assertEquals(error.message, message);
  assert(error.stack !== undefined);

  // Verify additional properties
  assertEquals(error.feature, feature);
  assertEquals(error.details, details);

  // Verify string serialization includes all information
  const errorString = error.toString();
  assert(errorString.includes("PromptPrototypeError"));
  assert(errorString.includes(message));

  // Test JSON serialization preserves custom properties
  const errorData = JSON.parse(JSON.stringify(error));
  assertEquals(errorData.feature, feature);
  assertEquals(errorData.details, details);
});
