/**
 * @fileoverview 1_behavior tests for PromptTemplatePathResolver
 * Testing functional behavior and business logic
 * 
 * Behavior tests verify:
 * - Correct resolution of prompt template paths
 * - Proper handling of adaptation-specific templates
 * - Expected fallback behavior for missing templates
 * - Layer type inference logic
 */

import { assertEquals, assertExists } from "@std/assert";
import { PromptTemplatePathResolver } from "./prompt_template_path_resolver.ts";
import type { PromptCliParams, TwoParams_Result } from "./prompt_variables_factory.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { join } from "@std/path";

const logger = new BreakdownLogger("behavior-prompt-template-path-resolver");

// Test fixtures
const validConfig = {
  prompt_dir: ".agent/prompts",
};

Deno.test("1_behavior: resolves standard prompt template paths", () => {
  logger.debug("Testing standard prompt template path resolution");
  
  const testCases = [
    {
      params: {
        demonstrativeType: "to",
        layerType: "project",
        options: {},
      },
      expectedPattern: /to\/project\.md$/,
      expectedStatus: "Found",
    },
    {
      params: {
        demonstrativeType: "summary",
        layerType: "issue",
        options: {},
      },
      expectedPattern: /summary\/issue\.md$/,
      expectedStatus: "Found",
    },
    {
      params: {
        demonstrativeType: "defect",
        layerType: "task",
        options: {},
      },
      expectedPattern: /defect\/task\.md$/,
      expectedStatus: "Found",
    },
  ];
  
  for (const { params, expectedPattern, expectedStatus } of testCases) {
    const resolverResult = PromptTemplatePathResolver.create(validConfig, params as PromptCliParams);
    assertEquals(resolverResult.ok, true);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);
      
      if (pathResult.ok) {
        assertEquals(pathResult.data.status, expectedStatus);
        assertEquals(expectedPattern.test(pathResult.data.value), true,
          `Path ${pathResult.data.value} should match pattern ${expectedPattern}`);
        assertEquals(pathResult.data.metadata.demonstrativeType, params.demonstrativeType);
        assertEquals(pathResult.data.metadata.layerType, params.layerType);
      }
    }
  }
});

Deno.test("1_behavior: resolves adaptation-specific prompt templates", () => {
  logger.debug("Testing adaptation-specific template resolution");
  
  const testCases = [
    {
      params: {
        demonstrativeType: "to",
        layerType: "project",
        options: { adaptation: "mermaid" },
      },
      expectedPattern: /to\/project_mermaid\.md$/,
      expectedAdaptation: "mermaid",
    },
    {
      params: {
        demonstrativeType: "summary",
        layerType: "issue",
        options: { adaptation: "detailed" },
      },
      expectedPattern: /summary\/issue_detailed\.md$/,
      expectedAdaptation: "detailed",
    },
  ];
  
  for (const { params, expectedPattern, expectedAdaptation } of testCases) {
    const resolverResult = PromptTemplatePathResolver.create(validConfig, params as PromptCliParams);
    assertEquals(resolverResult.ok, true);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);
      
      if (pathResult.ok) {
        assertEquals(expectedPattern.test(pathResult.data.value), true,
          `Path ${pathResult.data.value} should match pattern ${expectedPattern}`);
        assertEquals(pathResult.data.metadata.adaptation, expectedAdaptation);
      }
    }
  }
});

Deno.test("1_behavior: handles fromLayerType parameter", () => {
  logger.debug("Testing fromLayerType parameter handling");
  
  const testCases = [
    {
      params: {
        demonstrativeType: "to",
        layerType: "issue",
        options: { fromLayerType: "project" },
      },
      expectedFromLayerType: "project",
    },
    {
      params: {
        demonstrativeType: "summary",
        layerType: "task",
        options: { fromLayerType: "issue" },
      },
      expectedFromLayerType: "issue",
    },
  ];
  
  for (const { params, expectedFromLayerType } of testCases) {
    const resolverResult = PromptTemplatePathResolver.create(validConfig, params as PromptCliParams);
    assertEquals(resolverResult.ok, true);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);
      
      if (pathResult.ok) {
        assertEquals(pathResult.data.metadata.fromLayerType, expectedFromLayerType);
      }
    }
  }
});

