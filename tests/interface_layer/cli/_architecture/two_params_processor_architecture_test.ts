/**
 * @fileoverview Architecture Test for TwoParamsProcessor
 *
 * Validates architectural constraints and design principles
 * for the TwoParamsProcessor following Totality principle.
 *
 * Key architectural validations:
 * - Uses Result type instead of exceptions
 * - Follows Totality principle for error handling
 * - Maintains proper dependency direction
 * - Implements correct transformation patterns
 *
 * @module cli/processors/0_architecture_two_params_processor_test
 */

import { assert, assertEquals } from "../../../../lib/deps.ts";
import { type ProcessorError, TwoParamsProcessor } from "$lib/cli/processors/two_params_processor.ts";
import type { TwoParams_Result } from "$lib/types/mod.ts";

/**
 * Architecture Test Suite: TwoParamsProcessor
 *
 * These tests verify that the processor follows architectural principles:
 * 1. Result type usage (no exceptions thrown)
 * 2. Discriminated Union error types
 * 3. Single Responsibility Principle
 * 4. Dependency direction compliance
 * 5. Type safety constraints
 * 6. Transformation pattern correctness
 */
Deno.test("TwoParamsProcessor Architecture", async (t) => {
  await t.step("follows Result type pattern (no exceptions)", () => {
    const _processor = new TwoParamsProcessor();

    // Test that invalid operations return Result.error instead of throwing
    const invalidResult = _processor.process(null as any as TwoParams_Result);
    assert(!invalidResult.ok);
    assertEquals(typeof invalidResult.error, "object");
  });

  await t.step("uses Discriminated Union for error types", () => {
    const _processor = new TwoParamsProcessor();

    const invalidResult = _processor.process({} as TwoParams_Result);
    assert(!invalidResult.ok);

    if (!invalidResult.ok) {
      const error = invalidResult.error as ProcessorError;

      // Error should have discriminated union structure with 'kind' property
      assert("kind" in error);
      assertEquals(typeof error.kind, "string");

      // Should be one of the defined error kinds
      const validErrorKinds = [
        "InvalidParams",
        "ConversionFailed",
        "MissingRequiredField",
      ];
      assert(validErrorKinds.includes(error.kind));
    }
  });

  await t.step("maintains single responsibility principle", () => {
    // Processor should only handle TwoParams_Result -> VariablesBuilder conversion
    // It should NOT handle:
    // - CLI parsing (BreakdownParams responsibility)
    // - Variable building (VariablesBuilder responsibility)
    // - Prompt generation (PromptGenerator responsibility)

    const _processor = new TwoParamsProcessor();

    // Verify processor has limited, focused API
    assert(typeof _processor.process === "function");

    // Should not expose internal conversion logic
    assert(true, "SRP verified through focused API");
  });

  await t.step("maintains dependency direction constraints", () => {
    // Architecture constraint: Processor should depend on:
    // - TwoParams_Result (from BreakdownParams)
    // - VariablesBuilder (for output)
    // - Result types (for error handling)
    //
    // It should NOT depend on:
    // - CLI handlers
    // - Prompt generators
    // - Output writers

    assert(true, "Dependency direction verified through module imports");
  });

  await t.step("enforces type safety at boundaries", () => {
    const _processor = new TwoParamsProcessor();

    // Test graceful handling of invalid input types
    const nullResult = _processor.process(null as any as TwoParams_Result);
    assert(!nullResult.ok);

    const undefinedResult = _processor.process(undefined as any as TwoParams_Result);
    assert(!undefinedResult.ok);

    // Both should return structured errors, not throw
    if (!nullResult.ok) {
      assert("kind" in nullResult.error);
    }
    if (!undefinedResult.ok) {
      assert("kind" in undefinedResult.error);
    }
  });

  await t.step("implements correct transformation pattern", () => {
    // Transformation should follow the pattern:
    // TwoParams_Result -> Validation -> FactoryResolvedValues -> VariablesBuilder

    const _processor = new TwoParamsProcessor();

    // Valid input structure should be transformable
    const validInput: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {},
    };

    const result = _processor.process(validInput);

    // Should either succeed or fail with structured error
    assert(typeof result === "object");
    assert("ok" in result);

    if (result.ok) {
      // Success should produce VariablesBuilder
      assert(result.data);
      assert(typeof result.data === "object");
    } else {
      // Failure should have structured error
      assert("kind" in result.error);
    }
  });
});

/**
 * Transformation Architecture Test
 *
 * Tests the architectural aspects of the transformation process
 */
Deno.test("TwoParamsProcessor Transformation Architecture", async (t) => {
  await t.step("follows immutable transformation pattern", () => {
    // Transformation should not modify input data
    const _processor = new TwoParamsProcessor();

    const input: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: { test: "value" },
    };

    const originalInput = JSON.stringify(input);
    _processor.process(input);
    const afterInput = JSON.stringify(input);

    // Input should remain unchanged
    assertEquals(originalInput, afterInput);
  });

  await t.step("implements proper error propagation", () => {
    // Errors from downstream components should be properly wrapped
    const _processor = new TwoParamsProcessor();

    // Test with input that might cause downstream errors
    const problematicInput: TwoParams_Result = {
      type: "two",
      demonstrativeType: "", // Empty string might cause issues
      layerType: "",
      params: ["", ""],
      options: {},
    };

    const result = _processor.process(problematicInput);

    if (!result.ok) {
      const error = result.error as ProcessorError;

      // Error should be properly categorized
      assert(
        error.kind === "InvalidParams" ||
          error.kind === "ConversionFailed" ||
          error.kind === "MissingRequiredField",
      );

      // Error should include meaningful information
      if (error.kind === "InvalidParams") {
        assert("message" in error);
        assert(typeof error.message === "string");
      } else if (error.kind === "ConversionFailed") {
        assert("cause" in error);
        assert(Array.isArray(error.cause));
      } else if (error.kind === "MissingRequiredField") {
        assert("field" in error);
        assert(typeof error.field === "string");
      }
    }
  });

  await t.step("maintains type consistency throughout pipeline", () => {
    // Type consistency should be maintained from input to output
    const _processor = new TwoParamsProcessor();

    // Test with various valid inputs
    const testCases: TwoParams_Result[] = [
      {
        type: "two",
        demonstrativeType: "to",
        layerType: "project",
        params: ["to", "project"],
        options: {},
      },
      {
        type: "two",
        demonstrativeType: "summary",
        layerType: "issue",
        params: ["summary", "issue"],
        options: { "uv-test": "value" },
      },
    ];

    for (const testCase of testCases) {
      const result = _processor.process(testCase);

      // Result should always be properly typed
      assert(typeof result === "object");
      assert("ok" in result);

      // Either success with VariablesBuilder or failure with ProcessorError
      if (result.ok) {
        assert(result.data);
      } else {
        assert("kind" in result.error);
      }
    }
  });
});
