/**
 * Unit tests for ParameterValidator
 */

import { assertEquals } from "@std/testing/asserts";
import { ParameterValidator } from "./parameter_validator.ts";
import type { TwoParamsResult, OneParamsResult, ZeroParamsResult } from "../deps.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";
import { TwoParamsDirectivePattern } from "../types/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../types/layer_type.ts";

// Mock implementations
class MockPatternProvider implements TypePatternProvider {
  getDirectivePattern(): TwoParamsDirectivePattern | null {
    return TwoParamsDirectivePattern.create("^(to|summary|defect|init|find)$");
  }
  
  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    return TwoParamsLayerTypePattern.create("^(project|issue|task|bugs|temp)$");
  }
}

class MockConfigValidator {
  validateConfig(_config: unknown) {
    return { ok: true as const, data: undefined };
  }
}

Deno.test("ParameterValidator - validateTwoParams success", () => {
  const validator = new ParameterValidator(
    new MockPatternProvider(),
    new MockConfigValidator()
  );

  const twoParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      output: "result.md",
      "uv-custom": "value"
    }
  };

  const result = validator.validateTwoParams(twoParams);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.directive.value, "to");
    assertEquals(result.data.layer.value, "project");
    assertEquals(result.data.options.outputPath, "result.md");
    assertEquals(result.data.customVariables["uv-custom"], "value");
    assertEquals(result.data.metadata.source, "TwoParamsResult");
  }
});

Deno.test("ParameterValidator - validateTwoParams invalid directive", () => {
  const validator = new ParameterValidator(
    new MockPatternProvider(),
    new MockConfigValidator()
  );

  const twoParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "invalid",
    layerType: "project",
    params: ["invalid", "project"],
    options: {}
  };

  const result = validator.validateTwoParams(twoParams);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidDirectiveType");
    if (result.error.kind === "InvalidDirectiveType") {
      assertEquals(result.error.value, "invalid");
    }
  }
});

Deno.test("ParameterValidator - validateTwoParams invalid layer", () => {
  const validator = new ParameterValidator(
    new MockPatternProvider(),
    new MockConfigValidator()
  );

  const twoParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "invalid",
    params: ["to", "invalid"],
    options: {}
  };

  const result = validator.validateTwoParams(twoParams);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidLayerType");
    if (result.error.kind === "InvalidLayerType") {
      assertEquals(result.error.value, "invalid");
    }
  }
});

Deno.test("ParameterValidator - validateOneParams", () => {
  const validator = new ParameterValidator(
    new MockPatternProvider(),
    new MockConfigValidator()
  );

  const oneParams: OneParamsResult = {
    type: "one",
    demonstrativeType: "project",
    params: ["project"],
    options: {
      output: "test.md"
    }
  };

  const result = validator.validateOneParams(oneParams);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.directive.value, "init");
    assertEquals(result.data.layer.value, "project");
    assertEquals(result.data.options.outputPath, "test.md");
  }
});

Deno.test("ParameterValidator - validateZeroParams", () => {
  const validator = new ParameterValidator(
    new MockPatternProvider(),
    new MockConfigValidator()
  );

  const zeroParams: ZeroParamsResult = {
    type: "zero",
    params: [],
    options: {}
  };

  const result = validator.validateZeroParams(zeroParams);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.directive.value, "init");
    assertEquals(result.data.layer.value, "project");
    assertEquals(result.data.options.inputPath, "stdin");
    assertEquals(result.data.options.outputPath, "stdout");
  }
});

Deno.test("ParameterValidator - custom variables extraction", () => {
  const validator = new ParameterValidator(
    new MockPatternProvider(),
    new MockConfigValidator()
  );

  const twoParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      "uv-key1": "value1",
      "uv-key2": 123,
      "uv-key3": true,
      "regular-key": "ignored"
    }
  };

  const result = validator.validateTwoParams(twoParams);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.customVariables["uv-key1"], "value1");
    assertEquals(result.data.customVariables["uv-key2"], "123");
    assertEquals(result.data.customVariables["uv-key3"], "true");
    assertEquals(result.data.customVariables["regular-key"], undefined);
  }
});

Deno.test("ParameterValidator - path normalization", () => {
  const validator = new ParameterValidator(
    new MockPatternProvider(),
    new MockConfigValidator()
  );

  const twoParams: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      fromFile: "input.md",
      destinationFile: "output.md",
      schemaFile: "schema.json",
      promptFile: "prompt.md"
    }
  };

  const result = validator.validateTwoParams(twoParams);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.options.inputPath, "input.md");
    assertEquals(result.data.options.outputPath, "output.md");
    assertEquals(result.data.options.schemaPath, "schema.json");
    assertEquals(result.data.options.promptPath, "prompt.md");
  }
});