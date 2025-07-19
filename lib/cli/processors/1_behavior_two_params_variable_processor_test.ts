/**
 * @fileoverview Behavior tests for TwoParamsVariableProcessor
 *
 * Testing focus areas:
 * 1. Custom variable extraction with uv- prefix
 * 2. Standard variable generation behavior
 * 3. Variable validation and error handling
 * 4. Variable combination and processing
 * 5. Result type behavior and error propagation
 *
 * @module lib/cli/processors/1_behavior_two_params_variable_processor_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  type ProcessedVariables as _ProcessedVariables,
  TwoParamsVariableProcessor,
  type TwoParamsVariableProcessorError as _VariableProcessorError,
} from "./two_params_variable_processor.ts";
import type { Result as _Result } from "$lib/types/result.ts";
import { isError, isOk } from "$lib/types/result.ts";

// =============================================================================
// 1_behavior: Custom Variable Extraction Behavior Tests
// =============================================================================

Deno.test("1_behavior: processVariables extracts valid custom variables", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-customVar1": "value1",
    "uv-customVar2": "value2",
    "uv-mySpecialVar": "special value",
    "regularOption": "not extracted",
  };
  const stdinContent = "test input";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const data = result.data;
    assertEquals(Object.keys(data.customVariables).length, 3);
    assertEquals(data.customVariables["uv-customVar1"], "value1");
    assertEquals(data.customVariables["uv-customVar2"], "value2");
    assertEquals(data.customVariables["uv-mySpecialVar"], "special value");
    assertEquals("regularOption" in data.customVariables, false);
  }
});

Deno.test("1_behavior: processVariables handles empty custom variables", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "regularOption": "value",
    "from": "input.txt",
  };
  const stdinContent = "test input";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const data = result.data;
    assertEquals(Object.keys(data.customVariables).length, 0);
    assertExists(data.standardVariables);
    assertExists(data.allVariables);
  }
});

Deno.test("1_behavior: processVariables rejects reserved variable names", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-input_text": "should be rejected",
    "uv-destination_path": "also rejected",
    "uv-schema_file": "rejected too",
    "uv-validVar": "this is ok",
  };
  const stdinContent = "test input";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(Array.isArray(result.error), true);
    assertEquals(result.error.length, 3); // Three reserved names
    assertEquals(result.error[0].kind, "ReservedVariableName");
    assertEquals(result.error[1].kind, "ReservedVariableName");
    assertEquals(result.error[2].kind, "ReservedVariableName");
  }
});

Deno.test("1_behavior: processVariables rejects empty variable values", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-emptyVar": "",
    "uv-whitespaceVar": "   ",
    "uv-validVar": "good value",
  };
  const stdinContent = "test input";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(Array.isArray(result.error), true);
    assertEquals(result.error.length, 2); // Two empty values
    assertEquals(result.error[0].kind, "EmptyVariableValue");
    assertEquals(result.error[1].kind, "EmptyVariableValue");
  }
});

// =============================================================================
// 1_behavior: Standard Variable Generation Behavior Tests
// =============================================================================

Deno.test("1_behavior: processVariables generates standard variables correctly", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    from: "input.txt",
    destination: "output.md",
  };
  const stdinContent = "test input content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const data = result.data;
    assertEquals(data.standardVariables.input_text, "test input content");
    assertEquals(data.standardVariables.input_text_file, "input.txt");
    assertEquals(data.standardVariables.destination_path, "output.md");
  }
});

Deno.test("1_behavior: processVariables handles missing stdin content", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    from: "input.txt",
    destination: "output.md",
  };
  const stdinContent = "";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const data = result.data;
    assertEquals("input_text" in data.standardVariables, false); // Not added when empty
    assertEquals(data.standardVariables.input_text_file, "input.txt");
    assertEquals(data.standardVariables.destination_path, "output.md");
  }
});

Deno.test("1_behavior: processVariables defaults input file to stdin", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    destination: "output.md",
    // No from/fromFile option
  };
  const stdinContent = "content from stdin";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const data = result.data;
    assertEquals(data.standardVariables.input_text, "content from stdin");
    assertEquals(data.standardVariables.input_text_file, "stdin");
    assertEquals(data.standardVariables.destination_path, "output.md");
  }
});

Deno.test("1_behavior: processVariables defaults destination to stdout", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    from: "input.txt",
    // No destination option
  };
  const stdinContent = "test content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const data = result.data;
    assertEquals(data.standardVariables.input_text, "test content");
    assertEquals(data.standardVariables.input_text_file, "input.txt");
    assertEquals(data.standardVariables.destination_path, "stdout");
  }
});

Deno.test("1_behavior: processVariables handles fromFile option", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    fromFile: "source.md",
    destinationFile: "target.html",
  };
  const stdinContent = "test content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const data = result.data;
    assertEquals(data.standardVariables.input_text_file, "source.md");
    assertEquals(data.standardVariables.destination_path, "target.html");
  }
});

Deno.test("1_behavior: processVariables handles output option", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    from: "input.txt",
    output: "result.json",
  };
  const stdinContent = "test content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const data = result.data;
    assertEquals(data.standardVariables.destination_path, "result.json");
  }
});

// =============================================================================
// 1_behavior: Variable Combination Behavior Tests
// =============================================================================

Deno.test("1_behavior: processVariables combines custom and standard variables", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-theme": "dark",
    "uv-author": "test user",
    from: "input.txt",
    destination: "output.md",
  };
  const stdinContent = "test content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const data = result.data;

    // Check custom variables
    assertEquals(data.customVariables["uv-theme"], "dark");
    assertEquals(data.customVariables["uv-author"], "test user");

    // Check standard variables
    assertEquals(data.standardVariables.input_text, "test content");
    assertEquals(data.standardVariables.input_text_file, "input.txt");
    assertEquals(data.standardVariables.destination_path, "output.md");

    // Check combined variables
    assertEquals(data.allVariables["uv-theme"], "dark");
    assertEquals(data.allVariables["uv-author"], "test user");
    assertEquals(data.allVariables.input_text, "test content");
    assertEquals(data.allVariables.input_text_file, "input.txt");
    assertEquals(data.allVariables.destination_path, "output.md");
  }
});

Deno.test("1_behavior: processVariables handles variable name conflicts", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-destination_path": "custom destination", // Would conflict but should be rejected
    destination: "standard destination",
  };
  const stdinContent = "test content";

  const result = processor.processVariables(options, stdinContent);

  // Should fail due to reserved variable name
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error[0].kind, "ReservedVariableName");
  }
});

// =============================================================================
// 1_behavior: ProcessVariablesWithoutStdin Convenience Method Tests
// =============================================================================

Deno.test("1_behavior: processVariablesWithoutStdin works with empty stdin", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-testVar": "test value",
    from: "input.txt",
    destination: "output.md",
  };

  const result = processor.processVariablesWithoutStdin(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    const data = result.data;
    assertEquals(data.customVariables["uv-testVar"], "test value");
    assertEquals(data.standardVariables.input_text_file, "input.txt");
    assertEquals(data.standardVariables.destination_path, "output.md");
    assertEquals("input_text" in data.standardVariables, false); // No stdin content
  }
});

// =============================================================================
// 1_behavior: Error Handling Behavior Tests
// =============================================================================

Deno.test("1_behavior: processVariables handles invalid options object", () => {
  const processor = new TwoParamsVariableProcessor();
  const invalidOptions = null as unknown as Record<string, unknown>;
  const stdinContent = "test content";

  const result = processor.processVariables(invalidOptions, stdinContent);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(Array.isArray(result.error), true);
    assertEquals(result.error[0].kind, "InvalidOptions");
    if (result.error[0].kind === "InvalidOptions") {
      assertEquals(result.error[0].message, "Options must be a valid object");
    }
  }
});

Deno.test("1_behavior: processVariables handles non-object options", () => {
  const processor = new TwoParamsVariableProcessor();
  const invalidOptions = "not an object" as unknown as Record<string, unknown>;
  const stdinContent = "test content";

  const result = processor.processVariables(invalidOptions, stdinContent);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error[0].kind, "InvalidOptions");
  }
});

Deno.test("1_behavior: processVariables collects multiple validation errors", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-input_text": "reserved name",
    "uv-emptyVar": "",
    "uv-destination_path": "another reserved",
    "uv-whitespace": "   ",
    "uv-validVar": "this is good",
  };
  const stdinContent = "test content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(Array.isArray(result.error), true);
    assertEquals(result.error.length, 4); // 2 reserved + 2 empty

    // Check error types
    const errorKinds = result.error.map((e) => e.kind);
    assertEquals(errorKinds.includes("ReservedVariableName"), true);
    assertEquals(errorKinds.includes("EmptyVariableValue"), true);
  }
});

// =============================================================================
// 1_behavior: Result Type Behavior Tests
// =============================================================================

Deno.test("1_behavior: processVariables returns proper Result structure on success", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-testVar": "test value",
    from: "input.txt",
  };
  const stdinContent = "test content";

  const result = processor.processVariables(options, stdinContent);

  // Verify Result<ProcessedVariables, TwoParamsVariableProcessorError[]> structure
  assertEquals(typeof result, "object");
  assertExists(result);
  assertEquals("ok" in result, true);

  if (result.ok) {
    assertEquals("data" in result, true);
    assertEquals("error" in result, false);
    assertEquals(typeof result.data, "object");
    assertEquals("customVariables" in result.data, true);
    assertEquals("standardVariables" in result.data, true);
    assertEquals("allVariables" in result.data, true);
  }
});

Deno.test("1_behavior: processVariables returns proper error structure on validation failure", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-input_text": "reserved variable name",
  };
  const stdinContent = "test content";

  const result = processor.processVariables(options, stdinContent);

  // Verify error Result structure
  assertEquals(typeof result, "object");
  assertExists(result);
  assertEquals("ok" in result, true);
  assertEquals(result.ok, false);

  if (!result.ok) {
    assertEquals("error" in result, true);
    assertEquals("data" in result, false);
    assertEquals(Array.isArray(result.error), true);
    assertEquals(result.error[0].kind, "ReservedVariableName");
    if (result.error[0].kind === "ReservedVariableName") {
      assertEquals(typeof result.error[0].key, "string");
    }
  }
});

// =============================================================================
// 1_behavior: Type Guard Behavior Tests
// =============================================================================

Deno.test("1_behavior: Result type guards work correctly for success", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = { "uv-test": "value" };
  const stdinContent = "test";

  const result = processor.processVariables(options, stdinContent);

  // Test type guards
  assertEquals(isOk(result), true);
  assertEquals(isError(result), false);

  if (isOk(result)) {
    assertEquals(typeof result.data, "object");
    assertEquals("customVariables" in result.data, true);
  }
});

Deno.test("1_behavior: Result type guards work correctly for error", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = { "uv-input_text": "reserved" };
  const stdinContent = "test";

  const result = processor.processVariables(options, stdinContent);

  // Test type guards
  assertEquals(isError(result), true);
  assertEquals(isOk(result), false);

  if (isError(result)) {
    assertEquals(Array.isArray(result.error), true);
    assertEquals(result.error[0].kind, "ReservedVariableName");
  }
});

// =============================================================================
// 1_behavior: Data Type Conversion Behavior Tests
// =============================================================================

Deno.test("1_behavior: processVariables converts non-string values to strings", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-numberVar": 123,
    "uv-booleanVar": true,
    "uv-objectVar": { nested: "value" },
    from: false,
    destination: 456,
  };
  const stdinContent = "test content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const data = result.data;
    assertEquals(data.customVariables["uv-numberVar"], "123");
    assertEquals(data.customVariables["uv-booleanVar"], "true");
    assertEquals(data.customVariables["uv-objectVar"], '{"nested":"value"}');
    assertEquals(data.standardVariables.input_text_file, "false");
    assertEquals(data.standardVariables.destination_path, "456");
  }
});

// =============================================================================
// 1_behavior: Multiple Sequential Calls Behavior Tests
// =============================================================================

Deno.test("1_behavior: processVariables handles multiple sequential calls", () => {
  const processor = new TwoParamsVariableProcessor();

  const testCases = [
    { options: { "uv-var1": "value1" }, stdin: "content1" },
    { options: { "uv-var2": "value2", from: "file.txt" }, stdin: "content2" },
    { options: { destination: "output.md" }, stdin: "content3" },
    { options: {}, stdin: "" },
  ];

  for (const testCase of testCases) {
    const result = processor.processVariables(testCase.options, testCase.stdin);
    assertEquals(result.ok, true, `Failed for options: ${JSON.stringify(testCase.options)}`);
    if (result.ok) {
      assertEquals(typeof result.data, "object");
      assertExists(result.data.allVariables);
    }
  }
});

Deno.test("1_behavior: processor maintains state isolation between calls", () => {
  const processor = new TwoParamsVariableProcessor();

  // Make concurrent calls with different configurations
  const results = Promise.all([
    processor.processVariables({ "uv-var1": "value1" }, "content1"),
    processor.processVariables({ "uv-var2": "value2" }, "content2"),
    processor.processVariables({ "uv-var3": "value3" }, "content3"),
  ]);

  return results.then((resolvedResults) => {
    // All calls should succeed independently
    for (const result of resolvedResults) {
      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(typeof result.data, "object");
      }
    }
  });
});

// =============================================================================
// 1_behavior: Edge Cases Behavior Tests
// =============================================================================

Deno.test("1_behavior: processVariables handles very long variable values", () => {
  const processor = new TwoParamsVariableProcessor();
  const longValue = "x".repeat(10000); // 10KB string
  const options = {
    "uv-longVar": longValue,
  };
  const stdinContent = "test content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.customVariables["uv-longVar"], longValue);
  }
});

Deno.test("1_behavior: processVariables handles many custom variables", () => {
  const processor = new TwoParamsVariableProcessor();

  // Create many custom variables
  const options: Record<string, string> = {};
  for (let i = 0; i < 100; i++) {
    options[`uv-var${i}`] = `value${i}`;
  }
  const stdinContent = "test content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(Object.keys(result.data.customVariables).length, 100);
    assertEquals(result.data.customVariables["uv-var0"], "value0");
    assertEquals(result.data.customVariables["uv-var99"], "value99");
  }
});

Deno.test("1_behavior: processVariables handles unicode and special characters", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-unicodeVar": "Test with unicode: 🚀 ∑ ∆",
    "uv-quotesVar": "Text with \"quotes\" and 'apostrophes'",
    "uv-newlineVar": "Text with\nmultiple\nlines",
  };
  const stdinContent = "Unicode content: 🎯 测试";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const data = result.data;
    assertEquals(data.customVariables["uv-unicodeVar"], "Test with unicode: 🚀 ∑ ∆");
    assertEquals(data.customVariables["uv-quotesVar"], "Text with \"quotes\" and 'apostrophes'");
    assertEquals(data.customVariables["uv-newlineVar"], "Text with\nmultiple\nlines");
    assertEquals(data.standardVariables.input_text, "Unicode content: 🎯 测试");
  }
});
