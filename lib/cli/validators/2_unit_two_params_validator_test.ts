/**
 * Unit tests for TwoParamsValidator
 */

import { assertEquals } from "@std/assert";
import { TwoParamsValidator } from "./two_params_validator.ts";

Deno.test("TwoParamsValidator - validate success with default types", async () => {
  const validator = new TwoParamsValidator();
  const result = await validator.validate(["to", "project"]);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.demonstrativeType, "to");
    assertEquals(result.data.layerType, "project");
  }
});

Deno.test("TwoParamsValidator - validate success with summary issue", async () => {
  const validator = new TwoParamsValidator();
  const result = await validator.validate(["summary", "issue"]);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.demonstrativeType, "summary");
    assertEquals(result.data.layerType, "issue");
  }
});

Deno.test("TwoParamsValidator - invalid parameter count", async () => {
  const validator = new TwoParamsValidator();
  const result = await validator.validate(["to"]);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidParameterCount");
    if (result.error.kind === "InvalidParameterCount") {
      assertEquals(result.error.received, 1);
      assertEquals(result.error.expected, 2);
    }
  }
});

Deno.test("TwoParamsValidator - invalid demonstrative type", async () => {
  const validator = new TwoParamsValidator();
  const result = await validator.validate(["invalid", "project"]);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidDemonstrativeType");
    if (result.error.kind === "InvalidDemonstrativeType") {
      assertEquals(result.error.value, "invalid");
      assertEquals(result.error.validTypes, ["to", "summary", "defect", "init", "find"]);
    }
  }
});

Deno.test("TwoParamsValidator - invalid layer type", async () => {
  const validator = new TwoParamsValidator();
  const result = await validator.validate(["to", "invalid"]);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidLayerType");
    if (result.error.kind === "InvalidLayerType") {
      assertEquals(result.error.value, "invalid");
      assertEquals(result.error.validTypes, ["project", "issue", "task", "bugs", "temp"]);
    }
  }
});

Deno.test("TwoParamsValidator - empty demonstrative type", async () => {
  const validator = new TwoParamsValidator();
  const result = await validator.validate(["", "project"]);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidDemonstrativeType");
  }
});

Deno.test("TwoParamsValidator - empty layer type", async () => {
  const validator = new TwoParamsValidator();
  const result = await validator.validate(["to", ""]);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidLayerType");
  }
});