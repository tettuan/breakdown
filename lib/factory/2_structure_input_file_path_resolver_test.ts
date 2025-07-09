/**
 * @fileoverview 2_structure tests for InputFilePathResolver
 * Testing structural integrity and design consistency
 *
 * Structure tests verify:
 * - Class cohesion and responsibility separation
 * - Method signatures and return type consistency
 * - No duplication of responsibilities
 * - Proper abstraction levels
 */

import { assertEquals, assertExists } from "@std/assert";
import { InputFilePathResolver } from "./input_file_path_resolver.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("structure-input-file-path-resolver");

// Test fixtures
const validConfig = {
  working_dir: ".agent/breakdown",
  resource_dir: ".agent/resources",
};

const validParams: PromptCliParams = {
  demonstrativeType: "to",
  layerType: "project",
  options: {
    fromFile: "test.md",
  },
};

Deno.test("2_structure: class has single responsibility", () => {
  logger.debug("Testing single responsibility principle");

  // InputFilePathResolver should only be responsible for resolving input file paths
  // It should not:
  // - Load or read files
  // - Validate file contents
  // - Parse file formats
  // - Manage file state
  // - Handle output paths

  const resolverResult = InputFilePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const resolver = resolverResult.data;

    // Verify only path resolution methods exist
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(resolver))
      .filter((name) => typeof (resolver as any)[name] === "function")
      .filter((name) => name !== "constructor");

    // Should have path resolution methods
    // getPath is the main method, getPathLegacy and getPathLegacyUnsafe are for backward compatibility
    assertEquals(methods.includes("getPath"), true);
  }
});

Deno.test("2_structure: method signature consistency", () => {
  logger.debug("Testing method signature consistency");

  const resolverResult = InputFilePathResolver.create(validConfig, validParams);
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
      // Verify data structure
      assertExists(result.data.value);
      assertExists(result.data.type);
      assertExists(result.data.exists);
    } else {
      assertExists(result.error);
      assertEquals("data" in result, false);
      // Verify error structure
      assertExists(result.error.kind);
    }
  }
});

Deno.test("2_structure: immutable instance behavior", () => {
  logger.debug("Testing immutability");

  const resolverResult = InputFilePathResolver.create(validConfig, validParams);
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
      assertEquals(result1.data.type, result2.data.type);
      assertEquals(result2.data.type, result3.data.type);
    }
  }
});

Deno.test("2_structure: proper abstraction level", () => {
  logger.debug("Testing abstraction level");

  // The resolver should work at the right level of abstraction
  // It should handle path resolution logic, not low-level file system operations

  const resolverResult = InputFilePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const result = resolverResult.data.getPath();
    assertEquals(result.ok, true);

    if (result.ok) {
      // Should return structured path information, not raw strings
      assertExists(result.data.value);
      assertExists(result.data.type);
      assertExists(result.data.exists);

      // Type should be one of the expected values
      const validTypes = ["stdin", "absolute", "relative", "filename"];
      assertEquals(validTypes.includes(result.data.type), true);
    }
  }
});

Deno.test("2_structure: separation of concerns", () => {
  logger.debug("Testing separation of concerns");

  // Factory method (create) should handle validation
  // Instance method (resolve) should handle resolution

  // Test 1: Factory handles invalid input
  const invalidResult = InputFilePathResolver.create(null as any, validParams);
  assertEquals(invalidResult.ok, false);

  // Test 2: Valid factory creates valid instance
  const validResult = InputFilePathResolver.create(validConfig, validParams);
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
    const result = InputFilePathResolver.create(config as any, params as any);

    if (!result.ok) {
      assertExists(result.error);
      assertExists(result.error.kind);
      assertEquals(typeof result.error.kind, "string");

      // Error kinds should be from defined set
      const validErrorKinds = [
        "InvalidPath",
        "PathNotFound",
        "PermissionDenied",
        "ConfigurationError",
      ];
      assertEquals(validErrorKinds.includes(result.error.kind), true);
    }
  }
});

Deno.test("2_structure: no side effects in resolution", () => {
  logger.debug("Testing pure function behavior");

  const resolverResult = InputFilePathResolver.create(validConfig, validParams);
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

  const resolverResult = InputFilePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const resolver = resolverResult.data;

    // In TypeScript/JavaScript, private properties are still enumerable
    // The important thing is that the class design follows encapsulation principles:
    // 1. Properties are marked private in TypeScript
    // 2. Access is only through public methods
    // 3. The class has a clear public interface

    const publicProps = Object.keys(resolver);

    // Verify that any enumerable properties follow naming conventions for private fields
    for (const prop of publicProps) {
      // Private properties should either start with _ or be known private fields
      assertEquals(
        prop.startsWith("_") || prop === "config",
        true,
        `Property '${prop}' should follow private naming convention`,
      );
    }

    // Verify the public interface - only intended methods should be accessible
    const proto = Object.getPrototypeOf(resolver);
    const methods = Object.getOwnPropertyNames(proto)
      .filter((name) => name !== "constructor")
      .filter((name) => typeof (resolver as any)[name] === "function");

    // Should have the public interface methods
    assertEquals(methods.includes("getPath"), true, "Should have getPath method");
    assertEquals(methods.includes("getPathLegacy"), true, "Should have getPathLegacy method");
    assertEquals(
      methods.includes("getPathLegacyUnsafe"),
      true,
      "Should have getPathLegacyUnsafe method",
    );

    // Verify expected public methods exist
    const expectedPublicMethods = ["getPath", "getPathLegacy", "getPathLegacyUnsafe"];
    for (const method of expectedPublicMethods) {
      assertEquals(methods.includes(method), true, `Missing expected public method: ${method}`);
    }

    // All other methods should be implementation details (private in TypeScript)
    // In JavaScript runtime, private methods are still accessible but that's a limitation
    // of the language, not a failure of encapsulation design
    const knownPrivateMethods = [
      "deepCopyConfig",
      "deepCopyCliParams",
      "getFromFile",
      "normalizePath",
      "isAbsolute",
      "hasPathHierarchy",
      "getDirectory",
      "checkPathExists",
      "handleResolutionError",
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
    // - Clear separation between public API and implementation details
  }
});
