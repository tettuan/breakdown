/**
 * @fileoverview Behavior tests for CustomVariableExtractor
 * Tests the custom variable extraction behavior, error handling, and Result type validation
 */

import { assertEquals } from "../deps.ts";
import { CustomVariableExtractor } from "./custom_variable_extractor.ts";

Deno.test("CustomVariableExtractor - Extract valid custom variables", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "uv-customVar1": "value1",
    "uv-customVar2": "value2",
    "uv-projectName": "myProject",
    "normalOption": "normalValue",
    "anotherOption": 123,
  };

  const result = extractor.extract(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data["uv-customVar1"], "value1");
    assertEquals(result.data["uv-customVar2"], "value2");
    assertEquals(result.data["uv-projectName"], "myProject");
    assertEquals(Object.keys(result.data).length, 3);
    assertEquals(result.data["normalOption"], undefined);
  }
});

Deno.test("CustomVariableExtractor - Extract empty result when no custom variables", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "normalOption": "normalValue",
    "anotherOption": 123,
    "output": "result.md",
  };

  const result = extractor.extract(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(Object.keys(result.data).length, 0);
  }
});

Deno.test("CustomVariableExtractor - Convert numeric values to strings", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "uv-number": 42,
    "uv-boolean": true,
    "uv-string": "text",
  };

  const result = extractor.extract(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data["uv-number"], "42");
    assertEquals(result.data["uv-boolean"], "true");
    assertEquals(result.data["uv-string"], "text");
  }
});

Deno.test("CustomVariableExtractor - Error on reserved variable names", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "uv-help": "help value",
    "uv-validVar": "valid value",
  };

  const result = extractor.extract(options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ReservedVariableName");
    if (result.error.kind === "ReservedVariableName") {
      assertEquals(result.error.key, "uv-help");
    }
  }
});

Deno.test("CustomVariableExtractor - Error on null values", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "uv-nullVar": null,
    "uv-validVar": "valid value",
  };

  const result = extractor.extract(options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidVariableValue");
    if (result.error.kind === "InvalidVariableValue") {
      assertEquals(result.error.key, "uv-nullVar");
      assertEquals(result.error.value, null);
      assertEquals(result.error.reason, "Custom variable value cannot be null or undefined");
    }
  }
});

Deno.test("CustomVariableExtractor - Error on undefined values", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "uv-undefinedVar": undefined,
    "uv-validVar": "valid value",
  };

  const result = extractor.extract(options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidVariableValue");
    if (result.error.kind === "InvalidVariableValue") {
      assertEquals(result.error.key, "uv-undefinedVar");
      assertEquals(result.error.value, undefined);
      assertEquals(result.error.reason, "Custom variable value cannot be null or undefined");
    }
  }
});

Deno.test("CustomVariableExtractor - Error on object values", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "uv-objectVar": { nested: "value" },
    "uv-validVar": "valid value",
  };

  const result = extractor.extract(options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidVariableValue");
    if (result.error.kind === "InvalidVariableValue") {
      assertEquals(result.error.key, "uv-objectVar");
      assertEquals(result.error.reason, "Custom variable value cannot be an object");
    }
  }
});

Deno.test("CustomVariableExtractor - Error on array values", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "uv-arrayVar": ["item1", "item2"],
    "uv-validVar": "valid value",
  };

  const result = extractor.extract(options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidVariableValue");
    if (result.error.kind === "InvalidVariableValue") {
      assertEquals(result.error.key, "uv-arrayVar");
      assertEquals(result.error.reason, "Custom variable value cannot be an object");
    }
  }
});

Deno.test("CustomVariableExtractor - Multiple reserved names error", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "uv-version": "1.0.0",
    "uv-config": "config.yml",
  };

  const result = extractor.extract(options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ReservedVariableName");
    // Should fail on first reserved name encountered
    assertEquals(["uv-version", "uv-config"].includes(result.error.key), true);
  }
});

Deno.test("CustomVariableExtractor - getCustomVariableKeys method", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "uv-var1": "value1",
    "uv-var2": "value2",
    "normalOption": "value",
    "uv-var3": "value3",
    "anotherOption": 123,
  };

  const keys = extractor.getCustomVariableKeys(options);

  assertEquals(keys.length, 3);
  assertEquals(keys.includes("uv-var1"), true);
  assertEquals(keys.includes("uv-var2"), true);
  assertEquals(keys.includes("uv-var3"), true);
  assertEquals(keys.includes("normalOption"), false);
  assertEquals(keys.includes("anotherOption"), false);
});

Deno.test("CustomVariableExtractor - getCustomVariableKeys with no custom variables", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "normalOption": "value",
    "anotherOption": 123,
    "output": "result.md",
  };

  const keys = extractor.getCustomVariableKeys(options);

  assertEquals(keys.length, 0);
});

Deno.test("CustomVariableExtractor - Complex extraction scenario", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "uv-projectName": "MyAwesomeProject",
    "uv-version": "2.1.0", // This is reserved and should cause error
    "uv-authorName": "John Doe",
    "normalOption": "ignored",
    "output": "result.md",
  };

  const result = extractor.extract(options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ReservedVariableName");
  }
});

Deno.test("CustomVariableExtractor - Edge case with empty string values", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "uv-emptyString": "",
    "uv-normalVar": "value",
  };

  const result = extractor.extract(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data["uv-emptyString"], "");
    assertEquals(result.data["uv-normalVar"], "value");
    assertEquals(Object.keys(result.data).length, 2);
  }
});

Deno.test("CustomVariableExtractor - Empty options object", () => {
  const extractor = new CustomVariableExtractor();

  const options = {};

  const result = extractor.extract(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(Object.keys(result.data).length, 0);
  }
});

Deno.test("CustomVariableExtractor - Zero and false values are valid", () => {
  const extractor = new CustomVariableExtractor();

  const options = {
    "uv-zero": 0,
    "uv-false": false,
  };

  const result = extractor.extract(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data["uv-zero"], "0");
    assertEquals(result.data["uv-false"], "false");
  }
});
