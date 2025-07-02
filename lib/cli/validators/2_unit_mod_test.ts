/**
 * Unit tests for validators module barrel export
 *
 * These tests verify that the module exports work correctly
 * and provide the expected functionality.
 *
 * @module cli/validators/tests/2_unit_mod_test
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

import {
  ParameterValidator,
  TwoParamsValidator,
  type ValidatedParams,
  type ValidationError,
} from "./_mod as any.ts";

describe("Validators Module - Unit Tests", () => {
  it("should export TwoParamsValidator class", async () => {
    assertExists(TwoParamsValidator);
    assertEquals(typeof TwoParamsValidator, "function");

    // Should be instantiable
    const _validator = new TwoParamsValidator();
    assertInstanceOf(validator, TwoParamsValidator);
  });

  it("should export ParameterValidator class", async () => {
    assertExists(ParameterValidator);
    assertEquals(typeof ParameterValidator, "function");

    // ParameterValidator requires constructor arguments
    // Just check that it's exported as a class
    assertEquals(ParameterValidator.name, "ParameterValidator");
  });

  it("should allow using exported validators", async () => {
    const _validator = new TwoParamsValidator();

    // Should have validate method
    assertEquals(typeof _validator.validate, "function");

    // Should validate parameters
    const _result = _validator.validate(["to", "project"]);
    assertEquals(_result.ok, true);

    if (_result.ok) {
      assertEquals(_result.data.demonstrativeType, "to");
      assertEquals(_result.data.layerType, "project");
    }
  });

  it("should handle validation errors correctly", async () => {
    const _validator = new TwoParamsValidator();

    // Test invalid parameters
    const _result = _validator.validate(["invalid", "project"]);
    assertEquals(_result.ok, false);

    if (!_result.ok) {
      assertEquals(_result.error.kind, "InvalidDemonstrativeType");
    }
  });

  it("should export types for TypeScript usage", async () => {
    // Type tests - these are compile-time checks
    const validatedParams: ValidatedParams = {
      demonstrativeType: "to",
      layerType: "project",
    };

    assertEquals(validatedParams.demonstrativeType, "to");
    assertEquals(validatedParams.layerType, "project");

    const error: ValidationError = {
      kind: "InvalidParameterCount",
      received: 1,
      expected: 2,
    };

    assertEquals(error.kind, "InvalidParameterCount");
  });

  it("should provide consistent API across validators", async () => {
    const twoParamsValidator = new TwoParamsValidator();

    // TwoParamsValidator should have validate method
    assertEquals(typeof twoParamsValidator.validate, "function");

    // ParameterValidator is exported but requires constructor args
    assertEquals(typeof ParameterValidator, "function");
  });

  it("should re-export from correct paths", async () => {
    // Import directly from source to compare
    const { TwoParamsValidator: DirectValidator } = await import("./two_params_validator.ts");
    const { ParameterValidator: DirectParamValidator } = await import(
      "../../validator/parameter_validator.ts"
    );

    // Should be the same references
    assertEquals(TwoParamsValidator, DirectValidator);
    assertEquals(ParameterValidator, DirectParamValidator);
  });

  it("should not export undefined values", async () => {
    const _mod = await import("./mod.ts");

    Object.entries(mod).forEach(([key, value]) => {
      assertExists(value, `Export ${key} should not be undefined`);
    });
  });

  it("should export only public API", async () => {
    const _mod = await import("./mod.ts");
    const exports = Object.keys(_mod);

    // Should have reasonable number of exports
    assertEquals(exports.length >= 2, true, "Should have at least validator exports");
    assertEquals(exports.length <= 10, true, "Should not have too many exports");
  });

  it("should load efficiently", async () => {
    // Module should load without side effects
    const startTime = performance.now();
    await import("./mod.ts");
    const loadTime = performance.now() - startTime;

    // Should load quickly (under 100ms)
    assertEquals(loadTime < 100, true, `Module load time ${loadTime}ms should be under 100ms`);
  });
});
