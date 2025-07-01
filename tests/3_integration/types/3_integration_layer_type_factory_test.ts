/**
 * @fileoverview Integration Test for LayerTypeFactory
 * 
 * Comprehensive integration tests for LayerTypeFactory verifying:
 * - End-to-end TypeFactory system integration
 * - Cross-layer integration between factory, types, and validation
 * - Real-world usage scenarios and edge cases
 * - Performance and reliability under various conditions
 * - System coherence and final validation
 * 
 * This represents the final integration testing phase for the TypeFactory system,
 * ensuring complete functionality and system readiness.
 * 
 * @module lib/types/3_integration_layer_type_factory_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import { LayerTypeFactory, type LayerTypeResult, type LayerTypeCreationError } from "../../../lib/types/layer_type_factory.ts";
import { LayerType, TwoParamsLayerTypePattern } from "../../../lib/types/layer_type.ts";
import type { TwoParamsResult } from "../../../lib/deps.ts";

/**
 * Integration Test Suite: LayerTypeFactory Complete System Validation
 * 
 * These tests verify the complete integration of the TypeFactory system,
 * ensuring all components work together seamlessly in real-world scenarios.
 */

Deno.test("Integration: Complete LayerTypeFactory workflow - string to LayerType", async (t) => {
  await t.step("End-to-end string processing for all known layers", () => {
    const knownLayers = LayerTypeFactory.getKnownLayers();
    
    for (const layer of knownLayers) {
      // Test various input formats
      const inputVariations = [
        layer,                    // exact match
        layer.toUpperCase(),      // uppercase
        ` ${layer} `,            // with whitespace
        layer.charAt(0).toUpperCase() + layer.slice(1), // title case
      ];
      
      for (const input of inputVariations) {
        const result = LayerTypeFactory.fromString(input);
        assertEquals(result.ok, true, `Should handle ${layer} in format: "${input}"`);
        
        if (result.ok) {
          assertExists(result.data);
          assertEquals(result.data.getValue(), layer);
          
          // Verify the LayerType is fully functional
          const originalResult = result.data.originalResult;
          assertEquals(originalResult.layerType, layer);
          assertEquals(originalResult.type, "two");
        }
      }
    }
  });

  await t.step("Error handling integration for invalid inputs", () => {
    const errorScenarios = [
      { input: null, expectedKind: "NullInput" },
      { input: undefined, expectedKind: "NullInput" },
      { input: "", expectedKind: "EmptyInput" },
      { input: "   ", expectedKind: "EmptyInput" },
      { input: 123, expectedKind: "InvalidInput" },
      { input: {}, expectedKind: "InvalidInput" },
      { input: [], expectedKind: "InvalidInput" },
      { input: "invalid_layer", expectedKind: "UnknownLayer" },
    ];
    
    for (const scenario of errorScenarios) {
      const result = LayerTypeFactory.fromString(scenario.input);
      assertEquals(result.ok, false, `Should fail for: ${scenario.input}`);
      
      if (!result.ok) {
        assertEquals(result.error.kind, scenario.expectedKind);
        
        // Verify error contains helpful information
        switch (result.error.kind) {
          case "UnknownLayer":
            if (result.error.kind === "UnknownLayer") {
              assertExists(result.error.suggestions);
              assertEquals(result.error.suggestions.length > 0, true);
            }
            break;
          case "InvalidInput":
            if (result.error.kind === "InvalidInput") {
              assertExists(result.error.actualType);
            }
            break;
        }
      }
    }
  });
});

Deno.test("Integration: Pattern validation workflow", async (t) => {
  await t.step("Pattern creation and validation integration", () => {
    // Create various patterns for testing
    const patterns = [
      { pattern: "^(project|task)$", valid: ["project", "task"], invalid: ["issue", "bugs"] },
      { pattern: "^issue$", valid: ["issue"], invalid: ["project", "task", "bugs"] },
      { pattern: "^(task|bugs|temp)$", valid: ["task", "bugs", "temp"], invalid: ["project", "issue"] },
    ];
    
    for (const testCase of patterns) {
      const pattern = TwoParamsLayerTypePattern.create(testCase.pattern);
      assertExists(pattern, `Pattern should be created: ${testCase.pattern}`);
      
      // Test valid inputs
      for (const validInput of testCase.valid) {
        const result = LayerTypeFactory.fromString(validInput, pattern);
        assertEquals(result.ok, true, `Should accept ${validInput} with pattern ${testCase.pattern}`);
      }
      
      // Test invalid inputs (should be rejected by pattern)
      for (const invalidInput of testCase.invalid) {
        const result = LayerTypeFactory.fromString(invalidInput, pattern);
        assertEquals(result.ok, false, `Should reject ${invalidInput} with pattern ${testCase.pattern}`);
        
        if (!result.ok) {
          assertEquals(result.error.kind, "ValidationFailed");
        }
      }
    }
  });

  await t.step("Invalid pattern handling", () => {
    const invalidPatterns = ["[invalid", "**", "(unclosed"];
    
    for (const patternStr of invalidPatterns) {
      const pattern = TwoParamsLayerTypePattern.create(patternStr);
      assertEquals(pattern, null, `Invalid pattern should return null: ${patternStr}`);
    }
  });
});

