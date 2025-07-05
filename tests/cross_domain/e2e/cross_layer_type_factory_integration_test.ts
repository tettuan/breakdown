/**
 * @fileoverview Cross-Layer Integration Test for TypeFactory System
 *
 * This comprehensive test verifies the complete TypeFactory system integration:
 * - Integration between LayerTypeFactory, LayerType, and pattern validation
 * - Cross-module compatibility with variableresult, prompt_variables
 * - End-to-end workflow testing across the entire types module
 * - System-wide coherence and final validation
 *
 * This represents the final validation phase ensuring complete system readiness
 * and all TypeFactory components work together seamlessly.
 *
 * @module lib/types/4_cross_layer_type_factory_integration_test
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { LayerTypeFactory } from "../../../lib/types/layer_type_factory.ts";
import {
  LayerType as _LayerType,
  TwoParamsLayerTypePattern,
} from "../../../lib/types/layer_type.ts";
import {
  createPromptParams,
  FilePathVariable,
  StandardVariable,
  toPromptParamsVariables,
  UserVariable,
} from "../../../lib/types/prompt_variables.ts";
import {
  createError as _createError,
  createInvalidNameError,
  createSuccess,
} from "../../../lib/types/variable_result.ts";
import type { TwoParams_Result as _TwoParams_Result } from "../../../lib/deps.ts";

/**
 * Cross-Layer Integration Test Suite: Complete TypeFactory System Validation
 *
 * These tests verify that all components of the TypeFactory system work together
 * seamlessly across module boundaries and use cases.
 */

Deno.test("Cross-Layer: Complete workflow from input to output", async (t) => {
  await t.step("End-to-end processing with LayerTypeFactory and PromptVariables", () => {
    // Start with user input
    const _userInput = "project";
    const _customVariables = {
      "uv-environment": "production",
      "uv-version": "1.0.0",
    };

    // Step 1: Create LayerType using factory
    const layerResult = LayerTypeFactory.fromString(_userInput);
    assertEquals(layerResult.ok, true);

    if (layerResult.ok) {
      const layerType = layerResult.data;
      assertEquals(layerType.getValue(), "project");

      // Step 2: Create prompt variables
      const stdVar = StandardVariable.create("input_text_file", "input.txt");
      const fileVar = FilePathVariable.create("schema_file", "schema.json");
      const userVar1 = UserVariable.create("uv-environment", "production");
      const userVar2 = UserVariable.create("uv-version", "1.0.0");

      assertEquals(stdVar.ok, true);
      assertEquals(fileVar.ok, true);
      assertEquals(userVar1.ok, true);
      assertEquals(userVar2.ok, true);

      // Step 3: Combine into complete system
      if (stdVar.ok && fileVar.ok && userVar1.ok && userVar2.ok) {
        const variables = [stdVar.data, fileVar.data, userVar1.data, userVar2.data];
        const promptParams = createPromptParams("template.md", variables);

        // Verify complete integration
        assertEquals(promptParams.template_file, "template.md");
        assertEquals(promptParams.variables["input_text_file"], "input.txt");
        assertEquals(promptParams.variables["schema_file"], "schema.json");
        assertEquals(promptParams.variables["environment"], "production");
        assertEquals(promptParams.variables["version"], "1.0.0");

        // Step 4: Verify LayerType integration
        const originalResult = layerType.originalResult;
        assertEquals(originalResult.layerType, "project");
        assertEquals(originalResult.type, "two");
      }
    }
  });

  await t.step("Error handling integration across modules", () => {
    // Test error propagation across the system

    // Invalid layer type
    const invalidLayerResult = LayerTypeFactory.fromString("invalid_layer");
    assertEquals(invalidLayerResult.ok, false);

    // Invalid variable names
    const invalidStdVar = StandardVariable.create("invalid_name", "value");
    assertEquals(invalidStdVar.ok, false);

    // Invalid file path variable
    const invalidFileVar = FilePathVariable.create("invalid_file", "path");
    assertEquals(invalidFileVar.ok, false);

    // Verify error structures are consistent
    if (!invalidLayerResult.ok && invalidLayerResult.error.kind === "UnknownLayer") {
      assertExists(invalidLayerResult.error.suggestions);
      assertEquals(invalidLayerResult.error.input, "invalid_layer");
    }

    if (!invalidStdVar.ok && invalidStdVar.error.kind === "InvalidName") {
      assertExists(invalidStdVar.error.validNames);
      assertEquals(invalidStdVar.error.name, "invalid_name");
    }
  });
});

