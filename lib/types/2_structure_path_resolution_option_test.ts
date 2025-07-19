/**
 * @fileoverview Structure tests for PathResolutionOption
 *
 * Tests the data structure integrity, type relationships, and internal
 * consistency of PathResolutionOption and related types.
 *
 * @module types/2_structure_path_resolution_option_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  type PathResolutionError,
  PathResolutionOption,
  PathResolutionPresets,
  type PathResolutionStrategy,
  type PathValidationRule,
  type PathValidationRules,
} from "./path_resolution_option.ts";

/**
 * Structure Test Group: Type Definitions Integrity
 */
Deno.test("PathResolutionOption Structure - Type definitions", () => {
  // PathResolutionStrategy type should contain expected values
  const validStrategies: PathResolutionStrategy[] = ["absolute", "relative", "workspace"];
  assertEquals(validStrategies.length, 3);

  // PathValidationRule type should contain expected values
  const validRules: PathValidationRule[] = [
    "must-exist",
    "must-be-directory",
    "must-be-file",
    "must-be-readable",
    "must-be-writable",
  ];
  assertEquals(validRules.length, 5);
});

/**
 * Structure Test Group: PathValidationRules Interface Structure
 */
Deno.test("PathResolutionOption Structure - PathValidationRules interface", () => {
  // Test minimal structure
  const minimalRules: PathValidationRules = {
    required: [],
  };
  assertEquals(Array.isArray(minimalRules.required), true);

  // Test complete structure
  const completeRules: PathValidationRules = {
    required: ["must-exist"],
    optional: ["must-be-readable"],
    normalizeCase: true,
    custom: (_path: string) => ({ ok: true, data: undefined }),
  };

  assertEquals(Array.isArray(completeRules.required), true);
  assertEquals(Array.isArray(completeRules.optional), true);
  assertEquals(typeof completeRules.normalizeCase, "boolean");
  assertEquals(typeof completeRules.custom, "function");
});

/**
 * Structure Test Group: PathResolutionError Union Type Structure
 */
Deno.test("PathResolutionOption Structure - PathResolutionError types", () => {
  // Test InvalidStrategy error structure
  const invalidStrategyError: PathResolutionError = {
    kind: "InvalidStrategy",
    strategy: "unknown",
  };
  assertEquals(invalidStrategyError.kind, "InvalidStrategy");
  assertEquals(typeof invalidStrategyError.strategy, "string");

  // Test EmptyBaseDir error structure
  const emptyBaseDirError: PathResolutionError = {
    kind: "EmptyBaseDir",
  };
  assertEquals(emptyBaseDirError.kind, "EmptyBaseDir");

  // Test InvalidPath error structure
  const invalidPathError: PathResolutionError = {
    kind: "InvalidPath",
    path: "/invalid",
    reason: "test reason",
  };
  assertEquals(invalidPathError.kind, "InvalidPath");
  assertEquals(typeof invalidPathError.path, "string");
  assertEquals(typeof invalidPathError.reason, "string");

  // Test NoValidFallback error structure
  const noValidFallbackError: PathResolutionError = {
    kind: "NoValidFallback",
    attempts: ["/attempt1", "/attempt2"],
  };
  assertEquals(noValidFallbackError.kind, "NoValidFallback");
  assertEquals(Array.isArray(noValidFallbackError.attempts), true);

  // Test PathValidationFailed error structure
  const validationFailedError: PathResolutionError = {
    kind: "PathValidationFailed",
    rule: "must-exist",
    path: "/nonexistent",
  };
  assertEquals(validationFailedError.kind, "PathValidationFailed");
  assertEquals(typeof validationFailedError.rule, "string");
  assertEquals(typeof validationFailedError.path, "string");
});

/**
 * Structure Test Group: Configuration Object Structure
 */
