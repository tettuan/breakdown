/**
 * @fileoverview 0_architecture tests for InputFilePathResolver
 * Testing architectural constraints and design patterns compliance
 *
 * Architecture tests verify:
 * - Smart Constructor pattern enforcement
 * - Domain boundary constraints
 * - Result type constraints
 * - Totality pattern compliance
 */

import { assertEquals, assertExists } from "@std/assert";
import { InputFilePathResolver } from "./input_file_path_resolver.ts";
import type { PromptCliParams, TwoParams_Result } from "./prompt_variables_factory.ts";

// Type-safe interfaces for error testing
type ConfigObject = Record<string, unknown>;
type ParamsObject = Record<string, unknown>;

// Architecture Test Fixtures
const validConfig = {
  working_dir: ".agent/breakdown",
  resource_dir: ".agent/resources",
};

const validLegacyParams: PromptCliParams = {
  demonstrativeType: "to",
  layerType: "project",
  options: {
    fromFile: "test.md",
  },
};

const validTotalityParams: TwoParams_Result = {
  type: "two",
  params: ["to", "project"],
  demonstrativeType: "to",
  layerType: "project",
  options: {
    fromFile: "test.md",
  },
};

// Alternative structure with directive/layer objects for testing
const validDirectiveLayerParams = {
  directive: { value: "to", data: "to" },
  layer: { value: "project", data: "project" },
  options: {
    fromFile: "test.md",
  },
};

Deno.test("0_architecture: Smart Constructor pattern - private constructor enforced", () => {
  // ARCHITECTURE CONSTRAINT: Constructor must be private
  // Direct instantiation should be impossible via TypeScript
  // The following line would cause a TypeScript error if uncommented:
  // const _attemptDirectConstruction = () =>
  //   new InputFilePathResolver(validConfig, validLegacyParams);

  // Verify factory method exists as the only construction path
  assertEquals(typeof InputFilePathResolver.create, "function");
  assertExists(InputFilePathResolver.create);
});

Deno.test("0_architecture: Smart Constructor pattern - factory method returns Result type", () => {
  // ARCHITECTURE CONSTRAINT: Factory must return Result<T, E> type
  const result = InputFilePathResolver.create(validConfig, validLegacyParams);

  // Verify Result type structure
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");

  // Result must have either data or error, never both
  if (result.ok) {
    assertExists(result.data);
    assertEquals("error" in result, false);
    assertEquals(result.data.constructor.name, "InputFilePathResolver");
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
    const result = InputFilePathResolver.create(
      config as ConfigObject,
      params as PromptCliParams | TwoParams_Result,
    );

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
  const configErrorResult = InputFilePathResolver.create(
    null as unknown as ConfigObject,
    validLegacyParams,
  );
  assertEquals(configErrorResult.ok, false);
  if (!configErrorResult.ok) {
    assertEquals(configErrorResult.error.kind, "ConfigurationError");
    if (configErrorResult.error.kind === "ConfigurationError") {
      assertExists(configErrorResult.error.message);
    }
  }

  // Test parameter structure error
  const paramErrorResult = InputFilePathResolver.create(
    validConfig,
    { invalid: true } as unknown as PromptCliParams | TwoParams_Result,
  );
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
  const legacyResult = InputFilePathResolver.create(validConfig, validLegacyParams);
  assertEquals(legacyResult.ok, true);

  const totalityResult = InputFilePathResolver.create(validConfig, validTotalityParams);
  assertEquals(totalityResult.ok, true);

  // Test directive/layer structure
  const directiveLayerResult = InputFilePathResolver.create(
    validConfig,
    validDirectiveLayerParams as unknown as PromptCliParams | TwoParams_Result,
  );
  assertEquals(directiveLayerResult.ok, true);

  // Test invalid legacy structure
  const invalidLegacy = {
    demonstrativeType: 123, // Wrong type
    layerType: "project",
  };
  const invalidLegacyResult = InputFilePathResolver.create(
    validConfig,
    invalidLegacy as unknown as PromptCliParams | TwoParams_Result,
  );
  assertEquals(invalidLegacyResult.ok, false);
  if (!invalidLegacyResult.ok) {
    assertExists(invalidLegacyResult.error);
  }

  // Test invalid totality structure
  const invalidTotality = {
    directive: "to", // Should be object with value property
    layer: { value: "project" },
  };
  const invalidTotalityResult = InputFilePathResolver.create(
    validConfig,
    invalidTotality as unknown as PromptCliParams | TwoParams_Result,
  );
  assertEquals(invalidTotalityResult.ok, false);
  if (!invalidTotalityResult.ok) {
    assertExists(invalidTotalityResult.error);
  }
});

Deno.test("0_architecture: Immutability constraint - input parameter isolation", () => {
  // ARCHITECTURE CONSTRAINT: Constructor must not mutate input parameters
  // Domain objects must maintain referential transparency

  const originalConfig = { ...validConfig };
  const originalParams = { ...validLegacyParams, options: { ...validLegacyParams.options } };

  const result = InputFilePathResolver.create(originalConfig, originalParams);
  assertEquals(result.ok, true);

  // Mutate original inputs after construction
  originalConfig.working_dir = "MUTATED";
  originalParams.demonstrativeType = "MUTATED";
  originalParams.options!.fromFile = "MUTATED.md";

  if (result.ok) {
    // Verify internal state is isolated from mutations
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // Should use original values, not mutated ones
      assertEquals(pathResult.data.metadata.originalPath, "test.md");
      assertEquals(pathResult.data.metadata.originalPath !== "MUTATED.md", true);
    }
  }
});

Deno.test("0_architecture: Type safety constraint - compile-time guarantees", () => {
  // ARCHITECTURE CONSTRAINT: Type system must prevent invalid usage
  // TypeScript types must encode architectural constraints

  const result = InputFilePathResolver.create(validConfig, validLegacyParams);
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
  assertEquals(typeof InputFilePathResolver.create, "function");

  // Verify no other static creation methods
  const staticMethods = Object.getOwnPropertyNames(InputFilePathResolver)
    .filter((name) =>
      typeof ((InputFilePathResolver as unknown) as Record<string, unknown>)[name] === "function"
    )
    .filter((name) => name !== "create");

  // Should only have standard constructor-related methods and validation helpers
  const allowedMethods = ["length", "name", "prototype", "validateParameterStructure"];
  for (const method of staticMethods) {
    assertEquals(
      allowedMethods.includes(method),
      true,
      `Unexpected static method found: ${method}. Factory pattern violation.`,
    );
  }
});
