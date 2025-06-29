/**
 * @fileoverview Unit tests for TwoParamsProcessor
 * Tests the conversion of TwoParamsResult to VariablesBuilder with Result type safety
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { TwoParamsProcessor, type ProcessorResult, type ProcessorError } from "./two_params_processor.ts";
import type { TwoParamsResult } from "../../deps.ts";

Deno.test("TwoParamsProcessor - Valid input conversion", async () => {
  const processor = new TwoParamsProcessor();
  
  const twoParamsResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      output: "result.md",
      input: "input.txt"
    }
  };

  const result = processor.process(twoParamsResult);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertExists(result.data);
    const buildResult = result.data.build();
    assertEquals(buildResult.ok, true);
  }
});

Deno.test("TwoParamsProcessor - Invalid type error", () => {
  const processor = new TwoParamsProcessor();
  
  const twoParamsResult = {
    type: "invalid",
    demonstrativeType: "to", 
    layerType: "project",
    params: ["to", "project"],
    options: {}
  } as any;

  const result = processor.process(twoParamsResult);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidParams");
    if (result.error.kind === "InvalidParams") {
      assertEquals(result.error.message, 'Expected type "two", got "invalid"');
    }
  }
});

Deno.test("TwoParamsProcessor - Missing demonstrativeType error", () => {
  const processor = new TwoParamsProcessor();
  
  const twoParamsResult = {
    type: "two",
    demonstrativeType: "",
    layerType: "project", 
    params: ["to", "project"],
    options: {}
  } as any;

  const result = processor.process(twoParamsResult);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "MissingRequiredField");
    if (result.error.kind === "MissingRequiredField") {
      assertEquals(result.error.field, "demonstrativeType");
    }
  }
});

Deno.test("TwoParamsProcessor - Missing layerType error", () => {
  const processor = new TwoParamsProcessor();
  
  const twoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "",
    params: ["to", "project"],
    options: {}
  } as any;

  const result = processor.process(twoParamsResult);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "MissingRequiredField");
    if (result.error.kind === "MissingRequiredField") {
      assertEquals(result.error.field, "layerType");
    }
  }
});

Deno.test("TwoParamsProcessor - Insufficient params error", () => {
  const processor = new TwoParamsProcessor();
  
  const twoParamsResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to"], // Only one param
    options: {}
  };

  const result = processor.process(twoParamsResult);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidParams");
    if (result.error.kind === "InvalidParams") {
      assertEquals(result.error.message, "TwoParamsResult must have at least 2 parameters");
    }
  }
});

Deno.test("TwoParamsProcessor - Custom variables extraction", () => {
  const processor = new TwoParamsProcessor();
  
  const twoParamsResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project", 
    params: ["to", "project"],
    options: {
      "uv-customVar1": "value1",
      "uv-customVar2": "value2",
      "normalOption": "normalValue"
    }
  };

  const result = processor.process(twoParamsResult);
  
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
  const processor = new TwoParamsProcessor();
  
  const twoParamsResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      fromFile: "input.txt",
      destinationFile: "output.md",
      schemaFile: "schema.json",
      promptFile: "prompt.md"
    }
  };

  const result = processor.process(twoParamsResult);
  
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
  const processor = new TwoParamsProcessor();
  
  const twoParamsResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {}
  };

  const result = processor.process(twoParamsResult);
  
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
  const processor = new TwoParamsProcessor();
  
  const validResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to", 
    layerType: "project",
    params: ["to", "project"],
    options: {
      promptFile: "prompt.md",
      output: "output.md"
    }
  };

  const validationResult = processor.validateOnly(validResult);
  assertEquals(validationResult.ok, true);

  const invalidResult = {
    type: "invalid",
    demonstrativeType: "to",
    layerType: "project", 
    params: ["to", "project"],
    options: {}
  } as any;

  const invalidValidationResult = processor.validateOnly(invalidResult);
  assertEquals(invalidValidationResult.ok, false);
});

Deno.test("TwoParamsProcessor - getProcessorInfo", () => {
  const processor = new TwoParamsProcessor();
  const info = processor.getProcessorInfo();
  
  assertEquals(info.name, "TwoParamsProcessor");
  assertEquals(info.version, "1.0.0");
  assertEquals(info.supportedInputType, "TwoParamsResult");
  assertEquals(info.outputType, "VariablesBuilder");
});

Deno.test("TwoParamsProcessor - Input text extraction", () => {
  const processor = new TwoParamsProcessor();
  
  const twoParamsResult: TwoParamsResult = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {
      input_text: "This is input text content"
    }
  };

  const result = processor.process(twoParamsResult);
  
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