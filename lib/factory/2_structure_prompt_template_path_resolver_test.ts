/**
 * @fileoverview 2_structure tests for PromptTemplatePathResolver
 * Testing structural integrity and design consistency
 * 
 * Structure tests verify:
 * - Class cohesion and responsibility separation
 * - Method signatures and return type consistency
 * - No duplication of responsibilities
 * - Proper abstraction levels
 */

import { assertEquals, assertExists } from "@std/assert";
import { PromptTemplatePathResolver } from "./prompt_template_path_resolver.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("structure-prompt-template-path-resolver");

// Test fixtures
const validConfig = {
  prompt_dir: ".agent/prompts",
};

const validParams: PromptCliParams = {
  demonstrativeType: "to",
  layerType: "project",
  options: {},
};

Deno.test("2_structure: class has single responsibility", () => {
  logger.debug("Testing single responsibility principle");
  
  // PromptTemplatePathResolver should only be responsible for resolving prompt template paths
  // It should not:
  // - Load or read template files
  // - Parse template content
  // - Validate template syntax
  // - Execute templates
  // - Handle schema paths
  // - Manage template state
  
  const resolverResult = PromptTemplatePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    
    // Verify only path resolution methods exist
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(resolver))
      .filter(name => typeof (resolver as any)[name] === "function")
      .filter(name => name !== "constructor");
    
    // Should have path resolution methods
    assertEquals(methods.includes("getPath"), true);
  }
});

Deno.test("2_structure: method signature consistency", () => {
  logger.debug("Testing method signature consistency");
  
  const resolverResult = PromptTemplatePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    
    // Verify getPath method signature
    assertEquals(typeof resolver.getPath, "function");
    assertEquals(resolver.getPath.length, 0); // Takes no parameters
    
    // Verify return type consistency
    const result = resolver.getPath();
    assertExists(result);
    assertEquals(typeof result.ok, "boolean");
    
    // Result must follow Result<T, E> pattern
    if (result.ok) {
      assertExists(result.data);
      assertEquals("error" in result, false);
      // Verify data is PromptTemplatePath value object
      assertExists(result.data.value);
      assertExists(result.data.status);
      assertExists(result.data.metadata);
    } else {
      assertExists(result.error);
      assertEquals("data" in result, false);
      // Verify error structure
      assertExists(result.error.kind);
    }
  }
});

Deno.test("2_structure: value object pattern for result", () => {
  logger.debug("Testing value object pattern");
  
  const resolverResult = PromptTemplatePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const pathResult = resolverResult.data.getPath();
    assertEquals(pathResult.ok, true);
    
    if (pathResult.ok) {
      const promptPath = pathResult.data;
      
      // PromptTemplatePath should be immutable value object
      assertExists(promptPath.value);
      assertExists(promptPath.status);
      assertExists(promptPath.metadata);
      
      // Metadata should have expected structure
      assertExists(promptPath.metadata.baseDir);
      assertExists(promptPath.metadata.demonstrativeType);
      assertExists(promptPath.metadata.layerType);
      assertExists(promptPath.metadata.fromLayerType);
      assertExists(promptPath.metadata.attemptedPaths);
      
      // Status should be enum-like
      const validStatuses = ["Found", "Fallback"];
      assertEquals(validStatuses.includes(promptPath.status), true);
    }
  }
});

Deno.test("2_structure: immutable instance behavior", () => {
  logger.debug("Testing immutability");
  
  const resolverResult = PromptTemplatePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    
    // Multiple calls should return consistent results
    const result1 = resolver.getPath();
    const result2 = resolver.getPath();
    const result3 = resolver.getPath();
    
    assertEquals(result1.ok, result2.ok);
    assertEquals(result2.ok, result3.ok);
    
    if (result1.ok && result2.ok && result3.ok) {
      assertEquals(result1.data.value, result2.data.value);
      assertEquals(result2.data.value, result3.data.value);
      assertEquals(result1.data.status, result2.data.status);
      assertEquals(result2.data.status, result3.data.status);
    }
  }
});

Deno.test("2_structure: proper abstraction level", () => {
  logger.debug("Testing abstraction level");
  
  // The resolver should work at the right level of abstraction
  // It should handle path resolution logic, not template processing
  
  const resolverResult = PromptTemplatePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const result = resolverResult.data.getPath();
    assertEquals(result.ok, true);
    
    if (result.ok) {
      // Should return high-level path information
      const promptPath = result.data;
      
      // Value should be a path string
      assertEquals(typeof promptPath.value, "string");
      
      // Status should indicate resolution outcome
      assertEquals(typeof promptPath.status, "string");
      
      // Metadata should provide context
      assertEquals(typeof promptPath.metadata, "object");
      
      // Should not expose low-level details
      assertEquals("fileContent" in promptPath, false);
      assertEquals("fileStats" in promptPath, false);
    }
  }
});

