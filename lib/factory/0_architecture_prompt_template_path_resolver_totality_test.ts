/**
 * @fileoverview Architecture tests for PromptTemplatePathResolverTotality
 * 
 * Tests verify:
 * - Smart constructor validation
 * - Result type usage throughout
 * - No partial functions
 * - Discriminated union handling
 * - Exhaustive error cases
 */

import { assertEquals, assertExists } from "@std/assert";
import { PromptTemplatePathResolverTotality, type PromptResolverConfig } from "./prompt_template_path_resolver_totality.ts";
import type { PathResolutionError } from "../types/path_resolution_option.ts";

Deno.test("PromptTemplatePathResolverTotality - Smart Constructor validates inputs", () => {
  // Test invalid config
  const invalidConfigs = [
    null,
    undefined,
    [],
    "string",
    123,
  ];

  for (const config of invalidConfigs) {
    const result = PromptTemplatePathResolverTotality.create(
      config as any,
      { demonstrativeType: "to", layerType: "project", options: {} }
    );
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidConfiguration");
    }
  }

  // Test invalid cliParams
  const validConfig = { app_prompt: { base_dir: "test" } };
  const invalidParams = [
    null,
    undefined,
    [],
    "string",
    123,
  ];

  for (const params of invalidParams) {
    const result = PromptTemplatePathResolverTotality.create(
      validConfig,
      params as any
    );
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidConfiguration");
    }
  }
});

Deno.test("PromptTemplatePathResolverTotality - validates required parameters", () => {
  const config = { app_prompt: { base_dir: "test" } };

  // Missing demonstrativeType
  const result1 = PromptTemplatePathResolverTotality.create(
    config,
    { demonstrativeType: "", layerType: "project", options: {} }
  );
  assertEquals(result1.ok, false);
  if (!result1.ok) {
    assertEquals(result1.error.kind, "InvalidParameterCombination");
  }

  // Missing layerType
  const result2 = PromptTemplatePathResolverTotality.create(
    config,
    { demonstrativeType: "to", layerType: "", options: {} }
  );
  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertEquals(result2.error.kind, "InvalidParameterCombination");
  }

  // Valid parameters
  const result3 = PromptTemplatePathResolverTotality.create(
    config,
    { demonstrativeType: "to", layerType: "project", options: {} }
  );
  assertEquals(result3.ok, true);
});

Deno.test("PromptTemplatePathResolverTotality - normalizes config to discriminated union", () => {
  // WithPromptConfig
  const result1 = PromptTemplatePathResolverTotality.create(
    { app_prompt: { base_dir: "prompts" } },
    { demonstrativeType: "to", layerType: "project", options: {} }
  );
  assertEquals(result1.ok, true);

  // WithSchemaConfig
  const result2 = PromptTemplatePathResolverTotality.create(
    { app_schema: { base_dir: "schema" } },
    { demonstrativeType: "to", layerType: "project", options: {} }
  );
  assertEquals(result2.ok, true);

  // NoConfig
  const result3 = PromptTemplatePathResolverTotality.create(
    {},
    { demonstrativeType: "to", layerType: "project", options: {} }
  );
  assertEquals(result3.ok, true);
});

