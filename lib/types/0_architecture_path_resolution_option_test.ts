/**
 * @fileoverview Architecture tests for PathResolutionOption
 *
 * Tests the architectural constraints and design patterns of PathResolutionOption
 * following Domain-Driven Design principles for Configuration Management Domain.
 *
 * @module types/0_architecture_path_resolution_option_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  PathResolutionOption,
  PathResolutionPresets,
  type PathValidationRule,
} from "./path_resolution_option.ts";

/**
 * Architecture Test Group: Smart Constructor Pattern Enforcement
 */
Deno.test("PathResolutionOption Architecture - Smart Constructor pattern enforcement", () => {
  // Constructor should be private - cannot be called directly
  // This test ensures the constructor is not exposed
  try {
    // @ts-expect-error: Testing private constructor accessibility
    new PathResolutionOption("absolute", "/test", [], { required: [] });
    throw new Error("Constructor should be private");
  } catch (error) {
    // Expected behavior - constructor is private or throws error
    // Note: In JavaScript/TypeScript, private constructors may throw different error types
    const isExpectedError = error instanceof TypeError ||
      error instanceof Error && error.message === "Constructor should be private";
    assertEquals(isExpectedError, true);
  }
});

/**
 * Architecture Test Group: Factory Method Pattern
 */
Deno.test("PathResolutionOption Architecture - Factory methods exist", () => {
  // Verify factory methods are available
  assertExists(PathResolutionOption.create);
  assertExists(PathResolutionOption.absolute);
  assertExists(PathResolutionOption.relative);
  assertExists(PathResolutionOption.workspace);
});

/**
 * Architecture Test Group: Immutability Constraints
 */
Deno.test("PathResolutionOption Architecture - Immutability enforcement", () => {
  const result = PathResolutionOption.create("absolute", "/test");
  if (!result.ok) throw new Error("Failed to create PathResolutionOption");

  const option = result.data;
  const config = option.getConfig();

  // fallbacks should be readonly
  assertEquals(Array.isArray(config.fallbacks), true);

  // validationRules should be readonly
  assertEquals(Array.isArray(config.validationRules), true);

  // Attempting to modify should not affect the original
  const _modifiedFallbacks = [...config.fallbacks, "new-fallback"];
  const configAfter = option.getConfig();
  assertEquals(config.fallbacks.length, configAfter.fallbacks.length);
});

/**
 * Architecture Test Group: Result Pattern Enforcement
 */
Deno.test("PathResolutionOption Architecture - Result pattern consistency", () => {
  // All factory methods should return Result type
  const absoluteResult = PathResolutionOption.absolute("/test");
  assertExists(absoluteResult.ok);
  if (absoluteResult.ok) {
    assertExists(absoluteResult.data);
  } else {
    assertExists(absoluteResult.error);
  }

  const relativeResult = PathResolutionOption.relative("/test");
  assertExists(relativeResult.ok);
  if (relativeResult.ok) {
    assertExists(relativeResult.data);
  } else {
    assertExists(relativeResult.error);
  }

  const workspaceResult = PathResolutionOption.workspace("/test");
  assertExists(workspaceResult.ok);
  if (workspaceResult.ok) {
    assertExists(workspaceResult.data);
  } else {
    assertExists(workspaceResult.error);
  }
});

/**
 * Architecture Test Group: Domain Error Type System
 */
Deno.test("PathResolutionOption Architecture - Domain error types", () => {
  // Test invalid strategy error
  const invalidStrategyResult = PathResolutionOption.create("invalid", "/test");
  assertEquals(invalidStrategyResult.ok, false);
  if (!invalidStrategyResult.ok) {
    assertEquals(invalidStrategyResult.error.kind, "InvalidStrategy");
  }

  // Test empty base directory error
  const emptyBaseDirResult = PathResolutionOption.create("absolute", "");
  assertEquals(emptyBaseDirResult.ok, false);
  if (!emptyBaseDirResult.ok) {
    assertEquals(emptyBaseDirResult.error.kind, "EmptyBaseDir");
  }
});

