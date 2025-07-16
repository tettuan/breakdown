/**
 * @fileoverview Structure tests for ProcessedVariables usage in handlers
 *
 * Testing focus areas:
 * 1. ProcessedVariables type structure validation
 * 2. Custom variables property structure and content
 * 3. Standard variables property structure and content
 * 4. AllVariables property structure and combination
 * 5. Integration with handler components
 *
 * @module lib/cli/handlers/2_structure_processed_variables_test
 */

import { assertEquals, assertExists } from "@std/assert";
import type { ProcessedVariables } from "../../processor/variable_processor_v2.ts";
import {
  TwoParamsVariableProcessor,
  type TwoParamsVariableProcessorError,
} from "../../processor/variable_processor_v2.ts";
import type { Result } from "$lib/types/result.ts";
import { isError, isOk } from "$lib/types/result.ts";

// =============================================================================
// 2_structure: ProcessedVariables Type Structure Tests
// =============================================================================

Deno.test("2_structure: ProcessedVariables maintains complete type structure", () => {
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
    const processedVars: ProcessedVariables = result.data;

    // Verify ProcessedVariables has all required properties
    assertExists(processedVars.customVariables);
    assertExists(processedVars.standardVariables);
    assertExists(processedVars.allVariables);

    // Verify each property is an object
    assertEquals(typeof processedVars.customVariables, "object");
    assertEquals(typeof processedVars.standardVariables, "object");
    assertEquals(typeof processedVars.allVariables, "object");

    // Verify no extra properties exist
    const keys = Object.keys(processedVars);
    assertEquals(keys.length, 3);
    assertEquals(keys.includes("customVariables"), true);
    assertEquals(keys.includes("standardVariables"), true);
    assertEquals(keys.includes("allVariables"), true);
  }
});

Deno.test("2_structure: customVariables property contains only uv- prefixed variables", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-var1": "value1",
    "uv-var2": "value2",
    "uv-special": "special value",
    "regular": "not included",
    "from": "input.txt",
    "destination": "output.md",
    "anotherOption": "ignored",
  };
  const stdinContent = "test";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const { customVariables } = result.data;

    // Verify only uv- prefixed variables are included
    assertEquals(Object.keys(customVariables).length, 3);
    assertEquals(customVariables["uv-var1"], "value1");
    assertEquals(customVariables["uv-var2"], "value2");
    assertEquals(customVariables["uv-special"], "special value");

    // Verify non-uv variables are excluded
    assertEquals("regular" in customVariables, false);
    assertEquals("from" in customVariables, false);
    assertEquals("destination" in customVariables, false);
    assertEquals("anotherOption" in customVariables, false);

    // Verify all keys start with "uv-"
    for (const key of Object.keys(customVariables)) {
      assertEquals(key.startsWith("uv-"), true);
    }
  }
});

Deno.test("2_structure: standardVariables property contains exactly expected variables", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    from: "source.txt",
    destination: "target.md",
    "uv-custom": "custom value",
  };
  const stdinContent = "stdin content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const { standardVariables } = result.data;

    // Verify standard variables structure
    const standardKeys = Object.keys(standardVariables);
    assertEquals(standardKeys.includes("input_text"), true);
    assertEquals(standardKeys.includes("input_text_file"), true);
    assertEquals(standardKeys.includes("destination_path"), true);

    // Verify no custom variables leak into standard variables
    assertEquals("uv-custom" in standardVariables, false);

    // Verify exact values
    assertEquals(standardVariables.input_text, "stdin content");
    assertEquals(standardVariables.input_text_file, "source.txt");
    assertEquals(standardVariables.destination_path, "target.md");

    // Verify no extra properties
    for (const key of standardKeys) {
      assertEquals(
        ["input_text", "input_text_file", "destination_path"].includes(key),
        true,
      );
    }
  }
});

Deno.test("2_structure: allVariables property correctly combines custom and standard", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-theme": "dark",
    "uv-lang": "en",
    from: "doc.md",
    destination: "output.html",
  };
  const stdinContent = "document content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const { customVariables, standardVariables, allVariables } = result.data;

    // Verify allVariables contains all custom variables
    for (const [key, value] of Object.entries(customVariables)) {
      assertEquals(allVariables[key], value);
    }

    // Verify allVariables contains all standard variables
    for (const [key, value] of Object.entries(standardVariables)) {
      assertEquals(allVariables[key], value);
    }

    // Verify total count matches
    const expectedCount = Object.keys(customVariables).length +
      Object.keys(standardVariables).length;
    assertEquals(Object.keys(allVariables).length, expectedCount);

    // Verify specific values
    assertEquals(allVariables["uv-theme"], "dark");
    assertEquals(allVariables["uv-lang"], "en");
    assertEquals(allVariables.input_text, "document content");
    assertEquals(allVariables.input_text_file, "doc.md");
    assertEquals(allVariables.destination_path, "output.html");
  }
});