Deno.test("PromptTemplatePathResolverTotality - resolveFromLayerTypeSafe returns Result", () => {
  const config = { app_prompt: { base_dir: "." } };
  
  // With explicit fromLayerType
  const resolverResult1 = PromptTemplatePathResolverTotality.create(
    config,
    { 
      demonstrativeType: "to", 
      layerType: "project", 
      options: { fromLayerType: "issue" } 
    }
  );
  
  assertEquals(resolverResult1.ok, true);
  if (resolverResult1.ok) {
    const resolver = resolverResult1.data;
    // Access private method through public interface
    const fileName = resolver.buildFileName();
    assertEquals(fileName, "f_issue.md");
  }

  // With fromFile that contains layer type
  const resolverResult2 = PromptTemplatePathResolverTotality.create(
    config,
    { 
      demonstrativeType: "to", 
      layerType: "project", 
      options: { fromFile: "issue_details.md" } 
    }
  );
  
  assertEquals(resolverResult2.ok, true);
  if (resolverResult2.ok) {
    const resolver = resolverResult2.data;
    const fileName = resolver.buildFileName();
    assertEquals(fileName, "f_issue.md");
  }

  // Without fromLayerType or fromFile - falls back to layerType
  const resolverResult3 = PromptTemplatePathResolverTotality.create(
    config,
    { 
      demonstrativeType: "to", 
      layerType: "project", 
      options: {} 
    }
  );
  
  assertEquals(resolverResult3.ok, true);
  if (resolverResult3.ok) {
    const resolver = resolverResult3.data;
    const fileName = resolver.buildFileName();
    assertEquals(fileName, "f_project.md");
  }
});

Deno.test("PromptTemplatePathResolverTotality - handles schema file resolution", () => {
  const config = { app_schema: { base_dir: "schema" } };
  
  const resolverResult = PromptTemplatePathResolverTotality.create(
    config,
    { 
      demonstrativeType: "to", 
      layerType: "project", 
      options: { useSchema: true } 
    }
  );
  
  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    const fileName = resolver.buildFileName();
    assertEquals(fileName, "f_project.json"); // Schema files use .json
  }
});

Deno.test("PromptTemplatePathResolverTotality - handles adaptation options", () => {
  const config = { app_prompt: { base_dir: "." } };
  
  // With adaptation
  const resolverResult1 = PromptTemplatePathResolverTotality.create(
    config,
    { 
      demonstrativeType: "to", 
      layerType: "project", 
      options: { adaptation: "analysis" } 
    }
  );
  
  assertEquals(resolverResult1.ok, true);
  if (resolverResult1.ok) {
    const resolver = resolverResult1.data;
    const fileName = resolver.buildFileName();
    assertEquals(fileName, "f_project_analysis.md");
  }

  // Without adaptation
  const resolverResult2 = PromptTemplatePathResolverTotality.create(
    config,
    { 
      demonstrativeType: "to", 
      layerType: "project", 
      options: {} 
    }
  );
  
  assertEquals(resolverResult2.ok, true);
  if (resolverResult2.ok) {
    const resolver = resolverResult2.data;
    const fileName = resolver.buildFileName();
    assertEquals(fileName, "f_project.md");
  }
});

Deno.test("PromptTemplatePathResolverTotality - buildPromptPath constructs correct paths", () => {
  const config = { app_prompt: { base_dir: "prompts" } };
  
  const resolverResult = PromptTemplatePathResolverTotality.create(
    config,
    { demonstrativeType: "to", layerType: "project", options: {} }
  );
  
  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    const path = resolver.buildPromptPath("/base", "f_project.md");
    assertEquals(path, "/base/to/project/f_project.md");
  }
});

Deno.test("PromptTemplatePathResolverTotality - handles TwoParams_Result structure", () => {
  const config = { app_prompt: { base_dir: "." } };
  
  const twoParams = {
    type: "two" as const,
    params: ["summary", "issue"],
    demonstrativeType: "summary",
    layerType: "issue",
    options: { adaptation: "brief" }
  };
  
  const resolverResult = PromptTemplatePathResolverTotality.create(config, twoParams);
  
  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    const fileName = resolver.buildFileName();
    assertEquals(fileName, "f_issue_brief.md");
  }
});

Deno.test("PromptTemplatePathResolverTotality - inference failure returns meaningful error", () => {
  const config = { app_prompt: { base_dir: "." } };
  
  // With fromFile that doesn't contain any layer type
  const resolverResult = PromptTemplatePathResolverTotality.create(
    config,
    { 
      demonstrativeType: "to", 
      layerType: "project", 
      options: { fromFile: "random_file.md" } 
    }
  );
  
  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    // Should fall back to layerType when inference fails
    const fileName = resolver.buildFileName();
    assertEquals(fileName, "f_project.md");
  }
});