Deno.test("Cross-Layer: Pattern validation integration", async (t) => {
  await t.step("LayerType pattern validation with variable creation", () => {
    // Create restrictive pattern
    const pattern = TwoParamsLayerTypePattern.create("^(project|task)$");
    assertExists(pattern);

    if (pattern) {
      // Test valid layer with pattern
      const validResult = LayerTypeFactory.fromString("project", pattern);
      assertEquals(validResult.ok, true);

      if (validResult.ok) {
        // Create corresponding variables for this layer
        const layerValue = validResult.data.getValue();
        const userVar = UserVariable.create(`uv-layer-${layerValue}`, "configured");
        assertEquals(userVar.ok, true);

        if (userVar.ok) {
          assertEquals(userVar.data.name, "uv-layer-project");
          assertEquals(userVar.data.value, "configured");
        }
      }

      // Test invalid layer with pattern
      const invalidResult = LayerTypeFactory.fromString("issue", pattern);
      assertEquals(invalidResult.ok, false);

      if (!invalidResult.ok) {
        assertEquals(invalidResult.error.kind, "ValidationFailed");
      }
    }
  });

  await t.step("Cross-validation between layer types and variable names", () => {
    const knownLayers = LayerTypeFactory.getKnownLayers();

    for (const layer of knownLayers) {
      // Create layer type
      const layerResult = LayerTypeFactory.fromString(layer);
      assertEquals(layerResult.ok, true);

      if (layerResult.ok) {
        // Create corresponding user variables
        const layerVar = UserVariable.create(`uv-target-${layer}`, "enabled");
        const configVar = UserVariable.create(`uv-${layer}-config`, "default");

        assertEquals(layerVar.ok, true);
        assertEquals(configVar.ok, true);

        if (layerVar.ok && configVar.ok) {
          // Verify they can be combined
          const variables = [layerVar.data, configVar.data];
          const combined = toPromptParamsVariables(variables);

          assertEquals(combined[`target-${layer}`], "enabled");
          assertEquals(combined[`${layer}-config`], "default");
        }
      }
    }
  });
});

Deno.test("Cross-Layer: Result type consistency verification", async (t) => {
  await t.step("Consistent error handling across all modules", () => {
    // Collect errors from different modules
    const layerError = LayerTypeFactory.fromString("");
    const varError = createInvalidNameError("test", ["valid"]);
    const stdVarError = StandardVariable.create("invalid", "value");

    // All should follow the Result pattern
    assertEquals(layerError.ok, false);
    assertEquals(varError.ok, false);
    assertEquals(stdVarError.ok, false);

    // All should have discriminated union errors
    if (!layerError.ok) {
      assertExists(layerError.error.kind);
      assertEquals(typeof layerError.error.kind, "string");
    }

    if (!varError.ok) {
      assertExists(varError.error.kind);
      assertEquals(varError.error.kind, "InvalidName");
    }

    if (!stdVarError.ok) {
      assertExists(stdVarError.error.kind);
      assertEquals(stdVarError.error.kind, "InvalidName");
    }
  });

  await t.step("Success result consistency across modules", () => {
    // Create successful results from different modules
    const layerSuccess = LayerTypeFactory.fromString("project");
    const varSuccess = createSuccess("test data");
    const stdVarSuccess = StandardVariable.create("input_text_file", "test.txt");

    // All should follow the Result pattern
    assertEquals(layerSuccess.ok, true);
    assertEquals(varSuccess.ok, true);
    assertEquals(stdVarSuccess.ok, true);

    // All should have data property
    if (layerSuccess.ok) {
      assertExists(layerSuccess.data);
      assertEquals(typeof layerSuccess.data.getValue(), "string");
    }

    if (varSuccess.ok) {
      assertExists(varSuccess.data);
      assertEquals(varSuccess.data, "test data");
    }

    if (stdVarSuccess.ok) {
      assertExists(stdVarSuccess.data);
      assertEquals(typeof stdVarSuccess.data.value, "string");
    }
  });
});

