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

Deno.test("TypeFactory createFromJSR - 成功ケース", () => {
  const jsrResult = createTwoParamsResult("summary", "project");

  const result = TypeFactory.createFromJSR(jsrResult);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.directive.value, "summary");
    assertEquals(result.data.layer.value, "project");
  }
});

Deno.test("TypeFactory createFromJSR - DirectiveType無効", () => {
  const jsrResult = createTwoParamsResult("", "project"); // 空のDirectiveType

  const result = TypeFactory.createFromJSR(jsrResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ProcessingFailed");
    assertExists(result.error.context);
  }
});

Deno.test("TypeFactory createFromJSR - LayerType無効", () => {
  const jsrResult = createTwoParamsResult("summary", ""); // 空のLayerType

  const result = TypeFactory.createFromJSR(jsrResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ProcessingFailed");
    assertExists(result.error.context);
  }
});

Deno.test("TypeFactory createFromJSR - JSR検証済み値の直接利用", () => {
  const jsrResult = createTwoParamsResult("summary", "project");

  // JSR統合専用TypeFactoryは TypePatternProvider を使用しない
  const result = TypeFactory.createFromJSR(jsrResult);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.directive.value, "summary");
    assertEquals(result.data.layer.value, "project");
  }
});

Deno.test("TypeFactory createDirectiveType - JSR前提での直接構築", () => {
  const result = TypeFactory.createDirectiveType("to");

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.value, "to");
  }
});

Deno.test("TypeFactory createLayerType - JSR前提での直接構築", () => {
  const result = TypeFactory.createLayerType("project");

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.value, "project");
  }
});

Deno.test("TypeFactory createBothTypes - JSR前提での両型構築", () => {
  const result = TypeFactory.createBothTypes("summary", "project");

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.directive.value, "summary");
    assertEquals(result.data.layer.value, "project");
  }
});