Deno.test("PathResolutionOption Structure - Configuration object", () => {
  const result = PathResolutionOption.create(
    "workspace",
    "/test/base",
    ["fallback1", "fallback2"],
    { required: ["must-exist", "must-be-directory"] },
  );

  assertEquals(result.ok, true);
  if (result.ok) {
    const config = result.data.getConfig();

    // Verify configuration structure
    assertEquals(typeof config.strategy, "string");
    assertEquals(typeof config.baseDir, "string");
    assertEquals(Array.isArray(config.fallbacks), true);
    assertEquals(Array.isArray(config.validationRules), true);

    // Verify configuration values
    assertEquals(config.strategy, "workspace");
    assertEquals(config.baseDir, "/test/base");
    assertEquals(config.fallbacks.length, 2);
    assertEquals(config.fallbacks[0], "fallback1");
    assertEquals(config.fallbacks[1], "fallback2");
    assertEquals(config.validationRules.length, 2);
    assertEquals(config.validationRules[0], "must-exist");
    assertEquals(config.validationRules[1], "must-be-directory");

    // Verify immutability (readonly arrays)
    assertEquals(Object.isFrozen(config.fallbacks), false); // readonly, not frozen
    assertEquals(Object.isFrozen(config.validationRules), false); // readonly, not frozen
  }
});

/**
 * Structure Test Group: Factory Method Parameter Structure
 */
Deno.test("PathResolutionOption Structure - Factory method parameters", () => {
  // Test create method parameter structure
  const createResult = PathResolutionOption.create(
    "absolute",
    "/base",
    ["fallback"],
    { required: ["must-exist"] },
  );
  assertEquals(createResult.ok, true);

  // Test absolute method parameter structure
  const absoluteResult = PathResolutionOption.absolute(
    "/base",
    { required: ["must-be-directory"] },
  );
  assertEquals(absoluteResult.ok, true);

  // Test relative method parameter structure
  const relativeResult = PathResolutionOption.relative(
    "/base",
    ["fallback1", "fallback2"],
    { optional: ["must-be-readable"] },
  );
  assertEquals(relativeResult.ok, true);

  // Test workspace method parameter structure
  const workspaceResult = PathResolutionOption.workspace(
    "/workspace",
    ["subdir1", "subdir2"],
    { required: ["must-exist"], normalizeCase: true },
  );
  assertEquals(workspaceResult.ok, true);
});

/**
 * Structure Test Group: Method Return Type Structure
 */
Deno.test("PathResolutionOption Structure - Method return types", () => {
  const result = PathResolutionOption.absolute("/test");
  assertEquals(result.ok, true);

  if (result.ok) {
    const option = result.data;

    // Test resolve method return structure
    const resolveResult = option.resolve("test.txt");
    assertExists(resolveResult.ok);
    if (resolveResult.ok) {
      assertEquals(typeof resolveResult.data, "string");
    } else {
      assertExists(resolveResult.error.kind);
    }

    // Test resolveWithFallbacks method return structure
    const fallbackResult = option.resolveWithFallbacks("test.txt");
    assertExists(fallbackResult.ok);
    if (fallbackResult.ok) {
      assertEquals(typeof fallbackResult.data, "string");
    } else {
      assertExists(fallbackResult.error.kind);
    }

    // Test validatePath method return structure
    const validateResult = option.validatePath("/some/path");
    assertExists(validateResult.ok);
    if (!validateResult.ok) {
      assertExists(validateResult.error.kind);
    }
  }
});

/**
 * Structure Test Group: Presets Class Structure
 */
Deno.test("PathResolutionOption Structure - PathResolutionPresets class", () => {
  // Verify PathResolutionPresets exists and has expected methods
  assertExists(PathResolutionPresets);
  assertEquals(typeof PathResolutionPresets.promptTemplates, "function");
  assertEquals(typeof PathResolutionPresets.schemaFiles, "function");
  assertEquals(typeof PathResolutionPresets.configFiles, "function");
  assertEquals(typeof PathResolutionPresets.outputFiles, "function");

  // Test preset method return structures
  const promptResult = PathResolutionPresets.promptTemplates("/test");
  assertExists(promptResult.ok);
  if (promptResult.ok) {
    assertExists(promptResult.data.resolve);
    assertExists(promptResult.data.getConfig);
  }

  const schemaResult = PathResolutionPresets.schemaFiles("/test");
  assertExists(schemaResult.ok);

  const configResult = PathResolutionPresets.configFiles("/test");
  assertExists(configResult.ok);

  const outputResult = PathResolutionPresets.outputFiles("/test");
  assertExists(outputResult.ok);
});

