/**
 * @fileoverview Tests for JSR-based TypeFactory
 *
 * Tests the JSR-only TypeFactory methods for direct BreakdownParams integration.
 * TypePatternProvider dependency has been eliminated.
 *
 * @module types/type_factory_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import { TypeFactory } from "./type_factory.ts";
import { createTwoParamsResult } from "./two_params_result_extension.ts";

Deno.test("TypeFactory createFromJSR - Success case", () => {
  const jsrResult = createTwoParamsResult("summary", "project");

  const result = TypeFactory.createFromJSR(jsrResult);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.directive.value, "summary");
    assertEquals(result.data.layer.value, "project");
  }
});

Deno.test("TypeFactory createFromJSR - DirectiveType invalid", () => {
  const jsrResult = createTwoParamsResult("", "project"); // Empty DirectiveType

  const result = TypeFactory.createFromJSR(jsrResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ProcessingFailed");
    assertExists(result.error.context);
  }
});

Deno.test("TypeFactory createFromJSR - LayerType invalid", () => {
  const jsrResult = createTwoParamsResult("summary", ""); // Empty LayerType

  const result = TypeFactory.createFromJSR(jsrResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ProcessingFailed");
    assertExists(result.error.context);
  }
});

Deno.test("TypeFactory createFromJSR - Direct use of JSR validated values", () => {
  const jsrResult = createTwoParamsResult("summary", "project");

  // JSR-integrated TypeFactory does not use TypePatternProvider
  const result = TypeFactory.createFromJSR(jsrResult);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.directive.value, "summary");
    assertEquals(result.data.layer.value, "project");
  }
});

Deno.test("TypeFactory createDirectiveType - Direct construction with JSR premise", () => {
  const result = TypeFactory.createDirectiveType("to");

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.value, "to");
  }
});

Deno.test("TypeFactory createLayerType - Direct construction with JSR premise", () => {
  const result = TypeFactory.createLayerType("project");

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.value, "project");
  }
});

Deno.test("TypeFactory createBothTypes - Both types construction with JSR premise", () => {
  const result = TypeFactory.createBothTypes("summary", "project");

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.directive.value, "summary");
    assertEquals(result.data.layer.value, "project");
  }
});
