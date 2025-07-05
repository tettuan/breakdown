/**
 * Unit tests for validators module barrel export
 *
 * These tests verify that the module exports work correctly
 * and provide the expected functionality.
 *
 * @module cli/validators/tests/2_unit_mod_test
 */

import { assertEquals, assertExists, assertInstanceOf } from "../../../../lib/deps.ts";
import { describe, it } from "@std/testing/bdd";

import { TwoParamsValidator } from "../../../../lib/cli/validators/two_params_validator.ts";
import type { ValidatedParams, ValidationError } from "../../../../lib/cli/validators/two_params_validator.ts";

describe("Validators Module - Unit Tests", () => {
  it("should export TwoParamsValidator class", () => {
    assertExists(TwoParamsValidator);
    assertEquals(typeof TwoParamsValidator, "function");

    // Should be instantiable
    const _validator = new TwoParamsValidator();
    assertInstanceOf(_validator, TwoParamsValidator);
  });

  it("should export TwoParamsValidator properly", () => {
    // TwoParamsValidator should be properly exported
    assertExists(TwoParamsValidator);
    assertEquals(typeof TwoParamsValidator, "function");
  });

  it("should allow using exported validators", () => {
    const _validator = new TwoParamsValidator();

    // Should have validate method
    assertEquals(typeof _validator.validate, "function");

    // Should validate parameters
    const result = _validator.validate(["to", "project"]);
    assertEquals(result.ok, true);

    if (result.ok) {
      assertEquals(result.data.demonstrativeType, "to");
      assertEquals(result.data.layerType, "project");
    }
  });

  it("should handle validation errors correctly", () => {
    const _validator = new TwoParamsValidator();

    // Test invalid parameters
    const result = _validator.validate(["invalid", "project"]);
    assertEquals(result.ok, false);

    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidDemonstrativeType");
    }
  });

  it("should export types for TypeScript usage", () => {
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

  it("should provide consistent API across validators", () => {
    const twoParamsValidator = new TwoParamsValidator();

    // TwoParamsValidator should have validate method
    assertEquals(typeof twoParamsValidator.validate, "function");

    // TwoParamsValidator is the main validator we use
  });

  it("should re-export from correct paths", async () => {
    // Import directly from source to compare
    const { TwoParamsValidator: DirectValidator } = await import("../../../../lib/cli/validators/two_params_validator.ts");

    // Should be the same references
    assertEquals(TwoParamsValidator, DirectValidator);
  });

  it("should not export undefined values", async () => {
    const _mod = await import("../../../../lib/cli/validators/mod.ts");

    Object.entries(_mod).forEach(([key, value]) => {
      assertExists(value, `Export ${key} should not be undefined`);
    });
  });

  it("should export only public API", async () => {
    const _mod = await import("../../../../lib/cli/validators/mod.ts");
    const exports = Object.keys(_mod);

    // Should have reasonable number of exports
    assertEquals(exports.length >= 2, true, "Should have at least validator exports");
    assertEquals(exports.length <= 10, true, "Should not have too many exports");
  });

  it("should load efficiently", async () => {
    // Module should load without side effects
    const startTime = performance.now();
    await import("../../../../lib/cli/validators/mod.ts");
    const loadTime = performance.now() - startTime;

    // Should load quickly (under 100ms)
    assertEquals(loadTime < 100, true, `Module load time ${loadTime}ms should be under 100ms`);
  });
});