Deno.test("Integration: TwoParamsResult integration workflow", async (t) => {
  await t.step("Complete TwoParamsResult to LayerType conversion", () => {
    const knownLayers = LayerTypeFactory.getKnownLayers();
    
    for (const layer of knownLayers) {
      const twoParamsResult: TwoParamsResult = {
        type: "two",
        demonstrativeType: "to",
        layerType: layer,
        params: ["to", layer],
        options: {
          verbose: true,
          filters: ["test1", "test2"],
          metadata: { author: "integration-test" }
        }
      };
      
      const result = LayerTypeFactory.fromTwoParamsResult(twoParamsResult);
      assertEquals(result.ok, true, `Should create LayerType from TwoParamsResult for ${layer}`);
      
      if (result.ok) {
        // Verify complete integration
        assertEquals(result.data.getValue(), layer);
        
        const originalResult = result.data.originalResult;
        assertEquals(originalResult.type, "two");
        assertEquals(originalResult.demonstrativeType, "to");
        assertEquals(originalResult.layerType, layer);
        assertEquals(originalResult.params.length, 2);
        assertEquals(originalResult.params[0], "to");
        assertEquals(originalResult.params[1], layer);
        
        // Verify options are preserved
        assertExists(originalResult.options);
        assertEquals(originalResult.options.verbose, true);
      }
    }
  });

  await t.step("TwoParamsResult conversion behavior", () => {
    // LayerType.create() accepts any TwoParamsResult because it assumes 
    // validation was already done by BreakdownParams. The factory wraps
    // this in a try-catch for safety, but normally it would succeed.
    const invalidResult: TwoParamsResult = {
      type: "two",
      demonstrativeType: "to",
      layerType: "invalid_layer_name",
      params: ["to", "invalid_layer_name"],
      options: {}
    };
    
    const result = LayerTypeFactory.fromTwoParamsResult(invalidResult);
    // This actually succeeds because LayerType.create() doesn't validate
    assertEquals(result.ok, true, "LayerType.create accepts any TwoParamsResult");
    
    if (result.ok) {
      assertEquals(result.data.getValue(), "invalid_layer_name");
    }
  });
});

Deno.test("Integration: Utility methods integration", async (t) => {
  await t.step("isValidLayer integration with main workflow", () => {
    const knownLayers = LayerTypeFactory.getKnownLayers();
    
    // All known layers should be valid
    for (const layer of knownLayers) {
      assertEquals(LayerTypeFactory.isValidLayer(layer), true);
      assertEquals(LayerTypeFactory.isValidLayer(layer.toUpperCase()), true);
      assertEquals(LayerTypeFactory.isValidLayer(` ${layer} `), true);
    }
    
    // Unknown layers should be invalid
    const unknownLayers = ["unknown", "invalid", "random", "xyz"];
    for (const layer of unknownLayers) {
      assertEquals(LayerTypeFactory.isValidLayer(layer), false);
    }
  });

  await t.step("getKnownLayers consistency", () => {
    const knownLayers = LayerTypeFactory.getKnownLayers();
    
    // Should return expected layers
    assertEquals(knownLayers.includes("project"), true);
    assertEquals(knownLayers.includes("issue"), true);
    assertEquals(knownLayers.includes("task"), true);
    assertEquals(knownLayers.includes("bugs"), true);
    assertEquals(knownLayers.includes("temp"), true);
    
    // Should be readonly (defensive copy)
    const originalLength = knownLayers.length;
    // Note: knownLayers is readonly, so we can't modify it
    const freshCopy = LayerTypeFactory.getKnownLayers();
    assertEquals(freshCopy.length, originalLength);
  });
});

Deno.test("Integration: Suggestion system validation", async (t) => {
  await t.step("Suggestion accuracy for partial matches", () => {
    const testCases = [
      { input: "pro", expectedSuggestions: ["project"] },
      { input: "tas", expectedSuggestions: ["task"] },
      { input: "is", expectedSuggestions: ["issue"] },
      { input: "bug", expectedSuggestions: ["bugs"] },
      { input: "tem", expectedSuggestions: ["temp"] },
    ];
    
    for (const testCase of testCases) {
      const result = LayerTypeFactory.fromString(testCase.input);
      assertEquals(result.ok, false, `Should fail for partial match: ${testCase.input}`);
      
      if (!result.ok && result.error.kind === "UnknownLayer") {
        const suggestions = result.error.suggestions;
        for (const expected of testCase.expectedSuggestions) {
          assertEquals(suggestions.includes(expected), true, 
            `Should suggest ${expected} for input ${testCase.input}`);
        }
      }
    }
  });

  await t.step("Fallback suggestions for completely unknown inputs", () => {
    const unknownInputs = ["xyz", "completely_unknown", "random123"];
    
    for (const input of unknownInputs) {
      const result = LayerTypeFactory.fromString(input);
      assertEquals(result.ok, false);
      
      if (!result.ok && result.error.kind === "UnknownLayer") {
        const suggestions = result.error.suggestions;
        // Should suggest all known layers as fallback
        assertEquals(suggestions.length >= 5, true);
        assertEquals(suggestions.includes("project"), true);
        assertEquals(suggestions.includes("issue"), true);
        assertEquals(suggestions.includes("task"), true);
        assertEquals(suggestions.includes("bugs"), true);
        assertEquals(suggestions.includes("temp"), true);
      }
    }
  });
});