/**
 * Structure Test Group: Default Values Structure
 */
Deno.test("PathResolutionOption Structure - Default values", () => {
  // Test minimal creation with defaults
  const result = PathResolutionOption.create("absolute", "/test");
  assertEquals(result.ok, true);

  if (result.ok) {
    const config = result.data.getConfig();

    // Default fallbacks should be empty array
    assertEquals(config.fallbacks.length, 0);
    assertEquals(Array.isArray(config.fallbacks), true);

    // Default validation rules should be empty array
    assertEquals(config.validationRules.length, 0);
    assertEquals(Array.isArray(config.validationRules), true);
  }

  // Test factory methods with default parameters
  const absoluteResult = PathResolutionOption.absolute("/test");
  assertEquals(absoluteResult.ok, true);
  if (absoluteResult.ok) {
    const config = absoluteResult.data.getConfig();
    assertEquals(config.fallbacks.length, 0);
  }

  const relativeResult = PathResolutionOption.relative("/test");
  assertEquals(relativeResult.ok, true);
  if (relativeResult.ok) {
    const config = relativeResult.data.getConfig();
    assertEquals(config.fallbacks.length, 0);
  }

  const workspaceResult = PathResolutionOption.workspace("/test");
  assertEquals(workspaceResult.ok, true);
  if (workspaceResult.ok) {
    const config = workspaceResult.data.getConfig();
    assertEquals(config.fallbacks.length, 0);
  }
});

/**
 * Structure Test Group: Immutability and Data Integrity
 */
Deno.test("PathResolutionOption Structure - Data integrity", () => {
  const fallbacks = ["original1", "original2"];
  const validationRules: PathValidationRule[] = ["must-exist", "must-be-directory"];

  const result = PathResolutionOption.create(
    "workspace",
    "/test",
    fallbacks,
    { required: validationRules },
  );

  assertEquals(result.ok, true);
  if (result.ok) {
    const config = result.data.getConfig();

    // Modifying original arrays should not affect the configuration
    fallbacks.push("modified");
    validationRules.push("must-be-writable");

    assertEquals(config.fallbacks.length, 2);
    // Note: The actual implementation might include additional default validation rules
    // so we check if the original rules are still present
    assertEquals(config.validationRules.includes("must-exist"), true);
    assertEquals(config.validationRules.includes("must-be-directory"), true);
    assertEquals(config.fallbacks.includes("modified"), false);
  }
});

/**
 * Structure Test Group: Parameter Validation Structure
 */
Deno.test("PathResolutionOption Structure - Parameter validation", () => {
  // Test parameter type validation in create method

  // Strategy parameter validation
  const invalidStrategyResult = PathResolutionOption.create("invalid", "/test");
  assertEquals(invalidStrategyResult.ok, false);
  if (!invalidStrategyResult.ok) {
    assertEquals(invalidStrategyResult.error.kind, "InvalidStrategy");
    if (invalidStrategyResult.error.kind === "InvalidStrategy") {
      assertExists(invalidStrategyResult.error.strategy);
    }
  }

  // BaseDir parameter validation
  const emptyBaseDirResult1 = PathResolutionOption.create("absolute", "");
  assertEquals(emptyBaseDirResult1.ok, false);

  const emptyBaseDirResult2 = PathResolutionOption.create("absolute", "   ");
  assertEquals(emptyBaseDirResult2.ok, false);

  // Valid parameters should succeed
  const validResult = PathResolutionOption.create("absolute", "/valid/path");
  assertEquals(validResult.ok, true);
});
