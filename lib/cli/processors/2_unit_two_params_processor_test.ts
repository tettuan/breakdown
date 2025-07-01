/**
 * @fileoverview Unit Test for TwoParamsProcessor
 * 
 * Tests the functional behavior and business logic
 * of the TwoParamsProcessor following Totality principle.
 * 
 * Key functional validations:
 * - Correct transformation of valid inputs
 * - Comprehensive error handling
 * - Edge case handling
 * - Integration with VariablesBuilder
 * - Custom variable processing
 * 
 * @module cli/processors/2_unit_two_params_processor_test
 */

import { assertEquals, assert, assertExists } from "../../../deps.ts";
import { TwoParamsProcessor } from "./two_params_processor.ts";
// ProcessorError type imported for potential future error testing
import type { TwoParamsResult } from "../../deps.ts";
import { VariablesBuilder } from "../../builder/variables_builder.ts";

/**
 * Unit Test Suite: TwoParamsProcessor Core Functionality
 * 
 * Tests the processor's ability to correctly transform
 * TwoParamsResult into VariablesBuilder
 */
Deno.test("TwoParamsProcessor - process() functionality", async (t) => {
  
  await t.step("successfully processes valid TwoParamsResult", () => {
    const processor = new TwoParamsProcessor();
    
    const validInput: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        fromFile: "input.md",
        destinationFile: "output.md",
        schemaFile: "schema.json"
      }
    };
    
    const result = processor.process(validInput);
    
    // Should succeed
    assertEquals(result.ok, true);
    if (result.ok) {
      const builder = result.data;
      assertExists(builder);
      assert(builder instanceof VariablesBuilder);
      
      // Verify builder can build successfully
      const buildResult = builder.build();
      assertEquals(buildResult.ok, true);
      
      if (buildResult.ok) {
        const variables = buildResult.data;
        
        // Should have correct base variables
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "demonstrative_type" && v.value === "to"));
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "layer_type" && v.value === "project"));
      }
    }
  });

  await t.step("handles minimal valid input correctly", () => {
    const processor = new TwoParamsProcessor();
    
    const minimalInput: TwoParamsResult = {
      type: "two",
      demonstrativeType: "summary",
      layerType: "issue",
      params: ["summary", "issue"],
      options: {}
    };
    
    const result = processor.process(minimalInput);
    
    assertEquals(result.ok, true);
    if (result.ok) {
      const builder = result.data;
      const buildResult = builder.build();
      
      assertEquals(buildResult.ok, true);
      if (buildResult.ok) {
        const variables = buildResult.data;
        
        // Should have minimal required variables
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "demonstrative_type"));
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "layer_type"));
      }
    }
  });

  await t.step("processes custom variables correctly", () => {
    const processor = new TwoParamsProcessor();
    
    const inputWithCustomVars: TwoParamsResult = {
      type: "two",
      demonstrativeType: "defect",
      layerType: "task",
      params: ["defect", "task"],
      options: {
        "uv-projectName": "TestProject",
        "uv-version": "1.0.0",
        "uv-author": "Test User",
        regularOption: "ignored"
      }
    };
    
    const result = processor.process(inputWithCustomVars);
    
    assertEquals(result.ok, true);
    if (result.ok) {
      const builder = result.data;
      const buildResult = builder.build();
      
      assertEquals(buildResult.ok, true);
      if (buildResult.ok) {
        const variables = buildResult.data;
        
        // Should include custom variables
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "projectName" && v.value === "TestProject"));
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "version" && v.value === "1.0.0"));
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "author" && v.value === "Test User"));
        
        // Should not include non-custom variables
        assert(!variables.some(v => Object.keys(v.toRecord())[0] === "regularOption"));
      }
    }
  });

  await t.step("handles all demonstrativeType values", () => {
    const processor = new TwoParamsProcessor();
    const demonstrativeTypes = ["to", "from", "summary", "defect", "init", "find"];
    
    for (const demonstrativeType of demonstrativeTypes) {
      const input: TwoParamsResult = {
        type: "two",
        demonstrativeType,
        layerType: "project",
        params: [demonstrativeType, "project"],
        options: {}
      };
      
      const result = processor.process(input);
      assertEquals(result.ok, true, `Should process ${demonstrativeType} successfully`);
      
      if (result.ok) {
        const buildResult = result.data.build();
        assertEquals(buildResult.ok, true);
        
        if (buildResult.ok) {
          const variables = buildResult.data;
          assert(variables.some(v => 
            Object.keys(v.toRecord())[0] === "demonstrative_type" && v.value === demonstrativeType
          ));
        }
      }
    }
  });

  await t.step("handles all layerType values", () => {
    const processor = new TwoParamsProcessor();
    const layerTypes = ["project", "issue", "task", "bugs", "temp"];
    
    for (const layerType of layerTypes) {
      const input: TwoParamsResult = {
        type: "two",
        demonstrativeType: "to",
        layerType,
        params: ["to", layerType],
        options: {}
      };
      
      const result = processor.process(input);
      assertEquals(result.ok, true, `Should process ${layerType} successfully`);
      
      if (result.ok) {
        const buildResult = result.data.build();
        assertEquals(buildResult.ok, true);
        
        if (buildResult.ok) {
          const variables = buildResult.data;
          assert(variables.some(v => 
            Object.keys(v.toRecord())[0] === "layer_type" && v.value === layerType
          ));
        }
      }
    }
  });
});

