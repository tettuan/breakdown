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
import { PromptTemplatePathResolver } from "./prompt_template_path_resolver_totality.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("structure-prompt-template-path-resolver");

// Test fixtures
const validConfig = {
  prompt_dir: ".agent/prompts",
};

const validParams: PromptCliParams = {
  directiveType: "to",
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
      .filter((name) =>
        typeof (resolver as unknown as Record<string, unknown>)[name] === "function"
      )
      .filter((name) => name !== "constructor");

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

    // The path might not exist, but we should still get a proper Result type
    assertExists(pathResult);
    assertEquals(typeof pathResult.ok, "boolean");

    if (pathResult.ok) {
      const promptPath = pathResult.data;

      // PromptTemplatePath should be immutable value object
      assertExists(promptPath.value);
      assertExists(promptPath.status);
      assertExists(promptPath.metadata);

      // Metadata should have expected structure
      assertExists(promptPath.metadata.baseDir);
      assertExists(promptPath.metadata.directiveType);
      assertExists(promptPath.metadata.layerType);
      assertExists(promptPath.metadata.fromLayerType);
      assertExists(promptPath.metadata.attemptedPaths);

      // Status should be enum-like
      const validStatuses = ["Found", "Fallback"];
      assertEquals(validStatuses.includes(promptPath.status), true);
    } else {
      // Even on error, should have proper structure
      assertExists(pathResult.error);
      assertExists(pathResult.error.kind);
      // For non-existent files, we expect TemplateNotFound
      assertEquals(pathResult.error.kind, "TemplateNotFound");
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

    // Should always return a Result, regardless of file existence
    assertExists(result);
    assertEquals(typeof result.ok, "boolean");

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
    } else {
      // Even on error, should maintain abstraction
      assertExists(result.error);
      assertExists(result.error.kind);

      // Error should be about path resolution, not file system details
      const validErrorKinds = ["TemplateNotFound", "InvalidConfiguration", "BaseDirectoryNotFound"];
      assertEquals(validErrorKinds.includes(result.error.kind), true);
    }
  }
});

Deno.test("2_structure: separation of concerns", () => {
  logger.debug("Testing separation of concerns");

  // Factory method (create) should handle validation
  // Instance method (resolve) should handle resolution

  // Test 1: Factory handles invalid input
  const invalidResult = PromptTemplatePathResolver.create(
    null as unknown as typeof validConfig,
    validParams,
  );
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
    const result = PromptTemplatePathResolver.create(
      config as unknown as typeof validConfig,
      params as unknown as typeof validParams,
    );

    if (!result.ok) {
      assertExists(result.error);
      assertExists(result.error.kind);
      assertEquals(typeof result.error.kind, "string");

      // Error kinds should be from defined set (PathResolutionError)
      // Based on the actual PathResolutionError type definition
      const validErrorKinds = [
        "InvalidStrategy",
        "EmptyBaseDir",
        "InvalidPath",
        "NoValidFallback",
        "PathValidationFailed",
        "InvalidConfiguration",
        "BaseDirectoryNotFound",
        "InvalidParameterCombination",
        "TemplateNotFound",
      ];
      assertEquals(
        validErrorKinds.includes(result.error.kind),
        true,
        `Unexpected error kind: ${result.error.kind}`,
      );
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

    // In TypeScript/JavaScript, private properties are still enumerable
    // The important thing is that the class design follows encapsulation principles
    const publicProps = Object.keys(resolver);

    // Verify that any enumerable properties follow naming conventions for private fields
    for (const prop of publicProps) {
      // Private properties should either start with _ or be known private fields
      assertEquals(
        prop.startsWith("_") || prop === "config" || prop === "cliParams",
        true,
        `Property '${prop}' should follow private naming convention`,
      );
    }

    // Verify the public interface - only intended methods should be accessible
    const proto = Object.getPrototypeOf(resolver);
    const methods = Object.getOwnPropertyNames(proto)
      .filter((name) => name !== "constructor")
      .filter((name) =>
        typeof (resolver as unknown as Record<string, unknown>)[name] === "function"
      );

    // Should have the public interface methods
    assertEquals(methods.includes("getPath"), true, "Should have getPath method");

    // Check for expected public methods (based on implementation)
    const expectedPublicMethods = ["getPath", "resolveBaseDir"]; // resolveBaseDir is deprecated but still public
    for (const method of expectedPublicMethods) {
      assertEquals(methods.includes(method), true, `Missing expected public method: ${method}`);
    }

    // All other methods should be implementation details (private in TypeScript)
    const knownPrivateMethods = [
      "resolveBaseDirSafe",
      "buildFileName",
      "buildFallbackFileName",
      "buildPromptPath",
      "shouldFallback",
      "getDirectiveType",
      "getLayerType",
      "resolveFromLayerType",
      "getAdaptation",
      "deepCopyConfig",
      "deepCopyCliParams",
      "getUseSchemaFlag",
      "getFromLayerType",
      "getFromFile",
      "inferLayerTypeFromFileName",
    ];

    // Verify all methods are either public API or known private implementation
    for (const method of methods) {
      const isPublicAPI = expectedPublicMethods.includes(method);
      const isKnownPrivate = knownPrivateMethods.includes(method);
      assertEquals(isPublicAPI || isKnownPrivate, true, `Unknown method found: ${method}`);
    }

    // The class follows encapsulation by:
    // - Having a clear factory method (create) as the only way to instantiate
    // - Private constructor prevents direct instantiation (TypeScript compile-time)
    // - All data access is through controlled methods
    // - Internal state is protected through TypeScript's private keyword
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