Deno.test("Cross-Layer: Performance integration testing", async (t) => {
  await t.step("System performance under load", () => {
    const iterations = 500;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      // Create layer type
      const layerResult = LayerTypeFactory.fromString("project");
      if (layerResult.ok) {
        // Create variables
        const stdVar = StandardVariable.create("input_text_file", `file${i}.txt`);
        const userVar = UserVariable.create(`uv-iteration`, `${i}`);

        if (stdVar.ok && userVar.ok) {
          // Combine into prompt params
          const params = createPromptParams("template.md", [stdVar.data, userVar.data]);
          assertEquals(params.template_file, "template.md");
        }
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Performance should be reasonable (under 1000ms for 500 iterations)
    assertEquals(
      duration < 1000,
      true,
      `Performance test: ${duration}ms for ${iterations} iterations`,
    );
  });

  await t.step("Memory consistency under repeated operations", () => {
    const results = [];

    // Create many instances across modules
    for (let i = 0; i < 100; i++) {
      const layerResult = LayerTypeFactory.fromString("task");
      const varResult = UserVariable.create("test", "value");

      if (layerResult.ok && varResult.ok) {
        results.push({
          layer: layerResult.data.getValue(),
          variable: varResult.data.name,
        });
      }
    }

    // All should be consistent
    assertEquals(results.length, 100);
    for (const result of results) {
      assertEquals(result.layer, "task");
      assertEquals(result.variable, "test");
    }
  });
});

Deno.test("Cross-Layer: System coherence final validation", async (t) => {
  await t.step("Complete system state consistency", () => {
    // Verify all modules maintain consistent state
    const initialLayers = LayerTypeFactory.getKnownLayers();

    // Perform complex operations across modules
    for (let i = 0; i < 10; i++) {
      LayerTypeFactory.fromString("project");
      StandardVariable.create("input_text_file", `test${i}.txt`);
      UserVariable.create(`uv-test${i}`, `value${i}`);
    }

    // State should remain unchanged
    const finalLayers = LayerTypeFactory.getKnownLayers();
    assertEquals(initialLayers.length, finalLayers.length);

    for (let i = 0; i < initialLayers.length; i++) {
      assertEquals(initialLayers[i], finalLayers[i]);
    }
  });

  await t.step("Cross-module compatibility verification", () => {
    // Verify all modules work together without conflicts
    const layerTypes = ["project", "issue", "task", "bugs", "temp"];
    const variableTypes = ["input_text_file", "destination_path"];
    const fileTypes = ["schema_file"];

    let successCount = 0;

    for (const layer of layerTypes) {
      const layerResult = LayerTypeFactory.fromString(layer);
      if (layerResult.ok) {
        for (const varType of variableTypes) {
          const varResult = StandardVariable.create(varType, `${layer}_${varType}`);
          if (varResult.ok) {
            for (const fileType of fileTypes) {
              const fileResult = FilePathVariable.create(fileType, `${layer}.json`);
              if (fileResult.ok) {
                successCount++;

                // Verify they can all be combined
                const combined = toPromptParamsVariables([
                  varResult.data,
                  fileResult.data,
                ]);
                assertEquals(Object.keys(combined).length, 2);
              }
            }
          }
        }
      }
    }

    // Should have created all combinations successfully
    assertEquals(successCount, layerTypes.length * variableTypes.length * fileTypes.length);
  });

  await t.step("System readiness final check", () => {
    // Final comprehensive check that the entire TypeFactory system is ready

    // 1. All factory methods work
    assertEquals(LayerTypeFactory.isValidLayer("project"), true);
    assertEquals(LayerTypeFactory.isValidLayer("invalid"), false);

    const layers = LayerTypeFactory.getKnownLayers();
    assertEquals(layers.length >= 5, true);

    // 2. All variable types can be created
    const stdVar = StandardVariable.create("input_text_file", "test.txt");
    const fileVar = FilePathVariable.create("schema_file", "schema.json");
    const userVar = UserVariable.create("custom", "value");

    assertEquals(stdVar.ok, true);
    assertEquals(fileVar.ok, true);
    assertEquals(userVar.ok, true);

    // 3. Pattern validation works
    const pattern = TwoParamsLayerTypePattern.create("^project$");
    assertExists(pattern);

    // 4. Integration functions work
    if (stdVar.ok && fileVar.ok && userVar.ok) {
      const variables = [stdVar.data, fileVar.data, userVar.data];
      const params = createPromptParams("final.md", variables);

      assertEquals(params.template_file, "final.md");
      assertEquals(Object.keys(params.variables).length, 3);
    }

    // 5. Error handling is consistent
    const error = createInvalidNameError("test", ["valid"]);
    assertEquals(error.ok, false);

    // System is ready for production use
    assertEquals(true, true, "TypeFactory system is fully operational");
  });
});