Deno.test("2_structure: separation of concerns", () => {
  logger.debug("Testing separation of concerns");
  
  // Factory method (create) should handle validation
  // Instance method (resolve) should handle resolution
  
  // Test 1: Factory handles invalid input
  const invalidResult = PromptTemplatePathResolver.create(null as any, validParams);
  assertEquals(invalidResult.ok, false);
  
  // Test 2: Valid factory creates valid instance
  const validResult = PromptTemplatePathResolver.create(validConfig, validParams);
  assertEquals(validResult.ok, true);
  
  if (validResult.ok) {
    // Instance should always be able to resolve (no throwing)
    const resolveResult = validResult.data.getPath();
    assertExists(resolveResult);
    assertEquals(typeof resolveResult.ok, "boolean");
  }
});

Deno.test("2_structure: consistent error handling", () => {
  logger.debug("Testing error handling consistency");
  
  // All errors should follow the same structure
  const errorCases = [
    { config: null, params: validParams },
    { config: validConfig, params: null },
    { config: {}, params: validParams },
    { config: validConfig, params: {} },
  ];
  
  for (const { config, params } of errorCases) {
    const result = PromptTemplatePathResolver.create(config as any, params as any);
    
    if (!result.ok) {
      assertExists(result.error);
      assertExists(result.error.kind);
      assertEquals(typeof result.error.kind, "string");
      
      // Error kinds should be from defined set (PathResolutionError)
      const validErrorKinds = [
        "InvalidConfiguration",
        "InvalidParameters",
        "PathNotFound",
        "ResolutionFailed"
      ];
      assertEquals(validErrorKinds.includes(result.error.kind), true);
    }
  }
});

Deno.test("2_structure: no side effects in resolution", () => {
  logger.debug("Testing pure function behavior");
  
  const resolverResult = PromptTemplatePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    
    // Resolution should not modify state
    const stateBefore = JSON.stringify({
      config: validConfig,
      params: validParams,
    });
    
    resolver.getPath();
    resolver.getPath();
    resolver.getPath();
    
    const stateAfter = JSON.stringify({
      config: validConfig,
      params: validParams,
    });
    
    assertEquals(stateBefore, stateAfter);
  }
});

Deno.test("2_structure: encapsulation of internal logic", () => {
  logger.debug("Testing encapsulation");
  
  const resolverResult = PromptTemplatePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);
  
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    
    // Internal properties should not be accessible
    const publicProps = Object.keys(resolver);
    assertEquals(publicProps.length, 0, "No public properties should be exposed");
    
    // Path resolution methods should be accessible
    const proto = Object.getPrototypeOf(resolver);
    const methods = Object.getOwnPropertyNames(proto)
      .filter(name => name !== "constructor")
      .filter(name => typeof (resolver as any)[name] === "function");
    
    // Should have getPath method
    assertEquals(methods.includes("getPath"), true);
  }
});

Deno.test("2_structure: consistent with other path resolvers", () => {
  logger.debug("Testing consistency with other resolvers");
  
  // PromptTemplatePathResolver should follow same pattern as Input/Output resolvers
  // All should have:
  // - Smart Constructor pattern (create method)
  // - Result type returns
  // - Single resolve method
  // - Similar error handling
  
  const promptResolver = PromptTemplatePathResolver.create(validConfig, validParams);
  
  // Should use Smart Constructor pattern
  assertEquals(typeof PromptTemplatePathResolver.create, "function");
  
  // Should return Result type
  assertEquals(promptResolver.ok !== undefined, true);
  
  if (promptResolver.ok) {
    // Should have getPath method
    assertEquals(typeof promptResolver.data.getPath, "function");
    
    // Should return Result from getPath
    const result = promptResolver.data.getPath();
    assertEquals(result.ok !== undefined, true);
    
    // But returns different value object (PromptTemplatePath vs ResolvedPath)
    if (result.ok) {
      // Unique to prompt resolver: status and metadata
      assertExists(result.data.status);
      assertExists(result.data.metadata.attemptedPaths);
    }
  }
});