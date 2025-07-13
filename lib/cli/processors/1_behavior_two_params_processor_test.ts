/**
 * @fileoverview Unit tests for TwoParamsProcessor
 * Tests the conversion of TwoParams_Result to VariablesBuilder with Result type safety
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { TwoParamsProcessor } from "./two_params_processor.ts";
import type { TwoParams_Result } from "../../deps.ts";

Deno.test("TwoParamsProcessor - Valid input conversion", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    directiveType: "to",
    layerType: "project",
    demonstrativeType: "to",
    params: ["to", "project"],
    options: {
      output: "result.md",
      input: "input.txt",
    },
  };

  const result = _processor.process(twoParamsResult);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertExists(result.data);
    const buildResult = result.data.build();
    assertEquals(buildResult.ok, true);
  }
});

Deno.test("TwoParamsProcessor - Invalid type error", () => {
  const _processor = new TwoParamsProcessor();

  // Creating invalid test data with proper type assertion
  const twoParamsResult = {
    type: "invalid" as const,
    directiveType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  } as unknown as TwoParams_Result;

  const result = _processor.process(twoParamsResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidParams");
    if (result.error.kind === "InvalidParams") {
      assertEquals(result.error.message, 'Expected type "two", got "invalid"');
    }
  }
});

Deno.test("TwoParamsProcessor - Missing directiveType error", () => {
  const _processor = new TwoParamsProcessor();

  // Creating test data with empty directiveType
  const twoParamsResult = {
    type: "two",
    directiveType: "",
    layerType: "project",
    demonstrativeType: "",
    params: ["to", "project"],
    options: {},
  } as unknown as TwoParams_Result;

  const result = _processor.process(twoParamsResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "MissingRequiredField");
    if (result.error.kind === "MissingRequiredField") {
      assertEquals(result.error.field, "directiveType");
    }
  }
});

Deno.test("TwoParamsProcessor - Missing layerType error", () => {
  const _processor = new TwoParamsProcessor();

  // Creating test data with empty layerType
  const twoParamsResult = {
    type: "two",
    directiveType: "to",
    layerType: "",
    demonstrativeType: "to",
    params: ["to", "project"],
    options: {},
  } as unknown as TwoParams_Result;

  const result = _processor.process(twoParamsResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "MissingRequiredField");
    if (result.error.kind === "MissingRequiredField") {
      assertEquals(result.error.field, "layerType");
    }
  }
});

Deno.test("TwoParamsProcessor - Insufficient params error", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    directiveType: "to",
    layerType: "project",
    demonstrativeType: "to",
    params: ["to"], // Only one param
    options: {},
  };

  const result = _processor.process(twoParamsResult);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidParams");
    if (result.error.kind === "InvalidParams") {
      assertEquals(result.error.message, "TwoParams_Result must have at least 2 parameters");
    }
  }
});

Deno.test("TwoParamsProcessor - Custom variables extraction", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    directiveType: "to",
    layerType: "project",
    demonstrativeType: "to",
    params: ["to", "project"],
    options: {
      "uv-customVar1": "value1",
      "uv-customVar2": "value2",
      "normalOption": "normalValue",
    },
  };

  const result = _processor.process(twoParamsResult);

  assertEquals(result.ok, true);
  if (result.ok) {
    const buildResult = result.data.build();
    assertEquals(buildResult.ok, true);
    if (buildResult.ok) {
      const variablesRecord = result.data.toRecord();
      assertEquals(variablesRecord["uv-customVar1"], "value1");
      assertEquals(variablesRecord["uv-customVar2"], "value2");
      assertEquals(variablesRecord["normalOption"], undefined);
    }
  }
});

Deno.test("TwoParamsProcessor - File path extraction", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    directiveType: "to",
    layerType: "project",
    demonstrativeType: "to",
    params: ["to", "project"],
    options: {
      fromFile: "input.txt",
      destinationFile: "output.md",
      schemaFile: "schema.json",
      promptFile: "prompt.md",
    },
  };

  const result = _processor.process(twoParamsResult);

  assertEquals(result.ok, true);
  if (result.ok) {
    const buildResult = result.data.build();
    assertEquals(buildResult.ok, true);
    if (buildResult.ok) {
      const variablesRecord = result.data.toRecord();
      assertEquals(variablesRecord["input_text_file"], "input.txt");
      assertEquals(variablesRecord["destination_path"], "output.md");
      assertEquals(variablesRecord["schema_file"], "schema.json");
    }
  }
});

Deno.test("TwoParamsProcessor - Default values", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    directiveType: "to",
    layerType: "project",
    demonstrativeType: "to",
    params: ["to", "project"],
    options: {},
  };

  const result = _processor.process(twoParamsResult);

  assertEquals(result.ok, true);
  if (result.ok) {
    const buildResult = result.data.build();
    assertEquals(buildResult.ok, true);
    if (buildResult.ok) {
      const variablesRecord = result.data.toRecord();
      // Check that the basic structure exists
      assertEquals(typeof variablesRecord, "object");
    }
  }
});

Deno.test("TwoParamsProcessor - validateOnly method", () => {
  const _processor = new TwoParamsProcessor();

  const validResult: TwoParams_Result = {
    type: "two",
    directiveType: "to",
    layerType: "project",
    demonstrativeType: "to",
    params: ["to", "project"],
    options: {
      promptFile: "prompt.md",
      output: "output.md",
    },
  };

  const validationResult = _processor.validateOnly(validResult);
  assertEquals(validationResult.ok, true);

  const invalidResult = {
    type: "invalid",
    directiveType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  } as unknown as TwoParams_Result;

  const invalidValidationResult = _processor.validateOnly(invalidResult);
  assertEquals(invalidValidationResult.ok, false);
});

Deno.test("TwoParamsProcessor - getProcessorInfo", () => {
  const _processor = new TwoParamsProcessor();
  const info = _processor.getProcessorInfo();

  assertEquals(info.name, "TwoParamsProcessor");
  assertEquals(info.version, "1.0.0");
  assertEquals(info.supportedInputType, "TwoParams_Result");
  assertEquals(info.outputType, "VariablesBuilder");
});

Deno.test("TwoParamsProcessor - Input text extraction", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult: TwoParams_Result = {
    type: "two",
    directiveType: "to",
    layerType: "project",
    demonstrativeType: "to",
    params: ["to", "project"],
    options: {
      input_text: "This is input text content",
    },
  };

  const result = _processor.process(twoParamsResult);

  assertEquals(result.ok, true);
  if (result.ok) {
    const buildResult = result.data.build();
    assertEquals(buildResult.ok, true);
    if (buildResult.ok) {
      const variablesRecord = result.data.toRecord();
      // Check if input text is handled properly
      assertEquals(typeof variablesRecord, "object");
    }
  }
});