// =============================================================================
// 2_structure: ProcessedVariables Property Isolation Tests
// =============================================================================

Deno.test("2_structure: customVariables property is isolated from standardVariables", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-input_text": "attempting override", // This should be rejected
    "uv-valid": "valid value",
    from: "file.txt",
  };
  const stdinContent = "actual stdin content";

  const result = processor.processVariables(options, stdinContent);

  // Should fail due to reserved variable name
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error[0].kind, "ReservedVariableName");
    if (result.error[0].kind === "ReservedVariableName") {
      assertEquals(result.error[0].key, "uv-input_text");
    }
  }
});

Deno.test("2_structure: ProcessedVariables maintains immutable structure", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-test": "value",
    from: "input.txt",
  };
  const stdinContent = "content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const processed = result.data;

    // Capture original values
    const customKeys = Object.keys(processed.customVariables);
    const standardKeys = Object.keys(processed.standardVariables);
    const allKeys = Object.keys(processed.allVariables);

    // Properties should be separate objects, not references
    assertEquals(processed.customVariables === processed.standardVariables, false);
    assertEquals(processed.customVariables === processed.allVariables, false);
    assertEquals(processed.standardVariables === processed.allVariables, false);

    // Verify property counts remain consistent
    assertEquals(Object.keys(processed.customVariables).length, customKeys.length);
    assertEquals(Object.keys(processed.standardVariables).length, standardKeys.length);
    assertEquals(Object.keys(processed.allVariables).length, allKeys.length);
  }
});

// =============================================================================
// 2_structure: ProcessedVariables Edge Case Structure Tests
// =============================================================================

Deno.test("2_structure: ProcessedVariables handles empty custom variables gracefully", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    from: "input.txt",
    destination: "output.md",
    // No uv- variables
  };
  const stdinContent = "content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const { customVariables, standardVariables, allVariables } = result.data;

    // customVariables should be empty object
    assertEquals(typeof customVariables, "object");
    assertEquals(Object.keys(customVariables).length, 0);

    // standardVariables should still exist
    assertEquals(typeof standardVariables, "object");
    assertEquals(Object.keys(standardVariables).length > 0, true);

    // allVariables should only contain standard variables
    assertEquals(Object.keys(allVariables).length, Object.keys(standardVariables).length);
  }
});

Deno.test("2_structure: ProcessedVariables handles missing stdin content appropriately", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-var": "value",
    from: "file.txt",
  };
  const stdinContent = ""; // Empty stdin

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const { standardVariables, allVariables } = result.data;

    // input_text should not be present when stdin is empty
    assertEquals("input_text" in standardVariables, false);
    assertEquals("input_text" in allVariables, false);

    // Other standard variables should still be present
    assertEquals("input_text_file" in standardVariables, true);
    assertEquals("destination_path" in standardVariables, true);
  }
});

Deno.test("2_structure: ProcessedVariables preserves variable type information", () => {
  const processor = new TwoParamsVariableProcessor();
  const options = {
    "uv-number": 123,
    "uv-boolean": true,
    "uv-object": { nested: "value" },
    from: 456,
    destination: false,
  };
  const stdinContent = "content";

  const result = processor.processVariables(options, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const { customVariables, standardVariables, allVariables } = result.data;

    // All values should be strings (converted)
    assertEquals(typeof customVariables["uv-number"], "string");
    assertEquals(typeof customVariables["uv-boolean"], "string");
    assertEquals(typeof customVariables["uv-object"], "string");
    assertEquals(typeof standardVariables.input_text_file, "string");
    assertEquals(typeof standardVariables.destination_path, "string");

    // Verify conversion accuracy
    assertEquals(customVariables["uv-number"], "123");
    assertEquals(customVariables["uv-boolean"], "true");
    assertEquals(standardVariables.input_text_file, "456");
    assertEquals(standardVariables.destination_path, "false");

    // allVariables should also have string values
    assertEquals(typeof allVariables["uv-number"], "string");
    assertEquals(typeof allVariables.input_text_file, "string");
  }
});

// =============================================================================
// 2_structure: ProcessedVariables Result Type Structure Tests
// =============================================================================

