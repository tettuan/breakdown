/**
 * Unit tests for TwoParamsValidator
 */

import { assertEquals } from "@std/assert";
import { TwoParamsValidator } from "./two_params_validator.ts";

Deno.test("TwoParamsValidator - validate success with default types", async () => {
  const _validator = new TwoParamsValidator();
  const _result = await _validator.validate(["to", "project"]);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data.demonstrativeType, "to");
    assertEquals(_result.data.layerType, "project");
  }
});

Deno.test("TwoParamsValidator - validate success with summary issue", async () => {
  const _validator = new TwoParamsValidator();
  const _result = await _validator.validate(["summary", "issue"]);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data.demonstrativeType, "summary");
    assertEquals(_result.data.layerType, "issue");
  }
});

Deno.test("TwoParamsValidator - invalid parameter count", async () => {
  const _validator = new TwoParamsValidator();
  const _result = await _validator.validate(["to"]);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidParameterCount");
    if (_result.error.kind === "InvalidParameterCount") {
      assertEquals(_result.error.received, 1);
      assertEquals(_result.error.expected, 2);
    }
  }
});

Deno.test("TwoParamsValidator - invalid demonstrative type", async () => {
  const _validator = new TwoParamsValidator();
  const _result = await _validator.validate(["invalid", "project"]);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidDemonstrativeType");
    if (_result.error.kind === "InvalidDemonstrativeType") {
      assertEquals(_result.error.value, "invalid");
      assertEquals(_result.error.validTypes, ["to", "summary", "defect", "init", "find"]);
    }
  }
});

Deno.test("TwoParamsValidator - invalid layer type", async () => {
  const _validator = new TwoParamsValidator();
  const _result = await _validator.validate(["to", "invalid"]);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidLayerType");
    if (_result.error.kind === "InvalidLayerType") {
      assertEquals(_result.error.value, "invalid");
      assertEquals(_result.error.validTypes, ["project", "issue", "task", "bugs", "temp"]);
    }
  }
});

Deno.test("TwoParamsValidator - empty demonstrative type", async () => {
  const _validator = new TwoParamsValidator();
  const _result = await _validator.validate(["", "project"]);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidDemonstrativeType");
  }
});

Deno.test("TwoParamsValidator - empty layer type", async () => {
  const _validator = new TwoParamsValidator();
  const _result = await _validator.validate(["to", ""]);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidLayerType");
  }
});