Deno.test("Integration: Performance and reliability testing", async (t) => {
  await t.step("Bulk processing performance", () => {
    const iterations = 1000;
    const knownLayers = LayerTypeFactory.getKnownLayers();
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      for (const layer of knownLayers) {
        const result = LayerTypeFactory.fromString(layer);
        assertEquals(result.ok, true);
      }
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Performance should be reasonable (less than 1000ms for 5000 operations)
    assertEquals(duration < 1000, true, `Performance test: ${duration}ms for ${iterations * knownLayers.length} operations`);
  });

  await t.step("Memory consistency under repeated operations", () => {
    const testInput = "project";
    const results: LayerTypeResult<LayerType>[] = [];
    
    // Create many instances
    for (let i = 0; i < 100; i++) {
      const result = LayerTypeFactory.fromString(testInput);
      assertEquals(result.ok, true);
      if (result.ok) {
        results.push(result);
      }
    }
    
    // All results should be consistent
    for (const result of results) {
      if (result.ok) {
        assertEquals(result.data.getValue(), "project");
      }
    }
  });
});

Deno.test("Integration: Edge case handling robustness", async (t) => {
  await t.step("Unicode and special character handling", () => {
    const specialInputs = [
      "プロジェクト", // Japanese
      "проект",      // Russian
      "projet",      // French
      "proyecto",    // Spanish
      "progetto",    // Italian
      "projekt",     // German/Polish
      "项目",        // Chinese
    ];
    
    for (const input of specialInputs) {
      const result = LayerTypeFactory.fromString(input);
      assertEquals(result.ok, false, `Should handle unicode input: ${input}`);
      
      if (!result.ok) {
        assertEquals(result.error.kind, "UnknownLayer");
        if (result.error.kind === "UnknownLayer") {
          assertExists(result.error.suggestions);
        }
      }
    }
  });

  await t.step("Extremely long input handling", () => {
    const longInput = "a".repeat(10000);
    const result = LayerTypeFactory.fromString(longInput);
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "UnknownLayer");
    }
  });

  await t.step("Boundary value testing", () => {
    const boundaryInputs = [
      "",           // Empty
      " ",          // Single space
      "\t",         // Tab
      "\n",         // Newline
      "\r\n",       // Windows newline
      "a",          // Single character
      "ab",         // Two characters
    ];
    
    for (const input of boundaryInputs) {
      const result = LayerTypeFactory.fromString(input);
      
      if (input.trim() === "") {
        assertEquals(result.ok, false);
        if (!result.ok) {
          assertEquals(result.error.kind, "EmptyInput");
        }
      } else {
        // Non-empty but unknown inputs
        assertEquals(result.ok, false);
        if (!result.ok) {
          assertEquals(result.error.kind, "UnknownLayer");
        }
      }
    }
  });
});

Deno.test("Integration: System coherence validation", async (t) => {
  await t.step("Cross-method consistency verification", () => {
    const knownLayers = LayerTypeFactory.getKnownLayers();
    
    for (const layer of knownLayers) {
      // Verify isValidLayer agrees with fromString
      assertEquals(LayerTypeFactory.isValidLayer(layer), true);
      
      const stringResult = LayerTypeFactory.fromString(layer);
      assertEquals(stringResult.ok, true);
      
      if (stringResult.ok) {
        // Verify fromTwoParamsResult produces same result
        const originalResult = stringResult.data.originalResult;
        const twoParamsResult = LayerTypeFactory.fromTwoParamsResult(originalResult);
        
        assertEquals(twoParamsResult.ok, true);
        if (twoParamsResult.ok) {
          assertEquals(twoParamsResult.data.getValue(), stringResult.data.getValue());
        }
      }
    }
  });

  await t.step("Final system state validation", () => {
    // Verify the system maintains consistent state
    const knownLayersBefore = LayerTypeFactory.getKnownLayers();
    
    // Perform various operations
    LayerTypeFactory.fromString("project");
    LayerTypeFactory.fromString("invalid");
    LayerTypeFactory.isValidLayer("task");
    
    const knownLayersAfter = LayerTypeFactory.getKnownLayers();
    
    // State should remain unchanged
    assertEquals(knownLayersBefore.length, knownLayersAfter.length);
    for (let i = 0; i < knownLayersBefore.length; i++) {
      assertEquals(knownLayersBefore[i], knownLayersAfter[i]);
    }
  });
});