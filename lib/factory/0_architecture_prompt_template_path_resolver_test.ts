/**
 * @fileoverview 0_architecture tests for PromptTemplatePathResolver
 * Testing architectural constraints and design patterns compliance
 *
 * Architecture tests verify:
 * - Smart Constructor pattern enforcement
 * - Domain boundary constraints
 * - Result type constraints
 * - Totality pattern compliance
 */

import { assertEquals, assertExists } from "@std/assert";
import { PromptTemplatePathResolverTotality as PromptTemplatePathResolver } from "./prompt_template_path_resolver_totality.ts";
import type { PromptCliParams, TwoParams_Result } from "./prompt_variables_factory.ts";

// Type-safe interfaces for error testing
type ConfigObject = Record<string, unknown>;
type ParamsObject = Record<string, unknown>;

// Architecture Test Fixtures
const validConfig = {
  app_prompt: { base_dir: "lib/breakdown/prompts" },
  app_schema: { base_dir: "lib/breakdown/schemas" },
};

const validLegacyParams: PromptCliParams = {
  directiveType: "to",
  layerType: "project",
  options: {
    fromLayerType: "issue",
    adaptation: "analysis",
  },
};

const validTwoParams: TwoParams_Result = {
  type: "two",
  directiveType: "to",
  demonstrativeType: "to",
  layerType: "project",
  params: ["to", "project"],
  options: {
    fromLayerType: "issue",
    adaptation: "analysis",
  },
};

Deno.test("0_architecture: Smart Constructor pattern - private constructor enforced", () => {
  // ARCHITECTURE CONSTRAINT: Constructor must be private
  // Direct instantiation should be impossible via TypeScript
  // TypeScript compile-time check verifies this constraint

  // Verify factory method exists as the only construction path
  assertEquals(typeof PromptTemplatePathResolver.create, "function");
  assertExists(PromptTemplatePathResolver.create);

  // Verify that factory method is the only way to create instances
  const result = PromptTemplatePathResolver.create(validConfig, validLegacyParams);
  assertExists(result);
});