/**
 * Unit Test Suite: Error Handling
 * 
 * Tests comprehensive error handling scenarios
 */
Deno.test("TwoParamsProcessor - Error handling", async (t) => {
  
  await t.step("handles null input", () => {
    const processor = new TwoParamsProcessor();
    const result = processor.process(null as unknown as TwoParamsResult);
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidParams");
      if (result.error.kind === "InvalidParams") {
        assert(result.error.message.includes("null"));
      }
    }
  });

  await t.step("handles undefined input", () => {
    const processor = new TwoParamsProcessor();
    const result = processor.process(undefined as unknown as TwoParamsResult);
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidParams");
      if (result.error.kind === "InvalidParams") {
        assert(result.error.message.includes("undefined"));
      }
    }
  });

  await t.step("handles missing type field", () => {
    const processor = new TwoParamsProcessor();
    const result = processor.process({
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {}
    } as TwoParamsResult);
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "MissingRequiredField");
      if (result.error.kind === "MissingRequiredField") {
        assertEquals(result.error.field, "type");
      }
    }
  });

  await t.step("handles wrong type value", () => {
    const processor = new TwoParamsProcessor();
    const result = processor.process({
      type: "one",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {}
    } as unknown as TwoParamsResult);
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidParams");
      if (result.error.kind === "InvalidParams") {
        assert(result.error.message.includes("Expected type \"two\""));
      }
    }
  });

  await t.step("handles missing demonstrativeType", () => {
    const processor = new TwoParamsProcessor();
    const result = processor.process({
      type: "two",
      demonstrativeType: "",
      layerType: "project",
      params: ["", "project"],
      options: {}
    } as TwoParamsResult);
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "MissingRequiredField");
      if (result.error.kind === "MissingRequiredField") {
        assertEquals(result.error.field, "demonstrativeType");
      }
    }
  });

  await t.step("handles missing layerType", () => {
    const processor = new TwoParamsProcessor();
    const result = processor.process({
      type: "two",
      demonstrativeType: "to",
      layerType: "",
      params: ["to", ""],
      options: {}
    } as TwoParamsResult);
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "MissingRequiredField");
      if (result.error.kind === "MissingRequiredField") {
        assertEquals(result.error.field, "layerType");
      }
    }
  });

  await t.step("handles missing params array", () => {
    const processor = new TwoParamsProcessor();
    const result = processor.process({
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: null as unknown as string[],
      options: {}
    } as TwoParamsResult);
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidParams");
      if (result.error.kind === "InvalidParams") {
        assert(result.error.message.includes("TwoParamsResult must have a params array"));
      }
    }
  });

  await t.step("handles empty params array", () => {
    const processor = new TwoParamsProcessor();
    const result = processor.process({
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: [],
      options: {}
    } as TwoParamsResult);
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidParams");
      if (result.error.kind === "InvalidParams") {
        assert(result.error.message.includes("TwoParamsResult must have at least 2 parameters"));
      }
    }
  });

  await t.step("handles missing options", () => {
    const processor = new TwoParamsProcessor();
    const result = processor.process({
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: null as unknown as Record<string, unknown>
    } as TwoParamsResult);
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "MissingRequiredField");
      if (result.error.kind === "MissingRequiredField") {
        assertEquals(result.error.field, "options");
      }
    }
  });
});

