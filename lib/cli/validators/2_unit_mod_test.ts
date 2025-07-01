/**
 * @fileoverview Unit Test for CLI Validators Module
 * 
 * Tests the functional behavior of the validators module exports:
 * - Export availability and usability
 * - Type export correctness
 * - Module loading performance
 * - Export consistency
 * 
 * This test ensures the module follows the Totality principle by:
 * - Verifying all exports work correctly
 * - Ensuring type safety through exports
 * - Confirming module can be used as intended
 * 
 * @module lib/cli/validators/2_unit_mod_test
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import type { ValidationError, ValidatedParams } from "./mod.ts";

Deno.test("Unit: Module exports should be directly usable", async () => {
  // Import the TwoParamsValidator from mod.ts
  const { TwoParamsValidator } = await import("./mod.ts");
  
  // Should be able to instantiate the class
  const validator = new TwoParamsValidator();
  assertExists(validator);
  
  // Should have the validate method
  assertEquals(typeof validator.validate, "function");
});

Deno.test("Unit: Exported class should function correctly", async () => {
  // Import and use the validator
  const { TwoParamsValidator } = await import("./mod.ts");
  
  const validator = new TwoParamsValidator();
  
  // Test with valid parameters
  const validResult = await validator.validate(["to", "project"]);
  assertEquals(validResult.ok, true);
  
  if (validResult.ok) {
    assertEquals(validResult.data.demonstrativeType, "to");
    assertEquals(validResult.data.layerType, "project");
  }
});

Deno.test("Unit: Type exports should be usable for type annotations", () => {
  // These type annotations verify the types are exported correctly
  const testError: ValidationError = {
    kind: "InvalidParameterCount",
    received: 1,
    expected: 2
  };
  
  assertEquals(testError.kind, "InvalidParameterCount");
  assertEquals(testError.received, 1);
  assertEquals(testError.expected, 2);
  
  const testParams: ValidatedParams = {
    demonstrativeType: "to",
    layerType: "project"
  };
  
  assertEquals(testParams.demonstrativeType, "to");
  assertEquals(testParams.layerType, "project");
});

Deno.test("Unit: Module should handle invalid inputs correctly", async () => {
  const { TwoParamsValidator } = await import("./mod.ts");
  
  const validator = new TwoParamsValidator();
  
  // Test with wrong parameter count
  const wrongCountResult = await validator.validate(["only-one"]);
  assertEquals(wrongCountResult.ok, false);
  
  if (!wrongCountResult.ok) {
    assertEquals(wrongCountResult.error.kind, "InvalidParameterCount");
    if (wrongCountResult.error.kind === "InvalidParameterCount") {
      assertEquals(wrongCountResult.error.received, 1);
      assertEquals(wrongCountResult.error.expected, 2);
    }
  }
  
  // Test with invalid demonstrative type
  const invalidDemoResult = await validator.validate(["invalid", "project"]);
  assertEquals(invalidDemoResult.ok, false);
  
  if (!invalidDemoResult.ok) {
    assertEquals(invalidDemoResult.error.kind, "InvalidDemonstrativeType");
    if (invalidDemoResult.error.kind === "InvalidDemonstrativeType") {
      assertEquals(invalidDemoResult.error.value, "invalid");
      assertExists(invalidDemoResult.error.validTypes);
    }
  }
  
  // Test with invalid layer type
  const invalidLayerResult = await validator.validate(["to", "invalid"]);
  assertEquals(invalidLayerResult.ok, false);
  
  if (!invalidLayerResult.ok) {
    assertEquals(invalidLayerResult.error.kind, "InvalidLayerType");
    if (invalidLayerResult.error.kind === "InvalidLayerType") {
      assertEquals(invalidLayerResult.error.value, "invalid");
      assertExists(invalidLayerResult.error.validTypes);
    }
  }
});

Deno.test("Unit: Module exports should be consistent across imports", async () => {
  // Import multiple times to ensure consistency
  const import1 = await import("./mod.ts");
  const import2 = await import("./mod.ts");
  
  // Should get the same class reference
  assertEquals(import1.TwoParamsValidator, import2.TwoParamsValidator);
  
  // Instances should be of the same class
  const validator1 = new import1.TwoParamsValidator();
  const validator2 = new import2.TwoParamsValidator();
  
  assertInstanceOf(validator1, import1.TwoParamsValidator);
  assertInstanceOf(validator2, import2.TwoParamsValidator);
  assertInstanceOf(validator1, import2.TwoParamsValidator);
});

Deno.test("Unit: Module should support destructured imports", async () => {
  // Test destructured import
  const { TwoParamsValidator } = await import("./mod.ts");
  
  assertExists(TwoParamsValidator);
  assertEquals(typeof TwoParamsValidator, "function");
  
  const validator = new TwoParamsValidator();
  assertExists(validator.validate);
});

Deno.test("Unit: Module should support namespace imports", async () => {
  // Test namespace import
  const validators = await import("./mod.ts");
  
  assertExists(validators.TwoParamsValidator);
  assertEquals(typeof validators.TwoParamsValidator, "function");
  
  const validator = new validators.TwoParamsValidator();
  assertExists(validator.validate);
});

Deno.test("Unit: All valid parameter combinations should work", async () => {
  const { TwoParamsValidator } = await import("./mod.ts");
  const validator = new TwoParamsValidator();
  
  // Test all valid demonstrative types
  const demonstrativeTypes = ["to", "summary", "defect", "init", "find"];
  const layerTypes = ["project", "issue", "task", "bugs", "temp"];
  
  for (const demo of demonstrativeTypes) {
    for (const layer of layerTypes) {
      const result = await validator.validate([demo, layer]);
      assertEquals(result.ok, true, `Should validate ${demo} ${layer}`);
      
      if (result.ok) {
        assertEquals(result.data.demonstrativeType, demo);
        assertEquals(result.data.layerType, layer);
      }
    }
  }
});

Deno.test("Unit: Module exports should not include internals", async () => {
  const moduleExports = await import("./mod.ts");
  
  // Should only have the expected exports
  const exportKeys = Object.keys(moduleExports);
  
  // Filter out type exports (which don't appear in Object.keys)
  const expectedExports = ["TwoParamsValidator"];
  
  for (const key of exportKeys) {
    assertEquals(expectedExports.includes(key), true, 
      `Unexpected export: ${key}`);
  }
  
  // Verify no internal constants or utilities are exposed
  assertEquals((moduleExports as any).VALID_DEMONSTRATIVE_TYPES, undefined);
  assertEquals((moduleExports as any).VALID_LAYER_TYPES, undefined);
  assertEquals((moduleExports as any).validateParams, undefined);
});

Deno.test("Unit: Module should load efficiently", async () => {
  // Measure module load time
  const startTime = performance.now();
  await import("./mod.ts");
  const endTime = performance.now();
  
  const loadTime = endTime - startTime;
  
  // Module should load quickly (under 100ms)
  assertEquals(loadTime < 100, true, 
    `Module load time too high: ${loadTime}ms`);
});