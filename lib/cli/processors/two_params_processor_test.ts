/**
 * @fileoverview Unit tests for TwoParamsProcessor
 * Tests the conversion of TwoParamsResult to VariablesBuilder with Result type safety
 */

import { assertEquals, assertExists } from "@std/assert";
import { TwoParamsProcessor } from "./two_params_processor.ts";
import type { TwoParamsResult } from "../../deps.ts";

Deno.test("TwoParamsProcessor - Valid input conversion", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      output: "_result.md",
      input: "input.txt",
    },
  };

  const _result = _processor.process(twoParamsResult);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertExists(_result.data);
    const buildResult = _result.data.build();
    assertEquals(buildResult.ok, true);
  }
});

Deno.test("TwoParamsProcessor - Invalid type error", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult = {
    type: "invalid",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  } as unknown as TwoParamsResult;

  const _result = _processor.process(twoParamsResult);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidParams");
    if (_result.error.kind === "InvalidParams") {
      assertEquals(_result.error.message, 'Expected type "two", got "invalid"');
    }
  }
});

Deno.test("TwoParamsProcessor - Missing demonstrativeType error", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult = {
    type: "two",
    demonstrativeType: "",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  } as unknown as TwoParamsResult;

  const _result = _processor.process(twoParamsResult);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "MissingRequiredField");
    if (_result.error.kind === "MissingRequiredField") {
      assertEquals(_result.error.field, "demonstrativeType");
    }
  }
});

Deno.test("TwoParamsProcessor - Missing layerType error", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "",
    params: ["to", "project"],
    options: {},
  } as unknown as TwoParamsResult;

  const _result = _processor.process(twoParamsResult);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "MissingRequiredField");
    if (_result.error.kind === "MissingRequiredField") {
      assertEquals(_result.error.field, "layerType");
    }
  }
});

Deno.test("TwoParamsProcessor - Insufficient params error", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to"], // Only one param
    options: {},
  };

  const _result = _processor.process(twoParamsResult);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidParams");
    if (_result.error.kind === "InvalidParams") {
      assertEquals(_result.error.message, "TwoParamsResult must have at least 2 parameters");
    }
  }
});

Deno.test("TwoParamsProcessor - Custom variables extraction", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      "uv-customVar1": "value1",
      "uv-customVar2": "value2",
      "normalOption": "normalValue",
    },
  };

  const _result = _processor.process(twoParamsResult);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    const buildResult = _result.data.build();
    assertEquals(buildResult.ok, true);
    if (buildResult.ok) {
      const variablesRecord = _result.data.toRecord();
      assertEquals(variablesRecord["uv-customVar1"], "value1");
      assertEquals(variablesRecord["uv-customVar2"], "value2");
      assertEquals(variablesRecord["normalOption"], undefined);
    }
  }
});

Deno.test("TwoParamsProcessor - File path extraction", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      fromFile: "input.txt",
      destinationFile: "output.md",
      schemaFile: "schema.json",
      promptFile: "prompt.md",
    },
  };

  const _result = _processor.process(twoParamsResult);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    const buildResult = _result.data.build();
    assertEquals(buildResult.ok, true);
    if (buildResult.ok) {
      const variablesRecord = _result.data.toRecord();
      assertEquals(variablesRecord["input_text_file"], "input.txt");
      assertEquals(variablesRecord["destination_path"], "output.md");
      assertEquals(variablesRecord["schema_file"], "schema.json");
    }
  }
});

Deno.test("TwoParamsProcessor - Default values", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };

  const _result = _processor.process(twoParamsResult);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    const buildResult = _result.data.build();
    assertEquals(buildResult.ok, true);
    if (buildResult.ok) {
      const variablesRecord = _result.data.toRecord();
      // Check that the basic structure exists
      assertEquals(typeof variablesRecord, "object");
    }
  }
});

Deno.test("TwoParamsProcessor - validateOnly method", () => {
  const _processor = new TwoParamsProcessor();

  const validResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
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
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  } as unknown as TwoParamsResult;

  const invalidValidationResult = _processor.validateOnly(invalidResult);
  assertEquals(invalidValidationResult.ok, false);
});

Deno.test("TwoParamsProcessor - getProcessorInfo", () => {
  const _processor = new TwoParamsProcessor();
  const info = _processor.getProcessorInfo();

  assertEquals(info.name, "TwoParamsProcessor");
  assertEquals(info.version, "1.0.0");
  assertEquals(info.supportedInputType, "TwoParamsResult");
  assertEquals(info.outputType, "VariablesBuilder");
});

Deno.test("TwoParamsProcessor - Input text extraction", () => {
  const _processor = new TwoParamsProcessor();

  const twoParamsResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      input_text: "This is input text content",
    },
  };

  const _result = _processor.process(twoParamsResult);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    const buildResult = _result.data.build();
    assertEquals(buildResult.ok, true);
    if (buildResult.ok) {
      const variablesRecord = _result.data.toRecord();
      // Check if input text is handled properly
      assertEquals(typeof variablesRecord, "object");
    }
  }
});
