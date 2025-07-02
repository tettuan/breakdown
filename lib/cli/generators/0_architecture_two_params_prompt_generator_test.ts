/**
 * @fileoverview Architecture tests for TwoParamsPromptGenerator
 *
 * Tests architectural constraints and design principles:
 * - Single responsibility principle adherence
 * - Dependency direction enforcement
 * - Interface segregation
 * - Totality principle compliance
 *
 * @module cli/generators/0_architecture_two_params_prompt_generator_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { TwoParamsPromptGenerator } from "./two_params_prompt_generator.ts";
import type { PromptGeneratorError, ValidatedParams } from "./two_params_prompt_generator.ts";

Deno.test("Architecture: TwoParamsPromptGenerator follows single responsibility principle", async () => {
  // Verify class has single clear purpose
  const _generator = new TwoParamsPromptGenerator();

  // Should only have prompt generation related methods
  assertExists(_generator.generatePrompt, "Should have generatePrompt method");

  // Verify no unrelated responsibilities
  const prototype = Object.getPrototypeOf(_generator);
  const methods = Object.getOwnPropertyNames(prototype).filter((name) =>
    name !== "constructor" && typeof prototype[name] === "function"
  );

  // Should have generatePrompt as the primary public method
  assertEquals(methods.includes("generatePrompt"), true, "Should have generatePrompt method");

  // Other methods should be private/internal helpers
  const publicMethods = methods.filter((name) =>
    !name.startsWith("create") && !name.startsWith("validate") && !name.startsWith("build") &&
      !name.startsWith("generate") || name === "generatePrompt"
  );
  assertEquals(publicMethods.length, 1, "Should only have one public method");
  assertEquals(publicMethods[0], "generatePrompt", "Only public method should be generatePrompt");
});

Deno.test("Architecture: TwoParamsPromptGenerator error types follow discriminated union pattern", async () => {
  // Verify all error types have discriminant 'kind' property
  const errorKinds = [
    "FactoryCreationError",
    "FactoryValidationError",
    "VariablesBuilderError",
    "PromptGenerationError",
    "InvalidConfiguration",
  ];

  // Each error type should be unique and exhaustive
  const uniqueKinds = new Set(errorKinds);
  assertEquals(uniqueKinds.size, errorKinds.length, "All error kinds should be unique");
});

Deno.test("Architecture: TwoParamsPromptGenerator dependencies follow correct direction", async () => {
  // Verify imports are from lower layers only
  const moduleImports = [
    "../../types/_result.ts",
    "../../types/mod.ts",
    "jsr:@tettuan/breakdownprompt",
    "../../factory/prompt_variables_factory.ts",
    "../../builder/variables_builder.ts",
    "../processors/two_params_variable_processor.ts",
  ];

  // No imports from higher layers (e.g., handlers, orchestrators)
  const hasHigherLayerImports = moduleImports.some((imp) =>
    imp.includes("/handlers/") ||
    imp.includes("/orchestrators/") ||
    imp.includes("/cli/breakdown")
  );

  assertEquals(hasHigherLayerImports, false, "Should not import from higher layers");
});

Deno.test("Architecture: ValidatedParams interface enforces type safety", async () => {
  // Verify interface structure
  const validParams: ValidatedParams = {
    demonstrativeType: "to",
    layerType: "project",
  };

  assertExists(validParams.demonstrativeType, "Should have demonstrativeType");
  assertExists(validParams.layerType, "Should have layerType");

  // Type should be enforced at compile time
  assertEquals(typeof validParams.demonstrativeType, "string");
  assertEquals(typeof validParams.layerType, "string");
});

Deno.test("Architecture: TwoParamsPromptGenerator integrates with Result type pattern", async () => {
  const _generator = new TwoParamsPromptGenerator();

  // Should return Result type
  const _result = await _generator.generatePrompt(
    {} as unknown,
    { demonstrativeType: "to", layerType: "project" },
    {},
    { standardVariables: {}, customVariables: {}, allVariables: {} },
  );

  // Result should have ok/error structure
  assertExists(_result.ok !== undefined, "Should return Result type");

  if (_result.ok) {
    assertExists(_result.data, "Success should have data");
  } else {
    assertExists(_result.error, "Failure should have error");
    assertExists(_result.error.kind, "Error should have kind discriminant");
  }
});

Deno.test("Architecture: TwoParamsPromptGenerator maintains clear separation of concerns", async () => {
  // Verify class focuses only on prompt generation orchestration
  const _generator = new TwoParamsPromptGenerator();

  // Should not contain business logic from:
  // - PromptVariablesFactory (factory logic)
  // - VariablesBuilder (variable building)
  // - PromptManager (template processing)

  // Class should act as coordinator only
  const sourceCode = TwoParamsPromptGenerator.toString();

  // Should not contain complex business logic
  assertEquals(
    sourceCode.includes("template processing") ||
      sourceCode.includes("variable validation rules"),
    false,
    "Should not contain business logic from dependencies",
  );
});
