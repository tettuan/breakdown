/**
 * @fileoverview Unit Test for TwoParamsVariableProcessor
 *
 * Tests individual function behavior and edge cases
 * for the TwoParamsVariableProcessor following Totality principle.
 *
 * @module cli/processors/2_unit_two_params_variable_processor_test
 */

import { assert, assertEquals } from "@std/assert";
import {
  TwoParamsVariableProcessor,
  type VariableProcessorError,
} from "./two_params_variable_processor.ts";

/**
 * Unit Test Suite: TwoParamsVariableProcessor
 *
 * These tests verify individual function behavior:
 * 1. Custom variable extraction logic
 * 2. Standard variable building logic
 * 3. Variable combination logic
 * 4. Error detection and reporting
 * 5. Edge case handling
 */
Deno.test("TwoParamsVariableProcessor Units", async (t) => {
  await t.step("processVariables - basic functionality", () => {
    const _processor = new TwoParamsVariableProcessor();

    const options = {
      "uv-custom": "custom_value",
      "from": "input.txt",
      "destination": "output.txt",
    };
    const stdinContent = "test content";

    const _result = _processor.processVariables(options, stdinContent);

    assert(_result.ok);
    if (_result.ok) {
      assertEquals(_result.data.customVariables["uv-custom"], "custom_value");
      assertEquals(_result.data.standardVariables.input_text, "test content");
      assertEquals(_result.data.standardVariables.input_text_file, "input.txt");
      assertEquals(_result.data.standardVariables.destination_path, "output.txt");
      assertEquals(_result.data.allVariables["uv-custom"], "custom_value");
      assertEquals(_result.data.allVariables.input_text, "test content");
    }
  });

  await t.step("processVariables - custom variable prefix validation", () => {
    const _processor = new TwoParamsVariableProcessor();

    const options = {
      "uv-valid": "good",
      "custom": "ignored",
      "uv-another": "also_good",
      "prefix-uv": "ignored",
    };

    const _result = _processor.processVariables(options, "");

    assert(_result.ok);
    if (_result.ok) {
      const customKeys = Object.keys(_result.data.customVariables);
      assertEquals(customKeys.length, 2);
      assert(customKeys.includes("uv-valid"));
      assert(customKeys.includes("uv-another"));
      assert(!customKeys.includes("custom"));
      assert(!customKeys.includes("prefix-uv"));
    }
  });

  await t.step("processVariables - reserved variable name detection", () => {
    const _processor = new TwoParamsVariableProcessor();

    const options = {
      "uv-input_text": "should_fail",
      "uv-destination_path": "should_also_fail",
      "uv-schema_file": "should_fail_too",
      "uv-valid": "should_pass",
    };

    const _result = _processor.processVariables(options, "");

    assert(!_result.ok);
    if (!_result.ok) {
      assertEquals(_result.error.length, 3);

      const reservedErrors = _result.error.filter((e) => e.kind === "ReservedVariableName");
      assertEquals(reservedErrors.length, 3);

      const reservedKeys = reservedErrors.map((e) => (e as { key: string }).key);
      assert(reservedKeys.includes("uv-input_text"));
      assert(reservedKeys.includes("uv-destination_path"));
      assert(reservedKeys.includes("uv-schema_file"));
    }
  });

  await t.step("processVariables - empty value detection", () => {
    const _processor = new TwoParamsVariableProcessor();

    const options = {
      "uv-empty1": "",
      "uv-empty2": "   ", // Whitespace only
      "uv-valid": "good",
      "uv-zero": "0", // Zero string is valid
      "uv-false": "false", // False string is valid
    };

    const _result = _processor.processVariables(options, "");

    assert(!_result.ok);
    if (!_result.ok) {
      const emptyErrors = _result.error.filter((e: VariableProcessorError) =>
        e.kind === "EmptyVariableValue"
      );
      assertEquals(emptyErrors.length, 2);

      const emptyKeys = emptyErrors.map((e) => (e as { key: string }).key);
      assert(emptyKeys.includes("uv-empty1"));
      assert(emptyKeys.includes("uv-empty2"));
    }
  });

  await t.step("processVariables - standard variable defaults", () => {
    const _processor = new TwoParamsVariableProcessor();

    const options = {}; // No options provided
    const _result = _processor.processVariables(options, "");

    assert(_result.ok);
    if (_result.ok) {
      const std = _result.data.standardVariables;
      assertEquals(std.input_text_file, "stdin");
      assertEquals(std.destination_path, "stdout");
      assert(!("input_text" in std)); // No stdin content
    }
  });

  await t.step("processVariables - option field mapping", () => {
    const _processor = new TwoParamsVariableProcessor();

    // Test different option field names
    const options1 = { "from": "file1.txt", "destination": "out1.txt" };
    const result1 = _processor.processVariables(options1, "");

    assert(result1.ok);
    if (result1.ok) {
      assertEquals(result1.data.standardVariables.input_text_file, "file1.txt");
      assertEquals(result1.data.standardVariables.destination_path, "out1.txt");
    }

    // Test alternative field names
    const options2 = { "fromFile": "file2.txt", "destinationFile": "out2.txt" };
    const result2 = _processor.processVariables(options2, "");

    assert(result2.ok);
    if (result2.ok) {
      assertEquals(result2.data.standardVariables.input_text_file, "file2.txt");
      assertEquals(result2.data.standardVariables.destination_path, "out2.txt");
    }

    // Test output field name
    const options3 = { "output": "out3.txt" };
    const result3 = _processor.processVariables(options3, "");

    assert(result3.ok);
    if (result3.ok) {
      assertEquals(result3.data.standardVariables.destination_path, "out3.txt");
    }
  });

  await t.step("processVariables - type coercion", () => {
    const _processor = new TwoParamsVariableProcessor();

    const options = {
      "uv-number": 42,
      "uv-boolean": true,
      "uv-object": { nested: "value" },
      "uv-array": [1, 2, 3],
      "from": 123, // Number coerced to string
      "destination": false, // Boolean coerced to string
    };

    const _result = _processor.processVariables(options, "");

    assert(_result.ok);
    if (_result.ok) {
      assertEquals(_result.data.customVariables["uv-number"], "42");
      assertEquals(_result.data.customVariables["uv-boolean"], "true");
      assertEquals(_result.data.customVariables["uv-object"], "[object Object]");
      assertEquals(_result.data.customVariables["uv-array"], "1,2,3");
      assertEquals(_result.data.standardVariables.input_text_file, "123");
      assertEquals(_result.data.standardVariables.destination_path, "false");
    }
  });

  await t.step("processVariables - stdin content handling", () => {
    const _processor = new TwoParamsVariableProcessor();

    // Test with stdin content
    const result1 = _processor.processVariables({}, "hello world");
    assert(result1.ok);
    if (result1.ok) {
      assertEquals(result1.data.standardVariables.input_text, "hello world");
      assert("input_text" in result1.data.allVariables);
    }

    // Test without stdin content
    const result2 = _processor.processVariables({}, "");
    assert(result2.ok);
    if (result2.ok) {
      assert(!("input_text" in result2.data.standardVariables));
      assert(!("input_text" in result2.data.allVariables));
    }

    // Test with null-like stdin
    const result3 = _processor.processVariables({}, null as unknown as string);
    assert(result3.ok);
    if (result3.ok) {
      assert(!("input_text" in result3.data.standardVariables));
    }
  });

  await t.step("processVariablesWithoutStdin - convenience method", () => {
    const _processor = new TwoParamsVariableProcessor();

    const options = {
      "uv-test": "value",
      "from": "file.txt",
      "destination": "out.txt",
    };

    const _result = _processor.processVariablesWithoutStdin(options);

    assert(_result.ok);
    if (_result.ok) {
      assertEquals(_result.data.customVariables["uv-test"], "value");
      assertEquals(_result.data.standardVariables.input_text_file, "file.txt");
      assertEquals(_result.data.standardVariables.destination_path, "out.txt");
      assert(!("input_text" in _result.data.standardVariables));
    }
  });

  await t.step("processVariables - invalid options handling", () => {
    const _processor = new TwoParamsVariableProcessor();

    // Test null options
    const nullResult = _processor.processVariables(null as unknown as Record<string, unknown>, "");
    assert(!nullResult.ok);
    if (!nullResult.ok) {
      assertEquals(nullResult.error.length, 1);
      assertEquals(nullResult.error[0].kind, "InvalidOptions");
    }

    // Test undefined options
    const undefinedResult = _processor.processVariables(
      undefined as unknown as Record<string, unknown>,
      "",
    );
    assert(!undefinedResult.ok);

    // Test non-object options
    const stringResult = _processor.processVariables(
      "string" as unknown as Record<string, unknown>,
      "",
    );
    assert(!stringResult.ok);

    const numberResult = _processor.processVariables(42 as unknown as Record<string, unknown>, "");
    assert(!numberResult.ok);
  });

  await t.step("processVariables - variable name edge cases", () => {
    const _processor = new TwoParamsVariableProcessor();

    const options = {
      "uv-": "empty_name_after_prefix",
      "uv-123": "numeric_name",
      "uv-with-dashes": "dashes_in_name",
      "uv-with_underscores": "underscores_in_name",
      "uv-UPPERCASE": "uppercase_name",
      "uv-mixed123_Case-Name": "complex_name",
    };

    const _result = _processor.processVariables(options, "");

    assert(_result.ok);
    if (_result.ok) {
      const customKeys = Object.keys(_result.data.customVariables);
      assertEquals(customKeys.length, 6);

      // All should be accepted
      assert(customKeys.includes("uv-"));
      assert(customKeys.includes("uv-123"));
      assert(customKeys.includes("uv-with-dashes"));
      assert(customKeys.includes("uv-with_underscores"));
      assert(customKeys.includes("uv-UPPERCASE"));
      assert(customKeys.includes("uv-mixed123_Case-Name"));
    }
  });

  await t.step("processVariables - allVariables union behavior", () => {
    const _processor = new TwoParamsVariableProcessor();

    const options = {
      "uv-custom": "custom_val",
      "from": "input_val",
    };
    const stdinContent = "stdin_val";

    const _result = _processor.processVariables(options, stdinContent);

    assert(_result.ok);
    if (_result.ok) {
      const { customVariables, standardVariables, allVariables } = _result.data;

      // allVariables should contain everything
      assertEquals(allVariables["uv-custom"], "custom_val");
      assertEquals(allVariables.input_text, "stdin_val");
      assertEquals(allVariables.input_text_file, "input_val");
      assertEquals(allVariables.destination_path, "stdout");

      // Total count should be sum of unique keys
      const expectedCount = Object.keys(customVariables).length +
        Object.keys(standardVariables).length;
      assertEquals(Object.keys(allVariables).length, expectedCount);

      // Standard variables should take precedence in case of conflict
      // (though conflicts should be prevented by validation)
      for (const [key, value] of Object.entries(standardVariables)) {
        assertEquals(allVariables[key], value);
      }
    }
  });
});