Deno.test("2_structure: ProcessedVariables wrapped in Result maintains type safety", () => {
  const processor = new TwoParamsVariableProcessor();
  const validOptions = {
    "uv-test": "value",
    from: "input.txt",
  };
  const invalidOptions = {
    "uv-input_text": "reserved",
  };
  const stdinContent = "content";

  // Test success case
  const successResult: Result<ProcessedVariables, unknown> = processor.processVariables(
    validOptions,
    stdinContent,
  );

  assertEquals(isOk(successResult), true);
  if (isOk(successResult)) {
    // Verify Result<ProcessedVariables> structure
    assertExists(successResult.data);
    assertEquals(typeof successResult.data, "object");
    assertEquals("customVariables" in successResult.data, true);
    assertEquals("standardVariables" in successResult.data, true);
    assertEquals("allVariables" in successResult.data, true);
  }

  // Test error case
  const errorResult = processor.processVariables(invalidOptions, stdinContent);

  assertEquals(isError(errorResult), true);
  if (isError(errorResult)) {
    // Verify error structure
    assertEquals(Array.isArray(errorResult.error), true);
    assertEquals(errorResult.error.length > 0, true);
    assertEquals(typeof errorResult.error[0], "object");
    assertEquals("kind" in errorResult.error[0], true);
  }
});

// =============================================================================
// 2_structure: ProcessedVariables Integration Structure Tests
// =============================================================================

Deno.test("2_structure: ProcessedVariables structure supports handler integration", () => {
  const processor = new TwoParamsVariableProcessor();

  // Simulate handler options
  const handlerOptions = {
    "uv-projectName": "MyProject",
    "uv-version": "1.0.0",
    "uv-author": "Test Author",
    from: "/path/to/input.md",
    destination: "/path/to/output.html",
    fromFile: "/alternate/input.txt", // Should be ignored when 'from' exists
    output: "/alternate/output.md", // Should be ignored when 'destination' exists
  };
  const stdinContent = "# Project Documentation\nContent here...";

  const result = processor.processVariables(handlerOptions, stdinContent);

  assertEquals(result.ok, true);
  if (result.ok) {
    const processed: ProcessedVariables = result.data;

    // Verify structure supports handler requirements
    assertEquals(Object.keys(processed.customVariables).length, 3);
    assertEquals(processed.customVariables["uv-projectName"], "MyProject");
    assertEquals(processed.customVariables["uv-version"], "1.0.0");
    assertEquals(processed.customVariables["uv-author"], "Test Author");

    // Verify standard variables use priority (from over fromFile, destination over output)
    assertEquals(processed.standardVariables.input_text_file, "/path/to/input.md");
    assertEquals(processed.standardVariables.destination_path, "/path/to/output.html");

    // Verify allVariables can be passed to prompt generation
    assertEquals(Object.keys(processed.allVariables).length >= 6, true); // At least 3 custom + 3 standard

    // Verify structure is ready for downstream processing
    const promptVariables = processed.allVariables;
    assertEquals(typeof promptVariables, "object");
    for (const [key, value] of Object.entries(promptVariables)) {
      assertEquals(typeof key, "string");
      assertEquals(typeof value, "string");
    }
  }
});

Deno.test("2_structure: ProcessedVariables structure handles all option aliases", () => {
  const processor = new TwoParamsVariableProcessor();

  // Test different option aliases
  const testCases = [
    {
      options: { fromFile: "input1.txt", destinationFile: "output1.md" },
      expectedInput: "input1.txt",
      expectedOutput: "output1.md",
    },
    {
      options: { from: "input2.txt", destination: "output2.md" },
      expectedInput: "input2.txt",
      expectedOutput: "output2.md",
    },
    {
      options: { from: "input3.txt", output: "output3.md" },
      expectedInput: "input3.txt",
      expectedOutput: "output3.md",
    },
  ];

  for (const testCase of testCases) {
    const result = processor.processVariables(testCase.options, "content");

    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(
        result.data.standardVariables.input_text_file,
        testCase.expectedInput,
      );
      assertEquals(
        result.data.standardVariables.destination_path,
        testCase.expectedOutput,
      );
    }
  }
});

Deno.test("2_structure: ProcessedVariables maintains structural consistency across calls", () => {
  const processor = new TwoParamsVariableProcessor();

  const results: ProcessedVariables[] = [];

  // Make multiple calls with different configurations
  const configs = [
    { options: { "uv-a": "1" }, stdin: "text1" },
    { options: { "uv-b": "2", from: "f.txt" }, stdin: "text2" },
    { options: { destination: "out.md" }, stdin: "" },
  ];

  for (const config of configs) {
    const result = processor.processVariables(config.options, config.stdin);
    assertEquals(result.ok, true);
    if (result.ok) {
      results.push(result.data);
    }
  }

  // Verify all results have consistent structure
  assertEquals(results.length, 3);
  for (const processed of results) {
    // All should have the three required properties
    assertEquals("customVariables" in processed, true);
    assertEquals("standardVariables" in processed, true);
    assertEquals("allVariables" in processed, true);

    // All properties should be objects
    assertEquals(typeof processed.customVariables, "object");
    assertEquals(typeof processed.standardVariables, "object");
    assertEquals(typeof processed.allVariables, "object");

    // No extra properties
    assertEquals(Object.keys(processed).length, 3);
  }
});
