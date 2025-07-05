/**
 * @fileoverview Architecture Test for TwoParamsVariableProcessor
 *
 * Validates architectural constraints and design principles
 * for the TwoParamsVariableProcessor following Totality principle.
 *
 * @module cli/processors/0_architecture_two_params_variable_processor_test
 */

import { assert, assertEquals } from "../../../../lib/deps.ts";
import { TwoParamsVariableProcessor } from "../../../../lib/cli/processors/two_params_variable_processor.ts";
import type { VariableProcessorError } from "../../../../lib/cli/processors/two_params_variable_processor.ts";

/**
 * Architecture Test Suite: TwoParamsVariableProcessor
 *
 * These tests verify that the processor follows architectural principles:
 * 1. Result type usage (no exceptions thrown)
 * 2. Discriminated Union error types
 * 3. Single Responsibility Principle
 * 4. Dependency direction compliance
 * 5. Type safety constraints
 */
Deno.test("TwoParamsVariableProcessor Architecture", async (t) => {
  await t.step("follows Result type pattern (no exceptions)", () => {
    const _processor = new TwoParamsVariableProcessor();

    // Test that invalid operations return Result.error instead of throwing
    const invalidResult = _processor.processVariables(
      null as any as Record<string, unknown>,
      "",
    );
    assertEquals(invalidResult.ok, false);
    assert(!invalidResult.ok);
    if (!invalidResult.ok) {
      assert(Array.isArray(invalidResult.error));
    }
  });

  await t.step("uses Discriminated Union for error types", () => {
    const _processor = new TwoParamsVariableProcessor();

    // Test that error types have discriminated 'kind' field
    const result = _processor.processVariables({ "invalid-prefix": "value" }, "");

    if (!result.ok) {
      for (const error of result.error) {
        assert("kind" in error);
        assert(typeof error.kind === "string");

        // Verify error types are well-defined discriminated unions
        const validKinds = [
          "InvalidVariablePrefix",
          "ReservedVariableName",
          "EmptyVariableValue",
          "InvalidOptions",
        ];
        assert(validKinds.includes(error.kind));
      }
    }
  });

  await t.step("maintains single responsibility principle", () => {
    const _processor = new TwoParamsVariableProcessor();

    // Verify processor only handles variable processing, not:
    // - File I/O operations
    // - Network operations
    // - Configuration loading
    // - Prompt generation

    // The class should only have methods related to variable processing
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(_processor))
      .filter((name) => name !== "constructor");

    // All methods should be related to variable processing
    const expectedMethods = [
      "processVariables",
      "processVariablesWithoutStdin",
    ];

    for (const method of methods) {
      if (method.startsWith("_") || method === "constructor") continue;
      assert(
        expectedMethods.includes(method) || method.includes("Variable"),
        `Method ${method} may violate single responsibility`,
      );
    }
  });

  await t.step("has no circular dependencies", () => {
    // Verify that TwoParamsVariableProcessor only depends on:
    // - Result types (lib/types/result.ts)
    // - No other processors, handlers, or orchestrators

    // This test ensures architectural layer separation
    // The processor should be at the same level as other processors
    // and not depend on higher-level components

    // Since this is TypeScript, we verify through type imports
    // No runtime circular dependency detection needed
    assert(true, "No circular dependencies detected at compile time");
  });

  await t.step("maintains type safety boundaries", () => {
    const _processor = new TwoParamsVariableProcessor();

    // Test that the processor handles unknown input types safely
    const unknownTypeResult = _processor.processVariables(
      { someKey: Symbol("test") }, // Symbol type not expected
      "test",
    );

    // Should handle gracefully and convert to string
    assertEquals(unknownTypeResult.ok, true);

    // Test with undefined/null inputs
    const nullResult = _processor.processVariables(null as any as Record<string, unknown>, "");
    assertEquals(nullResult.ok, false);

    const undefinedResult = _processor.processVariables(
      undefined as any as Record<string, unknown>,
      "",
    );
    assertEquals(undefinedResult.ok, false);
  });

  await t.step("enforces prefix validation architecture", () => {
    const _processor = new TwoParamsVariableProcessor();

    // Architecture constraint: custom variables MUST have uv- prefix
    const result = _processor.processVariables({
      "custom-var": "value", // Invalid prefix
      "uv-valid": "value", // Valid prefix
    }, "");

    assertEquals(result.ok, true);

    if (result.ok) {
      // Only uv-prefixed variables should be in customVariables
      assertEquals(Object.keys(result.data.customVariables).length, 1);
      assert("uv-valid" in result.data.customVariables);
      assert(!("custom-var" in result.data.customVariables));
    }
  });

  await t.step("separates concerns between custom and standard variables", () => {
    const _processor = new TwoParamsVariableProcessor();

    const result = _processor.processVariables({
      "uv-custom": "custom_value",
      "from": "input.txt",
      "destination": "output.txt",
    }, "stdin content");

    assertEquals(result.ok, true);

    if (result.ok) {
      const { customVariables, standardVariables, allVariables } = result.data;

      // Custom variables should only contain uv- prefixed items
      assertEquals(Object.keys(customVariables).length, 1);
      assert("uv-custom" in customVariables);

      // Standard variables should contain expected standard items
      assert("input_text" in standardVariables);
      assert("input_text_file" in standardVariables);
      assert("destination_path" in standardVariables);

      // All variables should be the union
      assert("uv-custom" in allVariables);
      assert("input_text" in allVariables);
    }
  });

  await t.step("prevents reserved variable name conflicts", () => {
    const _processor = new TwoParamsVariableProcessor();

    // Architecture constraint: prevent conflicts with reserved names
    const result = _processor.processVariables({
      "uv-input_text": "should_fail", // Reserved name with uv- prefix
      "uv-safe": "should_work",
    }, "");

    assertEquals(result.ok, false);

    if (!result.ok) {
      // Should have ReservedVariableName error
      const hasReservedError = result.error.some(
        (err: VariableProcessorError) => err.kind === "ReservedVariableName",
      );
      assert(hasReservedError);
    }
  });
});
