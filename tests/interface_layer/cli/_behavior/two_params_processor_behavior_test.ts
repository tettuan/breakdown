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

import { assert, assertEquals, assertExists } from "../../../deps.ts";
import { TwoParamsProcessor } from "./two_params_processor.ts";
// ProcessorError type imported for potential future error testing
import type { TwoParams_Result } from "$lib/deps.ts";
import { VariablesBuilder } from "../../builder/variables_builder.ts";
import type { PromptVariable } from "../../types/prompt_variables.ts";

/**
 * Unit Test Suite: TwoParamsProcessor Core Functionality
 *
 * Tests the processor's ability to correctly transform
 * TwoParams_Result into VariablesBuilder
 */
Deno.test("TwoParamsProcessor - process() functionality", async (t) => {
  await t.step("successfully processes valid TwoParams_Result", () => {
    const _processor = new TwoParamsProcessor();

    const validInput: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        fromFile: "input.md",
        destinationFile: "output.md",
        schemaFile: "schema.json",
      },
    };

    const result = _processor.process(validInput);

    // Should succeed
    assertEquals(result.ok, true);
    if (result.ok) {
      const _builder = result.data;
      assertExists(_builder);
      assert(_builder instanceof VariablesBuilder);

      // Verify builder can build successfully
      const buildResult = _builder.build();
      assertEquals(buildResult.ok, true);

      if (buildResult.ok) {
        const _variables = buildResult.data;

        // Should have correct base variables
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "demonstrative_type" && v.value === "to"
          ),
        );
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "layer_type" && v.value === "project"
          ),
        );
      }
    }
  });

  await t.step("handles minimal valid input correctly", () => {
    const _processor = new TwoParamsProcessor();

    const minimalInput: TwoParams_Result = {
      type: "two",
      demonstrativeType: "summary",
      layerType: "issue",
      params: ["summary", "issue"],
      options: {},
    };

    const result = _processor.process(minimalInput);

    assertEquals(result.ok, true);
    if (result.ok) {
      const _builder = result.data;
      const buildResult = _builder.build();

      assertEquals(buildResult.ok, true);
      if (buildResult.ok) {
        const _variables = buildResult.data;

        // Should have minimal required variables
        assert(_variables.some((v: any) => Object.keys(v.toRecord())[0] === "demonstrative_type"));
        assert(_variables.some((v: any) => Object.keys(v.toRecord())[0] === "layer_type"));
      }
    }
  });

  await t.step("processes custom variables correctly", () => {
    const _processor = new TwoParamsProcessor();

    const inputWithCustomVars: TwoParams_Result = {
      type: "two",
      demonstrativeType: "defect",
      layerType: "task",
      params: ["defect", "task"],
      options: {
        "uv-projectName": "TestProject",
        "uv-version": "1.0.0",
        "uv-author": "Test User",
        regularOption: "ignored",
      },
    };

    const result = _processor.process(inputWithCustomVars);

    assertEquals(result.ok, true);
    if (result.ok) {
      const _builder = result.data;
      const buildResult = _builder.build();

      assertEquals(buildResult.ok, true);
      if (buildResult.ok) {
        const _variables = buildResult.data;

        // Should include custom variables
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "projectName" && v.value === "TestProject"
          ),
        );
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "version" && v.value === "1.0.0"
          ),
        );
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "author" && v.value === "Test User"
          ),
        );

        // Should not include non-custom variables
        assert(!_variables.some((v: any) => Object.keys(v.toRecord())[0] === "regularOption"));
      }
    }
  });

  await t.step("handles all demonstrativeType values", () => {
    const _processor = new TwoParamsProcessor();
    const demonstrativeTypes = ["to", "from", "summary", "defect", "init", "find"];

    for (const demonstrativeType of demonstrativeTypes) {
      const input: TwoParams_Result = {
        type: "two",
        demonstrativeType,
        layerType: "project",
        params: [demonstrativeType, "project"],
        options: {},
      };

      const result = _processor.process(input);
      assertEquals(result.ok, true, `Should process ${demonstrativeType} successfully`);

      if (result.ok) {
        const buildResult = result.data.build();
        assertEquals(buildResult.ok, true);

        if (buildResult.ok) {
          const _variables = buildResult.data;
          assert(
            _variables.some((v: PromptVariable) =>
              Object.keys(v.toRecord())[0] === "demonstrative_type" && v.value === demonstrativeType
            ),
          );
        }
      }
    }
  });

  await t.step("handles all layerType values", () => {
    const _processor = new TwoParamsProcessor();
    const layerTypes = ["project", "issue", "task", "bugs", "temp"];

    for (const layerType of layerTypes) {
      const input: TwoParams_Result = {
        type: "two",
        demonstrativeType: "to",
        layerType,
        params: ["to", layerType],
        options: {},
      };

      const result = _processor.process(input);
      assertEquals(result.ok, true, `Should process ${layerType} successfully`);

      if (result.ok) {
        const buildResult = result.data.build();
        assertEquals(buildResult.ok, true);

        if (buildResult.ok) {
          const _variables = buildResult.data;
          assert(
            _variables.some((v: PromptVariable) =>
              Object.keys(v.toRecord())[0] === "layer_type" && v.value === layerType
            ),
          );
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
    const _processor = new TwoParamsProcessor();
    const result = _processor.process(null as any as TwoParams_Result);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidParams");
      if (result.error.kind === "InvalidParams") {
        assert(result.error.message.includes("null"));
      }
    }
  });

  await t.step("handles undefined input", () => {
    const _processor = new TwoParamsProcessor();
    const result = _processor.process(undefined as any as TwoParams_Result);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidParams");
      if (result.error.kind === "InvalidParams") {
        assert(result.error.message.includes("undefined"));
      }
    }
  });

  await t.step("handles missing type field", () => {
    const _processor = new TwoParamsProcessor();
    const result = _processor.process({
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {},
    } as TwoParams_Result);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "MissingRequiredField");
      if (result.error.kind === "MissingRequiredField") {
        assertEquals(result.error.field, "type");
      }
    }
  });

  await t.step("handles wrong type value", () => {
    const _processor = new TwoParamsProcessor();
    const result = _processor.process({
      type: "one",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {},
    } as any as TwoParams_Result);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidParams");
      if (result.error.kind === "InvalidParams") {
        assert(result.error.message.includes('Expected type "two"'));
      }
    }
  });

  await t.step("handles missing demonstrativeType", () => {
    const _processor = new TwoParamsProcessor();
    const result = _processor.process({
      type: "two",
      demonstrativeType: "",
      layerType: "project",
      params: ["", "project"],
      options: {},
    } as TwoParams_Result);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "MissingRequiredField");
      if (result.error.kind === "MissingRequiredField") {
        assertEquals(result.error.field, "demonstrativeType");
      }
    }
  });

  await t.step("handles missing layerType", () => {
    const _processor = new TwoParamsProcessor();
    const result = _processor.process({
      type: "two",
      demonstrativeType: "to",
      layerType: "",
      params: ["to", ""],
      options: {},
    } as TwoParams_Result);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "MissingRequiredField");
      if (result.error.kind === "MissingRequiredField") {
        assertEquals(result.error.field, "layerType");
      }
    }
  });

  await t.step("handles missing params array", () => {
    const _processor = new TwoParamsProcessor();
    const result = _processor.process({
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: null as any as string[],
      options: {},
    } as TwoParams_Result);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidParams");
      if (result.error.kind === "InvalidParams") {
        assert(result.error.message.includes("TwoParams_Result must have a params array"));
      }
    }
  });

  await t.step("handles empty params array", () => {
    const _processor = new TwoParamsProcessor();
    const result = _processor.process({
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: [],
      options: {},
    } as TwoParams_Result);

    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidParams");
      if (result.error.kind === "InvalidParams") {
        assert(result.error.message.includes("TwoParams_Result must have at least 2 parameters"));
      }
    }
  });

  await t.step("handles missing options", () => {
    const _processor = new TwoParamsProcessor();
    const result = _processor.process({
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: null as any as Record<string, unknown>,
    } as TwoParams_Result);

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
    const _processor = new TwoParamsProcessor();

    const input: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        "uv-special": "value with spaces",
        "uv-unicode": "値 with 日本語",
        "uv-symbols": "!@#$%^&*()",
      },
    };

    const result = _processor.process(input);
    assertEquals(result.ok, true);

    if (result.ok) {
      const buildResult = result.data.build();
      assertEquals(buildResult.ok, true);

      if (buildResult.ok) {
        const _variables = buildResult.data;
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "special" && v.value === "value with spaces"
          ),
        );
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "unicode" && v.value === "値 with 日本語"
          ),
        );
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "symbols" && v.value === "!@#$%^&*()"
          ),
        );
      }
    }
  });

  await t.step("handles numeric custom variable values", () => {
    const _processor = new TwoParamsProcessor();

    const input: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        "uv-number": 123,
        "uv-float": 3.14,
        "uv-zero": 0,
        "uv-negative": -42,
      },
    };

    const result = _processor.process(input);
    assertEquals(result.ok, true);

    if (result.ok) {
      const buildResult = result.data.build();
      assertEquals(buildResult.ok, true);

      if (buildResult.ok) {
        const _variables = buildResult.data;
        // Numbers should be converted to strings
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "number" && v.value === "123"
          ),
        );
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "float" && v.value === "3.14"
          ),
        );
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "zero" && v.value === "0"
          ),
        );
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "negative" && v.value === "-42"
          ),
        );
      }
    }
  });

  await t.step("handles boolean custom variable values", () => {
    const _processor = new TwoParamsProcessor();

    const input: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        "uv-enabled": true,
        "uv-disabled": false,
      },
    };

    const result = _processor.process(input);
    assertEquals(result.ok, true);

    if (result.ok) {
      const buildResult = result.data.build();
      assertEquals(buildResult.ok, true);

      if (buildResult.ok) {
        const _variables = buildResult.data;
        // Booleans should be converted to strings
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "enabled" && v.value === "true"
          ),
        );
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "disabled" && v.value === "false"
          ),
        );
      }
    }
  });

  await t.step("handles empty string custom variable values", () => {
    const _processor = new TwoParamsProcessor();

    const input: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        "uv-empty": "",
        "uv-whitespace": "   ",
      },
    };

    const result = _processor.process(input);
    assertEquals(result.ok, true);

    if (result.ok) {
      const buildResult = result.data.build();
      assertEquals(buildResult.ok, true);

      if (buildResult.ok) {
        const _variables = buildResult.data;
        // Empty strings should be preserved
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "empty" && v.value === ""
          ),
        );
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "whitespace" && v.value === "   "
          ),
        );
      }
    }
  });

  await t.step("ignores non-uv prefixed options", () => {
    const _processor = new TwoParamsProcessor();

    const input: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        "uv-included": "yes",
        "notIncluded": "no",
        "also-not-included": "no",
        "uv": "edge case",
        "uv-": "another edge case",
      },
    };

    const result = _processor.process(input);
    assertEquals(result.ok, true);

    if (result.ok) {
      const buildResult = result.data.build();
      assertEquals(buildResult.ok, true);

      if (buildResult.ok) {
        const _variables = buildResult.data;

        // Should include uv- prefixed
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "included" && v.value === "yes"
          ),
        );
        assert(
          _variables.some((v: PromptVariable) =>
            Object.keys(v.toRecord())[0] === "" && v.value === "another edge case"
          ),
        );

        // Should not include others
        assert(!_variables.some((v: any) => Object.keys(v.toRecord())[0] === "notIncluded"));
        assert(!_variables.some((v: any) => Object.keys(v.toRecord())[0] === "also-not-included"));
        assert(!_variables.some((v: any) => v.value === "edge case"));
      }
    }
  });
});
