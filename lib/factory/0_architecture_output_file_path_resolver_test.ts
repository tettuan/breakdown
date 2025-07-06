/**
 * @fileoverview 0_architecture tests for OutputFilePathResolver
 * Testing architectural constraints and design patterns compliance
 * 
 * Architecture tests verify:
 * - Smart Constructor pattern enforcement
 * - Domain boundary constraints
 * - Result type constraints
 * - Totality pattern compliance
 */

import { assertEquals, assertExists } from "@std/assert";
import { OutputFilePathResolver } from "./output_file_path_resolver.ts";
import type { PromptCliParams, TwoParams_Result } from "./prompt_variables_factory.ts";
import type { Result } from "../types/result.ts";

// Architecture Test Fixtures
const validConfig = {
  working_dir: ".agent/breakdown",
  resource_dir: ".agent/resources",
};

const validLegacyParams: PromptCliParams = {
  demonstrativeType: "to",
  layerType: "project",
  options: {
    destinationFile: "output.md",
  },
};

const validTwoParams: TwoParams_Result = {
  type: "two",
  params: ["to", "project"],
  demonstrativeType: "to",
  layerType: "project",
  options: {
    destinationFile: "output.md",
  },
};

Deno.test("0_architecture: Smart Constructor pattern - private constructor enforced", () => {
  // ARCHITECTURE CONSTRAINT: Constructor must be private
  // Direct instantiation should be impossible via TypeScript
  // @ts-expect-error - Verifying private constructor constraint
  const attemptDirectConstruction = () => new OutputFilePathResolver(validConfig, validLegacyParams);
  
  // Verify factory method exists as the only construction path
  assertEquals(typeof OutputFilePathResolver.create, "function");
  assertExists(OutputFilePathResolver.create);
});

Deno.test("0_architecture: Smart Constructor pattern - factory method returns Result type", () => {
  // ARCHITECTURE CONSTRAINT: Factory must return Result<T, E> type
  const result = OutputFilePathResolver.create(validConfig, validLegacyParams);
  
  // Verify Result type structure
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");
  
  // Result must have either data or error, never both
  if (result.ok) {
    assertExists(result.data);
    assertEquals("error" in result, false);
    assertEquals(result.data.constructor.name, "OutputFilePathResolver");
  } else {
    assertExists(result.error);
    assertEquals("data" in result, false);
  }
});

Deno.test("0_architecture: Domain boundary constraint - no exceptions across boundary", () => {
  // ARCHITECTURE CONSTRAINT: Domain boundaries must not leak exceptions
  // All errors must be represented as Result.error
  
  const boundaryViolationTests = [
    { desc: "null config", config: null, params: validLegacyParams },
    { desc: "null params", config: validConfig, params: null },
    { desc: "array config", config: [], params: validLegacyParams },
    { desc: "array params", config: validConfig, params: [] },
    { desc: "primitive config", config: "string", params: validLegacyParams },
    { desc: "primitive params", config: validConfig, params: "string" },
    { desc: "invalid structure", config: validConfig, params: { invalid: true } },
  ];

  for (const { desc, config, params } of boundaryViolationTests) {
    // Should never throw - all errors must be captured in Result type
    const result = OutputFilePathResolver.create(config as any, params as any);
    
    assertEquals(result.ok, false, `Failed for test case: ${desc}`);
    if (!result.ok) {
      assertExists(result.error, `Error should exist for test case: ${desc}`);
      assertExists(result.error.kind, `Error kind should exist for test case: ${desc}`);
    }
  }
});

Deno.test("0_architecture: Result type constraint - error categorization", () => {
  // ARCHITECTURE CONSTRAINT: Errors must be properly categorized
  // All errors must have a structured error type with 'kind' discriminator
  
  // Test configuration error
  const configErrorResult = OutputFilePathResolver.create(null as any, validLegacyParams);
  assertEquals(configErrorResult.ok, false);
  if (!configErrorResult.ok) {
    assertEquals(configErrorResult.error.kind, "ConfigurationError");
    if (configErrorResult.error.kind === "ConfigurationError") {
      assertExists(configErrorResult.error.message);
    }
  }
  
  // Test parameter structure error
  const paramErrorResult = OutputFilePathResolver.create(validConfig, { invalid: true } as any);
  assertEquals(paramErrorResult.ok, false);
  if (!paramErrorResult.ok) {
    assertEquals(paramErrorResult.error.kind, "ConfigurationError");
    if (paramErrorResult.error.kind === "ConfigurationError") {
      assertExists(paramErrorResult.error.message);
    }
  }
});

Deno.test("0_architecture: Totality pattern - exhaustive parameter validation", () => {
  // ARCHITECTURE CONSTRAINT: All input combinations must be handled
  // Totality pattern requires handling all possible input states
  
  // Test both supported parameter structures
  const legacyResult = OutputFilePathResolver.create(validConfig, validLegacyParams);
  assertEquals(legacyResult.ok, true);
  
  const twoParamsResult = OutputFilePathResolver.create(validConfig, validTwoParams);
  assertEquals(twoParamsResult.ok, true);
  
  // Test invalid legacy structure
  const invalidLegacy = {
    demonstrativeType: 123, // Wrong type
    layerType: "project",
    options: {},
  };
  const invalidLegacyResult = OutputFilePathResolver.create(validConfig, invalidLegacy as any);
  assertEquals(invalidLegacyResult.ok, false);
  
  // Test invalid TwoParams structure
  const invalidTwoParams = {
    type: "invalid", // Should be "two"
    demonstrativeType: "to",
    layerType: "project",
    options: {},
  };
  const invalidTwoParamsResult = OutputFilePathResolver.create(validConfig, invalidTwoParams as any);
  assertEquals(invalidTwoParamsResult.ok, false);
});