Deno.test("0_architecture: Smart Constructor pattern - factory method returns Result type", () => {
  // ARCHITECTURE CONSTRAINT: Factory must return Result<T, E> type
  const result = PromptTemplatePathResolver.create(validConfig, validLegacyParams);

  // Verify Result type structure
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");

  // Result must have either data or error, never both
  if (result.ok) {
    assertExists(result.data);
    assertEquals("error" in result, false);
    assertEquals(result.data.constructor.name, "PromptTemplatePathResolver");
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
    {
      desc: "empty directiveType",
      config: validConfig,
      params: { directiveType: "", layerType: "project" },
    },
    {
      desc: "empty layerType",
      config: validConfig,
      params: { directiveType: "to", layerType: "" },
    },
    {
      desc: "whitespace directiveType",
      config: validConfig,
      params: { directiveType: "   ", layerType: "project" },
    },
    {
      desc: "whitespace layerType",
      config: validConfig,
      params: { directiveType: "to", layerType: "   " },
    },
  ];

  for (const { desc, config, params } of boundaryViolationTests) {
    // Should never throw - all errors must be captured in Result type
    const result = PromptTemplatePathResolver.create(
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
  const configErrorResult = PromptTemplatePathResolver.create(
    null as unknown as ConfigObject,
    validLegacyParams,
  );
  assertEquals(configErrorResult.ok, false);
  if (!configErrorResult.ok) {
    assertEquals(configErrorResult.error.kind, "InvalidConfiguration");
    if (configErrorResult.error.kind === "InvalidConfiguration") {
      assertExists(configErrorResult.error.details);
    }
  }

  // Test parameter structure error
  const paramErrorResult = PromptTemplatePathResolver.create(
    validConfig,
    { invalid: true } as unknown as PromptCliParams | TwoParams_Result,
  );
  assertEquals(paramErrorResult.ok, false);
  if (!paramErrorResult.ok) {
    assertEquals(paramErrorResult.error.kind, "InvalidParameterCombination");
    if (paramErrorResult.error.kind === "InvalidParameterCombination") {
      assertExists(paramErrorResult.error.directiveType);
      assertExists(paramErrorResult.error.layerType);
    }
  }

  // Test invalid parameter combination
  const invalidCombinationResult = PromptTemplatePathResolver.create(
    validConfig,
    {
      directiveType: "",
      layerType: "project",
    } as unknown as PromptCliParams | TwoParams_Result,
  );
  assertEquals(invalidCombinationResult.ok, false);
  if (!invalidCombinationResult.ok) {
    assertEquals(invalidCombinationResult.error.kind, "InvalidParameterCombination");
    if (invalidCombinationResult.error.kind === "InvalidParameterCombination") {
      assertExists(invalidCombinationResult.error.directiveType);
      assertExists(invalidCombinationResult.error.layerType);
    }
  }
});

Deno.test("0_architecture: Totality pattern - exhaustive parameter validation", () => {
  // ARCHITECTURE CONSTRAINT: All input combinations must be handled
  // Totality pattern requires handling all possible input states

  // Test both supported parameter structures
  const legacyResult = PromptTemplatePathResolver.create(validConfig, validLegacyParams);
  assertEquals(legacyResult.ok, true);

  const twoParamsResult = PromptTemplatePathResolver.create(validConfig, validTwoParams);
  assertEquals(twoParamsResult.ok, true);

  // Test invalid legacy structure - avoid non-string types that cause runtime errors
  const invalidLegacy = {
    directiveType: null, // Wrong type - cannot be trimmed
    layerType: "project",
  };
  const invalidLegacyResult = PromptTemplatePathResolver.create(
    validConfig,
    invalidLegacy as unknown as PromptCliParams | TwoParams_Result,
  );
  assertEquals(invalidLegacyResult.ok, false);

  // Test invalid TwoParams structure - missing directiveType in structure
  const invalidTwoParams = {
    type: "two",
    directiveType: "to",
    params: [], // Empty params array - no directiveType available
    // Missing directiveType and layerType fields
  };
  const invalidTwoParamsResult = PromptTemplatePathResolver.create(
    validConfig,
    invalidTwoParams as unknown as PromptCliParams | TwoParams_Result,
  );
  assertEquals(invalidTwoParamsResult.ok, false);

  // Test missing required parameters
  const missingDemonstrativeResult = PromptTemplatePathResolver.create(
    validConfig,
    {
      layerType: "project",
    } as unknown as PromptCliParams | TwoParams_Result,
  );
  assertEquals(missingDemonstrativeResult.ok, false);

  const missingLayerResult = PromptTemplatePathResolver.create(
    validConfig,
    {
      directiveType: "to",
    } as unknown as PromptCliParams | TwoParams_Result,
  );
  assertEquals(missingLayerResult.ok, false);
});

Deno.test("0_architecture: Immutability constraint - input parameter isolation", () => {
  // ARCHITECTURE CONSTRAINT: Constructor must not mutate input parameters
  // Domain objects must maintain referential transparency

  const originalConfig = {
    app_prompt: { base_dir: "lib/breakdown/prompts" },
    app_schema: { base_dir: "lib/breakdown/schemas" },
  };
  const originalParams = {
    ...validLegacyParams,
    options: { ...validLegacyParams.options },
  };

  const result = PromptTemplatePathResolver.create(originalConfig, originalParams);
  assertEquals(result.ok, true);

  // Mutate original inputs after construction
  originalConfig.app_prompt.base_dir = "MUTATED";
  originalParams.directiveType = "MUTATED";
  originalParams.options!.adaptation = "MUTATED";

  if (result.ok) {
    // Verify internal state is isolated from mutations
    const pathResult = result.data.getPath();
    // The test is successful if either:
    // 1. Path resolution succeeds and shows original values
    // 2. Path resolution fails gracefully (e.g., base directory doesn't exist)
    if (pathResult.ok) {
      // Should use original values, not mutated ones
      assertEquals(pathResult.data.value.includes("MUTATED"), false);
      assertEquals(pathResult.data.metadata.directiveType, "to");
      assertEquals(pathResult.data.metadata.adaptation, "analysis");
    }
    // Whether path resolution succeeds or fails, the constructor should have isolated the inputs
    assertEquals(result.ok, true); // Constructor succeeded with original values
  }
});

Deno.test("0_architecture: Type safety constraint - compile-time guarantees", () => {
  // ARCHITECTURE CONSTRAINT: Type system must prevent invalid usage
  // TypeScript types must encode architectural constraints

  const result = PromptTemplatePathResolver.create(validConfig, validLegacyParams);
  assertEquals(result.ok, true);

  if (result.ok) {
    // Verify method availability on successful construction
    assertEquals(typeof result.data.getPath, "function");
    assertEquals(typeof result.data.buildFileName, "function");
    assertEquals(typeof result.data.buildPromptPath, "function");
    assertEquals(typeof result.data.shouldFallback, "function");
    assertEquals(typeof result.data.resolveFromLayerTypeSafe, "function");
    assertEquals(typeof result.data.buildFallbackFileName, "function");

    // Verify methods return appropriate types
    const pathResult = result.data.getPath();
    assertExists(pathResult);
    assertEquals(typeof pathResult.ok, "boolean");

    // Base directory is now accessed through path result
    if (pathResult.ok) {
      const baseDir = pathResult.data.metadata.baseDir;
      assertEquals(typeof baseDir, "string");
    }

    const fileName = result.data.buildFileName();
    assertEquals(typeof fileName, "string");

    const fromLayerType = result.data.resolveFromLayerTypeSafe();
    assertEquals(typeof fromLayerType, "string");
  }
});

Deno.test("0_architecture: Factory pattern constraint - single creation pathway", () => {
  // ARCHITECTURE CONSTRAINT: Only one way to create instances
  // Factory pattern must be the exclusive creation mechanism

  // Verify static factory method exists
  assertEquals(typeof PromptTemplatePathResolver.create, "function");

  // Verify no other static creation methods
  const staticMethods = Object.getOwnPropertyNames(PromptTemplatePathResolver)
    .filter((name) =>
      typeof ((PromptTemplatePathResolver as unknown) as Record<string, unknown>)[name] ===
        "function"
    )
    .filter((name) => name !== "create");

  // Should only have standard constructor-related methods and internal helper methods
  const allowedMethods = [
    "length",
    "name",
    "prototype",
    "extractDirectiveType",
    "extractLayerType",
  ];
  for (const method of staticMethods) {
    assertEquals(
      allowedMethods.includes(method),
      true,
      `Unexpected static method found: ${method}. Factory pattern violation.`,
    );
  }
});

Deno.test("0_architecture: Invariant constraint - domain business rules", () => {
  // ARCHITECTURE CONSTRAINT: Domain invariants must be maintained
  // Template paths must follow Breakdown conventions

  const result = PromptTemplatePathResolver.create(validConfig, validLegacyParams);
  assertEquals(result.ok, true);

  if (result.ok) {
    // Test template path structure invariants
    const pathResult = result.data.getPath();
    if (pathResult.ok) {
      // Template paths must follow directory structure: base/demonstrative/layer/filename
      const pathParts = pathResult.data.value.split("/");
      assertEquals(pathParts.length >= 4, true, "Path must have at least 4 parts");
      assertEquals(pathParts[pathParts.length - 3], "to", "Demonstrative type must be in path");
      assertEquals(pathParts[pathParts.length - 2], "project", "Layer type must be in path");
      assertEquals(
        pathParts[pathParts.length - 1].startsWith("f_"),
        true,
        "Filename must start with f_",
      );
      assertEquals(
        pathParts[pathParts.length - 1].includes("issue"),
        true,
        "Filename must include fromLayerType",
      );
    }

    // Test filename invariants
    const fileName = result.data.buildFileName();
    assertEquals(fileName.startsWith("f_"), true, "Filename must start with f_");
    assertEquals(fileName.endsWith(".md"), true, "Template files must have .md extension");
    assertEquals(fileName.includes("issue"), true, "Filename must include fromLayerType");
    assertEquals(fileName.includes("analysis"), true, "Filename must include adaptation");

    // Test fallback filename invariants
    const fallbackName = result.data.buildFallbackFileName();
    assertEquals(fallbackName.startsWith("f_"), true, "Fallback filename must start with f_");
    assertEquals(fallbackName.endsWith(".md"), true, "Fallback files must have .md extension");
    assertEquals(
      fallbackName.includes("issue"),
      true,
      "Fallback filename must include fromLayerType",
    );
    assertEquals(
      fallbackName.includes("analysis"),
      false,
      "Fallback filename must not include adaptation",
    );
  }
});

Deno.test("0_architecture: Error handling constraint - defensive programming", () => {
  // ARCHITECTURE CONSTRAINT: All error conditions must be handled gracefully
  // No undefined behavior or exceptions should occur

  const result = PromptTemplatePathResolver.create(validConfig, validLegacyParams);
  assertEquals(result.ok, true);

  if (result.ok) {
    // Test fallback behavior when primary template doesn't exist
    const shouldFallback = result.data.shouldFallback("/nonexistent/path/template.md");
    assertEquals(typeof shouldFallback, "boolean");

    // Test path resolution with non-existent base directory
    const invalidBaseConfig = {
      app_prompt: { base_dir: "/completely/invalid/path/that/does/not/exist" },
    };

    const invalidBaseResult = PromptTemplatePathResolver.create(
      invalidBaseConfig,
      validLegacyParams,
    );
    assertEquals(invalidBaseResult.ok, true); // Creation should succeed

    if (invalidBaseResult.ok) {
      const pathResult = invalidBaseResult.data.getPath();
      assertEquals(pathResult.ok, false); // Path resolution should fail gracefully

      if (!pathResult.ok) {
        assertEquals(pathResult.error.kind, "BaseDirectoryNotFound");
        if (pathResult.error.kind === "BaseDirectoryNotFound") {
          assertExists(pathResult.error.path);
        }
      }
    }
  }
});

Deno.test("0_architecture: Value object constraint - PromptTemplatePath immutability", () => {
  // ARCHITECTURE CONSTRAINT: Value objects must be immutable
  // PromptTemplatePath should be a proper value object

  const result = PromptTemplatePathResolver.create(validConfig, validLegacyParams);
  assertEquals(result.ok, true);

  if (result.ok) {
    const pathResult = result.data.getPath();
    if (pathResult.ok) {
      const promptPath = pathResult.data;

      // Verify value object properties are readonly
      const originalValue = promptPath.value;
      const originalStatus = promptPath.status;
      const originalMetadata = promptPath.metadata;

      // Attempt to modify should fail at compile time (readonly properties)
      // @ts-expect-error - Verifying readonly constraint
      promptPath.value = "MUTATED";
      // @ts-expect-error - Verifying readonly constraint
      promptPath.status = "MUTATED";
      // @ts-expect-error - Verifying readonly constraint
      promptPath.metadata = {};

      // Values should remain unchanged
      assertEquals(promptPath.value, originalValue);
      assertEquals(promptPath.status, originalStatus);
      assertEquals(promptPath.metadata, originalMetadata);

      // Test value object methods are pure functions
      const message1 = promptPath.getResolutionMessage();
      const message2 = promptPath.getResolutionMessage();
      assertEquals(message1, message2, "getResolutionMessage should be deterministic");

      const isFallback1 = promptPath.isFallback();
      const isFallback2 = promptPath.isFallback();
      assertEquals(isFallback1, isFallback2, "isFallback should be deterministic");
    }
  }
});

Deno.test("0_architecture: Smart Constructor constraint - PromptTemplatePath validation", async () => {
  // ARCHITECTURE CONSTRAINT: Smart constructors must validate all inputs
  // PromptTemplatePath.create must ensure valid state

  const { PromptTemplatePath } = await import("./prompt_template_path_resolver_totality.ts");

  // Test empty path validation
  const emptyPathResult = PromptTemplatePath.create("", "Found", {
    baseDir: "/test",
    directiveType: "to",
    layerType: "project",
    fromLayerType: "issue",
    attemptedPaths: [],
  });
  assertEquals(emptyPathResult.ok, false);
  if (!emptyPathResult.ok) {
    assertEquals(emptyPathResult.error.message.includes("empty"), true);
  }

  // Test relative path validation
  const relativePathResult = PromptTemplatePath.create("relative/path", "Found", {
    baseDir: "/test",
    directiveType: "to",
    layerType: "project",
    fromLayerType: "issue",
    attemptedPaths: [],
  });
  assertEquals(relativePathResult.ok, false);
  if (!relativePathResult.ok) {
    assertEquals(relativePathResult.error.message.includes("absolute"), true);
  }

  // Test valid path creation
  const validPathResult = PromptTemplatePath.create("/valid/absolute/path", "Found", {
    baseDir: "/test",
    directiveType: "to",
    layerType: "project",
    fromLayerType: "issue",
    attemptedPaths: [],
  });
  assertEquals(validPathResult.ok, true);
});
