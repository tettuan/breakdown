/**
 * Unit tests for TwoParamsValidator
 */

import { assertEquals } from "@std/testing/asserts";
import { TwoParamsValidator } from "./two_params_validator.ts";

Deno.test("TwoParamsValidator - validate success with default types", async () => {
  const validator = new TwoParamsValidator();
  const result = await validator.validate(["to", "project"]);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.demonstrativeType, "to");
    assertEquals(result.data.layerType, "project");
    assertEquals(result.data.rawParams, ["to", "project"]);
    assertEquals(result.data.metadata.validatorVersion, "1.0.0");
  }
});

Deno.test("TwoParamsValidator - validateSync success", () => {
  const validator = new TwoParamsValidator();
  const result = validator.validateSync(["summary", "issue"]);
  
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
    assertEquals(result.error.kind, "EmptyParameter");
    if (result.error.kind === "EmptyParameter") {
      assertEquals(result.error.parameter, "demonstrative");
    }
  }
});

Deno.test("TwoParamsValidator - empty layer type", async () => {
  const validator = new TwoParamsValidator();
  const result = await validator.validate(["to", ""]);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "EmptyParameter");
    if (result.error.kind === "EmptyParameter") {
      assertEquals(result.error.parameter, "layer");
    }
  }
});

Deno.test("TwoParamsValidator - custom valid types", async () => {
  const validator = TwoParamsValidator.createWithTypes(
    ["custom1", "custom2"] as any,
    ["layer1", "layer2"] as any
  );
  
  const result = await validator.validate(["custom1", "layer1"]);
  assertEquals(result.ok, true);
  
  const invalidResult = await validator.validate(["to", "project"]);
  assertEquals(invalidResult.ok, false);
});

Deno.test("TwoParamsValidator - helper methods", () => {
  const validator = new TwoParamsValidator();
  
  assertEquals(validator.isValidDemonstrativeType("to"), true);
  assertEquals(validator.isValidDemonstrativeType("invalid"), false);
  
  assertEquals(validator.isValidLayerType("project"), true);
  assertEquals(validator.isValidLayerType("invalid"), false);
  
  assertEquals(validator.getValidDemonstrativeTypes(), ["to", "summary", "defect", "init", "find"]);
  assertEquals(validator.getValidLayerTypes(), ["project", "issue", "task", "bugs", "temp"]);
});

Deno.test("TwoParamsValidator - createDefault factory", async () => {
  const validator = TwoParamsValidator.createDefault();
  const result = await validator.validate(["defect", "task"]);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.demonstrativeType, "defect");
    assertEquals(result.data.layerType, "task");
  }
});