Deno.test("0_architecture: Immutability constraint - input parameter isolation", () => {
  // ARCHITECTURE CONSTRAINT: Constructor must not mutate input parameters
  // Domain objects must maintain referential transparency
  
  const originalConfig = { ...validConfig };
  const originalParams = { ...validLegacyParams, options: { ...validLegacyParams.options } };
  
  const result = OutputFilePathResolver.create(originalConfig, originalParams);
  assertEquals(result.ok, true);
  
  // Mutate original inputs after construction
  originalConfig.working_dir = "MUTATED";
  originalParams.demonstrativeType = "MUTATED";
  originalParams.options!.destinationFile = "MUTATED.md";
  
  if (result.ok) {
    // Verify internal state is isolated from mutations
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // Should use original values, not mutated ones
      assertEquals(pathResult.data.metadata.originalPath, "output.md");
      assertEquals(pathResult.data.metadata.originalPath !== "MUTATED.md", true);
    }
  }
});

Deno.test("0_architecture: Type safety constraint - compile-time guarantees", () => {
  // ARCHITECTURE CONSTRAINT: Type system must prevent invalid usage
  // TypeScript types must encode architectural constraints
  
  const result = OutputFilePathResolver.create(validConfig, validLegacyParams);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    // Verify method availability on successful construction
    assertEquals(typeof result.data.getPath, "function");
    assertEquals(typeof result.data.getPathLegacy, "function");
    assertEquals(typeof result.data.getPathLegacyUnsafe, "function");
    
    // Verify methods return appropriate types
    const pathResult = result.data.getPath();
    assertExists(pathResult);
    assertEquals(typeof pathResult.ok, "boolean");
  }
});

Deno.test("0_architecture: Factory pattern constraint - single creation pathway", () => {
  // ARCHITECTURE CONSTRAINT: Only one way to create instances
  // Factory pattern must be the exclusive creation mechanism
  
  // Verify static factory method exists
  assertEquals(typeof OutputFilePathResolver.create, "function");
  
  // Verify no other static creation methods
  const staticMethods = Object.getOwnPropertyNames(OutputFilePathResolver)
    .filter(name => typeof (OutputFilePathResolver as any)[name] === "function")
    .filter(name => name !== "create");
  
  // Should only have standard constructor-related methods
  const allowedMethods = ["length", "name", "prototype"];
  for (const method of staticMethods) {
    assertEquals(allowedMethods.includes(method), true, 
      `Unexpected static method found: ${method}. Factory pattern violation.`);
  }
});

Deno.test("0_architecture: Invariant constraint - domain business rules", () => {
  // ARCHITECTURE CONSTRAINT: Domain invariants must be maintained
  // Output paths must follow Breakdown conventions
  
  const result = OutputFilePathResolver.create(validConfig, validLegacyParams);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    // Test auto-generation maintains invariants
    const autoGenParams: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: {}, // No destinationFile - should auto-generate
    };
    
    const autoGenResolver = OutputFilePathResolver.create(validConfig, autoGenParams);
    assertEquals(autoGenResolver.ok, true);
    
    if (autoGenResolver.ok) {
      const autoPath = autoGenResolver.data.getPath();
      assertEquals(autoPath.ok, true);
      
      if (autoPath.ok) {
        // Auto-generated paths must have .md extension
        assertEquals(autoPath.data.value.endsWith(".md"), true);
        // Must be in layer directory
        assertEquals(autoPath.data.value.includes("project"), true);
        // Must be marked as generated
        assertEquals(autoPath.data.isGenerated, true);
        assertEquals(autoPath.data.type, "auto-generated");
      }
    }
  }
});

Deno.test("0_architecture: Error handling constraint - defensive programming", () => {
  // ARCHITECTURE CONSTRAINT: All error conditions must be handled gracefully
  // No undefined behavior or exceptions should occur
  
  const result = OutputFilePathResolver.create(validConfig, validLegacyParams);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    // Test invalid path characters
    const invalidCharParams: PromptCliParams = {
      demonstrativeType: "to",
      layerType: "project",
      options: {
        destinationFile: "invalid\0path.md", // null character
      },
    };
    
    const invalidResolver = OutputFilePathResolver.create(validConfig, invalidCharParams);
    assertEquals(invalidResolver.ok, true);
    
    if (invalidResolver.ok) {
      const pathResult = invalidResolver.data.getPath();
      assertEquals(pathResult.ok, false); // Should fail gracefully
      
      if (!pathResult.ok) {
        assertEquals(pathResult.error.kind, "InvalidPath");
        if (pathResult.error.kind === "InvalidPath") {
          assertExists(pathResult.error.reason);
        }
      }
    }
  }
});