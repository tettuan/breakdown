/**
 * @fileoverview TypeFactory.createFromJSR() method tests
 *
 * Tests for JSR-based TypeFactory functionality.
 * Validates that TypeFactory can create both DirectiveType and LayerType
 * from BreakdownParams JSR-validated TwoParams_Result without TypePatternProvider.
 */

import { assertEquals, assertExists } from "@std/assert";
import { TypeFactory } from "./type_factory.ts";
import type { TwoParams_Result } from "../deps.ts";

// Create mock TwoParams_Result for testing
function createMockTwoParamsResult(
  directiveType: string,
  layerType: string,
): TwoParams_Result {
  return {
    directiveType,
    layerType,
    type: "two" as const,
  } as TwoParams_Result;
}

Deno.test("TypeFactory.createFromJSR - Valid JSR-validated inputs", async (t) => {
  await t.step("Should create both types from valid JSR result", () => {
    const jsrResult = createMockTwoParamsResult("to", "project");
    const result = TypeFactory.createFromJSR(jsrResult);

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive.value, "to");
      assertEquals(result.data.layer.value, "project");
    }
  });

  await t.step("Should create types for summary/issue combination", () => {
    const jsrResult = createMockTwoParamsResult("summary", "issue");
    const result = TypeFactory.createFromJSR(jsrResult);

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive.value, "summary");
      assertEquals(result.data.layer.value, "issue");
    }
  });

  await t.step("Should create types for defect/task combination", () => {
    const jsrResult = createMockTwoParamsResult("defect", "task");
    const result = TypeFactory.createFromJSR(jsrResult);

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive.value, "defect");
      assertEquals(result.data.layer.value, "task");
    }
  });

  await t.step("Should work with complex JSR-validated values", () => {
    const jsrResult = createMockTwoParamsResult("complex-directive", "complex-layer");
    const result = TypeFactory.createFromJSR(jsrResult);

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive.value, "complex-directive");
      assertEquals(result.data.layer.value, "complex-layer");
    }
  });
});

Deno.test("TypeFactory.createFromJSR - Invalid inputs", async (t) => {
  await t.step("Should handle invalid DirectiveType", () => {
    const jsrResult = createMockTwoParamsResult("", "project");
    const result = TypeFactory.createFromJSR(jsrResult);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ProcessingFailed");
      assertExists(result.error.context);
    }
  });

  await t.step("Should handle invalid LayerType", () => {
    const jsrResult = createMockTwoParamsResult("to", "");
    const result = TypeFactory.createFromJSR(jsrResult);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ProcessingFailed");
      assertExists(result.error.context);
    }
  });

  await t.step("Should handle both invalid types", () => {
    const jsrResult = createMockTwoParamsResult("", "");
    const result = TypeFactory.createFromJSR(jsrResult);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ProcessingFailed");
    }
  });
});

Deno.test("TypeFactory.createFromJSR - JSR integration benefits", async (t) => {
  await t.step("Should bypass pattern validation (JSR already validated)", () => {
    // Since JSR has already validated the values, pattern validation is not required
    const jsrResult = createMockTwoParamsResult("unusual-directive", "special-layer");
    const result = TypeFactory.createFromJSR(jsrResult);

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive.value, "unusual-directive");
      assertEquals(result.data.layer.value, "special-layer");
    }
  });

  await t.step("Should work without TypePatternProvider", () => {
    // Verify that TypePatternProvider is not required
    const jsrResult = createMockTwoParamsResult("direct", "construction");
    const result = TypeFactory.createFromJSR(jsrResult);

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive.value, "direct");
      assertEquals(result.data.layer.value, "construction");
    }
  });

  await t.step("Should provide debug information", () => {
    const debug = TypeFactory.debug();

    assertEquals(debug.mode, "JSR_ONLY");
    assertEquals(debug.recommendedMethod, "TypeFactory.createFromJSR()");
    assertExists(debug.availableMethods);
  });
});