Deno.test("1_behavior: infers fromLayerType when not specified", () => {
  logger.debug("Testing fromLayerType inference");
  
  const testCases = [
    {
      params: {
        demonstrativeType: "to",
        layerType: "issue",
        options: {}, // No fromLayerType
      },
      expectedFromLayerType: "project", // Should infer from hierarchy
    },
    {
      params: {
        demonstrativeType: "to",
        layerType: "task",
        options: {},
      },
      expectedFromLayerType: "issue", // Should infer from hierarchy
    },
    {
      params: {
        demonstrativeType: "summary",
        layerType: "project",
        options: {},
      },
      expectedFromLayerType: "project", // Same layer for summary
    },
  ];
  
  for (const { params, expectedFromLayerType } of testCases) {
    const resolverResult = PromptTemplatePathResolver.create(validConfig, params as PromptCliParams);
    assertEquals(resolverResult.ok, true);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);
      
      if (pathResult.ok) {
        assertEquals(pathResult.data.metadata.fromLayerType, expectedFromLayerType);
      }
    }
  }
});

Deno.test("1_behavior: supports TwoParams_Result format", () => {
  logger.debug("Testing TwoParams_Result format support");
  
  const twoParamsResult: TwoParams_Result = {
    type: "two",
    params: ["to", "project"],
    demonstrativeType: "to",
    layerType: "project",
    options: {
      adaptation: "simple",
    },
  };
  
  const resolverResult = PromptTemplatePathResolver.create(validConfig, twoParamsResult);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);
    
    if (pathResult.ok) {
      assertExists(pathResult.data.value);
      assertEquals(pathResult.data.metadata.adaptation, "simple");
    }
  }
});

Deno.test("1_behavior: supports directive/layer object format", () => {
  logger.debug("Testing directive/layer object format support");
  
  const directiveLayerParams = {
    directive: { value: "to", data: "to" },
    layer: { value: "project", data: "project" },
    options: {
      fromLayerType: "task",
    },
  };
  
  const resolverResult = PromptTemplatePathResolver.create(validConfig, directiveLayerParams as any);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);
    
    if (pathResult.ok) {
      assertExists(pathResult.data.value);
      assertEquals(pathResult.data.metadata.fromLayerType, "task");
    }
  }
});

Deno.test("1_behavior: tracks attempted paths for debugging", () => {
  logger.debug("Testing attempted paths tracking");
  
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: { adaptation: "complex" },
  };
  
  const resolverResult = PromptTemplatePathResolver.create(validConfig, params);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);
    
    if (pathResult.ok) {
      assertExists(pathResult.data.metadata.attemptedPaths);
      assertEquals(Array.isArray(pathResult.data.metadata.attemptedPaths), true);
      assertEquals(pathResult.data.metadata.attemptedPaths.length > 0, true);
      
      // Should attempt adaptation-specific path first
      const firstAttempt = pathResult.data.metadata.attemptedPaths[0];
      assertEquals(firstAttempt.includes("complex"), true);
    }
  }
});

Deno.test("1_behavior: handles custom prompt_dir configuration", () => {
  logger.debug("Testing custom prompt_dir configuration");
  
  const customConfig = {
    prompt_dir: "custom/prompts/location",
  };
  
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {},
  };
  
  const resolverResult = PromptTemplatePathResolver.create(customConfig, params);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);
    
    if (pathResult.ok) {
      assertEquals(pathResult.data.value.includes("custom/prompts/location"), true);
      assertEquals(pathResult.data.metadata.baseDir.includes("custom/prompts/location"), true);
    }
  }
});

Deno.test("1_behavior: provides fallback status for non-existent templates", () => {
  logger.debug("Testing fallback status");
  
  const params: PromptCliParams = {
    demonstrativeType: "nonexistent",
    layerType: "unknown",
    options: {},
  };
  
  const resolverResult = PromptTemplatePathResolver.create(validConfig, params);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);
    
    if (pathResult.ok) {
      // Should still resolve but with fallback status
      assertExists(pathResult.data.value);
      assertEquals(pathResult.data.status === "Fallback" || pathResult.data.status === "Found", true);
    }
  }
});

Deno.test("1_behavior: handles missing configuration gracefully", () => {
  logger.debug("Testing missing configuration handling");
  
  const minimalConfig = {}; // No prompt_dir specified
  
  const params: PromptCliParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {},
  };
  
  const resolverResult = PromptTemplatePathResolver.create(minimalConfig, params);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);
    
    if (pathResult.ok) {
      // Should use default prompt directory
      assertExists(pathResult.data.value);
      assertExists(pathResult.data.metadata.baseDir);
    }
  }
});