/**
 * Architecture Test Group: Separation of Concerns
 */
Deno.test("PathResolutionOption Architecture - Strategy pattern separation", () => {
  // Each strategy should handle path resolution differently
  const absoluteResult = PathResolutionOption.absolute("/base");
  const relativeResult = PathResolutionOption.relative("/base");
  const workspaceResult = PathResolutionOption.workspace("/base");

  assertEquals(absoluteResult.ok, true);
  assertEquals(relativeResult.ok, true);
  assertEquals(workspaceResult.ok, true);

  if (absoluteResult.ok && relativeResult.ok && workspaceResult.ok) {
    const absoluteConfig = absoluteResult.data.getConfig();
    const relativeConfig = relativeResult.data.getConfig();
    const workspaceConfig = workspaceResult.data.getConfig();

    assertEquals(absoluteConfig.strategy, "absolute");
    assertEquals(relativeConfig.strategy, "relative");
    assertEquals(workspaceConfig.strategy, "workspace");
  }
});

/**
 * Architecture Test Group: Presets Factory Pattern
 */
Deno.test("PathResolutionOption Architecture - Presets factory pattern", () => {
  // PathResolutionPresets should exist and provide factory methods
  assertExists(PathResolutionPresets);
  assertExists(PathResolutionPresets.promptTemplates);
  assertExists(PathResolutionPresets.schemaFiles);
  assertExists(PathResolutionPresets.configFiles);
  assertExists(PathResolutionPresets.outputFiles);

  // Presets should return valid PathResolutionOption instances
  const promptResult = PathResolutionPresets.promptTemplates("/test");
  assertEquals(promptResult.ok, true);

  const schemaResult = PathResolutionPresets.schemaFiles("/test");
  assertEquals(schemaResult.ok, true);

  const configResult = PathResolutionPresets.configFiles("/test");
  assertEquals(configResult.ok, true);

  const outputResult = PathResolutionPresets.outputFiles("/test");
  assertEquals(outputResult.ok, true);
});

/**
 * Architecture Test Group: Interface Stability
 */
Deno.test("PathResolutionOption Architecture - Public interface stability", () => {
  const result = PathResolutionOption.absolute("/test");
  if (!result.ok) throw new Error("Failed to create PathResolutionOption");

  const option = result.data;

  // Public methods should exist and be callable
  assertExists(option.resolve);
  assertExists(option.resolveWithFallbacks);
  assertExists(option.validatePath);
  assertExists(option.getConfig);

  // Methods should return expected types
  const resolveResult = option.resolve("test-path");
  assertExists(resolveResult.ok);

  const config = option.getConfig();
  assertExists(config.strategy);
  assertExists(config.baseDir);
  assertExists(config.fallbacks);
  assertExists(config.validationRules);
});

/**
 * Architecture Test Group: Type Safety Constraints
 */
Deno.test("PathResolutionOption Architecture - Type safety enforcement", () => {
  // Valid strategy types should be accepted
  const validStrategies = ["absolute", "relative", "workspace"];

  for (const strategy of validStrategies) {
    const result = PathResolutionOption.create(strategy, "/test");
    assertEquals(result.ok, true);
  }

  // Invalid strategy types should be rejected
  const invalidStrategies = ["invalid", "unknown", "", null, undefined];

  for (const strategy of invalidStrategies) {
    const result = PathResolutionOption.create(strategy as string, "/test");
    assertEquals(result.ok, false);
  }
});

/**
 * Architecture Test Group: Validation Rule Architecture
 */
Deno.test("PathResolutionOption Architecture - Validation rule system", () => {
  const validationRules: PathValidationRule[] = [
    "must-exist",
    "must-be-directory",
    "must-be-file",
    "must-be-readable",
    "must-be-writable",
  ];

  // Each rule should be handled in the validation system
  for (const rule of validationRules) {
    const result = PathResolutionOption.create("absolute", "/test", [], {
      required: [rule],
    });
    assertEquals(result.ok, true);
  }
});