/**
 * Unit Test Suite: Edge Cases
 * 
 * Tests edge cases and boundary conditions
 */
Deno.test("TwoParamsProcessor - Edge cases", async (t) => {
  
  await t.step("handles special characters in values", () => {
    const processor = new TwoParamsProcessor();
    
    const input: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        "uv-special": "value with spaces",
        "uv-unicode": "値 with 日本語",
        "uv-symbols": "!@#$%^&*()"
      }
    };
    
    const result = processor.process(input);
    assertEquals(result.ok, true);
    
    if (result.ok) {
      const buildResult = result.data.build();
      assertEquals(buildResult.ok, true);
      
      if (buildResult.ok) {
        const variables = buildResult.data;
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "special" && v.value === "value with spaces"));
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "unicode" && v.value === "値 with 日本語"));
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "symbols" && v.value === "!@#$%^&*()"));
      }
    }
  });

  await t.step("handles numeric custom variable values", () => {
    const processor = new TwoParamsProcessor();
    
    const input: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        "uv-number": 123,
        "uv-float": 3.14,
        "uv-zero": 0,
        "uv-negative": -42
      } as any
    };
    
    const result = processor.process(input);
    assertEquals(result.ok, true);
    
    if (result.ok) {
      const buildResult = result.data.build();
      assertEquals(buildResult.ok, true);
      
      if (buildResult.ok) {
        const variables = buildResult.data;
        // Numbers should be converted to strings
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "number" && v.value === "123"));
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "float" && v.value === "3.14"));
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "zero" && v.value === "0"));
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "negative" && v.value === "-42"));
      }
    }
  });

  await t.step("handles boolean custom variable values", () => {
    const processor = new TwoParamsProcessor();
    
    const input: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        "uv-enabled": true,
        "uv-disabled": false
      } as any
    };
    
    const result = processor.process(input);
    assertEquals(result.ok, true);
    
    if (result.ok) {
      const buildResult = result.data.build();
      assertEquals(buildResult.ok, true);
      
      if (buildResult.ok) {
        const variables = buildResult.data;
        // Booleans should be converted to strings
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "enabled" && v.value === "true"));
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "disabled" && v.value === "false"));
      }
    }
  });

  await t.step("handles empty string custom variable values", () => {
    const processor = new TwoParamsProcessor();
    
    const input: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        "uv-empty": "",
        "uv-whitespace": "   "
      }
    };
    
    const result = processor.process(input);
    assertEquals(result.ok, true);
    
    if (result.ok) {
      const buildResult = result.data.build();
      assertEquals(buildResult.ok, true);
      
      if (buildResult.ok) {
        const variables = buildResult.data;
        // Empty strings should be preserved
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "empty" && v.value === ""));
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "whitespace" && v.value === "   "));
      }
    }
  });

  await t.step("ignores non-uv prefixed options", () => {
    const processor = new TwoParamsProcessor();
    
    const input: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        "uv-included": "yes",
        "notIncluded": "no",
        "also-not-included": "no",
        "uv": "edge case",
        "uv-": "another edge case"
      }
    };
    
    const result = processor.process(input);
    assertEquals(result.ok, true);
    
    if (result.ok) {
      const buildResult = result.data.build();
      assertEquals(buildResult.ok, true);
      
      if (buildResult.ok) {
        const variables = buildResult.data;
        
        // Should include uv- prefixed
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "included" && v.value === "yes"));
        assert(variables.some(v => Object.keys(v.toRecord())[0] === "" && v.value === "another edge case"));
        
        // Should not include others
        assert(!variables.some(v => Object.keys(v.toRecord())[0] === "notIncluded"));
        assert(!variables.some(v => Object.keys(v.toRecord())[0] === "also-not-included"));
        assert(!variables.some(v => v.value === "edge case"));
      }
    }
  });
});