/**
 * @fileoverview 2_structure tests for OutputFilePathResolver
 * Testing structural integrity and design consistency
 *
 * Structure tests verify:
 * - Class cohesion and responsibility separation
 * - Method signatures and return type consistency
 * - No duplication of responsibilities
 * - Proper abstraction levels
 */

import { assertEquals, assertExists } from "@std/assert";
import { OutputFilePathResolver } from "./output_file_path_resolver.ts";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("structure-output-file-path-resolver");

// Test fixtures
const validConfig = {
  working_dir: ".agent/breakdown",
  resource_dir: ".agent/resources",
};

const validParams: PromptCliParams = {
  demonstrativeType: "to",
  layerType: "project",
  options: {
    destinationFile: "test.md",
  },
};

Deno.test("2_structure: class has single responsibility", () => {
  logger.debug("Testing single responsibility principle");

  // OutputFilePathResolver should only be responsible for resolving output file paths
  // It should not:
  // - Create or write files
  // - Validate file contents
  // - Parse file formats
  // - Manage file state
  // - Handle input paths
  // - Perform actual file operations

  const resolverResult = OutputFilePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const resolver = resolverResult.data;

    // Verify only path resolution methods exist
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(resolver))
      .filter((name) => typeof (resolver as any)[name] === "function")
      .filter((name) => name !== "constructor");

    // Should have path resolution methods
    assertEquals(methods.includes("getPath"), true);
  }
});

Deno.test("2_structure: method signature consistency", () => {
  logger.debug("Testing method signature consistency");

  const resolverResult = OutputFilePathResolver.create(validConfig, validParams);
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
      assertEquals(typeof result.data.isGenerated, "boolean");
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

  const resolverResult = OutputFilePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const resolver = resolverResult.data;

    // Multiple calls should return consistent results for same input
    const result1 = resolver.getPath();
    const result2 = resolver.getPath();
    const result3 = resolver.getPath();

    assertEquals(result1.ok, result2.ok);
    assertEquals(result2.ok, result3.ok);

    if (result1.ok && result2.ok && result3.ok) {
      // For specified output, results should be identical
      if (validParams.options.destinationFile) {
        assertEquals(result1.data.value, result2.data.value);
        assertEquals(result2.data.value, result3.data.value);
        assertEquals(result1.data.type, result2.data.type);
        assertEquals(result2.data.type, result3.data.type);
        assertEquals(result1.data.isGenerated, result2.data.isGenerated);
        assertEquals(result2.data.isGenerated, result3.data.isGenerated);
      }
    }
  }
});

Deno.test("2_structure: proper abstraction level", () => {
  logger.debug("Testing abstraction level");

  // The resolver should work at the right level of abstraction
  // It should handle path resolution logic, not low-level file system operations

  const resolverResult = OutputFilePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const result = resolverResult.data.getPath();
    assertEquals(result.ok, true);

    if (result.ok) {
      // Should return structured path information, not raw strings
      assertExists(result.data.value);
      assertExists(result.data.type);
      assertExists(result.data.isGenerated);

      // Type should be one of the expected values
      const validTypes = ["auto-generated", "absolute", "relative", "filename"];
      assertEquals(validTypes.includes(result.data.type), true);

      // isGenerated should be boolean
      assertEquals(typeof result.data.isGenerated, "boolean");
    }
  }
});

Deno.test("2_structure: separation of concerns", () => {
  logger.debug("Testing separation of concerns");

  // Factory method (create) should handle validation
  // Instance method (resolve) should handle resolution

  // Test 1: Factory handles invalid input
  const invalidResult = OutputFilePathResolver.create(null as any, validParams);
  assertEquals(invalidResult.ok, false);

  // Test 2: Valid factory creates valid instance
  const validResult = OutputFilePathResolver.create(validConfig, validParams);
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
    { config: validConfig, params: { ...validParams, options: { output: "" } } },
  ];

  for (const { config, params } of errorCases) {
    const result = OutputFilePathResolver.create(config as any, params as any);

    if (!result.ok) {
      assertExists(result.error);
      assertExists(result.error.kind);
      assertEquals(typeof result.error.kind, "string");

      // Error kinds should be from defined set
      const validErrorKinds = [
        "InvalidPath",
        "DirectoryNotFound",
        "PermissionDenied",
        "ConfigurationError",
        "FilenameGenerationFailed",
      ];
      assertEquals(validErrorKinds.includes(result.error.kind), true);
    }
  }
});

Deno.test("2_structure: no side effects in resolution", () => {
  logger.debug("Testing pure function behavior");

  const resolverResult = OutputFilePathResolver.create(validConfig, validParams);
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

  const resolverResult = OutputFilePathResolver.create(validConfig, validParams);
  assertEquals(resolverResult.ok, true);

  if (resolverResult.ok) {
    const resolver = resolverResult.data;

    // Internal properties should not be accessible
    const publicProps = Object.keys(resolver);
    assertEquals(publicProps.length, 0, "No public properties should be exposed");

    // Only path resolution methods should be accessible
    const proto = Object.getPrototypeOf(resolver);
    const methods = Object.getOwnPropertyNames(proto)
      .filter((name) => name !== "constructor")
      .filter((name) => typeof (resolver as any)[name] === "function");

    // Should have getPath method
    assertEquals(methods.includes("getPath"), true);
  }
});

Deno.test("2_structure: complementary to InputFilePathResolver", () => {
  logger.debug("Testing complementary design");

  // OutputFilePathResolver should mirror InputFilePathResolver's structure
  // Both should have similar:
  // - Factory pattern (create method)
  // - Result type returns
  // - Single resolve method
  // - Similar error handling

  const outputResolver = OutputFilePathResolver.create(validConfig, validParams);

  // Both should use Smart Constructor pattern
  assertEquals(typeof OutputFilePathResolver.create, "function");

  // Both should return Result type
  assertEquals(outputResolver.ok !== undefined, true);

  if (outputResolver.ok) {
    // Both should have getPath method
    assertEquals(typeof outputResolver.data.getPath, "function");

    // Both should return Result from getPath
    const result = outputResolver.data.getPath();
    assertEquals(result.ok !== undefined, true);
  }
});
