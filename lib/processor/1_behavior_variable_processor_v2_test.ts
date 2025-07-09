/**
 * @fileoverview Behavior tests for VariableProcessorV2
 * Tests the orchestrated variable processing behavior, error handling, and Result type validation
 */

import { assertEquals } from "../deps.ts";
import { type ProcessorOptions, VariableProcessorV2 } from "./variable_processor_v2.ts";

Deno.test("VariableProcessorV2 - Basic variable processing", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {
      "uv-customVar": "customValue",
      "input": "input.txt",
      "output": "output.md",
    },
    inputFile: "input.txt",
    outputFile: "output.md",
  };

  const result = processor.process(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.customVariables["uv-customVar"], "customValue");
    assertEquals(typeof result.data.variables, "object");
    assertEquals(typeof result.data.standardVariables, "object");
    assertEquals(result.data.builder instanceof Object, true);
  }
});

Deno.test("VariableProcessorV2 - Processing with STDIN content", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {
      "uv-project": "testProject",
    },
    stdinContent: "This is STDIN content for testing",
    inputFile: "input.txt",
    outputFile: "output.md",
  };

  const result = processor.process(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.customVariables["uv-project"], "testProject");
    assertEquals(typeof result.data.variables, "object");
    // STDIN content should be processed
    assertEquals(typeof result.data.standardVariables, "object");
  }
});

Deno.test("VariableProcessorV2 - Processing with schema and prompt files", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {
      "uv-version": "1.0.0", // This will fail due to reserved name
    },
    inputFile: "input.txt",
    outputFile: "output.md",
    schemaFile: "schema.json",
    promptFile: "prompt.md",
  };

  const result = processor.process(options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "CustomVariableError");
  }
});

Deno.test("VariableProcessorV2 - Error handling for custom variables", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {
      "uv-help": "helpValue", // Reserved name
      "uv-validVar": "validValue",
    },
    inputFile: "input.txt",
    outputFile: "output.md",
  };

  const result = processor.process(options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "CustomVariableError");
  }
});

Deno.test("VariableProcessorV2 - Error handling for invalid custom variable values", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {
      "uv-nullVar": null,
      "uv-validVar": "validValue",
    },
    inputFile: "input.txt",
    outputFile: "output.md",
  };

  const result = processor.process(options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "CustomVariableError");
  }
});

Deno.test("VariableProcessorV2 - Empty options processing", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {},
    inputFile: "input.txt",
    outputFile: "output.md",
  };

  const result = processor.process(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(Object.keys(result.data.customVariables).length, 0);
    assertEquals(typeof result.data.variables, "object");
    assertEquals(typeof result.data.standardVariables, "object");
  }
});

Deno.test("VariableProcessorV2 - Multiple custom variables", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {
      "uv-projectName": "MyProject",
      "uv-authorName": "John Doe",
      "uv-version": "2.0.0", // This will fail due to reserved name
      "normalOption": "ignored",
    },
    inputFile: "input.txt",
    outputFile: "output.md",
  };

  const result = processor.process(options);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "CustomVariableError");
  }
});

Deno.test("VariableProcessorV2 - Valid multiple custom variables", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {
      "uv-projectName": "MyProject",
      "uv-authorName": "John Doe",
      "uv-customSetting": "value",
      "normalOption": "ignored",
    },
    inputFile: "input.txt",
    outputFile: "output.md",
  };

  const result = processor.process(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.customVariables["uv-projectName"], "MyProject");
    assertEquals(result.data.customVariables["uv-authorName"], "John Doe");
    assertEquals(result.data.customVariables["uv-customSetting"], "value");
    assertEquals(Object.keys(result.data.customVariables).length, 3);
  }
});

Deno.test("VariableProcessorV2 - Complex processing with all components", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {
      "uv-complexity": "high",
      "uv-testCase": "integration",
      "input": "complex-input.txt",
      "output": "complex-output.md",
    },
    stdinContent: "Complex STDIN content with multiple lines\nSecond line\nThird line",
    inputFile: "complex-input.txt",
    outputFile: "complex-output.md",
    schemaFile: "complex-schema.json",
    promptFile: "complex-prompt.md",
  };

  const result = processor.process(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.customVariables["uv-complexity"], "high");
    assertEquals(result.data.customVariables["uv-testCase"], "integration");
    assertEquals(typeof result.data.variables, "object");
    assertEquals(typeof result.data.standardVariables, "object");

    // Check that all components worked together
    const variables = result.data.variables;
    assertEquals(typeof variables, "object");

    // Verify builder functionality
    const builderRecord = result.data.builder.toRecord();
    assertEquals(typeof builderRecord, "object");
  }
});

Deno.test("VariableProcessorV2 - STDIN-only processing", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {},
    stdinContent: "Only STDIN content, no files",
  };

  const result = processor.process(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(Object.keys(result.data.customVariables).length, 0);
    assertEquals(typeof result.data.variables, "object");
    assertEquals(typeof result.data.standardVariables, "object");
  }
});

Deno.test("VariableProcessorV2 - Numeric and boolean custom variables", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {
      "uv-count": 42,
      "uv-enabled": true,
      "uv-disabled": false,
      "uv-zero": 0,
    },
    inputFile: "input.txt",
    outputFile: "output.md",
  };

  const result = processor.process(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.customVariables["uv-count"], "42");
    assertEquals(result.data.customVariables["uv-enabled"], "true");
    assertEquals(result.data.customVariables["uv-disabled"], "false");
    assertEquals(result.data.customVariables["uv-zero"], "0");
  }
});

Deno.test("VariableProcessorV2 - Standard variable resolution", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {
      "fromFile": "source.txt",
      "destinationFile": "target.md",
    },
    inputFile: "source.txt",
    outputFile: "target.md",
  };

  const result = processor.process(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(typeof result.data.standardVariables, "object");
    assertEquals(typeof result.data.variables, "object");
  }
});

Deno.test("VariableProcessorV2 - Builder integration check", () => {
  const processor = new VariableProcessorV2();

  const options: ProcessorOptions = {
    options: {
      "uv-builderTest": "success",
    },
    inputFile: "input.txt",
    outputFile: "output.md",
  };

  const result = processor.process(options);

  assertEquals(result.ok, true);
  if (result.ok) {
    // Test builder functionality
    const builderRecord = result.data.builder.toRecord();
    assertEquals(typeof builderRecord, "object");

    // Test builder build method
    const buildResult = result.data.builder.build();
    assertEquals(buildResult.ok, true);
  }
});
